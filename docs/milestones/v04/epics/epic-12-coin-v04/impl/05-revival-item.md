---
depth: std
---
# 05. 부활 아이템 (F4)

## 결정 근거

- **`RevivalButton` 컴포넌트 위치: `src/components/game/`**: PRD 11절 상태머신이 명시하는 대로 `GameOverOverlay`에 부활 버튼을 배치한다.
  - PRD 11절: `INPUT → 오답/타임아웃 → GameOverOverlay → [balance≥5, revivalUsed=false] revive() → SHOWING`
  - PRD 12절 F4 수용기준: 모든 수용 시나리오의 컨텍스트가 "게임오버 오버레이 진입"
  - 이전 impl이 `ResultPage`로 배치한 이유("게임오버 화면 = ResultPage")는 PRD 7절·11절·12절의 명시적 구분을 위반한다.

- **App.tsx 라우팅 변경 불필요**: `GameOverOverlay`는 `GamePage` 내부에 위치하며, `status === 'RESULT' && gameOverReason !== null` 조건으로 렌더된다. `revive()` 호출로 `status='SHOWING'`이 되면 렌더 조건이 false → overlay 자동 소멸 → `page='game'`을 유지한 채 게임이 재개된다. App.tsx의 `page` state는 변경 불필요.

- **화면 전환 경로 분기**:
  - 부활 선택: `revive()` → status='SHOWING' → GameOverOverlay 소멸 → GamePage 재개 (App.tsx page='game' 유지)
  - "결과 보기" (overlay 탭): `onConfirm()` → App.tsx `setPage('result')` → ResultPage (기존 흐름 유지)
  - ResultPage는 F4와 무관. 부활 버튼 없음.

- **`revivalUsed=true` 처리 분기**:
  - PRD 12절 F4: "이미 사용 → 게임오버 오버레이 진입 → 버튼 비활성 + '이미 부활을 사용했습니다'"
  - PRD 12절 F4: "부활 후 게임오버 → ResultPage 진입 → 부활 버튼 미표시"
  - GameOverOverlay: `revivalUsed=true` → disabled + "이미 부활을 사용했습니다" 표시
  - ResultPage: 부활 버튼 자체 없음 (이 impl에서 ResultPage 수정 없음)

- **stopPropagation 필수**: 현재 GameOverOverlay는 최상위 backdrop에 `onPointerDown={onConfirm}`이 걸려 있다. RevivalButton 탭 시 이벤트 버블링으로 `onConfirm`이 동시에 호출되는 문제를 방지하기 위해 RevivalButton의 `onPointerDown`에서 `e.stopPropagation()`을 호출한다.

- **토스트 처리**: GameOverOverlay에 local toast state(`string | null`)와 `showToastMsg` 함수를 추가한다. ResultPage와 동일한 인라인 패턴 적용. `addCoins` 실패 시 토스트 표시 후 처리 종료 (revive 미호출).

- **코인 차감 선행, store.revive() 후행**: impl 01 설계 원칙 준수. `addCoins(-5, 'revival')` 성공 시에만 `store.revive()`를 호출한다. 실패 시 revive()를 호출하지 않으므로 상태 불일치가 없다.

- **판당 1회 제한**: impl 01에서 `revivalUsed` store 필드가 이미 구현됨. `RevivalButton`은 이 값을 props로 받아 disabled/메시지 분기에 사용한다.

- **PRD 12절 F4 수용기준 채택 (PRD 7절 vs 12절 모순 해소)**: PRD 7절은 "이미 부활 → disabled + '이미 사용했습니다'" 방식을 서술하지만, PRD 12절 F4 "부활 후 게임오버 → ResultPage 진입 → 부활 버튼 미표시"는 수용기준(acceptance criteria)으로 명시된다. GameOverOverlay에서는 7절 기준(disabled + 메시지), ResultPage에서는 12절 기준(미표시)을 적용한다. 두 절이 서로 다른 컨텍스트(오버레이 vs 결과 화면)를 설명하므로 모순이 아니다.

---

## 생성/수정 파일

| 파일 | 작업 |
|---|---|
| `src/components/game/RevivalButton.tsx` | 신규 — 부활 버튼 컴포넌트 |
| `src/components/game/GameOverOverlay.tsx` | 수정 — RevivalButton 통합, props 추가, 토스트 추가 |
| `src/pages/GamePage.tsx` | 수정 — useGameStore 구독 확장, GameOverOverlay props 전달 |
| `src/pages/ResultPage.tsx` | **변경 없음** — F4 관여 없음 |
| `src/store/gameStore.ts` | **확인만** — impl 01에서 이미 구현 완료 |

> **참고**: `coinBalance`, `revivalUsed`, `setCoinBalance()`, `revive()` 필드·액션 인터페이스 및 구현은 impl 01에서 완료됨.
> **참고**: `useCoin` 훅(`addCoins`)은 impl 01에서 구현됨.

---

## src/components/game/RevivalButton.tsx

### 인터페이스

```typescript
interface RevivalButtonProps {
  coinBalance: number       // 현재 잔액
  revivalUsed: boolean      // 이 판 부활 사용 여부
  isProcessing: boolean     // 외부에서 관리 (GameOverOverlay가 처리 중 상태를 제어)
  onRevive: (e: React.PointerEvent) => void  // 포인터 이벤트 전달 (stopPropagation 처리)
}

export function RevivalButton({ coinBalance, revivalUsed, isProcessing, onRevive }: RevivalButtonProps): JSX.Element
```

> ⚠️ **null 반환 없음**: RevivalButton은 항상 JSX를 반환한다. `revivalUsed=true` 시 disabled 버튼 + "이미 부활을 사용했습니다" 표시 (PRD 12절 GameOverOverlay 컨텍스트 규칙). ResultPage에서는 이 컴포넌트를 사용하지 않으므로 null 분기 불필요.

### 핵심 구현

```tsx
import React from 'react'

export function RevivalButton({ coinBalance, revivalUsed, isProcessing, onRevive }: RevivalButtonProps): JSX.Element {
  const canRevive = !revivalUsed && coinBalance >= 5

  // 비활성 이유 결정 (PRD 7절·12절 규정 문구)
  const disabledReason: string | null =
    revivalUsed
      ? '이미 부활을 사용했습니다'
      : coinBalance < 5
        ? `코인이 부족합니다 (현재 ${coinBalance}개)`
        : null

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}
      onPointerDown={(e) => e.stopPropagation()}  // backdrop onPointerDown={onConfirm} 버블링 차단
    >
      <button
        onPointerDown={canRevive && !isProcessing ? onRevive : (e) => e.stopPropagation()}
        disabled={!canRevive || isProcessing}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 8,
          border: `1px solid ${canRevive ? 'var(--vb-accent)' : 'var(--vb-border)'}`,
          backgroundColor: 'transparent',
          color: canRevive ? 'var(--vb-accent)' : 'var(--vb-text-dim)',
          fontFamily: 'var(--vb-font-score)',
          fontSize: 14,
          fontWeight: 900,
          letterSpacing: 2,
          cursor: canRevive ? 'pointer' : 'default',
          opacity: isProcessing ? 0.6 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {isProcessing ? '처리 중...' : '🪙 5코인으로 부활'}
      </button>
      {disabledReason && (
        <div style={{
          fontSize: 11,
          color: 'var(--vb-text-dim)',
          fontFamily: 'var(--vb-font-body)',
        }}>
          {disabledReason}
        </div>
      )}
    </div>
  )
}
```

> **이벤트 설계**: `onPointerDown` 사용 이유 — 현재 GameOverOverlay backdrop이 `onPointerDown={onConfirm}`를 사용하므로 동일 이벤트로 stopPropagation 처리해야 한다. wrapper div와 button 모두 커버한다.

---

## src/components/game/GameOverOverlay.tsx

### Props 수정

```typescript
import React, { useState, useRef } from 'react'
import { useCoin } from '../../hooks/useCoin'
import { RevivalButton } from './RevivalButton'
import { useGameStore } from '../../store/gameStore'

interface GameOverOverlayProps {
  reason: Exclude<GameOverReason, null>
  // [v0.4 F4] 코인 관련 props 추가
  coinBalance: number      // store.coinBalance 전달 (GamePage에서 구독)
  revivalUsed: boolean     // store.revivalUsed 전달 (GamePage에서 구독)
  onConfirm: () => void    // 기존 유지 — "화면을 탭하여 계속" → ResultPage 이동
}
```

### 추가 state & 로직

```typescript
export function GameOverOverlay({ reason, coinBalance, revivalUsed, onConfirm }: GameOverOverlayProps): JSX.Element {
  const { revive } = useGameStore()
  const { addCoins } = useCoin()
  const [isProcessing, setIsProcessing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToastMsg(msg: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(msg)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  async function handleRevive(e: React.PointerEvent) {
    e.stopPropagation()  // onConfirm 버블링 차단
    if (isProcessing) return
    setIsProcessing(true)
    try {
      // 1. 코인 차감 (DB 원자 처리) — 성공 시에만 revive()
      await addCoins(-5, 'revival')
      // 2. store 상태 전환: RESULT → SHOWING, sequence=[], revivalUsed=true
      // revive() 호출 후 status='SHOWING' → GameOverOverlay 렌더 조건(status==='RESULT') false
      // → overlay 자동 소멸 → GamePage가 새 시퀀스를 렌더. setIsProcessing(false) 불필요.
      revive()
    } catch (err) {
      console.error('[revival] addCoins failed:', err)
      showToastMsg('코인 차감 중 오류가 발생했습니다')
      setIsProcessing(false)  // 실패 시에만 isProcessing 해제 (성공 시 컴포넌트가 소멸)
    }
  }
  // ...
}
```

### JSX: 패널에 RevivalButton 추가

```tsx
{/* 바텀 패널 */}
<div
  className="gameover-panel"
  style={{ /* 기존 스타일 유지 */ }}
>
  {/* ... 기존 핸들바 / 아이콘 / 타이틀 / 설명 ... */}

  {/* [v0.4 F4] 부활 버튼 — 힌트 텍스트 위에 배치 */}
  <div style={{ width: '100%', marginTop: 16 }}>
    <RevivalButton
      coinBalance={coinBalance}
      revivalUsed={revivalUsed}
      isProcessing={isProcessing}
      onRevive={handleRevive}
    />
  </div>

  {/* 힌트: 부활 버튼이 있어도 탭으로 결과 화면 이동 가능함을 안내 */}
  <div style={{
    fontFamily: 'var(--vb-font-body)',
    fontSize: 12,
    color: 'var(--vb-text-dim)',
    marginTop: 12,
  }}>
    화면을 탭하여 결과 보기
  </div>

  {/* 토스트 (addCoins 실패 시) */}
  {toast && (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'var(--vb-toast-bg)',
      color: 'var(--vb-text)',
      padding: '10px 20px',
      borderRadius: 8,
      fontSize: 13,
      fontFamily: 'var(--vb-font-body)',
      zIndex: 300,
      border: '1px solid var(--vb-border)',
    }}>
      {toast}
    </div>
  )}
</div>
```

---

## src/pages/GamePage.tsx — GameOverOverlay Props 전달

GamePage에서 `coinBalance`, `revivalUsed`를 store에서 구독하고 GameOverOverlay에 전달한다.

```typescript
// GamePage: useGameStore 구독 확장
const { status, score, stage, comboStreak, userId, setUserId, sequenceStartTime, breakCombo,
  coinBalance, revivalUsed  // [v0.4 F4] 추가
} = useGameStore()
```

```tsx
{/* GamePage JSX: GameOverOverlay에 props 추가 */}
{status === 'RESULT' && gameOverReason !== null && (
  <GameOverOverlay
    reason={gameOverReason}
    coinBalance={coinBalance}
    revivalUsed={revivalUsed}
    onConfirm={onGameOver}
  />
)}
```

> **GamePage.tsx 수정 범위**: `useGameStore()` 구독 확장 (coinBalance, revivalUsed 추가) + GameOverOverlay JSX props 2개 추가. 그 외 변경 없음.

---

## src/store/gameStore.ts

> ⚠️ **impl 01에서 이미 구현 완료 — 검토만, 재작성 금지**
>
> `revive()` 액션 및 `startGame`/`resetGame`의 `revivalUsed: false` 초기화는 impl 01 실행 시점에 이미 gameStore.ts에 반영된다.
> engineer는 아래 스펙과 실제 코드가 일치하는지 **확인만** 하고, 중복 작성·오버라이트 금지.

### revive() 확인 스펙 (impl 01 결과물)

```typescript
revive: () =>
  set((state) => {
    if (state.status !== 'RESULT') return {}
    if (state.revivalUsed) return {}
    return {
      status: 'SHOWING',
      sequence: [],        // useGameEngine이 감지해 현재 stage 길이의 새 시퀀스 생성
      currentIndex: 0,
      revivalUsed: true,
      // score, stage, comboStreak, fullComboCount, maxComboStreak 유지
    }
  }),
```

---

## 주의사항

- `addCoins(-5, 'revival')` 실패 시 `revive()`를 절대 호출하지 않는다.
- `revive()` 성공 후 `setIsProcessing(false)` 불필요 — 컴포넌트가 `status='SHOWING'`으로 즉시 소멸. `finally`에서 `setIsProcessing(false)` 호출 시 언마운트 컴포넌트의 setState 경고 발생 가능. **실패 케이스에만 `setIsProcessing(false)` 호출한다** (catch 블록).
- stopPropagation 이중 보호: wrapper div와 button 양쪽에 적용. backdrop의 `onPointerDown={onConfirm}` 가 어느 자식에서도 트리거되지 않도록 보장.
- `revive()` 가드: `revivalUsed===true`이면 store에서 no-op. UI가 이미 disabled 처리되지만 store가 2차 방어.
- `sequence = []` + `status = 'SHOWING'`은 useGameEngine의 기존 SHOWING useEffect를 트리거한다. useGameEngine은 수정하지 않는다.
- ResultPage에 RevivalButton을 통합하지 않는다. `src/components/result/RevivalButton.tsx`는 생성하지 않는다.
- `showToastMsg`는 GameOverOverlay 내부 local function이다. 별도 import 없음.

---

## 테스트 경계

- `coinBalance >= 5 && !revivalUsed`: 부활 버튼 활성 → 탭 → addCoins(-5) 성공 → revive() → GameOverOverlay 소멸 → GamePage 재개
- `coinBalance < 5`: 버튼 disabled + `"코인이 부족합니다 (현재 N개)"` (PRD 7절·12절 규정 형식)
- `revivalUsed === true`: 버튼 disabled + `"이미 부활을 사용했습니다"` (PRD 7절·12절 GameOverOverlay 컨텍스트)
- 부활 후 게임오버: `revivalUsed=true`인 채로 GameOverOverlay 재진입 → disabled + "이미 부활을 사용했습니다"
- 부활 후 게임오버 → 결과 보기: ResultPage 진입 → 부활 버튼 미표시 (PRD 12절 F4)
- `addCoins` 실패: revive() 미호출, 토스트 표시, 버튼 재활성화
- 백드롭 탭(버튼 외 영역): stopPropagation 미발생 → onConfirm → ResultPage 정상 이동
- `store.revive()` 가드: status !== 'RESULT' → no-op, revivalUsed → no-op

---

## 의존 모듈

- **선행**: impl 01 (useCoin 훅, `coinBalance`/`revivalUsed`/`revive()` store 필드·액션 인터페이스 확정)
- **선행**: impl 02 (ResultPage 클린업)
- **선행**: impl 03, 04 (ResultPage 코인 관련 state 추가 완료)
- **이후**: impl 07 (coin-ui-polish) — coinBalance 잔액 상시 표시
