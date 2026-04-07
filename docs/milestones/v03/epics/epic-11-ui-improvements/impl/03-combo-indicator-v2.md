# 03. ComboIndicator 블록 UI v2

> 관련 이슈: [#54](https://github.com/alruminum/memory-battle/issues/54)

## 결정 근거

- **Variant B 블록 스타일 채택**: 5칸 블록(높이 차등)은 현재 콤보 진행상황을 한눈에 파악 가능하게 한다. 게이지 바(Variant A)보다 개별 스텝을 명확히 표현하고, 숫자 카운터(Variant C)보다 시각적 피드백이 직관적이다.
- **`x{배율}` 숫자 강조**: 현재 `x1 COMBO STREAK` 텍스트 대신 좌측 블록 + 우상단 `x{배율}` 큰 숫자로 분리. 배율 숫자가 더 크고 명확하게 표시되어 점수 배율 의식을 강화한다.
- **높이 차등 블록**: 5칸 블록 높이를 `[8, 10, 12, 14, 16]` px로 차등 설정해 블록이 차오를수록 시각적으로 상승하는 느낌을 부여한다.
- **`nextThreshold` 계산**: `(Math.floor(comboStreak / 5) + 1) * 5` — 다음 배율 상승 시점까지 남은 블록 개수를 도출하기 위한 기준값. 현재 사이클 내 진행도(pos)는 `comboStreak % 5`.
- **`blockPop` 애니메이션**: 블록이 새로 채워질 때 scaleY: 0 → 1.1 → 1 로 팝핑. `transform-origin: bottom`으로 아래에서 위로 팝업하는 효과.
- **comboStreak === 0 시 null 반환 유지**: 현행 동작 유지. 이 경우 ComboIndicator를 렌더링하지 않아 레이아웃 공간은 GamePage의 `minHeight: 56` wrapper가 확보한다.
- **버린 대안**:
  - Variant A 게이지 바: 개별 단계 감각이 약함. 제외.
  - Variant C 숫자 카운터: 현재 streak 숫자와 next threshold를 함께 보여주는 방식이 복잡. 제외.

---

## 생성/수정 파일

- `src/components/game/ComboIndicator.tsx` (수정) — 5칸 블록 + x{배율} 숫자 UI로 전면 재작성
- `src/index.css` (수정) — `@keyframes blockPop` 추가

---

## 인터페이스 정의

```typescript
// ComboIndicatorProps — 변경 없음
interface ComboIndicatorProps {
  comboStreak: number  // 현재 연속 풀콤보 스트릭 (0이면 null 반환)
}

// 내부 파생값 계산 (컴포넌트 내부)
const multiplier: number = Math.floor(comboStreak / 5) + 1   // 현재 배율 (x1~)
const posInCycle: number = comboStreak % 5                   // 현재 사이클 내 위치 (0~4)
// filledCount: 현재 사이클 내 채워진 블록 수
// 예: comboStreak=7 → posInCycle=2 → 블록 2칸 채움, 배율 x2
// 예: comboStreak=10 → posInCycle=0 → 막 배율 상승 직후 → 0칸 채움, 배율 x3
const filledCount: number = posInCycle  // 0~4

// 블록 높이 배열 (5칸)
const BLOCK_HEIGHTS: number[] = [8, 10, 12, 14, 16]  // px, 낮은→높은 순
```

---

## 핵심 로직

### `src/index.css` — @keyframes blockPop 추가

```css
/* 콤보 블록 채워질 때 팝 애니메이션 */
@keyframes blockPop {
  0%  { transform: scaleY(0); }
  70% { transform: scaleY(1.1); }
  100%{ transform: scaleY(1); }
}
```

### `src/components/game/ComboIndicator.tsx` — 전면 재작성

```typescript
const BLOCK_HEIGHTS = [8, 10, 12, 14, 16]  // px, 인덱스 0(좌)→4(우), 높이 차등

interface ComboIndicatorProps {
  comboStreak: number
}

export function ComboIndicator({ comboStreak }: ComboIndicatorProps) {
  if (comboStreak === 0) return null

  const multiplier = Math.floor(comboStreak / 5) + 1
  const filledCount = comboStreak % 5   // 0: 막 배율 상승 직후(빈 상태), 1~4: 진행 중

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '4px 14px',
    }}>
      {/* 좌: 블록 5칸 */}
      <div style={{
        display: 'flex',
        gap: 3,
        alignItems: 'flex-end',
        height: 20,   // 최대 블록 높이(16) + 여유
      }}>
        {BLOCK_HEIGHTS.map((h, i) => {
          const isFilled = i < filledCount
          return (
            <div
              key={i}
              style={{
                width: 10,
                height: h,
                borderRadius: '2px 2px 0 0',
                background: isFilled ? 'var(--vb-accent)' : 'var(--vb-border)',
                transformOrigin: 'bottom',
                // filledCount가 변경될 때 새로 채워지는 블록(isFilled && i === filledCount - 1)에만 애니메이션
                animation: (isFilled && i === filledCount - 1) ? 'blockPop 0.3s ease' : 'none',
              }}
            />
          )
        })}
      </div>

      {/* 우: x{배율} 숫자 */}
      <div style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 18,
        fontWeight: 900,
        color: 'var(--vb-accent)',
        lineHeight: 1,
      }}>
        x{multiplier}
      </div>
    </div>
  )
}
```

> **blockPop 애니메이션 적용 조건**: `isFilled && i === filledCount - 1` — 현재 사이클에서 방금 채워진 마지막 블록(가장 최근 추가된 블록)에만 애니메이션 적용. 이미 채워진 블록들은 `animation: 'none'`으로 재실행 방지.
>
> **filledCount === 0 케이스**: comboStreak가 5의 배수일 때(배율 상승 직후). 모든 블록이 빈 상태로 표시되고 `x{배율}` 숫자가 상승. 별도 처리 불필요 — `i < 0`는 항상 false이므로 모든 블록이 empty 스타일.

---

## 주의사항

- **Breaking Change 없음**: `ComboIndicatorProps` 인터페이스(`comboStreak: number`) 변경 없음. `GamePage.tsx`에서 `<ComboIndicator comboStreak={comboStreak} />` 호출 방식 변경 없음.
- **GamePage wrapper minHeight**: GamePage.tsx의 ComboIndicator wrapper div는 현재 `minHeight: 56`이다. 최대 블록 높이(16px) + padding으로 충분히 수용 가능. wrapper 변경 불필요.
- **배율 x1 시 표시**: `comboStreak >= 1`이면 표시 (0이면 null). x1 표시가 의미없어 보일 수 있지만, comboStreak가 1 이상이면 콤보가 시작됐음을 알려주는 UI이므로 유지.
- **`getComboMultiplier` 재사용 여부**: `GamePage.tsx`에서 `getComboMultiplier(comboStreak)`를 이미 호출해 `currentMultiplier`를 계산하고 `MultiplierBurst`에 전달한다. `ComboIndicator` 내부에서 `Math.floor(comboStreak / 5) + 1`을 직접 계산해도 동일 결과. 함수 import를 추가하는 것도 허용되나 단순 수식이므로 내부 계산으로 유지.
- **DB 영향도**: 없음.

---

## 테스트 경계

- 단위 테스트 가능: 없음 (렌더링 컴포넌트)
- 통합 테스트 필요: 없음
- 수동 검증:
  - comboStreak=0 → ComboIndicator null 렌더링 확인 (공간 빈칸만 표시)
  - comboStreak=1~4 → 블록 1~4칸 채움 + `x1` 표시 확인
  - comboStreak=5 → 블록 0칸(빈 상태) + `x2` 표시 확인 (배율 상승 직후)
  - comboStreak=6 → 블록 1칸 채움 + `x2` 표시 확인
  - comboStreak=10 → 블록 0칸(빈 상태) + `x3` 표시 확인
  - 블록이 채워질 때 마지막 블록(방금 채워진 블록)에 blockPop 애니메이션(아래에서 팝업) 확인
  - 이미 채워진 블록은 재애니메이션 없이 정지 상태 유지 확인
  - 블록 높이가 좌→우 방향으로 8→16px로 차등 적용되는지 확인
