# 06. HUD STG 셀 카운트다운 중 stage 값 노출 버그픽스

> 버그픽스 — 관련 이슈: [#66](https://github.com/alruminum/memory-battle/issues/66)

---

## 버그 근본 원인

### 수정 1 — HUD STG 셀 (L242)

`src/pages/GamePage.tsx` HUD 스트립의 STG 셀(L242)이 `countdown` 상태를 무시하고
무조건 `String(stage).padStart(2, '0')`을 렌더링한다.

`countdown !== null` 기간(카운트다운 3→2→1, 총 2250ms) 동안:
- 게임 시작 직후: `stage === 0` → STG 셀에 `00` 표시
- 재시작(리트라이) 시: 직전 게임의 `stage` 값이 잔존하여 노출

`countdown`은 `useGameEngine` 훅에서 이미 반환하고 있으며 GamePage L145에서 구독 중이다.
STG 셀에서만 해당 값을 참조하지 않은 것이 원인.

### 수정 2 — StageArea 컴포넌트 (L114) [추가 수정]

동일 파일의 `StageArea` 컴포넌트가 `if (isPlaying)` 분기(L114)에서
`countdown` 상태를 확인하지 않고 stage 관련 콘텐츠를 렌더링한다.

카운트다운 중 `isPlaying === true`이면 StageArea 중앙에 "STAGE 02" 같은
이전 stage 값이 노출된다. HUD STG 셀과 동일한 패턴의 버그.

---

## 결정 근거

### `countdown !== null ? '--' : String(stage).padStart(2, '0')` 채택

카운트다운 중 STG 셀에 표시할 수 있는 대안:
- **A. `'--'` (채택)**: 의미 있는 stage 값이 없음을 명시. 게임 시작 전 상태임을 직관적으로 표현.
  DAILY 셀의 `#—` 패턴과 일치 (L250).
- **B. 빈 문자열 `''`**: 레이아웃 높이 변화 가능성. HUD 셀 가운데 정렬 유지에 불리.
- **C. `stage === 0 ? '--' : String(stage).padStart(2, '0')`**: `stage` 값으로만 판단하면
  리트라이 시 직전 stage가 남아 있어 동일 버그 재발. `countdown` 기반 판단이 정확.

### `countdown` 추가 구독 불필요

`countdown`은 이미 `useGameEngine()` 반환값으로 GamePage L145에서 구독 중.
HUD 스트립 렌더링부(L240~243)에서 동일 변수를 직접 참조하면 됨.
`useGameStore`에 `countdown`이 없으므로 store 변경 없음.

---

## 생성/수정 파일

- `src/pages/GamePage.tsx` (수정) — L242: STG 셀 렌더링에 `countdown` 조건 추가
- `src/pages/GamePage.tsx` (수정) — L114: `StageArea` 분기 조건에 `countdown === null` 추가

---

## 인터페이스 정의

변경 없음. 추가 Props, 타입, store 변경 없음.

---

## 핵심 로직

### 수정 1: `src/pages/GamePage.tsx` L242 — HUD STG 셀

```tsx
// Before (L242)
<span style={{ fontFamily: 'var(--vb-font-score)', fontSize: 22, fontWeight: 900, color: 'var(--vb-text)', lineHeight: 1 }}>{String(stage).padStart(2, '0')}</span>

// After
<span style={{ fontFamily: 'var(--vb-font-score)', fontSize: 22, fontWeight: 900, color: 'var(--vb-text)', lineHeight: 1 }}>{countdown !== null ? '--' : String(stage).padStart(2, '0')}</span>
```

### 수정 2: `src/pages/GamePage.tsx` L114 — StageArea 분기 조건

```tsx
// Before (L114)
if (isPlaying) {
  // StageArea stage 관련 콘텐츠 렌더링
}

// After
if (isPlaying && countdown === null) {
  // StageArea stage 관련 콘텐츠 렌더링
}
```

`countdown` 변수는 GamePage L145에서 이미 구조분해되어 있음:
```typescript
const { flashingButton, clearingStage, countdown, handleInput, startGame, retryGame, multiplierIncreased, gameOverReason } = useGameEngine()
```
두 수정 모두 추가 구독 없이 동일 변수를 참조.

### 기대 동작

| 상태 | `countdown` 값 | STG 셀 표시 |
|---|---|---|
| IDLE (게임 시작 전) | `null` | `00` (stage 초기값 0) — 현재와 동일, 변경 없음 |
| COUNTDOWN (카운트다운 진행 중) | `3` / `2` / `1` | `--` (수정 포인트) |
| SHOWING / INPUT (게임 진행 중) | `null` | `01`, `02`, ... (현재와 동일) |
| RESULT (게임 오버) | `null` | 마지막 stage 값 (현재와 동일) |

> IDLE 상태의 `00` 표시는 버그 범위 외. 해당 상태에서는 ButtonPad에 START 버튼이 표시되어
> stage 값이 시각적으로 의미 없음. 별도 이슈로 처리 가능.

---

## 주의사항

- **Breaking Change 없음**: HUD 스트립 및 `StageArea` 외부 인터페이스 변경 없음.
- **DB 영향도**: 없음. UI 전용 수정.
- **`countdown` 구독 중복 없음**: L145에서 이미 구독 중이므로 추가 `useGameStore()` 호출 불필요.
- **IDLE 상태 `00` 표시**: `countdown === null && stage === 0`인 IDLE 상태는 이번 수정 범위 외.
  현재 ButtonPad가 START 화면을 렌더링하므로 STG 값 노출이 문제되지 않는 상태.
- **리트라이 경로**: `retryGame()` 호출 시 store의 `stage`가 `resetGame()` 내부에서 초기화되기
  전에 `countdown`이 설정된다. 두 수정 모두 리트라이 시 직전 stage 잔존 버그를 동시에 해결.
- **수정 2 영향 범위**: `StageArea`는 `isPlaying && countdown === null` 조건이 모두 충족될 때만
  stage 콘텐츠를 렌더링한다. 카운트다운 중 `isPlaying === true`이더라도 StageArea는 빈 상태
  (또는 idle 렌더링)를 표시한다. StageArea가 카운트다운 중 다른 콘텐츠를 보여줘야 한다면
  별도 분기 추가가 필요하나, 현재 스펙 상 빈 상태가 올바른 동작.

---

## 테스트 경계

- **단위 테스트 가능**: 없음 — GamePage는 다수 훅 의존성으로 단위 테스트 비용 대비 효과 낮음
- **통합 테스트 필요**: 없음
- **수동 검증**:
  1. 게임 시작 버튼 탭 → 카운트다운(3→2→1) 중 HUD STG 셀이 `--`로 표시되는지 확인
  2. 스테이지 5 이상 진행 후 리트라이 → 카운트다운 중 직전 stage 값이 아닌 `--` 표시 확인
  3. 카운트다운 종료 후 게임 진행 중 STG 셀이 올바른 stage 숫자(`01`, `02`, ...) 표시 확인
  4. 게임 시작 버튼 탭 → 카운트다운(3→2→1) 중 StageArea 중앙에 "STAGE 02" 등 이전 stage 값이 미노출되는지 확인
  5. 스테이지 N 진행 후 리트라이 → 카운트다운 중 StageArea에 직전 stage 값 미노출 확인

---

## 수용 기준

| # | 항목 | 대상 | 유형 |
|---|---|---|---|
| AC1 | 게임 시작 카운트다운(3→2→1) 2250ms 동안 HUD STG 셀이 `--` 표시 | HUD STG 셀 | MANUAL |
| AC2 | 스테이지 N 진행 후 리트라이 시 카운트다운 중 직전 stage 값 미노출 | HUD STG 셀 | MANUAL |
| AC3 | 카운트다운 종료 후 게임 진행 중 STG 셀이 올바른 stage 값 표시 | HUD STG 셀 | MANUAL |
| AC4 | SHOWING / INPUT / RESULT 상태에서 STG 셀 회귀 없음 | HUD STG 셀 | MANUAL |
| AC5 | 게임 시작 카운트다운(3→2→1) 중 StageArea 중앙에 이전 stage 값 미노출 | StageArea | MANUAL |
| AC6 | 스테이지 N 진행 후 리트라이 시 카운트다운 중 StageArea에 직전 stage 값 미노출 | StageArea | MANUAL |
| AC7 | 카운트다운 종료 후 게임 진행 중 StageArea가 올바른 stage 콘텐츠 표시 | StageArea | MANUAL |
