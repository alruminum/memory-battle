# 17. 콤보 인게임 UI

## 참고 문서

- UI 스펙: `docs/ui-spec.md` — 인게임 화면 섹션 (ComboIndicator, ButtonPad 글로우, FULL COMBO 영역)

---

## 결정 근거

- PRD v0.3 인게임 UX: 300ms 이내 연속 입력 중 "COMBO!" 텍스트 + 버튼 글로우, 풀콤보 확정 시 "FULL COMBO!" 메시지 + 사운드, 현재 콤보 스택 숫자 상시 표시.
- `ComboIndicator`를 독립 컴포넌트로 분리한다. `GamePage.tsx`는 store에서 `comboStreak`를 읽어 prop으로 전달.
- 버튼 글로우는 `ButtonPad.tsx`에 `comboActive: boolean` prop 추가. 기존 `isFlashing` 로직과 분리하여 단순하게 유지.
- "FULL COMBO!" 표시는 `clearingStage` 표시 영역을 활용 — 이미 스테이지 클리어 시점 UI가 있으므로 동일 위치에 조건 분기로 표시.
- 풀콤보 사운드는 기존 `playApplause()`를 활용 (이미 milestone 시 호출 중). 풀콤보가 아닌 milestone과 겹칠 수 있으나 허용 — 오히려 강화 효과.

---

## 생성/수정 파일

- `src/components/game/ComboIndicator.tsx` (신규) — 콤보 스택 상시 표시 + COMBO! 텍스트
- `src/components/game/ButtonPad.tsx` (수정) — `comboActive` prop 추가, 글로우 이펙트
- `src/pages/GamePage.tsx` (수정) — ComboIndicator 삽입, clearingStage 영역에 FULL COMBO 분기 추가

---

## 인터페이스 정의

### `ComboIndicator.tsx` Props

```typescript
interface ComboIndicatorProps {
  comboStreak: number    // 현재 연속 풀콤보 스트릭 (0이면 비표시)
  isComboActive: boolean // 현재 스테이지 내 300ms 이내 연속 입력 중 여부
}
```

### `ButtonPad.tsx` Props 추가분

```typescript
// 기존 props에 추가
interface ButtonPadProps {
  // ... 기존 props (flashingButton, clearingStage, countdown, disabled, status, score, onPress, onStart, onRetry)
  comboActive?: boolean  // true 시 버튼 외곽 글로우 강화
}
```

---

## 핵심 로직

### `ComboIndicator.tsx`

```typescript
export function ComboIndicator({ comboStreak, isComboActive }: ComboIndicatorProps) {
  if (comboStreak === 0 && !isComboActive) return null

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      minHeight: 48,  // 레이아웃 shift 방지
    }}>
      {/* 콤보 스택 숫자 (comboStreak > 0일 때 상시 표시) */}
      {comboStreak > 0 && (
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 13,
          fontWeight: 800,
          color: 'var(--vb-accent)',
          letterSpacing: 2,
        }}>
          {`x${Math.min(comboStreak + 1, 5)} COMBO STREAK`}
        </div>
      )}

      {/* COMBO! 텍스트 — 입력 중 300ms 이내 연속 입력 시 */}
      {isComboActive && (
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--vb-text-mid)',
          letterSpacing: 3,
          animation: 'pulse 0.3s ease-in-out',
        }}>
          COMBO!
        </div>
      )}
    </div>
  )
}
```

### `GamePage.tsx` — ComboIndicator 삽입 위치

```typescript
import { ComboIndicator } from '../components/game/ComboIndicator'
import { useGameStore } from '../store/gameStore'

// 컴포넌트 내부
const { status, score, stage, comboStreak } = useGameStore()
const { flashingButton, clearingStage, countdown, handleInput, startGame, retryGame, isComboActive } = useGameEngine()

// JSX: 스테이지/상태 영역과 버튼 패드 사이에 삽입
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 56 }}>
  <ComboIndicator comboStreak={comboStreak} isComboActive={isComboActive} />
</div>
```

### `useGameEngine.ts` — isComboActive 반환 추가

```typescript
// useCombo에서 isComboActive 상태 노출 필요
// useCombo.ts에 isActive: boolean 반환 추가

// useGameEngine return에 추가
return {
  flashingButton,
  clearingStage,
  countdown,
  handleInput,
  startGame,
  retryGame,
  timer,
  isComboActive: combo.isActive,  // 신규
}
```

### `useCombo.ts` — isActive 추가

```typescript
// 현재 useCombo는 comboCount ref만 사용. isActive는 state로 노출.
import { useRef, useCallback, useState } from 'react'

export function useCombo() {
  const lastInputTime = useRef<number | null>(null)
  const comboCount = useRef(0)
  const [isActive, setIsActive] = useState(false)  // 신규

  const recordInput = useCallback(() => {
    const now = Date.now()
    if (lastInputTime.current !== null && now - lastInputTime.current > COMBO_THRESHOLD) {
      comboCount.current = 0
      setIsActive(false)
    } else if (comboCount.current > 0) {
      setIsActive(true)
    }
    comboCount.current += 1
    lastInputTime.current = now
  }, [])

  const reset = useCallback(() => {
    lastInputTime.current = null
    comboCount.current = 0
    setIsActive(false)
  }, [])

  return { recordInput, checkFullCombo, reset, isActive }
}
```

### `GamePage.tsx` — FULL COMBO 분기 (clearingStage 영역)

```typescript
// stageArea() 내 clearingStage !== null 분기에 isFullCombo 판단 추가
// clearingStage 직후 isFullCombo를 알아야 하므로, useGameEngine에서 lastFullCombo 상태 노출

// 간단한 방법: clearingStage 표시 시 store의 fullComboCount 증가를 감지하거나
// useGameEngine에서 lastClearWasFullCombo: boolean 상태를 별도로 관리

// 구현: useGameEngine에서 isClearingFullCombo: boolean 상태 추가
const [isClearingFullCombo, setIsClearingFullCombo] = useState(false)

// round-clear 처리 시
const isFC = combo.checkFullCombo(clearedStage)
setIsClearingFullCombo(isFC)
useGameStore.getState().stageClear(isFC)
// setTimeout 후 clearingStage null로 설정 시 함께 리셋
setTimeout(() => {
  setIsClearingFullCombo(false)
  // ...
}, pauseMs)

// GamePage stageArea() clearingStage 분기
if (clearingStage !== null) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div ...>STAGE {clearingStage}</div>
      <div ...>{isClearingFullCombo ? 'FULL COMBO!' : 'CLEAR'}</div>
    </div>
  )
}
```

### `ButtonPad.tsx` — comboActive 글로우

```typescript
// 버튼 컨테이너에 box-shadow 강화
// comboActive 시 각 버튼 ring color opacity 증가
boxShadow: comboActive
  ? `0 0 16px 4px ${c.ring}, 0 6px 0 ${c.dim}88`
  : `0 6px 0 ${c.dim}88, 0 8px 16px rgba(0,0,0,0.4)`
```

---

## 주의사항

- `ComboIndicator`는 `comboStreak === 0 && !isComboActive` 일 때 `null` 반환. 레이아웃 shift 방지를 위해 감싸는 div에 `minHeight` 고정 필요.
- `isComboActive`는 `useCombo`의 React state로 관리. ref 기반 `comboCount`와 함께 사용하므로 렌더링 타이밍 주의 — `recordInput` 내에서 `setIsActive` 호출 시 즉시 리렌더 발생.
- "FULL COMBO!" 사운드는 기존 `playApplause()` 활용. `isMilestone` 체크와 무관하게 풀콤보 시 항상 재생하려면 `playApplause()`를 `isFC` 기준으로 분기.
- `useGameEngine`의 반환 타입에 `isComboActive`, `isClearingFullCombo`가 추가된다. `GamePage.tsx`에서 구조분해 시 추가 필요.
- `ButtonPad.tsx`의 `comboActive` prop은 optional(`comboActive?: boolean`) — 미전달 시 기존 동작 유지.
- **Stage 1~2에서 COMBO! 미표시는 의도한 동작이다.** `comboStreak`는 스테이지 클리어(풀콤보) 시에만 증가하므로 첫 번째 스테이지(버튼 1개)와 두 번째 스테이지(버튼 2개)를 클리어하기 전까지 `comboStreak === 0`이 유지된다. `ComboIndicator`는 `comboStreak === 0 && !isComboActive` 일 때 `null`을 반환하므로 자연스럽게 미표시된다. 버그로 오인 금지.
