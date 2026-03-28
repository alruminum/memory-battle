import { create } from 'zustand'
import type { GameStatus, ButtonColor, Difficulty } from '../types'

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = { EASY: 1, MEDIUM: 2, HARD: 3 }

const calcFinalScore = (raw: number, difficulty: Difficulty) =>
  raw * DIFFICULTY_MULTIPLIER[difficulty]

interface GameStore {
  status: GameStatus
  sequence: ButtonColor[]
  currentIndex: number
  score: number
  stage: number
  isFullCombo: boolean
  difficulty: Difficulty

  userId: string
  dailyChancesLeft: number

  setUserId: (id: string) => void
  setDailyChancesLeft: (n: number) => void
  setSequence: (seq: ButtonColor[]) => void
  startGame: (difficulty: Difficulty) => void
  addInput: (color: ButtonColor) => 'correct' | 'wrong' | 'round-clear'
  gameOver: (isFullCombo: boolean) => void
  resetGame: () => void
  useChance: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  status: 'IDLE',
  sequence: [],
  currentIndex: 0,
  score: 0,
  stage: 0,
  isFullCombo: false,
  difficulty: 'EASY',

  userId: '',
  dailyChancesLeft: 1,

  setUserId: (id) => set({ userId: id }),
  setDailyChancesLeft: (n) => set({ dailyChancesLeft: n }),
  setSequence: (seq) => set({ sequence: seq }),

  startGame: (difficulty) =>
    set((state) => ({
      status: 'SHOWING',
      difficulty,
      sequence: [],
      currentIndex: 0,
      score: 0,
      stage: 0,
      isFullCombo: false,
      dailyChancesLeft: Math.max(0, state.dailyChancesLeft - 1),
    })),

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

  gameOver: (isFullCombo) =>
    set((state) => ({
      status: 'RESULT',
      isFullCombo,
      score: calcFinalScore(state.score, state.difficulty),
      stage: state.sequence.length,
    })),

  resetGame: () =>
    set({
      status: 'IDLE',
      sequence: [],
      currentIndex: 0,
      score: 0,
      stage: 0,
      isFullCombo: false,
    }),

  useChance: () =>
    set((state) => ({
      dailyChancesLeft: Math.min(4, state.dailyChancesLeft + 1),
    })),
}))
