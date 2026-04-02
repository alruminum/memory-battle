# Epic 05: 게임 메카닉 개편 (PRD v0.3)

> PRD v0.3 변경사항 구현. 기존 Epic 01 완료 항목은 수정하지 않음.
> 변경 배경: 보상 구조가 랭킹 무관 방식으로 단순화됨에 따라 난이도 선택 제거,
> 스테이지 기반 자연 난이도 커브와 스택형 콤보로 게임 차별화 재설계.

---

## Story 14: 난이도 시스템 제거

> Epic 01 Story 1 (난이도 선택 구현) 대체
> impl: `docs/epics/epic-05-mechanic-v03/impl/14-difficulty-removal.md`

게임 시작 전 난이도 선택 화면을 제거한다. 난이도별 점수 배율 로직도 함께 제거한다.

- [x] `src/types/index.ts` — `Difficulty` 타입 삭제
- [x] `src/store/gameStore.ts` — difficulty 필드/DIFFICULTY_MULTIPLIER/calcFinalScore 제거, startGame 인자 제거, gameOver 인자 제거
- [x] `src/hooks/useGameEngine.ts` — startGame/retryGame/launchAfterCountdown difficulty 인자 제거
- [x] `src/hooks/useRanking.ts` — submitScore difficulty 인자 제거
- [x] `src/pages/MainPage.tsx` — 난이도 탭 UI 제거
- [x] `src/pages/GamePage.tsx` — 난이도 탭 UI 제거
- [x] `src/pages/ResultPage.tsx` — difficulty 참조 제거, submitScore 인자 수정

---

## Story 15: 스테이지 기반 속도/타이머

> Epic 01 고정 속도/타이머 대체
> impl: `docs/epics/epic-05-mechanic-v03/impl/15-stage-speed-timer.md`

깜빡임 속도와 입력 제한 타이머를 스테이지에 따라 자동으로 변화시킨다.
스테이지가 올라갈수록 속도는 빨라지고 타이머는 짧아진다. (PRD v0.3 섹션 2 기준값)

- [x] `src/lib/gameLogic.ts` (신규) — `getFlashDuration(stage)`, `getInputTimeout(stage)` 순수 함수 작성
- [x] `src/hooks/useGameEngine.ts` — FLASH_DURATION 상수 → getFlashDuration(stage) 교체, useTimer duration 동적 주입

---

## Story 16: 스택형 콤보 시스템

> Epic 01 고정 x2 콤보 대체
> impl: `docs/epics/epic-05-mechanic-v03/impl/16-combo-streak.md`

연속 풀콤보 스트릭이 쌓일수록 점수 배율이 증가하는 구조로 교체한다.
스트릭이 끊기면 배율이 초기화된다. (PRD v0.3 섹션 2 콤보 시스템 기준)

- [x] `src/lib/gameLogic.ts` — calcClearBonus, getComboMultiplier, calcStageScore 추가
- [x] `src/store/gameStore.ts` — comboStreak/fullComboCount/maxComboStreak 필드 추가, stageClear 액션 추가, addInput rawScore만 처리하도록 변경
- [x] `src/hooks/useGameEngine.ts` — round-clear 처리 시 stageClear 호출로 변경

---

## Story 17: 콤보 인게임 UI

> impl: `docs/epics/epic-05-mechanic-v03/impl/17-combo-ui.md`

유저가 콤보 상태를 실시간으로 인지할 수 있도록 시각/청각 피드백을 제공한다.

- [x] `src/hooks/useCombo.ts` — isActive state 추가, reset 시 setIsActive(false)
- [x] `src/components/game/ComboIndicator.tsx` (신규) — comboStreak 상시 표시 + isComboActive 텍스트
- [x] `src/components/game/ButtonPad.tsx` — comboActive prop 추가, 글로우 이펙트
- [x] `src/hooks/useGameEngine.ts` — isClearingFullCombo state 추가, isComboActive/isClearingFullCombo 반환
- [x] `src/pages/GamePage.tsx` — ComboIndicator 삽입, clearingStage 영역 FULL COMBO 분기 추가
- [ ] `MultiplierBurst.tsx` 신규 컴포넌트 — 배율 상승 시 xN 버스트 오버레이 (scale-up + 파티클, 배율별 색상)
- [ ] `useGameEngine.ts` — stageClear 결과에 multiplierIncreased 플래그 추가
- [ ] `GamePage.tsx` — clearingStage 시퀀스에 MultiplierBurst 삽입

---

## Story 18: 결과 화면 업데이트

> impl: `docs/epics/epic-05-mechanic-v03/impl/18-result-update.md`

게임 오버 결과 화면에 콤보 관련 플레이 요약을 추가한다.
유저가 이번 게임에서 얼마나 잘했는지 수치로 확인할 수 있어야 한다.

- [x] `src/lib/gameLogic.ts` — calcBaseStageScore 추가
- [x] `src/store/gameStore.ts` — baseScore 필드 추가, stageClear에서 baseScore 누적
- [x] `src/pages/ResultPage.tsx` — COMBO STATS 카드 추가 (fullComboCount, maxComboStreak, comboBonus), difficulty 참조 완전 제거

---


> impl 계획 파일: `docs/milestones/v03/epics/epic-05-mechanic-v03/impl/`
