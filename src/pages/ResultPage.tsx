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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      padding: '32px 24px 24px',
      gap: 24,
    }}>
      {/* 점수 영역 */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: 'var(--text-muted)', marginBottom: 8 }}>
          FINAL SCORE
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>
          {score}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          STAGE {stage} · {difficulty}
        </div>
        {isNewBest && (
          <div style={{
            marginTop: 12,
            fontSize: 13,
            fontWeight: 700,
            color: '#FF6900',
          }}>
            🏆 최고 기록 갱신!
          </div>
        )}
      </div>

      {/* 랭킹 영역 */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <RankRow label="일간" rank={myRanks.daily} />
        <RankRow
          label="월간"
          rank={myRanks.monthly}
          sub={myRanks.monthly > 0 ? `${monthName}월 1일에 포인트 지급 예정` : undefined}
        />
        <RankRow label="시즌" rank={myRanks.season} />
      </div>

      {/* 버튼 영역 */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => !noChances && setShowModal(true)}
          disabled={noChances}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 14,
            border: 'none',
            backgroundColor: noChances ? 'rgba(255,255,255,0.08)' : '#FF6900',
            color: noChances ? 'var(--text-muted)' : '#fff',
            fontSize: 16,
            fontWeight: 800,
            cursor: noChances ? 'default' : 'pointer',
          }}
        >
          한 번 더 하기
        </button>
        {noChances && (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            오늘 플레이 기회를 모두 사용했습니다
          </div>
        )}
        <button
          onClick={onGoRanking}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.12)',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          랭킹 보기
        </button>
      </div>

      {/* 확인 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary, #1a1a1a)',
            borderRadius: 20,
            padding: '28px 24px',
            width: 'calc(100% - 48px)',
            maxWidth: 320,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              한 번 더 하기
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              광고를 보면 1회 추가됩니다
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handlePlayAgain}
                disabled={adLoading}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10,
                  border: 'none',
                  backgroundColor: '#FF6900',
                  color: '#fff', fontSize: 14, fontWeight: 700,
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

function RankRow({ label, rank, sub }: { label: string; rank: number; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
        {sub && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.6, marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: rank > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {rank > 0 ? `${rank}위` : '-'}
      </div>
    </div>
  )
}
