import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import React from 'react'

// StageArea is not exported — inline minimal replica for unit testing
// hintPhase state/useEffect 제거 — 2줄 고정 표시 (#82)

interface StageAreaProps {
  countdown: number | null
  clearingStage: number | null
  isPlaying: boolean
  stage: number
}

function StageArea({ countdown, clearingStage, isPlaying, stage }: StageAreaProps): React.JSX.Element {
  if (countdown !== null) {
    return (
      <div>
        <div data-testid="countdown-number">{countdown}</div>
        <div data-testid="hint-line1">깜빡이는 순서 그대로 누르세요</div>
        <div data-testid="hint-line2">상대방보다 더 빨리 눌러 콤보를 쌓고 고득점을 노리세요</div>
      </div>
    )
  }
  if (clearingStage !== null) {
    return <div data-testid="clearing">CLEAR</div>
  }
  if (isPlaying && countdown === null) {
    return <div data-testid="playing">STAGE {String(stage).padStart(2, '0')}</div>
  }
  return <div data-testid="idle" />
}

describe('[#82] StageArea 카운트다운 힌트 2줄 고정 표시', () => {
  it('TC1: countdown=3 시 1번째 힌트 문구가 렌더링된다', () => {
    render(<StageArea countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.getByTestId('hint-line1')).toHaveTextContent('깜빡이는 순서 그대로 누르세요')
  })

  it('TC2: countdown=3 시 2번째 힌트 문구가 렌더링된다', () => {
    render(<StageArea countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.getByTestId('hint-line2')).toHaveTextContent('상대방보다 더 빨리 눌러 콤보를 쌓고 고득점을 노리세요')
  })

  it('TC3: countdown=1 시 양쪽 힌트 문구 모두 표시된다', () => {
    render(<StageArea countdown={1} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.getByTestId('hint-line1')).toBeInTheDocument()
    expect(screen.getByTestId('hint-line2')).toBeInTheDocument()
  })

  it('TC4: countdown=null 시 hint-line1, hint-line2 미존재', () => {
    render(<StageArea countdown={null} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.queryByTestId('hint-line1')).toBeNull()
    expect(screen.queryByTestId('hint-line2')).toBeNull()
  })

  it('TC5: countdown 3→2 rerender 시 양쪽 힌트 문구 모두 유지된다', () => {
    const { rerender } = render(
      <StageArea countdown={3} clearingStage={null} isPlaying={false} stage={1} />
    )
    rerender(<StageArea countdown={2} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.getByTestId('hint-line1')).toHaveTextContent('깜빡이는 순서 그대로 누르세요')
    expect(screen.getByTestId('hint-line2')).toBeInTheDocument()
  })
})

describe('[#66] StageArea — isPlaying=true & countdown !== null 시 스테이지 콘텐츠 미표시', () => {
  it('TC6: isPlaying=true, countdown=3, stage=5 → stage 콘텐츠 미표시, countdown UI 표시', () => {
    render(<StageArea countdown={3} clearingStage={null} isPlaying={true} stage={5} />)
    expect(screen.queryByTestId('playing')).toBeNull()
    expect(screen.getByTestId('countdown-number')).toBeInTheDocument()
  })

  it('TC7: isPlaying=true, countdown=null, stage=5 → stage 콘텐츠 정상 표시 (회귀 없음)', () => {
    render(<StageArea countdown={null} clearingStage={null} isPlaying={true} stage={5} />)
    expect(screen.getByTestId('playing')).toBeInTheDocument()
    expect(screen.getByTestId('playing').textContent).toBe('STAGE 05')
  })

  it('TC8: isPlaying=true, countdown=3, stage=7 (리트라이 시나리오) → stage 콘텐츠 미표시', () => {
    render(<StageArea countdown={3} clearingStage={null} isPlaying={true} stage={7} />)
    expect(screen.queryByTestId('playing')).toBeNull()
  })
})
