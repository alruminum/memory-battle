import React, { useState } from 'react'

/**
 * Variant C — NEURAL / BRAIN WAVE
 * 뇌파/뉴럴 모티프, 보라-청록 그라디언트, 유기적 곡선,
 * 시냅스 연결 비주얼, 집중/몰입 분위기
 * Google Font: Outfit (유기적 곡선 sans), Syne (미래적 디스플레이)
 */

const STYLE_TAG = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;700;900&family=Syne:wght@700;800&display=swap');

@keyframes synapse-glow {
  0%, 100% { opacity: 0.3; }
  50%      { opacity: 0.8; }
}

@keyframes neural-pulse {
  0%   { box-shadow: 0 0 20px rgba(138,43,226,0.2), 0 0 60px rgba(0,210,190,0.1); }
  50%  { box-shadow: 0 0 40px rgba(138,43,226,0.4), 0 0 80px rgba(0,210,190,0.2); }
  100% { box-shadow: 0 0 20px rgba(138,43,226,0.2), 0 0 60px rgba(0,210,190,0.1); }
}

@keyframes float-in {
  from { transform: translateY(30px) scale(0.95); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes wave-line {
  0%   { d: path('M0,20 Q40,5 80,20 T160,20 T240,20 T320,20'); }
  50%  { d: path('M0,20 Q40,35 80,20 T160,20 T240,20 T320,20'); }
  100% { d: path('M0,20 Q40,5 80,20 T160,20 T240,20 T320,20'); }
}

@keyframes score-reveal {
  from { transform: scale(0.5); opacity: 0; filter: blur(8px); }
  to   { transform: scale(1); opacity: 1; filter: blur(0); }
}

@keyframes orbit {
  0%   { transform: rotate(0deg) translateX(140px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(140px) rotate(-360deg); }
}

:root {
  --vc-bg: #08060e;
  --vc-bg-gradient: linear-gradient(165deg, #0c0818 0%, #08060e 40%, #060a10 100%);
  --vc-purple: #8a2be2;
  --vc-purple-dim: #4a1580;
  --vc-teal: #00d2be;
  --vc-teal-dim: #006e64;
  --vc-pink: #ff2d78;
  --vc-surface: rgba(138,43,226,0.06);
  --vc-surface-border: rgba(138,43,226,0.15);
  --vc-text: #e8e0f4;
  --vc-text-mid: #8878a8;
  --vc-text-dim: #4a3e60;
  --vc-font-display: 'Syne', sans-serif;
  --vc-font-body: 'Outfit', sans-serif;
}
`

// ---- Synapse background decoration ----
function SynapseBackground() {
  const dots = [
    { x: '15%', y: '20%', size: 3, delay: 0 },
    { x: '75%', y: '12%', size: 2, delay: 0.5 },
    { x: '85%', y: '35%', size: 4, delay: 1.2 },
    { x: '25%', y: '65%', size: 2, delay: 0.8 },
    { x: '60%', y: '80%', size: 3, delay: 1.5 },
    { x: '10%', y: '45%', size: 2, delay: 2.0 },
    { x: '90%', y: '60%', size: 3, delay: 0.3 },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {dots.map((d, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: d.x,
          top: d.y,
          width: d.size,
          height: d.size,
          borderRadius: '50%',
          backgroundColor: 'var(--vc-teal)',
          animation: `synapse-glow 3s ease-in-out ${d.delay}s infinite`,
          boxShadow: '0 0 8px var(--vc-teal)',
        }} />
      ))}
    </div>
  )
}

// ---- Button colors ----
const BTN_COLORS = {
  orange: { base: '#e85d04', glow: 'rgba(232,93,4,0.5)', dim: '#7a3002' },
  blue:   { base: '#3a86ff', glow: 'rgba(58,134,255,0.5)', dim: '#1d4580' },
  green:  { base: '#38b000', glow: 'rgba(56,176,0,0.5)', dim: '#1d5e00' },
  yellow: { base: '#ffbe0b', glow: 'rgba(255,190,11,0.5)', dim: '#806004' },
}

const CORNER_POS = [
  { color: 'orange' as const, top: 0, left: 0 },
  { color: 'blue' as const, top: 0, right: 0 },
  { color: 'green' as const, bottom: 0, left: 0 },
  { color: 'yellow' as const, bottom: 0, right: 0 },
]

// ---- Brain wave SVG ----
function BrainWave({ color, opacity }: { color: string; opacity: number }) {
  return (
    <svg width="100%" height="40" viewBox="0 0 320 40" style={{ opacity, display: 'block' }}>
      <path
        d="M0,20 Q20,8 40,20 Q60,32 80,20 Q100,8 120,20 Q140,32 160,20 Q180,8 200,20 Q220,32 240,20 Q260,8 280,20 Q300,32 320,20"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  )
}

// ---- MAIN SCREEN ----
function MainScreen({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--vc-bg-gradient)',
      color: 'var(--vc-text)',
      fontFamily: 'var(--vc-font-body)',
      position: 'relative',
      animation: 'float-in 0.6s ease-out',
    }}>
      <SynapseBackground />

      {/* Title */}
      <div style={{ paddingTop: 56, textAlign: 'center', marginBottom: 12, position: 'relative', zIndex: 1 }}>
        <div style={{
          fontFamily: 'var(--vc-font-display)',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--vc-teal)',
          letterSpacing: 6,
          marginBottom: 4,
        }}>
          MEMORY
        </div>
        <div style={{
          fontFamily: 'var(--vc-font-display)',
          fontSize: 32,
          fontWeight: 800,
          background: 'linear-gradient(135deg, var(--vc-purple), var(--vc-teal))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: 3,
        }}>
          BATTLE
        </div>
        {/* Brain icon with unicode */}
        <div style={{
          fontSize: 28,
          marginTop: 8,
          filter: 'drop-shadow(0 0 8px var(--vc-purple))',
        }}>
          ◎
        </div>
      </div>

      {/* Brain wave decoration */}
      <div style={{ padding: '0 20px', position: 'relative', zIndex: 1 }}>
        <BrainWave color="var(--vc-purple)" opacity={0.4} />
      </div>

      {/* Rank badges - neural node style */}
      <div style={{
        display: 'flex',
        gap: 10,
        margin: '16px 20px 0',
        position: 'relative',
        zIndex: 1,
      }}>
        {[
          { label: 'Daily', icon: '◇' },
          { label: 'Monthly', icon: '◈' },
          { label: 'Season', icon: '◆' },
        ].map(({ label, icon }) => (
          <div key={label} style={{
            flex: 1,
            textAlign: 'center',
            padding: '14px 0',
            borderRadius: 16,
            backgroundColor: 'var(--vc-surface)',
            border: '1px solid var(--vc-surface-border)',
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              fontSize: 10,
              color: 'var(--vc-text-dim)',
              letterSpacing: 2,
              marginBottom: 6,
              fontWeight: 500,
            }}>{icon} {label}</div>
            <div style={{
              fontFamily: 'var(--vc-font-display)',
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--vc-text)',
            }}>--</div>
          </div>
        ))}
      </div>

      {/* Play count */}
      <div style={{
        margin: '16px 20px 0',
        padding: '12px 16px',
        borderRadius: 12,
        backgroundColor: 'var(--vc-surface)',
        border: '1px solid var(--vc-surface-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <span style={{ fontSize: 13, color: 'var(--vc-text-mid)', fontWeight: 500 }}>
          Neural Charges
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: n <= 2 ? 'var(--vc-teal)' : 'transparent',
              border: n <= 2 ? 'none' : '1px solid var(--vc-text-dim)',
              boxShadow: n <= 2 ? '0 0 8px var(--vc-teal-dim)' : 'none',
            }} />
          ))}
        </div>
      </div>

      {/* Difficulty - organic pills */}
      <div style={{
        display: 'flex',
        gap: 8,
        margin: '20px 20px 0',
        position: 'relative',
        zIndex: 1,
      }}>
        {[
          { label: 'Easy', mult: 'x1', active: true, color: 'var(--vc-teal)' },
          { label: 'Normal', mult: 'x2', active: false, color: 'var(--vc-purple)' },
          { label: 'Hard', mult: 'x3', active: false, color: 'var(--vc-pink)' },
        ].map((d) => (
          <button
            key={d.label}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 24,
              border: d.active ? `1.5px solid ${d.color}` : '1.5px solid var(--vc-surface-border)',
              backgroundColor: d.active ? `${d.color}15` : 'transparent',
              color: d.active ? d.color : 'var(--vc-text-dim)',
              fontFamily: 'var(--vc-font-body)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              lineHeight: 1.4,
            }}
          >
            {d.label}<br />
            <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.6 }}>{d.mult}</span>
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Buttons */}
      <div style={{
        padding: '0 20px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        zIndex: 1,
      }}>
        <button
          onClick={() => onNavigate('game')}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 24,
            border: 'none',
            background: 'linear-gradient(135deg, var(--vc-purple), var(--vc-teal))',
            color: '#fff',
            fontFamily: 'var(--vc-font-display)',
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 3,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(138,43,226,0.3), 0 4px 16px rgba(0,210,190,0.2)',
          }}
        >
          ACTIVATE
        </button>
        <button
          onClick={() => onNavigate('ranking')}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 24,
            border: '1px solid var(--vc-surface-border)',
            backgroundColor: 'transparent',
            color: 'var(--vc-text-mid)',
            fontFamily: 'var(--vc-font-body)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Neural Rankings
        </button>
      </div>
    </div>
  )
}

// ---- GAME SCREEN ----
function GameScreen({ onNavigate: _onNavigate }: { onNavigate: (page: string) => void }) {
  const [flashIdx, setFlashIdx] = useState<number | null>(null)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--vc-bg-gradient)',
      color: 'var(--vc-text)',
      fontFamily: 'var(--vc-font-body)',
      position: 'relative',
    }}>
      <SynapseBackground />

      {/* Header */}
      <div style={{
        padding: '14px 20px 10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          fontFamily: 'var(--vc-font-display)',
          fontSize: 14,
          fontWeight: 800,
          background: 'linear-gradient(135deg, var(--vc-purple), var(--vc-teal))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          MEMORY BATTLE
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--vc-text-dim)',
          fontWeight: 500,
        }}>EASY x1</div>
      </div>

      {/* Stage */}
      <div style={{
        flex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          fontFamily: 'var(--vc-font-body)',
          fontSize: 11,
          color: 'var(--vc-text-dim)',
          letterSpacing: 4,
          fontWeight: 500,
          marginBottom: 4,
        }}>NEURAL STAGE</div>
        <div style={{
          fontFamily: 'var(--vc-font-display)',
          fontSize: 52,
          fontWeight: 800,
          background: 'linear-gradient(180deg, var(--vc-text) 0%, var(--vc-purple) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
        }}>05</div>
      </div>

      {/* Button Pad */}
      <div style={{
        flex: 3,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          position: 'relative',
          width: 292,
          height: 292,
        }}>
          {/* Body - organic shape */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 40,
            background: 'linear-gradient(145deg, rgba(138,43,226,0.08) 0%, rgba(0,210,190,0.04) 100%)',
            border: '1px solid var(--vc-surface-border)',
            animation: 'neural-pulse 4s ease-in-out infinite',
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
                    ? `radial-gradient(circle at 35% 30%, ${c.base}, ${c.dim})`
                    : `radial-gradient(circle at 35% 30%, ${c.dim}88, ${c.dim}44)`,
                  boxShadow: isFlashing
                    ? `0 0 40px ${c.glow}, 0 3px 0 ${c.dim}`
                    : `0 6px 0 ${c.dim}66, 0 8px 16px rgba(0,0,0,0.5)`,
                  transform: isFlashing ? 'scale(1.06) translateY(3px)' : 'scale(1)',
                  filter: isFlashing ? 'brightness(1.5)' : 'brightness(0.7)',
                  transition: 'all 80ms ease',
                  zIndex: 2,
                }}
              />
            )
          })}

          {/* Center - neural core */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(138,43,226,0.15), rgba(0,210,190,0.05))',
            border: '1.5px solid var(--vc-surface-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              fontSize: 9,
              color: 'var(--vc-text-dim)',
              letterSpacing: 1,
              fontWeight: 500,
            }}>SCORE</div>
            <div style={{
              fontFamily: 'var(--vc-font-display)',
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--vc-text)',
            }}>1250</div>
          </div>
        </div>
      </div>

      {/* Timer - gradient bar */}
      <div style={{
        margin: '0 24px 8px',
        height: 6,
        backgroundColor: 'rgba(138,43,226,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: '65%',
          height: '100%',
          background: 'linear-gradient(90deg, var(--vc-teal), var(--vc-purple))',
          borderRadius: 3,
          boxShadow: '0 0 12px rgba(0,210,190,0.3)',
        }} />
      </div>

      {/* Banner */}
      <div style={{
        height: 96,
        margin: '8px 20px 12px',
        borderRadius: 16,
        backgroundColor: 'var(--vc-surface)',
        border: '1px solid var(--vc-surface-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        color: 'var(--vc-text-dim)',
        position: 'relative',
        zIndex: 1,
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
      background: 'var(--vc-bg-gradient)',
      color: 'var(--vc-text)',
      fontFamily: 'var(--vc-font-body)',
      padding: '32px 20px 24px',
      gap: 20,
      position: 'relative',
      animation: 'float-in 0.6s ease-out',
    }}>
      <SynapseBackground />

      {/* Disconnected label */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, paddingTop: 8 }}>
        <div style={{
          fontFamily: 'var(--vc-font-display)',
          fontSize: 14,
          fontWeight: 800,
          color: 'var(--vc-pink)',
          letterSpacing: 4,
          marginBottom: 4,
          textShadow: '0 0 12px rgba(255,45,120,0.4)',
        }}>
          DISCONNECTED
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--vc-text-dim)',
          letterSpacing: 2,
        }}>NEURAL LINK SEVERED</div>
      </div>

      {/* Score orb */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
        margin: '8px 0',
      }}>
        <div style={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, rgba(138,43,226,0.2), rgba(0,210,190,0.08), transparent)',
          border: '1.5px solid var(--vc-surface-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'neural-pulse 3s ease-in-out infinite, score-reveal 0.8s ease-out',
        }}>
          <div style={{
            fontSize: 10,
            color: 'var(--vc-text-dim)',
            letterSpacing: 3,
            fontWeight: 500,
            marginBottom: 4,
          }}>FINAL SCORE</div>
          <div style={{
            fontFamily: 'var(--vc-font-display)',
            fontSize: 48,
            fontWeight: 800,
            background: 'linear-gradient(135deg, var(--vc-text), var(--vc-teal))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
          }}>2850</div>
          <div style={{
            fontSize: 11,
            color: 'var(--vc-text-dim)',
            marginTop: 6,
          }}>Stage 12 ◆ Easy</div>
        </div>
      </div>

      {/* New record */}
      <div style={{
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <span style={{
          display: 'inline-block',
          padding: '6px 20px',
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(138,43,226,0.15), rgba(0,210,190,0.1))',
          border: '1px solid var(--vc-surface-border)',
          fontFamily: 'var(--vc-font-display)',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--vc-teal)',
          letterSpacing: 2,
        }}>
          ★ NEW NEURAL RECORD ★
        </span>
      </div>

      {/* Rank entries */}
      <div style={{
        borderRadius: 20,
        backgroundColor: 'var(--vc-surface)',
        border: '1px solid var(--vc-surface-border)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'blur(4px)',
      }}>
        {[
          { label: 'Daily Synapse', rank: '3rd', icon: '◇' },
          { label: 'Monthly Cortex', rank: '12th', icon: '◈', sub: 'Reward on Apr 1st' },
          { label: 'Season Neural', rank: '45th', icon: '◆' },
        ].map(({ label, rank, icon, sub }, i, arr) => (
          <div key={label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: i < arr.length - 1 ? '1px solid var(--vc-surface-border)' : 'none',
          }}>
            <div>
              <div style={{
                fontSize: 13,
                color: 'var(--vc-text-mid)',
                fontWeight: 600,
              }}>{icon} {label}</div>
              {sub && <div style={{
                fontSize: 10,
                color: 'var(--vc-text-dim)',
                marginTop: 2,
              }}>{sub}</div>}
            </div>
            <div style={{
              fontFamily: 'var(--vc-font-display)',
              fontSize: 18,
              fontWeight: 800,
              background: i === 0
                ? 'linear-gradient(135deg, var(--vc-purple), var(--vc-teal))'
                : 'none',
              color: i === 0 ? 'transparent' : 'var(--vc-text)',
              WebkitBackgroundClip: i === 0 ? 'text' : 'unset',
              WebkitTextFillColor: i === 0 ? 'transparent' : 'unset',
            }}>{rank}</div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{
        marginTop: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        zIndex: 1,
      }}>
        <button
          onClick={() => onNavigate('game')}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 24,
            border: 'none',
            background: 'linear-gradient(135deg, var(--vc-purple), var(--vc-teal))',
            color: '#fff',
            fontFamily: 'var(--vc-font-display)',
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: 2,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(138,43,226,0.3)',
          }}
        >
          RECONNECT
        </button>
        <button
          onClick={() => onNavigate('ranking')}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 24,
            border: '1px solid var(--vc-surface-border)',
            backgroundColor: 'transparent',
            color: 'var(--vc-text-mid)',
            fontFamily: 'var(--vc-font-body)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Neural Rankings
        </button>
      </div>
    </div>
  )
}

// ---- MAIN APP ----
export default function VariantC() {
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
