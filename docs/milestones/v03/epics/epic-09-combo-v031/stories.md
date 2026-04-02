# Epic 09: 콤보 시스템 전면 개편 (PRD v0.3.1)

> PRD v0.3.1 변경사항 구현. Epic 05 Story 15~17 콤보/타이머 관련 항목 대체.
> 변경 배경: 콤보 판정 기준을 "버튼 간 300ms 간격"에서 "컴퓨터 시연 시간 vs 유저 입력 시간 경쟁" 방식으로 전면 교체.
> 게임오버 타이머 제거, 배율 시스템 단순화(5연속마다 +1, 무제한), 배율 상승 인터랙티브 UX 추가.
> 번호 체계: 에픽 내 독립 순번 (1부터 시작).

---

## Story 1: 콤보 판정 로직 및 배율 시스템 교체

> Epic 05 Story 15 타이머 + Story 16 콤보 스트릭 대체
> impl: `impl/01-combo-logic-v031.md`

기존 300ms 간격 기반 콤보 감지와 버튼당 입력 타이머를 제거한다.
컴퓨터 시연 시간(`flashDuration × sequenceLength`) 기준으로 유저 전체 입력 시간을 비교해 풀콤보를 판정한다.
배율은 5연속 콤보마다 1단계 상승하며 상한 없음.

- [x] 콤보 판정 기준 교체 (300ms → 컴퓨터 시연 시간 기준)
- [x] 버튼당 입력 타이머 제거 (게임오버 타이머 바 포함)
- [x] 배율 계산 로직 교체 (5연속마다 +1, 상한 없음)
- [x] `multiplierIncreased` 플래그 추가

---

## Story 2: 타임워치 UI (ComboTimer)

> impl: `impl/02-combo-timer-ui.md`

게임 화면 하단에 컴퓨터 시연 시간을 타임워치 형태로 표시한다.
유저가 컴퓨터와 경쟁하는 느낌을 주며, 기준 시간 초과 여부를 색상으로 실시간 표시한다.

- [ ] `ComboTimer` 컴포넌트 구현
- [ ] `GamePage`에 통합 (기존 타이머 게이지 교체)

---

## Story 3: 배율 상승 알림 UI (MultiplierBurst)

> Epic 05 Story 17 미완료 태스크 대체
> impl: `impl/03-multiplier-burst-ui.md`

배율이 상승하는 순간 화면 중앙에 `xN` scale-up + 파티클 버스트 오버레이를 표시한다.
배율별 색상(x2=노랑, x3=주황, x4=빨강, x5+=마젠타)으로 단계감을 시각화한다.

- [ ] `MultiplierBurst` 컴포넌트 구현
- [ ] `GamePage` clearingStage 시퀀스에 통합
