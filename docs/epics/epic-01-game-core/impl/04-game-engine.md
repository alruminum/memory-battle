# 04. 게임 로직 훅

## 생성 파일
- `src/hooks/useGameEngine.ts`
- `src/hooks/useTimer.ts`
- `src/hooks/useCombo.ts`

---

## useTimer.ts

```typescript
// 2초 카운트다운. 정답 입력 시 reset() 호출로 리셋.
// 만료 시 onExpire 콜백 실행.
interface UseTimerReturn {
  timeLeft: number      // 0~2000ms, UI 게이지용
  reset: () => void
  stop: () => void
}

useTimer(onExpire: () => void, duration = 2000): UseTimerReturn
```
- `setInterval(100ms)` 로 업데이트
- INPUT 상태일 때만 동작 (status !== 'INPUT' 이면 stop)

---

## useCombo.ts

```typescript
// 0.3초(300ms) 이내 연속 입력 감지
interface UseComboReturn {
  recordInput: () => void     // 버튼 입력 시 호출
  isFullCombo: (sequenceLength: number) => boolean  // 라운드 종료 시 판정
  reset: () => void           // 새 라운드 시작 시
}
```
- `Date.now()` 기반 gap 측정
- gap > 300ms → comboCount 리셋

---

## useGameEngine.ts

### 상태 전환 흐름
```
IDLE
  → startGame(difficulty) 호출 시: sequence에 랜덤 버튼 1개 추가 → status = SHOWING

SHOWING
  → sequence 순서대로 버튼 점등 (FLASH_DURATION[difficulty] 간격)
  → 완료 후: currentIndex = 0, status = INPUT, timer.reset()

INPUT
  → 버튼 탭: recordInput(), timer.reset(), addInput(color)
    - 정답 & currentIndex < sequence.length - 1: currentIndex++
    - 정답 & currentIndex === sequence.length - 1 (라운드 클리어):
        isFullCombo 판정 → gameOver 플래그 없으면 랜덤 버튼 추가 → status = SHOWING
    - 오답: gameOver(isFullCombo)
  → 타이머 만료: gameOver(isFullCombo)

RESULT
  → resetGame() 시: IDLE
```

### 상수
```typescript
const FLASH_DURATION = { EASY: 500, MEDIUM: 400, HARD: 300 }  // ms
const BUTTONS: ButtonColor[] = ['orange', 'blue', 'green', 'yellow']
```

### flashingButton 상태
- SHOWING 중 현재 점등 중인 버튼 색상 (`ButtonColor | null`)
- ButtonPad의 `isFlashing` prop으로 전달
