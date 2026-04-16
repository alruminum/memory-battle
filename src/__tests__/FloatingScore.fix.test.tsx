/**
 * FloatingScore 버그픽스 검증 테스트 (impl 14-floating-score-fix.md)
 *
 * 검증 범위:
 *   1. getLabelGlow — multiplier >= 3 시 hex 형식 반환 (var(-- 포함 금지)
 *   2. getLabelGlow — multiplier < 2 시 'none' 반환
 *   3. getLabelColor — multiplier === 1 시 버튼 고유색 반환
 *   4. getLabelColor — multiplier > 1 시 hex 색상 반환 (BUTTON_COLORS)
 *   5. FloatingScore 렌더 — animation 스타일에 '1200ms' 포함
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { FloatingScore } from '../components/game/FloatingScore'
import type { FloatingItem } from '../components/game/FloatingScore'
import { getLabelColor, getLabelGlow } from '../components/game/floatingScoreUtils'

// ── TC-1 / TC-2: getLabelGlow ─────────────────────────────────────────────────

describe('getLabelGlow — hex 형식 검증 (impl 14)', () => {
  it('TC-1: multiplier >= 3 시 반환값에 var(-- 문자열이 없어야 한다 (hex 형식)', () => {
    const colors = ['orange', 'blue', 'green', 'yellow'] as const
    for (const color of colors) {
      const result = getLabelGlow(color, 3)
      expect(result).not.toContain('var(--')
    }
  })

  it('TC-1-b: multiplier = 5 (상한값) 시에도 hex 형식이어야 한다', () => {
    const result = getLabelGlow('orange', 5)
    expect(result).not.toContain('var(--')
    // hex 8자리 suffix 포함 확인: #RRGGBBAA
    expect(result).toMatch(/#[0-9A-Fa-f]{6}88/)
  })

  it('TC-2: multiplier < 3 시 "none" 반환 — multiplier = 1', () => {
    expect(getLabelGlow('orange', 1)).toBe('none')
  })

  it('TC-2-b: multiplier = 2 시 글로우 적용 (x2부터 글로우 시작)', () => {
    // strength = 8 + 2*4 = 16, spread = 20 + 2*6 = 32
    expect(getLabelGlow('blue', 2)).toBe('0 0 16px #0A7AFF, 0 0 32px #0A7AFF88')
  })

  it('TC-2-c: multiplier = 3 경계값은 "none" 아님 (>= 3 분기)', () => {
    expect(getLabelGlow('green', 3)).not.toBe('none')
  })
})

// ── TC-3 / TC-4: getLabelColor ────────────────────────────────────────────────

describe('getLabelColor — 색상 반환 검증', () => {
  it('TC-3: multiplier === 1, orange → 버튼 고유색 #FF6200', () => {
    expect(getLabelColor('orange', 1)).toBe('#FF6200')
  })

  it('TC-3-b: multiplier === 1, 각 버튼 고유색 반환', () => {
    expect(getLabelColor('orange', 1)).toBe('#FF6200')
    expect(getLabelColor('blue', 1)).toBe('#0A7AFF')
    expect(getLabelColor('green', 1)).toBe('#18B84A')
    expect(getLabelColor('yellow', 1)).toBe('#F5C000')
  })

  it('TC-4: multiplier > 1 시 hex 색상 반환 (orange)', () => {
    const result = getLabelColor('orange', 2)
    expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(result).toBe('#FF6200')
  })

  it('TC-4-b: multiplier > 1 시 hex 색상 반환 (blue)', () => {
    const result = getLabelColor('blue', 3)
    expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(result).toBe('#0A7AFF')
  })

  it('TC-4-c: multiplier > 1 시 hex 색상 반환 (green)', () => {
    const result = getLabelColor('green', 2)
    expect(result).toBe('#18B84A')
  })

  it('TC-4-d: multiplier > 1 시 hex 색상 반환 (yellow)', () => {
    const result = getLabelColor('yellow', 5)
    expect(result).toBe('#F5C000')
  })
})

// ── TC-5: getAnimation 간접 검증 — FloatingScore 렌더 ─────────────────────────

describe('FloatingScore 렌더 — animation 스타일에 1200ms 포함', () => {
  const makeItem = (multiplier: number): FloatingItem => ({
    id: 1,
    color: 'orange',
    multiplier,
    x: 100,
    y: 200,
  })

  it('TC-5: multiplier=1 아이템 렌더 시 animation 스타일에 "1200ms" 포함', () => {
    const { container } = render(<FloatingScore items={[makeItem(1)]} />)
    const div = container.querySelector('div')
    expect(div).not.toBeNull()
    expect(div!.style.animation).toContain('1200ms')
  })

  it('TC-5-b: multiplier=3 아이템 렌더 시 animation 스타일에 "1200ms" 포함 (glow-pulse 분기)', () => {
    const { container } = render(<FloatingScore items={[makeItem(3)]} />)
    const div = container.querySelector('div')
    expect(div).not.toBeNull()
    expect(div!.style.animation).toContain('1200ms')
  })

  it('TC-5-c: multiplier=5 아이템 렌더 시 animation 스타일에 "1200ms" 포함', () => {
    const { container } = render(<FloatingScore items={[makeItem(5)]} />)
    const div = container.querySelector('div')
    expect(div).not.toBeNull()
    expect(div!.style.animation).toContain('1200ms')
  })

  it('TC-5-d: items가 빈 배열이면 null 렌더 (아무것도 마운트 안 됨)', () => {
    const { container } = render(<FloatingScore items={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
