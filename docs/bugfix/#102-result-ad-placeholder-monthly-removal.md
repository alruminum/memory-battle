---
depth: std
---
# #102 feat — ResultPage 광고 placeholder 추가 및 monthly 텍스트 제거

> 원래 이슈: [#102](https://github.com/alruminum/memory-battle/issues/102)
> Pencil Frame: `uAYzL` (ResultPage)

---

## 개요

Pencil 캔버스 확정 디자인(Frame `uAYzL`) 기반 ResultPage 3건 변경.

| # | Pencil Node | 변경 | 코드 현황 |
|---|---|---|---|
| 1 | `0zRgI` | 친구랭킹보기 버튼 제거 | **#101에서 이미 완료 — 이 impl에서 SKIP** |
| 2 | `v8VaE` | monthly 포인트 텍스트 제거 | 제거 필요 |
| 3 | `OgBY8` | rAdPlaceholder 신규 추가 | 추가 필요 |

---

## 결정 근거

### D1 — 친구랭킹보기 버튼 (#101 중복)

이슈 #101(`docs/bugfix/#101-result-friend-ranking-removal.md`)에서 이미 `handleFriendRanking` + import + JSX 3곳 모두 제거 완료.
현재 `ResultPage.tsx`에 해당 버튼 없음. **본 impl에서 추가 작업 없음.**

### D2 — monthly 포인트 텍스트 제거 방식

| 옵션 | 설명 | 채택 |
|---|---|---|
| **Monthly 행 sub prop 제거 (채택)** | `sub: undefined` 고정, `monthName` 변수 삭제 | ✅ |
| Monthly 행 전체 제거 | 랭킹 3개 행(Daily/Monthly/Season) 중 Monthly 삭제 | ❌ — Monthly 순위 표시 자체는 PRD 유지 항목 |

Monthly 랭킹 순위(rank 숫자)는 유지, 하단 포인트 지급 예정 안내 텍스트만 제거.
`monthName` 변수는 해당 sub 텍스트에서만 사용 → 함께 제거(dead code).

### D3 — 광고 placeholder 위치

```
레이아웃 순서:
  GAME OVER 텍스트
  최종 점수 카드
  COMBO STATS 카드 (조건부)
  랭킹 리스트
  [🆕] 광고 placeholder (96px)   ← 여기 삽입
  버튼 영역 (marginTop: auto)
```

버튼 영역 직전 배치 이유:
- 광고는 하단 고정 영역에 가까울수록 노출 효과 높음
- 버튼 영역 `marginTop: 'auto'`가 스크롤 없이 광고+버튼을 하단에 묶는 자연스러운 구조 제공
- 랭킹 리스트 바로 아래 = 콘텐츠 소비 후 자연스러운 시선 이동

| 옵션 | 채택 |
|---|---|
| **랭킹 리스트 아래 (채택)** | ✅ |
| 버튼 영역 내부 삽입 | ❌ — 버튼 그룹 의미 혼재 |
| 페이지 최상단 | ❌ — Pencil 디자인과 불일치 |

---

## 수정 파일

- `src/pages/ResultPage.tsx` (수정)
- `src/__tests__/ResultPage.ad-placeholder.test.tsx` (신규)

---

## ResultPage.tsx

### 제거 대상

#### ① `monthName` 변수 (Line 78)

```typescript
// 제거 — monthly sub 텍스트 삭제로 dead code
const monthName = new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2
```

#### ② Monthly 행 `sub` 프로퍼티 (Line 219~221)

```typescript
// 변경 전
{
  label: 'Monthly',
  rank: myRanks.monthly,
  highlight: false,
  sub: myRanks.monthly > 0 ? `${monthName}월 1일에 포인트 지급 예정` : undefined,
},

// 변경 후
{
  label: 'Monthly',
  rank: myRanks.monthly,
  highlight: false,
  sub: undefined,
},
```

> `sub: undefined` 명시는 배열 구조 일관성 유지. TypeScript에서 옵셔널이므로 `sub` 프로퍼티 자체를 삭제해도 무방하나 가독성 위해 명시 유지.

### 추가 대상 — 광고 placeholder (랭킹 리스트 `</div>` 직후 삽입)

```tsx
{/* 광고 placeholder */}
<div
  data-testid="ad-placeholder"
  style={{
    margin: '12px 20px 0',
    height: 96,
    backgroundColor: '#1a1a1d',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    flexShrink: 0,
  }}
/>
```

**스타일 근거 (Pencil Node `OgBY8` 스펙):**
- `height: 96` → 디자인 명세 96px
- `backgroundColor: '#1a1a1d'` → 디자인 명세 fill
- `border: '1px solid rgba(255,255,255,0.1)'` → 디자인 명세 stroke
- `borderRadius: 8` → 기존 카드(점수, 콤보, 랭킹)와 동일 8px 적용. Pencil 명세 미지정이므로 시각 통일성 기준으로 결정
- `flexShrink: 0` → 세로 flex 컨테이너에서 높이 고정 보장

---

## ResultPage.ad-placeholder.test.tsx

### 테스트 목적

1. monthly 포인트 텍스트가 렌더링되지 않는다
2. 광고 placeholder div(96px 영역)가 렌더링된다
3. 기존 버튼 구성 회귀 없음 (PLAY AGAIN + View Rankings 2개 유지)

### Mock 설정

TC-1/TC-3/TC-4/TC-5는 `monthly: 3` 케이스 mock을 공유한다.  
TC-2는 `monthly: 0`이 필요하므로 **별도 `describe` 블록 + 해당 블록 내 `beforeEach`로 분리**한다.

#### 파일 레벨 공통 mock (TC-1, TC-3, TC-4, TC-5 공유)

```typescript
// 파일 최상단 vi.mock — monthly: 3 기본값
vi.mock('../store/gameStore', () => ({
  useGameStore: vi.fn(() => ({
    score: 250, stage: 5, userId: 'user-test-102',
    baseScore: 200, fullComboCount: 1, maxComboStreak: 5,
  })),
}))

vi.mock('../hooks/useRanking', () => ({
  useRanking: vi.fn(() => ({
    daily: [],
    myRanks: { daily: 0, monthly: 3, season: 0 },
    isLoading: false,
    submitScore: vi.fn(),
  })),
}))

vi.mock('../hooks/useRewardAd', () => ({
  useRewardAd: vi.fn(() => ({ show: vi.fn().mockResolvedValue(false), isLoading: false })),
}))

vi.mock('../hooks/useDailyReward', () => ({
  useDailyReward: vi.fn(() => ({ hasTodayReward: false, grantDailyReward: vi.fn() })),
}))
```

#### TC-2 전용 블록 — monthly=0 케이스

```typescript
import { useRanking } from '../hooks/useRanking'

describe('monthly=0일 때 포인트 텍스트 미표시', () => {
  beforeEach(() => {
    // monthly: 0으로 override
    vi.mocked(useRanking).mockReturnValue({
      daily: [],
      myRanks: { daily: 0, monthly: 0, season: 0 },
      isLoading: false,
      submitScore: vi.fn(),
    })
  })

  it('TC-2: monthly=0 시 포인트 지급 텍스트 미렌더링', () => {
    const { queryByText } = render(<ResultPage />)
    expect(queryByText(/월 1일에 포인트 지급/)).toBeNull()
  })
})
```

> **근거**: `vi.mocked(useRanking).mockReturnValue(...)` 패턴은 `beforeEach`에서 호출마다 새 값을 반환하므로  
> 파일 레벨 `vi.mock` 기본값을 오염시키지 않는다. `afterEach`에서 `vi.restoreAllMocks()` 없이도 블록 내 격리 보장.

### 테스트 케이스

| ID | 설명 | 기대 결과 |
|---|---|---|
| TC-1 | monthly > 0일 때 "월 1일에 포인트 지급" 텍스트 렌더링 여부 | `queryByText(/월 1일에 포인트 지급/)` → null |
| TC-2 | monthly = 0일 때 "월 1일에 포인트 지급" 텍스트 렌더링 여부 | `queryByText(/월 1일에 포인트 지급/)` → null |
| TC-3 | 광고 placeholder 96px 영역 확인 | `data-testid="ad-placeholder"` 존재 (또는 style 쿼리) |
| TC-4 | 버튼 정확히 2개 유지 | `getAllByRole('button')` → length 2 |
| TC-5 | Monthly 행 자체는 여전히 표시됨 | `getByText('Monthly')` → in document |

> **TC-3 구현 방법**: `data-testid="ad-placeholder"` 속성을 placeholder div에 추가하고 `getByTestId('ad-placeholder')`로 쿼리. style 직접 쿼리는 fragile하므로 testid 사용.

---

## 주의사항

- **`monthName` 변수 제거 후 TypeScript 컴파일 확인** — 템플릿 리터럴 `${monthName}` 참조가 남지 않도록 검증 (`npm run build`).
- **Monthly 랭킹 순위 숫자 표시 유지** — `rank: myRanks.monthly` 및 `rankDisplay()` 함수는 건드리지 않는다.
- **View Rankings 버튼 유지** — `onGoRanking` 콜백 버튼은 PRD 명시 기능. 제거 금지.
- **adDone / PLAY AGAIN 로직 비접촉** — 광고 placeholder는 순수 시각 요소. 광고 흐름 로직 무관.
- **기존 테스트 영향**: `ResultPage.friend-ranking-removal.test.tsx` TC-7 "버튼이 정확히 2개"는 버튼 추가 없으므로 계속 PASS 예상.
- **DB 영향도**: 없음.
- **다른 모듈 의존**: 없음. `ResultPage.tsx` 단독 수정.

---

## 수동 검증

| ID | 시나리오 | 기대 동작 |
|---|---|---|
| RV-1 | 게임 종료 후 결과 화면 진입 | Monthly 랭킹 행에 "월 1일에 포인트 지급 예정" 텍스트 미표시 |
| RV-2 | 결과 화면 스크롤 | 랭킹 리스트 아래 96px 어두운 placeholder 박스 표시 |
| RV-3 | 광고 placeholder 영역 | 클릭/상호작용 없음, 배경 #1a1a1d, 테두리 연한 흰색 |
| RV-4 | PLAY AGAIN / View Rankings 버튼 동작 | 기존과 동일 |
| RV-5 | 친구 랭킹 보기 버튼 | 미표시 (회귀 없음) |
