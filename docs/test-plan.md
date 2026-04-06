# 기억력배틀 테스트 계획 (Test Plan)

> 작성 기준: PRD v0.3.1 / Epic 11 UI 개선 시점  
> 테스트 코드 작성 전 명세 문서. 실제 코드 작성/실행은 별도 진행.
>
> **업데이트 이력**
> - 2026-04-06: §2 E그룹 구현 완료 — StageArea.countdown.test.tsx TC1~TC5 PASS (153/153), COUNTDOWN_INTERVAL 750ms 적용, hintPhase isActive 패턴 커밋 8827414 (#61/#64)
> - 2026-04-06: §2 E그룹 추가 — StageArea.countdown.test.tsx TC 명세 (#61/#64); §5 MANUAL TC 2건 추가 (#64)
> - 2026-04-05: §5 L472 TC 수정 — #61 버그픽스: "매 tick flipIn 재실행" → "750ms 전환 시에만 flipIn, tick 변경 시 깜빡임 없음"
> - 2026-04-05: §5 수동 검증 항목 카운트다운 힌트 TC 수정 — #62 버그픽스: countdown값 기준 분기 → 750ms 타이머 기준으로 교체; E그룹(fake timers) TC 추가
> - 2026-04-03: B-2, B-5 TC 갱신 — 점수 배율 즉시 적용 버그픽스 (#59): addInput 배율 즉시 반영, stageClear clearBonus 전용 로직 반영
> - 2026-04-03: §5 수동 검증 항목에 Epic 11 (#52/#53/#54) TC 추가, §3 제외 항목에 ComboIndicator 명시
> - 2026-04-03: §5 수동 검증 항목에 Page Visibility API 버그픽스 TC 추가 (Epic 10 이슈 #51)
> - 2026-04-03: §5 수동 검증 항목에 탭-쓰루 버그픽스 TC 추가 (Epic 10 이슈 #50)
> - 2026-04-03: §5 수동 검증 항목에 타이틀·HUD 블러 제외 TC 추가 (Epic 10 이슈 #49)
> - 2026-04-03: §5 수동 검증 항목에 GameOverOverlay 레이아웃·프리뷰 버그픽스 TC 추가 (Epic 10 #48)
> - 2026-04-03: B-6 `gameOver(reason)` TC 갱신 (`gameOverReason` 필드 추가 — Epic 10)
> - 2026-04-02: A-6 (`getInputTimeout`) 섹션 추가, D 그룹 (타이머 통합 TC) 추가 (Epic 09 SPEC_GAP 복구)

---

## 1. 개요

### 1.1 테스트 프레임워크

| 항목 | 선택 |
|---|---|
| 테스트 러너 | **vitest** |
| 컴포넌트 테스트 | **@testing-library/react** |
| 타입 | **TypeScript** |

### 1.2 설치 패키지

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitest/ui jsdom
```

### 1.3 설정 (vite.config.ts에 추가)

```typescript
// vite.config.ts
export default defineConfig({
  // ... 기존 설정 ...
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
```

### 1.4 실행 명령어 (package.json scripts에 추가)

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

### 1.5 테스트 파일 구조

```
src/
  lib/
    gameLogic.ts
    gameLogic.test.ts          ← 순수 함수 단위 테스트
  store/
    gameStore.ts
    gameStore.test.ts          ← Zustand 상태 통합 테스트
  hooks/
    useGameEngine.ts
    useGameEngine.test.ts      ← 게임 엔진 흐름 테스트
  test/
    setup.ts                   ← @testing-library/jest-dom 설정
```

---

## 2. 에픽별 테스트 명세

---

### A. `src/lib/gameLogic.ts` — 순수 함수 단위 테스트

> 파일 경로: `src/lib/gameLogic.test.ts`  
> 외부 의존 없음. mock 불필요.
>
> **커버 대상 함수**: `getFlashDuration`, `getComboMultiplier`, `calcClearBonus`, `calcBaseStageScore`, `calcStageScore`, `getInputTimeout`

---

#### A-1. `getFlashDuration(stage)`

스테이지 번호에 따른 버튼 점등 시간(ms)을 반환한다.  
경계: 1~9 → 500ms / 10~19 → 400ms / 20~29 → 300ms / 30+ → 250ms

| # | 유형 | 케이스 설명 | 입력 | 기대값 | 우선순위 |
|---|---|---|---|---|---|
| A-1-1 | 정상 흐름 | stage 1 → 500ms | `getFlashDuration(1)` | `500` | 🔴 Critical |
| A-1-2 | 정상 흐름 | stage 9 → 500ms (경계 직전) | `getFlashDuration(9)` | `500` | 🔴 Critical |
| A-1-3 | 정상 흐름 | stage 10 → 400ms (경계 시작) | `getFlashDuration(10)` | `400` | 🔴 Critical |
| A-1-4 | 정상 흐름 | stage 19 → 400ms (경계 직전) | `getFlashDuration(19)` | `400` | 🟡 High |
| A-1-5 | 정상 흐름 | stage 20 → 300ms | `getFlashDuration(20)` | `300` | 🟡 High |
| A-1-6 | 정상 흐름 | stage 30 → 250ms | `getFlashDuration(30)` | `250` | 🟡 High |
| A-1-7 | 엣지 케이스 | stage 0 (게임 시작 전) → 500ms | `getFlashDuration(0)` | `500` | 🟠 Medium |
| A-1-8 | 엣지 케이스 | stage 100 (매우 큰 값) → 250ms | `getFlashDuration(100)` | `250` | 🟠 Medium |
| A-1-9 | 엣지 케이스 | stage 29 (30 직전) → 300ms | `getFlashDuration(29)` | `300` | 🟡 High |

---

#### A-2. `getComboMultiplier(comboStreak)`

연속 풀콤보 streak 횟수로 배율을 반환한다.  
공식: `Math.floor(comboStreak / 5) + 1`  
0~4 → x1 / 5~9 → x2 / 10~14 → x3 / 15~19 → x4 / 20+ → x5...

| # | 유형 | 케이스 설명 | 입력 | 기대값 | 우선순위 |
|---|---|---|---|---|---|
| A-2-1 | 정상 흐름 | streak 0 → x1 (콤보 없음) | `getComboMultiplier(0)` | `1` | 🔴 Critical |
| A-2-2 | 정상 흐름 | streak 4 → x1 (배율 상승 직전) | `getComboMultiplier(4)` | `1` | 🔴 Critical |
| A-2-3 | 정상 흐름 | streak 5 → x2 (첫 배율 상승) | `getComboMultiplier(5)` | `2` | 🔴 Critical |
| A-2-4 | 정상 흐름 | streak 9 → x2 | `getComboMultiplier(9)` | `2` | 🟡 High |
| A-2-5 | 정상 흐름 | streak 10 → x3 | `getComboMultiplier(10)` | `3` | 🟡 High |
| A-2-6 | 정상 흐름 | streak 15 → x4 | `getComboMultiplier(15)` | `4` | 🟡 High |
| A-2-7 | 정상 흐름 | streak 20 → x5 | `getComboMultiplier(20)` | `5` | 🟡 High |
| A-2-8 | 엣지 케이스 | streak 25 → x6 (상한 없음 확인) | `getComboMultiplier(25)` | `6` | 🟠 Medium |
| A-2-9 | 엣지 케이스 | streak 100 → x21 (매우 큰 값) | `getComboMultiplier(100)` | `21` | 🟠 Medium |

> **주의**: v0.3.1에서 comboStreak 상한이 제거되었다 (기존 cap=4 → 제거). 상한 없이 계속 증가하는지 확인 필수.

---

#### A-3. `calcClearBonus(stage)`

스테이지 클리어 보너스. 10스테이지 미만은 0, 이상부터 `Math.floor(stage / 5)`.

| # | 유형 | 케이스 설명 | 입력 | 기대값 | 우선순위 |
|---|---|---|---|---|---|
| A-3-1 | 정상 흐름 | stage 1 → 보너스 없음 | `calcClearBonus(1)` | `0` | 🔴 Critical |
| A-3-2 | 정상 흐름 | stage 9 → 보너스 없음 (경계 직전) | `calcClearBonus(9)` | `0` | 🔴 Critical |
| A-3-3 | 정상 흐름 | stage 10 → 보너스 2 (경계 시작) | `calcClearBonus(10)` | `2` | 🔴 Critical |
| A-3-4 | 정상 흐름 | stage 15 → 보너스 3 | `calcClearBonus(15)` | `3` | 🟡 High |
| A-3-5 | 정상 흐름 | stage 20 → 보너스 4 | `calcClearBonus(20)` | `4` | 🟡 High |
| A-3-6 | 엣지 케이스 | stage 0 → 보너스 없음 | `calcClearBonus(0)` | `0` | 🟠 Medium |
| A-3-7 | 엣지 케이스 | stage 14 → 보너스 2 (15 직전) | `calcClearBonus(14)` | `2` | 🟠 Medium |

---

#### A-4. `calcBaseStageScore(stage)`

배율 미적용 스테이지 점수. `stage + calcClearBonus(stage)`.

| # | 유형 | 케이스 설명 | 입력 | 기대값 | 우선순위 |
|---|---|---|---|---|---|
| A-4-1 | 정상 흐름 | stage 5 → 5+0 = 5 | `calcBaseStageScore(5)` | `5` | 🟡 High |
| A-4-2 | 정상 흐름 | stage 10 → 10+2 = 12 | `calcBaseStageScore(10)` | `12` | 🟡 High |
| A-4-3 | 정상 흐름 | stage 15 → 15+3 = 18 | `calcBaseStageScore(15)` | `18` | 🟡 High |
| A-4-4 | 엣지 케이스 | stage 1 → 1+0 = 1 (최소값) | `calcBaseStageScore(1)` | `1` | 🟠 Medium |

---

#### A-5. `calcStageScore(rawScore, comboStreak)`

스테이지 최종 점수. `rawScore × getComboMultiplier(comboStreak)`.

| # | 유형 | 케이스 설명 | 입력 | 기대값 | 우선순위 |
|---|---|---|---|---|---|
| A-5-1 | 정상 흐름 | 배율 x1 (streak=0): 5×1 = 5 | `calcStageScore(5, 0)` | `5` | 🔴 Critical |
| A-5-2 | 정상 흐름 | 배율 x2 (streak=5): 12×2 = 24 | `calcStageScore(12, 5)` | `24` | 🔴 Critical |
| A-5-3 | 정상 흐름 | 배율 x3 (streak=10): 18×3 = 54 | `calcStageScore(18, 10)` | `54` | 🟡 High |
| A-5-4 | 엣지 케이스 | rawScore=0이면 결과도 0 | `calcStageScore(0, 5)` | `0` | 🟠 Medium |

---

#### A-6. `getInputTimeout(stage)` ⚠️ v0.3 (v0.3.1: 타이머 바 UI 제거, 로직 유지)

버튼당 입력 제한 시간(ms). 경계: 1~9 → 2000ms / 10~19 → 1800ms / 20~29 → 1600ms / 30+ → 1400ms

| # | 유형 | 케이스 설명 | 입력 | 기대값 | 우선순위 |
|---|---|---|---|---|---|
| A-6-1 | 정상 흐름 | stage 1 → 2000ms | `getInputTimeout(1)` | `2000` | 🔴 Critical |
| A-6-2 | 정상 흐름 | stage 10 → 1800ms (경계 시작) | `getInputTimeout(10)` | `1800` | 🔴 Critical |
| A-6-3 | 정상 흐름 | stage 20 → 1600ms (경계 시작) | `getInputTimeout(20)` | `1600` | 🟡 High |
| A-6-4 | 정상 흐름 | stage 30 → 1400ms (하한 시작) | `getInputTimeout(30)` | `1400` | 🟡 High |
| A-6-5 | 엣지 케이스 | stage 9 → 2000ms (10 직전) | `getInputTimeout(9)` | `2000` | 🟡 High |
| A-6-6 | 엣지 케이스 | stage 19 → 1800ms (20 직전) | `getInputTimeout(19)` | `1800` | 🟡 High |
| A-6-7 | 엣지 케이스 | stage 29 → 1600ms (30 직전) | `getInputTimeout(29)` | `1600` | 🟡 High |
| A-6-8 | 엣지 케이스 | stage 0 → 2000ms (기본값) | `getInputTimeout(0)` | `2000` | 🟠 Medium |
| A-6-9 | 엣지 케이스 | stage 100 → 1400ms (하한 고정) | `getInputTimeout(100)` | `1400` | 🟠 Medium |

---

### B. `src/store/gameStore.ts` — Zustand 상태 전환 통합 테스트

> 파일 경로: `src/store/gameStore.test.ts`  
> 각 테스트 전 `useGameStore.setState(초기 상태)`로 스토어를 리셋한다.  
> Zustand는 싱글턴이므로 테스트 간 상태 격리가 필요하다.

**테스트 격리 패턴:**

```typescript
import { useGameStore } from '../store/gameStore'

beforeEach(() => {
  useGameStore.getState().resetGame()
})
```

---

#### B-1. `startGame()`

게임 시작 시 모든 상태가 초기화된다.

| # | 유형 | 케이스 설명 | 검증 포인트 | 우선순위 |
|---|---|---|---|---|
| B-1-1 | 정상 흐름 | startGame 후 status는 'SHOWING' | `state.status === 'SHOWING'` | 🔴 Critical |
| B-1-2 | 정상 흐름 | startGame 후 score는 0 | `state.score === 0` | 🔴 Critical |
| B-1-3 | 정상 흐름 | startGame 후 comboStreak는 0 | `state.comboStreak === 0` | 🔴 Critical |
| B-1-4 | 정상 흐름 | startGame 후 stage는 0 | `state.stage === 0` | 🟡 High |
| B-1-5 | 정상 흐름 | startGame 후 sequenceStartTime은 0 | `state.sequenceStartTime === 0` | 🟡 High |
| B-1-6 | 정상 흐름 | startGame 후 fullComboCount, maxComboStreak, baseScore 모두 0 | 각 필드 === 0 | 🟡 High |

---

#### B-2. `addInput(color)`

버튼 입력에 따른 반환값과 상태 변화.  
⚠️ v0.3.2-hotfix (#59): 배율 즉시 적용 — `score += getComboMultiplier(comboStreak)`

| # | 유형 | 케이스 설명 | 선행 조건 | 기대 결과 | 우선순위 |
|---|---|---|---|---|---|
| B-2-1 | 정상 흐름 | 정답 버튼 입력 (비마지막) → 'correct' 반환 | sequence=['orange','blue'], currentIndex=0 | 반환값 `'correct'` | 🔴 Critical |
| B-2-2 | 정상 흐름 | streak=0 (x1) 정답 입력 후 score +1 | sequence=['orange'], score=0, comboStreak=0, 'orange' 입력 | `state.score === 1` | 🔴 Critical |
| B-2-3 | 정상 흐름 | 정답 입력 후 currentIndex +1 | currentIndex=0 | `state.currentIndex === 1` | 🟡 High |
| B-2-4 | 정상 흐름 | 마지막 버튼 정답 → 'round-clear' 반환 | sequence=['orange'], currentIndex=0, 'orange' 입력 | 반환값 `'round-clear'` | 🔴 Critical |
| B-2-5 | 에러 처리 | 오답 버튼 입력 → 'wrong' 반환 | sequence=['orange'], 'blue' 입력 | 반환값 `'wrong'` | 🔴 Critical |
| B-2-6 | 에러 처리 | 오답 입력 시 score 변화 없음 | score=5, 오답 입력 | `state.score === 5` (변화 없음) | 🟡 High |
| B-2-7 | 정상 흐름 | streak=5 (x2) 정답 입력 후 score +2 | score=0, comboStreak=5, 'orange' 입력 정답 | `state.score === 2` | 🔴 Critical |
| B-2-8 | 정상 흐름 | streak=10 (x3) 정답 입력 후 score +3 | score=0, comboStreak=10, 'orange' 입력 정답 | `state.score === 3` | 🔴 Critical |

---

#### B-3. `stageClear(inputCompleteTime, flashDuration)` — 풀콤보 판정

`isFullCombo = userInputTime < computerShowTime` 로직 검증.  
`userInputTime = inputCompleteTime - sequenceStartTime`  
`computerShowTime = flashDuration * sequence.length`

| # | 유형 | 케이스 설명 | 선행 조건 | 기대 결과 | 우선순위 |
|---|---|---|---|---|---|
| B-3-1 | 정상 흐름 | userInputTime < computerShowTime → isFullCombo true | sequenceStartTime=1000, sequence.length=3, flashDuration=500, inputCompleteTime=2400 (userInput=1400 < computerShow=1500) | `isFullCombo === true` | 🔴 Critical |
| B-3-2 | 정상 흐름 | userInputTime >= computerShowTime → isFullCombo false | sequenceStartTime=1000, sequence.length=3, flashDuration=500, inputCompleteTime=2600 (userInput=1600 >= computerShow=1500) | `isFullCombo === false` | 🔴 Critical |
| B-3-3 | 엣지 케이스 | userInputTime === computerShowTime → isFullCombo false (경계값, 등호 포함 안 됨) | userInputTime === computerShowTime 정확히 일치 | `isFullCombo === false` | 🔴 Critical |

---

#### B-4. `stageClear(inputCompleteTime, flashDuration)` — streak 누적

| # | 유형 | 케이스 설명 | 선행 조건 | 기대 결과 | 우선순위 |
|---|---|---|---|---|---|
| B-4-1 | 정상 흐름 | 풀콤보 달성 시 comboStreak +1 | comboStreak=0, isFullCombo=true 조건 | `state.comboStreak === 1` | 🔴 Critical |
| B-4-2 | 정상 흐름 | 풀콤보 미달성 시 comboStreak 0으로 리셋 | comboStreak=4, isFullCombo=false 조건 | `state.comboStreak === 0` | 🔴 Critical |
| B-4-3 | 정상 흐름 | 풀콤보 달성 시 fullComboCount +1 | fullComboCount=2, isFullCombo=true | `state.fullComboCount === 3` | 🟡 High |
| B-4-4 | 정상 흐름 | 풀콤보 미달성 시 fullComboCount 변화 없음 | fullComboCount=2, isFullCombo=false | `state.fullComboCount === 2` | 🟡 High |
| B-4-5 | 정상 흐름 | maxComboStreak 갱신 (신기록) | maxComboStreak=3, 클리어 후 newComboStreak=4 | `state.maxComboStreak === 4` | 🟡 High |
| B-4-6 | 정상 흐름 | maxComboStreak 비갱신 (신기록 아님) | maxComboStreak=5, 클리어 후 newComboStreak=3 | `state.maxComboStreak === 5` (유지) | 🟠 Medium |
| B-4-7 | 엣지 케이스 | comboStreak 상한 없음 확인 (streak=4에서 풀콤보) | comboStreak=4, 풀콤보 달성 | `state.comboStreak === 5` (cap 없음) | 🔴 Critical |

---

#### B-5. `stageClear(inputCompleteTime, flashDuration)` — 배율 적용 점수

⚠️ v0.3.2-hotfix (#59): 핵심 로직 변경 — 버튼 점수는 addInput에서 배율 포함 누적됨.  
`stageClear`는 `clearBonus × getComboMultiplier(prevComboStreak)`만 추가.  
`isFullCombo`는 스트릭 판정에만 사용, 점수와 무관.

**핵심 로직** (변경 후):
- `bonusScore = calcClearBonus(clearedStage) × getComboMultiplier(prevComboStreak)` (클리어 보너스)
- 버튼 점수는 이미 `score`에 배율 포함 누적됨 (addInput에서 처리)
- 풀콤보/미달성 여부와 관계없이 `score += bonusScore`

| # | 유형 | 케이스 설명 | 선행 조건 | 기대 결과 | 우선순위 |
|---|---|---|---|---|---|
| B-5-1 | 정상 흐름 | stage=3 (보너스 없음) — 풀콤보X, 점수 변화 없음 | score=3 (addInput x1 배율 3회), sequence.length=3 (stage<10), 풀콤보X | `state.score === 3` (clearBonus=0) | 🔴 Critical |
| B-5-2 | 정상 흐름 | stage=3 (보너스 없음) — 풀콤보O, 점수 변화 없음 | score=3, sequence.length=3 (stage<10), prevComboStreak=0, 풀콤보O | `state.score === 3` (clearBonus=0) | 🔴 Critical |
| B-5-3 | 정상 흐름 | stage=10 보너스 streak=0 (x1) — 풀콤보O | score=10 (addInput x1×10), sequence.length=10, prevComboStreak=0, 풀콤보O | `state.score === 10 + 2×1 = 12` (clearBonus=2, x1) | 🔴 Critical |
| B-5-4 | 정상 흐름 | stage=10 보너스 streak=5 (x2) — 풀콤보O | score=20 (addInput x2×10), sequence.length=10, prevComboStreak=5, 풀콤보O | `state.score === 20 + 2×2 = 24` (clearBonus=2, x2) | 🔴 Critical |
| B-5-5 | 정상 흐름 | stage=10 보너스 streak=5 (x2) — 풀콤보X, 보너스 여전히 적용 | score=20, sequence.length=10, prevComboStreak=5, 풀콤보X | `state.score === 20 + 2×2 = 24` (isFullCombo가 점수에 무관) | 🔴 Critical |
| B-5-6 | 정상 흐름 | multiplierIncreased true — streak 4→5 전환 시 | prevComboStreak=4, 풀콤보O → newComboStreak=5 | `multiplierIncreased === true` | 🔴 Critical |
| B-5-7 | 정상 흐름 | multiplierIncreased false — streak 배율 상승 없을 때 | prevComboStreak=1, 풀콤보O → newComboStreak=2 (x1 유지) | `multiplierIncreased === false` | 🟡 High |
| B-5-8 | 엣지 케이스 | multiplierIncreased false — 풀콤보 미달성 시 | prevComboStreak=4, 풀콤보X → newComboStreak=0 | `multiplierIncreased === false` | 🟡 High |

---

#### B-6. `gameOver(reason)` ⚠️ Epic 10 변경 — reason 파라미터 추가

> 커버 대상 함수: `gameOver(reason: 'timeout' | 'wrong')` — `gameOverReason` 필드 저장 포함

| # | 유형 | 케이스 설명 | 검증 포인트 | 우선순위 |
|---|---|---|---|---|
| B-6-1 | 정상 흐름 | gameOver 후 status는 'RESULT' | `state.status === 'RESULT'` | 🔴 Critical |
| B-6-2 | 정상 흐름 | gameOver 후 stage는 sequence.length와 같음 | sequence.length=5일 때 `state.stage === 5` | 🟡 High |
| B-6-3 | 정상 흐름 | gameOver 후 score, comboStreak 변화 없음 | score/comboStreak는 gameOver 전 값 유지 | 🟠 Medium |
| B-6-4 | 정상 흐름 | `gameOver('timeout')` 후 gameOverReason === 'timeout' | `state.gameOverReason === 'timeout'` | 🔴 Critical |
| B-6-5 | 정상 흐름 | `gameOver('wrong')` 후 gameOverReason === 'wrong' | `state.gameOverReason === 'wrong'` | 🔴 Critical |
| B-6-6 | 정상 흐름 | `resetGame()` 후 gameOverReason === null | `state.gameOverReason === null` | 🔴 Critical |
| B-6-7 | 정상 흐름 | `startGame()` 후 gameOverReason === null | 게임 재시작 시 잔류 reason 없음 | 🔴 Critical |

---

### C. `src/hooks/useGameEngine.ts` — 게임 엔진 흐름 테스트

> 파일 경로: `src/hooks/useGameEngine.test.ts`  
> `@testing-library/react`의 `renderHook` + `act` 사용.  
> 타이머 의존(`setTimeout`)은 `vi.useFakeTimers()` / `vi.runAllTimers()`로 처리.  
> 사운드 함수(`playTone`, `playGameOver`, `playApplause`)는 `vi.mock`으로 mock 처리.

**Mock 설정 패턴:**

```typescript
vi.mock('../lib/sound', () => ({
  playTone: vi.fn(),
  playGameStart: vi.fn(),
  playGameOver: vi.fn(),
  playApplause: vi.fn(),
}))

beforeEach(() => {
  vi.useFakeTimers()
  useGameStore.getState().resetGame()
})

afterEach(() => {
  vi.useRealTimers()
})
```

---

#### C-1. 상태 전환: IDLE → SHOWING → INPUT

| # | 유형 | 케이스 설명 | 조작 | 기대 결과 | 우선순위 |
|---|---|---|---|---|---|
| C-1-1 | 정상 흐름 | startGame 호출 → 카운트다운 후 status SHOWING | `startGame()` + `vi.runAllTimers()` | `useGameStore.getState().status === 'SHOWING'` | 🔴 Critical |
| C-1-2 | 정상 흐름 | SHOWING 상태에서 시퀀스 점등 완료 → status INPUT 전환 | SHOWING 진입 후 타이머 진행 | `useGameStore.getState().status === 'INPUT'` | 🔴 Critical |
| C-1-3 | 정상 흐름 | INPUT 전환 시 sequenceStartTime이 0이 아닌 값으로 설정됨 | SHOWING → INPUT 전환 후 | `useGameStore.getState().sequenceStartTime > 0` | 🔴 Critical |

---

#### C-2. 상태 전환: INPUT → ROUND-CLEAR → SHOWING

| # | 유형 | 케이스 설명 | 조작 | 기대 결과 | 우선순위 |
|---|---|---|---|---|---|
| C-2-1 | 정상 흐름 | 정답 입력 완료 → clearingStage 설정됨 | sequence=['orange'], INPUT 상태에서 'orange' handleInput | `clearingStage !== null` (clearingStage = 1) | 🔴 Critical |
| C-2-2 | 정상 흐름 | clearingStage 타임아웃 후 다음 SHOWING으로 전환 | `vi.runAllTimers()` | `useGameStore.getState().status === 'SHOWING'` | 🔴 Critical |
| C-2-3 | 정상 흐름 | 다음 시퀀스 길이 = 이전 + 1 (sequence.length 불변식) | stage=1 클리어 후 | `useGameStore.getState().sequence.length === 2` | 🔴 Critical |
| C-2-4 | 정상 흐름 | 클리어 후 clearingStage 초기화 (null로 리셋) | 타임아웃 후 | `clearingStage === null` | 🟡 High |

---

#### C-3. 상태 전환: INPUT → RESULT (오답)

| # | 유형 | 케이스 설명 | 조작 | 기대 결과 | 우선순위 |
|---|---|---|---|---|---|
| C-3-1 | 정상 흐름 | 오답 입력 → status RESULT | sequence=['orange'], INPUT 상태에서 'blue' handleInput | `useGameStore.getState().status === 'RESULT'` | 🔴 Critical |
| C-3-2 | 정상 흐름 | 오답 입력 시 clearingStage는 변화 없음 | 오답 후 | `clearingStage === null` (게임오버 시 클리어 아님) | 🟡 High |

---

#### C-4. `sequence.length === stage` 불변식

INPUT 상태에서 `sequence.length`와 store의 `stage`는 항상 같아야 한다.

| # | 유형 | 케이스 설명 | 조작 | 기대 결과 | 우선순위 |
|---|---|---|---|---|---|
| C-4-1 | 정상 흐름 | 게임 시작 직후 stage=1, sequence.length=1 | startGame 후 첫 SHOWING 진입 | `stage === sequence.length === 1` | 🔴 Critical |
| C-4-2 | 정상 흐름 | 2스테이지 진입 시 stage=2, sequence.length=2 | 1스테이지 클리어 후 | `stage === sequence.length === 2` | 🔴 Critical |
| C-4-3 | 에러 처리 | INPUT 상태가 아닐 때 handleInput 무시 | status='SHOWING'에서 handleInput 호출 | 상태 변화 없음 (BLOCKED) | 🟡 High |
| C-4-4 | 에러 처리 | clearingRef.current=true 시 handleInput 무시 | 클리어 처리 중 handleInput 호출 | 상태 변화 없음 (BLOCKED) | 🟡 High |

---

#### D. `src/hooks/useGameEngine.ts` — 타이머 통합 TC ⚠️ v0.3 복구 (Epic 09 SPEC_GAP)

> `useTimer`는 `vi.mock`으로 교체. `reset`/`stop`을 `vi.fn()` spy로 검증.  
> 타이머 만료 콜백은 `globalThis.__testTimerExpire`로 테스트에서 직접 트리거.

| # | 유형 | 케이스 설명 | 조작 | 기대 결과 | 우선순위 |
|---|---|---|---|---|---|
| D-1 | 정상 흐름 | INPUT 진입 시 timer.reset 1회 호출 | SHOWING → INPUT 전환 | `mockTimerReset.toHaveBeenCalledTimes(1)` | 🔴 Critical |
| D-2 | 정상 흐름 | 타이머 만료 시 status RESULT | `__testTimerExpire()` 호출 | `status === 'RESULT'` | 🔴 Critical |
| D-3 | 정상 흐름 | 오답 입력 시 timer.stop 호출 | 오답 handleInput | `mockTimerStop.toHaveBeenCalled()` | 🔴 Critical |
| D-4 | 정상 흐름 | round-clear 시 timer.stop 호출 | 마지막 정답 handleInput | `mockTimerStop.toHaveBeenCalled()` | 🟡 High |
| D-5 | 정상 흐름 | 정답(correct) 입력 시 timer.reset 호출 | 중간 정답 handleInput | `mockTimerReset.toHaveBeenCalled()` | 🔴 Critical |

---


### E. `src/__tests__/StageArea.countdown.test.tsx` — 카운트다운 힌트 fake timer 테스트

> 파일 경로: `src/__tests__/StageArea.countdown.test.tsx` (신규)
> vitest fake timers + @testing-library/react
>
> **커버 대상**: `StageArea` 컴포넌트 — hintPhase 타이머 로직 (#61), countdown key 교체 (#64)

---

| # | 유형 | 케이스 설명 | 조작 | 기대 결과 | 우선순위 |
|---|---|---|---|---|---|
| E-1 | 정상 흐름 | countdown=3 시작 직후 첫 번째 힌트만 단독 표시 | `render(<StageArea countdown={3} .../>)` | `"깜빡이는 순서 그대로 눌러요"` 존재, `"더 빠르면 콤보가 누적됩니다"` null | 🔴 Critical |
| E-2 | 경계 | 749ms 시점에서도 첫 번째 힌트 유지 | `vi.advanceTimersByTime(749)` | `"깜빡이는 순서 그대로 눌러요"` 존재, 두 번째 힌트 null | 🟡 High |
| E-3 | 정상 흐름 | 750ms 경과 후 두 번째 힌트로 전환, 첫 번째 없음 | `vi.advanceTimersByTime(750)` | `"더 빠르면 콤보가 누적됩니다"` 존재, `"깜빡이는 순서 그대로 눌러요"` null | 🔴 Critical |
| E-4 | isActive 패턴 | countdown 3→2 rerender 시 hintPhase 리셋 없음 | 750ms 후 `rerender(<StageArea countdown={2} .../>)` | `"더 빠르면 콤보가 누적됩니다"` 유지 (effect 재실행 없음) | 🔴 Critical |
| E-5 | 엣지 케이스 | countdown=null 시 힌트 블록 미표시 | `render(<StageArea countdown={null} .../>)` | 두 힌트 텍스트 모두 null | 🔴 Critical |

---

## 3. 테스트 제외 항목 및 이유

| 모듈 | 제외 이유 |
|---|---|
| `src/lib/supabase.ts` / Supabase 호출 | 외부 DB 의존. 실 네트워크 호출 불가. E2E 또는 별도 통합 테스트 환경 필요. |
| `@apps-in-toss/web-framework` SDK (유저ID, 광고) | 앱인토스 샌드박스 환경 필요. 단위 테스트 환경에서 실행 불가. |
| `src/components/game/ComboTimer.tsx` | `setInterval` + `Date.now()` 기반 UI 컴포넌트. 타이머 동작은 수동 검증. |
| `src/components/game/MultiplierBurst.tsx` | CSS 애니메이션 기반 오버레이. `phase` 전환 로직은 수동 검증. |
| `src/components/game/ButtonPad.tsx` 외 순수 UI 컴포넌트 | 스냅샷 테스트는 유지보수 비용 대비 효과 낮음. 수동 검증. |
| `src/hooks/useCombo.ts` (v0.3.1 이후) | v0.3.1에서 내부 로직 제거됨. 빈 hook이므로 테스트 대상 없음. |

---

## 4. 우선순위 테이블

전체 테스트 케이스 우선순위 요약.

| 우선순위 | 기준 | 해당 케이스 수 |
|---|---|---|
| 🔴 Critical | 게임 핵심 로직 정합성 (풀콤보 판정, 점수 계산, 상태 전환, 타이머) | 28개 |
| 🟡 High | 경계값 및 파생 상태 검증 (fullComboCount, maxComboStreak 등) | 25개 |
| 🟠 Medium | 방어 코드 및 극단값 (stage=0, 매우 큰 streak 등) | 11개 |

### Critical 케이스 목록 (우선 구현 필수)

| 케이스 ID | 모듈 | 설명 |
|---|---|---|
| A-1-1 ~ A-1-3 | gameLogic | getFlashDuration 경계 전환 |
| A-2-1 ~ A-2-3 | gameLogic | getComboMultiplier 0→1, 4→1, 5→2 |
| A-5-1 ~ A-5-2 | gameLogic | calcStageScore 배율 적용 |
| B-1-1 ~ B-1-3 | gameStore | startGame 초기화 |
| B-2-1, B-2-4, B-2-5 | gameStore | addInput correct/round-clear/wrong |
| B-3-1 ~ B-3-3 | gameStore | stageClear 풀콤보 판정 (경계값 포함) |
| B-4-1 ~ B-4-2, B-4-7 | gameStore | streak 누적/리셋/상한 없음 |
| B-5-1 ~ B-5-4, B-5-6 | gameStore | 배율 적용 점수, multiplierIncreased |
| B-6-1 | gameStore | gameOver 상태 전환 |
| C-1-1 ~ C-1-3 | useGameEngine | startGame → INPUT 전환 흐름 |
| C-2-1 ~ C-2-3 | useGameEngine | 클리어 → 다음 시퀀스 |
| C-3-1 | useGameEngine | 오답 → RESULT |
| C-4-1 ~ C-4-2 | useGameEngine | sequence.length === stage 불변식 |

---

## 5. 수동 검증 항목 (테스트 코드 미작성)

자동화 테스트로 커버하지 않는 UI/타이밍 동작은 실제 게임 플레이로 검증한다.

| 항목 | 검증 방법 |
|---|---|
| ComboTimer: INPUT 진입 시 0.00부터 시작 | 게임 플레이 → INPUT 전환 시 타이머 시작 확인 |
| ComboTimer: computerShowTime 이내 → 초록, 초과 → 빨강 | 느린 입력으로 빨강 전환 확인 |
| ComboTimer: computerShowTime 초과 후 숫자 고정 (버그 #44) | 느린 입력으로 목표값 초과 후 타이머가 목표값에서 멈추는지 확인 |
| MultiplierBurst: 5번째 풀콤보 시 x2(노랑) 표시 | 5연속 풀콤보 달성 시 오버레이 확인 |
| MultiplierBurst: pointerEvents:none (버튼 입력 차단 안 됨) | 애니메이션 중 버튼 클릭 가능 여부 |
| MultiplierBurst: 600ms 후 자동 소멸 | 애니메이션 완료 후 사라짐 확인 |
| 마일스톤(5, 10, 15...) + 풀콤보 + 배율 상승 동시 발생 | 세 효과 동시 트리거 시 레이아웃 이상 없음 |
| 게임오버 후 retry → 점수/comboStreak 완전 초기화 | retry 후 HUD 값이 0으로 리셋됨 확인 |
| GameOverOverlay: 오버레이가 게임 컨테이너 내에만 표시됨 (레이아웃 이탈 없음) | 타이머 만료·오답 입력 시 오버레이가 게임 영역 내 표시, 상단 타이틀/HUD 바 미차단 확인 (Epic 10 버그 #48) |
| GameOverOverlay: 패널 상단에 핸들바·경고 아이콘(⚠)·"GAME OVER" 라벨 표시 | 오버레이 등장 시 세 요소가 순서대로 상단에 표시되는지 시각 확인 (Epic 10 버그 #48) |
| GameOverOverlay: 타이틀·HUD 영역에 블러 미적용 | 오버레이 등장 시 "MEMORY BATTLE" 타이틀과 SCORE/STG/DAILY HUD가 블러 없이 선명하게 표시되는지 확인 (Epic 10 이슈 #49) |
| GameOverOverlay: DAILY 버튼 z-index 상승 후 탭 이벤트 정상 처리 | 오버레이 표시 중 DAILY 버튼 탭 시 랭킹 페이지로 정상 전환되는지 확인 (Epic 10 이슈 #49) |
| GameOverOverlay: 오답 입력 직후 탭-쓰루 없음 | 색깔 버튼 오답 탭 → 오버레이 등장 후 즉시 ResultPage 이동하지 않고 오버레이 유지 확인 (Epic 10 이슈 #50) |
| GameOverOverlay: 오버레이 탭 → ResultPage 정상 전환 | 오버레이 등장 후 의도적 탭 시 ResultPage로 정상 전환 확인 (Epic 10 이슈 #50) |
| GameOverOverlay: 타임아웃 후 탭 → ResultPage 정상 전환 (회귀 없음) | 타임아웃 오버레이 탭 → ResultPage 전환 플로우 이상 없음 확인 (Epic 10 이슈 #50) |
| Page Visibility: 화면 OFF 후 복귀 시 소리 중단 (이슈 #51) | 게임 진행 중 화면 OFF → 소리 즉시 중단, 복귀 후 다음 버튼 입력 시 정상 재생 확인 |
| 카운트다운 힌트: countdown 시작 직후(0~749ms) "깜빡이는 순서 그대로 눌러요" 단독 표시 (#62) | 게임 시작 → 카운트다운 진입 직후 첫 번째 문구만 표시, 두 번째 줄 없음 확인 |
| 카운트다운 힌트: 750ms 경과 후 "더 빠르면 콤보가 누적됩니다"로 전환 (#62) | 카운트다운 진입 750ms 이후 두 번째 문구로 전환되는지 확인 (countdown 값 무관) |
| 카운트다운 힌트 문구: 750ms 전환 시에만 flipIn 재실행, tick(3→2→1) 변경 시 깜빡임 없음 (이슈 #61) | 카운트다운 중 힌트 블록이 3→2, 2→1 tick에 반응해 깜빡이지 않는지 확인 |
| 카운트다운 힌트 문구: SHOWING 진입 시 사라짐 (이슈 #52) | 카운트다운 종료 → SHOWING 페이즈에서 힌트 문구 미표시 확인 |
| 카운트다운 총 시간: 2250ms (750ms × 3) (#64) | 게임 시작 버튼 탭 후 카운트다운 총 소요 시간이 약 2250ms인지 측정 (이전: 1500ms) |
| 카운트 숫자 교체 애니메이션: 3→2, 2→1 전환 시 재실행 (#64) | 숫자 변경 시 flipIn/countdownPop 등 교체 애니메이션이 매 tick 재실행되는지 시각 확인 |
| FULL COMBO! 제거: clearingStage 시 체크마크 표시 (이슈 #53) | 스테이지 클리어 시 "FULL COMBO!" 텍스트 없음, 체크마크 SVG 드로우 애니메이션 + "CLEAR" 텍스트 확인 |
| FULL COMBO! 제거: milestone 클리어 시 환호성 사운드 유지 (이슈 #53) | 5스테이지 클리어 시 환호성 재생, 비-milestone 클리어 시 무음 확인 |
| ComboIndicator 블록 UI: 5칸 높이 차등 블록 표시 (이슈 #54) | comboStreak=1~4 시 1~4칸 filled 블록, 나머지 empty, `x1` 배율 표시 확인 |
| ComboIndicator 블록 UI: 배율 상승 직후 빈 블록 상태 (이슈 #54) | comboStreak=5 시 블록 0칸 filled, `x2` 배율 표시 확인 |
| ComboIndicator 블록 UI: 마지막 채워진 블록에 blockPop 애니메이션 (이슈 #54) | 블록이 새로 채워질 때 해당 블록 scaleY 팝 애니메이션 확인 |
| ComboIndicator 블록 UI: comboStreak=0 시 미표시 (이슈 #54) | 게임 시작 직후 또는 콤보 리셋 직후 ComboIndicator 미렌더링 확인 |
| Page Visibility: 화면 OFF 중 타이머 만료로 인한 강제 게임오버 없음 (이슈 #51) | 화면 OFF 5초 이상 유지 → 복귀 시 게임 유지, 게임오버 미발생 확인 |
| Page Visibility: ComboTimer 복귀 시 elapsed 정상 표시 (이슈 #51) | 화면 OFF → ComboTimer 정지, 복귀 시 Date.now() 기준 경과 시간 재계산 표시 확인 |
| Page Visibility: ComboTimer 목표 초과 후 복귀 시 clamped 표시 (이슈 #51) | 화면 OFF 동안 computerShowTime 초과 → 복귀 시 목표값으로 고정 표시, interval 재시작 없음 확인 |
| HUD STG 셀: 첫 게임 카운트다운(3-2-1) 중 -- 표시 (이슈 66) | 게임 시작 탭 후 카운트다운 3, 2, 1 동안 STG 셀에 00 대신 -- 표시됨 확인 |
| HUD STG 셀: 리트라이 카운트다운 중 이전 stage 값 미표시 (이슈 66) | 3스테이지 후 게임오버 -> 리트라이 탭 -> 카운트다운 중 STG 셀에 이전 값 없이 -- 표시됨 확인 |
| HUD STG 셀: 카운트다운 종료 후 실제 stage 표시 (이슈 66) | 카운트다운 완료 후 SHOWING 진입 시 STG 셀에 01 표시됨 확인 |
