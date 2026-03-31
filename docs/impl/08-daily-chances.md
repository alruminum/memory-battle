# 08. 일간 리워드 로직 (v0.2)

> v0.2 전면 교체: daily_chances 기회 제한 폐지 → 게임오버 즉시 광고, 첫 완시청 1회 10포인트

## 수정/생성 파일
- `src/hooks/useDailyReward.ts` (신규 — `src/hooks/useDailyChances.ts` 삭제)
- `src/store/gameStore.ts` (수정 — hasTodayReward/setTodayReward 반영, 03-zustand-store.md 참고)
- `src/lib/ait.ts` (수정 — grantDailyReward 래퍼 추가)

---

## Supabase daily_reward 테이블 스키마

```sql
CREATE TABLE daily_reward (
  user_id     TEXT    NOT NULL,
  reward_date DATE    NOT NULL,
  PRIMARY KEY (user_id, reward_date)
);

-- RLS: anon key로 INSERT/SELECT 허용
ALTER TABLE daily_reward ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow anon insert" ON daily_reward FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "allow anon select" ON daily_reward FOR SELECT TO anon USING (true);
```

---

## 인터페이스 정의

```typescript
// src/hooks/useDailyReward.ts
interface UseDailyRewardReturn {
  hasTodayReward: boolean            // 오늘 이미 리워드를 받았는지
  markTodayRewarded: () => Promise<void>  // daily_reward INSERT (중복 무시)
  grantDailyReward: () => Promise<void>   // 포인트 지급 + markTodayRewarded
}

export function useDailyReward(): UseDailyRewardReturn
```

---

## 핵심 로직

### hasTodayReward 초기화 (마운트 시)

```typescript
useEffect(() => {
  if (!userId) return
  supabase
    .from('daily_reward')
    .select('user_id')
    .eq('user_id', userId)
    .eq('reward_date', todayKST())   // YYYY-MM-DD, KST 기준
    .maybeSingle()
    .then(({ data }) => {
      setTodayReward(!!data)  // gameStore.setTodayReward 호출
    })
}, [userId])
```

### markTodayRewarded()

```typescript
async function markTodayRewarded(): Promise<void> {
  await supabase
    .from('daily_reward')
    .insert({ user_id: userId, reward_date: todayKST() })
    // PK 중복 시 자동 무시 (upsert 대신 insert; DB PK 제약으로 중복 방지)
    // 에러 무시 (이미 존재하면 409 conflict — catch 불필요, 결과 무관)
  setTodayReward(true)
}
```

### grantDailyReward()

```typescript
async function grantDailyReward(): Promise<void> {
  // ait.ts의 grantDailyReward 래퍼 호출
  await grantDailyRewardAit()
  await markTodayRewarded()
}
```

### ait.ts — grantDailyReward 래퍼

```typescript
// import: { grantPromotionReward } from '@apps-in-toss/web-framework'
export async function grantDailyReward(): Promise<void> {
  if (IS_SANDBOX) return  // 샌드박스 분기: 실제 포인트 지급 생략
  await grantPromotionReward({ params: { promotionCode: 'DAILY_PLAY', amount: 10 } })
}
```

### KST 날짜 헬퍼

```typescript
// useDailyReward.ts 내부 사용
const todayKST = (): string => {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)  // 'YYYY-MM-DD'
}
```

---

## 에러 처리 방식

| 상황 | 처리 |
|---|---|
| `SELECT` 실패 (네트워크 등) | `hasTodayReward = false` 유지 (안전 방향: 지급 시도 허용) |
| `INSERT` 중복 (409) | 무시 (PK 제약 보장) — 재지급 없음 |
| `grantPromotionReward` 실패 | throw 전파 → ResultPage에서 catch 후 토스트 표시, `markTodayRewarded()` 호출 안 함 |

---

## 주의사항

- `useDailyChances.ts`를 import하는 모든 파일 교체 필요: `ResultPage.tsx`, `MainPage.tsx`
- `grantPromotionReward` API는 `@apps-in-toss/web-framework`에서 import (deprecated `grantPromotionRewardForGame` 사용 금지)
- `hasTodayReward`는 세션 내 캐시. 앱 재시작 시 Supabase 재조회.
- 하루 1회 제한은 `daily_reward` PK 제약으로 DB 레벨에서 보장. 클라이언트 `hasTodayReward` 체크는 UX 목적(버튼 상태 표시)만.
