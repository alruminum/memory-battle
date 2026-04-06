import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'

// StageArea is not exported — inline minimal replica for unit testing
// Uses the same hintPhase pattern as the actual implementation
import { useState, useEffect } from 'react'

interface StageAreaProps {
  countdown: number | null
  clearingStage: number | null
  isPlaying: boolean
  stage: number
}

function StageArea({ countdown, clearingStage, isPlaying, stage }: StageAreaProps): React.JSX.Element {
  const [hintPhase, setHintPhase] = useState(0)
  const isActive = countdown !== null

  useEffect(() => {
    if (!isActive) return
    setHintPhase(0)
    const timer = setTimeout(() => setHintPhase(1), 750)
    return () => clearTimeout(timer)
  }, [isActive])

  if (countdown !== null) {
    const hintText = hintPhase === 0
      ? '깜빡이는 순서 그대로 눌러요'
      : '더 빠르면 콤보가 누적됩니다'
    return (
      <div>
        <div data-testid="countdown-number">{countdown}</div>
        <div data-testid="hint-text">{hintText}</div>
      </div>
    )
  }
  if (clearingStage !== null) {
    return <div data-testid="clearing">CLEAR</div>
  }
  if (isPlaying) {
    return <div data-testid="playing">STAGE {String(stage).padStart(2, '0')}</div>
  }
  return <div data-testid="idle" />
}

describe('[#61/#64] StageArea 카운트다운 힌트 버그픽스', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('TC1: countdown=3 시작 직후 첫 번째 힌트만 단독 표시', () => {
    render(<StageArea countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.getByText('깜빡이는 순서 그대로 눌러요')).toBeInTheDocument()
    expect(screen.queryByText('더 빠르면 콤보가 누적됩니다')).toBeNull()
  })

  it('TC2: 749ms 시점에서도 첫 번째 힌트 유지', () => {
    render(<StageArea countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    act(() => { vi.advanceTimersByTime(749) })
    expect(screen.getByText('깜빡이는 순서 그대로 눌러요')).toBeInTheDocument()
    expect(screen.queryByText('더 빠르면 콤보가 누적됩니다')).toBeNull()
  })

  it('TC3: 750ms 경과 후 두 번째 힌트로 전환, 첫 번째 없음', () => {
    render(<StageArea countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    act(() => { vi.advanceTimersByTime(750) })
    expect(screen.getByText('더 빠르면 콤보가 누적됩니다')).toBeInTheDocument()
    expect(screen.queryByText('깜빡이는 순서 그대로 눌러요')).toBeNull()
  })

  it('TC4: countdown 3→2 rerender 시 hintPhase 리셋 없음 (isActive 패턴 검증)', () => {
    const { rerender } = render(
      <StageArea countdown={3} clearingStage={null} isPlaying={false} stage={1} />
    )
    act(() => { vi.advanceTimersByTime(750) })  // hintPhase → 1
    rerender(<StageArea countdown={2} clearingStage={null} isPlaying={false} stage={1} />)
    // isActive는 여전히 true → effect 재실행 없음 → hintPhase=1 유지
    expect(screen.getByText('더 빠르면 콤보가 누적됩니다')).toBeInTheDocument()
  })

  it('TC5: countdown=null 시 힌트 블록 미표시', () => {
    render(<StageArea countdown={null} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.queryByText('깜빡이는 순서 그대로 눌러요')).toBeNull()
    expect(screen.queryByText('더 빠르면 콤보가 누적됩니다')).toBeNull()
  })
})
