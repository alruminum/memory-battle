import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { ComboTimer } from '../components/game/ComboTimer'

// ── ComboTimer: visibilitychange로 interval 정지/재개 검증 ───────────────
//
// 수정 내용 (이슈 #51):
//   - hidden=true 시 interval 정지
//   - visible 복귀 시 Date.now() 기준 elapsed 즉시 반영 후 interval 재개
//   - elapsed >= computerShowTime 이면 clamped 값 고정 (interval 재시작 없음)
//
// TEST_PLAN_GAP: test-plan.md §5 수동 검증에만 언급됨.
//   자동화 TC 신규 추가하여 커버.

/** elapsed span(첫 번째 span)의 텍스트를 반환한다 */
function getElapsedText(container: HTMLElement): string {
  const span = container.querySelector('span:first-child')
  return span?.textContent ?? ''
}

/** document.hidden 프로퍼티를 재정의한다 */
function setHidden(value: boolean) {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => value,
  })
}

/** visibilitychange 이벤트를 발생시킨다 */
function fireVisibilityChange() {
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('ComboTimer — visibilitychange interval 정지/재개', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setHidden(false)
  })

  afterEach(() => {
    vi.useRealTimers()
    setHidden(false)
  })

  // ── 정상 흐름: hidden 시 interval 정지 ────────────────────────────────

  it('isActive=true 상태에서 hidden=true 전환 시 elapsed가 증가하지 않는다', () => {
    const inputStartTime = Date.now()

    const { container } = render(
      <ComboTimer
        computerShowTime={3000}
        inputStartTime={inputStartTime}
        isActive={true}
      />
    )

    // 500ms 경과 → elapsed 반영
    act(() => {
      vi.advanceTimersByTime(500)
    })

    const elapsedBeforeHide = getElapsedText(container)

    // hidden=true + visibilitychange → interval 정지
    act(() => {
      setHidden(true)
      fireVisibilityChange()
    })

    // 추가 1000ms 경과해도 interval이 정지되어 elapsed 변화 없음
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    const elapsedAfterHide = getElapsedText(container)

    // hidden 전환 전후 elapsed가 같아야 함 (정지)
    expect(elapsedBeforeHide).toBe('0.50')
    expect(elapsedAfterHide).toBe('0.50')
  })

  it('hidden=true 전환 후 visible 복귀 시 interval이 재개된다', () => {
    const inputStartTime = Date.now()

    const { container } = render(
      <ComboTimer
        computerShowTime={5000}
        inputStartTime={inputStartTime}
        isActive={true}
      />
    )

    // 500ms 경과
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // hidden=true → interval 정지
    act(() => {
      setHidden(true)
      fireVisibilityChange()
    })

    // hidden 중 1000ms 경과 (interval 정지 중)
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // visible 복귀 → elapsed 즉시 반영 + interval 재개
    // Date.now() 기준: inputStartTime으로부터 1500ms 경과
    act(() => {
      setHidden(false)
      fireVisibilityChange()
    })

    // 복귀 직후 elapsed는 Date.now() - inputStartTime = 1500ms → "1.50"
    expect(getElapsedText(container)).toBe('1.50')
  })

  it('visible 복귀 후 interval이 재개되어 elapsed가 계속 증가한다', () => {
    const inputStartTime = Date.now()

    const { container } = render(
      <ComboTimer
        computerShowTime={5000}
        inputStartTime={inputStartTime}
        isActive={true}
      />
    )

    // hidden → visible 복귀
    act(() => {
      setHidden(true)
      fireVisibilityChange()
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    act(() => {
      setHidden(false)
      fireVisibilityChange()
    })

    const elapsedAtReturn = getElapsedText(container)

    // 추가 300ms → interval 재개로 elapsed 증가해야 함
    act(() => {
      vi.advanceTimersByTime(300)
    })

    const elapsedAfter300 = getElapsedText(container)

    // 복귀 후 300ms 추가되어 elapsed가 증가해야 함
    expect(parseFloat(elapsedAfter300)).toBeGreaterThan(parseFloat(elapsedAtReturn))
  })

  // ── elapsed >= computerShowTime 후 복귀: clamped 고정, interval 재시작 없음 ──

  it('hidden 중 computerShowTime 초과 후 복귀 시 clamped 값으로 고정된다', () => {
    const computerShowTime = 1000
    const inputStartTime = Date.now()

    const { container } = render(
      <ComboTimer
        computerShowTime={computerShowTime}
        inputStartTime={inputStartTime}
        isActive={true}
      />
    )

    // hidden=true 전환 (elapsed < computerShowTime 시점)
    act(() => {
      setHidden(true)
      fireVisibilityChange()
    })

    // hidden 중 2000ms 경과 → Date.now() - inputStartTime > computerShowTime
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // visible 복귀
    act(() => {
      setHidden(false)
      fireVisibilityChange()
    })

    // elapsed는 computerShowTime(1000ms = "1.00")으로 clamp되어야 함
    expect(getElapsedText(container)).toBe('1.00')
  })

  it('clamped 상태 복귀 후 추가 시간이 경과해도 elapsed가 증가하지 않는다', () => {
    const computerShowTime = 1000
    const inputStartTime = Date.now()

    const { container } = render(
      <ComboTimer
        computerShowTime={computerShowTime}
        inputStartTime={inputStartTime}
        isActive={true}
      />
    )

    // hidden 중 초과
    act(() => {
      setHidden(true)
      fireVisibilityChange()
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // visible 복귀 (clamped)
    act(() => {
      setHidden(false)
      fireVisibilityChange()
    })

    const elapsedAtReturn = getElapsedText(container)

    // 추가 1000ms 경과 — interval이 재시작되지 않아야 함
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    const elapsedAfterExtra = getElapsedText(container)

    expect(elapsedAtReturn).toBe('1.00')
    expect(elapsedAfterExtra).toBe('1.00')
  })

  // ── 엣지 케이스: isActive=false 상태에서 visibilitychange 무시 ───────────

  it('isActive=false 상태에서 visible 복귀 시 interval이 시작되지 않는다', () => {
    const { container } = render(
      <ComboTimer
        computerShowTime={3000}
        inputStartTime={1000}
        isActive={false}
      />
    )

    // visible 복귀 이벤트 발생
    act(() => {
      setHidden(false)
      fireVisibilityChange()
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    // isActive=false이므로 컴포넌트가 null (렌더링 없음)
    expect(container.querySelector('span')).toBeNull()
  })

  // ── 엣지 케이스: 초기 hidden=true 상태에서 interval 시작 안 됨 ───────────

  it('초기 렌더링 시 document.hidden=true이면 interval이 시작되지 않는다', () => {
    setHidden(true)

    const inputStartTime = Date.now()

    const { container } = render(
      <ComboTimer
        computerShowTime={3000}
        inputStartTime={inputStartTime}
        isActive={true}
      />
    )

    // 1000ms 경과해도 hidden=true이므로 interval 미시작
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // elapsed는 0.00 (interval이 시작되지 않았음)
    expect(getElapsedText(container)).toBe('0.00')
  })

  // ── 에러 처리: isActive 전환 후 visibilitychange가 와도 안전하게 처리 ──────

  it('isActive=true → false 전환 후 visibilitychange 발생해도 오류 없이 처리된다', () => {
    const inputStartTime = Date.now()

    const { rerender } = render(
      <ComboTimer
        computerShowTime={3000}
        inputStartTime={inputStartTime}
        isActive={true}
      />
    )

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // isActive=false 전환
    act(() => {
      rerender(
        <ComboTimer
          computerShowTime={3000}
          inputStartTime={0}
          isActive={false}
        />
      )
    })

    // 전환 후 visibilitychange 발생 — 오류 없이 처리되어야 함
    expect(() => {
      act(() => {
        setHidden(false)
        fireVisibilityChange()
      })
    }).not.toThrow()
  })
})
