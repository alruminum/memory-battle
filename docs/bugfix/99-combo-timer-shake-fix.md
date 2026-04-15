---
depth: std
---
# #99 버그픽스 — ComboTimer 만료 시 shake 미발생 + comboStreak 즉시 리셋 안 됨

> 원래 이슈: [#99](https://github.com/alruminum/memory-battle/issues/99) (impl 18 구현 후 발견된 결함)

---

## 근본 원인 분석

| # | 근본 원인 | 현상 |
|---|---|---|
| 1 | `GamePage.tsx:326` `isBreaking` 조건이 `status==='RESULT' && gameOverReason==='timeout'`으로 한정 | 게임 진행 중 ComboTimer bar가 0에 도달해도 ComboIndicator shake 미발생 |
| 2 | `gameStore`에 콤보 타이머 만료 시 `comboStreak` 즉시 리셋 액션 없음 | `stageClear` 경로에서만 리셋 — bar 0 도달 후에도 streak 숫자가 유지됨 |
| 3 | `ComboTimer.tsx`에 bar 0 도달 시 상위 컴포넌트에 알리는 콜백 없음 | GamePage가 콤보 만료 이벤트를 구독할 방법 없음 |

---

## 결정 근거

### D1 — 콜백 발화 위치: useEffect 채택 (interval 내부 인라인 삽입 미채택)

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **useEffect 방식 (채택)** | `elapsedMs`, `isActive`를 의존하는 useEffect에서 `hasExpiredFiredRef`로 1회 발화 | 채택 |
| interval 내부 삽입 | `setElapsedMs(computerShowTimeRef.current)` 직후 콜백 | 미채택 — Visibility API 복귀 경로(`handleVisibility`)에서 elapsed가 이미 `≥ computerShowTime`인 경우를 별도 처리해야 함. 두 경로에서 이중 발화 방지 로직 중복 |

**채택 이유**: useEffect는 `elapsedMs` state 변화를 감지하므로 interval 경로·VisibilityAPI 복귀 경로 모두 자동 커버. `hasExpiredFiredRef`로 1회 발화 보장.

### D2 — `breakCombo()` 상태 안전장치: `status !== 'INPUT'` 가드 추가

콜백이 비동기 타이밍으로 늦게 발화하는 경우(SHOWING 진입 후 잔여 이벤트) 방어.  
RESULT 상태에서의 이벤트 처리 방지.  
comboStreak mid-game 리셋은 INPUT 페이즈에서만 의미 있음.

### D3 — `stageClear`와의 중복 처리 허용

`breakCombo()` 호출 후 `stageClear(isFullCombo=false)` 경로도 동일 공식(`Math.floor(streak/5)*5`)으로 리셋 시도.  
**수학적으로 멱등(idempotent)**: `Math.floor(Math.floor(k/5)*5 / 5)*5 === Math.floor(k/5)*5`. 이중 리셋 무해. ✓

### D4 — 이중 shake 허용 (isComboBreaking + RESULT+timeout)

시나리오: ComboTimer 만료(shake #1) → 이후 입력 타이머 만료 → 게임오버(shake #2)  
- shake #1 ~ #2 사이 시간: 최소 (inputTimeout - 0)ms. 사용자는 #2 shake 시 GameOverOverlay로 시야가 전환됨.
- 가드 로직(`!isComboBreaking`) 추가 시 코드 복잡도 증가 vs 실질 UX 개선 미미.
- 허용 후 실제 불편 보고 시 후속 처리.

### D5 — `isComboBreaking` 리셋 타이밍: `SHOWING` + `IDLE`

| 타이밍 | 이유 |
|---|---|
| `status === 'SHOWING'` | 스테이지 클리어 후 다음 라운드 진입. stageClear도 comboStreak 리셋. 일관성. |
| `status === 'IDLE'` | 게임 재시작(resetGame). 전 게임 상태 완전 초기화. |

---

## 수정 파일

- `src/store/gameStore.ts` (수정) — `breakCombo()` 액션 추가
- `src/components/game/ComboTimer.tsx` (수정) — `onComboTimerExpired` 콜백 prop 추가
- `src/pages/GamePage.tsx` (수정) — `isComboBreaking` 상태 관리 + 두 prop 연결

---

## 인터페이스 정의

### gameStore.ts — 인터페이스 변경

```typescript
interface GameStore {
  // ... 기존 유지 ...

  // [신규]
  breakCombo: () => void
  // 콤보 타이머 만료 시 comboStreak 즉시 리셋 (stageClear 경로 밖에서 호출)
  // 공식: Math.floor(comboStreak / 5) * 5  (stageClear 실패 공식과 동일 — 멱등)
}
```

### ComboTimer.tsx — Props 변경

```typescript
// Before
interface ComboTimerProps {
  computerShowTime: number
  inputStartTime: number
  isActive: boolean
  isBreaking?: boolean
  isShowing?: boolean
}

// After
interface ComboTimerProps {
  computerShowTime: number
  inputStartTime: number
  isActive: boolean
  isBreaking?: boolean
  isShowing?: boolean
  onComboTimerExpired?: () => void  // [신규] bar가 0에 도달 시 1회 호출. isActive=true 구간에서만 발화.
}
```

---

## 핵심 로직

### 1. `gameStore.ts` — `breakCombo()` 추가

```typescript
// interface에 추가
breakCombo: () => void

// 구현부에 추가 (gameOver: ... 액션 앞에 삽입)
breakCombo: () =>
  set((state) => {
    if (state.status !== 'INPUT') return {}   // 안전장치: INPUT 페이즈에서만 적용
    const prevMultiplierBase = Math.floor(state.comboStreak / 5) * 5
    if (state.comboStreak === prevMultiplierBase) return {}  // 이미 floor값이면 변화 없음
    return { comboStreak: prevMultiplierBase }
  }),
```

### 2. `ComboTimer.tsx` — `onComboTimerExpired` 발화 로직

```typescript
// props 파괴 할당에 추가
export function ComboTimer({
  computerShowTime,
  inputStartTime,
  isActive,
  isBreaking = false,
  isShowing = false,
  onComboTimerExpired,     // [신규]
}: ComboTimerProps) {

  // ... 기존 state/ref 유지 ...

  // [신규] bar 0 도달 시 onComboTimerExpired 1회 발화
  // useEffect 방식: interval 경로 + VisibilityAPI 복귀 경로 모두 자동 커버
  const hasExpiredFiredRef = useRef(false)
  const onComboTimerExpiredRef = useRef(onComboTimerExpired)
  useEffect(() => {
    onComboTimerExpiredRef.current = onComboTimerExpired
  }, [onComboTimerExpired])

  useEffect(() => {
    if (!isActive) {
      hasExpiredFiredRef.current = false   // 다음 활성화를 위해 리셋
      return
    }
    if (!hasExpiredFiredRef.current && elapsedMs >= computerShowTime) {
      hasExpiredFiredRef.current = true
      onComboTimerExpiredRef.current?.()
    }
  }, [isActive, elapsedMs, computerShowTime])

  // ... 기존 렌더링 유지 ...
}
```

> **주의**: `onComboTimerExpiredRef` 패턴은 콜백이 매 렌더마다 새 참조를 가져도 useEffect deps 변동을 방지.  
> `isActive=false → true` 전환 시 `elapsedMs=0`으로 리셋(기존 코드), `hasExpiredFiredRef=false`로 리셋(신규) → 다음 라운드에서 정상 발화.

### 3. `GamePage.tsx` — `isComboBreaking` 관리 + prop 연결

```typescript
// useGameStore에서 breakCombo 추가 구조분해
const {
  status, score, stage, comboStreak, userId, setUserId, sequenceStartTime,
  breakCombo,   // [신규]
} = useGameStore()

// [신규] 게임 중 콤보 타이머 만료 상태
const [isComboBreaking, setIsComboBreaking] = useState(false)

// [신규] 새 스테이지 시작 / 게임 재시작 시 isComboBreaking 리셋
useEffect(() => {
  if (status === 'SHOWING' || status === 'IDLE') {
    setIsComboBreaking(false)
  }
}, [status])

// [신규] ComboTimer 만료 콜백 핸들러
const handleComboTimerExpired = useCallback(() => {
  breakCombo()            // store comboStreak 즉시 리셋
  setIsComboBreaking(true)  // ComboIndicator shake 트리거
}, [breakCombo])
```

```tsx
{/* ComboTimer — onComboTimerExpired 추가 */}
<ComboTimer
  computerShowTime={computerShowTime}
  inputStartTime={sequenceStartTime}
  isActive={status === 'INPUT' && clearingStage === null}
  isBreaking={status === 'RESULT' && gameOverReason !== null}
  isShowing={status === 'SHOWING'}
  onComboTimerExpired={handleComboTimerExpired}   // [신규]
/>

{/* ComboIndicator — isBreaking 조건 확장 */}
{/* Before: isBreaking={status === 'RESULT' && gameOverReason === 'timeout'} */}
<ComboIndicator
  comboStreak={comboStreak}
  isBreaking={
    isComboBreaking ||                                      // [신규] 게임 중 콤보 타이머 만료
    (status === 'RESULT' && gameOverReason === 'timeout')   // 기존 유지: 게임오버(timeout)
  }
/>
```

---

## 주의사항

### 모듈 경계

- `ComboTimer.tsx`: `onComboTimerExpired` optional prop 추가. 미전달 시 기존 동작 완전 유지.
- `gameStore.ts`: `breakCombo()` 신규 액션. 기존 `stageClear`, `gameOver` 액션과 독립. 인터페이스 변경으로 TypeScript가 모든 호출부를 검증.
- `GamePage.tsx`: `isComboBreaking` 로컬 상태만 추가. 하위 컴포넌트(`ComboTimer`, `ComboIndicator`) API 변경은 backward-compatible (optional prop).
- DB 영향: 없음.

### `elapsedMs`와 `computerShowTime` 동기화 주의

`ComboTimer` 내부 interval은 `computerShowTimeRef.current`를 실시간 읽지만, useEffect의 deps는 `computerShowTime` (prop). 새 스테이지에서 `computerShowTime`이 커지면 `elapsedMs`는 이미 0으로 리셋됨(isActive false→true 전환) → 오발화 없음.

### `breakCombo`와 `stageClear` 이중 호출

ComboTimer 만료 → `breakCombo()` → `comboStreak = Math.floor(k/5)*5`  
이후 `stageClear(isFullCombo=false)` → `newStreak = Math.floor((Math.floor(k/5)*5)/5)*5 = Math.floor(k/5)*5`  
→ 동일 값, 상태 변화 없음. Zustand `set` 실행되나 리렌더 없음. ✓

---

## 테스트 케이스

### 신규 단위 테스트 — ComboTimer

| TC ID | 시나리오 | 기대 동작 |
|---|---|---|
| CT-6-1 | `onComboTimerExpired` 미전달, elapsed ≥ computerShowTime 도달 | 에러 없이 동작 (optional이므로) |
| CT-6-2 | `isActive=true`, elapsed가 computerShowTime 이상으로 업데이트 | `onComboTimerExpired` 정확히 1회 호출 |
| CT-6-3 | `isActive=false → true` 전환 후 elapsed ≥ computerShowTime | `onComboTimerExpired` 다시 1회 호출 (hasExpiredFiredRef 리셋 확인) |
| CT-6-4 | elapsed ≥ computerShowTime 상태에서 추가 렌더 발생 | 콜백 1회 초과 호출 안 됨 |

### 신규 단위 테스트 — gameStore

| TC ID | 시나리오 | 기대 동작 |
|---|---|---|
| GS-1-1 | `status=INPUT`, `comboStreak=3` → `breakCombo()` | `comboStreak=0` (x1 구간 floor=0) |
| GS-1-2 | `status=INPUT`, `comboStreak=7` → `breakCombo()` | `comboStreak=5` (x2 구간 floor=5) |
| GS-1-3 | `status=INPUT`, `comboStreak=5` → `breakCombo()` | `comboStreak=5` (이미 floor값, 변화 없음) |
| GS-1-4 | `status=SHOWING`, `comboStreak=3` → `breakCombo()` | `comboStreak=3` (INPUT 외 가드) |

### 수동 검증 시나리오

| ID | 시나리오 | 기대 동작 |
|---|---|---|
| MV-A | INPUT 중 ComboTimer bar가 0에 도달 (게임 계속) | ComboIndicator 즉시 shake + comboStreak 즉시 floor값으로 리셋 |
| MV-B | 위 직후 버튼 계속 눌러 스테이지 클리어 | stageClear가 이미 floor된 streak 기준으로 다시 계산 (멱등 확인) |
| MV-C | INPUT timer 만료 → 게임오버(timeout) | ComboIndicator shake 발생 (RESULT+timeout 경로) |
| MV-D | 스테이지 클리어 후 다음 SHOWING 진입 | `isComboBreaking` 리셋, 다음 라운드 shake 없음 |
| MV-E | 게임 재시작 (retryGame) | `isComboBreaking=false`, shake 없이 깨끗하게 시작 |
