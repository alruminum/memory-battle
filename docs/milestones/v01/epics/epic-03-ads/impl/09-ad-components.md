# 09. 광고 컴포넌트

> v0.2 변경: 광고 트리거 시점 변경 (유저 클릭 → ResultPage 마운트 시 자동 호출), ait.ts에 grantDailyReward 래퍼 추가

## 생성 파일
- `src/components/ads/BannerAd.tsx`
- `src/components/ads/RewardAd.tsx` (훅 형태)

---

## BannerAd.tsx

```typescript
// props 없음. 항상 width: 100%, height: 96px
export function BannerAd() {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!containerRef.current) return
    const cleanup = attachBannerAd(containerRef.current)
    return cleanup
  }, [])
  return <div ref={containerRef} style={{ width: '100%', height: 96 }} />
}
```

---

## RewardAd.tsx (훅)

```typescript
interface UseRewardAdCallbacks {
  onUserEarnedReward?: () => void   // 완시청 완료 시 호출
  onDismissed?: () => void          // 스킵/닫기 시 호출
  onError?: () => void              // 로드/재생 실패 시 호출
}

interface UseRewardAdReturn {
  show: (callbacks?: UseRewardAdCallbacks) => Promise<boolean>  // true: 완시청, false: 스킵/실패
  isLoading: boolean
}

export function useRewardAd(): UseRewardAdReturn
```

- `show(callbacks)` 호출 시 `isLoading = true` → `showRewardAd()` → 완료 후 `isLoading = false`
- `onUserEarnedReward`, `onDismissed`, `onError` 콜백은 각 이벤트 수신 즉시 호출
- ResultPage 마운트 시 `useEffect` 내에서 `show()` 자동 호출 (유저 클릭 불필요)

---

## ait.ts — grantDailyReward 래퍼

`grantPromotionReward` 호출 래퍼. 상세 스펙은 **08-daily-chances.md** 참고.

```typescript
// import 경로 (확인 완료)
import { grantPromotionReward } from '@apps-in-toss/web-framework'

export async function grantDailyReward(): Promise<void>
```

- IS_SANDBOX 시 즉시 return (포인트 지급 생략)
- 실패 시 throw 전파 (호출부에서 catch)
