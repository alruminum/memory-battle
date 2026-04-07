import React from 'react'
import type { ButtonColor } from '../../types'

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

const BUTTON_COLORS: Record<ButtonColor, string> = {
  orange: 'var(--vb-orange-base)',
  blue:   'var(--vb-blue-base)',
  green:  'var(--vb-green-base)',
  yellow: 'var(--vb-yellow-base)',
}

export function getLabelColor(color: ButtonColor, multiplier: number): string {
  if (multiplier === 1) return '#e8e8ea'
  return BUTTON_COLORS[color]
}

export function getLabelSize(multiplier: number): number {
  return Math.min(20 + (multiplier - 1) * 6, 44)
}

export function getLabelGlow(color: ButtonColor, multiplier: number): string {
  if (multiplier < 3) return 'none'
  const base = BUTTON_COLORS[color]
  const strength = 8 + multiplier * 4
  const spread = 20 + multiplier * 6
  return `0 0 ${strength}px ${base}, 0 0 ${spread}px ${base}88`
}

function getAnimation(multiplier: number): string {
  const base = 'vb-float 800ms cubic-bezier(0.22, 1, 0.36, 1) forwards'
  if (multiplier >= 3) {
    return `${base}, vb-glow-pulse 400ms ease-in-out 2`
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
