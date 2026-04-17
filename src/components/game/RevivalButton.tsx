import React from 'react'

interface RevivalButtonProps {
  coinBalance: number       // 현재 잔액
  revivalUsed: boolean      // 이 판 부활 사용 여부
  isProcessing: boolean     // 코인 차감 처리 중 (F4)
  isAdLoading: boolean      // 광고 로딩/진행 중 (F4-AD)
  onRevive: (e: React.PointerEvent) => void     // 코인 부활 (F4)
  onAdRevive: (e: React.PointerEvent) => void   // 광고 부활 (F4-AD)
}

export function RevivalButton({
  coinBalance,
  revivalUsed,
  isProcessing,
  isAdLoading,
  onRevive,
  onAdRevive,
}: RevivalButtonProps): React.ReactElement | null {
  if (revivalUsed) return null

  const canCoinRevive = coinBalance >= 5
  const isAnyProcessing = isProcessing || isAdLoading

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}
      onPointerDown={(e) => e.stopPropagation()}  // backdrop onPointerDown={onConfirm} 버블링 차단
    >
      {/* 광고 부활 버튼 — revivalUsed=false 이면 항상 표시 */}
      <button
        onPointerDown={!isAnyProcessing ? onAdRevive : (e) => e.stopPropagation()}
        disabled={isAnyProcessing}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 8,
          border: '1px solid var(--vb-accent)',
          backgroundColor: 'transparent',
          color: 'var(--vb-accent)',
          fontFamily: 'var(--vb-font-score)',
          fontSize: 14,
          fontWeight: 900,
          letterSpacing: 2,
          cursor: 'pointer',
          opacity: isAnyProcessing ? 0.6 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {isAdLoading ? '광고 로딩 중...' : '광고 보고 부활'}
      </button>

      {/* 코인 부활 버튼 — 잔액≥5 일 때만 표시 */}
      {canCoinRevive && (
        <button
          onPointerDown={!isAnyProcessing ? onRevive : (e) => e.stopPropagation()}
          disabled={isAnyProcessing}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 8,
            border: '1px solid var(--vb-border)',
            backgroundColor: 'transparent',
            color: 'var(--vb-text-dim)',
            fontFamily: 'var(--vb-font-score)',
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: 2,
            cursor: 'pointer',
            opacity: isAnyProcessing ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {isProcessing ? '처리 중...' : '🪙 5코인으로 부활'}
        </button>
      )}
    </div>
  )
}
