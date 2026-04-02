# Design Review — 05-combo-timer-interval-fix

**이슈**: alruminum/memory-battle#44  
**impl 파일**: `docs/milestones/v03/epics/epic-09-combo-v031/impl/05-combo-timer-interval-fix.md`  
**판정**: DESIGN_REVIEW_PASS

## A. 구현 가능성

| 항목 | 결과 | 비고 |
|---|---|---|
| 기술 스택 실현 가능성 | PASS | `useRef` + `setInterval` + `useEffect` 조합은 React 18 기준 표준 패턴. 신규 패키지 불필요 |
| 외부 의존성 해결 가능 | PASS | 외부 의존성 추가 없음. 기존 import 구조(`useState`, `useEffect`, `useRef`) 그대로 유지 |
| 데이터 흐름 완결성 | PASS | `computerShowTime` → ref 동기화 → interval 콜백 내 비교 → clamp/clearInterval → `setElapsedMs` 렌더 흐름이 완결됨 |
| 모듈 경계 명확성 | PASS | `ComboTimer.tsx` 단일 파일만 수정. store/gameLogic 경계 침범 없음. Props 인터페이스 변경 없어 부모 컴포넌트 영향 없음 |

## B. 스펙 완결성

| 항목 | 결과 | 비고 |
|---|---|---|
| 인터페이스 정의 | PASS | Props 3개(`computerShowTime`, `inputStartTime`, `isActive`) 변경 없음 명시. 타입 유지 확인 |
| 에러 처리 방식 | PASS | null 가드(`intervalRef.current !== null`)로 중복 clearInterval 방지. `isActive=false`/`inputStartTime===0` 경계 처리 명시 |
| 엣지케이스 커버리지 | PASS | ① 정상 입력(초과 전 완료), ② 느린 입력(상한 도달), ③ `isActive=false` 전환 3가지 수동 검증 시나리오 명시. stale closure 문제를 ref로 해결 |
| 상태 초기화 순서 | PASS | `isActive=false` 시 interval 정리 + `elapsedMs` 0 초기화 순서 기존과 동일 유지 |

## C. 리스크 평가

| 항목 | 결과 | 비고 |
|---|---|---|
| 기술 리스크 커버리지 | PASS | stale closure 리스크를 `computerShowTimeRef`로 명시적 커버 |
| 구현 순서 의존성 | PASS | 단일 파일 수정, 두 useEffect는 독립 deps로 순서 의존성 없음 |
| 성능 병목 가능성 | PASS | clamp 도달 후 clearInterval로 추가 tick 없음 |

## 권고사항 (NICE TO HAVE)

1. cleanup 함수에도 `intervalRef.current = null` 추가 (코드 일관성)
2. `useGameEngine.ts`에서 스테이지 전환 시 `sequenceStartTime` 갱신 타이밍 확인 권고
