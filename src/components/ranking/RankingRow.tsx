interface RankingRowProps {
  rank: number
  score: number
  isMe: boolean
}

export function RankingRow({ rank, score, isMe }: RankingRowProps) {
  const displayName = isMe ? '나' : `익명 ${rank}`

  const rankText = rank > 0 ? `${rank}` : '-'
  const rankBadgeColor = rank === 1 ? 'var(--vb-rank-gold)' : rank === 2 ? 'var(--vb-rank-silver)' : rank === 3 ? 'var(--vb-rank-bronze)' : 'var(--vb-text-dim)'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px',
        borderRadius: 10,
        backgroundColor: isMe ? 'var(--vb-highlight-bg)' : 'transparent',
        border: isMe ? '1px solid var(--vb-highlight-border)' : '1px solid transparent',
        gap: 12,
      }}
    >
      {/* 순위 */}
      <div
        style={{
          width: 28,
          textAlign: 'center',
          fontSize: rank > 0 && rank <= 3 ? 16 : 13,
          fontWeight: 900,
          color: rankBadgeColor,
          flexShrink: 0,
        }}
      >
        {rankText}
      </div>

      {/* 유저명 */}
      <div
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: isMe ? 700 : 400,
          color: isMe ? 'var(--vb-text)' : 'var(--vb-text-mid)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {displayName}
      </div>

      {/* 점수 */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: isMe ? 'var(--vb-accent)' : 'var(--vb-text)',
          flexShrink: 0,
        }}
      >
        {score.toLocaleString()}
      </div>
    </div>
  )
}
