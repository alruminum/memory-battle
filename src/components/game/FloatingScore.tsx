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

// IMPORTANT: hex 값은 src/index.css :root의 CSS 변수와 일치해야 한다.
// 색상 변경 시 두 곳 모두 수정 필요:
//   --vb-orange-base, --vb-blue-base, --vb-green-base, --vb-yellow-base
// CSS 변수 문자열 연결(예: 'var(--vb-orange-base)88')은 유효하지 않은 CSS가 되어
// text-shadow 전체가 파싱 실패함 → hex 직접 사용이 유일한 안전한 방법.
const BUTTON_COLORS: Record<ButtonColor, string> = {
  orange: '#FF6200',
  blue:   '#0A7AFF',
  green:  '#18B84A',
  yellow: '#F5C000',
}

export function getLabelColor(color: ButtonColor, _multiplier?: number): string {
  return BUTTON_COLORS[color]
}

const SIZE_TABLE: Record<number, number> = { 1: 24, 2: 30, 3: 36, 4: 40 }

export function getLabelSize(multiplier: number): number {
  if (multiplier >= 5) return 44
  return SIZE_TABLE[multiplier] ?? 24
}

export function getLabelGlow(color: ButtonColor, multiplier: number): string {
  if (multiplier < 2) return 'none'
  const base = BUTTON_COLORS[color]
  const strength = 8 + multiplier * 4
  const spread = 20 + multiplier * 6
  return `0 0 ${strength}px ${base}, 0 0 ${spread}px ${base}88`
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
