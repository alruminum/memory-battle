---
depth: simple
---
# Bugfix #117 — RevivalButton: 코인 부족 시 불필요 렌더링 제거

## 이슈
[#117](https://github.com/alruminum/memory-battle/issues/117) — 코인 < 5 일 때 비활성 부활 버튼 + "코인이 부족합니다" 텍스트가 노출됨

## 근본 원인
`RevivalButton.tsx`에 `canRevive === false` 시 early return null 처리가 누락되어 있다.
현재는 `canRevive` 값과 무관하게 항상 버튼 DOM을 렌더링하고, `disabled` prop + `disabledReason` 텍스트로 UI를 분기한다.

PRD는 "코인 부족 시 부활 UI 자체를 숨긴다"고 규정하므로 disabled 렌더링 경로가 스펙 위반이다.

## 수정 범위

| 파일 | 변경 유형 | 내용 |
|---|---|---|
| `src/components/game/RevivalButton.tsx` | 코드 수정 | `canRevive=false` early return null, `disabledReason` 로직 제거, disabled 스타일 분기 제거 |
| `src/components/game/RevivalButton.test.tsx` | 테스트 재작성 | 기존 "disabled + 텍스트" 검증 → "null 반환" 검증으로 교체 |

> `GameOverOverlay.tsx` 변경 없음 — RevivalButton이 null 반환 시 래퍼 div(marginTop:16)는 사실상 빈 공간이나, 버그 재현 조건에서 시각적 노출 문제가 없으므로 스코프 외.

---

## 1. `src/components/game/RevivalButton.tsx`

### 변경 전 구조

```
canRevive 계산
disabledReason 계산 (revivalUsed / coinBalance < 5 분기)
return (
  <div>
    <button disabled={!canRevive || isProcessing} ...>
      {isProcessing ? '처리 중...' : '🪙 5코인으로 부활'}
    </button>
    {disabledReason && <div>{disabledReason}</div>}  ← 항상 렌더
  </div>
)
```

### 변경 후 구조

```
canRevive 계산
if (!canRevive) return null   ← 추가

return (
  <div onPointerDown stopPropagation>
    <button onPointerDown={isProcessing ? stopProp : onRevive}
            disabled={isProcessing}        ← isProcessing만 남김
            style={{ border: accent, color: accent, ... }}>  ← 단일 스타일 (분기 제거)
      {isProcessing ? '처리 중...' : '🪙 5코인으로 부활'}
    </button>
                                           ← disabledReason div 완전 삭제
  </div>
)
```

### 의사코드 diff

```tsx
// BEFORE
const canRevive = !revivalUsed && coinBalance >= 5

const disabledReason: string | null =
  revivalUsed
    ? '이미 부활을 사용했습니다'
    : coinBalance < 5
      ? `코인이 부족합니다 (현재 ${coinBalance}개)`
      : null

return (
  <div ...>
    <button disabled={!canRevive || isProcessing} ...>
    {disabledReason && <div>{disabledReason}</div>}
  </div>
)

// AFTER
const canRevive = !revivalUsed && coinBalance >= 5
if (!canRevive) return null           // ← 추가

// disabledReason 변수 삭제

return (
  <div ...>
    <button
      onPointerDown={!isProcessing ? onRevive : (e) => e.stopPropagation()}
      disabled={isProcessing}         // ← canRevive 조건 제거 (항상 canRevive=true 보장)
      style={{
        border: '1px solid var(--vb-accent)',  // ← 단일 스타일 (분기 없음)
        color: 'var(--vb-accent)',
        cursor: 'pointer',
        opacity: isProcessing ? 0.6 : 1,
        ...
      }}
    >
      {isProcessing ? '처리 중...' : '🪙 5코인으로 부활'}
    </button>
    {/* disabledReason div 삭제 */}
  </div>
)
```

### 결정 근거
- `canRevive=false`인 경우는 두 가지(`revivalUsed=true`, `coinBalance<5`)이며, 두 경우 모두 부활 버튼을 노출할 필요가 없다.
- PRD: "코인 부족 시 부활 UI 숨김" — disabled 상태로 표시하는 것과 null 반환은 전혀 다른 UX.
- early return null 이후 코드에서 `canRevive`는 항상 true이므로, 버튼의 disabled/스타일 분기가 불필요해진다.

---

## 2. `src/components/game/RevivalButton.test.tsx`

### 기존 테스트 중 변경 필요한 케이스

| 기존 테스트 설명 | 변경 방향 |
|---|---|
| `coinBalance=4 → disabled + "코인이 부족합니다"` | `queryByRole('button') === null` 로 교체 |
| `coinBalance=0 → disabled + "코인이 부족합니다"` | `queryByRole('button') === null` 로 교체 |
| `revivalUsed=true → disabled + "이미 부활을 사용했습니다"` | `queryByRole('button') === null` 로 교체 |
| `revivalUsed=true && coinBalance>=5 → "이미 부활을 사용했습니다"` | `queryByRole('button') === null` 로 교체 |
| `disabled(revivalUsed=true) pointerDown → onRevive 미호출` | 버튼이 null이므로 테스트 방식 조정 |
| `disabled(coinBalance<5) pointerDown → onRevive 미호출` | 버튼이 null이므로 테스트 방식 조정 |

### 추가/유지 테스트

- `canRevive=true이면 disabledReason 텍스트 없음` → 유지 (null 반환 없음 경로)
- `canRevive=false → renders nothing (null)` 케이스를 명시적 테스트로 추가
- `isProcessing=true → disabled + "처리 중..."` → 유지 (canRevive=true 전제)
- 버블링 차단(wrapper stopPropagation) 테스트 → 유지 (canRevive=true 전제)

### 신규 테스트 의사코드

```ts
// canRevive=false 케이스 통합
describe('RevivalButton — canRevive=false → null', () => {
  it('coinBalance=4 → renders nothing', () => {
    const { queryByRole } = render(<RevivalButton {...defaultProps} coinBalance={4} />)
    expect(queryByRole('button')).toBeNull()
  })

  it('coinBalance=0 → renders nothing', () => {
    const { queryByRole } = render(<RevivalButton {...defaultProps} coinBalance={0} />)
    expect(queryByRole('button')).toBeNull()
  })

  it('revivalUsed=true → renders nothing', () => {
    const { queryByRole } = render(<RevivalButton {...defaultProps} revivalUsed={true} />)
    expect(queryByRole('button')).toBeNull()
  })

  it('revivalUsed=true && coinBalance>=5 → renders nothing', () => {
    const { queryByRole } = render(<RevivalButton {...defaultProps} revivalUsed={true} coinBalance={10} />)
    expect(queryByRole('button')).toBeNull()
  })
})
```

---

## 주의사항

- `GameOverOverlay` 의 래퍼 `<div style={{ marginTop: 16 }}>` 는 RevivalButton=null 시에도 DOM에 남는다. 시각적 공간 영향은 무시 가능(height: 0 + 안의 내용 없음)하므로 이번 스코프에서 제외. 후속 개선 시 `canRevive` 조건으로 래퍼 조건부 렌더링 가능.
- `disabled` prop은 `isProcessing`만 남기므로, `canRevive && !isProcessing` 형태의 조건식은 `!isProcessing`으로 단순화.

## 체크리스트

- [ ] `canRevive` false → early return null
- [ ] `disabledReason` 변수 및 렌더링 완전 제거
- [ ] disabled 스타일 분기(border/color/cursor) → 단일 accent 스타일로 교체
- [ ] `disabled={!canRevive || isProcessing}` → `disabled={isProcessing}` 로 단순화
- [ ] 테스트: canRevive=false 케이스 6건 → null 반환 검증으로 재작성
