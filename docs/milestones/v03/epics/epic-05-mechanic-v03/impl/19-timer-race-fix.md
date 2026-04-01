# 19 — Timer Race Condition Fix (Stage 1 입력 씹힘)

## 문제 요약

Stage 1에서 SHOWING -> INPUT 전환 시 유저 입력이 무시되는 버그.

### 근본 원인

`useTimer.ts:37-42`의 status 구독 useEffect가 React 렌더 사이클 지연으로 인해
`useGameEngine.ts`에서 동기적으로 호출한 `timer.reset()`이 시작한 interval을
즉시 취소하는 race condition.

**시퀀스**:
1. SHOWING effect의 `next()` 완료 -> `setState({ status: 'INPUT' })` + `timer.reset()` 동기 호출
2. `timer.reset()`: interval 시작됨
3. React 렌더 사이클 -> useEffect 재실행 -> `status !== 'INPUT'` (아직 이전 값)
   또는 status가 INPUT이 되더라도 effect cleanup이 한 틱 늦게 실행되면서
   방금 시작한 interval이 stop()으로 취소됨
4. 타이머 죽음 -> 입력 타임아웃 불가 -> 유저 입력도 무효 처리

## 수정 방향

**단일 책임 원칙**: 타이머의 start/stop은 오직 `useGameEngine`이 명시적으로 제어한다.
`useTimer`는 자체적으로 상태를 구독하여 자동 정지하는 로직을 가지지 않는다.

### 결정 근거

| 대안 | 장점 | 단점 | 결정 |
|---|---|---|---|
| A. useTimer에서 status 구독 제거 (엔진이 명시 제어) | 단순, race condition 원천 제거 | 엔진 쪽에서 stop 호출 빠뜨릴 위험 | **채택** |
| B. timer.reset()을 setTimeout(0)으로 분리 | 기존 구조 유지 | 여전히 타이밍 의존적, 불안정 | 기각 |
| C. useEffect 대신 Zustand subscribe 사용 | React 렌더 사이클 우회 | 복잡도 증가, 정리 로직 필요 | 기각 |

A안이 가장 단순하고 race condition 자체를 제거한다. 엔진이 이미 모든 상태 전환 지점에서
timer를 제어하고 있으므로 추가 누락 위험은 낮다.

## 수정 파일 목록

| 파일 | 변경 유형 | 내용 |
|---|---|---|
| `src/hooks/useTimer.ts` | 수정 | status 구독 제거, 인터페이스 단순화 |
| `src/hooks/useGameEngine.ts` | 수정 | RESULT 전환 시 timer.stop() 명시 호출 확인 |

## 상세 변경

### 1. `src/hooks/useTimer.ts`

**제거할 코드** (L2, L8, L36-42):
- `import { useGameStore }` 제거
- `const status = useGameStore((s) => s.status)` 제거
- status 구독 useEffect 전체 제거:
  ```ts
  // 이 블록 전체 삭제
  useEffect(() => {
    if (status !== 'INPUT') {
      stop()
      setTimeLeft(duration)
    }
  }, [status, stop, duration])
  ```

**변경 후 useTimer 인터페이스** (변경 없음):
```ts
export function useTimer(onExpire: () => void, duration?: number): {
  timeLeft: number
  reset: () => void
  stop: () => void
}
```

useTimer는 이제 순수한 카운트다운 타이머로, 외부에서 reset/stop만 호출하면 동작한다.

### 2. `src/hooks/useGameEngine.ts`

**확인/보강 포인트**:

1. `handleExpire` 콜백 (L29-34): `gameOver()` 호출 시 status가 RESULT로 바뀌지만,
   timer는 이미 만료되어 stop 상태이므로 추가 조치 불필요. OK.

2. SHOWING effect (L40-72): `timer.reset()` 호출 (L55)은 INPUT 진입 시 정상 동작. OK.

3. `handleInput` - wrong (L122-125): `gameOver()` 호출.
   **보강 필요**: `gameOver()` 전에 `timer.stop()` 호출 추가.
   현재는 status 구독이 자동 정지해줬지만, 구독 제거 후 명시 호출 필요.

4. `handleInput` - round-clear (L127-152): `timer.stop()` 이미 호출됨 (L129). OK.

5. `retryGame` / `startGame` (L95-103): resetGame -> launchAfterCountdown.
   resetGame이 status를 IDLE로 바꾸는데, 구독 제거 후 타이머가 자동 정지 안 됨.
   **보강 필요**: `launchAfterCountdown` 시작 시 `timer.stop()` 호출 추가.

**구체적 변경**:

```ts
// handleInput - wrong 분기 (기존 L122 부근)
if (result === 'wrong') {
  timer.stop()        // <-- 추가
  playGameOver()
  gameOver()
  return
}
```

```ts
// launchAfterCountdown 시작 부분 (기존 L76 부근)
const launchAfterCountdown = useCallback(() => {
  if (startingRef.current) return
  startingRef.current = true
  timer.stop()        // <-- 추가: 이전 게임 타이머 정리
  setCountdown(3)
  // ... 나머지 동일
}, [combo, setSequence, timer])
```

## 주의사항

- `useTimer`의 cleanup useEffect (`useEffect(() => () => stop(), [stop])`)는 유지한다.
  컴포넌트 언마운트 시 interval 정리 용도.
- `useTimer`에서 `useGameStore` import가 완전히 제거되므로 store와의 순환 의존이 끊어진다.
- `timer` 객체가 `launchAfterCountdown`의 deps에 추가되어야 한다.

## 검증 기준

1. Stage 1에서 SHOWING -> INPUT 전환 후 타이머가 정상 동작 (interval 활성 상태)
2. 입력 타임아웃 시 정상적으로 gameOver 호출
3. wrong 입력 시 타이머 즉시 정지
4. round-clear 시 타이머 즉시 정지 (기존과 동일)
5. 게임 재시작 시 이전 타이머 잔여 interval 없음
6. useTimer가 gameStore를 import하지 않음
