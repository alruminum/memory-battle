import { useEffect, useRef, useState } from 'react'

interface MultiplierBurstProps {
  multiplier: number
  isVisible: boolean
  onComplete: () => void
}

function getMultiplierColor(multiplier: number): string {
  if (multiplier <= 1) return '#FFFFFF'
  if (multiplier === 2) return '#FACC15'
  if (multiplier === 3) return '#FB923C'
  if (multiplier === 4) return '#F87171'
  return '#E879F9' // x5+
}

const PARTICLE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

export function MultiplierBurst({ multiplier, isVisible, onComplete }: MultiplierBurstProps) {
  const [phase, setPhase] = useState<'idle' | 'burst' | 'fadeout'>('idle')
  // onComplete 최신 참조를 캡처 — useEffect deps 재실행 없이 처리
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  useEffect(() => {
    if (!isVisible) {
      setPhase('idle')
      return
    }

    // 단계 1: burst (scale-up + 파티클, 0ms~400ms)
    setPhase('burst')

    // 단계 2: fadeout (400ms~600ms)
    const fadeTimer = setTimeout(() => setPhase('fadeout'), 400)

    // 단계 3: 완료 (600ms)
    const doneTimer = setTimeout(() => {
      setPhase('idle')
      onCompleteRef.current()
    }, 600)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [isVisible])

  if (phase === 'idle') return null

  const color = getMultiplierColor(multiplier)
  const isFading = phase === 'fadeout'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 100,
      opacity: isFading ? 0 : 1,
      transition: isFading ? 'opacity 200ms ease-out' : 'none',
    }}>
      {/* xN 숫자 */}
      <div style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 72,
        fontWeight: 900,
        color,
        textShadow: `0 0 40px ${color}99, 0 0 80px ${color}44`,
        transform: phase === 'burst' ? 'scale(1)' : 'scale(0.4)',
        transition: phase === 'burst' ? 'transform 400ms cubic-bezier(0.17, 0.89, 0.32, 1.3)' : 'none',
        letterSpacing: 2,
        position: 'relative',
        zIndex: 101,
      }}>
        x{multiplier}
      </div>

      {/* 파티클 8개 */}
      {PARTICLE_ANGLES.map((angle, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transformOrigin: 'center',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
            transform: phase === 'burst'
              ? `translate(-50%, -50%) rotate(${angle}deg) translateY(-80px) scale(1)`
              : `translate(-50%, -50%) rotate(${angle}deg) translateY(0px) scale(0)`,
            transition: phase === 'burst'
              ? `transform 300ms cubic-bezier(0.17, 0.67, 0.83, 0.67) ${i * 15}ms`
              : 'none',
            opacity: isFading ? 0 : 1,
          }}
        />
      ))}
    </div>
  )
}
