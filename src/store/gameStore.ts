import { create } from 'zustand'
import type { GameStatus, ButtonColor } from '../types'
import { calcStageScore } from '../lib/gameLogic'

interface GameStore {
  status: GameStatus
  sequence: ButtonColor[]
  currentIndex: number
  score: number
  stage: number
  comboStreak: number
  fullComboCount: number
  maxComboStreak: number

  userId: string
  hasTodayReward: boolean

  setUserId: (id: string) => void
  setTodayReward: (value: boolean) => void
  setSequence: (seq: ButtonColor[]) => void
  startGame: () => void
  addInput: (color: ButtonColor) => 'correct' | 'wrong' | 'round-clear'
  stageClear: (isFullCombo: boolean) => void
  gameOver: () => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  status: 'IDLE',
  sequence: [],
  currentIndex: 0,
  score: 0,
  stage: 0,
  comboStreak: 0,
  fullComboCount: 0,
  maxComboStreak: 0,

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
      stage: 0,
      comboStreak: 0,
      fullComboCount: 0,
      maxComboStreak: 0,
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

  stageClear: (isFullCombo) => {
    set((state) => {
      const clearedStage = state.sequence.length
      // state.score에는 이번 스테이지 버튼 입력분(+1씩)이 이미 포함됨
      // 이번 스테이지 버튼 점수 = clearedStage (시퀀스 길이만큼 입력 성공)
      const prevAccumulated = state.score - clearedStage
      const stageScore = calcStageScore(
        clearedStage,
        state.comboStreak,
        clearedStage,
        isFullCombo
      )

      const newComboStreak = isFullCombo
        ? Math.min(state.comboStreak + 1, 4)
        : 0
      const newFullComboCount = isFullCombo
        ? state.fullComboCount + 1
        : state.fullComboCount
      const newMaxComboStreak = Math.max(state.maxComboStreak, newComboStreak)

      return {
        score: prevAccumulated + stageScore,
        comboStreak: newComboStreak,
        fullComboCount: newFullComboCount,
        maxComboStreak: newMaxComboStreak,
      }
    })
  },

  gameOver: () =>
    set((state) => ({
      status: 'RESULT',
      stage: state.sequence.length,
    })),

  resetGame: () =>
    set({
      status: 'IDLE',
      sequence: [],
      currentIndex: 0,
      score: 0,
      stage: 0,
      comboStreak: 0,
      fullComboCount: 0,
      maxComboStreak: 0,
    }),
}))
