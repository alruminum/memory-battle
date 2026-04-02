import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ComboTimer } from './ComboTimer'

// ── ComboTimer: interval clamp + clearInterval 수정 검증 (Issue #44) ───────
//
// DOM 구조:
//   [div.flex]
//     [span] ← elapsed (displaySeconds)  ← 첫 번째 span
//     [span] /
//     [span] ← target (targetSeconds)
//     [span] SEC
//
// elapsed span만 선택할 때: container.querySelector('span:first-child') 사용.
// vi.useFakeTimers()는 Date.now()도 함께 fake로 대체.
// vi.advanceTimersByTime(N)을 호출하면 Date.now()도 N ms만큼 자동 진행.
// vi.setSystemTime + vi.advanceTimersByTime 중복 호출 시 시간이 두 배 진행되므로
// 이 파일에서는 vi.setSystemTime으로 초기 기준점만 설정하고,
// 이후 진행은 vi.advanceTimersByTime으로만 수행한다.

/** elapsed span(첫 번째 span)의 텍스트를 반환한다 */
function getElapsedText(container: HTMLElement): string {
  const span = container.querySelector('span:first-child')
  return span?.textContent ?? ''
}

describe('ComboTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── 1. 정상 입력 — isActive=false 전환 시 interval 정지 + elapsedMs 0 초기화 ──

  describe('isActive=false 전환 시 상태 초기화', () => {
    it('isActive=true → false 전환 시 컴포넌트가 null을 반환한다', () => {
      const inputStartTime = Date.now()

      const { rerender } = render(
        <ComboTimer
          computerShowTime={3000}
          inputStartTime={inputStartTime}
          isActive={true}
        />
      )

      // 500ms 경과
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // isActive=false로 전환
      act(() => {
        rerender(
          <ComboTimer
            computerShowTime={3000}
            inputStartTime={inputStartTime}
            isActive={false}
          />
        )
      })

      // isActive=false이면 null 반환 — 컴포넌트 언마운트
      expect(screen.queryByText(/SEC/)).toBeNull()
    })

    it('isActive=false 전환 후 추가 시간이 경과해도 interval이 작동하지 않는다', () => {
      const inputStartTime = Date.now()

      const { rerender } = render(
        <ComboTimer
          computerShowTime={3000}
          inputStartTime={inputStartTime}
          isActive={true}
        />
      )

      // isActive=false로 전환
      act(() => {
        rerender(
          <ComboTimer
            computerShowTime={3000}
            inputStartTime={inputStartTime}
            isActive={false}
          />
        )
      })

      // 5000ms 추가 경과 — interval이 정지되어 있어야 함
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // 컴포넌트는 여전히 렌더링되지 않음
      expect(screen.queryByText(/SEC/)).toBeNull()
    })

    it('isActive=false → true 재전환 시 새 interval이 정상 시작된다', () => {
      const inputStartTime = Date.now()

      const { rerender } = render(
        <ComboTimer
          computerShowTime={3000}
          inputStartTime={inputStartTime}
          isActive={true}
        />
      )

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

      // 새 라운드 시작 — inputStartTime을 현재 시점으로 갱신
      const newInputStartTime = Date.now()
      act(() => {
        rerender(
          <ComboTimer
            computerShowTime={3000}
            inputStartTime={newInputStartTime}
            isActive={true}
          />
        )
      })

      // 100ms tick
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // 렌더링 중이어야 함
      expect(screen.queryByText(/SEC/)).not.toBeNull()
    })
  })

  // ── 2. 느린 입력 — elapsed가 computerShowTime 도달 시 clamp 처리 ────────────

  describe('elapsed가 computerShowTime에 도달하면 clamp됨', () => {
    it('elapsed가 computerShowTime 이상이면 elapsed 표시값이 target값으로 고정된다', () => {
      const computerShowTime = 1000
      const inputStartTime = Date.now()

      const { container } = render(
        <ComboTimer
          computerShowTime={computerShowTime}
          inputStartTime={inputStartTime}
          isActive={true}
        />
      )

      // computerShowTime(1000ms)을 초과하여 1500ms 경과
      act(() => {
        vi.advanceTimersByTime(1500)
      })

      // elapsed span은 clamp된 "1.00" (computerShowTime=1000ms)이어야 함
      expect(getElapsedText(container)).toBe('1.00')
    })

    it('elapsed가 computerShowTime 초과 후 추가 시간이 지나도 elapsed 표시값이 증가하지 않는다', () => {
      const computerShowTime = 1000
      const inputStartTime = Date.now()

      const { container } = render(
        <ComboTimer
          computerShowTime={computerShowTime}
          inputStartTime={inputStartTime}
          isActive={true}
        />
      )

      // 초과 tick
      act(() => {
        vi.advanceTimersByTime(1100)
      })

      const valueAfterFirst = getElapsedText(container)

      // 추가 1000ms 경과 — interval이 clearInterval로 정지되었으므로 값 변화 없음
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      const valueAfterSecond = getElapsedText(container)

      // clamp된 값에서 변화 없음
      expect(valueAfterFirst).toBe('1.00')
      expect(valueAfterSecond).toBe('1.00')
    })

    it('elapsed가 computerShowTime 미만이면 elapsed 표시값이 실제 경과 시간을 반영한다', () => {
      const computerShowTime = 3000
      const inputStartTime = Date.now()

      const { container } = render(
        <ComboTimer
          computerShowTime={computerShowTime}
          inputStartTime={inputStartTime}
          isActive={true}
        />
      )

      // 정확히 500ms tick (interval이 100ms 간격이므로 5번 tick)
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // elapsed는 0.50 (500ms / 1000 = 0.50s)
      expect(getElapsedText(container)).toBe('0.50')
    })
  })

  // ── 3. isActive=false 초기 상태 ─────────────────────────────────────────────

  describe('isActive=false 초기 상태', () => {
    it('isActive=false이면 컴포넌트가 null을 반환한다', () => {
      render(
        <ComboTimer
          computerShowTime={3000}
          inputStartTime={1000}
          isActive={false}
        />
      )

      expect(screen.queryByText(/SEC/)).toBeNull()
    })

    it('inputStartTime=0이면 interval이 시작되지 않고 elapsed가 0.00으로 표시된다', () => {
      const { container } = render(
        <ComboTimer
          computerShowTime={3000}
          inputStartTime={0}
          isActive={true}
        />
      )

      // 500ms 경과해도 interval이 시작되지 않음
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // elapsed=0 → "0.00"
      expect(getElapsedText(container)).toBe('0.00')
    })
  })

  // ── 4. computerShowTimeRef — stale closure 방지 ───────────────────────────

  describe('computerShowTimeRef stale closure 방지', () => {
    it('computerShowTime이 변경된 후 새 값 기준으로 clamp된다', () => {
      const inputStartTime = Date.now()

      const { container, rerender } = render(
        <ComboTimer
          computerShowTime={2000}
          inputStartTime={inputStartTime}
          isActive={true}
        />
      )

      // computerShowTime을 1000으로 변경 (스테이지 변경 시나리오)
      act(() => {
        rerender(
          <ComboTimer
            computerShowTime={1000}
            inputStartTime={inputStartTime}
            isActive={true}
          />
        )
      })

      // 1500ms 경과 → 새 computerShowTime=1000ms 기준으로 clamp되어야 함
      act(() => {
        vi.advanceTimersByTime(1500)
      })

      // computerShowTimeRef가 최신값(1000ms = "1.00")을 참조
      expect(getElapsedText(container)).toBe('1.00')
    })
  })
})
