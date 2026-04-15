---
depth: simple
---
# #106 Result Combo Text Fix — MULTIPLIER/ComboIndicator 배율 x 접미사 복원 (3차 수정)

> **3차 수정 컨텍스트**: 2차 수정에서 모든 값의 `x`를 일괄 제거했으나,
> 배율(multiplier)에는 `x`가 의미 단위로 필요함. BEST COMBO(횟수)는 제외.

---

## 수정 파일

- `src/pages/ResultPage.tsx` (수정)
- `src/components/game/ComboIndicator.tsx` (수정)

---

## 현재 코드 상태 (실제 확인)

### ResultPage.tsx (Line 178–179)

```tsx
{ label: 'BEST COMBO',  value: `${fullComboCount}` },         // x 없음 ← 유지
{ label: 'MULTIPLIER',  value: `${Math.floor(maxComboStreak / 5) + 1}` },  // x 없음 ← 복원 대상
```

### ComboIndicator.tsx (Line 77)

```tsx
{multiplier}   // x 없음 ← 복원 대상
```

---

## 수정 사항 상세

### 1. `src/pages/ResultPage.tsx`

MULTIPLIER 값에 `x` 접미사 복원 (Line 179).

```tsx
// 수정 전
{ label: 'MULTIPLIER',  value: `${Math.floor(maxComboStreak / 5) + 1}` },

// 수정 후
{ label: 'MULTIPLIER',  value: `${Math.floor(maxComboStreak / 5) + 1}x` },
```

**결정 근거**: MULTIPLIER는 "배율" — "몇 배"라는 단위가 있으므로 `x` 접미사가 의미를 전달한다. BEST COMBO의 `fullComboCount`는 "몇 번"이라는 횟수 카운트이므로 `x` 불필요. 두 값의 의미 계층이 다르기 때문에 일괄 처리 대신 개별 복원이 맞다.

---

### 2. `src/components/game/ComboIndicator.tsx`

배율 텍스트 렌더링에 `x` 접미사 복원 (Line 77).

```tsx
// 수정 전
{multiplier}

// 수정 후
{multiplier}x
```

**결정 근거**: 컴포넌트 주석이 `/* 우: x{배율} 숫자 */`로 명시되어 있다 — 설계 의도가 `x` 포함임을 직접 기록하고 있다. 또한 게임 HUD에서 "1", "2" 같은 단순 정수는 맥락 없이는 배율임이 불명확하다. `1x`, `2x` 표기가 유저에게 "지금 배율이 몇 배인지"를 즉각 전달한다.

---

## 주의사항

1. **BEST COMBO 값 수정 없음**: `${fullComboCount}`는 횟수 카운트 — `x` 접미사 추가 금지.
2. **COMBO BONUS 값 수정 없음**: `+${comboBonus.toLocaleString()}`는 점수 단위 — 변경 없음.
3. **ComboIndicator 로직 수정 없음**: `multiplier = Math.floor(comboStreak / 5) + 1` 계산식은 정상. 렌더링 텍스트만 변경.
4. **이 두 곳 외에 배율 표시 위치 없음**: 코드베이스 전체에서 `multiplier` 렌더링은 위 두 곳뿐. 추가 탐색 불필요.

---

## 검증 기준

| 케이스 | 기대 결과 |
|---|---|
| 게임 중 콤보 없음(x1) | ComboIndicator 우측 `1x` 표시 |
| 게임 중 5콤보 이상(x2) | ComboIndicator 우측 `2x` 표시 |
| 결과 화면 MULTIPLIER 행 (`maxComboStreak=9`) | `2x` 표시 |
| 결과 화면 BEST COMBO 행 | 숫자만 표시 — `x` 없음 (변경 없음) |
| 결과 화면 COMBO BONUS 행 | `+N,NNN` 형식 유지 (변경 없음) |
