import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import { playTone, playGameStart, playGameOver, playApplause } from '../lib/sound'
import { getFlashDuration, getInputTimeout } from '../lib/gameLogic'
import { useTimer } from './useTimer'
import { dbg, dbgWarn } from '../lib/debug'
import type { ButtonColor } from '../types'

const BUTTONS: ButtonColor[] = ['orange', 'blue', 'green', 'yellow']
const CLEAR_PAUSE_MS = 1100
const MILESTONE_PAUSE_MS = 1900
const COUNTDOWN_INTERVAL = 500  // ms per tick

const randomButton = () => BUTTONS[Math.floor(Math.random() * BUTTONS.length)]

export function useGameEngine() {
  const { status, sequence, stage, setSequence, addInput, gameOver, resetGame, gameOverReason } =
    useGameStore()

  // 타이머 만료 시 게임오버
  const handleExpire = useCallback(() => {
    playGameOver()
    gameOver('timeout')
  }, [gameOver])

  // stage 기반 동적 타임아웃
  const inputTimeout = getInputTimeout(stage)
  const timer = useTimer(handleExpire, inputTimeout)
  const [flashingButton, setFlashingButton] = useState<ButtonColor | null>(null)
  const [clearingStage, setClearingStage] = useState<number | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [multiplierIncreased, setMultiplierIncreased] = useState(false)
  const showingRef = useRef(false)
  const clearingRef = useRef(false)
  const startingRef = useRef(false)

  // SHOWING: 시퀀스 순서대로 점등 + 사운드
  useEffect(() => {
    if (status !== 'SHOWING') {
      showingRef.current = false
      return
    }
    if (showingRef.current) return
    showingRef.current = true

    const flash = getFlashDuration(useGameStore.getState().stage)
    let i = 0

    const next = () => {
      if (i >= sequence.length) {
        setFlashingButton(null)
        dbg('[Engine] SHOWING→INPUT stage=', useGameStore.getState().stage, 'seqLen=', sequence.length)
        useGameStore.setState({
          status: 'INPUT',
          currentIndex: 0,
          sequenceStartTime: Date.now(),  // INPUT 페이즈 시작 시각 저장
        })
        timer.reset()   // INPUT 진입 시 입력 타이머 시작
        showingRef.current = false
        return
      }
      const btn = sequence[i]
      setFlashingButton(btn)
      playTone(btn)
      setTimeout(() => {
        setFlashingButton(null)
        setTimeout(() => {
          i++
          next()
        }, flash * 0.2)
      }, flash * 0.8)
    }

    next()
  }, [status, sequence, timer])

  // 카운트다운 후 게임 실제 시작
  const launchAfterCountdown = useCallback(() => {
    if (startingRef.current) return
    startingRef.current = true
    timer.stop()    // 이전 게임 잔여 타이머 정리
    setCountdown(3)
    setTimeout(() => setCountdown(2), COUNTDOWN_INTERVAL)
    setTimeout(() => setCountdown(1), COUNTDOWN_INTERVAL * 2)
    setTimeout(() => {
      startingRef.current = false
      setCountdown(null)
      clearingRef.current = false
      setClearingStage(null)
      playGameStart()
      const firstSeq: ButtonColor[] = [randomButton()]
      useGameStore.getState().startGame()
      setSequence(firstSeq)
      useGameStore.setState({ sequence: firstSeq, status: 'SHOWING', stage: 1 })
    }, COUNTDOWN_INTERVAL * 3)
  }, [setSequence, timer])

  const startGame = useCallback(() => {
    launchAfterCountdown()
  }, [launchAfterCountdown])

  // RETRY: 바로 카운트다운 -> 시작
  const retryGame = useCallback(() => {
    resetGame()
    launchAfterCountdown()
  }, [resetGame, launchAfterCountdown])

  const handleInput = useCallback(
    (color: ButtonColor) => {
      const currentStatus = useGameStore.getState().status
      dbg('[Engine] handleInput color=', color, 'storeStatus=', currentStatus)
      if (currentStatus !== 'INPUT') {
        dbgWarn('[Engine] INPUT BLOCKED — storeStatus=', currentStatus)
        return
      }
      if (clearingRef.current) {
        dbgWarn('[Engine] INPUT BLOCKED — clearing')
        return
      }

      playTone(color)

      // 유저 입력 flash
      setFlashingButton(color)
      setTimeout(() => setFlashingButton(null), 120)

      const result = addInput(color)

      if (result === 'wrong') {
        timer.stop()
        playGameOver()
        gameOver('wrong')
        return
      }

      if (result === 'round-clear') {
        const clearedStage = sequence.length
        clearingRef.current = true
        timer.stop()
        setClearingStage(clearedStage)

        const now = Date.now()
        const flash = getFlashDuration(clearedStage)

        // stageClear에 inputCompleteTime과 flashDuration 전달
        const { isFullCombo, multiplierIncreased: increased } =
          useGameStore.getState().stageClear(now, flash)

        setMultiplierIncreased(increased)

        const isMilestone = clearedStage % 5 === 0
        if (isMilestone) playApplause()

        const newSeq = [...sequence, randomButton()]
        const pauseMs = isMilestone ? MILESTONE_PAUSE_MS : CLEAR_PAUSE_MS

        setTimeout(() => {
          clearingRef.current = false
          setClearingStage(null)
          setMultiplierIncreased(false)
          setSequence(newSeq)
          useGameStore.setState({ status: 'SHOWING', currentIndex: 0, stage: newSeq.length })
        }, pauseMs)
        return
      }

      // correct: 매 정답 입력마다 타이머 재시작 (TRD: "버튼당 입력 제한 — 매 버튼마다 독립 적용")
      timer.reset()
    },
    [sequence, addInput, gameOver, setSequence, timer]
  )

  return {
    flashingButton,
    clearingStage,
    countdown,
    handleInput,
    startGame,
    retryGame,
    multiplierIncreased,
    gameOverReason,
  }
}
