# Epic 11: GamePage UI 개선 3건

> 카운트다운 힌트 문구 표시, FULL COMBO! 텍스트·사운드 제거, ComboIndicator 블록 UI 개편.
> 번호 체계: 에픽 내 독립 순번 (1부터 시작).

---

## Story 1: 카운트다운 중 게임 방법 안내 문구 표시 (#56)

> impl: `impl/01-countdown-hint.md`
> 관련 이슈: [#52](https://github.com/alruminum/memory-battle/issues/52) · Story: [#56](https://github.com/alruminum/memory-battle/issues/56)

카운트다운(3→2→1) 중 숫자 아래에 수평 구분선과 힌트 문구 2줄을 표시한다.
문구는 카운트다운 내내 고정, SHOWING 페이즈 진입 시 함께 사라진다.

- [x] `src/pages/GamePage.tsx` — `StageArea` 컴포넌트의 카운트다운 분기에 구분선 + 힌트 문구 블록 추가
- [x] `src/index.css` — `@keyframes flipIn` 애니메이션 추가

---

## Story 2: FULL COMBO! 텍스트 및 사운드 제거 (#57)

> impl: `impl/02-fullcombo-removal.md`
> 관련 이슈: [#53](https://github.com/alruminum/memory-battle/issues/53) · Story: [#57](https://github.com/alruminum/memory-battle/issues/57)

clearingStage 시 "FULL COMBO!" 텍스트를 제거하고 체크마크 SVG 드로우 애니메이션으로 교체한다.
관련 fullCombo 사운드 함수가 있으면 제거한다.

- [x] `src/pages/GamePage.tsx` — `StageArea`의 `isClearingFullCombo` 조건부 제거, 체크마크 SVG 추가
- [x] `src/hooks/useGameEngine.ts` — `isClearingFullCombo` 상태 및 관련 로직 제거 (사용 안 함)
- [x] `src/index.css` — `@keyframes checkDraw` 애니메이션 추가

---

## Story 3: 콤보 스택 블록 UI로 개편 (#58)

> impl: `impl/03-combo-indicator-v2.md`
> 관련 이슈: [#54](https://github.com/alruminum/memory-battle/issues/54) · Story: [#58](https://github.com/alruminum/memory-battle/issues/58)

`ComboIndicator`를 5칸 높이 차등 블록 + `x{배율}` 숫자 표시 UI로 전면 개편한다.
블록 채워질 때 blockPop 애니메이션 적용. comboStreak === 0 시 null 반환 유지.

- [x] `src/components/game/ComboIndicator.tsx` — 5칸 블록 UI + blockPop 애니메이션으로 전면 재작성
- [x] `src/index.css` — `@keyframes blockPop` 추가

---

## Story 5: 카운트다운 종료 후 countdown UI 잔존 버그픽스 (#75)

> impl: `impl/07-countdown-persist-fix.md`
> 관련 이슈: [#75](https://github.com/alruminum/memory-battle/issues/75)

카운트다운(3→2→1) 종료 후 SHOWING 진입 시 StageArea에 "1"이 잔존하는 버그를 수정한다.
`launchAfterCountdown`의 t=2250 콜백에서 `setCountdown(null)` (React useState)를
`flushSync`로 동기 flush하여 Zustand `startGame()` 이전에 countdown UI를 제거한다.

- [ ] `src/hooks/useGameEngine.ts` — `launchAfterCountdown` t=2250 콜백: `setCountdown(null)` → `flushSync(() => setCountdown(null))`, `flushSync` import from `react-dom`

---

## Story 6: HUD STG 셀 카운트다운 중 표시 버그픽스 (#76)

> impl: `impl/08-hud-stg-countdown-display-fix.md`
> 관련 이슈: [#76](https://github.com/alruminum/memory-battle/issues/76)

카운트다운(3→2→1) 진행 중 HUD STG 셀이 `--`를 표시하는 버그를 수정한다.
카운트다운 구간에서 `stage === 0`이므로 `'--'` 대신 `'00'`을 표시하도록
`countdown !== null ? '--' :` 삼항 분기를 제거하고 `String(stage).padStart(2, '0')` 단일 표현식으로 변경한다.

- [ ] `src/pages/GamePage.tsx` — L242: `{countdown !== null ? '--' : String(stage).padStart(2, '0')}` → `{String(stage).padStart(2, '0')}`

---

## Story 8: 카운트다운 힌트 문구 2줄 고정 표시 (#82)

> impl: `impl/12-countdown-hint-text.md`
> 관련 이슈: [#82](https://github.com/alruminum/memory-battle/issues/82)

카운트다운(3→2→1) 중 힌트 문구를 750ms 순차 전환 방식에서 2줄 고정 표시 방식으로 변경한다.
- 1줄: "깜빡이는 순서 그대로 누르세요"
- 2줄: "상대방보다 더 빨리 눌러 콤보를 쌓고 고득점을 노리세요"
- `hintPhase` useState + 750ms useEffect 타이머 로직 완전 제거

- [ ] `src/pages/GamePage.tsx` — `StageArea` 내 hintPhase state/useEffect 제거, 2줄 고정 렌더링으로 교체
- [ ] `src/__tests__/StageArea.countdown.test.tsx` — 인라인 레플리카 갱신 + `[#61/#64]` TC 블록 → `[#82]` 2줄 고정 TC 블록으로 교체

---

## Story 9: 카운트다운 힌트 텍스트 가독성 개선 (#83)

> impl: `impl/13-hint-text-visibility.md`
> 관련 이슈: [#83](https://github.com/alruminum/memory-battle/issues/83)

힌트 1줄 폰트 크기 확대, 2줄 폰트 크기 확대 및 색상 교체로 가독성을 개선한다.
- 1줄 fontSize: 13 → 15 (color 유지)
- 2줄 fontSize: 12 → 13, color: `var(--vb-text-dim)` → `var(--vb-text-mid)`

- [ ] `src/pages/GamePage.tsx` — StageArea 힌트 블록 L57–73: fontSize + color 변경

---

## Story 7: 모바일 탭 하이라이트 제거 (#81)

> impl: `impl/11-tap-highlight-fix.md`
> 관련 이슈: [#81](https://github.com/alruminum/memory-battle/issues/81)

모바일 브라우저(iOS Safari, Android Chrome)에서 버튼 탭 시 파란색 사각형 하이라이트가 노출되는 버그를 수정한다.
`src/index.css`에 `button` 전역 블록을 추가해 `-webkit-tap-highlight-color: transparent` 및 `outline: none`을 적용한다.

- [ ] `src/index.css` — `*` 전역 리셋 블록 직후에 `button { -webkit-tap-highlight-color: transparent; outline: none; }` 추가

---

## Story 11: ComboTimer 바 게이지 교체 + 콤보 깨짐 배율 유지 (#90)

> impl: `impl/16-combo-timer-gauge.md`
> 관련 이슈: [#90](https://github.com/alruminum/memory-battle/issues/90)

1. ComboTimer 텍스트 표시를 4px 얇은 슬림 바 게이지(Variant B)로 교체. 버튼 패드 위, ComboIndicator와 combo-wrapper 한 묶음.
2. 풀콤보 실패 시 `comboStreak`을 `floor(prev/5)*5`로 리셋 — 배율(xN)은 유지, 스택만 초기화.

- [ ] `src/components/game/ComboTimer.tsx` — Props `isBreaking` 추가, 텍스트 → 슬림 바 게이지로 전면 교체
- [ ] `src/pages/GamePage.tsx` — combo-wrapper 도입: ComboTimer(바) + ComboIndicator 한 묶음, 버튼 패드 위 배치
- [ ] `src/store/gameStore.ts` — `stageClear`: 실패 시 `newComboStreak = floor(prev/5)*5`
- [ ] `src/index.css` — `@keyframes slimFlash` + `@keyframes slimTrackFlash` + `.combo-timer-fill.collapse` / `.combo-timer-track.collapse` 추가
- [ ] `src/components/game/ComboTimer.test.tsx` — 새 Props + 게이지 기반 TC로 전면 교체
- [ ] `src/store/gameStore.test.ts` — B-4-8~B-4-10 TC 추가 (배율 유지 검증)

---

## Story 12: ComboTimer 3단계 색상 전환 + ComboIndicator 쉐이크 (#99)

> impl: `impl/18-combo-timer-color-shake.md`
> 디자인 확정: DESIGN_HANDOFF — Pencil Frame UJUe5

ComboTimer에 NORMAL/WARNING/DANGER 3단계 색상 전환을 추가하고, 콤보 타이머 만료(timeout) 시 ComboIndicator에 쉐이크 애니메이션을 적용한다.
- WARNING(ratio ≤ 0.5): amber → orange 전환 + orange glow
- DANGER(ratio ≤ 0.2): orange → red 전환 + dangerPulse 1s loop
- SHAKE: timeout 게임오버 시 ComboIndicator 래퍼 translateX 진폭 감쇠 쉐이크 0.56s

- [ ] `src/components/game/ComboTimer.tsx` — TimerPhase 3단계 색상 분기, CSS class 방식 전환
- [ ] `src/components/game/ComboIndicator.tsx` — `isBreaking` optional prop 추가, shake 로직
- [ ] `src/pages/GamePage.tsx` — ComboIndicator에 `isBreaking` 전달
- [ ] `src/index.css` — CSS 변수 2개(`--vb-combo-warn`, `--vb-combo-danger`), @keyframes 2개, class 5개 추가

---

## Story 10: FloatingScore 글로우 미렌더링 + duration 조정 (#84, #85)

> impl: `impl/14-floating-score-fix.md`
> 관련 이슈: [#84](https://github.com/alruminum/memory-battle/issues/84), [#85](https://github.com/alruminum/memory-battle/issues/85)

#84: `getLabelGlow()`에서 CSS 변수에 hex suffix를 문자열 연결하여 유효하지 않은 CSS가 생성되는 버그 수정.
#85: FloatingScore 이펙트 duration을 유저 요청에 따라 연장.

- [ ] `src/components/game/FloatingScore.tsx` — `BUTTON_COLORS` hex 직접값 교체, `getAnimation()` duration 800ms→1200ms / 400ms→600ms 수정
- [ ] `src/pages/GamePage.tsx` — `spawnFloatingScore` setTimeout 850ms → 1300ms
