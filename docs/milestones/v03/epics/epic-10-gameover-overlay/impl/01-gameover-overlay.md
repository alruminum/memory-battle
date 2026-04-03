# 01. 게임오버 오버레이

> 관련 이슈: [#45](https://github.com/alruminum/memory-battle/issues/45)

## 결정 근거

- **Variant C 채택 (backdrop blur + 바텀 패널 슬라이드업)**: 디자인 리뷰에서 선택된 최종 디자인. 화면 전체를 blur 처리하여 게임 UI를 배경으로 남기고, 이유 패널이 아래서 슬라이드업한다. 게임오버의 충격감과 이유 정보를 동시에 전달한다.
- **탭으로 결과 화면 전환 (자동 전환 X)**: 유저 요구사항. 자동 1초 전환 대신 유저가 탭하는 시점에 전환하므로 이유 텍스트를 충분히 읽을 수 있다.
- **shake 대상: GamePage 최상위 div**: 게임 화면 전체가 흔들려야 충격감이 전달됨. 개별 컴포넌트에 shake를 거는 방식보다 전체 컨테이너에 CSS class를 추가/제거하는 것이 단순하고 안정적이다.
- **gameOverReason을 store에 저장**: `useGameEngine`에서 local state로 관리하는 안과 비교했을 때, store 저장 방식이 `GameOverOverlay` 컴포넌트가 store를 직접 읽을 수 있어 prop drilling이 없다. resetGame() 시 null로 초기화되므로 상태 정합성도 유지된다.
- **`@supports (backdrop-filter)` 폴백**: backdrop-filter는 구형 WebView에서 미지원. 폴백으로 반투명 단색 배경(`rgba(14,14,16,0.88)`) 사용.

---

## 생성/수정 파일

- `src/store/gameStore.ts` (수정) — `gameOverReason` 필드 + `gameOver(reason)` 파라미터 추가
- `src/hooks/useGameEngine.ts` (수정) — `gameOver('timeout')` / `gameOver('wrong')` 호출, `gameOverReason` 반환값 추가
- `src/components/game/GameOverOverlay.tsx` (신규) — Variant C 오버레이 컴포넌트
- `src/index.css` (수정) — `@keyframes shake` 추가
- `src/pages/GamePage.tsx` (수정) — RESULT 자동전환 useEffect 제거, shake 클래스 적용, GameOverOverlay 렌더링

---

## 인터페이스 정의

### gameStore.ts 변경사항

```typescript
// types/index.ts 또는 gameStore.ts 내 정의
type GameOverReason = 'timeout' | 'wrong' | null

interface GameStore {
  // 기존 필드 유지
  status: GameStatus
  // ... (기존과 동일)

  // 신규 필드
  gameOverReason: GameOverReason

  // 변경: gameOver()에 reason 파라미터 추가
  gameOver: (reason: GameOverReason) => void

  // 변경: resetGame()에서 gameOverReason: null 초기화 포함
  resetGame: () => void
}
```

### GameOverOverlay.tsx

```typescript
interface GameOverOverlayProps {
  reason: 'timeout' | 'wrong'
  onConfirm: () => void  // 탭 시 호출 → GamePage에서 onGameOver() 호출
}

export function GameOverOverlay({ reason, onConfirm }: GameOverOverlayProps): JSX.Element
```

---

## 핵심 로직

### 1. gameStore.ts 수정

```typescript
// 초기값
gameOverReason: null,

// gameOver 액션 변경
gameOver: (reason) =>
  set((state) => ({
    status: 'RESULT',
    stage: state.sequence.length,
    gameOverReason: reason,
  })),

// resetGame에 gameOverReason: null 추가
resetGame: () =>
  set({
    // ... 기존 필드
    gameOverReason: null,
  }),

// startGame에도 gameOverReason: null 추가
startGame: () =>
  set({
    // ... 기존 필드
    gameOverReason: null,
  }),
```

### 2. useGameEngine.ts 수정

```typescript
// store에서 gameOverReason 구독 추가
const { status, sequence, stage, setSequence, addInput, gameOver, resetGame, gameOverReason } =
  useGameStore()

// 타이머 만료 시
const handleExpire = useCallback(() => {
  playGameOver()
  gameOver('timeout')   // 변경: 'timeout' reason 전달
}, [gameOver])

// 잘못된 입력 시 (handleInput 내부)
if (result === 'wrong') {
  timer.stop()
  playGameOver()
  gameOver('wrong')     // 변경: 'wrong' reason 전달
  return
}

// 반환값에 gameOverReason 추가
return {
  flashingButton,
  clearingStage,
  countdown,
  handleInput,
  startGame,
  retryGame,
  isClearingFullCombo,
  multiplierIncreased,
  gameOverReason,        // 신규 추가
}
```

### 3. GameOverOverlay.tsx 구조

```typescript
// 텍스트 매핑
const TEXTS = {
  timeout: {
    title: '타임오버',
    desc: '제한시간 내에 입력하지 못했어요',
  },
  wrong: {
    title: '잘못된 입력',
    desc: '틀린 버튼을 눌렀어요',
  },
} as const

export function GameOverOverlay({ reason, onConfirm }: GameOverOverlayProps): JSX.Element {
  const { title, desc } = TEXTS[reason]

  return (
    // 최상위: position fixed, inset 0, z-index 100, 탭 이벤트 캡처
    <div
      onClick={onConfirm}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        // @supports 폴백은 인라인 style로 처리 불가 → className으로 처리
        // fallback: rgba(14,14,16,0.88) 단색
        // support: backdrop-filter: blur(6px) + rgba(14,14,16,0.72)
        backgroundColor: 'rgba(14,14,16,0.88)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
      className="gameover-backdrop"
    >
      {/* 바텀 패널: 슬라이드업 애니메이션 */}
      <div
        className="gameover-panel"
        style={{
          backgroundColor: 'var(--vb-surface)',
          borderTop: '1px solid var(--vb-border)',
          borderRadius: '16px 16px 0 0',
          padding: '28px 24px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          // animation: translateY(60px)→0 + opacity 0→1, 0.25s
        }}
      >
        {/* 제목 */}
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 28,
          fontWeight: 900,
          color: 'var(--vb-accent)',   // #D4A843
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}>
          {title}
        </div>

        {/* 설명 */}
        <div style={{
          fontFamily: 'var(--vb-font-body)',
          fontSize: 14,
          color: 'var(--vb-text-mid)',
        }}>
          {desc}
        </div>

        {/* 힌트 */}
        <div style={{
          fontFamily: 'var(--vb-font-body)',
          fontSize: 12,
          color: 'var(--vb-text-dim)',
          marginTop: 20,
        }}>
          화면을 탭하여 계속
        </div>
      </div>
    </div>
  )
}
```

### 4. index.css 추가 keyframe + 클래스

```css
/* 게임오버 흔들림 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  12.5%    { transform: translateX(-6px); }
  25%      { transform: translateX(6px); }
  37.5%    { transform: translateX(-6px); }
  50%      { transform: translateX(6px); }
  62.5%    { transform: translateX(-6px); }
  75%      { transform: translateX(6px); }
  87.5%    { transform: translateX(-6px); }
}

.shake {
  animation: shake 0.5s ease-in-out;
}

/* 게임오버 backdrop */
.gameover-backdrop {
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  background-color: rgba(14, 14, 16, 0.72);
}

@supports not (backdrop-filter: blur(1px)) {
  .gameover-backdrop {
    background-color: rgba(14, 14, 16, 0.88);
  }
}

/* 바텀 패널 슬라이드업 */
@keyframes panel-slide-up {
  from {
    transform: translateY(60px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.gameover-panel {
  animation: panel-slide-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

### 5. GamePage.tsx 수정

```typescript
// 구조적 변경 요약

// (1) useGameEngine에서 gameOverReason 추가 구독
const {
  flashingButton, clearingStage, countdown, handleInput, startGame, retryGame,
  isClearingFullCombo, multiplierIncreased,
  gameOverReason,  // 신규
} = useGameEngine()

// (2) shake 상태 관리
const [isShaking, setIsShaking] = useState(false)

// (3) RESULT 자동전환 useEffect 제거 (기존 라인 107-113 삭제)
// 기존:
// useEffect(() => {
//   if (status === 'RESULT') { onGameOver() }
// }, [status])
//
// 신규: shake 트리거로 대체
useEffect(() => {
  if (status === 'RESULT') {
    setIsShaking(true)
    // shake 애니메이션 완료 후 class 제거 (0.5s)
    setTimeout(() => setIsShaking(false), 500)
  }
}, [status])

// (4) GamePage 최상위 div에 className 적용
<div
  className={isShaking ? 'shake' : ''}
  style={{
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'var(--vb-bg)',
    color: 'var(--vb-text)',
    fontFamily: 'var(--vb-font-body)',
  }}
>
  {/* ... 기존 내용 유지 ... */}

  {/* (5) 오버레이 조건부 렌더링: status === 'RESULT' && gameOverReason != null */}
  {status === 'RESULT' && gameOverReason != null && (
    <GameOverOverlay
      reason={gameOverReason}
      onConfirm={onGameOver}
    />
  )}
</div>
```

---

## 주의사항

- **Breaking Change — `gameOver()` 시그니처 변경**: `gameStore.ts`의 `gameOver: () => void`가 `gameOver: (reason: GameOverReason) => void`로 변경된다. `useGameEngine.ts` 2곳(라인 23, 133)에서 반드시 reason을 전달해야 한다. 누락 시 TypeScript 컴파일 에러 발생.
- **`resetGame` / `startGame` 초기화**: `gameOverReason: null` 추가를 누락하면 이전 게임의 reason이 잔류하여 새 게임 시작 후 오버레이가 표시되는 버그 발생 가능.
- **z-index 충돌**: `MultiplierBurst`는 outer z:100, inner z:101을 사용 중이다. `GameOverOverlay`는 `z-index: 200`으로 설정하여 MultiplierBurst 위에 렌더링되어야 한다. 게임오버 순간 MultiplierBurst가 표시 중일 가능성은 없으나(게임오버 시 clearingStage 시퀀스가 아니므로), 안전을 위해 200으로 지정한다.
- **탭 이벤트 vs 버튼 입력**: `GameOverOverlay`가 `position: fixed; inset: 0`으로 전체를 덮으므로 status === 'RESULT'인 동안 버튼 패드 입력은 자동으로 차단됨. 별도 guard 불필요.
- **`@supports` backdrop-filter**: CSS `@supports` 분기는 클래스 방식으로 처리한다. 인라인 style로는 `@supports` 적용 불가.
- **DB 영향도**: 없음. store 필드 추가이나 DB에 저장하지 않음. Supabase scores 테이블 변경 없음.

---

## 테스트 경계

- 단위 테스트 가능: 없음 (순수 함수 없음; store 액션 변경은 gameStore.test.ts에서 통합 테스트)
- 통합 테스트 필요:
  - `gameStore.gameOver('timeout')` 호출 후 `status === 'RESULT'`, `gameOverReason === 'timeout'` 확인
  - `gameStore.gameOver('wrong')` 호출 후 `gameOverReason === 'wrong'` 확인
  - `resetGame()` 호출 후 `gameOverReason === null` 확인
- 수동 검증:
  - INPUT 상태에서 타이머 만료 → shake 애니메이션 + "타임오버" 패널 슬라이드업 확인
  - INPUT 상태에서 잘못된 버튼 입력 → shake 애니메이션 + "잘못된 입력" 패널 슬라이드업 확인
  - 패널 표시 중 탭 → ResultPage로 전환 확인 (자동 전환 X)
  - 새 게임 시작 후 오버레이 미표시 확인 (잔류 상태 없음)
  - backdrop-filter 미지원 환경: 단색 배경으로 fallback 표시 확인
