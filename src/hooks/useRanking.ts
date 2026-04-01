import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { submitScore as submitToGameCenter } from '../lib/ait'
import type { ScoreInsert } from '../types/database.types'

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
  error: boolean
  submitScore: (score: number, stage: number, userId: string) => Promise<void>
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
  const [error, setError] = useState(false)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(false)
    try {
      const [dailyResult, monthlyResult, seasonResult] = await Promise.all([
        supabase.rpc('ranking_daily'),
        supabase.rpc('ranking_monthly'),
        supabase.rpc('ranking_season', { season_start: SEASON_START }),
      ])

      if (dailyResult.error || monthlyResult.error || seasonResult.error) {
        setError(true)
      } else {
        setDaily(addRanks((dailyResult.data ?? []) as { user_id: string; best_score: number }[]))
        setMonthly(addRanks((monthlyResult.data ?? []) as { user_id: string; best_score: number }[]))
        setSeason(addRanks((seasonResult.data ?? []) as { user_id: string; best_score: number }[]))
      }
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const submitScore = useCallback(
    async (score: number, stage: number, uid: string) => {
      const payload: ScoreInsert = {
        user_id: uid,
        score,
        stage,
      }
      await supabase.from('scores').insert(payload)
      await submitToGameCenter(score)
      await fetchAll()
    },
    [fetchAll]
  )

  // 마운트 시 자동 fetchAll — isNewBest 레이스 컨디션 방지
  useEffect(() => {
    if (userId) fetchAll()
  }, [userId, fetchAll])

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
    error,
    submitScore,
    refetch: fetchAll,
  }
}
