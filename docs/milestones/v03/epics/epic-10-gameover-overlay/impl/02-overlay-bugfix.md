# 02. 게임오버 오버레이 버그픽스

> 관련 이슈: [#48](https://github.com/alruminum/memory-battle/issues/48)

## 결정 근거

- **버그 1 — `position: fixed` → `position: absolute` 변경**: `fixed`는 뷰포트 기준으로 위치가 결정되므로, 게임 컨테이너 바깥(상단 탭 바 등)까지 오버레이가 덮는 문제가 발생한다. `absolute`로 변경하면 가장 가까운 `position: relative` 조상을 기준으로 위치가 결정되어 컨테이너 내에 정확히 위치한다. 따라서 GamePage 루트 div에 `position: relative`를 추가하고, `.gameover-backdrop`을 `position: absolute`로 수정한다.
- **버그 2 — 핸들바·경고 아이콘·"GAME OVER" 타이틀 추가**: 디자인 Variant C 프리뷰에 명시된 요소들이 구현에서 누락됨. `GameOverOverlay.tsx` 패널 상단에 세 요소를 순서대로 삽입한다. 색상·크기는 프리뷰 스펙에서 직접 도출하며 CSS 변수(`--vb-text-dim`)를 재활용하여 다크 테마 일관성을 유지한다.
- **인라인 스타일 유지**: 기존 컴포넌트가 인라인 style + className 혼용 패턴을 따른다. 새 요소도 동일 패턴으로 추가하여 일관성을 유지한다.

---

## 생성/수정 파일

- `src/index.css` (수정) — `.gameover-backdrop` `position: fixed` → `position: absolute`
- `src/pages/GamePage.tsx` (수정) — 루트 div style에 `position: 'relative'` 추가
- `src/components/game/GameOverOverlay.tsx` (수정) — 패널 상단에 핸들바·경고 아이콘·"GAME OVER" 타이틀 추가

---

## 인터페이스 정의

변경 없음. `GameOverOverlayProps`와 `GameOverReason` 타입 시그니처는 01-gameover-overlay.md와 동일하게 유지된다.

```typescript
// 변경 없음
interface GameOverOverlayProps {
  reason: Exclude<GameOverReason, null>
  onConfirm: () => void
}
```

---

## 핵심 로직

### 1. `src/index.css` 수정

`.gameover-backdrop`에서 `position: fixed`를 제거하고 `position: absolute`로 교체한다.
`inset: 0`은 유지하여 컨테이너 전체를 덮는 동작을 보존한다.

```css
/* 변경 전 */
/* .gameover-backdrop 규칙에 position: fixed 가 GameOverOverlay 인라인 style로 적용 중 */

/* index.css에 별도 position 선언 없음 — GameOverOverlay.tsx 인라인 style의 position 변경이 핵심 */
/* → 아래 GameOverOverlay.tsx 수정으로 처리 */
```

> 실제로 `position: fixed`는 `GameOverOverlay.tsx`의 인라인 style에 선언되어 있다.
> `index.css`의 `.gameover-backdrop`에는 position이 없다.
> 따라서 CSS 수정 대상은 `GameOverOverlay.tsx` 인라인 style이며, `src/index.css`에는 `position: absolute` 명시 추가 여부를 판단해야 한다.
>
> **결정**: `GameOverOverlay.tsx` 인라인 style의 `position: 'fixed'`를 `position: 'absolute'`로 수정.
> `src/index.css`에 별도 position 추가 불필요 (인라인 style이 클래스보다 우선순위 높음).

### 2. `src/pages/GamePage.tsx` 수정

루트 `<div>`의 `style` prop에 `position: 'relative'`를 추가한다.

```typescript
// GamePage.tsx — 137번째 줄 근처 루트 div
<div
  className={isShaking ? 'shake' : ''}
  style={{
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'var(--vb-bg)',
    color: 'var(--vb-text)',
    fontFamily: 'var(--vb-font-body)',
    position: 'relative',   // 추가: GameOverOverlay(position: absolute)의 기준점
  }}
>
```

### 3. `src/components/game/GameOverOverlay.tsx` 수정

`position: 'fixed'`를 `position: 'absolute'`로 변경하고,
`.gameover-panel` div 내부 최상단(기존 제목 div 이전)에 세 요소를 삽입한다.

```typescript
// 변경: position fixed → absolute
<div
  onClick={onConfirm}
  className="gameover-backdrop"
  style={{
    position: 'absolute',   // fixed → absolute 변경
    inset: 0,
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  }}
>
  <div
    className="gameover-panel"
    style={{
      backgroundColor: 'var(--vb-surface)',
      borderTop: '1px solid var(--vb-border)',
      borderRadius: '16px 16px 0 0',
      padding: '28px 24px 40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}
  >
    {/* 핸들바 — 패널 상단 중앙 */}
    <div style={{
      width: 32,
      height: 4,
      backgroundColor: 'var(--vb-text-dim)',
      borderRadius: 2,
      marginBottom: 12,
    }} />

    {/* 경고 아이콘 — ⚠ */}
    <div style={{
      width: 48,
      height: 48,
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 59, 59, 0.15)',
      border: '1px solid rgba(255, 59, 59, 0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 22,
      marginBottom: 4,
    }}>
      ⚠
    </div>

    {/* "GAME OVER" 타이틀 */}
    <div style={{
      fontFamily: 'var(--vb-font-score)',   // Barlow Condensed
      fontSize: 13,
      color: 'var(--vb-text-dim)',
      letterSpacing: 3,
      textTransform: 'uppercase',
      marginBottom: 8,
    }}>
      GAME OVER
    </div>

    {/* 기존: 게임오버 이유 제목 (title) */}
    <div style={{
      fontFamily: 'var(--vb-font-score)',
      fontSize: 28,
      fontWeight: 900,
      color: 'var(--vb-accent)',
      letterSpacing: 2,
      textTransform: 'uppercase',
    }}>
      {title}
    </div>

    {/* 기존: 설명 */}
    <div style={{
      fontFamily: 'var(--vb-font-body)',
      fontSize: 14,
      color: 'var(--vb-text-mid)',
    }}>
      {desc}
    </div>

    {/* 기존: 힌트 */}
    <div style={{
      fontFamily: 'var(--vb-font-body)',
      fontSize: 12,
      color: 'var(--vb-text-dim)',
      marginTop: 20,
    }}>
      화면을 탭하여 계속
    </div>
  </div>
</div>
```

---

## 주의사항

- **`position: absolute`의 기준 조상**: `GamePage.tsx` 루트 div에 `position: 'relative'`가 없으면 `absolute` 오버레이가 더 상위 `position`이 있는 조상(예: `#root` 또는 `body`)을 기준으로 배치되어 레이아웃 이탈이 재발한다. GamePage 루트 div 수정을 반드시 세트로 진행해야 한다.
- **`height: '100%'`와 `position: 'relative'` 공존**: GamePage 루트 div에 이미 `height: '100%'`가 있으므로 `absolute` 자식이 `inset: 0`으로 정확히 맞춰진다. 별도 높이 설정 불필요.
- **Breaking Change 없음**: `GameOverOverlayProps` 인터페이스 변경 없음. `GamePage.tsx`의 오버레이 호출 코드 변경 불필요. 스타일 수정만으로 버그 해결.
- **`index.css` 수정 불필요**: `.gameover-backdrop` 클래스에 원래 `position` 선언이 없고, `position`은 `GameOverOverlay.tsx` 인라인 style에서 관리된다. CSS 파일 변경 없이 tsx 수정만으로 버그 1 해결.
- **DB 영향도**: 없음.

---

## 테스트 경계

- 단위 테스트 가능: 없음 (순수 함수 변경 없음)
- 통합 테스트 필요: 없음 (스타일 속성 변경만 포함)
- 수동 검증:
  - 게임 진행 중 타이머 만료 → 오버레이가 게임 컨테이너 내에만 표시되는지 확인 (상단 타이틀 바 미차단)
  - 오버레이 패널 상단에 핸들바(가로 막대), 경고 아이콘(⚠ 원형), "GAME OVER" 라벨이 순서대로 표시되는지 확인
  - 기존 "타임오버" / "잘못된 입력" 제목과 설명 텍스트 정상 표시 확인
  - 패널 탭 → ResultPage 전환 정상 동작 확인 (기존 기능 회귀 없음)
