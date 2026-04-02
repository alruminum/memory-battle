# 04. 입력 타이머 복구 (SPEC_GAP 처리)

## 결정 근거

### SPEC_GAP 요약

Epic 09 Story 1 구현 시 "게임오버 타이머 바 제거"를 "타이머 로직 전체 제거"로 오해하여
아래 항목이 삭제되었다.

| 삭제된 항목 | 위치 | 원래 역할 |
|---|---|---|
| `getInputTimeout(stage)` | `src/lib/gameLogic.ts` | 스테이지별 입력 제한 시간 반환 |
| `handleExpire` 콜백 | `src/hooks/useGameEngine.ts` | 타이머 만료 시 `gameOver()` 호출 |
| `useTimer` 연결 | `src/hooks/useGameEngine.ts` | INPUT 상태 진입 시 타이머 시작, 만료 시 게임오버 |
| `timer.reset()` 호출 | SHOWING→INPUT 전환 시점 | 입력 타이머 시작 |

### PRD v0.3.1 원래 의도

> "게임오버 타이머 바 제거" = 시각적 게이지 UI(`TimerBar` 컴포넌트)만 숨김/제거
> 타이머 로직(버튼 미입력 시 게임오버) 자체는 유지

`useTimer.ts`는 현재 코드에 온전히 존재하며 수정 필요 없다.
타이머 바 UI는 이미 Epic 09 Story 2에서 `ComboTimer`로 교체되어 게이지는 표시되지 않는다.
따라서 이번 작업은 `gameLogic.ts`와 `useGameEngine.ts`에만 변경이 집중된다.

### `getInputTimeout` 필요 이유

현재 INPUT 상태에서 유저가 아무 버튼도 누르지 않으면 게임이 무한정 진행된다.
PRD v0.3 §3 "스테이지 기반 타이머"에 따라 INPUT 페이즈에 반드시 제한 시간을 두어야 한다.

### `useTimer` + `handleExpire` 복구 설계

Epic 05 impl `19-timer-race-fix.md`에서 확정된 설계:
- `useTimer`는 외부에서 `reset/stop`만 호출받는 순수 카운트다운 타이머
- `useGameEngine`이 SHOWING→INPUT 전환 시 `timer.reset()` 명시 호출
- wrong 입력 시 `timer.stop()` 명시 호출
- round-clear 시 `timer.stop()` 명시 호출

이 설계를 그대로 복구한다.

---

## 생성/수정 파일

- `src/lib/gameLogic.ts` (수정) — `getInputTimeout` 함수 추가
- `src/hooks/useGameEngine.ts` (수정) — `useTimer` 재연결, `handleExpire` 추가, `timer.reset/stop` 호출 복구

---

## 인터페이스 정의

### `src/lib/gameLogic.ts` — 추가할 함수

```typescript
/**
 * 스테이지에 따른 버튼 입력 제한 시간 (ms)
 * Stage 1~9: 2000ms / 10~19: 1800ms / 20~29: 1600ms / 30+: 1400ms
 *
 * 참고: 시퀀스 전체 제한이 아닌 버튼 1개 입력 간격 제한이다.
 * (시퀀스 길이와 무관하게 매 버튼마다 독립 적용)
 */
export const getInputTimeout = (stage: number): number => {
  if (stage >= 30) return 1400
  if (stage >= 20) return 1600
  if (stage >= 10) return 1800
  return 2000
}
```

### `src/hooks/useGameEngine.ts` — 변경 영향 범위

```typescript
// 추가할 import
import { getFlashDuration, getInputTimeout } from '../lib/gameLogic'
import { useTimer } from './useTimer'

// 추가할 내부 콜백
const handleExpire = useCallback(() => {
  playGameOver()
  gameOver()
}, [gameOver])

// 추가할 timer 인스턴스 (stage 기반 동적 duration)
const inputTimeout = getInputTimeout(stage)
const timer = useTimer(handleExpire, inputTimeout)
```

---

## 핵심 로직

### 1. `gameLogic.ts` — `getInputTimeout` 추가

기존 파일 끝에 함수를 추가한다. 다른 함수는 건드리지 않는다.

```typescript
export const getInputTimeout = (stage: number): number => {
  if (stage >= 30) return 1400
  if (stage >= 20) return 1600
  if (stage >= 10) return 1800
  return 2000
}
```

### 2. `useGameEngine.ts` — 변경 지점 4곳

#### 지점 A: import 추가

```typescript
// 기존
import { getFlashDuration } from '../lib/gameLogic'

// 변경
import { getFlashDuration, getInputTimeout } from '../lib/gameLogic'
import { useTimer } from './useTimer'
```

#### 지점 B: handleExpire + timer 인스턴스 추가

`useGameEngine` 함수 본문 상단, `useGameStore` destructuring 직후에 삽입.

```typescript
const { status, sequence, stage, setSequence, addInput, gameOver, resetGame } =
  useGameStore()

// 타이머 만료 시 게임오버
const handleExpire = useCallback(() => {
  playGameOver()
  gameOver()
}, [gameOver])

// stage 기반 동적 타임아웃
const inputTimeout = getInputTimeout(stage)
const timer = useTimer(handleExpire, inputTimeout)
```

`stage`는 현재 `useGameStore()`에서 destructure되지 않는다.
아래와 같이 `stage`를 추가해야 한다.

```typescript
// 기존
const { status, sequence, setSequence, addInput, gameOver, resetGame } =
  useGameStore()

// 변경
const { status, sequence, stage, setSequence, addInput, gameOver, resetGame } =
  useGameStore()
```

#### 지점 C: SHOWING→INPUT 전환 시 `timer.reset()` 호출

SHOWING useEffect 내부, `useGameStore.setState({ status: 'INPUT', ... })` 직후에 추가.

```typescript
useGameStore.setState({
  status: 'INPUT',
  currentIndex: 0,
  sequenceStartTime: Date.now(),
})
timer.reset()   // <-- 추가: INPUT 진입 시 입력 타이머 시작
showingRef.current = false
return
```

**주의**: `timer`를 SHOWING useEffect 의존성 배열에 추가해야 한다.
현재 배열: `[status, sequence]`
변경 후: `[status, sequence, timer]`

`timer.reset`은 `useCallback([duration, stop])`으로 메모화되어 있으며,
`duration`(`inputTimeout`)은 `stage` 변경 시에만 갱신된다.
SHOWING 도중 stage가 바뀌는 일은 없으므로 불필요한 재실행 없음.

#### 지점 D: wrong 입력 / round-clear 시 `timer.stop()` 호출

```typescript
// wrong 분기
if (result === 'wrong') {
  timer.stop()    // <-- 추가
  playGameOver()
  gameOver()
  return
}

// round-clear 분기
if (result === 'round-clear') {
  const clearedStage = sequence.length
  clearingRef.current = true
  timer.stop()    // <-- 추가
  setClearingStage(clearedStage)
  // ... 이하 기존 코드 동일
}
```

#### 지점 E: `launchAfterCountdown` 시작 시 이전 타이머 정리

```typescript
const launchAfterCountdown = useCallback(() => {
  if (startingRef.current) return
  startingRef.current = true
  timer.stop()    // <-- 추가: 이전 게임 잔여 타이머 정리
  setCountdown(3)
  // ... 이하 기존 코드 동일
}, [setSequence, timer])
```

`timer`를 `launchAfterCountdown` deps에 추가해야 한다.

---

## 주의사항

- **타이머 바 UI 건드리지 않음**: `GamePage.tsx`, `ComboTimer.tsx`는 수정 대상이 아니다.
  `timer.timeLeft`는 어떤 컴포넌트에도 전달하지 않는다. `useGameEngine` 반환값에 포함하지 않는다.
- **`useTimer.ts` 수정 없음**: 현재 파일은 `stop/reset/timeLeft`를 그대로 노출하며 외부에서만 제어받는다. Epic 19에서 확정된 설계와 동일하다. 추가 수정 불필요.
- **`stage = 0` 시 `getInputTimeout(0)` = 2000ms**: IDLE 상태에서 timer 인스턴스 생성 시 기본값 2000ms가 사용된다. `timer.reset()`을 호출하지 않는 한 타이머가 동작하지 않으므로 문제 없다.
- **`useTimer`의 `duration` 변경 시 `reset` 콜백 재생성**: `stage`가 바뀔 때마다 `inputTimeout`이 바뀌고 `timer.reset`이 새 함수로 교체된다. SHOWING useEffect deps에 `timer`가 포함되어 있으므로 최신 `reset`이 항상 호출된다.
- **DB 영향도**: 없음. 런타임 상태 변경만이며 DB에 저장되는 필드 변화 없음.
- **Breaking Change**: 없음. `useGameEngine` 반환값 변경 없음(timer 관련 값 노출 안 함). `gameLogic.ts`에 함수 추가만 하므로 기존 import 깨짐 없음.

---

## 테스트 경계

- 단위 테스트 가능: `getInputTimeout(stage)` — 구간별 반환값 검증 (순수 함수)
- 통합 테스트 필요: `useGameEngine` — INPUT 상태 진입 후 `inputTimeout` ms 경과 시 `gameOver` 호출 여부
- 수동 검증:
  - INPUT 상태에서 아무 버튼도 누르지 않고 `getInputTimeout(stage)` ms 대기 → 자동 게임오버 확인
  - stage 1(2000ms), stage 10(1800ms), stage 20(1600ms), stage 30(1400ms) 각 구간 확인
  - round-clear 시 타이머 즉시 정지 (이후 새 INPUT 페이즈에서 타이머 재시작) 확인
