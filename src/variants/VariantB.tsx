import React, { useState } from 'react'

/**
 * Variant B — MINIMAL DARK SPORTS
 * 무채색 다크 + 단일 포인트 컬러(전기 라임), 스코어보드 UI,
 * 정보 밀도 높고 클린한 경기 중계 느낌
 * Google Font: Barlow Condensed (스코어보드), Space Grotesk (본문)
 */

const STYLE_TAG = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;800;900&family=Space+Grotesk:wght@400;600;700&display=swap');

@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

@keyframes pulse-accent {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.7; }
}

@keyframes timer-shrink {
  from { width: 100%; }
  to   { width: 0%; }
}

@keyframes badge-shine {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

:root {
  --vb-bg: #0e0e10;
  --vb-surface: #18181b;
  --vb-surface-2: #1f1f23;
  --vb-border: #2a2a2e;
  --vb-accent: #c8ff00;
  --vb-accent-dim: #6b8a00;
  --vb-text: #e8e8ea;
  --vb-text-mid: #8b8b90;
  --vb-text-dim: #505055;
  --vb-danger: #ff3b3b;
  --vb-font-score: 'Barlow Condensed', sans-serif;
  --vb-font-body: 'Space Grotesk', sans-serif;
}
`

// ---- Button colors (muted but distinct) ----
const BTN_COLORS = {
  orange: { base: '#e85d04', dim: '#7a3002', ring: '#e85d0444' },
  blue:   { base: '#3a86ff', dim: '#1d4580', ring: '#3a86ff44' },
  green:  { base: '#38b000', dim: '#1d5e00', ring: '#38b00044' },
  yellow: { base: '#ffbe0b', dim: '#806004', ring: '#ffbe0b44' },
}

const CORNER_POS = [
  { color: 'orange' as const, top: 0, left: 0 },
  { color: 'blue' as const, top: 0, right: 0 },
  { color: 'green' as const, bottom: 0, left: 0 },
  { color: 'yellow' as const, bottom: 0, right: 0 },
]

// ---- Stat Pill ----
function StatPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
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
        textTransform: 'uppercase' as const,
        letterSpacing: 2,
        marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 22,
        fontWeight: 900,
        color: accent ? 'var(--vb-accent)' : 'var(--vb-text)',
      }}>{value}</div>
    </div>
  )
}

// ---- MAIN SCREEN ----
function MainScreen({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--vb-bg)',
      color: 'var(--vb-text)',
      fontFamily: 'var(--vb-font-body)',
      animation: 'slide-up 0.4s ease-out',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '16px 20px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--vb-border)',
      }}>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: 'uppercase' as const,
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

      {/* Stats row - scoreboard style */}
      <div style={{
        display: 'flex',
        margin: '16px 20px 0',
        backgroundColor: 'var(--vb-surface)',
        borderRadius: 8,
        border: '1px solid var(--vb-border)',
        overflow: 'hidden',
      }}>
        <StatPill label="Daily" value="#--" />
        <div style={{ width: 1, backgroundColor: 'var(--vb-border)' }} />
        <StatPill label="Monthly" value="#--" />
        <div style={{ width: 1, backgroundColor: 'var(--vb-border)' }} />
        <StatPill label="Season" value="#--" />
      </div>

      {/* Credits remaining */}
      <div style={{
        margin: '16px 20px 0',
        padding: '10px 16px',
        backgroundColor: 'var(--vb-surface)',
        borderRadius: 8,
        border: '1px solid var(--vb-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: 'var(--vb-text-mid)' }}>Today's Plays</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              backgroundColor: n <= 2 ? 'var(--vb-accent)' : 'var(--vb-border)',
              boxShadow: n <= 2 ? '0 0 6px var(--vb-accent-dim)' : 'none',
            }} />
          ))}
        </div>
      </div>

      {/* Difficulty tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        margin: '20px 20px 0',
      }}>
        {[
          { label: 'EASY', mult: 'x1', active: true },
          { label: 'NORMAL', mult: 'x2', active: false },
          { label: 'HARD', mult: 'x3', active: false },
        ].map((d) => (
          <button
            key={d.label}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 6,
              border: d.active ? '1.5px solid var(--vb-accent)' : '1.5px solid var(--vb-border)',
              backgroundColor: d.active ? 'rgba(200,255,0,0.06)' : 'var(--vb-surface)',
              color: d.active ? 'var(--vb-accent)' : 'var(--vb-text-dim)',
              fontFamily: 'var(--vb-font-score)',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 2,
              cursor: 'pointer',
              lineHeight: 1.4,
            }}
          >
            {d.label}<br />
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              opacity: 0.5,
              fontFamily: 'var(--vb-font-body)',
            }}>{d.mult}</span>
          </button>
        ))}
      </div>

      {/* Button Pad — 게임화면과 동일한 구조, 중앙만 START */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 292, height: 292 }}>
          {/* Body */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 24,
            backgroundColor: 'var(--vb-surface)',
            border: '1px solid var(--vb-border)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          }} />
          {/* 4 color buttons — 클릭 시 게임 시작 */}
          {CORNER_POS.map(({ color, ...pos }) => {
            const c = BTN_COLORS[color]
            return (
              <button
                key={color}
                onClick={() => onNavigate('game')}
                style={{
                  position: 'absolute',
                  ...(pos as React.CSSProperties),
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  background: `radial-gradient(circle at 40% 35%, ${c.dim}, ${c.dim}cc)`,
                  boxShadow: `0 6px 0 ${c.dim}88, 0 8px 16px rgba(0,0,0,0.4)`,
                  filter: 'brightness(0.65)',
                  zIndex: 2,
                }}
              />
            )
          })}
          {/* Center START circle */}
          <button
            onClick={() => onNavigate('game')}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: '2px solid var(--vb-accent)',
              backgroundColor: 'var(--vb-surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
            }}
          >
            <span style={{
              fontFamily: 'var(--vb-font-score)',
              fontSize: 13,
              fontWeight: 900,
              color: 'var(--vb-accent)',
              letterSpacing: 1,
            }}>START</span>
          </button>
        </div>
      </div>

      {/* Rankings link */}
      <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => onNavigate('ranking')}
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
    </div>
  )
}

// ---- GAME SCREEN ----
function GameScreen({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [flashIdx, setFlashIdx] = useState<number | null>(null)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--vb-bg)',
      color: 'var(--vb-text)',
      fontFamily: 'var(--vb-font-body)',
    }}>
      {/* Header scoreboard */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 20px',
        borderBottom: '1px solid var(--vb-border)',
      }}>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 14,
          fontWeight: 800,
          color: 'var(--vb-text-mid)',
          letterSpacing: 1,
        }}>EASY</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--vb-font-score)',
            fontSize: 10,
            color: 'var(--vb-text-dim)',
            letterSpacing: 2,
          }}>SCORE</div>
          <div style={{
            fontFamily: 'var(--vb-font-score)',
            fontSize: 24,
            fontWeight: 900,
            color: 'var(--vb-accent)',
            letterSpacing: 1,
          }}>1,250</div>
        </div>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 14,
          fontWeight: 800,
          color: 'var(--vb-text-mid)',
          letterSpacing: 1,
        }}>STG 05</div>
      </div>

      {/* Stage display */}
      <div style={{
        flex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 11,
          color: 'var(--vb-text-dim)',
          letterSpacing: 3,
          marginBottom: 4,
        }}>STAGE</div>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 56,
          fontWeight: 900,
          color: 'var(--vb-text)',
          lineHeight: 1,
        }}>05</div>
      </div>

      {/* Button Pad */}
      <div style={{
        flex: 3,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}>
        <div style={{
          position: 'relative',
          width: 292,
          height: 292,
        }}>
          {/* Body */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 24,
            backgroundColor: 'var(--vb-surface)',
            border: '1px solid var(--vb-border)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          }} />

          {/* 4 buttons */}
          {CORNER_POS.map(({ color, ...pos }, i) => {
            const c = BTN_COLORS[color]
            const isFlashing = flashIdx === i
            return (
              <button
                key={color}
                onPointerDown={() => setFlashIdx(i)}
                onPointerUp={() => setFlashIdx(null)}
                style={{
                  position: 'absolute',
                  ...(pos as React.CSSProperties),
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  background: isFlashing
                    ? `radial-gradient(circle at 40% 35%, ${c.base}, ${c.dim})`
                    : `radial-gradient(circle at 40% 35%, ${c.dim}, ${c.dim}cc)`,
                  boxShadow: isFlashing
                    ? `0 0 24px ${c.ring}, 0 4px 0 ${c.dim}`
                    : `0 6px 0 ${c.dim}88, 0 8px 16px rgba(0,0,0,0.4)`,
                  transform: isFlashing ? 'scale(1.04) translateY(2px)' : 'scale(1)',
                  filter: isFlashing ? 'brightness(1.5)' : 'brightness(0.65)',
                  transition: 'all 80ms ease',
                  zIndex: 2,
                }}
              />
            )
          })}

          {/* Center */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'var(--vb-surface-2)',
            border: '2px solid var(--vb-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
          }}>
            <div style={{
              fontFamily: 'var(--vb-font-score)',
              fontSize: 8,
              color: 'var(--vb-text-dim)',
              letterSpacing: 1,
            }}>SCORE</div>
            <div style={{
              fontFamily: 'var(--vb-font-score)',
              fontSize: 18,
              fontWeight: 900,
              color: 'var(--vb-text)',
            }}>1250</div>
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <div style={{
        margin: '0 20px 8px',
        height: 4,
        backgroundColor: 'var(--vb-surface)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          width: '65%',
          height: '100%',
          backgroundColor: 'var(--vb-accent)',
          borderRadius: 2,
          boxShadow: '0 0 8px rgba(200,255,0,0.3)',
        }} />
      </div>

      {/* Banner */}
      <div style={{
        height: 96,
        margin: '8px 20px 12px',
        backgroundColor: 'var(--vb-surface)',
        borderRadius: 8,
        border: '1px solid var(--vb-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        color: 'var(--vb-text-dim)',
      }}>
        AD
      </div>
    </div>
  )
}

// ---- RESULT SCREEN ----
function ResultScreen({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--vb-bg)',
      color: 'var(--vb-text)',
      fontFamily: 'var(--vb-font-body)',
      animation: 'slide-up 0.5s ease-out',
    }}>
      {/* Top strip */}
      <div style={{
        padding: '20px 20px 0',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 12,
          fontWeight: 800,
          color: 'var(--vb-danger)',
          letterSpacing: 4,
          marginBottom: 4,
        }}>GAME OVER</div>
      </div>

      {/* Score card */}
      <div style={{
        margin: '20px 20px 0',
        padding: '24px 0',
        backgroundColor: 'var(--vb-surface)',
        borderRadius: 12,
        border: '1px solid var(--vb-border)',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 11,
          color: 'var(--vb-text-dim)',
          letterSpacing: 3,
          marginBottom: 4,
        }}>FINAL SCORE</div>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 64,
          fontWeight: 900,
          color: 'var(--vb-text)',
          lineHeight: 1,
          letterSpacing: -1,
        }}>2,850</div>
        <div style={{
          fontFamily: 'var(--vb-font-body)',
          fontSize: 12,
          color: 'var(--vb-text-dim)',
          marginTop: 8,
        }}>Stage 12 ◆ EASY</div>

        {/* New best badge */}
        <div style={{
          display: 'inline-block',
          marginTop: 14,
          padding: '4px 16px',
          borderRadius: 20,
          backgroundColor: 'rgba(200,255,0,0.1)',
          border: '1px solid var(--vb-accent)',
        }}>
          <span style={{
            fontFamily: 'var(--vb-font-score)',
            fontSize: 10,
            fontWeight: 800,
            color: 'var(--vb-accent)',
            letterSpacing: 2,
          }}>NEW PERSONAL BEST</span>
        </div>
      </div>

      {/* Rank entries */}
      <div style={{
        margin: '16px 20px 0',
        backgroundColor: 'var(--vb-surface)',
        borderRadius: 12,
        border: '1px solid var(--vb-border)',
        overflow: 'hidden',
      }}>
        {[
          { label: 'Daily', rank: '#3', highlight: true },
          { label: 'Monthly', rank: '#12', sub: 'Points on Apr 1st' },
          { label: 'Season', rank: '#45' },
        ].map(({ label, rank, sub, highlight }, i, arr) => (
          <div key={label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            borderBottom: i < arr.length - 1 ? '1px solid var(--vb-border)' : 'none',
          }}>
            <div>
              <div style={{
                fontSize: 13,
                color: 'var(--vb-text-mid)',
                fontWeight: 600,
              }}>{label}</div>
              {sub && <div style={{
                fontSize: 10,
                color: 'var(--vb-text-dim)',
                marginTop: 2,
              }}>{sub}</div>}
            </div>
            <div style={{
              fontFamily: 'var(--vb-font-score)',
              fontSize: 20,
              fontWeight: 900,
              color: highlight ? 'var(--vb-accent)' : 'var(--vb-text)',
            }}>{rank}</div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{
        marginTop: 'auto',
        padding: '0 20px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <button
          onClick={() => onNavigate('game')}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 8,
            border: 'none',
            backgroundColor: 'var(--vb-accent)',
            color: '#0e0e10',
            fontFamily: 'var(--vb-font-score)',
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: 2,
            cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(200,255,0,0.2)',
          }}
        >
          PLAY AGAIN
        </button>
        <button
          onClick={() => onNavigate('ranking')}
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
    </div>
  )
}

// ---- MAIN APP ----
export default function VariantB() {
  const [page, setPage] = useState('main')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE_TAG }} />
      <div style={{ height: '100dvh', overflow: 'hidden' }}>
        {page === 'main' && <MainScreen onNavigate={setPage} />}
        {page === 'game' && <GameScreen onNavigate={setPage} />}
        {page === 'result' && <ResultScreen onNavigate={setPage} />}
      </div>
    </>
  )
}
