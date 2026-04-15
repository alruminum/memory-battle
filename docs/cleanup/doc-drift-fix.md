---
depth: simple
---

# 문서-코드 드리프트 수정

## 배경

doc-garden 리포트(2026-04-15)에서 발견된 문서-코드 불일치 6건. 코드는 이미 수정됐지만 문서가 안 따라간 항목들. 시각적 변경 없음 — 문서만 수정.

## 수정 대상 1: docs/game-logic.md — Zustand Store 인터페이스 (6건)

현재 코드(`src/store/gameStore.ts`) 기준으로 문서에 누락·오기재된 항목:

1. `breakCombo: () => void` (gameStore.ts:32) — 콤보 타이머 만료 시 배율 하한으로 리셋. 문서의 GameStore 인터페이스에 추가
2. `gameOverReason: 'timeout' | 'wrong' | null` (gameStore.ts:18) — 게임오버 이유 추적 상태 필드. 문서에 추가
3. `addInput()` 반환값 — 문서는 `void`, 실제는 `'correct' | 'wrong' | 'round-clear'` (gameStore.ts:27). 문서 수정
4. `setUserId: (id: string) => void`, `setTodayReward: (v: boolean) => void` (gameStore.ts:23-24) — 상태 설정 메서드. 문서에 추가
5. **[신규] `hasTodayReward: boolean`** (gameStore.ts:21) — 오늘 보상 수령 여부 상태 필드. `setTodayReward` 액션과 쌍을 이루는 state이나 문서 GameStore 인터페이스에 누락. 상태 필드로 추가
6. **[신규] `gameOver: (reason: GameOverReason) => void`** (gameStore.ts:33) — 문서는 `gameOver: () => void`로 기재되어 있으나 실제 시그니처는 `reason` 파라미터 필수. `GameOverReason = 'timeout' | 'wrong'` 타입 참조. 파라미터 포함해 수정

## 수정 대상 2: docs/ui-spec.md (2건)

1. RankingPage 섹션 — "유저 식별자" 표시 수정. 실제: `userId` prop 제거됨, `isMe` flag 기반으로 "나" / "익명 N" 표시 (RankingRow.tsx:8)
2. ComboTimer 섹션 — props 추가 (모두 optional):
   - `isBreaking?: boolean` — 콤보 브레이킹 상태. 기본값 `false`
   - `isShowing?: boolean` — 시퀀스 표시 중 여부. 기본값 `false`
   - `onComboTimerExpired?: () => void` — bar 0 도달 시 1회 발화 콜백. optional
   ※ 세 props 모두 `?`(optional). required로 기재 시 컴포넌트 실사용 오해 유발 → 반드시 `?` 표기
   (ComboTimer.tsx:26-33)

## 결정 근거

- D1: 6건 모두 doc-garden 자동 탐지로 확인된 불일치
- D2: 코드가 정본(truth), 문서를 코드에 맞춤

## 검증

- 문서 내 인터페이스 정의가 `src/store/gameStore.ts` GameStore 타입과 일치하는지 대조
  - 특히 `hasTodayReward: boolean` 상태 필드, `gameOver(reason: GameOverReason)` 파라미터 포함 여부 확인
- ui-spec의 props 목록이 실제 컴포넌트 interface와 일치하는지 대조
  - ComboTimer: `isBreaking?`, `isShowing?`, `onComboTimerExpired?` — 세 props 모두 `?` optional 표기 확인
