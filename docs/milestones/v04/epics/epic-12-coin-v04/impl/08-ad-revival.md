---
depth: std
---
# 08. 광고 부활 옵션 (F4-AD)

> 관련 이슈: [#124](https://github.com/alruminum/memory-battle/issues/124)
> 의존: impl 05 (F4 코인 부활 — RevivalButton, GameOverOverlay, store.revive() 이미 구현됨)

---

## 결정 근거

### RevivalButton을 F4+F4-AD 통합 컴포넌트로 재설계
- **현재 RevivalButton**: F4 전용. `canRevive = !revivalUsed && coinBalance >= 5` 조건을 만족해야만 "🪙 5코인으로 부활" 버튼을 렌더하고, 그 외 `null` 반환.
- **F4-AD 추가 요구**: 잔액<5인 상태(`canRevive=false`)에서도 "광고 보고 부활" 버튼이 표시돼야 한다. 즉 기존 null 반환 분기가 깨진다.
- **결론**: RevivalButton의 렌더 조건을 `!revivalUsed` 기준으로 확장하고, 내부에서 잔액 기준 버튼 표시를 분기한다. "광고 보고 부활" + "🪙 5코인으로 부활" 2개 버튼을 하나의 컴포넌트 안에서 관리하는 것이 GameOverOverlay 입장에서 경계가 명확하다.
- **대안 검토**: "AdRevivalButton을 별도 컴포넌트로 분리"하는 방안 — GameOverOverlay에서 두 컴포넌트의 `isAdLoading` 상태를 동기화해야 하는 결합이 생긴다. RevivalButton을 단일 컴포넌트로 유지하는 것이 `isAdLoading` 공유 문제를 제거하고 PRD 버튼 표시 조건표를 그대로 코드로 옮길 수 있어 선택.

### GameOverOverlay의 광고 호출 책임
- **`useRewardAd` 훅 위치**: `useRewardAd`는 `show(): Promise<boolean>`과 `isLoading: boolean`을 노출한다(ResultPage mock 기준). 광고 호출 로직은 GameOverOverlay 내부에서 처리한다.
- **이유**: RevivalButton은 순수 UI 컴포넌트로 유지하고, 광고 시작/결과 처리 사이드이펙트는 부모(GameOverOverlay)가 담당한다. F4 코인 부활의 `handleRevive`와 같은 패턴.
- **`show()` 반환값**: `true` = 완시청(userEarnedReward), `false` = 스킵/실패/타임아웃 — docs/sdk.md 확인.

### 광고 완시청 시 `revive()` 직접 호출, 코인 미지급
- PRD §12 F4-AD: "완시청 → 코인 미지급, revivalUsed=true, 현 스테이지 재시작"
- `store.revive()`는 sequence를 유지한 채 status='SHOWING'으로 전환한다(impl 05, gameStore.ts 확인).
- `addCoins`를 호출하지 않는다. 코인 적립은 결과용 광고(ResultPage)에서만.

### 광고 진행 중 두 버튼 모두 비활성 — `isAdLoading` props
- PRD §12 F4-AD: "광고 시작 직후 두 버튼 모두 비활성(로딩 상태)"
- `isAdLoading` 상태는 GameOverOverlay가 관리하고 RevivalButton에 props로 전달한다.
- `isAdLoading=true` 구간: `handleAdRevive` 호출 직후 ~ `show()` Promise 완료까지.
- 기존 `isProcessing`(코인 차감 처리 중)과 별개 state로 관리한다. 두 처리가 동시에 발생하는 케이스는 없지만 명시적으로 분리해 각 흐름을 독립적으로 추적한다.
- RevivalButton은 두 props(`isProcessing`, `isAdLoading`) 중 하나라도 true이면 두 버튼 모두 disabled 처리.

### 광고 스킵/실패 → 버튼 재활성화
- `show()` → `false` 반환 시: `isAdLoading=false`로 복원. 버튼이 다시 활성화되어 재시도 가능.
- `revive()`를 호출하지 않으므로 `revivalUsed`는 `false` 유지.

### stopPropagation 보장
- impl 05와 동일 원칙. RevivalButton wrapper div와 각 버튼 모두 `onPointerDown`에서 `e.stopPropagation()` 처리하여 backdrop의 `onConfirm` 버블링 차단.

### RevivalButton.test.tsx (기존 테스트) 호환성
- 기존 테스트: `coinBalance=4, revivalUsed=false → renders nothing`(null 반환 기대).
- F4-AD 도입 후: `coinBalance=4, revivalUsed=false` → "광고 보고 부활" 버튼이 렌더된다. 기존 테스트의 `null` 기대값이 깨진다.
- **결론**: RevivalButton.test.tsx를 F4-AD 스펙으로 전면 교체한다. 기존 테스트는 F4 단독 시절의 스펙이었으므로 v0.4.1 스펙 기준으로 재작성이 맞다.

---

## 생성/수정 파일

| 파일 | 작업 |
|---|---|
| `src/components/game/RevivalButton.tsx` | 수정 — F4-AD 버튼 추가, props 확장, 렌더 조건 변경 |
| `src/components/game/GameOverOverlay.tsx` | 수정 — useRewardAd 연동, handleAdRevive 추가, isAdLoading state 추가 |
| `src/components/game/RevivalButton.test.tsx` | 수정 — F4-AD 스펙으로 전면 교체 |
| `src/pages/GamePage.tsx` | **변경 없음** — GameOverOverlay props 변경 없음 |
| `src/store/gameStore.ts` | **변경 없음** — revive() 이미 구현됨 (impl 05) |

---

## src/components/game/RevivalButton.tsx

### 인터페이스 변경

```typescript
interface RevivalButtonProps {
  coinBalance: number
  revivalUsed: boolean
  isProcessing: boolean    // 코인 차감 처리 중 (기존 F4)
  isAdLoading: boolean     // 광고 로딩/진행 중 (F4-AD 신규)
  onRevive: (e: React.PointerEvent) => void     // 코인 부활 (F4)
  onAdRevive: (e: React.PointerEvent) => void   // 광고 부활 (F4-AD 신규)
}

// 반환 타입: React.ReactElement | null
// revivalUsed=true → null 반환 (버튼 없음)
// revivalUsed=false → 잔액 기준 버튼 렌더
```

### 렌더 조건 분기 (PRD §11 버튼 표시 조건표)

```
revivalUsed=true          → null (버튼 없음)
revivalUsed=false, 잔액<5 → "광고 보고 부활" 버튼 1개
revivalUsed=false, 잔액≥5 → "광고 보고 부활" + "🪙 5코인으로 부활" 버튼 2개
```

### 핵심 구현 의사코드

```tsx
export function RevivalButton(props): React.ReactElement | null {
  if (revivalUsed) return null  // 이미 부활 사용 — 버튼 없음

  const canCoinRevive = coinBalance >= 5
  const isAnyProcessing = isProcessing || isAdLoading

  return (
    <div onPointerDown={(e) => e.stopPropagation()}>

      {/* 광고 부활 버튼 — 항상 표시 (revivalUsed=false이면) */}
      <button
        onPointerDown={!isAnyProcessing ? onAdRevive : (e) => e.stopPropagation()}
        disabled={isAnyProcessing}
        style={{ /* 비어있는 윤곽선 스타일, vb-accent 계열 */ }}
      >
        {isAdLoading ? '광고 로딩 중...' : '광고 보고 부활'}
      </button>

      {/* 코인 부활 버튼 — 잔액≥5 일 때만 표시 */}
      {canCoinRevive && (
        <button
          onPointerDown={!isAnyProcessing ? onRevive : (e) => e.stopPropagation()}
          disabled={isAnyProcessing}
          style={{ /* 코인 색상, 보조 스타일 */ }}
        >
          {isProcessing ? '처리 중...' : '🪙 5코인으로 부활'}
        </button>
      )}

    </div>
  )
}
```

### 스타일 규칙

- 광고 부활 버튼: primary 스타일 — `border: 1px solid var(--vb-accent)`, 텍스트 `var(--vb-accent)`. 기존 코인 부활 버튼 스타일 그대로 계승.
- 코인 부활 버튼: secondary 스타일 — `border: 1px solid var(--vb-border)`, 텍스트 `var(--vb-text-dim)`. 부차적 선택지임을 시각적으로 구분.
- 두 버튼 사이 gap: 8px.
- `isAnyProcessing=true` 시 두 버튼 모두 `opacity: 0.6`.

---

## src/components/game/GameOverOverlay.tsx

### 추가 import

```typescript
import { useRewardAd } from '../../hooks/useRewardAd'
```

### 추가 state + 핸들러

```typescript
export function GameOverOverlay({ reason, coinBalance, revivalUsed, onConfirm }): React.ReactElement {
  const { revive } = useGameStore()
  const { addCoins } = useCoin()
  const { show: showAd } = useRewardAd()               // [F4-AD 신규]
  const [isProcessing, setIsProcessing] = useState(false)
  const [isAdLoading, setIsAdLoading] = useState(false) // [F4-AD 신규]
  const [toast, setToast] = useState<string | null>(null)
  // ...toastTimerRef, showToastMsg 기존 유지

  // [F4-AD 신규] 광고 부활 핸들러
  async function handleAdRevive(e: React.PointerEvent) {
    e.stopPropagation()
    if (isAdLoading || isProcessing) return
    setIsAdLoading(true)
    try {
      const earned = await showAd()   // true=완시청, false=스킵/실패
      if (earned) {
        // 코인 미지급 — revive()만 호출
        // revive() → status='SHOWING' → GameOverOverlay 소멸
        // setIsAdLoading(false) 불필요 (컴포넌트가 소멸)
        revive()
      } else {
        // 스킵/실패 → 버튼 재활성화
        setIsAdLoading(false)
      }
    } catch {
      showToastMsg('광고를 불러오지 못했습니다')
      setIsAdLoading(false)
    }
  }

  // [F4 기존] handleRevive — 변경 없음
  async function handleRevive(e: React.PointerEvent) { /* 기존 impl 05 구현 유지 */ }
```

### JSX 변경: RevivalButton props 확장

```tsx
<RevivalButton
  coinBalance={coinBalance}
  revivalUsed={revivalUsed}
  isProcessing={isProcessing}
  isAdLoading={isAdLoading}      // [F4-AD 신규]
  onRevive={handleRevive}
  onAdRevive={handleAdRevive}    // [F4-AD 신규]
/>
```

> **GameOverOverlay의 다른 JSX(핸들바, 아이콘, 타이틀, 설명, 힌트, 토스트)는 변경 없음.**

---

## src/components/game/RevivalButton.test.tsx

기존 테스트는 F4 단독 스펙(null 반환 포함)을 기준으로 작성되어 F4-AD 도입 후 스펙 불일치. 전면 교체.

### 교체 기준 (PRD §12 F4-AD 수용기준)

```typescript
// 기본 props (잔액≥5, revivalUsed=false)
const defaultProps = {
  coinBalance: 5,
  revivalUsed: false,
  isProcessing: false,
  isAdLoading: false,
  onRevive: vi.fn(),
  onAdRevive: vi.fn(),
}
```

**커버해야 할 시나리오:**

| 시나리오 | Given | Then |
|---|---|---|
| 잔액<5, revivalUsed=false | coinBalance=4 | "광고 보고 부활" 1개만 렌더, 코인 버튼 없음 |
| 잔액≥5, revivalUsed=false | coinBalance=5 | "광고 보고 부활" + "🪙 5코인으로 부활" 2개 렌더 |
| revivalUsed=true | revivalUsed=true | null (버튼 없음) |
| 광고 로딩 중 | isAdLoading=true | 두 버튼 모두 disabled |
| 코인 처리 중 | isProcessing=true | 두 버튼 모두 disabled |
| 광고 버튼 탭 | 정상 상태 | onAdRevive 호출 |
| 코인 버튼 탭 | coinBalance≥5 | onRevive 호출 |
| 광고 로딩 중 탭 | isAdLoading=true | onAdRevive 미호출 |
| wrapper stopPropagation | parent handler 등록 | parent handler 미호출 |
| 경계값: coinBalance=5 | coinBalance=5 | 코인 버튼 표시 |
| 경계값: coinBalance=4 | coinBalance=4 | 코인 버튼 없음 (광고 버튼만) |

---

## 주의사항

- **`revive()` 가드 재확인**: `gameStore.revive()`는 `revivalUsed=true`이거나 `status !== 'RESULT'`이면 no-op(impl 05, gameStore.ts 확인됨). `handleAdRevive` 에서 earned=true 시 `revive()` 직접 호출 — no-op 가드가 2차 방어.
- **`setIsAdLoading(false)` 호출 금지 (성공 케이스)**: earned=true → `revive()` → status='SHOWING' → GameOverOverlay 소멸. 이후 setState는 언마운트 컴포넌트 경고 유발. 오직 `false`(스킵/실패) 케이스와 catch 블록에서만 호출.
- **`isAdLoading` + `isProcessing` 동시 활성 방지**: 각 핸들러 진입 시 상대방 state가 true이면 early return.
  - `handleAdRevive`: `if (isAdLoading || isProcessing) return`
  - `handleRevive`: `if (isProcessing) return` (기존 유지) + `if (isAdLoading) return` 추가
- **샌드박스 동작**: `showAd()`는 `IS_SANDBOX=true` 시 `Promise.resolve(true)` 즉시 반환(docs/sdk.md 확인). 개발환경에서 완시청 흐름 정상 검증 가능.
- **useRewardAd import 추가**: GameOverOverlay.tsx에 `import { useRewardAd } from '../../hooks/useRewardAd'` 추가. 기존 ResultPage와 동일한 훅을 재사용.
- **GamePage.tsx 변경 없음**: GameOverOverlay의 외부 props(`reason`, `coinBalance`, `revivalUsed`, `onConfirm`)는 F4-AD 도입 후에도 동일. 광고 호출은 GameOverOverlay 내부에서 처리.
- **RevivalButton.test.tsx mock 추가 필요**: useGameStore, useCoin은 이미 mock 처리되어 있지 않을 수 있다. RevivalButton은 store/hook 미사용 순수 UI 컴포넌트이므로 mock 불필요. GameOverOverlay 테스트에 useRewardAd mock 추가 필요 여부는 기존 GameOverOverlay.test.tsx가 useCoin/useGameStore를 어떻게 처리하는지 확인 후 결정.

---

## 테스트 경계

- `revivalUsed=false, balance=3` → "광고 보고 부활" 1개, 코인 버튼 없음
- `revivalUsed=false, balance=7` → "광고 보고 부활" + "🪙 5코인으로 부활" 2개
- `revivalUsed=true` → null (버튼 없음)
- "광고 보고 부활" 탭 → `isAdLoading=true` → 두 버튼 disabled → `show()` resolve → earned=true → `revive()` 호출
- "광고 보고 부활" 탭 → `show()` resolve(false) → `isAdLoading=false` → 버튼 재활성
- `show()` throw → toast 표시, `isAdLoading=false`
- `isAdLoading=true` 구간: "광고 보고 부활" 탭 → `onAdRevive` 미호출
- `isAdLoading=true` 구간: "🪙 5코인으로 부활" 탭 → `onRevive` 미호출

---

## 의존 모듈

- **선행**: impl 05 (F4 코인 부활 — RevivalButton, GameOverOverlay, store.revive(), useCoin 이미 구현됨)
- **이후**: impl 07 (coin-ui-polish) — 잔액 상시 표시. F4-AD와 독립적으로 진행 가능.
