import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { grantDailyReward as grantDailyRewardAit } from '../lib/ait'
import { useGameStore } from '../store/gameStore'

// KST 기준 오늘 날짜 YYYY-MM-DD
const todayKST = (): string => {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

export function useDailyReward() {
  const userId = useGameStore((s) => s.userId)
  const setTodayReward = useGameStore((s) => s.setTodayReward)

  // 마운트 시 오늘 리워드 수령 여부 조회
  useEffect(() => {
    if (!userId) return

    supabase
      .from('daily_reward')
      .select('user_id')
      .eq('user_id', userId)
      .eq('reward_date', todayKST())
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          // SELECT 실패 — 안전 방향: hasTodayReward = false 유지 (지급 시도 허용)
          console.warn('[useDailyReward] SELECT error:', error.message)
          return
        }
        setTodayReward(!!data)
      })
  }, [userId, setTodayReward])

  // daily_reward INSERT (PK 중복 시 에러 무시)
  async function markTodayRewarded(): Promise<void> {
    if (!userId) return

    const { error } = await supabase
      .from('daily_reward')
      .insert({ user_id: userId, reward_date: todayKST() })

    if (error) {
      if (error.code === '23505') {
        // unique_violation: 중복 삽입 = 이미 오늘 수령함
        setTodayReward(true)
      } else {
        console.warn('[useDailyReward] INSERT error:', error.message)
      }
    } else {
      setTodayReward(true)
    }
  }

  // 포인트 지급 후 DB 기록
  // grantPromotionReward 실패 시 throw 전파 → 호출자(ResultPage)에서 catch
  async function grantDailyReward(): Promise<void> {
    await grantDailyRewardAit()
    await markTodayRewarded()
  }

  const hasTodayReward = useGameStore((s) => s.hasTodayReward)

  return { hasTodayReward, markTodayRewarded, grantDailyReward }
}
