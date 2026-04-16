# 앱인토스 SDK 연동 (`lib/ait.ts`)

## 유저 식별

- **`getUserKeyForGame()`** 사용 — 게임 카테고리 미니앱 전용 (= 게임 로그인)
- 반환: `{ type: 'HASH', hash: string }` (미니앱별 고유 해시)
- 실패 케이스: `'INVALID_CATEGORY'` | `'ERROR'` | `undefined`(Toss 앱 < 5.232.0 or SDK < 1.4.0)
- 구버전 폴백: `getDeviceId()`
- ⚠️ **샌드박스에서는 mock 데이터 반환** — 실제 hash 검증은 QR 코드로 토스앱에서 직접 테스트 필요
- 콘솔 설정 불필요, 유저 동의 불필요 (토스 로그인과 다른 점)

```typescript
import { getUserKeyForGame, getDeviceId } from '@apps-in-toss/web-framework'

// 샌드박스 분기 상수 — DEV 서버 또는 VITE_SANDBOX=true 세팅 시 true
const IS_SANDBOX = import.meta.env.DEV || import.meta.env.VITE_SANDBOX === 'true'

// 세션 내 동일 userId 유지 (모듈 로드 시 1회 생성)
// Math.random() 대신 crypto.randomUUID() 사용 — 매 호출 시 새 ID 생성으로 인한 Supabase 기록 분산 버그 방지
const DEV_USER_ID = 'dev-user-' + crypto.randomUUID()

export async function getUserId(): Promise<string> {
  if (IS_SANDBOX) return DEV_USER_ID  // 샌드박스: 세션 고정 mock ID

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
```

---

## 샌드박스 분기 전략

**모든 SDK 호출은 `IS_SANDBOX` 플래그로 환경 분기한다.**

```typescript
// lib/ait.ts 최상단에 선언
const IS_SANDBOX = import.meta.env.DEV || import.meta.env.VITE_SANDBOX === 'true'
```

| 조건 | IS_SANDBOX 값 |
|---|---|
| `npm run dev` (vite dev server) | `true` |
| `VITE_SANDBOX=true` 환경변수 세팅 | `true` |
| 실제 토스앱 (라이브/검수 빌드) | `false` |

> **`import.meta.env.DEV`만으로 분기하지 않는 이유**: 빌드 후(`npm run build`) 라이브 토스앱에서
> 테스트할 때 DEV는 `false`가 되므로, `VITE_SANDBOX=true` 플래그를 병행해야 한다.

---

## 광고 ID 관리

**개발 중에는 반드시 테스트 ID 사용. 라이브 ID를 개발/테스트에 사용하면 계정 제재.**

| 광고 타입 | 개발용 테스트 ID | 라이브 ID |
|---|---|---|
| 리워드 광고 | `ait-ad-test-rewarded-id` | 콘솔에서 발급 |
| 전면 광고 | `ait-ad-test-interstitial-id` | 콘솔에서 발급 |
| 배너 (리스트형) | `ait-ad-test-banner-id` | 콘솔에서 발급 |
| 배너 (네이티브) | `ait-ad-test-native-image-id` | 콘솔에서 발급 |

env 변수로 환경별 분기 권장:
```typescript
// ⚠️ 변수명: VITE_REWARD_AD_GROUP_ID / VITE_BANNER_AD_GROUP_ID  (_ID가 아닌 _GROUP_ID)
const REWARD_AD_GROUP_ID = import.meta.env.VITE_REWARD_AD_GROUP_ID ?? 'ait-ad-test-rewarded-id'
const BANNER_AD_GROUP_ID = import.meta.env.VITE_BANNER_AD_GROUP_ID ?? 'ait-ad-test-banner-id'
```

---

## ⚠️ 광고 샌드박스 미지원

**배너 광고 / 리워드 광고 모두 샌드박스에서 동작하지 않음.**

개발 시 대응 방법:
- `IS_SANDBOX` 플래그로 광고 mock 분기 처리 (`import.meta.env.DEV` 단독 사용 금지)
- 배너: 샌드박스에서 placeholder div로 대체 (레이아웃 확인용)
- 리워드: 샌드박스에서 `showRewardAd()` → 즉시 `resolve(true)` 반환하는 mock 함수 사용
- 실제 광고 동작은 검수 환경(라이브 빌드 + 실제 토스앱)에서만 확인 가능

---

## 리워드 광고

- API: `loadFullScreenAd()` → `showFullScreenAd()` 2단계
- **기회 지급은 `userEarnedReward` 이벤트에서만** (dismissed에서 지급 금지)
- 광고 닫힌 후 즉시 다음 광고 preload

```typescript
// 공식 타입: loadFullScreenAd({ onEvent, onError, options?: { adGroupId } }): () => void
// 공식 타입: showFullScreenAd({ onEvent, onError, options?: { adGroupId } }): () => void
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework'

export function showRewardAd(): Promise<boolean> {
  if (IS_SANDBOX) return Promise.resolve(true)  // 샌드박스 mock

  return new Promise((resolve) => {
    let loaded = false
    const unsubscribe = loadFullScreenAd({
      options: { adGroupId: REWARD_AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded' && !loaded) {
          loaded = true
          unsubscribe()
          showFullScreenAd({
            options: { adGroupId: REWARD_AD_GROUP_ID },
            onEvent: (showEvent) => {
              if (showEvent.type === 'userEarnedReward') resolve(true)
              else if (showEvent.type === 'dismissed')   resolve(false)
            },
            onError: () => resolve(false),
          })
        }
      },
      onError: () => resolve(false),
    })
    setTimeout(() => { unsubscribe(); resolve(false) }, 10000)
  })
}
```

---

## 배너 광고

- API: `TossAds.initialize()` → `TossAds.attachBanner(element)`
- 컨테이너: width 100%, height 96px, **반드시 빈 엘리먼트**
- 컴포넌트 언마운트 시 `destroy()` 필수 (메모리 누수 방지)

```typescript
// 공식 타입: TossAds.initialize({ callbacks?: { onInitialized?, onInitializationFailed? } })
// 공식 타입: TossAds.attachBanner(adGroupId, target) → { destroy: () => void }
import { TossAds } from '@apps-in-toss/web-framework'

export function attachBannerAd(container: HTMLElement): () => void {
  if (IS_SANDBOX) return () => {}  // 샌드박스 mock — placeholder만 표시

  let bannerSlot: { destroy: () => void } | null = null

  TossAds.initialize({
    callbacks: {
      onInitialized: () => {
        bannerSlot = TossAds.attachBanner(BANNER_AD_GROUP_ID, container)
      },
      onInitializationFailed: () => {},
    },
  })
  // attachBanner 반환값의 destroy() 호출 (TossAds.destroyAll() 대신)
  return () => bannerSlot?.destroy()
}
```

**BannerAd.tsx 사용 예시**:
```tsx
const containerRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  if (!containerRef.current) return
  const cleanup = attachBannerAd(containerRef.current)
  return cleanup
}, [])

return <div ref={containerRef} style={{ width: '100%', height: 96 }} />
```

---

## 프로모션 리워드 지급 (`grantPromotionReward`) ⚠️ v0.4 변경

- API: `grantPromotionReward({ params: { promotionCode, amount } })` — 토스포인트 지급
- **v0.4: 코인 10개 소모 시 수동 교환** (기존 게임오버 자동 지급 방식 폐지)
- 신규 promotionCode: `VITE_COIN_EXCHANGE_CODE` 환경변수 (운영에서 사전 등록 필수)
- ⚠️ **샌드박스에서 호출 금지** — `IS_SANDBOX` 분기 필수

```typescript
import { grantPromotionReward } from '@apps-in-toss/web-framework'

// ⚠️ 운영에서 프로모션 코드 사전 등록 필요 — 등록 전 호출 시 SDK 에러
const COIN_EXCHANGE_CODE   = import.meta.env.VITE_COIN_EXCHANGE_CODE ?? 'COIN_EXCHANGE'
const COIN_EXCHANGE_AMOUNT = 10  // 10포인트 = 10원

// [v0.4] 코인 10개 → 토스포인트 10포인트 교환
// ⚠️ [구현 예정 — Epic 12 impl-06 완료 후 ait.ts에 추가, 현재 미구현]
// SDK 성공 시에만 DB balance 차감 (ResultPage에서 호출, 실패 시 DB 차감 없음)
export async function grantCoinExchange(): Promise<void> {
  if (IS_SANDBOX) return  // 샌드박스: no-op
  await grantPromotionReward({
    params: { promotionCode: COIN_EXCHANGE_CODE, amount: COIN_EXCHANGE_AMOUNT }
  })
}

// [예정 — Epic 12 완료 후 삭제] grantDailyReward — daily_reward 로직 제거 예정, 현재 ait.ts에 현역 존재
// export async function grantDailyReward(): Promise<void> { ... }
```

**호출 흐름 (v0.4)**:
```
ResultPage (게임오버 화면)
  └── [교환 버튼 클릭] → grantCoinExchange()  ← lib/ait.ts
        ├── SDK 성공 → useCoin.deductCoins(10, 'toss_points_exchange')
        │     └── Supabase: user_coins balance-=10 + coin_transactions INSERT
        └── SDK 실패 → throw → ResultPage catch → "잠시 후 다시 시도해주세요" 표시
```

> SDK 실패 시 DB 차감 없음 — 토스포인트 미지급 상태 + 코인 잔액 유지.

---

## `granite.config.ts` (v2.x 실제 포맷)

```typescript
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'memory-battle',   // 앱인토스 콘솔 등록명과 반드시 일치
  brand: {
    displayName: '기억력배틀',
    primaryColor: '#ff6900',
    icon: 'https://static.toss.im/icons/png/4x/icon-person-man.png', // 임시 아이콘, 콘솔 등록 후 실제 URL로 교체
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'tsc -b && vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
  webViewProps: {
    type: 'game',
  },
});
```

> `appName`은 앱인토스 콘솔 등록명과 **정확히 일치**해야 함. 다르면 SDK 초기화 실패.
>
> ⚠️ 샘플 레포(github.com/toss/apps-in-toss-examples)는 `web-framework 0.0.102` 기준으로 포맷이 다름. 샘플 `granite.config.ts` 그대로 복붙 금지.

---

## 게임센터 리더보드

- `submitGameCenterLeaderBoardScore({ score: string })` — 게임 오버 시 점수 제출
- `openGameCenterLeaderboard()` — 친구랭킹 + 전체랭킹 내장 UI 오픈 (탭 2개 제공)
- ⚠️ **리더보드는 게임당 1개만** 지원 — 일간/월간/시즌 별도 구성 불가
- 콘솔에서 리더보드 사전 등록 필요

**활용 방향**: 토스 리더보드(친구/전체 소셜 랭킹) + Supabase(일간/월간/시즌 기간별 랭킹) 병행

```typescript
import {
  submitGameCenterLeaderBoardScore,
  openGameCenterLeaderboard,
  getOperationalEnvironment,
} from '@apps-in-toss/web-framework'

// ⚠️ getOperationalEnvironment()는 동기 함수 — await 불필요, async 컨텍스트 불필요
// 게임 오버 시 호출 — Toss 환경에서만 실행 (샌드박스/개발환경 방지)
if (getOperationalEnvironment() === 'toss') {
  await submitGameCenterLeaderBoardScore({ score: String(finalScore) })
}

// ResultPage "친구 랭킹 보기" 버튼
if (getOperationalEnvironment() === 'toss') {
  await openGameCenterLeaderboard()
}
```

---

## Toss 앱 최소 버전 요구사항

| 기능 | 최소 버전 |
|---|---|
| getUserKeyForGame | 5.232.0 |
| 배너 광고 | 5.241.0 |
| 전면/리워드 광고 | 5.227.0 |
| 게임센터 리더보드 | 5.221.0 |

---

## QA 체크리스트

### 샌드박스(npm run dev)에서 검증 가능한 항목

```
□ 게임 기본 흐름: IDLE → SHOWING → INPUT → RESULT
□ 스테이지 진행에 따른 입력 타이머 감소 확인 (1~9: 2000ms / 10~19: 1800ms / 20~29: 1600ms / 30+: 1400ms)
□ 스택형 콤보 계산 (streak 0~4: x1 / 5~9: x2 / 10~14: x3 / 15~19: x4 / 20+: x5)
□ 게임오버 오버레이 노출 → 리워드광고 mock → IS_SANDBOX에서 즉시 resolve(true)
□ 코인 mock (IS_SANDBOX → showRewardAd 즉시 resolve(true), 코인 2개 고정 지급 + Supabase 기록 동작)
□ 배너광고 placeholder 레이아웃 (높이 96px 확인)
□ 메인 → 게임 → 결과 → 랭킹 페이지 전환
□ 뒤로가기(popstate) → main 이동 + 게임 리셋
□ isNewBest 표시 (첫 게임 vs 기록 갱신 vs 기록 미갱신)
```

### 실제 토스앱(QR 스캔)에서만 검증 가능한 항목

```
□ 실제 배너 광고 노출 및 레이아웃
□ 리워드 광고 완시청 → 코인 1~5개 랜덤 지급 + user_coins/coin_transactions DB 업데이트 확인
□ [교환 버튼] 10코인 → grantCoinExchange() → 10포인트 지급 + DB balance-=10 확인
□ getUserKeyForGame() 실제 hash 반환 확인
□ 게임센터 리더보드 점수 제출 (submitScore)
□ openGameCenterLeaderboard() 친구/전체 랭킹 내장 UI
□ 뒤로가기 네이티브 버튼 동작
```
