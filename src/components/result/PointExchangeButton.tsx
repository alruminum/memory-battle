import { useState } from 'react'
import { COIN_EXCHANGE_AMOUNT } from '../../lib/ait'
import { CoinIcon } from './CoinIcon'

interface PointExchangeButtonProps {
  coinBalance: number              // 현재 잔액
  onExchange: () => Promise<void>  // 교환 실행 콜백 (비동기: grantCoinExchange → addCoins)
}

export function PointExchangeButton({ coinBalance, onExchange }: PointExchangeButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const canExchange = coinBalance >= COIN_EXCHANGE_AMOUNT

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
        {isProcessing ? '교환 중...' : (
          <>
            <CoinIcon size={16} />
            <span>{COIN_EXCHANGE_AMOUNT}코인 → {COIN_EXCHANGE_AMOUNT}포인트 교환</span>
          </>
        )}
      </button>
    </div>
  )
}
