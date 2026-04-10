import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ComboTimer } from '../components/game/ComboTimer'

// ── ComboTimer 콤보타이머 레이블 (Issue #92) ─────────────────────────────────
//
// 변경 내용: 게이지 트랙 위에 <span>콤보타이머</span> 레이블 추가
// 렌더링 조건: 컴포넌트 자체가 null 반환이 아닐 때만 레이블 표시
//   - isActive=false && collapsePhase=none → null → 레이블 미표시
//   - collapsePhase=done (600ms 후)        → null → 레이블 미표시
//   - collapsePhase=breaking (600ms 이전)  → 레이블 유지
//   - isActive=true                        → 레이블 표시

describe('ComboTimer 콤보타이머 레이블 (Issue #92)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── 정상 흐름 ────────────────────────────────────────────────────────────────

  it('정상 흐름: isActive=true 시 "콤보타이머" 레이블이 DOM에 표시됨', () => {
    const inputStartTime = Date.now()
    render(
      <ComboTimer
        computerShowTime={3000}
        inputStartTime={inputStartTime}
        isActive={true}
        isBreaking={false}
      />
    )
    expect(screen.getByText('콤보타이머')).toBeTruthy()
  })

  it('정상 흐름: "콤보타이머" 레이블이 게이지 트랙보다 DOM 순서상 앞에 위치함', () => {
    const inputStartTime = Date.now()
    render(
      <ComboTimer
        computerShowTime={3000}
        inputStartTime={inputStartTime}
        isActive={true}
        isBreaking={false}
      />
    )
    const label = screen.getByText('콤보타이머')
    const track = screen.getByTestId('combo-timer-track')
    // label이 track보다 DOM 순서상 앞에 있어야 함 (DOCUMENT_POSITION_FOLLOWING)
    expect(label.compareDocumentPosition(track) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  // ── 엣지 케이스 ──────────────────────────────────────────────────────────────

  it('엣지 케이스: isActive=false && isBreaking=false → 컴포넌트 null → "콤보타이머" 레이블 미표시', () => {
    render(
      <ComboTimer
        computerShowTime={3000}
        inputStartTime={1000}
        isActive={false}
        isBreaking={false}
      />
    )
    expect(screen.queryByText('콤보타이머')).toBeNull()
  })

  it('엣지 케이스: isBreaking=true → 600ms 후 collapse 완료 → "콤보타이머" 레이블도 함께 미표시', () => {
    const inputStartTime = Date.now()
    render(
      <ComboTimer
        computerShowTime={3000}
        inputStartTime={inputStartTime}
        isActive={true}
        isBreaking={true}
      />
    )
    act(() => { vi.advanceTimersByTime(600) })
    expect(screen.queryByText('콤보타이머')).toBeNull()
  })

  it('엣지 케이스: isBreaking=true 직후 600ms 이전 (collapse 진행 중) → "콤보타이머" 레이블 유지됨', () => {
    const inputStartTime = Date.now()
    render(
      <ComboTimer
        computerShowTime={3000}
        inputStartTime={inputStartTime}
        isActive={true}
        isBreaking={true}
      />
    )
    // 300ms — collapse 아직 진행 중 (done이 되려면 600ms 필요)
    act(() => { vi.advanceTimersByTime(300) })
    expect(screen.queryByText('콤보타이머')).toBeTruthy()
  })

  // ── 에러 처리 ────────────────────────────────────────────────────────────────

  it('에러 처리: isActive=true → isActive=false 전환 시 "콤보타이머" 레이블 즉시 사라짐', () => {
    const inputStartTime = Date.now()
    const { rerender } = render(
      <ComboTimer
        computerShowTime={3000}
        inputStartTime={inputStartTime}
        isActive={true}
        isBreaking={false}
      />
    )
    expect(screen.queryByText('콤보타이머')).toBeTruthy()

    act(() => {
      rerender(
        <ComboTimer
          computerShowTime={3000}
          inputStartTime={inputStartTime}
          isActive={false}
          isBreaking={false}
        />
      )
    })
    expect(screen.queryByText('콤보타이머')).toBeNull()
  })
})
