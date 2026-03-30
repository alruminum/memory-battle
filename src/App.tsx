import { useEffect, useState } from 'react'
import { useColorScheme } from './hooks/useColorScheme'
import { useGameStore } from './store/gameStore'
import { MainPage } from './pages/MainPage'
import { GamePage } from './pages/GamePage'
import { ResultPage } from './pages/ResultPage'
import { RankingPage } from './pages/RankingPage'

type Page = 'main' | 'game' | 'result' | 'ranking'

function App() {
  const scheme = useColorScheme()
  const { resetGame } = useGameStore()
  const [page, setPage] = useState<Page>('main')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', scheme)
  }, [scheme])

  useEffect(() => {
    // 앱 진입 시 히스토리 스택에 더미 엔트리 추가
    history.pushState(null, '', location.href)

    const handlePopState = () => {
      history.pushState(null, '', location.href) // 스택 유지
      setPage('main')
      resetGame()
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ height: '100dvh', overflow: 'hidden' }}>
      {page === 'main' && (
        <MainPage
          onStart={() => setPage('game')}
          onRanking={() => setPage('ranking')}
        />
      )}
      {page === 'game' && (
        <GamePage
          onGameOver={() => setPage('result')}
        />
      )}
      {page === 'result' && (
        <ResultPage
          onPlayAgain={() => {
            resetGame()
            setPage('game')
          }}
          onGoRanking={() => setPage('ranking')}
        />
      )}
      {page === 'ranking' && (
        <RankingPage
          onBack={() => setPage('main')}
        />
      )}
    </div>
  )
}

export default App
