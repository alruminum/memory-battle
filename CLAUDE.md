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

1. **`todo.md`** 에서 미완료 항목 확인
2. **`docs/impl/NN-*.md`** 해당 모듈 구현 계획 확인 (없으면 먼저 작성)
   - 설계 결정 근거(왜 이 구조를 선택했는지)는 **`docs/impl/00-decisions.md`** 참조
3. 계획대로 구현 후 **`todo.md`** 체크

### 구현-검토 루프 (모듈 1개씩)

모듈을 구현할 때는 아래 루프를 따른다. **반드시 모듈 1개가 PASS된 후 다음 모듈로 넘어간다.**

```
최대 3회 반복:
  1. impl 에이전트: docs/impl/NN-*.md 읽고 구현
     (재시도 시 review 피드백 포함)
  2. review 에이전트: 설계 스펙 vs 구현 코드 비교
     - PASS → todo.md 체크, 리뷰 리포트 유저에게 출력 후 대기
     - FAIL → 리뷰 리포트 유저에게 출력, 피드백과 함께 1번 재실행
3회 후 FAIL → 메인(오케스트레이터)이 유저에게 에스컬레이션
```

> **⚠️ PASS 후 자동 진행 금지**: 모듈이 PASS되어도 오케스트레이터는 유저에게 결과를 보고하고 반드시 멈춘다. 다음 모듈 진행 여부는 유저가 명시적으로 지시한다.

> **⚠️ 리뷰 리포트 유저 노출 필수**: PASS/FAIL 여부와 무관하게, review 에이전트가 반환한 전체 리포트(A. 스펙 일치 / B. 의존성 규칙 / C. 코드 품질 심층 검토)를 오케스트레이터가 유저에게 그대로 출력한다. 내부에서만 소비하고 숨기지 않는다.

에이전트 정의: `.claude/agents/impl.md`, `.claude/agents/review.md`

| 모듈 번호 | 계획 파일 |
|---|---|
| 02 | [docs/impl/02-sdk-wrapper.md](docs/impl/02-sdk-wrapper.md) |
| 03 | [docs/impl/03-zustand-store.md](docs/impl/03-zustand-store.md) |
| 04 | [docs/impl/04-game-engine.md](docs/impl/04-game-engine.md) |
| 05 | [docs/impl/05-game-components.md](docs/impl/05-game-components.md) |
| 07 | [docs/impl/07-ranking-hook.md](docs/impl/07-ranking-hook.md) |
| 08 | [docs/impl/08-daily-chances.md](docs/impl/08-daily-chances.md) |
| 09 | [docs/impl/09-ad-components.md](docs/impl/09-ad-components.md) |
| 10 | [docs/impl/10-result-page.md](docs/impl/10-result-page.md) |
| 11 | [docs/impl/11-main-page.md](docs/impl/11-main-page.md) |
| 12 | [docs/impl/12-ranking-page.md](docs/impl/12-ranking-page.md) |
| 13 | [docs/impl/13-routing.md](docs/impl/13-routing.md) |

> 06 (Supabase DB 세팅)은 콘솔 작업이라 impl 파일 없음 → `docs/db-schema.md` 참고

---

## 문서 (필요한 것만 열어서 참고)

| 파일 | 내용 |
|---|---|
| [docs/architecture.md](docs/architecture.md) | 시스템 구조·상태머신·화면흐름·DB ERD·점수계산 (Mermaid) |
| [docs/game-logic.md](docs/game-logic.md) | 시퀀스·깜빡임속도·점수·콤보·타이머·Zustand store |
| [docs/db-schema.md](docs/db-schema.md) | Supabase 테이블 DDL + 랭킹 쿼리 |
| [docs/sdk.md](docs/sdk.md) | 앱인토스 SDK (유저ID·리워드광고·배너광고·granite.config) |
| [docs/ui-spec.md](docs/ui-spec.md) | 화면별 컴포넌트 스펙 |
| [docs/impl/00-decisions.md](docs/impl/00-decisions.md) | 설계 결정 근거 (왜 이 구조를 선택했는지) |

설계 의도 및 비즈니스 요구사항은 `prd.md` / `trd.md` 참고.

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
