export type GameStatus = 'IDLE' | 'SHOWING' | 'INPUT' | 'RESULT'
export type ButtonColor = 'orange' | 'blue' | 'green' | 'yellow'

// DB 편의 타입 re-export
export type { Database } from './database.types'
export type { ScoreRow, ScoreInsert } from './database.types'

// [v0.4] 코인 트랜잭션 타입
export type CoinTxType = 'ad_reward' | 'record_bonus' | 'revival'

// [v0.4] 코인 테이블 타입 re-export
export type { UserCoinsRow, CoinTransactionRow } from './database.types'
