/**
 * PointExchangeButton 컴포넌트 테스트
 * impl: docs/milestones/v04/epics/epic-12-coin-v04/impl/06-toss-points-exchange.md
 * issue: #112
 */
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PointExchangeButton } from '../components/result/PointExchangeButton'

describe('PointExchangeButton — 정상 흐름', () => {
  it('coinBalance >= 10이면 버튼이 활성화된다 (disabled=false)', () => {
    const onExchange = vi.fn().mockResolvedValue(undefined)
    render(<PointExchangeButton coinBalance={10} onExchange={onExchange} />)
    const btn = screen.getByRole('button')
    expect(btn).not.toBeDisabled()
  })

  it('coinBalance = 10 (경계값) 에서 버튼이 활성화된다', () => {
    render(<PointExchangeButton coinBalance={10} onExchange={vi.fn().mockResolvedValue(undefined)} />)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('버튼 레이블이 "🪙 10코인 → 10포인트 교환"으로 표시된다', () => {
    render(<PointExchangeButton coinBalance={15} onExchange={vi.fn().mockResolvedValue(undefined)} />)
    expect(screen.getByRole('button')).toHaveTextContent('🪙 10코인 → 10포인트 교환')
  })

  it('버튼 클릭 시 onExchange 콜백이 호출된다', async () => {
    const onExchange = vi.fn().mockResolvedValue(undefined)
    render(<PointExchangeButton coinBalance={20} onExchange={onExchange} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    expect(onExchange).toHaveBeenCalledTimes(1)
  })

  it('처리 완료 후 버튼 텍스트가 원래 레이블로 복원된다', async () => {
    const onExchange = vi.fn().mockResolvedValue(undefined)
    render(<PointExchangeButton coinBalance={10} onExchange={onExchange} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    // 처리 완료 후 원래 텍스트로 복원
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('🪙 10코인 → 10포인트 교환')
    })
  })
})

describe('PointExchangeButton — 엣지 케이스', () => {
  it('coinBalance = 9 (경계값 아래)에서 버튼이 비활성화된다', () => {
    render(<PointExchangeButton coinBalance={9} onExchange={vi.fn()} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('coinBalance < 10이면 사유 메시지가 표시된다', () => {
    render(<PointExchangeButton coinBalance={5} onExchange={vi.fn()} />)
    expect(screen.getByText('코인 10개가 필요합니다 (현재 5개)')).toBeInTheDocument()
  })

  it('coinBalance = 0이면 사유 메시지에 현재 잔액 0이 표시된다', () => {
    render(<PointExchangeButton coinBalance={0} onExchange={vi.fn()} />)
    expect(screen.getByText('코인 10개가 필요합니다 (현재 0개)')).toBeInTheDocument()
  })

  it('coinBalance >= 10이면 사유 메시지가 표시되지 않는다', () => {
    render(<PointExchangeButton coinBalance={10} onExchange={vi.fn().mockResolvedValue(undefined)} />)
    expect(screen.queryByText(/코인 10개가 필요합니다/)).not.toBeInTheDocument()
  })
})

describe('PointExchangeButton — 에러 처리', () => {
  it('처리 중(isProcessing) 연속 클릭 시 onExchange가 1회만 호출된다', async () => {
    let resolveExchange!: () => void
    const onExchange = vi.fn().mockImplementation(
      () => new Promise<void>((resolve) => { resolveExchange = resolve })
    )
    render(<PointExchangeButton coinBalance={20} onExchange={onExchange} />)

    const btn = screen.getByRole('button')

    // 첫 번째 클릭 (처리 시작)
    fireEvent.click(btn)

    // 처리 중 추가 클릭
    fireEvent.click(btn)
    fireEvent.click(btn)

    // Exchange 완료
    await act(async () => {
      resolveExchange()
    })

    expect(onExchange).toHaveBeenCalledTimes(1)
  })

  it('처리 중일 때 버튼이 비활성화된다', async () => {
    let resolveExchange!: () => void
    const onExchange = vi.fn().mockImplementation(
      () => new Promise<void>((resolve) => { resolveExchange = resolve })
    )
    render(<PointExchangeButton coinBalance={20} onExchange={onExchange} />)

    fireEvent.click(screen.getByRole('button'))

    // 처리 중 버튼 비활성화 확인
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled()
    })

    await act(async () => {
      resolveExchange()
    })
  })

  it('처리 중일 때 버튼 텍스트가 "교환 중..."으로 변경된다', async () => {
    let resolveExchange!: () => void
    const onExchange = vi.fn().mockImplementation(
      () => new Promise<void>((resolve) => { resolveExchange = resolve })
    )
    render(<PointExchangeButton coinBalance={20} onExchange={onExchange} />)

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('교환 중...')
    })

    await act(async () => {
      resolveExchange()
    })
  })

  it('onExchange 에러 발생 시에도 isProcessing이 false로 복원된다', async () => {
    const onExchange = vi.fn().mockRejectedValue(new Error('교환 실패'))
    render(<PointExchangeButton coinBalance={20} onExchange={onExchange} />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })

    // 에러 후 버튼 활성화 복원 확인
    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled()
    })
  })
})
