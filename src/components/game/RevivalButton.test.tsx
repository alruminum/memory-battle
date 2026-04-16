/**
 * RevivalButton 컴포넌트 테스트 (impl 05-revival-item)
 * 대상: src/components/game/RevivalButton.tsx
 */
import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RevivalButton } from './RevivalButton'

// ── 기본 props ────────────────────────────────────────────────────────────────

const defaultProps = {
  coinBalance: 5,
  revivalUsed: false,
  isProcessing: false,
  onRevive: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── 정상 흐름 ─────────────────────────────────────────────────────────────────

describe('RevivalButton — 정상 흐름', () => {
  it('coinBalance=5, revivalUsed=false → 버튼 활성, "🪙 5코인으로 부활" 텍스트', () => {
    const { getByRole } = render(<RevivalButton {...defaultProps} />)
    const button = getByRole('button')
    expect(button).not.toBeDisabled()
    expect(button.textContent).toContain('5코인으로 부활')
  })

  it('isProcessing=true → "처리 중..." 텍스트, disabled', () => {
    const { getByRole } = render(
      <RevivalButton {...defaultProps} isProcessing={true} />
    )
    const button = getByRole('button')
    expect(button).toBeDisabled()
    expect(button.textContent).toContain('처리 중...')
  })

  it('canRevive && !isProcessing → pointerDown 시 onRevive 호출', () => {
    const onRevive = vi.fn()
    const { getByRole } = render(
      <RevivalButton {...defaultProps} onRevive={onRevive} />
    )
    fireEvent.pointerDown(getByRole('button'))
    expect(onRevive).toHaveBeenCalledTimes(1)
  })

  it('canRevive=true이면 disabledReason 텍스트 없음', () => {
    const { queryByText } = render(<RevivalButton {...defaultProps} />)
    expect(queryByText('이미 부활을 사용했습니다')).toBeNull()
    expect(queryByText(/코인이 부족합니다/)).toBeNull()
  })
})

// ── canRevive=false → null 반환 ───────────────────────────────────────────────

describe('RevivalButton — canRevive=false → null', () => {
  it('coinBalance=4 → renders nothing', () => {
    const { queryByRole } = render(
      <RevivalButton {...defaultProps} coinBalance={4} />
    )
    expect(queryByRole('button')).toBeNull()
  })

  it('coinBalance=0 → renders nothing', () => {
    const { queryByRole } = render(
      <RevivalButton {...defaultProps} coinBalance={0} />
    )
    expect(queryByRole('button')).toBeNull()
  })

  it('revivalUsed=true → renders nothing', () => {
    const { queryByRole } = render(
      <RevivalButton {...defaultProps} revivalUsed={true} />
    )
    expect(queryByRole('button')).toBeNull()
  })

  it('revivalUsed=true && coinBalance>=5 → renders nothing', () => {
    const { queryByRole } = render(
      <RevivalButton {...defaultProps} revivalUsed={true} coinBalance={10} />
    )
    expect(queryByRole('button')).toBeNull()
  })
})

// ── 엣지 케이스 ───────────────────────────────────────────────────────────────

describe('RevivalButton — 엣지 케이스', () => {
  it('경계값: coinBalance=5 (정확히 5코인) → 버튼 활성', () => {
    const { getByRole } = render(
      <RevivalButton {...defaultProps} coinBalance={5} />
    )
    expect(getByRole('button')).not.toBeDisabled()
  })

  it('경계값: coinBalance=4 (1 부족) → 렌더링 없음', () => {
    const { queryByRole } = render(
      <RevivalButton {...defaultProps} coinBalance={4} />
    )
    expect(queryByRole('button')).toBeNull()
  })
})

// ── 에러 처리 ─────────────────────────────────────────────────────────────────

describe('RevivalButton — 에러 처리', () => {
  it('isProcessing=true 상태에서 pointerDown → onRevive 미호출', () => {
    const onRevive = vi.fn()
    const { getByRole } = render(
      <RevivalButton {...defaultProps} isProcessing={true} onRevive={onRevive} />
    )
    fireEvent.pointerDown(getByRole('button'))
    expect(onRevive).not.toHaveBeenCalled()
  })

  it('wrapper div pointerDown → stopPropagation 작동 (backdrop onConfirm 버블링 차단)', () => {
    // RevivalButton wrapper div가 backdrop의 onPointerDown={onConfirm} 버블링을 차단하는지 검증
    const parentHandler = vi.fn()
    const { container } = render(
      <div onPointerDown={parentHandler}>
        <RevivalButton {...defaultProps} />
      </div>
    )
    // container.firstChild = 외부 div (parentHandler)
    // container.firstChild.firstChild = RevivalButton wrapper div (stopPropagation)
    const wrapperDiv = container.firstChild?.firstChild as HTMLElement
    fireEvent.pointerDown(wrapperDiv)
    expect(parentHandler).not.toHaveBeenCalled()
  })
})
