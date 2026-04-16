---
depth: std
---
# 06. 토스포인트 교환 (F5)

## 결정 근거

- **SDK 성공 후 DB 차감 (실패 시 롤백 없음, DB 차감 없음)**: sdk.md의 호출 흐름 명세 준수. `grantCoinExchange()` → SDK 성공 시 `addCoins(-10, 'toss_points_exchange')`. SDK 실패 시 DB는 변경되지 않으므로 사용자의 코인은 유지된다. 이 순서가 반드시 지켜져야 한다.
- **`grantCoinExchange()`는 `ait.ts`에 구현**: sdk.md에 이미 설계 문서화됨(`[구현 예정 — Epic 12 impl-06 완료 후 ait.ts에 추가]`). 이 impl에서 실제로 `ait.ts`에 함수를 추가한다. `PointExchangeButton`은 이 함수를 `lib/ait.ts`에서 직접 import한다.
- **`PointExchangeButton` 컴포넌트 신규**: RevivalButton(impl 05)과 유사한 구조. 비활성 조건은 `coinBalance < 10` 단일 조건이다. 부활과 달리 "이미 사용" 제한은 없다 (횟수 제한 없는 교환).
- **샌드박스 no-op**: `grantCoinExchange()`는 `IS_SANDBOX` 분기로 즉시 return. 샌드박스에서도 버튼 클릭 시 `addCoins(-10)`은 실행되어 DB에 기록된다. SDK no-op이므로 실제 포인트는 지급되지 않음.
- **`VITE_COIN_EXCHANGE_CODE` 환경변수**: 미설정 시 fallback `'COIN_EXCHANGE'`. 운영 배포 전 콘솔 등록 필수 (RELEASE.md 항목).

---

## 생성/수정 파일

| 파일 | 작업 |
|---|---|
| `src/lib/ait.ts` | 수정 — `grantCoinExchange()` 실제 구현 추가 |
| `src/components/result/PointExchangeButton.tsx` | 신규 — 교환 버튼 컴포넌트 |
| `src/pages/ResultPage.tsx` | 수정 — `useGameStore()` coinBalance 추출 추가 + PointExchangeButton 통합 (RevivalButton 추가 없음) |

---

## src/lib/ait.ts

### 추가 함수 (`grantDailyReward` 아래에 추가)

```typescript
// ⚠️ import는 ait.ts line 10에 이미 존재 — 재선언 금지
// import { grantPromotionReward } from '@apps-in-toss/web-framework'

// [v0.4] 코인 10개 → 토스포인트 10포인트 교환
// ⚠️ 운영에서 promotionCode 사전 등록 필요 — 등록 전 호출 시 SDK 에러
// ⚠️ 샌드박스: no-op (실제 포인트 지급 없음)
const COIN_EXCHANGE_CODE   = import.meta.env.VITE_COIN_EXCHANGE_CODE ?? 'COIN_EXCHANGE'
const COIN_EXCHANGE_AMOUNT = 10  // 10포인트 = 10원

export async function grantCoinExchange(): Promise<void> {
  if (IS_SANDBOX) return  // 샌드박스: no-op
  await grantPromotionReward({
    params: { promotionCode: COIN_EXCHANGE_CODE, amount: COIN_EXCHANGE_AMOUNT }
  })
}
```

> `IS_SANDBOX`는 ait.ts 최상단에 이미 선언된 상수. 추가 선언 불필요.

---

## src/components/result/PointExchangeButton.tsx

### 인터페이스

```typescript
interface PointExchangeButtonProps {
  coinBalance: number         // 현재 잔액
  onExchange: () => Promise<void>  // 교환 실행 콜백 (비동기: grantCoinExchange → addCoins)
}

export function PointExchangeButton({ coinBalance, onExchange }: PointExchangeButtonProps): JSX.Element
```

### 핵심 구현

```tsx
import { useState } from 'react'

export function PointExchangeButton({ coinBalance, onExchange }: PointExchangeButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const canExchange = coinBalance >= 10
  const disabledReason = !canExchange
    ? `코인 10개가 필요합니다 (현재 ${coinBalance}개)`
    : null

  async function handleExchange() {
    if (!canExchange || isProcessing) return
    setIsProcessing(true)
    try {
      await onExchange()
    } catch {
      // 오류는 onExchange 내에서 처리
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <button
        onClick={handleExchange}
        disabled={!canExchange || isProcessing}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 8,
          border: `1px solid ${canExchange ? 'var(--vb-accent)' : 'var(--vb-border)'}`,
          backgroundColor: 'transparent',
          color: canExchange ? 'var(--vb-text)' : 'var(--vb-text-dim)',
          fontFamily: 'var(--vb-font-score)',
          fontSize: 14,
          fontWeight: 900,
          letterSpacing: 2,
          cursor: canExchange ? 'pointer' : 'default',
          opacity: isProcessing ? 0.6 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {isProcessing ? '교환 중...' : '🪙 10코인 → 10포인트 교환'}
      </button>
      {disabledReason && (
        <div style={{
          fontSize: 11,
          color: 'var(--vb-text-dim)',
          fontFamily: 'var(--vb-font-body)',
        }}>
          {disabledReason}
        </div>
      )}
    </div>
  )
}
```

---

## src/pages/ResultPage.tsx

### 추가 import

```typescript
import { grantCoinExchange } from '../lib/ait'
import { PointExchangeButton } from '../components/result/PointExchangeButton'
```

### useGameStore 구독 확장 (coinBalance 출처)

현재 ResultPage.tsx의 `useGameStore()` 구독 라인:

```typescript
// 현재 (impl 06 이전)
const { score, stage, userId, baseScore, fullComboCount, maxComboStreak } = useGameStore()
```

**impl 06 적용 후** — `coinBalance` 추가 추출:

```typescript
// impl 06 이후
const { score, stage, userId, baseScore, fullComboCount, maxComboStreak,
  coinBalance  // [v0.4 F5] PointExchangeButton에 전달
} = useGameStore()
```

> **`revivalUsed` / `handleRevive` 는 이 파일에 없음**: impl 05 확정 결정에 따라 F4(부활)는
> ResultPage와 무관. `revivalUsed` 구독 및 `handleRevive` 핸들러는 ResultPage.tsx에 추가하지 않는다.

### useCoin 훅 확장 확인

현재 ResultPage.tsx: `const { addCoins } = useCoin()`

`addCoins`는 이미 구독 중 → **추가 선언 불필요**. `handleExchange`에서 그대로 사용한다.

### onExchange 핸들러

```typescript
async function handleExchange() {
  try {
    // 1. SDK 호출 — 성공 시에만 DB 차감
    await grantCoinExchange()
    // 2. 코인 차감 (DB 원자 처리)
    await addCoins(-10, 'toss_points_exchange')
    showToastMsg('🎉 10포인트 지급됐어요!')
  } catch (err) {
    console.error('[exchange] failed:', err)
    showToastMsg('교환 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요')
    // ⚠️ SDK 성공 후 addCoins 실패 시: 포인트 지급 완료 + 코인 미차감 상태
    // → 로그 기록 + "잠시 후 다시 시도" 안내. 완전한 롤백 불가 (SDK 비가역)
  }
}
```

### JSX: 버튼 영역에 PointExchangeButton 추가

> ⚠️ **RevivalButton은 ResultPage에 없다.** impl 05 확정 결정("ResultPage에 RevivalButton 통합 금지")에 따라
> RevivalButton은 `GameOverOverlay`에만 존재한다. 아래 스니펫에 RevivalButton을 추가하지 않는다.

```tsx
{/* 버튼 영역 */}
<div style={{ marginTop: 'auto', padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
  {/* [v0.4 F5] 포인트 교환 버튼 — RevivalButton 없음 (F4는 GameOverOverlay 전용) */}
  <PointExchangeButton
    coinBalance={coinBalance}
    onExchange={handleExchange}
  />

  <button onClick={onPlayAgain} disabled={!adDone} style={{ /* 기존 스타일 */ }}>
    PLAY AGAIN
  </button>
  <button onClick={onGoRanking} style={{ /* 기존 스타일 */ }}>
    View Rankings
  </button>
</div>
```

---

## 주의사항

- **SDK 선행, DB 후행 순서 절대 준수**: `grantCoinExchange()` → `addCoins(-10)`. 순서를 뒤집으면 DB 차감 성공 후 SDK 실패 시 코인 손실만 발생.
- **SDK 성공 + DB 실패 엣지 케이스**: 포인트는 지급됐으나 코인 미차감. 이 상태는 클라이언트에서 완전 복구 불가. 에러 메시지와 함께 콘솔 에러 기록. 운영 모니터링 대상.
- **샌드박스에서 `addCoins(-10)` 실행**: `grantCoinExchange()`가 no-op이므로 즉시 통과 후 DB 차감 실행. 샌드박스 DB에 `-10` 트랜잭션이 기록됨. 테스트 시 코인 잔액이 부족하면 차감이 음수가 되지 않도록 `GREATEST(0, ...)` 로직이 RPC에서 보호한다.
- `VITE_COIN_EXCHANGE_CODE` 미설정 시 fallback `'COIN_EXCHANGE'`. 운영 배포 전 RELEASE.md 항목 확인 필수.
- `grantDailyReward` 함수는 이 impl에서 삭제하지 않는다 (impl 02 범위). ait.ts에 함께 공존한다.

---

## 테스트 경계

- `coinBalance >= 10`: 버튼 활성, 클릭 → `grantCoinExchange()` no-op → `addCoins(-10)` → 토스트 "지급 완료" 표시
- `coinBalance < 10`: 버튼 비활성, "코인 10개가 필요합니다 (현재 N개)" 표시 (PRD F5 수용기준)
- SDK 실패(운영 환경): 토스트 "잠시 후 다시 시도", `addCoins` 미호출, coinBalance 유지
- 연속 클릭: `isProcessing` 플래그로 중복 호출 방지

---

## 의존 모듈

- **선행**: impl 01 (useCoin 훅) — `addCoins()` 사용
- **선행**: impl 05 (RevivalButton) — ResultPage 버튼 영역 구조 확립 후 추가
- **환경 선행 (운영)**: VITE_COIN_EXCHANGE_CODE 환경변수 등록 (RELEASE.md)
