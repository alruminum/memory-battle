/**
 * MainPage Variant C — 게임 HUD형
 *
 * 컨셉: 상단을 게임 HUD 띠로 구성. BEST / STAGE / DAILY RANK를 나란히 배치.
 *       버튼 패드를 화면 하단까지 최대한 크게 키워 아케이드 느낌 극대화.
 *       랭킹 아이콘은 DAILY RANK 수치 옆 작은 차트 아이콘.
 *
 * 더미 데이터 사용 — 실제 연동은 engineer 단계에서 처리.
 */

import { useState } from 'react'

// ─────────────────────────────────────────────
// Dummy data
// ─────────────────────────────────────────────
const DUMMY_BEST_SCORE = 1250
const DUMMY_DAILY_RANK = 3
const DUMMY_STAGE = 0 // 대기 중

// ─────────────────────────────────────────────
// Button colors
// ─────────────────────────────────────────────
const BTN_COLORS = {
  orange: { base: '#e85d04', dim: '#7a3002' },
  blue:   { base: '#3a86ff', dim: '#1d4580' },
  green:  { base: '#38b000', dim: '#1d5e00' },
  yellow: { base: '#ffbe0b', dim: '#806004' },
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
function BarChartIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="12" width="4" height="9" rx="1" stroke={color} strokeWidth="1.8" />
      <rect x="10" y="7" width="4" height="14" rx="1" stroke={color} strokeWidth="1.8" />
      <rect x="17" y="3" width="4" height="18" rx="1" stroke={color} strokeWidth="1.8" />
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
  topBar: {
    padding: '14px 20px 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'var(--vb-font-score)',
    fontSize: 19,
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    lineHeight: 1,
  },
  titleAccent: {
    color: 'var(--vb-accent)',
  },
  season: {
    fontSize: 9,
    fontWeight: 700,
    color: 'var(--vb-text-dim)',
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
  },
  // HUD 행
  hudRow: {
    display: 'flex',
    alignItems: 'stretch',
    margin: '0 0 0',
    borderTop: '1px solid var(--vb-border)',
    borderBottom: '1px solid var(--vb-border)',
    backgroundColor: 'var(--vb-surface)',
    flexShrink: 0,
  },
  hudCell: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 8px',
    gap: 3,
  },
  hudDivider: {
    width: 1,
    backgroundColor: 'var(--vb-border)',
    flexShrink: 0,
  },
  hudLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: 'var(--vb-text-dim)',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  hudValue: {
    fontFamily: 'var(--vb-font-score)',
    fontSize: 28,
    fontWeight: 900,
    color: 'var(--vb-text)',
    lineHeight: 1,
  },
  hudValueAccent: {
    fontFamily: 'var(--vb-font-score)',
    fontSize: 28,
    fontWeight: 900,
    color: 'var(--vb-accent)',
    lineHeight: 1,
  },
  hudRankRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  hudRankBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(212,168,67,0.1)',
    border: '1px solid rgba(212,168,67,0.25)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  // 패드 영역
  padSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 16px',
  },
  padOuter: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: 320,
    aspectRatio: '1 / 1',
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
    width: 88,
    height: 88,
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
    fontSize: 15,
    fontWeight: 900,
    color: 'var(--vb-accent)',
    letterSpacing: 2,
  },
  startSub: {
    fontSize: 8,
    fontWeight: 600,
    color: 'var(--vb-text-dim)',
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase' as const,
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
function TopBar() {
  return (
    <div style={S.topBar}>
      <div style={S.title}>
        <span style={S.titleAccent}>M</span>EMORY BATTLE
      </div>
      <span style={S.season}>SEASON 1</span>
    </div>
  )
}

function HudRow({
  bestScore,
  stage,
  dailyRank,
  onRanking,
}: {
  bestScore: number
  stage: number
  dailyRank: number
  onRanking: () => void
}) {
  return (
    <div style={S.hudRow}>
      {/* BEST */}
      <div style={S.hudCell}>
        <span style={S.hudLabel}>BEST</span>
        <span style={S.hudValue}>{bestScore.toLocaleString()}</span>
      </div>
      <div style={S.hudDivider} />
      {/* STAGE */}
      <div style={S.hudCell}>
        <span style={S.hudLabel}>STAGE</span>
        <span style={S.hudValue}>{stage === 0 ? '—' : stage}</span>
      </div>
      <div style={S.hudDivider} />
      {/* DAILY RANK */}
      <div style={S.hudCell}>
        <span style={S.hudLabel}>DAILY RANK</span>
        <div style={S.hudRankRow}>
          <span style={S.hudValueAccent}>#{dailyRank}</span>
          <button onClick={onRanking} style={S.hudRankBtn} aria-label="랭킹 보기">
            <BarChartIcon size={13} color="var(--vb-accent)" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ColorButton({
  color,
  posStyle,
  onPress,
}: {
  color: BtnColor
  posStyle: React.CSSProperties
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
        ...posStyle,
        // 패드 크기 대비 비율로 계산 (32% of pad)
        width: '38%',
        height: '38%',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        background: `radial-gradient(circle at 38% 33%, ${c.dim}bb, ${c.dim})`,
        boxShadow: pressed
          ? `0 2px 0 ${c.dim}88, 0 4px 12px rgba(0,0,0,0.4)`
          : `0 6px 0 ${c.dim}88, 0 10px 24px rgba(0,0,0,0.5), inset 0 1px 0 ${c.base}44`,
        filter: pressed ? 'brightness(0.9)' : 'brightness(0.7)',
        transform: pressed ? 'translateY(2px)' : 'translateY(0)',
        zIndex: 2,
        transition: 'all 80ms ease',
      }}
      aria-label={color}
    />
  )
}

const PAD_CORNER_STYLES: Record<BtnColor, React.CSSProperties> = {
  orange: { top: 0, left: 0 },
  blue:   { top: 0, right: 0 },
  green:  { bottom: 0, left: 0 },
  yellow: { bottom: 0, right: 0 },
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
      <span style={S.startSub}>tap to play</span>
    </button>
  )
}

function ButtonPad({ onStart }: { onStart: () => void }) {
  return (
    <div style={S.padOuter}>
      <div style={S.padBody} />
      {CORNER_POS.map(({ color }) => (
        <ColorButton
          key={color}
          color={color}
          posStyle={PAD_CORNER_STYLES[color]}
          onPress={onStart}
        />
      ))}
      <StartButton onPress={onStart} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface MainPageCProps {
  onStart: () => void
  onRanking: () => void
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export function MainPageC({ onStart, onRanking }: MainPageCProps) {
  const [toast] = useState<string | null>(null)

  return (
    <div style={S.root}>
      <TopBar />
      <HudRow
        bestScore={DUMMY_BEST_SCORE}
        stage={DUMMY_STAGE}
        dailyRank={DUMMY_DAILY_RANK}
        onRanking={onRanking}
      />
      <div style={S.padSection}>
        <ButtonPad onStart={onStart} />
      </div>
      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  )
}

export default MainPageC
