import { describe, it, expect } from 'vitest'
import { getLabelColor, getLabelSize, getLabelGlow } from '../components/game/floatingScoreUtils'

// ── F-1. getLabelColor ──────────────────────────────────────────────────────
// 근거: impl/15-floating-score-threshold.md — x1부터 버튼 고유 hex 색상 반환 (흰색 분기 제거)

describe('F-1. getLabelColor', () => {
  it('F-1-1: multiplier=1, orange → 버튼 고유색 #FF6200 (x1부터 버튼색)', () => {
    expect(getLabelColor('orange', 1)).toBe('#FF6200')
  })

  it('F-1-2: multiplier=1, blue → 버튼 고유색 #0A7AFF', () => {
    expect(getLabelColor('blue', 1)).toBe('#0A7AFF')
  })

  it('F-1-3: multiplier=1, green → 버튼 고유색 #18B84A', () => {
    expect(getLabelColor('green', 1)).toBe('#18B84A')
  })

  it('F-1-4: multiplier=1, yellow → 버튼 고유색 #F5C000', () => {
    expect(getLabelColor('yellow', 1)).toBe('#F5C000')
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
// 근거: impl/15-floating-score-threshold.md — 룩업 테이블: x1=24, x2=30, x3=36, x4=40, x5+=44

describe('F-2. getLabelSize', () => {
  it('F-2-1: x1 → 24px', () => {
    expect(getLabelSize(1)).toBe(24)
  })

  it('F-2-2: x2 → 30px', () => {
    expect(getLabelSize(2)).toBe(30)
  })

  it('F-2-3: x3 → 36px', () => {
    expect(getLabelSize(3)).toBe(36)
  })

  it('F-2-4: x4 → 40px', () => {
    expect(getLabelSize(4)).toBe(40)
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
// 근거: impl/15-floating-score-threshold.md — x1 → 'none', x2+ → text-shadow 문자열
// 공식: strength = 8 + multiplier * 4, spread = 20 + multiplier * 6
// (impl/14-floating-score-fix.md: CSS 변수 대신 hex 직접값 사용 — 'var(--vb-orange-base)88' 파싱 실패 수정)

describe('F-3. getLabelGlow', () => {
  it('F-3-1: x1, orange → "none" (글로우 없음)', () => {
    expect(getLabelGlow('orange', 1)).toBe('none')
  })

  it('F-3-2: x2, blue → 글로우 적용 (x2부터 글로우 시작)', () => {
    // strength = 8 + 2*4 = 16, spread = 20 + 2*6 = 32
    expect(getLabelGlow('blue', 2)).toBe('0 0 16px #0A7AFF, 0 0 32px #0A7AFF88')
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
