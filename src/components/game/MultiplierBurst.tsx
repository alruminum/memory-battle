import { useEffect, useMemo, useRef, useState } from 'react'

interface MultiplierBurstProps {
  multiplier: number
  isVisible: boolean
  onComplete: () => void
}

interface ParticleData {
  px: number; py: number; size: number; delay: number
}

function getMultiplierColor(multiplier: number): string {
  if (multiplier <= 1) return '#FFFFFF'
  if (multiplier === 2) return '#FACC15'
  if (multiplier === 3) return '#FB923C'
  if (multiplier === 4) return '#F87171'
  return '#E879F9' // x5+
}

const PARTICLE_COUNT = 16

export function MultiplierBurst({ multiplier, isVisible, onComplete }: MultiplierBurstProps) {
  const [phase, setPhase] = useState<'idle' | 'burst' | 'fadeout'>('idle')
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete })

  const particles = useMemo<ParticleData[]>(() => {
    if (!isVisible) return []
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (360 / PARTICLE_COUNT) * i
      const rad = (angle * Math.PI) / 180
      const dist = 80 + Math.random() * 40
      const size = 8 + Math.random() * 6
      return {
        px: Math.cos(rad) * dist,
        py: Math.sin(rad) * dist,
        size,
        delay: i * 25,
      }
    })
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) {
      setPhase('idle')
      return
    }
    setPhase('burst')
    const fadeTimer = setTimeout(() => setPhase('fadeout'), 1400)
    const doneTimer = setTimeout(() => {
      setPhase('idle')
      onCompleteRef.current()
    }, 1800)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [isVisible])

  if (phase === 'idle') return null

  const color = getMultiplierColor(multiplier)
  const colorDim = `${color}18`
  const isFading = phase === 'fadeout'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 100,
      opacity: isFading ? 0 : 1,
      transition: isFading ? 'opacity 400ms ease-out' : 'none',
    }}>
      {/* 배경 방사형 dim */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, ${colorDim} 0%, rgba(14,14,16,0.85) 70%)`,
        animation: 'vb-bg-in 200ms ease-out both',
      }} />

      {/* 파티클 16개 */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`,
            animation: `vb-particle-fly 800ms cubic-bezier(0.1, 0.8, 0.2, 1) ${p.delay}ms both`,
            ['--px' as string]: `${p.px}px`,
            ['--py' as string]: `${p.py}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* xN 텍스트 */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontFamily: 'var(--vb-font-score)',
        fontSize: 88,
        fontWeight: 900,
        color,
        letterSpacing: 2,
        textShadow: `0 0 60px ${color}, 0 0 120px ${color}66`,
        animation: 'vb-text-bounce 500ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms both',
        zIndex: 1,
      }}>
        x{multiplier}
      </div>

      {/* COMBO BOOST 배지 */}
      <div style={{
        position: 'absolute',
        top: 'calc(50% + 52px)',
        left: '50%',
        background: color,
        color: '#000',
        fontFamily: 'var(--vb-font-body)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: 'uppercase' as const,
        padding: '4px 12px',
        borderRadius: 20,
        whiteSpace: 'nowrap' as const,
        animation: 'vb-badge-in 300ms ease-out 500ms both',
        zIndex: 1,
      }}>
        COMBO BOOST
      </div>
    </div>
  )
}
