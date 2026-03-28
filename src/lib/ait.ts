import {
  getUserKeyForGame,
  getDeviceId,
  getOperationalEnvironment,
  loadFullScreenAd,
  showFullScreenAd,
  TossAds,
  submitGameCenterLeaderBoardScore,
  openGameCenterLeaderboard,
} from '@apps-in-toss/web-framework'

const IS_SANDBOX = import.meta.env.DEV || import.meta.env.VITE_SANDBOX === 'true'

const REWARD_AD_ID = import.meta.env.VITE_REWARD_AD_ID ?? 'ait-ad-test-rewarded-id'
const BANNER_AD_ID = import.meta.env.VITE_BANNER_AD_ID ?? 'ait-ad-test-banner-id'

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

    const unsubscribe = loadFullScreenAd(
      { adId: REWARD_AD_ID },
      (event) => {
        if (event.type === 'loaded' && !loaded) {
          loaded = true
          showFullScreenAd(
            { adId: REWARD_AD_ID },
            (showEvent) => {
              if (showEvent.type === 'userEarnedReward') {
                resolve(true)
              } else if (showEvent.type === 'dismissed') {
                resolve(false)
              }
            },
            () => resolve(false)
          )
        }
      },
      () => resolve(false)
    )

    // 타임아웃 10초
    setTimeout(() => {
      unsubscribe?.()
      resolve(false)
    }, 10000)
  })
}

export function attachBannerAd(container: HTMLElement): () => void {
  if (IS_SANDBOX) return () => {}

  TossAds.initialize({
    onInitialized: () => {
      TossAds.attachBanner(BANNER_AD_ID, container)
    },
  })

  return () => TossAds.destroyAll()
}

export async function submitScore(score: number): Promise<void> {
  if (getOperationalEnvironment() !== 'toss') return
  await submitGameCenterLeaderBoardScore({ score: String(score) })
}

export async function openLeaderboard(): Promise<void> {
  await openGameCenterLeaderboard()
}
