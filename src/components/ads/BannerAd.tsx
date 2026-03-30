import { useRef, useEffect } from 'react'
import { attachBannerAd } from '../../lib/ait'

export function BannerAd() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const cleanup = attachBannerAd(containerRef.current)
    return cleanup
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: 96 }} />
}
