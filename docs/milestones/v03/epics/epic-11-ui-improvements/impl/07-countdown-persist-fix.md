# 07. 카운트다운 종료 후 countdown UI 잔존 버그픽스

> 버그픽스 — 관련 이슈: [#75](https://github.com/alruminum/memory-battle/issues/75)

---

## 버그 근본 원인

`src/hooks/useGameEngine.ts` `launchAfterCountdown`의 t=2250 setTimeout 콜백에서
React `setCountdown(null)` (useState)과 Zustand `startGame()` 호출이 동일 동기 블록 내에 있지만,
React 18 자동 배칭으로 인해 `setCountdown(null)`의 DOM 반영이 Zustand 상태 변경보다 늦어진다.

```typescript
setTimeout(() => {
  startingRef.current = false
  setCountdown(null)          // ① React useState → 배칭 큐
  clearingRef.current = false
  setClearingStage(null)
  playGameStart()
  const firstSeq = [randomButton()]
  useGameStore.getState().startGame()    // ② Zustand → status: 'SHOWING' 즉시 구독자 통보
  setSequence(firstSeq)
  useGameStore.setState({ sequence: firstSeq, status: 'SHOWING', stage: 1 })  // ③ Zustand 즉시
}, COUNTDOWN_INTERVAL * 3)
```

② 이후 SHOWING useEffect가 트리거되고 시퀀스 플래시 setTimeout 체인이 시작되는 동안
① `setCountdown(null)`의 flush가 지연된다.
결과: `countdown=1` + `status='SHOWING'` 상태가 한 렌더 프레임 이상 공존하여
StageArea `if (countdown !== null)` 분기가 카운트다운 "1" UI를 계속 렌더링한다.

---

## 결정 근거

### 옵션 비교

| 옵션 | 설명 | 장점 | 단점 |
|---|---|---|---|
| **A. countdown을 Zustand store로 편입** | `startGame()`이 `countdown: null`을 함께 set | 원자적 상태 전환, 타이밍 이슈 원천 제거 | store 인터페이스 변경, GamePage/StageArea 구독 방식 변경, 변경 범위 큼 |
| **B. flushSync로 setCountdown(null) 즉시 flush** | `flushSync(() => setCountdown(null))` 후 startGame() 호출 | 최소 변경 (1줄), 기존 구조 유지, React 공식 API | flushSync는 React 내부 렌더링을 동기 강제 → 성능 주의사항 있으나 1회성 전환이라 무방 |
| **C. startGame()을 requestAnimationFrame으로 지연** | setCountdown(null) flush 후 다음 프레임에 startGame() 실행 | 구조 변경 최소 | 프레임 타이밍 보장 없음, 기기별 편차 발생 가능성 |

**채택: B (flushSync)**

- 변경 범위가 `useGameEngine.ts` 1개 파일, 1개 함수 내 2줄로 국한
- `flushSync`는 카운트다운 종료 시 1회만 실행되므로 성능 영향 무시 가능
- A는 store 인터페이스 + GamePage 구독 방식 변경을 수반하여 회귀 리스크가 큼
- C는 rAF 타이밍이 기기/부하에 따라 다르고, "다음 프레임" 보장이 없어 동일 버그 재발 가능

### flushSync 사용 근거

`react-dom`에서 import. React 18 공식 escape hatch.
카운트다운 → 게임 시작 전환은 사용자 상호작용 없는 타임아웃 콜백이므로
자동 배칭이 비활성화되지 않아 flushSync가 필요하다.
`startGame()` 이전에 flush를 완료하면 `countdown=null` 렌더 후 Zustand가 SHOWING으로 전환되어
StageArea는 카운트다운 UI를 표시하지 않는다.

---

## 생성/수정 파일

- `src/hooks/useGameEngine.ts` (수정) — `launchAfterCountdown` 내 t=2250 콜백: `setCountdown(null)` → `flushSync(() => setCountdown(null))`

---

## 인터페이스 정의

외부 인터페이스 변경 없음. `useGameEngine` 반환 타입, store 인터페이스, Props 모두 유지.

추가 import:

```typescript
import { flushSync } from 'react-dom'
```

---

## 핵심 로직

### Before (`useGameEngine.ts` L85-95)

```typescript
setTimeout(() => {
  startingRef.current = false
  setCountdown(null)          // React 배칭 큐 — 지연 flush
  clearingRef.current = false
  setClearingStage(null)
  playGameStart()
  const firstSeq: ButtonColor[] = [randomButton()]
  useGameStore.getState().startGame()
  setSequence(firstSeq)
  useGameStore.setState({ sequence: firstSeq, status: 'SHOWING', stage: 1 })
}, COUNTDOWN_INTERVAL * 3)
```

### After

```typescript
setTimeout(() => {
  startingRef.current = false
  flushSync(() => setCountdown(null))   // ← flush 완료 후 다음 줄 실행
  clearingRef.current = false
  setClearingStage(null)
  playGameStart()
  const firstSeq: ButtonColor[] = [randomButton()]
  useGameStore.getState().startGame()
  setSequence(firstSeq)
  useGameStore.setState({ sequence: firstSeq, status: 'SHOWING', stage: 1 })
}, COUNTDOWN_INTERVAL * 3)
```

### 실행 순서 (After)

1. t=2250ms: setTimeout 콜백 진입
2. `flushSync(() => setCountdown(null))` — React가 동기로 리렌더링, StageArea에서 `countdown === null` 확정
3. `startGame()` — Zustand `status: 'SHOWING'`으로 전환
4. SHOWING useEffect 트리거 → 시퀀스 플래시 시작
5. 이 시점 StageArea는 이미 `countdown === null`이므로 카운트다운 UI 미표시

---

## 주의사항

- **Breaking Change 없음**: 외부 인터페이스(반환 타입, store, Props) 변경 없음.
- **DB 영향도**: 없음. 순수 UI 타이밍 수정.
- **flushSync import 경로**: `react-dom` (react 아님). `react-dom/client`가 아닌 `react-dom`에서 export됨.
- **setClearingStage(null)은 flushSync 밖**: clearingStage는 별도 조건(`clearingStage !== null`)으로 분기되어 countdown과 독립적. flush에 포함할 필요 없음. 다음 렌더 배칭에서 flush돼도 동작 이상 없음.
- **retryGame 경로에도 동일 수정 적용**: `retryGame`은 `launchAfterCountdown`을 호출하므로 별도 수정 불필요.
- **flushSync 중첩 금지**: flushSync 콜백 내에서 다른 flushSync 호출 금지. 현재 구조에서 해당 없음.
- **관련 impl 이력**: impl/06-hud-stg-countdown-fix.md (#66)에서 `countdown` 기반 조건부 렌더링이 이미 적용되어 있으므로, 이번 수정으로 `countdown=null`이 올바르게 flush되면 HUD STG 셀과 StageArea 모두 정상 동작.

---

## 테스트 경계

- **단위 테스트 가능**: 없음 — `flushSync` + setTimeout 타이밍 검증은 jsdom 환경에서 신뢰도 낮음
- **통합 테스트 필요**: 없음
- **수동 검증**:
  1. [MANUAL-1] 게임 시작 버튼 탭 → 카운트다운 "1" 표시 후 즉시 게임 시작(StageArea에 STAGE 01 표시) 확인. "1" UI가 잔존하지 않아야 함.
  2. [MANUAL-2] 스테이지 N 진행 후 리트라이 → 카운트다운 종료 직후 StageArea가 STAGE 01을 표시하는지 확인. "1" 잔존 없어야 함.
  3. [MANUAL-3] 카운트다운 3→2→1 진행 중 StageArea에 카운트다운 숫자+힌트 문구가 올바르게 표시되는지 확인 (회귀 없음).
  4. [MANUAL-4] 카운트다운 종료 후 HUD STG 셀이 `--`에서 `01`로 전환되는지 확인 (이슈 #66 회귀 없음).

---

## 수용 기준

| # | 항목 | 대상 | 유형 |
|---|---|---|---|
| AC1 | 카운트다운 "1" 표시 후 SHOWING 진입 시 StageArea에 "1" 잔존 없음 | StageArea | MANUAL |
| AC2 | 리트라이 시 카운트다운 종료 직후 StageArea가 STAGE 01 표시 (이전 countdown 값 미노출) | StageArea | MANUAL |
| AC3 | 카운트다운(3→2→1) 진행 중 힌트 문구 정상 표시 (회귀 없음) | StageArea | MANUAL |
| AC4 | 카운트다운 종료 후 HUD STG 셀 `--` → `01` 전환 정상 (이슈 #66 회귀 없음) | HUD STG 셀 | MANUAL |
| AC5 | 게임 진행(SHOWING/INPUT/RESULT) 중 기존 동작 회귀 없음 | 전체 GamePage | MANUAL |
