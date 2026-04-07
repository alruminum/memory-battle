# Epic 10: 게임오버 오버레이 (이슈 #45)

> 게임오버 시 즉시 결과 화면으로 전환되는 문제 개선.
> 흔들림 애니메이션 + 이유 텍스트 오버레이(Variant C: backdrop blur + 바텀 패널 슬라이드업) 표시 후 유저 탭으로 결과 화면 전환.
> 번호 체계: 에픽 내 독립 순번 (1부터 시작).

---

## Story 1: 게임오버 오버레이 구현

> impl: `impl/01-gameover-overlay.md`
> 관련 이슈: [#45](https://github.com/alruminum/memory-battle/issues/45)

게임오버 시 즉시 결과 화면으로 전환하지 않고, backdrop blur 오버레이 + 이유 패널이 슬라이드업으로 등장한다.
유저가 화면을 탭하면 결과 화면으로 전환된다(자동 전환 X).
게임 화면 전체에 shake 애니메이션이 적용되어 게임오버 충격감을 전달한다.

- [x] `gameStore.ts` — `gameOverReason: 'timeout' | 'wrong' | null` 필드 추가, `gameOver(reason)` 파라미터화
- [x] `useGameEngine.ts` — `gameOver('timeout')` / `gameOver('wrong')` 호출, `gameOverReason` 반환
- [x] `src/components/game/GameOverOverlay.tsx` — 신규 컴포넌트 (Variant C 디자인, 탭 핸들러)
- [x] `src/index.css` — `@keyframes shake` 추가
- [x] `GamePage.tsx` — RESULT 자동전환 useEffect 제거, shake CSS 적용, GameOverOverlay 렌더링

---

## Story 2: 게임오버 오버레이 버그픽스 (레이아웃 이탈 + 디자인 프리뷰 불일치)

> impl: `impl/02-overlay-bugfix.md`
> 관련 이슈: [#48](https://github.com/alruminum/memory-battle/issues/48)

Epic 10 구현 후 발견된 버그 2건을 수정한다.

- [x] `src/components/game/GameOverOverlay.tsx` — `position: 'fixed'` → `position: 'absolute'` 변경, 패널 상단에 핸들바·경고 아이콘·"GAME OVER" 타이틀 추가
- [x] `src/pages/GamePage.tsx` — 루트 div style에 `position: 'relative'` 추가

---

## Story 3: 게임오버 오버레이 블러 — 타이틀·HUD 제외

> impl: `impl/03-hud-blur-exclusion.md`
> 관련 이슈: [#49](https://github.com/alruminum/memory-battle/issues/49)

게임오버 오버레이의 backdrop-filter blur가 타이틀·HUD 영역까지 적용되는 문제를 수정한다.
타이틀 div와 HUD strip div를 z-index 201로 올려 오버레이(z-index 200) 위에 렌더링한다.

- [x] `src/pages/GamePage.tsx` — 타이틀 div style에 `position: 'relative', zIndex: 201` 추가
- [x] `src/pages/GamePage.tsx` — HUD strip div style에 `position: 'relative', zIndex: 201` 추가
