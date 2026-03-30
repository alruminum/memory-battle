import { useState } from 'react'
import { showRewardAd } from '../lib/ait'

export function useRewardAd() {
  const [isLoading, setIsLoading] = useState(false)

  async function show(): Promise<boolean> {
    setIsLoading(true)
    const result = await showRewardAd()
    setIsLoading(false)
    return result
  }

  return { show, isLoading }
}
