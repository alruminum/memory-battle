/**
 * MainPage 코인 UI Polish 테스트 (impl 07)
 * impl: docs/milestones/v04/epics/epic-12-coin-v04/impl/07-coin-ui-polish.md
 * issue: #113
 */
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MainPage } from '../pages/MainPage'
import { getUserId } from '../lib/ait'
import { useCoin } from '../hooks/useCoin'
import { useGameStore } from '../store/gameStore'

vi.mock('../lib/ait', () => ({ getUserId: vi.fn() }))
vi.mock('../hooks/useCoin', () => ({ useCoin: vi.fn() }))
vi.mock('../hooks/useRanking', () => ({
  useRanking: vi.fn(() => ({
    daily: [],
    myRanks: { daily: 0, monthly: 0, season: 0 },
    isLoading: false,
    refetch: vi.fn(),
  })),
}))
vi.mock('../store/gameStore', () => ({ useGameStore: vi.fn() }))

const mockGetBalance = vi.fn()

interface MockStoreState {
  userId: string
  setUserId: ReturnType<typeof vi.fn>
  score: number
  stage: number
  coinBalance: number
}

/** MainPage는 useGameStore()와 useGameStore((s)=>s.coinBalance) 두 패턴 모두 사용 */
function makeStoreMock(coinBalance: number) {
  return (selector?: (s: MockStoreState) => unknown) => {
    const state: MockStoreState = {
      userId: '',
      setUserId: vi.fn(),
      score: 0,
      stage: 1,
      coinBalance,
    }
    return typeof selector === 'function' ? selector(state) : state
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getUserId).mockResolvedValue('user-123')
  vi.mocked(useCoin).mockReturnValue({ getBalance: mockGetBalance, addCoins: vi.fn() })
  mockGetBalance.mockResolvedValue(42)
  vi.mocked(useGameStore).mockImplementation(makeStoreMock(42))
})

describe('MainPage — 코인 잔액 표시 (impl 07)', () => {
  // ── 정상 흐름 ──────────────────────────────────────
  it('TC-1 | 초기 렌더링 시 코인 잔액 영역에 `-` 표시 (isInitializing=true)', () => {
    vi.mocked(getUserId).mockReturnValue(new Promise(() => {}))

    render(<MainPage onStart={vi.fn()} onRanking={vi.fn()} />)

    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('TC-2 | 초기화 완료 후 coinBalance=42 → `🪙 42` 표시', async () => {
    render(<MainPage onStart={vi.fn()} onRanking={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('🪙 42')).toBeInTheDocument()
    })
  })

  it('TC-3 | coinBalance=0 초기화 완료 시 `-`가 아닌 `🪙 0` 표시', async () => {
    vi.mocked(useGameStore).mockImplementation(makeStoreMock(0))

    render(<MainPage onStart={vi.fn()} onRanking={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('🪙 0')).toBeInTheDocument()
    })
    expect(screen.queryByText('-')).not.toBeInTheDocument()
  })

  // ── 에러 처리 ──────────────────────────────────────
  it('TC-4 | 마운트 시 getBalance()가 getUserId() 이후 호출됨', async () => {
    let getUserIdResolved = false
    vi.mocked(getUserId).mockImplementation(async () => {
      getUserIdResolved = true
      return 'user-123'
    })
    mockGetBalance.mockImplementation(async () => {
      expect(getUserIdResolved).toBe(true)
      return 42
    })

    render(<MainPage onStart={vi.fn()} onRanking={vi.fn()} />)

    await waitFor(() => {
      expect(mockGetBalance).toHaveBeenCalledTimes(1)
    })
  })

  it('TC-5 | getUserId() 실패 시 토스트 메시지 표시', async () => {
    vi.mocked(getUserId).mockRejectedValue(new Error('network error'))

    render(<MainPage onStart={vi.fn()} onRanking={vi.fn()} />)

    await waitFor(() => {
      expect(
        screen.getByText('랭킹 연동 실패. 오프라인 모드로 진행됩니다')
      ).toBeInTheDocument()
    })
  })

  it('TC-6 | getUserId() 실패 후에도 isInitializing=false — START 버튼 복원', async () => {
    vi.mocked(getUserId).mockRejectedValue(new Error('fail'))

    render(<MainPage onStart={vi.fn()} onRanking={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('START')).toBeInTheDocument()
    })
  })
})
