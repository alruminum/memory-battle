# 02. FloatingItem type import 수정

> 버그픽스 — Issue [#80](https://github.com/alruminum/memory-battle/issues/80)

## 결정 근거

- `tsconfig.app.json` `"verbatimModuleSyntax": true` 설정 하에서 타입 전용 심볼은
  반드시 `import type` 또는 인라인 `type` 수식어로 임포트해야 한다.
- `FloatingItem`은 `FloatingScore.tsx`에서 `export interface FloatingItem`으로 선언된
  순수 인터페이스이며, `GamePage.tsx`에서는 `useState<FloatingItem[]>` 타입 파라미터로만
  사용되고 런타임 값으로는 전혀 사용되지 않는다.
- 수정 범위: 1줄, 런타임 동작 변화 없음.
- 버린 대안 — `import type { FloatingScore, FloatingItem }`: `FloatingScore`는
  JSX 컴포넌트(런타임 값)이므로 전체 `import type`은 불가. 인라인 `type` 수식어 방식이 유일한 선택.

## 생성/수정 파일

- `src/pages/GamePage.tsx` (수정 1줄) — FloatingItem 인라인 `type` 수식어 추가

---

## src/pages/GamePage.tsx

### 변경 위치

L13 (import 줄)

### 변경 내용

```typescript
// ❌ 수정 전
import { FloatingScore, FloatingItem } from '../components/game/FloatingScore'

// ✅ 수정 후
import { FloatingScore, type FloatingItem } from '../components/game/FloatingScore'
```

### 핵심 로직

```typescript
// FloatingItem 사용처 (타입 파라미터만 — 변경 없음)
const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([])
```

변경은 import 선언 1줄에만 국한되며 `FloatingItem` 사용처(L164, L206, L208)는
모두 타입 컨텍스트이므로 수정 불필요.

## 주의사항

- DB 영향도: 없음.
- Breaking Change: 없음 — 타입 수식어는 컴파일 타임 전용, 런타임 모듈 번들 변화 없음.
- `FloatingScore` 컴포넌트 자체는 런타임 값이므로 `type` 수식어 대상이 아님.

## 테스트 경계

- 단위 테스트 가능: 없음 (import 구문 변경만)
- 통합 테스트 필요: 없음
- 수동 검증:
  - `npm run build` 빌드 성공 (타입 에러 0건) 확인
  - 게임 화면에서 플로팅 점수 애니메이션 정상 렌더링 확인
