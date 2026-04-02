/**
 * MainPage Variant A — 미니멀 중심형
 *
 * 컨셉: 버튼 패드만이 주인공. DAILY 랭킹을 헤더 우측에 인라인으로 녹이고,
 *       랭킹 아이콘은 우하단 플로팅 FAB으로 배치해 화면 최대한 단순화.
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
// Icons (inline SVG)
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
    position: 'relative' as const,
    overflow: 'hidden',
    animation: 'slide-up 0.4s ease-out',
  },
  header: {
    padding: '16px 20px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--vb-border)',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'var(--vb-font-score)',
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  titleAccent: {
    color: 'var(--vb-accent)',
  },
  rankBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'var(--vb-surface)',
    border: '1px solid var(--vb-border)',
    borderRadius: 20,
    padding: '4px 10px 4px 8px',
  },
  rankLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: 'var(--vb-text-dim)',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  rankValue: {
    fontFamily: 'var(--vb-font-score)',
    fontSize: 18,
    fontWeight: 900,
    color: 'var(--vb-accent)',
    lineHeight: 1,
  },
  padWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padOuter: {
    position: 'relative' as const,
    width: 300,
    height: 300,
  },
  padBody: {
    position: 'absolute' as const,
    inset: 0,
    borderRadius: 28,
    backgroundColor: 'var(--vb-surface)',
    border: '1px solid var(--vb-border)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  },
  startBtn: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 86,
    height: 86,
    borderRadius: '50%',
    border: '2px solid var(--vb-accent)',
    backgroundColor: 'var(--vb-surface-2)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 3,
    boxShadow: '0 0 20px rgba(212,168,67,0.25)',
  },
  startLabel: {
    fontFamily: 'var(--vb-font-score)',
    fontSize: 14,
    fontWeight: 900,
    color: 'var(--vb-accent)',
    letterSpacing: 1.5,
  },
  startSub: {
    fontFamily: 'var(--vb-font-body)',
    fontSize: 8,
    fontWeight: 600,
    color: 'var(--vb-text-dim)',
    letterSpacing: 1,
    marginTop: 1,
  },
  fab: {
    position: 'absolute' as const,
    bottom: 32,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: '50%',
    backgroundColor: 'var(--vb-surface)',
    border: '1px solid var(--vb-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  bestScore: {
    position: 'absolute' as const,
    bottom: 100,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
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
    fontSize: 15,
    fontWeight: 900,
    color: 'var(--vb-text-mid)',
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
function Header({ dailyRank, onRanking }: { dailyRank: number; onRanking: () => void }) {
  return (
    <div style={S.header}>
      <div style={S.title}>
        <span style={S.titleAccent}>M</span>EMORY BATTLE
      </div>
      <button onClick={onRanking} style={{ ...S.rankBadge, cursor: 'pointer', background: 'none' }} aria-label="랭킹 보기">
        <TrophyIcon size={14} color="var(--vb-accent)" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          <span style={S.rankLabel}>DAILY</span>
          <span style={S.rankValue}>#{dailyRank}</span>
        </div>
      </button>
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
        width: 118,
        height: 118,
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
        transform: `translate(-50%, -50%) ${pressed ? 'scale(0.96)' : 'scale(1)'}`,
        transition: 'transform 80ms ease, box-shadow 80ms ease',
        boxShadow: pressed ? 'none' : '0 0 20px rgba(212,168,67,0.25)',
      }}
      aria-label="게임 시작"
    >
      <span style={S.startLabel}>START</span>
      <span style={S.startSub}>TAP TO PLAY</span>
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
interface MainPageAProps {
  onStart: () => void
  onRanking: () => void
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export function MainPageA({ onStart, onRanking }: MainPageAProps) {
  const [toast] = useState<string | null>(null)

  return (
    <div style={S.root}>
      <Header dailyRank={DUMMY_DAILY_RANK} onRanking={onRanking} />

      <div style={S.padWrapper}>
        <ButtonPad onStart={onStart} />
      </div>

      {/* 베스트 스코어 — 버튼 패드 아래 여백에 작게 */}
      <div style={S.bestScore}>
        <span style={S.bestLabel}>BEST SCORE</span>
        <span style={S.bestValue}>{DUMMY_BEST_SCORE.toLocaleString()}</span>
      </div>

      {/* 랭킹 FAB */}
      <button
        onClick={onRanking}
        style={S.fab}
        aria-label="랭킹 보기"
      >
        <TrophyIcon size={22} color="var(--vb-accent)" />
      </button>

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  )
}

export default MainPageA
