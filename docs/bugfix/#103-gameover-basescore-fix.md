---
depth: simple
---
# #103 버그픽스 — gameOver baseScore 미반영으로 COMBO BONUS 오표시

> 원래 이슈: [#103](https://github.com/alruminum/memory-battle/issues/103)

---

## 개요

x1 배율(comboStreak 0~4) 상태로 게임이 종료됐음에도 결과 화면 `COMBO STATS`의 `COMBO BONUS`에
0이 아닌 양수값이 표시되는 경우가 있음.

**근본 원인**: `addInput`은 버튼 정답마다 `score += multiplier`로 즉시 누적하지만,
`baseScore`는 `stageClear`에서만 갱신된다. 라운드 도중 오답/타임아웃으로 게임 오버 시
`stageClear`가 호출되지 않아 현재 라운드의 부분 입력 점수가 `baseScore`에 미반영된 채 RESULT
상태로 전환된다. `ResultPage`에서 `comboBonus = score - baseScore`를 계산하면 이 미반영분이
콤보보너스로 오산정된다.

---

## 결정 근거

### D1 — 수정 위치: `gameOver` 액션 (Method A 채택)

세 가지 접근법을 검토했다.

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **Method A: `gameOver`에서 보정 (채택)** | `gameOver` 호출 시 `baseScore += currentIndex`로 부분 라운드 베이스 점수 반영 | ✅ 채택 |
| Method B: `addInput`에서 `baseScore` 동시 증가 | 버튼마다 `baseScore += 1`, `stageClear`는 clearBonus만 추가하도록 변경 | ❌ 미채택 — `addInput`·`stageClear` 두 곳 동시 변경, 기존 테스트 대규모 수정 필요 |
| Method C: `ResultPage` 계산 보정 | 표시 레이어에서 미완성 라운드 보정 로직 추가 | ❌ 미채택 — 뷰 레이어에 스토어 내부 불일치를 숨기는 구조. 단일 진실 공급원 위반 |

**Method A 선택 근거**:
- `currentIndex` = 게임 오버 시점까지 현재 라운드에서 맞춘 버튼 수
- 버튼 1개 베이스 점수 = 1 (배율 미적용 단위)
- 따라서 `baseScore += currentIndex`가 정확히 미반영 베이스 점수를 보정
- `gameOver` 단일 액션만 수정. 기존 `addInput`·`stageClear` 테스트 회귀 없음
- 타임아웃 시 currentIndex=0이면 `+= 0` → 올바른 no-op 동작

### D2 — clearBonus 미반영 여부

게임 오버 시 클리어 보너스(`calcClearBonus`)는 스테이지를 완료하지 못했으므로 지급하지 않는다.
`baseScore += currentIndex`만으로 충분하며, clearBonus 보정은 불필요하다.

### D3 — `score` 수정 여부

`score`는 `addInput`에서 이미 올바르게 누적됐다 (정답 버튼마다 배율 포함 즉시 반영).
오답 입력 시 `addInput`은 store를 건드리지 않고 'wrong'을 반환한다. 따라서 `score`는 수정 불필요.

---

## 수정 파일

- `src/store/gameStore.ts` (수정)
- `src/__tests__/score-immediate-multiplier.test.ts` (수정 — 회귀 케이스 추가)

---

## gameStore.ts

### 수정 대상: `gameOver` 액션 (Line 141~146)

#### 현행

```typescript
gameOver: (reason) =>
  set((state) => ({
    status: 'RESULT',
    stage: state.sequence.length,
    gameOverReason: reason,
  })),
```

#### 변경 후

```typescript
gameOver: (reason) =>
  set((state) => ({
    status: 'RESULT',
    stage: state.sequence.length,
    gameOverReason: reason,
    // 부분 라운드 베이스 점수 보정: addInput에서 누적된 score와 stageClear에서만
    // 갱신되는 baseScore 간 불일치 해소. currentIndex = 현재 라운드에서 맞춘 버튼 수.
    // 버튼 1개 베이스 = 1점, clearBonus는 라운드 미완료이므로 추가하지 않음.
    baseScore: state.baseScore + state.currentIndex,
  })),
```

### 핵심 동작 검증

```
[시나리오 1] x1 배율, stage=3, 버튼 2개 정답 후 오답
  addInput 호출 2회: score = 2, currentIndex = 2, baseScore = 0 (stageClear 미호출)
  gameOver 호출:
    baseScore = 0 + 2 = 2
    score = 2
  ResultPage: comboBonus = 2 - 2 = 0 ✅

[시나리오 2] x1 배율, 타임아웃 (정답 입력 없음)
  score = 0, currentIndex = 0, baseScore = 0
  gameOver 호출:
    baseScore = 0 + 0 = 0
  ResultPage: comboBonus = 0 - 0 = 0 ✅

[시나리오 3] x2 배율 (comboStreak=5), stage=3, 버튼 2개 정답 후 오답
  addInput 2회: score = 4 (2×배율2), currentIndex = 2, baseScore = 0
  gameOver 호출:
    baseScore = 0 + 2 = 2   ← 베이스 2점
    score = 4
  ResultPage: comboBonus = 4 - 2 = 2  ← 배율 프리미엄 2점 (정상) ✅
```

---

## score-immediate-multiplier.test.ts

### 추가 describe 블록

기존 파일 하단에 추가한다.

```typescript
describe('#103: gameOver — baseScore 부분 라운드 보정', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('G-1: x1 배율 + 버튼 2개 정답 후 gameOver → comboBonus = 0', () => {
    // 2버튼 정답 누적 (addInput 직접 호출 대신 setState로 결과 상태 재현)
    setState({
      sequence: ['orange', 'blue', 'green'],
      currentIndex: 2,   // 2개 정답 완료 상태
      score: 2,           // x1 * 2버튼
      baseScore: 0,       // stageClear 미호출
      comboStreak: 0,
      status: 'INPUT',
    })
    useGameStore.getState().gameOver('wrong')
    const { score, baseScore } = useGameStore.getState()
    expect(score - baseScore).toBe(0)  // comboBonus = 0
  })

  it('G-2: x1 배율 + 타임아웃 (currentIndex=0) → comboBonus = 0', () => {
    setState({
      sequence: ['orange', 'blue', 'green'],
      currentIndex: 0,
      score: 0,
      baseScore: 0,
      comboStreak: 0,
      status: 'INPUT',
    })
    useGameStore.getState().gameOver('timeout')
    const { score, baseScore } = useGameStore.getState()
    expect(score - baseScore).toBe(0)
  })

  it('G-3: x2 배율 + 버튼 2개 정답 후 gameOver → comboBonus = 배율 프리미엄만', () => {
    // x2 배율: 2버튼 → score=4, 베이스=2
    setState({
      sequence: ['orange', 'blue', 'green'],
      currentIndex: 2,
      score: 4,           // x2 * 2버튼
      baseScore: 0,
      comboStreak: 5,    // x2 배율
      status: 'INPUT',
    })
    useGameStore.getState().gameOver('wrong')
    const { score, baseScore } = useGameStore.getState()
    // comboBonus = 4 - 2 = 2 (배율 프리미엄 2점, 정상)
    expect(score - baseScore).toBe(2)
  })

  it('G-4: 완료된 스테이지 있는 상태에서 미드라운드 gameOver → 기존 baseScore 보전', () => {
    // 이전 스테이지(2버튼) 완료 후 baseScore=2, 현재 라운드 1버튼 정답 후 오답
    setState({
      sequence: ['orange', 'blue', 'green'],
      currentIndex: 1,
      score: 3,           // 이전 스테이지 2점 + 현재 1점
      baseScore: 2,       // 이전 stageClear 결과
      comboStreak: 0,
      status: 'INPUT',
    })
    useGameStore.getState().gameOver('wrong')
    const { score, baseScore } = useGameStore.getState()
    // baseScore = 2 + 1 = 3, comboBonus = 3 - 3 = 0
    expect(score - baseScore).toBe(0)
  })
})
```

---

## 주의사항

- **`addInput`·`stageClear` 수정 없음** — 기존 B-2·B-5 테스트 회귀 없음
- **`clearBonus` 미적용** — 게임 오버 시 라운드 미완료이므로 정책적으로 지급 안 함
- **`stage` 필드 유지** — `state.sequence.length`를 그대로 사용 (기존 로직 불변)
- **DB 영향도**: 없음. ResultPage에서 `score`를 DB 제출하는 로직은 변경 없음

---

## 수동 검증

| ID | 시나리오 | 기대 동작 |
|---|---|---|
| MV-1 | x1 배율 전 구간 (comboStreak 0~4) 게임 플레이 → 결과 화면 | COMBO BONUS = 0 또는 COMBO STATS 미표시 |
| MV-2 | x1 배율 상태에서 타임아웃 게임 오버 | COMBO BONUS = 0 |
| MV-3 | x2 이상 배율로 라운드 도중 오답 게임 오버 | COMBO BONUS > 0 (배율 프리미엄분만 표시) |
| MV-4 | 정상 스테이지 클리어 반복 → 게임 오버 | 기존 COMBO BONUS 표시 동일 |
