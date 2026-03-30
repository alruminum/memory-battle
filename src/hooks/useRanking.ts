import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { submitScore as submitToGameCenter } from '../lib/ait'
import type { Difficulty } from '../types'

interface RankEntry {
  user_id: string
  best_score: number
  rank: number
}

interface UseRankingReturn {
  daily: RankEntry[]
  monthly: RankEntry[]
  season: RankEntry[]
  myRanks: { daily: number; monthly: number; season: number }
  isLoading: boolean
  submitScore: (score: number, stage: number, difficulty: Difficulty, userId: string) => Promise<void>
  refetch: () => void
}

const SEASON_START = '2025-01-01'

function addRanks(rows: { user_id: string; best_score: number }[]): RankEntry[] {
  return rows.map((row, idx) => ({ ...row, rank: idx + 1 }))
}

function findMyRank(entries: RankEntry[], userId: string): number {
  const found = entries.find((e) => e.user_id === userId)
  return found?.rank ?? 0
}

export function useRanking(userId: string | null): UseRankingReturn {
  const [daily, setDaily] = useState<RankEntry[]>([])
  const [monthly, setMonthly] = useState<RankEntry[]>([])
  const [season, setSeason] = useState<RankEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [dailyRes, monthlyRes, seasonRes] = await Promise.all([
        supabase.rpc('ranking_daily'),
        supabase.rpc('ranking_monthly'),
        supabase.rpc('ranking_season', { season_start: SEASON_START }),
      ])

      setDaily(addRanks((dailyRes.data ?? []) as { user_id: string; best_score: number }[]))
      setMonthly(addRanks((monthlyRes.data ?? []) as { user_id: string; best_score: number }[]))
      setSeason(addRanks((seasonRes.data ?? []) as { user_id: string; best_score: number }[]))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const submitScore = useCallback(
    async (score: number, stage: number, difficulty: Difficulty, uid: string) => {
      await supabase.from('scores').insert({
        user_id: uid,
        score,
        stage,
        difficulty,
      })
      await submitToGameCenter(score)
      await fetchAll()
    },
    [fetchAll]
  )

  const myRanks = {
    daily: userId ? findMyRank(daily, userId) : 0,
    monthly: userId ? findMyRank(monthly, userId) : 0,
    season: userId ? findMyRank(season, userId) : 0,
  }

  return {
    daily,
    monthly,
    season,
    myRanks,
    isLoading,
    submitScore,
    refetch: fetchAll,
  }
}
