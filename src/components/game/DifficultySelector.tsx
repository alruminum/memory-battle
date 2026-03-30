import type { Difficulty } from '../../types'

interface DifficultySelectorProps {
  value: Difficulty
  onChange: (d: Difficulty) => void
}

const DIFFICULTIES: {
  value: Difficulty
  label: string
  multiplier: string
  color: string
  glow: string
}[] = [
  { value: 'EASY',   label: 'EASY',   multiplier: 'x1', color: '#23C35B', glow: '#23C35B44' },
  { value: 'MEDIUM', label: 'NORMAL', multiplier: 'x2', color: '#3182F6', glow: '#3182F644' },
  { value: 'HARD',   label: 'HARD',   multiplier: 'x3', color: '#FF4444', glow: '#FF444444' },
]

export function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {DIFFICULTIES.map(({ value: d, label, multiplier, color, glow }) => {
        const isSelected = value === d
        return (
          <button
            key={d}
            onClick={() => onChange(d)}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 10,
              border: isSelected ? `1.5px solid ${color}` : '1.5px solid rgba(255,255,255,0.08)',
              backgroundColor: isSelected ? `${color}22` : 'rgba(255,255,255,0.03)',
              color: isSelected ? color : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1.5,
              cursor: 'pointer',
              lineHeight: 1.3,
              boxShadow: isSelected ? `0 0 12px ${glow}` : 'none',
              transition: 'all 150ms ease',
            }}
          >
            {label}
            <br />
            <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.7 }}>{multiplier}</span>
          </button>
        )
      })}
    </div>
  )
}
