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

## 깜빡임 속도 (난이도 고정)

| 난이도 | 버튼 점등 시간 |
|---|---|
| Easy | 500ms |
| Medium | 400ms |
| Hard | 300ms |

```typescript
const FLASH_DURATION: Record<Difficulty, number> = {
  EASY:   500,
  MEDIUM: 400,
  HARD:   300,
}
```

---

## 타이머
- 버튼 하나당 입력 제한: **2초**
- 정답 입력 시 타이머 리셋 → 다음 버튼 대기
- 2초 초과 → 즉시 게임 오버

```typescript
const INPUT_TIMEOUT = 2000  // ms
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

// 풀콤보 배율 (10스테이지 이상만)
const applyCombo = (stageScore: number, isFullCombo: boolean): number =>
  isFullCombo ? stageScore * 2 : stageScore

// 난이도 배율 (게임 종료 시 누적 원점수에 일괄 적용)
const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  EASY:   1,
  MEDIUM: 2,
  HARD:   3,
}
const calcFinalScore = (rawScore: number, difficulty: Difficulty): number =>
  rawScore * DIFFICULTY_MULTIPLIER[difficulty]
```

---

## 콤보 감지

- 풀콤보 조건: 해당 라운드 **모든** 버튼을 **0.3초 이내** 연속 입력
- 한 버튼이라도 0.3초 초과 → 콤보 리셋 → 기본 점수만

```typescript
const COMBO_THRESHOLD = 300  // ms

let lastInputTime = 0
let comboCount = 0

const onButtonInput = (timestamp: number) => {
  const gap = timestamp - lastInputTime
  if (gap <= COMBO_THRESHOLD) comboCount++
  else comboCount = 0
  lastInputTime = timestamp
}

// 라운드 종료 시
const isFullCombo = comboCount === sequence.length
```

---

## Zustand Store 구조 (`store/gameStore.ts`)

```typescript
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

interface GameStore {
  // 게임 상태
  status: 'IDLE' | 'SHOWING' | 'INPUT' | 'RESULT'
  sequence: string[]        // 현재 라운드 전체 시퀀스
  currentIndex: number      // 유저가 입력해야 할 다음 인덱스
  score: number             // 누적 원점수 (배율 미적용)
  stage: number
  isFullCombo: boolean
  difficulty: Difficulty    // 게임 시작 시 선택, 게임 중 변경 불가

  // 유저
  userId: string            // getUserKeyForGame().hash
  dailyChancesLeft: number  // 남은 기회 (1~4)

  // 액션
  startGame: (difficulty: Difficulty) => void  // 난이도 저장 후 기회 차감, IDLE→SHOWING
  addInput: (color: string) => void            // 정답/오답 판정
  gameOver: () => void      // INPUT→RESULT, calcFinalScore 적용 후 점수 저장
  resetGame: () => void     // RESULT→IDLE
  useChance: () => void     // 리워드광고 후 기회 +1
}
```
