import { useRef, useState, useCallback, useEffect } from 'react'
import { dbg } from '../lib/debug'

export function useTimer(onExpire: () => void, duration = 2000) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onExpireRef = useRef(onExpire)
  const expiredWhileHiddenRef = useRef(false)  // 백그라운드 만료 보류 플래그

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      dbg('[Timer] stop()')
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    expiredWhileHiddenRef.current = false  // 명시적 정지 시 보류 플래그 클리어
  }, [])

  const reset = useCallback(() => {
    dbg('[Timer] reset() duration=', duration)
    stop()
    setTimeLeft(duration)
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          dbg('[Timer] EXPIRED (hidden=%s)', document.hidden)
          stop()
          if (!document.hidden) {
            onExpireRef.current()
          } else {
            expiredWhileHiddenRef.current = true  // 백그라운드 만료 — 복귀 시 발화 예약
          }
          return 0
        }
        return prev - 100
      })
    }, 100)
  }, [duration, stop])

  // 탭 복귀 시 보류된 만료 처리
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && expiredWhileHiddenRef.current) {
        expiredWhileHiddenRef.current = false
        onExpireRef.current()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => () => stop(), [stop])

  return { timeLeft, reset, stop }
}
