# 설계 결정 근거

> 모듈 구현 중 여러 접근법을 검토한 경우 여기에 기록한다.
> 형식: **결정 → 근거 → 버린 대안과 이유**

---

## 모듈 07: useRanking — supabase.rpc() 방식 채택

**결정**: `supabase.rpc('ranking_daily')` 등 PostgreSQL 함수 호출

**근거**:
Supabase JS 클라이언트의 `.from().select()`는 `GROUP BY`를 지원하지 않는다.
랭킹 조회는 `MAX(score) GROUP BY user_id`가 필수이므로 DB 레이어에서 집계해야 한다.

**버린 대안**:
- 클라이언트에서 전체 scores를 받아 JS로 집계 → 데이터 증가 시 비현실적, 네트워크 낭비
- Supabase Edge Function → 오버엔지니어링. SQL 함수(DB 레이어)로 충분

**필수 선행 작업**: Supabase 콘솔 SQL Editor에서 아래 함수 생성 (→ `docs/db-schema.md` 참고)
- `ranking_daily()`
- `ranking_monthly()`
- `ranking_season(season_start DATE)`

---

## 모듈 08: 일간 기회 — useDailyChances 훅 분리

**결정**: Zustand `gameStore.ts`는 동기 유지. Supabase 비동기 로직은 `useDailyChances` 훅으로 분리

**근거**:
1. Zustand action에 async Supabase 호출을 넣으면 store가 네트워크 상태에 직접 의존하게 되어 관심사 분리 원칙 위반
2. store의 역할은 "UI 상태 동기화"이고 DB 읽기/쓰기는 React 레이어(훅)에서 처리하는 것이 자연스럽다
3. 기존 `startGame()`을 수정하면 `useGameEngine.ts`의 `launchAfterCountdown()` 흐름도 연쇄 수정이 필요해져 변경 범위가 커진다

**버린 대안**:
- `gameStore.ts`의 `startGame()`을 async로 변경 → 위 이유로 기각

---

## 모듈 09: RewardAd — 컴포넌트 대신 훅

**결정**: `useRewardAd.ts` (훅)으로 구현

**근거**:
리워드 광고는 UI 렌더링이 없고 `showRewardAd()` 비동기 호출 + 로딩 상태만 있다.
훅으로 만들면 ResultPage에서 `const { show, isLoading } = useRewardAd()`로 자연스럽게 사용 가능.

**버린 대안**:
- `RewardAd.tsx` 컴포넌트 → 불필요한 JSX 발생, 렌더링할 UI가 없음

---

## 모듈 10: isNewBest 판단 — submitScore 호출 전에 기존 best 조회

**결정**: 마운트 시 submitScore 호출 전에 기존 daily best_score를 먼저 읽어 비교

**근거**:
submitScore 후에 랭킹을 조회하면 이미 내 새 점수가 반영된 상태이므로 "이전 최고점"을 알 수 없다.
순서: ① 기존 best 조회 → ② 비교해 isNewBest 결정 → ③ submitScore 호출

**버린 대안**:
- submitScore 후 비교 → 항상 isNewBest=false가 나올 수 있어 기각
