/**
 * ait.ts — grantCoinExchange() 테스트
 * impl: docs/milestones/v04/epics/epic-12-coin-v04/impl/06-toss-points-exchange.md
 * issue: #112
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// @apps-in-toss/web-framework 전체 mock
vi.mock('@apps-in-toss/web-framework', () => ({
  getUserKeyForGame: vi.fn(),
  getDeviceId: vi.fn(),
  getOperationalEnvironment: vi.fn(() => 'toss'),
  loadFullScreenAd: vi.fn(),
  showFullScreenAd: vi.fn(),
  TossAds: { initialize: vi.fn(), attachBanner: vi.fn() },
  submitGameCenterLeaderBoardScore: vi.fn(),
  openGameCenterLeaderboard: vi.fn(),
  grantPromotionReward: vi.fn().mockResolvedValue(undefined),
}))

// ─── 샌드박스 환경 (Vitest 기본 DEV=true → IS_SANDBOX=true) ───────────────
describe('grantCoinExchange — 샌드박스 환경 (IS_SANDBOX=true)', () => {
  it('정상 흐름: 샌드박스에서 grantPromotionReward를 호출하지 않는다', async () => {
    const { grantPromotionReward } = await import('@apps-in-toss/web-framework')
    const mockFn = vi.mocked(grantPromotionReward)
    mockFn.mockClear()

    const { grantCoinExchange } = await import('../lib/ait')
    await grantCoinExchange()

    expect(mockFn).not.toHaveBeenCalled()
  })

  it('정상 흐름: 샌드박스에서 반환값은 undefined (no-op)', async () => {
    const { grantCoinExchange } = await import('../lib/ait')
    const result = await grantCoinExchange()
    expect(result).toBeUndefined()
  })
})

// ─── 비샌드박스 환경 (DEV=false 강제) ────────────────────────────────────────
describe('grantCoinExchange — 비샌드박스 환경 (IS_SANDBOX=false)', () => {
  beforeEach(() => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_SANDBOX', 'false')
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('정상 흐름: grantPromotionReward를 올바른 params(promotionCode, amount)로 호출한다', async () => {
    // .env에 VITE_COIN_EXCHANGE_CODE= (빈 문자열)이 설정돼 있을 수 있으므로
    // undefined로 명시 stub → ?? fallback 'COIN_EXCHANGE' 동작 확인
    vi.stubEnv('VITE_COIN_EXCHANGE_CODE', undefined)
    const mockGrantPromotion = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@apps-in-toss/web-framework', () => ({
      getUserKeyForGame: vi.fn(),
      getDeviceId: vi.fn(),
      getOperationalEnvironment: vi.fn(() => 'toss'),
      loadFullScreenAd: vi.fn(),
      showFullScreenAd: vi.fn(),
      TossAds: { initialize: vi.fn(), attachBanner: vi.fn() },
      submitGameCenterLeaderBoardScore: vi.fn(),
      openGameCenterLeaderboard: vi.fn(),
      grantPromotionReward: mockGrantPromotion,
    }))

    const { grantCoinExchange } = await import('../lib/ait')
    await grantCoinExchange()

    expect(mockGrantPromotion).toHaveBeenCalledTimes(1)
    expect(mockGrantPromotion).toHaveBeenCalledWith({
      params: { promotionCode: 'COIN_EXCHANGE', amount: 10 },
    })
  })

  it('엣지 케이스: VITE_COIN_EXCHANGE_CODE 환경변수 설정 시 해당 값을 promotionCode로 사용한다', async () => {
    vi.stubEnv('VITE_COIN_EXCHANGE_CODE', 'MY_CUSTOM_CODE')
    const mockGrantPromotion = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@apps-in-toss/web-framework', () => ({
      getUserKeyForGame: vi.fn(),
      getDeviceId: vi.fn(),
      getOperationalEnvironment: vi.fn(),
      loadFullScreenAd: vi.fn(),
      showFullScreenAd: vi.fn(),
      TossAds: { initialize: vi.fn(), attachBanner: vi.fn() },
      submitGameCenterLeaderBoardScore: vi.fn(),
      openGameCenterLeaderboard: vi.fn(),
      grantPromotionReward: mockGrantPromotion,
    }))

    const { grantCoinExchange } = await import('../lib/ait')
    await grantCoinExchange()

    expect(mockGrantPromotion).toHaveBeenCalledWith({
      params: { promotionCode: 'MY_CUSTOM_CODE', amount: 10 },
    })
  })

  it('에러 처리: grantPromotionReward 실패 시 에러가 호출자에게 전파된다', async () => {
    const sdkError = new Error('SDK_ERROR')
    vi.doMock('@apps-in-toss/web-framework', () => ({
      getUserKeyForGame: vi.fn(),
      getDeviceId: vi.fn(),
      getOperationalEnvironment: vi.fn(),
      loadFullScreenAd: vi.fn(),
      showFullScreenAd: vi.fn(),
      TossAds: { initialize: vi.fn(), attachBanner: vi.fn() },
      submitGameCenterLeaderBoardScore: vi.fn(),
      openGameCenterLeaderboard: vi.fn(),
      grantPromotionReward: vi.fn().mockRejectedValue(sdkError),
    }))

    const { grantCoinExchange } = await import('../lib/ait')
    await expect(grantCoinExchange()).rejects.toThrow('SDK_ERROR')
  })
})
