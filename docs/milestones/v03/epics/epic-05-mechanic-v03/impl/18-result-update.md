# 18. 결과 화면 업데이트

## 참고 문서

- UI 스펙: `docs/ui-spec.md` — 결과 화면 섹션 (COMBO STATS 카드 레이아웃·색상)

---

## 결정 근거

- PRD v0.3 결과 화면: fullComboCount, maxComboStreak, 콤보 보너스 점수, 최고 도달 스테이지 표시.
- 모든 데이터는 Story 16에서 gameStore에 이미 누적된다 — 별도 계산 없이 store에서 읽으면 된다.
- "콤보 보너스 점수" = `score(실제) - score(콤보 없을 때)`. 콤보 없을 때 점수를 역산하기보다 store에서 별도 추적하는 방법을 선택한다.
  - **근거**: 역산은 스테이지별 이력이 필요해 복잡도가 높다. store에 `baseScore: number`(배율 미적용 점수)를 추가하면 `comboBonus = score - baseScore`로 단순 계산 가능.
- ResultPage의 기존 레이아웃 유지 — 최종 점수 카드 아래에 콤보 통계 카드 추가.

---

## 생성/수정 파일

- `src/store/gameStore.ts` (수정) — `baseScore` 필드 추가
- `src/lib/gameLogic.ts` (수정) — `calcBaseStageScore` 추가 (배율 미적용)
- `src/pages/ResultPage.tsx` (수정) — 콤보 통계 섹션 추가, difficulty 참조 완전 제거

---

## 인터페이스 정의

### `gameStore.ts` 추가 필드

```typescript
interface GameStore {
  // ... 기존 필드
  score: number          // 누적 점수 (콤보 배율 적용 후)
  baseScore: number      // 누적 점수 (배율 미적용 — 콤보 보너스 계산용)
  comboStreak: number
  fullComboCount: number
  maxComboStreak: number
}
```

### `src/lib/gameLogic.ts` 추가 함수

```typescript
/**
 * 배율 미적용 스테이지 점수 (콤보 보너스 = score - baseScore)
 */
export const calcBaseStageScore = (stage: number): number => {
  return stage + calcClearBonus(stage)  // 버튼 입력 점수 + 클리어 보너스
}
```

---

## 핵심 로직

### `gameStore.ts` — stageClear에 baseScore 추가

```typescript
stageClear: (isFullCombo) => {
  set((state) => {
    const clearedStage = state.sequence.length

    // 이전 누적 점수 분리 (addInput에서 +1씩 누적된 buttonScore 포함)
    const prevAccumulated = state.score - clearedStage
    const prevBase = state.baseScore   // 이전 baseScore는 그대로

    const stageScore = calcStageScore(clearedStage, state.comboStreak, clearedStage, isFullCombo)
    const baseStageScore = calcBaseStageScore(clearedStage)

    const newComboStreak = isFullCombo ? Math.min(state.comboStreak + 1, 4) : 0
    const newFullComboCount = isFullCombo ? state.fullComboCount + 1 : state.fullComboCount
    const newMaxComboStreak = Math.max(state.maxComboStreak, newComboStreak)

    return {
      score: prevAccumulated + stageScore,
      baseScore: prevBase + baseStageScore,
      comboStreak: newComboStreak,
      fullComboCount: newFullComboCount,
      maxComboStreak: newMaxComboStreak,
    }
  })
},
```

### `gameStore.ts` — startGame / resetGame에 baseScore 초기화

```typescript
startGame: () =>
  set({
    status: 'SHOWING',
    sequence: [],
    currentIndex: 0,
    score: 0,
    baseScore: 0,   // 추가
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
    baseScore: 0,   // 추가
    stage: 0,
    comboStreak: 0,
    fullComboCount: 0,
    maxComboStreak: 0,
  }),
```

### `ResultPage.tsx` — 콤보 통계 섹션

```typescript
// store에서 추가 필드 읽기
const { score, stage, baseScore, fullComboCount, maxComboStreak, userId } = useGameStore()

const comboBonus = score - baseScore  // 콤보 배율로 추가된 점수

// submitScore 호출 (difficulty 제거)
submitScore(score, stage, userId)

// 최종 점수 카드 아래: "Stage {stage}" (diffLabel 제거)
<div>Stage {stage}</div>

// 콤보 통계 카드 (최종 점수 카드 아래, 랭킹 리스트 위에 삽입)
{(fullComboCount > 0 || maxComboStreak > 0) && (
  <div style={{
    margin: '12px 20px 0',
    padding: '16px',
    backgroundColor: 'var(--vb-surface)',
    borderRadius: 12,
    border: '1px solid var(--vb-border)',
    flexShrink: 0,
  }}>
    <div style={{
      fontFamily: 'var(--vb-font-score)',
      fontSize: 10,
      color: 'var(--vb-text-dim)',
      letterSpacing: 3,
      marginBottom: 12,
    }}>COMBO STATS</div>

    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      {[
        { label: 'FULL COMBO',   value: `${fullComboCount}x` },
        { label: 'MAX STREAK',   value: `x${Math.min(maxComboStreak + 1, 5)}` },
        { label: 'COMBO BONUS',  value: `+${comboBonus.toLocaleString()}` },
      ].map(({ label, value }) => (
        <div key={label} style={{ textAlign: 'center', flex: 1 }}>
          <div style={{
            fontFamily: 'var(--vb-font-body)',
            fontSize: 9,
            color: 'var(--vb-text-dim)',
            letterSpacing: 1.5,
            marginBottom: 4,
          }}>{label}</div>
          <div style={{
            fontFamily: 'var(--vb-font-score)',
            fontSize: 18,
            fontWeight: 900,
            color: 'var(--vb-accent)',
          }}>{value}</div>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## 주의사항

- `comboBonus = score - baseScore`: Story 16 구현 시 `stageClear`에서 `baseScore`를 정확히 누적해야 이 계산이 성립한다. `baseScore`는 배율 미적용 순수 점수임을 명시.
- `maxComboStreak`가 0이고 `fullComboCount`가 0이면 콤보 통계 섹션을 표시하지 않는다 — 콤보를 전혀 달성하지 못한 게임에서 "COMBO STATS" 섹션이 노출되는 것을 방지.
- `MAX STREAK` 표시값: `x${Math.min(maxComboStreak + 1, 5)}` — maxComboStreak는 스트릭 카운트(0~4), 배율은 +1이므로 1~5.
- `COMBO BONUS`가 0이어도 표시하나, 통계 섹션 자체는 `fullComboCount > 0 || maxComboStreak > 0` 조건으로 제어.
- `ResultPage.tsx`에서 `difficulty` import가 완전히 제거되어 있어야 한다 (Story 14 선행 완료 필요).
- `submitScore(score, stage, userId)` — Story 14에서 변경된 시그니처 사용. `difficulty` 인자 없음.
- `ResultPage.tsx`의 기존 "Stage {stage} ◆ {diffLabel}" 텍스트는 "Stage {stage}" 로 변경.
