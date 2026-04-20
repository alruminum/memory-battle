# DB 스키마 (Supabase)

## 테이블 정의

```sql
-- 게임 결과 저장
CREATE TABLE scores (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,        -- getUserKeyForGame().hash
  score       INTEGER NOT NULL,     -- 최종 점수
  stage       INTEGER NOT NULL,     -- 게임 오버 시점 스테이지
  played_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scores_played_at ON scores(played_at DESC);
CREATE INDEX idx_scores_user_id   ON scores(user_id);

-- [v0.4 DEPRECATED] daily_reward — 코드/훅 제거됨, 테이블 물리 삭제는 v2
-- CREATE TABLE daily_reward ( ... );

-- [v0.4] 유저 코인 잔액
CREATE TABLE user_coins (
  user_id   TEXT PRIMARY KEY,   -- getUserKeyForGame().hash
  balance   INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

-- [v0.4] 코인 거래 내역
-- type: 'ad_reward' | 'record_bonus' | 'revival' | 'toss_points_exchange'
-- amount: 양수=적립, 음수=차감
CREATE TABLE coin_transactions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,
  type        TEXT NOT NULL,
  amount      INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coin_tx_user_id ON coin_transactions(user_id, created_at DESC);
```

---

## 랭킹 조회 쿼리

```sql
-- 일간 랭킹 (당일 자정 이후)
SELECT user_id, MAX(score) AS best_score
FROM scores
WHERE played_at >= CURRENT_DATE
GROUP BY user_id
ORDER BY best_score DESC
LIMIT 50;

-- 월간 랭킹
SELECT user_id, MAX(score) AS best_score
FROM scores
WHERE DATE_TRUNC('month', played_at) = DATE_TRUNC('month', NOW())
GROUP BY user_id
ORDER BY best_score DESC
LIMIT 50;

-- 시즌 랭킹 (시즌 시작일을 파라미터로 관리 — 1/4/7/10월 첫날)
SELECT user_id, MAX(score) AS best_score
FROM scores
WHERE played_at >= '2025-01-01'
GROUP BY user_id
ORDER BY best_score DESC
LIMIT 50;
```

---

## RLS (Row Level Security) 정책

Supabase SQL Editor에서 배포 전 반드시 실행.

```sql
-- RLS 활성화
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reward ENABLE ROW LEVEL SECURITY;

-- scores: 누구나 읽기 허용 (공개 랭킹), INSERT만 허용, UPDATE/DELETE 차단
CREATE POLICY "scores_select_all"   ON scores FOR SELECT USING (true);
CREATE POLICY "scores_insert_anon"  ON scores FOR INSERT WITH CHECK (true);
-- UPDATE/DELETE 정책 없음 → 자동 차단

-- [v0.4] user_coins / coin_transactions
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_coins_all_anon"  ON user_coins        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "coin_tx_all_anon"     ON coin_transactions FOR ALL USING (true) WITH CHECK (true);

-- [DEPRECATED v0.4] daily_reward — 코드 제거, 테이블만 보존
-- CREATE POLICY "daily_reward_all_anon" ON daily_reward FOR ALL USING (true) WITH CHECK (true);
```

> ⚠️ anon key가 클라이언트에 노출되는 구조에서는 user-level RLS 불가.
> 실질적 방어: INSERT-only + PK 중복 제약(23505) + 배포 후 이상 패턴 모니터링.

---


## [v0.4] 코인 RPC 함수

코인 잔액·거래 내역을 단일 트랜잭션으로 원자 처리. Supabase SQL Editor에서 생성.

```sql
-- add_coins: user_coins balance 원자 증감 + coin_transactions INSERT
-- p_amount: 양수=적립, 음수=차감 / GREATEST(0,...) 로 음수 차단
CREATE OR REPLACE FUNCTION add_coins(
  p_user_id TEXT,
  p_amount  INTEGER,
  p_type    TEXT      -- 'ad_reward'|'record_bonus'|'revival'|'toss_points_exchange'
)
RETURNS INTEGER        -- 업데이트 후 최종 balance 반환
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  INSERT INTO user_coins (user_id, balance)
  VALUES (p_user_id, GREATEST(0, p_amount))
  ON CONFLICT (user_id) DO UPDATE
    SET balance = GREATEST(0, user_coins.balance + p_amount)
  RETURNING balance INTO v_balance;

  INSERT INTO coin_transactions (user_id, type, amount)
  VALUES (p_user_id, p_type, p_amount);

  RETURN v_balance;
END;
$$;
```

> **선택 근거**: 클라이언트 SELECT→UPDATE 2-step은 race condition 가능. RPC 단일 트랜잭션으로 atomic 처리. `GREATEST(0, ...)` 로 음수 차단.

클라이언트 호출:
```typescript
const { data, error } = await supabase.rpc('add_coins', {
  p_user_id: userId,
  p_amount: amount,   // ⚠️ p_delta 아님 — p_amount 사용
  p_type: type
})
// data: 업데이트된 balance (INTEGER)
```

---

## Supabase RPC 함수 (KST 타임존 적용, 랭킹용)

랭킹 조회 쿼리는 `AT TIME ZONE 'Asia/Seoul'`을 적용해 한국 기준 날짜 경계를 사용.
Supabase SQL Editor에서 생성.

```sql
-- 일간 랭킹 (KST 기준 당일)
CREATE OR REPLACE FUNCTION ranking_daily()
RETURNS TABLE(user_id TEXT, best_score INTEGER)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT user_id, MAX(score)::INTEGER AS best_score
  FROM scores
  WHERE (played_at AT TIME ZONE 'Asia/Seoul')::DATE = (NOW() AT TIME ZONE 'Asia/Seoul')::DATE
  GROUP BY user_id
  ORDER BY best_score DESC
  LIMIT 50;
$$;

-- 월간 랭킹 (KST 기준 이번 달)
CREATE OR REPLACE FUNCTION ranking_monthly()
RETURNS TABLE(user_id TEXT, best_score INTEGER)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT user_id, MAX(score)::INTEGER AS best_score
  FROM scores
  WHERE DATE_TRUNC('month', played_at AT TIME ZONE 'Asia/Seoul')
        = DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Seoul')
  GROUP BY user_id
  ORDER BY best_score DESC
  LIMIT 50;
$$;

-- 시즌 랭킹 (시즌 시작일 파라미터)
CREATE OR REPLACE FUNCTION ranking_season(season_start DATE)
RETURNS TABLE(user_id TEXT, best_score INTEGER)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT user_id, MAX(score)::INTEGER AS best_score
  FROM scores
  WHERE (played_at AT TIME ZONE 'Asia/Seoul')::DATE >= season_start
  GROUP BY user_id
  ORDER BY best_score DESC
  LIMIT 50;
$$;
```

> 클라이언트의 `today()` 함수도 KST 기준으로 맞춰야 DB와 일관성 유지 → `08-daily-chances.md` 참조.

---

## 타입 자동화 워크플로우

DB 스키마를 단일 진실 공급원(Single Source of Truth)으로 삼아 TypeScript 타입을 자동 생성한다.

### 초기 설정 (1회)

```bash
npm install supabase --save-dev
npx supabase login   # 브라우저 인증
```

### 타입 생성/재생성

```bash
npm run gen:types
# → src/types/database.types.ts 덮어쓰기
```

> `gen:types` 스크립트: `supabase gen types typescript --project-id jptzbftptvymesxylcyf --schema public > src/types/database.types.ts`

### DB 스키마 변경 시 절차

1. Supabase 콘솔에서 DDL 실행 (스키마 변경)
2. `docs/db-schema.md` 업데이트
3. `npm run gen:types` 실행 -- `src/types/database.types.ts` 재생성
4. 파일 하단 편의 타입 별칭(`ScoreRow`, `ScoreInsert` 등) 재추가 (덮어쓰기로 유실됨)
5. `npx tsc --noEmit` 으로 컴파일 에러 확인 후 수정
6. 변경 파일 커밋

### 편의 타입 별칭

`src/types/database.types.ts` 하단에 수동으로 추가하는 별칭 목록:

```typescript
export type ScoreRow = Database['public']['Tables']['scores']['Row']
export type ScoreInsert = Database['public']['Tables']['scores']['Insert']
// [v0.4] 코인 테이블 타입
export type UserCoinsRow    = Database['public']['Tables']['user_coins']['Row']
export type UserCoinsInsert = Database['public']['Tables']['user_coins']['Insert']
export type CoinTransactionRow    = Database['public']['Tables']['coin_transactions']['Row']
export type CoinTransactionInsert = Database['public']['Tables']['coin_transactions']['Insert']
// [DEPRECATED v0.4] daily_reward — 코드에서 사용 제거, 타입만 보존 참조용
// export type DailyRewardRow = Database['public']['Tables']['daily_reward']['Row']
```

`src/types/index.ts`에서 re-export하므로 다른 모듈에서는 `../types`로 import 가능.
