import { useState, useEffect } from 'react'

type ColorScheme = 'light' | 'dark'

function getTossColorPreference(): ColorScheme | null {
  const match = navigator.userAgent.match(/TossColorPreference\/(light|dark)/)
  return (match?.[1] as ColorScheme) ?? null
}

function getSystemColorScheme(): ColorScheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useColorScheme(): ColorScheme {
  const [scheme, setScheme] = useState<ColorScheme>(() => {
    return getTossColorPreference() ?? getSystemColorScheme()
  })

  useEffect(() => {
    // Toss UA에 명시된 경우 시스템 변경 감지 불필요
    if (getTossColorPreference() !== null) return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setScheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return scheme
}
