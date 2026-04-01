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

-- 일일 리워드 수령 기록
CREATE TABLE daily_reward (
  user_id      TEXT NOT NULL,
  reward_date  DATE NOT NULL,
  PRIMARY KEY (user_id, reward_date)
);
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

-- daily_reward: anon key로 전체 허용 (user_id 기반 RLS 불가 — 토스 hash는 auth.uid()와 무관)
CREATE POLICY "daily_reward_all_anon" ON daily_reward FOR ALL USING (true) WITH CHECK (true);
```

> ⚠️ anon key가 클라이언트에 노출되는 구조에서는 user-level RLS 불가.
> 실질적 방어: INSERT-only + PK 중복 제약(23505) + 배포 후 이상 패턴 모니터링.

---

## Supabase RPC 함수 (KST 타임존 적용)

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
export type DailyRewardRow = Database['public']['Tables']['daily_reward']['Row']
export type DailyRewardInsert = Database['public']['Tables']['daily_reward']['Insert']
```

`src/types/index.ts`에서 re-export하므로 다른 모듈에서는 `../types`로 import 가능.
