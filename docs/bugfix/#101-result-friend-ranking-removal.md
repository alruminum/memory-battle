---
depth: std
---
# #101 feat — 결과 화면 친구랭킹보기 버튼 제거

> 원래 이슈: [#101](https://github.com/alruminum/memory-battle/issues/101)

---

## 개요

결과 화면(`ResultPage.tsx`)에 PRD 미포함 기능인 "친구 랭킹 보기" 버튼이 존재함.  
PRD v0.3 기준 결과 화면 버튼 목록: **PLAY AGAIN** + **전체 랭킹 보기** 2개만.  
"친구 랭킹 보기" 버튼은 설계 근거 없는 잔존 코드 → 제거.

---

## 결정 근거

### D1 — ait.ts의 `openLeaderboard` export는 유지

`openLeaderboard`는 `src/lib/ait.ts`에서 export되는 SDK 래퍼 함수.  
현재 `ResultPage.tsx`에서만 사용되지만, ait.ts 자체는 SDK 연동 단일 진실 공급원이므로 수정하지 않는다.  
ResultPage의 import 라인만 제거한다.

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **import만 제거 (채택)** | ResultPage에서 `openLeaderboard` import 제거. ait.ts 유지 | ✅ 채택 |
| ait.ts에서도 제거 | `openLeaderboard` export 삭제 | ❌ 미채택 — 향후 다른 화면에서 사용 가능성. 이슈 범위 초과 |

### D2 — 버튼 아래 "전체 랭킹 보기" 버튼은 유지

Line 324~의 `onGoRanking` 버튼은 PRD 명시 기능. 제거 금지.

---

## 수정 파일

- `src/pages/ResultPage.tsx` (수정)

---

## ResultPage.tsx

### 제거 대상 (3곳)

#### ① import 라인 (Line 6)

```typescript
// 제거
import { openLeaderboard } from '../lib/ait'
```

> `openLeaderboard`가 ResultPage 내 유일 사용처. import 라인 전체 제거.

#### ② handleFriendRanking 핸들러 (Line 78~84)

```typescript
// 제거
async function handleFriendRanking() {
  try {
    await openLeaderboard()
  } catch (e) {
    console.error('openLeaderboard failed', e)
  }
}
```

#### ③ 버튼 JSX (Line 307~323)

```tsx
// 제거
<button
  onClick={handleFriendRanking}
  style={{
    width: '100%',
    padding: '14px 0',
    borderRadius: 8,
    border: '1px solid var(--vb-border)',
    backgroundColor: 'transparent',
    color: 'var(--vb-text-mid)',
    fontFamily: 'var(--vb-font-body)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  }}
>
  친구 랭킹 보기
</button>
```

---

## 주의사항

- **Line 324~ `onGoRanking` 버튼 유지 필수** — "전체 랭킹 보기"는 PRD 명시 기능. 제거 금지.
- **`adDone` 상태·PLAY AGAIN 버튼 로직 건드리지 않음** — 제거 대상 코드와 완전히 독립.
- **TypeScript 컴파일 확인** — `openLeaderboard` import 제거 후 다른 참조 없는지 확인 (`npm run build`).
- **DB 영향도**: 없음.
- **다른 모듈 의존**: 없음. ResultPage.tsx 단독 수정.

---

## 수동 검증

| ID | 시나리오 | 기대 동작 |
|---|---|---|
| RV-1 | 게임 종료 후 결과 화면 진입 | "친구 랭킹 보기" 버튼 미표시 |
| RV-2 | PLAY AGAIN 버튼 동작 | 기존과 동일 |
| RV-3 | 전체 랭킹 보기 버튼 동작 | 기존과 동일 (onGoRanking 호출) |
