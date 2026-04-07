# 08. HUD STG 셀 카운트다운 중 표시 버그픽스

> 버그픽스 — 관련 이슈: [#76](https://github.com/alruminum/memory-battle/issues/76)

---

## 버그 근본 원인

`src/pages/GamePage.tsx` L242 HUD STG 셀:

```tsx
{countdown !== null ? '--' : String(stage).padStart(2, '0')}
```

카운트다운(3→2→1) 진행 중 `countdown !== null` 조건이 참이 되어 `'--'`를 표시한다.

그러나 게임 시작 전 카운트다운 구간에서 stage 값은 `0`(초기값)이므로, `'--'` 대신 `'00'`을 표시하는 것이 올바른 UX다. `'--'`는 "값이 없음"을 암시하는 반면, `'00'`은 "게임 시작 전 0스테이지"를 명확히 전달한다. 또한 리트라이 시에도 `stage`는 `resetGame()` 호출로 이미 `0`으로 초기화되므로, `countdown` 조건 없이 `stage` 값을 그대로 표시해도 직전 stage가 노출되지 않는다.

### 이전 결정(#66)과의 관계

impl/06-hud-stg-countdown-fix.md(#66)에서 카운트다운 중 `'--'` 표시를 의도적으로 선택했다. 이번 이슈 #76은 그 결정을 `'00'` 표시로 변경하는 스펙 수정이다. 따라서 test-plan.md의 #66 관련 TC 3건도 함께 갱신한다.

---

## 결정 근거

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **A. `countdown !== null` 분기 제거 (채택)** | 항상 `String(stage).padStart(2, '0')` 표시. 카운트다운 중 `stage === 0` → `'00'`. 리트라이 시 `resetGame()`이 `stage: 0`으로 초기화하므로 직전 값 노출 없음. | 채택 |
| **B. `countdown !== null ? '00' : String(stage).padStart(2, '0')`** | `'00'`을 하드코딩. 동작은 동일하나 `stage === 0`일 때 불필요한 삼항 분기 유지. 코드 가독성 저하. | 미채택 |

**A 채택 이유:**
- 가장 단순한 수정 (삼항 분기 제거, 단일 표현식으로 변경)
- `stage === 0` 초기값이 이미 `'00'` 표시를 의미하므로 별도 분기 불필요
- `retryGame()` 경로: `useGameStore.getState().resetGame()`이 `stage: 0`으로 초기화한 뒤 `countdown`이 설정되므로, `countdown` 조건 없이도 직전 stage 값 노출 없음
- Breaking Change 없음: `countdown` 변수는 GamePage 내 다른 위치에서도 참조되므로 HUD STG 셀에서만 조건 제거

---

## 생성/수정 파일

- `src/pages/GamePage.tsx` (수정) — L242: `countdown !== null ? '--' :` 삼항 분기 제거

---

## 인터페이스 정의

외부 인터페이스 변경 없음. Props, 반환 타입, store 스키마 모두 유지.

---

## 핵심 로직

### Before (`src/pages/GamePage.tsx` L242)

```tsx
<span style={{ fontFamily: 'var(--vb-font-score)', fontSize: 22, fontWeight: 900, color: 'var(--vb-text)', lineHeight: 1 }}>
  {countdown !== null ? '--' : String(stage).padStart(2, '0')}
</span>
```

### After

```tsx
<span style={{ fontFamily: 'var(--vb-font-score)', fontSize: 22, fontWeight: 900, color: 'var(--vb-text)', lineHeight: 1 }}>
  {String(stage).padStart(2, '0')}
</span>
```

### 기대 동작

| 상태 | `countdown` 값 | `stage` 값 | STG 셀 표시 (After) |
|---|---|---|---|
| IDLE (게임 시작 전) | `null` | `0` | `00` (변경 없음) |
| COUNTDOWN (카운트다운 진행 중) | `3` / `2` / `1` | `0` | `00` (변경 포인트: 기존 `--` → `00`) |
| 리트라이 COUNTDOWN | `3` / `2` / `1` | `0` (resetGame 초기화) | `00` (변경 포인트: 기존 `--` → `00`) |
| SHOWING / INPUT (게임 진행 중) | `null` | `1`, `2`, ... | `01`, `02`, ... (변경 없음) |
| RESULT (게임 오버) | `null` | 마지막 stage 값 | 마지막 stage 값 (변경 없음) |

---

## 주의사항

- **Breaking Change 없음**: HUD STG 셀 외 다른 위치의 `countdown` 참조는 영향받지 않음.
- **DB 영향도**: 없음. UI 전용 수정.
- **`resetGame()` 초기화 순서 전제**: `retryGame()` 경로에서 `stage`가 `resetGame()` 내부에서 `0`으로 초기화된 뒤 카운트다운이 시작된다. 이 순서가 지켜지는 한 직전 stage 값 노출은 발생하지 않는다. `useGameEngine.ts`의 `retryGame` 구현이 이 순서를 보장하는지 engineer가 확인 후 구현한다.
- **#66 회귀 가능성**: `countdown` 분기 제거로 인해 리트라이 시 직전 stage 값 노출 여부를 반드시 수동 검증한다 (AC2).
- **test-plan.md #66 TC 갱신 필요**: `HUD STG 셀: 카운트다운 진행 중 '--' 표시 (이슈 #66)` TC를 `'00'` 표시로 갱신. 하단 수용 기준 참조.

---

## 테스트 경계

- **단위 테스트 가능**: 없음 — GamePage는 다수 훅 의존성으로 단위 테스트 비용 대비 효과 낮음
- **통합 테스트 필요**: 없음
- **수동 검증**:
  1. [MANUAL-1] 게임 시작 버튼 탭 → 카운트다운(3→2→1) 전체 구간 동안 HUD STG 셀이 `00`으로 표시되는지 확인
  2. [MANUAL-2] 스테이지 5 이상 진행 후 리트라이 → 카운트다운 중 직전 stage 값이 아닌 `00` 표시 확인 (직전 stage 잔존 없음)
  3. [MANUAL-3] 카운트다운 종료 후 SHOWING/INPUT 진입 시 STG 셀이 올바른 stage 값(`01`, `02`, ...)으로 전환되는지 확인
  4. [MANUAL-4] 게임오버 후 RESULT 상태에서 STG 셀이 마지막 stage 값을 유지하는지 확인 (회귀 없음)

---

## 수용 기준

| # | 항목 | 대상 | 유형 |
|---|---|---|---|
| AC1 | 게임 시작 카운트다운(3→2→1) 2250ms 동안 HUD STG 셀이 `00` 표시 | HUD STG 셀 | MANUAL |
| AC2 | 스테이지 N 진행 후 리트라이 시 카운트다운 중 STG 셀이 `00` 표시 (직전 stage 값 미노출) | HUD STG 셀 | MANUAL |
| AC3 | 카운트다운 종료 후 SHOWING/INPUT 진입 시 STG 셀이 `01`, `02`, ... 표시 | HUD STG 셀 | MANUAL |
| AC4 | RESULT 상태에서 STG 셀이 마지막 stage 값 유지 (회귀 없음) | HUD STG 셀 | MANUAL |
