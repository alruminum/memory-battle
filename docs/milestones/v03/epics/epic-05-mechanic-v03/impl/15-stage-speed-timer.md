# 15. 스테이지 기반 속도/타이머

## 결정 근거

- PRD v0.3: 난이도 선택 대신 스테이지 진행으로 자연스러운 난이도 커브 제공.
- `useTimer`는 이미 `duration` 파라미터를 지원한다(`useTimer.ts:4` — `duration = 2000`). 인터페이스 변경 없이 호출 측에서 동적 값을 주입하면 된다.
- 깜빡임 속도 함수 `getFlashDuration`은 `useGameEngine.ts` 내부에서만 사용되므로 동일 파일에 배치한다.
- 타이머 함수 `getInputTimeout`은 `useGameEngine.ts`에서 `useTimer` 호출 시 계산하여 전달한다.

---

## 생성/수정 파일

- `src/hooks/useGameEngine.ts` (수정) — `FLASH_DURATION` 상수 → `getFlashDuration(stage)` 함수로 교체, `useTimer` duration 동적 주입
- `src/lib/gameLogic.ts` (신규) — `getFlashDuration`, `getInputTimeout` 순수 함수 (테스트 가능하도록 분리)

---

## 인터페이스 정의

### `src/lib/gameLogic.ts`

```typescript
/**
 * 스테이지에 따른 버튼 점등 시간 (ms)
 * Stage 1~9: 500ms / 10~19: 400ms / 20~29: 300ms / 30+: 250ms
 */
export const getFlashDuration = (stage: number): number => {
  if (stage >= 30) return 250
  if (stage >= 20) return 300
  if (stage >= 10) return 400
  return 500
}

/**
 * 스테이지에 따른 버튼 입력 제한 시간 (ms)
 * Stage 1~9: 2000ms / 10~19: 1800ms / 20~29: 1600ms / 30+: 1400ms
 */
export const getInputTimeout = (stage: number): number => {
  if (stage >= 30) return 1400
  if (stage >= 20) return 1600
  if (stage >= 10) return 1800
  return 2000
}
```

---

## 핵심 로직

### `useGameEngine.ts` — SHOWING 단계 flash 적용

```typescript
import { getFlashDuration, getInputTimeout } from '../lib/gameLogic'

// 기존
const FLASH_DURATION: Record<Difficulty, number> = { EASY: 500, MEDIUM: 400, HARD: 300 }
// ...
const flash = FLASH_DURATION[difficulty]

// 변경 후 (SHOWING useEffect 내부)
const currentStage = useGameStore.getState().stage
const flash = getFlashDuration(currentStage)
```

**주의**: SHOWING useEffect 내에서 `sequence.length`로 현재 스테이지를 알 수 있다. `stage` store 필드와 `sequence.length`는 SHOWING 진입 시점에 동일한 값을 가진다 (`useGameStore.setState({ stage: newSeq.length })`로 세팅). 따라서 `sequence.length` 또는 `stage` store 값 모두 사용 가능하다. `stage` store 값을 읽는 것이 명시적이다.

### `useGameEngine.ts` — useTimer duration 동적 주입

```typescript
// 현재 stage 기반 timeout 계산
// stage는 INPUT 상태 진입 시점에 이미 확정되어 있음
const { status, sequence, stage } = useGameStore()

const inputTimeout = getInputTimeout(stage)
const timer = useTimer(handleExpire, inputTimeout)
```

**주의**: `useTimer`의 `duration` 변경 시 `reset` 콜백이 재생성된다 (현재 구현: `useCallback([duration, stop])`). 따라서 `useEffect` 의존성 배열에 `timer` 가 있는 곳에서는 `timer.reset` 참조가 갱신되어 올바르게 동작한다. 레이스 컨디션 없음.

### `useTimer.ts` — 변경 불필요

```typescript
// 현재 인터페이스 그대로 유지
export function useTimer(onExpire: () => void, duration = 2000): UseTimerReturn
```

`duration` 파라미터는 이미 존재한다. 호출 측만 변경.

---

## 주의사항

- `stage = 0`인 게임 시작 직전(IDLE) 상태에서 `getInputTimeout(0)`은 2000ms를 반환한다. 문제 없음.
- `stage`가 스토어에서 갱신되는 시점: `launchAfterCountdown` 내부에서 `stage: 1`로 세팅, 이후 라운드 클리어 시 `stage: newSeq.length`로 갱신. SHOWING 진입 시 항상 최신 stage가 반영되어 있다.
- **SHOWING useEffect 의존성 배열 주의**: 현재 의존성 배열은 `[status, sequence, difficulty, timer]`이다. `difficulty`를 `stage`로 교체하면 의존성 배열이 `[status, sequence, stage, timer]`가 된다. `stage`는 `sequence.length`와 동일 시점에 갱신되므로 두 값이 함께 변경될 때 useEffect가 두 번 실행되지 않도록 `showingRef.current` 가드가 이미 있어 중복 실행은 차단된다. 그러나 `stage`를 의존성에 추가하면 SHOWING 도중 store의 `stage`가 외부에서 변경될 경우(정상 시나리오 아님) 의도치 않은 재실행이 이론적으로 가능하다. 이를 방지하기 위해 **`stage`는 의존성 배열에 추가하지 말고**, SHOWING useEffect 내부에서 `useGameStore.getState().stage`로 직접 읽는다.

```typescript
// SHOWING useEffect 내부 — 의존성 배열 변경 없이 stage 읽기
useEffect(() => {
  if (status !== 'SHOWING') { ... }
  // stage를 의존성 배열 대신 getState()로 읽어 의도치 않은 재실행 방지
  const flash = getFlashDuration(useGameStore.getState().stage)
  // ...
}, [status, sequence, timer])  // ← difficulty 제거, stage는 추가하지 않음
```
- `gameLogic.ts`는 순수 함수만 포함 — React/Zustand import 없음. 향후 점수 계산 함수(Story 16)도 이 파일에 추가한다.
- 기존 `FLASH_DURATION` 상수 및 `Difficulty` import는 이 스토리에서 `useGameEngine.ts`로부터 완전히 제거된다 (Story 14 완료 이후).
