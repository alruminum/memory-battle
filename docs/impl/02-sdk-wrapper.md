# 02. SDK 래퍼 · DB 클라이언트

## 생성 파일
- `src/types/index.ts`
- `src/lib/supabase.ts`
- `src/lib/ait.ts`

---

## src/types/index.ts

```typescript
export type GameStatus = 'IDLE' | 'SHOWING' | 'INPUT' | 'RESULT'
export type ButtonColor = 'orange' | 'blue' | 'green' | 'yellow'
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
```

---

## src/lib/supabase.ts

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## src/lib/ait.ts

### IS_SANDBOX 플래그
```typescript
const IS_SANDBOX = import.meta.env.DEV || import.meta.env.VITE_SANDBOX === 'true'
```

### getUserId()
- `getOperationalEnvironment()` 체크
- 비-Toss 환경(샌드박스/개발): `'dev-user-' + random` 반환
- Toss 환경: `getUserKeyForGame()` → `result.hash`
- 구버전 폴백: `getDeviceId()`

### showRewardAd(): Promise<boolean>
- IS_SANDBOX: 즉시 `resolve(true)` (mock)
- 실제: `loadFullScreenAd` → `onEvent: loaded` → `showFullScreenAd`
  - `userEarnedReward` → `resolve(true)`
  - `dismissed` → `resolve(false)`
  - `onError` → `resolve(false)` (게임 차단 방지)

### attachBannerAd(container: HTMLElement): () => void
- IS_SANDBOX: noop 함수 반환 (레이아웃만 확인)
- 실제: `TossAds.initialize` → `onInitialized` → `TossAds.attachBanner`
- cleanup: `() => TossAds.destroyAll()`

### submitScore(score: number): Promise<void>
- `getOperationalEnvironment() !== 'toss'` 이면 early return
- `submitGameCenterLeaderBoardScore({ score: String(score) })`

### openLeaderboard(): Promise<void>
- `openGameCenterLeaderboard()` 래핑

---

## 광고 ID 상수
```typescript
const REWARD_AD_ID = import.meta.env.VITE_REWARD_AD_ID ?? 'ait-ad-test-rewarded-id'
const BANNER_AD_ID = import.meta.env.VITE_BANNER_AD_ID ?? 'ait-ad-test-banner-id'
```
