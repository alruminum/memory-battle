# 11. 메인 화면

## 생성 파일
- `src/components/game/DifficultySelector.tsx`
- `src/pages/MainPage.tsx`

---

## DifficultySelector.tsx

```typescript
interface DifficultySelectorProps {
  value: Difficulty
  onChange: (d: Difficulty) => void
}
```
- Easy(x1) / Medium(x2) / Hard(x3) 3개 버튼
- 선택된 항목 하이라이트

---

## MainPage.tsx

### 진입 시 초기화 순서
1. `getUserId()` → `setUserId()`
2. Supabase `daily_chances` 조회 → `setDailyChancesLeft()`
3. `useRanking()` 로 내 랭킹 뱃지 조회

### 레이아웃
```
┌─────────────────────┐
│  기억력배틀         │
│                     │
│  일간 N위  월간 N위  시즌 N위  │
│                     │
│  오늘 N번 플레이 가능│
│                     │
│  [Easy][Medium][Hard]│
│                     │
│  [시작하기]         │  ← dailyChancesLeft === 0 이면 disabled
│  오늘 기회를 모두 사용했어요. 내일 다시 오세요  │
└─────────────────────┘
```
