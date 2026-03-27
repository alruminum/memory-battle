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
