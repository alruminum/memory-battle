import { useRef, useCallback } from 'react'

const COMBO_THRESHOLD = 300 // ms

export function useCombo() {
  const lastInputTime = useRef<number | null>(null)
  const comboCount = useRef(0)

  const recordInput = useCallback(() => {
    const now = Date.now()
    if (lastInputTime.current !== null && now - lastInputTime.current > COMBO_THRESHOLD) {
      comboCount.current = 0
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
  }, [])

  return { recordInput, checkFullCombo, reset }
}
