const BLOCK_HEIGHTS = [8, 10, 12, 14, 16]  // px, 인덱스 0(좌)→4(우), 높이 차등

interface ComboIndicatorProps {
  comboStreak: number
}

export function ComboIndicator({ comboStreak }: ComboIndicatorProps) {
  if (comboStreak === 0) return null

  const multiplier = Math.floor(comboStreak / 5) + 1
  const filledCount = comboStreak % 5   // 0: 막 배율 상승 직후(빈 상태), 1~4: 진행 중

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '4px 14px',
    }}>
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
        x{multiplier}
      </div>
    </div>
  )
}
