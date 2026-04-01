# 14. 난이도 시스템 제거

## 결정 근거

- PRD v0.3: 보상 구조가 랭킹 무관 방식으로 단순화되어 난이도 선택의 존재 의미가 없어졌다.
- 스테이지 기반 자동 난이도 커브(Story 15)가 대체제가 된다.
- `Difficulty` 타입을 먼저 제거해야 하위 스토리(16, 15)가 정확한 인터페이스로 작업 가능하다.

---

## 생성/수정 파일

- `src/types/index.ts` (수정) — `Difficulty` 타입 삭제
- `src/store/gameStore.ts` (수정) — difficulty 관련 상태/로직 제거
- `src/hooks/useGameEngine.ts` (수정) — startGame/retryGame 인자 제거, FLASH_DURATION 상수 제거
- `src/pages/MainPage.tsx` (수정) — 난이도 탭 UI 제거
- `src/pages/GamePage.tsx` (수정) — 난이도 탭 UI 제거
- `src/hooks/useRanking.ts` (수정) — submitScore difficulty 인자 제거
- `src/pages/ResultPage.tsx` (수정) — difficulty 참조 제거

---

## 인터페이스 정의

### `src/types/index.ts` 변경 후

```typescript
export type GameStatus = 'IDLE' | 'SHOWING' | 'INPUT' | 'RESULT'
export type ButtonColor = 'orange' | 'blue' | 'green' | 'yellow'
// Difficulty 타입 삭제됨
```

### `src/store/gameStore.ts` 변경 후 (이번 스토리 범위)

```typescript
// 삭제: DIFFICULTY_MULTIPLIER, calcFinalScore, difficulty 필드, isFullCombo 필드
// startGame 인자 제거
interface GameStore {
  status: GameStatus
  sequence: ButtonColor[]
  currentIndex: number
  score: number
  stage: number
  // difficulty: Difficulty  ← 삭제
  // isFullCombo: boolean    ← 삭제 (Story 16에서 대체 필드 추가)

  userId: string
  hasTodayReward: boolean

  setUserId: (id: string) => void
  setTodayReward: (value: boolean) => void
  setSequence: (seq: ButtonColor[]) => void
  startGame: () => void                     // difficulty 인자 제거
  addInput: (color: ButtonColor) => 'correct' | 'wrong' | 'round-clear'
  gameOver: () => void                      // isFullCombo 인자 제거
  resetGame: () => void
}
```

### `src/hooks/useRanking.ts` 변경 후 submitScore 시그니처

```typescript
submitScore: (score: number, stage: number, userId: string) => Promise<void>
```

---

## 핵심 로직

### `gameStore.ts` startGame

```typescript
startGame: () =>
  set({
    status: 'SHOWING',
    sequence: [],
    currentIndex: 0,
    score: 0,
    stage: 0,
    // difficulty 필드 없음
    // isFullCombo 필드 없음 (Story 16에서 comboStreak 등으로 대체)
  }),
```

### `gameStore.ts` gameOver

```typescript
// 배율 계산 제거. score는 이미 Story 16에서 스테이지 클리어 시점에 배율 적용되어 있음.
gameOver: () =>
  set((state) => ({
    status: 'RESULT',
    stage: state.sequence.length,
    // score: 변경 없음 (이미 누적된 값 그대로)
  })),
```

### `useGameEngine.ts` startGame / retryGame

```typescript
// 이전
const startGame = (diff: Difficulty) => launchAfterCountdown(diff)
const retryGame = (diff?: Difficulty) => { ... launchAfterCountdown(diff ?? ...) }

// 이후
const startGame = () => launchAfterCountdown()
const retryGame = () => { resetGame(); launchAfterCountdown() }

// launchAfterCountdown 내부에서 diff 참조 제거
// useGameStore.getState().startGame()  // 인자 없이
```

### `useGameEngine.ts` gameOver 호출 지점 2곳 수정

`gameOver(combo.checkFullCombo(...))` 호출이 현재 파일에 2곳 있다. **둘 다 `gameOver()` 인자 없이 변경해야 한다.**

| 위치 | 현재 코드 | 변경 후 |
|---|---|---|
| `handleExpire` 콜백 (32번 줄) | `gameOver(combo.checkFullCombo(useGameStore.getState().sequence.length))` | `gameOver()` |
| `handleInput` wrong 분기 (124번 줄) | `gameOver(combo.checkFullCombo(sequence.length))` | `gameOver()` |

```typescript
// handleExpire (32번 줄) — 타임아웃 시 호출
const handleExpire = useCallback(() => {
  if (useGameStore.getState().status !== 'INPUT') return
  if (clearingRef.current) return
  playGameOver()
  gameOver()  // ← combo.checkFullCombo 인자 제거
}, [gameOver])

// handleInput wrong 분기 (124번 줄) — 오답 시 호출
if (result === 'wrong') {
  playGameOver()
  gameOver()  // ← combo.checkFullCombo 인자 제거
  return
}
```

**주의**: `combo` 의존성도 `handleExpire`의 `useCallback` 배열에서 함께 제거한다.

### `MainPage.tsx` / `GamePage.tsx` 난이도 탭 제거

```typescript
// 삭제 대상
const DIFFICULTIES = [...]
const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(...)

// 난이도 탭 JSX 블록 전체 삭제
// onStart(selectedDifficulty) → onStart()
```

### `useRanking.ts` submitScore

`UseRankingReturn` 인터페이스 타입 선언(19번 줄)과 `submitScore` useCallback 구현부는 **별개로 수정**해야 한다. 둘 다 빠짐없이 변경한다.

```typescript
// 1) UseRankingReturn 인터페이스 (19번 줄) — 타입 선언 수정
interface UseRankingReturn {
  // ...
  submitScore: (score: number, stage: number, userId: string) => Promise<void>
  // difficulty 파라미터 제거
}

// 2) useCallback 구현부 — 파라미터 및 insert 필드 수정
const submitScore = useCallback(
  async (score: number, stage: number, uid: string) => {
    await supabase.from('scores').insert({
      user_id: uid,
      score,
      stage,
      // difficulty 필드 제거
    })
    await submitToGameCenter(score)
    await fetchAll()
  },
  [fetchAll]
)
```

`import type { Difficulty } from '../types'` (4번 줄)도 이 파일에서 제거한다.

### `ResultPage.tsx` difficulty 참조 제거

```typescript
// 삭제
const { score, stage, difficulty, userId } = useGameStore()
const diffLabel = difficulty === 'EASY' ? 'EASY' : ...

// 변경 후
const { score, stage, userId } = useGameStore()
// diffLabel 참조 삭제, "Stage {stage} ◆ {diffLabel}" → "Stage {stage}"

// submitScore 호출
submitScore(score, stage, userId)  // difficulty 제거
```

---

## 주의사항

- `import type { Difficulty } from '../types'` 를 사용하는 모든 파일에서 import 제거 필수.
  현재 확인된 파일: `useRanking.ts`, `useGameEngine.ts`, `MainPage.tsx`, `GamePage.tsx`, `ResultPage.tsx` (useGameStore 통해 간접 사용)
- `gameStore.ts`의 `resetGame`에서 `difficulty` 초기화 코드도 제거한다.
- Supabase `scores` 테이블의 `difficulty` 컬럼은 **NULL 허용으로 두는 것을 권장** — 기존 데이터와 호환, DDL 변경 없이 처리 가능.
- `GamePage.tsx`의 헤더 좌측 `diffLabel` 텍스트는 제거하거나 빈 공간으로 두어 레이아웃 균형 유지.
- `ButtonPad.tsx`에 onRetry prop으로 `() => retryGame(selectedDifficulty)` 전달 중 → `() => retryGame()` 로 변경.
