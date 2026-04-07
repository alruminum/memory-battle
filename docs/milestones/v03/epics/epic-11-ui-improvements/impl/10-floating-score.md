# 10. 버튼 탭 시 Floating Score 애니메이션 (Variant B)

> 관련 이슈: [#78](https://github.com/alruminum/memory-battle/issues/78)

---

## 결정 근거

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **Variant B (채택)** | 탭한 버튼 고유색 연동 + 배율별 크기 계단. x1=흰색 20px → x5=44px+강한 글로우. 곡선 상승 궤적(scale 팝 포함). 800ms. | 채택 |
| Variant A — 심플 Float-Up | 흰색 22px 고정, 700ms 직선 상승. 최소 노이즈이나 배율 피드백 없음. | 미채택 — 배율 성장 시각화 부재 |
| Variant C — 파티클+링 | 링 확산 + 미니 파티클 방사. 빠른 연속 탭 시 파티클 과밀, 기존 MultiplierBurst 파티클과 시각 충돌 가능. | 미채택 — 노이즈 과다 |

**Variant B 채택 이유:**
- 탭한 버튼 색상 → floating label 색상 연동으로 어느 버튼을 탭했는지 직관적 확인
- 배율별 크기 계단(20→26→32→38→44px)이 콤보 성장 체감을 강화하면서 기존 ComboIndicator 블록 UI와 피드백 계층 분리
- 기존 MultiplierBurst(배율 상승 순간 이벤트)와 역할이 다름 — Floating Score는 매 탭마다 즉각적 점수 피드백

**컴포넌트 배치 결정 — ButtonPad 레벨 vs GamePage 레벨:**
- GamePage 레벨 채택: ButtonPad는 순수 입력 UI 역할을 유지. floating 애니메이션의 생명주기(생성~소멸)를 GamePage에서 단일 관리. 버튼 좌표를 GamePage에서 절대좌표로 계산하면 ButtonPad 내부 DOM에 의존하지 않아도 됨.
- ButtonPad 레벨 미채택: ButtonPad가 상태(floatingItems 배열)를 직접 관리하면 ButtonPad의 단일 책임 원칙(입력 처리) 위반. ButtonPad Props 인터페이스 확장 필요.

**좌표 계산 방식 — 상수 계산 vs DOM ref 측정:**
- 상수 계산 채택: ButtonPad가 항상 `position: relative`인 292×292px 컨테이너 내 고정 위치에 렌더링되므로 (`CORNER_BUTTONS` 상수에서 top/bottom/left/right=0, BTN=110px) 버튼 중심 좌표를 상수로 도출 가능. ref 측정 없이 구현 가능하고 reflow 없음.
- 버튼 중심(패드 기준): orange=(55, 55), blue=(237, 55), green=(55, 237), yellow=(237, 237) — 버튼 반지름 55px가 center.
- 실제 GamePage에서 ButtonPad wrapper는 `flex: 3 / alignItems: flex-start / justifyContent: center`이므로, floating layer는 ButtonPad 컨테이너 기준 좌표 사용. ButtonPad wrapper div에 `ref`를 달아 getBoundingClientRect로 실제 offset을 구한 뒤 GamePage root 기준 절대좌표로 변환.

**상태 관리 — React state 배열:**
- `FloatingItem[]` 배열을 `useState`로 관리. 각 item에 고유 id(Date.now() + Math.random())를 부여해 key로 사용.
- 800ms setTimeout으로 자동 제거 — AnimationEvent를 쓸 수도 있으나 onAnimationEnd 콜백이 컴포넌트 언마운트 후 호출되는 케이스에서 state 업데이트 오류 가능. useEffect cleanup으로 setTimeout을 취소하는 방식이 더 안전.

**오답 시 미표시:**
- `handleInput`의 return 값이 `'wrong'`일 때는 `addFloatingScore`를 호출하지 않음. addInput 내부의 multiplier 계산 코드에 의존하지 않고 GamePage의 `handleInput` 내에서 조건 분기.

**버린 대안 — store에서 lastScoredItem 노출:**
- gameStore에 `lastScoredItem: { color, multiplier, id }` 필드를 추가하고 GamePage에서 구독하는 방식 검토. 그러나 UI 전용 일시 상태(ephemeral UI state)를 게임 도메인 store에 혼입하는 것은 관심사 분리 위반. 채택 안 함.

---

## 생성/수정 파일

- `src/components/game/FloatingScore.tsx` (신규) — floating "+N" 레이블 렌더러
- `src/pages/GamePage.tsx` (수정) — handleInput에서 FloatingScore state 관리 + 렌더링
- `src/index.css` (수정) — `@keyframes vb-float` + `@keyframes vb-glow-pulse` 추가

---

## 인터페이스 정의

```typescript
// src/components/game/FloatingScore.tsx

export interface FloatingItem {
  id: number          // Date.now() + Math.random() 으로 생성, React key로 사용
  color: ButtonColor  // 탭한 버튼 색상 — CSS 변수 매핑에 사용
  multiplier: number  // 현재 배율 (1~N) — 크기 + 색상 계단에 사용
  x: number           // GamePage root 기준 left px (버튼 중심 X)
  y: number           // GamePage root 기준 top px (버튼 중심 Y)
}

interface FloatingScoreProps {
  items: FloatingItem[]
}

// GamePage.tsx 내 추가 상태
const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([])
const padWrapperRef = useRef<HTMLDivElement>(null)  // ButtonPad를 감싸는 flex div에 ref 부착

// FloatingScore를 호출하는 헬퍼 함수
function spawnFloatingScore(color: ButtonColor, multiplier: number): void
```

---

## 핵심 로직

### CSS keyframes — `src/index.css`에 추가

```css
/* Floating score: 곡선 상승 궤적 + 스케일 팝 (Variant B) */
@keyframes vb-float {
  0%   { transform: translateY(0) scale(1);    opacity: 1; }
  15%  { transform: translateY(-10px) scale(1.12); opacity: 1; }
  100% { transform: translateY(-60px) scale(0.85); opacity: 0; }
}

/* 고배율(x3+) 글로우 펄스 */
@keyframes vb-glow-pulse {
  0%   { filter: brightness(1.2); }
  50%  { filter: brightness(1.8); }
  100% { filter: brightness(1); }
}
```

### 배율별 스타일 매핑 — `FloatingScore.tsx` 내부

```typescript
const BUTTON_COLORS: Record<ButtonColor, string> = {
  orange: 'var(--vb-orange-base)',
  blue:   'var(--vb-blue-base)',
  green:  'var(--vb-green-base)',
  yellow: 'var(--vb-yellow-base)',
}

// x1: 흰색, x2+: 버튼 고유색
function getLabelColor(color: ButtonColor, multiplier: number): string {
  if (multiplier === 1) return '#e8e8ea'
  return BUTTON_COLORS[color]
}

// 배율별 폰트 크기: x1=20, x2=26, x3=32, x4=38, x5+=44
function getLabelSize(multiplier: number): number {
  return Math.min(20 + (multiplier - 1) * 6, 44)
}

// 배율별 text-shadow 글로우 (x3+ 적용)
function getLabelGlow(color: ButtonColor, multiplier: number): string {
  if (multiplier < 3) return 'none'
  const base = BUTTON_COLORS[color]
  const strength = 8 + multiplier * 4
  const spread = 20 + multiplier * 6
  return `0 0 ${strength}px ${base}, 0 0 ${spread}px ${base}88`
}

// x3+ 글로우 펄스 애니메이션 추가
function getAnimation(multiplier: number): string {
  const base = 'vb-float 800ms cubic-bezier(0.22, 1, 0.36, 1) forwards'
  if (multiplier >= 3) {
    return `${base}, vb-glow-pulse 400ms ease-in-out 2`
  }
  return base
}
```

### `FloatingScore.tsx` — 전체 구조

```typescript
export function FloatingScore({ items }: FloatingScoreProps) {
  if (items.length === 0) return null

  return (
    <>
      {items.map(({ id, color, multiplier, x, y }) => {
        const fontSize = getLabelSize(multiplier)
        // 레이블이 버튼 중심 위쪽에서 시작하도록 y 오프셋 조정
        // 배율 높을수록 더 위에서 시작 (30 + multiplier * 4)px
        const offsetY = 30 + multiplier * 4

        return (
          <div
            key={id}
            style={{
              position: 'fixed',
              left: x - fontSize / 2,   // 텍스트 너비 절반 보정 (근사값)
              top: y - offsetY,
              fontFamily: 'var(--vb-font-score)',
              fontSize,
              fontWeight: 900,
              color: getLabelColor(color, multiplier),
              textShadow: getLabelGlow(color, multiplier),
              animation: getAnimation(multiplier),
              pointerEvents: 'none',
              zIndex: 150,              // GameOverOverlay(200) 아래, MultiplierBurst(100) 위
              whiteSpace: 'nowrap',
              lineHeight: 1,
              userSelect: 'none',
            } as React.CSSProperties}
          >
            +{multiplier}
          </div>
        )
      })}
    </>
  )
}
```

### `GamePage.tsx` — handleInput 수정 및 state 추가

```typescript
// 추가할 상태
const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([])
const padWrapperRef = useRef<HTMLDivElement>(null)

// 버튼 중심 좌표 (ButtonPad 292px 기준, BTN=110px)
// 코너 버튼의 top/bottom/left/right = 0 이므로 중심 = 반지름 55px
const PAD_BTN_CENTERS: Record<ButtonColor, { relX: number; relY: number }> = {
  orange: { relX: 55,  relY: 55  },   // top-left 버튼 중심
  blue:   { relX: 237, relY: 55  },   // top-right: 292 - 55 = 237
  green:  { relX: 55,  relY: 237 },   // bottom-left
  yellow: { relX: 237, relY: 237 },   // bottom-right
}

function spawnFloatingScore(color: ButtonColor, multiplier: number) {
  if (!padWrapperRef.current) return
  const rect = padWrapperRef.current.getBoundingClientRect()

  // ButtonPad는 wrapper 내에서 flex center 정렬 (justifyContent: center, alignItems: flex-start)
  // wrapper width에서 PAD(292px)의 left offset = (rect.width - 292) / 2
  const padLeft = rect.left + (rect.width - 292) / 2
  const padTop = rect.top   // alignItems: flex-start이므로 패드 top = wrapper top

  const center = PAD_BTN_CENTERS[color]
  const x = padLeft + center.relX
  const y = padTop  + center.relY

  const id = Date.now() + Math.random()
  setFloatingItems(prev => [...prev, { id, color, multiplier, x, y }])

  // 800ms(animation) + 50ms 여유 후 제거
  setTimeout(() => {
    setFloatingItems(prev => prev.filter(item => item.id !== id))
  }, 850)
}

// 기존 handleInput에서 호출 (useGameEngine에서 반환된 handleInput을 래핑)
function handleInputWithFloat(color: ButtonColor) {
  const { comboStreak } = useGameStore.getState()
  const multiplier = getComboMultiplier(comboStreak)
  const result = handleInput(color)   // useGameEngine의 handleInput
  if (result === 'correct' || result === 'round-clear') {
    spawnFloatingScore(color, multiplier)
  }
}
```

> **주의**: `useGameEngine`의 `handleInput`은 현재 `void`를 반환하지 않고 내부적으로 `addInput` 결과를 처리한다. GamePage에서 `handleInput` 호출 전에 multiplier를 먼저 캡처(`getState()`로 현재 streak 읽기)하고, `addInput` 결과를 직접 알 수 없으므로 아래 중 하나를 선택한다.
>
> **선택: `useGameEngine.handleInput`이 결과를 반환하도록 변경**
> 현재 `useGameEngine.ts`의 `handleInput`은 `void`를 반환한다. `addInput`의 결과(`'correct' | 'wrong' | 'round-clear'`)를 호출자에게 노출하도록 반환 타입을 변경한다. GamePage에서 이 반환값으로 floating score 생성 여부를 분기한다.
>
> **대안: GamePage에서 직접 `addInput`도 호출** — `addInput`과 `handleInput`을 분리하면 중복 처리 위험이 있으므로 미채택.

### `useGameEngine.ts` 수정 — handleInput 반환 타입 변경

```typescript
// 기존
handleInput: (color: ButtonColor) => void

// 변경 후
handleInput: (color: ButtonColor) => 'correct' | 'wrong' | 'round-clear'
```

내부에서 `addInput(color)`의 반환값을 그대로 반환한다.

### `GamePage.tsx` — ButtonPad wrapper div에 ref 부착

```tsx
// 기존
<div style={{ flex: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
  <ButtonPad ... onPress={handleInput} ... />
</div>

// 변경
<div
  ref={padWrapperRef}
  style={{ flex: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}
>
  <ButtonPad ... onPress={handleInputWithFloat} ... />
</div>
```

### `GamePage.tsx` — FloatingScore 렌더링 위치

```tsx
// GameOverOverlay 바로 위 (z-index 150이므로 overlay 200 아래)
<FloatingScore items={floatingItems} />

{status === 'RESULT' && gameOverReason !== null && (
  <GameOverOverlay reason={gameOverReason} onConfirm={onGameOver} />
)}
```

---

## 주의사항

**좌표 계산 정확도:**
- `padWrapperRef.current.getBoundingClientRect()`는 실제 레이아웃 위치를 반환하므로 스크롤·transform 영향을 받지 않는다. GamePage 전체가 `height: 100%`이고 `overflow: hidden`이므로 스크롤 오프셋은 0이어서 `fixed` 포지션과 정합성 유지.
- wrapper의 `alignItems: 'flex-start'`이므로 ButtonPad top = wrapper top. ButtonPad는 `292px` 고정 크기이므로 버튼 중심 좌표는 패드 내 상수로 안정적으로 계산 가능.

**z-index 계층:**
- FloatingScore: `zIndex: 150` — MultiplierBurst(`100`) 위, GameOverOverlay(`200`) 아래.
- RESULT 상태에서는 GameOverOverlay가 올라오므로 floating label이 오버레이에 가려진다. RESULT 진입 후 탭 입력이 차단되므로 실제로는 RESULT 중 floating label이 새로 생성되는 케이스 없음. 기존 애니메이션 중인 item은 800ms 내 자연 소멸.

**멀티 터치 / 빠른 연속 탭:**
- `floatingItems` 배열에 여러 item이 동시 존재 가능. React key = id(unique)이므로 각 label이 독립적으로 렌더링·소멸. 배열 누적 방지를 위해 850ms 후 해당 id를 필터링하여 제거.

**`getComboMultiplier` 타이밍:**
- `handleInput` 호출 전에 `getComboMultiplier(comboStreak)`를 읽어야 함. `addInput`이 호출되면 store의 `currentIndex`가 증가하지만 `comboStreak`는 `stageClear`까지 변경되지 않으므로, `addInput` 전후 어느 시점에서 읽어도 동일한 multiplier 값. `handleInput(color)` 호출 전 현재 comboStreak 읽기로 충분.
- `getState()`(Zustand의 `useGameStore.getState()`)로 비구독 읽기 사용 — 함수 내에서 최신 상태를 snapshot으로 읽기 위한 표준 패턴.

**오답(wrong) 시 미표시:**
- `handleInputWithFloat`에서 `handleInput`의 반환값이 `'wrong'`이면 `spawnFloatingScore` 미호출.

**DB 영향도:** 없음. UI 전용 수정.

**Breaking Change:**
- `useGameEngine.ts`: `handleInput`의 반환 타입 `void` → `'correct' | 'wrong' | 'round-clear'`. 현재 호출 측이 반환값을 사용하지 않으므로 컴파일 오류 없음. 단, `GamePage.tsx`에서 기존 `onPress={handleInput}` → `onPress={handleInputWithFloat}`로 교체 필요.
- `ButtonPad.tsx` Props 변경 없음.
- `gameStore.ts` 변경 없음.

---

## 테스트 경계

### 단위 테스트 가능

- `getLabelColor(color, multiplier)`: 순수 함수. x1 → '#e8e8ea', x2+ → 버튼 CSS 변수 반환
- `getLabelSize(multiplier)`: 순수 함수. x1=20, x2=26, x3=32, x4=38, x5=44, x6=44(cap)
- `getLabelGlow(color, multiplier)`: 순수 함수. x1/x2 → 'none', x3+ → text-shadow 문자열

### 통합 테스트 필요

없음 (DOM 측정 로직은 수동 검증)

### 수동 검증

1. [MANUAL-1] x1 배율에서 orange 탭 → 흰색(#e8e8ea) 20px "+1" 표시, 버튼 위에서 상승 후 0.8초 내 소멸
2. [MANUAL-2] x3 배율에서 blue 탭 → blue 계열 32px "+3" + 글로우 표시
3. [MANUAL-3] x5 배율에서 yellow 탭 → yellow 계열 44px "+5" + 강한 글로우 + glow-pulse 확인
4. [MANUAL-4] 4개 버튼 빠른 연속 탭 → 각 버튼 위 독립적 label 생성, 겹침 없이 표시
5. [MANUAL-5] wrong 탭(오답) → floating label 미표시
6. [MANUAL-6] SHOWING 상태(disabled) → 탭 불가이므로 floating label 미표시
7. [MANUAL-7] label 표시 중 버튼 탭 가능 (pointerEvents: none 확인)
8. [MANUAL-8] RESULT 진입 후 기존 floating label이 자연 소멸, 신규 생성 없음

---

## 수용 기준

| # | 항목 | 검증 방법 |
|---|---|---|
| AC1 | 정답 탭 시 탭한 버튼 색상의 "+N" label이 버튼 중심 위에서 상승 후 0.8초 내 소멸 | (MANUAL-1) |
| AC2 | x1은 흰색 20px, x2는 버튼색 26px, x3은 버튼색 32px+글로우, x4=38px, x5+=44px | (TEST) `getLabelSize`, `getLabelColor` 단위 테스트 |
| AC3 | x3 이상에서 glow-pulse 애니메이션 추가 적용 | (BROWSER:DOM) animation 속성에 vb-glow-pulse 포함 확인 |
| AC4 | 오답(wrong) 시 floating label 미표시 | (MANUAL-5) |
| AC5 | 여러 개 label 동시 표시 가능 (빠른 연속 탭) | (MANUAL-4) |
| AC6 | pointerEvents: none — label 표시 중 버튼 탭 차단 없음 | (MANUAL-7) |
| AC7 | z-index: 150 — MultiplierBurst(100) 위, GameOverOverlay(200) 아래 | (BROWSER:DOM) computed z-index 확인 |
| AC8 | 850ms 후 floatingItems에서 자동 제거 (DOM 누수 없음) | (BROWSER:DOM) 1초 후 DOM에서 label div 사라짐 확인 |
| AC9 | `useGameEngine.handleInput` 반환 타입 변경으로 기존 컴파일 오류 없음 | (TEST) TypeScript 빌드 통과 |

---

## READY_FOR_IMPL 체크

- [x] 생성/수정 파일 목록 확정 (FloatingScore.tsx 신규, GamePage.tsx 수정, useGameEngine.ts 수정, index.css 수정)
- [x] 모든 Props/인터페이스 TypeScript 타입으로 명시
- [x] 의존 모듈 실제 인터페이스를 소스에서 직접 확인 (ButtonPad.tsx CORNER_BUTTONS/BTN/PAD 상수, GamePage.tsx handleInput/padWrapper, gameStore.ts addInput/getComboMultiplier)
- [x] 에러 처리 방식 명시 (padWrapperRef null 가드로 spawnFloatingScore early return)
- [x] 페이지 전환·상태 초기화 순서 명시 — RESULT 진입 후 신규 floating 생성 없음, 기존 item 자연 소멸
- [x] DB 영향도 분석 완료 (영향 없음 — UI 전용)
- [x] Breaking Change 검토 — useGameEngine.handleInput 반환 타입 변경, GamePage onPress 교체 필요. ButtonPad.tsx 인터페이스 변경 없음.
- [x] 핵심 로직: 의사코드/스니펫 포함
- [x] test-plan.md 영향: getLabelColor, getLabelSize, getLabelGlow 순수 함수 TC 추가 필요. handleInput 반환 타입 변경으로 기존 TC 반환값 검증 항목 추가.
