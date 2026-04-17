# Epic 12: 코인 시스템 (PRD v0.4)

> 앱내 화폐(코인) 신설. 광고 보상 코인으로 전환(daily_reward 폐기), 최고기록 보상, 부활 아이템(5코인), 토스포인트 교환(10코인=10포인트).
> 번호 체계: 에픽 내 독립 순번 (1부터 시작).

---

## Story 1: F1 — 코인 DB 인프라 + useCoin 훅 ([#107](https://github.com/alruminum/memory-battle/issues/107))

> impl: `impl/01-usecoin-infra.md`
> 관련 이슈: [#107](https://github.com/alruminum/memory-battle/issues/107)

Supabase에 `user_coins` + `coin_transactions` 테이블을 생성하고, 원자적 잔액 처리를 위한 `add_coins` RPC를 추가한다.
클라이언트 측 `useCoin` 훅(잔액 로드·적립·차감)과 Zustand store의 코인 필드(coinBalance, revivalUsed, revive(), setCoinBalance)를 구현한다.

- [ ] Supabase 콘솔: `user_coins` + `coin_transactions` DDL 실행 (→ RELEASE.md)
- [ ] Supabase 콘솔: `add_coins` RPC 함수 등록 (→ RELEASE.md)
- [ ] `npm run gen:types` 실행 → `src/types/database.types.ts` 재생성
- [ ] `src/hooks/useCoin.ts` — `getBalance()`, `addCoins()` 구현
- [ ] `src/store/gameStore.ts` — `coinBalance`, `revivalUsed`, `revive()`, `setCoinBalance()` 추가

---

## Story 2: F6 — daily_reward 코드 제거 ([#108](https://github.com/alruminum/memory-battle/issues/108))

> impl: `impl/02-daily-reward-removal.md`
> 관련 이슈: [#108](https://github.com/alruminum/memory-battle/issues/108)

`useDailyReward` 훅 및 `daily_reward` 참조 코드를 전부 제거한다. DB 테이블 물리 삭제는 v2로 연기.
`npx tsc --noEmit` 에러 0건, `daily_reward` 검색 0건(DB 스키마 주석 제외) 달성.

- [ ] `src/hooks/useDailyReward.ts` — 파일 삭제 (또는 해당 코드 제거)
- [ ] `src/pages/ResultPage.tsx` — `useDailyReward` import 및 호출 제거
- [ ] `src/types/database.types.ts` — DailyRewardRow 등 참조 타입 주석 처리(보존) 확인
- [ ] `npx tsc --noEmit` 에러 0건 확인

---

## Story 3: F2 — 광고 완시청 코인 적립 ([#109](https://github.com/alruminum/memory-battle/issues/109))

> impl: `impl/03-ad-coin-reward.md`
> 관련 이슈: [#109](https://github.com/alruminum/memory-battle/issues/109)

게임오버 후 리워드 광고 완시청(userEarnedReward) 시 1~5개 코인을 랜덤 지급하고, "🪙 +N 코인 획득!" 피드백을 표시한다.
샌드박스: 고정 2개 지급.

- [ ] `src/components/result/CoinRewardBadge.tsx` — "🪙 +N 획득!" 토스트/배지 컴포넌트 신규 작성
- [ ] `src/pages/ResultPage.tsx` — `showRewardAd()` → `userEarnedReward` 콜백에서 `useCoin.addCoins(random, 'ad_reward')` + `CoinRewardBadge` 표시
- [ ] `src/lib/ait.ts` 또는 유틸: `randomCoinReward()` 가중치 랜덤 함수 (1→30%/2→30%/3→25%/4→10%/5→5%)

---

## Story 4: F3 — 최고기록 코인 보상 ([#110](https://github.com/alruminum/memory-battle/issues/110))

> impl: `impl/04-record-coin.md`
> 관련 이슈: [#110](https://github.com/alruminum/memory-battle/issues/110)

게임 종료 후 점수가 기존 최고기록을 초과(strict >)하면 코인 1개를 추가 적립한다.
첫 플레이(prevBest=0)에도 적용. 동점은 미처리.

- [ ] `src/pages/ResultPage.tsx` — `isNewBest` 분기에서 `useCoin.addCoins(1, 'record_bonus')` 호출 + "🏆 최고기록! 🪙 +1" 토스트

---

## Story 5: F4 — 부활 아이템 ([#111](https://github.com/alruminum/memory-battle/issues/111))

> impl: `impl/05-revival-item.md`
> 관련 이슈: [#111](https://github.com/alruminum/memory-battle/issues/111)

게임오버 화면에서 코인 5개를 소모해 현재 스테이지에서 재도전하는 부활 기능을 구현한다.
판당 1회 제한. balance < 5 또는 revivalUsed=true 시 버튼 비활성.

- [ ] `src/components/result/RevivalButton.tsx` — 부활 버튼, 비활성 이유 텍스트 포함
- [ ] `src/pages/ResultPage.tsx` — RevivalButton 통합, `addCoins(-5, 'revival')` → `store.revive()` 호출 흐름
- [ ] `src/store/gameStore.ts` — `revive()` 구현: sequence=[] 초기화(새 시퀀스), stage/score/comboStreak 유지, revivalUsed=true, status='SHOWING'

---

## Story 6: F5 — 토스포인트 교환 ([#112](https://github.com/alruminum/memory-battle/issues/112))

> impl: `impl/06-toss-points-exchange.md`
> 관련 이슈: [#112](https://github.com/alruminum/memory-battle/issues/112)

코인 10개를 소모해 토스포인트 10포인트를 지급한다. SDK 성공 후에만 DB 차감(실패 시 롤백).
balance < 10 시 버튼 비활성.

- [ ] `src/components/result/PointExchangeButton.tsx` — 교환 버튼, 비활성 이유 텍스트 포함
- [ ] `src/pages/ResultPage.tsx` — PointExchangeButton 통합, `grantCoinExchange()` → 성공 시 `addCoins(-10, 'toss_points_exchange')` 흐름
- [ ] `src/lib/ait.ts` — `grantCoinExchange()` 이미 설계됨, 샌드박스 no-op 확인

---

## Story 7: F7(Polishing) — 코인 잔액 UI + float-up 애니메이션 ([#113](https://github.com/alruminum/memory-battle/issues/113))

> impl: `impl/07-coin-ui-polish.md`
> 관련 이슈: [#113](https://github.com/alruminum/memory-battle/issues/113)

메인화면 및 게임오버 화면에 코인 잔액을 상시 표시하고, 코인 획득 시 "+N 🪙" 플로팅 애니메이션을 추가한다.

- [ ] `src/pages/MainPage.tsx` — 상단 🪙 N 코인 잔액 표시 (로딩 중 `-`)
- [ ] `src/pages/ResultPage.tsx` — 현재 코인 잔액 상시 표시
- [ ] `src/index.css` — `@keyframes coinFloatUp` (위로 올라가며 페이드아웃)
- [ ] float-up 트리거: CoinRewardBadge 또는 ResultPage에서 획득 이벤트 시 발동

---

## Story 8: F4-AD — 광고 부활 옵션

> impl: `impl/08-ad-revival.md`
> 관련 이슈: [#124](https://github.com/alruminum/memory-battle/issues/124)

게임오버 오버레이에 광고 시청 기반 부활 옵션을 추가한다.
코인 잔액 기준으로 버튼 표시가 분기되며, 부활은 판당 1회 제한 (코인·광고 택1 → revivalUsed=true).
광고 부활은 코인을 지급하지 않는다 (코인 보상은 결과용 광고에서만).

### 버튼 표시 조건

| 조건 | 표시 |
|------|------|
| revivalUsed=false, 잔액<5 | "광고 보고 부활" 버튼 1개 |
| revivalUsed=false, 잔액≥5 | "광고 보고 부활" + "🪙 5코인으로 부활" 버튼 2개 |
| revivalUsed=true | 부활 버튼 없음 |

### 광고 부활 플로우

1. "광고 보고 부활" 탭 → 두 버튼 모두 비활성(로딩 상태) → 부활용 리워드광고 시작
2. 완시청 → 코인 미지급, revivalUsed=true, 현 스테이지 재시작 (score/stage/combo 유지)
3. 스킵/실패 → 부활 미처리, 버튼 재활성화 (재시도 가능)

### 수용 기준

- [ ] Given revivalUsed=false AND 잔액<5 / When 게임오버 오버레이 진입 / Then "광고 보고 부활" 버튼 1개만 표시
- [ ] Given revivalUsed=false AND 잔액≥5 / When 게임오버 오버레이 진입 / Then "광고 보고 부활" + "🪙 5코인으로 부활" 버튼 2개 표시
- [ ] Given "광고 보고 부활" 탭 / When 광고 시작 직후 / Then 두 버튼 모두 비활성(로딩 상태)
- [ ] Given 부활용 광고 완시청 / When userEarnedReward 콜백 / Then 코인 미지급, revivalUsed=true, 현 스테이지 재시작 (score/stage/combo 유지)
- [ ] Given 광고 스킵 또는 실패 / When 광고 종료 / Then 부활 미처리, 버튼 재활성화 (재시도 가능)
- [ ] Given revivalUsed=true / When 게임오버 오버레이 진입 / Then 부활 버튼 없음
