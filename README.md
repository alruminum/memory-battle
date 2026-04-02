# 기억력배틀

토스 앱인토스 WebView 미니앱. 4개 색깔 버튼 시퀀스를 기억하고 맞추는 게임.

---

## 게임 방법

1. 화면에 표시되는 색깔 버튼 순서를 기억
2. 같은 순서로 버튼 입력
3. 틀리거나 제한 시간 안에 입력 못하면 게임 오버
4. 스테이지가 올라갈수록 시퀀스가 길어지고 버튼 깜빡임 속도·입력 제한 시간이 짧아짐

## 난이도 커브 (스테이지 기반 자동 조정)

| 스테이지 | 깜빡임 속도 | 입력 제한 시간 |
|---|---|---|
| 1 ~ 9 | 500ms | 2.0초 |
| 10 ~ 19 | 400ms | 1.8초 |
| 20 ~ 29 | 300ms | 1.6초 |
| 30 + | 250ms | 1.4초 |

## 점수 시스템

| 항목 | 내용 |
|---|---|
| 기본 점수 | 버튼 입력 시 +1 |
| 클리어 보너스 | 10스테이지 이상 클리어 시 `floor(stage / 5)` 추가 |
| 풀콤보 | 모든 버튼 0.3초 이내 연속 입력 시 달성 |
| 콤보 스트릭 배율 | 5스테이지 이상에서 연속 풀콤보 횟수에 따라 ×1 ~ ×5 적용 |

## 기술 스택

- **프레임워크**: React 19 + TypeScript (Vite)
- **플랫폼**: 앱인토스 WebView (`@apps-in-toss/web-framework` 2.x)
- **상태관리**: Zustand
- **DB**: Supabase (PostgreSQL)
- **스타일**: 인라인 style 객체 (Tailwind 미사용)

## 개발 환경 설정

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

환경변수 (`.env`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_NAME=memory-battle
```

## 프로젝트 구조

```
src/
├── lib/          # 외부 클라이언트 래퍼 (Supabase, 앱인토스 SDK)
├── store/        # Zustand 상태 관리
├── hooks/        # 게임 엔진, 타이머, 콤보 등
├── components/   # UI 컴포넌트
│   ├── game/     # 게임 화면 컴포넌트
│   ├── ads/      # 광고 컴포넌트
│   └── ranking/  # 랭킹 화면 컴포넌트
├── pages/        # 화면 단위 컴포넌트
└── types/        # 공통 타입 정의
```

## 문서

| 파일 | 내용 |
|---|---|
| [docs/architecture.md](docs/architecture.md) | 시스템 구조, 상태머신, 화면 흐름 |
| [docs/game-logic.md](docs/game-logic.md) | 게임 로직, 점수 계산 |
| [docs/db-schema.md](docs/db-schema.md) | DB 스키마, 랭킹 쿼리 |
| [docs/sdk.md](docs/sdk.md) | 앱인토스 SDK 연동 |
| [docs/ui-spec.md](docs/ui-spec.md) | 화면별 UI 스펙 |

## AI 협업 구조

이 프로젝트는 Claude Code와 멀티 에이전트 워크플로로 개발됩니다.

### 에이전트 역할

| 에이전트 | 역할 |
|---|---|
| **product-planner** | 요구사항 수집 → 기능 스펙 → 스코프 결정 |
| **architect** | 시스템 설계 및 모듈별 구현 계획 작성 (`impl/NN-*.md`) |
| **engineer** | impl 파일 + ui-spec + game-logic 참고해 코드 구현 |
| **test-engineer** | 구현 완료 코드 기반 테스트 작성·실행, TESTS_PASS/FAIL 판정 |
| **validator** | 설계/코드 검증 — PASS/FAIL 판정 (읽기 전용) |
| **pr-reviewer** | 커밋 전 코드 품질 리뷰 — 패턴·컨벤션·가독성 (읽기 전용) |
| **designer** | UI variant 3개 생성 (ASCII 와이어프레임 + React 구현체) |
| **design-critic** | 디자인 variant 점수화 및 PICK/ITERATE/ESCALATE 판정 (읽기 전용) |
| **qa** | 이슈 원인 분석 및 라우팅 추천 (읽기 전용) |

### 개발 흐름

```
product-planner (기획 + 스코프 결정)
  └→ [병렬] architect + validator (설계 잠금)
  └→ [병렬] designer + design-critic (UI 디자인)
  └→ architect → engineer (구현)
       └→ test-engineer (테스트 작성·실행)
       └→ validator (코드 검증)
       └→ pr-reviewer (커밋 전 코드 리뷰) → DONE
```

각 단계는 유저 명시적 승인 후 다음 단계로 진행합니다.
