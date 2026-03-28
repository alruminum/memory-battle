import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useGameEngine } from '../hooks/useGameEngine'
import { ButtonPad } from '../components/game/ButtonPad'
import type { Difficulty } from '../types'

const DIFFICULTIES: {
  value: Difficulty
  label: string
  multiplier: string
  color: string
  glow: string
}[] = [
  { value: 'EASY',   label: 'EASY',   multiplier: 'x1', color: '#23C35B', glow: '#23C35B44' },
  { value: 'MEDIUM', label: 'NORMAL', multiplier: 'x2', color: '#3182F6', glow: '#3182F644' },
  { value: 'HARD',   label: 'HARD',   multiplier: 'x3', color: '#FF4444', glow: '#FF444444' },
]

export function GamePage() {
  const { status, score, stage } = useGameStore()
  const { flashingButton, clearingStage, countdown, handleInput, startGame, retryGame } = useGameEngine()
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('EASY')

  const isIdle = status === 'IDLE'
  const isResult = status === 'RESULT'
  const isPlaying = status === 'SHOWING' || status === 'INPUT'
  // IDLE 또는 RESULT일 때 난이도 변경 가능
  const canChangeDifficulty = isIdle || isResult

  const stageArea = () => {
    if (countdown !== null) {
      return (
        <div style={{
          fontSize: 56,
          fontWeight: 900,
          color: '#FF6900',
          lineHeight: 1,
          textShadow: '0 0 24px #FF690088',
        }}>
          {countdown}
        </div>
      )
    }
    if (isResult) {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 5,
            color: '#ff4444',
            textShadow: '0 0 16px #ff444488',
            marginBottom: 8,
          }}>GAME OVER</div>
          <div style={{
            fontSize: 60,
            fontWeight: 900,
            color: 'var(--text-primary)',
            lineHeight: 1,
            letterSpacing: -2,
            marginBottom: 4,
          }}>{score}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2 }}>
            STAGE {stage}
          </div>
        </div>
      )
    }
    if (clearingStage !== null) {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#FF6900' }}>STAGE {clearingStage}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FF6900', letterSpacing: 1 }}>CLEAR ✓</div>
        </div>
      )
    }
    if (isPlaying) {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 2 }}>STAGE</div>
          <div style={{ fontSize: 44, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{stage}</div>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    }}>
      {/* 상단 헤더 */}
      <div style={{ padding: '14px 24px 10px' }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.5 }}>메모리배틀</div>
      </div>

      {/* 난이도 탭 — IDLE/RESULT에서 변경 가능 */}
      <div style={{ display: 'flex', gap: 8, padding: '0 24px' }}>
        {DIFFICULTIES.map(({ value, label, multiplier, color, glow }) => {
          const isSelected = selectedDifficulty === value
          return (
            <button
              key={value}
              onClick={() => canChangeDifficulty && setSelectedDifficulty(value)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 10,
                border: isSelected ? `1.5px solid ${color}` : '1.5px solid rgba(255,255,255,0.08)',
                backgroundColor: isSelected ? `${color}22` : 'rgba(255,255,255,0.03)',
                color: isSelected ? color : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 1.5,
                cursor: canChangeDifficulty ? 'pointer' : 'default',
                opacity: !canChangeDifficulty && !isSelected ? 0.35 : 1,
                lineHeight: 1.3,
                boxShadow: isSelected ? `0 0 12px ${glow}` : 'none',
                transition: 'all 150ms ease',
              }}
            >
              {label}<br />
              <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.7 }}>{multiplier}</span>
            </button>
          )
        })}
      </div>

      {/* 스테이지/상태 + 게임 패드를 하나의 flex:1 영역에 상하 배분 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* 스테이지/상태 — 40% 공간, 중앙 정렬 */}
        <div style={{
          flex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {stageArea()}
        </div>

        {/* 게임 패드 — 60% 공간, 상단 정렬 (패드가 자연스럽게 중앙보다 살짝 아래) */}
        <div style={{
          flex: 3,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingBottom: 16,
        }}>
          <ButtonPad
            flashingButton={flashingButton}
            clearingStage={clearingStage}
            countdown={countdown}
            disabled={status === 'SHOWING' || countdown !== null}
            status={status}
            score={score}
            onPress={handleInput}
            onStart={() => startGame(selectedDifficulty)}
            onRetry={() => retryGame(selectedDifficulty)}
          />
        </div>
      </div>

      {/* 광고 영역 */}
      <div style={{
        height: 96,
        backgroundColor: 'var(--ad-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        color: 'var(--ad-text)',
        flexShrink: 0,
      }}>
        AD
      </div>
    </div>
  )
}
