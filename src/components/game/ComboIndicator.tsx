interface ComboIndicatorProps {
  comboStreak: number  // 현재 연속 풀콤보 스트릭 (0이면 비표시)
}

export function ComboIndicator({ comboStreak }: ComboIndicatorProps) {
  if (comboStreak === 0) return null

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      minHeight: 48,
    }}>
      {/* 콤보 스택 숫자 (comboStreak > 0일 때 상시 표시) */}
      {comboStreak > 0 && (
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 13,
          fontWeight: 800,
          color: 'var(--vb-accent)',
          letterSpacing: 2,
        }}>
          {`x${Math.floor(comboStreak / 5) + 1} COMBO STREAK`}
        </div>
      )}
    </div>
  )
}
