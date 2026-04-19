---
depth: simple
---
# 01-f5-ui-removal — F5 UI 제거 (ResultPage 교환 버튼 완전 제거)

> Story 1 / Issue #135
> 관련 에픽: Epic 13 (#134)

---

## 목적

PRD v0.5 F5 폐기 결정에 따라 ResultPage에서 토스포인트 교환 UI를 완전히 제거한다.
교환 버튼 컴포넌트 파일 자체를 삭제하고, ResultPage에서 모든 참조를 끊는다.
부활 버튼·코인 잔액 표시·광고 흐름은 변경하지 않는다.

---

## 수정/삭제 파일 목록

| 파일 | 작업 | 비고 |
|---|---|---|
| `src/components/result/PointExchangeButton.tsx` | **삭제** | F5 전용 컴포넌트, 다른 곳에서 사용 없음 |
| `src/pages/ResultPage.tsx` | **수정** | import·JSX·handleExchange 함수 제거 |
| `src/__tests__/PointExchangeButton.test.tsx` | **삭제** | L8에서 PointExchangeButton 직접 import — 컴포넌트 삭제 시 모듈 resolve 에러 발생 |
| `src/__tests__/ResultPage.coin-ui-polish.test.tsx` | **수정** | L34-36 `vi.mock('../components/result/PointExchangeButton', ...)` 라인 제거 — 존재하지 않는 경로 mock 시 Vitest 경고/에러 가능 |

---

## 제거 범위 상세

### `src/pages/ResultPage.tsx`

**제거 대상 import 2줄:**
```typescript
// 제거
import { grantCoinExchange, COIN_EXCHANGE_AMOUNT } from '../lib/ait'
import { PointExchangeButton } from '../components/result/PointExchangeButton'
```

**제거 대상 store 구조분해 주석 1줄:**
```typescript
// useGameStore() 구조분해에서 아래 주석 제거 (coinBalance 자체는 유지 — stageRow 우측 잔액 표시에 여전히 사용)
coinBalance  // [v0.4 F5] PointExchangeButton에 전달  ← 이 주석만 제거, coinBalance 변수는 유지
```

**제거 대상 handleExchange 함수 전체 (약 15줄):**
```typescript
// 제거 대상
async function handleExchange() {
  try {
    await grantCoinExchange()
    await addCoins(-COIN_EXCHANGE_AMOUNT, 'toss_points_exchange')
    showToastMsg('🎉 10포인트 지급됐어요!')
  } catch (err) {
    console.error('[exchange] failed:', err)
    showToastMsg('교환 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요')
  }
}
```

**제거 대상 JSX 블록 (CTA 영역 내 PointExchangeButton 사용부):**
```tsx
{/* 제거 대상 — [v0.4 F5] 포인트 교환 버튼 */}
<PointExchangeButton
  coinBalance={coinBalance}
  onExchange={handleExchange}
/>
```

### `src/components/result/PointExchangeButton.tsx`

파일 전체 삭제. COIN_EXCHANGE_AMOUNT import가 있는데 이 상수는 `src/lib/ait.ts`에 정의돼 있으며 F5 코드 클린업(impl/02) 단계에서 함께 제거된다.

### `src/__tests__/PointExchangeButton.test.tsx`

파일 전체 삭제. L8에서 `PointExchangeButton`을 직접 import하고 있어 컴포넌트 파일이 없으면 모듈 resolve 에러로 테스트 스위트 전체 실패가 발생한다.

### `src/__tests__/ResultPage.coin-ui-polish.test.tsx`

**제거 대상 mock 1줄 (L34-36):**
```typescript
// 제거
vi.mock('../components/result/PointExchangeButton', () => ({
  PointExchangeButton: () => null,
}))
```

factory 함수 방식이므로 실제 모듈 resolve는 발생하지 않으나, Vitest는 mock 경로 등록 시 내부적으로 모듈 경로 존재 여부를 검사하는 버전이 있어 경고/에러가 발생할 수 있다. 삭제된 컴포넌트를 mock할 이유가 없으므로 라인 제거가 올바른 처리다. 해당 테스트 파일의 나머지 assertion은 영향 없음.

---

## 결정 근거

**파일 삭제 선택**: 컴포넌트를 disabled 처리하거나 주석 처리로 두는 방식보다 파일 삭제가 명확하다. PointExchangeButton은 F5 전용으로 다른 컴포넌트에서 import하는 곳이 없다. 잔류 시 향후 혼란 야기.

**handleExchange 전체 제거**: `grantCoinExchange` + `addCoins(-10, 'toss_points_exchange')` 호출 경로는 F5 완전 폐기 대상이다. 함수를 남기면 다음 단계(impl/02)에서 `grantCoinExchange`를 ait.ts에서 제거할 때 컴파일 에러가 발생한다.

**coinBalance 변수 유지**: ResultPage Hero 카드의 stageRow 우측에 `CoinIcon + coinBalance` 잔액 표시가 있다 (PRD §7 유지 항목). coinBalance 변수 제거 시 이 부분이 깨진다. 변수는 유지하고 주석만 정리.

**의존성 순서**: impl/01(UI 제거) → impl/02(코드 클린업) 순서를 지킨다. UI를 먼저 제거해야 impl/02에서 `grantCoinExchange`·`COIN_EXCHANGE_AMOUNT` export를 ait.ts에서 안전하게 삭제할 수 있다.

---

## 회귀 체크리스트

구현 완료 후 다음 항목 확인:

```
□ ResultPage CTA 영역에 교환 버튼 없음 (요소 자체 미존재)
□ ResultPage CTA 영역에 "코인 N개가 필요합니다" 안내 텍스트 없음
□ stageRow 우측 코인 잔액 표시 (CoinIcon + 숫자) 정상 렌더링
□ 광고 완시청 → 코인 float-up 애니메이션 정상 동작
□ CoinRewardBadge 표시 → 3초 자동 dismiss 정상
□ NewRecordBadge (isNewBest) 정상 표시
□ PLAY AGAIN 버튼 adDone 시 활성화
□ View Rankings 버튼 탭 → RankingPage 전환
□ npx tsc --noEmit 컴파일 에러 0건 (impl/02 완료 전에는 COIN_EXCHANGE_AMOUNT 참조로 에러 발생 가능 — impl/01·02 연속 적용 필요)
```

> ⚠️ impl/01 단독으로는 `COIN_EXCHANGE_AMOUNT`가 ait.ts에 남아 있으므로 tsc 에러 없음. impl/02 완료 후 전체 tsc 검증.

---

## 주의사항

- `COIN_EXCHANGE_AMOUNT` 상수는 impl/02에서 ait.ts 클린업 시 함께 제거. impl/01에서 ait.ts를 건드리지 않는다.
- `addCoins` import는 그대로 유지 — F2(광고 코인), F3(최고기록 코인), F4(부활 코인) 경로에서 계속 사용된다.
- `coinBalance` store 필드는 그대로 유지 — stageRow 우측 잔액 표시, MainPage 잔액 표시에 사용된다.
- PointExchangeButton.tsx 삭제 후 `src/components/result/` 디렉토리에는 CoinIcon, CoinRewardBadge, NewRecordBadge 3개 파일만 남는다.
