import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useRanking } from '../hooks/useRanking'
import { useRewardAd } from '../hooks/useRewardAd'
import { useDailyChances } from '../hooks/useDailyChances'

interface ResultPageProps {
  onPlayAgain: () => void
  onGoRanking: () => void
}

export function ResultPage({ onPlayAgain, onGoRanking }: ResultPageProps) {
  const { score, stage, difficulty, userId, dailyChancesLeft } = useGameStore()
  const { daily, monthly, season, myRanks, submitScore } = useRanking(userId)
  const { show: showAd, isLoading: adLoading } = useRewardAd()
  const { addChance } = useDailyChances()

  const submitted = useRef(false)
  const [isNewBest, setIsNewBest] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (submitted.current || !userId) return
    submitted.current = true

    // 제출 전 기존 best 확인
    const prevBest = daily.find((e) => e.user_id === userId)?.best_score ?? 0
    if (score > prevBest) setIsNewBest(true)

    submitScore(score, stage, difficulty, userId)
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const noChances = dailyChancesLeft <= 0

  async function handlePlayAgain() {
    setShowModal(false)
    const earned = await showAd()
    if (!earned) return
    await addChance(userId)
    onPlayAgain()
  }

  const monthName = new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2

  const diffLabel = difficulty === 'EASY' ? 'EASY' : difficulty === 'MEDIUM' ? 'NORMAL' : 'HARD'

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
        }}>Stage {stage} ◆ {diffLabel}</div>

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
            sub: myRanks.monthly > 0 ? `${monthName}월 1일에 포인트 지급 예정` : undefined,
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

      {/* 버튼 영역 */}
      <div style={{
        marginTop: 'auto',
        padding: '0 20px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {noChances && (
          <div style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--vb-text-dim)',
            fontFamily: 'var(--vb-font-body)',
          }}>
            오늘 플레이 기회를 모두 사용했습니다
          </div>
        )}
        <button
          onClick={() => !noChances && setShowModal(true)}
          disabled={noChances}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 8,
            border: 'none',
            backgroundColor: noChances ? 'var(--vb-surface)' : 'var(--vb-accent)',
            color: noChances ? 'var(--vb-text-dim)' : '#0e0e10',
            fontFamily: 'var(--vb-font-score)',
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: 2,
            cursor: noChances ? 'default' : 'pointer',
            boxShadow: noChances ? 'none' : '0 4px 24px rgba(200,255,0,0.2)',
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

      {/* 확인 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            backgroundColor: 'var(--vb-surface)',
            borderRadius: 16,
            padding: '28px 24px',
            width: 'calc(100% - 48px)',
            maxWidth: 320,
            textAlign: 'center',
            border: '1px solid var(--vb-border)',
          }}>
            <div style={{
              fontFamily: 'var(--vb-font-score)',
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 1,
              color: 'var(--vb-text)',
              marginBottom: 8,
            }}>
              한 번 더 하기
            </div>
            <div style={{
              fontSize: 13,
              color: 'var(--vb-text-mid)',
              marginBottom: 24,
              fontFamily: 'var(--vb-font-body)',
            }}>
              광고를 보면 1회 추가됩니다
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 8,
                  border: '1px solid var(--vb-border)',
                  backgroundColor: 'transparent',
                  color: 'var(--vb-text-mid)',
                  fontSize: 14,
                  fontFamily: 'var(--vb-font-body)',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handlePlayAgain}
                disabled={adLoading}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'var(--vb-accent)',
                  color: '#0e0e10',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'var(--vb-font-body)',
                  cursor: adLoading ? 'default' : 'pointer',
                  opacity: adLoading ? 0.6 : 1,
                }}
              >
                {adLoading ? '로딩 중...' : '광고 보기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
