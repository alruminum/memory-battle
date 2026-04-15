import { useState, useEffect, useCallback } from 'react'

const BLOCK_HEIGHTS = [8, 10, 12, 14, 16]  // px, 인덱스 0(좌)→4(우), 높이 차등

interface ComboIndicatorProps {
  comboStreak: number
  isBreaking?: boolean  // [신규] true 시 쉐이크 애니메이션 트리거
}

export function ComboIndicator({ comboStreak, isBreaking = false }: ComboIndicatorProps) {
  const [isShaking, setIsShaking] = useState(false)

  // isBreaking 상태 머신: false → 즉시 리셋 / true → 쉐이크 시작
  useEffect(() => {
    if (isBreaking) {
      setIsShaking(true)
    } else {
      setIsShaking(false)  // 게임 재시작 시 즉시 정지
    }
  }, [isBreaking])

  const handleAnimationEnd = useCallback((e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === 'comboBreakShake') {
      setIsShaking(false)  // 애니메이션 완료 후 클래스 제거
    }
  }, [])

  // [#95] streak=0 early return 제거 — 5칸 빈 블록 + x1 항상 표시 (docs/ui-spec.md ComboIndicator 표시 규칙)
  const multiplier = Math.floor(comboStreak / 5) + 1
  const filledCount = comboStreak % 5   // 0: 막 배율 상승 직후(빈 상태), 1~4: 진행 중

  return (
    <div
      className={isShaking ? 'combo-break-shake' : undefined}
      onAnimationEnd={isShaking ? handleAnimationEnd : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '4px 14px',
      }}
    >
      {/* 좌: 블록 5칸 */}
      <div style={{
        display: 'flex',
        gap: 3,
        alignItems: 'flex-end',
        height: 20,
      }}>
        {BLOCK_HEIGHTS.map((h, i) => {
          const isFilled = i < filledCount
          return (
            <div
              key={i}
              style={{
                width: 10,
                height: h,
                borderRadius: '2px 2px 0 0',
                background: isFilled ? 'var(--vb-accent)' : 'var(--vb-border)',
                transformOrigin: 'bottom',
                animation: (isFilled && i === filledCount - 1) ? 'blockPop 0.3s ease' : 'none',
                boxShadow: isFilled ? '0 0 7px 2px rgba(212, 168, 67, 0.5)' : 'none',  // amber glow
              }}
            />
          )
        })}
      </div>

      {/* 우: x{배율} 숫자 */}
      <div style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 18,
        fontWeight: 900,
        color: 'var(--vb-accent)',
        lineHeight: 1,
      }}>
        {multiplier}x
      </div>
    </div>
  )
}
