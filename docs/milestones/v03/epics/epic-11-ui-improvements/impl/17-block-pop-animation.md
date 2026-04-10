# 17. blockPop 애니메이션 강화 (fill + brightness burst)

> 관련 이슈: [#93](https://github.com/alruminum/memory-battle/issues/93)

## 결정 근거

- **`filter: brightness()` 를 기존 `blockPop` @keyframes에 직접 추가**: 블록 element에 이미 `animation: 'blockPop 0.3s ease'`가 인라인으로 적용되어 있으므로, 같은 @keyframes에 brightness를 추가하는 것이 최소 변경 경로. 별도 `@keyframes blockGlow`를 추가하고 `animation` 속성을 쉼표로 연결하는 방법도 있으나, 동기화 타이밍을 별도로 맞춰야 해 오히려 복잡해진다.
- **brightness 2.8x 선택**: `--vb-accent`(#D4A843, 황금색)가 2.8x에서 거의 화이트-옐로우로 발광 → "불이 탁 켜지는" 플래시 효과. 2x이하는 임팩트 약함, 3.5x 이상은 화면 전체가 번쩍이는 느낌으로 과함.
- **peak를 65%로 이동 (기존 70%)**: scaleY가 1.12로 overshoot하는 순간 brightness도 peak → "꽉 차는 순간 불이 켜지는" 동기화. 기존 70%에서 살짝 앞당겨 더 즉각적인 느낌.
- **80% 중간 keyframe 유지 (brightness 1.5)**: 100%에서 바로 1.0으로 떨어지면 플래시가 너무 급격히 꺼짐. 1.5 경유로 은은하게 꺼지는 "잔열" 효과.
- **채워진 모든 블록에 `boxShadow` amber glow 추가**: blockPop 애니메이션은 방금 채워진 블록에만 실행되나, 이미 채워진 블록에도 지속적 glow를 부여하면 "전체가 불 켜진 등" 처럼 보여 콤보 상태를 한눈에 파악 가능. `0 0 7px 2px rgba(212, 168, 67, 0.5)` — 7px blur, 2px spread, 50% opacity.
- **버린 대안**: 별도 CSS class + className 전환 — 현재 ComboIndicator는 모든 스타일이 인라인으로 작성되어 있고 일관성을 깨뜨릴 필요가 없다. className 추가는 향후 테마 지원이 필요할 때 리팩터링하면 됨.

---

## 생성/수정 파일

- `src/index.css` (수정) — `@keyframes blockPop` 키프레임에 `filter: brightness()` 추가
- `src/components/game/ComboIndicator.tsx` (수정) — 채워진 블록에 `boxShadow` amber glow 추가

---

## 인터페이스 정의

```typescript
// ComboIndicatorProps — 변경 없음
interface ComboIndicatorProps {
  comboStreak: number
}

// 블록 스타일 파생값 (컴포넌트 내부) — 변경 사항만 표시
// [신규] isFilled 블록에 boxShadow 추가
const blockStyle = {
  width: 10,
  height: h,
  borderRadius: '2px 2px 0 0',
  background: isFilled ? 'var(--vb-accent)' : 'var(--vb-border)',
  transformOrigin: 'bottom',
  animation: (isFilled && i === filledCount - 1) ? 'blockPop 0.3s ease' : 'none',
  // [신규] 채워진 블록에 amber glow
  boxShadow: isFilled ? '0 0 7px 2px rgba(212, 168, 67, 0.5)' : 'none',
}
```

---

## 핵심 로직

### `src/index.css` — @keyframes blockPop 변경

```css
/* 변경 전 */
@keyframes blockPop {
  0%  { transform: scaleY(0); }
  70% { transform: scaleY(1.1); }
  100%{ transform: scaleY(1); }
}

/* 변경 후 */
@keyframes blockPop {
  0%   { transform: scaleY(0);    filter: brightness(1);   }
  65%  { transform: scaleY(1.12); filter: brightness(2.8); }  /* fill peak + 불 켜지는 순간 */
  80%  { transform: scaleY(1.06); filter: brightness(1.5); }  /* 잔열 */
  100% { transform: scaleY(1);    filter: brightness(1);   }
}
```

**타이밍 해설:**
- `0% → 65%`: 0.195s — scaleY 0에서 1.12으로 올라오면서 brightness도 1→2.8로 상승. "쭉 들어가면서 불이 켜지는" 구간.
- `65%`: 0.195s 지점 — scaleY/brightness 동시 peak. 블록이 꽉 찬 순간 최대 발광.
- `65% → 80%`: 0.045s — overshoot 되돌아오면서 brightness 1.5로 빠르게 감소. "불이 안정되는" 구간.
- `80% → 100%`: 0.06s — 최종 안정. brightness 잔열 소멸.

### `src/components/game/ComboIndicator.tsx` — boxShadow 추가

```typescript
// 변경: 블록 div style 객체에 boxShadow 프로퍼티 추가
<div
  key={i}
  style={{
    width: 10,
    height: h,
    borderRadius: '2px 2px 0 0',
    background: isFilled ? 'var(--vb-accent)' : 'var(--vb-border)',
    transformOrigin: 'bottom',
    animation: (isFilled && i === filledCount - 1) ? 'blockPop 0.3s ease' : 'none',
    boxShadow: isFilled ? '0 0 7px 2px rgba(212, 168, 67, 0.5)' : 'none',  // [신규]
  }}
/>
```

---

## 주의사항

- **Breaking Change 없음**: `ComboIndicatorProps` 인터페이스 변경 없음. 호출부(`GamePage.tsx`) 변경 불필요.
- **`filter: brightness()` 성능**: 블록 element는 10×8~16px로 매우 작음. WebView에서 filter 적용 시 GPU 레이어 생성이 발생하지만 크기가 작아 성능 영향 무시 가능. 단, 5개 블록이 동시에 애니메이션되는 경우는 없음(방금 추가된 블록 1개에만 적용).
- **`boxShadow`와 `transformOrigin: bottom` 충돌 없음**: `transform: scaleY()`는 boxShadow에 영향 안 줌. scaleY 애니메이션 중 boxShadow glow는 항상 최종 크기 기준으로 렌더링됨. 의도된 동작.
- **comboStreak=0 케이스**: `if (comboStreak === 0) return null` → 컴포넌트 자체가 렌더링 안 됨. 영향 없음.
- **filledCount=0 케이스** (배율 상승 직후): 모든 블록 `isFilled=false` → boxShadow 모두 `'none'`. blockPop 미실행. 정상.
- **DB 영향도**: 없음.

---

## 테스트 경계

- 단위 테스트 가능: 없음 (CSS 애니메이션 + 시각 효과)
- 통합 테스트 필요: 없음
- 수동 검증:
  - comboStreak=1 → 블록 1칸 채워지며 blockPop 실행: scaleY 올라오면서 황금색 밝게 번쩍 → amber glow 잔류 확인
  - comboStreak=2~4 → 새 블록에만 brightness burst 실행, 기존 채워진 블록은 glow만 표시 확인
  - brightness burst가 너무 강해 주변 UI를 침범하지 않는지 확인 (블록 크기 작아 영향 없어야 함)
  - 빠른 연타(1초 이내 comboStreak 연속 증가) 시 애니메이션 중단 없이 다음 블록으로 이동하는지 확인
  - comboStreak=5 (배율 상승 직후) → 전체 블록 빈 상태 + glow 없음 확인
