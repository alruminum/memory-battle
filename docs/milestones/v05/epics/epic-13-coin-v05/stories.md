# Epic 13: 코인 시스템 v0.5 정책 준수

> 앱인토스 게임 카테고리 정책 충돌로 폐기된 F5(코인→토스포인트 교환) 관련 구현물 전체 제거.
> F1~F4·F4-AD·F6는 유지. 화면 축소(교환 버튼 제거) + 코드 클린업.
> 번호 체계: 에픽 내 독립 순번 (1부터 시작).

관련 에픽 이슈: #134

---

## Story 1: F5 UI 제거 — 결과화면에서 교환 버튼 완전 제거

> impl: `impl/01-f5-ui-removal.md` (architect Module Plan 후 생성)
> 관련 이슈: #135

게임오버 화면(ResultPage)에서 토스포인트 교환 관련 UI를 전부 제거한다.
화면은 기존보다 단순해지며 신규 화면 추가 없음.

**제거 대상 UI 요소:**
- 토스포인트 교환 버튼 (10코인 → 10포인트)
- 코인 부족 시 표시되던 안내 텍스트 ("코인 10개가 필요합니다 (현재 N개)")

**수용 기준:**
- Given ResultPage 진입 / When 코인 잔액이 10개 이상 / Then 교환 버튼 미표시 (요소 자체 없음)
- Given ResultPage 진입 / When 코인 잔액이 10개 미만 / Then 교환 관련 안내 텍스트 미표시
- Given 교환 버튼 제거 후 / When 앱 실행 / Then 나머지 ResultPage 기능(부활 버튼·코인 획득 피드백·다시하기) 정상 동작

---

## Story 2: F5 코드 & 환경변수 클린업

> impl: `impl/02-f5-code-cleanup.md` (architect Module Plan 후 생성)
> 관련 이슈: #136

F5와 연관된 코드, SDK 래퍼, 환경변수를 전부 제거한다. 컴파일 에러 0건이 완료 기준.

**제거 대상:**
- 토스포인트 교환 SDK 래퍼 함수 (grantCoinExchange 계열)
- `VITE_COIN_EXCHANGE_CODE` 환경변수 및 참조 코드
- F5 관련 import·타입·상수

**수용 기준:**
- Given 코드 제거 완료 / When `npx tsc --noEmit` 실행 / Then 컴파일 에러 0건
- Given 코드 제거 완료 / When `VITE_COIN_EXCHANGE_CODE` 전수 검색 / Then 참조 0건 (.env.example 주석 제외)
- Given 코드 제거 완료 / When 앱 실행 / Then 광고·부활·코인 적립 등 나머지 흐름 정상 동작

---

## Story 3: 앱 노출 부제 업데이트

> impl: 운영 작업 (RELEASE.md 참조) — 코드 변경 없음
> 관련 이슈: #137

F5 폐기로 "기억력으로 토스포인트 받으세요" 부제가 유효하지 않아 업데이트가 필요하다.
granite.config 및 앱인토스 콘솔 노출 정보 변경은 운영 담당.

**검토 필요 항목:**
- 앱인토스 콘솔 부제 문구 변경 (예시안: "기억력으로 기록에 도전하세요")
- granite.config 내 앱 설명 문구 동기화 (architect 확인 필요)

**수용 기준:**
- Given 앱인토스 콘솔 업데이트 / When 앱 노출 정보 확인 / Then 토스포인트 언급 없는 문구 표시

> ⚠️ 최종 문구는 유저(운영) 확인 후 확정. PRD §9 [TBD] 항목과 연동.

---

## 향후 에픽 메모 (이번 v0.5 미포함)

- 출석·튜토리얼 완료 기반 토스포인트 지급 — 정책 허용 조건 충족 방식. 별도 에픽으로 설계 필요.
- grantPromotionReward SDK가 게임 카테고리에서 40000 에러 반환하는 문제 — SDK 연동 정리. architect 루프에서 TRD 현행화 예정.
