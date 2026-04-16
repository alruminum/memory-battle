/**
 * ResultPage 코인 UI Polish 테스트 (impl 07)
 * impl: docs/milestones/v04/epics/epic-12-coin-v04/impl/07-coin-ui-polish.md
 * issue: #113
 *
 * 테스트 대상:
 *  - 코인 잔액 상시 표시 (`🪙 N`)
 *  - float-up 애니메이션 엘리먼트 조건부 렌더링
 *  - pointerEvents:none 스타일
 */
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ResultPage } from '../pages/ResultPage'
import { useGameStore } from '../store/gameStore'
import { useRanking } from '../hooks/useRanking'
import { useRewardAd } from '../hooks/useRewardAd'
import { useCoin } from '../hooks/useCoin'

// ── Mock 선언 ──────────────────────────────────────────
vi.mock('../store/gameStore', () => ({ useGameStore: vi.fn() }))
vi.mock('../hooks/useRanking', () => ({ useRanking: vi.fn() }))
vi.mock('../hooks/useRewardAd', () => ({ useRewardAd: vi.fn() }))
vi.mock('../hooks/useCoin', () => ({ useCoin: vi.fn() }))
vi.mock('../lib/ait', () => ({
  getUserId: vi.fn().mockResolvedValue('user-123'),
  grantCoinExchange: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../lib/gameLogic', () => ({
  randomCoinReward: vi.fn().mockReturnValue(3),
}))
vi.mock('../components/result/CoinRewardBadge', () => ({
  CoinRewardBadge: () => null,
}))
vi.mock('../components/result/PointExchangeButton', () => ({
  PointExchangeButton: () => null,
}))

// ── 헬퍼 ──────────────────────────────────────────────
const mockAddCoins = vi.fn()
const mockShowAd = vi.fn()

function makeDefaultMocks(coinBalance = 25) {
  vi.mocked(useGameStore).mockReturnValue({
    score: 300,
    stage: 6,
    userId: 'user-123',
    baseScore: 200,
    fullComboCount: 2,
    maxComboStreak: 10,
    coinBalance,
  } as any)

  vi.mocked(useRanking).mockReturnValue({
    daily: [],
    myRanks: { daily: 0, monthly: 0, season: 0 },
    isLoading: false,
    submitScore: vi.fn(),
  } as any)

  vi.mocked(useRewardAd).mockReturnValue({
    show: mockShowAd,
    isLoading: false,
  } as any)

  vi.mocked(useCoin).mockReturnValue({
    getBalance: vi.fn().mockResolvedValue(coinBalance),
    addCoins: mockAddCoins,
  } as any)
}

// ── 셋업 ──────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
  // 기본: 광고 false (코인 보상 없음)
  mockShowAd.mockResolvedValue(false)
  // addCoins는 기본 성공
  mockAddCoins.mockResolvedValue(25)
  makeDefaultMocks(25)
})

// ── 테스트 ──────────────────────────────────────────────────────────────────

describe('ResultPage — 코인 잔액 표시 (impl 07)', () => {
  // ── 정상 흐름 ──────────────────────────────────────
  it('TC-7 | "보유 코인" 레이블 텍스트가 렌더링됨', () => {
    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)

    expect(screen.getByText('보유 코인')).toBeInTheDocument()
  })

  it('TC-8 | coinBalance=25 → `🪙 25` 형식으로 표시됨', () => {
    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)

    expect(screen.getByText('🪙 25')).toBeInTheDocument()
  })

  // ── 엣지 케이스 ──────────────────────────────────────
  it('TC-9 | coinBalance=0 시 `🪙 0` 표시 (빈 잔액도 렌더링)', () => {
    makeDefaultMocks(0)

    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)

    expect(screen.getByText('🪙 0')).toBeInTheDocument()
  })
})

describe('ResultPage — float-up 애니메이션 (impl 07)', () => {
  // ── 정상 흐름 ──────────────────────────────────────
  it('TC-10 | 초기 상태 (coinReward=null) → .coin-float-up 엘리먼트 미렌더링', async () => {
    // showAd → false (earned 없음) → coinReward 세팅 안됨
    mockShowAd.mockResolvedValue(false)

    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)

    // adDone=true가 될 때까지 기다려 async effect 완료 확인
    await waitFor(() => {
      expect(screen.getByText('PLAY AGAIN')).not.toBeDisabled()
    })

    expect(document.querySelector('.coin-float-up')).not.toBeInTheDocument()
  })

  it('TC-11 | 광고 완시청 후 .coin-float-up 엘리먼트 렌더링됨', async () => {
    // showAd → true (earned) → addCoins 성공 → coinReward 세팅
    mockShowAd.mockResolvedValue(true)
    mockAddCoins.mockResolvedValue(27)

    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)

    await waitFor(() => {
      expect(document.querySelector('.coin-float-up')).toBeInTheDocument()
    })
  })

  // ── 에러 처리 ──────────────────────────────────────
  it('TC-12 | float-up 엘리먼트에 pointerEvents:none 스타일 적용됨 (버튼 클릭 방해 없음)', async () => {
    mockShowAd.mockResolvedValue(true)
    mockAddCoins.mockResolvedValue(27)

    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)

    await waitFor(() => {
      const el = document.querySelector('.coin-float-up') as HTMLElement | null
      expect(el).toBeInTheDocument()
      expect(el).toHaveStyle({ pointerEvents: 'none' })
    })
  })
})
