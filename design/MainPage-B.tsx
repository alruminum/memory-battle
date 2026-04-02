/**
 * MainPage Variant B — 카드 레이아웃형
 *
 * 컨셉: DAILY 랭킹을 골드 보더 카드로 크게 강조.
 *       넉넉한 여백으로 고급스럽고 차분한 분위기.
 *       랭킹 아이콘 버튼은 헤더 우측에 위치.
 *
 * 더미 데이터 사용 — 실제 연동은 engineer 단계에서 처리.
 */

import { useState } from 'react'

// ─────────────────────────────────────────────
// Dummy data
// ─────────────────────────────────────────────
const DUMMY_DAILY_RANK = 3
const DUMMY_BEST_SCORE = 1250

// ─────────────────────────────────────────────
// Button colors
// ─────────────────────────────────────────────
const BTN_COLORS = {
  orange: { base: '#e85d04', dim: '#7a3002', ring: '#e85d0444' },
  blue:   { base: '#3a86ff', dim: '#1d4580', ring: '#3a86ff44' },
  green:  { base: '#38b000', dim: '#1d5e00', ring: '#38b00044' },
  yellow: { base: '#ffbe0b', dim: '#806004', ring: '#ffbe0b44' },
} as const

type BtnColor = keyof typeof BTN_COLORS

const CORNER_POS: { color: BtnColor; top?: number; bottom?: number; left?: number; right?: number }[] = [
  { color: 'orange', top: 0,    left: 0 },
  { color: 'blue',   top: 0,    right: 0 },
  { color: 'green',  bottom: 0, left: 0 },
  { color: 'yellow', bottom: 0, right: 0 },
]

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────
function TrophyIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 2h12v6a6 6 0 01-12 0V2zM2 4h4M18 4h4M12 14v4M8 22h8M10 18h4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MedalIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="14" r="7" stroke="var(--vb-accent)" strokeWidth="1.8" />
      <path d="M8 4l2 6M16 4l-2 6M9 4h6" stroke="var(--vb-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <text x="12" y="18" textAnchor="middle" fontSize="8" fontWeight="900" fill="var(--vb-accent)" fontFamily="Barlow Condensed, sans-serif">#</text>
    </svg>
  )
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const S = {
  root: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: 'var(--vb-bg)',
    color: 'var(--vb-text)',
    fontFamily: 'var(--vb-font-body)',
    overflow: 'hidden',
    animation: 'slide-up 0.4s ease-out',
  },
  header: {
    padding: '18px 20px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  season: {
    fontSize: 9,
    fontWeight: 700,
    color: 'var(--vb-text-dim)',
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
  },
  title: {
    fontFamily: 'var(--vb-font-score)',
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    lineHeight: 1,
  },
  titleAccent: {
    color: 'var(--vb-accent)',
  },
  rankingBtn: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    backgroundColor: 'var(--vb-surface)',
    border: '1px solid var(--vb-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  rankCard: {
    margin: '0 20px 20px',
    borderRadius: 16,
    border: '1px solid var(--vb-accent)',
    backgroundColor: 'var(--vb-surface)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  rankCardGlow: {
    position: 'absolute' as const,
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: '50%',
    backgroundColor: 'rgba(212,168,67,0.06)',
    pointerEvents: 'none' as const,
  },
  rankCardLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  rankCardLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  rankCardLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--vb-text-dim)',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  rankCardDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    backgroundColor: 'var(--vb-accent)',
    display: 'inline-block',
  },
  rankCardValue: {
    fontFamily: 'var(--vb-font-score)',
    fontSize: 44,
    fontWeight: 900,
    color: 'var(--vb-accent)',
    lineHeight: 1,
    letterSpacing: -1,
  },
  rankCardSub: {
    fontSize: 10,
    color: 'var(--vb-text-dim)',
    fontWeight: 600,
  },
  bestScoreBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: 3,
  },
  bestLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: 'var(--vb-text-dim)',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  bestValue: {
    fontFamily: 'var(--vb-font-score)',
    fontSize: 22,
    fontWeight: 900,
    color: 'var(--vb-text-mid)',
    lineHeight: 1,
  },
  padWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 28,
  },
  padOuter: {
    position: 'relative' as const,
    width: 288,
    height: 288,
  },
  padBody: {
    position: 'absolute' as const,
    inset: 0,
    borderRadius: 26,
    backgroundColor: 'var(--vb-surface)',
    border: '1px solid var(--vb-border)',
    boxShadow: '0 16px 50px rgba(0,0,0,0.55)',
  },
  startBtn: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 82,
    height: 82,
    borderRadius: '50%',
    border: '2px solid var(--vb-accent)',
    backgroundColor: 'var(--vb-surface-2)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 3,
  },
  startLabel: {
    fontFamily: 'var(--vb-font-score)',
    fontSize: 13,
    fontWeight: 900,
    color: 'var(--vb-accent)',
    letterSpacing: 1.5,
  },
  toast: {
    position: 'fixed' as const,
    bottom: 32,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0,0,0,0.85)',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 10,
    fontSize: 13,
    whiteSpace: 'nowrap' as const,
    zIndex: 9999,
    fontFamily: 'var(--vb-font-body)',
  },
} as const

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
function Header({ onRanking }: { onRanking: () => void }) {
  return (
    <div style={S.header}>
      <div style={S.titleBlock}>
        <span style={S.season}>SEASON 1</span>
        <div style={S.title}>
          <span style={S.titleAccent}>M</span>EMORY BATTLE
        </div>
      </div>
      <button onClick={onRanking} style={S.rankingBtn} aria-label="랭킹 보기">
        <TrophyIcon size={20} color="var(--vb-accent)" />
      </button>
    </div>
  )
}

function RankCard({ dailyRank, bestScore }: { dailyRank: number; bestScore: number }) {
  return (
    <div style={S.rankCard}>
      <div style={S.rankCardGlow} />
      <div style={S.rankCardLeft}>
        <div style={S.rankCardLabelRow}>
          <span style={S.rankCardDot} />
          <span style={S.rankCardLabel}>DAILY RANK</span>
        </div>
        <div style={S.rankCardValue}>#{dailyRank}</div>
        <span style={S.rankCardSub}>오늘의 랭킹</span>
      </div>
      <div style={S.bestScoreBlock}>
        <MedalIcon size={32} />
        <span style={S.bestLabel}>BEST</span>
        <span style={S.bestValue}>{bestScore.toLocaleString()}</span>
      </div>
    </div>
  )
}

function ColorButton({
  color,
  pos,
  onPress,
}: {
  color: BtnColor
  pos: { top?: number; bottom?: number; left?: number; right?: number }
  onPress: () => void
}) {
  const c = BTN_COLORS[color]
  const [pressed, setPressed] = useState(false)

  function handlePress() {
    setPressed(true)
    setTimeout(() => setPressed(false), 120)
    onPress()
  }

  return (
    <button
      onPointerDown={handlePress}
      style={{
        position: 'absolute',
        ...(pos as React.CSSProperties),
        width: 113,
        height: 113,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        background: `radial-gradient(circle at 38% 33%, ${c.dim}bb, ${c.dim})`,
        boxShadow: pressed
          ? `0 2px 0 ${c.dim}88, 0 4px 12px rgba(0,0,0,0.4)`
          : `0 6px 0 ${c.dim}88, 0 10px 20px rgba(0,0,0,0.5), inset 0 1px 0 ${c.base}44`,
        filter: pressed ? 'brightness(0.9)' : 'brightness(0.7)',
        transform: pressed ? 'translateY(2px)' : 'translateY(0)',
        zIndex: 2,
        transition: 'all 80ms ease',
      }}
      aria-label={color}
    />
  )
}

function StartButton({ onPress }: { onPress: () => void }) {
  const [pressed, setPressed] = useState(false)

  function handlePress() {
    setPressed(true)
    setTimeout(() => setPressed(false), 100)
    onPress()
  }

  return (
    <button
      onPointerDown={handlePress}
      style={{
        ...S.startBtn,
        transform: `translate(-50%, -50%) ${pressed ? 'scale(0.95)' : 'scale(1)'}`,
        boxShadow: pressed ? 'none' : '0 0 24px rgba(212,168,67,0.3)',
        transition: 'transform 80ms ease, box-shadow 80ms ease',
      }}
      aria-label="게임 시작"
    >
      <span style={S.startLabel}>START</span>
    </button>
  )
}

function ButtonPad({ onStart }: { onStart: () => void }) {
  return (
    <div style={S.padOuter}>
      <div style={S.padBody} />
      {CORNER_POS.map(({ color, ...pos }) => (
        <ColorButton key={color} color={color} pos={pos} onPress={onStart} />
      ))}
      <StartButton onPress={onStart} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface MainPageBProps {
  onStart: () => void
  onRanking: () => void
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export function MainPageB({ onStart, onRanking }: MainPageBProps) {
  const [toast] = useState<string | null>(null)

  return (
    <div style={S.root}>
      <Header onRanking={onRanking} />
      <RankCard dailyRank={DUMMY_DAILY_RANK} bestScore={DUMMY_BEST_SCORE} />
      <div style={S.padWrapper}>
        <ButtonPad onStart={onStart} />
      </div>
      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  )
}

export default MainPageB
