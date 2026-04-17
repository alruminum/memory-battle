import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useRanking } from '../hooks/useRanking'
import { useRewardAd } from '../hooks/useRewardAd'
import { useCoin } from '../hooks/useCoin'
import { randomCoinReward } from '../lib/gameLogic'
import { grantCoinExchange } from '../lib/ait'
import { CoinRewardBadge } from '../components/result/CoinRewardBadge'
import { NewRecordBadge } from '../components/result/NewRecordBadge'
import { PointExchangeButton } from '../components/result/PointExchangeButton'

const IS_SANDBOX = import.meta.env.DEV || import.meta.env.VITE_SANDBOX === 'true'

interface ResultPageProps {
  onPlayAgain: () => void
  onGoRanking: () => void
}

export function ResultPage({ onPlayAgain, onGoRanking }: ResultPageProps) {
  const { score, stage, userId, baseScore, fullComboCount, maxComboStreak,
    coinBalance  // [v0.4 F5] PointExchangeButton에 전달
  } = useGameStore()

  const comboBonus = score - baseScore
  const { daily, myRanks, isLoading, submitScore } = useRanking(userId)
  const { show: showAd, isLoading: adLoading } = useRewardAd()
  const { addCoins } = useCoin()
  const submitted = useRef(false)
  const [adDone, setAdDone] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [coinReward, setCoinReward] = useState<number | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 점수 제출 (마운트 1회, isLoading 완료 후 isNewBest 판단)
  const prevBestRef = useRef<number | null>(null)
  const [isNewBest, setIsNewBest] = useState(false)

  useEffect(() => {
    if (submitted.current || !userId || isLoading) return
    submitted.current = true

    const prevBest = daily.find((e) => e.user_id === userId)?.best_score ?? 0
    prevBestRef.current = prevBest

    const isNewRecord = score > prevBest
    if (isNewRecord) {
      setIsNewBest(true)
      // [v0.4 F3] 최고기록 코인 보상 — 첫 플레이(prevBest=0)도 포함, 동점 미처리
      addCoins(1, 'record_bonus').catch(() => {
        // 코인 적립 실패는 게임 흐름에 영향 없음 — 조용히 처리
        console.warn('[record-coin] addCoins failed — non-blocking')
      })
    }

    submitScore(score, stage, userId)
  }, [userId, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // 마운트 시 리워드광고 자동 시작
  useEffect(() => {
    let cancelled = false

    async function startAd() {
      try {
        const earned = await showAd()
        if (cancelled) return

        if (earned) {
          try {
            const rewardAmount = IS_SANDBOX ? 2 : randomCoinReward()
            await addCoins(rewardAmount, 'ad_reward')
            setCoinReward(rewardAmount)  // CoinRewardBadge 표시 트리거
          } catch {
            showToastMsg('코인 지급 중 오류가 발생했습니다')
          }
        }
      } catch {
        // 광고 실패 — 버튼 활성화만 진행
      } finally {
        if (!cancelled) setAdDone(true)
      }
    }

    startAd()

    return () => {
      cancelled = true
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function showToastMsg(msg: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(msg)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  async function handleExchange() {
    try {
      // 1. SDK 호출 — 성공 시에만 DB 차감
      await grantCoinExchange()
      // 2. 코인 차감 (DB 원자 처리)
      await addCoins(-10, 'toss_points_exchange')
      showToastMsg('🎉 10포인트 지급됐어요!')
    } catch (err) {
      console.error('[exchange] failed:', err)
      showToastMsg('교환 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요')
      // ⚠️ SDK 성공 후 addCoins 실패 시: 포인트 지급 완료 + 코인 미차감 상태
      // → 로그 기록 + "잠시 후 다시 시도" 안내. 완전한 롤백 불가 (SDK 비가역)
    }
  }


  const rankDisplay = (rank: number) => rank > 0 ? `#${rank}` : '#—'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--vb-bg)',
      color: 'var(--vb-text)',
      fontFamily: 'var(--vb-font-body)',
      animation: 'slide-up 0.5s ease-out',
    }}>
      {/* GAME OVER 텍스트 */}
      <div style={{
        padding: '20px 20px 0',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 12,
          fontWeight: 800,
          color: 'var(--vb-danger)',
          letterSpacing: 4,
          marginBottom: 4,
        }}>GAME OVER</div>
      </div>

      {/* 최종 점수 카드 */}
      <div style={{
        margin: '16px 20px 0',
        padding: '24px 0',
        backgroundColor: 'var(--vb-surface)',
        borderRadius: 12,
        border: '1px solid var(--vb-border)',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 11,
          color: 'var(--vb-text-dim)',
          letterSpacing: 3,
          marginBottom: 4,
        }}>FINAL SCORE</div>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 64,
          fontWeight: 900,
          color: 'var(--vb-text)',
          lineHeight: 1,
          letterSpacing: -1,
        }}>{score.toLocaleString()}</div>
        <div style={{
          fontFamily: 'var(--vb-font-body)',
          fontSize: 12,
          color: 'var(--vb-text-dim)',
          marginTop: 8,
        }}>Stage {stage}</div>

        {/* NEW PERSONAL BEST 배지 */}
        {isNewBest && (
          <div style={{ marginTop: 14 }}>
            <NewRecordBadge />
          </div>
        )}
      </div>


      {/* [v0.4] 코인 잔액 표시 */}
      <div style={{
        margin: '12px 20px 0',
        padding: '12px 16px',
        backgroundColor: 'var(--vb-surface)',
        borderRadius: 12,
        border: '1px solid var(--vb-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--vb-font-body)',
          fontSize: 12,
          color: 'var(--vb-text-dim)',
        }}>보유 코인</span>
        <span style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 20,
          fontWeight: 900,
          color: 'var(--vb-accent)',
        }}>🪙 {coinBalance}</span>
      </div>
      {/* COMBO STATS 카드 */}
      <div style={{
        margin: '12px 20px 0',
        padding: '16px',
        backgroundColor: 'var(--vb-surface)',
        borderRadius: 12,
        border: '1px solid var(--vb-border)',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 10,
          color: 'var(--vb-text-dim)',
          letterSpacing: 3,
          marginBottom: 12,
        }}>COMBO STATS</div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {[
            { label: 'BEST COMBO',  value: `${fullComboCount}` },
            { label: 'MULTIPLIER',  value: `${Math.floor(maxComboStreak / 5) + 1}x` },
            { label: 'COMBO BONUS', value: `+${comboBonus.toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{
                fontFamily: 'var(--vb-font-body)',
                fontSize: 9,
                color: 'var(--vb-text-dim)',
                letterSpacing: 1.5,
                marginBottom: 4,
              }}>{label}</div>
              <div style={{
                fontFamily: 'var(--vb-font-score)',
                fontSize: 18,
                fontWeight: 900,
                color: 'var(--vb-accent)',
              }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 랭킹 리스트 */}
      <div style={{
        margin: '16px 20px 0',
        backgroundColor: 'var(--vb-surface)',
        borderRadius: 12,
        border: '1px solid var(--vb-border)',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {[
          { label: 'Daily',   rank: myRanks.daily,   highlight: myRanks.daily > 0, sub: undefined },
          {
            label: 'Monthly',
            rank: myRanks.monthly,
            highlight: false,
            sub: undefined,
          },
          { label: 'Season',  rank: myRanks.season,  highlight: false, sub: undefined },
        ].map(({ label, rank, highlight, sub }, i, arr) => (
          <div key={label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            borderBottom: i < arr.length - 1 ? '1px solid var(--vb-border)' : 'none',
          }}>
            <div>
              <div style={{
                fontSize: 13,
                color: 'var(--vb-text-mid)',
                fontWeight: 600,
                fontFamily: 'var(--vb-font-body)',
              }}>{label}</div>
              {sub && (
                <div style={{
                  fontSize: 10,
                  color: 'var(--vb-text-dim)',
                  marginTop: 2,
                  fontFamily: 'var(--vb-font-body)',
                }}>{sub}</div>
              )}
            </div>
            <div style={{
              fontFamily: 'var(--vb-font-score)',
              fontSize: 20,
              fontWeight: 900,
              color: highlight ? 'var(--vb-accent)' : 'var(--vb-text)',
            }}>{rankDisplay(rank)}</div>
          </div>
        ))}
      </div>

      {/* 광고 placeholder */}
      <div
        data-testid="ad-placeholder"
        style={{
          margin: '12px 20px 0',
          height: 96,
          backgroundColor: '#1a1a1d',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          flexShrink: 0,
        }}
      />

      {/* 버튼 영역 */}
      <div style={{
        marginTop: 'auto',
        padding: '0 20px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {/* [v0.4 F5] 포인트 교환 버튼 — RevivalButton 없음 (F4는 GameOverOverlay 전용) */}
        <PointExchangeButton
          coinBalance={coinBalance}
          onExchange={handleExchange}
        />

        {/* 광고 로딩 중 표시 */}
        {adLoading && !adDone && (
          <div style={{
            textAlign: 'center',
            padding: '10px 0',
            fontSize: 13,
            color: 'var(--vb-text-dim)',
            fontFamily: 'var(--vb-font-body)',
          }}>
            광고 로딩 중...
          </div>
        )}

        <button
          onClick={onPlayAgain}
          disabled={!adDone}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 8,
            border: 'none',
            backgroundColor: adDone ? 'var(--vb-accent)' : 'var(--vb-border)',
            color: adDone ? '#0e0e10' : 'var(--vb-text-dim)',
            fontFamily: 'var(--vb-font-score)',
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: 2,
            cursor: adDone ? 'pointer' : 'default',
            boxShadow: adDone ? '0 4px 24px rgba(200,255,0,0.2)' : 'none',
            transition: 'background-color 0.2s, color 0.2s',
          }}
        >
          PLAY AGAIN
        </button>
        <button
          onClick={onGoRanking}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 8,
            border: '1px solid var(--vb-border)',
            backgroundColor: 'transparent',
            color: 'var(--vb-text-mid)',
            fontFamily: 'var(--vb-font-body)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          View Rankings
        </button>
      </div>

      {/* [v0.4] 코인 획득 float-up 애니메이션 */}
      {coinReward !== null && (
        <div
          className="coin-float-up"
          style={{
            position: 'fixed',
            bottom: 120,
            left: '50%',
            pointerEvents: 'none',
            fontFamily: 'var(--vb-font-score)',
            fontSize: 22,
            fontWeight: 900,
            color: 'var(--vb-accent)',
            whiteSpace: 'nowrap',
            zIndex: 201,
          }}
        >
          +{coinReward} 🪙
        </div>
      )}

      {/* 코인 적립 배지 */}
      {coinReward !== null && (
        <CoinRewardBadge
          amount={coinReward}
          onDismiss={() => setCoinReward(null)}
        />
      )}

      {/* 토스트 */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--vb-toast-bg)',
          color: 'var(--vb-text)',
          padding: '10px 20px',
          borderRadius: 24,
          fontSize: 13,
          fontFamily: 'var(--vb-font-body)',
          whiteSpace: 'nowrap',
          zIndex: 200,
          border: '1px solid var(--vb-border)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
