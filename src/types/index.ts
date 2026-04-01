export type GameStatus = 'IDLE' | 'SHOWING' | 'INPUT' | 'RESULT'
export type ButtonColor = 'orange' | 'blue' | 'green' | 'yellow'

// DB 편의 타입 re-export
export type { Database } from './database.types'
export type { ScoreRow, ScoreInsert, DailyRewardRow, DailyRewardInsert } from './database.types'
