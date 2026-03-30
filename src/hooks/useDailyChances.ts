import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

const today = () => new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
const MAX_AD_CHANCES = 3  // 광고로 추가 가능한 최대 횟수

export function useDailyChances() {
  const { setDailyChancesLeft, useChance } = useGameStore()

  // MainPage 진입 시 호출 — DB에서 오늘 획득한 광고 기회 수 로드
  // dailyChancesLeft = 1(기본) + used_count(오늘 획득한 광고 기회)
  async function init(userId: string) {
    const { data } = await supabase
      .from('daily_chances')
      .select('used_count, last_date')
      .eq('user_id', userId)
      .single()

    if (!data) {
      await supabase.from('daily_chances').insert({
        user_id: userId,
        used_count: 0,
        last_date: today(),
      })
      setDailyChancesLeft(1)
      return
    }

    if (data.last_date !== today()) {
      await supabase
        .from('daily_chances')
        .update({ used_count: 0, last_date: today() })
        .eq('user_id', userId)
      setDailyChancesLeft(1)
      return
    }

    // 기본 1회 + 오늘 획득한 광고 기회
    setDailyChancesLeft(1 + data.used_count)
  }

  // 게임 시작 시 호출 — store만 감소 (플레이 횟수는 MVP에서 세션 내 관리)
  // false 반환 시 게임 시작 차단
  function consumeChance(): boolean {
    const chancesLeft = useGameStore.getState().dailyChancesLeft
    if (chancesLeft <= 0) return false
    useGameStore.setState((s) => ({ dailyChancesLeft: Math.max(0, s.dailyChancesLeft - 1) }))
    return true
  }

  // 리워드 광고 완료 후 호출 — DB used_count++, store dailyChancesLeft++
  async function addChance(userId: string) {
    const { data } = await supabase
      .from('daily_chances')
      .select('used_count')
      .eq('user_id', userId)
      .single()

    if (!data || data.used_count >= MAX_AD_CHANCES) return

    await supabase
      .from('daily_chances')
      .update({ used_count: data.used_count + 1 })
      .eq('user_id', userId)

    useChance()
  }

  return { init, consumeChance, addChance }
}
