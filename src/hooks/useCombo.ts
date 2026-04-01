import { useRef, useCallback, useState } from 'react'

const COMBO_THRESHOLD = 300 // ms

export function useCombo() {
  const lastInputTime = useRef<number | null>(null)
  const comboCount = useRef(0)
  const [isActive, setIsActive] = useState(false)

  const recordInput = useCallback(() => {
    const now = Date.now()
    if (lastInputTime.current !== null && now - lastInputTime.current > COMBO_THRESHOLD) {
      comboCount.current = 0
      setIsActive(false)
    } else if (comboCount.current > 0) {
      setIsActive(true)
    }
    comboCount.current += 1
    lastInputTime.current = now
  }, [])

  const checkFullCombo = useCallback((sequenceLength: number) => {
    return comboCount.current >= sequenceLength
  }, [])

  const reset = useCallback(() => {
    lastInputTime.current = null
    comboCount.current = 0
    setIsActive(false)
  }, [])

  return { recordInput, checkFullCombo, reset, isActive }
}
