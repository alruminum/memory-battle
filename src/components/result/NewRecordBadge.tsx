const BADGE_GOLD = '#D4A843';
const BADGE_GOLD_DARK = '#8B7332';
const BADGE_BORDER = '#FFFFFF18';
const BADGE_GLOW = '#D4A84340';

export function NewRecordBadge() {
  return (
    <div
      role="status"
      aria-label="개인 최고 기록 달성"
      aria-live="polite"
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-block',
        backgroundColor: '#18181b',
        border: `1px solid ${BADGE_BORDER}`,
        borderRadius: 6,
        boxShadow: `0 0 12px ${BADGE_GLOW}`,
        animation: 'nr-badge-fade-in 300ms ease-out both',
      }}
    >
      {/* cLeftBar — 왼쪽 골드 그라디언트 세로 바 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 3,
          height: 56,
          background: `linear-gradient(180deg, ${BADGE_GOLD} 0%, ${BADGE_GOLD_DARK} 100%)`,
          transformOrigin: 'top center',
          animation: 'nr-bar-grow 350ms ease-out both',
        }}
      />

      {/* cContent — 텍스트 컨테이너 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          padding: '10px 14px 10px 17px',
          justifyContent: 'center',
          animation: 'nr-content-slide-in 350ms ease-out 80ms both',
        }}
      >
        {/* NEW RECORD 메인 타이틀 */}
        <span
          style={{
            fontFamily: 'var(--vb-font-score)',
            fontSize: 20,
            fontWeight: 900,
            color: '#F5F5F5',
            letterSpacing: 3,
            lineHeight: 1,
          }}
        >
          NEW RECORD
        </span>

        {/* cSubRow — 구분선 + PERSONAL BEST */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {/* divider-line */}
          <div
            style={{
              width: 12,
              height: 1,
              backgroundColor: BADGE_GOLD,
              flexShrink: 0,
            }}
          />
          {/* PERSONAL BEST 서브 레이블 */}
          <span
            style={{
              fontFamily: 'var(--vb-font-score)',
              fontSize: 8,
              fontWeight: 700,
              color: BADGE_GOLD,
              letterSpacing: 2,
              lineHeight: 1,
            }}
          >
            PERSONAL BEST
          </span>
        </div>
      </div>
    </div>
  )
}
