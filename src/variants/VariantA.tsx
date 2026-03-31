import React, { useState } from 'react'

/**
 * Variant A — RETRO ARCADE
 * CRT 스캔라인, 네온 글로우, 모노스페이스 픽셀 폰트, 어두운 배경
 * Google Font: Press Start 2P (픽셀), Share Tech Mono (모노스페이스 보조)
 */

const STYLE_TAG = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Share+Tech+Mono&display=swap');

@keyframes crt-flicker {
  0%   { opacity: 0.97; }
  50%  { opacity: 1; }
  100% { opacity: 0.97; }
}

@keyframes scanline-scroll {
  0%   { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

@keyframes neon-pulse {
  0%, 100% { text-shadow: 0 0 8px #ff0044, 0 0 24px #ff004466; }
  50%      { text-shadow: 0 0 16px #ff0044, 0 0 40px #ff004488, 0 0 80px #ff004444; }
}

@keyframes score-pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@keyframes glow-border {
  0%, 100% { box-shadow: 0 0 8px #00ff8855, inset 0 0 8px #00ff8822; }
  50%      { box-shadow: 0 0 20px #00ff88aa, inset 0 0 16px #00ff8844; }
}

:root {
  --va-bg: #0a0a12;
  --va-bg-crt: #0d0d18;
  --va-neon-red: #ff0044;
  --va-neon-green: #00ff88;
  --va-neon-cyan: #00e5ff;
  --va-neon-yellow: #ffe600;
  --va-text: #c8ffc8;
  --va-text-dim: #4a7a4a;
  --va-border: #1a3a1a;
  --va-font-pixel: 'Press Start 2P', monospace;
  --va-font-mono: 'Share Tech Mono', monospace;
}
`

// ---- Button colors for game pad ----
const BTN_COLORS = {
  orange: { base: '#ff4400', glow: '#ff440088' },
  blue:   { base: '#0088ff', glow: '#0088ff88' },
  green:  { base: '#00ff44', glow: '#00ff4488' },
  yellow: { base: '#ffee00', glow: '#ffee0088' },
}

const CORNER_POS = [
  { color: 'orange' as const, top: 0, left: 0 },
  { color: 'blue' as const, top: 0, right: 0 },
  { color: 'green' as const, bottom: 0, left: 0 },
  { color: 'yellow' as const, bottom: 0, right: 0 },
]

// ---- CRT Overlay Component ----
function CRTOverlay() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 9999,
      background: `repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.15) 2px,
        rgba(0,0,0,0.15) 4px
      )`,
      animation: 'scanline-scroll 0.3s linear infinite',
    }} />
  )
}

// ---- MAIN SCREEN ----
function MainScreen({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--va-bg)',
      color: 'var(--va-text)',
      fontFamily: 'var(--va-font-mono)',
      padding: '0 20px',
      animation: 'crt-flicker 3s infinite',
    }}>
      {/* Title */}
      <div style={{ paddingTop: 56, textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          fontFamily: 'var(--va-font-pixel)',
          fontSize: 16,
          color: 'var(--va-neon-red)',
          animation: 'neon-pulse 2s ease-in-out infinite',
          lineHeight: 1.8,
          letterSpacing: 2,
        }}>
          MEMORY
        </div>
        <div style={{
          fontFamily: 'var(--va-font-pixel)',
          fontSize: 22,
          color: 'var(--va-neon-green)',
          textShadow: '0 0 12px #00ff88, 0 0 32px #00ff8866',
          letterSpacing: 4,
        }}>
          BATTLE
        </div>
        <div style={{
          marginTop: 12,
          fontSize: 10,
          color: 'var(--va-text-dim)',
          fontFamily: 'var(--va-font-pixel)',
          letterSpacing: 2,
        }}>
          INSERT COIN TO START
        </div>
      </div>

      {/* Rank badges - arcade cabinet style */}
      <div style={{
        border: '1px solid var(--va-border)',
        borderRadius: 4,
        padding: 16,
        marginBottom: 24,
        backgroundColor: 'rgba(0,255,136,0.03)',
        animation: 'glow-border 3s ease-in-out infinite',
      }}>
        <div style={{
          fontFamily: 'var(--va-font-pixel)',
          fontSize: 8,
          color: 'var(--va-neon-cyan)',
          letterSpacing: 3,
          marginBottom: 12,
          textAlign: 'center',
        }}>
          HIGH SCORE TABLE
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {['DAILY', 'MONTH', 'SEASON'].map((label) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--va-font-pixel)',
                fontSize: 7,
                color: 'var(--va-text-dim)',
                marginBottom: 6,
                letterSpacing: 1,
              }}>{label}</div>
              <div style={{
                fontFamily: 'var(--va-font-pixel)',
                fontSize: 14,
                color: 'var(--va-neon-yellow)',
                textShadow: '0 0 8px #ffe60066',
              }}>--</div>
            </div>
          ))}
        </div>
      </div>

      {/* Credits */}
      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--va-font-pixel)',
        fontSize: 8,
        color: 'var(--va-text-dim)',
        marginBottom: 24,
      }}>
        CREDIT: 3
      </div>

      {/* Difficulty selector - like arcade dip switches */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {[
          { label: 'EASY', mult: 'x1', color: 'var(--va-neon-green)' },
          { label: 'NORM', mult: 'x2', color: 'var(--va-neon-cyan)' },
          { label: 'HARD', mult: 'x3', color: 'var(--va-neon-red)' },
        ].map((d, i) => (
          <button
            key={d.label}
            onClick={() => {}}
            style={{
              flex: 1,
              padding: '10px 0',
              border: i === 0 ? `2px solid ${d.color}` : '2px solid var(--va-border)',
              borderRadius: 2,
              backgroundColor: i === 0 ? 'rgba(0,255,136,0.08)' : 'transparent',
              color: i === 0 ? d.color : 'var(--va-text-dim)',
              fontFamily: 'var(--va-font-pixel)',
              fontSize: 8,
              letterSpacing: 1,
              cursor: 'pointer',
              textShadow: i === 0 ? `0 0 8px ${d.color}66` : 'none',
            }}
          >
            {d.label}<br />
            <span style={{ fontSize: 7, opacity: 0.6 }}>{d.mult}</span>
          </button>
        ))}
      </div>

      {/* Start button */}
      <button
        onClick={() => onNavigate('game')}
        style={{
          width: '100%',
          padding: '14px 0',
          border: '2px solid var(--va-neon-green)',
          borderRadius: 2,
          backgroundColor: 'rgba(0,255,136,0.1)',
          color: 'var(--va-neon-green)',
          fontFamily: 'var(--va-font-pixel)',
          fontSize: 10,
          letterSpacing: 4,
          cursor: 'pointer',
          textShadow: '0 0 12px #00ff8888',
          boxShadow: '0 0 20px #00ff8833, inset 0 0 20px #00ff8811',
        }}
      >
        ▶ START
      </button>

      {/* Ranking button */}
      <button
        onClick={() => onNavigate('ranking')}
        style={{
          width: '100%',
          marginTop: 10,
          padding: '12px 0',
          border: '1px solid var(--va-border)',
          borderRadius: 2,
          backgroundColor: 'transparent',
          color: 'var(--va-text-dim)',
          fontFamily: 'var(--va-font-pixel)',
          fontSize: 8,
          letterSpacing: 3,
          cursor: 'pointer',
        }}
      >
        RANKING
      </button>
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
      backgroundColor: 'var(--va-bg)',
      color: 'var(--va-text)',
      fontFamily: 'var(--va-font-mono)',
      animation: 'crt-flicker 3s infinite',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px 8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--va-font-pixel)',
          fontSize: 10,
          color: 'var(--va-neon-red)',
          textShadow: '0 0 8px #ff004466',
        }}>
          MEMORY BATTLE
        </div>
        <div style={{
          fontFamily: 'var(--va-font-pixel)',
          fontSize: 8,
          color: 'var(--va-neon-cyan)',
        }}>
          EASY x1
        </div>
      </div>

      {/* Stage / Score area */}
      <div style={{
        flex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--va-font-pixel)',
          fontSize: 8,
          color: 'var(--va-text-dim)',
          letterSpacing: 3,
          marginBottom: 8,
        }}>STAGE</div>
        <div style={{
          fontFamily: 'var(--va-font-pixel)',
          fontSize: 32,
          color: 'var(--va-neon-green)',
          textShadow: '0 0 16px #00ff8888',
        }}>05</div>
      </div>

      {/* Button Pad - arcade style */}
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
          {/* Cabinet body */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 4,
            background: 'linear-gradient(145deg, #1a1a28 0%, #0a0a14 100%)',
            border: '2px solid #1a3a1a',
            boxShadow: '0 0 30px rgba(0,255,136,0.05), inset 0 0 30px rgba(0,0,0,0.5)',
          }}>
            {/* Corner rivets */}
            {[
              { top: 8, left: 8 }, { top: 8, right: 8 },
              { bottom: 8, left: 8 }, { bottom: 8, right: 8 },
            ].map((pos, i) => (
              <div key={i} style={{
                position: 'absolute',
                ...pos,
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: '#2a2a3a',
                border: '1px solid #3a3a4a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 6,
                color: '#4a4a5a',
              }}>+</div>
            ))}
          </div>

          {/* 4 color buttons */}
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
                  borderRadius: 4,
                  border: `2px solid ${c.base}`,
                  cursor: 'pointer',
                  background: isFlashing
                    ? c.base
                    : `${c.base}33`,
                  boxShadow: isFlashing
                    ? `0 0 30px ${c.glow}, inset 0 0 20px ${c.glow}`
                    : `0 0 8px ${c.base}22`,
                  transform: isFlashing ? 'scale(0.96)' : 'scale(1)',
                  filter: isFlashing ? 'brightness(1.5)' : 'brightness(0.7)',
                  transition: 'all 80ms ease',
                  zIndex: 2,
                }}
              />
            )
          })}

          {/* Center - score display */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 80,
            height: 80,
            borderRadius: 2,
            border: '1px solid var(--va-border)',
            backgroundColor: 'rgba(0,10,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
          }}>
            <div style={{
              fontFamily: 'var(--va-font-pixel)',
              fontSize: 6,
              color: 'var(--va-text-dim)',
              letterSpacing: 1,
            }}>SCORE</div>
            <div style={{
              fontFamily: 'var(--va-font-pixel)',
              fontSize: 16,
              color: 'var(--va-neon-green)',
              textShadow: '0 0 8px #00ff8866',
            }}>1250</div>
          </div>
        </div>
      </div>

      {/* Timer bar - pixelated */}
      <div style={{
        margin: '0 24px 8px',
        height: 8,
        backgroundColor: '#0a1a0a',
        border: '1px solid var(--va-border)',
        borderRadius: 1,
      }}>
        <div style={{
          width: '65%',
          height: '100%',
          backgroundColor: 'var(--va-neon-green)',
          boxShadow: '0 0 8px #00ff8844',
          transition: 'width 100ms linear',
        }} />
      </div>

      {/* Banner area */}
      <div style={{
        height: 96,
        margin: '8px 20px 12px',
        border: '1px dashed var(--va-border)',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--va-font-pixel)',
        fontSize: 7,
        color: 'var(--va-text-dim)',
      }}>
        AD SPACE
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
      backgroundColor: 'var(--va-bg)',
      color: 'var(--va-text)',
      fontFamily: 'var(--va-font-mono)',
      padding: '32px 20px 24px',
      gap: 20,
      animation: 'crt-flicker 3s infinite',
    }}>
      {/* Game Over title */}
      <div style={{ textAlign: 'center', paddingTop: 20 }}>
        <div style={{
          fontFamily: 'var(--va-font-pixel)',
          fontSize: 14,
          color: 'var(--va-neon-red)',
          animation: 'neon-pulse 1.5s ease-in-out infinite',
          letterSpacing: 4,
          marginBottom: 24,
        }}>
          GAME OVER
        </div>

        {/* Score display - LED style */}
        <div style={{
          display: 'inline-block',
          padding: '16px 32px',
          border: '2px solid var(--va-border)',
          backgroundColor: 'rgba(0,10,0,0.8)',
          borderRadius: 4,
        }}>
          <div style={{
            fontFamily: 'var(--va-font-pixel)',
            fontSize: 7,
            color: 'var(--va-text-dim)',
            letterSpacing: 3,
            marginBottom: 8,
          }}>FINAL SCORE</div>
          <div style={{
            fontFamily: 'var(--va-font-pixel)',
            fontSize: 36,
            color: 'var(--va-neon-green)',
            textShadow: '0 0 16px #00ff88aa, 0 0 40px #00ff8844',
            animation: 'score-pop 0.6s ease-out',
          }}>2850</div>
          <div style={{
            fontFamily: 'var(--va-font-pixel)',
            fontSize: 7,
            color: 'var(--va-text-dim)',
            marginTop: 8,
          }}>STAGE 12 ◆ EASY</div>
        </div>

        {/* New best */}
        <div style={{
          marginTop: 16,
          fontFamily: 'var(--va-font-pixel)',
          fontSize: 8,
          color: 'var(--va-neon-yellow)',
          textShadow: '0 0 8px #ffe60066',
          letterSpacing: 2,
        }}>
          ★ NEW HIGH SCORE ★
        </div>
      </div>

      {/* Ranking table */}
      <div style={{
        border: '1px solid var(--va-border)',
        borderRadius: 4,
        padding: 16,
        backgroundColor: 'rgba(0,255,136,0.02)',
      }}>
        <div style={{
          fontFamily: 'var(--va-font-pixel)',
          fontSize: 7,
          color: 'var(--va-neon-cyan)',
          letterSpacing: 3,
          marginBottom: 12,
          textAlign: 'center',
        }}>RANK ENTRY</div>
        {[
          { label: 'DAILY', rank: '3rd' },
          { label: 'MONTH', rank: '12th' },
          { label: 'SEASON', rank: '45th' },
        ].map(({ label, rank }) => (
          <div key={label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid #0a2a0a',
            fontFamily: 'var(--va-font-pixel)',
            fontSize: 8,
          }}>
            <span style={{ color: 'var(--va-text-dim)' }}>{label}</span>
            <span style={{
              color: 'var(--va-neon-yellow)',
              textShadow: '0 0 6px #ffe60044',
            }}>{rank}</span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => onNavigate('game')}
          style={{
            width: '100%',
            padding: '14px 0',
            border: '2px solid var(--va-neon-green)',
            borderRadius: 2,
            backgroundColor: 'rgba(0,255,136,0.1)',
            color: 'var(--va-neon-green)',
            fontFamily: 'var(--va-font-pixel)',
            fontSize: 8,
            letterSpacing: 3,
            cursor: 'pointer',
            textShadow: '0 0 8px #00ff8866',
            boxShadow: '0 0 16px #00ff8822',
          }}
        >
          CONTINUE? ▶
        </button>
        <button
          onClick={() => onNavigate('ranking')}
          style={{
            width: '100%',
            padding: '12px 0',
            border: '1px solid var(--va-border)',
            borderRadius: 2,
            backgroundColor: 'transparent',
            color: 'var(--va-text-dim)',
            fontFamily: 'var(--va-font-pixel)',
            fontSize: 7,
            letterSpacing: 3,
            cursor: 'pointer',
          }}
        >
          VIEW RANKING
        </button>
      </div>
    </div>
  )
}

// ---- MAIN APP ----
export default function VariantA() {
  const [page, setPage] = useState('main')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE_TAG }} />
      <div style={{ height: '100dvh', overflow: 'hidden' }}>
        <CRTOverlay />
        {page === 'main' && <MainScreen onNavigate={setPage} />}
        {page === 'game' && <GameScreen onNavigate={setPage} />}
        {page === 'result' && <ResultScreen onNavigate={setPage} />}
      </div>
    </>
  )
}
