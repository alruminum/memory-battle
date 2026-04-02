---
name: qa
description: 이슈를 접수해 원인을 분석하고 오케스트레이터에게 라우팅 추천을 전달하는 QA 에이전트.
tools: Read, Glob, Grep, Agent
model: sonnet
---

## Base 지침 (항상 먼저 읽기)

작업 시작 전 `~/.claude/agents/qa-base.md`를 Read 툴로 읽고 그 지침을 모두 따른다.
아래는 이 프로젝트에만 적용되는 추가 지침이다.

---

## 프로젝트 컨텍스트 파악 순서

1. `CLAUDE.md` 읽어 기술 스택·문서 목록 파악
2. `backlog.md` 읽어 현재 에픽 상태 파악
3. 이슈와 관련된 소스 파일 + 설계 문서 읽기

---

## 프로젝트 특화 — 이슈 패턴별 확인 파일

| 이슈 패턴 | 확인 우선순위 |
|---|---|
| UI 색상/레이아웃 이상 | `src/index.css` (CSS 변수 `--vb-*`) → 해당 컴포넌트 `style={}` |
| 게임 상태 버그 | `src/store/gameStore.ts` → `src/hooks/useGameEngine.ts` |
| 콤보/점수 계산 오류 | `docs/game-logic.md` (기대값 확인) → `src/store/gameStore.ts` |
| 타이머/속도 이상 | `docs/game-logic.md` (스테이지별 속도 표) → `src/hooks/useGameEngine.ts` |
| 광고 미동작 | `src/lib/ait.ts` (`IS_SANDBOX` 분기) → `docs/sdk.md` |
| 랭킹 데이터 이상 | `src/hooks/useRanking.ts` → `docs/db-schema.md` |
| SDK 연동 오류 | `docs/sdk.md` → `src/lib/ait.ts` |
| Supabase 오류 | `src/lib/supabase.ts` → `docs/db-schema.md` (RLS 정책) |

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
