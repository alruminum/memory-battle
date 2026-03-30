import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { useDailyChances } from '../hooks/useDailyChances'
import { useRanking } from '../hooks/useRanking'
import { getUserId } from '../lib/ait'
import { DifficultySelector } from '../components/game/DifficultySelector'
import type { Difficulty } from '../types'

interface MainPageProps {
  onStart: () => void
  onRanking: () => void
}

export function MainPage({ onStart, onRanking }: MainPageProps) {
  const { userId, dailyChancesLeft, setUserId, difficulty, startGame } = useGameStore()
  const dailyChances = useDailyChances()
  const ranking = useRanking(userId || null)

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(difficulty)
  const [isInitializing, setIsInitializing] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    ;(async () => {
      setIsInitializing(true)
      try {
        const uid = await getUserId()
        setUserId(uid)
        await dailyChances.init(uid)
        ranking.refetch()
      } catch {
        showToast('랭킹 연동 실패. 오프라인 모드로 진행됩니다')
      } finally {
        setIsInitializing(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleStart() {
    const ok = dailyChances.consumeChance()
    if (!ok) return
    startGame(selectedDifficulty)
    onStart()
  }

  const noChances = dailyChancesLeft <= 0
  const startDisabled = isInitializing || noChances

  const rankLabel = (rank: number, loading: boolean) => {
    if (loading) return '—위'
    if (rank === 0) return '—위'
    return `${rank}위`
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '0 24px',
      }}
    >
      {/* 타이틀 */}
      <div style={{ paddingTop: 48, paddingBottom: 32, textAlign: 'center' }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: -1,
            color: 'var(--text-primary)',
          }}
        >
          기억력배틀
        </div>
      </div>

      {/* 랭킹 뱃지 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {(
          [
            { label: '일간', rank: ranking.myRanks.daily },
            { label: '월간', rank: ranking.myRanks.monthly },
            { label: '시즌', rank: ranking.myRanks.season },
          ] as const
        ).map(({ label, rank }) => (
          <div
            key={label}
            style={{
              textAlign: 'center',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              padding: '10px 20px',
              minWidth: 72,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: 'var(--text-primary)',
              }}
            >
              {rankLabel(rank, ranking.isLoading)}
            </div>
          </div>
        ))}
      </div>

      {/* 오늘 플레이 가능 횟수 */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 24,
          fontSize: 13,
          color: 'var(--text-muted)',
        }}
      >
        {isInitializing
          ? '로딩 중...'
          : `오늘 ${dailyChancesLeft}번 플레이 가능`}
      </div>

      {/* 난이도 선택 */}
      <div style={{ marginBottom: 32 }}>
        <DifficultySelector value={selectedDifficulty} onChange={setSelectedDifficulty} />
      </div>

      {/* 시작 버튼 */}
      <button
        onClick={handleStart}
        disabled={startDisabled}
        style={{
          width: '100%',
          padding: '16px 0',
          borderRadius: 14,
          border: 'none',
          backgroundColor: startDisabled ? 'rgba(255,255,255,0.08)' : '#FF6900',
          color: startDisabled ? 'var(--text-muted)' : '#fff',
          fontSize: 16,
          fontWeight: 900,
          letterSpacing: 1,
          cursor: startDisabled ? 'default' : 'pointer',
          transition: 'all 150ms ease',
          boxShadow: startDisabled ? 'none' : '0 0 20px #FF690055',
        }}
      >
        {isInitializing ? '로딩 중...' : '시작하기'}
      </button>

      {/* 랭킹 버튼 */}
      <button
        onClick={onRanking}
        style={{
          width: '100%',
          marginTop: 12,
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

      {/* 기회 소진 안내 */}
      {noChances && !isInitializing && (
        <div
          style={{
            textAlign: 'center',
            marginTop: 12,
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          오늘 기회를 모두 사용했어요. 내일 다시 오세요
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.85)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 10,
            fontSize: 13,
            whiteSpace: 'nowrap',
            zIndex: 9999,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
