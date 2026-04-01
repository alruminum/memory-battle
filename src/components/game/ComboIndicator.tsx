interface ComboIndicatorProps {
  comboStreak: number    // 현재 연속 풀콤보 스트릭 (0이면 비표시)
  isComboActive: boolean // 현재 스테이지 내 300ms 이내 연속 입력 중 여부
}

export function ComboIndicator({ comboStreak, isComboActive }: ComboIndicatorProps) {
  if (comboStreak === 0 && !isComboActive) return null

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
          {`x${Math.min(comboStreak + 1, 5)} COMBO STREAK`}
        </div>
      )}

      {/* COMBO! 텍스트 -- 입력 중 300ms 이내 연속 입력 시 */}
      {isComboActive && (
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--vb-text-mid)',
          letterSpacing: 3,
          animation: 'pulse 0.3s ease-in-out',
        }}>
          COMBO!
        </div>
      )}
    </div>
  )
}
