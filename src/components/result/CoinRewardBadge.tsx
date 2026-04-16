import { useEffect, useRef } from 'react'

interface CoinRewardBadgeProps {
  amount: number          // 지급된 코인 수
  onDismiss?: () => void  // 3초 후 자동 dismiss 완료 콜백 (optional)
}

export function CoinRewardBadge({ amount, onDismiss }: CoinRewardBadgeProps) {
  // useRef로 콜백 캡처 — 의존성 배열을 [] 고정해 마운트 시 1회만 타이머 설정
  // ResultPage가 리렌더되어 인라인 () => setCoinReward(null) 참조가 바뀌어도
  // 타이머가 재설정(drift)되지 않는다
  const onDismissRef = useRef(onDismiss)

  useEffect(() => {
    if (!onDismissRef.current) return
    const timer = setTimeout(() => onDismissRef.current?.(), 3000)
    return () => clearTimeout(timer)
  }, []) // 마운트 시 1회 — onDismissRef.current로 최신 콜백 참조

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'var(--vb-toast-bg)',
      color: 'var(--vb-accent)',
      padding: '10px 20px',
      borderRadius: 24,
      fontSize: 14,
      fontFamily: 'var(--vb-font-body)',
      fontWeight: 700,
      whiteSpace: 'nowrap',
      zIndex: 200,
      border: '1px solid var(--vb-border)',
    }}>
      🪙 +{amount} 코인 획득!
    </div>
  )
}
