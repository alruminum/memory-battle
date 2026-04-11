import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ComboTimer } from './ComboTimer'

// ── ComboTimer: 슬림 바 게이지 (Variant B) 검증 (Issue #90) ──────────────────
//
// DOM 구조 (isActive=true 또는 isBreaking 중):
//   [div.flex]             ← 외부 래퍼
//     [div.combo-timer-track]  data-testid="combo-timer-track"
//       [div.combo-timer-fill] data-testid="combo-timer-fill"
//         [div]                ← 글로우 헤드 (collapse 시 숨김)
//
// vi.useFakeTimers()는 Date.now()도 함께 fake로 대체.
// vi.advanceTimersByTime(N)을 호출하면 Date.now()도 N ms만큼 자동 진행.

describe('ComboTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── CT-1. 렌더링 조건 ─────────────────────────────────────────────────────

  describe('CT-1. 렌더링 조건', () => {
    it('CT-1-1: isActive=false && isBreaking=false → null 반환 (트랙 없음)', () => {
      const { queryByTestId } = render(
        <ComboTimer
          computerShowTime={3000}
          inputStartTime={1000}
          isActive={false}
          isBreaking={false}
        />
      )
      expect(queryByTestId('combo-timer-track')).toBeNull()
    })

    it('CT-1-2: isActive=true → 트랙 렌더링', () => {
      const inputStartTime = Date.now()
      const { getByTestId } = render(
        <ComboTimer
          computerShowTime={3000}
          inputStartTime={inputStartTime}
          isActive={true}
          isBreaking={false}
        />
      )
      expect(getByTestId('combo-timer-track')).toBeTruthy()
    })
  })

  // ── CT-2. 게이지 수치 ─────────────────────────────────────────────────────

  describe('CT-2. 게이지 수치', () => {
    it('CT-2-1: elapsed < computerShowTime → fill width > 0%', () => {
      const inputStartTime = Date.now()
      const { getByTestId } = render(
        <ComboTimer
          computerShowTime={2000}
          inputStartTime={inputStartTime}
          isActive={true}
          isBreaking={false}
        />
      )

      // 500ms 경과 (2000ms 미만) → ratio=0.75, width='75%'
      act(() => { vi.advanceTimersByTime(500) })

      const fill = getByTestId('combo-timer-fill')
      expect(fill.style.width).not.toBe('0%')
      expect(fill.style.width).not.toBe('')
    })

    it('CT-2-2: elapsed >= computerShowTime → fill에 .danger 클래스', () => {
      const inputStartTime = Date.now()
      const { getByTestId } = render(
        <ComboTimer
          computerShowTime={1000}
          inputStartTime={inputStartTime}
          isActive={true}
          isBreaking={false}
        />
      )

      // 1500ms 경과 → clamped to 1000 → ratio=0 → danger phase → 'danger' 클래스
      act(() => { vi.advanceTimersByTime(1500) })

      const fill = getByTestId('combo-timer-fill')
      expect(fill.className).toContain('danger')
    })

    it('CT-2-3: elapsed >= computerShowTime 후 추가 시간 경과 → width 0%에서 고정', () => {
      const inputStartTime = Date.now()
      const { getByTestId } = render(
        <ComboTimer
          computerShowTime={1000}
          inputStartTime={inputStartTime}
          isActive={true}
          isBreaking={false}
        />
      )

      // 1200ms → clamp 후 interval 정지 → ratio=0, width='0%'
      act(() => { vi.advanceTimersByTime(1200) })
      const width1 = getByTestId('combo-timer-fill').style.width

      // 추가 1000ms — interval이 정지됐으므로 변화 없음
      act(() => { vi.advanceTimersByTime(1000) })
      const width2 = getByTestId('combo-timer-fill').style.width

      expect(width1).toBe('0%')
      expect(width1).toBe(width2)
    })
  })

  // ── CT-3. collapse 애니메이션 ─────────────────────────────────────────────

  describe('CT-3. collapse 애니메이션', () => {
    it('CT-3-1: isBreaking=true → 600ms 후 null 반환 (트랙 없음)', () => {
      const inputStartTime = Date.now()

      render(
        <ComboTimer
          computerShowTime={3000}
          inputStartTime={inputStartTime}
          isActive={true}
          isBreaking={true}
        />
      )

      // isBreaking=true → collapsePhase 'none'→'breaking'(즉시) → setTimeout(600ms) → 'done' → null
      act(() => { vi.advanceTimersByTime(600) })

      expect(screen.queryByTestId('combo-timer-track')).toBeNull()
    })

    it('CT-3-2: isBreaking=false → true 전환 시 fill에 .collapse 클래스 추가', () => {
      const inputStartTime = Date.now()

      const { rerender, getByTestId } = render(
        <ComboTimer
          computerShowTime={3000}
          inputStartTime={inputStartTime}
          isActive={true}
          isBreaking={false}
        />
      )

      // isBreaking=true로 전환 → collapsePhase 'none'→'breaking' → fill에 'collapse' 클래스
      act(() => {
        rerender(
          <ComboTimer
            computerShowTime={3000}
            inputStartTime={inputStartTime}
            isActive={true}
            isBreaking={true}
          />
        )
      })

      const fill = getByTestId('combo-timer-fill')
      expect(fill.className).toContain('collapse')
    })
  })

  // ── CT-4. computerShowTimeRef — stale closure 방지 ────────────────────────

  describe('CT-4. computerShowTimeRef stale closure 방지', () => {
    it('CT-4-1: computerShowTime 변경 후 새 값 기준으로 비율 반영', () => {
      const inputStartTime = Date.now()

      const { rerender, getByTestId } = render(
        <ComboTimer
          computerShowTime={2000}
          inputStartTime={inputStartTime}
          isActive={true}
          isBreaking={false}
        />
      )

      // computerShowTime을 1000으로 변경 (스테이지 변경 시나리오)
      act(() => {
        rerender(
          <ComboTimer
            computerShowTime={1000}
            inputStartTime={inputStartTime}
            isActive={true}
            isBreaking={false}
          />
        )
      })

      // 1500ms 경과 → 새 computerShowTime=1000ms 기준으로 clamp → ratio=0, width='0%'
      act(() => { vi.advanceTimersByTime(1500) })

      const fill = getByTestId('combo-timer-fill')
      expect(fill.style.width).toBe('0%')
    })
  })

  // ── CT-6. onComboTimerExpired 콜백 ────────────────────────────────────────

  describe('CT-6. onComboTimerExpired 콜백', () => {
    it('CT-6-1: onComboTimerExpired 미전달, elapsed >= computerShowTime 도달 — 에러 없이 동작', () => {
      const inputStartTime = Date.now()
      expect(() => {
        const { unmount } = render(
          <ComboTimer
            computerShowTime={500}
            inputStartTime={inputStartTime}
            isActive={true}
            isBreaking={false}
          />
        )
        act(() => { vi.advanceTimersByTime(600) })
        unmount()
      }).not.toThrow()
    })

    it('CT-6-2: isActive=true, elapsed >= computerShowTime → onComboTimerExpired 정확히 1회 호출', () => {
      const callback = vi.fn()
      const inputStartTime = Date.now()

      render(
        <ComboTimer
          computerShowTime={1000}
          inputStartTime={inputStartTime}
          isActive={true}
          isBreaking={false}
          onComboTimerExpired={callback}
        />
      )

      act(() => { vi.advanceTimersByTime(1200) })

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('CT-6-3: isActive=false→true 전환 후 elapsed >= computerShowTime — 콜백 다시 1회 호출 (hasExpiredFiredRef 리셋)', () => {
      const callback = vi.fn()
      const inputStartTime = Date.now()

      const { rerender } = render(
        <ComboTimer
          computerShowTime={500}
          inputStartTime={inputStartTime}
          isActive={true}
          isBreaking={false}
          onComboTimerExpired={callback}
        />
      )

      act(() => { vi.advanceTimersByTime(600) })
      expect(callback).toHaveBeenCalledTimes(1)

      act(() => {
        rerender(
          <ComboTimer
            computerShowTime={500}
            inputStartTime={Date.now()}
            isActive={false}
            isBreaking={false}
            onComboTimerExpired={callback}
          />
        )
      })

      act(() => {
        rerender(
          <ComboTimer
            computerShowTime={500}
            inputStartTime={Date.now()}
            isActive={true}
            isBreaking={false}
            onComboTimerExpired={callback}
          />
        )
      })

      act(() => { vi.advanceTimersByTime(600) })
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('CT-6-4: elapsed >= computerShowTime 상태에서 추가 렌더 발생 — 콜백 1회 초과 호출 안 됨', () => {
      const callback = vi.fn()
      const inputStartTime = Date.now()

      const { rerender } = render(
        <ComboTimer
          computerShowTime={500}
          inputStartTime={inputStartTime}
          isActive={true}
          isBreaking={false}
          onComboTimerExpired={callback}
        />
      )

      act(() => { vi.advanceTimersByTime(600) })
      expect(callback).toHaveBeenCalledTimes(1)

      act(() => {
        rerender(
          <ComboTimer
            computerShowTime={500}
            inputStartTime={inputStartTime}
            isActive={true}
            isBreaking={false}
            onComboTimerExpired={callback}
          />
        )
      })

      act(() => { vi.advanceTimersByTime(300) })

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })
})
