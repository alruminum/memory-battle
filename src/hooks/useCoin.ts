import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'
import type { CoinTxType } from '../types'

interface UseCoinReturn {
  getBalance: () => Promise<number>
  addCoins: (amount: number, type: CoinTxType) => Promise<number>
  getLifetimeExchanged: () => Promise<number>  // [v0.4.2 F5] 누적 교환 포인트 조회
}

export function useCoin(): UseCoinReturn {
  const setCoinBalance = useGameStore((s) => s.setCoinBalance)

  // Supabase SELECT user_coins WHERE user_id = ...
  const getBalance = async (): Promise<number> => {
    const userId = useGameStore.getState().userId
    if (!userId) return 0

    const { data, error } = await supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle()   // 첫 플레이어는 row 없음 → null 처리

    if (error) {
      console.error('[useCoin] getBalance error:', error)
      return 0
    }

    const balance = data?.balance ?? 0
    setCoinBalance(balance)
    return balance
  }

  // Supabase RPC add_coins (원자 증감)
  const addCoins = async (amount: number, type: CoinTxType): Promise<number> => {
    const userId = useGameStore.getState().userId
    if (!userId) return 0

    const { data, error } = await supabase.rpc('add_coins', {
      p_user_id: userId,
      p_amount: amount,   // ⚠️ p_delta 아님 — p_amount 사용
      p_type: type,
    })

    if (error) {
      console.error('[useCoin] addCoins error:', error)
      throw error  // PostgrestError를 그대로 throw → 호출자 catch 블록 도달
    }

    const newBalance = (data as number) ?? 0
    setCoinBalance(newBalance)
    return newBalance
  }

  // [v0.4.2 F5] coin_transactions SUM으로 누적 교환 포인트 조회
  const getLifetimeExchanged = async (): Promise<number> => {
    const userId = useGameStore.getState().userId
    if (!userId) return 0

    const { data, error } = await supabase.rpc('get_lifetime_exchanged', {
      p_user_id: userId,
    })

    if (error) {
      console.error('[useCoin] getLifetimeExchanged error:', error)
      return 0  // 오류 시 0 반환 — 교환 버튼 활성 유지 (보수적 처리)
    }

    const total = (data as number) ?? 0
    useGameStore.getState().setLifetimeExchanged(total)
    return total
  }

  return { getBalance, addCoins, getLifetimeExchanged }
}
