---
depth: simple
---
# #119 버그픽스 — ESLint 전체 에러/경고 28건 일괄 수정

> 원래 이슈: [#119](https://github.com/alruminum/memory-battle/issues/119)

---

## 개요

`npx eslint . --max-warnings 0` 실행 시 23 errors + 5 warnings(총 28건) 발생.
하네스 autocheck 게이트 실패 원인. 0 errors, 0 warnings 달성이 목표.

---

## 결정 근거

### D1 — coverage/ 디렉토리: `.eslintignore` 대신 `globalIgnores` 활용

커버리지 출력물(block-navigation.js 등)은 자동 생성 파일로 ESLint 대상이 아니다.
flat config에서는 `.eslintignore`가 deprecated — `eslint.config.js`의 `globalIgnores(['dist', 'coverage'])`로 통합 관리.

| 옵션 | 설명 | 채택 |
|---|---|---|
| A: `.eslintignore` 신규 생성 | deprecated in flat config | ❌ |
| **B: `globalIgnores` 수정 (채택)** | flat config 표준, 1줄 변경 | ✅ |

### D2 — `_`-접두사 미사용 인자: 규칙 오버라이드로 일괄 처리

`_table`, `_col`, `_val`, `_duration`, `_multiplier` 등 6건이 `@typescript-eslint/no-unused-vars`에 걸린다.
모두 **의도적으로 타입 시그니처 매칭용으로 선언한 파라미터**이며 `_` 접두사가 이미 명시돼 있다.
`tseslint.configs.recommended`의 기본값은 `argsIgnorePattern`을 설정하지 않는다.
개별 suppresssion 대신 eslint.config.js에서 `argsIgnorePattern: '^_'`으로 전체 해결.

### D3 — `react-refresh/only-export-components`: FloatingScore 유틸 분리

`FloatingScore.tsx`가 컴포넌트 외 함수 3개(`getLabelColor`, `getLabelSize`, `getLabelGlow`)를 export해 rule 위반.
이미 2개 테스트 파일(`FloatingScore.test.ts`, `FloatingScore.fix.test.tsx`)이 이 함수들을 직접 import한다.

| 옵션 | 설명 | 채택 |
|---|---|---|
| A: re-export 유지 | re-export 해도 rule은 여전히 위반 | ❌ |
| **B: `floatingScoreUtils.ts` 신규 분리 (채택)** | rule 의도에 맞고, 테스트 import 경로만 업데이트 | ✅ |
| C: rule 억제 (`allowConstantExport`) | fast refresh 목적의 rule을 비활성화하는 건 근본 원인 미해결 | ❌ |

**영향 범위**: `FloatingScore.tsx`, `FloatingScore.test.ts`, `FloatingScore.fix.test.tsx` (import 경로 수정).
`GamePage.tsx`는 `FloatingScore` 컴포넌트·`FloatingItem` 타입만 사용 — 변경 불필요.

### D4 — `as any` in test mocks: `as unknown as Type` 패턴

`mockReturnValue({ ... } as any)` 패턴에서 `any` 제거.
`as unknown as ReturnType<typeof hook>` 이중 캐스팅이 표준 대안 — `unknown`은 no-explicit-any에 해당하지 않음.
MainPage 테스트의 `makeStoreMock`은 로컬 인터페이스 정의로 해결.

### D5 — `react-hooks/set-state-in-effect` in ComboIndicator: 인라인 파생 상태 패턴

ComboIndicator의 `useEffect(() => { setIsShaking(isBreaking) }, [isBreaking])` 패턴은 prop → state 동기화로 useEffect 없이 render 중 처리 가능.
React 문서 "Adjusting some state when a prop changes" 패턴(prevRef + 렌더 중 조건부 setState) 사용.

```
isBreaking false→true: prevRef=false, current=true → setIsShaking(true) (렌더 중 즉시)
애니메이션 종료: handleAnimationEnd → setIsShaking(false)
isBreaking true→false (게임 재시작): prevRef=true, current=false → setIsShaking(false)
```

이 패턴은 lint rule을 통과하며 기존 동작을 보존한다.

### D6 — `react-hooks/set-state-in-effect` in ComboTimer: eslint-disable 억제

ComboTimer의 두 지점(`setCollapsePhase('none')` line 68, `setElapsedMs(0)` line 82)은 interval 관리·VisibilityAPI 핸들러와 얽혀 있어 인라인 파생 상태로 분리 시 타이밍 부작용 위험이 높다.
이 effect들은 의도적인 prop→state 동기화이며, `eslint-disable-next-line`으로 억제 + 사유 주석 기재.

### D7 — `react-hooks/purity` in MultiplierBurst: eslint-disable 억제

`useMemo` 안의 `Math.random()` 호출. 파티클 좌표는 매 isVisible 변경마다 다른 값이어야 하는 **의도적 랜덤성** — `useEffect`+`useState`로 이전하면 `set-state-in-effect` 위반이 새로 발생하고 렌더 타이밍이 복잡해진다.
`useMemo` 패턴이 기능적으로 맞으므로 `eslint-disable-next-line`으로 억제.

### D8 — `debug.ts`: 오정렬 disable 주석 + `any[]` → `unknown[]`

기존 `eslint-disable-next-line`이 ternary 2번째 줄(함수 선언 줄)이 아닌 1번째 줄(const 선언)에 위치해 disable이 적용되지 않음 → unused directive warning + 3번째 줄 error 이중 발생.
근본 수정: `any[]` → `unknown[]` 타입 교체 (console.log/warn 시그니처는 `any[]`를 수용하므로 컴파일 가능).

---

## 수정 파일 목록

| # | 파일 | 변경 유형 | 수정 건수 |
|---|---|---|---|
| 1 | `eslint.config.js` | 수정 | coverage ignore + argsIgnorePattern |
| 2 | `src/components/game/floatingScoreUtils.ts` | **신규** | 유틸 함수 3개 추출 |
| 3 | `src/components/game/FloatingScore.tsx` | 수정 | 유틸 함수 제거 → import 전환 |
| 4 | `src/__tests__/FloatingScore.test.ts` | 수정 | import 경로 |
| 5 | `src/__tests__/FloatingScore.fix.test.tsx` | 수정 | import 경로 |
| 6 | `src/__tests__/MainPage.coin-ui-polish.test.tsx` | 수정 | `any` → `MockStoreState` |
| 7 | `src/__tests__/ResultPage.coin-ui-polish.test.tsx` | 수정 | `as any` → `as unknown as Type` |
| 8 | `src/components/game/ComboIndicator.tsx` | 수정 | set-state-in-effect 제거 |
| 9 | `src/components/game/ComboTimer.tsx` | 수정 | eslint-disable 2건 |
| 10 | `src/components/game/MultiplierBurst.tsx` | 수정 | eslint-disable 2건 |
| 11 | `src/lib/debug.ts` | 수정 | `any[]` → `unknown[]`, 오정렬 주석 제거 |

---

## 1. `eslint.config.js`

### 변경 사항

```js
// Before:
globalIgnores(['dist']),

// After:
globalIgnores(['dist', 'coverage']),
```

그리고 `files: ['**/*.{ts,tsx}']` 블록 안에 `rules` 섹션 추가:

```js
{
  files: ['**/*.{ts,tsx}'],
  extends: [
    js.configs.recommended,
    tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
    reactRefresh.configs.vite,
  ],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  rules: {
    // _접두사 파라미터/변수는 의도적 미사용으로 허용 (mock 시그니처 매칭 등)
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
  },
},
```

**해결 건수**: coverage 3 warnings + `_table`/`_col`×2/`_val`/`_duration`×2/`_multiplier` = 총 10건

---

## 2. `src/components/game/floatingScoreUtils.ts` (신규)

```typescript
import type { ButtonColor } from '../../types'

// IMPORTANT: hex 값은 src/index.css :root의 CSS 변수와 일치해야 한다.
// 색상 변경 시 두 곳 모두 수정 필요:
//   --vb-orange-base, --vb-blue-base, --vb-green-base, --vb-yellow-base
// CSS 변수 문자열 연결(예: 'var(--vb-orange-base)88')은 유효하지 않은 CSS가 되어
// text-shadow 전체가 파싱 실패함 → hex 직접 사용이 유일한 안전한 방법.
export const BUTTON_COLORS: Record<ButtonColor, string> = {
  orange: '#FF6200',
  blue:   '#0A7AFF',
  green:  '#18B84A',
  yellow: '#F5C000',
}

export function getLabelColor(color: ButtonColor, _multiplier?: number): string {
  return BUTTON_COLORS[color]
}

const SIZE_TABLE: Record<number, number> = { 1: 24, 2: 30, 3: 36, 4: 40 }

export function getLabelSize(multiplier: number): number {
  if (multiplier >= 5) return 44
  return SIZE_TABLE[multiplier] ?? 24
}

export function getLabelGlow(color: ButtonColor, multiplier: number): string {
  if (multiplier < 2) return 'none'
  const base = BUTTON_COLORS[color]
  const strength = 8 + multiplier * 4
  const spread = 20 + multiplier * 6
  return `0 0 ${strength}px ${base}, 0 0 ${spread}px ${base}88`
}
```

> 주의: `_multiplier`는 `argsIgnorePattern: '^_'` 설정으로 lint 통과. 기존 테스트 호출 시그니처(`getLabelColor(color, multiplier)`) 유지를 위해 제거하지 않음.

---

## 3. `src/components/game/FloatingScore.tsx`

### 변경 사항

1. 기존 `BUTTON_COLORS`, `getLabelColor`, `SIZE_TABLE`, `getLabelSize`, `getLabelGlow` 선언 **삭제**
2. `import` 구문 추가:
   ```tsx
   import { getLabelColor, getLabelSize, getLabelGlow } from './floatingScoreUtils'
   ```
3. 기존 `import React from 'react'`와 `import type { ButtonColor } from '../../types'` 유지 (FloatingItem 인터페이스는 이 파일에 남겨 GamePage.tsx import 호환 유지)

### 핵심 불변 조건

- `FloatingItem` 인터페이스와 `FloatingScore` 컴포넌트는 이 파일에 **그대로 유지**
- `GamePage.tsx`의 `import { FloatingScore, type FloatingItem } from '../components/game/FloatingScore'` 변경 불필요

---

## 4. `src/__tests__/FloatingScore.test.ts`

### import 수정

```ts
// Before:
import { getLabelColor, getLabelSize, getLabelGlow } from '../components/game/FloatingScore'

// After:
import { getLabelColor, getLabelSize, getLabelGlow } from '../components/game/floatingScoreUtils'
```

---

## 5. `src/__tests__/FloatingScore.fix.test.tsx`

### import 분리

```tsx
// Before:
import { getLabelColor, getLabelGlow, FloatingScore } from '../components/game/FloatingScore'
import type { FloatingItem } from '../components/game/FloatingScore'

// After:
import { FloatingScore } from '../components/game/FloatingScore'
import type { FloatingItem } from '../components/game/FloatingScore'
import { getLabelColor, getLabelGlow } from '../components/game/floatingScoreUtils'
```

---

## 6. `src/__tests__/MainPage.coin-ui-polish.test.tsx`

### 변경 사항: `makeStoreMock` 타입 명시

```tsx
// Before (line 28-39):
function makeStoreMock(coinBalance: number) {
  return (selector?: (s: any) => any) => {
    const state = {
      userId: '',
      setUserId: vi.fn(),
      score: 0,
      stage: 1,
      coinBalance,
    }
    return typeof selector === 'function' ? selector(state) : state
  }
}

// After:
interface MockStoreState {
  userId: string
  setUserId: ReturnType<typeof vi.fn>
  score: number
  stage: number
  coinBalance: number
}

function makeStoreMock(coinBalance: number) {
  return (selector?: (s: MockStoreState) => unknown) => {
    const state: MockStoreState = {
      userId: '',
      setUserId: vi.fn(),
      score: 0,
      stage: 1,
      coinBalance,
    }
    return typeof selector === 'function' ? selector(state) : state
  }
}
```

> `mockGetBalance` (line 25)는 사용되므로 변경 없음.

---

## 7. `src/__tests__/ResultPage.coin-ui-polish.test.tsx`

### 변경 사항: `as any` → `as unknown as ReturnType<...>`

총 4건. 각 mock의 실제 hook import가 이미 파일 상단에 있으므로 `ReturnType<typeof hook>` 사용 가능.

```tsx
// line 51 (useGameStore mock):
} as unknown as ReturnType<typeof useGameStore>)

// line 58 (useRanking mock):
} as unknown as ReturnType<typeof useRanking>)

// line 63 (useRewardAd mock):
} as unknown as ReturnType<typeof useRewardAd>)

// line 68 (useCoin mock):
} as unknown as ReturnType<typeof useCoin>)
```

---

## 8. `src/components/game/ComboIndicator.tsx`

### 변경 사항: useEffect 제거 → 인라인 파생 상태

```tsx
// Before imports:
import { useState, useEffect, useCallback } from 'react'

// After imports:
import { useState, useRef, useCallback } from 'react'
```

컴포넌트 본문에서 기존 `useEffect` 블록(line 14-20) 제거하고 아래로 교체:

```tsx
export function ComboIndicator({ comboStreak, isBreaking = false }: ComboIndicatorProps) {
  const [isShaking, setIsShaking] = useState(false)

  // isBreaking prop→state 동기화: React 파생 상태 패턴 (useEffect 없이 렌더 중 처리)
  // ref.current ≠ isBreaking 일 때만 setState → 렌더 루프 방지
  const prevIsBreaking = useRef(isBreaking)
  if (prevIsBreaking.current !== isBreaking) {
    prevIsBreaking.current = isBreaking
    setIsShaking(isBreaking)
  }

  const handleAnimationEnd = useCallback((e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === 'comboBreakShake') {
      setIsShaking(false)  // 애니메이션 완료 후 클래스 제거
    }
  }, [])

  // ... 이하 JSX 변경 없음
```

### 동작 검증

| 시나리오 | 기대 결과 |
|---|---|
| isBreaking false→true | prevRef=false≠true → setIsShaking(true) → 쉐이크 시작 |
| 애니메이션 완료 (isBreaking=true 유지) | handleAnimationEnd → setIsShaking(false), prevRef=true=true → no-op |
| isBreaking true→false (게임 재시작) | prevRef=true≠false → setIsShaking(false) → 즉시 정지 |

---

## 9. `src/components/game/ComboTimer.tsx`

### 변경 사항: eslint-disable-next-line 2건 추가

**line 68 (`setCollapsePhase('none')` 앞):**
```tsx
  if (!isBreaking) {
    // isBreaking prop→state 동기화: interval+VisibilityAPI 로직과 얽혀 있어
    // 인라인 파생 상태 분리 시 타이밍 부작용 우려 — 의도적 suppression
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsePhase('none')
    return
  }
```

**line 82 (`setElapsedMs(0)` 앞):**
```tsx
    // interval 정지와 elapsedMs 초기화를 동일 effect에서 처리 — 의도적 suppression
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setElapsedMs(0)
    return
```

---

## 10. `src/components/game/MultiplierBurst.tsx`

### 변경 사항: eslint-disable-next-line 2건 추가

`useMemo` 내부 line 33, 34:

```tsx
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (360 / PARTICLE_COUNT) * i
    const rad = (angle * Math.PI) / 180
    // 파티클 좌표는 isVisible 변경마다 의도적으로 다른 값이어야 함 (시각적 랜덤성)
    // useEffect로 이전 시 set-state-in-effect 위반이 새로 발생 — useMemo 유지
    // eslint-disable-next-line react-hooks/purity
    const dist = 80 + Math.random() * 40
    // eslint-disable-next-line react-hooks/purity
    const size = 8 + Math.random() * 6
    return {
      px: Math.cos(rad) * dist,
      py: Math.sin(rad) * dist,
      size,
      delay: i * 25,
    }
  })
```

---

## 11. `src/lib/debug.ts`

### 변경 사항: `any[]` → `unknown[]`, 오정렬 주석 제거

```typescript
// Before:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dbg = import.meta.env.DEV
  ? (...args: any[]) => console.log(...args)
  : () => {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dbgWarn = import.meta.env.DEV
  ? (...args: any[]) => console.warn(...args)
  : () => {}

// After:
export const dbg = import.meta.env.DEV
  ? (...args: unknown[]) => console.log(...args)
  : () => {}

export const dbgWarn = import.meta.env.DEV
  ? (...args: unknown[]) => console.warn(...args)
  : () => {}
```

> 근거: `console.log`/`warn` 시그니처는 `(...data: any[])` — `unknown[]`의 스프레드는 TypeScript에서 허용됨(unknown은 any로 할당 가능). 기존 `eslint-disable-next-line`은 3번째 줄(ternary 분기)이 아닌 1번째 줄(const 선언)을 억제하고 있어 실제 효과 없음 + "unused directive" warning 발생 → 주석 삭제 + 타입 교체로 근본 해결.

---

## 최종 기대 결과

```
$ npx eslint . --max-warnings 0
✓ 0 errors, 0 warnings
```

---

## 주의사항

- `FloatingScore.tsx`에서 `BUTTON_COLORS`를 제거할 때 파일 상단의 **주석(CSS 변수 경고)**도 `floatingScoreUtils.ts`로 함께 이전한다
- `FloatingScore.tsx` 내 `FloatingScore` 컴포넌트가 `floatingScoreUtils`의 함수를 정상 호출하는지 로컬 빌드(`npm run build`)로 확인
- `ComboIndicator` 변경 후 `isBreaking` prop이 `GameOverOverlay` 등 호출부에서 올바르게 전달되는지 회귀 테스트 포함
- 이 수정은 **동작 변경 없음** — ESLint 0/0 달성 목적만
