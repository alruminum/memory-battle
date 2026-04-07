# 04. 카운트다운 힌트 hintPhase 750ms 전환 버그픽스

> 버그픽스 — 관련 이슈: [#62](https://github.com/alruminum/memory-battle/issues/62)  
> 원본 구현: [#52](https://github.com/alruminum/memory-battle/issues/52)  
> 설계 변경 근거 이슈: [#60](https://github.com/alruminum/memory-battle/issues/60)

---

## 결정 근거

- **현상**: `GamePage.tsx` `StageArea` 카운트다운 분기(L53–69)에 두 힌트 `<div>`가 항상 동시에 렌더링됨. `hintPhase` state 및 750ms `setTimeout` 로직이 미구현 상태.
- **원인**: 이슈 #60(순차 전환 방식 채택)에 따라 `01-countdown-hint.md`가 업데이트됐으나, engineer가 이전 버전(두 줄 동시 표시)을 구현한 채 반영하지 않음.
- **수정 방향**: `StageArea` 컴포넌트 안에 `useState<number>(0)`(hintPhase)와 `useEffect`(750ms 타이머)를 추가해 단일 힌트 문구를 순차 전환.
- **isCountingDown 파생 변수 채택**: `[countdown === null ? null : 'active']` 대신 `const isCountingDown = countdown !== null`를 의존성으로 사용. React 의존성 배열에서 삼항식보다 명시적 boolean이 가독성·ESLint 호환성 모두 우수.
- **`key={countdown}` 유지**: 힌트 블록 재마운트로 flipIn 애니메이션을 매 카운트 tick마다 재실행하는 기존 의도는 유지. hintPhase 로직과 독립적으로 동작.
- **버린 대안**: countdown 값(3 vs ≤2) 기준 분기 — countdown=3 구간이 500ms(COUNTDOWN_INTERVAL), countdown=2+1 구간 합이 1000ms로 불균등. 750ms 균등 분기 불가. 채택 불가.

---

## 생성/수정 파일

- `src/pages/GamePage.tsx` (수정) — `StageArea` 내부: hintPhase useState + useEffect 추가, 두 div → 단일 hintText div 교체
- `src/__tests__/epic11-ui-improvements.test.tsx` (신규 생성) — 카운트다운 힌트 fake timers TC

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

### `src/pages/GamePage.tsx` — StageArea 수정

현재 코드(버그):
```typescript
// GamePage.tsx L29 — StageArea, countdown 분기
function StageArea({ countdown, clearingStage, isPlaying, stage }: StageAreaProps): JSX.Element {
  if (countdown !== null) {
    return (
      <div ...>
        <div>{countdown}</div>
        <div />{/* 구분선 */}
        <div key={countdown} className="countdown-hint" ...>
          <div ...>깜빡이는 순서 그대로 눌러요</div>  {/* 항상 렌더링 */}
          <div ...>더 빠르면 콤보가 누적됩니다</div>    {/* 항상 렌더링 — 버그 */}
        </div>
      </div>
    )
  }
  // ...
```

수정 후:
```typescript
function StageArea({ countdown, clearingStage, isPlaying, stage }: StageAreaProps): JSX.Element {
  const [hintPhase, setHintPhase] = useState(0)
  const isCountingDown = countdown !== null

  useEffect(() => {
    if (!isCountingDown) return
    setHintPhase(0)
    const timer = setTimeout(() => setHintPhase(1), 750)
    return () => clearTimeout(timer)
  }, [isCountingDown])
  // isCountingDown: false→true 전환 시 1회 실행 (null→3 시작)
  // 3→2→1 tick에서는 isCountingDown이 계속 true이므로 재실행 없음
  // 1→null 전환 시 cleanup: clearTimeout

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

        {/* 단일 힌트 문구 — key로 매 tick 재마운트 → flipIn 재실행 */}
        <div key={countdown} className="countdown-hint" style={{ padding: '2px 0' }}>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--vb-text)',
            lineHeight: 1.5,
          }}>
            {hintText}
          </div>
          {/* hint-line2 div 없음 */}
        </div>
      </div>
    )
  }

  // clearingStage, isPlaying, idle 분기는 변경 없음
```

> **`useState`/`useEffect` 위치**: `StageArea` 함수 최상단 (return 이전). React Hooks 규칙: 조건문 안에 hooks 선언 불가.

---

### `src/__tests__/epic11-ui-improvements.test.tsx` — 신규 생성

```typescript
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useState, useEffect } from 'react'

// StageArea는 GamePage.tsx 내부 함수형 컴포넌트 → 직접 import 불가
// 로직을 미러링한 테스트 전용 컴포넌트 사용
function StageAreaPreview({ countdown }: { countdown: number | null }) {
  const [hintPhase, setHintPhase] = useState(0)
  const isCountingDown = countdown !== null

  useEffect(() => {
    if (!isCountingDown) return
    setHintPhase(0)
    const timer = setTimeout(() => setHintPhase(1), 750)
    return () => clearTimeout(timer)
  }, [isCountingDown])

  if (countdown !== null) {
    const hintText = hintPhase === 0
      ? '깜빡이는 순서 그대로 눌러요'
      : '더 빠르면 콤보가 누적됩니다'
    return (
      <div data-testid="countdown-block">
        <div data-testid="countdown-number">{countdown}</div>
        <div key={countdown} data-testid="countdown-hint">
          <div data-testid="hint-line1">{hintText}</div>
        </div>
      </div>
    )
  }
  return <div data-testid="no-countdown" />
}

// ─── [#62] 카운트다운 힌트 hintPhase 750ms 전환 ──────────────────────────────

describe('[#62] 카운트다운 힌트 hintPhase 750ms 전환', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('countdown 시작 직후 "깜빡이는 순서 그대로 눌러요"가 단독 렌더링된다', () => {
    render(<StageAreaPreview countdown={3} />)
    expect(screen.getByTestId('hint-line1')).toHaveTextContent('깜빡이는 순서 그대로 눌러요')
    expect(screen.queryByText('더 빠르면 콤보가 누적됩니다')).toBeNull()
  })

  it('750ms 경과 후 "더 빠르면 콤보가 누적됩니다"로 전환된다', () => {
    render(<StageAreaPreview countdown={3} />)
    act(() => { vi.advanceTimersByTime(750) })
    expect(screen.getByTestId('hint-line1')).toHaveTextContent('더 빠르면 콤보가 누적됩니다')
  })

  it('749ms 시점에서는 첫 번째 힌트가 유지된다', () => {
    render(<StageAreaPreview countdown={3} />)
    act(() => { vi.advanceTimersByTime(749) })
    expect(screen.getByTestId('hint-line1')).toHaveTextContent('깜빡이는 순서 그대로 눌러요')
  })

  it('hint-line2 노드는 어느 시점에도 존재하지 않는다', () => {
    render(<StageAreaPreview countdown={3} />)
    expect(screen.queryByTestId('hint-line2')).toBeNull()
    act(() => { vi.advanceTimersByTime(750) })
    expect(screen.queryByTestId('hint-line2')).toBeNull()
  })

  it('countdown=null 시 카운트다운 블록 전체가 렌더링되지 않는다', () => {
    render(<StageAreaPreview countdown={null} />)
    expect(screen.queryByTestId('countdown-block')).toBeNull()
    expect(screen.queryByTestId('hint-line1')).toBeNull()
  })

  it('countdown=1 시 숫자 "1"이 렌더링된다', () => {
    render(<StageAreaPreview countdown={1} />)
    expect(screen.getByTestId('countdown-number')).toHaveTextContent('1')
  })
})
```

---

## 주의사항

- **Hooks 선언 위치**: `useState`/`useEffect`는 `StageArea` 함수 최상단에 선언. `if (countdown !== null)` 분기 밖에 위치해야 React Hooks 규칙을 지킴.
- **기존 분기 영향 없음**: clearingStage, isPlaying, IDLE 분기 코드는 변경하지 않음.
- **`key={countdown}` 역할 불변**: flipIn 애니메이션 재실행 목적이며 hintPhase 타이머 로직과 독립적. 유지.
- **Breaking Change 없음**: `StageAreaProps` 인터페이스 변경 없음.
- **DB 영향도**: 없음.
- **테스트 파일 신규 생성**: `epic11-ui-improvements.test.tsx`가 기존에 존재하지 않으므로 신규 생성. `data-testid="hint-line1"`은 단일 div에 붙이므로 `hint-line2` testid는 사용하지 않음.

---

## 테스트 경계

- 단위 테스트 가능: `[#62]` describe 블록 전체 — 750ms 타이머 전환, hint-line2 부재 (vitest fake timers + React Testing Library)
- 통합 테스트 필요: 없음
- 수동 검증:
  - 게임 시작 → 카운트다운 0~750ms: "깜빡이는 순서 그대로 눌러요" 단독 표시 확인
  - 750ms 이후: "더 빠르면 콤보가 누적됩니다"로 전환 확인
  - 3→2, 2→1 tick 전환 시 힌트 문구 리셋 없음 확인 (타이머 재시작 없음)
  - 매 tick 전환 시 flipIn 애니메이션 재실행 확인
  - 카운트다운 종료 → SHOWING 페이즈 진입 시 힌트 사라짐 확인
