interface RankingTabProps {
  active: 'daily' | 'monthly' | 'season'
  onChange: (tab: 'daily' | 'monthly' | 'season') => void
}

const TABS: { key: 'daily' | 'monthly' | 'season'; label: string }[] = [
  { key: 'daily', label: '일간' },
  { key: 'monthly', label: '월간' },
  { key: 'season', label: '시즌' },
]

export function RankingTab({ active, onChange }: RankingTabProps) {
  return (
    <div
      style={{
        display: 'flex',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 4,
        gap: 4,
      }}
    >
      {TABS.map(({ key, label }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 9,
              border: 'none',
              backgroundColor: isActive ? '#D4A843' : 'transparent',
              color: isActive ? '#fff' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: isActive ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
