# 10. 결과 화면

> v0.2 변경: 광고 자동 시작, 첫 완시청 10포인트 지급, 기회 관련 UI 전면 제거

## 생성 파일
- `src/pages/ResultPage.tsx`

---

## 레이아웃

```
┌─────────────────────┐
│  GAME OVER          │
│  이번 점수: N       │
│  NEW PERSONAL BEST  │  ← 갱신 시만 표시
│                     │
│  일간  N위          │
│  월간  N위 → M월 1일에 포인트 지급 예정
│  시즌  N위          │
│                     │
│  광고 로딩 중...    │  ← 마운트 즉시 광고 자동 시작
│                     │
│  [PLAY AGAIN]       │  ← 광고 종료 이벤트 수신 후에만 활성화
│  [친구 랭킹 보기]   │
│  [View Rankings]    │
└─────────────────────┘
```

## 마운트 즉시 광고 자동 시작 플로우

```typescript
// ResultPage 마운트 시 useEffect
useEffect(() => {
  showAd({
    onUserEarnedReward: async () => {
      if (!hasTodayReward) {
        try {
          await grantDailyReward()
          showToast('오늘의 10포인트 지급!')
        } catch {
          showToast('포인트 지급 중 오류가 발생했습니다')
        }
      }
      setAdDone(true)
    },
    onDismissed: () => setAdDone(true),   // 스킵/닫기: 처리 없이 버튼 활성화
    onError:    () => setAdDone(true),    // 실패: 처리 없이 버튼 활성화
  })
}, [])  // 마운트 1회만 실행
```

- `adDone: boolean` — false(초기) → 광고 종료 이벤트 수신 후 true
- PLAY AGAIN 버튼은 `adDone === true`일 때만 활성화 (클릭 가능)
- 광고 중에는 버튼 영역 숨기거나 비활성화 (UX 선택)

## props

```typescript
interface ResultPageProps {
  onPlayAgain: () => void
  onGoRanking: () => void
}
```

## 데이터

- `useRanking()` 훅으로 순위 조회
- `useGameStore()` 로 score, stage, difficulty, userId, hasTodayReward
- `useDailyReward()` 훅으로 grantDailyReward 호출
- `useRewardAd()` 훅으로 showAd 호출 (callbacks 파라미터 포함)

## 삭제 항목 (v0.2)

- `dailyChancesLeft` 참조 전면 제거
- `noChances` 조건 및 "오늘 플레이 기회를 모두 사용했습니다" 문구 제거
- 확인 모달 ("광고를 보면 1회 추가됩니다") 제거
- `addChance(userId)` 호출 제거
- `useDailyChances` import 제거 → `useDailyReward` import 추가

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
