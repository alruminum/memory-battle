# 14. FloatingScore 글로우 미렌더링 + duration 조정

> 버그픽스 — 관련 이슈: [#84](https://github.com/alruminum/memory-battle/issues/84), [#85](https://github.com/alruminum/memory-battle/issues/85)

---

## 버그 근본 원인

### #84 — 글로우 미렌더링

`getLabelGlow()` 함수:

```ts
const base = BUTTON_COLORS[color]  // → 'var(--vb-orange-base)'
return `0 0 ${strength}px ${base}, 0 0 ${spread}px ${base}88`
//                                                        ↑
//                             'var(--vb-orange-base)88' → 유효하지 않은 CSS
```

CSS 변수 문자열 뒤에 hex suffix `88`을 문자열 연결하면 브라우저가 전체 `text-shadow` 값을 파싱 오류로 무시한다. 결과적으로 `multiplier >= 3` 케이스에서 글로우 효과가 전혀 렌더링되지 않는다.

**수정**: `BUTTON_COLORS` 맵을 CSS 변수 대신 실제 hex 색상값으로 교체. 그러면 `#FF620088` 형태로 올바른 `rgba` 투명 hex가 생성된다.

### #85 — duration 느리게 (UX 개선)

현재 값:
- `vb-float 800ms` → 아이템이 너무 빨리 사라짐
- `vb-glow-pulse 400ms` → 글로우 펄스가 너무 빠름
- `setTimeout 850ms` → 아이템 제거 시점이 애니메이션보다 빠름

---

## 결정 근거

| 항목 | 선택 | 이유 | 버린 대안 |
|---|---|---|---|
| #84 수정 방법 | `BUTTON_COLORS` hex 직접 하드코딩 | CSS 변수는 JS 문자열 연결 시 유효하지 않음. hex 직접 사용이 유일한 안전한 방법. `getLabelColor()`는 multiplier=1 시 `'#e8e8ea'`를 직접 반환하는 패턴 이미 사용 중 → 일관성 유지 | CSS 변수 런타임 resolve (`getComputedStyle`) — 성능 비용 + 코드 복잡도 증가, DOM 의존성 생김 |
| #84 글로우 전용 맵 분리 | 단일 `BUTTON_COLORS` 맵 유지 | `getLabelColor()`, `getLabelGlow()` 두 함수 모두 동일 컬러를 참조. 맵을 분리하면 색상 변경 시 두 곳을 수정해야 하는 동기화 부담 발생 | 글로우 전용 `GLOW_COLORS` 맵 추가 — 중복 관리 필요 |
| #85 duration 비율 | float 800→1200ms, glow-pulse 400→600ms, timeout 850→1300ms (1200+100) | 유저 리포트 기준 "너무 빨리 없어짐". 1.5배 연장으로 체감 개선. timeout margin 100ms 는 애니메이션 완료 보장용 여유값 | 2.0배(1600ms) 연장 — 과도하게 느릴 수 있음 |

---

## 생성/수정 파일

- `src/components/game/FloatingScore.tsx` (수정) — `BUTTON_COLORS` hex 직접값 교체, `getAnimation()` duration 수정
- `src/pages/GamePage.tsx` (수정) — `spawnFloatingScore` setTimeout 850ms → 1300ms

---

## 인터페이스 정의

외부 인터페이스 변경 없음. `FloatingItem`, `FloatingScoreProps` 타입 유지. 내보낸 함수 시그니처 모두 유지.

```typescript
// 변경 없음 (참조용)
export interface FloatingItem {
  id: number
  color: ButtonColor
  multiplier: number
  x: number
  y: number
}

export function getLabelColor(color: ButtonColor, multiplier: number): string
export function getLabelSize(multiplier: number): number
export function getLabelGlow(color: ButtonColor, multiplier: number): string
```

---

## 핵심 로직

### #84 — `BUTTON_COLORS` hex 교체 (`FloatingScore.tsx`)

```typescript
// Before
const BUTTON_COLORS: Record<ButtonColor, string> = {
  orange: 'var(--vb-orange-base)',
  blue:   'var(--vb-blue-base)',
  green:  'var(--vb-green-base)',
  yellow: 'var(--vb-yellow-base)',
}

// After (index.css :root 값과 일치)
const BUTTON_COLORS: Record<ButtonColor, string> = {
  orange: '#FF6200',
  blue:   '#0A7AFF',
  green:  '#18B84A',
  yellow: '#F5C000',
}
```

`getLabelGlow()` 로직은 변경 없음. `BUTTON_COLORS` 맵이 hex를 반환하므로 `${base}88`이 `#FF620088` 형태의 유효한 8자리 hex로 생성된다.

### #85 — `getAnimation()` duration 수정 (`FloatingScore.tsx`)

```typescript
// Before
function getAnimation(multiplier: number): string {
  const base = 'vb-float 800ms cubic-bezier(0.22, 1, 0.36, 1) forwards'
  if (multiplier >= 3) {
    return `${base}, vb-glow-pulse 400ms ease-in-out 2`
  }
  return base
}

// After
function getAnimation(multiplier: number): string {
  const base = 'vb-float 1200ms cubic-bezier(0.22, 1, 0.36, 1) forwards'
  if (multiplier >= 3) {
    return `${base}, vb-glow-pulse 600ms ease-in-out 2`
  }
  return base
}
```

### #85 — `spawnFloatingScore` setTimeout 수정 (`GamePage.tsx`)

```typescript
// Before (L203)
}, 850)

// After
}, 1300)
```

---

## 주의사항

- **Breaking Change 없음**: `FloatingScore` 컴포넌트 외부 인터페이스 변경 없음. `getLabelColor()`, `getLabelGlow()`, `getLabelSize()` 시그니처 유지.
- **CSS 변수 동기화**: `BUTTON_COLORS` hex 값이 `src/index.css :root`의 CSS 변수 값과 일치해야 한다. 색상 변경 시 두 곳 모두 수정 필요 — 이 의존성을 `FloatingScore.tsx` 파일 상단 주석으로 명시한다.
- **`getLabelColor()` 영향 없음**: `multiplier === 1` 케이스는 `'#e8e8ea'`를 직접 반환하며 `BUTTON_COLORS`를 참조하지 않는다. `multiplier > 1` 케이스는 hex 값으로 바뀌어도 기존 색상과 동일하게 렌더링된다.
- **DB 영향도**: 없음. UI 전용 수정.
- **`vb-float` keyframe 변경 없음**: `src/index.css`의 keyframe 자체는 수정하지 않는다. duration만 `getAnimation()` 내에서 변경.
- **timeout margin**: setTimeout 1300ms = animation 1200ms + 100ms 여유. 여유값은 렌더러 지연을 흡수한다. animation이 끝나기 전에 DOM에서 제거되면 깜빡임 가능성 있음 — 100ms는 최소한의 안전값.

---

## 테스트 경계

- **단위 테스트 가능**: `getLabelGlow()` — multiplier >= 3 케이스에서 반환값이 `var(--vb-` 포함 여부 검사 → 포함되지 않아야 함 (hex 형식 검증)
- **통합 테스트 필요**: 없음
- **수동 검증**:
  1. [MANUAL-1] multiplier x3 이상 히트 시 `+3`, `+4`, `+5` 라벨에 글로우 이펙트(주황/파란/초록/노랑 빛) 렌더링 확인
  2. [MANUAL-2] 떠오르는 애니메이션이 약 1.2초 지속되는지 눈으로 확인 (기존 0.8초 대비 느림)
  3. [MANUAL-3] 라벨이 화면에서 완전히 fade-out된 후 DOM에서 제거되는지 확인 (깜빡임 없음)
  4. [MANUAL-4] 빠른 연속 히트 시 이전 라벨이 사라지기 전에 새 라벨이 독립적으로 생성되는지 확인

---

## 수용 기준

| # | 항목 | 대상 | 유형 |
|---|---|---|---|
| AC1 | multiplier >= 3 히트 시 FloatingScore 라벨 주변에 해당 버튼 색상 글로우가 렌더링된다 | FloatingScore | MANUAL |
| AC2 | multiplier 1, 2 히트 시 글로우 없음 (기존 동작 유지) | FloatingScore | MANUAL |
| AC3 | `getLabelGlow()` 반환값에 `var(--` 문자열이 포함되지 않는다 | getLabelGlow 함수 | BROWSER:DOM (DevTools text-shadow 확인) |
| AC4 | FloatingScore 라벨이 화면에 머무는 시간이 약 1.2초 (기존 0.8초보다 길어짐) | vb-float 애니메이션 | MANUAL |
| AC5 | 라벨이 완전히 사라진 후 DOM 에서 제거된다 (timeout 1300ms 기준) | spawnFloatingScore timeout | BROWSER:DOM (Elements 패널 확인) |
