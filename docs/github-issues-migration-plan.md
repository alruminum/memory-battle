# GitHub Issues 마이그레이션 플랜

## Context

현재 프로젝트는 backlog.md → stories.md → impl/*.md 3계층 문서로 PM을 운영 중.
GitHub MCP 도입에 맞춰 backlog + stories 레이어를 GitHub Issues로 이전하고,
CLAUDE.md 워크플로우를 업데이트해 에이전트들이 GitHub Issues 기반으로 작업하게 한다.

**impl/*.md 파일은 레포에 계속 유지** (앞으로도 신규 에픽에 계속 생성).
이유: 긴 코드 스니펫/타입 정의는 GitHub Issues에 부적합, 아키텍처 결정 기록 역할.

**완료된 스토리도 closed Issue로 생성** (히스토리 보존).
**로컬 stories.md / backlog.md 파일은 삭제하지 않고 유지** (아카이브).

---

## 리서치 결과 (2026-04-02)

### GitHub 기능 매핑 검증

| 우리 개념 | GitHub 대응 | 판정 |
|---|---|---|
| 마일스톤 (v01, v03) | Milestones | ✅ 완벽 대응 |
| 에픽 | Labels (현재 플랜) | ✅ 개인 레포 표준 방식 |
| 스토리 | Issues | ✅ 완벽 대응 |
| 태스크 체크리스트 | Issue body 마크다운 체크리스트 | ✅ 현재 플랜 유지 |
| 백로그 | GitHub Projects board 백로그 컬럼 | ✅ 가능 |
| 애자일 보드 | GitHub Projects v2 (Board/Table/Roadmap 뷰) | ✅ 가능 |
| QA 이슈 | `type: bug` 레이블 + Issues | ✅ 완벽 대응 |

### 주요 결론

**Issue Types (Epic/Story/Task 직접 정의) 기능은 Organization 계정 전용.**
`alruminum/memory-battle`은 개인 레포이므로 사용 불가.
→ **Epic 부모 이슈 + sub-issues 계층으로 구현.**

**Sub-issues (2025 GA):** 이슈 안에 parent-child 계층 생성 가능.
→ **Epic 부모 이슈(#29~37) 아래 스토리 이슈를 sub-issue로 연결해 계층 구현.**
API: `POST /repos/{owner}/{repo}/issues/{parent_number}/sub_issues` — body: `{"sub_issue_id": <내부 ID>}`

**GitHub Projects v2 뷰 3종:**
- Board 뷰 — 칸반 (Status 컬럼)
- Table 뷰 — 레이블·마일스톤 필터
- Roadmap 뷰 — 타임라인 (날짜 custom field 추가 시)
- Hierarchy 뷰 — Sub-issues 계층 표시

**문서 룰 변경 필요 없음.** 현재 플랜이 GitHub 구조에 자연스럽게 맞음.

### MCP 연동 현황 (2026-04-02)

- 토큰 발급 완료 (`.env`의 `GITHUB_PERSONAL_ACCESS_TOKEN`)
- `claude mcp add github -e GITHUB_PERSONAL_ACCESS_TOKEN=... -- npx -y @modelcontextprotocol/server-github` 등록
- **상태: Connected** ✅ — 패키지명 `@github/mcp-server` → `@modelcontextprotocol/server-github` 수정 후 해결

### 마이그레이션 완료 현황 (2026-04-02)

| Step | 내용 | 상태 |
|---|---|---|
| Step 1 | GitHub MCP 연동 | ✅ |
| Step 2 | Milestones 생성 (v01 #1, v03 #2) | ✅ |
| Step 3 | Labels 생성 → `epic`/`story` 2개로 단순화 | ✅ |
| Step 4 | 스토리 Issues 생성 (28개, 전부 closed, label=story) | ✅ |
| Step 5 | 에이전트 업데이트 (engineer, architect, qa) | ✅ |
| Step 6 | CLAUDE.md 워크플로우 업데이트 | ✅ |
| Step 7 | backlog.md 아카이브 노트 추가 | ✅ |
| Step 8 | Epic 부모 이슈 생성 (9개, #29~37, label=epic) + sub-issues 연결 | ✅ |
| Step 9 | Milestones 재구성: `Epics-v01`(closed), `Epics-v03`, `Story`, `issues-v03` 4개 체계 | ✅ |
| Step 10 | 에이전트 GitHub MCP 완전 통합 (architect/engineer/qa — 구체적 툴·마일스톤 명시) | ✅ |

---

## GitHub 구조 설계 (최종)

### Milestones (4개)

| 마일스톤 | GitHub # | 상태 | 용도 |
|---|---|---|---|
| `Epics-v01` | #1 | closed | v01 Epic 부모 이슈 (#29~32, 완료) |
| `Epics-v03` | #2 | open | v03 Epic 부모 이슈 (#33~37) |
| `Story` | #3 | open | 전체 스토리 이슈 (#1~28) |
| `issues-v03` | #5 | open | v03 버그/이슈 추적 (QA 전용) |

### Labels (4개)

| 레이블 | 색상 | 용도 |
|---|---|---|
| `epic` | #7057ff | Epic 부모 이슈 (#29~37) |
| `story` | #0075ca | 스토리 이슈 (#1~28) |
| `type: bug` | #d73a4a | 버그 |
| `type: feat` | #a2eeef | 신기능 |

### Issues 계층 구조

Epic 부모 이슈(9개, open) 아래 스토리 이슈를 sub-issue로 연결.

```
Epics-v01 milestone
  #29 [Epic 01] 게임 코어           ← sub-issues: #1~5
  #30 [Epic 02] 백엔드/데이터       ← sub-issues: #6~8
  #31 [Epic 03] 광고/수익화         ← sub-issues: #9~10
  #32 [Epic 04] 화면 완성           ← sub-issues: #11~13

Epics-v03 milestone
  #33 [Epic 05] 게임 메카닉 개편    ← sub-issues: #14~18
  #34 [Epic 06] 마일스톤 문서 구조  ← sub-issues: #19~21
  #35 [Epic 07] DB 타입 안전성      ← sub-issues: #22~23
  #36 [Epic 08] GamePage 리팩       ← sub-issue:  #24
  #37 [Epic 09] 콤보 시스템 개편    ← sub-issues: #25~28

Story milestone
  #1~28 (전체 스토리, label=story, closed)
```

### Issues (스토리 = 이슈)
- 제목 형식: `[Epic 0N] Story M: {스토리 제목}`
- 본문 형식: 기존 stories.md의 컨텍스트 블록 + 체크리스트 (마크다운 그대로)
- impl 파일 링크: 본문 상단에 `📋 impl: docs/milestones/.../impl/NN-*.md`
- 완료 스토리: closed 상태
- Epic 부모 이슈: open 유지 (히스토리 확인 용도)

---

## 마이그레이션 단계

### Step 1: GitHub MCP 연동 (전제 조건, 사용자 직접)
```bash
claude mcp add github -e GITHUB_PERSONAL_ACCESS_TOKEN={token} -- npx -y @github/mcp-server
```

### Step 2: Milestones 생성 (gh API — `gh milestone create` 명령어 없음)
```bash
gh api repos/alruminum/memory-battle/milestones \
  --method POST --field title="v01" \
  --field description="Epic 01-04: 게임 코어, 백엔드, 광고, 화면 완성"

gh api repos/alruminum/memory-battle/milestones \
  --method POST --field title="v03" \
  --field description="Epic 05-09: 메카닉 개편, DB 타입, UI 리팩, 콤보"
```

### Step 3: Labels 생성 (gh CLI)
```bash
gh label create "epic-01: 게임 코어" --color "0075ca"
gh label create "epic-02: 백엔드/데이터" --color "e4e669"
gh label create "epic-03: 광고/수익화" --color "d93f0b"
gh label create "epic-04: 화면 완성" --color "0e8a16"
gh label create "epic-05: 게임 메카닉 개편" --color "5319e7"
gh label create "epic-06: 마일스톤 문서 구조" --color "bfd4f2"
gh label create "epic-07: DB 타입 안전성" --color "fef2c0"
gh label create "epic-08: GamePage 리팩" --color "e99695"
gh label create "epic-09: 콤보 시스템 전면 개편" --color "c5def5"
gh label create "type: bug" --color "d73a4a"
gh label create "type: feat" --color "a2eeef"
```

### Step 4: Issues 생성 (스토리 → 이슈)

스토리 목록:

**v01 / epic-01 (5개, 전부 closed)**
- Story 1: 프로젝트 세팅
- Story 2: SDK 래퍼 · DB 클라이언트 (impl: 02-sdk-wrapper.md)
- Story 3: Zustand Store (impl: 03-zustand-store.md)
- Story 4: 게임 로직 훅 (impl: 04-game-engine.md)
- Story 5: 게임 화면 컴포넌트 (impl: 05-game-components.md)

**v01 / epic-02 (3개, 전부 closed)**
- Story 1: DB 설정
- Story 2: 랭킹 훅 (impl: 07-ranking-hook.md)
- Story 3: 일일 기회 (impl: 08-daily-chances.md)

**v01 / epic-03 (2개, 전부 closed)**
- Story 1: 광고 컴포넌트 (impl: 09-ad-components.md)
- Story 2: 결과 페이지 (impl: 10-result-page.md)

**v01 / epic-04 (3개, 전부 closed)**
- Story 1: 메인 페이지 (impl: 11-main-page.md)
- Story 2: 랭킹 페이지 (impl: 12-ranking-page.md)
- Story 3: 라우팅 (impl: 13-routing.md)

**v03 / epic-05 (5개)**
- Story 14: 난이도 시스템 제거 (impl: 14-difficulty-removal.md) → closed
- Story 15: 스테이지 기반 속도/타이머 (impl: 15-stage-speed-timer.md) → closed
- Story 16: 스택형 콤보 시스템 (impl: 16-combo-streak.md) → closed
- Story 17: 콤보 인게임 UI (impl: 17-combo-ui.md) → **open** (일부 미완료)
  - ⚠️ 이슈 본문에 "epic-09 콤보 시스템 전면 개편과 별개 작업" 명시 필요 (이름 혼동 방지)
- Story 18: 결과 화면 업데이트 (impl: 18-result-update.md) → closed

**v03 / epic-06 (문서만, impl 없음)** — stories.md 읽어서 생성
**v03 / epic-07, 08, 09** — stories.md 읽어서 동일 방식으로 생성

Issue 본문 템플릿:
```markdown
📋 impl: [docs/milestones/v03/epics/epic-05-mechanic-v03/impl/14-difficulty-removal.md](링크)

> PRD v0.3: 보상 구조가 랭킹 무관 방식으로 단순화되어 난이도 선택의 존재 의미가 없어졌다.

## Tasks
- [x] `src/types/index.ts` — Difficulty 타입 삭제
- [x] `src/store/gameStore.ts` — difficulty 필드 제거
...
```

### Step 5: 에이전트 프롬프트 업데이트 ✅

**실제 GitHub MCP tool 이름** (`@modelcontextprotocol/server-github`):
`create_issue`, `list_issues`, `get_issue`, `update_issue`, `search_issues`, `add_issue_comment`
→ Claude namespace: `mcp__github__*`
→ `create_milestone` 없음 — `gh api repos/{owner}/{repo}/milestones` 사용

| 에이전트 | 변경 내용 |
|---|---|
| `architect.md` | Epic 부모 이슈(`Epics-vNN`) + Story 이슈(`Story` 마일스톤) 생성 + sub-issue 연결 절차 명시 |
| `engineer.md` | `list_issues`로 미완료 스토리 조회 → `get_issue`로 본문 확인 → `update_issue`로 체크리스트 업데이트 → close |
| `qa.md` | 버그 이슈: milestone=`issues-v03`, labels=`type: bug` 명시 |

### Step 6: CLAUDE.md 워크플로우 업데이트

> ⚠️ Issue 번호는 생성 전에 알 수 없으므로, **Step 4 완료 후** 번호 확인하고 업데이트.

변경할 섹션: **작업 순서 (4단계)**

```markdown
## 작업 순서 (반드시 준수)

1. **GitHub Issues** 에서 해당 에픽 레이블/마일스톤으로 미완료 이슈 확인
   `gh issue list --label "epic-0N: ..." --milestone vNN`
2. **이슈 본문**에서 스토리 컨텍스트 + 태스크 체크리스트 확인
3. **impl/*.md** 계획 확인 (이슈 본문 상단 링크 참조)
4. 구현 후 GitHub Issue 체크리스트 업데이트 / 완료 시 이슈 close
```

에픽 테이블도 업데이트: impl 경로 + GitHub Issue 번호 모두 기재 (번호는 Step 4 완료 후 확인).

---

## 새 에픽 생성 워크플로우 (이후)

1. **architect** → impl/*.md 작성 (레포)
2. **architect** → GitHub Issues 생성:
   - Epic 부모 이슈: `mcp__github__create_issue` (milestone=`Epics-v03`, labels=`epic`)
   - Story 이슈: `mcp__github__create_issue` (milestone=`Story`, labels=`story`, body=impl 링크+체크리스트)
   - sub-issue 연결: `gh api repos/alruminum/memory-battle/issues/{epic}/sub_issues`
3. **engineer** → `mcp__github__list_issues`로 미완료 스토리 조회 → `mcp__github__get_issue`로 본문 확인 → 구현 → `mcp__github__update_issue`로 체크리스트 업데이트 → close

## QA 이슈 등록 워크플로우

버그 발견 시 qa 에이전트가 `mcp__github__create_issue`를 **직접** 호출한다.

- 제목: `[Bug] {이슈 요약}`
- milestone: `issues-v03`
- labels: `["type: bug"]`
- 본문: 위치/재현 조건/기대 vs 실제 동작
- Issue 번호를 QA 리포트 상단에 기재: `🐛 Issue: #NNN`
- 이후 engineer → fix → `mcp__github__update_issue`(state: closed) 흐름

---

## 검증 방법

```bash
# 마일스톤 현황
gh api repos/alruminum/memory-battle/milestones?state=all --jq '.[] | "\(.number) \(.state) \(.title)"'

# Epic 부모 이슈 목록
gh issue list --milestone "Epics-v01" --state all --repo alruminum/memory-battle
gh issue list --milestone "Epics-v03" --state all --repo alruminum/memory-battle

# 스토리 이슈 목록
gh issue list --milestone "Story" --state all --repo alruminum/memory-battle

# 미완료(open) 이슈만
gh issue list --state open --repo alruminum/memory-battle
```

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `CLAUDE.md` | 작업 순서 섹션 + 에픽 테이블 업데이트 (Issue 번호, Step 6에서) |
| `.claude/agents/engineer.md` | stories.md → GitHub Issues 참조, GitHub MCP read tools 추가 |
| `.claude/agents/architect.md` | 신규 에픽 Issue 생성 의무 + tools에 `mcp__github__create_issue` 추가 |
| `.claude/agents/qa.md` | 버그 Issue 먼저 등록 워크플로우 + tools에 `mcp__github__create_issue` 추가 |
| `.claude/agents/product-planner.md` | backlog → GitHub Milestones/Issues 관리 + GitHub MCP tools 추가 |
| `backlog.md` | 유지 (아카이브), 상단에 "GitHub Issues로 이전됨" 노트 추가 |
| `stories.md` (각 epic) | 유지 (아카이브), 삭제 안 함 |
| `impl/*.md` | 변경 없음 (레포에 계속 유지, 신규 에픽도 동일 방식) |
