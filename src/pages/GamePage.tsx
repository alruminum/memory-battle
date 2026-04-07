import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useGameEngine } from '../hooks/useGameEngine'
import { useRanking } from '../hooks/useRanking'
import { getUserId } from '../lib/ait'
import { getFlashDuration, getComboMultiplier } from '../lib/gameLogic'
import { ButtonPad } from '../components/game/ButtonPad'
import { ComboIndicator } from '../components/game/ComboIndicator'
import { ComboTimer } from '../components/game/ComboTimer'
import { BannerAd } from '../components/ads/BannerAd'
import { MultiplierBurst } from '../components/game/MultiplierBurst'
import { GameOverOverlay } from '../components/game/GameOverOverlay'
import { FloatingScore, type FloatingItem } from '../components/game/FloatingScore'

// 타이틀·HUD strip을 GameOverOverlay(z-index 200) 위에 렌더링하여 backdrop-filter blur 영향에서 제외
const Z_ABOVE_OVERLAY = 201

function rankLabel(rank: number): string {
  return rank > 0 ? '#' + rank : '#—'
}

interface StageAreaProps {
  countdown: number | null
  clearingStage: number | null
  isPlaying: boolean
  stage: number
}

function StageArea({ countdown, clearingStage, isPlaying, stage }: StageAreaProps): JSX.Element {
  if (countdown !== null) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateRows: 'auto auto auto',
        gap: 6,
        textAlign: 'center',
        padding: '12px 10px',
      }}>
        {/* 카운트 숫자 — key={countdown}: tick마다 교체 애니메이션 유지 (#64) */}
        <div key={countdown} style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 72,
          fontWeight: 900,
          color: 'var(--vb-accent)',
          lineHeight: 1,
          textShadow: '0 0 40px rgba(212,168,67,0.3)',
        }}>
          {countdown}
        </div>
        <div style={{
          height: 1,
          background: 'var(--vb-border)',
          margin: '0 20px',
        }} />
        {/* 힌트 문구 블록 — 2줄 고정, 타이머 전환 없음 (#82) */}
        <div className="countdown-hint" style={{ padding: '2px 0' }}>
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--vb-text)',
            lineHeight: 1.5,
          }}>
            깜빡이는 순서 그대로 누르세요
          </div>
          <div style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--vb-text-mid)',
            lineHeight: 1.5,
            marginTop: 2,
          }}>
            상대방보다 더 빨리 눌러 콤보를 쌓고 고득점을 노리세요
          </div>
        </div>
      </div>
    )
  }
  if (clearingStage !== null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path
            d="M8 18 L15 25 L28 11"
            stroke="var(--vb-combo-ok)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="40"
            strokeDashoffset="40"
            style={{ animation: 'checkDraw 0.4s 0.1s ease forwards' }}
          />
        </svg>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 10,
          letterSpacing: 2,
          color: 'var(--vb-text-dim)',
        }}>STAGE {clearingStage}</div>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 18,
          fontWeight: 800,
          color: 'var(--vb-combo-ok)',
          letterSpacing: 2,
        }}>CLEAR</div>
      </div>
    )
  }
  if (isPlaying && countdown === null) {
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

interface GamePageProps {
  onGameOver: () => void
  onRanking: () => void
}

export function GamePage({ onGameOver, onRanking }: GamePageProps) {
  const { status, score, stage, comboStreak, userId, setUserId, sequenceStartTime } = useGameStore()
  const { flashingButton, clearingStage, countdown, handleInput, startGame, retryGame, multiplierIncreased, gameOverReason } = useGameEngine()
  const ranking = useRanking(userId || null)

  useEffect(() => {
    ;(async () => {
      try {
        const uid = await getUserId()
        setUserId(uid)
        ranking.refetch()
      } catch {
        // 실패 시 기본값 유지
      }
    })()
  // 마운트 1회만 실행. ranking.refetch를 deps에 추가하면 refetch 참조 변경마다 재실행되어 무한 루프 발생
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [isShaking, setIsShaking] = useState(false)
  const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([])
  const padWrapperRef = useRef<HTMLDivElement>(null)

  // RESULT 진입 시 shake 애니메이션 트리거 (자동 페이지 전환 제거 — 유저 탭으로 전환)
  useEffect(() => {
    if (status === 'RESULT') {
      setIsShaking(true)
      // shake 애니메이션 완료 후 class 제거 (0.5s)
      const tid = setTimeout(() => setIsShaking(false), 500) // index.css .shake animation-duration: 0.5s 와 동기화
      return () => clearTimeout(tid)
    }
  }, [status])

  const [showBurst, setShowBurst] = useState(false)
  useEffect(() => {
    if (multiplierIncreased) setShowBurst(true)
  }, [multiplierIncreased])

  const currentMultiplier = getComboMultiplier(comboStreak)

  const isPlaying = status === 'SHOWING' || status === 'INPUT'

  // ComboTimer 파생값: stage === 0 방어 (즉시 빨강 버그 방지)
  const flashDuration = getFlashDuration(stage)
  const computerShowTime = flashDuration * (stage > 0 ? stage : 1)

  const PAD_BTN_CENTERS: Record<ButtonColor, { relX: number; relY: number }> = {
    orange: { relX: 55,  relY: 55  },
    blue:   { relX: 237, relY: 55  },
    green:  { relX: 55,  relY: 237 },
    yellow: { relX: 237, relY: 237 },
  }

  function spawnFloatingScore(color: ButtonColor, multiplier: number) {
    if (!padWrapperRef.current) return
    const rect = padWrapperRef.current.getBoundingClientRect()
    const padLeft = rect.left + (rect.width - 292) / 2
    const padTop = rect.top
    const center = PAD_BTN_CENTERS[color]
    const x = padLeft + center.relX
    const y = padTop + center.relY
    const id = Date.now() + Math.random()
    setFloatingItems(prev => [...prev, { id, color, multiplier, x, y }])
    setTimeout(() => {
      setFloatingItems(prev => prev.filter(item => item.id !== id))
    }, 850)
  }

  function handleInputWithFloat(color: ButtonColor) {
    const { comboStreak } = useGameStore.getState()
    const multiplier = getComboMultiplier(comboStreak)
    const result = handleInput(color)
    if (result === 'correct' || result === 'round-clear') {
      spawnFloatingScore(color, multiplier)
    }
  }

  function handleStart() {
    startGame()
  }

  return (
    <div
      className={isShaking ? 'shake' : ''}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--vb-bg)',
        color: 'var(--vb-text)',
        fontFamily: 'var(--vb-font-body)',
        position: 'relative',
      }}
    >
      {/* 타이틀 */}
      <div style={{
        padding: '14px 20px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid var(--vb-border)',
        flexShrink: 0,
        position: 'relative',
        zIndex: Z_ABOVE_OVERLAY,
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
        position: 'relative',
        zIndex: Z_ABOVE_OVERLAY,
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
        <StageArea countdown={countdown} clearingStage={clearingStage} isPlaying={isPlaying} stage={stage} />
      </div>

      {/* 콤보 인디케이터 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        flexShrink: 0,
      }}>
        <ComboIndicator comboStreak={comboStreak} />
      </div>

      {/* 버튼 패드 */}
      <div
        ref={padWrapperRef}
        style={{
          flex: 3,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        <ButtonPad
          flashingButton={flashingButton}
          clearingStage={clearingStage}
          countdown={countdown}
          disabled={status === 'SHOWING' || countdown !== null}
          status={status}
          score={score}
          onPress={handleInputWithFloat}
          onStart={handleStart}
          onRetry={() => retryGame()}
        />
      </div>

      {/* 타임워치 */}
      <div style={{ flexShrink: 0, minHeight: 40 }}>
        <ComboTimer
          computerShowTime={computerShowTime}
          inputStartTime={sequenceStartTime}
          isActive={status === 'INPUT'}
        />
      </div>

      {/* 광고 배너 */}
      <div style={{ flexShrink: 0 }}>
        <BannerAd />
      </div>

      {/* 배율 상승 알림 오버레이 */}
      <MultiplierBurst
        multiplier={currentMultiplier}
        isVisible={showBurst}
        onComplete={() => setShowBurst(false)}
      />

      {/* Floating score 레이블 (정답 탭 시 버튼 위에서 상승) */}
      <FloatingScore items={floatingItems} />

      {/* 게임오버 오버레이: RESULT 상태이고 reason이 있을 때만 표시 */}
      {status === 'RESULT' && gameOverReason !== null && (
        <GameOverOverlay
          reason={gameOverReason}
          onConfirm={onGameOver}
        />
      )}
    </div>
  )
}
