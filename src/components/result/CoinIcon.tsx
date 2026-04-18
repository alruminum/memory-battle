interface CoinIconProps {
  size?: 14 | 16 | 20
  style?: React.CSSProperties
}

export function CoinIcon({ size = 16, style }: CoinIconProps) {
  // gradient id를 size별로 분리 — 동일 페이지에 여러 크기 공존 시 충돌 방지
  const gradId = `coin-grad-${size}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-label="코인"
      role="img"
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#FFE08A" />
          <stop offset="55%"  stopColor="#D4A843" />
          <stop offset="100%" stopColor="#8B7332" />
        </radialGradient>
      </defs>
      {/* 코인 본체 — 타원으로 원근감 표현 */}
      <ellipse cx="10" cy="10.5" rx="9" ry="8" fill={`url(#${gradId})`} />
      {/* 상단 하이라이트 — 광원 반사 질감 */}
      <ellipse cx="9" cy="8" rx="4" ry="2.5" fill="rgba(255,255,255,0.25)" />
    </svg>
  )
}
