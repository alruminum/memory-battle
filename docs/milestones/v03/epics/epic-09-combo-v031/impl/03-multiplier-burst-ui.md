# 03. 배율 상승 알림 UI (MultiplierBurst)

## 결정 근거

- **오버레이 방식**: 화면 중앙 `position: fixed` 오버레이. `position: absolute`는 부모 컨테이너 크기에 의존하므로, 전체 화면 중앙 고정을 위해 `fixed` 사용.
- **파티클 구현 방식**: CSS animation 기반 div 파티클 8개. Canvas 또는 외부 라이브러리(lottie 등)를 쓰지 않는 이유는 의존성 추가 없이 구현 가능하며, 8~12개 파티클 정도는 CSS로 충분. 방사형 배치는 `transform: rotate(θdeg) translateY(-dist)` 패턴.
- **애니메이션 시퀀스**: ui-spec.md 기준 — ① xN 숫자 scale-up (400ms) → ② 파티클 버스트 (200ms, scale-up과 겹침) → ③ 페이드 아웃. `useEffect` + `setTimeout`으로 단계별 class/state 전환.
- **`onComplete` 콜백**: 애니메이션 완료 후 `GamePage`에 신호를 보내 `multiplierIncreased` state를 `false`로 리셋. `GamePage`에서 `isVisible` prop으로 표시 여부를 제어하므로, `onComplete`로 상태를 닫는 루프를 완성한다.
- **배율별 색상**: ui-spec.md의 `#FACC15`(x2), `#FB923C`(x3), `#F87171`(x4), `#E879F9`(x5+) 그대로 사용. x5 초과 시에도 `#E879F9`를 사용한다 (스펙상 "배율 높을수록 진해짐"은 opacity/brightness 조절로 단계별 진화 가능하지만, MVP에서는 단일 색상으로 구현하고 향후 개선).
- **`GamePage` 통합 위치**: clearingStage 시퀀스 내에서 `multiplierIncreased === true`일 때 `MultiplierBurst`를 트리거. `isVisible` state는 `multiplierIncreased` state와 동기화된다. clearingStage 오버레이와 `MultiplierBurst`는 동시에 표시되므로 z-index 레이어 구분 필요 (오버레이 위에 `MultiplierBurst`가 올라와야 함).

---

## 생성/수정 파일

- `src/components/game/MultiplierBurst.tsx` (신규) — 배율 상승 오버레이 컴포넌트
- `src/pages/GamePage.tsx` (수정) — `MultiplierBurst` 통합, `multiplierIncreased` state 처리

---

## 인터페이스 정의

### `MultiplierBurst.tsx` Props

```typescript
interface MultiplierBurstProps {
  multiplier: number      // 상승한 배율 값 (예: 2, 3, 4, 5)
  isVisible: boolean      // 표시 여부. true → 애니메이션 시작
  onComplete: () => void  // 애니메이션 완료 콜백 (isVisible 리셋용)
}
```

### `GamePage.tsx` 변경 사항

```typescript
// useGameEngine에서 multiplierIncreased 추가 (Story 1에서 반환값으로 추가됨)
const { ..., isClearingFullCombo, multiplierIncreased } = useGameEngine()

// 현재 배율 계산 (MultiplierBurst에 전달할 배율값)
// store의 comboStreak는 stageClear 완료 후 newComboStreak로 갱신되어 있음
// multiplierIncreased === true이면 새 배율 = getComboMultiplier(comboStreak)
import { getComboMultiplier } from '../lib/gameLogic'
const currentMultiplier = getComboMultiplier(comboStreak)
```

---

## 핵심 로직

### `MultiplierBurst.tsx`

```typescript
import { useEffect, useState } from 'react'

interface MultiplierBurstProps {
  multiplier: number
  isVisible: boolean
  onComplete: () => void
}

// 배율별 색상
function getMultiplierColor(multiplier: number): string {
  if (multiplier <= 1) return '#FFFFFF'
  if (multiplier === 2) return '#FACC15'
  if (multiplier === 3) return '#FB923C'
  if (multiplier === 4) return '#F87171'
  return '#E879F9'  // x5+
}

// 파티클 각도 (8개, 45도 간격)
const PARTICLE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

export function MultiplierBurst({ multiplier, isVisible, onComplete }: MultiplierBurstProps) {
  const [phase, setPhase] = useState<'idle' | 'burst' | 'fadeout'>('idle')

  useEffect(() => {
    if (!isVisible) {
      setPhase('idle')
      return
    }

    // 단계 1: burst (scale-up + 파티클, 0ms~400ms)
    setPhase('burst')

    // 단계 2: fadeout (400ms~600ms)
    const fadeTimer = setTimeout(() => setPhase('fadeout'), 400)

    // 단계 3: 완료 (600ms)
    const doneTimer = setTimeout(() => {
      setPhase('idle')
      onComplete()
    }, 600)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [isVisible, onComplete])

  if (phase === 'idle') return null

  const color = getMultiplierColor(multiplier)
  const isFading = phase === 'fadeout'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 100,
      opacity: isFading ? 0 : 1,
      transition: isFading ? 'opacity 200ms ease-out' : 'none',
    }}>
      {/* xN 숫자 */}
      <div style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 72,
        fontWeight: 900,
        color,
        textShadow: `0 0 40px ${color}99, 0 0 80px ${color}44`,
        transform: phase === 'burst' ? 'scale(1)' : 'scale(0.4)',
        transition: phase === 'burst' ? 'transform 400ms cubic-bezier(0.17, 0.89, 0.32, 1.3)' : 'none',
        letterSpacing: 2,
        position: 'relative',
        zIndex: 101,
      }}>
        x{multiplier}
      </div>

      {/* 파티클 8개 */}
      {PARTICLE_ANGLES.map((angle, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transformOrigin: 'center',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
            transform: phase === 'burst'
              ? `translate(-50%, -50%) rotate(${angle}deg) translateY(-80px) scale(1)`
              : `translate(-50%, -50%) rotate(${angle}deg) translateY(0px) scale(0)`,
            transition: phase === 'burst'
              ? `transform 300ms cubic-bezier(0.17, 0.67, 0.83, 0.67) ${i * 15}ms`
              : 'none',
            opacity: isFading ? 0 : 1,
          }}
        />
      ))}
    </div>
  )
}
```

### `GamePage.tsx` — MultiplierBurst 통합

```typescript
// 1. import 추가
import { MultiplierBurst } from '../components/game/MultiplierBurst'
import { getComboMultiplier } from '../lib/gameLogic'

// 2. useGameEngine 구조분해에 multiplierIncreased 추가 (Story 1 구현 완료 후 사용 가능)
const {
  flashingButton, clearingStage, countdown,
  handleInput, startGame, retryGame,
  isClearingFullCombo, multiplierIncreased
} = useGameEngine()

// 3. 현재 배율 파생값
const currentMultiplier = getComboMultiplier(comboStreak)

// 4. MultiplierBurst onComplete 핸들러
// multiplierIncreased는 useGameEngine 내부 state이므로
// onComplete 시 GamePage에서 별도로 처리할 것이 없다.
// useGameEngine이 clearingStage 타임아웃 시 setMultiplierIncreased(false)를 호출하지만,
// MultiplierBurst는 애니메이션 완료(600ms) 후 스스로 idle로 전환하므로
// onComplete는 빈 함수로 충분하다.
// 단, multiplierIncreased가 true → false 전환 후에도 MultiplierBurst가 애니메이션 중이면
// isVisible prop이 false로 바뀌어 즉시 사라지는 문제가 발생한다.
// 해결: GamePage에서 별도 showBurst state를 유지한다.

// GamePage 내부 state 추가:
const [showBurst, setShowBurst] = useState(false)
// multiplierIncreased가 true가 되면 showBurst를 true로 설정
useEffect(() => {
  if (multiplierIncreased) setShowBurst(true)
}, [multiplierIncreased])

// 5. JSX — GamePage 루트 div 내 최하단에 추가
<MultiplierBurst
  multiplier={currentMultiplier}
  isVisible={showBurst}
  onComplete={() => setShowBurst(false)}
/>
```

**`showBurst` state가 필요한 이유**: `multiplierIncreased`는 `clearingStage` 타임아웃(`CLEAR_PAUSE_MS` = 1100ms, `MILESTONE_PAUSE_MS` = 1900ms)과 함께 `false`로 리셋된다. `MultiplierBurst` 애니메이션은 600ms이므로 일반 클리어(1100ms)와 마일스톤 클리어(1900ms) 모두에서 애니메이션이 완료되기 전에 `multiplierIncreased`가 `false`로 바뀔 수 있다. `showBurst`를 별도로 유지하면 `onComplete` 콜백 시점까지 애니메이션이 유지된다.

---

## 주의사항

- **z-index 레이어**: `MultiplierBurst`는 `position: fixed, z-index: 100`. 기존 오버레이 요소(clearingStage 표시 등)보다 높아야 한다. `GamePage`의 다른 요소들은 `position: static` 또는 낮은 z-index이므로 충돌 없음.
- **`pointerEvents: none`**: 오버레이가 버튼 입력을 차단하면 안 된다. 반드시 `pointerEvents: none` 설정.
- **파티클 위치**: `position: absolute`에 `transform: rotate(θ) translateY(-dist)`를 사용한다. 파티클의 기준점이 xN 텍스트 중앙이 되려면 파티클 div도 `position: absolute, top: 50%, left: 50%, transform-origin: center` 설정 필요.
- **타이밍 충돌**: 마일스톤(5, 10, 15... 스테이지) + 풀콤보 + 배율 상승이 동시에 발생할 수 있다. `clearingStage` 표시 오버레이와 `MultiplierBurst`가 동시에 화면에 있어도 시각적으로 자연스럽다. clearingStage 표시는 buttonPad 위 `StageArea`에 나타나고, MultiplierBurst는 `fixed` 오버레이이므로 겹침 처리 불필요.
- **`onComplete` 타이밍**: `MultiplierBurst`의 애니메이션 총 시간은 600ms. `clearingStage` 타임아웃은 최소 1100ms이므로, 정상적으로 600ms 내에 `onComplete`가 호출되어 `showBurst`가 `false`로 리셋된다. 다음 스테이지 시작 전 상태가 깨끗하게 초기화된다.
- **DB 영향도**: 없음.
- **Breaking Change**: `GamePage.tsx`에 `showBurst` state 추가, `MultiplierBurst` import 추가. 기존 컴포넌트 변경 없음.
- **배율 값 전달**: `getComboMultiplier(comboStreak)`에서 `comboStreak`는 `stageClear` 완료 후 `newComboStreak`로 이미 업데이트된 값이다. 따라서 `multiplierIncreased === true` 시점의 `comboStreak`는 새 배율을 반영하므로 `currentMultiplier`가 정확하다.

---

## 테스트 경계

- 단위 테스트 가능: `getMultiplierColor` (순수 함수)
- 통합 테스트 필요: 없음
- 수동 검증:
  - 5번째 풀콤보 달성 시 `MultiplierBurst` x2(노랑) 표시
  - 10번째 풀콤보 달성 시 x3(주황) 표시
  - 애니메이션 도중 버튼 입력 가능 여부 (pointerEvents: none 확인)
  - 애니메이션 완료(600ms) 후 자동 소멸 확인
