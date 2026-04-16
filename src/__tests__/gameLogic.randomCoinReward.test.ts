/**
 * randomCoinReward() 단위 테스트
 * impl: docs/milestones/v04/epics/epic-12-coin-v04/impl/03-ad-coin-reward.md
 * issue: #109
 *
 * 확률 테이블:
 *   amount=1 : weight=30 → roll ∈ [0, 30)
 *   amount=2 : weight=30 → roll ∈ [30, 60)
 *   amount=3 : weight=25 → roll ∈ [60, 85)
 *   amount=4 : weight=10 → roll ∈ [85, 95)
 *   amount=5 : weight=5  → roll ∈ [95, 100)
 *   fallback=1            → roll ≥ 100 (이론상 불가)
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { randomCoinReward } from '../lib/gameLogic'

describe('randomCoinReward() — 가중치 랜덤 코인 지급 (#109)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ===================================================================
  // 정상 흐름 — 각 구간 중앙값
  // ===================================================================

  it('정상 흐름 | roll=0 (Math.random=0) → 1코인 반환', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(randomCoinReward()).toBe(1)
  })

  it('정상 흐름 | roll=15 → 1코인 반환 (1코인 구간 중앙)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.15)
    expect(randomCoinReward()).toBe(1)
  })

  it('정상 흐름 | roll=45 → 2코인 반환 (2코인 구간 중앙)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.45)
    expect(randomCoinReward()).toBe(2)
  })

  it('정상 흐름 | roll=72 → 3코인 반환 (3코인 구간 중앙)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.72)
    expect(randomCoinReward()).toBe(3)
  })

  it('정상 흐름 | roll=90 → 4코인 반환 (4코인 구간 중앙)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.90)
    expect(randomCoinReward()).toBe(4)
  })

  it('정상 흐름 | roll=97 → 5코인 반환 (5코인 구간 중앙)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.97)
    expect(randomCoinReward()).toBe(5)
  })

  // ===================================================================
  // 엣지 케이스 — 각 bucket 경계값
  // ===================================================================

  it('엣지 | roll=29.99 → 1코인 반환 (1코인 상한 경계)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2999)
    expect(randomCoinReward()).toBe(1)
  })

  it('엣지 | roll=30 → 2코인 반환 (2코인 시작 경계)', () => {
    // roll=30: cumulative=30 → 30 < 30 false → cumulative=60 → 30 < 60 true
    vi.spyOn(Math, 'random').mockReturnValue(0.30)
    expect(randomCoinReward()).toBe(2)
  })

  it('엣지 | roll=59.99 → 2코인 반환 (2코인 상한 경계)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5999)
    expect(randomCoinReward()).toBe(2)
  })

  it('엣지 | roll=60 → 3코인 반환 (3코인 시작 경계)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.60)
    expect(randomCoinReward()).toBe(3)
  })

  it('엣지 | roll=84.99 → 3코인 반환 (3코인 상한 경계)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.8499)
    expect(randomCoinReward()).toBe(3)
  })

  it('엣지 | roll=85 → 4코인 반환 (4코인 시작 경계)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.85)
    expect(randomCoinReward()).toBe(4)
  })

  it('엣지 | roll=94.99 → 4코인 반환 (4코인 상한 경계)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9499)
    expect(randomCoinReward()).toBe(4)
  })

  it('엣지 | roll=95 → 5코인 반환 (5코인 시작 경계)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.95)
    expect(randomCoinReward()).toBe(5)
  })

  it('엣지 | roll=99.99 → 5코인 반환 (최댓값 경계)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9999)
    expect(randomCoinReward()).toBe(5)
  })

  // ===================================================================
  // 에러 처리 — fallback 경로
  // ===================================================================

  it('에러 처리 | Math.random()=1.0 (roll=100, 누적합 전부 통과) → fallback 1코인 반환', () => {
    // roll = 1.0 * 100 = 100 → 모든 cumulative(30/60/85/95/100)에서 100 < x false
    // → for 루프 종료 → return 1 (fallback)
    vi.spyOn(Math, 'random').mockReturnValue(1.0)
    expect(randomCoinReward()).toBe(1)
  })

  // ===================================================================
  // 정상 흐름 — 1000회 통계 분포 검증 (impl 명세: ±5% 이내)
  // ===================================================================

  it('정상 흐름 | 1000회 호출 시 확률 분포가 명세(±5%) 이내', () => {
    vi.restoreAllMocks() // 실제 Math.random 사용

    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (let i = 0; i < 1000; i++) {
      const result = randomCoinReward()
      counts[result] = (counts[result] ?? 0) + 1
    }

    // 1코인: 30% ± 5% → [250, 350]
    expect(counts[1]).toBeGreaterThanOrEqual(250)
    expect(counts[1]).toBeLessThanOrEqual(350)

    // 2코인: 30% ± 5% → [250, 350]
    expect(counts[2]).toBeGreaterThanOrEqual(250)
    expect(counts[2]).toBeLessThanOrEqual(350)

    // 3코인: 25% ± 5% → [200, 300]
    expect(counts[3]).toBeGreaterThanOrEqual(200)
    expect(counts[3]).toBeLessThanOrEqual(300)

    // 4코인: 10% ± 5% → [50, 150]
    expect(counts[4]).toBeGreaterThanOrEqual(50)
    expect(counts[4]).toBeLessThanOrEqual(150)

    // 5코인: 5% ± 5% → [0, 100]
    expect(counts[5]).toBeGreaterThanOrEqual(0)
    expect(counts[5]).toBeLessThanOrEqual(100)

    // 총합 = 1000
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    expect(total).toBe(1000)
  })
})
