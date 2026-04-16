---
depth: std
# SPEC_GAP 해결 이력
# 2026-04-16: useCoin.ts addCoins 오류 핸들러 throw 전환 (방안 A 채택)
#   — impl 01 addCoins가 오류 시 throw 대신 return getBalance()로 구현됨
#   — impl 03 try/catch 전제조건 불충족 → 오류 시 setCoinReward 항상 실행 버그
#   — 수정: useCoin.ts를 이 impl 수정 파일 목록에 추가, throw error 명세
---
# 03. 광고 완시청 코인 적립 (F2)

## 결정 근거

- **`randomCoinReward()` 위치: `src/lib/gameLogic.ts` 또는 `src/lib/ait.ts`**: 가중치 랜덤은 광고 SDK 종속 로직이 아니라 순수 게임 비즈니스 로직이다. `ait.ts`는 SDK 래퍼 전용으로 유지하고, `randomCoinReward()`는 `src/lib/gameLogic.ts`에 추가한다. 테스트 용이성도 확보된다.
- **`CoinRewardBadge` 컴포넌트 신규**: 토스트(`showToastMsg`)를 재사용하지 않고 별도 컴포넌트를 작성하는 이유는, float-up 애니메이션(impl 07)과의 통합 진입점을 제공하기 위해서다. impl 07에서 `CoinRewardBadge`를 확장해 float-up 트리거를 붙인다.
- **샌드박스 고정 2개**: `IS_SANDBOX` 분기로 고정값 반환. 실제 광고 완시청 없이도 코인 적립 흐름을 개발/테스트 가능하게 한다. `useRewardAd`의 샌드박스 mock(`resolve(true)`) 특성상 DEV 환경에서는 항상 `earned=true`가 된다.
- **`addCoins` 호출 위치**: ResultPage의 `showAd()` useEffect 내 `userEarnedReward` 이후 분기. impl 02에서 `grantDailyReward()` 호출이 제거된 자리를 대체한다.
- **가중치 랜덤 확률**: 1→30%/2→30%/3→25%/4→10%/5→5%. PRD v0.4 명세 준수. 배열 누적 구조로 구현 (O(n)).
- **`addCoins` 오류 시 throw — impl 03 수정 파일 목록에 `useCoin.ts` 포함**: impl 01 구현에서 `addCoins` 오류 핸들러가 `return await getBalance()`로 작성되어 throw 전제조건이 불충족됨이 확인되었다(SPEC_GAP #109). 방안 B(반환값 기반 오류 감지)는 신규 유저 + 오류 시 반환값이 `addCoins(0)` 성공 반환값과 구별 불가능하여 채택 불가. **방안 A 채택**: `useCoin.ts`의 오류 핸들러를 `throw error`로 수정하고, 이 impl 수정 파일 목록에 `useCoin.ts`를 포함한다. ResultPage의 try/catch 구조는 변경 없이 유지.
- **`CoinRewardBadge` useEffect 의존성 — `useRef` 패턴 선택**: ResultPage에서 `onDismiss`로 인라인 `() => setCoinReward(null)`을 전달하면, ResultPage 리렌더 시마다 새 함수 참조가 생성된다. `useEffect([onDismiss])` 의존성에 이 참조를 넣으면 타이머가 리렌더마다 재설정(drift)된다. `useRef(onDismiss)`로 콜백을 캡처하고 의존성 배열을 `[]`(마운트 1회)로 고정하면 이 문제를 제거할 수 있다. ResultPage에서 `useCallback` 적용하는 것보다 컴포넌트 내부에서 해결하는 쪽이 호출자 부담이 없다.

---

## 생성/수정 파일

| 파일 | 작업 |
|---|---|
| `src/hooks/useCoin.ts` | 수정 — `addCoins` 오류 핸들러 `throw error` 전환 (SPEC_GAP 해결) |
| `src/index.css` | 수정 — `--vb-toast-bg` CSS 변수 추가 |
| `src/components/result/CoinRewardBadge.tsx` | 신규 — "🪙 +N 코인 획득!" 배지 |
| `src/lib/gameLogic.ts` | 수정 — `randomCoinReward()` 추가 |
| `src/pages/ResultPage.tsx` | 수정 — 광고 완시청 후 코인 적립 + CoinRewardBadge 표시 |

---

## src/hooks/useCoin.ts

### 수정: `addCoins` 오류 핸들러 `throw` 전환 (SPEC_GAP 해결)

**변경 전 (impl 01 구현 현재 상태):**
```typescript
if (error) {
  console.error('[useCoin] addCoins error:', error)
  return await getBalance()  // ← 오류 삼킴: 호출자에게 성공으로 위장
}
```

**변경 후:**
```typescript
if (error) {
  console.error('[useCoin] addCoins error:', error)
  throw error  // PostgrestError를 그대로 throw → 호출자 catch 블록 도달
}
```

> **왜 `throw error`인가**: `return await getBalance()`는 오류를 삼키고 구 잔액을 반환한다. 호출자(impl 03 ResultPage)에서 `try { await addCoins(...); setCoinReward(...) } catch { ... }`로 작성되어 있으므로, `catch` 블록이 도달하지 않으면 코인이 미지급된 상태에서 `setCoinReward`가 실행되어 배지가 잘못 표시된다. 반환값 기반 오류 감지(방안 B)는 신규 유저(잔액 0) 상황에서 실패 반환값 0과 정상 잔액 0이 구별 불가능하여 채택 불가. `throw error`가 유일한 올바른 구현이다.

> **`getBalance()` 제거 이유**: 오류 시 getBalance를 호출해 잔액을 동기화하는 것은 불필요한 추가 RPC 호출이다. 호출자(ResultPage)는 오류 발생 시 코인 잔액 표시를 업데이트할 필요가 없으므로 setCoinBalance 동기화도 불필요하다. 오류 시에는 toastMsg만 표시한다.

> **타입 변경 없음**: `addCoins`의 반환 타입 `Promise<number>`는 유지된다. throw 경로에서는 반환값이 없으므로 타입 시그니처 변경이 불필요하다.

---

## src/index.css

### 추가 CSS 변수

`:root` 블록 내 기존 변수 목록 끝에 아래를 추가한다.

```css
/* Toast / Badge 배경 */
--vb-toast-bg: rgba(20, 20, 20, 0.92);
```

> **근거**: CoinRewardBadge의 `backgroundColor`를 하드코딩 rgba로 쓰면 pr-reviewer의 `--vb-*` 컨벤션 검사에서 CHANGES_REQUESTED가 발생한다. CSS 변수로 추출해 단일 진실 공급원을 유지한다. 향후 impl 07(coin-ui-polish) 또는 다른 토스트 컴포넌트에서도 동일 변수를 참조할 수 있다.

---

## src/lib/gameLogic.ts

### 추가 함수

```typescript
// 가중치 랜덤 코인 지급량 (PRD v0.4 F2)
// 확률: 1→30% / 2→30% / 3→25% / 4→10% / 5→5%
// IS_SANDBOX=true 시 고정 2개 반환 (호출자 책임)
const COIN_REWARD_TABLE: { amount: number; weight: number }[] = [
  { amount: 1, weight: 30 },
  { amount: 2, weight: 30 },
  { amount: 3, weight: 25 },
  { amount: 4, weight: 10 },
  { amount: 5, weight: 5  },
]

export function randomCoinReward(): number {
  const roll = Math.random() * 100
  let cumulative = 0
  for (const { amount, weight } of COIN_REWARD_TABLE) {
    cumulative += weight
    if (roll < cumulative) return amount
  }
  return 1  // fallback (이론상 도달 불가)
}
```

---

## src/components/result/CoinRewardBadge.tsx

### 인터페이스

```typescript
interface CoinRewardBadgeProps {
  amount: number         // 지급된 코인 수
  onDismiss?: () => void // 3초 후 자동 dismiss 완료 콜백 (optional)
}

export function CoinRewardBadge({ amount, onDismiss }: CoinRewardBadgeProps): JSX.Element
```

### 핵심 구현

```tsx
import { useEffect, useRef } from 'react'

export function CoinRewardBadge({ amount, onDismiss }: CoinRewardBadgeProps) {
  // useRef로 콜백 캡처 — 의존성 배열을 [] 고정해 마운트 시 1회만 타이머 설정
  // ResultPage가 리렌더되어 인라인 () => setCoinReward(null) 참조가 바뀌어도
  // 타이머가 재설정(drift)되지 않는다
  const onDismissRef = useRef(onDismiss)

  useEffect(() => {
    if (!onDismissRef.current) return
    const timer = setTimeout(() => onDismissRef.current?.(), 3000)
    return () => clearTimeout(timer)
  }, []) // 마운트 시 1회 — onDismissRef.current로 최신 콜백 참조

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'var(--vb-toast-bg)',
      color: 'var(--vb-accent)',
      padding: '10px 20px',
      borderRadius: 24,
      fontSize: 14,
      fontFamily: 'var(--vb-font-body)',
      fontWeight: 700,
      whiteSpace: 'nowrap',
      zIndex: 200,
      border: '1px solid var(--vb-border)',
    }}>
      🪙 +{amount} 코인 획득!
    </div>
  )
}
```

> **impl 07 통합 포인트**: float-up 애니메이션은 impl 07에서 `CoinRewardBadge` 내부 또는 ResultPage에서 `coinFloatUp` keyframe을 트리거한다. 이 컴포넌트에는 애니메이션 훅 진입점을 보존한다.

---

## src/pages/ResultPage.tsx

### 추가 state

```typescript
const [coinReward, setCoinReward] = useState<number | null>(null)
```

### useCoin 훅 사용

```typescript
import { useCoin } from '../hooks/useCoin'
// ...
const { addCoins } = useCoin()
```

### 수정: showAd useEffect 내 earned 분기

```typescript
// impl 02에서 grantDailyReward() 호출이 제거된 자리 대체
const earned = await showAd()
if (cancelled) return

if (earned) {
  try {
    const rewardAmount = IS_SANDBOX ? 2 : randomCoinReward()
    await addCoins(rewardAmount, 'ad_reward')
    setCoinReward(rewardAmount)  // CoinRewardBadge 표시 트리거
  } catch {
    showToastMsg('코인 지급 중 오류가 발생했습니다')
  }
}
```

> `IS_SANDBOX`는 `src/lib/ait.ts`에서 export하거나, ResultPage 내부에서 `import.meta.env.DEV` 로 직접 사용. ait.ts에서 `export const IS_SANDBOX = ...`로 노출되어 있지 않으면 ResultPage에서 `const IS_SANDBOX = import.meta.env.DEV || import.meta.env.VITE_SANDBOX === 'true'`를 선언한다.

### JSX: CoinRewardBadge 마운트

```tsx
import { CoinRewardBadge } from '../components/result/CoinRewardBadge'

// return 내 toast 바로 위에 추가
{coinReward !== null && (
  <CoinRewardBadge
    amount={coinReward}
    onDismiss={() => setCoinReward(null)}
  />
)}
```

---

## 주의사항

- `randomCoinReward()`는 `gameLogic.ts`에 추가한다. `ait.ts`에 넣지 않는다.
- `IS_SANDBOX` 상수는 ResultPage 내에서 `import.meta.env.DEV || import.meta.env.VITE_SANDBOX === 'true'`로 선언하거나, `ait.ts`에서 named export로 노출한다. 어느 방향이든 일관성을 유지한다.
- `CoinRewardBadge`의 `position: fixed`는 GameOverOverlay(zIndex 200)보다 낮지 않아야 하므로 zIndex 200 동급으로 설정한다.
- `addCoins` 실패 시 setCoinReward는 호출하지 않는다 — 코인 미지급 상태에서 배지 표시 금지.
  - 이 보장은 `useCoin.ts` `addCoins`가 오류 시 `throw error`를 한다는 전제에 의존한다.
  - **이 impl에서 `useCoin.ts` 오류 핸들러를 `throw error`로 수정한다** (SPEC_GAP 해결 — impl 01 구현이 `return await getBalance()`로 작성되어 있었음).
  - 위 명세 섹션 "src/hooks/useCoin.ts" 참조.
- `CoinRewardBadge`의 `onDismissRef.current`는 마운트 시점의 `onDismiss` 참조를 캡처한다. 컴포넌트가 unmount/remount 없이 `onDismiss` prop이 교체되는 경우 최신 콜백이 반영되지 않는다. 단, `coinReward !== null` 조건이 참인 동안 ResultPage가 `onDismiss`를 교체할 이유가 없으므로 실제 문제 없음.

---

## 테스트 경계

- `randomCoinReward()` 단위 테스트: 1000회 호출 시 확률 분포가 허용 오차(±5%) 이내인지 확인
- 샌드박스: `earned=true` → `setCoinReward(2)` → "🪙 +2 코인 획득!" 배지 표시 확인
- `addCoins` Supabase 에러 시 배지 미표시, 토스트 메시지 표시 확인
- 3초 후 `setCoinReward(null)` 호출로 배지 사라짐 확인

---

## 의존 모듈

- **선행**: impl 01 (useCoin 훅) — `addCoins()` 사용
- **선행**: impl 02 (daily-reward-removal) — ResultPage `earned` 분기 정리 완료 전제
- **이후**: impl 07 (coin-ui-polish) — `CoinRewardBadge` 확장 + `coinFloatUp` 애니메이션 추가
