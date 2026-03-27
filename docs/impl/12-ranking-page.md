# 12. 랭킹 화면

## 생성 파일
- `src/components/ranking/RankingTab.tsx`
- `src/components/ranking/RankingRow.tsx`
- `src/pages/RankingPage.tsx`

---

## RankingTab.tsx

```typescript
interface RankingTabProps {
  active: 'daily' | 'monthly' | 'season'
  onChange: (tab: 'daily' | 'monthly' | 'season') => void
}
```

## RankingRow.tsx

```typescript
interface RankingRowProps {
  rank: number
  userId: string
  score: number
  isMe: boolean   // 내 항목 하이라이트
}
```

---

## RankingPage.tsx

- 탭 전환 시 `refetch()` 호출
- TOP 50 리스트
- **하단 고정**: 내 순위 (50위 밖이어도 항상 표시)

```typescript
interface RankingPageProps {
  onBack: () => void
}
```
