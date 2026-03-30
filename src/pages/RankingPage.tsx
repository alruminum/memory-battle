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
  const myRankLabel = myRank > 0 ? `${myRank}위` : '순위권 밖'
  const showMyBar = Boolean(userId)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
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
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            fontSize: 22,
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          &#8592;
        </button>
        <div style={{ fontSize: 18, fontWeight: 800 }}>랭킹</div>
      </div>

      {/* 탭 */}
      <div style={{ padding: '8px 20px 12px', flexShrink: 0 }}>
        <RankingTab active={activeTab} onChange={handleTabChange} />
      </div>

      {/* 리스트 영역 (스크롤) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
        {isLoading ? (
          /* 스켈레톤 10행 */
          Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 44,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.05)',
                margin: '4px 0',
              }}
            />
          ))
        ) : error ? (
          /* 에러 상태 */
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
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              랭킹을 불러올 수 없습니다
            </div>
            <button
              onClick={() => doRefetch()}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              재시도
            </button>
          </div>
        ) : currentList.length === 0 ? (
          /* 빈 상태 */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60%',
              fontSize: 14,
              color: 'var(--text-muted)',
            }}
          >
            아직 기록이 없습니다
          </div>
        ) : (
          /* 랭킹 리스트 */
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
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '12px 20px',
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'var(--bg-primary)',
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
                color: 'var(--text-muted)',
                marginTop: 4,
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
