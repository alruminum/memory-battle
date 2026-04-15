import { useEffect, useState } from 'react'
import { useColorScheme } from './hooks/useColorScheme'
import { useGameStore } from './store/gameStore'
import { GamePage } from './pages/GamePage'
import { ResultPage } from './pages/ResultPage'
import { RankingPage } from './pages/RankingPage'
import { suspendAudio, resumeAudio } from './lib/sound'

type Page = 'game' | 'result' | 'ranking'

function App() {
  const scheme = useColorScheme()
  const { resetGame } = useGameStore()
  const [page, setPage] = useState<Page>('game')
  const [previousPage, setPreviousPage] = useState<Page>('game')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', scheme)
  }, [scheme])

  useEffect(() => {
    history.pushState(null, '', location.href)

    const handlePopState = () => {
      history.pushState(null, '', location.href)
      setPage('game')
      resetGame()
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        suspendAudio()
      } else {
        resumeAudio()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      {page === 'game' && (
        <GamePage
          onGameOver={() => setPage('result')}
          onRanking={() => { setPreviousPage('game'); setPage('ranking') }}
        />
      )}
      {page === 'result' && (
        <ResultPage
          onPlayAgain={() => {
            resetGame()
            setPage('game')
          }}
          onGoRanking={() => { setPreviousPage('result'); setPage('ranking') }}
        />
      )}
      {page === 'ranking' && (
        <RankingPage
          onBack={() => setPage(previousPage)}
        />
      )}
    </div>
  )
}

export default App
