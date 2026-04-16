/**
 * useCoin 훅 테스트 (impl 01-usecoin-infra)
 * 대상: src/hooks/useCoin.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCoin } from './useCoin'
import { useGameStore } from '../store/gameStore'

// ── supabase mock (vi.hoisted — 호이스팅 안전) ───────────────────────────────

const { mockMaybeSingle, mockRpc } = vi.hoisted(() => ({
  mockMaybeSingle: vi.fn(),
  mockRpc: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (_table: string) => ({
      select: (_col: string) => ({
        eq: (_col: string, _val: string) => ({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    }),
    rpc: mockRpc,
  },
}))

// ── 헬퍼 ────────────────────────────────────────────────────────────────────

function getHook() {
  const { result } = renderHook(() => useCoin())
  return result
}

// ── beforeEach ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  useGameStore.setState({ userId: 'user-001', coinBalance: 0 })
})

// ── getBalance ───────────────────────────────────────────────────────────────

describe('getBalance()', () => {
  it('정상 흐름: Supabase 잔액 반환 및 setCoinBalance 호출', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { balance: 100 }, error: null })

    const hook = getHook()
    let balance!: number
    await act(async () => {
      balance = await hook.current.getBalance()
    })

    expect(balance).toBe(100)
    expect(useGameStore.getState().coinBalance).toBe(100)
  })

  it('엣지 케이스: userId 가 빈 문자열이면 0 반환 (Supabase 호출 없음)', async () => {
    useGameStore.setState({ userId: '' })

    const hook = getHook()
    let balance!: number
    await act(async () => {
      balance = await hook.current.getBalance()
    })

    expect(balance).toBe(0)
    expect(mockMaybeSingle).not.toHaveBeenCalled()
  })

  it('엣지 케이스: 신규 유저 — data=null 일 때 0 반환', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const hook = getHook()
    let balance!: number
    await act(async () => {
      balance = await hook.current.getBalance()
    })

    expect(balance).toBe(0)
    expect(useGameStore.getState().coinBalance).toBe(0)
  })

  it('에러 처리: Supabase 오류 시 0 반환', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const hook = getHook()
    let balance!: number
    await act(async () => {
      balance = await hook.current.getBalance()
    })

    expect(balance).toBe(0)
    expect(consoleSpy).toHaveBeenCalledWith(
      '[useCoin] getBalance error:',
      expect.objectContaining({ message: 'DB error' })
    )
    consoleSpy.mockRestore()
  })
})

// ── addCoins ─────────────────────────────────────────────────────────────────

describe('addCoins(amount, type)', () => {
  it('정상 흐름: RPC 성공 시 새 잔액 반환 + setCoinBalance 호출', async () => {
    mockRpc.mockResolvedValue({ data: 150, error: null })

    const hook = getHook()
    let newBalance!: number
    await act(async () => {
      newBalance = await hook.current.addCoins(50, 'ad_reward')
    })

    expect(newBalance).toBe(150)
    expect(useGameStore.getState().coinBalance).toBe(150)
    expect(mockRpc).toHaveBeenCalledWith('add_coins', {
      p_user_id: 'user-001',
      p_amount: 50,
      p_type: 'ad_reward',
    })
  })

  it('엣지 케이스: userId 가 빈 문자열이면 0 반환 (RPC 호출 없음)', async () => {
    useGameStore.setState({ userId: '' })

    const hook = getHook()
    let newBalance!: number
    await act(async () => {
      newBalance = await hook.current.addCoins(10, 'record_bonus')
    })

    expect(newBalance).toBe(0)
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('에러 처리: RPC 오류 시 throw error (SPEC_GAP #109 해결)', async () => {
    const rpcError = { message: 'RPC error' }
    mockRpc.mockResolvedValue({ data: null, error: rpcError })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const hook = getHook()
    let caughtError: unknown
    await act(async () => {
      try {
        await hook.current.addCoins(-5, 'revival')
      } catch (e) {
        caughtError = e
      }
    })

    expect(caughtError).toEqual(rpcError)
    expect(mockMaybeSingle).not.toHaveBeenCalled()  // getBalance 재조회 없음
    expect(consoleSpy).toHaveBeenCalledWith(
      '[useCoin] addCoins error:',
      expect.objectContaining({ message: 'RPC error' })
    )
    consoleSpy.mockRestore()
  })

  it('엣지 케이스: RPC data=0 일 때 0 반환 (잔액 0 허용)', async () => {
    mockRpc.mockResolvedValue({ data: 0, error: null })

    const hook = getHook()
    let newBalance!: number
    await act(async () => {
      newBalance = await hook.current.addCoins(-999, 'revival')
    })

    expect(newBalance).toBe(0)
    expect(useGameStore.getState().coinBalance).toBe(0)
  })
})
