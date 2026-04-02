# 02. 타임워치 UI (ComboTimer)

## 결정 근거

- **컴포넌트 신규 생성**: `ComboTimer`는 `computerShowTime` 기준의 경과 타이머를 시각화한다. 기존 타이머 게이지(프로그레스 바)를 교체하는 역할이므로, `GamePage`에서 타이머 게이지 JSX 블록을 제거하고 같은 위치에 `ComboTimer`를 삽입한다.
- **타이머 구현 방식**: `setInterval` 기반 내부 ticker로 `elapsedMs`를 추적한다. `requestAnimationFrame` 대비 코드가 단순하고, 60fps 수준의 갱신이 필요하지 않아(100ms 간격으로도 충분) `setInterval`을 선택.
- **색상 전환 기준**: `elapsedMs >= computerShowTime`이 되는 순간 초록→빨강으로 전환. CSS transition으로 부드럽게 전환.
- **표시 형식**: `초.밀리초` 형태(예: `1.24`) 또는 `mm:ss.ms` 중 선택 — 경과 시간은 최대 `computerShowTime`이 넘어도 계속 증가하므로, 소수점 2자리(10ms 단위) 형태가 직관적. `(elapsedMs / 1000).toFixed(2)` 사용.
- **`inputStartTime` prop**: `GamePage`에서 `useGameStore`의 `sequenceStartTime`을 읽어 전달한다. `0`인 경우(미초기화)는 `isActive === false`와 함께 노출 안 함으로 처리한다.
- **`isActive` prop**: `status === 'INPUT'`일 때만 `true`. `GamePage`에서 파생.
- **기존 타이머 관련 코드 제거**: `GamePage.tsx`의 타이머 게이지 JSX 블록(`<div style={{ margin: '0 20px 8px', height: 4 ... }}>`), `timerProgress` 구조분해 제거. `useGameEngine`의 `timerProgress` 반환값도 이 시점에 제거된다 (Story 1에서 이미 처리).

---

## 생성/수정 파일

- `src/components/game/ComboTimer.tsx` (신규) — 타임워치 컴포넌트
- `src/pages/GamePage.tsx` (수정) — 기존 타이머 게이지 제거, `ComboTimer` 삽입, `timerProgress` 구조분해 제거
- `src/components/game/ComboIndicator.tsx` (수정) — `isComboActive` prop 제거 (optional 처리 또는 prop 자체 삭제)

---

## 인터페이스 정의

### `ComboTimer.tsx` Props

```typescript
interface ComboTimerProps {
  computerShowTime: number   // 컴퓨터 시연 총 시간 (ms). flashDuration × sequenceLength
  inputStartTime: number     // INPUT 페이즈 시작 시각 (timestamp). store.sequenceStartTime
  isActive: boolean          // INPUT 상태 여부. true일 때만 렌더링
}
```

### `GamePage.tsx` 변경 사항

```typescript
// 추가 import
import { ComboTimer } from '../components/game/ComboTimer'

// useGameEngine 구조분해에서 timerProgress 제거
const {
  flashingButton, clearingStage, countdown,
  handleInput, startGame, retryGame,
  isClearingFullCombo, multiplierIncreased   // isComboActive, timerProgress 제거
} = useGameEngine()

// useGameStore에서 sequenceStartTime 추가
const { status, score, stage, comboStreak, userId, setUserId, sequenceStartTime } = useGameStore()

// ComboTimer에 필요한 파생값
const flashDuration = getFlashDuration(stage)
const computerShowTime = flashDuration * (stage > 0 ? stage : 1)
// 주의: stage는 현재 진행 중인 스테이지 번호 = sequence.length
// INPUT 상태에서 sequence.length === stage이므로 stage를 직접 사용 가능
```

---

## 핵심 로직

### `ComboTimer.tsx`

```typescript
import { useState, useEffect, useRef } from 'react'

interface ComboTimerProps {
  computerShowTime: number
  inputStartTime: number
  isActive: boolean
}

export function ComboTimer({ computerShowTime, inputStartTime, isActive }: ComboTimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isActive || inputStartTime === 0) {
      // 비활성: 타이머 정지 + 초기화
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setElapsedMs(0)
      return
    }

    // 활성: 100ms 간격으로 경과 시간 업데이트
    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - inputStartTime)
    }, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, inputStartTime])

  if (!isActive) return null

  const isOverTime = elapsedMs >= computerShowTime
  const displaySeconds = (elapsedMs / 1000).toFixed(2)
  const targetSeconds = (computerShowTime / 1000).toFixed(2)

  // 색상: 기준 시간 이내 = 초록 계열, 초과 = 빨강 계열
  const color = isOverTime ? '#F87171' : '#34D399'
  const glowColor = isOverTime ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '6px 0',
    }}>
      {/* 경과 시간 */}
      <span style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 20,
        fontWeight: 900,
        color,
        textShadow: `0 0 12px ${glowColor}`,
        transition: 'color 200ms ease, text-shadow 200ms ease',
        letterSpacing: 1,
        minWidth: 52,
        textAlign: 'right',
      }}>
        {displaySeconds}
      </span>

      {/* 구분 텍스트 */}
      <span style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--vb-text-dim)',
        letterSpacing: 1,
      }}>
        /
      </span>

      {/* 목표 시간 */}
      <span style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--vb-text-dim)',
        letterSpacing: 1,
        minWidth: 40,
      }}>
        {targetSeconds}
      </span>

      {/* 단위 */}
      <span style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 9,
        fontWeight: 600,
        color: 'var(--vb-text-dim)',
        letterSpacing: 2,
      }}>
        SEC
      </span>
    </div>
  )
}
```

### `GamePage.tsx` — 타이머 게이지 제거 + ComboTimer 삽입

```typescript
// 1. import 추가
import { ComboTimer } from '../components/game/ComboTimer'
import { getFlashDuration } from '../lib/gameLogic'

// 2. useGameStore 구조분해에 sequenceStartTime 추가
const { status, score, stage, comboStreak, userId, setUserId, sequenceStartTime } = useGameStore()

// 3. useGameEngine 구조분해에서 timerProgress 제거 (isComboActive도 제거)
const {
  flashingButton, clearingStage, countdown,
  handleInput, startGame, retryGame,
  isClearingFullCombo, multiplierIncreased
} = useGameEngine()

// 4. ComboTimer 파생값 계산
const flashDuration = getFlashDuration(stage)
const computerShowTime = flashDuration * (stage > 0 ? stage : 1)  // stage = sequence.length (INPUT 시점 기준). stage=0 방어: 0이면 분모가 0이 되어 ComboTimer가 즉시 빨강 표시되는 버그 방지

// 5. JSX — 타이머 게이지 블록 완전 제거:
// 아래 블록 삭제
// <div style={{ margin: '0 20px 8px', height: 4, backgroundColor: 'var(--vb-surface)', ... }}>
//   <div style={{ width: isPlaying ? (timerProgress * 100).toFixed(1) + '%' : '0%', ... }} />
// </div>

// 6. JSX — ComboTimer 삽입 (배너 광고 바로 위)
<div style={{ flexShrink: 0, minHeight: 40 }}>
  <ComboTimer
    computerShowTime={computerShowTime}
    inputStartTime={sequenceStartTime}
    isActive={status === 'INPUT'}
  />
</div>

// 7. ButtonPad comboActive prop 제거 (isComboActive 제거와 함께)
// 기존: comboActive={isComboActive}
// 변경: prop 제거 (ButtonPad의 comboActive 기본값은 false)
```

---

## 주의사항

- **`computerShowTime = flashDuration * (stage > 0 ? stage : 1)`**: `stage`는 Zustand store의 `stage` 필드로, 현재 진행 중인 시퀀스 길이와 같다 (`stage === sequence.length`는 INPUT 상태에서 항상 성립). `stage === 0`이면 `computerShowTime === 0`이 되어 `ComboTimer`가 INPUT 진입 즉시 빨강으로 표시되는 버그가 발생하므로 `stage > 0 ? stage : 1`로 방어한다. `GamePage`에서 `getFlashDuration(stage)`를 직접 계산하므로 `useGameEngine`에서 별도 노출 불필요.
- **`inputStartTime === 0` 처리**: `sequenceStartTime`의 초기값은 `0`이다. `ComboTimer`는 `isActive === false`이면 `null` 반환하므로, `inputStartTime === 0` 엣지 케이스는 `isActive` 조건으로 자연스럽게 차단된다.
- **인터벌 클린업**: 컴포넌트 언마운트 또는 `isActive` 전환 시 반드시 `clearInterval`한다. 언마운트 시 인터벌이 남아 있으면 `setState` 호출로 경고가 발생한다.
- **레이아웃 shift 방지**: `isActive === false`일 때 `null`을 반환하므로, 래핑 div에 `minHeight: 40` 고정 권장. 현재 타이머 게이지 영역과 동일한 위치에 넣으므로 레이아웃 영향 최소화.
- **DB 영향도**: 없음.
- **Breaking Change**: `useGameEngine` 반환값에서 `timerProgress` 제거. `GamePage.tsx`만 영향받으며 이 파일에서 동시에 제거.
- **`ComboIndicator`의 `isComboActive` prop**: `GamePage`가 `isComboActive`를 전달하지 않게 되므로, `ComboIndicator`의 prop 인터페이스도 `isComboActive` 제거 필요. `ComboIndicator.tsx`는 수정 대상에 포함.

---

## 테스트 경계

- 단위 테스트 가능: 없음 (UI 컴포넌트, 타이머 의존)
- 통합 테스트 필요: 없음
- 수동 검증:
  - INPUT 상태 진입 시 `ComboTimer` 표시, SHOWING/IDLE/RESULT 상태에서 미표시
  - `computerShowTime` 이내 입력 시 초록 유지, 초과 시 빨강 전환
  - 스테이지 클리어 후 타이머 초기화 (다음 INPUT 진입 시 0.00부터 재시작)
