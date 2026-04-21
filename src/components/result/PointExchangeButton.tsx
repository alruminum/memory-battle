import { useState } from 'react'
import { COIN_EXCHANGE_AMOUNT } from '../../lib/ait'
import { CoinIcon } from './CoinIcon'

// [v0.4.2] 1인 누적 교환 한도 (토스포인트)
const EXCHANGE_LIMIT = 5000

interface PointExchangeButtonProps {
  coinBalance: number              // 현재 잔액
  lifetimeExchanged: number        // [v0.4.2 F5] 누적 교환 포인트
  onExchange: () => Promise<void>  // 교환 실행 콜백 (비동기: grantCoinExchange → addCoins)
}

export function PointExchangeButton({ coinBalance, lifetimeExchanged, onExchange }: PointExchangeButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  // 한도 도달 여부 — balance와 무관하게 우선 판단
  const isLimitReached = lifetimeExchanged >= EXCHANGE_LIMIT
  // 잔액 부족
  const isBalanceInsufficient = coinBalance < COIN_EXCHANGE_AMOUNT
  // 교환 가능 = 한도 미도달 AND 잔액 충분
  const canExchange = !isLimitReached && !isBalanceInsufficient

  // 버튼 텍스트 — 한도 도달 시 교체, 코인 부족은 텍스트 유지 (외부 안내 텍스트 없음 — #152)
  const buttonLabel = isLimitReached
    ? '포인트 한도에 도달했습니다'
    : isProcessing
      ? '교환 중...'
      : `${COIN_EXCHANGE_AMOUNT}코인 → ${COIN_EXCHANGE_AMOUNT}포인트 교환`

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
    <div style={{ display: 'flex', alignItems: 'center' }}>
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {/* 코인 아이콘은 한도 미도달 + 처리 중이 아닐 때만 표시 */}
        {!isLimitReached && !isProcessing && <CoinIcon size={16} />}
        <span>{buttonLabel}</span>
      </button>
    </div>
  )
}
