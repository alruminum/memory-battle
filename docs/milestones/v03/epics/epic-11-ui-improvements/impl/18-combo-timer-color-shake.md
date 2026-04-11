# 18. ComboTimer 3단계 색상 전환 + ComboIndicator 콤보 브레이크 쉐이크

> 관련 이슈: [#99](https://github.com/alruminum/memory-battle/issues/99)
> 디자인 확정: DESIGN_HANDOFF — Pencil Frame UJUe5

---

## 결정 근거

### (1) TimerPhase enum 도입 — isOver boolean 대체

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **TimerPhase enum (채택)** | `'normal' \| 'warning' \| 'danger'` 3단계 타입 + Record 색상 테이블 | 채택 |
| isOver boolean 확장 | `isOver`, `isWarning` 두 boolean 병렬 사용 | 미채택 — 조합 확인 부담(isOver && isWarning 등 불일치 가능), 새 단계 추가 시 파편화 |
| ratio 직접 분기 (삼항 중첩) | `ratio ≤ 0.2 ? 'red' : ratio ≤ 0.5 ? 'orange' : 'gold'` | 미채택 — 가독성 저하, 색상 수정 시 여러 곳 변경 필요 |

**채택 이유**: 단계별 색상·글로우·클래스명이 Record로 한 곳에 집중되어 유지보수 용이. 단계 추가 시 Record에만 항목 추가하면 됨.

### (2) dangerPulse — 인라인 boxShadow 대신 CSS 클래스 animation

DANGER 구간(ratio ≤ 0.2)에서 글로우 헤드가 1s 루프로 맥동한다. 현재 글로우 헤드는 `boxShadow`를 인라인 스타일로 설정하는데, CSS `animation`은 같은 속성의 인라인 스타일을 재정의한다 (CSS animation-fill 우선순위). 따라서 클래스에 `animation: dangerPulse 1s ease-in-out infinite`를 적용하면 인라인 `boxShadow`를 override할 수 있다.

**단, `transition: box-shadow`와의 충돌 방지**: 글로우 헤드 인라인 스타일에서 `box-shadow` 관련 transition을 제거하거나, `.combo-timer-glow--danger` 클래스에서 `transition: none` 지정.

### (3) background transition 시간 — phase별 CSS 클래스 분리

현재 fill bar는 `transition: 'width 80ms linear, background 200ms ease'` 인라인으로 설정. WARNING/DANGER 각각 0.3s/0.2s ease-out 요구. 인라인 transition은 CSS class보다 우선순위가 높아 직접 덮을 수 없으므로, background transition을 인라인에서 제거하고 CSS class(`.combo-timer-fill`, `.combo-timer-fill.warning`, `.combo-timer-fill.danger`)로 이동.

### (4) ComboIndicator shake — isBreaking prop + useState 로컬 상태 머신

ComboTimer의 CollapsePhase 패턴을 참고. isBreaking이 true가 되는 시점에 `isShaking=true`로 전환하고, `animationend` 콜백에서 false로 리셋. isBreaking이 false로 돌아오면(게임 재시작) 즉시 false로 초기화.

**shake 트리거 조건**: `status === 'RESULT' && gameOverReason === 'timeout'` (콤보 타이머 만료). 오답(wrong) 게임오버는 쉐이크 미발생. 이미 GameOverOverlay가 오답 게임오버를 독립적으로 표현하므로 중복 불필요.

### (5) @keyframes comboBreakShake — 3회 진폭 감쇠 해석

스펙 "translateX(-4→+4→-3→+3→0) 3회 0.56s"를 3번의 좌-우 왕복(3 full oscillations)으로 해석:
- 1회차(왕복): -4px → +4px
- 2회차(왕복): -4px → +4px  (동일 진폭, 반복)
- 3회차(왕복, 감쇠): -3px → +3px
- 복귀: 0

총 0.56s에서 각 방향 전환마다 ~70ms 배분.

---

## 생성/수정 파일

- `src/components/game/ComboTimer.tsx` (수정) — TimerPhase 3단계 색상 분기, CSS class 방식 전환
- `src/components/game/ComboIndicator.tsx` (수정) — `isBreaking` prop 추가, shake 로직
- `src/pages/GamePage.tsx` (수정) — ComboIndicator에 `isBreaking` 전달
- `src/index.css` (수정) — CSS 변수 2개, @keyframes 2개, class 5개 추가

---

## 인터페이스 정의

### ComboTimer.tsx — 내부 타입 추가

```typescript
// 기존 Props 변경 없음
interface ComboTimerProps {
  computerShowTime: number
  inputStartTime: number
  isActive: boolean
  isBreaking?: boolean
  isShowing?: boolean
}

// [신규] 3단계 타이머 페이즈
type TimerPhase = 'normal' | 'warning' | 'danger'

const getTimerPhase = (ratio: number): TimerPhase => {
  if (ratio <= 0.2) return 'danger'
  if (ratio <= 0.5) return 'warning'
  return 'normal'
}

// [신규] 색상 테이블
const FILL_COLORS: Record<TimerPhase, string> = {
  normal:  'var(--vb-accent)',
  warning: 'var(--vb-combo-warn)',
  danger:  'var(--vb-combo-danger)',
}
const GLOW_COLORS: Record<TimerPhase, string> = {
  normal:  'rgba(212,168,67,0.7)',
  warning: 'rgba(251,146,60,0.7)',
  danger:  'rgba(248,113,113,0.7)',
}
```

### ComboIndicator.tsx — Props 변경

```typescript
// Before
interface ComboIndicatorProps {
  comboStreak: number
}

// After
interface ComboIndicatorProps {
  comboStreak: number
  isBreaking?: boolean  // [신규] true 시 쉐이크 애니메이션 트리거
}
```

---

## 핵심 로직

### ComboTimer.tsx — 색상 분기 변경

```typescript
// [변경 전]
const isOver = displayElapsedMs >= computerShowTime
const fillColor = isOver ? 'var(--vb-combo-over)' : 'var(--vb-accent)'
const glowColor = isOver
  ? 'rgba(248,113,113,0.7)'
  : 'rgba(212,168,67,0.7)'
const fillClass = [
  'combo-timer-fill',
  isOver ? 'over' : '',
  collapsePhase === 'breaking' ? 'collapse' : '',
].filter(Boolean).join(' ')

// [변경 후]
const phase = getTimerPhase(ratio)  // ratio = Math.max(0, 1 - displayElapsedMs / computerShowTime)
const fillColor = FILL_COLORS[phase]
const glowColor = GLOW_COLORS[phase]
const fillClass = [
  'combo-timer-fill',
  phase !== 'normal' ? phase : '',     // 'warning' | 'danger' 클래스 추가
  collapsePhase === 'breaking' ? 'collapse' : '',
].filter(Boolean).join(' ')
const glowClass = phase === 'danger' ? 'combo-timer-glow--danger' : ''
```

### ComboTimer.tsx — fill bar 인라인 스타일 변경

```typescript
// [변경 전] — background transition 인라인 포함
<div
  className={fillClass}
  style={{
    height: '100%',
    width: fillWidth,
    borderRadius: 2,
    background: fillColor,
    position: 'relative',
    transition: 'width 80ms linear, background 200ms ease',  // ← 제거 대상
    transformOrigin: 'left center',
  }}
>

// [변경 후] — width transition만 인라인 유지, background는 CSS class로 이동
<div
  className={fillClass}
  style={{
    height: '100%',
    width: fillWidth,
    borderRadius: 2,
    background: fillColor,
    position: 'relative',
    transition: 'width 80ms linear',  // background transition 제거 — CSS class에서 관리
    transformOrigin: 'left center',
  }}
>
```

### ComboTimer.tsx — 글로우 헤드 className 추가

```tsx
// [변경 전]
<div style={{
  position: 'absolute',
  right: -3,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: fillColor,
  boxShadow: `0 0 10px 3px ${glowColor}`,
  transition: 'background 200ms ease, box-shadow 200ms ease',
}} />

// [변경 후] — dangerPulse 클래스 추가, danger 구간에서 transition 제거(animation과 충돌 방지)
<div
  className={glowClass}  // 'combo-timer-glow--danger' or ''
  style={{
    position: 'absolute',
    right: -3,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: fillColor,
    boxShadow: `0 0 10px 3px ${glowColor}`,
    transition: phase === 'danger'
      ? 'background 200ms ease'              // danger 중 box-shadow transition 제거 (animation 우선)
      : 'background 200ms ease, box-shadow 200ms ease',
  }}
/>
```

### ComboIndicator.tsx — shake 로직

```typescript
import { useState, useEffect, useCallback } from 'react'

export function ComboIndicator({ comboStreak, isBreaking = false }: ComboIndicatorProps) {
  const [isShaking, setIsShaking] = useState(false)

  // isBreaking 상태 머신: false → 즉시 리셋 / true → 쉐이크 시작
  useEffect(() => {
    if (isBreaking) {
      setIsShaking(true)
    } else {
      setIsShaking(false)  // 게임 재시작 시 즉시 정지
    }
  }, [isBreaking])

  const handleAnimationEnd = useCallback((e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === 'comboBreakShake') {
      setIsShaking(false)  // 애니메이션 완료 후 클래스 제거
    }
  }, [])

  // ... (기존 로직 유지)

  return (
    <div
      className={isShaking ? 'combo-break-shake' : undefined}
      onAnimationEnd={isShaking ? handleAnimationEnd : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '4px 14px',
      }}
    >
      {/* 기존 블록 5칸 + x{배율} 숫자 — 변경 없음 */}
    </div>
  )
}
```

### GamePage.tsx — ComboIndicator isBreaking 전달

```tsx
// [변경 전]
<ComboIndicator comboStreak={comboStreak} />

// [변경 후] — timeout 게임오버 시에만 쉐이크 (오답은 별도 GameOverOverlay로 표현)
<ComboIndicator
  comboStreak={comboStreak}
  isBreaking={status === 'RESULT' && gameOverReason === 'timeout'}
/>
```

### index.css — 추가 내용

```css
/* ── CSS 변수 추가 (기존 :root 블록에 병합) ── */
:root {
  /* 콤보 타이머 색상 — 3단계 */
  --vb-combo-warn:   #FB923C;   /* WARNING: 타이머 50% 이하 (amber→orange) */
  --vb-combo-danger: #F87171;   /* DANGER: 타이머 20% 이하 (orange→red) */
  /* 기존 --vb-combo-over: #F87171 유지 (collapse 애니메이션 slimFlash에서 참조) */
}

/* ── fill bar background transition (기존 인라인 대체) ── */
.combo-timer-fill {
  /* width는 ComboTimer 인라인 style에서 관리 (80ms linear) */
  transition: background 200ms ease;
}
.combo-timer-fill.warning {
  transition: background 300ms ease-out;
}
.combo-timer-fill.danger {
  transition: background 200ms ease-out;
}
/* collapse 시 animation이 background를 직접 제어 — transition 비활성화 */
.combo-timer-fill.collapse {
  transition: none;
}

/* ── 글로우 헤드 DANGER 펄스 ── */
@keyframes dangerPulse {
  0%, 100% { box-shadow: 0 0 10px 3px rgba(248,113,113,0.70); }
  50%      { box-shadow: 0 0 18px 7px rgba(248,113,113,1.00); }
}

.combo-timer-glow--danger {
  animation: dangerPulse 1s ease-in-out infinite;
}

/* ── ComboIndicator 콤보 브레이크 쉐이크 ── */
/* 3회 왕복 진폭 감쇠: ±4px × 2, ±3px × 1 / 총 0.56s */
@keyframes comboBreakShake {
  0%   { transform: translateX(0); }
  12%  { transform: translateX(-4px); }
  25%  { transform: translateX(4px); }
  38%  { transform: translateX(-4px); }
  50%  { transform: translateX(4px); }
  63%  { transform: translateX(-3px); }
  76%  { transform: translateX(3px); }
  88%  { transform: translateX(-3px); }
  100% { transform: translateX(0); }
}

.combo-break-shake {
  animation: comboBreakShake 0.56s ease-out forwards;
}
```

---

## 주의사항

### 모듈 경계
- `ComboTimer.tsx`: Props 인터페이스 변경 없음. 내부 타입(`TimerPhase`) 신규 추가. 호출부(`GamePage.tsx`) 변경 불필요.
- `ComboIndicator.tsx`: `isBreaking` optional prop 추가. 미전달 시 `false` 기본값으로 기존 동작 유지. 호출부(`GamePage.tsx`) 업데이트 권장 (미전달 시 TypeScript 경고 없음).
- `GamePage.tsx`: `ComboIndicator`에만 추가 prop 전달. `ComboTimer` prop은 변경 없음.

### CSS 충돌 방지
- `--vb-combo-over` 유지: `slimFlash` keyframe이 `var(--vb-combo-over)` 참조. 리네이밍 금지.
- `--vb-combo-danger`와 `--vb-combo-over`는 동일 값(#F87171)이지만 역할이 다름. 설계 의도 유지.
- `.combo-timer-fill.collapse`에 `transition: none` 추가: `slimFlash` animation이 fill의 배경색을 직접 제어하므로 background transition과의 충돌 방지.
- 클래스명 `combo-timer-glow--danger`, `combo-break-shake`: 기존 코드베이스에서 미사용 확인됨.

### dangerPulse와 glowColor 인라인 스타일 우선순위
- CSS animation은 animation이 active한 동안 해당 속성의 인라인 스타일을 override (CSS Cascade Level 4 animation origin 우선).
- DANGER 구간에서 글로우 헤드의 인라인 `boxShadow`는 dangerPulse에 의해 override됨 (의도된 동작).
- DANGER → NORMAL/WARNING 전환 시: 클래스 제거로 animation 종료, 인라인 boxShadow 복구.

### ratio=0 (elapsed ≥ computerShowTime) 처리
- 기존 `isOver` 조건이 `ratio ≤ 0.2` (DANGER phase)로 자동 포함됨. ratio=0도 DANGER phase.
- 타임아웃 게임오버 직후 `isBreaking=true` → collapse animation 재생. dangerPulse와 slimFlash collapse는 동일 요소에 적용되지 않음 (dangerPulse는 글로우 헤드, slimFlash는 fill bar).

### 기존 `isOver` 참조 제거
- ComboTimer.tsx 내 `isOver` 변수와 관련 분기 전체를 `phase` 기반으로 교체.
- 삭제 라인: `const isOver = displayElapsedMs >= computerShowTime` + `fillColor`/`glowColor`/`fillClass`에서 `isOver` 분기.

### Breaking Change
- `ComboTimer.tsx`: 없음 (Props 동일, 내부 변경).
- `ComboIndicator.tsx`: `isBreaking` prop 추가 (optional, 미전달 시 호환). 기존 `ComboIndicator` 호출부는 TypeScript 에러 없이 동작.
- `GamePage.tsx`: 변경 필요 (isBreaking 전달 추가). 미전달 시 기능만 누락, 런타임 에러 없음.
- DB 영향: 없음.

---

## 테스트 경계

### 수동 검증 시나리오

| ID | 시나리오 | 기대 동작 |
|---|---|---|
| MV-1 | INPUT 진입 직후 (ratio > 0.5) | 게이지 바 + 글로우 헤드 amber (#D4A843) |
| MV-2 | ratio 0.5 이하 진입 순간 | 바 amber → orange (#FB923C) 0.3s ease-out 전환 |
| MV-3 | ratio 0.2 이하 진입 순간 | 바 orange → red (#F87171) 0.2s ease-out 전환, 글로우 헤드 dangerPulse 시작 |
| MV-4 | DANGER 구간에서 글로우 헤드 | 1s 주기로 box-shadow 맥동 확인 |
| MV-5 | 타임아웃 게임오버 | ComboTimer collapse 애니메이션 + ComboIndicator 쉐이크 동시 발생 |
| MV-6 | 오답 게임오버 | ComboTimer collapse 재생, ComboIndicator 쉐이크 미발생 (GameOverOverlay만) |
| MV-7 | 쉐이크 종료 후 (0.56s 경과) | `.combo-break-shake` 클래스 제거, 위치 원복 |
| MV-8 | 게임 재시작 (isBreaking → false) | isShaking 즉시 false, 쉐이크 중단 |
| MV-9 | SHOWING 페이즈 | 게이지 풀 바 amber (ratio=1.0), dangerPulse 미발생 |

### 단위 테스트 추가 여부

ComboTimer 기존 TC(`CT-1` ~ `CT-4`)는 DOM 구조(track, fill) 유지이므로 계속 통과. 추가 TC 권장:

| TC ID | 케이스 | 검증 방식 |
|---|---|---|
| CT-5-1 | ratio > 0.5 → fill에 phase class 없음 | `fill.className`에 'warning'/'danger' 없음 |
| CT-5-2 | ratio = 0.4 → `.warning` 클래스 | `fill.className`에 'warning' 포함 |
| CT-5-3 | ratio = 0.1 → `.danger` 클래스 | `fill.className`에 'danger' 포함 |
| CT-5-4 | ratio = 0.1 → 글로우 `.combo-timer-glow--danger` | 글로우 헤드 엘리먼트에 클래스 확인 |

ComboIndicator shake TC:

| TC ID | 케이스 | 검증 방식 |
|---|---|---|
| CI-1-1 | `isBreaking=false` → 쉐이크 미발생 | 래퍼 div에 `combo-break-shake` 없음 |
| CI-1-2 | `isBreaking=true` → 쉐이크 시작 | 래퍼 div에 `combo-break-shake` 추가 |
| CI-1-3 | `animationend('comboBreakShake')` 발화 → 클래스 제거 | `fireEvent.animationEnd`, 이후 클래스 없음 |
| CI-1-4 | `isBreaking=true → false` 전환 → 클래스 즉시 제거 | 클래스 없음 |
