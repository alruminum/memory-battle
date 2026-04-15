---
depth: simple
---
# #105 Safe Area Fix — 노치/펀치홀 기기 safe area 미적용

## 수정 파일

- `index.html` (수정)
- `src/index.css` (수정)
- `src/App.tsx` (수정)

---

## 수정 사항 상세

### 1. `index.html`

viewport meta에 `viewport-fit=cover` 추가.

```html
<!-- 수정 전 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no" />

<!-- 수정 후 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
```

**결정 근거**: `viewport-fit=cover`가 없으면 WebView가 safe area를 자동 letterbox 회피하며, `env(safe-area-inset-*)` CSS 함수가 항상 0을 반환한다. CSS env() 방식 전체의 선제 조건으로, 이 한 줄이 빠지면 이후 모든 safe area 처리가 무효화된다.

---

### 2. `src/index.css`

#### 2-1. `:root` 블록 — safe area CSS 변수 4방향 선언

첫 번째 `:root {}` 블록(Line 3~57) 내부 맨 끝에 추가:

```css
/* safe area 인셋 변수 — 노치/펀치홀/다이나믹 아일랜드 */
--safe-area-top:    env(safe-area-inset-top,    0px);
--safe-area-right:  env(safe-area-inset-right,  0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-left:   env(safe-area-inset-left,   0px);
```

#### 2-2. `#root` 규칙 — safe area padding 적용

기존 `#root { ... }` 블록(Line 194~202)에 padding 4방향 추가:

```css
#root {
  width: 100%;
  max-width: 636px;
  height: 100dvh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 추가: safe area padding */
  padding-top:    var(--safe-area-top);
  padding-right:  var(--safe-area-right);
  padding-bottom: var(--safe-area-bottom);
  padding-left:   var(--safe-area-left);
}
```

**결정 근거**:
- `#root`에 padding 적용 시 전역 `* { box-sizing: border-box }` 상속으로 콘텐츠 영역이 `100dvh - safe-area-top - safe-area-bottom`으로 감소 → 모든 페이지(GamePage·ResultPage·RankingPage)에 일괄 적용됨.
- `body`가 아닌 `#root`를 선택한 이유: body padding은 상태바 영역 배경색 공백을 만든다. `#root`는 콘텐츠 컨테이너이므로 이 레벨에서 처리하면 배경(`body` 배경색)이 화면 전체를 자연스럽게 채우면서 콘텐츠만 safe area 안으로 들어온다.
- 일반 기기(safe area 0)에서는 fallback `0px`이 적용되어 레이아웃 변화 없음.

---

### 3. `src/App.tsx`

루트 div `height` 값 변경: `'100dvh'` → `'100%'`

```tsx
// 수정 전 (Line 47)
<div style={{ height: '100dvh', overflow: 'hidden' }}>

// 수정 후
<div style={{ height: '100%', overflow: 'hidden' }}>
```

**결정 근거**: `#root`가 이미 `height: 100dvh` + safe area padding을 가진다. 내부 div가 독립적으로 `100dvh`를 선언하면 `#root`의 콘텐츠 영역(`100dvh - padding`)을 초과해 safe area padding이 무력화된다. `height: 100%`로 변경하면 부모(`#root`) 콘텐츠 영역을 그대로 채워 safe area가 올바르게 작동한다.

---

## 주의사항

1. **페이지 컴포넌트 수정 불필요**: `GamePage`, `ResultPage`, `RankingPage`는 수정 대상 아님 — `#root` 레벨 일괄 처리.
2. **배경 확장 동작**: 배경색은 `body`에 선언되어 있으므로 safe area 영역(status bar·하단 인디케이터)도 앱 배경색으로 자연스럽게 채워진다. 의도한 동작.
3. **적용 순서 무관하나 세트 필수**: `viewport-fit=cover` 없이 CSS env()를 적용해도 항상 0 반환. 세 파일 변경이 세트로 배포되어야 효과 발생.
4. **`env()` 브라우저 지원**: iOS 11.2+, Android Chrome 69+에서 지원. 미지원 환경에서는 fallback `0px` 적용.

---

## 검증 기준

| 케이스 | 기대 결과 |
|---|---|
| iPhone 14+ (Dynamic Island) | 콘텐츠가 Dynamic Island/노치 아래에서 시작 |
| Android 펀치홀 기기 | 콘텐츠가 카메라 홀 아래에서 시작 |
| 하단 홈 인디케이터 있는 기기 | 하단 콘텐츠가 홈 인디케이터와 겹치지 않음 |
| 일반 기기 (safe area 없음) | 레이아웃 변화 없음 (0px padding 적용) |
| 라이트/다크 모드 전환 | 배경색이 safe area 영역까지 정상 표시 |
