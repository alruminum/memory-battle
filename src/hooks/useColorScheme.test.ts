/**
 * useColorScheme.test.ts
 * 단위 테스트 — useColorScheme 훅
 *
 * 테스트 플랜 갭(TEST_PLAN_GAP): test-plan.md에 미등재 항목
 *   - Toss UA TossColorPreference 파싱
 *   - system prefers-color-scheme fallback
 *   - 미디어 쿼리 변경 이벤트 리스닝 경계
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColorScheme } from './useColorScheme'

// matchMedia mock 헬퍼
function mockMatchMedia(prefersDark: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = []
  const mq = {
    matches: prefersDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((_: string, handler: (e: MediaQueryListEvent) => void) => {
      listeners.push(handler)
    }),
    removeEventListener: vi.fn((_: string, handler: (e: MediaQueryListEvent) => void) => {
      const idx = listeners.indexOf(handler)
      if (idx !== -1) listeners.splice(idx, 1)
    }),
    dispatchEvent: vi.fn(),
    _triggerChange: (newMatches: boolean) => {
      listeners.forEach(h => h({ matches: newMatches } as MediaQueryListEvent))
    },
  }
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockReturnValue(mq),
    writable: true,
    configurable: true,
  })
  return mq
}

// navigator.userAgent override 헬퍼
function setUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', {
    value: ua,
    configurable: true,
  })
}

const DEFAULT_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15'

beforeEach(() => {
  setUserAgent(DEFAULT_UA)
})

afterEach(() => {
  vi.restoreAllMocks()
  setUserAgent(DEFAULT_UA)
})

// ══════════════════════════════════════════════════════════════════
// 정상 흐름
// ══════════════════════════════════════════════════════════════════
describe('useColorScheme — Toss UA TossColorPreference 파싱', () => {
  it('TossColorPreference/dark UA → "dark" 반환', () => {
    setUserAgent(`${DEFAULT_UA} TossColorPreference/dark`)
    mockMatchMedia(false) // 시스템은 light이지만 Toss UA 우선
    const { result } = renderHook(() => useColorScheme())
    expect(result.current).toBe('dark')
  })

  it('TossColorPreference/light UA → "light" 반환', () => {
    setUserAgent(`${DEFAULT_UA} TossColorPreference/light`)
    mockMatchMedia(true) // 시스템은 dark이지만 Toss UA 우선
    const { result } = renderHook(() => useColorScheme())
    expect(result.current).toBe('light')
  })
})

describe('useColorScheme — system prefers-color-scheme fallback', () => {
  it('Toss UA 없고 시스템 dark → "dark" 반환', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useColorScheme())
    expect(result.current).toBe('dark')
  })

  it('Toss UA 없고 시스템 light → "light" 반환', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useColorScheme())
    expect(result.current).toBe('light')
  })
})

// ══════════════════════════════════════════════════════════════════
// 엣지 케이스
// ══════════════════════════════════════════════════════════════════
describe('useColorScheme — 엣지 케이스', () => {
  it('TossColorPreference 토큰이 없으면 system fallback 사용', () => {
    setUserAgent(`${DEFAULT_UA} TossVersion/1.0`)
    mockMatchMedia(true)
    const { result } = renderHook(() => useColorScheme())
    expect(result.current).toBe('dark')
  })

  it('TossColorPreference 값이 "dark"/"light" 외 값이면 null 처리 → system fallback', () => {
    // 정규식 match가 null을 반환하면 system fallback 적용
    setUserAgent(`${DEFAULT_UA} TossColorPreference/auto`)
    mockMatchMedia(false)
    const { result } = renderHook(() => useColorScheme())
    expect(result.current).toBe('light')
  })
})

// ══════════════════════════════════════════════════════════════════
// 에러 처리 / 이벤트 리스닝 경계
// ══════════════════════════════════════════════════════════════════
describe('useColorScheme — 미디어 쿼리 변경 이벤트', () => {
  it('Toss UA 없을 때 미디어 쿼리 변경 시 scheme 업데이트', () => {
    const mq = mockMatchMedia(false) // 초기 light
    const { result } = renderHook(() => useColorScheme())
    expect(result.current).toBe('light')

    act(() => {
      mq._triggerChange(true) // dark로 변경
    })
    expect(result.current).toBe('dark')
  })

  it('Toss UA 있을 때 미디어 쿼리 변경해도 scheme 고정', () => {
    setUserAgent(`${DEFAULT_UA} TossColorPreference/dark`)
    const mq = mockMatchMedia(false) // 시스템은 light
    const { result } = renderHook(() => useColorScheme())
    expect(result.current).toBe('dark')

    act(() => {
      mq._triggerChange(true)
    })
    // Toss UA 고정이므로 여전히 'dark'
    expect(result.current).toBe('dark')
  })

  it('Toss UA 있을 때 addEventListener를 호출하지 않는다', () => {
    setUserAgent(`${DEFAULT_UA} TossColorPreference/light`)
    const mq = mockMatchMedia(false)
    renderHook(() => useColorScheme())
    expect(mq.addEventListener).not.toHaveBeenCalled()
  })

  it('언마운트 시 이벤트 리스너가 제거된다', () => {
    const mq = mockMatchMedia(false)
    const { unmount } = renderHook(() => useColorScheme())
    expect(mq.addEventListener).toHaveBeenCalledTimes(1)
    unmount()
    expect(mq.removeEventListener).toHaveBeenCalledTimes(1)
  })
})
