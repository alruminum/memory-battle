import { useState, useCallback, useEffect, useRef } from 'react'
import { showRewardAd } from '../lib/ait'
import { suspendAudio, resumeAudio } from '../lib/sound'

export function useRewardAd() {
  const [isLoading, setIsLoading] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const show = useCallback(async (): Promise<boolean> => {
    if (isMounted.current) setIsLoading(true)
    suspendAudio()
    try {
      const result = await showRewardAd()
      return result
    } finally {
      resumeAudio()
      if (isMounted.current) setIsLoading(false)
    }
  }, [])

  return { show, isLoading }
}
