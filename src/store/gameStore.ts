import { create } from 'zustand'
import type { GameStatus, ButtonColor } from '../types'
import { getComboMultiplier, calcClearBonus, calcBaseStageScore } from '../lib/gameLogic'

export type GameOverReason = 'timeout' | 'wrong' | null

interface GameStore {
  status: GameStatus
  sequence: ButtonColor[]
  currentIndex: number
  score: number
  baseScore: number
  stage: number
  comboStreak: number
  fullComboCount: number
  maxComboStreak: number
  sequenceStartTime: number  // INPUT 페이즈 시작 시각 (ms). 0 = 미설정
  gameOverReason: GameOverReason

  userId: string
  hasTodayReward: boolean

  // [v0.4] 코인
  coinBalance: number    // Supabase user_coins.balance 미러 (앱 진입·이벤트마다 갱신)
  revivalUsed: boolean   // 이 판 부활 사용 여부 (startGame/resetGame 시 false 초기화)

  setUserId: (id: string) => void
  setTodayReward: (value: boolean) => void
  setSequence: (seq: ButtonColor[]) => void
  startGame: () => void
  addInput: (color: ButtonColor) => 'correct' | 'wrong' | 'round-clear'
  stageClear: (inputCompleteTime: number, flashDuration: number) => {
    isFullCombo: boolean
    multiplierIncreased: boolean
  }
  breakCombo: () => void
  gameOver: (reason: GameOverReason) => void
  resetGame: () => void

  // [v0.4] 코인 액션
  setCoinBalance: (balance: number) => void  // useCoin에서 잔액 동기화
  revive: () => void   // RESULT→SHOWING 전환 (코인 차감은 호출자 책임, sequence 유지 — 실패 스테이지 시퀀스 재점등)
}

export const useGameStore = create<GameStore>((set, get) => ({
  status: 'IDLE',
  sequence: [],
  currentIndex: 0,
  score: 0,
  baseScore: 0,
  stage: 0,
  comboStreak: 0,
  fullComboCount: 0,
  maxComboStreak: 0,
  sequenceStartTime: 0,
  gameOverReason: null,

  userId: '',
  hasTodayReward: false,
  coinBalance: 0,
  revivalUsed: false,

  setUserId: (id) => set({ userId: id }),
  setTodayReward: (value) => set({ hasTodayReward: value }),
  setSequence: (seq) => set({ sequence: seq }),

  startGame: () =>
    set({
      status: 'SHOWING',
      sequence: [],
      currentIndex: 0,
      score: 0,
      baseScore: 0,
      stage: 0,
      comboStreak: 0,
      fullComboCount: 0,
      maxComboStreak: 0,
      sequenceStartTime: 0,
      gameOverReason: null,
      revivalUsed: false,
      // coinBalance는 초기화하지 않는다 (앱 진입 시 getBalance가 세팅, 게임 시작마다 리셋 불필요)
    }),

  addInput: (color) => {
    const { sequence, currentIndex, score, comboStreak } = get()
    const expected = sequence[currentIndex]

    if (color !== expected) {
      return 'wrong'
    }

    const multiplier = getComboMultiplier(comboStreak)
    const isLast = currentIndex === sequence.length - 1

    // 버튼마다 배율 포함 점수 즉시 누적
    // baseScore는 stageClear에서만 일괄 갱신 — addInput에서 변경하지 않음
    set({ score: score + multiplier, currentIndex: currentIndex + 1 })

    return isLast ? 'round-clear' : 'correct'
  },

  stageClear: (inputCompleteTime, flashDuration) => {
    let result = { isFullCombo: false, multiplierIncreased: false }

    set((state) => {
      const clearedStage = state.sequence.length
      const computerShowTime = flashDuration * clearedStage
      const userInputTime = inputCompleteTime - state.sequenceStartTime
      const isFullCombo = userInputTime < computerShowTime  // 스트릭 판정용 (점수 무관)

      const prevComboStreak = state.comboStreak
      // 배율 유지: 실패 시 스택만 초기화, 배율 하한(floor(prev/5)*5)으로 리셋
      // floor(4/5)*5=0(x1 유지), floor(8/5)*5=5(x2 유지), floor(13/5)*5=10(x3 유지)
      const prevMultiplierBase = Math.floor(prevComboStreak / 5) * 5
      const newComboStreak = isFullCombo ? prevComboStreak + 1 : prevMultiplierBase

      const prevMultiplier = getComboMultiplier(prevComboStreak)
      const newMultiplier = getComboMultiplier(newComboStreak)
      const multiplierIncreased = newMultiplier > prevMultiplier

      // 클리어 보너스만 배율 적용해서 추가
      // (버튼 점수는 addInput에서 이미 배율 포함 누적됨)
      const bonus = calcClearBonus(clearedStage)
      const bonusScore = bonus * getComboMultiplier(prevComboStreak)  // 클리어 직전 배율 기준

      const baseStageScore = calcBaseStageScore(clearedStage)

      const newFullComboCount = isFullCombo ? state.fullComboCount + 1 : state.fullComboCount
      const newMaxComboStreak = Math.max(state.maxComboStreak, newComboStreak)

      result = { isFullCombo, multiplierIncreased }

      return {
        score: state.score + bonusScore,
        baseScore: state.baseScore + baseStageScore,
        comboStreak: newComboStreak,
        fullComboCount: newFullComboCount,
        maxComboStreak: newMaxComboStreak,
      }
    })

    return result
  },

  breakCombo: () =>
    set((state) => {
      if (state.status !== 'INPUT') return {}
      const prevMultiplierBase = Math.floor(state.comboStreak / 5) * 5
      if (state.comboStreak === prevMultiplierBase) return {}  // 이미 floor값이면 변화 없음
      return { comboStreak: prevMultiplierBase }
    }),

  gameOver: (reason) =>
    set((state) => ({
      status: 'RESULT',
      stage: state.sequence.length,
      gameOverReason: reason,
      // 부분 라운드 베이스 점수 보정: addInput에서 누적된 score와 stageClear에서만
      // 갱신되는 baseScore 간 불일치 해소. currentIndex = 현재 라운드에서 맞춘 버튼 수.
      // 버튼 1개 베이스 = 1점, clearBonus는 라운드 미완료이므로 추가하지 않음.
      baseScore: state.baseScore + state.currentIndex,
    })),

  resetGame: () =>
    set({
      status: 'IDLE',
      sequence: [],
      currentIndex: 0,
      score: 0,
      baseScore: 0,
      stage: 0,
      comboStreak: 0,
      fullComboCount: 0,
      maxComboStreak: 0,
      sequenceStartTime: 0,
      gameOverReason: null,
      revivalUsed: false,
    }),

  // [v0.4] 코인 액션
  setCoinBalance: (balance) => set({ coinBalance: balance }),

  // RESULT → SHOWING 전환
  // ⚠️ 코인 차감(addCoins(-5,'revival'))은 호출 전 이미 완료되어야 한다
  revive: () =>
    set((state) => {
      // 가드: RESULT 상태가 아니거나 이미 부활 사용 시 무시
      if (state.status !== 'RESULT') return {}
      if (state.revivalUsed) return {}
      return {
        status: 'SHOWING',
        // sequence 유지 — 실패한 스테이지의 시퀀스를 SHOWING에서 다시 점등
        currentIndex: 0,
        revivalUsed: true,
        // score, stage, comboStreak, fullComboCount, maxComboStreak 유지
      }
    }),
}))
