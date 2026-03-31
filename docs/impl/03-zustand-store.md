# 03. Zustand Store

> v0.2 변경: dailyChancesLeft 제거, hasTodayReward 추가

## 생성 파일
- `src/store/gameStore.ts`

---

## 상태 인터페이스

```typescript
interface GameStore {
  // 게임 상태
  status: GameStatus                  // 'IDLE' | 'SHOWING' | 'INPUT' | 'RESULT'
  sequence: ButtonColor[]             // 현재까지 누적된 전체 시퀀스
  currentIndex: number                // 유저가 입력해야 할 다음 인덱스
  score: number                       // 누적 원점수 (배율 미적용)
  stage: number                       // 현재 스테이지 (시퀀스 길이)
  isFullCombo: boolean
  difficulty: Difficulty              // 게임 시작 시 선택, 게임 중 변경 불가

  // 유저
  userId: string
  hasTodayReward: boolean             // 오늘 이미 10포인트 리워드를 받았는지 (초기값: false)

  // 액션
  setUserId: (id: string) => void
  setTodayReward: (v: boolean) => void  // hasTodayReward 갱신
  startGame: (difficulty: Difficulty) => void   // IDLE→SHOWING
  addInput: (color: ButtonColor) => void        // 정답/오답 판정 (훅에서 호출)
  gameOver: (isFullCombo: boolean) => void      // INPUT→RESULT, 최종 점수 적용
  resetGame: () => void                         // RESULT→IDLE, 시퀀스 초기화
}
```

## 주의사항
- `startGame()` 내부에서 기회 차감 로직 없음 (v0.2 이후 기회 제한 폐지).
- `addInput()` 은 정답/오답 판정만. 상태 전환(→SHOWING, →RESULT)은 `useGameEngine`에서 담당.
- `gameOver(isFullCombo)` 시 `calcFinalScore(rawScore, difficulty)` 적용.
- `sequence`에 랜덤 버튼 추가는 `useGameEngine`에서 처리 후 store에 반영.
- `hasTodayReward`는 앱 세션 초기 false. `useDailyReward` 훅이 마운트 시 Supabase 조회 후 `setTodayReward(true/false)` 호출.
