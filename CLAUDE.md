# 기억력배틀 (Memory Battle)

앱인토스 WebView 미니앱. 4개 색깔 버튼 시퀀스 기억 게임. 3일 MVP.

---

## 개발 명령어

```bash
# 프로젝트 초기화 (이미 완료)
npm create vite@latest . -- --template react-ts
npm install @apps-in-toss/web-framework
npx ait init        # web-framework 선택, appName=memory-battle
npm install @supabase/supabase-js zustand
npm install -D tailwindcss

# 개발/빌드
npm run dev         # granite dev (샌드박스 앱에서 intoss://memory-battle)
npm run build       # ait build
```

## 환경변수 (`.env`)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_NAME=memory-battle
```

> SDK: `@apps-in-toss/web-framework` 2.x 이상 필수. TDS 적용 면제 (게임 앱).

---

## 작업 순서 (반드시 준수)

1. **`backlog.md`** 에서 에픽 목록 확인
2. **`docs/milestones/vNN/epics/epic-NN-*/stories.md`** 에서 스토리/태스크 확인
3. **`docs/milestones/vNN/epics/epic-NN-*/impl/NN-*.md`** 계획 확인 (없으면 architect에게 요청)
   - 설계 결정 근거는 **`docs/impl/00-decisions.md`** 참조
4. 구현 후 **`stories.md`** 해당 태스크 체크

구현/디자인 루프 상세는 `.claude/agents/orchestrator.md` 참조.
사람이 해야 할 운영/출시 항목은 **`RELEASE.md`** 참조.

| 모듈 | 계획 파일 |
|---|---|
| 02 sdk-wrapper | [docs/milestones/v01/epics/epic-01-game-core/impl/02-sdk-wrapper.md](docs/milestones/v01/epics/epic-01-game-core/impl/02-sdk-wrapper.md) |
| 03 zustand-store | [docs/milestones/v01/epics/epic-01-game-core/impl/03-zustand-store.md](docs/milestones/v01/epics/epic-01-game-core/impl/03-zustand-store.md) |
| 04 game-engine | [docs/milestones/v01/epics/epic-01-game-core/impl/04-game-engine.md](docs/milestones/v01/epics/epic-01-game-core/impl/04-game-engine.md) |
| 05 game-components | [docs/milestones/v01/epics/epic-01-game-core/impl/05-game-components.md](docs/milestones/v01/epics/epic-01-game-core/impl/05-game-components.md) |
| 07 ranking-hook | [docs/milestones/v01/epics/epic-02-backend/impl/07-ranking-hook.md](docs/milestones/v01/epics/epic-02-backend/impl/07-ranking-hook.md) |
| 08 daily-chances | [docs/milestones/v01/epics/epic-02-backend/impl/08-daily-chances.md](docs/milestones/v01/epics/epic-02-backend/impl/08-daily-chances.md) |
| 09 ad-components | [docs/milestones/v01/epics/epic-03-ads/impl/09-ad-components.md](docs/milestones/v01/epics/epic-03-ads/impl/09-ad-components.md) |
| 10 result-page | [docs/milestones/v01/epics/epic-03-ads/impl/10-result-page.md](docs/milestones/v01/epics/epic-03-ads/impl/10-result-page.md) |
| 11 main-page | [docs/milestones/v01/epics/epic-04-screens/impl/11-main-page.md](docs/milestones/v01/epics/epic-04-screens/impl/11-main-page.md) |
| 12 ranking-page | [docs/milestones/v01/epics/epic-04-screens/impl/12-ranking-page.md](docs/milestones/v01/epics/epic-04-screens/impl/12-ranking-page.md) |
| 13 routing | [docs/milestones/v01/epics/epic-04-screens/impl/13-routing.md](docs/milestones/v01/epics/epic-04-screens/impl/13-routing.md) |

> 06 (Supabase DB 세팅)은 콘솔 작업 → `docs/db-schema.md` + `RELEASE.md` 참고

---

## 문서 (필요한 것만 열어서 참고)

| 파일 | 내용 |
|---|---|
| [backlog.md](backlog.md) | 에픽 목록 인덱스 |
| [RELEASE.md](RELEASE.md) | 사람이 해야 할 운영/출시 체크리스트 |
| [docs/milestones/](docs/milestones/) | 마일스톤별 에픽 + 버전 문서 (v01, v03) |
| [docs/architecture.md](docs/architecture.md) | 시스템 구조·상태머신·화면흐름·DB ERD·점수계산 (Mermaid) |
| [docs/game-logic.md](docs/game-logic.md) | 시퀀스·깜빡임속도·점수·콤보·타이머·Zustand store |
| [docs/db-schema.md](docs/db-schema.md) | Supabase 테이블 DDL + 랭킹 쿼리 |
| [docs/sdk.md](docs/sdk.md) | 앱인토스 SDK (유저ID·리워드광고·배너광고·granite.config) |
| [docs/ui-spec.md](docs/ui-spec.md) | 화면별 컴포넌트 스펙 (현재 = v0.3) |

설계 의도 및 비즈니스 요구사항은 `prd.md` / `trd.md` 참고.

---

## 현재 마일스톤

`v03` — Epic 05 기준 (PRD v0.3). 버전별 문서는 현재 `docs/` 루트에 위치.
- PRD: `prd.md`
- UI 스펙: `docs/ui-spec.md`
- 게임 로직: `docs/game-logic.md`

> **마일스톤 구조 (B안)**: 루트 = 항상 현재 최신. 과거 버전은 `docs/milestones/vNN/`에 스냅샷.
> 과거 버전 참조 시: `docs/milestones/v01/` (Epic 01~04), `docs/milestones/v03/` (Epic 05)

---

## Git

```
Remote: https://github.com/alruminum/memory-battle.git
Branch: main
```

---

## AI 개발 (MCP)

```bash
# 앱인토스 공식 문서 검색 — 프로젝트 레벨 등록
claude mcp add --transport stdio apps-in-toss ax mcp start
```

등록 후 `@docs` 컨텍스트로 문서 검색 가능.
