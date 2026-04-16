---
depth: std
---
# 07. 코인 잔액 UI + float-up 애니메이션 (F7 Polishing)

## 결정 근거

- **MainPage 상단 잔액 표시 위치**: 기존 HUD 스트립(SCORE / STG / DAILY 3열)에 코인 잔액을 끼워 넣으면 레이아웃이 깨진다. 대신 HUD 스트립 아래 별도 행으로 코인 표시 영역을 추가한다. 기존 3열 그리드 구조를 변경하지 않으므로 레이아웃 안전.
- **로딩 중 `-` 표시**: `isInitializing` 또는 `getBalance()` 미완료 시 `-`를 표시한다. `coinBalance`는 store의 초기값 0이지만, userId 세팅 전 0을 실제 잔액으로 표시하면 오해를 줄 수 있다. `isInitializing` 동안 `-` 처리가 명확하다.
- **`getBalance()` 호출 시점**: MainPage의 `useEffect` 내 `getUserId()` 완료 직후 `getBalance()`를 호출한다. 이미 있는 초기화 useEffect를 확장한다.
- **ResultPage 잔액 표시**: 최종 점수 카드 하단 또는 버튼 영역 상단에 "🪙 현재 잔액: N" 텍스트를 표시한다. 코인 관련 버튼(RevivalButton, PointExchangeButton)이 coinBalance prop을 받으므로 잔액 표시는 ResultPage에서 `coinBalance` store값을 직접 렌더한다.
- **float-up 애니메이션 트리거**: `CoinRewardBadge`(impl 03) 표시와 함께, 획득 이벤트 시 화면 중앙에 "+N 🪙" 텍스트가 위로 올라가며 페이드아웃되는 애니메이션을 추가한다. `@keyframes coinFloatUp`을 `index.css`에 추가하고, ResultPage에서 `coinReward` state가 세팅될 때 트리거한다.
- **`CoinFloatUp` 컴포넌트 vs 인라인**: float-up 엘리먼트는 위치 계산 없이 `position: fixed` + `left: 50%`로 중앙 고정한다. 재사용성보다 단순성 우선. ResultPage 내 인라인 조건부 div로 구현한다.

---

## 생성/수정 파일

| 파일 | 작업 |
|---|---|
| `src/index.css` | 수정 — `@keyframes coinFloatUp` 추가 |
| `src/pages/MainPage.tsx` | 수정 — 코인 잔액 표시, `getBalance()` 호출 |
| `src/pages/ResultPage.tsx` | 수정 — 코인 잔액 상시 표시, float-up 트리거 |

---

## src/index.css

### 추가 keyframe

```css
/* [v0.4] 코인 획득 float-up 애니메이션 */
@keyframes coinFloatUp {
  0%   { transform: translateX(-50%) translateY(0) scale(1);   opacity: 1; }
  20%  { transform: translateX(-50%) translateY(-12px) scale(1.15); opacity: 1; }
  100% { transform: translateX(-50%) translateY(-60px) scale(0.9); opacity: 0; }
}

.coin-float-up {
  animation: coinFloatUp 1.2s ease-out forwards;
}
```

---

## src/pages/MainPage.tsx

### 추가 import

```typescript
import { useCoin } from '../hooks/useCoin'
```

### 훅 추가

```typescript
const { getBalance } = useCoin()
const coinBalance = useGameStore((s) => s.coinBalance)
```

### 초기화 useEffect 수정

```typescript
useEffect(() => {
  ;(async () => {
    setIsInitializing(true)
    try {
      const uid = await getUserId()
      setUserId(uid)
      ranking.refetch()
      // [v0.4] 코인 잔액 초기 로드
      await getBalance()
    } catch {
      showToast('랭킹 연동 실패. 오프라인 모드로 진행됩니다')
    } finally {
      setIsInitializing(false)
    }
  })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

### JSX: HUD 스트립 아래 코인 잔액 행 추가

```tsx
{/* HUD 스트립 ... (기존) */}

{/* [v0.4] 코인 잔액 표시 */}
<div style={{
  padding: '8px 20px',
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: 4,
  backgroundColor: 'var(--vb-surface)',
  borderBottom: '1px solid var(--vb-border)',
  flexShrink: 0,
}}>
  <span style={{
    fontFamily: 'var(--vb-font-body)',
    fontSize: 12,
    color: 'var(--vb-text-dim)',
  }}>보유 코인</span>
  <span style={{
    fontFamily: 'var(--vb-font-score)',
    fontSize: 16,
    fontWeight: 900,
    color: 'var(--vb-accent)',
  }}>
    {isInitializing ? '-' : `🪙 ${coinBalance}`}
  </span>
</div>
```

---

## src/pages/ResultPage.tsx

### coinBalance 잔액 상시 표시

최종 점수 카드 하단 COMBO STATS 카드 위에 코인 잔액 표시:

```tsx
{/* [v0.4] 코인 잔액 표시 */}
<div style={{
  margin: '12px 20px 0',
  padding: '12px 16px',
  backgroundColor: 'var(--vb-surface)',
  borderRadius: 12,
  border: '1px solid var(--vb-border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0,
}}>
  <span style={{
    fontFamily: 'var(--vb-font-body)',
    fontSize: 12,
    color: 'var(--vb-text-dim)',
  }}>보유 코인</span>
  <span style={{
    fontFamily: 'var(--vb-font-score)',
    fontSize: 20,
    fontWeight: 900,
    color: 'var(--vb-accent)',
  }}>🪙 {coinBalance}</span>
</div>
```

### float-up 애니메이션 트리거

`coinReward` state(impl 03에서 도입)가 세팅될 때 float-up 엘리먼트를 렌더한다.

```tsx
{/* [v0.4] 코인 획득 float-up 애니메이션 */}
{coinReward !== null && (
  <div
    className="coin-float-up"
    style={{
      position: 'fixed',
      bottom: 120,         // CoinRewardBadge(bottom:80) 위에 배치
      left: '50%',
      // transform은 CSS animation에서 제어 (translateX(-50%) 포함)
      pointerEvents: 'none',
      fontFamily: 'var(--vb-font-score)',
      fontSize: 22,
      fontWeight: 900,
      color: 'var(--vb-accent)',
      whiteSpace: 'nowrap',
      zIndex: 201,
    }}
  >
    +{coinReward} 🪙
  </div>
)}
```

> `coinReward`가 `null`로 초기화되면 float-up 엘리먼트가 unmount되어 애니메이션이 리셋된다. 다음 코인 획득 시 다시 마운트 → 애니메이션 재생.

### `coinBalance` store 구독 추가

```typescript
// 기존 useGameStore 구조분해에 coinBalance 추가
const { score, stage, userId, baseScore, fullComboCount, maxComboStreak, coinBalance, revivalUsed, revive } = useGameStore()
```

---

## 주의사항

- `coinFloatUp` CSS animation의 `transform`에 `translateX(-50%)`를 포함한다. `position: fixed + left: 50%` 조합에서 중앙 정렬을 위해 필수. 인라인 style의 transform과 animation의 transform이 충돌하지 않도록 인라인 transform을 선언하지 않는다.
- float-up 엘리먼트는 `pointerEvents: 'none'`으로 설정해 버튼 클릭 방해를 막는다.
- MainPage에서 `getBalance()`는 `getUserId()` 완료 이후 호출한다. userId가 store에 세팅되기 전에 호출하면 `useGameStore.getState().userId`가 빈 문자열이므로 0 반환.
- `isInitializing` 동안 코인 잔액 `-` 표시. 실제 잔액 0과 구분한다.
- `hasTodayReward` 관련 UI는 impl 02에서 제거됨. 동일 위치에 코인 잔액을 배치할 경우 충돌 없음.

---

## 테스트 경계

- MainPage 진입 시: `isInitializing=true` → 잔액 `-` 표시 → userId 세팅 + getBalance() → 실제 잔액 표시
- ResultPage: `coinBalance` 값이 실시간으로 업데이트되어 부활/교환 후 잔액이 즉시 갱신됨
- 광고 완시청 후: `coinReward` 세팅 → float-up 애니메이션 1.2s 재생 → CoinRewardBadge 3초 표시
- float-up 엘리먼트: pointerEvents 없음, 버튼 클릭 방해 없음 확인

---

## 의존 모듈

- **선행**: impl 01 (useCoin 훅, coinBalance store 필드)
- **선행**: impl 03 (CoinRewardBadge, coinReward state) — float-up 트리거 기반
- **선행**: impl 05, 06 (RevivalButton, PointExchangeButton) — ResultPage 버튼 영역 완성 후 잔액 UI 최종 배치
