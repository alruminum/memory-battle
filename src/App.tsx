import { useEffect } from 'react'
import { GamePage } from './pages/GamePage'
import { useColorScheme } from './hooks/useColorScheme'

function App() {
  const scheme = useColorScheme()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', scheme)
  }, [scheme])

  return (
    <div style={{ height: '100dvh', overflow: 'hidden' }}>
      <GamePage />
    </div>
  )
}

export default App
