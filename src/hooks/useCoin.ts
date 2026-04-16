import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'
import type { CoinTxType } from '../types'

interface UseCoinReturn {
  getBalance: () => Promise<number>
  addCoins: (amount: number, type: CoinTxType) => Promise<number>
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
      // 오류 시 getBalance로 정확한 잔액 재조회
      return await getBalance()
    }

    const newBalance = (data as number) ?? 0
    setCoinBalance(newBalance)
    return newBalance
  }

  return { getBalance, addCoins }
}
