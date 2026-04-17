/**
 * RevivalButton.test.tsx
 * F4-AD 스펙 전면 교체 (impl 08-ad-revival, issue #124)
 *
 * 기존 F4 단독 스펙(null 반환 기대)에서 F4+F4-AD 통합 스펙으로 교체.
 * RevivalButton은 순수 UI 컴포넌트이므로 외부 store/hook mock 불필요.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RevivalButton } from './RevivalButton'

// -----------------------------------------------------------------
// 기본 props (잔액≥5, revivalUsed=false — "둘 다 표시" 기준)
// -----------------------------------------------------------------
const defaultProps = {
  coinBalance: 5,
  revivalUsed: false,
  isProcessing: false,
  isAdLoading: false,
  onRevive: vi.fn(),
  onAdRevive: vi.fn(),
}

describe('RevivalButton (F4+F4-AD, impl 08-ad-revival)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------
  // REQ-08-1: 렌더 조건 분기 (PRD §11 버튼 표시 조건표)
  // ---------------------------------------------------------------
  describe('REQ-08-1 — 렌더 조건 분기', () => {
    it('revivalUsed=true → 버튼 없음 (null 반환)', () => {
      const { container } = render(
        <RevivalButton {...defaultProps} revivalUsed={true} />,
      )
      expect(container.firstChild).toBeNull()
    })

    it('revivalUsed=false, coinBalance=4 → "광고 보고 부활" 버튼만 렌더', () => {
      render(<RevivalButton {...defaultProps} coinBalance={4} />)
      expect(screen.getByText('광고 보고 부활')).toBeInTheDocument()
    })

    it('revivalUsed=false, coinBalance=4 → 코인 부활 버튼 미렌더', () => {
      render(<RevivalButton {...defaultProps} coinBalance={4} />)
      expect(screen.queryByText(/5코인으로 부활/)).not.toBeInTheDocument()
    })

    it('revivalUsed=false, coinBalance=5 → "광고 보고 부활" 버튼 렌더', () => {
      render(<RevivalButton {...defaultProps} coinBalance={5} />)
      expect(screen.getByText('광고 보고 부활')).toBeInTheDocument()
    })

    it('revivalUsed=false, coinBalance=5 → "🪙 5코인으로 부활" 버튼 렌더', () => {
      render(<RevivalButton {...defaultProps} coinBalance={5} />)
      expect(screen.getByText('🪙 5코인으로 부활')).toBeInTheDocument()
    })

    it('revivalUsed=false, coinBalance=7 → 버튼 2개 렌더 (광고 + 코인)', () => {
      render(<RevivalButton {...defaultProps} coinBalance={7} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
    })

    it('revivalUsed=false, coinBalance=3 → 버튼 1개 렌더 (광고만)', () => {
      render(<RevivalButton {...defaultProps} coinBalance={3} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(1)
    })
  })

  // ---------------------------------------------------------------
  // REQ-08-3: disabled 상태 — isAdLoading=true
  // ---------------------------------------------------------------
  describe('REQ-08-3 — isAdLoading=true 시 두 버튼 모두 disabled', () => {
    it('isAdLoading=true → 광고 버튼 disabled', () => {
      render(<RevivalButton {...defaultProps} isAdLoading={true} />)
      // 텍스트가 "광고 로딩 중..."으로 변경되므로 role로 조회
      const buttons = screen.getAllByRole('button')
      expect(buttons[0]).toBeDisabled()
    })

    it('isAdLoading=true, coinBalance≥5 → 코인 버튼도 disabled', () => {
      render(<RevivalButton {...defaultProps} isAdLoading={true} coinBalance={5} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons[1]).toBeDisabled()
    })
  })

  // ---------------------------------------------------------------
  // REQ-08-4: disabled 상태 — isProcessing=true
  // ---------------------------------------------------------------
  describe('REQ-08-4 — isProcessing=true 시 두 버튼 모두 disabled', () => {
    it('isProcessing=true → 광고 버튼 disabled', () => {
      render(<RevivalButton {...defaultProps} isProcessing={true} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons[0]).toBeDisabled()
    })

    it('isProcessing=true, coinBalance≥5 → 코인 버튼도 disabled', () => {
      render(<RevivalButton {...defaultProps} isProcessing={true} coinBalance={5} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons[1]).toBeDisabled()
    })
  })

  // ---------------------------------------------------------------
  // REQ-08-5: 로딩 중 텍스트 변경
  // ---------------------------------------------------------------
  describe('REQ-08-5 — 로딩 중 텍스트', () => {
    it('isAdLoading=true → 광고 버튼 텍스트 "광고 로딩 중..."', () => {
      render(<RevivalButton {...defaultProps} isAdLoading={true} />)
      expect(screen.getByText('광고 로딩 중...')).toBeInTheDocument()
    })

    it('isAdLoading=false → 광고 버튼 텍스트 "광고 보고 부활"', () => {
      render(<RevivalButton {...defaultProps} isAdLoading={false} />)
      expect(screen.getByText('광고 보고 부활')).toBeInTheDocument()
    })

    it('isProcessing=true, coinBalance≥5 → 코인 버튼 텍스트 "처리 중..."', () => {
      render(<RevivalButton {...defaultProps} isProcessing={true} coinBalance={5} />)
      expect(screen.getByText('처리 중...')).toBeInTheDocument()
    })

    it('isProcessing=false, coinBalance≥5 → 코인 버튼 텍스트 "🪙 5코인으로 부활"', () => {
      render(<RevivalButton {...defaultProps} isProcessing={false} coinBalance={5} />)
      expect(screen.getByText('🪙 5코인으로 부활')).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------
  // REQ-08-6: onPointerDown 이벤트 핸들러 정상 동작
  // ---------------------------------------------------------------
  describe('REQ-08-6 — 이벤트 핸들러 (정상 상태)', () => {
    it('광고 버튼 탭 → onAdRevive 호출', () => {
      render(<RevivalButton {...defaultProps} />)
      fireEvent.pointerDown(screen.getByText('광고 보고 부활'))
      expect(defaultProps.onAdRevive).toHaveBeenCalledTimes(1)
    })

    it('코인 버튼 탭 (coinBalance≥5) → onRevive 호출', () => {
      render(<RevivalButton {...defaultProps} coinBalance={5} />)
      fireEvent.pointerDown(screen.getByText('🪙 5코인으로 부활'))
      expect(defaultProps.onRevive).toHaveBeenCalledTimes(1)
    })
  })

  // ---------------------------------------------------------------
  // REQ-08-7: 비활성 구간 탭 — 핸들러 미호출
  // ---------------------------------------------------------------
  describe('REQ-08-7 — 비활성 구간 탭 시 핸들러 미호출', () => {
    it('isAdLoading=true — 광고 버튼 탭 → onAdRevive 미호출', () => {
      render(<RevivalButton {...defaultProps} isAdLoading={true} />)
      fireEvent.pointerDown(screen.getAllByRole('button')[0])
      expect(defaultProps.onAdRevive).not.toHaveBeenCalled()
    })

    it('isAdLoading=true, coinBalance≥5 — 코인 버튼 탭 → onRevive 미호출', () => {
      render(<RevivalButton {...defaultProps} isAdLoading={true} coinBalance={5} />)
      fireEvent.pointerDown(screen.getAllByRole('button')[1])
      expect(defaultProps.onRevive).not.toHaveBeenCalled()
    })

    it('isProcessing=true — 광고 버튼 탭 → onAdRevive 미호출', () => {
      render(<RevivalButton {...defaultProps} isProcessing={true} />)
      fireEvent.pointerDown(screen.getAllByRole('button')[0])
      expect(defaultProps.onAdRevive).not.toHaveBeenCalled()
    })

    it('isProcessing=true, coinBalance≥5 — 코인 버튼 탭 → onRevive 미호출', () => {
      render(<RevivalButton {...defaultProps} isProcessing={true} coinBalance={5} />)
      fireEvent.pointerDown(screen.getAllByRole('button')[1])
      expect(defaultProps.onRevive).not.toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------
  // REQ-08-8: stopPropagation — backdrop 버블링 차단
  // ---------------------------------------------------------------
  describe('REQ-08-8 — stopPropagation (backdrop 버블링 차단)', () => {
    it('wrapper div pointerDown → 부모 핸들러 미호출', () => {
      const parentHandler = vi.fn()
      render(
        <div onPointerDown={parentHandler}>
          <RevivalButton {...defaultProps} />
        </div>,
      )
      // RevivalButton의 wrapper div에 직접 pointerDown 발생
      const adButton = screen.getByText('광고 보고 부활')
      const wrapperDiv = adButton.closest('div')!
      fireEvent.pointerDown(wrapperDiv)
      expect(parentHandler).not.toHaveBeenCalled()
    })

    it('광고 버튼 탭 → 부모 핸들러 미호출', () => {
      const parentHandler = vi.fn()
      render(
        <div onPointerDown={parentHandler}>
          <RevivalButton {...defaultProps} />
        </div>,
      )
      fireEvent.pointerDown(screen.getByText('광고 보고 부활'))
      expect(parentHandler).not.toHaveBeenCalled()
    })

    it('코인 버튼 탭 (coinBalance≥5) → 부모 핸들러 미호출', () => {
      const parentHandler = vi.fn()
      render(
        <div onPointerDown={parentHandler}>
          <RevivalButton {...defaultProps} coinBalance={5} />
        </div>,
      )
      fireEvent.pointerDown(screen.getByText('🪙 5코인으로 부활'))
      expect(parentHandler).not.toHaveBeenCalled()
    })
  })
})
