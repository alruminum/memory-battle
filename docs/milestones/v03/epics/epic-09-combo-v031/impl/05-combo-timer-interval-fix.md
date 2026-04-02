# 05. ComboTimer setInterval 초과 후 계속 증가 버그 수정

> 관련 이슈: [#44](https://github.com/alruminum/memory-battle/issues/44)

## 결정 근거

- **버그 원인**: `setInterval` 콜백이 `setElapsedMs(Date.now() - inputStartTime)`만 실행하며 종료 조건이 없다. `elapsedMs >= computerShowTime`이 되어도 interval이 살아있어 계속 증가한다.
- **수정 방식 — 콜백 내 clamp + clearInterval**: interval 콜백 안에서 새 elapsed를 계산한 뒤 `computerShowTime`을 초과하면 `clearInterval`을 호출하고 값을 `computerShowTime`으로 clamp한다. 이렇게 하면 타이머가 정확히 상한에서 멈추고 추가 렌더가 발생하지 않는다.
- **`computerShowTime`을 ref로 캡처**: `setInterval` 콜백은 클로저로 생성 시점의 `computerShowTime`을 참조한다. `computerShowTime`은 스테이지가 바뀔 때마다 달라지므로, 콜백이 구식 값을 참조하지 않도록 `computerShowTimeRef`로 항상 최신값을 읽는다.
- **대안 검토**: `elapsedMs` state를 `useEffect` deps에 추가해 조건부 clearInterval하는 방식은 state 업데이트 → effect 재실행 → clearInterval 순서로 1틱 지연이 발생해 채택하지 않는다.

---

## 생성/수정 파일

- `src/components/game/ComboTimer.tsx` (수정) — interval 콜백 내 초과 시 clearInterval + clamp 추가

---

## 인터페이스 정의

Props 변경 없음. 기존 인터페이스 유지.

```typescript
interface ComboTimerProps {
  computerShowTime: number   // 컴퓨터 시연 총 시간 (ms). flashDuration × sequenceLength
  inputStartTime: number     // INPUT 페이즈 시작 시각 (timestamp). store.sequenceStartTime
  isActive: boolean          // INPUT 상태 여부. true일 때만 렌더링
}
```

---

## 핵심 로직

### 변경 전 (버그 있는 콜백)

```typescript
intervalRef.current = setInterval(() => {
  setElapsedMs(Date.now() - inputStartTime)  // 종료 조건 없음
}, 100)
```

### 변경 후

```typescript
// computerShowTime을 ref로 유지 — 콜백 클로저가 항상 최신값을 읽기 위함
const computerShowTimeRef = useRef(computerShowTime)
useEffect(() => {
  computerShowTimeRef.current = computerShowTime
}, [computerShowTime])

// isActive/inputStartTime 변경 시 interval 재시작
useEffect(() => {
  if (!isActive || inputStartTime === 0) {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setElapsedMs(0)
    return
  }

  intervalRef.current = setInterval(() => {
    const next = Date.now() - inputStartTime
    if (next >= computerShowTimeRef.current) {
      // 상한 도달: interval 정지 + 값 clamp
      clearInterval(intervalRef.current!)
      intervalRef.current = null
      setElapsedMs(computerShowTimeRef.current)
    } else {
      setElapsedMs(next)
    }
  }, 100)

  return () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }
}, [isActive, inputStartTime])
```

---

## 주의사항

- **`computerShowTime` prop 변경 주기**: 스테이지가 바뀔 때마다 `flashDuration × sequenceLength`가 변한다. `computerShowTimeRef` 동기화 effect는 deps에 `computerShowTime`만 포함하며, interval 자체는 재시작하지 않는다. interval은 `isActive`/`inputStartTime` 변경 시에만 재시작하므로 불필요한 재생성이 없다.
- **`isActive`가 `false`로 바뀌면 즉시 정리**: 기존 코드와 동일하게 비활성 시 interval 정지 + `elapsedMs` 0 초기화가 유지된다. clamp로 interval이 이미 정지된 경우에는 null 가드(`intervalRef.current !== null` 확인)가 중복 clearInterval을 막는다.
- **DB 영향도**: 없음. 렌더링 전용 컴포넌트. DB 저장값 없음.
- **Breaking Change**: 없음. Props 인터페이스 변경 없음. 부모(`GamePage.tsx` 등) 수정 불필요.

---

## 테스트 경계

- 단위 테스트 가능: 없음 (`setInterval` + `Date.now()` 기반 UI 컴포넌트. test-plan.md §4 "테스트 제외 대상"에 이미 명시)
- 통합 테스트 필요: 없음
- 수동 검증:
  - INPUT 페이즈 진입 후 느린 입력으로 `computerShowTime` 경과 → 타이머가 목표값에서 고정되는지 확인
  - `computerShowTime` 초과 후 빨강 색상 유지 + 숫자 더 이상 증가하지 않음 확인
  - 정상 입력(초과 전 완료) 시 타이머가 해당 elapsed 값에서 멈추는지 확인 (`isActive=false` 전환 시 interval 정리)
