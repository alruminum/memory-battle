# 03. 게임오버 오버레이 블러 — 타이틀·HUD 제외

> 관련 이슈: [#49](https://github.com/alruminum/memory-battle/issues/49)

## 결정 근거

- **backdrop-filter blur 범위 문제**: `GameOverOverlay`의 `.gameover-backdrop`에 `backdrop-filter: blur(4px)` CSS가 적용되어 있다. backdrop-filter는 해당 요소의 배경(즉, 오버레이 뒤에 있는 모든 콘텐츠)에 필터를 적용한다. 오버레이가 `position: absolute; inset: 0`으로 GamePage 루트 div 전체를 덮기 때문에, 타이틀 영역과 HUD strip 영역도 블러 처리된다.
- **z-index 올리기 방식 선택**: 블러 범위를 줄이는 대안(오버레이를 게임 영역 일부만 덮도록 크기 제한)은 슬라이드업 패널 디자인 의도와 맞지 않는다. 대신 타이틀·HUD div를 `position: relative; z-index: 201`로 올려 오버레이(z-index: 200) 위에 렌더링하면, 두 영역은 오버레이의 backdrop-filter 대상(오버레이 아래 레이어)이 아닌 오버레이 위에 위치하므로 블러가 적용되지 않는다.
- **검토한 대안**:
  - `clip-path`로 오버레이 렌더 영역 제한: 슬라이드업 패널이 잘릴 수 있어 제외.
  - 오버레이를 별도 DOM 트리로 Portal 렌더링: 구조 변경이 크고 이 버그에 과도함. 제외.
  - 타이틀·HUD에 `isolation: isolate`: backdrop-filter 대상에서 제외하는 효과가 없음 (isolation은 stacking context 생성용). 제외.
  - z-index 상승: 구조 변경 최소 + 의도 명확 + 기존 패턴과 일관성. **채택**.
- **`position: relative` 추가 이유**: z-index는 `position`이 `static`이 아닌 요소에만 작동한다. 타이틀·HUD div 모두 현재 `position` 미지정(static)이므로 `position: relative`를 함께 추가해야 z-index: 201이 효과를 발휘한다.

---

## 생성/수정 파일

- `src/pages/GamePage.tsx` (수정) — 타이틀 div와 HUD strip div에 `position: 'relative', zIndex: 201` 추가

---

## 인터페이스 정의

변경 없음. `GamePageProps` 시그니처, `GameOverOverlayProps`, store 인터페이스 모두 유지.

```typescript
// 변경 없음
interface GamePageProps {
  onGameOver: () => void
  onRanking: () => void
}
```

---

## 핵심 로직

### `src/pages/GamePage.tsx` — 타이틀 div 수정

```typescript
{/* 타이틀 */}
<div style={{
  padding: '14px 20px 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottom: '1px solid var(--vb-border)',
  flexShrink: 0,
  position: 'relative',   // 추가: z-index 효과 활성화
  zIndex: 201,            // 추가: 오버레이(z-index 200) 위에 렌더링
}}>
  ...
</div>
```

### `src/pages/GamePage.tsx` — HUD strip div 수정

```typescript
{/* HUD 스트립 */}
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  backgroundColor: 'var(--vb-surface)',
  borderBottom: '1px solid var(--vb-border)',
  flexShrink: 0,
  position: 'relative',   // 추가: z-index 효과 활성화
  zIndex: 201,            // 추가: 오버레이(z-index 200) 위에 렌더링
}}>
  ...
</div>
```

---

## 주의사항

- **오버레이 z-index 기준**: `GameOverOverlay.tsx`의 backdrop div는 현재 `zIndex: 200`이다. 타이틀·HUD를 201로 설정해야 오버레이 위에 위치한다. 숫자 변경 시 두 값의 대소 관계를 함께 관리해야 한다.
- **`GamePage.tsx` 루트 div `position: 'relative'`**: 이미 02-overlay-bugfix에서 추가되어 있다. 루트 div를 다시 수정하지 않는다 — 타이틀·HUD div 내부 style 수정만 필요.
- **`flexShrink: 0` 유지**: 두 div 모두 flex 자식이므로 기존 `flexShrink: 0`을 제거하지 않는다.
- **게임 진행 중 상호작용 보존**: HUD strip 내 DAILY 버튼(`onRanking`)이 z-index 201로 올라와 오버레이 위에 있어도, RESULT 상태에서는 `GameOverOverlay`가 탭 핸들러를 받는 구조이므로 의도치 않은 탭 충돌에 주의. 단, DAILY 버튼 영역이 오버레이 패널과 겹치지 않으므로 실제 문제 없음.
- **Breaking Change 없음**: `GameOverOverlayProps` 인터페이스 변경 없음. 다른 파일 변경 없음.
- **DB 영향도**: 없음.

---

## 테스트 경계

- 단위 테스트 가능: 없음 (순수 함수 변경 없음)
- 통합 테스트 필요: 없음 (스타일 속성 추가만 포함)
- 수동 검증:
  - 게임 진행 중 오답 입력 또는 타이머 만료 → GameOverOverlay 등장 시 타이틀("MEMORY BATTLE")과 HUD(SCORE/STG/DAILY) 영역이 블러 없이 선명하게 표시되는지 확인
  - 오버레이 패널(backdrop blur 영역)은 버튼 패드 + 하단 영역에만 적용되는지 확인
  - 패널 탭 → ResultPage 전환 정상 동작 확인 (기존 기능 회귀 없음)
  - DAILY 버튼 탭 → 랭킹 페이지 전환 정상 동작 확인 (z-index 상승 후 탭 이벤트 정상 처리 여부)
