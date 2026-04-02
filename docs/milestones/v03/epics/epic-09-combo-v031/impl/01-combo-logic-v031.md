# 01. 콤보 판정 로직 및 배율 시스템 교체 (v0.3.1)

## 결정 근거

- **판정 기준 변경**: 기존 `useCombo`의 300ms 버튼 간격 감지는 시퀀스 내 연속 입력 속도를 측정한다. v0.3.1 설계는 "유저가 컴퓨터보다 빠른가"를 측정하므로, 스테이지 전체 입력 시간을 `computerShowTime`(`flashDuration × sequenceLength`)과 비교하는 방식이 의미적으로 정확하다.
- **`sequenceStartTime` 저장 위치**: `useGameEngine`이 `status: INPUT`으로 전환하는 시점에 타임스탬프를 캡처해 store에 기록한다. store에 두는 이유는 `stageClear` 내부에서 풀콤보 판정에 직접 사용해야 하며, 외부 훅에 의존하면 호출 타이밍 복잡도가 증가한다.
- **`useCombo` 훅 대체**: 기존 `useCombo`는 `isActive`(300ms 기반) + `checkFullCombo`(버튼 카운트 비교)를 제공했다. v0.3.1에서는 풀콤보 판정 로직이 store `stageClear`로 이동하므로 `useCombo` 역할이 사라진다. 훅 파일은 남겨두되 `isActive` 반환만 유지하고 내부를 단순화한다. `useGameEngine`은 더 이상 `combo.checkFullCombo`를 호출하지 않는다.
- **`getInputTimeout` 삭제**: 버튼 입력 제한 타이머(게임오버 타이머)를 제거한다. `useTimer`/`timer` 관련 코드도 `useGameEngine`에서 제거된다.
- **`COMBO_ACTIVATION_STAGE` 삭제**: v0.3.1에서는 스테이지 제한 없이 1스테이지부터 풀콤보 판정을 한다. 배율은 `Math.floor(comboStreak/5)+1`로 5연속마다 상승.
- **`calcStageScore` 단순화**: 기존 4인자(`buttonScore, comboStreak, stage, isFullCombo`)에서 `stage`, `isFullCombo` 인자를 제거한다. v0.3.1 풀콤보 배율은 항상 적용(`COMBO_ACTIVATION_STAGE` 조건 없음)하며, isFullCombo 판정은 `stageClear`에서 수행하므로 외부에서 전달할 필요가 없다. 대신 `stageClear`가 배율 계산과 적용을 모두 담당한다.
- **`multiplierIncreased` 플래그**: `stageClear`가 이전 배율과 새 배율을 비교해 반환한다. `useGameEngine`이 이 플래그를 받아 `MultiplierBurst` 트리거용 state를 설정한다.

---

## 생성/수정 파일

- `src/lib/gameLogic.ts` (수정) — `getInputTimeout` 삭제, `COMBO_ACTIVATION_STAGE` 삭제, `getComboMultiplier` 공식 교체, `calcStageScore` 시그니처 단순화
- `src/hooks/useCombo.ts` (수정) — 300ms 간격 감지 제거, `isActive` state 제거, `checkFullCombo` 제거, 단순 reset 훅으로 축소 (또는 파일 완전 대체)
- `src/store/gameStore.ts` (수정) — `sequenceStartTime` 필드 추가, `stageClear` 시그니처 변경 (`isFullCombo` 파라미터 제거 → 내부 판정), 반환값 `{ isFullCombo, multiplierIncreased }` 추가, `addInput` 내 `Math.min(state.comboStreak + 1, 4)` → `state.comboStreak + 1` 교체
- `src/hooks/useGameEngine.ts` (수정) — `useTimer`/timer 관련 코드 제거, `getInputTimeout` import 제거, `stageClear` 호출 업데이트, `sequenceStartTime` 저장 시점 추가, `multiplierIncreased` state 관리 추가
- `src/components/game/ComboIndicator.tsx` (수정) — `isComboActive` prop 제거 (optional 처리 또는 prop 자체 삭제)

---

## 인터페이스 정의

### `src/lib/gameLogic.ts` 변경 사항

```typescript
// 삭제
// export const getInputTimeout = (stage: number): number => { ... }
// export const COMBO_ACTIVATION_STAGE = 5

// 변경: 5연속마다 +1, 상한 없음
export const getComboMultiplier = (comboStreak: number): number =>
  Math.floor(comboStreak / 5) + 1

// 변경: 시그니처 단순화 (stage, isFullCombo 파라미터 제거)
// 호출자(stageClear)가 이미 isFullCombo를 알고 있으므로 stageClear에서 직접 분기
export const calcStageScore = (
  rawScore: number,     // 버튼 점수 + 클리어 보너스
  comboStreak: number   // 새로운 comboStreak (stageClear 후 업데이트된 값 사용 금지 — 풀콤보 이전 값)
): number => rawScore * getComboMultiplier(comboStreak)

// 유지 (변경 없음)
export const getFlashDuration = (stage: number): number => { ... }
export const calcClearBonus = (stage: number): number => { ... }
export const calcBaseStageScore = (stage: number): number => { ... }
```

### `src/store/gameStore.ts` GameStore 인터페이스 변경

```typescript
interface GameStore {
  status: 'IDLE' | 'SHOWING' | 'INPUT' | 'RESULT'
  sequence: ButtonColor[]
  currentIndex: number
  score: number
  baseScore: number
  stage: number
  comboStreak: number
  fullComboCount: number
  maxComboStreak: number
  sequenceStartTime: number    // 신규: INPUT 페이즈 시작 시각 (ms). 0 = 미설정
  userId: string
  hasTodayReward: boolean

  setUserId: (id: string) => void
  setTodayReward: (value: boolean) => void
  setSequence: (seq: ButtonColor[]) => void
  startGame: () => void
  addInput: (color: ButtonColor) => 'correct' | 'wrong' | 'round-clear'

  // 변경: isFullCombo 파라미터 제거 → 내부에서 sequenceStartTime 기반 판정
  // 신규 반환값: { isFullCombo, multiplierIncreased }
  stageClear: (inputCompleteTime: number, flashDuration: number) => {
    isFullCombo: boolean
    multiplierIncreased: boolean
  }

  gameOver: () => void
  resetGame: () => void
}
```

### `src/hooks/useGameEngine.ts` 반환값 변경

```typescript
// 제거
// timer 관련 state: timeLeft, timerProgress
// isComboActive (구버전 300ms 기반)

// 유지
flashingButton: ButtonColor | null
clearingStage: number | null
countdown: number | null
handleInput: (color: ButtonColor) => void
startGame: () => void
retryGame: () => void
isClearingFullCombo: boolean

// 신규
multiplierIncreased: boolean   // 배율 상승 여부 (MultiplierBurst 트리거용)
```

---

## 핵심 로직

### `gameStore.ts` — `stageClear` 재구현

```typescript
stageClear: (inputCompleteTime, flashDuration) => {
  let result = { isFullCombo: false, multiplierIncreased: false }

  set((state) => {
    const clearedStage = state.sequence.length
    const computerShowTime = flashDuration * clearedStage
    const userInputTime = inputCompleteTime - state.sequenceStartTime
    const isFullCombo = userInputTime < computerShowTime

    const prevComboStreak = state.comboStreak
    const newComboStreak = isFullCombo ? prevComboStreak + 1 : 0  // 상한 없음

    const prevMultiplier = getComboMultiplier(prevComboStreak)
    const newMultiplier = getComboMultiplier(newComboStreak)
    const multiplierIncreased = newMultiplier > prevMultiplier

    // 점수 계산
    // addInput이 clearedStage번 호출되었으므로 state.score에 이번 스테이지 rawScore가 포함됨
    const prevAccumulated = state.score - clearedStage
    const bonus = calcClearBonus(clearedStage)
    const rawScore = clearedStage + bonus
    const stageScore = isFullCombo
      ? rawScore * getComboMultiplier(prevComboStreak)  // 풀콤보: 이전(클리어 직전) streak 기준 배율
      : rawScore
    const baseStageScore = calcBaseStageScore(clearedStage)

    const newFullComboCount = isFullCombo ? state.fullComboCount + 1 : state.fullComboCount
    const newMaxComboStreak = Math.max(state.maxComboStreak, newComboStreak)

    result = { isFullCombo, multiplierIncreased }

    return {
      score: prevAccumulated + stageScore,
      baseScore: state.baseScore + baseStageScore,
      comboStreak: newComboStreak,
      fullComboCount: newFullComboCount,
      maxComboStreak: newMaxComboStreak,
    }
  })

  return result
},
```

**배율 적용 기준**: 풀콤보 달성 시 `prevComboStreak`(클리어 직전 streak) 기반 배율로 이번 스테이지를 정산한다. 이후 `newComboStreak = prevComboStreak + 1`로 증가한 streak은 다음 스테이지부터 적용된다. 이렇게 해야 5번째 풀콤보(streak: 4→5)에서 배율 상승(x1→x2)이 다음 스테이지부터 효과를 내는 직관적 흐름이 된다.

### `gameStore.ts` — `startGame` / `resetGame` 초기화

```typescript
// sequenceStartTime: 0 추가
startGame: () =>
  set({
    status: 'SHOWING',
    sequence: [],
    currentIndex: 0,
    score: 0,
    baseScore: 0,
    stage: 0,
    comboStreak: 0,
    fullComboCount: 0,
    maxComboStreak: 0,
    sequenceStartTime: 0,
  }),

resetGame: () =>
  set({
    status: 'IDLE',
    sequence: [],
    currentIndex: 0,
    score: 0,
    baseScore: 0,
    stage: 0,
    comboStreak: 0,
    fullComboCount: 0,
    maxComboStreak: 0,
    sequenceStartTime: 0,
  }),
```

### `useGameEngine.ts` — SHOWING→INPUT 전환 시 `sequenceStartTime` 저장

```typescript
// SHOWING 효과 내, 시퀀스 점등 완료 후 INPUT 전환 직전
// 기존 코드:
//   useGameStore.setState({ status: 'INPUT', currentIndex: 0 })
//   timer.reset()
// 변경:
useGameStore.setState({
  status: 'INPUT',
  currentIndex: 0,
  sequenceStartTime: Date.now(),   // INPUT 페이즈 시작 시각 저장
})
// timer.reset() 제거 (타이머 삭제)
```

### `useGameEngine.ts` — `round-clear` 처리 변경

```typescript
if (result === 'round-clear') {
  const clearedStage = sequence.length
  clearingRef.current = true
  // timer.stop() 제거
  setClearingStage(clearedStage)

  const now = Date.now()
  const flash = getFlashDuration(clearedStage)

  // stageClear에 inputCompleteTime과 flashDuration 전달
  const { isFullCombo, multiplierIncreased } =
    useGameStore.getState().stageClear(now, flash)

  setIsClearingFullCombo(isFullCombo)
  setMultiplierIncreased(multiplierIncreased)  // 신규 state

  const isMilestone = clearedStage % 5 === 0
  if (isMilestone || isFullCombo) playApplause()

  const newSeq = [...sequence, randomButton()]
  const pauseMs = isMilestone ? MILESTONE_PAUSE_MS : CLEAR_PAUSE_MS

  setTimeout(() => {
    clearingRef.current = false
    setClearingStage(null)
    setIsClearingFullCombo(false)
    setMultiplierIncreased(false)
    setSequence(newSeq)
    useGameStore.setState({ status: 'SHOWING', currentIndex: 0, stage: newSeq.length })
  }, pauseMs)
  return
}
```

### `useGameEngine.ts` — `handleExpire` 및 `useTimer` 제거

```typescript
// 삭제할 코드:
// const handleExpire = useCallback(() => { ... }, [gameOver])
// const inputTimeout = getInputTimeout(stage)
// const timer = useTimer(handleExpire, inputTimeout)

// import에서도 제거:
// import { useTimer } from './useTimer'
// import { getInputTimeout } from '../lib/gameLogic'
// (getFlashDuration은 유지)
```

### `useCombo.ts` — 단순화 (내용 완전 교체)

v0.3.1에서 `useCombo`의 300ms 기반 판정 및 `checkFullCombo`는 사용하지 않는다. 파일을 제거하면 향후 참조 오류 가능성이 있으므로 파일을 유지하되 내용을 교체한다.

```typescript
// useCombo.ts — v0.3.1: 역할 없음. 하위 호환을 위해 파일 유지
export function useCombo() {
  // 300ms 기반 콤보 판정 제거 (v0.3.1: sequenceStartTime 기반 판정으로 교체)
  // useGameEngine에서 더 이상 이 훅을 사용하지 않음
  return {}
}
```

`useGameEngine`에서 `useCombo` import 및 `combo.*` 호출 전부 제거.

---

## 주의사항

- **`stageClear` 호출 시점**: `result === 'round-clear'` 분기에서 `addInput`이 마지막 버튼까지 호출된 직후다. 이 시점의 `Date.now()`가 `inputCompleteTime`이다. `now`를 `stageClear` 호출 전에 캡처해야 한다 (내부 `set` 콜백 실행 타이밍과 무관하게 정확한 시각 확보).
- **배율 적용 기준 확인**: `stageClear` 내에서 `getComboMultiplier(prevComboStreak)`(클리어 전 streak)로 이번 스테이지를 정산하고, `newComboStreak = prevComboStreak + 1`로 업데이트한다. 만약 `newComboStreak` 기준으로 정산하면 5번째 풀콤보부터 즉시 x2가 적용되어 `multiplierIncreased`와 실제 점수 사이의 흐름이 어색해진다.
- **`useTimer` 의존 제거**: `useGameEngine`이 `useTimer`를 더 이상 import하지 않는다. `handleExpire` 콜백도 제거한다. `timerProgress` 반환값도 제거한다. `GamePage.tsx`는 현재 `timerProgress`를 사용하므로 타이머 게이지 JSX 블록과 함께 제거해야 한다 (Story 2에서 처리).
- **`isComboActive` 제거**: `useGameEngine` 반환값에서 `isComboActive`를 제거한다. `GamePage.tsx`에서 `ComboIndicator`에 전달하던 `isComboActive` prop도 제거한다. `ComboIndicator`의 `isComboActive` prop은 v0.3.1 스펙상 사용되지 않으므로 컴포넌트도 수정한다.
- **DB 영향도**: 없음. store 필드 추가(`sequenceStartTime`)는 런타임 상태이며 DB에 저장되지 않는다.
- **Breaking Change**: `stageClear(isFullCombo: boolean)` → `stageClear(inputCompleteTime: number, flashDuration: number)`. `useGameEngine.ts`가 유일한 호출자이므로 영향 범위는 1개 파일.
- **`calcStageScore` import 변경**: `gameStore.ts`의 `calcStageScore` import는 내부 로직으로 대체되므로 제거한다. 대신 `getComboMultiplier`, `calcClearBonus`, `calcBaseStageScore`를 직접 사용한다.
- **`comboStreak` cap 제거**: 현재 `gameStore.ts`의 `addInput` 내에 `Math.min(state.comboStreak + 1, 4)` 코드가 존재한다. v0.3.1에서는 comboStreak 상한이 없으므로 이 라인을 `state.comboStreak + 1`로 교체해야 한다. 그대로 두면 streak이 4에서 멈춰 `getComboMultiplier`의 5연속 배율 상승 로직이 영원히 발동하지 않는다.
- **`ComboIndicator.tsx` 수정 포함**: `GamePage`에서 `isComboActive` prop 전달을 제거하면 TypeScript 컴파일 에러가 발생한다. `ComboIndicator.tsx`의 `isComboActive` prop을 optional 처리하거나 prop 자체를 삭제해야 한다 (수정 대상 목록 참고).

---

## 테스트 경계

- 단위 테스트 가능: `getComboMultiplier`, `calcStageScore` (순수 함수), `onStageClear` 로직 (game-logic.md의 의사코드 기준)
- 통합 테스트 필요: `useGameStore.stageClear` — `sequenceStartTime` 세팅 후 `inputCompleteTime` 전달 시 `isFullCombo`/`multiplierIncreased` 정합성
- 수동 검증: 실제 게임 플레이 중 `flashDuration × sequenceLength` 이내 입력 시 풀콤보 판정 정확도
