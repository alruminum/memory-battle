import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameEngine } from '../hooks/useGameEngine'
import { useGameStore } from '../store/gameStore'

// ── F-4. handleInput 반환값 검증 (#78) ────────────────────────────────────
// 근거: impl/10-floating-score.md — useGameEngine.handleInput 반환 타입
//   void → 'correct' | 'wrong' | 'round-clear' 변경
// GamePage의 handleInputWithFloat에서 반환값으로 spawnFloatingScore 분기

vi.mock('../lib/sound', () => ({
  playTone: vi.fn(),
  playGameStart: vi.fn(),
  playGameOver: vi.fn(),
  playApplause: vi.fn(),
  suspendAudio: vi.fn(),
  resumeAudio: vi.fn(),
}))

vi.mock('../hooks/useTimer', () => ({
  useTimer: (_onExpire: () => void, _duration?: number) => {
    ;(globalThis as Record<string, unknown>).__testTimerExpire2 = _onExpire
    return { timeLeft: 2000, reset: vi.fn(), stop: vi.fn() }
  },
}))

beforeEach(() => {
  vi.useFakeTimers()
  useGameStore.getState().resetGame()
})

afterEach(() => {
  vi.useRealTimers()
})

/**
 * 헬퍼: 카운트다운 + 첫 SHOWING 완료 후 INPUT 상태로 진입
 * COUNTDOWN_INTERVAL = 750ms × 3 + SHOWING 1000ms
 */
function setupToInput(result: { current: ReturnType<typeof useGameEngine> }) {
  act(() => { result.current.startGame() })
  act(() => { vi.advanceTimersByTime(2250) }) // 카운트다운 완료
  act(() => { vi.advanceTimersByTime(1000) }) // SHOWING → INPUT
  return useGameStore.getState().sequence[0]
}

/**
 * 헬퍼: 2스테이지 INPUT 상태로 진입
 */
function setupToInput2(result: { current: ReturnType<typeof useGameEngine> }) {
  const firstBtn = setupToInput(result)
  act(() => { result.current.handleInput(firstBtn) })
  act(() => { vi.advanceTimersByTime(1100) }) // CLEAR_PAUSE_MS
  act(() => { vi.advanceTimersByTime(1500) }) // 2개 시퀀스 SHOWING 완료
  return useGameStore.getState().sequence
}

describe('F-4. handleInput 반환값 검증', () => {
  it('F-4-1: 오답 입력 → "wrong" 반환', () => {
    const { result } = renderHook(() => useGameEngine())
    const firstBtn = setupToInput(result)
    const wrongBtn = firstBtn === 'orange' ? 'blue' : 'orange'

    let returnValue: string | undefined
    act(() => {
      returnValue = result.current.handleInput(
        wrongBtn as Parameters<typeof result.current.handleInput>[0]
      )
    })

    expect(returnValue).toBe('wrong')
  })

  it('F-4-2: 마지막 정답 입력 → "round-clear" 반환', () => {
    const { result } = renderHook(() => useGameEngine())
    const firstBtn = setupToInput(result)

    let returnValue: string | undefined
    act(() => {
      returnValue = result.current.handleInput(firstBtn)
    })

    expect(returnValue).toBe('round-clear')
  })

  it('F-4-3: 중간 정답 입력 (2스테이지 첫 버튼) → "correct" 반환', () => {
    const { result } = renderHook(() => useGameEngine())
    const seq = setupToInput2(result)

    let returnValue: string | undefined
    act(() => {
      returnValue = result.current.handleInput(seq[0])
    })

    // 2개 시퀀스 중 첫 번째 정답 → correct (round-clear 아님)
    expect(useGameStore.getState().status).toBe('INPUT')
    expect(returnValue).toBe('correct')
  })

  it('F-4-4: INPUT 상태 아닐 때 handleInput → "wrong" 반환 (블록)', () => {
    const { result } = renderHook(() => useGameEngine())
    act(() => { result.current.startGame() })
    act(() => { vi.advanceTimersByTime(2250) }) // SHOWING 진입

    // SHOWING 상태에서 입력 → 블록됨 → wrong 반환
    let returnValue: string | undefined
    act(() => {
      returnValue = result.current.handleInput('orange')
    })

    expect(returnValue).toBe('wrong')
    expect(useGameStore.getState().status).toBe('SHOWING')
  })
})
