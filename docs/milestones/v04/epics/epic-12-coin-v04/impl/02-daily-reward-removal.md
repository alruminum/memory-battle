---
depth: simple
---
# 02. daily_reward 코드 제거 (F6)

## 결정 근거

- **DB 테이블 물리 삭제 v2 연기**: `daily_reward` 테이블을 즉시 삭제하면 롤백 경로가 없다. 코드에서만 제거하고 DB는 v2로 연기함으로써 데이터 보존 및 롤백 가능성을 확보한다.
- **타입 주석 처리(보존)**: `DailyRewardRow`·`DailyRewardInsert`는 `database.types.ts` 하단 편의 타입 별칭에서 주석 처리한다. `gen:types` 재실행 시 Supabase 테이블이 존재하는 한 기본 타입은 자동 재생성되므로 실제 타입 손실 없음. 단, `index.ts`의 `DailyRewardRow`·`DailyRewardInsert` re-export는 삭제한다.
- **파일 삭제 우선, 리팩 최소화**: `useDailyReward.ts`를 삭제하고 참조 지점(ResultPage, MainPage)에서 import·호출만 제거한다. daily_reward 관련 UI(포인트 수령 완료 문구 등)도 함께 제거한다.
- **ait.ts `grantDailyReward` 유지**: sdk.md 주석에 "Epic 12 완료 후 삭제 예정"으로 명시되어 있으나, 해당 함수는 sdk.md 관리 범위이므로 이 impl에서는 삭제하지 않는다. 호출 지점(ResultPage)에서 call을 제거하는 것으로 충분하다.

---

## 생성/수정 파일

| 파일 | 작업 |
|---|---|
| `src/hooks/useDailyReward.ts` | 삭제 |
| `src/pages/ResultPage.tsx` | `useDailyReward` import·호출 제거, `hasTodayReward`·`grantDailyReward` 관련 분기 제거 |
| `src/pages/MainPage.tsx` | `useDailyReward` import 제거, `hasTodayReward` 조건부 UI 블록 제거 |
| `src/types/index.ts` | `DailyRewardRow`·`DailyRewardInsert` re-export 삭제 |
| `src/__tests__/ResultPage.friend-ranking-removal.test.tsx` (수정) | `vi.mock('../hooks/useDailyReward', ...)` 블록 및 관련 변수 제거 |
| `src/__tests__/ResultPage.ad-placeholder.test.tsx` (수정) | `vi.mock('../hooks/useDailyReward', ...)` 블록 제거 |

---

## 제거 대상 상세

### src/hooks/useDailyReward.ts

파일 전체 삭제. 대체 없음.

### src/pages/ResultPage.tsx

제거할 항목:
```typescript
// 제거할 import
import { useDailyReward } from '../hooks/useDailyReward'

// 제거할 훅 호출
const { hasTodayReward, grantDailyReward } = useDailyReward()

// 제거할 광고 완시청 이후 분기 (useEffect 내)
if (earned && !hasTodayReward) {
  try {
    await grantDailyReward()
    showToastMsg('오늘의 10포인트 지급!')
  } catch {
    showToastMsg('포인트 지급 중 오류가 발생했습니다')
  }
}
```

제거 후 `showAd()` useEffect 구조:
```typescript
async function startAd() {
  try {
    const earned = await showAd()
    if (cancelled) return
    // [v0.4] userEarnedReward → 코인 적립으로 전환 (impl 03에서 구현)
    // earned 변수는 impl 03에서 활용하므로 console 로그 등으로 보존 가능
  } catch {
    // 광고 실패 — 버튼 활성화만 진행
  } finally {
    if (!cancelled) setAdDone(true)
  }
}
```

### src/pages/MainPage.tsx

제거할 항목:
```typescript
// 제거할 import
import { useDailyReward } from '../hooks/useDailyReward'

// 제거할 훅 호출
const { hasTodayReward } = useDailyReward()

// 제거할 조건부 UI 블록 (hasTodayReward && ...)
{hasTodayReward && (
  <div style={{ margin: '12px 20px 0', textAlign: 'center', flexShrink: 0 }}>
    <span style={{ fontSize: 12, color: 'var(--vb-accent)', ... }}>
      오늘 포인트 수령 완료 ✓
    </span>
  </div>
)}
```

### src/types/index.ts

제거할 re-export:
```typescript
// 삭제 대상 (현재 코드)
export type { ScoreRow, ScoreInsert, DailyRewardRow, DailyRewardInsert } from './database.types'

// 변경 후
export type { ScoreRow, ScoreInsert } from './database.types'
```

> `DailyRewardRow`·`DailyRewardInsert`는 `database.types.ts` 하단 편의 타입 별칭에서도 주석 처리 상태여야 한다 (impl 01에서 이미 처리됨).

### src/__tests__/ResultPage.friend-ranking-removal.test.tsx

`useDailyReward.ts`가 삭제되면 해당 파일을 `vi.mock`하는 테스트가 모듈을 찾지 못해 실패한다. 아래 3곳을 제거한다:

```typescript
// 제거 대상 1 — mock 변수 선언 (L35)
const mockGrantDailyReward = vi.fn()

// 제거 대상 2 — vi.mock 블록 (L36~41)
vi.mock('../hooks/useDailyReward', () => ({
  useDailyReward: vi.fn(() => ({
    hasTodayReward: false,
    grantDailyReward: mockGrantDailyReward,
  })),
}))

// 제거 대상 3 — beforeEach 내 reset 호출 (L54)
mockGrantDailyReward.mockResolvedValue(undefined)
```

> `mockGrantDailyReward` 변수 제거 후 `beforeEach` 블록에서 참조가 사라지므로 컴파일 에러 없음. 테스트 로직(TC-1~9) 자체는 수정 불필요.

### src/__tests__/ResultPage.ad-placeholder.test.tsx

```typescript
// 제거 대상 — vi.mock 블록 (L31~33)
vi.mock('../hooks/useDailyReward', () => ({
  useDailyReward: vi.fn(() => ({ hasTodayReward: false, grantDailyReward: vi.fn() })),
}))
```

> 이 파일은 inline 익명 mock이므로 변수 선언·reset 제거 불필요. 해당 블록만 삭제.

---

## 검증 기준

```bash
# 타입 에러 0건
npx tsc --noEmit

# 핵심 소스 범위에서 잔존 심벌 0건
# (gameStore.ts는 orphan 상태로 잔존 — 아래 주의사항 참조)
# (__tests__/ 는 이 impl에서 mock 제거 완료)
grep -r "useDailyReward\|hasTodayReward\|grantDailyReward" \
  src/pages/ src/hooks/ src/lib/  \
  → 0건
```

---

## 주의사항

- `ait.ts`의 `grantDailyReward` 함수 및 `DAILY_REWARD_CODE`·`DAILY_REWARD_AMOUNT` 상수는 이 impl 범위에서 건드리지 않는다. sdk.md에 "v0.4 이후 삭제 예정"으로 명시됨.
- `database.types.ts`의 `DailyRewardRow` 기본 타입(gen:types로 자동 생성)은 유지. 하단 편의 별칭만 주석 처리.
- MainPage에서 `hasTodayReward` 관련 state가 없다면 useDailyReward 훅 자체가 전부이므로 import만 제거하면 된다. 다른 state 의존성이 없는지 확인할 것.
- **`gameStore.ts` orphan state**: `hasTodayReward: boolean`(L21), `hasTodayReward: false`(L51), `setTodayReward`(L24·L54)는 이 impl 완료 후 호출하는 곳이 전혀 없는 dead state가 된다. "수정 금지" 파일이므로 이 impl에서는 제거하지 않는다. Epic 12 전체 완료 시점(impl 07 이후) 일괄 정리 필요 — 정리 전까지 `grep ... src/store/` 결과를 검증 기준 실패로 간주하지 않는다.

---

## 테스트 경계

- `npx tsc --noEmit` 에러 0건
- 앱 실행 후 MainPage에서 "포인트 수령 완료" 문구가 나타나지 않음
- ResultPage 광고 종료 후 포인트 지급 관련 토스트가 나타나지 않음
- adDone 플래그 동작(버튼 활성화)은 변화 없어야 함

---

## 의존 모듈

- **선행**: impl 01 (useCoin 인프라) — `database.types.ts` 편의 타입 주석 처리 이미 완료된 상태 전제
- **이후**: impl 03 (ad-coin-reward) — ResultPage의 `earned` 분기를 코인 적립으로 채움
