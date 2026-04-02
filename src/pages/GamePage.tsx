import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { useGameEngine } from '../hooks/useGameEngine'
import { useRanking } from '../hooks/useRanking'
import { getUserId } from '../lib/ait'
import { ButtonPad } from '../components/game/ButtonPad'
import { ComboIndicator } from '../components/game/ComboIndicator'
import { BannerAd } from '../components/ads/BannerAd'

interface GamePageProps {
  onGameOver: () => void
  onRanking: () => void
}

export function GamePage({ onGameOver, onRanking }: GamePageProps) {
  const { status, score, stage, comboStreak, userId, setUserId } = useGameStore()
  const { flashingButton, clearingStage, countdown, handleInput, startGame, retryGame, isComboActive, isClearingFullCombo } = useGameEngine()
  const ranking = useRanking(userId || null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const uid = await getUserId()
        setUserId(uid)
        ranking.refetch()
      } catch {
        // 실패 시 기본값 유지
      } finally {
        setIsInitializing(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status === 'RESULT') {
      onGameOver()
    }
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  const isPlaying = status === 'SHOWING' || status === 'INPUT'

  function handleStart() {
    startGame()
  }

  const rankLabel = (rank: number) => rank > 0 ? `#${rank}` : '#—'

  // 스테이지 영역 — IDLE 상태에서는 랭킹 뱃지 + 일간 기회 표시
  const stageArea = () => {
    if (countdown !== null) {
      return (
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 56,
          fontWeight: 900,
          color: 'var(--vb-accent)',
          lineHeight: 1,
          textShadow: '0 0 24px rgba(200,255,0,0.4)',
        }}>
          {countdown}
        </div>
      )
    }
    if (clearingStage !== null) {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--vb-font-score)',
            fontSize: 11,
            color: 'var(--vb-accent)',
            letterSpacing: 2,
          }}>STAGE {clearingStage}</div>
          <div style={{
            fontFamily: 'var(--vb-font-score)',
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--vb-accent)',
            letterSpacing: 1,
          }}>{isClearingFullCombo ? 'FULL COMBO!' : 'CLEAR'}</div>
        </div>
      )
    }
    if (isPlaying) {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--vb-font-score)',
            fontSize: 11,
            color: 'var(--vb-text-dim)',
            letterSpacing: 3,
            marginBottom: 4,
          }}>STAGE</div>
          <div style={{
            fontFamily: 'var(--vb-font-score)',
            fontSize: 56,
            fontWeight: 900,
            color: 'var(--vb-text)',
            lineHeight: 1,
          }}>{String(stage).padStart(2, '0')}</div>
        </div>
      )
    }
    // IDLE — 빈 공간 (랭킹은 HUD 스트립에 표시)
    return <div />
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--vb-bg)',
      color: 'var(--vb-text)',
      fontFamily: 'var(--vb-font-body)',
    }}>
      {/* 타이틀 */}
      <div style={{
        padding: '14px 20px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid var(--vb-border)',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 20,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}>
          <span style={{ color: 'var(--vb-accent)' }}>M</span>EMORY BATTLE
        </div>
      </div>

      {/* HUD 스트립 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        backgroundColor: 'var(--vb-surface)',
        borderBottom: '1px solid var(--vb-border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 8px', gap: 3 }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--vb-text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>SCORE</span>
          <span style={{ fontFamily: 'var(--vb-font-score)', fontSize: 22, fontWeight: 900, color: 'var(--vb-text)', lineHeight: 1 }}>{score.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 8px', gap: 3, borderLeft: '1px solid var(--vb-border)', borderRight: '1px solid var(--vb-border)' }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--vb-text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>STG</span>
          <span style={{ fontFamily: 'var(--vb-font-score)', fontSize: 22, fontWeight: 900, color: 'var(--vb-text)', lineHeight: 1 }}>{String(stage).padStart(2, '0')}</span>
        </div>
        <button
          onClick={onRanking}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 8px', gap: 3, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--vb-text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>DAILY</span>
          <span style={{ fontFamily: 'var(--vb-font-score)', fontSize: 22, fontWeight: 900, color: 'var(--vb-accent)', lineHeight: 1 }}>
            {ranking.isLoading ? '#—' : rankLabel(ranking.myRanks.daily)} ›
          </span>
        </button>
      </div>

      {/* 스테이지/상태 영역 */}
      <div style={{
        flex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {stageArea()}
      </div>

      {/* 콤보 인디케이터 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        flexShrink: 0,
      }}>
        <ComboIndicator comboStreak={comboStreak} isComboActive={isComboActive} />
      </div>

      {/* 버튼 패드 */}
      <div style={{
        flex: 3,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}>
        <ButtonPad
          flashingButton={flashingButton}
          clearingStage={clearingStage}
          countdown={countdown}
          disabled={status === 'SHOWING' || countdown !== null}
          status={status}
          score={score}
          onPress={handleInput}
          onStart={handleStart}
          onRetry={() => retryGame()}
          comboActive={isComboActive}
        />
      </div>

      {/* 타이머 바 */}
      <div style={{
        margin: '0 20px 8px',
        height: 4,
        backgroundColor: 'var(--vb-surface)',
        borderRadius: 2,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          width: isPlaying ? '65%' : '0%',
          height: '100%',
          backgroundColor: 'var(--vb-accent)',
          borderRadius: 2,
          boxShadow: '0 0 8px rgba(200,255,0,0.3)',
          transition: 'width 200ms linear',
        }} />
      </div>

      {/* 광고 배너 */}
      <div style={{ flexShrink: 0 }}>
        <BannerAd />
      </div>
    </div>
  )
}
