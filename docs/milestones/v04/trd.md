# 기억력배틀 TRD v0.4

> 변경 이력
> - v0.4 (2026-04-15): 코인 시스템 도입 — user_coins + coin_transactions 테이블, 광고 코인 지급(daily_reward 제거), 부활 아이템, 토스포인트 교환, coinBalance·revivalUsed·revive() Zustand 추가, grantCoinExchange() SDK 래퍼 신설.
> - v0.3.2-hotfix (2026-04-03): 점수 배율 즉시 적용 버그픽스 (#59) — §3-5 `calcScore` → `calcButtonScore(comboStreak)` 변경, addInput 배율 즉시 적용, stageClear clearBonus만 추가, isFullCombo는 스트릭 판정에만 사용.
> - v0.3.2-fix (2026-04-03): GameOverOverlay 버그픽스 (Epic 10 #48) — §7 GamePage: `position: fixed` → `position: absolute` 변경(컨테이너 기준 배치), 루트 div `position: relative` 추가, 패널 상단 핸들바·경고 아이콘·"GAME OVER" 타이틀 추가.
> - v0.3.2 (2026-04-03): 게임오버 오버레이 추가 (Epic 10) — §2 `GameOverOverlay.tsx` 추가, §6 `gameOverReason` 필드 + `gameOver(reason)` 시그니처 변경, §7 GamePage 오버레이 스펙 추가.
> - v0.3.1-fix (2026-04-02): SPEC_GAP 복구 — §3-4 입력 제한 타이머 섹션 추가 (`getInputTimeout` 스펙 명시). Epic 09 Story 1 구현 시 누락된 타이머 로직 복구 계획(04-timer-restore.md) 반영.
> - v0.3.1 (2026-04-02): 콤보 시스템 개편 — 타이머 제거, 풀콤보 조건을 컴퓨터 시연 시간 기준으로 변경, 배율 공식 변경(5연속마다 +1, 무제한), multiplierIncreased 플래그 추가, ComboTimer/MultiplierBurst 컴포넌트 추가.
> - v0.3 (2026-04-01): 게임 메카닉 개편 — 난이도 선택 제거, 스테이지 기반 속도/타이머 도입, 스택형 콤보 시스템으로 교체, 기회제 폐지, 게임오버 강제 리워드광고로 전환, DB 스키마 변경.
> - v0.2 (2026-03-31): BM 변경 — 기회제 폐지, 게임오버 강제 리워드광고 방식으로 교체. daily_chances → daily_reward 테이블 교체.
> - v0.1 (초안): 최초 작성

## 1. 기술 스택

| 구분 | 기술 |
|---|---|
| 프레임워크 | React 18 + TypeScript |
| 빌드 | Vite |
| 스타일 | Tailwind CSS |
| 상태관리 | Zustand |
| 랭킹 (소셜) | 토스 리더보드 SDK — 친구/전체랭킹 |
| 랭킹 (기간별) | Supabase — 일간/월간/시즌 + 코인 잔액/거래 내역 |
| 앱인토스 SDK | @apps-in-toss/web-framework |
| 패키지매니저 | npm |

---

## 2. 프로젝트 구조

```
memory-battle/
├── src/
│   ├── pages/
│   │   ├── MainPage.tsx        # 메인 (시작 버튼, 내 랭킹)
│   │   ├── GamePage.tsx        # 게임 화면
│   │   ├── ResultPage.tsx      # 게임 오버 결과 화면
│   │   └── RankingPage.tsx     # 랭킹 화면 (일간/월간/시즌)
│   ├── components/
│   │   ├── game/
│   │   │   ├── ButtonPad.tsx        # 4개 색깔 버튼
│   │   │   ├── ComboIndicator.tsx   # 콤보 스택 표시 (ComboDisplay.tsx에서 변경)
│   │   │   ├── ComboTimer.tsx       # 타임워치 UI (신규, v0.3.1)
│   │   │   ├── GameOverOverlay.tsx  # 게임오버 오버레이 (신규, v0.3.2)
│   │   │   ├── MultiplierBurst.tsx  # 배율 상승 버스트 오버레이 (신규, v0.3.1)
│   │   │   └── ScoreDisplay.tsx
│   │   ├── ranking/
│   │   │   ├── RankingTab.tsx
│   │   │   └── RankingRow.tsx
│   │   ├── ads/
│   │   │   ├── BannerAd.tsx
│   │   │   └── RewardAd.tsx
│   │   └── result/                     # [v0.4] 게임오버 결과 서브 컴포넌트
│   │       ├── CoinRewardBadge.tsx     # "🪙 +N 획득!" 피드백
│   │       ├── RevivalButton.tsx       # 부활 버튼 (5코인)
│   │       └── PointExchangeButton.tsx # 토스포인트 교환 버튼 (10코인)
│   ├── hooks/
│   │   ├── useGameEngine.ts    # 핵심 게임 로직 (깜빡임 속도·타이머·콤보 통합)
│   │   ├── useRanking.ts       # Supabase 랭킹 연동
│   │   └── useCoin.ts          # [v0.4] 코인 잔액 로드·적립·차감 (Supabase RPC 래퍼)
│   ├── store/
│   │   └── gameStore.ts        # Zustand 전역 상태
│   ├── lib/
│   │   ├── supabase.ts         # Supabase 클라이언트
│   │   └── ait.ts              # 앱인토스 SDK 래퍼
│   └── types/
│       └── index.ts
├── granite.config.ts            # 앱인토스 설정
└── .env
```

---

## 3. 핵심 게임 로직

### 3-1. 게임 상태 머신

```
IDLE → SHOWING → INPUT → RESULT
  ↑                          │  (다시하기)
  └──────────────────────────┘
                             │ [v0.4] revive() [balance≥5, revivalUsed=false]
                             └→ SHOWING (현 스테이지, 시퀀스 초기화, score/combo 유지)
```

| 상태 | 설명 |
|---|---|
| IDLE | 게임 시작 전 |
| SHOWING | 시퀀스 깜빡이는 중 (유저 입력 불가) |
| INPUT | 유저 입력 대기 중 (스테이지별 타이머 동작) |
| RESULT | 게임 오버 (부활 가능: RESULT→SHOWING 전환 허용, v0.4) |

### 3-2. 시퀀스 생성
```typescript
const BUTTONS = ['orange', 'blue', 'green', 'yellow']

// 매 라운드: 기존 시퀀스 + 랜덤 버튼 1개
const addToSequence = (seq: string[]) => [
  ...seq,
  BUTTONS[Math.floor(Math.random() * 4)]
]
```

### 3-3. 깜빡임 속도 (스테이지 기반) ⚠️ v0.3 변경

> 난이도 선택 제거 — 스테이지 진행에 따라 자동으로 빨라짐.

| 스테이지 구간 | 버튼 점등 시간 |
|---|---|
| 1~9 | 500ms |
| 10~19 | 400ms |
| 20~29 | 300ms |
| 30+ | 250ms (하한) |

```typescript
const getFlashDuration = (stage: number): number => {
  if (stage >= 30) return 250
  if (stage >= 20) return 300
  if (stage >= 10) return 400
  return 500
}
```

### 3-4. 입력 제한 타이머 (스테이지 기반) ⚠️ v0.3

> INPUT 상태에서 버튼 미입력 시 게임오버. 타이머 바 UI는 v0.3.1에서 제거됨 (로직은 유지).

| 스테이지 구간 | 버튼 입력 제한 시간 |
|---|---|
| 1~9 | 2000ms |
| 10~19 | 1800ms |
| 20~29 | 1600ms |
| 30+ | 1400ms |

```typescript
const getInputTimeout = (stage: number): number => {
  if (stage >= 30) return 1400
  if (stage >= 20) return 1600
  if (stage >= 10) return 1800
  return 2000
}
```

> 버튼 1개 입력 간격 제한 (시퀀스 전체가 아닌 매 버튼마다 독립 적용).
> `useTimer`가 INPUT 진입 시 `reset()`, wrong/clear 시 `stop()` 호출로 제어.

### 3-5. 점수 계산 ⚠️ v0.3.2-hotfix 변경 (#59)

> 난이도 배율 제거 — 스택형 콤보 배율로 대체.
> ⚠️ v0.3.2-hotfix: 배율을 stageClear에서 일괄 적용하던 방식에서 addInput 시 즉시 적용으로 변경.

```typescript
// 버튼 누를 때마다 현재 배율 즉시 적용 ⚠️ v0.3.2-hotfix
const calcButtonScore = (comboStreak: number): number =>
  getComboMultiplier(comboStreak)  // streak 0~4: +1, 5~9: +2, ...

// 10스테이지 이상 클리어 시 지급
const calcClearBonus = (stage: number): number => {
  if (stage < 10) return 0
  return Math.floor(stage / 5)
}

// stageClear: 클리어 보너스에만 배율 적용 (버튼 점수는 addInput에서 이미 누적)
// ⚠️ v0.3.2-hotfix: calcStageScore(rawScore × multiplier) 패턴 제거
const calcBonusScore = (stage: number, comboStreak: number): number =>
  calcClearBonus(stage) * getComboMultiplier(comboStreak)
```

> `isFullCombo`는 콤보 스트릭 증가/리셋 판정에만 사용, 점수 계산에는 미사용. (v0.3.2-hotfix #59)

### 3-6. 스택형 콤보 감지 ⚠️ v0.3.1 변경

> 기존(v0.3): 300ms 입력 간격 기준 풀콤보 판정, x1~x5 상한
> 변경(v0.3.1): 유저 입력 총 소요 시간 < 컴퓨터 시연 시간 기준으로 판정, 배율 상한 제거

```typescript
// 풀콤보 조건: 유저의 전체 입력 완료 시간 < 컴퓨터 시연 시간
// computerShowTime = flashDuration × sequenceLength

// 배율 ⚠️ v0.3.1: 5연속마다 +1, 상한 없음
const getComboMultiplier = (comboStreak: number): number =>
  Math.floor(comboStreak / 5) + 1

// 배율표
// 0~4  → x1 / 5~9 → x2 / 10~14 → x3 / N×5~(N+1)×5-1 → x(N+1) … 무제한

// 스테이지 클리어 시 (INPUT 페이즈 시작 시각 ~ 마지막 입력 완료 시각 비교)
const onStageClear = (
  sequenceStartTime: number,
  inputCompleteTime: number,
  flashDuration: number,
  sequenceLength: number,
  prevComboStreak: number
): { comboStreak: number; isFullCombo: boolean; multiplierIncreased: boolean } => {
  const computerShowTime = flashDuration * sequenceLength
  const userInputTime = inputCompleteTime - sequenceStartTime
  const isFullCombo = userInputTime < computerShowTime

  const newStreak = isFullCombo ? prevComboStreak + 1 : 0

  const prevMultiplier = getComboMultiplier(prevComboStreak)
  const newMultiplier = getComboMultiplier(newStreak)
  const multiplierIncreased = newMultiplier > prevMultiplier

  return { comboStreak: newStreak, isFullCombo, multiplierIncreased }
}
```

---

## 4. 랭킹 아키텍처

두 채널 병행으로 각자 역할 분담.

| 채널 | 역할 | 비고 |
|---|---|---|
| **토스 리더보드 SDK** | 친구랭킹 + 전체랭킹 소셜 기능 | 내장 UI 제공 |
| **Supabase** | 일간 / 월간 / 시즌 기간별 랭킹 | 직접 구현 |

### 토스 리더보드 SDK
```typescript
// lib/ait.ts
// ⚠️ export명: submitScore (submitLeaderboardScore 아님)
export async function submitScore(score: number): Promise<void> {
  if (getOperationalEnvironment() !== 'toss') return
  await submitGameCenterLeaderBoardScore({ score: String(score) })
}

export async function openLeaderboard(): Promise<void> {
  await openGameCenterLeaderboard()
}
```

> ⚠️ 최소 버전: Toss 앱 5.221.0
> ⚠️ 콘솔에서 리더보드 사전 등록 필요
> ⚠️ 점수 제출은 게임 종료 후에만 호출

### Supabase (기간별 랭킹 + 코인 잔액/거래) ⚠️ v0.4 변경

```sql
-- 점수 저장 테이블 (difficulty 컬럼 제거)
CREATE TABLE scores (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,
  score       INTEGER NOT NULL,
  stage       INTEGER NOT NULL,
  played_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scores_played_at ON scores(played_at DESC);
CREATE INDEX idx_scores_user_id ON scores(user_id);

-- [v0.4] 유저 코인 잔액
CREATE TABLE user_coins (
  user_id   TEXT PRIMARY KEY,
  balance   INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

-- [v0.4] 코인 거래 내역 (type: 'ad_reward'|'record_bonus'|'revival'|'toss_points_exchange')
CREATE TABLE coin_transactions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,
  type        TEXT NOT NULL,
  amount      INTEGER NOT NULL,  -- 양수=적립, 음수=차감
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_coin_tx_user_id ON coin_transactions(user_id, created_at DESC);

-- [DEPRECATED v0.4] daily_reward — 코드/훅 제거, 테이블 물리 삭제는 v2
```

### 랭킹 조회 쿼리
```sql
-- 일간
SELECT user_id, MAX(score) as best_score FROM scores
WHERE played_at >= CURRENT_DATE
GROUP BY user_id ORDER BY best_score DESC LIMIT 50;

-- 월간
SELECT user_id, MAX(score) as best_score FROM scores
WHERE DATE_TRUNC('month', played_at) = DATE_TRUNC('month', NOW())
GROUP BY user_id ORDER BY best_score DESC LIMIT 50;

-- 시즌 (시작일 파라미터로 관리)
SELECT user_id, MAX(score) as best_score FROM scores
WHERE played_at >= '2026-01-01'
GROUP BY user_id ORDER BY best_score DESC LIMIT 50;
```

---

## 5. 앱인토스 SDK 연동

```typescript
// lib/ait.ts
import {
  getUserKeyForGame,
  getDeviceId,
  getOperationalEnvironment,
  loadFullScreenAd,
  showFullScreenAd,
  TossAds,
  submitGameCenterLeaderBoardScore,
  openGameCenterLeaderboard,
} from '@apps-in-toss/web-framework'

// 유저 식별
export const getUserId = async (): Promise<string> => {
  const result = await getUserKeyForGame()
  if (result && typeof result === 'object' && result.type === 'HASH') {
    return result.hash
  }
  return getDeviceId()  // 구버전 앱(< 5.232.0) 폴백
}

// 리워드 광고 (게임오버 시 강제 재생)
export const showRewardAd = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const unsubLoad = loadFullScreenAd({
      options: { adGroupId: import.meta.env.VITE_REWARD_AD_ID ?? 'ait-ad-test-rewarded-id' },
      onEvent: (e) => {
        if (e.type === 'loaded') {
          unsubLoad()
          showFullScreenAd({
            options: { adGroupId: import.meta.env.VITE_REWARD_AD_ID ?? 'ait-ad-test-rewarded-id' },
            onEvent: (ev) => {
              if (ev.type === 'userEarnedReward') resolve(true)
              if (ev.type === 'dismissed')        resolve(false)
            },
            onError: () => resolve(false),
          })
        }
      },
      onError: (err) => reject(err),
    })
  })
}

// 배너 광고
export const attachBannerAd = (container: HTMLElement) => {
  TossAds.initialize({
    callbacks: {
      onInitialized: () => {
        TossAds.attachBanner(
          import.meta.env.VITE_BANNER_AD_ID ?? 'ait-ad-test-banner-id',
          container,
          { theme: 'auto' }
        )
      },
    },
  })
  return () => TossAds.destroyAll()
}

// [v0.4] 코인 10개 → 토스포인트 10포인트 교환
// SDK 성공 시에만 DB balance 차감 (ResultPage에서 호출)
export async function grantCoinExchange(): Promise<void> {
  if (IS_SANDBOX) return
  await grantPromotionReward({
    params: {
      promotionCode: import.meta.env.VITE_COIN_EXCHANGE_CODE ?? 'COIN_EXCHANGE',
      amount: 10
    }
  })
}

// [DEPRECATED v0.4] grantDailyReward — 폐기 (daily_reward 로직 제거)

// 토스 리더보드 점수 제출
// ⚠️ export명: submitScore (submitLeaderboardScore 아님)
export async function submitScore(score: number): Promise<void> {
  if (getOperationalEnvironment() !== 'toss') return
  await submitGameCenterLeaderBoardScore({ score: String(score) })
}

export const openLeaderboard = async (): Promise<void> => {
  await openGameCenterLeaderboard()
}
```

> ⚠️ 샌드박스에서 광고 API 동작 안 함 — `import.meta.env.DEV` 플래그로 mock 분기 필요
> ⚠️ `getUserKeyForGame` 샌드박스에서 mock 반환 — 실제 hash는 QR 코드로 토스앱에서 확인

---

## 6. 전역 상태 (Zustand) ⚠️ v0.3 변경

```typescript
// Difficulty 타입 제거

interface GameStore {
  // 게임 상태
  status: 'IDLE' | 'SHOWING' | 'INPUT' | 'RESULT'
  sequence: string[]
  currentIndex: number
  score: number             // 누적 점수 (콤보 배율 적용 후)
  stage: number
  comboStreak: number       // 현재 연속 풀콤보 스트릭 (상한 없음, v0.3.1)
  sequenceStartTime: number // INPUT 페이즈 시작 시각 (ms) — 풀콤보 판정용 (v0.3.1)
  fullComboCount: number    // 이번 게임 풀콤보 달성 횟수
  maxComboStreak: number    // 이번 게임 최고 콤보 스택
  gameOverReason: 'timeout' | 'wrong' | null  // ⚠️ v0.3.2: 게임오버 이유 (오버레이 표시용)

  // 유저
  userId: string

  // [v0.4] 코인
  coinBalance: number   // Supabase user_coins.balance (앱 진입 시 로드, 이벤트마다 갱신)
  revivalUsed: boolean  // 이 판 부활 사용 여부 (startGame/resetGame 시 false로 초기화)

  // 액션
  startGame: () => void
  addInput: (color: string) => void
  gameOver: (reason: 'timeout' | 'wrong') => void
  resetGame: () => void
  revive: () => void  // [v0.4] RESULT→SHOWING 전환 (5코인 차감 후 호출, 시퀀스 초기화, stage/score/combo 유지)
  setCoinBalance: (balance: number) => void  // [v0.4] useCoin에서 잔액 동기화
  // ⚠️ v0.3.1 추가
  stageClear: (inputCompleteTime: number, flashDuration: number) => {
    isFullCombo: boolean
    multiplierIncreased: boolean
  }
}
```

---

## 7. 화면별 주요 컴포넌트 스펙

### MainPage ⚠️ v0.4 변경
- 내 랭킹: 일간/월간/시즌 각 순위 뱃지
- 시작 버튼: 횟수 제한 없이 항상 활성화
- **[v0.4] 코인 잔액 표시**: 🪙 N (앱 진입 시 Supabase 조회, 로딩 중 `-`)
- ~~난이도 선택~~ (제거됨)
- ~~남은 기회 표시~~ (제거됨)

### GamePage ⚠️ v0.3.2 변경
- 4개 버튼: 200x200px 원형, 탭 시 밝기 증가 애니메이션
- ComboTimer: 컴퓨터 시연 시간 타임워치 형태로 표시 (INPUT 상태에서만 노출)
- 스테이지 번호 옆 현재 배율 xN 상시 표시 (comboStreak 5 이상)
- 풀콤보 달성 시: 디자인 중심 "컴퓨터를 이겼다" 피드백
- MultiplierBurst: 배율 상승 시 xN scale-up + 파티클 버스트 (multiplierIncreased === true)
- 배너광고: 하단 고정
- GameOverlay 루트 div: `position: relative` (v0.3.2-fix 추가 — absolute 자식 기준점)
- GameOverOverlay (v0.3.2): 게임오버 시 backdrop blur + 바텀 패널 슬라이드업. shake 애니메이션. 탭으로 결과 화면 전환 (자동 전환 X). `position: absolute`(v0.3.2-fix: fixed→absolute). 패널 상단: 핸들바(32×4px) + 경고 아이콘(⚠ 48×48px 원형) + "GAME OVER" 타이틀(Barlow Condensed 13px, letter-spacing 3px)

### ResultPage ⚠️ v0.4 변경
- 이번 점수 + 최고 기록 갱신 여부
- 최고 도달 스테이지
- 풀콤보 달성 횟수 + 최고 콤보 스택 + 콤보 보너스 점수
- 랭킹 진입 시: 일간/월간/시즌 순위 각각 표시
- 리워드 광고 자동 시작 (강제, 스킵 불가)
- **[v0.4] CoinRewardBadge**: 완시청 → "🪙 +N 코인 획득!" (최고기록 시 "🏆 +1 코인" 추가)
- **[v0.4] RevivalButton**: 5코인 소모, 비활성 이유 텍스트 포함
- **[v0.4] PointExchangeButton**: 10코인→10포인트, 비활성 이유 텍스트 포함
- **[v0.4] 현재 코인 잔액** 상시 표시
- ~~"10포인트 지급!" 메시지~~ (daily_reward 방식 폐지)
- 광고 종료 후 **다시하기** 버튼 활성화 (횟수 제한 없음)

### RankingPage
- 탭: 일간 / 월간 / 시즌
- 리스트: 순위 / 점수 (내 항목 하이라이트)
- 하단 고정: 내 순위 항상 표시

---

## 8. 환경변수

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_NAME=memory-battle
VITE_REWARD_AD_ID=              # 미설정 시 테스트 ID 사용
VITE_BANNER_AD_ID=              # 미설정 시 테스트 ID 사용
VITE_COIN_EXCHANGE_CODE=        # [v0.4] 코인→토스포인트 교환 promotionCode (운영 사전 등록 필수)
```

---

## 9. 개발 환경 세팅 순서

```bash
# 1. 프로젝트 생성
npm create vite@latest memory-battle -- --template react-ts
cd memory-battle

# 2. 의존성 설치
npm install @apps-in-toss/web-framework
npm install @supabase/supabase-js
npm install zustand
npm install -D tailwindcss

# 3. Claude Code에 앱인토스 MCP 연결 (리더보드 API 정확한 메서드명 확인용)
claude mcp add --transport stdio apps-in-toss ax mcp start

# 4. 앱인토스 샌드박스 앱 설치 (iOS/Android)
# 개발자센터 > 샌드박스 앱 다운로드

# 5. 로컬 실행
npm run dev
# → 샌드박스 앱에서 intoss://memory-battle 입력
```
