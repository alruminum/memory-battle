---
depth: std
---
# 04. 최고기록 코인 보상 (F3)

## 결정 근거

- **ResultPage 내 `isNewBest` 분기 활용**: 이미 ResultPage에 `isNewBest` state와 `prevBestRef` 로직이 존재한다. 점수 제출 useEffect(`submitted.current` 가드)에서 `score > prevBest` 판정 후 `setIsNewBest(true)`가 호출되는 지점에 코인 적립 콜을 추가한다.
- **strict `>` 비교, 동점 미처리**: PRD v0.4 F3 명세 준수. `score > prevBest`는 이미 ResultPage 로직에서 사용 중이므로 추가 조건 없이 그대로 적용.
- **첫 플레이(prevBest=0) 포함**: `prevBest` 기본값 0, score > 0이면 isNewBest=true. PRD 명세에 "첫 플레이에도 적용" 명시.
- **`addCoins` 호출을 점수 제출 useEffect 내에 배치**: 점수 제출과 동일한 게이트(`submitted.current`, `isLoading` 완료)를 공유하므로, 별도 useEffect를 추가하지 않고 기존 useEffect 내에서 처리한다. 이로써 타이밍 불일치(순위 제출 전 코인 적립) 위험이 없다.
- **토스트 대신 `isNewBest` 배지 하단 보조 텍스트**: "🏆 최고기록! 🪙 +1" 문구는 기존 "NEW PERSONAL BEST" 배지 하단에 추가 표시한다. 별도 토스트를 띄우지 않는 이유: 광고 완시청 토스트(impl 03)와 동시 표시 시 겹침 발생 가능. 배지 내부 부가 텍스트로 처리하면 레이아웃 안전.

---

## 생성/수정 파일

| 파일 | 작업 |
|---|---|
| `src/pages/ResultPage.tsx` | 수정 — 점수 제출 useEffect에 `addCoins(1, 'record_bonus')` 추가, 기록갱신 배지 UI 보완 |

---

## src/pages/ResultPage.tsx

### 추가 import

```typescript
import { useCoin } from '../hooks/useCoin'
// randomCoinReward는 impl 03에서 이미 import됨
```

### 훅 호출 추가 (이미 impl 03에서 추가된 경우 중복 선언 불필요)

```typescript
const { addCoins } = useCoin()
```

### 점수 제출 useEffect 수정

```typescript
useEffect(() => {
  if (submitted.current || !userId || isLoading) return
  submitted.current = true

  const prevBest = daily.find((e) => e.user_id === userId)?.best_score ?? 0
  prevBestRef.current = prevBest

  const isNewRecord = score > prevBest
  if (isNewRecord) {
    setIsNewBest(true)
    // [v0.4 F3] 최고기록 코인 보상 — 첫 플레이(prevBest=0)도 포함, 동점 미처리
    addCoins(1, 'record_bonus').catch(() => {
      // 코인 적립 실패는 게임 흐름에 영향 없음 — 조용히 처리
      console.warn('[record-coin] addCoins failed — non-blocking')
    })
  }

  submitScore(score, stage, userId)
}, [userId, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps
```

### JSX: 기록갱신 배지 보완

기존 "NEW PERSONAL BEST" 배지 내부에 코인 보상 텍스트 추가:

```tsx
{isNewBest && (
  <div style={{
    display: 'inline-block',
    marginTop: 14,
    padding: '4px 16px',
    borderRadius: 20,
    backgroundColor: 'rgba(200,255,0,0.1)',
    border: '1px solid var(--vb-accent)',
  }}>
    <span style={{
      fontFamily: 'var(--vb-font-score)',
      fontSize: 10,
      fontWeight: 800,
      color: 'var(--vb-accent)',
      letterSpacing: 2,
    }}>NEW PERSONAL BEST</span>
    {/* [v0.4 F3] 최고기록 코인 보상 표시 */}
    <div style={{
      fontSize: 11,
      color: 'var(--vb-accent)',
      fontFamily: 'var(--vb-font-body)',
      fontWeight: 600,
      marginTop: 2,
      letterSpacing: 0,
    }}>🏆 최고기록! 🪙 +1</div>
  </div>
)}
```

---

## 주의사항

- `addCoins` 실패는 `.catch()`로 조용히 처리한다. 코인 적립 실패가 점수 제출이나 화면 전환을 막아서는 안 된다.
- `submitted.current` 가드가 이미 1회 실행을 보장하므로 중복 적립 위험 없음. React StrictMode 더블 렌더 환경에서도 `useRef`로 보호된다.
- `isNewBest` state는 점수 제출 useEffect에서만 세팅하므로, 배지 표시는 제출 완료 후에 나타난다. 초기 렌더 시 배지가 나타나지 않는 것은 정상이다.
- impl 03에서 `useCoin`을 이미 사용 중이라면 `addCoins`는 동일 인스턴스에서 구조분해한다 (훅 중복 호출 불필요 — Zustand store 기반).

---

## 테스트 경계

- 최고기록 경신 시: "NEW PERSONAL BEST" 배지 + "🏆 최고기록! 🪙 +1" 표시 확인
- 최고기록 미경신 시: 배지·텍스트 미표시
- 첫 플레이(prevBest=0, score>0): 배지 표시 확인
- 동점(score === prevBest): 배지 미표시 확인
- `addCoins` Supabase 오류 시: 콘솔 warn만 출력, 화면 영향 없음

---

## 의존 모듈

- **선행**: impl 01 (useCoin 훅) — `addCoins()` 사용
- **선행**: impl 02 (daily-reward-removal) — ResultPage 클린업 완료 전제
- **병행 가능**: impl 03 (ad-coin-reward) — 동일 파일(ResultPage) 수정이므로 순서 직렬화 권장
