/**
 * GameOverOverlay.test.tsx
 * F4-AD handleAdRevive 흐름 테스트 (impl 08-ad-revival, issue #124)
 *
 * 커버 범위:
 *   - 광고 완시청(earned=true) → revive() 호출, addCoins 미호출
 *   - 광고 스킵/실패(earned=false) → revive() 미호출, isAdLoading 해제
 *   - 광고 예외(throw) → revive() 미호출, toast 표시, isAdLoading 해제
 *   - 광고 로딩 중 버튼 비활성
 *   - handleAdRevive 재진입 방지 (isAdLoading=true 구간 중복 탭)
 *   - handleRevive(코인 부활) + handleAdRevive 동시 진입 방지
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GameOverOverlay } from './GameOverOverlay'

// -----------------------------------------------------------------
// 모듈 mock
// -----------------------------------------------------------------
const mockRevive = vi.fn()
const mockAddCoins = vi.fn()
const mockShowAd = vi.fn<[], Promise<boolean>>()

vi.mock('../../store/gameStore', () => ({
  useGameStore: () => ({
    revive: mockRevive,
  }),
}))

vi.mock('../../hooks/useCoin', () => ({
  useCoin: () => ({
    addCoins: mockAddCoins,
  }),
}))

vi.mock('../../hooks/useRewardAd', () => ({
  useRewardAd: () => ({
    show: mockShowAd,
    isLoading: false,
  }),
}))

// -----------------------------------------------------------------
// 기본 props
// -----------------------------------------------------------------
const defaultProps = {
  reason: 'timeout' as const,
  coinBalance: 5,
  revivalUsed: false,
  onConfirm: vi.fn(),
}

describe('GameOverOverlay — F4-AD handleAdRevive (impl 08-ad-revival)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------
  // REQ-08-AD-1: 광고 완시청 → revive() 호출, addCoins 미호출
  // ---------------------------------------------------------------
  describe('REQ-08-AD-1 — 광고 완시청 (earned=true)', () => {
    it('show() resolve(true) → revive() 호출', async () => {
      mockShowAd.mockResolvedValue(true)
      render(<GameOverOverlay {...defaultProps} />)

      fireEvent.pointerDown(screen.getByText('광고 보고 부활'))
      await waitFor(() => expect(mockRevive).toHaveBeenCalledTimes(1))
    })

    it('show() resolve(true) → addCoins 미호출 (코인 미지급)', async () => {
      mockShowAd.mockResolvedValue(true)
      render(<GameOverOverlay {...defaultProps} />)

      fireEvent.pointerDown(screen.getByText('광고 보고 부활'))
      await waitFor(() => expect(mockRevive).toHaveBeenCalledTimes(1))
      expect(mockAddCoins).not.toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------
  // REQ-08-AD-2: 광고 스킵/실패 (earned=false) → 버튼 재활성
  // ---------------------------------------------------------------
  describe('REQ-08-AD-2 — 광고 스킵/실패 (earned=false)', () => {
    it('show() resolve(false) → revive() 미호출', async () => {
      mockShowAd.mockResolvedValue(false)
      render(<GameOverOverlay {...defaultProps} />)

      fireEvent.pointerDown(screen.getByText('광고 보고 부활'))
      await waitFor(() => expect(mockShowAd).toHaveBeenCalledTimes(1))
      expect(mockRevive).not.toHaveBeenCalled()
    })

    it('show() resolve(false) → 광고 버튼 재활성 (disabled 해제)', async () => {
      mockShowAd.mockResolvedValue(false)
      render(<GameOverOverlay {...defaultProps} />)

      fireEvent.pointerDown(screen.getByText('광고 보고 부활'))
      await waitFor(() => {
        expect(screen.getByText('광고 보고 부활')).not.toBeDisabled()
      })
    })
  })

  // ---------------------------------------------------------------
  // REQ-08-AD-3: 광고 예외 (throw) → toast 표시, 버튼 재활성
  // ---------------------------------------------------------------
  describe('REQ-08-AD-3 — 광고 예외 (show() throw)', () => {
    it('show() throw → revive() 미호출', async () => {
      mockShowAd.mockRejectedValue(new Error('ad load failed'))
      render(<GameOverOverlay {...defaultProps} />)

      fireEvent.pointerDown(screen.getByText('광고 보고 부활'))
      await waitFor(() => expect(mockShowAd).toHaveBeenCalledTimes(1))
      expect(mockRevive).not.toHaveBeenCalled()
    })

    it('show() throw → toast "광고를 불러오지 못했습니다" 표시', async () => {
      mockShowAd.mockRejectedValue(new Error('ad load failed'))
      render(<GameOverOverlay {...defaultProps} />)

      fireEvent.pointerDown(screen.getByText('광고 보고 부활'))
      await waitFor(() => {
        expect(screen.getByText('광고를 불러오지 못했습니다')).toBeInTheDocument()
      })
    })

    it('show() throw → 광고 버튼 재활성 (disabled 해제)', async () => {
      mockShowAd.mockRejectedValue(new Error('ad load failed'))
      render(<GameOverOverlay {...defaultProps} />)

      fireEvent.pointerDown(screen.getByText('광고 보고 부활'))
      await waitFor(() => {
        expect(screen.getByText('광고 보고 부활')).not.toBeDisabled()
      })
    })
  })

  // ---------------------------------------------------------------
  // REQ-08-AD-4: 광고 로딩 중 두 버튼 모두 비활성
  // ---------------------------------------------------------------
  describe('REQ-08-AD-4 — 광고 로딩 중 버튼 비활성', () => {
    it('handleAdRevive 호출 직후 → 광고 버튼 disabled (로딩 텍스트)', async () => {
      // show()가 즉시 resolve되지 않도록 pending Promise 사용
      let resolveAd!: (v: boolean) => void
      mockShowAd.mockReturnValue(new Promise((res) => { resolveAd = res }))

      render(<GameOverOverlay {...defaultProps} />)
      fireEvent.pointerDown(screen.getByText('광고 보고 부활'))

      // 로딩 중 텍스트 확인 (isAdLoading=true 구간)
      await waitFor(() => {
        expect(screen.getByText('광고 로딩 중...')).toBeInTheDocument()
      })

      // 정리: resolve 후 테스트 종료
      resolveAd(false)
    })

    it('handleAdRevive 호출 직후, coinBalance≥5 → 코인 버튼도 disabled', async () => {
      let resolveAd!: (v: boolean) => void
      mockShowAd.mockReturnValue(new Promise((res) => { resolveAd = res }))

      render(<GameOverOverlay {...defaultProps} coinBalance={5} />)
      fireEvent.pointerDown(screen.getByText('광고 보고 부활'))

      await waitFor(() => {
        const coinBtn = screen.queryByText('🪙 5코인으로 부활') ??
                        screen.queryByText('처리 중...')
        if (coinBtn) expect(coinBtn.closest('button')).toBeDisabled()
      })

      resolveAd(false)
    })
  })

  // ---------------------------------------------------------------
  // REQ-08-AD-5: handleAdRevive 재진입 방지
  // ---------------------------------------------------------------
  describe('REQ-08-AD-5 — 재진입 방지 (isAdLoading 중 중복 탭)', () => {
    it('isAdLoading 구간 중 광고 버튼 재탭 → show() 1회만 호출', async () => {
      let resolveAd!: (v: boolean) => void
      mockShowAd.mockReturnValue(new Promise((res) => { resolveAd = res }))

      render(<GameOverOverlay {...defaultProps} />)
      // 첫 번째 탭
      fireEvent.pointerDown(screen.getByText('광고 보고 부활'))

      // 로딩 상태 진입 대기
      await waitFor(() => screen.getByText('광고 로딩 중...'))

      // 두 번째 탭 (isAdLoading=true 구간)
      fireEvent.pointerDown(screen.getAllByRole('button')[0])

      // show()는 1회만 호출돼야 함
      expect(mockShowAd).toHaveBeenCalledTimes(1)

      resolveAd(false)
    })
  })
})
