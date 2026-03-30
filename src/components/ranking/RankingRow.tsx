interface RankingRowProps {
  rank: number
  userId: string
  score: number
  isMe: boolean
}

export function RankingRow({ rank, score, isMe }: RankingRowProps) {
  const displayName = isMe ? '나' : `익명 ${rank}`

  const rankText = rank > 0 ? `${rank}` : '-'
  const rankBadgeColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--text-muted)'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px',
        borderRadius: 10,
        backgroundColor: isMe ? 'rgba(255,105,0,0.15)' : 'transparent',
        border: isMe ? '1px solid rgba(255,105,0,0.3)' : '1px solid transparent',
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
          color: isMe ? 'var(--text-primary)' : 'var(--text-muted)',
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
          color: isMe ? '#FF6900' : 'var(--text-primary)',
          flexShrink: 0,
        }}
      >
        {score.toLocaleString()}
      </div>
    </div>
  )
}
