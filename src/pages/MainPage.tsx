import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { useRanking } from '../hooks/useRanking'
import { useDailyReward } from '../hooks/useDailyReward'
import { getUserId } from '../lib/ait'

interface MainPageProps {
  onStart: () => void
  onRanking: () => void
}

const BTN_COLORS = {
  orange: { base: '#e85d04', dim: '#7a3002', ring: '#e85d0444' },
  blue:   { base: '#3a86ff', dim: '#1d4580', ring: '#3a86ff44' },
  green:  { base: '#38b000', dim: '#1d5e00', ring: '#38b00044' },
  yellow: { base: '#ffbe0b', dim: '#806004', ring: '#ffbe0b44' },
}

const CORNER_POS: { color: keyof typeof BTN_COLORS; top?: number; bottom?: number; left?: number; right?: number }[] = [
  { color: 'orange', top: 0,    left: 0 },
  { color: 'blue',   top: 0,    right: 0 },
  { color: 'green',  bottom: 0, left: 0 },
  { color: 'yellow', bottom: 0, right: 0 },
]

export function MainPage({ onStart, onRanking }: MainPageProps) {
  const { userId, setUserId } = useGameStore()
  const ranking = useRanking(userId || null)
  const { hasTodayReward } = useDailyReward()

  const [isInitializing, setIsInitializing] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    ;(async () => {
      setIsInitializing(true)
      try {
        const uid = await getUserId()
        setUserId(uid)
        ranking.refetch()
      } catch {
        showToast('랭킹 연동 실패. 오프라인 모드로 진행됩니다')
      } finally {
        setIsInitializing(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleStart() {
    onStart()
  }

  const startDisabled = isInitializing

  const rankLabel = (rank: number, loading: boolean) => {
    if (loading) return '#—'
    if (rank === 0) return '#—'
    return `#${rank}`
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--vb-bg)',
        color: 'var(--vb-text)',
        fontFamily: 'var(--vb-font-body)',
        animation: 'slide-up 0.4s ease-out',
      }}
    >
      {/* 상단 바 */}
      <div style={{
        padding: '16px 20px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--vb-border)',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}>
          <span style={{ color: 'var(--vb-accent)' }}>M</span>EMORY BATTLE
        </div>
        <div style={{
          fontSize: 10,
          color: 'var(--vb-text-dim)',
          fontWeight: 600,
          letterSpacing: 1,
        }}>SEASON 1</div>
      </div>

      {/* 스코어보드 행 */}
      <div style={{
        display: 'flex',
        margin: '16px 20px 0',
        backgroundColor: 'var(--vb-surface)',
        borderRadius: 8,
        border: '1px solid var(--vb-border)',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {(
          [
            { label: 'Daily',   rank: ranking.myRanks.daily },
            { label: 'Monthly', rank: ranking.myRanks.monthly },
            { label: 'Season',  rank: ranking.myRanks.season },
          ] as const
        ).map(({ label, rank }, i, arr) => (
          <div key={label} style={{ display: 'flex', flex: 1 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px 0',
              flex: 1,
            }}>
              <div style={{
                fontFamily: 'var(--vb-font-body)',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--vb-text-dim)',
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 4,
              }}>{label}</div>
              <div style={{
                fontFamily: 'var(--vb-font-score)',
                fontSize: 22,
                fontWeight: 900,
                color: 'var(--vb-text)',
              }}>{rankLabel(rank, ranking.isLoading)}</div>
            </div>
            {i < arr.length - 1 && (
              <div style={{ width: 1, backgroundColor: 'var(--vb-border)' }} />
            )}
          </div>
        ))}
      </div>

      {hasTodayReward && (
        <div style={{
          margin: '12px 20px 0',
          textAlign: 'center',
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: 12,
            color: 'var(--vb-accent)',
            fontFamily: 'var(--vb-font-body)',
            fontWeight: 600,
          }}>
            오늘 포인트 수령 완료 ✓
          </span>
        </div>
      )}

      {/* 버튼 패드 — 292x292, 중앙 START */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 292, height: 292 }}>
          {/* 바디 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 24,
            backgroundColor: 'var(--vb-surface)',
            border: '1px solid var(--vb-border)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          }} />
          {/* 4색 원형 버튼 */}
          {CORNER_POS.map(({ color, ...pos }) => {
            const c = BTN_COLORS[color]
            return (
              <button
                key={color}
                onClick={!startDisabled ? handleStart : undefined}
                style={{
                  position: 'absolute',
                  ...(pos as React.CSSProperties),
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: startDisabled ? 'default' : 'pointer',
                  background: `radial-gradient(circle at 40% 35%, ${c.dim}, ${c.dim}cc)`,
                  boxShadow: `0 6px 0 ${c.dim}88, 0 8px 16px rgba(0,0,0,0.4)`,
                  filter: startDisabled ? 'brightness(0.4)' : 'brightness(0.65)',
                  zIndex: 2,
                  transition: 'filter 150ms ease',
                }}
              />
            )
          })}
          {/* 중앙 START 원 */}
          <button
            onClick={!startDisabled ? handleStart : undefined}
            disabled={startDisabled}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: `2px solid ${startDisabled ? 'var(--vb-border)' : 'var(--vb-accent)'}`,
              backgroundColor: 'var(--vb-surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: startDisabled ? 'default' : 'pointer',
              zIndex: 3,
            }}
          >
            <span style={{
              fontFamily: 'var(--vb-font-score)',
              fontSize: 13,
              fontWeight: 900,
              color: startDisabled ? 'var(--vb-text-dim)' : 'var(--vb-accent)',
              letterSpacing: 1,
            }}>
              {isInitializing ? '...' : 'START'}
            </span>
          </button>
        </div>
      </div>

      {/* View Rankings 버튼 */}
      <div style={{ padding: '0 20px 32px', flexShrink: 0 }}>
        <button
          onClick={onRanking}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 8,
            border: '1px solid var(--vb-border)',
            backgroundColor: 'transparent',
            color: 'var(--vb-text-mid)',
            fontFamily: 'var(--vb-font-body)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          View Rankings
        </button>
      </div>

      {/* 토스트 */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.85)',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: 10,
          fontSize: 13,
          whiteSpace: 'nowrap',
          zIndex: 9999,
          fontFamily: 'var(--vb-font-body)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
