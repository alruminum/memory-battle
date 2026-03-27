# 기억력배틀 TRD v0.1

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
│   │   ├── MainPage.tsx        # 메인 (시작 버튼, 기회 표시, 내 랭킹)
│   │   ├── GamePage.tsx        # 게임 화면
│   │   ├── ResultPage.tsx      # 게임 오버 결과 화면
│   │   └── RankingPage.tsx     # 랭킹 화면 (일간/월간/시즌)
│   ├── components/
│   │   ├── game/
│   │   │   ├── ButtonPad.tsx   # 4개 색깔 버튼
│   │   │   ├── TimerGauge.tsx  # 2초 타이머 게이지
│   │   │   └── ScoreDisplay.tsx
│   │   ├── ranking/
│   │   │   ├── RankingTab.tsx
│   │   │   └── RankingRow.tsx
│   │   └── ads/
│   │       ├── BannerAd.tsx
│   │       └── RewardAd.tsx
│   ├── hooks/
│   │   ├── useGameEngine.ts    # 핵심 게임 로직
│   │   ├── useTimer.ts         # 2초 타이머
│   │   ├── useCombo.ts         # 0.3초 콤보 감지
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
  └──────────────────────────┘ (다음 라운드 or 게임오버)
```

| 상태 | 설명 |
|---|---|
| IDLE | 게임 시작 전 |
| SHOWING | 시퀀스 깜빡이는 중 (유저 입력 불가) |
| INPUT | 유저 입력 대기 중 (2초 타이머 동작) |
| RESULT | 게임 오버 |

### 3-2. 시퀀스 생성
```typescript
// 매 라운드 기존 시퀀스에 랜덤 버튼 1개 추가
const BUTTONS = ['orange', 'blue', 'green', 'yellow']
const addToSequence = (seq: string[]) => [
  ...seq,
  BUTTONS[Math.floor(Math.random() * 4)]
]
```

### 3-3. 깜빡임 속도
```typescript
// 난이도별 버튼 점등 시간 (고정)
const FLASH_DURATION: Record<Difficulty, number> = {
  EASY:   500,  // ms
  MEDIUM: 400,
  HARD:   300,
}
```

### 3-4. 타이머 로직
```typescript
// 버튼 입력 제한: 2초
// 입력 성공 시 타이머 리셋 (다음 버튼 대기)
// 2초 초과 시 → 게임 오버
const INPUT_TIMEOUT = 2000  // ms
```

### 3-5. 점수 계산
```typescript
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  EASY:   1,
  MEDIUM: 2,
  HARD:   3,
}

// 버튼 누를 때마다 +1 (무조건)
const getButtonScore = () => 1

// 스테이지 클리어 보너스 (10스테이지 이상만)
const getClearBonus = (stage: number): number => {
  if (stage < 10) return 0
  return Math.floor(stage / 5)
}

// 풀콤보 적용 (10스테이지 이상)
const applyCombo = (score: number, stage: number, isFullCombo: boolean): number => {
  if (stage < 10) return score
  return isFullCombo ? score * 2 : score
}

// 최종 점수 = 원점수 × 난이도 배율
const applyDifficulty = (score: number, difficulty: Difficulty): number => {
  return score * DIFFICULTY_MULTIPLIER[difficulty]
}
```

### 3-6. 콤보 감지
```typescript
const COMBO_THRESHOLD = 300  // ms (0.3초)
let lastInputTime = 0
let comboCount = 0

const onButtonInput = (timestamp: number) => {
  const gap = timestamp - lastInputTime
  if (gap <= COMBO_THRESHOLD) {
    comboCount++
  } else {
    comboCount = 0  // 콤보 리셋
  }
  lastInputTime = timestamp
}

// 라운드 종료 시 전체 입력이 콤보였으면 풀콤보 인정
const isFullCombo = comboCount === sequence.length
```

---

## 4. 랭킹 아키텍처

토스 리더보드는 게임당 1개만 지원 — 기간별 분리 불가.  
**두 채널 병행**으로 각자 역할 분담.

| 채널 | 역할 | 비고 |
|---|---|---|
| **토스 리더보드 SDK** | 친구랭킹 + 전체랭킹 소셜 기능 | 내장 UI 제공 |
| **Supabase** | 일간 / 월간 / 시즌 기간별 랭킹 | 직접 구현 |

### 토스 리더보드 SDK
```typescript
// lib/ait.ts

// 게임 오버 시 점수 제출 (score는 string으로 전달)
export const submitLeaderboardScore = async (score: number): Promise<void> => {
  await AppsInToss.submitGameCenterLeaderBoardScore({
    score: String(score),
  })
}

// 친구랭킹 + 전체랭킹 내장 UI 오픈
export const openLeaderboard = async (): Promise<void> => {
  await AppsInToss.openGameCenterLeaderboard()
}
```

> ⚠️ 최소 버전: Toss 앱 5.221.0  
> ⚠️ 콘솔에서 리더보드 사전 등록 필요  
> ⚠️ 점수 제출은 게임 종료 후에만 호출

### Supabase (기간별 랭킹 + 기회 제한)
```sql
-- 점수 저장 테이블 (기간별 랭킹용)
CREATE TABLE scores (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,
  score       INTEGER NOT NULL,     -- 최종 점수 (원점수 × 난이도 배율 적용)
  stage       INTEGER NOT NULL,
  difficulty  TEXT NOT NULL,        -- 'EASY' | 'MEDIUM' | 'HARD'
  played_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scores_played_at ON scores(played_at DESC);
CREATE INDEX idx_scores_user_id ON scores(user_id);

-- 일간 기회 제한 테이블
CREATE TABLE daily_chances (
  user_id     TEXT PRIMARY KEY,
  used_count  INTEGER DEFAULT 0,
  last_date   DATE DEFAULT CURRENT_DATE
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
  loadFullScreenAd,
  showFullScreenAd,
  TossAds,
  submitGameCenterLeaderBoardScore,
  openGameCenterLeaderboard,
} from '@apps-in-toss/web-framework'

// 유저 식별 (게임 로그인 — 동의 화면 없이 바로 식별)
export const getUserId = async (): Promise<string> => {
  const result = await getUserKeyForGame()
  if (result && typeof result === 'object' && result.type === 'HASH') {
    return result.hash
  }
  return getDeviceId()  // 구버전 앱(< 5.232.0) 폴백
}

// 리워드 광고 (userEarnedReward 이벤트에서만 true 반환)
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

// 배너 광고 (cleanup 함수 반환 — useEffect return에서 호출)
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

// 토스 리더보드 점수 제출 (게임 오버 시)
export const submitLeaderboardScore = async (score: number): Promise<void> => {
  await submitGameCenterLeaderBoardScore({ score: String(score) })
}

// 친구/전체 랭킹 내장 UI 오픈
export const openLeaderboard = async (): Promise<void> => {
  await openGameCenterLeaderboard()
}
```

> ⚠️ 샌드박스에서 광고 API 동작 안 함 — `import.meta.env.DEV` 플래그로 mock 분기 필요
> ⚠️ `getUserKeyForGame` 샌드박스에서 mock 반환 — 실제 hash는 QR 코드로 토스앱에서 확인

---

## 6. 전역 상태 (Zustand)

```typescript
interface GameStore {
  // 게임 상태
  status: 'IDLE' | 'SHOWING' | 'INPUT' | 'RESULT'
  sequence: string[]
  currentIndex: number
  score: number             // 누적 원점수 (배율 미적용)
  stage: number
  isFullCombo: boolean
  difficulty: Difficulty    // 게임 시작 시 선택, 게임 중 변경 불가

  // 유저
  userId: string
  dailyChancesLeft: number  // 남은 기회 (기본 1, 최대 4)

  // 액션
  startGame: (difficulty: Difficulty) => void  // 난이도 저장 후 기회 차감
  addInput: (color: string) => void
  gameOver: () => void      // calcFinalScore 적용 후 Supabase + 토스 리더보드 제출
  resetGame: () => void
  useChance: () => void
}
```

---

## 7. 화면별 주요 컴포넌트 스펙

### MainPage
- 남은 기회 표시: `오늘 N번 플레이 가능`
- 내 랭킹: 일간/월간/시즌 각 순위 뱃지
- 난이도 선택: Easy / Medium / Hard (배율 x1/x2/x3 안내 표시)
- 시작 버튼: 기회 0이면 비활성화

### GamePage
- 4개 버튼: 200x200px 원형, 탭 시 밝기 증가 애니메이션
- 타이머 게이지: 버튼 하단 프로그레스바 (2초, 빨간색으로 변화)
- 콤보 표시: 10스테이지 이상 COMBO! 텍스트 표시
- 배너광고: 하단 고정

### ResultPage
- 이번 점수 + 최고 기록 갱신 여부
- 랭킹 진입 시: 일간/월간/시즌 순위 각각 표시
- 포인트 지급 안내: `월간 N위 → M월 1일 XXX원 예정`
- 한 번 더 버튼 → 확인 모달 → 리워드광고 → 게임 재시작
- 기회 소진 시 버튼 비활성화

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
```

---

## 9. 개발 환경 세팅 순서

```bash
# 1. 프로젝트 생성
npm create vite@latest memory-battle -- --template react-ts
cd memory-battle

# 2. 의존성 설치
npm install @apps-in-toss/web-framework
npm install @supabase/supabase-js   # 일간 기회 제한용
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

---

## 10. MVP 체크리스트

### Day 1
- [ ] 프로젝트 세팅 + 앱인토스 SDK 연동
- [ ] 게임 상태머신 구현
- [ ] 버튼 깜빡임 + 입력 로직
- [ ] 타이머 (2초) 구현
- [ ] 점수 계산 + 콤보 로직

### Day 2
- [ ] Supabase 스키마 생성
- [ ] 랭킹 저장/조회 연동
- [ ] 일간 기회 제한 로직
- [ ] 배너광고 + 리워드광고 연동
- [ ] 게임오버 결과 화면

### Day 3
- [ ] 메인 화면 + 랭킹 화면
- [ ] 샌드박스 QA
- [ ] 앱인토스 검수 체크리스트 점검
- [ ] 콘솔 업로드 + 검수 요청