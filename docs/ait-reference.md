# Apps-in-Toss 공식 샘플 분석 참고 문서

> 출처: https://github.com/toss/apps-in-toss-examples/tree/main
> 목적: 세션마다 구조·패턴을 다시 파악하지 않기 위한 레퍼런스

---

## ⚠️ 버전 주의사항 (가장 중요)

샘플 레포는 `@apps-in-toss/web-framework` **0.0.102** 기준.
이 프로젝트는 **2.1.1** (최신) 기준. `granite.config.ts` 포맷이 다름.

| 구분 | 샘플 (0.0.102) | 이 프로젝트 (2.1.1) |
|---|---|---|
| import 경로 | `@apps-in-toss/web-framework` | `@apps-in-toss/web-framework/config` |
| config 구조 | `plugins: [appsInToss({...})]` | `brand: { displayName, primaryColor }` |
| devServer | `devServer: { command: 'vite --host' }` | `web: { commands: { dev: 'vite' } }` |

→ **샘플 코드를 그대로 복붙하면 안 됨.** `ait init`으로 생성된 `granite.config.ts` 포맷 기준으로 작업.

---

## 프로젝트 구조 (WebView 기준)

```
project/
├── granite.config.ts        # 앱인토스 설정 (appName, brand, web)
├── vite.config.ts           # Vite 번들러 설정
├── tsconfig.json
├── tsconfig.app.json        # src/ 타입 설정 (paths alias 포함)
├── tsconfig.node.json       # vite.config 타입 설정
├── index.html               # viewport user-scalable=no 필수
├── package.json
├── .env                     # VITE_* 환경변수
└── src/
    ├── main.tsx             # ReactDOM.createRoot 진입점
    ├── vite-env.d.ts
    ├── index.css            # 글로벌 스타일
    ├── pages/               # 화면 단위 컴포넌트
    ├── components/          # 재사용 컴포넌트
    │   ├── game/            # 도메인별 하위 폴더
    │   └── ads/
    ├── hooks/               # 커스텀 훅
    ├── store/               # Zustand 스토어
    ├── lib/                 # 외부 클라이언트 래퍼 (supabase, ait)
    ├── types/               # 공통 타입
    └── utils/               # 유틸 함수
```

---

## granite.config.ts (v2.x 포맷)

```typescript
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'memory-battle',          // 콘솔 등록명과 반드시 일치
  brand: {
    displayName: '기억력배틀',
    primaryColor: '#ff6900',
    icon: null,                      // 콘솔 아이콘 URL 또는 null
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'tsc -b && vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
});
```

---

## package.json scripts 패턴

```json
{
  "scripts": {
    "dev": "granite dev",      // ← ait dev 아님. granite dev
    "build": "ait build",
    "deploy": "ait deploy",
    "preview": "vite preview",
    "lint": "eslint ."
  }
}
```

---

## SDK 임포트 경로

웹(WebView) 프로젝트는 `@apps-in-toss/web-framework` 에서 임포트.

```typescript
import { /* API */ } from '@apps-in-toss/web-framework';
```

React Native 프로젝트는 `@apps-in-toss/framework`.

---

## SDK 사용 패턴

### getUserId (웹)
공식 샘플에 웹 버전 없음. `docs/sdk.md` 기준:
```typescript
// getUserKeyForGame() → 구버전 폴백 getDeviceId()
import { getUserKeyForGame, getDeviceId } from '@apps-in-toss/web-framework';

async function getUserId(): Promise<string> {
  try {
    return await getUserKeyForGame();
  } catch {
    return await getDeviceId();
  }
}
```

### 게임센터 점수 제출 (with-game 샘플 기준)
```typescript
import { submitScore, getOperationalEnvironment } from '@apps-in-toss/web-framework';

const env = await getOperationalEnvironment();
if (env === 'toss') {
  await submitScore({ score: parseFloat(score.toFixed(1)) });
}
```

### 리더보드 열기
```typescript
import { openGameCenterLeaderboard } from '@apps-in-toss/web-framework';
await openGameCenterLeaderboard();
```

### 리워드 광고 (React Native 샘플 기준, 웹은 별도 래핑 필요)
```typescript
// 2단계: load → show
await loadFullScreenAd({ adGroupId: '...' });
await showFullScreenAd({
  onUserEarnedReward: () => { /* 보상 지급 */ },
  onAdDismissed: () => { /* 닫힘 */ },
});
```

### 배너 광고
```typescript
import { TossAds } from '@apps-in-toss/web-framework';

TossAds.initialize({ adGroupId: '...' });
const cleanup = TossAds.attachBanner(containerElement);
// cleanup() 호출로 제거
```

---

## 상태관리 (Zustand) 패턴

샘플(with-game) 기준 — 스토어 파일 분리:

```typescript
// src/store/gameStore.ts
import { create } from 'zustand';

interface GameState {
  status: 'IDLE' | 'SHOWING' | 'INPUT' | 'RESULT';
  score: number;
  // ... 상태
  startGame: () => void;
  gameOver: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  status: 'IDLE',
  score: 0,
  startGame: () => set({ status: 'SHOWING' }),
  gameOver: () => set({ status: 'RESULT' }),
}));
```

---

## 라우팅 패턴

샘플에서 사용 방식:
- **TanStack Router** (with-game): 멀티 페이지 게임
- **상태 기반 전환** (weekly-todo): 단순 SPA

이 프로젝트 권장: 상태 기반 또는 React Router (외부 의존성 최소화).

---

## 스타일링 패턴

**샘플 앱 모두 Tailwind 미사용.** CSS 모듈 또는 CSS 변수 사용.

이 프로젝트는 게임 앱 특성상 Tailwind 사용 (todo에 기록된 대로).
단, `src/index.css` 최상단에 `@tailwind` 디렉티브 필요:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 환경변수 패턴

```typescript
// .env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

// 코드에서 접근
const url = import.meta.env.VITE_SUPABASE_URL;
```

`granite.config.ts`의 `env()` 플러그인은 RN 전용. 웹은 Vite `.env` 파일 사용.

---

## 개발 중 광고 테스트 ID

```
리워드: ait-ad-test-rewarded-id
전면:   ait-ad-test-interstitial-id
배너:   ait-ad-test-banner-id
```

라이브 ID로 개발 중 테스트 시 **계정 제재** 위험. 반드시 테스트 ID 사용.

---

## index.html 필수 항목 (검수 요건)

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no" />
```

---

## tsconfig 경로 alias (권장)

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

```typescript
// vite.config.ts
import path from 'path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  }
});
```

---

## 패키지 매니저

샘플 레포 전체 **yarn 4.9.x** 사용. 이 프로젝트는 `npm` 사용 (변경 불필요).
