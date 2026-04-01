# Epic 05 게임 메카닉 개편 설계 계획

> PRD v0.3 기반. 기존 Epic 01~04 완료 항목 위에 변경을 최소화하는 방향으로 설계한다.

---

## 스토리별 작업 범위

| Story | 제목 | 핵심 변경 |
|---|---|---|
| 14 | 난이도 시스템 제거 | `Difficulty` 타입 삭제, 배율 로직 제거, 난이도 UI 제거 |
| 15 | 스테이지 기반 속도/타이머 | `getFlashDuration(stage)`, `getInputTimeout(stage)` 도입 |
| 16 | 스택형 콤보 시스템 | `comboStreak` 스테이지 간 유지, 스테이지 클리어 시 배율 적용 |
| 17 | 콤보 인게임 UI | `ComboIndicator` 컴포넌트, 버튼 글로우, FULL COMBO 메시지 |
| 18 | 결과 화면 업데이트 | `fullComboCount`, `maxComboStreak`, 콤보 보너스 점수 표시 |

---

## impl 파일 목록

| 파일 | 담당 스토리 |
|---|---|
| `impl/14-difficulty-removal.md` | Story 14 |
| `impl/15-stage-speed-timer.md` | Story 15 |
| `impl/16-combo-streak.md` | Story 16 |
| `impl/17-combo-ui.md` | Story 17 |
| `impl/18-result-update.md` | Story 18 |

---

## 구현 순서 및 의존 관계

```
14 (타입/스토어 정리)
  → 16 (스토어 필드 추가 + 점수 계산 변경)
    → 15 (스토어 stage 참조, useGameEngine 수정)
      → 17 (스토어 comboStreak 참조, 인게임 UI)
        → 18 (스토어 fullComboCount/maxComboStreak 참조, 결과 화면)
```

**근거**: 14가 먼저인 이유 — `Difficulty` 타입이 제거된 후 16이 새 스토어 필드를 추가해야 하위 스토리들이 정확한 인터페이스를 바라볼 수 있다. 15는 16의 `comboStreak` 없이도 독립 구현 가능하지만, 스토어 `stage` 필드가 16 이후 확정되므로 16 뒤에 배치한다.

---

## 기존 코드 변경 범위 (인터페이스 기준)

### `src/types/index.ts`
- **삭제**: `export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'`
- 나머지 타입(`GameStatus`, `ButtonColor`) 유지

### `src/store/gameStore.ts`
현재 인터페이스 → 변경 후 인터페이스:

| 필드/메서드 | 현재 | 변경 |
|---|---|---|
| `difficulty: Difficulty` | 있음 | **삭제** |
| `isFullCombo: boolean` | 있음 | **삭제** (결과 화면에서 직접 불필요) |
| `comboStreak: number` | 없음 | **추가** |
| `fullComboCount: number` | 없음 | **추가** |
| `maxComboStreak: number` | 없음 | **추가** |
| `startGame(difficulty)` | `(difficulty: Difficulty) => void` | `() => void` (인자 제거) |
| `addInput(color)` | `'correct' \| 'wrong' \| 'round-clear'` 반환 | 동일 반환, 내부 점수 계산 변경 |
| `gameOver(isFullCombo)` | `(isFullCombo: boolean) => void` | `() => void` (인자 제거) |
| `DIFFICULTY_MULTIPLIER` | 상수 존재 | **삭제** |
| `calcFinalScore` | 내부 함수 | **삭제** |

### `src/hooks/useGameEngine.ts`
| 변경 항목 | 현재 | 변경 |
|---|---|---|
| `FLASH_DURATION[difficulty]` | `Record<Difficulty, number>` | `getFlashDuration(stage)` 함수로 교체 |
| `useTimer(handleExpire)` | `duration = 2000` 고정 | `duration = getInputTimeout(stage)` 동적 주입 |
| `startGame(diff)` | `(diff: Difficulty)` 인자 | 인자 제거 |
| `retryGame(diff?)` | `(diff?: Difficulty)` | 인자 제거 |
| `launchAfterCountdown(diff)` | `(diff: Difficulty)` | 인자 제거 |
| `combo.reset()` 호출 시점 | 스테이지 클리어 시 매번 | 스테이지 클리어 시 comboStreak 업데이트 후 comboCount 리셋 |
| `gameOver(combo.checkFullCombo(...))` | 인자 전달 | `gameOver()` 인자 없이 호출 |

### `src/hooks/useTimer.ts`
| 변경 항목 | 현재 | 변경 후 |
|---|---|---|
| `duration` 파라미터 | `duration = 2000` 기본값 | 호출 측에서 `getInputTimeout(stage)` 계산 후 주입. 인터페이스 자체(`duration` 파라미터)는 그대로 유지 |

**근거**: useTimer는 `duration` 파라미터를 이미 지원한다 (현재 코드 4번 줄 `duration = 2000`). 인터페이스 변경 없이 호출 측에서 동적 값을 전달하면 된다.

### `src/hooks/useRanking.ts`
| 변경 항목 | 현재 | 변경 후 |
|---|---|---|
| `submitScore` 시그니처 | `(score, stage, difficulty, userId)` | `(score, stage, userId)` — `difficulty` 인자 제거 |
| `supabase.from('scores').insert` | `difficulty` 필드 포함 | `difficulty` 필드 제거 |

**주의**: `scores` 테이블 DDL에 `difficulty` 컬럼이 있으면 Supabase 쪽도 수정 필요. `docs/db-schema.md` 확인 후 처리.

### `src/pages/ResultPage.tsx`
- `difficulty`, `diffLabel` 참조 제거
- `submitScore` 인자에서 `difficulty` 제거
- 콤보 통계 섹션 추가 (`fullComboCount`, `maxComboStreak`, 콤보 보너스)

### `src/pages/MainPage.tsx`
- 난이도 탭(`DIFFICULTIES` 배열, selectedDifficulty 상태) 전체 제거
- `onStart(difficulty)` props → `onStart()` 로 변경
- `useGameStore`에서 `difficulty` 읽기 제거

### `src/pages/GamePage.tsx`
- 난이도 탭 UI 전체 제거
- `selectedDifficulty` 상태 제거
- `startGame(selectedDifficulty)` → `startGame()` 변경
- 헤더 좌측 `diffLabel` 제거 또는 대체 텍스트로 교체
- `ComboIndicator` 컴포넌트 삽입 (Story 17)

### `src/components/game/ButtonPad.tsx`
- (Story 17) 버튼 글로우 이펙트 추가 — props로 `comboActive: boolean` 수신

---

## 주요 리스크 및 완화

| 리스크 | 완화 방법 |
|---|---|
| 점수 계산 위치 변경 — `addInput` 시점 누적에서 스테이지 클리어 시점 배율 적용으로 전환 | `addInput`은 `rawScore +1`만 처리, 배율 적용은 `gameOver` 또는 별도 `stageClear` 액션에서 수행 |
| `useTimer` 동적 duration — `reset()` 호출 시점에 최신 stage의 timeout이 반영되어야 함 | `useTimer`를 `useMemo(getInputTimeout(stage))` 로 계산한 값을 props로 전달, `reset()` 내부는 클로저로 `duration`을 갱신 — 현재 구현에서 `duration` 변경 시 `reset` 콜백이 재생성되므로 그대로 동작 |
| `useRanking.submitScore` difficulty 인자 제거 — Epic 02 범위 연동 | `useRanking.ts`와 `ResultPage.tsx` 동시 수정. DB 컬럼 제거 여부는 옵션 (NULL 허용으로 두어도 무방) |
| `retryGame` 인자 제거 — 타입 오류 발생 가능 | `GamePage.tsx`의 `onRetry={() => retryGame(selectedDifficulty)}` → `onRetry={() => retryGame()}` 로 변경 필수 |
| `gameOver()` 인자 제거 — `useGameEngine.ts`에 호출 지점 2곳 존재 | `handleExpire` 콜백(32번 줄)과 `handleInput` wrong 분기(124번 줄) 모두 `gameOver(combo.checkFullCombo(...))` → `gameOver()` 로 변경 필수. 누락 시 컴파일 오류(인자 타입 불일치)가 아닌 **런타임 무시**로 숨어서 발생할 수 있음 |
