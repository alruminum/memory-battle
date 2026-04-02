# 24. GamePage 품질 경고 수정

## 결정 근거

validator가 발견한 4건의 경고를 수정한다. 각 항목별 결정:

1. **`isInitializing` dead code 제거**: 선언·세팅은 있으나 렌더에서 아무 분기도 없음.
   "초기화 중 스피너 표시" 등의 UI가 없고 향후 계획도 없으므로 즉시 제거.
   기다리는 UI가 필요해지면 신규 태스크로 추가.

2. **`rankLabel` / `stageArea` 함수 이동**: 컴포넌트 내부 일반 함수는 매 렌더마다 재생성된다.
   - `rankLabel`: 상태 의존 없는 순수 헬퍼 → 모듈 스코프(컴포넌트 바깥)로 이동.
   - `stageArea`: `countdown`, `clearingStage`, `isPlaying`, `isClearingFullCombo`, `stage` 5개 값을 클로저로 참조하므로 진짜 `useCallback`이 적합하나, JSX 반환 함수를 useCallback으로 감싸는 것은 관용적이지 않음. 대신 별도 컴포넌트 `StageArea`로 분리해 props를 명시적으로 전달하는 방식 채택 — 메모이제이션 + 타입 안전성 모두 확보.

3. **eslint-disable 주석에 의도 설명 추가**: 왜 exhaustive-deps 규칙을 무시하는지 한 줄 설명 추가.
   - line 33 (`useEffect` — userId 초기화): 마운트 1회 실행이 의도이므로 `ranking.refetch` 의존성 추가 시 무한 루프 발생.
   - line 40 (`useEffect` — RESULT 전환 감시): `onGameOver`를 deps에 추가하면 부모 리렌더마다 재구독되어 의도치 않은 중복 호출 가능성. `status` 변화만 감시하는 것이 의도.

4. **타이머 바 진행률 하드코딩 → 실제 값 반영**:
   - `useTimer`가 `timeLeft` (ms 단위 잔여 시간)를 반환하고, `useGameEngine`이 `timer`를 이미 반환함.
   - `inputTimeout = getInputTimeout(stage)`도 useGameEngine 내부에 이미 있음.
   - `useGameEngine`에서 `timerProgress: number` (0~1, 1=꽉 참)를 추가 계산해 반환 — GamePage가 hook 내부 구현을 몰라도 됨.
   - `isPlaying`이 false이면 0으로 강제.

## 생성/수정 파일

- `src/pages/GamePage.tsx` (수정) — 위 4건 반영
- `src/hooks/useGameEngine.ts` (수정) — `timerProgress` 계산 후 반환 추가

---

## 인터페이스 정의

### StageArea 컴포넌트 (GamePage.tsx 내 로컬 정의)

```typescript
interface StageAreaProps {
  countdown: number | null
  clearingStage: number | null
  isPlaying: boolean
  isClearingFullCombo: boolean
  stage: number
}

function StageArea({ countdown, clearingStage, isPlaying, isClearingFullCombo, stage }: StageAreaProps): JSX.Element
```

### useGameEngine 반환 타입 변경

```typescript
// 기존
{
  flashingButton: ButtonColor | null
  clearingStage: number | null
  countdown: number | null
  handleInput: (color: ButtonColor) => void
  startGame: () => void
  retryGame: () => void
  timer: { timeLeft: number; reset: () => void; stop: () => void }
  isComboActive: boolean
  isClearingFullCombo: boolean
}

// 추가되는 필드
  timerProgress: number   // 0~1, 1=꽉 참(초기/리셋 직후), 0=만료
```

### rankLabel 헬퍼 (모듈 스코프로 이동)

```typescript
// GamePage.tsx 컴포넌트 정의 바깥(파일 상단, import 아래)
function rankLabel(rank: number): string {
  return rank > 0 ? `#${rank}` : '#—'
}
```

---

## 핵심 로직

### useGameEngine.ts — timerProgress 계산

```typescript
// inputTimeout은 이미 getInputTimeout(stage)로 계산된 값
const timer = useTimer(handleExpire, inputTimeout)

// return 직전에 계산
const timerProgress = inputTimeout > 0 ? timer.timeLeft / inputTimeout : 0

return {
  // ...기존 필드...
  timerProgress,
}
```

### GamePage.tsx — 타이머 바 width

```typescript
// useGameEngine에서 timerProgress 추출
const { ..., timerProgress } = useGameEngine()

// 타이머 바 div style
width: isPlaying ? `${(timerProgress * 100).toFixed(1)}%` : '0%',
```

### GamePage.tsx — eslint-disable 주석 보강

```typescript
// 마운트 1회만 실행. ranking.refetch를 deps에 추가하면 refetch 참조 변경마다 재실행되어 무한 루프 발생
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

// status 변화만 감시하는 것이 의도.
// onGameOver를 deps에 추가하면 부모 리렌더 시 중복 호출 가능
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [status])
```

### GamePage.tsx — isInitializing 제거

```typescript
// 제거 대상
const [isInitializing, setIsInitializing] = useState(true)
// ...
setIsInitializing(false)   // finally 블록 안
```

`useState` import에서 제거 불필요 여부는 `useState`가 다른 곳에서 사용되는지 확인 필요.
`GamePage.tsx` 현재 `useState`는 `isInitializing`에만 사용되므로 import에서도 제거한다.

---

## 주의사항

- `StageArea` 컴포넌트는 GamePage.tsx 파일 내에 로컬로 정의한다(별도 파일 불필요). 재사용 계획 없음.
- `timerProgress`는 `timer.timeLeft / inputTimeout`으로 계산되는데, `timer.reset()` 직후 `timeLeft`가 `duration`으로 초기화되므로 초기값은 1.0. 만료 시 `timeLeft = 0`이면 0.0. 의도한 범위(0~1) 내에서 동작.
- `useGameEngine`의 `inputTimeout`은 `const inputTimeout = getInputTimeout(stage)` — 단순 상수 계산이므로 매 렌더마다 재계산되나 성능 영향 없음.
- DB 영향도: 없음. 순수 UI/훅 레이어 변경.
- Breaking Change: `useGameEngine` 반환 타입에 `timerProgress` 필드 추가 — 기존 소비처(`GamePage.tsx`)는 구조 분해 시 새 필드만 추가로 구조 분해하면 되므로 하위 호환.

## 테스트 경계

- 단위 테스트 가능: `rankLabel(0)` → `'#—'`, `rankLabel(3)` → `'#3'` (순수 함수)
- 통합 테스트 필요: 없음
- 수동 검증:
  - INPUT 상태에서 타이머 바가 시간 경과에 따라 좌→우로 줄어드는지 확인
  - IDLE/SHOWING/RESULT 상태에서 타이머 바 width가 0%인지 확인
  - eslint 경고 0건 확인 (`npm run lint`)
