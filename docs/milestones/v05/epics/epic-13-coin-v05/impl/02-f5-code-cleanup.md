---
depth: simple
---
# 02-f5-code-cleanup — F5 코드 & 환경변수 클린업

> Story 2 / Issue #136
> 관련 에픽: Epic 13 (#134)
> **선행 의존**: impl/01-f5-ui-removal 완료 후 진행 (PointExchangeButton import가 이미 제거된 상태여야 함)

---

## 목적

ResultPage에서 UI를 제거한 뒤(impl/01), F5와 연관된 모든 코드·상수·import·환경변수 참조를 완전히 제거한다. `npx tsc --noEmit` 에러 0건이 완료 기준.

---

## 수정 파일 목록

| 파일 | 작업 | 비고 |
|---|---|---|
| `src/lib/ait.ts` | **수정** | grantPromotionReward import, grantDailyReward, grantCoinExchange, COIN_EXCHANGE_AMOUNT·COIN_EXCHANGE_CODE 상수 제거 |
| `src/types/index.ts` | **수정** | CoinTxType에서 `'toss_points_exchange'` 제거 |
| `src/__tests__/ait.grantCoinExchange.test.ts` | **삭제** | grantCoinExchange 함수 자체가 제거되므로 테스트 파일 전체 삭제 |
| `src/__tests__/ResultPage.coin-ui-polish.test.tsx` | **수정** | vi.mock('../lib/ait', ...) 팩토리에서 `grantCoinExchange: vi.fn().mockResolvedValue(undefined)` 제거 (L26 dead mock) |
| `src/__tests__/ResultPage.friend-ranking-removal.test.tsx` | **수정** | vi.mock('../lib/ait', ...) 팩토리에서 `COIN_EXCHANGE_AMOUNT: 10`(L40)·`grantCoinExchange: vi.fn()`(L42) 제거 (dead mock) |
| `.env.example` | **수정** | VITE_COIN_EXCHANGE_CODE 항목 제거 (파일이 없으면 skip) |
| `CLAUDE.md` | **수정** | 환경변수 섹션에서 VITE_COIN_EXCHANGE_CODE 제거 |
| `RELEASE.md` | **수정** | F5 관련 항목 제거 (교환 관련 코인 검증 항목) |

> **`.env` 파일은 수정하지 않는다.** staging 커밋 금지 원칙. 운영자가 직접 로컬에서 제거.

---

## 제거 범위 상세

### `src/lib/ait.ts`

**제거 대상 import 1항목:**
```typescript
// 기존 import 블록에서 grantPromotionReward 제거
import {
  // ...
  grantPromotionReward,  // ← 이 줄 제거
} from '@apps-in-toss/web-framework'
```

**제거 대상 grantDailyReward 함수 (약 8줄):**
```typescript
// 제거 대상 — [DEPRECATED v0.4] 이미 폐기 처리됨, 코드 자체 제거
const DAILY_REWARD_CODE = 'DAILY_PLAY'
const DAILY_REWARD_AMOUNT = 10

export async function grantDailyReward(): Promise<void> {
  if (IS_SANDBOX) return
  await grantPromotionReward({ params: { promotionCode: DAILY_REWARD_CODE, amount: DAILY_REWARD_AMOUNT } })
}
```

**제거 대상 grantCoinExchange 및 관련 상수 (약 12줄):**
```typescript
// 제거 대상
const COIN_EXCHANGE_CODE   = import.meta.env.VITE_COIN_EXCHANGE_CODE ?? 'COIN_EXCHANGE'
export const COIN_EXCHANGE_AMOUNT = 10  // 10포인트 = 10원

export async function grantCoinExchange(): Promise<void> {
  if (IS_SANDBOX) return
  await grantPromotionReward({
    params: { promotionCode: COIN_EXCHANGE_CODE, amount: COIN_EXCHANGE_AMOUNT }
  })
}
```

**제거 후 ait.ts의 import 블록 최종 형태:**
```typescript
import {
  getUserKeyForGame,
  getDeviceId,
  getOperationalEnvironment,
  loadFullScreenAd,
  showFullScreenAd,
  TossAds,
  submitGameCenterLeaderBoardScore,
  openGameCenterLeaderboard,
} from '@apps-in-toss/web-framework'
```

### `src/__tests__/ait.grantCoinExchange.test.ts` — 파일 전체 삭제

`grantCoinExchange` 함수가 `src/lib/ait.ts`에서 제거되므로, 이 함수를 테스트하는 파일 자체가 dead code가 된다.
`vi.resetModules()` + `import('../lib/ait')` 패턴으로 실제 모듈을 동적 import하므로, 함수가 없으면 런타임에 `grantCoinExchange is not a function` 에러로 전체 테스트 스위트 실패.

```bash
rm src/__tests__/ait.grantCoinExchange.test.ts
```

### `src/__tests__/ResultPage.coin-ui-polish.test.tsx` — L26 dead mock 제거

**제거 전:**
```typescript
vi.mock('../lib/ait', () => ({
  getUserId: vi.fn().mockResolvedValue('user-123'),
  grantCoinExchange: vi.fn().mockResolvedValue(undefined),  // ← 제거
}))
```

**제거 후:**
```typescript
vi.mock('../lib/ait', () => ({
  getUserId: vi.fn().mockResolvedValue('user-123'),
}))
```

### `src/__tests__/ResultPage.friend-ranking-removal.test.tsx` — L40·L42 dead mock 제거

**제거 전:**
```typescript
vi.mock('../lib/ait', () => ({
  COIN_EXCHANGE_AMOUNT: 10,          // ← 제거 (L40)
  IS_SANDBOX: false,
  grantCoinExchange: vi.fn(),        // ← 제거 (L42)
  openLeaderboard: mockOpenLeaderboard,
}))
```

**제거 후:**
```typescript
vi.mock('../lib/ait', () => ({
  IS_SANDBOX: false,
  openLeaderboard: mockOpenLeaderboard,
}))
```

### `.env.example`

파일이 현재 존재하지 않음 (glob 결과 없음). `.env.example` 파일이 추후 생성될 경우 VITE_COIN_EXCHANGE_CODE를 포함하지 않도록 보장.

> ⚠️ `.env.example`이 없는 프로젝트 상태이므로 이 항목은 skip. 파일이 존재하면 VITE_COIN_EXCHANGE_CODE 줄 삭제.

### `CLAUDE.md`

환경변수 목록 섹션에서 제거:
```
# 제거 대상 줄
VITE_COIN_EXCHANGE_CODE=    # [v0.4] 코인→토스포인트 교환 promotionCode (운영 사전 등록 필수)
```

### `RELEASE.md`

현재 RELEASE.md에는 F5 교환 관련 별도 체크리스트 항목이 없어 수정 불필요.

---

## 타입 안전성 검증

impl/01 + impl/02 완료 후 반드시 실행:

```bash
# 1) 정적 타입 검사
npx tsc --noEmit

# 2) 전체 테스트 통과 (동적 import 경로는 TSC로 감지 불가 → vitest 필수)
npx vitest run
```

**통과 기준**: TSC 에러 0건 **AND** vitest run 전체 테스트 PASS.

> **이유**: vi.mock 팩토리는 `any` 반환이므로 존재하지 않는 속성을 mock해도 TSC 컴파일 에러가 발생하지 않는다.
> `ait.grantCoinExchange.test.ts`처럼 실제 모듈을 동적 import하는 테스트는 vitest 실행 시에만 런타임 에러로 드러난다.
> 완료 기준에 vitest run을 포함하지 않으면 dead code 잔존 여부를 보장할 수 없다.

**예상 잠재 에러 패턴**:
- `grantCoinExchange` not found — impl/01에서 ResultPage 참조 제거 안 된 경우
- `COIN_EXCHANGE_AMOUNT` not found — impl/01에서 ResultPage import 제거 안 된 경우
- `ait.grantCoinExchange.test.ts` 미삭제 시 — `grantCoinExchange is not a function` 런타임 에러

**전수 검색으로 잔존 참조 확인 (vitest 실행 전 선행):**
```bash
# 아래 검색 결과가 모두 0건이어야 함 (주석 제외)
grep -r "grantCoinExchange" src/
grep -r "COIN_EXCHANGE_AMOUNT" src/
grep -r "COIN_EXCHANGE_CODE" src/
grep -r "grantPromotionReward" src/
grep -r "grantDailyReward" src/
grep -r "toss_points_exchange" src/
```

---

## 결정 근거

**grantDailyReward도 함께 제거**: ait.ts에 `[DEPRECATED v0.4]` 주석으로 폐기 표시된 상태로 남아 있다. v0.4에서 제거 예정이었으나 누락됨. F5 클린업 스코프에 포함해 처리한다. `grantPromotionReward` import를 제거하면 컴파일러가 사용처를 강제로 노출하므로 함께 정리하는 것이 안전하다.

**grantPromotionReward import 완전 제거**: `grantDailyReward`와 `grantCoinExchange` 모두 제거 후 `grantPromotionReward`를 사용하는 함수가 ait.ts에 없어진다. import만 남겨두는 것은 unused import 경고를 유발하고 향후 재사용 혼란을 야기한다.

**`COIN_EXCHANGE_AMOUNT` export 제거**: PointExchangeButton.tsx (impl/01에서 삭제)와 ResultPage.tsx (impl/01에서 참조 제거)에서만 사용. 제거 후 미사용 export 경고 및 타입 에러 없어짐.

**`.env` 수정 금지**: 민감값이 포함된 `.env`는 staging 커밋 금지 원칙 준수. VITE_COIN_EXCHANGE_CODE가 `.env`에 남아 있어도 코드에서 참조하는 곳이 없으므로 런타임 동작에 영향 없음.

---

## 주의사항

- impl/01이 완료된 상태에서 진행. impl/01 미완료 시 ResultPage에서 COIN_EXCHANGE_AMOUNT 참조가 살아 있어 연쇄 컴파일 에러.
- `addCoins` 함수는 유지 (F2·F3·F4에서 계속 사용). 제거 금지.
- **`src/types/index.ts`의 CoinTxType 수정 필수**: 현재 `'ad_reward' | 'record_bonus' | 'revival' | 'toss_points_exchange'` → `'toss_points_exchange'` 제거 후 `'ad_reward' | 'record_bonus' | 'revival'`로 좁힌다. DB 기존 row는 보존되지만 신규 INSERT 금지 원칙을 타입으로도 강제. 수정 대상 파일: `src/types/index.ts` 1줄.
