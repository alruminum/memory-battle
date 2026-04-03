import { useRef, useState, useCallback, useEffect } from 'react'
import { dbg } from '../lib/debug'

export function useTimer(onExpire: () => void, duration = 2000) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      dbg('[Timer] stop()')
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
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
            // hidden 상태에서는 onExpire 호출 억제
            onExpireRef.current()
          }
          return 0
        }
        return prev - 100
      })
    }, 100)
  }, [duration, stop])

  useEffect(() => () => stop(), [stop])

  return { timeLeft, reset, stop }
}
