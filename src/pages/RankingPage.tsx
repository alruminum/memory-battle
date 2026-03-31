import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { useRanking } from '../hooks/useRanking'
import { RankingTab } from '../components/ranking/RankingTab'
import { RankingRow } from '../components/ranking/RankingRow'

interface RankingPageProps {
  onBack: () => void
}

type TabKey = 'daily' | 'monthly' | 'season'

export function RankingPage({ onBack }: RankingPageProps) {
  const { userId } = useGameStore()
  const ranking = useRanking(userId || null)
  const { daily, monthly, season, myRanks, isLoading, error } = ranking
  const [activeTab, setActiveTab] = useState<TabKey>('daily')

  const doRefetch = useCallback(() => {
    ranking.refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ranking.refetch])

  useEffect(() => {
    doRefetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab)
    doRefetch()
  }

  const listMap: Record<TabKey, typeof daily> = {
    daily,
    monthly,
    season,
  }

  const currentList = listMap[activeTab].slice(0, 50)
  const myRank = myRanks[activeTab]
  const myEntry = listMap[activeTab].find((e) => e.user_id === userId)
  const myScore = myEntry?.best_score ?? 0
  const myRankLabel = myRank > 0 ? `#${myRank}` : '순위권 밖'
  const showMyBar = Boolean(userId)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--vb-bg)',
        color: 'var(--vb-text)',
        fontFamily: 'var(--vb-font-body)',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px 20px 8px',
          gap: 8,
          flexShrink: 0,
          borderBottom: '1px solid var(--vb-border)',
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--vb-text-mid)',
            fontSize: 22,
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          &#8592;
        </button>
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: 1,
          color: 'var(--vb-text)',
        }}>RANKINGS</div>
      </div>

      {/* 탭 */}
      <div style={{ padding: '12px 20px', flexShrink: 0 }}>
        <RankingTab active={activeTab} onChange={handleTabChange} />
      </div>

      {/* 리스트 영역 (스크롤) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 44,
                borderRadius: 6,
                background: 'var(--vb-surface)',
                border: '1px solid var(--vb-border)',
                margin: '4px 0',
              }}
            />
          ))
        ) : error ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60%',
              gap: 16,
            }}
          >
            <div style={{ fontSize: 14, color: 'var(--vb-text-mid)', fontFamily: 'var(--vb-font-body)' }}>
              랭킹을 불러올 수 없습니다
            </div>
            <button
              onClick={() => doRefetch()}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: '1px solid var(--vb-border)',
                backgroundColor: 'transparent',
                color: 'var(--vb-text)',
                fontSize: 14,
                fontFamily: 'var(--vb-font-body)',
                cursor: 'pointer',
              }}
            >
              재시도
            </button>
          </div>
        ) : currentList.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60%',
              fontSize: 14,
              color: 'var(--vb-text-dim)',
              fontFamily: 'var(--vb-font-body)',
            }}
          >
            아직 기록이 없습니다
          </div>
        ) : (
          currentList.map((entry) => (
            <RankingRow
              key={entry.user_id}
              rank={entry.rank}
              userId={entry.user_id}
              score={entry.best_score}
              isMe={entry.user_id === userId}
            />
          ))
        )}
      </div>

      {/* 하단 고정 내 순위 */}
      {showMyBar && (
        <div
          style={{
            flexShrink: 0,
            borderTop: '1px solid var(--vb-border)',
            padding: '12px 20px',
            backgroundColor: 'var(--vb-bg)',
          }}
        >
          <RankingRow
            rank={myRank}
            userId={userId}
            score={myScore}
            isMe={true}
          />
          {myRank === 0 && (
            <div
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--vb-text-dim)',
                marginTop: 4,
                fontFamily: 'var(--vb-font-body)',
              }}
            >
              {myRankLabel}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
