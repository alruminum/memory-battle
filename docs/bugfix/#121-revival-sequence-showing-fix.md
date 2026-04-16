---
depth: simple
---
# #121 버그픽스 — 코인 부활 후 시퀀스 예제(깜빡임) 미표시

> 원래 이슈: [#121](https://github.com/alruminum/memory-battle/issues/121)

---

## 개요

코인 5개로 부활 시, 현재 스테이지 시퀀스 깜빡임을 다시 보여주지 않고 즉시 INPUT 대기 상태로 전환되는 버그.

**근본 원인**:
`revive()`가 `sequence: []`로 초기화한 뒤 `status: 'SHOWING'`으로 전환한다.  
`useGameEngine.ts`의 SHOWING 브랜치는 아래 루프로 점등을 처리한다:

```ts
// useGameEngine.ts L50-52
const next = () => {
  if (i >= sequence.length) {   // 0 >= 0 → 즉시 true
    useGameStore.setState({ status: 'INPUT', ... })  // 바로 INPUT 전환
  }
  ...
}
next()   // sequence=[] 상태에서 호출 → 점등 루프 없이 INPUT으로 점프
```

`sequence` 길이가 0이면 루프가 즉시 완료(점등 없음)되어 INPUT으로 직행한다.  
원래 코드 주석 `// useGameEngine이 감지해 stage 길이 새 시퀀스 생성`은 실제로 구현되지 않았다.

---

## 결정 근거

### D1 — 수정 위치: `gameStore.ts` `revive()` (채택)

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **A: `revive()`에서 `sequence: []` 제거 (채택)** | 기존 시퀀스 유지. status만 'SHOWING'으로 전환. SHOWING 효과가 정상 시퀀스로 동작 | ✅ 채택 |
| B: `useGameEngine.ts` SHOWING 브랜치 수정 | `sequence.length === 0` 감지 시 stage 길이로 새 시퀀스 생성 후 점등 | ❌ 미채택 — 코드량 증가, `randomButton()` 호출이 useEffect 내에 추가됨. gameStore에 이미 올바른 시퀀스가 있는데 굳이 새 시퀀스 생성할 이유 없음 |

**A 채택 근거**:
- `gameOver()` 호출 시 `state.sequence`는 건드리지 않는다. 실패 스테이지의 시퀀스가 그대로 남아 있다.
- `revive()` 후 status: 'SHOWING' 변경 → useEffect deps `[status, sequence, timer]` 트리거 → showingRef.current는 RESULT 진입 시 이미 false로 리셋됨 → 점등 루프 정상 실행.
- 단일 파일 한 줄(+주석) 삭제로 완결. `useGameEngine.ts` 변경 불필요.

### D2 — 동일 시퀀스 vs 새 시퀀스 재생성

부활 후 플레이어가 보는 시퀀스는 직전 실패 시퀀스와 동일하다.  
이슈 요구사항 "현재 스테이지의 시퀀스를 처음부터 다시 깜빡임으로 보여준 뒤" = **같은 시퀀스 재표시**가 가장 자연스럽다.  
새 시퀀스를 생성하면 플레이어가 처음 보는 시퀀스로 바뀌어 부활의 의미(같은 스테이지 재시도)가 퇴색된다.

---

## 수정 파일

- `src/store/gameStore.ts` (수정)

---

## gameStore.ts

### 수정 대상: `revive()` L191-198

**현행**
```ts
return {
  status: 'SHOWING',
  sequence: [],       // useGameEngine이 감지해 stage 길이 새 시퀀스 생성
  currentIndex: 0,
  revivalUsed: true,
  // score, stage, comboStreak, fullComboCount, maxComboStreak 유지
}
```

**변경 후**
```ts
return {
  status: 'SHOWING',
  // sequence 유지 — 실패한 스테이지의 시퀀스를 SHOWING에서 다시 점등
  currentIndex: 0,
  revivalUsed: true,
  // score, stage, comboStreak, fullComboCount, maxComboStreak 유지
}
```

> `sequence: []` 한 줄 + 주석 제거. 나머지 필드 변경 없음.

---

## 플로우 검증 (변경 후)

```
gameOver() 호출 시
  state.sequence = [orange, blue, green, ...]  ← 변경 없음
  state.status = 'RESULT'
  state.stage = sequence.length

revive() 호출 시
  state.status = 'SHOWING'            ← 변경
  state.currentIndex = 0             ← 변경
  state.revivalUsed = true           ← 변경
  state.sequence = [orange, blue, green, ...]  ← 유지 (삭제 전 기존 배열 그대로)

useGameEngine SHOWING 효과 (status 변경으로 트리거)
  showingRef.current = false (RESULT 진입 시 리셋됨)
  → showingRef.current = true 세팅
  → sequence.length = N (> 0)
  → i=0부터 N-1까지 점등 루프 정상 실행
  → 완료 후 INPUT 전환
```

---

## 주의사항

- **`useGameEngine.ts` 변경 없음** — SHOWING 브랜치 로직 그대로 유지
- **`revivalUsed` 가드 유지** — 이미 부활 사용 시 `revive()` 무시 동작 불변
- **기존 정상 게임플로우 무영향** — `startGame()` / 스테이지 클리어 후 SHOWING 진입 경로와 무관. 두 경로 모두 non-empty sequence로 SHOWING에 진입하므로 동작 동일
- **`currentIndex: 0` 필수** — `gameOver()` 호출 시 currentIndex가 중간값일 수 있음. 리셋하지 않으면 INPUT 페이즈에서 첫 버튼 기대값 오류

---

## 수동 검증

| ID | 시나리오 | 기대 동작 |
|---|---|---|
| MV-1 | 게임 시작 → 스테이지 진행 → 오답 → 부활 버튼 클릭 | 현재 스테이지 시퀀스 깜빡임 표시 후 INPUT 전환 |
| MV-2 | MV-1 후 정상 입력 완료 | 스테이지 클리어 → 다음 스테이지 SHOWING 정상 진행 |
| MV-3 | MV-1 후 오답 입력 | 게임오버 (revivalUsed=true이므로 2번째 부활 불가) |
| MV-4 | 부활 없이 일반 게임오버 → 다시 시작 | 카운트다운 → SHOWING 정상 (회귀 없음) |
| MV-5 | 스테이지 1에서 부활 | 1-버튼 시퀀스 깜빡임 표시 후 INPUT 전환 |
