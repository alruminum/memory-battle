# Epic 02: 백엔드/데이터

> 상태: 진행 중 (DB 세팅 미완)

## Story 6: Supabase DB 세팅

> 콘솔 작업. DDL: `docs/db-schema.md` 참고.

- [ ] `scores` 테이블 생성
- [ ] `daily_reward` 테이블 생성
- [ ] 인덱스 생성: `idx_scores_played_at`, `idx_scores_user_id`
- [ ] RLS 정책 설정 — anon key로 INSERT/SELECT 허용

## Story 7: 랭킹 훅

- [x] `src/hooks/useRanking.ts` — 일간/월간/시즌 랭킹 조회 + 내 순위 계산
- [x] 게임 오버 시 점수 INSERT (Supabase)
- [x] `submitGameCenterLeaderBoardScore()` 호출
- [x] ResultPage "친구 랭킹 보기" → `openGameCenterLeaderboard()` 연결

## Story 8: 일간 리워드 로직

- [x] `src/hooks/useDailyReward.ts` — daily_reward 테이블 조회/기록, grantPromotionReward 호출
- [x] `gameStore.ts` — hasTodayReward/setTodayReward 추가
- [x] `ait.ts` — grantDailyReward() 래퍼 추가
