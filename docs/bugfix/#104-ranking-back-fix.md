---
depth: simple
---
# #104 버그픽스 — RankingPage 백버튼 클릭 시 ResultPage 대신 GamePage로 복귀

> 원래 이슈: [#104](https://github.com/alruminum/memory-battle/issues/104)

---

## 개요

ResultPage → RankingPage 진입 후 백버튼 클릭 시, ResultPage가 아닌 GamePage(SCORE 0, STG 01 초기 상태)로 복귀하는 라우팅 버그.

**근본 원인**: `App.tsx` L64 — `RankingPage`의 `onBack` 콜백이 `() => setPage('game')`으로 하드코딩되어 있어 진입 경로(ResultPage vs GamePage)에 무관하게 항상 `'game'`으로 이동함.

---

## 결정 근거

### D1 — 접근법 선택: `previousPage` 상태 추가 (채택)

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **Method A: `previousPage` 상태 (채택)** | `App.tsx`에 `useState<Page>('game')`으로 이전 페이지 기록. RankingPage 진입 시점에 세팅 | ✅ 채택 |
| Method B: `from` prop을 RankingPage에 전달 | `<RankingPage from="result" onBack={...}>` 형태로 진입 출처를 prop으로 내려줌 | ❌ 미채택 — RankingPage가 라우팅 책임을 갖게 됨. App이 단일 라우팅 주체여야 한다는 원칙 위반 |
| Method C: 브라우저 History API 활용 | `history.pushState`로 RankingPage 진입 시 스택 쌓고 popstate로 복귀 | ❌ 미채택 — 현재 App.tsx의 `popstate` 핸들러가 이미 `setPage('game') + resetGame()`으로 고정 (L24~26). 이를 변경하면 기존 Visibility API 핸들러(Epic 10/11)와 충돌 위험 |

**Method A 선택 근거**:
- 변경 범위가 `App.tsx` 단일 파일 3곳 (상태 추가 1, 콜백 수정 2)으로 최소화
- RankingPage·ResultPage·GamePage 컴포넌트 변경 불필요 — props interface 동결
- 초기값 `'game'`으로 설정해 GamePage에서 직접 진입하는 기존 동작 보장

### D2 — `popstate` 핸들러 미수정 결정

L20~31의 `popstate` 핸들러(`setPage('game') + resetGame()`)는 브라우저/토스앱 물리 백버튼 처리용.  
RankingPage의 `onBack`은 헤더 UI 백버튼으로 별개 경로다. `previousPage`는 이 UI 버튼에만 적용하며 `popstate` 핸들러는 건드리지 않는다.

---

## 수정 파일

- `src/App.tsx` (수정)

---

## App.tsx

### 수정 대상

#### 1. `previousPage` 상태 추가 (L14 직후)

**현행**
```tsx
const [page, setPage] = useState<Page>('game')
```

**변경 후**
```tsx
const [page, setPage] = useState<Page>('game')
const [previousPage, setPreviousPage] = useState<Page>('game')
```

---

#### 2. GamePage `onRanking` 콜백 — previousPage 세팅 (L50)

**현행**
```tsx
onRanking={() => setPage('ranking')}
```

**변경 후**
```tsx
onRanking={() => { setPreviousPage('game'); setPage('ranking') }}
```

---

#### 3. ResultPage `onGoRanking` 콜백 — previousPage 세팅 (L59)

**현행**
```tsx
onGoRanking={() => setPage('ranking')}
```

**변경 후**
```tsx
onGoRanking={() => { setPreviousPage('result'); setPage('ranking') }}
```

---

#### 4. RankingPage `onBack` 콜백 — previousPage로 복귀 (L64)

**현행**
```tsx
onBack={() => setPage('game')}
```

**변경 후**
```tsx
onBack={() => setPage(previousPage)}
```

---

### 최종 App.tsx JSX (변경 후 전체)

```tsx
type Page = 'game' | 'result' | 'ranking'

function App() {
  const scheme = useColorScheme()
  const { resetGame } = useGameStore()
  const [page, setPage] = useState<Page>('game')
  const [previousPage, setPreviousPage] = useState<Page>('game')

  // ... useEffect들 불변 ...

  return (
    <div style={{ height: '100dvh', overflow: 'hidden' }}>
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
```

---

## 주의사항

- **`RankingPage`·`ResultPage`·`GamePage` props interface 변경 없음** — 컴포넌트 수정 불필요
- **`popstate` 핸들러 유지** — 브라우저/토스앱 물리 백버튼은 여전히 `game` + `resetGame()` 동작 (의도된 동작)
- **초기값 `'game'`** — 앱 첫 진입 시 `page='game'`에서 직접 RankingPage로 가는 경우(현재 없으나) 안전하게 `game`으로 복귀

---

## 수동 검증

| ID | 시나리오 | 기대 동작 |
|---|---|---|
| MV-1 | 게임 오버 → ResultPage → "view 랭킹" → RankingPage → 백버튼 | ResultPage로 복귀 |
| MV-2 | GamePage에서 랭킹 버튼 → RankingPage → 백버튼 | GamePage로 복귀 (기존 동작 유지) |
| MV-3 | MV-1 후 ResultPage에서 "PLAY AGAIN" | 게임 정상 재시작 |
| MV-4 | MV-2 후 GamePage에서 다시 플레이 | GameOver 오버레이 없이 정상 플레이 |
