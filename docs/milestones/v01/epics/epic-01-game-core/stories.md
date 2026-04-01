# Epic 01: 게임 코어

> 상태: 완료

## Story 1: 프로젝트 세팅

- [x] `ait init` 실행 — web-framework 선택, appName=`memory-battle`
- [x] 패키지 설치: `@supabase/supabase-js zustand tailwindcss`
- [x] `.env` 파일 생성
- [x] Tailwind CSS 설정
- [x] `granite.config.ts` — appName, displayName, primaryColor 세팅
- [x] `index.html` viewport 메타 추가

## Story 2: SDK 래퍼 · DB 클라이언트

- [x] `src/lib/supabase.ts` — Supabase 클라이언트 초기화
- [x] `src/lib/ait.ts` — `getUserId()`, `showRewardAd()`, `attachBannerAd()`
- [x] `src/types/index.ts` — 공통 타입 정의
- [x] 광고 mock 분기 처리 — `IS_SANDBOX` 환경 플래그

## Story 3: Zustand Store

- [x] `src/store/gameStore.ts` — 상태 인터페이스 + 액션 구현

## Story 4: 게임 로직 훅

- [x] `src/hooks/useGameEngine.ts` — 상태머신 전체 흐름
- [x] `src/hooks/useTimer.ts` — 2초 카운트다운
- [x] `src/hooks/useCombo.ts` — 0.3초 이내 연속 입력 감지

## Story 5: 게임 화면 컴포넌트

- [x] `src/components/game/ButtonPad.tsx`
- [x] `src/components/game/TimerGauge.tsx`
- [x] `src/components/game/ScoreDisplay.tsx`
- [x] `src/pages/GamePage.tsx`
