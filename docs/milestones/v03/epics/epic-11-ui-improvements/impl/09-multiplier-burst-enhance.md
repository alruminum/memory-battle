# 09. MultiplierBurst 이펙트 강화 (Variant B — Dim Burst)

> 관련 이슈: [#77](https://github.com/alruminum/memory-battle/issues/77)

---

## 결정 근거

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **Variant B (채택)** | 배경 방사형 dim + 파티클 16개 폭발 + COMBO BOOST 배지. 총 1800ms. 인지성 9 / 임팩트 9 / 비침습성 8. | 채택 |
| Variant A — Glow Ring | 96px 텍스트 + 동심원 링 3개 + 텍스트 펄스. 총 1700ms. 배경 dim 없어 최소 침습적이나 임팩트 7로 소박. | 미채택 |
| Variant C — Full Impact | 화면 플래시 + 동심원 파동 + 광선 streaks. 총 2000ms. 임팩트 10이나 플래시가 게임 흐름을 과도하게 중단. | 미채택 |

**Variant B 채택 이유:**
- 유저 리포트 "배율 상승을 잘 모르겠다"에 직접 대응하면서도 Variant C의 플래시보다 비침습적
- 배경 dim으로 게임 화면과 명확히 분리 → 순간 인지성 확보
- 파티클 16개 전방향 폭발로 축하 피드백 만족감 충분
- 총 1800ms: 600ms 대비 3배 연장이지만 `clearingStage` 최소 지속시간 이내 완료 가능

**phase 구조 결정 (5단계):**
- 기존 3단계(`idle/burst/fadeout`)를 5단계(`idle/dim-in/burst/badge/fadeout`)로 확장
- `dim-in`을 별도 phase로 분리: 200ms dim 진입 후 텍스트 bounce 시작. React state 전환으로 dim layer를 burst phase 진입 전에 먼저 렌더링.
- `badge` phase: 배지 표시 완료 후 fadeout 시작점을 명확히 구분하기 위해 별도 phase 유지. 실제로는 CSS animation delay로 처리하므로 React 상태 전환은 `burst` → `badge`를 합쳐 한 번만 변경해도 무방하나, 가독성을 위해 분리.
- `fadeout`: 전체 wrapper opacity 0 (400ms). 현재 구현의 `isFading` 패턴 그대로 재사용.

**파티클 구현 방식:**
- 디자인 시안과 동일하게 `(360/16) * i` 등간격 각도 + 랜덤 거리(80~120px) + 랜덤 크기(8~14px) + `i * 25ms` 순차 딜레이
- React에서 random 값을 매 렌더마다 재계산하면 파티클이 깜박이므로, `useMemo`로 `isVisible`이 true가 되는 시점에 16개 파티클 데이터를 한 번만 생성
- CSS custom property(`--px`, `--py`, `--delay`) + inline style로 각 파티클에 주입. `@keyframes` `vb-particle-fly`는 `src/index.css`에 추가.

**애니메이션 CSS 전략:**
- 텍스트 bounce, 배지 진입, 파티클 fly-out, wrapper fadeout 모두 CSS `@keyframes` + `animation` 속성으로 처리 (현재 구현의 transition 방식에서 keyframes 방식으로 전환)
- React phase 상태는 `burst` 진입(dim+텍스트+파티클 시작) → `fadeout` 전환(1400ms)으로 단순화. `badge`는 CSS animation delay(500ms)로 자동 표시되므로 별도 React 타이머 불필요.
- 총 타이머 2개: `fade = setTimeout 1400ms`, `done = setTimeout 1800ms`

---

## 생성/수정 파일

- `src/components/game/MultiplierBurst.tsx` (수정) — 5단계 phase, dim 오버레이, 16개 파티클, COMBO BOOST 배지, 88px 텍스트
- `src/index.css` (수정) — `@keyframes vb-particle-fly` 추가

---

## 인터페이스 정의

Props 변경 없음. 외부 호출 방식 변경 없음.

```typescript
interface MultiplierBurstProps {
  multiplier: number    // 상승한 배율 값
  isVisible: boolean    // true → 애니메이션 시작
  onComplete: () => void
}

// 파티클 데이터 (useMemo로 생성, isVisible === true 시점에 고정)
interface ParticleData {
  angle: number    // degrees (0~360, 등간격)
  dist: number     // 방사 거리 px (80~120)
  size: number     // 직경 px (8~14)
  delay: number    // animation delay ms (index * 25)
  px: number       // translateX 목표값 px (cos(rad) * dist)
  py: number       // translateY 목표값 px (sin(rad) * dist)
}
```

---

## 핵심 로직

### `src/index.css` — 추가 keyframes

```css
@keyframes vb-particle-fly {
  0% {
    transform: translate(-50%, -50%) translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) translate(var(--px), var(--py)) scale(0);
    opacity: 0;
  }
}

@keyframes vb-text-bounce {
  0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
  50%  { transform: scale(1.2) rotate(3deg); opacity: 1; }
  70%  { transform: scale(0.95) rotate(-1deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes vb-badge-in {
  0%   { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.8); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}
```

### `src/components/game/MultiplierBurst.tsx` — 전체 재작성

```typescript
import { useEffect, useMemo, useRef, useState } from 'react'

interface MultiplierBurstProps {
  multiplier: number
  isVisible: boolean
  onComplete: () => void
}

interface ParticleData {
  px: number; py: number; size: number; delay: number
}

function getMultiplierColor(multiplier: number): string {
  if (multiplier <= 1) return '#FFFFFF'
  if (multiplier === 2) return '#FACC15'
  if (multiplier === 3) return '#FB923C'
  if (multiplier === 4) return '#F87171'
  return '#E879F9' // x5+
}

const PARTICLE_COUNT = 16

export function MultiplierBurst({ multiplier, isVisible, onComplete }: MultiplierBurstProps) {
  const [phase, setPhase] = useState<'idle' | 'burst' | 'fadeout'>('idle')
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete })

  // 파티클 데이터: isVisible=true 진입 시 한 번만 생성
  // useMemo deps에 isVisible 포함 → true가 될 때마다 새 랜덤값 생성
  const particles = useMemo<ParticleData[]>(() => {
    if (!isVisible) return []
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (360 / PARTICLE_COUNT) * i
      const rad = (angle * Math.PI) / 180
      const dist = 80 + Math.random() * 40   // 80~120px
      const size = 8 + Math.random() * 6     // 8~14px
      return {
        px: Math.cos(rad) * dist,
        py: Math.sin(rad) * dist,
        size,
        delay: i * 25,
      }
    })
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) {
      setPhase('idle')
      return
    }

    // dim-in 즉시 + burst 시작 (dim 200ms → 텍스트 bounce 100ms delay로 100~600ms)
    setPhase('burst')

    // fadeout 시작 (1400ms): wrapper 전체 opacity → 0 (400ms)
    const fadeTimer = setTimeout(() => setPhase('fadeout'), 1400)

    // 완료 (1800ms)
    const doneTimer = setTimeout(() => {
      setPhase('idle')
      onCompleteRef.current()
    }, 1800)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [isVisible])

  if (phase === 'idle') return null

  const color = getMultiplierColor(multiplier)
  const colorDim = `${color}18`    // 배경 dim radial-gradient 색상 (11% 투명도)
  const isFading = phase === 'fadeout'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 100,
      opacity: isFading ? 0 : 1,
      transition: isFading ? 'opacity 400ms ease-out' : 'none',
    }}>
      {/* 배경 방사형 dim */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, ${colorDim} 0%, rgba(14,14,16,0.85) 70%)`,
        animation: 'vb-bg-in 200ms ease-out both',
      }} />

      {/* 파티클 16개 */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`,
            animation: `vb-particle-fly 800ms cubic-bezier(0.1, 0.8, 0.2, 1) ${p.delay}ms both`,
            // CSS custom properties for keyframes translate target
            ['--px' as string]: `${p.px}px`,
            ['--py' as string]: `${p.py}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* xN 텍스트 (bounce 진입) */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontFamily: 'var(--vb-font-score)',
        fontSize: 88,
        fontWeight: 900,
        color,
        letterSpacing: 2,
        textShadow: `0 0 60px ${color}, 0 0 120px ${color}66`,
        animation: 'vb-text-bounce 500ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms both',
        zIndex: 1,
      }}>
        x{multiplier}
      </div>

      {/* COMBO BOOST 배지 */}
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
        textTransform: 'uppercase',
        padding: '4px 12px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
        animation: 'vb-badge-in 300ms ease-out 500ms both',
        zIndex: 1,
      }}>
        COMBO BOOST
      </div>
    </div>
  )
}
```

### `vb-bg-in` keyframes — `src/index.css`에 추가

```css
@keyframes vb-bg-in {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
```

### 타이밍 요약

| 구간 | 시점 | 내용 |
|---|---|---|
| dim-in | 0~200ms | 배경 radial-gradient fade-in |
| text bounce | 100~600ms | 88px xN 텍스트, scale 0→1.2→0.95→1, bounce 진입 |
| 파티클 fly-out | 0~1175ms | 16개 각 800ms, 0~375ms 딜레이 순차 |
| badge 진입 | 500~800ms | COMBO BOOST 배지 translateY(10px)→0 |
| fadeout | 1400~1800ms | wrapper opacity 1→0 (400ms) |
| onComplete | 1800ms | `setPhase('idle')` + `onCompleteRef.current()` |

---

## 주의사항

- **`--px` / `--py` CSS custom property**: React inline style에서 `CSSProperties` 타입은 custom property를 기본 허용하지 않으므로 `as React.CSSProperties` 캐스트 필요. 또는 `style` attribute에 Record 타입으로 병합.
- **`useMemo` deps**: `[isVisible]`만 포함. `isVisible`이 false → true로 전환될 때마다 새 랜덤 파티클 데이터를 생성하고, false로 전환 시 빈 배열 반환. `multiplier` 변경 시 재생성 불필요.
- **`vb-bg-in` keyframes 중복**: 동일 이름이 `index.css`에 이미 있으면 병합 불필요. 없으면 `vb-particle-fly`, `vb-text-bounce`, `vb-badge-in`과 함께 추가.
- **onComplete ref 패턴 유지**: 기존 구현과 동일하게 `onCompleteRef`로 최신 참조 캡처. useEffect deps에 `onComplete` 미포함 (stale closure 방지).
- **fadeout transition vs animation**: fadeout은 CSS transition(`opacity 400ms ease-out`)으로 처리. `isFading` state로 inline style 교체 방식 유지 (기존 패턴 동일). wrapper 전체 opacity 적용이므로 dim, 텍스트, 배지, 파티클 모두 일괄 fadeout.
- **z-index**: 기존 `zIndex: 100` 유지. clearingStage 오버레이(`StageArea` 내부)와 충돌 없음. GamePage의 gameover overlay는 `z-index: 200`이므로 MultiplierBurst 위에 올라온다.
- **DB 영향도**: 없음. UI 전용 수정.
- **Breaking Change**: Props 인터페이스 변경 없음. `GamePage.tsx` 수정 불필요 — 기존 `showBurst` state + `onComplete` 콜백 구조 그대로 유지. `index.css` keyframes 추가만 필요.
- **총 지속시간 1800ms vs clearingStage 타임아웃**: 배율 상승이 발생하는 풀콤보 클리어는 `MILESTONE_PAUSE_MS`(1900ms) 경로이므로 1800ms 애니메이션이 완료된 뒤 `onComplete`가 호출되어 `showBurst` 리셋. 다음 스테이지 시작 전 100ms 여유 확보.

---

## 테스트 경계

- **단위 테스트 가능**: `getMultiplierColor` (순수 함수, 기존 TC 유지)
- **통합 테스트 필요**: 없음
- **수동 검증**:
  1. [MANUAL-1] 5번째 풀콤보 달성 → x2(노랑) burst 표시, 배경 dim 확인
  2. [MANUAL-2] 배지 "COMBO BOOST" 500ms 딜레이 후 표시 확인
  3. [MANUAL-3] 파티클 16개 전방향 방사 + 순차 딜레이 확인
  4. [MANUAL-4] 총 1800ms 후 자동 소멸 확인 (game loop 차단 없음)
  5. [MANUAL-5] 애니메이션 도중 버튼 탭 가능 여부 (pointerEvents: none 확인)
  6. [MANUAL-6] x2/x3/x4/x5 배율별 색상 변경 정상 확인

---

## 수용 기준

| # | 항목 | 검증 방법 |
|---|---|---|
| AC1 | 배율 상승 시 배경 방사형 dim이 200ms 이내 표시 | (BROWSER:DOM) `vb-bg-in` animation 실행 확인 |
| AC2 | 88px xN 텍스트가 bounce 진입 (scale 0→1.2→0.95→1) | (MANUAL) 시각적 overshoot 확인 |
| AC3 | 파티클 16개가 전방향 방사 + 순차 딜레이(25ms 간격) | (BROWSER:DOM) 파티클 div 16개 생성 + `--delay` 값 확인 |
| AC4 | "COMBO BOOST" 배지가 500ms 딜레이 후 등장 | (MANUAL) 텍스트 표시 이후 배지 등장 순서 확인 |
| AC5 | 총 1800ms 후 오버레이 소멸, `onComplete` 호출 | (BROWSER:DOM) 1800ms 후 DOM에서 컴포넌트 언마운트 확인 |
| AC6 | 배율별 색상 적용 (x2 노랑 / x3 주황 / x4 빨강 / x5+ 마젠타) | (TEST) `getMultiplierColor` 단위 테스트 |
| AC7 | 오버레이 활성 중 게임 버튼 탭 가능 (pointerEvents 차단 없음) | (MANUAL) 파티클 버스트 중 버튼 입력 테스트 |
| AC8 | isVisible false 전환 시 즉시 idle → DOM 제거 | (BROWSER:DOM) phase === 'idle' → null 반환 확인 |
