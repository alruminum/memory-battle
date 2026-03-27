# 기억력배틀

토스 앱인토스 WebView 미니앱. 4개 색깔 버튼 시퀀스를 기억하고 맞추는 게임.

---

## 게임 방법

1. 난이도 선택 (Easy / Medium / Hard)
2. 화면에 표시되는 색깔 버튼 순서를 기억
3. 같은 순서로 버튼 입력
4. 틀리거나 2초 안에 입력 못하면 게임 오버
5. 스테이지가 높을수록 시퀀스가 길어지고 점수 증가

## 점수 시스템

| 항목 | 내용 |
|---|---|
| 기본 점수 | 버튼 입력 시 +1 |
| 클리어 보너스 | 10스테이지 이상 클리어 시 `floor(stage / 5)` 추가 |
| 풀콤보 | 모든 버튼 0.3초 이내 입력 시 스테이지 점수 ×2 |
| 난이도 배율 | Easy ×1 / Medium ×2 / Hard ×3 |

## 기술 스택

- **프레임워크**: React 19 + TypeScript (Vite)
- **플랫폼**: 앱인토스 WebView (`@apps-in-toss/web-framework` 2.x)
- **상태관리**: Zustand
- **DB**: Supabase (PostgreSQL)
- **스타일**: Tailwind CSS

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
