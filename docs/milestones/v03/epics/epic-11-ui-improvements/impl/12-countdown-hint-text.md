# 12. 카운트다운 힌트 문구 2줄 고정 표시

> 관련 이슈: [#82](https://github.com/alruminum/memory-battle/issues/82)

---

## 결정 근거

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **A. 2줄 고정 표시 (채택)** | `hintPhase` state + 750ms 타이머 완전 제거. 2줄 텍스트를 항상 렌더링. | 채택 |
| **B. 750ms 타이머 유지, 1번째→2번째 줄 순차 표시** | 기존 단일 줄 전환 방식. 이미 구현되어 있으나 요구사항(2줄 동시 표시)과 불일치. | 미채택 |
| **C. countdown 값(3/2/1)에 따른 분기** | countdown=3에서 줄 1, countdown=2~1에서 줄 2 표시. 노출 시간이 불균등하고 복잡도 증가. | 미채택 |

**A 채택 이유:**
- 요구사항이 "3초간 2줄 고정 문구"로 명확하므로 타이머 분기 자체가 불필요해짐.
- `hintPhase` state 및 `useEffect` 750ms 타이머 완전 제거 → 코드 단순화.
- `StageArea` 내부 변경만으로 완결. `StageAreaProps` 인터페이스 및 상위 컴포넌트 호출부 변경 없음.
- 테스트도 fake timers 불필요 → 단순 동기 렌더링 검증으로 교체 가능.

---

## 생성/수정 파일

- `src/pages/GamePage.tsx` (수정) — `StageArea`: `hintPhase` useState + useEffect 타이머 제거, 2줄 고정 텍스트 렌더링으로 교체
- `src/__tests__/StageArea.countdown.test.tsx` (수정) — `StageArea` 인라인 레플리카 + TC 갱신 (타이머 TC 제거 → 2줄 고정 TC 추가)

---

## 인터페이스 정의

`StageAreaProps` 변경 없음.

```typescript
interface StageAreaProps {
  countdown: number | null
  clearingStage: number | null
  isPlaying: boolean
  stage: number
}
```

---

## 핵심 로직

### `src/pages/GamePage.tsx` — StageArea 카운트다운 분기 수정

**제거 대상 (Before):**

```typescript
// 제거: hintPhase state + 타이머 useEffect
const [hintPhase, setHintPhase] = useState(0)
const isActive = countdown !== null

useEffect(() => {
  if (!isActive) return
  setHintPhase(0)
  const timer = setTimeout(() => setHintPhase(1), 750)
  return () => clearTimeout(timer)
}, [isActive])

// 제거: hintText 단일 줄 분기
const hintText = hintPhase === 0
  ? '깜빡이는 순서 그대로 눌러요'
  : '더 빠르면 콤보가 누적됩니다'

// 제거: key={hintPhase} + hintText 단일 div
<div key={hintPhase} className="countdown-hint" style={{ padding: '2px 0' }}>
  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--vb-text)', lineHeight: 1.5 }}>
    {hintText}
  </div>
</div>
```

**변경 후 (After):**

```typescript
// StageArea 내 state/useEffect 완전 제거 (hintPhase, isActive, 750ms 타이머 없음)

if (countdown !== null) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: 'auto auto auto',
      gap: 6,
      textAlign: 'center',
      padding: '12px 10px',
    }}>
      {/* 카운트 숫자 — key={countdown}: tick마다 교체 애니메이션 유지 (#64) */}
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
      <div style={{
        height: 1,
        background: 'var(--vb-border)',
        margin: '0 20px',
      }} />
      {/* 힌트 문구 블록 — 2줄 고정, 타이머 전환 없음 */}
      <div className="countdown-hint" style={{ padding: '2px 0' }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--vb-text)',
          lineHeight: 1.5,
        }}>
          깜빡이는 순서 그대로 누르세요
        </div>
        <div style={{
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--vb-text-dim)',
          lineHeight: 1.5,
          marginTop: 2,
        }}>
          상대방보다 더 빨리 눌러 콤보를 쌓고 고득점을 노리세요
        </div>
      </div>
    </div>
  )
}
```

> **`key={hintPhase}` 제거 이유**: 타이머 전환이 없으므로 `hintPhase` 자체가 없어진다. 힌트 블록은 countdown이 null→숫자로 전환될 때 마운트되는 시점에 `countdown-hint` 클래스의 `flipIn` 애니메이션이 1회 실행되면 충분.

> **`var(--vb-text-dim)` 사용 이유**: 2번째 줄은 보조 설명이므로 약간 dimmed 색상으로 시각 위계를 부여한다. `var(--vb-text)` 대비 명도 낮은 CSS 변수. 해당 변수가 없을 경우 `opacity: 0.65`로 대체.

### `src/__tests__/StageArea.countdown.test.tsx` — 레플리카 + TC 갱신

**인라인 레플리카 변경 (hintPhase 제거):**

```typescript
function StageArea({ countdown, clearingStage, isPlaying, stage }: StageAreaProps): React.JSX.Element {
  // hintPhase state 및 useEffect 제거 — 2줄 고정 표시
  if (countdown !== null) {
    return (
      <div>
        <div data-testid="countdown-number">{countdown}</div>
        <div data-testid="hint-line1">깜빡이는 순서 그대로 누르세요</div>
        <div data-testid="hint-line2">상대방보다 더 빨리 눌러 콤보를 쌓고 고득점을 노리세요</div>
      </div>
    )
  }
  if (clearingStage !== null) {
    return <div data-testid="clearing">CLEAR</div>
  }
  if (isPlaying && countdown === null) {
    return <div data-testid="playing">STAGE {String(stage).padStart(2, '0')}</div>
  }
  return <div data-testid="idle" />
}
```

**describe 블록 교체 방침:**

기존 `describe('[#61/#64] StageArea 카운트다운 힌트 버그픽스', ...)` 블록 전체를 아래로 교체한다.

```typescript
describe('[#82] StageArea 카운트다운 힌트 2줄 고정 표시', () => {
  it('TC1: countdown=3 시 1번째 힌트 문구가 렌더링된다', () => {
    render(<StageArea countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.getByTestId('hint-line1')).toHaveTextContent('깜빡이는 순서 그대로 누르세요')
  })

  it('TC2: countdown=3 시 2번째 힌트 문구가 렌더링된다', () => {
    render(<StageArea countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.getByTestId('hint-line2')).toHaveTextContent('상대방보다 더 빨리 눌러 콤보를 쌓고 고득점을 노리세요')
  })

  it('TC3: countdown=1 시 양쪽 힌트 문구 모두 표시된다', () => {
    render(<StageArea countdown={1} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.getByTestId('hint-line1')).toBeInTheDocument()
    expect(screen.getByTestId('hint-line2')).toBeInTheDocument()
  })

  it('TC4: countdown=null 시 hint-line1이 렌더링되지 않는다', () => {
    render(<StageArea countdown={null} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.queryByTestId('hint-line1')).toBeNull()
    expect(screen.queryByTestId('hint-line2')).toBeNull()
  })

  it('TC5: countdown 3→2 rerender 시 양쪽 힌트 문구 모두 유지된다', () => {
    const { rerender } = render(
      <StageArea countdown={3} clearingStage={null} isPlaying={false} stage={1} />
    )
    rerender(<StageArea countdown={2} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.getByTestId('hint-line1')).toHaveTextContent('깜빡이는 순서 그대로 누르세요')
    expect(screen.getByTestId('hint-line2')).toBeInTheDocument()
  })
})
```

> **기존 `[#61/#64]` 블록 제거 이유**: 해당 블록은 `hintPhase` 타이머 로직(750ms 전환) 검증을 위해 fake timers를 사용했다. 이번 변경으로 `hintPhase` 및 타이머 자체가 제거되므로 해당 TC들은 더 이상 실제 구현을 반영하지 않는다. 새 `[#82]` 블록의 동기 렌더링 TC로 완전 대체한다.

> **`[#66]` describe 블록 유지**: `isPlaying=true & countdown !== null` 경계 케이스 검증(TC6~TC8)은 이번 변경과 무관하므로 그대로 유지한다.

---

## 주의사항

- **Breaking Change 없음**: `StageAreaProps` 변경 없음. `GamePage`에서 `StageArea` 호출부 변경 없음.
- **`var(--vb-text-dim)` 존재 확인**: engineer가 구현 전 `src/index.css` 또는 `src/styles/` 내 해당 CSS 변수 존재 여부를 확인한다. 없을 경우 `color: 'var(--vb-text)', opacity: 0.65` 조합으로 대체.
- **`key={hintPhase}` 완전 제거**: 힌트 블록의 key prop을 제거하거나 `key={countdown}`으로 교체해도 기능상 차이 없음. countdown tick마다 flipIn이 재실행되는 것이 거슬린다면 key prop을 아예 제거한다.
- **`countdown-hint` 클래스 flipIn 유지**: `src/index.css`의 `@keyframes flipIn` 및 `.countdown-hint` 클래스는 그대로 유지. countdown 진입 시 2줄 블록 전체가 1회 flipIn하는 것은 기존 의도와 동일.
- **테스트 파일 수정 필수 (구현 순서)**:
  1. `src/__tests__/StageArea.countdown.test.tsx` — 인라인 레플리카에서 `hintPhase` useState + useEffect 제거, `hint-text` → `hint-line1` / `hint-line2` testid 분리
  2. `[#61/#64]` describe 블록 전체를 `[#82]` describe 블록으로 교체
  3. `src/pages/GamePage.tsx` — `StageArea` 내 hintPhase state/useEffect 제거 + 2줄 고정 렌더링
- **DB 영향도**: 없음. UI 전용 수정.
- **`useState` import 제거 가능성 검토**: `hintPhase` 제거 후 `StageArea` 내부에서 `useState`를 더 이상 사용하지 않으면 `import { useEffect, useRef, useState }` 에서 `useState` 제거 필요. GamePage 전체에서 `useState` 사용 여부를 engineer가 확인 후 처리.

---

## 테스트 경계

- **단위 테스트 가능**: `[#82]` describe 블록 — 2줄 고정 렌더링 검증 (동기, fake timers 불필요)
- **통합 테스트 필요**: 없음
- **수동 검증**:
  - 게임 시작 버튼 탭 → 카운트다운(3→2→1) 전 구간 동안 2줄 문구 동시 표시 확인 `(MANUAL)`
  - 카운트다운 종료(→null) 시 2줄 문구 즉시 사라짐 확인 `(MANUAL)`
  - clearingStage / isPlaying / IDLE 분기에 영향 없음 확인 (회귀 없음) `(MANUAL)`

---

## 수용 기준

| # | 항목 | 유형 |
|---|---|---|
| AC1 | countdown !== null 시 1번째 줄 "깜빡이는 순서 그대로 누르세요" 렌더링 | `(TEST)` |
| AC2 | countdown !== null 시 2번째 줄 "상대방보다 더 빨리 눌러 콤보를 쌓고 고득점을 노리세요" 렌더링 | `(TEST)` |
| AC3 | countdown=null 시 hint-line1, hint-line2 DOM 노드 모두 미존재 | `(TEST)` |
| AC4 | countdown 3→2→1 tick 변경 시 2줄 문구 변경 없이 유지 | `(TEST)` |
| AC5 | 카운트다운 진입 시 2줄 블록 전체에 flipIn 애니메이션 1회 실행 | `(BROWSER:DOM)` |
| AC6 | 카운트다운 종료 후 SHOWING 진입 시 힌트 2줄 즉시 사라짐 | `(MANUAL)` |
