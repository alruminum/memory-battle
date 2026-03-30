# 앱인토스 SDK 연동 (`lib/ait.ts`)

## 유저 식별

- **`getUserKeyForGame()`** 사용 — 게임 카테고리 미니앱 전용 (= 게임 로그인)
- 반환: `{ type: 'HASH', hash: string }` (미니앱별 고유 해시)
- 실패 케이스: `'INVALID_CATEGORY'` | `'ERROR'` | `undefined`(Toss 앱 < 5.232.0 or SDK < 1.4.0)
- 구버전 폴백: `getDeviceId()`
- ⚠️ **샌드박스에서는 mock 데이터 반환** — 실제 hash 검증은 QR 코드로 토스앱에서 직접 테스트 필요
- 콘솔 설정 불필요, 유저 동의 불필요 (토스 로그인과 다른 점)

```typescript
import { getUserKeyForGame, getDeviceId, getOperationalEnvironment } from '@apps-in-toss/web-framework'

export const getUserId = async (): Promise<string> => {
  // 샌드박스에서는 mock 데이터 반환 (실제 hash 아님)
  const env = await getOperationalEnvironment()
  if (env !== 'toss') {
    return 'dev-user-' + Math.random().toString(36).slice(2, 8)
  }
  const result = await getUserKeyForGame()
  if (result && typeof result === 'object' && result.type === 'HASH') {
    return result.hash
  }
  return getDeviceId()  // 구버전 앱 폴백
}
```

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
const REWARD_AD_ID = import.meta.env.VITE_REWARD_AD_ID ?? 'ait-ad-test-rewarded-id'
const BANNER_AD_ID = import.meta.env.VITE_BANNER_AD_ID ?? 'ait-ad-test-banner-id'
```

---

## ⚠️ 광고 샌드박스 미지원

**배너 광고 / 리워드 광고 모두 샌드박스에서 동작하지 않음.**

개발 시 대응 방법:
- `import.meta.env.DEV` 또는 별도 env 플래그로 광고 mock 분기 처리
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
  if (import.meta.env.DEV) return Promise.resolve(true)  // 샌드박스 mock

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
  if (import.meta.env.DEV) return () => {}  // 샌드박스 mock — placeholder만 표시

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

## `granite.config.ts` (v2.x 실제 포맷)

```typescript
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'memory-battle',   // 앱인토스 콘솔 등록명과 반드시 일치
  brand: {
    displayName: '기억력배틀',
    primaryColor: '#ff6900',
    icon: null,               // 콘솔 아이콘 URL 또는 null
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

// 게임 오버 시 호출 — Toss 환경에서만 실행 (샌드박스/개발환경 방지)
const env = await getOperationalEnvironment()
if (env === 'toss') {
  await submitGameCenterLeaderBoardScore({ score: String(finalScore) })
}

// ResultPage "친구 랭킹 보기" 버튼
await openGameCenterLeaderboard()
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
□ 타이머 2초 경과 시 게임 오버
□ 콤보 점수 계산 (300ms 이내 연속 입력 시 x2)
□ 난이도별 점수 배율 (Easy x1 / Medium x2 / Hard x3)
□ 일간 기회 4회 제한 (mock userId + Supabase 연결 시)
□ 리워드광고 mock → 기회 1회 증가 확인 (DEV에서 즉시 resolve(true))
□ 배너광고 placeholder 레이아웃 (높이 96px 확인)
□ 메인 → 게임 → 결과 → 랭킹 페이지 전환
□ 뒤로가기(popstate) → main 이동 + 게임 리셋
□ 기회 0회 시 시작 버튼 비활성화 확인
□ isNewBest 표시 (첫 게임 vs 기록 갱신 vs 기록 미갱신)
```

### 실제 토스앱(QR 스캔)에서만 검증 가능한 항목

```
□ 실제 배너 광고 노출 및 레이아웃
□ 리워드 광고 노출 → 시청 완료 시 기회 증가
□ getUserKeyForGame() 실제 hash 반환 확인
□ 게임센터 리더보드 점수 제출 (submitScore)
□ openGameCenterLeaderboard() 친구/전체 랭킹 내장 UI
□ 뒤로가기 네이티브 버튼 동작
```
