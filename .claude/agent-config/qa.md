## 프로젝트 특화 — 이슈 패턴별 Grep 시작점

> **사용법**: 아래 파일에서 버그 관련 키워드를 Grep하고, 히트된 파일만 선택적으로 Read.
> 패턴이 겹쳐도 Grep 결과에 없는 파일은 읽지 않는다.

| 이슈 패턴 | Grep 시작 파일 | 주요 검색 키워드 예시 |
|---|---|---|
| UI 색상/레이아웃 이상 | `src/index.css` → 해당 컴포넌트 | `--vb-*`, `style=` |
| 게임 상태 버그 | `src/store/gameStore.ts` | 상태명, 액션명 |
| 콤보/점수 계산 오류 | `src/store/gameStore.ts` | `combo`, `score`, `multiplier` |
| 타이머/속도 이상 | `src/hooks/useGameEngine.ts` | `timer`, `elapsed`, `isActive` |
| 광고 미동작 | `src/lib/ait.ts` | `IS_SANDBOX`, `showAd` |
| 랭킹 데이터 이상 | `src/hooks/useRanking.ts` | `insert`, `select`, `userId` |
| SDK 연동 오류 | `src/lib/ait.ts` | SDK 함수명 |
| Supabase 오류 | `src/lib/supabase.ts` | 테이블명, `error` |

---

## 프로젝트 특화 — CRITICAL 판정 기준

이 프로젝트에서 즉시 CRITICAL 처리하는 케이스:

- 게임 진행 중 앱 크래시 (useGameEngine 예외)
- 점수/랭킹이 DB에 저장 안 됨 (Supabase insert 실패)
- IS_SANDBOX 분기 누락으로 실제 광고가 개발환경에서 노출
- 유저 ID 없이 랭킹에 기록됨 (개인정보)

---

## 프로젝트 특화 — 설계 문서 참조 위치

| 확인 사항 | 문서 |
|---|---|
| 게임 수치 기대값 (점수, 속도, 콤보 배율) | `docs/game-logic.md` |
| 화면 레이아웃/컴포넌트 스펙 | `docs/ui-spec.md` |
| DB 스키마 및 RLS 정책 | `docs/db-schema.md` |
| SDK API 및 샌드박스 분기 | `docs/sdk.md` |
| 전체 시스템 구조 | `docs/architecture.md` |
