# 13. 라우팅

## 수정 파일
- `src/App.tsx`

---

## 방식: 상태 기반 전환 (React Router 미사용)

샘플 weekly-todo 패턴. 외부 의존성 없이 단순하게 처리.

```typescript
type Page = 'main' | 'game' | 'result' | 'ranking'

export function App() {
  const [page, setPage] = useState<Page>('main')

  if (page === 'main') return <MainPage onStart={() => setPage('game')} onRanking={() => setPage('ranking')} />
  if (page === 'game') return <GamePage onGameOver={() => setPage('result')} />
  if (page === 'result') return <ResultPage onPlayAgain={() => setPage('game')} onGoRanking={() => setPage('ranking')} />
  if (page === 'ranking') return <RankingPage onBack={() => setPage('main')} />
}
```

## 뒤로가기 처리

**채택 방식: 모든 뒤로가기 → main 이동 (MVP 단순화)**

앱인토스 WebView에서 네이티브 백버튼은 `popstate` 이벤트를 발생시킴.
상태 기반 라우팅은 브라우저 히스토리에 등록되지 않으므로, `history.back()`이 호출되면
미니앱 자체가 종료될 위험이 있음 → `popstate` 리스너에서 항상 main으로 복귀.

```typescript
// App.tsx 내 useEffect
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
}, [])
```

- game 화면 뒤로가기: 게임 즉시 중단 후 main 이동 (확인 모달 없음)
- result 화면 뒤로가기: main 이동
- ranking 화면 뒤로가기: main 이동

## onPlayAgain 콜백 처리 흐름

ResultPage의 `onPlayAgain()` 호출 시:
1. `resetGame()` 호출 (store 초기화 — status를 IDLE로, score/stage 리셋)
2. `setPage('game')` 호출
3. GamePage 마운트 시 store.difficulty가 이전 값 유지 → 같은 난이도로 즉시 시작 가능

> 난이도 변경을 원하면 `onGoMain()` 콜백으로 MainPage로 이동 필요.
> ResultPage에 "다른 난이도" 버튼은 MVP에서 제공하지 않음.

## GamePage → ResultPage 전환 트리거

GamePage 내부에서 `useGameStore`의 `status === 'RESULT'`를 감지하면 `onGameOver()` 콜백 호출:

```typescript
// GamePage.tsx
useEffect(() => {
  if (status === 'RESULT') {
    onGameOver()
  }
}, [status])
