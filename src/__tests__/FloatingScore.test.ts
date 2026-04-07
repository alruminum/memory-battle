import { describe, it, expect } from 'vitest'
import { getLabelColor, getLabelSize, getLabelGlow } from '../components/game/FloatingScore'

// ── F-1. getLabelColor ──────────────────────────────────────────────────────
// 근거: impl/10-floating-score.md — x1은 흰색 #e8e8ea, x2+는 버튼 고유 hex 색상
// (impl/14-floating-score-fix.md: CSS 변수+hex suffix 파싱 실패로 hex 직접 반환으로 변경)

describe('F-1. getLabelColor', () => {
  it('F-1-1: multiplier=1, orange → 흰색 #e8e8ea (x1 고정)', () => {
    expect(getLabelColor('orange', 1)).toBe('#e8e8ea')
  })

  it('F-1-2: multiplier=1, blue → 흰색 #e8e8ea (색상 무관, x1은 항상 흰색)', () => {
    expect(getLabelColor('blue', 1)).toBe('#e8e8ea')
  })

  it('F-1-3: multiplier=1, green → 흰색 #e8e8ea', () => {
    expect(getLabelColor('green', 1)).toBe('#e8e8ea')
  })

  it('F-1-4: multiplier=1, yellow → 흰색 #e8e8ea', () => {
    expect(getLabelColor('yellow', 1)).toBe('#e8e8ea')
  })

  it('F-1-5: multiplier=2, orange → #FF6200', () => {
    expect(getLabelColor('orange', 2)).toBe('#FF6200')
  })

  it('F-1-6: multiplier=2, blue → #0A7AFF', () => {
    expect(getLabelColor('blue', 2)).toBe('#0A7AFF')
  })

  it('F-1-7: multiplier=3, green → #18B84A', () => {
    expect(getLabelColor('green', 3)).toBe('#18B84A')
  })

  it('F-1-8: multiplier=5, yellow → #F5C000', () => {
    expect(getLabelColor('yellow', 5)).toBe('#F5C000')
  })
})

// ── F-2. getLabelSize ───────────────────────────────────────────────────────
// 근거: impl/10-floating-score.md — 배율별 크기 계단: x1=20, x2=26, x3=32, x4=38, x5+=44
// 공식: Math.min(20 + (multiplier - 1) * 6, 44)

describe('F-2. getLabelSize', () => {
  it('F-2-1: x1 → 20px', () => {
    expect(getLabelSize(1)).toBe(20)
  })

  it('F-2-2: x2 → 26px', () => {
    expect(getLabelSize(2)).toBe(26)
  })

  it('F-2-3: x3 → 32px', () => {
    expect(getLabelSize(3)).toBe(32)
  })

  it('F-2-4: x4 → 38px', () => {
    expect(getLabelSize(4)).toBe(38)
  })

  it('F-2-5: x5 → 44px (상한값 도달)', () => {
    expect(getLabelSize(5)).toBe(44)
  })

  it('F-2-6: x6 → 44px (상한 cap 유지)', () => {
    expect(getLabelSize(6)).toBe(44)
  })

  it('F-2-7: x10 → 44px (매우 큰 배율도 44px cap)', () => {
    expect(getLabelSize(10)).toBe(44)
  })
})

// ── F-3. getLabelGlow ───────────────────────────────────────────────────────
// 근거: impl/10-floating-score.md — x1/x2 → 'none', x3+ → text-shadow 문자열
// 공식: strength = 8 + multiplier * 4, spread = 20 + multiplier * 6
// (impl/14-floating-score-fix.md: CSS 변수 대신 hex 직접값 사용 — 'var(--vb-orange-base)88' 파싱 실패 수정)

describe('F-3. getLabelGlow', () => {
  it('F-3-1: x1, orange → "none" (글로우 없음)', () => {
    expect(getLabelGlow('orange', 1)).toBe('none')
  })

  it('F-3-2: x2, blue → "none" (글로우 없음)', () => {
    expect(getLabelGlow('blue', 2)).toBe('none')
  })

  it('F-3-3: x3, orange → text-shadow 문자열 반환 (not "none")', () => {
    const result = getLabelGlow('orange', 3)
    expect(result).not.toBe('none')
  })

  it('F-3-4: x3, orange → hex 색상 포함 확인 (CSS 변수 미포함)', () => {
    const result = getLabelGlow('orange', 3)
    expect(result).toContain('#FF6200')
    expect(result).not.toContain('var(--')
  })

  it('F-3-5: x3, orange → 정확한 수치 (strength=20, spread=38)', () => {
    // strength = 8 + 3*4 = 20, spread = 20 + 3*6 = 38
    const result = getLabelGlow('orange', 3)
    expect(result).toBe('0 0 20px #FF6200, 0 0 38px #FF620088')
  })

  it('F-3-6: x5, yellow → 정확한 수치 (strength=28, spread=50)', () => {
    // strength = 8 + 5*4 = 28, spread = 20 + 5*6 = 50
    const result = getLabelGlow('yellow', 5)
    expect(result).toBe('0 0 28px #F5C000, 0 0 50px #F5C00088')
  })

  it('F-3-7: 배율 증가 시 글로우 강도 증가 (x3 !== x5)', () => {
    const x3 = getLabelGlow('orange', 3)
    const x5 = getLabelGlow('orange', 5)
    expect(x5).not.toBe(x3)
  })

  it('F-3-8: x3, green → hex 색상 일치 확인 (CSS 변수 미포함)', () => {
    const result = getLabelGlow('green', 3)
    expect(result).toContain('#18B84A')
    expect(result).not.toContain('var(--')
  })
})
