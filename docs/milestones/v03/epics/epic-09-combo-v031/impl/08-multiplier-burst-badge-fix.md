# 08. MultiplierBurst COMBO BOOST 배지 수평 중앙 정렬 수정 (버그픽스 #89)

> 버그픽스 — 관련 이슈: [#89](https://github.com/alruminum/memory-battle/issues/89)

---

## 버그 근본 원인

`src/components/game/MultiplierBurst.tsx`의 COMBO BOOST 배지(line 123~141)에서
`left: '50%'`만 적용되고 `transform: 'translateX(-50%)'`가 누락되어 있다.

`position: absolute` + `left: '50%'`는 요소의 **왼쪽 끝**을 부모의 50% 위치에 놓는다.
수평 중앙 정렬을 위해서는 요소 너비의 절반만큼 왼쪽으로 이동하는 `transform: 'translateX(-50%)'`가 함께 필요하다.
이 속성이 없으면 배지 전체가 화면 오른쪽으로 치우쳐 표시된다.

### 애니메이션 정의 확인 (추가 분석)

`src/index.css`의 `vb-badge-in` 키프레임을 확인한 결과:

```css
@keyframes vb-badge-in {
  0%   { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.8); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}
```

키프레임이 이미 `translateX(-50%)`를 포함하고 있다. `animation: '... both'` (fill-mode `both`)이므로
애니메이션 재생 중 및 완료 후 `forwards` 상태에서 `translateX(-50%)`가 적용된 transform이 유지된다.

**그러나 `animation-delay: 500ms`가 있고 fill-mode `both`이므로:**
- `backwards` 단계 (delay 중, 0ms~500ms): 키프레임 0% 상태 = `translateX(-50%) translateY(10px) scale(0.8)` + `opacity: 0` 적용
- `forwards` 단계 (완료 후): 키프레임 100% 상태 = `translateX(-50%) translateY(0) scale(1)` 유지

이 분석에 따르면 **애니메이션이 재생되는 동안에는** `translateX(-50%)`가 올바르게 적용된다.
그러나 CSS animation의 `transform`은 inline style의 `transform`을 덮어쓰는 게 아니라 — CSS specificity에서
`animation`이 `style` 속성보다 우선하므로, 실제로는 **inline `transform`이 animation에 의해 무시될 수 있다**.

**근본 원인 재정의**: 현재 inline style에 `transform`이 없기 때문에 혹여 animation이 완료되어
fill 상태가 해제될 경우(예: animation이 `none`으로 재설정되는 코드가 있다면) 배지 위치가 오른쪽으로 튄다.
현재 코드에서는 animation이 `both`로 고정되므로 실제로는 **animation이 translateX(-50%)를 커버**한다.

**따라서 진짜 버그 원인은**: CSS animation `vb-badge-in`의 500ms delay 동안 `backwards` fill 상태가
`opacity: 0`으로 숨겨주는데, 만약 이 delay 전에 배지가 잠깐 렌더링되는 경우 (animation 속성이 적용되기 전)
translateX가 없어서 치우쳐 보일 수 있다. 또한 animation fill-mode 지원이 불완전한 구형 WebView에서
translateX(-50%)가 inline style로 명시되지 않으면 치우쳐 보이는 문제가 생길 수 있다.

---

## 결정 근거

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **A. inline style에 `transform: 'translateX(-50%)'` 추가 (채택)** | 수정 지점 1곳. animation과 inline style이 동일한 translateX를 갖게 되어 fill 상태 변화와 무관하게 일관된 위치 보장. | 채택 |
| **B. 수정 없음 — animation이 이미 커버함** | `vb-badge-in` 키프레임이 `translateX(-50%)`를 포함하므로 정상 동작처럼 보임. 그러나 animation 미지원/delay 전 렌더링에서 취약. | 미채택 |
| **C. `vb-badge-in` 키프레임에서 translateX 제거 + inline으로만 관리** | 관심사 분리 관점에서 clean하나, CSS animation 파일 수정이 추가로 필요. 범위 초과. | 미채택 |

**A 채택 이유:**
- CSS animation specificity가 inline style보다 높으므로 animation 재생 중에는 animation의 transform이 적용됨
- 단, `animation: none`으로 리셋되거나 animation 지원이 없는 환경에서는 inline transform이 fallback으로 동작
- `vb-badge-in` 키프레임과 translateX(-50%) 값이 동일하므로 중복이지만 충돌 없음
- 수정 지점 1곳, 최소 침습

---

## 생성/수정 파일

- `src/components/game/MultiplierBurst.tsx` (수정) — COMBO BOOST 배지 style에 `transform: 'translateX(-50%)'` 추가

---

## 인터페이스 정의

외부 인터페이스 변경 없음. Props, 반환 타입 모두 유지.

```typescript
// 변경 없는 시그니처
interface MultiplierBurstProps {
  multiplier: number
  onComplete: () => void
}
```

---

## 핵심 로직

### Before (line 123~141 COMBO BOOST 배지 style)

```typescript
<div style={{
  position: 'absolute',
  top: 'calc(50% + 52px)',
  left: '50%',
  background: color,
  color: '#000',
  fontFamily: 'var(--vb-font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 2,
  textTransform: 'uppercase' as const,
  padding: '4px 12px',
  borderRadius: 20,
  whiteSpace: 'nowrap' as const,
  animation: 'vb-badge-in 300ms ease-out 500ms both',
  zIndex: 1,
}}>
  COMBO BOOST
</div>
```

### After

```typescript
<div style={{
  position: 'absolute',
  top: 'calc(50% + 52px)',
  left: '50%',
  transform: 'translateX(-50%)',   // ← 추가
  background: color,
  color: '#000',
  fontFamily: 'var(--vb-font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 2,
  textTransform: 'uppercase' as const,
  padding: '4px 12px',
  borderRadius: 20,
  whiteSpace: 'nowrap' as const,
  animation: 'vb-badge-in 300ms ease-out 500ms both',
  zIndex: 1,
}}>
  COMBO BOOST
</div>
```

### 참고: `vb-badge-in` 키프레임 (변경 없음)

```css
@keyframes vb-badge-in {
  0%   { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.8); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}
```

키프레임에 이미 `translateX(-50%)`가 포함되어 있으므로, 애니메이션 재생 중에는 animation transform이 우선 적용되며 inline transform은 fallback으로 동작한다.

---

## 주의사항

- **DB 영향도**: 없음. 레이아웃 전용 수정.
- **Breaking Change 없음**: MultiplierBurst 외부 인터페이스 변경 없음.
- **CSS specificity**: CSS animation은 inline style보다 specificity가 높다. animation 재생 중에는 animation의 transform이 inline transform을 덮어쓴다. 이 동작은 의도한 것으로, inline transform은 animation이 없는 상태에서의 fallback 역할을 한다.
- **animation fill-mode `both`**: delay(500ms) 동안 키프레임 0% 상태(translateX(-50%) 포함)가 적용되므로 delay 중에도 위치가 올바르다.

---

## 테스트 경계

- **단위 테스트 가능**: 없음 — 레이아웃 수정, 시각적 확인 필요
- **통합 테스트 필요**: 없음
- **수동 검증**:
  1. [MANUAL-1] 5연속 풀콤보 달성 → MultiplierBurst 오버레이 표시 시 COMBO BOOST 배지가 화면 수평 중앙에 위치 확인
  2. [MANUAL-2] 배지 애니메이션(fade-in/scale-in) 정상 동작 확인 (transform 충돌 없음)
  3. [MANUAL-3] 배율 표시 숫자(`x2`, `x3` 등) 중앙 정렬 유지 확인 (기존 정렬 회귀 없음)

---

## 수용 기준

| # | 항목 | 대상 | 유형 |
|---|---|---|---|
| AC1 | MultiplierBurst 오버레이에서 COMBO BOOST 배지가 수평 중앙에 표시됨 | MultiplierBurst | MANUAL |
| AC2 | `transform: 'translateX(-50%)'`이 배지 inline style에 포함됨 | MultiplierBurst.tsx | CODE |
| AC3 | 배지 애니메이션 정상 동작 (transform 충돌 없음, 올바른 위치에서 scale-in) | MultiplierBurst | MANUAL |
| AC4 | 게임 로직·점수 계산에 회귀 없음 | 게임 전체 | MANUAL |
