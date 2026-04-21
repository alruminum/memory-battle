---
depth: std
---
# impl-10 — PR #159 MUST FIX 2건 반영

> 이슈: #158 (PR #159 리뷰어 지적 — 병합 전 필수 수정)

---

## 1. 개요

PR #159 코드 리뷰에서 pr-reviewer가 MUST FIX로 지적한 2건을 반영한다.
기능 추가·리팩토링·docs 변경 없음. 정확히 아래 2건만 수정한다.

| # | 위치 | 수정 내용 |
|---|---|---|
| MUST-1 | `ResultPage.tsx` L118 | 토스트 메시지 하드코딩 → `COIN_EXCHANGE_AMOUNT` 상수 참조 |
| MUST-2a | `ResultPage.tsx` L61-63 | `typeof` 방어 코드 제거 + 주석 현행화 |
| MUST-2b | 테스트 3개 파일 | useCoin mock에 `getLifetimeExchanged` 추가 (방어 제거 후 회귀 방지) |

---

## 2. 변경 파일 목록

| 파일 | 변경 유형 | 변경 라인 |
|---|---|---|
| `src/pages/ResultPage.tsx` | 수정 | L61-69, L118 |
| `src/__tests__/ResultPage.coin-ui-polish.test.tsx` | 수정 | L65-68 (useCoin mock) |
| `src/__tests__/ResultPage.friend-ranking-removal.test.tsx` | 수정 | L46-51 (useCoin mock) |
| `src/__tests__/ResultPage.ad-placeholder.test.tsx` | 수정 | L35-40 (useCoin mock) |

---

## 3. MUST FIX 1 — 토스트 하드코딩 제거

### 현재 (L118)
```ts
showToastMsg('🎉 10포인트 지급됐어요!')
```

### 변경 후
```ts
showToastMsg(`🎉 ${COIN_EXCHANGE_AMOUNT}포인트 지급됐어요!`)
```

**근거**: `COIN_EXCHANGE_AMOUNT`는 이미 L7에서 import 중. 금액이 변경될 때 이 문자열만
누락되는 리스크 제거. `COIN_EXCHANGE_AMOUNT = 10`이므로 런타임 출력값은 동일 —
기존 테스트 assertion 영향 없음.

---

## 4. MUST FIX 2a — 방어 코드 제거

### 현재 (L61-69)
```ts
// [v0.4.2 F5] 마운트 시 누적 교환 포인트 조회 (모킹 환경 호환을 위해 런타임 타입 검사)
useEffect(() => {
  if (typeof getLifetimeExchanged !== 'function') return
  getLifetimeExchanged()
    .catch(() => {
      // 조회 실패 시 조용히 처리 — lifetimeExchanged=0 유지 (교환 버튼 활성)
      console.warn('[lifetime-exchanged] fetch failed — non-blocking')
    })
}, []) // eslint-disable-line react-hooks/exhaustive-deps
```

### 변경 후
```ts
// [v0.4.2 F5] 마운트 시 누적 교환 포인트 조회
useEffect(() => {
  getLifetimeExchanged()
    .catch(() => {
      // 조회 실패 시 조용히 처리 — lifetimeExchanged=0 유지 (교환 버튼 활성)
      console.warn('[lifetime-exchanged] fetch failed — non-blocking')
    })
}, []) // eslint-disable-line react-hooks/exhaustive-deps
```

**제거 항목**:
- L61 주석: `(모킹 환경 호환을 위해 런타임 타입 검사)` 문구 제거
- L63: `if (typeof getLifetimeExchanged !== 'function') return` 라인 전체 제거

**근거**: `useCoin`은 항상 `getLifetimeExchanged: () => Promise<number>`를 반환하므로
런타임 타입 검사는 불필요. 방어 코드가 오히려 mock 미구성 시 에러를 숨기는 부작용이 있었음.
올바른 해결책은 방어 코드 제거 + 테스트 mock 보강(2b).

---

## 5. MUST FIX 2b — 테스트 3개 파일 useCoin mock 보강

방어 코드 제거 후 `getLifetimeExchanged`가 mock에 없으면 `TypeError: getLifetimeExchanged is not a function`으로 3개 테스트 회귀 발생. 각 파일의 useCoin mock에 추가한다.

### 파일 1: `ResultPage.coin-ui-polish.test.tsx`

**위치**: L65-68 `vi.mocked(useCoin).mockReturnValue(...)` 블록

현재:
```ts
vi.mocked(useCoin).mockReturnValue({
  getBalance: vi.fn().mockResolvedValue(coinBalance),
  addCoins: mockAddCoins,
} as unknown as ReturnType<typeof useCoin>)
```

변경 후:
```ts
vi.mocked(useCoin).mockReturnValue({
  getBalance: vi.fn().mockResolvedValue(coinBalance),
  addCoins: mockAddCoins,
  getLifetimeExchanged: vi.fn().mockResolvedValue(0),
} as unknown as ReturnType<typeof useCoin>)
```

### 파일 2: `ResultPage.friend-ranking-removal.test.tsx`

**위치**: L46-51 `vi.mock('../hooks/useCoin', ...)` factory 블록

현재:
```ts
vi.mock('../hooks/useCoin', () => ({
  useCoin: vi.fn(() => ({
    addCoins: vi.fn().mockResolvedValue(0),
    getBalance: vi.fn().mockResolvedValue(0),
  })),
}))
```

변경 후:
```ts
vi.mock('../hooks/useCoin', () => ({
  useCoin: vi.fn(() => ({
    addCoins: vi.fn().mockResolvedValue(0),
    getBalance: vi.fn().mockResolvedValue(0),
    getLifetimeExchanged: vi.fn().mockResolvedValue(0),
  })),
}))
```

### 파일 3: `ResultPage.ad-placeholder.test.tsx`

**위치**: L35-40 `vi.mock('../hooks/useCoin', ...)` factory 블록

현재:
```ts
vi.mock('../hooks/useCoin', () => ({
  useCoin: vi.fn(() => ({
    addCoins: vi.fn().mockResolvedValue(0),
    getBalance: vi.fn().mockResolvedValue(0),
  })),
}))
```

변경 후:
```ts
vi.mock('../hooks/useCoin', () => ({
  useCoin: vi.fn(() => ({
    addCoins: vi.fn().mockResolvedValue(0),
    getBalance: vi.fn().mockResolvedValue(0),
    getLifetimeExchanged: vi.fn().mockResolvedValue(0),
  })),
}))
```

---

## 6. 완료 조건

- [ ] `ResultPage.tsx` L118 템플릿 리터럴 적용
- [ ] `ResultPage.tsx` L63 `typeof` 방어 제거 + L61 주석 현행화
- [ ] `ResultPage.coin-ui-polish.test.tsx` useCoin mock에 `getLifetimeExchanged` 추가
- [ ] `ResultPage.friend-ranking-removal.test.tsx` useCoin mock에 `getLifetimeExchanged` 추가
- [ ] `ResultPage.ad-placeholder.test.tsx` useCoin mock에 `getLifetimeExchanged` 추가
- [ ] `npx vitest run` → 389/389 통과 유지
- [ ] 단일 커밋 (type: `fix`, scope: `result-page`, 본문에 `Related to #158`)

---

## 7. 커밋 메시지 템플릿

```
fix(result-page): PR #159 MUST FIX 2건 반영

[왜] pr-reviewer 지적 — 토스트 하드코딩 + 방어 코드 잔류
[변경]
- ResultPage.tsx L118: 토스트 메시지 COIN_EXCHANGE_AMOUNT 상수 참조로 변경
- ResultPage.tsx L61-63: typeof 방어 코드 제거 + 주석 현행화
- ResultPage.coin-ui-polish.test.tsx: useCoin mock에 getLifetimeExchanged 추가
- ResultPage.friend-ranking-removal.test.tsx: useCoin mock에 getLifetimeExchanged 추가
- ResultPage.ad-placeholder.test.tsx: useCoin mock에 getLifetimeExchanged 추가

Related to #158
```

---

## 8. 주의사항

- **docs 수정 금지**: impl-09에서 이미 커밋 완료. 이번 impl에서 docs 변경 없음.
- **다른 src 파일 수정 금지**: `gameStore`, `useCoin`, `PointExchangeButton` 등 그대로.
- **신규 기능·리팩 금지**: 이 impl은 MUST FIX 2건 범위만.
- `COIN_EXCHANGE_AMOUNT = 10` 이므로 템플릿 리터럴 적용 후 토스트 텍스트 출력값은 동일.
  기존 테스트 중 해당 텍스트를 assertion하는 것이 있어도 회귀 없음.
