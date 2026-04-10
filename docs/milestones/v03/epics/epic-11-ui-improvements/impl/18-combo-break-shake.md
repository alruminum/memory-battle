# 18. 콤보 브레이크 쉐이크 애니메이션 (Variant-A 쇼크 웨이브)

> 관련 이슈: [#98](https://github.com/alruminum/memory-battle/issues/98)
> 디자인 확정: Variant-A (쇼크 웨이브) — design 루프 PICK

---

## 결정 근거

### (1) `isBreaking` 상태 전달 경로 — useGameEngine 경유

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **A. useGameEngine 반환값 확장 (채택)** | `stageClear` 결과에서 `isFullCombo` 구조분해, `comboBreaking` state 관리 후 반환 | 채택 |
| B. Zustand store에 `isComboBreaking` 플래그 추가 | store 상태 추가 → subscriber 모두 리렌더 | 미채택 — store 오염, 범위 초과 |
| C. GamePage에서 직접 감지 | `stageClear`가 GamePage가 아닌 useGameEngine에서 호출됨 | 미채택 — stageClear 호출 위치가 hook 내부 |

`stageClear` 호출 위치: `src/hooks/useGameEngine.ts:148`. 현재 `multiplierIncreased`만 구조분해하고 있으므로 `isFullCombo`도 함께 받아 `comboBreaking` state로 600ms 노출하는 것이 최소 변경 경로.

### (2) 애니메이션 재실행 방법 — `animKey` + `key` prop

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **A. `animKey` 카운터 + `key` prop (채택)** | isBreaking false→true 전환마다 increment → `key` 변경으로 DOM 강제 remount → CSS 애니메이션 재시작 | 채택 |
| B. className 제거 후 reflow + 재추가 | `requestAnimationFrame` + classList 토글 | 미채택 — 프레임 타이밍 의존, 불안정 |
| C. isAnimating boolean + timeout | 재진입 시 애니메이션 스킵 가능성 | 미채택 — 빠른 연속 브레이크 시 누락 |

`key` prop 변경은 React의 공식 "강제 리마운트" 패턴. 애니메이션이 매번 처음부터 재생됨이 보장됨.

### (3) 블록 붕괴 애니메이션 — 인라인 `animation` 속성 분기

현재 블록의 `animation`은 인라인 스타일(`style={{ animation: ... }}`)로 설정됨.  
CSS 클래스의 `animation` 규칙은 인라인보다 우선순위가 낮으므로, `!important` 없이 클래스로 오버라이드 불가.  
→ **인라인 스타일 내부에서 `isBreaking` 분기**로 `blockBreak` / `blockPop` / `'none'` 중 선택.

### (4) 배율 숫자 애니메이션 — CSS 클래스 단일 @keyframes

| 목표 | 구현 |
|---|---|
| 0–200ms: #D4A843 → #F87171 flash | `0%→44%` color transition |
| 200–250ms: opacity fade out | `44%→55%` opacity 1→0 |
| 250–450ms: 새 배율값 fade in | `55%→100%` opacity 0→1, color 원복 |

총 duration 0.45s. 재배율값(x1 또는 유지 배율)이 animation 중 이미 반영되어 있으므로, 값 스냅샷 불필요.

---

## 생성/수정 파일

- `src/index.css` (수정) — `@keyframes comboShake`, `@keyframes blockBreak`, `@keyframes multBreak` + `.combo-breaking`, `.combo-mult-break` 클래스 추가
- `src/components/game/ComboIndicator.tsx` (수정) — `isBreaking` prop 추가, `animKey` 상태, CSS 클래스 조건부 적용, 블록 인라인 animation 분기
- `src/hooks/useGameEngine.ts` (수정) — `stageClear` 결과에서 `isFullCombo` 구조분해, `comboBreaking` state + ref 추가, 반환값 확장
- `src/pages/GamePage.tsx` (수정) — `useGameEngine` 반환값에서 `comboBreaking` 구조분해, `ComboIndicator`에 `isBreaking` prop 전달

---

## 인터페이스 정의

### ComboIndicator.tsx — Props

```typescript
interface ComboIndicatorProps {
  comboStreak: number
  isBreaking?: boolean  // 콤보 타이머 만료 시 true. 기본값: false
}
```

### useGameEngine.ts — 반환값 확장

```typescript
// 기존 반환 객체에 추가
return {
  // ... 기존 필드 ...
  comboBreaking: boolean   // 콤보 브레이크 진행 중 (600ms 동안 true)
}
```

---

## 핵심 로직

### `src/index.css` — 추가 keyframes + 클래스

```css
/* 콤보 브레이크 쉐이크: ±8px × 6 half-cycles, 0.4s */
@keyframes comboShake {
  0%, 100% { transform: translateX(0); }
  16.7%    { transform: translateX(-8px); }
  33.3%    { transform: translateX(8px); }
  50.0%    { transform: translateX(-8px); }
  66.7%    { transform: translateX(8px); }
  83.3%    { transform: translateX(-8px); }
}

.combo-breaking {
  animation: comboShake 0.4s ease-in-out;
}

/* 블록 붕괴: 색상 → #F87171, scaleY(0), 0.3s ease-in */
@keyframes blockBreak {
  0%   { transform: scaleY(1); }
  20%  { background: #F87171; }
  100% { transform: scaleY(0); background: #F87171; }
}

/* 배율 숫자 플래시 후 재등장, 0.45s */
@keyframes multBreak {
  0%   { opacity: 1; color: var(--vb-accent); }
  44%  { opacity: 1; color: #F87171; }   /* ~200ms: flash peak */
  55%  { opacity: 0; color: #F87171; }   /* ~248ms: fade out 완료 */
  100% { opacity: 1; color: var(--vb-accent); }  /* 450ms: 새 값 등장 */
}

.combo-mult-break {
  animation: multBreak 0.45s ease forwards;
}
```

삽입 위치: `@keyframes blockPop` 블록 직후 (L123 이후).

---

### `src/components/game/ComboIndicator.tsx` — 전체 구조

```typescript
import { useEffect, useRef, useState } from 'react'

const BLOCK_HEIGHTS = [8, 10, 12, 14, 16]

interface ComboIndicatorProps {
  comboStreak: number
  isBreaking?: boolean
}

export function ComboIndicator({ comboStreak, isBreaking = false }: ComboIndicatorProps) {
  const [animKey, setAnimKey] = useState(0)
  const prevBreaking = useRef(false)

  // isBreaking false→true 전환마다 animKey 증분 → key 변경으로 CSS 애니메이션 재시작
  useEffect(() => {
    if (isBreaking && !prevBreaking.current) {
      setAnimKey(k => k + 1)
    }
    prevBreaking.current = isBreaking
  }, [isBreaking])

  const multiplier = Math.floor(comboStreak / 5) + 1
  const filledCount = comboStreak % 5

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 14px' }}>
      {/* key 변경으로 전체 내부 DOM remount → 애니메이션 재시작 */}
      <div
        key={animKey}
        className={isBreaking ? 'combo-breaking' : ''}
        style={{ display: 'flex', alignItems: 'center', gap: 10 }}
      >
        {/* 블록 5칸 */}
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 20 }}>
          {BLOCK_HEIGHTS.map((h, i) => {
            const isFilled = i < filledCount
            // isBreaking 시: blockBreak 0.3s (5칸 전체 동시 붕괴)
            // 평시: 방금 채워진 블록에만 blockPop 0.3s
            const blockAnimation = isBreaking
              ? 'blockBreak 0.3s ease-in forwards'
              : (isFilled && i === filledCount - 1) ? 'blockPop 0.3s ease' : 'none'
            return (
              <div
                key={i}
                style={{
                  width: 10,
                  height: h,
                  borderRadius: '2px 2px 0 0',
                  background: isFilled ? 'var(--vb-accent)' : 'var(--vb-border)',
                  transformOrigin: 'bottom',
                  animation: blockAnimation,
                  // isBreaking 중에는 glow 제거 (붕괴 연출과 충돌 방지)
                  boxShadow: isBreaking ? 'none' : (isFilled ? '0 0 7px 2px rgba(212, 168, 67, 0.5)' : 'none'),
                }}
              />
            )
          })}
        </div>

        {/* 배율 숫자 */}
        <div
          className={isBreaking ? 'combo-mult-break' : ''}
          style={{
            fontFamily: 'var(--vb-font-score)',
            fontSize: 18,
            fontWeight: 900,
            color: 'var(--vb-accent)',
            lineHeight: 1,
          }}
        >
          x{multiplier}
        </div>
      </div>
    </div>
  )
}
```

---

### `src/hooks/useGameEngine.ts` — stageClear 결과 처리

```typescript
// 파일 최상단 import 영역 (추가 없음 — useState 이미 사용 중 확인 필요)

// 훅 내부 상태 추가
const [comboBreaking, setComboBreaking] = useState(false)
const comboBreakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

// L147 기존 코드
// Before:
const { multiplierIncreased: increased } =
  useGameStore.getState().stageClear(now, flash)

// After:
const { multiplierIncreased: increased, isFullCombo } =
  useGameStore.getState().stageClear(now, flash)

// stageClear 직후 (L149 이후) 추가:
if (!isFullCombo) {
  if (comboBreakTimerRef.current) clearTimeout(comboBreakTimerRef.current)
  setComboBreaking(true)
  comboBreakTimerRef.current = setTimeout(() => setComboBreaking(false), 600)
}

// 클린업 — 훅 반환부 직전 하단에 단독 useEffect로 추가 (기존 useEffect에 병합 금지)
// 근거: useGameEngine.ts에 현재 명시적 cleanup useEffect 없음.
//       기존 블록 병합 시 의존성 배열 오염 위험이 있으므로 의존성 [] 단독 블록으로 격리.
useEffect(() => {
  return () => {
    if (comboBreakTimerRef.current) clearTimeout(comboBreakTimerRef.current)
  }
}, []) // ← 의존성 배열 비워둠. comboBreakTimerRef는 ref이므로 reactive 아님

// 반환값에 comboBreaking 추가:
return {
  // ... 기존 필드 ...
  comboBreaking,
}
```

---

### `src/pages/GamePage.tsx` — ComboIndicator 호출부 수정

```tsx
// useGameEngine 반환값 구조분해에 comboBreaking 추가
const {
  // ... 기존 ...
  comboBreaking,
} = useGameEngine(...)

// ComboIndicator 렌더링 (L324)
// Before:
<ComboIndicator comboStreak={comboStreak} />

// After:
<ComboIndicator comboStreak={comboStreak} isBreaking={comboBreaking} />
```

---

## 주의사항

### 모듈 경계
- `ComboIndicator.tsx` — `isBreaking` prop 외에 외부 의존 없음. 내부 `animKey`/`prevBreaking` ref는 컴포넌트 로컬 상태로만 관리.
- `useGameEngine.ts` — `comboBreakTimerRef` 생명주기는 훅 마운트/언마운트에 종속. 게임 재시작(`startGame`) 시 타이머가 잔류하면 이전 상태가 600ms 이후 false로 설정되는데, 이는 무해(이미 새 게임 시작 후 false가 정상 상태이므로).

### 기존 `@keyframes shake` 충돌 없음
- 기존 `shake` 클래스 (`.shake`, 0.5s, ±6px)는 `GameOverOverlay`에서 사용.
- 신규 `comboShake` / `.combo-breaking`은 클래스명이 다르므로 충돌 없음.
- 기존 `shake`의 translateX ±6px vs 신규 comboShake ±8px — 의도적 차이 (콤보 브레이크가 더 날카로운 진폭).

### `blockBreak` vs `blockPop` 동시 실행 방지
- `isBreaking=true` 시 모든 블록에 `blockBreak` 적용 → `blockPop` 조건(`isFilled && i === filledCount - 1`)이 무시됨 (인라인 분기이므로 동시 실행 불가능).
- `blockBreak` 후 `forwards` fill-mode로 `scaleY(0)` 유지. `isBreaking=false` 복귀 + `animKey` 재설정 시 DOM remount → scaleY 원복.

### `multBreak` 0.45s vs 실제 comboStreak 갱신 타이밍
- `stageClear()` 호출 후 store 상태(`comboStreak`)가 즉시 갱신됨 → `ComboIndicator` 리렌더 시 `multiplier`는 이미 새 값.
- `multBreak`의 `opacity: 0` 구간(44%~55%, 약 200~250ms) 동안 새 값이 보이지 않음 → 100%에서 새 값이 등장. 시각적으로 "flash 후 새 배율 등장" 의도와 일치.
- x1(0-4 streak) → x1 유지인 경우도 동일 플래시 연출: 배율 숫자가 빨갛게 번쩍이다 사라졌다 다시 x1로 등장.

### 게임오버 시 중복 실행 방지
- 게임오버(`gameOverReason !== null`) 시 `GameOverOverlay`가 화면을 덮으므로 `ComboIndicator` 쉐이크가 시각적으로 가려질 수 있음.
- `stageClear` → `isFullCombo=false`이더라도 이후 바로 게임오버가 발생하는 경우, 두 애니메이션(overlay shake + indicator shake)이 동시 실행될 수 있음. 각자 별개 DOM 요소에 적용되므로 충돌 없음, 의도된 동작.

### `transformOrigin: bottom` 블록
- 현재 `transformOrigin: 'bottom'`이 인라인 스타일로 설정되어 있음.
- `blockBreak` keyframe의 `transform: scaleY(0)`은 이 origin에 따라 블록이 아래에서 위로 쪼그라드는 방향으로 동작. 의도된 "붕괴" 연출과 일치.

### DB 영향도
없음. UI 전용 변경.

---

## 테스트 경계

- **단위 테스트 가능**: 없음 (CSS 애니메이션 + 단순 prop 분기)
- **통합 테스트 필요**: 없음
- **수동 검증**:
  1. [MANUAL-1] 콤보 타이머 만료(풀콤보 실패) 시 ComboIndicator 컨테이너가 좌우로 흔들리는지 확인 (±8px, 0.4s)
  2. [MANUAL-2] 쉐이크와 동시에 5개 블록 전체가 빨갛게 변하며 아래로 붕괴(scaleY 0)하는지 확인 (0.3s)
  3. [MANUAL-3] 배율 숫자가 빨갛게 번쩍이며 사라졌다가 (~250ms 후) 새 배율로 등장하는지 확인
  4. [MANUAL-4] x2+(streak≥5) 상태에서 콤보 브레이크 시 배율이 x2+(유지)로 재등장하는지 확인
  5. [MANUAL-5] 연속 두 번 브레이크 시 두 번 모두 쉐이크 애니메이션이 재실행되는지 확인
  6. [MANUAL-6] 게임 정상 플레이(브레이크 없음) 중 쉐이크 미발생 확인

---

## 수용 기준

| # | 항목 | 유형 |
|---|---|---|
| AC1 | 콤보 타이머 만료 시 ComboIndicator ±8px 쉐이크 0.4s | MANUAL |
| AC2 | 5개 블록 동시 `scaleY(0)` + `#F87171` 붕괴 0.3s | MANUAL |
| AC3 | 배율 숫자 `#D4A843→#F87171` flash 0.2s → ~250ms 후 새 값 fade-in 0.2s | MANUAL |
| AC4 | 기존 가로 flex 구조(`gap: 10, alignItems: center`) 유지 | MANUAL |
| AC5 | 100% CSS @keyframes — 외부 라이브러리 import 없음 | CODE REVIEW |
| AC6 | 브레이크 없는 정상 플레이 시 쉐이크 미발생 | MANUAL |
| AC7 | TypeScript 컴파일 에러 없음 (`isBreaking` prop 전달 완료) | BUILD |
