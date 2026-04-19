import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ResultPage } from '../pages/ResultPage'
import { useRanking } from '../hooks/useRanking'

// 파일 레벨 공통 mock (TC-1, TC-3, TC-4, TC-5 공유) — monthly: 3 기본값
vi.mock('../store/gameStore', () => ({
  useGameStore: vi.fn(() => ({
    score: 250,
    stage: 5,
    userId: 'user-test-102',
    baseScore: 200,
    fullComboCount: 1,
    maxComboStreak: 5,
  })),
}))

vi.mock('../hooks/useRanking', () => ({
  useRanking: vi.fn(() => ({
    daily: [],
    monthly: [],
    season: [],
    myRanks: { daily: 0, monthly: 3, season: 0 },
    isLoading: false,
    submitScore: vi.fn(),
    error: false,
    refetch: vi.fn(),
  })),
}))

vi.mock('../hooks/useRewardAd', () => ({
  useRewardAd: vi.fn(() => ({ show: vi.fn().mockResolvedValue(false), isLoading: false })),
}))

vi.mock('../hooks/useCoin', () => ({
  useCoin: vi.fn(() => ({
    addCoins: vi.fn().mockResolvedValue(0),
    getBalance: vi.fn().mockResolvedValue(0),
  })),
}))

describe('ResultPage — 광고 placeholder & monthly 포인트 텍스트 제거 (#102)', () => {
  // TC-1: monthly > 0 일 때 포인트 지급 텍스트 미렌더링
  it('TC-1 | monthly=3 시 "월 1일에 포인트 지급 예정" 텍스트 미렌더링', () => {
    const { queryByText } = render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)
    expect(queryByText(/월 1일에 포인트 지급/)).toBeNull()
  })

  // TC-3: 광고 placeholder 96px 영역 존재
  it('TC-3 | data-testid="ad-placeholder" 광고 placeholder 렌더링됨', () => {
    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)
    expect(screen.getByTestId('ad-placeholder')).toBeInTheDocument()
  })

  // TC-4: 버튼 정확히 3개
  it('TC-4 | 버튼이 정확히 3개 렌더링된다', () => {
    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
  })

  // TC-5: Monthly 랭킹 행 자체는 표시됨
  it('TC-5 | Monthly 랭킹 레이블이 여전히 렌더링된다', () => {
    render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)
    expect(screen.getByText('Monthly')).toBeInTheDocument()
  })
})

// TC-2: monthly=0 케이스 — 별도 describe 블록
describe('ResultPage — monthly=0일 때 포인트 텍스트 미표시 (#102)', () => {
  beforeEach(() => {
    vi.mocked(useRanking).mockReturnValue({
      daily: [],
      monthly: [],
      season: [],
      myRanks: { daily: 0, monthly: 0, season: 0 },
      isLoading: false,
      submitScore: vi.fn(),
      error: false,
      refetch: vi.fn(),
    })
  })

  it('TC-2 | monthly=0 시 "월 1일에 포인트 지급" 텍스트 미렌더링', () => {
    const { queryByText } = render(<ResultPage onPlayAgain={vi.fn()} onGoRanking={vi.fn()} />)
    expect(queryByText(/월 1일에 포인트 지급/)).toBeNull()
  })
})
