# 기억력배틀 TRD v0.3

> 변경 이력
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
| 랭킹 (기간별) | Supabase — 일간/월간/시즌 |
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
│   │   │   ├── ButtonPad.tsx   # 4개 색깔 버튼
│   │   │   ├── TimerGauge.tsx  # 스테이지별 타이머 게이지
│   │   │   ├── ComboDisplay.tsx # 콤보 스택 표시
│   │   │   └── ScoreDisplay.tsx
│   │   ├── ranking/
│   │   │   ├── RankingTab.tsx
│   │   │   └── RankingRow.tsx
│   │   └── ads/
│   │       ├── BannerAd.tsx
│   │       └── RewardAd.tsx
│   ├── hooks/
│   │   ├── useGameEngine.ts    # 핵심 게임 로직 (깜빡임 속도·타이머·콤보 통합)
│   │   └── useRanking.ts       # Supabase 랭킹 연동
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
  ↑                          |
  └──────────────────────────┘ (다시하기)
```

| 상태 | 설명 |
|---|---|
| IDLE | 게임 시작 전 |
| SHOWING | 시퀀스 깜빡이는 중 (유저 입력 불가) |
| INPUT | 유저 입력 대기 중 (스테이지별 타이머 동작) |
| RESULT | 게임 오버 |

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

### 3-4. 타이머 로직 (스테이지 기반) ⚠️ v0.3 변경

| 스테이지 구간 | 버튼당 입력 제한 |
|---|---|
| 1~9 | 2000ms |
| 10~19 | 1800ms |
| 20~29 | 1600ms |
| 30+ | 1400ms (하한) |

```typescript
const getInputTimeout = (stage: number): number => {
  if (stage >= 30) return 1400
  if (stage >= 20) return 1600
  if (stage >= 10) return 1800
  return 2000
}
```

### 3-5. 점수 계산 ⚠️ v0.3 변경

> 난이도 배율 제거 — 스택형 콤보 배율로 대체.

```typescript
// 버튼 누를 때마다 +1
const calcScore = (): number => 1

// 10스테이지 이상 클리어 시 지급
const calcClearBonus = (stage: number): number => {
  if (stage < 10) return 0
  return Math.floor(stage / 5)
}

// 최종 스테이지 점수 = (버튼점수 + 클리어보너스) × 콤보 배율
const calcStageScore = (rawScore: number, comboStreak: number, stage: number): number => {
  if (stage < COMBO_ACTIVATION_STAGE) return rawScore
  return rawScore * getComboMultiplier(comboStreak)
}
```

### 3-6. 스택형 콤보 감지 ⚠️ v0.3 변경

> 기존: 10스테이지 이상, 풀콤보 시 x2 고정
> 변경: 5스테이지 이상, 연속 풀콤보 스트릭으로 x1~x5 누적

```typescript
const COMBO_THRESHOLD = 300        // ms
const COMBO_ACTIVATION_STAGE = 5

// 연속 풀콤보 스트릭 → 배율
const getComboMultiplier = (comboStreak: number): number =>
  Math.min(comboStreak + 1, 5)

// 스트릭 배율표
// 0 → x1 / 1 → x2 / 2 → x3 / 3 → x4 / 4이상 → x5

let lastInputTime = 0
let comboCount = 0
let comboStreak = 0  // 스테이지 간 유지

const onButtonInput = (timestamp: number) => {
  const gap = timestamp - lastInputTime
  if (gap <= COMBO_THRESHOLD) comboCount++
  else comboCount = 0
  lastInputTime = timestamp
}

// 스테이지 클리어 시
const onStageClear = (sequenceLength: number) => {
  const isFullCombo = comboCount >= sequenceLength
  comboStreak = isFullCombo ? Math.min(comboStreak + 1, 4) : 0
  comboCount = 0
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

### Supabase (기간별 랭킹 + 데일리 리워드 기록) ⚠️ v0.3 변경

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

-- 데일리 리워드 수령 기록 테이블 (daily_chances 대체)
CREATE TABLE daily_reward (
  user_id       TEXT PRIMARY KEY,
  last_rewarded DATE DEFAULT NULL  -- 오늘 첫 완시청 여부 판단
);
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
  comboStreak: number       // 현재 연속 풀콤보 스트릭 (스테이지 간 유지)
  fullComboCount: number    // 이번 게임 풀콤보 달성 횟수
  maxComboStreak: number    // 이번 게임 최고 콤보 스택

  // 유저
  userId: string

  // 액션
  startGame: () => void              // 기회 차감 없이 바로 시작
  addInput: (color: string) => void
  gameOver: () => void               // Supabase + 토스 리더보드 점수 제출
  resetGame: () => void
}
```

---

## 7. 화면별 주요 컴포넌트 스펙

### MainPage ⚠️ v0.3 변경
- 내 랭킹: 일간/월간/시즌 각 순위 뱃지
- 시작 버튼: 횟수 제한 없이 항상 활성화
- ~~난이도 선택~~ (제거됨)
- ~~남은 기회 표시~~ (제거됨)

### GamePage ⚠️ v0.3 변경
- 4개 버튼: 200x200px 원형, 탭 시 밝기 증가 애니메이션
- 타이머 게이지: 스테이지별 제한 시간 기준 프로그레스바
- 콤보 스택 숫자 상시 표시 (5스테이지 이상)
- 300ms 이내 연속 입력 중: "COMBO!" 텍스트 + 글로우 이펙트
- 풀콤보 확정 시: "FULL COMBO!" 메시지
- 배너광고: 하단 고정

### ResultPage ⚠️ v0.3 변경
- 이번 점수 + 최고 기록 갱신 여부
- 최고 도달 스테이지
- 풀콤보 달성 횟수 + 최고 콤보 스택 + 콤보 보너스 점수
- 랭킹 진입 시: 일간/월간/시즌 순위 각각 표시
- 리워드 광고 자동 시작 (강제, 스킵 불가)
- 완시청 → 오늘 첫 완시청이면 "10포인트 지급!" 메시지
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
VITE_REWARD_AD_ID=          # 미설정 시 테스트 ID 사용
VITE_BANNER_AD_ID=          # 미설정 시 테스트 ID 사용
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
