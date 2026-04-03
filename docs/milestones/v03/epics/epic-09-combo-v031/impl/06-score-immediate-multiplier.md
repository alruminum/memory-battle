# 06. 점수 배율 즉시 적용 (버그픽스 #59)

> 관련 이슈: [#59](https://github.com/alruminum/memory-battle/issues/59)

## 결정 근거

### 문제 원인
`addInput`은 항상 `score + 1`만 적용한다. 배율은 `stageClear`에서 풀콤보 판정 시 `prevAccumulated + stageScore`로 이번 스테이지 점수를 재계산해 덮어썼다. 이 구조는 두 가지 문제를 유발한다:

1. **UX 불일치**: 배율이 x2 이상인 상태에서 버튼을 눌러도 점수가 +1씩만 올라감. 스테이지 클리어 시 점수가 튀어 오르는 현상이 생김.
2. **isFullCombo 의존성**: Epic 11 Story 2에서 풀콤보 시스템을 제거했으나, `stageClear`의 점수 계산 로직이 여전히 `isFullCombo` 분기에 의존함. 풀콤보 조건(`userInputTime < computerShowTime`)은 여전히 계산되고 있어 스펙과 불일치.

### 스펙 변경 (유저 확정)

| 항목 | 변경 전 | 변경 후 |
|---|---|---|
| `addInput` 점수 | 항상 `+1` | `+currentMultiplier` (즉시 배율 적용) |
| `stageClear` 점수 계산 | `isFullCombo`이면 `rawScore × multiplier`, 아니면 `rawScore` | `clearBonus × multiplier` 만 추가 (버튼 점수는 이미 addInput에서 배율 포함) |
| `isFullCombo` 개념 | 스테이지 점수 배율 게이트 | 제거 — 콤보 스트릭 증가 판정에만 사용 (콤보 스트릭 갱신은 유지) |
| `stageClear` 반환 `isFullCombo` | 점수에 영향 | 점수에 무관, 반환값 구조 유지 (코드 호환성) |

### 배율 적용 시점 변경의 영향 분석

- **`baseScore`**: 배율 미적용 누적 점수(콤보 보너스 계산용). `addInput`에서 `+1`, `stageClear`에서 `+clearBonus`를 더하는 방식으로 유지. 로직 변경 없음.
- **`prevAccumulated` 분리 패턴 제거**: 기존 `stageClear`는 `score - clearedStage`로 이전 누적을 분리한 뒤 재합산했다. 새 방식에서는 `addInput`이 이미 배율 포함 점수를 누적하므로 이 패턴이 불필요해짐. `stageClear`는 `clearBonus × multiplier`만 추가한다.
- **콤보 스트릭/multiplierIncreased**: `stageClear`에서 `isFullCombo`로 스트릭을 증가/리셋하는 로직은 그대로 유지. 다만 이제 이 판정이 점수에는 영향을 주지 않고 스트릭만 관리한다.

### 검토한 대안

- **`stageClear`에서 기존 재계산 유지 + addInput score 임시 표시만 보정**: score를 임시값으로 표시하고 클리어 시 확정값으로 교체. UX는 개선되나 두 점수가 공존해 상태 복잡도 증가. 불필요한 중복 상태 → 제외.
- **`addInput`에서 배율 적용 + `stageClear`에서 보너스만 추가**: 현재 채택 방식. 상태가 항상 "현재까지의 실제 점수"를 반영하므로 단순하고 직관적.

---

## 생성/수정 파일

- `src/store/gameStore.ts` (수정) — `addInput` 배율 즉시 적용, `stageClear` isFullCombo 기반 점수 계산 제거
- `docs/game-logic.md` (수정) — 점수 계산 섹션 업데이트

---

## 인터페이스 정의

`gameStore.ts` 인터페이스(`GameStore`) 변경 없음 — 필드, 액션 시그니처 모두 동일.

```typescript
// 변경 없는 시그니처
addInput: (color: ButtonColor) => 'correct' | 'wrong' | 'round-clear'
stageClear: (inputCompleteTime: number, flashDuration: number) => {
  isFullCombo: boolean
  multiplierIncreased: boolean
}
```

호출부(`useGameEngine.ts`) 변경 없음.

---

## 핵심 로직

### `addInput` 변경

```typescript
addInput: (color) => {
  const { sequence, currentIndex, score, comboStreak } = get()
  const expected = sequence[currentIndex]

  if (color !== expected) {
    return 'wrong'
  }

  const multiplier = getComboMultiplier(comboStreak)  // 현재 streak 기준 배율
  const isLast = currentIndex === sequence.length - 1

  // 버튼마다 배율 포함 점수 즉시 누적
  // baseScore는 stageClear에서만 일괄 갱신 — addInput에서 변경하지 않음
  set({ score: score + multiplier, currentIndex: currentIndex + 1 })

  return isLast ? 'round-clear' : 'correct'
},
```

### `stageClear` 변경

```typescript
stageClear: (inputCompleteTime, flashDuration) => {
  let result = { isFullCombo: false, multiplierIncreased: false }

  set((state) => {
    const clearedStage = state.sequence.length
    const computerShowTime = flashDuration * clearedStage
    const userInputTime = inputCompleteTime - state.sequenceStartTime
    const isFullCombo = userInputTime < computerShowTime  // 스트릭 판정용 (점수 무관)

    const prevComboStreak = state.comboStreak
    const newComboStreak = isFullCombo ? prevComboStreak + 1 : 0

    const prevMultiplier = getComboMultiplier(prevComboStreak)
    const newMultiplier = getComboMultiplier(newComboStreak)
    const multiplierIncreased = newMultiplier > prevMultiplier

    // 클리어 보너스만 배율 적용해서 추가
    // (버튼 점수는 addInput에서 이미 배율 포함 누적됨)
    const bonus = calcClearBonus(clearedStage)
    const bonusScore = bonus * getComboMultiplier(prevComboStreak)  // 클리어 직전 배율 기준

    const baseStageScore = calcBaseStageScore(clearedStage)

    const newFullComboCount = isFullCombo ? state.fullComboCount + 1 : state.fullComboCount
    const newMaxComboStreak = Math.max(state.maxComboStreak, newComboStreak)

    result = { isFullCombo, multiplierIncreased }

    return {
      score: state.score + bonusScore,
      baseScore: state.baseScore + baseStageScore,
      comboStreak: newComboStreak,
      fullComboCount: newFullComboCount,
      maxComboStreak: newMaxComboStreak,
    }
  })

  return result
},
```

### `docs/game-logic.md` 점수 계산 섹션 변경

변경 전:
```typescript
// 버튼 누를 때마다 무조건 +1
const calcScore = (): number => 1
```

변경 후:
```typescript
// 버튼 누를 때마다 현재 배율 즉시 적용
const calcButtonScore = (comboStreak: number): number =>
  getComboMultiplier(comboStreak)  // streak 0~4: +1, 5~9: +2, ...

// 스테이지 클리어 시 클리어 보너스에도 배율 적용
const calcBonusScore = (stage: number, comboStreak: number): number =>
  calcClearBonus(stage) * getComboMultiplier(comboStreak)
```

### `docs/game-logic.md` 스택형 콤보 시스템 섹션 변경

- **배율 적용**: `addInput` 시 현재 `comboStreak` 기반 배율을 즉시 적용. 풀콤보 조건(`isFullCombo`)은 스트릭 갱신에만 사용, 점수에 영향 없음.
- **스테이지 클리어 처리 시그니처**: `isFullCombo` 반환값 유지 (코드 호환성), 단 점수 계산에는 미사용.

---

## 주의사항

- **`baseScore` 계산**: `addInput`의 배율 변경과 무관하게 `baseScore`는 `calcBaseStageScore(clearedStage)`로만 관리됨. 변경 없음.
- **Breaking Change 없음**: `GameStore` 인터페이스, `addInput`·`stageClear` 시그니처, `useGameEngine` 호출부 변경 없음.
- **`calcStageScore` 함수**: `gameLogic.ts`에 존재하나 이번 변경 후에는 `stageClear`에서 직접 사용하지 않음 (내부에서 `getComboMultiplier`를 직접 호출). 함수 자체는 제거하지 않음 (외부에서 사용 중일 수 있음, 추후 정리 가능).
- **DB 영향도**: 없음.
- **점수 시뮬레이션 변화**: game-logic.md의 "누적 점수 시뮬" 테이블은 새 로직 기준으로 값이 달라질 수 있음. 단, 해당 테이블은 레퍼런스용이므로 이번 버그픽스에서 재계산하지 않음 — 후속 문서 정리 태스크로 분리.

---

## 테스트 경계

- 단위 테스트 가능:
  - `addInput` — 배율 x1일 때 +1, x2일 때 +2 즉시 반영 검증 (test-plan.md B-2 섹션 갱신 필요)
  - `stageClear` — 보너스만 배율 적용, prevAccumulated 로직 제거 후 점수 정합성 (test-plan.md B-5 섹션 갱신 필요)
- 통합 테스트 필요: 없음
- 수동 검증:
  - 배율 x2(comboStreak=5) 상태에서 버튼 누를 때마다 점수 +2 즉시 반영 확인
  - 스테이지 클리어 시 점수 튀는 현상 없음 확인
  - 10스테이지 이상 클리어 시 clearBonus에 배율 적용되어 보너스가 커지는 것 확인
  - 배율 x1(streak 0~4) 상태에서 버튼 +1 동작 동일 확인 (회귀 방지)
