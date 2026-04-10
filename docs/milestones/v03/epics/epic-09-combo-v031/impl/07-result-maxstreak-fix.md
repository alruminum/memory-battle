# 07. ResultPage MAX STREAK 배율 표시 공식 수정 (버그픽스 #88)

> 버그픽스 — 관련 이슈: [#88](https://github.com/alruminum/memory-battle/issues/88)

---

## 버그 근본 원인

`src/pages/ResultPage.tsx` line 190의 MAX STREAK 배율 표시가 `Math.min(maxComboStreak + 1, 5)` 공식을 사용하고 있다.
이 공식은 실제 게임에서 사용하는 `getComboMultiplier(streak) = Math.floor(streak / 5) + 1`과 전혀 다른 값을 반환한다.

- `Math.min(maxComboStreak + 1, 5)`: streak 값에 1을 더하고 5로 상한을 적용 → streak=1이면 x2, streak=4이면 x5 (잘못된 결과)
- `Math.floor(maxComboStreak / 5) + 1`: 5연속마다 배율 +1 적용 → streak 0~4 = x1, 5~9 = x2 (올바른 결과)

콤보 로직은 Epic 09 Story 1(`01-combo-logic-v031.md`)에서 `getComboMultiplier`로 확정됐으나,
ResultPage의 표시 로직은 별도 구현 시 이 공식을 반영하지 않고 잘못된 공식이 작성됐다.

---

## 결정 근거

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **A. 인라인 공식을 `Math.floor(maxComboStreak / 5) + 1`로 수정 (채택)** | 변경 지점 1곳 (ResultPage.tsx line 190). `gameLogic.ts`의 `getComboMultiplier` 함수를 import해도 되나 단순 표시용 계산이므로 인라인으로 충분. | 채택 |
| **B. `getComboMultiplier`를 `gameLogic.ts`에서 import** | 공식 일관성은 높아지나, ResultPage에 gameLogic 의존성 추가. 단순 표시 계산을 위해 의존성을 늘리는 것은 과함. | 미채택 |

**A 채택 이유:**
- 수정 지점 1곳 — 최소 침습 수정
- `Math.floor(x / 5) + 1` 공식은 단순하므로 인라인으로도 의도가 명확
- `getComboMultiplier` import는 향후 리팩토링 시 고려 (지금은 범위 초과)

---

## 생성/수정 파일

- `src/pages/ResultPage.tsx` (수정) — line 190, MAX STREAK value 공식 수정

---

## 인터페이스 정의

외부 인터페이스 변경 없음. Props, 반환 타입, Zustand store 스키마 모두 유지.

`maxComboStreak`는 `GameStore`의 기존 필드 (`number` 타입) — 변경 없음.

---

## 핵심 로직

### Before

```typescript
{ label: 'MAX STREAK', value: `x${Math.min(maxComboStreak + 1, 5)}` }
```

### After

```typescript
{ label: 'MAX STREAK', value: `x${Math.floor(maxComboStreak / 5) + 1}` }
```

### 수정 결과 검증표

| maxComboStreak | 수정 전 | 수정 후 | 기대값 (`getComboMultiplier`) |
|---|---|---|---|
| 0 | x1 | x1 | x1 |
| 1 | x2 | x1 | x1 |
| 4 | x5 | x1 | x1 |
| 5 | x5 | x2 | x2 |
| 9 | x5 | x2 | x2 |
| 10 | x5 | x3 | x3 |
| 14 | x5 | x3 | x3 |
| 15 | x5 | x4 | x4 |

---

## 주의사항

- **DB 영향도**: 없음. 표시 전용 수정 — store 저장값(`maxComboStreak`) 변경 없음.
- **Breaking Change 없음**: ResultPage 외부 인터페이스, store 시그니처 모두 유지.
- **게임 로직 영향 없음**: `maxComboStreak` 값 자체는 `gameStore.ts`에서 올바르게 계산·저장되고 있었음. 이번 수정은 결과 화면 표시 공식만 수정.
- **상한 없음**: `getComboMultiplier`는 상한이 없으므로 (v0.3.1 변경) 수정 후에도 상한 없이 올바른 배율 표시.

---

## 테스트 경계

- **단위 테스트 가능**: 없음 — 단순 표시 공식 수정, 순수 함수 단독 테스트 대상 아님
- **통합 테스트 필요**: 없음
- **수동 검증**:
  1. [MANUAL-1] 게임에서 풀콤보 0회 달성 후 결과 화면 → MAX STREAK = x1 확인
  2. [MANUAL-2] 풀콤보 5연속(maxComboStreak=5) 달성 후 결과 화면 → MAX STREAK = x2 확인
  3. [MANUAL-3] 풀콤보 10연속(maxComboStreak=10) 달성 후 결과 화면 → MAX STREAK = x3 확인
  4. [MANUAL-4] 게임 로직·점수 계산에 회귀 없음 확인

---

## 수용 기준

| # | 항목 | 대상 | 유형 |
|---|---|---|---|
| AC1 | maxComboStreak=0~4 → MAX STREAK x1 표시 | ResultPage COMBO STATS | MANUAL |
| AC2 | maxComboStreak=5~9 → MAX STREAK x2 표시 | ResultPage COMBO STATS | MANUAL |
| AC3 | maxComboStreak=10~14 → MAX STREAK x3 표시 | ResultPage COMBO STATS | MANUAL |
| AC4 | `Math.floor(maxComboStreak / 5) + 1` 공식이 ResultPage.tsx에 적용됨 | ResultPage.tsx | CODE |
