import { useRef, useState, useCallback, useEffect } from 'react'

export function useTimer(onExpire: () => void, duration = 2000) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    stop()
    setTimeLeft(duration)
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          stop()
          onExpireRef.current()
          return 0
        }
        return prev - 100
      })
    }, 100)
  }, [duration, stop])

  useEffect(() => () => stop(), [stop])

  return { timeLeft, reset, stop }
}
