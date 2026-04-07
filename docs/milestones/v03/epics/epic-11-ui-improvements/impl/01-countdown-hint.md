# 01. 카운트다운 힌트 문구 표시

> 관련 이슈: [#52](https://github.com/alruminum/memory-battle/issues/52)

## 결정 근거

- **Variant C 스타일 채택**: 디자인 프리뷰(`design-preview-countdown-combo.html`)의 Variant C는 숫자를 크게 강조하고 구분선 아래 힌트를 배치하는 미니멀 레이아웃. 숫자가 주목성을 유지하면서 안내 정보를 함께 전달해 가독성이 가장 높다.
- **flipIn 애니메이션**: 힌트 문구에 `countFlipC` 기반 translateY+opacity 등장 애니메이션 적용. 카운트 숫자가 바뀔 때마다 힌트 블록도 함께 flipIn하여 숫자 전환에 시각적 연속성을 부여한다.
- **순차 전환 방식 채택** (Issue #60): 두 줄 동시 표시 대신 단일 문구를 전환하는 방식으로 변경. 이유:
  - countdown 값 분기 방식은 힌트 1이 500ms(countdown=3 구간), 힌트 2가 1000ms(countdown=2,1 구간)로 불균등.
  - `COUNTDOWN_INTERVAL=500ms`와 750ms가 맞지 않아 countdown 값만으로는 균등 분기 불가.
  - StageArea 내부 로컬 `useState` + `useEffect`로 750ms 타이머를 독립 관리하여 균등 표시 달성.
  - `useGameEngine` 인터페이스 변경 없음 (hintPhase를 상위 state로 올리지 않는 이유: 표시 로직이 StageArea 내부에 완전히 격리됨).
- **균등 표시를 위한 로컬 타이머 채택** (Issue #60 유저 요청): 힌트 1과 힌트 2를 각 0.75초(750ms)씩 균등 표시.
- **버린 대안** (countdown 값 분기 유지): countdown=3은 500ms, countdown=2,1은 1000ms로 불균등. 힌트 2가 의도보다 오래 표시됨.
- **`StageArea` 내부 수정**: 카운트다운 분기는 이미 `StageArea` 컴포넌트 안에 격리되어 있어 다른 분기(clearingStage, isPlaying)에 영향 없음. 별도 컴포넌트 추출 불필요.
- **버린 UI 대안**:
  - Variant A (pulse 애니메이션 + 슬라이드업 힌트): 애니메이션이 과잉. 제외.
  - Variant B (링 + 뱃지 힌트): 링 컴포넌트 추가 코드 복잡도가 높음. 제외.

---

## 생성/수정 파일

- `src/pages/GamePage.tsx` (수정) — `StageArea` 카운트다운 분기: 조건부 단일 힌트 문구로 교체
- `src/index.css` (수정 불필요) — `@keyframes flipIn` 및 `.countdown-hint` 클래스가 이미 구현되어 있음 (line 100~107). engineer 수정 대상에서 제외.
- `src/__tests__/epic11-ui-improvements.test.tsx` (수정) — `[#52]` describe 블록 TC 수정 (hint-line2 관련 TC 삭제·교체)

---

## 인터페이스 정의

`StageAreaProps` 변경 없음. 기존 `countdown: number | null` 사용.

```typescript
// 변경 없음 (isClearingFullCombo는 Epic 11 #53에서 이미 제거됨)
interface StageAreaProps {
  countdown: number | null
  clearingStage: number | null
  isPlaying: boolean
  stage: number
}
```

---

## 핵심 로직

### `src/index.css` — @keyframes flipIn 추가

```css
/* 카운트다운 힌트 문구 등장 */
@keyframes flipIn {
  0%  { opacity: 0; transform: translateY(-8px) scale(1.05); }
  40% { opacity: 1; transform: translateY(0) scale(1); }
  100%{ opacity: 1; transform: translateY(0) scale(1); }
}

.countdown-hint {
  animation: flipIn 0.45s ease forwards;
}
```

### `src/pages/GamePage.tsx` — StageArea 카운트다운 분기 수정

```typescript
// StageArea 컴포넌트 내부 — 로컬 타이머로 hintPhase 관리
const [hintPhase, setHintPhase] = useState(0)

useEffect(() => {
  if (countdown === null) return
  setHintPhase(0)
  const timer = setTimeout(() => setHintPhase(1), 750)
  return () => clearTimeout(timer)
}, [countdown === null ? null : 'active'])
// countdown이 null→숫자로 전환될 때만 발동. 3→2→1 tick에는 반응하지 않음.

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
      {/* 카운트 숫자 */}
      <div style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 72,
        fontWeight: 900,
        color: 'var(--vb-accent)',
        lineHeight: 1,
        textShadow: '0 0 40px rgba(212,168,67,0.3)',
      }}>
        {countdown}
      </div>

      {/* 수평 구분선 */}
      <div style={{
        height: 1,
        background: 'var(--vb-border)',
        margin: '0 20px',
      }} />

      {/* 힌트 문구 블록 — key로 hintPhase 값 전달. hintPhase 변경 시만 재마운트 → flipIn 재실행. countdown tick에는 반응하지 않음 */}
      <div key={hintPhase} className="countdown-hint" style={{ padding: '2px 0' }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--vb-text)',
          lineHeight: 1.5,
        }}>
          {hintText}
        </div>
        {/* 두 번째 dim 줄 제거 */}
      </div>
    </div>
  )
}
```

> **`key={hintPhase}` 사용 이유**: React는 key가 바뀌면 해당 요소를 언마운트 후 재마운트한다. hintPhase가 0→1로 전환될 때(750ms 타이머) 힌트 블록을 재마운트하여 `flipIn` 애니메이션을 실행한다. `key={countdown}`을 사용하면 countdown tick(3→2→1)마다 불필요하게 재마운트되어 총 4번 깜빡이는 버그가 발생한다(Issue #60).

> **`useEffect` 의존성 패턴**: `countdown === null ? null : 'active'`를 의존성으로 사용. countdown 숫자(3,2,1) 변화에는 반응하지 않고, null↔숫자 전환에만 반응하도록 설계. 타이머가 카운트다운 시작 시 한 번만 실행됨.

> **단일 div 구조**: 기존에는 두 개의 `<div>`(line1, line2)가 있었으나 단일 `<div>`로 줄어든다. `data-testid="hint-line2"` DOM 노드는 제거되므로 테스트 파일에서 해당 TC를 수정해야 한다.

### `src/__tests__/epic11-ui-improvements.test.tsx` — `[#52]` 블록 TC 수정

> **교체 범위**: `StageAreaPreview` 내 `countdown !== null` 분기 블록만 교체. `clearingStage`, `isPlaying`, idle 분기는 그대로 유지.

테스트 컴포넌트 `StageAreaPreview`를 아래와 같이 수정한다 (`useState`/`useEffect` 반영):

```typescript
function StageAreaPreview({ countdown, clearingStage, isPlaying, stage }) {
  const [hintPhase, setHintPhase] = useState(0)

  useEffect(() => {
    if (countdown === null) return
    setHintPhase(0)
    const timer = setTimeout(() => setHintPhase(1), 750)
    return () => clearTimeout(timer)
  }, [countdown === null ? null : 'active'])

  if (countdown !== null) {
    const hintText = hintPhase === 0
      ? '깜빡이는 순서 그대로 눌러요'
      : '더 빠르면 콤보가 누적됩니다'
    return (
      <div data-testid="countdown-block">
        <div data-testid="countdown-number">{countdown}</div>
        <div data-testid="countdown-divider" />
        <div key={hintPhase} className="countdown-hint" data-testid="countdown-hint">
          <div data-testid="hint-line1">{hintText}</div>
          {/* hint-line2 제거 */}
        </div>
      </div>
    )
  }
  // 나머지 분기(clearingStage, isPlaying, idle)는 그대로 유지
  // ...
}
```

유지할 TC (`[#52]` describe 블록에서 그대로 남길 것):
- `'countdown=3 시 숫자 "3"이 렌더링된다'`
- `'countdown=1 시 숫자 "1"이 렌더링된다'`
- `'countdown=null 시 힌트 문구가 렌더링되지 않는다'`
- `'countdown=null 시 카운트다운 블록 전체가 렌더링되지 않는다'`

삭제할 TC (더 이상 유효하지 않음):
- `'countdown !== null 시 두 번째 힌트 문구("더 빠르면 콤보가 누적됩니다")가 렌더링된다'`
- `'countdown=2 시 힌트 2줄이 모두 렌더링된다'`
- `'countdown !== null 시 첫 번째 힌트 문구("깜빡이는 순서 그대로 눌러요")가 렌더링된다'`
  → 이유: 로컬 타이머 방식으로 변경되어 countdown 값 단독 검증이 무효화됨. `[#60]` describe 블록 fake timers TC로 대체.

추가할 TC (수용 기준 항목에 대응 — fake timers 사용):

```typescript
describe('[#60] 카운트다운 힌트 750ms 타이머 전환 — StageArea', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('countdown 시작 직후 "깜빡이는 순서 그대로 눌러요"가 렌더링된다', () => {
    render(<StageAreaPreview countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.getByTestId('hint-line1')).toHaveTextContent('깜빡이는 순서 그대로 눌러요')
    expect(screen.queryByTestId('hint-line2')).toBeNull()
  })

  it('750ms 경과 후 "더 빠르면 콤보가 누적됩니다"로 전환된다', () => {
    render(<StageAreaPreview countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    act(() => { vi.advanceTimersByTime(750) })
    expect(screen.getByTestId('hint-line1')).toHaveTextContent('더 빠르면 콤보가 누적됩니다')
  })

  it('749ms에서는 아직 첫 번째 힌트가 유지된다', () => {
    render(<StageAreaPreview countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    act(() => { vi.advanceTimersByTime(749) })
    expect(screen.getByTestId('hint-line1')).toHaveTextContent('깜빡이는 순서 그대로 눌러요')
  })

  it('어떤 시점에서도 hint-line2 노드는 존재하지 않는다', () => {
    render(<StageAreaPreview countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.queryByTestId('hint-line2')).toBeNull()
    act(() => { vi.advanceTimersByTime(750) })
    expect(screen.queryByTestId('hint-line2')).toBeNull()
  })
})
```

---

## 수용 기준

- countdown 시작 직후(0ms) hintPhase=0 → "깜빡이는 순서 그대로 눌러요" 렌더링 `(TEST)`
- 750ms 경과 후 hintPhase=1 → "더 빠르면 콤보가 누적됩니다" 렌더링 `(TEST)` (vitest fake timers 사용)
- countdown=null 시 힌트 블록 전체 미표시 (회귀 없음) `(TEST)`
- 두 줄 동시 표시 없음 — hint-line2 DOM 노드가 어떤 상태에서도 존재하지 않음 `(TEST)`
- 카운트다운 3→2→1 전환 시 hintPhase 리셋 없음 (타이머 재시작 없음) `(MANUAL)`
- 카운트다운 종료(→null) 시 타이머 cleanup `(MANUAL)`

---

## 주의사항

- **Breaking Change 없음**: `StageAreaProps` 인터페이스 변경 없음. GamePage에서 `StageArea`를 호출하는 방식 변경 없음.
- **테스트 파일 수정 필수**: `src/__tests__/epic11-ui-improvements.test.tsx`의 `[#52]` describe 블록에서 `hint-line2` testid를 참조하는 TC 2개가 무효화됨. 해당 TC를 삭제하고 신규 `[#60]` describe 블록 TC로 교체해야 기존 통과 중인 테스트가 깨지지 않는다.
- **구현 순서 (테스트 파일 수정 포함)**:
  1. `src/__tests__/epic11-ui-improvements.test.tsx`의 `[#52]` describe 블록에서 삭제 대상 TC 3건을 먼저 제거 (hint-line2 TC가 남아 있으면 GamePage.tsx 수정 후 즉시 TC 실패 발생)
  2. `StageAreaPreview`에 `useState`/`useEffect` 추가 및 `hint-line2` 노드 제거
  3. `[#60]` describe 블록 추가
  4. `GamePage.tsx` StageArea 내부 수정
  5. `src/index.css` — 이미 존재하므로 수정 불필요 (위 생성/수정 파일 목록 참조)
- **폰트 CSS 변수**: `var(--vb-font-body)`를 힌트 문구에 별도 지정하지 않아도 `GamePage` 루트 div의 `fontFamily: 'var(--vb-font-body)'`를 상속받는다. 명시적 지정도 무방.
- **SHOWING 페이즈 전환**: `countdown`이 null이 되면 `useEffect` cleanup으로 타이머가 해제되고, StageArea의 if 분기 자체가 해당 블록을 렌더링하지 않음.
- **DB 영향도**: 없음.

---

## 테스트 경계

- 단위 테스트 가능: `[#60]` describe 블록 — 750ms 타이머 전환, hint-line2 부재 검증 (vitest fake timers + React Testing Library)
- 통합 테스트 필요: 없음
- 수동 검증:
  - 게임 시작 버튼 탭 → 0~750ms: "깜빡이는 순서 그대로 눌러요", 750~1500ms: "더 빠르면 콤보가 누적됩니다" 균등 표시 확인
  - 카운트다운 3→2→1 전환 시 힌트 문구가 리셋되지 않는지 확인 (타이머 재시작 없음)
  - 매 tick 전환 시 힌트 블록에 flipIn 애니메이션이 재실행되는지 확인
  - 카운트다운 종료 후 SHOWING 페이즈 진입 시 힌트 문구가 사라지는지 확인
  - clearingStage / isPlaying / IDLE 분기에 영향 없음 (회귀 없음) 확인
