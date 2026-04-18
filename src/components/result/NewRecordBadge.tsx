import { CoinIcon } from './CoinIcon'

export function NewRecordBadge() {
  return (
    <div
      role="status"
      aria-label="개인 최고 기록 달성"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 999,
        border: '1px solid var(--vb-accent)',
        backgroundColor: 'transparent',
        animation: 'nr-badge-fade-in 300ms ease-out both',
      }}
    >
      <span style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--vb-accent)',
        letterSpacing: 1.5,
      }}>
        🏆 PERSONAL BEST
      </span>
      <span style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--vb-accent)',
      }}>
        +1
      </span>
      <CoinIcon size={14} />
    </div>
  )
}
