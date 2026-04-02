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

// useTimer mock: reset/stop spy를 외부에서 접근 가능하게 노출
const mockTimerReset = vi.fn()
const mockTimerStop = vi.fn()

vi.mock('./useTimer', () => ({
  useTimer: (_onExpire: () => void, _duration?: number) => {
    // onExpire를 ref에 저장해두고 테스트에서 직접 호출할 수 있도록 노출
    ;(globalThis as Record<string, unknown>).__testTimerExpire = _onExpire
    return {
      timeLeft: 2000,
      reset: mockTimerReset,
      stop: mockTimerStop,
    }
  },
}))

beforeEach(() => {
  vi.useFakeTimers()
  useGameStore.getState().resetGame()
  mockTimerReset.mockClear()
  mockTimerStop.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

// COUNTDOWN_INTERVAL = 500ms, 3 ticks = 1500ms total before game starts
// 타이머 수치 근거: docs/game-logic.md 참조

// ── C-1. IDLE → SHOWING → INPUT 전환 ─────────────────────────────────────

describe('C-1. IDLE → SHOWING → INPUT 전환', () => {
  it('C-1-1: startGame 호출 후 카운트다운 완료 → status SHOWING', async () => {
    const { result } = renderHook(() => useGameEngine())

    act(() => {
      result.current.startGame()
    })

    // 카운트다운 3 tick(각 500ms) 완료 → 게임 시작
    act(() => {
      vi.advanceTimersByTime(1500) // 500ms × 3 ticks
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
    // 1개 버튼 → 500ms + 여유 500ms = 1000ms 후 INPUT 전환
    act(() => {
      vi.advanceTimersByTime(1000) // flashDuration × sequenceLength + clearance
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

/**
 * 헬퍼: 카운트다운 + 첫 SHOWING 완료 후 INPUT 상태로 진입시킨다.
 * 이후 store의 sequence를 확인해 첫 버튼을 반환한다.
 */
function setupToInput(result: { current: ReturnType<typeof useGameEngine> }) {
  act(() => {
    result.current.startGame()
  })
  act(() => {
    vi.advanceTimersByTime(1500) // 카운트다운 완료 (500ms × 3)
  })
  act(() => {
    vi.advanceTimersByTime(1000) // SHOWING 완료 → INPUT (flashDuration × sequenceLength)
  })
  return useGameStore.getState().sequence[0]
}

/**
 * 헬퍼: 2스테이지 INPUT 상태로 진입시킨다.
 * 1스테이지 정답 입력 → CLEAR_PAUSE_MS(1100ms) → SHOWING → INPUT 전환
 * 반환값: [sequence[0], sequence[1]] (2개짜리 시퀀스)
 */
function setupToInput2(result: { current: ReturnType<typeof useGameEngine> }) {
  const firstBtn = setupToInput(result)

  // 1스테이지 정답 → round-clear
  act(() => {
    result.current.handleInput(firstBtn)
  })

  // CLEAR_PAUSE_MS 후 SHOWING 진입
  act(() => {
    vi.advanceTimersByTime(1100)
  })

  // 2개짜리 시퀀스 SHOWING: flashDuration(500ms) × 2 + 여유 = 1500ms
  act(() => {
    vi.advanceTimersByTime(1500)
  })

  return useGameStore.getState().sequence
}

// ── C-2. INPUT → ROUND-CLEAR → SHOWING ───────────────────────────────────

describe('C-2. INPUT → ROUND-CLEAR → SHOWING', () => {

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
      vi.advanceTimersByTime(1100) // CLEAR_PAUSE_MS
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
      vi.advanceTimersByTime(1100) // CLEAR_PAUSE_MS
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
      vi.advanceTimersByTime(1100) // CLEAR_PAUSE_MS
    })

    expect(result.current.clearingStage).toBeNull()
  })
})

// ── C-3. INPUT → RESULT (오답) ────────────────────────────────────────────

describe('C-3. INPUT → RESULT (오답)', () => {
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
      vi.advanceTimersByTime(1500) // 카운트다운 완료 (500ms × 3)
    })

    act(() => {
      vi.advanceTimersByTime(1000) // SHOWING → INPUT (flashDuration × sequenceLength)
    })

    const firstBtn = useGameStore.getState().sequence[0]

    act(() => {
      result.current.handleInput(firstBtn)
    })

    act(() => {
      vi.advanceTimersByTime(1100) // CLEAR_PAUSE_MS
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
      vi.advanceTimersByTime(1500) // 카운트다운 완료 → SHOWING (500ms × 3)
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
      vi.advanceTimersByTime(1500) // 카운트다운 완료 (500ms × 3)
    })

    act(() => {
      vi.advanceTimersByTime(1000) // INPUT 진입 (flashDuration × sequenceLength)
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

// ── D-1. 타이머 복구 — INPUT 진입 시 timer.reset 호출 ───────────────────

describe('D-1. INPUT 진입 시 timer.reset 호출', () => {
  it('D-1-1: SHOWING 완료 후 INPUT 전환 시 timer.reset 1회 호출', () => {
    const { result } = renderHook(() => useGameEngine())

    act(() => {
      result.current.startGame()
    })

    act(() => {
      vi.advanceTimersByTime(1500) // 카운트다운 → SHOWING
    })

    // SHOWING → INPUT 전환
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(useGameStore.getState().status).toBe('INPUT')
    expect(mockTimerReset).toHaveBeenCalledTimes(1)
  })
})

// ── D-2. 타이머 만료 시 gameOver 호출 ────────────────────────────────────

describe('D-2. 타이머 만료 시 gameOver', () => {
  it('D-2-1: INPUT 상태에서 타이머 만료 → status RESULT', () => {
    const { result } = renderHook(() => useGameEngine())
    setupToInput(result)

    // INPUT 상태에서 타이머 만료 콜백 직접 호출
    act(() => {
      const expire = (globalThis as Record<string, unknown>).__testTimerExpire as (() => void) | undefined
      if (expire) expire()
    })

    expect(useGameStore.getState().status).toBe('RESULT')
  })
})

// ── D-3. 오답 입력 시 timer.stop 호출 ────────────────────────────────────

describe('D-3. 오답 입력 시 timer.stop 호출', () => {
  it('D-3-1: 오답 handleInput → timer.stop 호출됨', () => {
    const { result } = renderHook(() => useGameEngine())
    const firstBtn = setupToInput(result)

    mockTimerStop.mockClear() // INPUT 진입 전까지의 stop 호출 초기화

    const wrongBtn = firstBtn === 'orange' ? 'blue' : 'orange'

    act(() => {
      result.current.handleInput(wrongBtn as Parameters<typeof result.current.handleInput>[0])
    })

    expect(mockTimerStop).toHaveBeenCalled()
  })
})

// ── D-4. round-clear 시 timer.stop 호출 ──────────────────────────────────

describe('D-4. round-clear 시 timer.stop 호출', () => {
  it('D-4-1: 정답 완료(round-clear) → timer.stop 호출됨', () => {
    const { result } = renderHook(() => useGameEngine())
    const firstBtn = setupToInput(result)

    mockTimerStop.mockClear() // INPUT 진입 전까지의 stop 호출 초기화

    act(() => {
      result.current.handleInput(firstBtn)
    })

    expect(mockTimerStop).toHaveBeenCalled()
  })
})

// ── D-5. correct 입력 시 timer.reset 호출 ────────────────────────────────

describe('D-5. correct 입력 시 timer.reset 호출', () => {
  it('D-5-1: 2스테이지 INPUT에서 첫 버튼(correct) 입력 → timer.reset 호출됨', () => {
    const { result } = renderHook(() => useGameEngine())
    const seq = setupToInput2(result)

    // INPUT 진입 시 호출된 reset 초기화 후 correct 입력만 검증
    mockTimerReset.mockClear()

    // 2개 시퀀스 중 첫 번째만 입력 → correct 반환 (round-clear 아님)
    act(() => {
      result.current.handleInput(seq[0])
    })

    expect(useGameStore.getState().status).toBe('INPUT')  // 아직 INPUT 유지
    expect(mockTimerReset).toHaveBeenCalledTimes(1)
  })
})
