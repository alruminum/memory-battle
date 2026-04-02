import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import { playTone, playGameStart, playGameOver, playApplause } from '../lib/sound'
import { getFlashDuration } from '../lib/gameLogic'
import { dbg, dbgWarn } from '../lib/debug'
import type { ButtonColor } from '../types'

const BUTTONS: ButtonColor[] = ['orange', 'blue', 'green', 'yellow']
const CLEAR_PAUSE_MS = 1100
const MILESTONE_PAUSE_MS = 1900
const COUNTDOWN_INTERVAL = 500  // ms per tick

const randomButton = () => BUTTONS[Math.floor(Math.random() * BUTTONS.length)]

export function useGameEngine() {
  const { status, sequence, setSequence, addInput, gameOver, resetGame } =
    useGameStore()
  const [flashingButton, setFlashingButton] = useState<ButtonColor | null>(null)
  const [clearingStage, setClearingStage] = useState<number | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isClearingFullCombo, setIsClearingFullCombo] = useState(false)
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
  }, [status, sequence])

  // 카운트다운 후 게임 실제 시작
  const launchAfterCountdown = useCallback(() => {
    if (startingRef.current) return
    startingRef.current = true
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
  }, [setSequence])

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
        playGameOver()
        gameOver()
        return
      }

      if (result === 'round-clear') {
        const clearedStage = sequence.length
        clearingRef.current = true
        setClearingStage(clearedStage)

        const now = Date.now()
        const flash = getFlashDuration(clearedStage)

        // stageClear에 inputCompleteTime과 flashDuration 전달
        const { isFullCombo, multiplierIncreased: increased } =
          useGameStore.getState().stageClear(now, flash)

        setIsClearingFullCombo(isFullCombo)
        setMultiplierIncreased(increased)

        const isMilestone = clearedStage % 5 === 0
        if (isMilestone || isFullCombo) playApplause()

        const newSeq = [...sequence, randomButton()]
        const pauseMs = isMilestone ? MILESTONE_PAUSE_MS : CLEAR_PAUSE_MS

        setTimeout(() => {
          clearingRef.current = false
          setClearingStage(null)
          setIsClearingFullCombo(false)
          setMultiplierIncreased(false)
          setSequence(newSeq)
          useGameStore.setState({ status: 'SHOWING', currentIndex: 0, stage: newSeq.length })
        }, pauseMs)
        return
      }
    },
    [sequence, addInput, gameOver, setSequence]
  )

  return {
    flashingButton,
    clearingStage,
    countdown,
    handleInput,
    startGame,
    retryGame,
    isClearingFullCombo,
    multiplierIncreased,
  }
}
