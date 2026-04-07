# 기억력배틀 (Memory Battle)

앱인토스 WebView 미니앱. 4개 색깔 버튼 시퀀스 기억 게임. 3일 MVP.

---

## 베이스 동기화 규칙

이 CLAUDE.md에 새 규칙·섹션을 추가할 때, 아래 기준으로 베이스도 함께 업데이트한다:

| 조건 | 처리 |
|---|---|
| 프로젝트 독립적 (에이전트 호출 방식, 워크플로우, Git 규칙 등) | `~/.claude/templates/CLAUDE-base.md`에도 동일하게 추가 |
| 프로젝트 특화 (레포 URL, 에픽 테이블, 환경변수, SDK 특화 명령어 등) | 이 CLAUDE.md에만 기록 |

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

## GitHub Issues 마일스톤 (현재)

| 용도 | 마일스톤 |
|---|---|
| 버그 (동작 오류) | `Bugs` |
| 기능 추가·개선 | `Feature` |
| 스토리 이슈 | `Story` |
| 에픽 | `Epics` |
| 현재 버전 레이블 | `v03` |

> 버전이 올라가면 "현재 버전 레이블" 항목만 업데이트하면 된다. 에이전트는 이 표를 참조한다.

### 이슈 생성 시 마일스톤 처리 규칙

`mcp__github__create_issue`의 `milestone` 파라미터는 **이름이 아닌 숫자(number)**를 요구한다.  
이슈 생성 전 반드시 아래 명령으로 마일스톤 이름 → 번호를 조회한다:

```bash
gh api repos/alruminum/memory-battle/milestones --jq '.[] | {number: .number, title: .title}'
```

조회 결과에서 위 표의 마일스톤 이름에 해당하는 `number`를 `milestone` 파라미터에 전달한다.

### 이슈 등록 필수 항목

버그 이슈 등록 시:

| 항목 | 값 |
|---|---|
| 레이블 | `bug` + 현재 버전 레이블 (`v03` 등) |
| 마일스톤 | `Bugs` |

기능/개선 이슈 등록 시:

| 항목 | 값 |
|---|---|
| 레이블 | `feat` + 현재 버전 레이블 (`v03` 등) |
| 마일스톤 | `Feature` |

스토리 이슈 등록 시:

| 항목 | 값 |
|---|---|
| 레이블 | 해당 에픽 레이블 + 현재 버전 레이블 |
| 마일스톤 | `Story` |

---

## 오케스트레이션 워크플로우

- 전역 룰: `~/.claude/orchestration-rules.md` (디자인 루프·구현 루프·에이전트 역할 경계)

---

## 작업 순서 (반드시 준수)

### 버그픽스 작업 순서 (`bug` 레이블 이슈인 경우)

> 신규 기능(feat)과 다른 경로. 아래 규칙 준수.

1. **원래 이슈 번호 유지** — 새 이슈 등록 금지. 추가 수정은 원래 이슈 체크리스트에 항목 추가
2. architect 호출 시 프롬프트 첫 줄에 반드시 `버그픽스 —` 명시
3. 구현 중 추가 수정 발생 → 별개 이슈 등록 금지 → 원래 이슈에 통합
4. 커밋 메시지: 원래 이슈 번호 참조 (`Related to #NNN` 또는 `Closes #NNN`)

---

1. **GitHub Issues** 에서 해당 에픽 레이블/마일스톤으로 미완료 이슈 확인
   `gh issue list --label "epic-0N: ..." --milestone vNN --repo alruminum/memory-battle`
2. **이슈 본문**에서 스토리 컨텍스트 + 태스크 체크리스트 확인
3. **`docs/milestones/vNN/epics/epic-NN-*/impl/NN-*.md`** 계획 확인 (이슈 본문 상단 링크 참조, 없으면 architect에게 요청)
4. 구현 후 GitHub Issue 체크리스트 업데이트 / 모든 태스크 완료 시 이슈 close

사람이 해야 할 운영/출시 항목은 **`RELEASE.md`** 참조.


### v01

**Epic 01 — 게임 코어** · [stories](docs/milestones/v01/epics/epic-01-game-core/stories.md)

| impl | 계획 파일 | Issue |
|---|---|---|
| 02 sdk-wrapper | [impl/02-sdk-wrapper.md](docs/milestones/v01/epics/epic-01-game-core/impl/02-sdk-wrapper.md) | [#2](https://github.com/alruminum/memory-battle/issues/2) |
| 03 zustand-store | [impl/03-zustand-store.md](docs/milestones/v01/epics/epic-01-game-core/impl/03-zustand-store.md) | [#3](https://github.com/alruminum/memory-battle/issues/3) |
| 04 game-engine | [impl/04-game-engine.md](docs/milestones/v01/epics/epic-01-game-core/impl/04-game-engine.md) | [#4](https://github.com/alruminum/memory-battle/issues/4) |
| 05 game-components | [impl/05-game-components.md](docs/milestones/v01/epics/epic-01-game-core/impl/05-game-components.md) | [#5](https://github.com/alruminum/memory-battle/issues/5) |

**Epic 02 — 백엔드/데이터** · [stories](docs/milestones/v01/epics/epic-02-backend/stories.md)

| impl | 계획 파일 | Issue |
|---|---|---|
| 06 db-setup | 콘솔 작업 → `docs/db-schema.md` + `RELEASE.md` 참고 | [#6](https://github.com/alruminum/memory-battle/issues/6) |
| 07 ranking-hook | [impl/07-ranking-hook.md](docs/milestones/v01/epics/epic-02-backend/impl/07-ranking-hook.md) | [#7](https://github.com/alruminum/memory-battle/issues/7) |
| 08 daily-chances | [impl/08-daily-chances.md](docs/milestones/v01/epics/epic-02-backend/impl/08-daily-chances.md) | [#8](https://github.com/alruminum/memory-battle/issues/8) |

**Epic 03 — 광고/수익화** · [stories](docs/milestones/v01/epics/epic-03-ads/stories.md)

| impl | 계획 파일 | Issue |
|---|---|---|
| 09 ad-components | [impl/09-ad-components.md](docs/milestones/v01/epics/epic-03-ads/impl/09-ad-components.md) | [#9](https://github.com/alruminum/memory-battle/issues/9) |
| 10 result-page | [impl/10-result-page.md](docs/milestones/v01/epics/epic-03-ads/impl/10-result-page.md) | [#10](https://github.com/alruminum/memory-battle/issues/10) |

**Epic 04 — 화면 완성** · [stories](docs/milestones/v01/epics/epic-04-screens/stories.md)

| impl | 계획 파일 | Issue |
|---|---|---|
| 11 main-page | [impl/11-main-page.md](docs/milestones/v01/epics/epic-04-screens/impl/11-main-page.md) | [#11](https://github.com/alruminum/memory-battle/issues/11) |
| 12 ranking-page | [impl/12-ranking-page.md](docs/milestones/v01/epics/epic-04-screens/impl/12-ranking-page.md) | [#12](https://github.com/alruminum/memory-battle/issues/12) |
| 13 routing | [impl/13-routing.md](docs/milestones/v01/epics/epic-04-screens/impl/13-routing.md) | [#13](https://github.com/alruminum/memory-battle/issues/13) |

### v03

**Epic 05 — 게임 메카닉 개편 (PRD v0.3)** · [stories](docs/milestones/v03/epics/epic-05-mechanic-v03/stories.md)

| impl | 계획 파일 | Issue |
|---|---|---|
| 14 difficulty-removal | [impl/14-difficulty-removal.md](docs/milestones/v03/epics/epic-05-mechanic-v03/impl/14-difficulty-removal.md) | [#14](https://github.com/alruminum/memory-battle/issues/14) |
| 15 stage-speed-timer | [impl/15-stage-speed-timer.md](docs/milestones/v03/epics/epic-05-mechanic-v03/impl/15-stage-speed-timer.md) | [#15](https://github.com/alruminum/memory-battle/issues/15) |
| 16 combo-streak | [impl/16-combo-streak.md](docs/milestones/v03/epics/epic-05-mechanic-v03/impl/16-combo-streak.md) | [#16](https://github.com/alruminum/memory-battle/issues/16) |
| 17 combo-ui | [impl/17-combo-ui.md](docs/milestones/v03/epics/epic-05-mechanic-v03/impl/17-combo-ui.md) | [#17](https://github.com/alruminum/memory-battle/issues/17) |
| 18 result-update | [impl/18-result-update.md](docs/milestones/v03/epics/epic-05-mechanic-v03/impl/18-result-update.md) | [#18](https://github.com/alruminum/memory-battle/issues/18) |

**Epic 06 — 마일스톤 기반 문서 구조 개편** · [stories](docs/milestones/v03/epics/epic-06-milestone-docs/stories.md)
_(impl 없음 — 문서 구조 작업만)_ · Issues: [#19](https://github.com/alruminum/memory-battle/issues/19) [#20](https://github.com/alruminum/memory-battle/issues/20) [#21](https://github.com/alruminum/memory-battle/issues/21)

**Epic 07 — DB 타입 안전성** · [stories](docs/milestones/v03/epics/epic-07-db-type-safety/stories.md)

| impl | 계획 파일 | Issue |
|---|---|---|
| 23 supabase-gen-types | [impl/23-supabase-gen-types.md](docs/milestones/v03/epics/epic-07-db-type-safety/impl/23-supabase-gen-types.md) | [#22](https://github.com/alruminum/memory-battle/issues/22) [#23](https://github.com/alruminum/memory-battle/issues/23) |

**Epic 08 — GamePage 품질 개선 & UI 리팩토링** · [stories](docs/milestones/v03/epics/epic-08-gamepage-refactor/stories.md)

| impl | 계획 파일 | Issue |
|---|---|---|
| 01 quality-fix | [impl/01-quality-fix.md](docs/milestones/v03/epics/epic-08-gamepage-refactor/impl/01-quality-fix.md) | [#24](https://github.com/alruminum/memory-battle/issues/24) |

**Epic 09 — 콤보 시스템 전면 개편 (PRD v0.3.1)** · [stories](docs/milestones/v03/epics/epic-09-combo-v031/stories.md)

| impl | 계획 파일 | Issue |
|---|---|---|
| 01 combo-logic-v031 | [impl/01-combo-logic-v031.md](docs/milestones/v03/epics/epic-09-combo-v031/impl/01-combo-logic-v031.md) | [#25](https://github.com/alruminum/memory-battle/issues/25) |
| 02 combo-timer-ui | [impl/02-combo-timer-ui.md](docs/milestones/v03/epics/epic-09-combo-v031/impl/02-combo-timer-ui.md) | [#26](https://github.com/alruminum/memory-battle/issues/26) |
| 03 multiplier-burst-ui | [impl/03-multiplier-burst-ui.md](docs/milestones/v03/epics/epic-09-combo-v031/impl/03-multiplier-burst-ui.md) | [#27](https://github.com/alruminum/memory-battle/issues/27) |
| 04 timer-restore | [impl/04-timer-restore.md](docs/milestones/v03/epics/epic-09-combo-v031/impl/04-timer-restore.md) | [#28](https://github.com/alruminum/memory-battle/issues/28) |
| 05 combo-timer-interval-fix | [impl/05-combo-timer-interval-fix.md](docs/milestones/v03/epics/epic-09-combo-v031/impl/05-combo-timer-interval-fix.md) | [#44](https://github.com/alruminum/memory-battle/issues/44) |
| 06 score-immediate-multiplier | [impl/06-score-immediate-multiplier.md](docs/milestones/v03/epics/epic-09-combo-v031/impl/06-score-immediate-multiplier.md) | [#59](https://github.com/alruminum/memory-battle/issues/59) |

**Epic 10 — 게임오버 오버레이** · [stories](docs/milestones/v03/epics/epic-10-gameover-overlay/stories.md) · Epic: [#46](https://github.com/alruminum/memory-battle/issues/46)

| impl | 계획 파일 | Issue |
|---|---|---|
| 01 gameover-overlay | [impl/01-gameover-overlay.md](docs/milestones/v03/epics/epic-10-gameover-overlay/impl/01-gameover-overlay.md) | [#47](https://github.com/alruminum/memory-battle/issues/47) |
| 02 overlay-bugfix | [impl/02-overlay-bugfix.md](docs/milestones/v03/epics/epic-10-gameover-overlay/impl/02-overlay-bugfix.md) | [#48](https://github.com/alruminum/memory-battle/issues/48) |
| 03 hud-blur-exclusion | [impl/03-hud-blur-exclusion.md](docs/milestones/v03/epics/epic-10-gameover-overlay/impl/03-hud-blur-exclusion.md) | [#49](https://github.com/alruminum/memory-battle/issues/49) |
| 04 overlay-tap-through-fix | [impl/04-overlay-tap-through-fix.md](docs/milestones/v03/epics/epic-10-gameover-overlay/impl/04-overlay-tap-through-fix.md) | [#50](https://github.com/alruminum/memory-battle/issues/50) |

**Epic 11 — GamePage UI 개선 3건** · [stories](docs/milestones/v03/epics/epic-11-ui-improvements/stories.md) · Epic: [#55](https://github.com/alruminum/memory-battle/issues/55)

| impl | 계획 파일 | Issue |
|---|---|---|
| 01 countdown-hint | [impl/01-countdown-hint.md](docs/milestones/v03/epics/epic-11-ui-improvements/impl/01-countdown-hint.md) | [#52](https://github.com/alruminum/memory-battle/issues/52) |
| 02 fullcombo-removal | [impl/02-fullcombo-removal.md](docs/milestones/v03/epics/epic-11-ui-improvements/impl/02-fullcombo-removal.md) | [#53](https://github.com/alruminum/memory-battle/issues/53) |
| 03 combo-indicator-v2 | [impl/03-combo-indicator-v2.md](docs/milestones/v03/epics/epic-11-ui-improvements/impl/03-combo-indicator-v2.md) | [#54](https://github.com/alruminum/memory-battle/issues/54) |
| 04 hud-stg-countdown-fix | [impl/04-hud-stg-countdown-fix.md](docs/milestones/v03/epics/epic-11-ui-improvements/impl/04-hud-stg-countdown-fix.md) | [#66](https://github.com/alruminum/memory-battle/issues/66) |
| 05 visibility-api-fix | [impl/05-visibility-api-fix.md](docs/milestones/v03/epics/epic-10-gameover-overlay/impl/05-visibility-api-fix.md) | [#51](https://github.com/alruminum/memory-battle/issues/51) |
| 04 countdown-blink-fix | [impl/04-countdown-blink-fix.md](docs/milestones/v03/epics/epic-11-ui-improvements/impl/04-countdown-blink-fix.md) | [#61](https://github.com/alruminum/memory-battle/issues/61) |
| 06 hud-stg-countdown-fix | [impl/06-hud-stg-countdown-fix.md](docs/milestones/v03/epics/epic-11-ui-improvements/impl/06-hud-stg-countdown-fix.md) | [#66](https://github.com/alruminum/memory-battle/issues/66) |

---

## 문서 (필요한 것만 열어서 참고)

| 파일 | 내용 |
|---|---|
| [backlog.md](backlog.md) | 에픽 목록 인덱스 |
| [RELEASE.md](RELEASE.md) | 사람이 해야 할 운영/출시 체크리스트 |
| [docs/milestones/](docs/milestones/) | 마일스톤별 에픽 + 버전 문서 (v01, v03) |
| [docs/architecture.md](docs/architecture.md) | 시스템 구조·상태머신·화면흐름·DB ERD·점수계산 (Mermaid) |
| [docs/game-logic.md](docs/game-logic.md) | 시퀀스·깜빡임속도·점수·스택형 콤보(x1~x5)·타이머·Zustand store (PRD v0.3) |
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
> 과거 버전 참조 시: `docs/milestones/v01/` (Epic 01~04), `docs/milestones/v03/` (Epic 05~06)

### 새 마일스톤 시작 전 체크리스트

1. 루트 파일(`prd.md`, `trd.md`, `docs/ui-spec.md`, `docs/game-logic.md`) → `docs/milestones/vNN/`에 복사 (스냅샷)
2. 현재 에픽 폴더 → `docs/milestones/vNN/epics/`에 복사
3. 루트 파일 업데이트 (새 버전)
4. `backlog.md` + `CLAUDE.md` 경로 업데이트

---

## Git

```
Remote: https://github.com/alruminum/memory-battle.git
Branch: main
```

### 커밋 메시지 규칙

#### 템플릿

```
<type>(<scope>): <한 줄 요약>

[왜] <트리거 — 버그: 재현 조건 / 기능: 요구사항 출처 / 리팩: 문제 상황>
[변경]
- <파일/모듈>: <변경 내용>
[주의] <사이드이팩트·후속 작업> (없으면 생략)

Closes/Related to #NNN
```

> `.gitmessage` 파일이 프로젝트 루트에 있음. `git config commit.template .gitmessage` 로 등록하면 `git commit` 시 에디터에 자동 삽입.

#### scope 목록

`game-engine` `store` `overlay` `ranking` `ad` `timer` `combo` `harness` `agent` `docs` `test` `ci`

#### type별 [왜] 작성 기준

| type | [왜] 내용 |
|---|---|
| `fix` | 재현 조건 + 근본 원인 (한 문장) |
| `feat` | PRD/이슈 번호 + 어떤 요구사항인지 |
| `refactor` | 어떤 문제가 있었는지 (가독성/성능/결합도) |
| `chore` | 왜 이 시점에 필요했는지 |
| `docs` | 무엇이 불일치/누락됐었는지 |
| `test` | 어떤 시나리오가 커버 안 됐었는지 |

#### 커밋 분리 원칙

- 문서 변경 + 코드 변경 → 반드시 별도 커밋
- chore(harness/agent) + feat → 반드시 별도 커밋
- 실패 커밋 재시도 → push 전 `git rebase -i`로 squash

#### 이슈 연결

- 완료: `Closes #NNN`
- 참조: `Related to #NNN`

### 이슈 close 규칙 (절대 원칙)

- **GitHub API로 이슈를 직접 close 금지** (engineer, architect 등 모든 에이전트 포함)
- 이슈는 반드시 **`git push` 이후** `Closes #NNN` 커밋 메시지로만 자동 close됨
- push 전에 이슈가 닫히면 레포지토리에 fix가 없는 상태로 이슈가 닫히는 문제 발생

---

## stories.md 작성 규칙

- **스토리 번호**: 에픽 내 독립 순번 (Story 1, Story 2, Story 3 …). 전역 번호 사용 금지.
- **impl 파일 번호**: 에픽 내 독립 순번 (01-*, 02-*, 03-* …). 전역 번호 사용 금지.
- 새 에픽 stories.md 작성 전 직전 에픽 stories.md를 읽어 컨벤션 확인 필수.

---

## 에이전트 호출 규칙 (메인 Claude 준수)

- **서브에이전트 base 우회 금지**: 에이전트 호출 시 해당 에이전트 base의 워크플로우를 우회하는 방식으로 작업 지시 금지.
- **architect 호출 시 반드시 Mode 명시**: System Design(Mode A) / Module Plan(Mode B) / SPEC_GAP(Mode C) / Task Decompose(Mode D) / Technical Epic(Mode E) 중 하나로 호출. "특정 파일 직접 수정" 형태의 지시 금지.
  - **프롬프트 첫 줄 형식 필수**: `[Mode명] — [용도 한 줄 설명]` 형태로 작성. 예: `Module Plan(Mode B) — 모듈별 구현 계획 파일 작성`. Mode 단독 표기 금지.
  - PRD/스펙 변경으로 설계 문서(game-logic.md 등) 업데이트가 필요하면 → 변경된 PRD 내용과 함께 Module Plan(Mode B)으로 호출. architect가 공통 지침(TRD 현행화 포함)대로 처리한다.

### architect Mode 상세

| Mode | 용도 | 산출물 |
|---|---|---|
| **System Design(Mode A)** | 시스템 전체 구조 설계 | `docs/architecture.md` 등 설계 문서 |
| **Module Plan(Mode B)** | 모듈별 구현 계획 파일 작성 | `docs/impl/NN-*.md` ← **기본값** |
| **SPEC_GAP(Mode C)** | SPEC_GAP 피드백 처리 | impl 파일 수정 |
| **Task Decompose(Mode D)** | Epic stories → 기술 태스크 분해 + impl batch 작성 | stories 업데이트 + impl 파일들 |
| **Technical Epic(Mode E)** | 기술 에픽 설계 (성능·보안·리팩) | `docs/` 설계 문서 |

> Mode를 명시하지 않으면 architect가 거부함 (PreToolUse 훅). **구현 전 계획이면 Module Plan(Mode B)가 기본.**
> **버그픽스 시**: 프롬프트 첫 줄에 `버그픽스 —` 명시 필수 (architect가 Epic/Story 이슈 생성 스킵)

### designer 루프 트리거 기준

"스크린샷이 달라지는가?"가 핵심 질문.

| 요청 유형 | designer 루프 필요? |
|---|---|
| 새 화면 추가 | ✅ 필요 |
| 기존 화면 레이아웃·색상·컴포넌트 변경 | ✅ 필요 |
| 애니메이션·트랜지션 추가 | ✅ 필요 (시각적 차이 발생) |
| 버그 픽스 (동작 수정, 화면 변화 없음) | ❌ 불필요 |
| 로직 리팩토링 (UI 변화 없음) | ❌ 불필요 |
| 텍스트/문구 변경 | ❌ 불필요 → architect Mode B 직행 |

---

## AI 개발 (MCP)

```bash
# 앱인토스 공식 문서 검색 — 프로젝트 레벨 등록
claude mcp add --transport stdio apps-in-toss ax mcp start
```

등록 후 `@docs` 컨텍스트로 문서 검색 가능.
