import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'

beforeEach(() => {
  useGameStore.getState().resetGame()
})

// ── B-1. startGame() ──────────────────────────────────────────────────────

describe('B-1. startGame() — 초기화 검증', () => {
  beforeEach(() => {
    useGameStore.getState().startGame()
  })

  it('B-1-1: status === SHOWING', () => {
    expect(useGameStore.getState().status).toBe('SHOWING')
  })

  it('B-1-2: score === 0', () => {
    expect(useGameStore.getState().score).toBe(0)
  })

  it('B-1-3: comboStreak === 0', () => {
    expect(useGameStore.getState().comboStreak).toBe(0)
  })

  it('B-1-4: stage === 0', () => {
    expect(useGameStore.getState().stage).toBe(0)
  })

  it('B-1-5: sequenceStartTime === 0', () => {
    expect(useGameStore.getState().sequenceStartTime).toBe(0)
  })

  it('B-1-6: fullComboCount === 0', () => {
    expect(useGameStore.getState().fullComboCount).toBe(0)
  })

  it('B-1-7: maxComboStreak === 0', () => {
    expect(useGameStore.getState().maxComboStreak).toBe(0)
  })

  it('B-1-8: baseScore === 0', () => {
    expect(useGameStore.getState().baseScore).toBe(0)
  })
})

// ── B-2. addInput(color) ──────────────────────────────────────────────────

describe('B-2. addInput(color) — 입력 반환값 및 상태 변화', () => {
  it('B-2-1: 정답(비마지막) → correct 반환', () => {
    useGameStore.setState({ sequence: ['orange', 'blue'], currentIndex: 0 })
    const result = useGameStore.getState().addInput('orange')
    expect(result).toBe('correct')
  })

  it('B-2-2: 정답 후 score +1', () => {
    useGameStore.setState({ sequence: ['orange'], currentIndex: 0, score: 0 })
    useGameStore.getState().addInput('orange')
    expect(useGameStore.getState().score).toBe(1)
  })

  it('B-2-3: 정답 후 currentIndex +1', () => {
    useGameStore.setState({ sequence: ['orange', 'blue'], currentIndex: 0 })
    useGameStore.getState().addInput('orange')
    expect(useGameStore.getState().currentIndex).toBe(1)
  })

  it('B-2-4: 마지막 정답 → round-clear 반환', () => {
    useGameStore.setState({ sequence: ['orange'], currentIndex: 0, score: 0 })
    const result = useGameStore.getState().addInput('orange')
    expect(result).toBe('round-clear')
  })

  it('B-2-5: 오답 → wrong 반환', () => {
    useGameStore.setState({ sequence: ['orange'], currentIndex: 0 })
    const result = useGameStore.getState().addInput('blue')
    expect(result).toBe('wrong')
  })

  it('B-2-6: 오답 시 score 변화 없음', () => {
    useGameStore.setState({ sequence: ['orange'], currentIndex: 0, score: 5 })
    useGameStore.getState().addInput('blue')
    expect(useGameStore.getState().score).toBe(5)
  })
})

// ── B-3. stageClear() — 풀콤보 판정 ──────────────────────────────────────

describe('B-3. stageClear() — 풀콤보 판정', () => {
  // computerShowTime = flashDuration(500) * sequence.length(3) = 1500  // docs/game-logic.md 참조
  // B-3-1: userInputTime = 2400 - 1000 = 1400 < 1500 → true
  it('B-3-1: userInputTime < computerShowTime → isFullCombo true', () => {
    useGameStore.setState({
      sequence: ['orange', 'blue', 'green'],
      sequenceStartTime: 1000,
      comboStreak: 0,
    })
    const { isFullCombo } = useGameStore.getState().stageClear(2400, 500) // flashDuration=500 docs/game-logic.md 참조
    expect(isFullCombo).toBe(true)
  })

  // B-3-2: userInputTime = 2600 - 1000 = 1600 >= 1500 → false
  it('B-3-2: userInputTime >= computerShowTime → isFullCombo false', () => {
    useGameStore.setState({
      sequence: ['orange', 'blue', 'green'],
      sequenceStartTime: 1000,
      comboStreak: 0,
    })
    const { isFullCombo } = useGameStore.getState().stageClear(2600, 500) // flashDuration=500 docs/game-logic.md 참조
    expect(isFullCombo).toBe(false)
  })

  // B-3-3: userInputTime = 2500 - 1000 = 1500 === 1500 → false (등호 포함 안 됨)
  it('B-3-3: userInputTime === computerShowTime → isFullCombo false', () => {
    useGameStore.setState({
      sequence: ['orange', 'blue', 'green'],
      sequenceStartTime: 1000,
      comboStreak: 0,
    })
    const { isFullCombo } = useGameStore.getState().stageClear(2500, 500) // flashDuration=500 docs/game-logic.md 참조
    expect(isFullCombo).toBe(false)
  })
})

// ── B-4. stageClear() — streak 누적 ──────────────────────────────────────

describe('B-4. stageClear() — streak 누적', () => {
  // 풀콤보 조건 헬퍼: sequenceStartTime=0, flashDuration=500, seq.length=1, inputCompleteTime=400 → 400 < 500
  const FULL_COMBO_TIME = 400    // userInputTime(400) < computerShowTime(500) → fullCombo
  const NO_COMBO_TIME = 600      // userInputTime(600) >= computerShowTime(500) → no fullCombo
  const FLASH_DURATION = 500
  const SEQ_1 = ['orange'] as const

  it('B-4-1: 풀콤보 → comboStreak +1', () => {
    useGameStore.setState({ sequence: [...SEQ_1], sequenceStartTime: 0, comboStreak: 0 })
    useGameStore.getState().stageClear(FULL_COMBO_TIME, FLASH_DURATION)
    expect(useGameStore.getState().comboStreak).toBe(1)
  })

  it('B-4-2: 풀콤보 미달성 → comboStreak 0 리셋', () => {
    useGameStore.setState({ sequence: [...SEQ_1], sequenceStartTime: 0, comboStreak: 4 })
    useGameStore.getState().stageClear(NO_COMBO_TIME, FLASH_DURATION)
    expect(useGameStore.getState().comboStreak).toBe(0)
  })

  it('B-4-3: 풀콤보 → fullComboCount +1', () => {
    useGameStore.setState({ sequence: [...SEQ_1], sequenceStartTime: 0, fullComboCount: 2, comboStreak: 0 })
    useGameStore.getState().stageClear(FULL_COMBO_TIME, FLASH_DURATION)
    expect(useGameStore.getState().fullComboCount).toBe(3)
  })

  it('B-4-4: 풀콤보 미달성 → fullComboCount 변화 없음', () => {
    useGameStore.setState({ sequence: [...SEQ_1], sequenceStartTime: 0, fullComboCount: 2, comboStreak: 0 })
    useGameStore.getState().stageClear(NO_COMBO_TIME, FLASH_DURATION)
    expect(useGameStore.getState().fullComboCount).toBe(2)
  })

  it('B-4-5: maxComboStreak 신기록 갱신 (3 → 4)', () => {
    // comboStreak=3, 풀콤보 → newStreak=4 > maxComboStreak=3
    useGameStore.setState({ sequence: [...SEQ_1], sequenceStartTime: 0, comboStreak: 3, maxComboStreak: 3 })
    useGameStore.getState().stageClear(FULL_COMBO_TIME, FLASH_DURATION)
    expect(useGameStore.getState().maxComboStreak).toBe(4)
  })

  it('B-4-6: maxComboStreak 비갱신 (newStreak=3 < maxComboStreak=5)', () => {
    // comboStreak=2, 풀콤보 → newStreak=3 < maxComboStreak=5
    useGameStore.setState({ sequence: [...SEQ_1], sequenceStartTime: 0, comboStreak: 2, maxComboStreak: 5 })
    useGameStore.getState().stageClear(FULL_COMBO_TIME, FLASH_DURATION)
    expect(useGameStore.getState().maxComboStreak).toBe(5)
  })

  it('B-4-7: comboStreak 상한 없음 (4 → 5)', () => {
    useGameStore.setState({ sequence: [...SEQ_1], sequenceStartTime: 0, comboStreak: 4 })
    useGameStore.getState().stageClear(FULL_COMBO_TIME, FLASH_DURATION)
    expect(useGameStore.getState().comboStreak).toBe(5)
  })
})

// ── B-5. stageClear() — 배율 적용 점수 ───────────────────────────────────

describe('B-5. stageClear() — 배율 적용 점수', () => {
  /**
   * stageClear 점수 계산 구조:
   *   prevAccumulated = state.score - clearedStage
   *   bonus = calcClearBonus(clearedStage)
   *   rawScore = clearedStage + bonus
   *   stageScore = isFullCombo ? rawScore * getComboMultiplier(prevComboStreak) : rawScore
   *   score = prevAccumulated + stageScore
   *
   * addInput이 sequence.length번 호출되어 score에 이미 sequence.length만큼 더해진 상태.
   * 테스트에서는 state.score에 sequence.length를 직접 세팅해 addInput 호출 시뮬레이션.
   */

  // B-5-1: 풀콤보X, stage=3, prevComboStreak=2
  //   addInput 3회 → score에 3 쌓임 → prevAccumulated = 3-3 = 0
  //   rawScore = 3+0 = 3, stageScore = 3 (no combo) → score = 3
  it('B-5-1: 풀콤보X, stage=3 → 배율 미적용, score=3', () => {
    useGameStore.setState({
      sequence: ['orange', 'blue', 'green'],
      sequenceStartTime: 0,
      comboStreak: 2,
      score: 3,  // addInput 3회 시뮬레이션
    })
    // NO_COMBO: userInputTime=600 > computerShowTime=500*3=1500? NO → 600 < 1500 → fullCombo!
    // 풀콤보X 조건: inputCompleteTime - sequenceStartTime >= flashDuration * sequence.length
    // 0 + (500*3+1) = 1501 → userInputTime=1501 >= 1500 → NOT full combo
    useGameStore.getState().stageClear(1501, 500)
    expect(useGameStore.getState().score).toBe(3)
  })

  // B-5-2: 풀콤보O, prevComboStreak=0 → x1, stage=3
  //   rawScore=3, stageScore=3×1=3, prevAccumulated=0 → score=3
  it('B-5-2: 풀콤보O, streak=0 → x1, stage=3, score=3', () => {
    useGameStore.setState({
      sequence: ['orange', 'blue', 'green'],
      sequenceStartTime: 0,
      comboStreak: 0,
      score: 3,
    })
    // FULL_COMBO: 1499 < 1500
    useGameStore.getState().stageClear(1499, 500)
    expect(useGameStore.getState().score).toBe(3)
  })

  // B-5-3: 풀콤보O, prevComboStreak=5 → x2, stage=3
  //   ⚠️ v0.3.2-hotfix (#59): stageClear는 clearBonus만 추가. clearBonus(3)=0 → score 변화 없음
  //   (버튼 점수는 addInput에서 이미 x2 적용됨)
  it('B-5-3: 풀콤보O, streak=5, stage=3 → clearBonus=0, score 변화 없음', () => {
    useGameStore.setState({
      sequence: ['orange', 'blue', 'green'],
      sequenceStartTime: 0,
      comboStreak: 5,
      score: 3,
    })
    useGameStore.getState().stageClear(1499, 500)
    // clearBonus(3) = 0 → bonusScore = 0 → score 유지
    expect(useGameStore.getState().score).toBe(3)
  })

  // B-5-4: 풀콤보O, prevComboStreak=5 → x2, stage=10 (bonus=2)
  //   ⚠️ v0.3.2-hotfix (#59): stageClear는 clearBonus만 추가
  //   clearBonus(10) = 2, multiplier(5) = x2 → bonusScore = 4 → score = 10+4 = 14
  it('B-5-4: 풀콤보O, streak=5, stage=10(보너스포함) → clearBonus×x2, score=14', () => {
    // seq.length=10, computerShowTime=500*10=5000, inputCompleteTime=4999 → full combo
    const seq10: ('orange' | 'blue' | 'green' | 'yellow')[] = Array(10).fill('orange') as ('orange' | 'blue' | 'green' | 'yellow')[]
    useGameStore.setState({
      sequence: seq10,
      sequenceStartTime: 0,
      comboStreak: 5,
      score: 10,
    })
    useGameStore.getState().stageClear(4999, 500)
    // clearBonus(10) = 2, getComboMultiplier(5) = 2 → bonusScore = 4 → score = 14
    expect(useGameStore.getState().score).toBe(14)
  })

  // B-5-5: 이전 누적 점수 보존 (2스테이지)
  //   1스테이지 score=1, 2스테이지 진입 후 addInput 2회 → score=3
  //   stageClear: prevAccumulated = 3-2 = 1, rawScore=2, stageScore=2 → score=1+2=3
  it('B-5-5: 이전 누적 점수 보존 — 2스테이지, score=3', () => {
    useGameStore.setState({
      sequence: ['orange', 'blue'],
      sequenceStartTime: 0,
      comboStreak: 0,
      score: 3,  // 1스테이지 1점 + 2스테이지 addInput 2회
    })
    // 풀콤보X: inputCompleteTime=1001 >= 500*2=1000 → NO
    useGameStore.getState().stageClear(1001, 500)
    expect(useGameStore.getState().score).toBe(3)
  })

  // B-5-6: multiplierIncreased true (streak 4→5, 배율 x1→x2)
  it('B-5-6: multiplierIncreased true (streak 4→5)', () => {
    useGameStore.setState({
      sequence: ['orange'],
      sequenceStartTime: 0,
      comboStreak: 4,
      score: 1,
    })
    const { multiplierIncreased } = useGameStore.getState().stageClear(499, 500)
    expect(multiplierIncreased).toBe(true)
  })

  // B-5-7: multiplierIncreased false (streak 1→2, 배율 변화 없음)
  it('B-5-7: multiplierIncreased false (streak 1→2, 배율 유지)', () => {
    useGameStore.setState({
      sequence: ['orange'],
      sequenceStartTime: 0,
      comboStreak: 1,
      score: 1,
    })
    const { multiplierIncreased } = useGameStore.getState().stageClear(499, 500)
    expect(multiplierIncreased).toBe(false)
  })

  // B-5-8: multiplierIncreased false (풀콤보X)
  it('B-5-8: multiplierIncreased false (풀콤보X)', () => {
    useGameStore.setState({
      sequence: ['orange'],
      sequenceStartTime: 0,
      comboStreak: 4,
      score: 1,
    })
    // NO COMBO: inputCompleteTime=501 >= 500 → false
    const { multiplierIncreased } = useGameStore.getState().stageClear(501, 500)
    expect(multiplierIncreased).toBe(false)
  })
})

// ── B-6. gameOver(reason) — Epic 10 ──────────────────────────────────────

describe('B-6. gameOver(reason) — reason 파라미터 + gameOverReason 필드', () => {
  it('B-6-1: gameOver 후 status === RESULT', () => {
    useGameStore.setState({ sequence: ['orange', 'blue', 'green', 'yellow', 'orange'] })
    useGameStore.getState().gameOver('wrong')
    expect(useGameStore.getState().status).toBe('RESULT')
  })

  it('B-6-2: gameOver 후 stage === sequence.length', () => {
    useGameStore.setState({ sequence: ['orange', 'blue', 'green', 'yellow', 'orange'] })
    useGameStore.getState().gameOver('wrong')
    expect(useGameStore.getState().stage).toBe(5)
  })

  it('B-6-3: gameOver 후 score, comboStreak 변화 없음', () => {
    useGameStore.setState({ sequence: ['orange'], score: 7, comboStreak: 3 })
    useGameStore.getState().gameOver('wrong')
    expect(useGameStore.getState().score).toBe(7)
    expect(useGameStore.getState().comboStreak).toBe(3)
  })

  it('B-6-4: gameOver("timeout") → gameOverReason === "timeout"', () => {
    useGameStore.setState({ sequence: ['orange'] })
    useGameStore.getState().gameOver('timeout')
    expect(useGameStore.getState().gameOverReason).toBe('timeout')
  })

  it('B-6-5: gameOver("wrong") → gameOverReason === "wrong"', () => {
    useGameStore.setState({ sequence: ['orange'] })
    useGameStore.getState().gameOver('wrong')
    expect(useGameStore.getState().gameOverReason).toBe('wrong')
  })

  it('B-6-6: resetGame() 후 gameOverReason === null', () => {
    useGameStore.setState({ sequence: ['orange'] })
    useGameStore.getState().gameOver('timeout')
    useGameStore.getState().resetGame()
    expect(useGameStore.getState().gameOverReason).toBeNull()
  })

  it('B-6-7: startGame() 후 gameOverReason === null', () => {
    useGameStore.setState({ sequence: ['orange'] })
    useGameStore.getState().gameOver('wrong')
    useGameStore.getState().startGame()
    expect(useGameStore.getState().gameOverReason).toBeNull()
  })
})
