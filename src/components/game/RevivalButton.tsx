import React from 'react'

interface RevivalButtonProps {
  coinBalance: number       // 현재 잔액
  revivalUsed: boolean      // 이 판 부활 사용 여부
  isProcessing: boolean     // 외부에서 관리 (GameOverOverlay가 처리 중 상태를 제어)
  onRevive: (e: React.PointerEvent) => void  // 포인터 이벤트 전달 (stopPropagation 처리)
}

export function RevivalButton({ coinBalance, revivalUsed, isProcessing, onRevive }: RevivalButtonProps): React.ReactElement | null {
  const canRevive = !revivalUsed && coinBalance >= 5
  if (!canRevive) return null

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}
      onPointerDown={(e) => e.stopPropagation()}  // backdrop onPointerDown={onConfirm} 버블링 차단
    >
      <button
        onPointerDown={!isProcessing ? onRevive : (e) => e.stopPropagation()}
        disabled={isProcessing}
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
          opacity: isProcessing ? 0.6 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {isProcessing ? '처리 중...' : '🪙 5코인으로 부활'}
      </button>
    </div>
  )
}
