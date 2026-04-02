# Epic 08: GamePage 품질 개선 & UI 리팩토링

> 기능 변경 없는 코드 품질·리팩토링 작업. 아키텍트 주도 에픽.
> 번호 체계: 에픽 내 독립 순번 (1부터 시작).

---

## Story 1: GamePage 품질 경고 수정

> impl: `docs/milestones/v03/epics/epic-08-gamepage-refactor/impl/01-quality-fix.md`

validator가 발견한 4건의 품질 경고를 수정한다.

- [x] `src/pages/GamePage.tsx` — `isInitializing` dead code 제거
- [x] `src/pages/GamePage.tsx` — `rankLabel` 모듈 스코프로 이동, `stageArea` → `StageArea` 로컬 컴포넌트로 분리
- [x] `src/pages/GamePage.tsx` — eslint-disable 주석에 의도 설명 추가
- [x] `src/hooks/useGameEngine.ts` — `timerProgress` 계산 후 반환 추가
- [x] `src/pages/GamePage.tsx` — 타이머 바 width `'65%'` → `timerProgress` 기반 실제 진행률로 교체
