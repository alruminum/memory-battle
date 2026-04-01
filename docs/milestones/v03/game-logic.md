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

## 타이머 (스테이지 기반) ⚠️ v0.3 변경

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

---

## 점수 계산

```typescript
// 버튼 누를 때마다 무조건 +1
const calcScore = (): number => 1

// 10스테이지 이상 클리어 시 지급
const calcClearBonus = (stage: number): number => {
  if (stage < 10) return 0
  return Math.floor(stage / 5)
}
```

---

## 스택형 콤보 시스템 ⚠️ v0.3 변경

> 기존: 10스테이지 이상, 풀콤보 시 x2 고정
> 변경: 5스테이지 이상, 연속 풀콤보 스트릭으로 x1~x5 누적

### 배율표

| 연속 풀콤보 스트릭 | 해당 스테이지 점수 배율 |
|---|---|
| 0 | x1 |
| 1 | x2 |
| 2 | x3 |
| 3 | x4 |
| 4 이상 | x5 (상한) |

### 규칙

- **활성화**: 5스테이지 이상
- **풀콤보 조건**: 해당 스테이지 모든 버튼 입력 간격 ≤ 300ms
- **배율 적용**: 풀콤보 달성 시 해당 스테이지 즉시 적용 (버튼점수 + 클리어보너스) × 배율
- **스택 증가**: 풀콤보 달성 후 스택 +1 (다음 스테이지 배율에 반영)
- **스택 리셋**: 풀콤보 실패 시 스택 0으로 리셋

```typescript
const COMBO_THRESHOLD = 300  // ms
const COMBO_ACTIVATION_STAGE = 5

// 콤보 배율
const getComboMultiplier = (comboStreak: number): number =>
  Math.min(comboStreak + 1, 5)

// 스테이지 최종 점수 (풀콤보 달성 시 해당 스테이지에 즉시 적용)
const calcStageScore = (
  rawScore: number,
  comboStreak: number,
  stage: number
): number => {
  if (stage < COMBO_ACTIVATION_STAGE) return rawScore
  return rawScore * getComboMultiplier(comboStreak)
}
```

### 인게임 UX

- 300ms 이내 연속 입력 중: "COMBO!" 텍스트 + 버튼 글로우 이펙트
- 풀콤보 확정 시: "FULL COMBO!" 메시지 + 사운드
- 현재 콤보 스택 숫자 상시 표시 (게임 화면)

### 결과 화면 표시 항목

- 풀콤보 달성 횟수
- 최고 콤보 스택
- 콤보 보너스 점수 (총점 - 콤보 없을 때 점수)

---

## 콤보 감지

```typescript
const COMBO_THRESHOLD = 300  // ms

let lastInputTime = 0
let comboCount = 0
let comboStreak = 0  // 연속 풀콤보 스트릭 (스테이지 간 유지)

const onButtonInput = (timestamp: number) => {
  const gap = timestamp - lastInputTime
  if (gap <= COMBO_THRESHOLD) comboCount++
  else comboCount = 0
  lastInputTime = timestamp
}

// 스테이지 클리어 시
const onStageClear = (sequenceLength: number) => {
  const isFullCombo = comboCount >= sequenceLength
  if (isFullCombo) {
    comboStreak = Math.min(comboStreak + 1, 4)  // 스택 상한 4 (배율 x5)
  } else {
    comboStreak = 0
  }
  comboCount = 0
}
```

---

## Zustand Store 구조 (`store/gameStore.ts`) ⚠️ v0.3 변경

```typescript
// Difficulty 타입 제거

interface GameStore {
  // 게임 상태
  status: 'IDLE' | 'SHOWING' | 'INPUT' | 'RESULT'
  sequence: string[]
  currentIndex: number
  score: number             // 누적 점수 (콤보 배율 적용 후)
  stage: number
  comboStreak: number       // 현재 연속 풀콤보 스트릭
  fullComboCount: number    // 이번 게임 풀콤보 달성 횟수
  maxComboStreak: number    // 이번 게임 최고 콤보 스택

  // 유저
  userId: string

  // 액션
  startGame: () => void
  addInput: (color: string) => void
  gameOver: () => void
  resetGame: () => void
}
```

---

## 누적 점수 시뮬

| 도달 스테이지 | 콤보 없음 | 중간급 (2연속 반복) | 완벽 풀콤보 (x5 유지) |
|---|---|---|---|
| 10 | 57 | 100 | 211 |
| 15 | 133 | 269 | 591 |
| 20 | 239 | 461 | 1,121 |
