# 게임 로직 상세

## 시퀀스 생성
```typescript
const BUTTONS = ['orange', 'blue', 'green', 'yellow']

// 매 라운드: 기존 시퀀스 + 랜덤 버튼 1개
const addToSequence = (seq: string[]) => [
  ...seq,
  BUTTONS[Math.floor(Math.random() * 4)]
]
```

---

## 깜빡임 속도 (스테이지 기반) ⚠️ v0.3 변경

> 난이도 선택 제거. 스테이지 진행에 따라 자동으로 빨라짐.

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

---

## 입력 제한 타이머 (스테이지 기반) ⚠️ v0.3

> INPUT 상태에서 버튼 미입력 시 게임오버. 타이머 바 UI는 v0.3.1에서 제거됨 (로직은 유지).
> 버튼 1개 입력 간격 제한 — 시퀀스 전체가 아닌 매 버튼마다 독립 적용.

| 스테이지 구간 | 버튼 입력 제한 시간 |
|---|---|
| 1~9 | 2000ms |
| 10~19 | 1800ms |
| 20~29 | 1600ms |
| 30+ | 1400ms |

```typescript
/**
 * 스테이지에 따른 버튼 입력 제한 시간 (ms)
 * Stage 1~9: 2000ms / 10~19: 1800ms / 20~29: 1600ms / 30+: 1400ms
 *
 * 시퀀스 전체 제한이 아닌 버튼 1개 입력 간격 제한이다.
 * (시퀀스 길이와 무관하게 매 버튼마다 독립 적용)
 */
export const getInputTimeout = (stage: number): number => {
  if (stage >= 30) return 1400
  if (stage >= 20) return 1600
  if (stage >= 10) return 1800
  return 2000
}
```

### useTimer 연동 규칙

- INPUT 진입 시: `timer.reset()` → 타이머 시작
- 정답 입력 시: `timer.reset()` → 다음 버튼 타이머 재시작
- 오답 / 라운드 클리어 시: `timer.stop()`
- 타이머 만료 시: `handleExpire` 콜백 → `gameOver()` 호출

---

## 점수 계산

```typescript
// 버튼 누를 때마다 현재 배율 즉시 적용 ⚠️ v0.3.2-hotfix (#59)
const calcButtonScore = (comboStreak: number): number =>
  getComboMultiplier(comboStreak)  // streak 0~4: +1, 5~9: +2, ...

// 10스테이지 이상 클리어 시 지급
const calcClearBonus = (stage: number): number => {
  if (stage < 10) return 0
  return Math.floor(stage / 5)
}

// 클리어 보너스에도 배율 적용 (버튼 점수는 addInput에서 이미 누적)
const calcBonusScore = (stage: number, comboStreak: number): number =>
  calcClearBonus(stage) * getComboMultiplier(comboStreak)
```

---

## 스택형 콤보 시스템 ⚠️ v0.3.1 변경

> 컴퓨터보다 빠르게 입력하면 콤보. 5연속 콤보마다 배율 상승 (상한 없음).

### 풀콤보 조건

유저의 전체 입력 완료 시간 < 컴퓨터 시연 시간

```
computerShowTime = flashDuration × sequenceLength
```

시퀀스 시작 시각을 저장하고, 마지막 버튼 입력 완료 시점까지의 소요 시간을 `computerShowTime`과 비교한다.

### 배율표 ⚠️ v0.3.1 변경

| 연속 풀콤보 스트릭 | 해당 스테이지 점수 배율 |
|---|---|
| 0~4 | x1 |
| 5~9 | x2 |
| 10~14 | x3 |
| N×5 ~ (N+1)×5-1 | x(N+1) … 무제한 |

### 규칙

- **풀콤보 조건**: 시퀀스 시작부터 전체 입력 완료까지 총 소요 시간 < `computerShowTime`
- **배율 적용**: `addInput` 시 현재 `comboStreak` 배율을 즉시 적용 (버튼마다 실시간 반영) ⚠️ v0.3.2-hotfix (#59)
- **클리어 보너스**: `stageClear` 시 `clearBonus × 클리어 직전 배율` 추가 (버튼 점수는 이미 addInput에서 배율 포함)
- **isFullCombo**: 콤보 스트릭 증가/리셋 판정에만 사용, 점수 계산에는 미사용 ⚠️ v0.3.2-hotfix (#59)
- **스택 증가**: 풀콤보 달성 후 스택 +1 (상한 없음)
- **스택 리셋**: 풀콤보 실패 시 배율 하한으로 리셋 — `newStreak = floor(prevStreak / 5) × 5` ⚠️ v0.3.3 (#90). 배율(xN)은 유지되고 그 배율의 스택 하한값(N-1)×5으로 리셋. x1(0~4): 0, x2(5~9): 5, x3(10~14): 10 …
- **multiplierIncreased 플래그**: stageClear 처리 시 이전 배율과 새 배율 비교, 상승했으면 `true`

```typescript
// 콤보 배율 ⚠️ v0.3.1: 상한 없음, 5연속마다 +1
const getComboMultiplier = (comboStreak: number): number =>
  Math.floor(comboStreak / 5) + 1

// ⚠️ v0.3.2-hotfix (#59): calcStageScore 사용 중단
// 버튼 점수는 addInput에서 배율 포함 즉시 누적, stageClear는 clearBonus만 추가
// const calcStageScore = (rawScore, comboStreak) => ... (더 이상 stageClear에서 미사용)
```

### 스테이지 클리어 처리

```typescript
// 스테이지 클리어 시
const onStageClear = (
  sequenceStartTime: number,   // INPUT 페이즈 시작 시각 (Date.now())
  inputCompleteTime: number,   // 마지막 버튼 입력 완료 시각
  flashDuration: number,
  sequenceLength: number,
  prevComboStreak: number
): { comboStreak: number; isFullCombo: boolean; multiplierIncreased: boolean } => {
  const computerShowTime = flashDuration * sequenceLength
  const userInputTime = inputCompleteTime - sequenceStartTime
  const isFullCombo = userInputTime < computerShowTime

  // ⚠️ v0.3.3 (#90): 실패 시 배율 유지 — floor(prev/5)*5로 리셋 (x1 구간은 0)
  const prevMultiplierBase = Math.floor(prevComboStreak / 5) * 5
  const newStreak = isFullCombo ? prevComboStreak + 1 : prevMultiplierBase

  const prevMultiplier = getComboMultiplier(prevComboStreak)
  const newMultiplier = getComboMultiplier(newStreak)
  const multiplierIncreased = newMultiplier > prevMultiplier

  return { comboStreak: newStreak, isFullCombo, multiplierIncreased }
}
```

### 인게임 UX ⚠️ v0.3.1 변경

- **타임워치**: 컴퓨터 시연 시간(`computerShowTime`)을 시각적 타임바로 표시, 유저가 컴퓨터와 경쟁하는 느낌 제공
- **실시간 힌트**: 입력 중 컴퓨터 시간 대비 현재 진행 상황 색상/애니메이션으로 표시
- **풀콤보 클리어 시**: "컴퓨터를 이겼다" 피드백
- **배율 상승 시**: `multiplierIncreased` 플래그가 `true`이면 `MultiplierBurst` 컴포넌트 트리거
  - scale-up + 파티클 버스트 애니메이션
  - 배율별 색상: x2=`#FACC15`, x3=`#FB923C`, x4=`#F87171`, x5+=`#E879F9`
- **스테이지 번호 옆**: 현재 배율 `xN` 상시 표시

### 결과 화면 표시 항목

- 풀콤보 달성 횟수
- 최고 콤보 스택
- 콤보 보너스 점수 (총점 - 콤보 없을 때 점수)

---

## Zustand Store 구조 (`store/gameStore.ts`) ⚠️ v0.4 업데이트

```typescript
// Difficulty 타입 제거 (v0.3)
// hasTodayReward / setTodayReward 제거 (v0.4 — daily_reward 폐기)

export type GameOverReason = 'timeout' | 'wrong' | null

interface GameStore {
  // 게임 상태
  status: 'IDLE' | 'SHOWING' | 'INPUT' | 'RESULT'
  sequence: string[]
  currentIndex: number
  score: number              // 누적 점수 (콤보 배율 적용 후)
  baseScore: number          // 누적 점수 (콤보 배율 미적용, 콤보 보너스 계산용)
  stage: number
  comboStreak: number        // 현재 연속 풀콤보 스트릭 (상한 없음, v0.3.1)
  fullComboCount: number     // 이번 게임 풀콤보 달성 횟수
  maxComboStreak: number     // 이번 게임 최고 콤보 스택
  gameOverReason: GameOverReason  // 게임오버 이유 ('timeout' | 'wrong' | null)

  // 콤보 판정용 타임스탬프 (v0.3.1)
  sequenceStartTime: number  // INPUT 페이즈 시작 시각 (ms). 0 = 미설정

  // 유저
  userId: string

  // [v0.4] 코인
  coinBalance: number   // Supabase user_coins.balance (앱 진입 시 로드, 이벤트마다 갱신)
  revivalUsed: boolean  // 이 판 부활 사용 여부 (startGame/resetGame 시 false로 초기화)

  // 액션
  setUserId: (id: string) => void
  startGame: () => void
  addInput: (color: string) => 'correct' | 'wrong' | 'round-clear'
  stageClear: (inputCompleteTime: number, flashDuration: number) => {
    isFullCombo: boolean
    multiplierIncreased: boolean
  }
  breakCombo: () => void     // 콤보 타이머 만료 시 배율 하한으로 리셋
  gameOver: (reason: GameOverReason) => void
  resetGame: () => void
  revive: () => void         // [v0.4] RESULT→SHOWING 전환 (5코인 차감 후 호출, 시퀀스 초기화, stage/score/combo 유지)
  setCoinBalance: (balance: number) => void  // [v0.4] useCoin에서 잔액 동기화
}
```

---

## 누적 점수 시뮬

> ⚠️ 아래 수치는 구 로직(v0.3.1) 기준이며 v0.3.2-hotfix(#59) 반영 전입니다. 새 로직 기준 시뮬은 후속 태스크에서 갱신 예정.

| 도달 스테이지 | 콤보 없음 | 중간급 (2연속 반복) | 완벽 풀콤보 (배율 계속 상승) |
|---|---|---|---|
| 10 | 57 | 100 | 211 |
| 15 | 133 | 269 | 591 |
| 20 | 239 | 461 | 1,121 |

---

## 코인 시스템 ⚠️ v0.4 신설

### 획득 경로

| 이벤트 | 지급량 | type |
|---|---|---|
| 광고 완시청 | 1~5개 (가중치 랜덤) | `ad_reward` |
| 최고기록 갱신 | 1개 | `record_bonus` |

```typescript
// 가중치 랜덤 — 누적 확률
export function rollAdRewardCoins(): number {
  const r = Math.random()
  if (r < 0.30) return 1  // 30%
  if (r < 0.60) return 2  // 30%
  if (r < 0.85) return 3  // 25%
  if (r < 0.95) return 4  // 10%
  return 5                // 5%
}

// 샌드박스 mock: 항상 2개
export const SANDBOX_AD_COIN_REWARD = 2
```

### 소비 경로

| 소비 | 비용 | type |
|---|---|---|
| 부활 아이템 | 5코인 | `revival` |
| 토스포인트 교환 | 10코인 → 10포인트 | `toss_points_exchange` |

### 부활 상태머신 ⚠️ v0.4 추가

기존: `IDLE → SHOWING → INPUT → RESULT`

```
IDLE → SHOWING → INPUT → RESULT
                            │ revive() [balance≥5, revivalUsed=false]
                            └→ SHOWING (현 스테이지, 시퀀스 초기화, score/combo 유지)
                                         → INPUT → RESULT (revivalUsed=true → 부활 버튼 미표시)
```

**revive() 동작**:
1. balance -= 5 + DB 기록 (type='revival', amount=-5)
2. `revivalUsed = true` (판당 1회 제한)
3. `sequence = []` 초기화 (같은 stage 길이로 새 시퀀스)
4. `status = 'SHOWING'`
5. score / comboStreak / stage 유지

**부활 표시 조건**:
- `balance < 5`: RevivalButton 비활성 + "코인이 부족합니다 (현재 N개)"
- `revivalUsed === true`: RevivalButton **미표시** (disabled 아님 — architecture.md §설계결정 참조)

### 최고기록 갱신 판정

게임오버 시 호출. `useRanking`의 기존 allTimeBest 조회 결과를 재활용.

```typescript
// ResultPage에서 scores INSERT 완료 후 isNewBest 판정
// isNewBest: currentScore > prevBest (동점 미포함)
if (isNewBest) {
  await useCoin.addCoins(1, 'record_bonus')
}
```

### Supabase 코인 연산

**잔액 원자 증감 (add_coins RPC)** ⚠️ v0.4.1 수정:

> 단순 upsert는 경쟁 조건에서 balance 덮어쓰기 위험 → 3-param RPC로 user_coins + coin_transactions 단일 트랜잭션 처리.

```sql
-- Supabase SQL Editor에서 생성 — architecture.md § add_coins 기준
CREATE OR REPLACE FUNCTION add_coins(
  p_user_id TEXT,
  p_amount  INTEGER,  -- 양수=적립, 음수=차감
  p_type    TEXT      -- 'ad_reward'|'record_bonus'|'revival'|'toss_points_exchange'
)
RETURNS INTEGER        -- 업데이트 후 최종 balance 반환
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  INSERT INTO user_coins (user_id, balance)
  VALUES (p_user_id, GREATEST(0, p_amount))
  ON CONFLICT (user_id) DO UPDATE
    SET balance = GREATEST(0, user_coins.balance + p_amount)
  RETURNING balance INTO v_balance;

  INSERT INTO coin_transactions (user_id, type, amount)
  VALUES (p_user_id, p_type, p_amount);

  RETURN v_balance;
END;
$$;
```

호출:
```typescript
const { data } = await supabase.rpc('add_coins', {
  p_user_id: userId,
  p_amount: amount,   // ⚠️ 파라미터명 p_amount (p_delta 아님)
  p_type: type        // 'ad_reward' | 'record_bonus' | 'revival' | 'toss_points_exchange'
})
// data: 업데이트된 balance (INTEGER)
```
