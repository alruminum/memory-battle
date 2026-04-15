---
depth: simple
---
# #100 버그픽스 — 백그라운드 탭 복귀 시 타임아웃 미발생

> 원래 이슈: [#100](https://github.com/alruminum/memory-battle/issues/100)

---

## 근본 원인 분석

두 가지 메커니즘이 복합 작용:

| # | 원인 | 현상 |
|---|---|---|
| 1 | 브라우저 백그라운드 탭 스로틀링 | `setInterval(100ms)`이 최소 ~1000ms로 스로틀링되어 타이머 감산 지연 |
| 2 | `useTimer.ts` onExpire 억제 로직 | `prev <= 100` 도달 시 `document.hidden === true`이면 `stop()`만 호출하고 `onExpireRef.current()` 미호출 |

결과: 백그라운드 중 타이머가 만료 조건(`prev <= 100`)에 진입하면 `stop()`으로 인터벌은 제거되지만 게임오버 처리 없이 타이머만 조용히 소멸. 탭 복귀 후 `timeLeft === 0`, 인터벌 없음, 게임오버도 없어 게임이 진행 상태로 남음.

---

## 결정 근거

### D1 — 복귀 시 지연 발화(deferred fire) 방식 채택

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **deferred fire (채택)** | 백그라운드 만료 시 `expiredWhileHiddenRef = true` 플래그 세팅 → `visibilitychange` 복귀 시 `onExpire` 즉시 발화 | ✅ 채택 |
| pause/resume 방식 | `visibilitychange` 시 `Date.now()` 기준으로 경과 계산, 복귀 시 남은 시간 보존 | ❌ 미채택 — `useTimer` 인터페이스 변경(pause/resume 반환), 호출부(`useGameEngine`) 수정 필요. 현재 PRD에 "백그라운드 복귀 시 타이머 보존" 요건 없음 |
| onExpire 억제 제거 | `document.hidden` 조건 삭제 → 만료 즉시 onExpire 항상 호출 | ❌ 미채택 — 브라우저 스로틀링으로 백그라운드에서 만료 틱이 매우 늦게 도달. "게임이 종료된 줄 몰랐는데 UI만 바뀜" 혼란 UX. 이슈 #51의 의도(hidden 중 강제 게임오버 방지)를 파괴 |

**채택 이유**: `useTimer` 반환 인터페이스·호출부 변경 없음. 수정 범위 최소. `visibilitychange` 이벤트는 탭 복귀 즉시 발화하므로 UX 자연스러움. `expiredWhileHiddenRef`는 `stop()` 호출 시 항상 클리어되므로 stale 발화 없음.

### D2 — `stop()` 에 플래그 클리어 추가

게임 엔진이 `timer.stop()`을 명시적으로 호출하는 경우(SHOWING 진입, 게임 시작 countdown 등) 에도 stale 플래그가 남아 탭 복귀 시 엉뚱한 게임오버를 유발하지 않도록 `stop()` 내부에서 플래그를 클리어한다.

실행 순서 검증 (`prev <= 100` 분기 내):
1. `stop()` → `expiredWhileHiddenRef.current = false`
2. `expiredWhileHiddenRef.current = true` (hidden branch)

순서상 문제 없음. ✓

### D3 — `visibilitychange` listener를 `useEffect([], [])` 1회 등록

`onExpireRef`로 항상 최신 콜백을 참조하므로 deps 없이 마운트 1회 등록으로 충분. 언마운트 cleanup 시 리스너 제거로 메모리 안전.

---

## 수정 파일

- `src/hooks/useTimer.ts` (수정) — `expiredWhileHiddenRef` 플래그 + `visibilitychange` listener 추가

---

## 인터페이스 정의

```typescript
// 반환 타입 변경 없음 — 호출부(useGameEngine) 수정 불필요
function useTimer(onExpire: () => void, duration?: number): {
  timeLeft: number
  reset: () => void
  stop: () => void
}
```

---

## 핵심 로직

### `src/hooks/useTimer.ts` 전체 변경

```typescript
import { useRef, useState, useCallback, useEffect } from 'react'
import { dbg } from '../lib/debug'

export function useTimer(onExpire: () => void, duration = 2000) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onExpireRef = useRef(onExpire)
  const expiredWhileHiddenRef = useRef(false)  // [신규] 백그라운드 만료 보류 플래그

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      dbg('[Timer] stop()')
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    expiredWhileHiddenRef.current = false  // [신규] 명시적 정지 시 보류 플래그 클리어
  }, [])

  const reset = useCallback(() => {
    dbg('[Timer] reset() duration=', duration)
    stop()
    setTimeLeft(duration)
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          dbg('[Timer] EXPIRED (hidden=%s)', document.hidden)
          stop()
          if (!document.hidden) {
            onExpireRef.current()
          } else {
            expiredWhileHiddenRef.current = true  // [신규] 백그라운드 만료 — 복귀 시 발화 예약
          }
          return 0
        }
        return prev - 100
      })
    }, 100)
  }, [duration, stop])

  // [신규] 탭 복귀 시 보류된 만료 처리
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && expiredWhileHiddenRef.current) {
        expiredWhileHiddenRef.current = false
        onExpireRef.current()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => () => stop(), [stop])

  return { timeLeft, reset, stop }
}
```

**변경 요약**:
- `expiredWhileHiddenRef` ref 추가 (초기값 `false`)
- `stop()` 내부에 `expiredWhileHiddenRef.current = false` 추가
- `reset()` 내부 interval 콜백의 `hidden` 분기에 `expiredWhileHiddenRef.current = true` 추가
- `visibilitychange` listener `useEffect` 추가 (마운트 1회)

---

## 주의사항

- **`stop()` 에서의 실행 순서**: `stop()`이 interval 콜백 내부(`prev <= 100` 분기)에서 호출된 후 `expiredWhileHiddenRef.current = true`로 덮어쓰는 흐름이 맞다. `stop()` 내 클리어(→false)가 먼저, hidden 브랜치 세팅(→true)이 나중. 순서 변경 금지.
- **언마운트 안전**: 언마운트 시 `useEffect(() => () => stop(), [stop])` cleanup이 `stop()`을 호출(플래그 false)하고, `visibilitychange` useEffect cleanup이 리스너를 제거. stale 발화 없음.
- **기존 테스트 영향 없음**: `src/__tests__/useTimer.visibility.test.ts`의 기존 TC는 `visibilitychange` 이벤트를 발화하지 않으므로 `hidden=true` 시 `onExpire` 미호출 검증은 그대로 통과.
- **Breaking Change 없음**: 반환 타입 동일, 호출부(`useGameEngine`) 수정 불필요.
- **DB 영향도**: 없음.

---

## 테스트 케이스

### 기존 테스트 — 영향 없음 (모두 통과)

`src/__tests__/useTimer.visibility.test.ts` 기존 8개 TC: `visibilitychange` 이벤트를 발화하지 않으므로 기존 동작 검증에 영향 없음.

### 신규 테스트 케이스 (추가 권장)

| TC ID | 시나리오 | 기대 동작 |
|---|---|---|
| UV-8 | `hidden=true` 상태에서 타이머 만료 → `visibilitychange` 이벤트 발화(`hidden=false`) | `onExpire` 정확히 1회 호출 |
| UV-9 | `hidden=true` 상태에서 타이머 만료 → `visibilitychange` 발화 없이 컴포넌트 언마운트 | `onExpire` 호출 없음 |
| UV-10 | `hidden=true` 만료 → `stop()` 명시 호출 → `visibilitychange` 발화 | `onExpire` 호출 없음 (stop이 플래그 클리어) |
| UV-11 | `hidden=true` 만료 → 복귀 → `reset()` → 다시 만료 | `onExpire` 총 1회 (visibilitychange) + 1회 (재시작 후 정상 만료) = 2회 |

### 수동 검증 시나리오

| ID | 시나리오 | 기대 동작 |
|---|---|---|
| MV-A | 게임 진행 중 알트탭 → 스테이지 타이머 소진될 만큼 대기 → 탭 복귀 | 즉시 게임오버 처리 (GameOverOverlay 표시) |
| MV-B | 게임 진행 중 알트탭 → 짧게 대기 (타이머 미소진) → 탭 복귀 | 게임오버 없이 타이머 계속 진행 |
| MV-C | 게임 미시작 상태에서 알트탭 → 복귀 | 아무 변화 없음 (stop()으로 플래그 클리어 상태) |
