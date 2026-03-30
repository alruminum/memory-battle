# DB 스키마 (Supabase)

## 테이블 정의

```sql
-- 게임 결과 저장
CREATE TABLE scores (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,        -- getUserKeyForGame().hash
  score       INTEGER NOT NULL,     -- 최종 점수 (원점수 × 난이도 배율 적용)
  stage       INTEGER NOT NULL,     -- 게임 오버 시점 스테이지
  difficulty  TEXT NOT NULL,        -- 'EASY' | 'MEDIUM' | 'HARD'
  played_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scores_played_at ON scores(played_at DESC);
CREATE INDEX idx_scores_user_id   ON scores(user_id);

-- 일간 기회 제한
CREATE TABLE daily_chances (
  user_id     TEXT PRIMARY KEY,
  used_count  INTEGER DEFAULT 0,    -- 오늘 사용한 추가 기회 수 (0~3)
  last_date   DATE DEFAULT CURRENT_DATE
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

## 일간 기회 로직

```typescript
// daily_chances 확인 흐름
// 1. last_date가 오늘이 아니면 → used_count=0으로 리셋
// 2. used_count >= 3이면 → 추가 불가 (기본 1회 포함 최대 4회)
// 3. 리워드광고 완료 후 → used_count++ , dailyChancesLeft++
```

---

## RLS (Row Level Security) 정책

Supabase SQL Editor에서 배포 전 반드시 실행.

```sql
-- RLS 활성화
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_chances ENABLE ROW LEVEL SECURITY;

-- scores: 누구나 읽기 허용 (공개 랭킹), INSERT만 허용, UPDATE/DELETE 차단
CREATE POLICY "scores_select_all"   ON scores FOR SELECT USING (true);
CREATE POLICY "scores_insert_anon"  ON scores FOR INSERT WITH CHECK (true);
-- UPDATE/DELETE 정책 없음 → 자동 차단

-- daily_chances: anon key로 전체 허용 (user_id 기반 RLS 불가 — 토스 hash는 auth.uid()와 무관)
-- used_count 범위 검증(0~3)은 RPC 함수 내에서 수행
CREATE POLICY "daily_chances_all_anon" ON daily_chances FOR ALL USING (true) WITH CHECK (true);
```

> ⚠️ anon key가 클라이언트에 노출되는 구조에서는 user-level RLS 불가.
> 실질적 방어: INSERT-only + used_count 서버 검증 + 배포 후 이상 패턴 모니터링.

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
