# Epic 10: GameOver UX — 흔들림 애니메이션 + 이유 표시

> 이슈 #45 구현. 게임오버 시 즉시 결과 화면으로 전환되던 동작을 개선한다.
> Variant C 디자인 선택: backdrop blur + 바텀 패널 슬라이드업.
> 탭으로 결과 화면 전환 (자동 전환 X).
> 번호 체계: 에픽 내 독립 순번 (1부터 시작).

---

## Story 1: GameOver 오버레이 & 흔들림 애니메이션

> impl: `impl/01-gameover-overlay.md`

게임오버 발생 시 화면 전체가 shake 애니메이션(±6px, 0.5s)으로 반응하고,
backdrop blur 오버레이 + 바텀 패널이 슬라이드업으로 등장한다.
패널에는 게임오버 이유(타임오버 / 잘못된 입력)와 "화면을 탭하여 계속" 힌트를 표시한다.
탭 시 결과 화면(`onGameOver`)으로 전환한다.

- [ ] `gameStore.ts` — `gameOverReason: 'timeout' | 'wrong' | null` 필드 추가, `gameOver(reason)` 파라미터화
- [ ] `useGameEngine.ts` — `gameOver('timeout')` / `gameOver('wrong')` 분기 호출, `gameOverReason` 반환
- [ ] `GameOverOverlay.tsx` — 신규 컴포넌트 (Variant C 디자인, 탭 핸들러)
- [ ] `GamePage.tsx` — RESULT 자동전환 useEffect 제거, GameOverOverlay 렌더링 추가
- [ ] `index.css` — `@keyframes shake` 추가
