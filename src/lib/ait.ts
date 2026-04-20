import {
  getUserKeyForGame,
  getDeviceId,
  getOperationalEnvironment,
  loadFullScreenAd,
  showFullScreenAd,
  TossAds,
  submitGameCenterLeaderBoardScore,
  openGameCenterLeaderboard,
  grantPromotionRewardForGame,
} from '@apps-in-toss/web-framework'

const IS_SANDBOX = import.meta.env.DEV || import.meta.env.VITE_SANDBOX === 'true'

// adGroupId: 콘솔에서 발급한 광고 그룹 ID
const REWARD_AD_GROUP_ID = import.meta.env.VITE_REWARD_AD_GROUP_ID ?? 'ait-ad-test-rewarded-id'
const BANNER_AD_GROUP_ID = import.meta.env.VITE_BANNER_AD_GROUP_ID ?? 'ait-ad-test-banner-id'

// 세션 내 동일 userId 유지
const DEV_USER_ID = 'dev-user-' + crypto.randomUUID()

export async function getUserId(): Promise<string> {
  if (IS_SANDBOX) return DEV_USER_ID

  try {
    const result = await getUserKeyForGame()
    if (result && typeof result === 'object' && result.type === 'HASH') {
      return result.hash
    }
  } catch {
    // 폴백
  }

  try {
    return await getDeviceId()
  } catch {
    return DEV_USER_ID
  }
}

export function showRewardAd(): Promise<boolean> {
  if (IS_SANDBOX) return Promise.resolve(true)

  return new Promise((resolve) => {
    let loaded = false

    // loadFullScreenAd 공식 시그니처: ({ onEvent, onError, options? }) => () => void
    const unsubscribe = loadFullScreenAd({
      options: { adGroupId: REWARD_AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded' && !loaded) {
          loaded = true
          unsubscribe()

          // showFullScreenAd 공식 시그니처: ({ onEvent, onError, options? }) => () => void
          showFullScreenAd({
            options: { adGroupId: REWARD_AD_GROUP_ID },
            onEvent: (showEvent) => {
              if (showEvent.type === 'userEarnedReward') {
                resolve(true)
              } else if (showEvent.type === 'dismissed') {
                resolve(false)
              }
            },
            onError: () => resolve(false),
          })
        }
      },
      onError: () => resolve(false),
    })

    // 타임아웃 10초
    setTimeout(() => {
      unsubscribe()
      resolve(false)
    }, 10000)
  })
}

export function attachBannerAd(container: HTMLElement): () => void {
  if (IS_SANDBOX) return () => {}

  let bannerSlot: { destroy: () => void } | null = null

  // TossAds.initialize 공식 시그니처: ({ callbacks?: { onInitialized?, onInitializationFailed? } })
  TossAds.initialize({
    callbacks: {
      onInitialized: () => {
        // attachBanner 반환값 { destroy: () => void } 보관
        bannerSlot = TossAds.attachBanner(BANNER_AD_GROUP_ID, container)
      },
      onInitializationFailed: () => {},
    },
  })

  return () => {
    bannerSlot?.destroy()
  }
}

// getOperationalEnvironment는 동기 함수 (await 불필요)
export async function submitScore(score: number): Promise<void> {
  if (getOperationalEnvironment() !== 'toss') return
  await submitGameCenterLeaderBoardScore({ score: String(score) })
}

export async function openLeaderboard(): Promise<void> {
  if (getOperationalEnvironment() !== 'toss') return
  await openGameCenterLeaderboard()
}

const DAILY_REWARD_CODE = 'DAILY_PLAY'
const DAILY_REWARD_AMOUNT = 10

export async function grantDailyReward(): Promise<void> {
  if (IS_SANDBOX) return  // 샌드박스 분기: 실제 포인트 지급 생략
  await grantPromotionRewardForGame({ params: { promotionCode: DAILY_REWARD_CODE, amount: DAILY_REWARD_AMOUNT } })
}

// [v0.4] 코인 10개 → 토스포인트 10포인트 교환
// ⚠️ 운영에서 promotionCode 사전 등록 필요 — 등록 전 호출 시 SDK 에러
// ⚠️ 샌드박스: no-op (실제 포인트 지급 없음)
const COIN_EXCHANGE_CODE   = import.meta.env.VITE_COIN_EXCHANGE_CODE ?? 'COIN_EXCHANGE'
export const COIN_EXCHANGE_AMOUNT = 10  // 10포인트 = 10원

export async function grantCoinExchange(): Promise<void> {
  if (IS_SANDBOX) return  // 샌드박스: no-op
  await grantPromotionRewardForGame({
    params: { promotionCode: COIN_EXCHANGE_CODE, amount: COIN_EXCHANGE_AMOUNT }
  })
}
