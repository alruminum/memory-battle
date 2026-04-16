/**
 * gameStore 코인 필드·액션 테스트 (impl 01-usecoin-infra)
 * 대상: src/store/gameStore.ts — coinBalance, revivalUsed, setCoinBalance, revive
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'

// ── 초기화 ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  useGameStore.getState().resetGame()
})

// ── 초기값 ───────────────────────────────────────────────────────────────────

describe('코인 필드 초기값', () => {
  it('정상 흐름: coinBalance 초기값 = 0', () => {
    expect(useGameStore.getState().coinBalance).toBe(0)
  })

  it('정상 흐름: revivalUsed 초기값 = false', () => {
    expect(useGameStore.getState().revivalUsed).toBe(false)
  })
})

// ── setCoinBalance ────────────────────────────────────────────────────────────

describe('setCoinBalance(balance)', () => {
  it('정상 흐름: coinBalance 갱신', () => {
    useGameStore.getState().setCoinBalance(250)
    expect(useGameStore.getState().coinBalance).toBe(250)
  })

  it('엣지 케이스: 0 으로 설정 가능', () => {
    useGameStore.getState().setCoinBalance(100)
    useGameStore.getState().setCoinBalance(0)
    expect(useGameStore.getState().coinBalance).toBe(0)
  })
})

// ── startGame — revivalUsed 초기화 ───────────────────────────────────────────

describe('startGame() — revivalUsed 초기화', () => {
  it('정상 흐름: startGame 전 revivalUsed=true 였어도 false 로 초기화', () => {
    // revive()를 쓰기 위해 RESULT 상태 설정
    useGameStore.setState({ status: 'RESULT', revivalUsed: false })
    useGameStore.getState().revive()
    expect(useGameStore.getState().revivalUsed).toBe(true)  // 부활 후 true

    useGameStore.getState().startGame()
    expect(useGameStore.getState().revivalUsed).toBe(false)  // startGame 후 false
  })

  it('정상 흐름: startGame 후 coinBalance 는 유지됨', () => {
    useGameStore.getState().setCoinBalance(300)
    useGameStore.getState().startGame()
    expect(useGameStore.getState().coinBalance).toBe(300)
  })
})

// ── resetGame — revivalUsed 초기화 ───────────────────────────────────────────

describe('resetGame() — revivalUsed 초기화', () => {
  it('정상 흐름: resetGame 후 revivalUsed = false', () => {
    useGameStore.setState({ revivalUsed: true })
    useGameStore.getState().resetGame()
    expect(useGameStore.getState().revivalUsed).toBe(false)
  })
})

// ── revive() ─────────────────────────────────────────────────────────────────

describe('revive()', () => {
  it('정상 흐름: RESULT 상태에서 status=SHOWING, sequence=[], revivalUsed=true', () => {
    // RESULT 상태로 진입
    useGameStore.setState({
      status: 'RESULT',
      sequence: ['orange', 'blue', 'green'],
      currentIndex: 3,
      revivalUsed: false,
    })

    useGameStore.getState().revive()

    const state = useGameStore.getState()
    expect(state.status).toBe('SHOWING')
    expect(state.sequence).toEqual([])
    expect(state.revivalUsed).toBe(true)
  })

  it('정상 흐름: revive 후 score, stage, comboStreak 는 유지됨', () => {
    useGameStore.setState({
      status: 'RESULT',
      score: 500,
      stage: 5,
      comboStreak: 10,
      maxComboStreak: 12,
      fullComboCount: 3,
      revivalUsed: false,
    })

    useGameStore.getState().revive()

    const state = useGameStore.getState()
    expect(state.score).toBe(500)
    expect(state.stage).toBe(5)
    expect(state.comboStreak).toBe(10)
    expect(state.maxComboStreak).toBe(12)
    expect(state.fullComboCount).toBe(3)
  })

  it('엣지 케이스: status !== RESULT 이면 no-op', () => {
    useGameStore.setState({ status: 'SHOWING', revivalUsed: false })

    useGameStore.getState().revive()

    expect(useGameStore.getState().status).toBe('SHOWING')
    expect(useGameStore.getState().revivalUsed).toBe(false)
  })

  it('엣지 케이스: status === IDLE 이면 no-op', () => {
    useGameStore.setState({ status: 'IDLE', revivalUsed: false })

    useGameStore.getState().revive()

    expect(useGameStore.getState().status).toBe('IDLE')
  })

  it('엣지 케이스: status === INPUT 이면 no-op', () => {
    useGameStore.setState({ status: 'INPUT', revivalUsed: false })

    useGameStore.getState().revive()

    expect(useGameStore.getState().status).toBe('INPUT')
  })

  it('엣지 케이스: revivalUsed=true 이면 no-op (같은 판 2회 부활 방지)', () => {
    useGameStore.setState({
      status: 'RESULT',
      revivalUsed: true,
    })

    useGameStore.getState().revive()

    // revive 무시 → 여전히 RESULT
    expect(useGameStore.getState().status).toBe('RESULT')
  })

  it('엣지 케이스: currentIndex 가 0 으로 초기화됨', () => {
    useGameStore.setState({
      status: 'RESULT',
      currentIndex: 5,
      revivalUsed: false,
    })

    useGameStore.getState().revive()

    expect(useGameStore.getState().currentIndex).toBe(0)
  })
})
