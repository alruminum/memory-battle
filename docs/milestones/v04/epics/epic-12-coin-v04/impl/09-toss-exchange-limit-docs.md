---
depth: simple
---
# impl-09: toss-exchange-limit — 문서 현행화 (docs only)

> **관련 이슈**: #158 — F5: 5,000 토스포인트 누적 교환 한도
> **범위**: 문서 2건만 (코드·테스트 완료, 389/389 pass)
> **커밋 스코프**: `docs`

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `docs/db-schema.md` | `[v0.4.2] get_lifetime_exchanged` RPC DDL 서브섹션 추가 |
| `docs/sdk.md` | 섹션 제목 업데이트 + v0.4.2 한도 포함 호출 흐름 블록 추가 |

---

## 1. `docs/db-schema.md` 변경 상세

### 위치
`## [v0.4] 코인 RPC 함수` 섹션 내, `add_coins` 클라이언트 호출 예시 블록 다음, `---` 구분선 **앞**에 삽입.

### 추가할 서브섹션

```
### [v0.4.2] get_lifetime_exchanged — F5 누적 교환 포인트 조회
```

**설명**: 1인 누적 5,000 토스포인트 한도(앱인토스 프로모션 정책) 체크용. `coin_transactions` 합산 기반 SSoT.

**DDL**:
```sql
CREATE OR REPLACE FUNCTION get_lifetime_exchanged(p_user_id TEXT)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(-amount), 0) INTO v_total
    FROM coin_transactions
   WHERE user_id = p_user_id AND type = 'toss_points_exchange' AND amount < 0;
  RETURN v_total;
END; $$;
```

**선택 근거**:
- `user_coins`에 컬럼 추가 방식 → `coin_transactions`와 이중 진실 발생 + 기존 `add_coins` 수정·백필 필요
- 교환 이력이 `coin_transactions`에 이미 기록되므로 SUM 집계 = 단일 진실 원칙 부합
- 최대 500회 + 기존 인덱스(`idx_coin_tx_user_id`) 하에서 성능 무시 가능

**클라이언트 호출**:
```typescript
const { data, error } = await supabase.rpc('get_lifetime_exchanged', { p_user_id: userId })
// data: INTEGER (누적 교환 포인트 합계)
```

---

## 2. `docs/sdk.md` 변경 상세

### 위치
`## 프로모션 리워드 지급 (grantPromotionReward) ⚠️ v0.4 변경` 섹션.

### 변경 내용

1. **섹션 제목 수정**: `⚠️ v0.4 변경` → `⚠️ v0.4 / v0.4.2 한도 추가`

2. **기존 `호출 흐름 (v0.4)` 블록 유지** (삭제 금지)

3. **새 블록 추가** — 기존 흐름 블록 아래에 삽입:

```
호출 흐름 (v0.4.2 한도 포함):
  ResultPage 마운트 → useCoin.getLifetimeExchanged()
    → supabase.rpc('get_lifetime_exchanged')
    → useGameStore.setLifetimeExchanged(total)

  교환 버튼 활성 조건: balance ≥ 10 AND lifetimeExchanged < 5,000

  교환 버튼 탭
    → grantCoinExchange()           ← lib/ait.ts
    → SDK 성공
    → useCoin.addCoins(-10, 'toss_points_exchange')
        └── Supabase: user_coins balance-=10 + coin_transactions INSERT
    → setLifetimeExchanged(current + 10)  ← 로컬 즉시 갱신
    → lifetimeExchanged ≥ 5,000 도달 시 버튼 즉시 disabled 전환

> 정책 근거: 앱인토스 프로모션 정책 — 1인 누적 5,000 토스포인트 한도.
> 초과 교환 불가, 최대 500회.
```

---

## 결정 근거

| 결정 | 근거 |
|---|---|
| `get_lifetime_exchanged` = RPC(SUM) 방식 | `coin_transactions` SSoT 유지, 기존 `add_coins` 무수정 |
| `user_coins` 컬럼 추가 방식 불채택 | 이중 진실 + 백필 필요 → 복잡도 증가 |
| 로컬 즉시 갱신(`setLifetimeExchanged`) | 교환 직후 재조회 없이 UI 즉시 비활성화 → UX 개선 |
| 기존 `호출 흐름 (v0.4)` 블록 유지 | 히스토리 추적 가능성 보존 |

---

## 주의사항

- `src/**` 수정 없음 — 코드·테스트 이미 완료
- 테스트 389/389 통과 상태 유지 확인 필수
- 커밋 스코프: `docs(store): ...` 또는 `docs: get_lifetime_exchanged RPC 문서 추가 (#158)`
