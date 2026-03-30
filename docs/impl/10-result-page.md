# 10. 결과 화면

## 생성 파일
- `src/pages/ResultPage.tsx`

---

## 레이아웃

```
┌─────────────────────┐
│  이번 점수: N       │
│  🏆 최고기록 갱신!  │  ← 갱신 시만 표시
│                     │
│  일간  N위          │
│  월간  N위 → M월 1일에 XXX원 지급 예정
│  시즌  N위          │
│                     │
│  [한 번 더 하기]    │  ← 기회 소진 시 disabled
│  기회 소진 안내문구 │
└─────────────────────┘
```

## 한 번 더 버튼 플로우
1. 버튼 탭
2. 확인 모달: `"광고를 보면 1회 추가됩니다"`
3. `useRewardAd().show()`
4. `true` → `useChance()` → 게임 재시작 (onPlayAgain 콜백)
5. `false` → 모달 닫기만

## props
```typescript
interface ResultPageProps {
  onPlayAgain: () => void
  onGoRanking: () => void
}
```

## 데이터
- `useRanking()` 훅으로 순위 조회
- `useGameStore()` 로 score, dailyChancesLeft

---

## ⚠️ isNewBest 레이스 컨디션 수정

### 현재 버그
ResultPage 마운트 시 `useRanking().fetchAll()`이 완료되기 전에 `daily` 배열이 빈 상태.
`prevBest = 0`으로 비교 → 모든 게임이 `isNewBest = true`로 표시됨.

### 수정 방법 (채택)

`useRanking()` 훅을 마운트 시 자동으로 `fetchAll()` 실행하도록 수정:

```typescript
// useRanking.ts 내
useEffect(() => {
  if (userId) fetchAll()
}, [userId])
```

ResultPage는 `isLoading`이 완료된 후 `isNewBest` 판단:

```typescript
const prevBest = isLoading ? null : (daily.find(r => r.userId === userId)?.score ?? 0)
const isNewBest = !isLoading && score > prevBest
```

`isLoading === true` 동안은 "🏆 최고기록 갱신!" 표시 보류 (깜빡임 방지).

### 점수 제출 타이밍

ResultPage 마운트 시 실행 순서:
1. `fetchAll()` 자동 실행 (기존 랭킹 조회)
2. `submitScore(score, stage, difficulty, userId)` — INSERT
3. `refetch()` — 제출 후 랭킹 갱신

`isNewBest` 판단은 2번 INSERT 전에 완료된 1번 결과로 수행.
