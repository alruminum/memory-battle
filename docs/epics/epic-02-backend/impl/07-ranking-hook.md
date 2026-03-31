# 07. 랭킹 훅

## 생성 파일
- `src/hooks/useRanking.ts`

---

## useRanking.ts

```typescript
interface RankEntry {
  user_id: string
  best_score: number
  rank: number
}

interface UseRankingReturn {
  daily: RankEntry[]
  monthly: RankEntry[]
  season: RankEntry[]
  myRanks: { daily: number; monthly: number; season: number }
  isLoading: boolean
  submitScore: (score: number, stage: number, difficulty: Difficulty) => Promise<void>
  refetch: () => void
}
```

### submitScore()
1. Supabase `scores` 테이블 INSERT
2. `submitScore()` from ait.ts (게임센터 리더보드 제출)

### 랭킹 조회
- `docs/db-schema.md` 쿼리 기준 (일간/월간/시즌)
- 내 순위: 전체 결과에서 `user_id` 매칭으로 계산
- `refetch()`: 탭 전환 시 호출

### 시즌 기준일
- 1/4/7/10월 첫날. 현재는 하드코딩 (`'2025-01-01'`)
