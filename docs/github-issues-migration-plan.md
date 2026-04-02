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
→ **레이블로 에픽 표현하는 현재 플랜이 개인 레포 최선.**

**Sub-issues (2025 GA):** 이슈 안에 parent-child 계층 생성 가능.
현재 플랜의 마크다운 체크리스트 방식이 우리 규모에 더 실용적 — **변경 불필요.**

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
| Step 3 | Labels 생성 (11개) | ✅ |
| Step 4 | Issues 생성 (28개, 전부 closed) | ✅ |
| Step 5 | 에이전트 업데이트 (engineer, architect, qa) | ✅ |
| Step 6 | CLAUDE.md 워크플로우 업데이트 | ✅ |
| Step 7 | backlog.md 아카이브 노트 추가 | ✅ |

---

## GitHub 구조 설계

### Milestones (버전 = 마일스톤)
| 마일스톤 | 설명 |
|---|---|
| `v01` | Epic 01-04 (게임 코어, 백엔드, 광고, 화면 완성) |
| `v03` | Epic 05-09 (메카닉 개편, 문서 구조, DB 타입, UI 리팩, 콤보) |

### Labels (에픽 = 레이블)
| 레이블 | 색상 | 에픽 |
|---|---|---|
| `epic-01: 게임 코어` | #0075ca | Epic 01 |
| `epic-02: 백엔드/데이터` | #e4e669 | Epic 02 |
| `epic-03: 광고/수익화` | #d93f0b | Epic 03 |
| `epic-04: 화면 완성` | #0e8a16 | Epic 04 |
| `epic-05: 게임 메카닉 개편` | #5319e7 | Epic 05 |
| `epic-06: 마일스톤 문서 구조` | #bfd4f2 | Epic 06 |
| `epic-07: DB 타입 안전성` | #fef2c0 | Epic 07 |
| `epic-08: GamePage 리팩` | #e99695 | Epic 08 |
| `epic-09: 콤보 시스템 전면 개편` | #c5def5 | Epic 09 |
| `type: bug` | #d73a4a | 버그 |
| `type: feat` | #a2eeef | 신기능 |

### Issues (스토리 = 이슈)
- 제목 형식: `[Epic 0N] Story M: {스토리 제목}`
- 본문 형식: 기존 stories.md의 컨텍스트 블록 + 체크리스트 (마크다운 그대로)
- impl 파일 링크: 본문 상단에 `📋 impl: docs/milestones/.../impl/NN-*.md`
- 완료 스토리: closed 상태로 생성
- 미완료 스토리: open 상태로 생성

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

### Step 5: 에이전트 프롬프트 업데이트

`.claude/agents/` 아래 프로젝트 에이전트 파일에 아래 내용 추가:

| 에이전트 | 추가 내용 | tools 추가 |
|---|---|---|
| `engineer.md` | 스토리 확인 시 stories.md 대신 GitHub Issues 참조. GitHub MCP 사용 | GitHub MCP read tools |
| `architect.md` | 신규 에픽 impl/*.md 작성 후 GitHub Issue 생성 의무 (마일스톤 + 에픽 레이블 포함) | `mcp__github__create_issue`, `mcp__github__add_labels_to_issue` |
| `qa.md` | 버그 발견 시 GitHub MCP `create_issue` 직접 호출해 Issue 등록. Issue 번호를 QA 리포트 상단에 기재 (`🐛 Issue: #NNN`) | `mcp__github__create_issue` |
| `product-planner.md` | backlog.md 대신 GitHub Milestones/Issues로 관리. 새 마일스톤·에픽 이슈 생성, 기존 이슈 목록 조회 | `mcp__github__create_issue`, `mcp__github__list_issues`, `mcp__github__create_milestone` (API 지원 시) |

> ⚠️ 실제 MCP tool 이름은 GitHub MCP 서버 설치 후 `claude mcp list` 로 확인. 위 이름은 예시이며 다를 수 있음.

체크리스트 업데이트 도구:
- **GitHub MCP `update_issue` 우선** (체크박스 토글 + state 변경 모두 지원)
- MCP 없으면: 기존 body를 읽어서 수정 후 `gh api repos/{owner}/{repo}/issues/{number} --method PATCH --field body="..."` 로 전체 교체
- 완료 시 MCP `update_issue` (state: "closed") 또는 `gh issue close <number>`

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

1. architect → impl/*.md 작성 (레포)
2. **architect** → GitHub Issue 생성 (스토리 단위, impl 링크 포함)
   - GitHub MCP `create_issue` 사용
   - 마일스톤 + 에픽 레이블 연결
3. engineer → 구현 → Issue 체크리스트 업데이트 → close

## QA 이슈 등록 워크플로우

테스트 중 버그 발견 시 qa 에이전트는 **작업 시작 전 반드시 GitHub Issue를 먼저 등록**한다.
qa 에이전트가 GitHub MCP `create_issue`를 **직접** 호출한다 (orchestrator 경유 불필요).

1. QA 리포트 작성 (`QA_REPORT` 마커)
2. **qa 에이전트가 GitHub MCP `create_issue` 직접 호출**:
   - 제목: `[Bug] {이슈 요약}`
   - 레이블: `type: bug` + 해당 에픽 레이블
   - 본문: QA 리포트의 위치/증거/기대 vs 실제/추천 액션 포함
3. Issue 번호를 QA 리포트 상단에 기재: `🐛 Issue: #NNN`
4. 이후 engineer → fix → Issue close 흐름으로 진행

---

## 검증 방법

```bash
# 마이그레이션 후 확인
gh issue list --milestone v03 --state all   # 전체 이슈 목록
gh issue list --state open                  # 미완료 이슈만
gh milestone list                           # 마일스톤 현황
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
