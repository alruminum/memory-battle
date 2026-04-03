/**
 * Epic 09 impl 06 — 점수 배율 즉시 적용 (#59)
 * test-plan.md B-2, B-5 기반
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../store/gameStore'
import { getComboMultiplier, calcClearBonus } from '../lib/gameLogic'

// Helper: store를 직접 조작해 원하는 상태로 설정
const setState = (partial: Record<string, unknown>) => {
  useGameStore.setState(partial)
}

const getState = () => useGameStore.getState()

describe('B-2: addInput — 배율 즉시 적용', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('B-2-1: 정답 버튼 입력 (비마지막) -> correct 반환', () => {
    setState({ sequence: ['orange', 'blue'], currentIndex: 0, status: 'INPUT' })
    const result = getState().addInput('orange')
    expect(result).toBe('correct')
  })

  it('B-2-2: streak=0 (x1) 정답 입력 후 score +1', () => {
    setState({ sequence: ['orange'], currentIndex: 0, score: 0, comboStreak: 0, status: 'INPUT' })
    getState().addInput('orange')
    expect(getState().score).toBe(1)
  })

  it('B-2-3: 정답 입력 후 currentIndex +1', () => {
    setState({ sequence: ['orange', 'blue'], currentIndex: 0, status: 'INPUT' })
    getState().addInput('orange')
    expect(getState().currentIndex).toBe(1)
  })

  it('B-2-4: 마지막 버튼 정답 -> round-clear 반환', () => {
    setState({ sequence: ['orange'], currentIndex: 0, status: 'INPUT' })
    const result = getState().addInput('orange')
    expect(result).toBe('round-clear')
  })

  it('B-2-5: 오답 버튼 입력 -> wrong 반환', () => {
    setState({ sequence: ['orange'], currentIndex: 0, status: 'INPUT' })
    const result = getState().addInput('blue')
    expect(result).toBe('wrong')
  })

  it('B-2-6: 오답 입력 시 score 변화 없음', () => {
    setState({ sequence: ['orange'], currentIndex: 0, score: 5, status: 'INPUT' })
    getState().addInput('blue')
    expect(getState().score).toBe(5)
  })

  it('B-2-7: streak=5 (x2) 정답 입력 후 score +2', () => {
    setState({ sequence: ['orange'], currentIndex: 0, score: 0, comboStreak: 5, status: 'INPUT' })
    getState().addInput('orange')
    expect(getState().score).toBe(2)
  })

  it('B-2-8: streak=10 (x3) 정답 입력 후 score +3', () => {
    setState({ sequence: ['orange'], currentIndex: 0, score: 0, comboStreak: 10, status: 'INPUT' })
    getState().addInput('orange')
    expect(getState().score).toBe(3)
  })
})

describe('B-5: stageClear — clearBonus 전용 점수 계산', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  // Helper: 풀콤보 달성 조건 (userInputTime < computerShowTime)
  // sequenceStartTime=0, flashDuration=500 -> computerShowTime = 500 * seqLen
  // inputCompleteTime = 100 -> userInputTime = 100 < 500*seqLen -> 풀콤보
  const FULL_COMBO_TIME = 100
  const NO_COMBO_TIME = 999999  // 충분히 큰 값 -> 풀콤보 실패
  const FLASH = 500

  it('B-5-1: stage=3 보너스 없음, 풀콤보X -> 점수 변화 없음', () => {
    // addInput x1 배율 3회 = score 3
    setState({
      sequence: ['orange', 'blue', 'green'],
      score: 3,
      comboStreak: 0,
      sequenceStartTime: 0,
    })
    getState().stageClear(NO_COMBO_TIME, FLASH)
    // clearBonus(3) = 0, bonusScore = 0
    expect(getState().score).toBe(3)
  })

  it('B-5-2: stage=3 보너스 없음, 풀콤보O -> 점수 변화 없음', () => {
    setState({
      sequence: ['orange', 'blue', 'green'],
      score: 3,
      comboStreak: 0,
      sequenceStartTime: 0,
    })
    getState().stageClear(FULL_COMBO_TIME, FLASH)
    // clearBonus(3) = 0, bonusScore = 0
    expect(getState().score).toBe(3)
  })

  it('B-5-3: stage=10 보너스 streak=0 (x1), 풀콤보O -> score += clearBonus(10)*x1 = 2', () => {
    // 10 buttons at x1 = score 10
    const seq = Array(10).fill('orange')
    setState({
      sequence: seq,
      score: 10,
      comboStreak: 0,
      sequenceStartTime: 0,
    })
    getState().stageClear(FULL_COMBO_TIME, FLASH)
    // clearBonus(10) = Math.floor(10/5) = 2, multiplier(0) = 1 -> bonusScore = 2
    expect(getState().score).toBe(12)
  })

  it('B-5-4: stage=10 보너스 streak=5 (x2), 풀콤보O -> score += clearBonus(10)*x2 = 4', () => {
    // 10 buttons at x2 = score 20
    const seq = Array(10).fill('orange')
    setState({
      sequence: seq,
      score: 20,
      comboStreak: 5,
      sequenceStartTime: 0,
    })
    getState().stageClear(FULL_COMBO_TIME, FLASH)
    // clearBonus(10) = 2, multiplier(5) = 2 -> bonusScore = 4
    expect(getState().score).toBe(24)
  })

  it('B-5-5: stage=10 보너스 streak=5 (x2), 풀콤보X -> 보너스 여전히 적용 (isFullCombo 점수 무관)', () => {
    const seq = Array(10).fill('orange')
    setState({
      sequence: seq,
      score: 20,
      comboStreak: 5,
      sequenceStartTime: 0,
    })
    getState().stageClear(NO_COMBO_TIME, FLASH)
    // clearBonus(10) = 2, multiplier(5) = 2 -> bonusScore = 4
    // isFullCombo는 점수에 무관
    expect(getState().score).toBe(24)
  })

  it('B-5-6: multiplierIncreased true — streak 4->5 전환', () => {
    const seq = Array(3).fill('orange')
    setState({
      sequence: seq,
      score: 3,
      comboStreak: 4,
      sequenceStartTime: 0,
    })
    const result = getState().stageClear(FULL_COMBO_TIME, FLASH)
    // prevComboStreak=4 -> x1, newComboStreak=5 -> x2
    expect(result.multiplierIncreased).toBe(true)
  })

  it('B-5-7: multiplierIncreased false — streak 배율 상승 없음', () => {
    const seq = Array(3).fill('orange')
    setState({
      sequence: seq,
      score: 3,
      comboStreak: 1,
      sequenceStartTime: 0,
    })
    const result = getState().stageClear(FULL_COMBO_TIME, FLASH)
    // prevComboStreak=1 -> x1, newComboStreak=2 -> x1
    expect(result.multiplierIncreased).toBe(false)
  })

  it('B-5-8: multiplierIncreased false — 풀콤보 미달성', () => {
    const seq = Array(3).fill('orange')
    setState({
      sequence: seq,
      score: 3,
      comboStreak: 4,
      sequenceStartTime: 0,
    })
    const result = getState().stageClear(NO_COMBO_TIME, FLASH)
    // prevComboStreak=4 -> x1, newComboStreak=0 -> x1
    expect(result.multiplierIncreased).toBe(false)
  })
})

describe('통합: addInput + stageClear 시퀀스', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('streak=5(x2) 상태에서 3버튼 입력 + stageClear -> 점수 정합성', () => {
    // 3버튼 시퀀스, comboStreak=5 (x2)
    setState({
      sequence: ['orange', 'blue', 'green'],
      currentIndex: 0,
      score: 0,
      comboStreak: 5,
      sequenceStartTime: 0,
      status: 'INPUT',
    })

    // 3번 addInput -> 각각 +2 (x2 배율)
    getState().addInput('orange')
    expect(getState().score).toBe(2)
    getState().addInput('blue')
    expect(getState().score).toBe(4)
    getState().addInput('green')
    expect(getState().score).toBe(6)

    // stageClear -> stage=3, clearBonus=0
    getState().stageClear(100, 500)  // 풀콤보 달성
    expect(getState().score).toBe(6)  // clearBonus(3)=0, 변화 없음
  })

  it('streak=0(x1) 상태에서 10버튼 입력 + stageClear -> clearBonus 적용', () => {
    const seq = Array.from({ length: 10 }, () => 'orange' as const)
    setState({
      sequence: seq,
      currentIndex: 0,
      score: 0,
      comboStreak: 0,
      sequenceStartTime: 0,
      status: 'INPUT',
    })

    // 10번 addInput -> 각각 +1 (x1 배율)
    for (let i = 0; i < 10; i++) {
      getState().addInput('orange')
    }
    expect(getState().score).toBe(10)

    // stageClear -> clearBonus(10) = 2, x1 = 2
    getState().stageClear(100, 500)  // 풀콤보 달성
    expect(getState().score).toBe(12)
  })
})
