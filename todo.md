# 기억력배틀 — 구현 TODO

> 순서대로 진행. 체크된 항목 = 완료. 미체크 = 미완료.
> 설계 참고: `docs/architecture.md`, `docs/game-logic.md`, `docs/db-schema.md`, `docs/sdk.md`, `docs/ui-spec.md`

---

## Day 0 — 코딩 전 콘솔 설정 (선행 필수)

### 🔴 코딩 시작 전 완료 필수

- [ ] [앱인토스 콘솔](https://apps-in-toss.toss.im/) 가입
- [ ] 워크스페이스 생성
- [ ] **사업자 등록** — 광고 수익화 필수 조건. 홈택스 등록 후 콘솔에 사업자 정보 제출 (심사 1~2 영업일)
- [ ] **앱 등록** — `appName: memory-battle` 확정 후 콘솔 등록 (**등록 후 변경 불가**)
- [ ] **게임센터 리더보드 등록** — 앱 등록 후 콘솔에서 리더보드 생성 (1개만 지원)
  - 앱 로고: 600×600px PNG (투명 배경 불가, 다크모드 대응)
  - 앱 이름: 기억력배틀
  - 고객센터 연락처 (이메일/전화/채팅 URL)
- [ ] **게임 등급 분류** — 게임 앱 검수 필수 요건. 앱스토어 또는 구글플레이 기존 등급으로 대체 제출 가능

### 🟡 Day 2 광고 연동 전 완료

- [ ] 정산 정보 콘솔 등록 (광고 수익 정산용, 심사 2~3 영업일 소요 → 미리 제출)
- [ ] 콘솔에서 광고 그룹 ID 발급 (라이브용) — **개발 중에는 아래 테스트 ID 사용, 라이브 ID 사용 시 계정 제재**

| 광고 타입 | 개발용 테스트 ID |
|---|---|
| 리워드 광고 | `ait-ad-test-rewarded-id` |
| 전면 광고 | `ait-ad-test-interstitial-id` |
| 배너 (리스트형) | `ait-ad-test-banner-id` |
| 배너 (네이티브) | `ait-ad-test-native-image-id` |

---

## Day 1 — 프로젝트 세팅 + 게임 코어

### 1. 프로젝트 초기화
- [x] `ait init` 실행 — web-framework 선택, appName=`memory-battle`
- [x] 패키지 설치: `npm install @supabase/supabase-js zustand`
- [x] 패키지 설치: `npm install -D tailwindcss`
- [x] `.env` 파일 생성 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_NAME`)
- [x] Tailwind CSS 설정 (`tailwind.config.js`, `src/index.css`)
- [x] `granite.config.ts` 확인 — appName, displayName(`기억력배틀`), primaryColor(`#ff6900`) 세팅
- [x] `index.html` viewport 메타 추가: `maximum-scale=1, user-scalable=no` (검수 필수)

### 2. SDK 래퍼 · DB 클라이언트
- [x] `src/lib/supabase.ts` — Supabase 클라이언트 초기화
- [x] `src/lib/ait.ts` — `getUserId()`: `getUserKeyForGame()` + 구버전 폴백 `getDeviceId()`
- [x] `src/lib/ait.ts` — `showRewardAd()`: `loadFullScreenAd` → `showFullScreenAd` 2단계, `userEarnedReward`에서만 resolve(true)
- [x] `src/lib/ait.ts` — `attachBannerAd(element)`: `TossAds.initialize` + `attachBanner`, cleanup 함수 반환
- [x] `src/types/index.ts` — 공통 타입 정의 (`GameStatus`, `ButtonColor` 등)
- [x] 광고 mock 분기 처리 — `IS_SANDBOX` 환경 플래그 설정, 샌드박스에서 광고 API 대신 mock 함수 사용

### 3. Zustand Store
- [x] `src/store/gameStore.ts` — 상태 인터페이스 구현
  - `status: 'IDLE' | 'SHOWING' | 'INPUT' | 'RESULT'`
  - `sequence`, `currentIndex`, `score`, `stage`, `isFullCombo`
  - `userId`, `dailyChancesLeft`
  - `difficulty: 'EASY' | 'MEDIUM' | 'HARD'` — 게임 시작 시 저장, 게임 중 변경 불가
  - 액션: `startGame(difficulty)`, `addInput`, `gameOver`, `resetGame`, `useChance`

### 4. 게임 로직 훅
- [x] `src/hooks/useGameEngine.ts` — 상태머신 전체 흐름 관리
  - IDLE→SHOWING: 시퀀스에 랜덤 버튼 추가, 순서대로 버튼 점등
  - SHOWING→INPUT: 시퀀스 표시 완료 후 입력 모드 전환
  - INPUT: 정답/오답 판정, `addInput()` 호출
  - INPUT→RESULT: 오답 or 타임아웃 시 `gameOver()`
  - INPUT→SHOWING: 정답 완료 시 다음 라운드
  - 깜빡임 속도: `FLASH_DURATION[difficulty]` 상수 사용 (Easy 500ms / Medium 400ms / Hard 300ms)
  - 최종 점수: `gameOver()` 시 `rawScore × DIFFICULTY_MULTIPLIER[difficulty]` 적용
- [x] `src/hooks/useTimer.ts` — 2초 카운트다운, 만료 시 콜백 실행, 정답 입력 시 리셋
- [x] `src/hooks/useCombo.ts` — 0.3초(300ms) 이내 연속 입력 감지, 라운드 종료 시 풀콤보 여부 반환

### 5. 게임 화면 컴포넌트
- [x] `src/components/game/ButtonPad.tsx` — 4개 원형 버튼 (orange/blue/green/yellow)
  - 깜빡임: `isFlashing` prop으로 밝기 증가 애니메이션
  - SHOWING 중 터치 이벤트 차단
- [x] `src/components/game/TimerGauge.tsx` — 2초 프로그레스바, 남은 시간 비례 너비, 50% 이하 빨간색 전환
- [x] `src/components/game/ScoreDisplay.tsx` — 현재 점수, 스테이지, 콤보 표시 (`COMBO!` 10스테이지+)
- [x] `src/pages/GamePage.tsx` — ButtonPad + TimerGauge + ScoreDisplay 조합, 배너 광고 하단 고정 자리 확보

---

## Day 2 — 백엔드 연동 + 광고 + 결과 화면

### 6. Supabase DB 세팅
- [ ] Supabase 콘솔에서 `scores` 테이블 생성 (DDL: `docs/db-schema.md` 참고)
- [ ] `daily_chances` 테이블 생성
- [ ] 인덱스 생성: `idx_scores_played_at`, `idx_scores_user_id`
- [ ] Supabase Row Level Security (RLS) 정책 설정 — anon key로 INSERT/SELECT 허용

### 7. 랭킹 훅
- [x] `src/hooks/useRanking.ts`
  - 일간 / 월간 / 시즌 랭킹 조회 함수 (`docs/db-schema.md` 쿼리 기준)
  - 내 순위 계산 (user_id 기준 필터)
  - 게임 오버 시 점수 INSERT (Supabase)
- [x] 게임 오버 시 `submitGameCenterLeaderBoardScore({ score: String(score) })` 호출 (토스 리더보드 제출)
- [x] ResultPage에 "친구 랭킹 보기" 버튼 → `openGameCenterLeaderboard()` 연결

### 8. 일간 기회 제한 로직
- [x] `gameStore.ts`의 `startGame()` — dailyChancesLeft-- 제거 (useDailyChances 훅으로 분리)
- [x] `src/hooks/useDailyChances.ts` — init / consumeChance / addChance

### 9. 광고 컴포넌트
- [x] `src/components/ads/BannerAd.tsx`
- [x] `src/hooks/useRewardAd.ts` — `showRewardAd()` 래핑, 로딩 상태 관리
- [x] `GamePage.tsx`에 `<BannerAd />` 하단 삽입

### 10. 결과 화면
- [x] `src/pages/ResultPage.tsx`
  - 이번 점수 + 최고 기록 갱신 여부 표시
  - 랭킹 순위 표시 (일간 / 월간 / 시즌 각각)
  - 포인트 안내 문구: `"월간 N위 → M월 1일에 XXX원 지급 예정"`
  - 한 번 더 버튼 → 확인 모달 → `showRewardAd()` → `userEarnedReward` 시 게임 재시작
  - 기회 소진 시 버튼 비활성화 + 안내 문구

---

## Day 3 — 메인·랭킹 화면 + QA + 제출

### 11. 메인 화면
- [x] `src/components/game/DifficultySelector.tsx` — Easy / Medium / Hard 선택 UI, 배율 안내(x1/x2/x3) 표시
- [x] `src/pages/MainPage.tsx`
  - 앱 진입 시 `getUserId()` 호출 → `userId` store에 저장
  - Supabase에서 `daily_chances` 읽어 `dailyChancesLeft` 초기화
  - 남은 기회 표시: `오늘 N번 플레이 가능`
  - 내 랭킹 뱃지: 일간 / 월간 / 시즌 순위
  - 시작 버튼: 기회 0이면 비활성화

### 12. 랭킹 화면
- [x] `src/components/ranking/RankingTab.tsx` — 일간 / 월간 / 시즌 탭 전환
- [x] `src/components/ranking/RankingRow.tsx` — 순위 + 점수, 내 항목 하이라이트
- [x] `src/pages/RankingPage.tsx`
  - TOP 50 리스트
  - 하단 고정: 내 순위 (50위 밖이어도 항상 표시)
  - 탭 전환 시 쿼리 재실행

### 13. 라우팅 연결
- [x] 페이지 라우팅 설정 (React Router 또는 단순 상태 기반)
  - Main → Game → Result → (Main | Game | Ranking)
  - 뒤로가기 처리 (앱인토스 네이티브 백버튼 대응)

### 14. 샌드박스 QA

> **샌드박스 접속 절차**
> 1. 샌드박스 앱 설치 (Android: 2026-03-20 / iOS: 2026-03-26 빌드)
> 2. 토스 비즈니스 계정으로 개발자 로그인
> 3. 워크스페이스에서 `memory-battle` 앱 선택 → 본인 인증 (푸시)
> 4. `intoss://memory-battle` 스킴으로 진입

#### 샌드박스에서 테스트 가능 항목
- [ ] 게임 플레이 전체 플로우 (시퀀스 → 입력 → 점수 → Supabase 저장)
- [ ] 게임 로그인 (`getUserKeyForGame()`) — **mock 데이터 반환, 실제 hash는 QR 코드로 토스앱에서 별도 확인**
- [ ] 일간 기회 제한 동작 (4회 이후 차단)
- [ ] 랭킹 3종 데이터 정상 출력 (일간 / 월간 / 시즌)
- [ ] 타이머 2초 만료 → 게임 오버
- [ ] 콤보 0.3초 판정
- [ ] Supabase https 통신 정상 동작 확인 (라이브는 https만 허용)

#### ⚠️ 샌드박스 미지원 — 별도 검증 필요
- [ ] **배너 광고**: 샌드박스 미지원 → 광고 영역을 placeholder로 대체해 레이아웃만 확인, 실제 광고 동작은 검수 환경에서 확인
- [ ] **리워드 광고**: 샌드박스 미지원 → `showRewardAd()` 호출 시 `resolve(true)` 반환하는 mock 모드 구현해 기회 지급 플로우 검증

### 15. 검수 준비 + 제출
- [ ] `index.html` viewport: `user-scalable=no` 적용 확인
- [ ] 콘솔에서 발급받은 라이브 광고 그룹 ID → `ait.ts`의 테스트 ID와 교체 (env 변수로 분리 권장)
- [ ] **Supabase CORS 허용 도메인 추가**
  - 프로덕션: `https://memory-battle.apps.tossmini.com`
  - QR 테스트: `https://memory-battle.private-apps.tossmini.com`
- [ ] **게임 음향 관리** — 광고 재생 중 앱 BGM/효과음 일시정지, 광고 종료 후 자동 재개 (검수 가이드 항목)
- [ ] 콘솔에 스크린샷 업로드 (세로 636×1048px PNG 최소 3장, 가로 1504×741px 최소 1장)
- [ ] `appName`이 콘솔 등록명과 정확히 일치하는지 최종 확인
- [ ] `npm run build` 에러 없이 완료, 번들 크기 100MB 이하 확인
- [ ] 앱인토스 검수 체크리스트 점검
- [ ] 콘솔에서 빌드 업로드 + 검수 요청 (최대 3 영업일)
