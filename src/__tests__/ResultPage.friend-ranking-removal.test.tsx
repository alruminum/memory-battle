import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ResultPage } from '../pages/ResultPage'

// Mock 외부 의존
vi.mock('../store/gameStore', () => ({
  useGameStore: vi.fn(() => ({
    score: 250,
    stage: 5,
    userId: 'user-test-101',
    baseScore: 200,
    fullComboCount: 1,
    maxComboStreak: 5,
  })),
}))

const mockSubmitScore = vi.fn()
vi.mock('../hooks/useRanking', () => ({
  useRanking: vi.fn(() => ({
    daily: [],
    myRanks: { daily: 0, monthly: 0, season: 0 },
    isLoading: false,
    submitScore: mockSubmitScore,
  })),
}))

const mockShowAd = vi.fn()
vi.mock('../hooks/useRewardAd', () => ({
  useRewardAd: vi.fn(() => ({
    show: mockShowAd,
    isLoading: false,
  })),
}))

// ait.ts mock — openLeaderboard가 호출되지 않음을 검증
const { mockOpenLeaderboard } = vi.hoisted(() => ({
  mockOpenLeaderboard: vi.fn(),
}))
vi.mock('../lib/ait', () => ({
  COIN_EXCHANGE_AMOUNT: 10,
  IS_SANDBOX: false,
  grantCoinExchange: vi.fn(),
  openLeaderboard: mockOpenLeaderboard,
}))

vi.mock('../hooks/useCoin', () => ({
  useCoin: vi.fn(() => ({
    addCoins: vi.fn().mockResolvedValue(0),
    getBalance: vi.fn().mockResolvedValue(0),
    getLifetimeExchanged: vi.fn().mockResolvedValue(0),
  })),
}))

describe('ResultPage — 친구 랭킹 보기 버튼 제거 (#101)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockShowAd.mockResolvedValue(false)
    mockSubmitScore.mockResolvedValue(undefined)
  })

  // ── 정상 흐름 ──────────────────────────────────────────────────────────────

  it('TC-1 | "친구 랭킹 보기" 버튼이 렌더링되지 않는다 (RV-1)', async () => {
    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)
    await waitFor(() => {
      expect(screen.queryByText('친구 랭킹 보기')).not.toBeInTheDocument()
    })
  })

  it('TC-2 | "PLAY AGAIN" 버튼이 렌더링된다 (RV-2 회귀 없음)', () => {
    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)
    expect(screen.getByText('PLAY AGAIN')).toBeInTheDocument()
  })

  it('TC-3 | "View Rankings" 버튼이 렌더링된다 (RV-3 회귀 없음)', () => {
    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)
    expect(screen.getByText('View Rankings')).toBeInTheDocument()
  })

  it('TC-4 | "View Rankings" 클릭 시 onGoRanking 콜백이 호출된다', () => {
    const onGoRanking = vi.fn()
    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={onGoRanking} />)
    fireEvent.click(screen.getByText('View Rankings'))
    expect(onGoRanking).toHaveBeenCalledTimes(1)
  })

  it('TC-5 | 광고 완료(adDone=true) 후 PLAY AGAIN 버튼이 활성화된다', async () => {
    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)
    const btn = screen.getByText('PLAY AGAIN') as HTMLButtonElement
    await waitFor(() => {
      expect(btn.disabled).toBe(false)
    })
  })

  // ── 엣지 케이스 ───────────────────────────────────────────────────────────

  it('TC-6 | 광고 미완료(adDone=false) 시 PLAY AGAIN 버튼이 disabled 상태다', () => {
    // 광고가 영원히 pending → adDone = false
    mockShowAd.mockReturnValue(new Promise(() => {}))
    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)
    const btn = screen.getByText('PLAY AGAIN') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('TC-7 | 버튼이 정확히 3개 렌더링된다', () => {
    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
  })

  // ── 에러 처리 ─────────────────────────────────────────────────────────────

  it('TC-8 | 광고 실패 시에도 adDone=true로 PLAY AGAIN 버튼이 활성화된다', async () => {
    mockShowAd.mockRejectedValue(new Error('광고 실패'))
    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)
    const btn = screen.getByText('PLAY AGAIN') as HTMLButtonElement
    await waitFor(() => {
      expect(btn.disabled).toBe(false)
    })
  })

  it('TC-9 | openLeaderboard가 ResultPage 생명주기 동안 호출되지 않는다', async () => {
    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)
    await waitFor(() => {
      expect(mockOpenLeaderboard).not.toHaveBeenCalled()
    })
  })
})
