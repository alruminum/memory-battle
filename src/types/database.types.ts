export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      scores: {
        Row: {
          id: string
          user_id: string
          score: number
          stage: number
          played_at: string
        }
        Insert: {
          id?: string
          user_id: string
          score: number
          stage: number
          played_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          score?: number
          stage?: number
          played_at?: string
        }
        Relationships: []
      }
      daily_chances: {
        Row: {
          user_id: string
          used_count: number
          last_date: string
        }
        Insert: {
          user_id: string
          used_count?: number
          last_date?: string
        }
        Update: {
          user_id?: string
          used_count?: number
          last_date?: string
        }
        Relationships: []
      }
      daily_reward: {
        Row: {
          user_id: string
          reward_date: string
        }
        Insert: {
          user_id: string
          reward_date: string
        }
        Update: {
          user_id?: string
          reward_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ranking_daily: {
        Args: Record<PropertyKey, never>
        Returns: { user_id: string; best_score: number }[]
      }
      ranking_monthly: {
        Args: Record<PropertyKey, never>
        Returns: { user_id: string; best_score: number }[]
      }
      ranking_season: {
        Args: { season_start: string }
        Returns: { user_id: string; best_score: number }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// 편의 타입 별칭 — 자주 쓰는 테이블 Row/Insert 타입
export type ScoreRow = Database['public']['Tables']['scores']['Row']
export type ScoreInsert = Database['public']['Tables']['scores']['Insert']
export type DailyChancesRow = Database['public']['Tables']['daily_chances']['Row']
export type DailyChancesInsert = Database['public']['Tables']['daily_chances']['Insert']
export type DailyRewardRow = Database['public']['Tables']['daily_reward']['Row']
export type DailyRewardInsert = Database['public']['Tables']['daily_reward']['Insert']
