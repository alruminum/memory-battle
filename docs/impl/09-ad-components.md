# 09. 광고 컴포넌트

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
interface UseRewardAdReturn {
  show: () => Promise<boolean>  // true: 리워드 지급, false: 취소
  isLoading: boolean
}

export function useRewardAd(): UseRewardAdReturn
```

- `show()` 호출 시 `isLoading = true` → `showRewardAd()` → 완료 후 `isLoading = false`
