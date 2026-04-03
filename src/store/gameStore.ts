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

  setUserId: (id: string) => void
  setTodayReward: (value: boolean) => void
  setSequence: (seq: ButtonColor[]) => void
  startGame: () => void
  addInput: (color: ButtonColor) => 'correct' | 'wrong' | 'round-clear'
  stageClear: (inputCompleteTime: number, flashDuration: number) => {
    isFullCombo: boolean
    multiplierIncreased: boolean
  }
  gameOver: (reason: GameOverReason) => void
  resetGame: () => void
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
    }),

  addInput: (color) => {
    const { sequence, currentIndex, score } = get()
    const expected = sequence[currentIndex]

    if (color !== expected) {
      return 'wrong'
    }

    const isLast = currentIndex === sequence.length - 1

    if (isLast) {
      set({ score: score + 1, currentIndex: currentIndex + 1 })
      return 'round-clear'
    }

    set({ score: score + 1, currentIndex: currentIndex + 1 })
    return 'correct'
  },

  stageClear: (inputCompleteTime, flashDuration) => {
    let result = { isFullCombo: false, multiplierIncreased: false }

    set((state) => {
      const clearedStage = state.sequence.length
      const computerShowTime = flashDuration * clearedStage
      const userInputTime = inputCompleteTime - state.sequenceStartTime
      const isFullCombo = userInputTime < computerShowTime

      const prevComboStreak = state.comboStreak
      const newComboStreak = isFullCombo ? prevComboStreak + 1 : 0  // 상한 없음

      const prevMultiplier = getComboMultiplier(prevComboStreak)
      const newMultiplier = getComboMultiplier(newComboStreak)
      const multiplierIncreased = newMultiplier > prevMultiplier

      // 점수 계산
      // addInput이 clearedStage번 호출되었으므로 state.score에 이번 스테이지 rawScore가 포함됨
      const prevAccumulated = state.score - clearedStage
      const bonus = calcClearBonus(clearedStage)
      const rawScore = clearedStage + bonus
      const stageScore = isFullCombo
        ? rawScore * getComboMultiplier(prevComboStreak)  // 풀콤보: 이전(클리어 직전) streak 기준 배율
        : rawScore
      const baseStageScore = calcBaseStageScore(clearedStage)

      const newFullComboCount = isFullCombo ? state.fullComboCount + 1 : state.fullComboCount
      const newMaxComboStreak = Math.max(state.maxComboStreak, newComboStreak)

      result = { isFullCombo, multiplierIncreased }

      return {
        score: prevAccumulated + stageScore,
        baseScore: state.baseScore + baseStageScore,
        comboStreak: newComboStreak,
        fullComboCount: newFullComboCount,
        maxComboStreak: newMaxComboStreak,
      }
    })

    return result
  },

  gameOver: (reason) =>
    set((state) => ({
      status: 'RESULT',
      stage: state.sequence.length,
      gameOverReason: reason,
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
    }),
}))
