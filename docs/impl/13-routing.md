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
- 앱인토스 네이티브 백버튼 → `history.back()` 또는 `setPage('main')`
- 필요 시 `window.addEventListener('popstate', ...)` 로 처리
