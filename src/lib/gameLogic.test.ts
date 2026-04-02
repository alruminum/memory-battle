import { describe, it, expect } from 'vitest'
import {
  getFlashDuration,
  getComboMultiplier,
  calcClearBonus,
  calcBaseStageScore,
  calcStageScore,
  getInputTimeout,
} from './gameLogic'

// ── A-1. getFlashDuration ──────────────────────────────────────────────────

describe('getFlashDuration', () => {
  it('stage 1 → 500ms', () => {
    expect(getFlashDuration(1)).toBe(500)
  })

  it('stage 9 → 500ms (경계 직전)', () => {
    expect(getFlashDuration(9)).toBe(500)
  })

  it('stage 10 → 400ms (경계 시작)', () => {
    expect(getFlashDuration(10)).toBe(400)
  })

  it('stage 19 → 400ms (경계 직전)', () => {
    expect(getFlashDuration(19)).toBe(400)
  })

  it('stage 20 → 300ms', () => {
    expect(getFlashDuration(20)).toBe(300)
  })

  it('stage 29 → 300ms (30 직전)', () => {
    expect(getFlashDuration(29)).toBe(300)
  })

  it('stage 30 → 250ms', () => {
    expect(getFlashDuration(30)).toBe(250)
  })

  it('stage 0 (게임 시작 전) → 500ms', () => {
    expect(getFlashDuration(0)).toBe(500)
  })

  it('stage 100 (매우 큰 값) → 250ms', () => {
    expect(getFlashDuration(100)).toBe(250)
  })
})

// ── A-2. getComboMultiplier ────────────────────────────────────────────────

describe('getComboMultiplier', () => {
  it('streak 0 → x1 (콤보 없음)', () => {
    expect(getComboMultiplier(0)).toBe(1)
  })

  it('streak 4 → x1 (배율 상승 직전)', () => {
    expect(getComboMultiplier(4)).toBe(1)
  })

  it('streak 5 → x2 (첫 배율 상승)', () => {
    expect(getComboMultiplier(5)).toBe(2)
  })

  it('streak 9 → x2', () => {
    expect(getComboMultiplier(9)).toBe(2)
  })

  it('streak 10 → x3', () => {
    expect(getComboMultiplier(10)).toBe(3)
  })

  it('streak 15 → x4', () => {
    expect(getComboMultiplier(15)).toBe(4)
  })

  it('streak 20 → x5', () => {
    expect(getComboMultiplier(20)).toBe(5)
  })

  it('streak 25 → x6 (상한 없음 확인)', () => {
    expect(getComboMultiplier(25)).toBe(6)
  })

  it('streak 100 → x21 (매우 큰 값)', () => {
    expect(getComboMultiplier(100)).toBe(21)
  })
})

// ── A-3. calcClearBonus ────────────────────────────────────────────────────

describe('calcClearBonus', () => {
  it('stage 1 → 보너스 없음', () => {
    expect(calcClearBonus(1)).toBe(0)
  })

  it('stage 9 → 보너스 없음 (경계 직전)', () => {
    expect(calcClearBonus(9)).toBe(0)
  })

  it('stage 10 → 보너스 2 (경계 시작)', () => {
    expect(calcClearBonus(10)).toBe(2)
  })

  it('stage 15 → 보너스 3', () => {
    expect(calcClearBonus(15)).toBe(3)
  })

  it('stage 20 → 보너스 4', () => {
    expect(calcClearBonus(20)).toBe(4)
  })

  it('stage 0 → 보너스 없음', () => {
    expect(calcClearBonus(0)).toBe(0)
  })

  it('stage 14 → 보너스 2 (15 직전)', () => {
    expect(calcClearBonus(14)).toBe(2)
  })
})

// ── A-4. calcBaseStageScore ────────────────────────────────────────────────

describe('calcBaseStageScore', () => {
  it('stage 5 → 5+0 = 5', () => {
    expect(calcBaseStageScore(5)).toBe(5)
  })

  it('stage 10 → 10+2 = 12', () => {
    expect(calcBaseStageScore(10)).toBe(12)
  })

  it('stage 15 → 15+3 = 18', () => {
    expect(calcBaseStageScore(15)).toBe(18)
  })

  it('stage 1 → 1+0 = 1 (최소값)', () => {
    expect(calcBaseStageScore(1)).toBe(1)
  })
})

// ── A-5. calcStageScore ────────────────────────────────────────────────────

describe('calcStageScore', () => {
  it('배율 x1 (streak=0): 5×1 = 5', () => {
    expect(calcStageScore(5, 0)).toBe(5)
  })

  it('배율 x2 (streak=5): 12×2 = 24', () => {
    expect(calcStageScore(12, 5)).toBe(24)
  })

  it('배율 x3 (streak=10): 18×3 = 54', () => {
    expect(calcStageScore(18, 10)).toBe(54)
  })

  it('rawScore=0이면 결과도 0', () => {
    expect(calcStageScore(0, 5)).toBe(0)
  })
})

// ── A-6. getInputTimeout ──────────────────────────────────────────────────
// 근거: src/lib/gameLogic.ts 주석 — stage 1~9: 2000ms / 10~19: 1800ms / 20~29: 1600ms / 30+: 1400ms

describe('getInputTimeout', () => {
  it('stage 1 → 2000ms', () => {
    expect(getInputTimeout(1)).toBe(2000)
  })

  it('stage 9 → 2000ms (10 경계 직전)', () => {
    expect(getInputTimeout(9)).toBe(2000)
  })

  it('stage 10 → 1800ms (경계 시작)', () => {
    expect(getInputTimeout(10)).toBe(1800)
  })

  it('stage 19 → 1800ms (20 경계 직전)', () => {
    expect(getInputTimeout(19)).toBe(1800)
  })

  it('stage 20 → 1600ms (경계 시작)', () => {
    expect(getInputTimeout(20)).toBe(1600)
  })

  it('stage 29 → 1600ms (30 경계 직전)', () => {
    expect(getInputTimeout(29)).toBe(1600)
  })

  it('stage 30 → 1400ms (하한 시작)', () => {
    expect(getInputTimeout(30)).toBe(1400)
  })

  it('stage 0 → 2000ms (기본값)', () => {
    expect(getInputTimeout(0)).toBe(2000)
  })

  it('stage 100 → 1400ms (매우 큰 값, 하한 고정)', () => {
    expect(getInputTimeout(100)).toBe(1400)
  })
})
