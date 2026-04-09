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
