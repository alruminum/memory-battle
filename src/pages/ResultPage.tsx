import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useRanking } from '../hooks/useRanking'
import { useRewardAd } from '../hooks/useRewardAd'
import { useDailyReward } from '../hooks/useDailyReward'

interface ResultPageProps {
  onPlayAgain: () => void
  onGoRanking: () => void
}

export function ResultPage({ onPlayAgain, onGoRanking }: ResultPageProps) {
  const { score, stage, userId, baseScore, fullComboCount, maxComboStreak } = useGameStore()

  const comboBonus = score - baseScore
  const { daily, myRanks, isLoading, submitScore } = useRanking(userId)
  const { show: showAd, isLoading: adLoading } = useRewardAd()
  const { hasTodayReward, grantDailyReward } = useDailyReward()

  const submitted = useRef(false)
  const [adDone, setAdDone] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 점수 제출 (마운트 1회, isLoading 완료 후 isNewBest 판단)
  const prevBestRef = useRef<number | null>(null)
  const [isNewBest, setIsNewBest] = useState(false)

  useEffect(() => {
    if (submitted.current || !userId || isLoading) return
    submitted.current = true

    const prevBest = daily.find((e) => e.user_id === userId)?.best_score ?? 0
    prevBestRef.current = prevBest
    if (score > prevBest) setIsNewBest(true)

    submitScore(score, stage, userId)
  }, [userId, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // 마운트 시 리워드광고 자동 시작
  useEffect(() => {
    let cancelled = false

    async function startAd() {
      try {
        const earned = await showAd()
        if (cancelled) return
        if (earned && !hasTodayReward) {
          try {
            await grantDailyReward()
            showToastMsg('오늘의 10포인트 지급!')
          } catch {
            showToastMsg('포인트 지급 중 오류가 발생했습니다')
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
          <div style={{
            display: 'inline-block',
            marginTop: 14,
            padding: '4px 16px',
            borderRadius: 20,
            backgroundColor: 'rgba(200,255,0,0.1)',
            border: '1px solid var(--vb-accent)',
          }}>
            <span style={{
              fontFamily: 'var(--vb-font-score)',
              fontSize: 10,
              fontWeight: 800,
              color: 'var(--vb-accent)',
              letterSpacing: 2,
            }}>NEW PERSONAL BEST</span>
          </div>
        )}
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

      {/* 토스트 */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(20,20,20,0.92)',
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
