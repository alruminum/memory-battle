# 15. FloatingScore 색상/크기 임계값 조정

> 관련 이슈: [#86](https://github.com/alruminum/memory-battle/issues/86)

---

## 결정 근거

### 문제

`getLabelColor`가 x1에서 항상 흰색(`#e8e8ea`)을 반환한다. 배율 x2+로 올라가려면 `comboStreak >= 5`(5연속 풀콤보)가 필요한데, 대부분의 유저는 이 임계값에 도달하기 전에 게임이 끝난다. 결과적으로 FloatingScore는 항상 흰색 20px으로만 보이고, 버튼 고유색 연동을 체감하지 못한다.

### 결정

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **A. x1부터 버튼색 + 기본 크기 상향 (채택)** | `getLabelColor`에서 흰색 분기 제거, `getLabelSize` 수식 교체, `getLabelGlow` 임계값 x3→x2로 낮춤 | 채택 |
| B. x1 흰색 유지, 배율 임계값만 낮추기 | comboStreak 기준을 3연속으로 낮춰 x2 진입 용이화 | 미채택 — 게임 밸런스 변경 범위가 크고, 이번 이슈 목표(시각 피드백 즉시 체감)와 다름 |
| C. 크기만 변경, 색상은 그대로 | 기본 크기 키우기만 적용 | 미채택 — 버튼색 연동이 핵심 요구사항 |

**A 채택 이유**: comboStreak 배율 로직(게임 로직)은 변경하지 않고, FloatingScore의 시각 표현 레이어만 수정한다. x1부터 버튼색을 보여주면 유저가 첫 번째 입력부터 고유색 피드백을 받는다. 기본 크기 24px로 상향하면 가독성도 개선된다.

---

## 생성/수정 파일

- `src/components/game/FloatingScore.tsx` (수정) — `getLabelColor`, `getLabelSize`, `getLabelGlow` 함수 변경
- `src/__tests__/FloatingScore.test.ts` (수정) — 변경된 기대값으로 TC 갱신

---

## 인터페이스 정의

함수 시그니처 변경 없음. Props, `FloatingItem` 타입, `BUTTON_COLORS` 매핑 모두 유지.

```typescript
// 시그니처 유지 (변경 없음)
export function getLabelColor(color: ButtonColor, multiplier: number): string
export function getLabelSize(multiplier: number): number
export function getLabelGlow(color: ButtonColor, multiplier: number): string
```

---

## 핵심 로직

### getLabelColor — 흰색 분기 제거

```typescript
// Before
export function getLabelColor(color: ButtonColor, multiplier: number): string {
  if (multiplier === 1) return '#e8e8ea'
  return BUTTON_COLORS[color]
}

// After
export function getLabelColor(color: ButtonColor, multiplier: number): string {
  return BUTTON_COLORS[color]
}
```

### getLabelSize — 기본 크기 상향 + 새 수식

변경 스펙: x1=24, x2=30, x3=36, x4=40, x5+=44

차이값이 등차가 아니므로(+6, +6, +4, +4) 룩업 테이블 방식을 사용한다.

```typescript
// Before
export function getLabelSize(multiplier: number): number {
  return Math.min(20 + (multiplier - 1) * 6, 44)
}

// After
const SIZE_TABLE: Record<number, number> = { 1: 24, 2: 30, 3: 36, 4: 40 }

export function getLabelSize(multiplier: number): number {
  if (multiplier >= 5) return 44
  return SIZE_TABLE[multiplier] ?? 24
}
```

배율별 반환값:

| multiplier | 반환 (px) |
|---|---|
| 1 | 24 |
| 2 | 30 |
| 3 | 36 |
| 4 | 40 |
| 5 이상 | 44 |

### getLabelGlow — 임계값 x3 → x2로 낮춤

```typescript
// Before
export function getLabelGlow(color: ButtonColor, multiplier: number): string {
  if (multiplier < 3) return 'none'
  ...
}

// After
export function getLabelGlow(color: ButtonColor, multiplier: number): string {
  if (multiplier < 2) return 'none'
  ...
}
```

글로우 수식(`strength`, `spread`)은 변경 없음.

---

## 주의사항

- **DB 영향도**: 없음. UI 전용 수정.
- **Breaking Change 없음**: 함수 시그니처 변경 없음. `FloatingScore.tsx`를 임포트하는 곳은 `GamePage.tsx`뿐이며, Props/호출 방식 변경 없음.
- **기존 테스트 TC 업데이트 필수**: `FloatingScore.test.ts`의 F-1 그룹(x1 흰색 기대값), F-2 그룹(크기 기대값), F-3 그룹(x2 글로우 없음 기대값)이 모두 실패한다. 아래 갱신 명세 참조.
- **`getAnimation` 영향 없음**: `multiplier >= 3` 조건 그대로 유지. glow-pulse 애니메이션 임계값 변경 없음.

### 테스트 TC 갱신 명세

#### F-1 (`getLabelColor`) 변경

| TC ID | 기존 기대값 | 변경 기대값 |
|---|---|---|
| F-1-1 | `'#e8e8ea'` (orange, x1) | `'#FF6200'` |
| F-1-2 | `'#e8e8ea'` (blue, x1) | `'#0A7AFF'` |
| F-1-3 | `'#e8e8ea'` (green, x1) | `'#18B84A'` |
| F-1-4 | `'#e8e8ea'` (yellow, x1) | `'#F5C000'` |

F-1-5~F-1-8 (x2 이상): 기대값 변경 없음.

#### F-2 (`getLabelSize`) 변경

| TC ID | 기존 기대값 | 변경 기대값 |
|---|---|---|
| F-2-1 (x1) | `20` | `24` |
| F-2-2 (x2) | `26` | `30` |
| F-2-3 (x3) | `32` | `36` |
| F-2-4 (x4) | `38` | `40` |
| F-2-5 (x5) | `44` | `44` (변경 없음) |
| F-2-6 (x6) | `44` | `44` (변경 없음) |
| F-2-7 (x10) | `44` | `44` (변경 없음) |

#### F-3 (`getLabelGlow`) 변경

| TC ID | 기존 기대값 | 변경 기대값 |
|---|---|---|
| F-3-1 (x1, orange) | `'none'` | `'none'` (변경 없음 — x1은 여전히 'none') |
| F-3-2 (x2, blue) | `'none'` | 글로우 문자열 반환 (not 'none') |

F-3-2를 포함해 x2 케이스 기대값 갱신 필요. 수치 계산:
- x2, orange: `strength = 8 + 2*4 = 16`, `spread = 20 + 2*6 = 32` → `'0 0 16px #FF6200, 0 0 32px #FF620088'`

F-3-3~F-3-8 (x3 이상): 변경 없음.

---

## 테스트 경계

- **단위 테스트 가능**: `getLabelColor`, `getLabelSize`, `getLabelGlow` — 순수 함수, `src/__tests__/FloatingScore.test.ts`에서 커버
- **통합 테스트 필요**: 없음
- **수동 검증**:
  1. [MANUAL-1] 게임 시작 후 첫 번째 버튼 입력 시 FloatingScore가 해당 버튼 고유색(orange=#FF6200, blue=#0A7AFF 등)으로 표시되는지 확인
  2. [MANUAL-2] x1 입력 시 FloatingScore 크기가 기존 20px보다 커 보이는지(24px) 시각 확인
  3. [MANUAL-3] x2 달성(5연속 풀콤보) 후 FloatingScore에 약한 글로우 효과가 적용되는지 확인 (기존 x3 기준 → x2로 낮아짐)
  4. [MANUAL-4] x5 이상에서 44px + 강 글로우 유지 (회귀 없음)

---

## 수용 기준

| # | 항목 | 유형 |
|---|---|---|
| AC1 | x1 입력 시 FloatingScore 색상이 버튼 고유색(#FF6200 등)으로 표시됨 | (TEST) |
| AC2 | x1=24px, x2=30px, x3=36px, x4=40px, x5+=44px | (TEST) |
| AC3 | x1 글로우 없음(`'none'`), x2+ 글로우 적용 | (TEST) |
| AC4 | `FloatingScore.test.ts` 전체 TC PASS | (TEST) |
| AC5 | 게임 내 첫 버튼 입력부터 버튼 고유색 FloatingScore 표시 (시각 확인) | (BROWSER:DOM) |
| AC6 | x2 달성 시 약한 글로우 적용 확인 (5연속 풀콤보 달성 후) | (MANUAL) |
