# 09. 콤보 타이머 — 스테이지 클리어 중 감소 방지 (버그픽스)

> 관련 이슈: [#91](https://github.com/alruminum/memory-battle/issues/91)

---

## 결정 근거

- `ComboTimer`의 `isActive` prop은 현재 `status === 'INPUT'`으로만 판단
- `round-clear` 직후 `clearingRef.current = true`로 입력은 차단되지만,
  `store.status`는 pause 종료(1100–1900ms) 전까지 여전히 `'INPUT'`을 유지
- 결과적으로 clearingStage 연출 구간 동안 콤보 타이머가 계속 감소함

**수정 방향**: `clearingStage !== null` 구간(= 스테이지 클리어 연출 중)은
유저가 입력 불가 상태이므로 콤보 타이머도 동결해야 한다.
`clearingStage`는 `useGameEngine()`에서 이미 구조분해되어 line 141에 존재 → 추가 상태 불필요.

**버린 대안**:
- `useGameEngine`에서 round-clear 시 별도 상태 추가 → 불필요 (clearingStage가 이미 그 역할)
- `status`를 round-clear 즉시 `'SHOWING'`으로 전환 → 상태머신 변경으로 파급 범위 큼, 최소 변경 원칙 위배

---

## 생성/수정 파일

- `src/pages/GamePage.tsx` (수정) — ComboTimer `isActive` 조건에 `clearingStage === null` 추가

---

## 인터페이스 정의

변경 없음. `clearingStage: number | null`은 이미 `useGameEngine()` 반환값으로 존재.

---

## 핵심 로직

```tsx
// src/pages/GamePage.tsx — line 305 (수정 전)
isActive={status === 'INPUT'}

// 수정 후
isActive={status === 'INPUT' && clearingStage === null}
```

**상태 흐름 (수정 후)**:

| 시점 | status | clearingStage | isActive |
|---|---|---|---|
| 마지막 입력 직전 | `INPUT` | `null` | `true` ✅ |
| round-clear 직후 | `INPUT` | `1` (숫자) | `false` ✅ |
| pause 종료 후 | `SHOWING` | `null` | `false` ✅ |

---

## 주의사항

- `clearingStage`는 이미 GamePage 상단 line 141에서 구조분해됨 — 별도 선언 불필요
- `isBreaking` 조건(`status === 'RESULT' && gameOverReason !== null`)은 변경 없음
- DB 영향도: 없음 (UI prop 조건 변경만)
- Breaking Change: 없음 (`ComboTimer` 컴포넌트 인터페이스 변경 없음)

---

## 테스트 경계

- 단위 테스트 가능: 없음 (UI prop 조건)
- 통합 테스트 필요: 없음
- 수동 검증:
  - 스테이지 클리어 직후 1100ms 동안 콤보 타이머 게이지가 멈춰 있는지 확인
  - 다음 스테이지 시작(SHOWING → INPUT 전환) 후 타이머가 재시작되는지 확인
  - milestone 클리어(5, 10, 15…) 시 1900ms 동안 동결 확인
