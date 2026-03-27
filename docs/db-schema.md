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
