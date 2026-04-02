import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameEngine } from './useGameEngine'
import { useGameStore } from '../store/gameStore'

vi.mock('../lib/sound', () => ({
  playTone: vi.fn(),
  playGameStart: vi.fn(),
  playGameOver: vi.fn(),
  playApplause: vi.fn(),
  suspendAudio: vi.fn(),
  resumeAudio: vi.fn(),
}))

beforeEach(() => {
  vi.useFakeTimers()
  useGameStore.getState().resetGame()
})

afterEach(() => {
  vi.useRealTimers()
})

// COUNTDOWN_INTERVAL = 500ms, 3 ticks = 1500ms total before game starts

// ── C-1. IDLE → SHOWING → INPUT 전환 ─────────────────────────────────────

describe('C-1. IDLE → SHOWING → INPUT 전환', () => {
  it('C-1-1: startGame 호출 후 카운트다운 완료 → status SHOWING', async () => {
    const { result } = renderHook(() => useGameEngine())

    act(() => {
      result.current.startGame()
    })

    // 카운트다운 3 tick(각 500ms) 완료 → 게임 시작
    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(useGameStore.getState().status).toBe('SHOWING')
  })

  it('C-1-2: SHOWING 완료 후 타이머 진행 → status INPUT', async () => {
    const { result } = renderHook(() => useGameEngine())

    act(() => {
      result.current.startGame()
    })

    // 카운트다운 완료 → SHOWING
    act(() => {
      vi.advanceTimersByTime(1500)
    })

    // sequence.length=1, flashDuration=500ms
    // 점등: flash*0.8=400ms, 소등 후 flash*0.2=100ms → 총 500ms per button
    // 1개 버튼 → 500ms 후 INPUT 전환
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(useGameStore.getState().status).toBe('INPUT')
  })

  it('C-1-3: INPUT 전환 시 sequenceStartTime > 0', async () => {
    const { result } = renderHook(() => useGameEngine())

    act(() => {
      result.current.startGame()
    })

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(useGameStore.getState().sequenceStartTime).toBeGreaterThan(0)
  })
})

// ── C-2. INPUT → ROUND-CLEAR → SHOWING ───────────────────────────────────

describe('C-2. INPUT → ROUND-CLEAR → SHOWING', () => {
  /**
   * 헬퍼: 카운트다운 + 첫 SHOWING 완료 후 INPUT 상태로 진입시킨다.
   * 이후 store의 sequence를 확인해 첫 버튼을 반환한다.
   */
  function setupToInput(result: { current: ReturnType<typeof useGameEngine> }) {
    act(() => {
      result.current.startGame()
    })
    act(() => {
      vi.advanceTimersByTime(1500) // 카운트다운 완료
    })
    act(() => {
      vi.advanceTimersByTime(1000) // SHOWING 완료 → INPUT
    })
    return useGameStore.getState().sequence[0]
  }

  it('C-2-1: 정답 완료 → clearingStage !== null', () => {
    const { result } = renderHook(() => useGameEngine())
    const firstBtn = setupToInput(result)

    act(() => {
      result.current.handleInput(firstBtn)
    })

    expect(result.current.clearingStage).not.toBeNull()
  })

  it('C-2-2: 클리어 후 타임아웃 → status SHOWING', () => {
    const { result } = renderHook(() => useGameEngine())
    const firstBtn = setupToInput(result)

    act(() => {
      result.current.handleInput(firstBtn)
    })

    // CLEAR_PAUSE_MS = 1100ms 후 다음 SHOWING 시작
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    expect(useGameStore.getState().status).toBe('SHOWING')
  })

  it('C-2-3: 다음 시퀀스 길이 = 이전+1 (1→2)', () => {
    const { result } = renderHook(() => useGameEngine())
    const firstBtn = setupToInput(result)

    act(() => {
      result.current.handleInput(firstBtn)
    })

    act(() => {
      vi.advanceTimersByTime(1100)
    })

    expect(useGameStore.getState().sequence.length).toBe(2)
  })

  it('C-2-4: 클리어 타임아웃 후 clearingStage null 리셋', () => {
    const { result } = renderHook(() => useGameEngine())
    const firstBtn = setupToInput(result)

    act(() => {
      result.current.handleInput(firstBtn)
    })

    act(() => {
      vi.advanceTimersByTime(1100)
    })

    expect(result.current.clearingStage).toBeNull()
  })
})

// ── C-3. INPUT → RESULT (오답) ────────────────────────────────────────────

describe('C-3. INPUT → RESULT (오답)', () => {
  function setupToInput(result: { current: ReturnType<typeof useGameEngine> }) {
    act(() => {
      result.current.startGame()
    })
    act(() => {
      vi.advanceTimersByTime(1500)
    })
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    return useGameStore.getState().sequence[0]
  }

  it('C-3-1: 오답 → status RESULT', () => {
    const { result } = renderHook(() => useGameEngine())
    const firstBtn = setupToInput(result)

    // 정답이 아닌 버튼 선택
    const wrongBtn = firstBtn === 'orange' ? 'blue' : 'orange'

    act(() => {
      result.current.handleInput(wrongBtn as Parameters<typeof result.current.handleInput>[0])
    })

    expect(useGameStore.getState().status).toBe('RESULT')
  })

  it('C-3-2: 오답 시 clearingStage 변화 없음 (null 유지)', () => {
    const { result } = renderHook(() => useGameEngine())
    const firstBtn = setupToInput(result)

    const wrongBtn = firstBtn === 'orange' ? 'blue' : 'orange'

    act(() => {
      result.current.handleInput(wrongBtn as Parameters<typeof result.current.handleInput>[0])
    })

    expect(result.current.clearingStage).toBeNull()
  })
})

// ── C-4. sequence.length === stage 불변식 ────────────────────────────────

describe('C-4. sequence.length === stage 불변식', () => {
  it('C-4-1: 게임 시작 직후 stage=1, sequence.length=1', () => {
    const { result } = renderHook(() => useGameEngine())

    act(() => {
      result.current.startGame()
    })

    act(() => {
      vi.advanceTimersByTime(1500) // 카운트다운 완료 → SHOWING, stage=1 세팅
    })

    const state = useGameStore.getState()
    expect(state.stage).toBe(1)
    expect(state.sequence.length).toBe(1)
  })

  it('C-4-2: 2스테이지 진입 시 stage=2, sequence.length=2', () => {
    const { result } = renderHook(() => useGameEngine())

    act(() => {
      result.current.startGame()
    })

    act(() => {
      vi.advanceTimersByTime(1500) // 카운트다운 완료
    })

    act(() => {
      vi.advanceTimersByTime(1000) // SHOWING → INPUT
    })

    const firstBtn = useGameStore.getState().sequence[0]

    act(() => {
      result.current.handleInput(firstBtn)
    })

    act(() => {
      vi.advanceTimersByTime(1100) // CLEAR_PAUSE → 다음 SHOWING
    })

    const state = useGameStore.getState()
    expect(state.stage).toBe(2)
    expect(state.sequence.length).toBe(2)
  })

  it('C-4-3: SHOWING 상태에서 handleInput 무시 — status 변화 없음', () => {
    const { result } = renderHook(() => useGameEngine())

    act(() => {
      result.current.startGame()
    })

    act(() => {
      vi.advanceTimersByTime(1500) // 카운트다운 완료 → SHOWING
    })

    // SHOWING 중에 입력 시도
    act(() => {
      result.current.handleInput('orange')
    })

    // SHOWING 상태 유지 (INPUT으로 넘어가지 않음)
    expect(useGameStore.getState().status).toBe('SHOWING')
  })

  it('C-4-4: clearingRef=true 시 handleInput 무시 — score 변화 없음', () => {
    const { result } = renderHook(() => useGameEngine())

    act(() => {
      result.current.startGame()
    })

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    act(() => {
      vi.advanceTimersByTime(1000) // INPUT 진입
    })

    const firstBtn = useGameStore.getState().sequence[0]

    // 정답으로 clearingRef=true 상태 진입
    act(() => {
      result.current.handleInput(firstBtn)
    })

    const scoreAfterClear = useGameStore.getState().score

    // clearingRef=true 상태에서 추가 입력
    act(() => {
      result.current.handleInput(firstBtn)
    })

    // score가 추가로 변하지 않아야 함
    expect(useGameStore.getState().score).toBe(scoreAfterClear)
  })
})
