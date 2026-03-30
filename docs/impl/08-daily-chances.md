# 08. 일간 기회 제한 로직

## 수정 파일
- `src/store/gameStore.ts` (startGame, useChance 확장)

---

## startGame() Supabase 연동

```
1. daily_chances WHERE user_id = userId 조회
2. last_date !== today → used_count = 0 으로 UPDATE (자정 리셋)
3. dailyChancesLeft = MAX_DAILY - used_count  (MAX_DAILY = 1 기본 + 최대 3 광고)
4. dailyChancesLeft === 0 → throw '기회 없음' (게임 시작 차단)
5. used_count++ UPDATE → status = SHOWING
```

## useChance() — 리워드 광고 후 호출

```
1. used_count < 3 인지 확인
2. used_count++ UPDATE
3. dailyChancesLeft++
```

## 초기화 (MainPage 진입 시)
- `daily_chances` 조회 → `setDailyChancesLeft()` 호출
- 레코드 없으면 INSERT (used_count=0, last_date=today)

---

## ⚠️ today() 함수 타임존 수정 (KST 기준)

현재 코드 버그: `new Date().toISOString().slice(0, 10)` → UTC 기준
한국 사용자는 오전 9시 이전에 어제 날짜로 인식 → 일간 기회 리셋이 오전 9시에 발생

**수정 방법 (KST 오프셋 적용):**

```typescript
const today = (): string => {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}
```

DB의 `last_date`는 `DATE` 타입이므로 KST 기준 날짜 문자열(YYYY-MM-DD)과 비교.
DB RPC 함수도 동일하게 `AT TIME ZONE 'Asia/Seoul'` 적용 → `db-schema.md` 참조.

## 기회 표시 방식 (확정)

`dailyChancesLeft` = **남은 기회 횟수** (누적 사용 횟수가 아님)

| 상황 | dailyChancesLeft |
|---|---|
| 초기 진입 | 1 |
| 광고 1회 시청 | 2 |
| 광고 3회 시청 (최대) | 4 |
| 게임 1회 플레이 | -1 |

UI 표시: `"오늘 N번 플레이 가능"` (N = dailyChancesLeft)
N === 0 이면: `"오늘 기회를 모두 사용했어요. 내일 다시 오세요"`
