import React from 'react'
import type { ButtonColor } from '../../types'
import { getLabelColor, getLabelSize, getLabelGlow } from './floatingScoreUtils'

export interface FloatingItem {
  id: number
  color: ButtonColor
  multiplier: number
  x: number
  y: number
}

interface FloatingScoreProps {
  items: FloatingItem[]
}

// duration: 1200ms (UX 조정 — 기존 800ms 대비 1.5배 연장)
// see impl/14-floating-score-fix.md
function getAnimation(multiplier: number): string {
  const base = 'vb-float 1200ms cubic-bezier(0.22, 1, 0.36, 1) forwards'
  if (multiplier >= 3) {
    return `${base}, vb-glow-pulse 600ms ease-in-out 2`
  }
  return base
}

export function FloatingScore({ items }: FloatingScoreProps) {
  if (items.length === 0) return null

  return (
    <>
      {items.map(({ id, color, multiplier, x, y }) => {
        const fontSize = getLabelSize(multiplier)
        const offsetY = 30 + multiplier * 4

        return (
          <div
            key={id}
            style={{
              position: 'fixed',
              left: x - fontSize / 2,
              top: y - offsetY,
              fontFamily: 'var(--vb-font-score)',
              fontSize,
              fontWeight: 900,
              color: getLabelColor(color, multiplier),
              textShadow: getLabelGlow(color, multiplier),
              animation: getAnimation(multiplier),
              pointerEvents: 'none',
              zIndex: 150,
              whiteSpace: 'nowrap',
              lineHeight: 1,
              userSelect: 'none',
            } as React.CSSProperties}
          >
            +{multiplier}
          </div>
        )
      })}
    </>
  )
}
