# 16. 스택형 콤보 시스템

## 결정 근거

- PRD v0.3: 기존 "10스테이지 이상 풀콤보 x2 고정" 대신 "5스테이지 이상, 연속 풀콤보 스트릭으로 x1~x5 누적".
- **점수 계산 위치**: `addInput`에서 버튼마다 +1씩 누적 → 스테이지 클리어 시점에 `(rawScore + clearBonus) × comboMultiplier`로 일괄 적용. `addInput`은 rawScore +1 역할만 담당한다.
- **comboStreak를 스토어에 배치**: `useCombo`(훅)는 스테이지 내 콤보 카운트(300ms 기준)만 담당하고, 스테이지 간 누적 스트릭은 store에서 관리. 이유: 게임 오버 시 maxComboStreak/fullComboCount가 결과 화면에 필요하며, store가 단일 진실의 원천.
- `calcStageScore`, `calcClearBonus` 순수 함수는 `src/lib/gameLogic.ts`에 배치 (Story 15 파일 확장).

---

## 생성/수정 파일

- `src/store/gameStore.ts` (수정) — comboStreak, fullComboCount, maxComboStreak 필드 추가, 점수 계산 재구조화
- `src/lib/gameLogic.ts` (수정) — calcClearBonus, getComboMultiplier, calcStageScore 추가
- `src/hooks/useGameEngine.ts` (수정) — 스테이지 클리어 시 store에 콤보 결과 반영 로직 추가

---

## 인터페이스 정의

### `src/lib/gameLogic.ts` 추가 함수

```typescript
const COMBO_ACTIVATION_STAGE = 5

/**
 * 스테이지 클리어 보너스 (10스테이지 이상부터 지급)
 */
export const calcClearBonus = (stage: number): number => {
  if (stage < 10) return 0
  return Math.floor(stage / 5)
}

/**
 * comboStreak → 배율 (x1~x5)
 */
export const getComboMultiplier = (comboStreak: number): number =>
  Math.min(comboStreak + 1, 5)

/**
 * 스테이지 최종 점수
 * @param buttonScore  해당 스테이지에서 버튼 입력으로 누적된 rawScore
 * @param comboStreak  현재 연속 풀콤보 스트릭 (배율 결정에 사용)
 * @param stage        클리어한 스테이지 번호
 * @param isFullCombo  해당 스테이지 풀콤보 여부
 */
export const calcStageScore = (
  buttonScore: number,
  comboStreak: number,
  stage: number,
  isFullCombo: boolean
): number => {
  const bonus = calcClearBonus(stage)
  const raw = buttonScore + bonus
  if (!isFullCombo || stage < COMBO_ACTIVATION_STAGE) return raw
  return raw * getComboMultiplier(comboStreak)
}
```

### `src/store/gameStore.ts` 인터페이스 (Story 14 이후)

```typescript
interface GameStore {
  status: GameStatus
  sequence: ButtonColor[]
  currentIndex: number
  score: number          // 누적 점수 (콤보 배율 적용 후 합산)
  stage: number
  comboStreak: number    // 현재 연속 풀콤보 스트릭 (0~4)
  fullComboCount: number // 이번 게임 풀콤보 달성 횟수
  maxComboStreak: number // 이번 게임 최고 콤보 스트릭

  userId: string
  hasTodayReward: boolean

  setUserId: (id: string) => void
  setTodayReward: (value: boolean) => void
  setSequence: (seq: ButtonColor[]) => void
  startGame: () => void
  addInput: (color: ButtonColor) => 'correct' | 'wrong' | 'round-clear'
  stageClear: (isFullCombo: boolean) => void  // 신규: 스테이지 클리어 시 콤보/점수 반영
  gameOver: () => void
  resetGame: () => void
}
```

---

## 핵심 로직

### `gameStore.ts` — addInput 변경

```typescript
addInput: (color) => {
  const { sequence, currentIndex, score } = get()
  const expected = sequence[currentIndex]

  if (color !== expected) return 'wrong'

  const isLast = currentIndex === sequence.length - 1

  if (isLast) {
    // rawScore +1만 기록. 배율 적용은 stageClear에서 수행.
    set({ score: score + 1, currentIndex: currentIndex + 1 })
    return 'round-clear'
  }

  set({ score: score + 1, currentIndex: currentIndex + 1 })
  return 'correct'
},
```

**주의**: `score`는 `addInput` 단계에서 +1 누적이 계속된다. `stageClear` 호출 시 `score`를 다시 계산하여 최종값으로 교체한다.

### `gameStore.ts` — stageClear (신규 액션)

```typescript
stageClear: (isFullCombo) => {
  set((state) => {
    const clearedStage = state.sequence.length
    // state.score에는 이번 스테이지 버튼 입력분(+1씩)이 이미 포함되어 있음
    // 이번 스테이지 버튼 점수 = clearedStage (시퀀스 길이만큼 입력 성공)
    // 이전 누적 점수에서 이번 스테이지 rawScore를 빼고, 배율 적용 후 재합산
    const prevAccumulated = state.score - clearedStage  // 이전 스테이지까지 누적 점수
    const stageScore = calcStageScore(
      clearedStage,
      state.comboStreak,
      clearedStage,
      isFullCombo
    )

    const newComboStreak = isFullCombo
      ? Math.min(state.comboStreak + 1, 4)
      : 0
    const newFullComboCount = isFullCombo
      ? state.fullComboCount + 1
      : state.fullComboCount
    const newMaxComboStreak = Math.max(state.maxComboStreak, newComboStreak)

    return {
      score: prevAccumulated + stageScore,
      comboStreak: newComboStreak,
      fullComboCount: newFullComboCount,
      maxComboStreak: newMaxComboStreak,
    }
  })
},
```

**점수 계산 근거**:
- `addInput` 호출 시 `score`가 `+1`씩 누적되므로, `round-clear` 반환 직후 `state.score`에는 이번 스테이지 버튼 점수(sequence.length만큼)가 들어 있다.
- `prevAccumulated = state.score - clearedStage` 로 이전 누적분을 분리한다.
- `calcStageScore(clearedStage, ...)` 로 이번 스테이지 최종 점수를 계산한다.
- 두 값을 합산하여 `score`를 업데이트한다.

### `gameStore.ts` — startGame / resetGame 초기화

```typescript
startGame: () =>
  set({
    status: 'SHOWING',
    sequence: [],
    currentIndex: 0,
    score: 0,
    stage: 0,
    comboStreak: 0,
    fullComboCount: 0,
    maxComboStreak: 0,
  }),

resetGame: () =>
  set({
    status: 'IDLE',
    sequence: [],
    currentIndex: 0,
    score: 0,
    stage: 0,
    comboStreak: 0,
    fullComboCount: 0,
    maxComboStreak: 0,
  }),
```

### `useGameEngine.ts` — round-clear 처리 변경

```typescript
if (result === 'round-clear') {
  const clearedStage = sequence.length
  clearingRef.current = true
  timer.stop()
  setClearingStage(clearedStage)

  const isFullCombo = combo.checkFullCombo(clearedStage)
  // 스토어에 콤보/점수 반영 (기존 combo.reset() 대신 stageClear 호출)
  useGameStore.getState().stageClear(isFullCombo)

  const isMilestone = clearedStage % 5 === 0
  if (isMilestone) playApplause()

  const newSeq = [...sequence, randomButton()]
  const pauseMs = isMilestone ? MILESTONE_PAUSE_MS : CLEAR_PAUSE_MS

  setTimeout(() => {
    combo.reset()          // useCombo 내부 카운트만 리셋
    clearingRef.current = false
    setClearingStage(null)
    setSequence(newSeq)
    useGameStore.setState({ status: 'SHOWING', currentIndex: 0, stage: newSeq.length })
  }, pauseMs)
  return
}
```

---

## 주의사항

- `stageClear`의 `prevAccumulated` 계산은 `addInput`이 정확히 `sequence.length`번 호출된 경우에만 성립한다. `round-clear` 반환 시점에 `currentIndex === sequence.length - 1`이므로 조건 충족. 오답/타임아웃은 이 경로를 통하지 않는다.
- `comboStreak`의 상한은 4 (`Math.min(..., 4)`). 배율 계산 시 `Math.min(comboStreak + 1, 5)`로 x5가 최대.
- `maxComboStreak`는 `stageClear` 내에서 `newComboStreak` (갱신 후 값) 기준으로 업데이트한다.
- `gameOver()` 액션은 별도 점수 배율 처리 없음 — 이미 `stageClear`에서 처리 완료.
- `combo.reset()`은 `useCombo` 내부 상태(스테이지 내 버튼 간격 카운트)를 리셋. `comboStreak`는 store에서 관리하므로 `combo.reset()` 과 무관.
- `calcStageScore`는 `src/lib/gameLogic.ts`에 배치 — `gameStore.ts` 내부에서 import.
