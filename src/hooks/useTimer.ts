import { useRef, useState, useCallback, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

export function useTimer(onExpire: () => void, duration = 2000) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onExpireRef = useRef(onExpire)
  const status = useGameStore((s) => s.status)

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

  // INPUT 상태 아닐 때 타이머 정지
  useEffect(() => {
    if (status !== 'INPUT') {
      stop()
      setTimeLeft(duration)
    }
  }, [status, stop, duration])

  useEffect(() => () => stop(), [stop])

  return { timeLeft, reset, stop }
}
