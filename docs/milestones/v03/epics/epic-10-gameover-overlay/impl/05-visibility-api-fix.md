# 05. Page Visibility API 미처리 버그 수정

> 관련 이슈: [#51](https://github.com/alruminum/memory-battle/issues/51)

## 결정 근거

- **버그 메커니즘**: 화면 OFF(또는 앱 백그라운드 전환) 시 `document.hidden === true`가 되지만, `useTimer`와 `ComboTimer`의 `setInterval`은 중단 없이 계속 틱을 발생시킨다. `useTimer`에서 `prev <= 100` 조건이 충족되면 `onExpireRef.current()` 호출 → 강제 게임오버가 발생한다. `sound.ts`에 `suspendAudio()` / `resumeAudio()`가 이미 구현되어 있지만, `visibilitychange` 이벤트와 연결되지 않아 백그라운드 중에도 `AudioContext`가 활성 상태를 유지한다.

- **세 가지 분리 수정**:
  1. **오디오 정지/재개**: `App.tsx`에 `visibilitychange` 리스너 1개 추가. hidden → `suspendAudio()`, visible → `resumeAudio()`. 기존 함수 재사용으로 변경 최소화.
  2. **useTimer 타이머 억제**: `document.hidden === true`이면 `onExpire` 호출을 억제한다. "시간이 멈추는" 방식이 아니라 "만료 이벤트를 무시"하는 방식을 채택 — `hidden` 상태에서도 `timeLeft` 카운트다운이 계속 내려가되, 만료 콜백만 suppress한다. 화면 복귀 시 `timeLeft`가 0에 근접하면 즉시 게임오버가 발생하는 UX는 다소 가혹하지만 구조가 단순하다.
  3. **ComboTimer 타이머 억제**: `ComboTimer`는 경과 시간 표시용으로 게임 상태에 영향을 주지 않는다. `document.hidden` 동안 `setInterval` 자체를 일시 정지한다. 복귀 시 `inputStartTime` 기준으로 elapsed를 재계산하여 재개한다.

- **"타이머 일시정지" vs "만료 억제" 선택 이유**:
  - `useTimer`는 게임오버 트리거와 직결된다. hidden 중 타이머를 완전히 정지하면(정지 구간만큼 `duration`을 연장) resume 시 남은 시간이 보존된다. 그러나 이 방식은 `duration` 동적 조정 또는 타이머 restart 로직이 필요해 `useTimer` 내부 복잡도가 크게 증가한다.
  - 현재 PRD에는 "백그라운드 복귀 시 타이머 보존" 요건이 없다. 따라서 최소 변경으로 게임오버 강제 발생만 막는 **만료 억제 방식**을 채택한다.
  - `ComboTimer`는 `Date.now() - inputStartTime` 기준으로 elapsed를 계산하므로, `document.hidden` 중 interval을 멈추고 복귀 시 재계산하면 표시값이 자연스럽게 복원된다. 단, hidden 동안 elapsed가 `computerShowTime`을 초과한 경우에는 복귀 시 clamped 상한값으로 표시된다(기존 동작 유지).

- **검토한 대안**:
  - `useTimer`에 pause/resume 메서드 추가 + `visibilitychange`로 제어: resume 시 남은 시간 보존 가능. 단, `useTimer` 인터페이스 변경(새 반환값 추가), 호출부(`useGameEngine`) 수정 필요. 변경 범위 큼. 현재 PRD 요건 없음 → 제외.
  - `setInterval` 자체를 `document.hidden` 체크로 건너뛰기(tick 내부에서 `if (document.hidden) return`): 가장 단순하지만 hidden 중에도 CPU 폴링이 발생. 만료 억제와 효과는 동일하고 오히려 낭비. → 제외.
  - `ComboTimer`도 만료 억제 방식 사용: ComboTimer는 경과 시간을 절대 타임스탬프 기준으로 계산하므로, hidden 중 interval이 멈춰도 재개 시 elapsed 값이 자동으로 올바르게 복원된다. interval 정지가 더 깔끔함. → 채택.

---

## 생성/수정 파일

- `src/App.tsx` (수정) — `visibilitychange` 리스너 추가 → `suspendAudio` / `resumeAudio` 연결
- `src/hooks/useTimer.ts` (수정) — `document.hidden === true`일 때 `onExpire` 호출 억제
- `src/components/game/ComboTimer.tsx` (수정) — `document.hidden` 변화 감지, hidden 시 interval 정지·복귀 시 재개

---

## 인터페이스 정의

```typescript
// useTimer — 반환 타입 변경 없음
function useTimer(onExpire: () => void, duration?: number): {
  timeLeft: number
  reset: () => void
  stop: () => void
}

// ComboTimer — Props 변경 없음
interface ComboTimerProps {
  computerShowTime: number
  inputStartTime: number
  isActive: boolean
}
```

호출부(`useGameEngine`, `GamePage`) 변경 없음.

---

## 핵심 로직

### `src/App.tsx` — visibilitychange 리스너 추가

```typescript
import { suspendAudio, resumeAudio } from './lib/sound'

// App() 내부, 기존 useEffect들과 나란히 추가
useEffect(() => {
  const handleVisibility = () => {
    if (document.hidden) {
      suspendAudio()
    } else {
      resumeAudio()
    }
  }
  document.addEventListener('visibilitychange', handleVisibility)
  return () => document.removeEventListener('visibilitychange', handleVisibility)
}, [])
```

### `src/hooks/useTimer.ts` — onExpire 억제

```typescript
// reset() 내부 setInterval 콜백 수정
intervalRef.current = setInterval(() => {
  setTimeLeft((prev) => {
    if (prev <= 100) {
      dbg('[Timer] EXPIRED (hidden=%s)', document.hidden)
      stop()
      if (!document.hidden) {
        // hidden 상태에서는 onExpire 호출 억제
        onExpireRef.current()
      }
      return 0
    }
    return prev - 100
  })
}, 100)
```

### `src/components/game/ComboTimer.tsx` — interval 정지/재개

```typescript
useEffect(() => {
  if (!isActive || inputStartTime === 0) {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setElapsedMs(0)
    return
  }

  const startInterval = () => {
    if (intervalRef.current) return  // 이미 실행 중이면 중복 시작 방지
    intervalRef.current = setInterval(() => {
      const next = Date.now() - inputStartTime
      if (next >= computerShowTimeRef.current) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        setElapsedMs(computerShowTimeRef.current)
      } else {
        setElapsedMs(next)
      }
    }, 100)
  }

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // 초기 시작
  if (!document.hidden) {
    startInterval()
  }

  const handleVisibility = () => {
    if (document.hidden) {
      stopInterval()
    } else {
      // 복귀 시: elapsed 즉시 반영 후 interval 재개
      const next = Date.now() - inputStartTime
      setElapsedMs(Math.min(next, computerShowTimeRef.current))
      if (next < computerShowTimeRef.current) {
        startInterval()
      }
      // next >= computerShowTimeRef.current이면 clamped 상한값으로 고정된 채 interval 재시작 불필요
    }
  }

  document.addEventListener('visibilitychange', handleVisibility)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibility)
    stopInterval()
  }
}, [isActive, inputStartTime])
```

---

## 주의사항

- **useTimer hidden 억제와 timeLeft = 0 처리**: `stop()`은 호출되므로 `timeLeft`는 0으로 설정된다. 화면 복귀 시 `timeLeft === 0`인 상태이지만 게임오버는 발생하지 않는다. 이후 유저가 버튼을 누르거나 새 시퀀스가 시작되면 `reset()`이 호출되어 정상 복원된다. 특수 케이스: hidden 해제 직후 SHOW 페이즈라면 타이머가 reset 대기 상태이므로 문제 없음. INPUT 페이즈라면 타이머가 0으로 표시되지만 onExpire가 호출되지 않아 게임은 유지된다.
- **ComboTimer — 이미 elapsed가 computerShowTime을 초과한 경우**: `next >= computerShowTimeRef.current`이면 복귀 후 `setElapsedMs(computerShowTimeRef.current)`로 clamped 상한값 표시, interval 재시작 없음. 기존 동작과 동일.
- **ComboTimer — startInterval 중복 방지**: `isActive && inputStartTime !== 0` 조건 내에서 `visibilitychange` 핸들러가 등록된다. `handleVisibility`에서 `startInterval` 호출 시 `intervalRef.current !== null` 체크로 이중 실행을 방지한다.
- **App.tsx — resumeAudio 조건 없음**: `visibilitychange` visible 전환 시 `audioCtx`가 null이면 `resumeAudio()`는 단순히 no-op이다(`audioCtx?.resume()`). 게임 시작 전 복귀 시 부작용 없음.
- **Breaking Change 없음**: `useTimer` 반환 인터페이스, `ComboTimer` Props, `App` Props 변경 없음. 기존 호출부 수정 불필요.
- **DB 영향도**: 없음.

---

## 테스트 경계

- 단위 테스트 가능: 없음 (순수 함수 변경 없음; `document.hidden` 분기는 브라우저 API 의존)
- 통합 테스트 필요: 없음 (jsdom 환경에서 `document.hidden` 모킹 후 테스트 가능하나 현재 테스트 인프라 미구축)
- 수동 검증:
  - 게임 진행 중 화면 OFF(또는 홈 버튼으로 백그라운드 전환) → 복귀 시 소리가 재생되지 않다가 다음 버튼 입력 시 정상 재생되는지 확인
  - 게임 진행 중 화면 OFF 5초 이상 유지 → 복귀 시 게임오버 발생하지 않고 게임이 유지되는지 확인
  - 화면 OFF 동안 ComboTimer가 멈추고, 복귀 시 경과 시간이 올바르게 표시되는지 확인 (hidden 시간만큼 경과가 skip되지 않고, Date.now() 기준으로 재계산됨)
  - 화면 OFF 동안 ComboTimer 목표 시간(computerShowTime) 초과 → 복귀 시 목표값으로 clamped 상한 표시 + interval 재시작 없음 확인
  - INPUT 페이즈에서 화면 OFF → 복귀 → 버튼 입력 정상 처리 (게임오버 없이 round 클리어 또는 오답 처리) 확인
