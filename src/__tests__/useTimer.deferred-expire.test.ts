import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from '../hooks/useTimer'

// ── useTimer: 백그라운드 만료 deferred fire 로직 검증 (이슈 #100) ──────────
//
// 수정 내용 (#100):
//   hidden=true 시 타이머 만료 → expiredWhileHiddenRef=true 세팅
//   visibilitychange(hidden=false) 복귀 시 onExpire 발화.
//   stop()은 expiredWhileHiddenRef를 클리어하여 stale 발화 방지.
//
// 대응 TC:
//   UV-8  hidden 만료 → visibilitychange 복귀 → onExpire 1회
//   UV-9  hidden 만료 → 언마운트 (no visibilitychange) → onExpire 0회
//   UV-10 hidden 만료 → stop() 명시 → visibilitychange → onExpire 0회
//   UV-11 hidden 만료 → 복귀 onExpire(1) → reset → 재만료 → onExpire(2)

describe('useTimer — 백그라운드 만료 deferred fire (#100)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    })
  })

  // ── UV-8: 정상 흐름 — deferred fire ─────────────────────────────────────

  it('[UV-8] hidden=true 만료 → visibilitychange(visible) → onExpire 정확히 1회 호출', () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useTimer(onExpire, 200))

    // hidden=true 상태에서 타이머 시작 및 만료
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })

    act(() => { result.current.reset() })
    act(() => { vi.advanceTimersByTime(200) })

    // 만료됐지만 hidden=true이므로 아직 호출 없어야 함
    expect(onExpire).not.toHaveBeenCalled()

    // 탭 복귀 (visibilitychange hidden=false)
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })

    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('[UV-8b] visibilitychange 복귀 후 동일 이벤트 재발화 시 추가 호출 없음 (플래그 클리어 확인)', () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useTimer(onExpire, 200))

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    act(() => { result.current.reset() })
    act(() => { vi.advanceTimersByTime(200) })

    // 복귀 → 1회 발화
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(onExpire).toHaveBeenCalledTimes(1)

    // 동일 이벤트 재발화 → 플래그 이미 false이므로 추가 호출 없음
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  // ── UV-9: 언마운트 시 stale 발화 없음 ───────────────────────────────────

  it('[UV-9] hidden=true 만료 → 언마운트 → visibilitychange 발화해도 onExpire 호출 없음', () => {
    const onExpire = vi.fn()
    const { result, unmount } = renderHook(() => useTimer(onExpire, 200))

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    act(() => { result.current.reset() })
    act(() => { vi.advanceTimersByTime(200) })

    expect(onExpire).not.toHaveBeenCalled()

    // 언마운트: cleanup에서 stop()(플래그 클리어) + listener 제거
    unmount()

    // 언마운트 후 탭 복귀 이벤트 발화
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })

    expect(onExpire).not.toHaveBeenCalled()
  })

  // ── UV-10: 명시적 stop()이 플래그 클리어 ────────────────────────────────

  it('[UV-10] hidden=true 만료 → stop() 명시 호출 → visibilitychange 발화 → onExpire 호출 없음', () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useTimer(onExpire, 200))

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    act(() => { result.current.reset() })
    act(() => { vi.advanceTimersByTime(200) })

    expect(onExpire).not.toHaveBeenCalled()

    // 명시적 stop() → expiredWhileHiddenRef = false
    act(() => { result.current.stop() })

    // 탭 복귀 — 플래그가 클리어되어 발화 안 됨
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })

    expect(onExpire).not.toHaveBeenCalled()
  })

  // ── UV-11: 복귀 후 재시작 시나리오 ─────────────────────────────────────

  it('[UV-11] hidden=true 만료 → 복귀(1회) → reset() → 재만료 → onExpire 총 2회', () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useTimer(onExpire, 200))

    // 1차: hidden 상태에서 만료 (보류)
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    act(() => { result.current.reset() })
    act(() => { vi.advanceTimersByTime(200) })

    expect(onExpire).not.toHaveBeenCalled()

    // 탭 복귀 → 1차 deferred onExpire 발화
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })

    expect(onExpire).toHaveBeenCalledTimes(1)

    // 2차: visible 상태에서 새 reset() → 정상 만료
    act(() => { result.current.reset() })
    act(() => { vi.advanceTimersByTime(200) })

    expect(onExpire).toHaveBeenCalledTimes(2)
  })

  // ── 에러 처리: 엣지 케이스 ──────────────────────────────────────────────

  it('[에러 처리] 타이머 미시작 상태에서 visibilitychange 발화 → onExpire 호출 없음', () => {
    const onExpire = vi.fn()
    // reset() 없이 마운트만 (플래그 = false 초기값)
    renderHook(() => useTimer(onExpire, 200))

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })

    expect(onExpire).not.toHaveBeenCalled()
  })

  it('[에러 처리] hidden=true 만료 후 복귀 후 추가 tick 경과해도 onExpire 중복 없음', () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useTimer(onExpire, 200))

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    act(() => { result.current.reset() })
    act(() => { vi.advanceTimersByTime(200) })

    // 복귀 → 1회
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(onExpire).toHaveBeenCalledTimes(1)

    // 추가 시간 경과 — 인터벌 이미 stop됨
    act(() => { vi.advanceTimersByTime(500) })
    expect(onExpire).toHaveBeenCalledTimes(1)
  })
})
