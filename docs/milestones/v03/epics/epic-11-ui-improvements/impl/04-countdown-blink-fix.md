# 04. 카운트다운 힌트 깜빡임 & 동시 표시 버그픽스

> 버그픽스 — 관련 이슈: [#61](https://github.com/alruminum/memory-battle/issues/61) + [#64](https://github.com/alruminum/memory-battle/issues/64)
> 원인 이슈: [#52](https://github.com/alruminum/memory-battle/issues/52) (countdown-hint 기능)

---

## 버그 근본 원인

### Bug #61 — 두 줄 동시 표시 + 4번 깜빡임

`src/pages/GamePage.tsx` L28~71의 `StageArea` 컴포넌트 `countdown !== null` 분기가
impl `01-countdown-hint.md`에서 설계한 `hintPhase` 타이머 로직 없이 두 힌트를 항상 동시에 렌더링.

```tsx
// 현재 코드 (잘못됨) — GamePage.tsx L53~69
<div key={countdown} className="countdown-hint">
  <div>깜빡이는 순서 그대로 눌러요</div>  {/* 항상 표시 */}
  <div>더 빠르면 콤보가 누적됩니다</div>  {/* 항상 표시 */}
</div>
```

`key={countdown}`을 사용하면 React가 key 변경을 감지해 div를 언마운트 후 재마운트.
`COUNTDOWN_INTERVAL=500ms`(현재 잘못된 값) 기준:
- t=0ms: 마운트 (key=3) → `flipIn` 1회
- t=500ms: 재마운트 (key=2) → `flipIn` 2회
- t=1000ms: 재마운트 (key=1) → `flipIn` 3회
- t=1500ms: 언마운트

결과: tick마다 `flipIn` + 두 줄 동시 표시 = **사용자가 4번 깜빡임으로 인식**

### Bug #64 — COUNTDOWN_INTERVAL 속도 오류 + 숫자 애니메이션 없음

두 개의 독립적 결함:

1. `src/hooks/useGameEngine.ts` L12: `COUNTDOWN_INTERVAL = 500` (사양: **750ms per tick**)
   - 카운트다운 총 시간: 1500ms (현재) vs 2250ms (사양)
   - PRD v0.3: "3→2→1 각 750ms 균등 전환" 명시

2. `src/pages/GamePage.tsx` L38~47: 카운트 숫자 div에 `key` 없음
   - 숫자 값 변경(3→2, 2→1) 시 React가 동일 DOM 노드 재사용 → 교체 애니메이션 없음

---

## 이전 구현 이력 (리버트됨)

- **commit 390a583**: 750ms 균등 전환 타이머 구현 시도
- **commit 74a0ca2**: 리버트 (`Revert "feat(combo): 카운트다운 힌트 750ms 균등 전환 타이머 구현"`)

리버트 이유 (74a0ca2 기준 실제 소스 상태로 확인):
- `COUNTDOWN_INTERVAL=500` 그대로 (Bug #64 미수정)
- 힌트 div에 `key={countdown}` 유지 (tick마다 재마운트 = 4번 깜빡임 미해결)
- `StageArea` 함수에 `useState`/`useEffect` 없음 (hintPhase 타이머 로직 미구현)
- ESLint 우회(`eslint-disable-next-line`) 방식 사용 → 잠재적 effect 버그 위험

이번 impl에서 위 모든 항목을 올바르게 수정한다.

---

## 결정 근거

### `isActive = countdown !== null` 패턴 채택

`useEffect` 의존성에 `countdown` 자체를 넣으면 3→2→1 tick마다 effect가 재실행되어
750ms 타이머가 리셋된다. boolean `isActive`는 null↔숫자 전환(false↔true)에만 반응하고
숫자 변화(3→2→1)에는 반응하지 않음.

- 버린 대안 A — `eslint-disable-next-line` 우회: 의존성 배열에서 `countdown` 제외 시
  React 동작은 맞지만 ESLint 경고가 의도적 결함 은폐 역할을 함. CI 환경에서 warning 누적.
- 버린 대안 B — `countdown === null ? null : 'active'` 문자열: 동작은 동일하나
  boolean `isActive`보다 의미 불명확. 타입도 `string | null`로 추론되어 혼란.

### `key={hintPhase}` 채택 (기존 `key={countdown}` 제거)

`key={hintPhase}`로 hintPhase가 0→1로 바뀌는 750ms 시점에만 `.countdown-hint` div를
재마운트 → `flipIn` 애니메이션 1회 재실행. 힌트 전환 시 자연스러운 등장 효과 유지.
tick(3→2→1) 전환 시에는 key가 변경되지 않으므로 재마운트 없음 → 깜빡임 제거.

- 버린 대안 — `key` 제거: flipIn이 처음 마운트 때만 실행되고 750ms 전환 시 재실행되지 않아
  힌트 전환이 시각적으로 구분되지 않음.

### 카운트 숫자 div에 `key={countdown}` 추가 (Bug #64)

숫자 자체는 tick마다 교체되어야 하므로 `key={countdown}`으로 3→2, 2→1 전환 시
DOM 재마운트 → CSS 등장 애니메이션(`@keyframes flipIn` 또는 `countdownPop`) 재실행.
힌트 div와 숫자 div를 명확히 분리: **숫자는 tick마다 key 변경, 힌트는 hintPhase 기준**.

### 두 번째 `<div>` 제거

hintPhase로 단일 텍스트를 전환하므로 두 번째 dim 줄 불필요. DOM 구조 단순화.

---

## 생성/수정 파일

- `src/hooks/useGameEngine.ts` (수정) — L12: `COUNTDOWN_INTERVAL` 500 → 750
- `src/pages/GamePage.tsx` (수정) — `StageArea` 함수: hooks 추가, 숫자 key, 힌트 단일 전환

---

## 인터페이스 정의

변경 없음. 기존 인터페이스 유지:

```typescript
interface StageAreaProps {
  countdown: number | null
  clearingStage: number | null
  isPlaying: boolean
  stage: number
}
```

`StageArea` 함수 내부에 hooks(`useState`, `useEffect`) 추가. 이미 `function StageArea(...)` 형태의
React 함수 컴포넌트이므로 hooks 사용 유효.
`useState`, `useEffect`는 `GamePage.tsx` L1에 이미 import되어 있으므로 추가 import 불필요.

---

## 핵심 로직

### 수정 1: `src/hooks/useGameEngine.ts` L12

```typescript
// Before
const COUNTDOWN_INTERVAL = 500  // ms per tick

// After
const COUNTDOWN_INTERVAL = 750  // ms per tick (사양: 750ms per tick → 총 2250ms)
```

### 수정 2: `src/pages/GamePage.tsx` — StageArea 함수

```typescript
function StageArea({ countdown, clearingStage, isPlaying, stage }: StageAreaProps): JSX.Element {
  // 추가: hintPhase 상태 + 750ms 타이머
  const [hintPhase, setHintPhase] = useState(0)
  const isActive = countdown !== null  // 3→2→1 tick에는 변화 없음, null↔숫자 전환에만 반응

  useEffect(() => {
    if (!isActive) return
    setHintPhase(0)
    const timer = setTimeout(() => setHintPhase(1), 750)
    return () => clearTimeout(timer)
  }, [isActive])

  if (countdown !== null) {
    const hintText = hintPhase === 0
      ? '깜빡이는 순서 그대로 눌러요'
      : '더 빠르면 콤보가 누적됩니다'

    return (
      <div style={{
        display: 'grid',
        gridTemplateRows: 'auto auto auto',
        gap: 6,
        textAlign: 'center',
        padding: '12px 10px',
      }}>
        {/* 카운트 숫자 — key={countdown}: tick마다 교체 애니메이션 (Bug #64) */}
        <div key={countdown} style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 72,
          fontWeight: 900,
          color: 'var(--vb-accent)',
          lineHeight: 1,
          textShadow: '0 0 40px rgba(212,168,67,0.3)',
        }}>
          {countdown}
        </div>

        {/* 수평 구분선 — 변경 없음 */}
        <div style={{
          height: 1,
          background: 'var(--vb-border)',
          margin: '0 20px',
        }} />

        {/* 힌트 문구 블록 — key={hintPhase}: 750ms 전환 시점에만 flipIn 재실행 (Bug #61) */}
        <div key={hintPhase} className="countdown-hint" style={{ padding: '2px 0' }}>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--vb-text)',
            lineHeight: 1.5,
          }}>
            {hintText}
          </div>
        </div>
      </div>
    )
  }

  // 이하 clearingStage, isPlaying, IDLE 분기 — 변경 없음
  if (clearingStage !== null) { /* ... */ }
  if (isPlaying) { /* ... */ }
  return <div />
}
```

### 기대 동작 타임라인 (COUNTDOWN_INTERVAL=750ms 기준)

| 시각 | 이벤트 | hintPhase | 표시 텍스트 | flipIn(힌트) | 숫자 교체 애니메이션 |
|---|---|---|---|---|---|
| 0ms | null→3 (isActive=true) | 0 | "깜빡이는 순서 그대로 눌러요" | ✓ (최초 마운트) | ✓ (key=3) |
| 750ms | 3→2 tick + hintPhase 0→1 | 1 | "더 빠르면 콤보가 누적됩니다" | ✓ (key=1 재마운트) | ✓ (key=2) |
| 1500ms | 2→1 tick | 1 (유지) | "더 빠르면 콤보가 누적됩니다" | ✗ (key 변화 없음) | ✓ (key=1) |
| 2250ms | 1→null (isActive=false) | — | 힌트 블록 미표시 | — | — |

**깜빡임: 4회 → 2회** (초기 등장 + 750ms 힌트 전환)

---

## 주의사항

- **hooks 추가 위치**: `StageArea` 함수 최상단에 `useState`/`useEffect` 추가 필수.
  `if (countdown !== null)` 분기 내부에 넣으면 Rules of Hooks 위반.
- **`import` 확인**: `useState`, `useEffect`가 이미 `GamePage.tsx` L1에서 임포트되어 있으므로
  추가 import 불필요.
- **Breaking Change 없음**: `StageAreaProps` 인터페이스 변경 없음. `GamePage` → `StageArea`
  호출부 변경 없음.
- **DB 영향도**: 없음. UI 전용 수정.
- **`isActive` 의존성 배열**: `countdown`을 직접 넣으면 3→2→1 tick마다 effect 재실행 →
  타이머 리셋 → 750ms 전환 타이밍 깨짐. 반드시 `[isActive]` 사용. ESLint 우회 금지.
- **clearingStage, isPlaying, IDLE 분기**: `StageArea` 함수 L73 이하 영향 없음.
- **타이밍 동기 주의**: `COUNTDOWN_INTERVAL=750ms`와 `setTimeout(() => setHintPhase(1), 750)`은
  동일 값이므로 3→2 tick과 hintPhase 0→1 전환이 거의 동시에 발생한다. 이는 의도된 동작.

---

## 테스트 경계

- **단위 테스트 가능**: `src/__tests__/StageArea.countdown.test.tsx` (신규 파일) — vitest fake timers + RTL

  ```typescript
  describe('[#61/#64] StageArea 카운트다운 힌트 버그픽스', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('TC1: countdown=3 시작 직후 첫 번째 힌트만 단독 표시', () => {
      render(<StageArea countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
      expect(screen.getByText('깜빡이는 순서 그대로 눌러요')).toBeInTheDocument()
      expect(screen.queryByText('더 빠르면 콤보가 누적됩니다')).toBeNull()
    })

    it('TC2: 749ms 시점에서도 첫 번째 힌트 유지', () => {
      render(<StageArea countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
      act(() => { vi.advanceTimersByTime(749) })
      expect(screen.getByText('깜빡이는 순서 그대로 눌러요')).toBeInTheDocument()
      expect(screen.queryByText('더 빠르면 콤보가 누적됩니다')).toBeNull()
    })

    it('TC3: 750ms 경과 후 두 번째 힌트로 전환, 첫 번째 없음', () => {
      render(<StageArea countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
      act(() => { vi.advanceTimersByTime(750) })
      expect(screen.getByText('더 빠르면 콤보가 누적됩니다')).toBeInTheDocument()
      expect(screen.queryByText('깜빡이는 순서 그대로 눌러요')).toBeNull()
    })

    it('TC4: countdown 3→2 rerender 시 hintPhase 리셋 없음 (isActive 패턴 검증)', () => {
      const { rerender } = render(
        <StageArea countdown={3} clearingStage={null} isPlaying={false} stage={1} />
      )
      act(() => { vi.advanceTimersByTime(750) })  // hintPhase=1
      rerender(<StageArea countdown={2} clearingStage={null} isPlaying={false} stage={1} />)
      // isActive는 여전히 true → effect 재실행 없음 → hintPhase=1 유지
      expect(screen.getByText('더 빠르면 콤보가 누적됩니다')).toBeInTheDocument()
    })

    it('TC5: countdown=null 시 힌트 블록 미표시', () => {
      render(<StageArea countdown={null} clearingStage={null} isPlaying={false} stage={1} />)
      expect(screen.queryByText('깜빡이는 순서 그대로 눌러요')).toBeNull()
      expect(screen.queryByText('더 빠르면 콤보가 누적됩니다')).toBeNull()
    })
  })
  ```

- **통합 테스트 필요**: 없음
- **수동 검증**: 수용 기준 MANUAL 항목 참조

---

## 수용 기준

| # | 항목 | 유형 |
|---|---|---|
| AC1 | 카운트다운 진입 직후(0~749ms) "깜빡이는 순서 그대로 눌러요" 단독 표시, 두 번째 줄 없음 | (TEST) TC1/TC2 |
| AC2 | 750ms 경과 후 "더 빠르면 콤보가 누적됩니다"로 전환, 첫 번째 텍스트 사라짐 | (TEST) TC3 |
| AC3 | countdown 3→2, 2→1 tick 변경 시 힌트 텍스트 깜빡임 없음 (key 변화 없음) | (TEST) TC4 |
| AC4 | countdown=null 시 힌트 블록 미표시 | (TEST) TC5 |
| AC5 | 카운트다운 총 시간 2250ms (750ms × 3) — 게임 시작 버튼 탭 후 초 측정 | (MANUAL) |
| AC6 | 카운트 숫자 3→2, 2→1 전환 시 교체 애니메이션 재실행 확인 | (MANUAL) |
| AC7 | 힌트 등장 횟수: 초기 표시 1회 + 750ms 전환 1회 = 총 2회 flipIn | (MANUAL) |
| AC8 | clearingStage / isPlaying / IDLE 분기 회귀 없음 (스테이지 클리어, 게임 진행, 대기 화면) | (MANUAL) |
