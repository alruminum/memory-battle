import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from '../hooks/useTimer'

// ── useTimer: document.hidden 시 onExpire 억제 검증 ──────────────────────
//
// 수정 내용 (이슈 #51):
//   타이머 만료(prev <= 100) 시 document.hidden=true이면 onExpire 호출 억제.
//   document.hidden=false 일 때만 정상 호출.
//
// 구현 메모:
//   - interval은 100ms 단위. duration=N ms → N/100번 tick.
//   - setTimeLeft 콜백: prev <= 100 시 stop() + onExpire() + return 0.
//   - vi.advanceTimersByTime(N): N ms 내 스케줄된 콜백을 모두 동기 실행.
//   - 만료 조건은 "prev <= 100"이므로 duration=100ms이면 첫 번째 tick(100ms)에서 발동.
//   - duration=200ms이면 두 번째 tick(200ms): prev=200→100→만료 순.
//     정확히 duration ms만큼 advance하면 stop() 이후 추가 tick이 없어 안전.
//
// TEST_PLAN_GAP: test-plan.md §2~4에 useTimer 자동화 TC 없음.
//   §5 수동 검증에만 언급됨. TC를 신규 추가하여 커버.

describe('useTimer — document.hidden 억제 로직', () => {
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

  // ── 정상 흐름 ───────────────────────────────────────────────────────────

  it('document.hidden=false 일 때 타이머 만료 시 onExpire가 호출된다', () => {
    const onExpire = vi.fn()

    // duration=200ms: tick1(100ms) prev=100 → 만료 조건
    const { result } = renderHook(() => useTimer(onExpire, 200))

    act(() => {
      result.current.reset()
    })

    // 정확히 duration(200ms)만큼 advance — 만료 tick 포함, 그 이상 없음
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('타이머 만료 전 timeLeft가 남아 있는 동안 onExpire가 호출되지 않는다', () => {
    const onExpire = vi.fn()

    const { result } = renderHook(() => useTimer(onExpire, 1000))

    act(() => {
      result.current.reset()
    })

    // 500ms만 경과 — 아직 만료 안 됨 (duration=1000ms)
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onExpire).not.toHaveBeenCalled()
  })

  it('reset() 후 stop() 호출 시 onExpire가 호출되지 않는다', () => {
    const onExpire = vi.fn()

    const { result } = renderHook(() => useTimer(onExpire, 1000))

    act(() => {
      result.current.reset()
    })

    act(() => {
      result.current.stop()
    })

    // stop 후 시간이 지나도 만료 없음
    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(onExpire).not.toHaveBeenCalled()
  })

  // ── document.hidden=true 억제 ───────────────────────────────────────────

  it('document.hidden=true 일 때 타이머 만료 시 onExpire가 호출되지 않는다', () => {
    const onExpire = vi.fn()

    // hidden=true로 설정 후 타이머 시작
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    })

    const { result } = renderHook(() => useTimer(onExpire, 200))

    act(() => {
      result.current.reset()
    })

    // 만료 tick 포함해서 advance — hidden=true이므로 억제
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(onExpire).not.toHaveBeenCalled()
  })

  it('타이머 진행 중 hidden=true 전환 시 만료 시점에 onExpire가 호출되지 않는다', () => {
    const onExpire = vi.fn()

    const { result } = renderHook(() => useTimer(onExpire, 500))

    act(() => {
      result.current.reset()
    })

    // 200ms 경과 (아직 만료 안 됨)
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // 이 시점에 hidden=true 전환
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    })

    // 나머지 시간 경과 → 만료 조건 충족, hidden=true이므로 억제
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onExpire).not.toHaveBeenCalled()
  })

  // ── 엣지 케이스 ─────────────────────────────────────────────────────────

  it('reset()을 두 번 호출해도 onExpire는 1회만 호출된다', () => {
    const onExpire = vi.fn()

    // duration=300ms
    const { result } = renderHook(() => useTimer(onExpire, 300))

    act(() => {
      result.current.reset()
    })

    // 100ms 경과 후 reset (타이머 재시작) — 만료 전
    act(() => {
      vi.advanceTimersByTime(100)
    })

    act(() => {
      result.current.reset()
    })

    // 새 타이머 duration(300ms)만큼 advance → 정확히 만료
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('duration=100 (최솟값)일 때 첫 번째 tick에서 onExpire가 호출된다', () => {
    const onExpire = vi.fn()

    const { result } = renderHook(() => useTimer(onExpire, 100))

    act(() => {
      result.current.reset()
    })

    // 100ms tick → prev=100 <= 100 → 만료
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('언마운트 시 onExpire가 호출되지 않는다', () => {
    const onExpire = vi.fn()

    const { result, unmount } = renderHook(() => useTimer(onExpire, 1000))

    act(() => {
      result.current.reset()
    })

    // 언마운트 — cleanup에서 stop() 호출
    unmount()

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(onExpire).not.toHaveBeenCalled()
  })

  it('hidden=true → false 전환 후 새 reset()을 호출하면 onExpire가 정상 호출된다', () => {
    const onExpire = vi.fn()

    const { result } = renderHook(() => useTimer(onExpire, 200))

    // hidden=true 상태에서 타이머 시작 및 만료 (억제)
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    })

    act(() => {
      result.current.reset()
    })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(onExpire).not.toHaveBeenCalled()

    // hidden=false 복귀 후 새 reset
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    })

    act(() => {
      result.current.reset()
    })

    // 새 duration(200ms)만큼 advance
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(onExpire).toHaveBeenCalledTimes(1)
  })
})
