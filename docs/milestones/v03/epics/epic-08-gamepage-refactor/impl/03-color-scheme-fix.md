# 03. 브라우저 다크모드 강제 필터 차단 (color-scheme 선언)

## 결정 근거

- 게임은 커스텀 다크 테마(`--vb-bg: #0e0e10`)를 사용함에도 브라우저에게 이를 명시하지 않아
  OS 다크모드 활성 시 UA가 자동 invert 필터를 추가 적용 → 버튼·배경 색상이 이중으로 어두워짐
- `color-scheme: dark` 선언만으로 UA 강제 필터를 차단할 수 있음
  - `<meta name="color-scheme" content="dark">` (파싱 단계에서 즉시 적용, FOUC 방지)
  - `:root { color-scheme: dark; }` (CSS 로드 이후 확정)
- 게임 특성상 라이트/다크 모드 전환을 지원하지 않으며, 디자인은 항상 다크로 고정
- 기존 `@media (prefers-color-scheme: dark)` `--bg-*` 변수 블록은 건드리지 않음
  (해당 블록은 UA 필터와 무관하게 CSS 변수 재지정이므로 독립 동작)

## 생성/수정 파일

- `index.html` (수정) — `<head>` 내 `color-scheme` meta 태그 추가
- `src/index.css` (수정) — 첫 번째 `:root` 블록에 `color-scheme: dark` 추가

---

## index.html

### 핵심 로직

```html
<!-- 수정 전 (line 3-7) -->
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no" />
  <title>memorybattle</title>
</head>

<!-- 수정 후: viewport meta 바로 다음에 추가 -->
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no" />
  <meta name="color-scheme" content="dark" />
  <title>memorybattle</title>
</head>
```

---

## src/index.css

### 핵심 로직

```css
/* 수정 전 — 첫 번째 :root 블록 (line 3) */
:root {
  --vb-bg: #0e0e10;
  /* ... */
}

/* 수정 후 — color-scheme 첫 번째 줄에 추가 */
:root {
  color-scheme: dark;
  --vb-bg: #0e0e10;
  /* ... */
}
```

---

## 주의사항

- **수정 범위**: 2개 파일, 각 1줄 추가. 로직·게임 상태·컴포넌트 변경 없음.
- **Breaking Change**: 없음. 기존 `--bg-*` 변수, `@media (prefers-color-scheme: dark)` 블록, `[data-theme='dark']` 블록 모두 그대로 유지.
- **FOUC(Flash of Unstyled Content) 방지**: meta 태그 선언이 CSS 로드보다 먼저 파싱되므로 CSS의 `:root color-scheme`보다 meta가 우선 적용됨 → 두 위치 모두 추가하는 것이 정확한 패턴.
- **DB 영향도**: 없음. HTML/CSS 변경만.
- **다른 모듈 경계**: 없음. `index.html`과 `src/index.css`는 진입점 파일이며 다른 컴포넌트 의존 없음.

## 테스트 경계

- 단위 테스트 가능: 없음 (CSS 속성 추가)
- 통합 테스트 필요: 없음
- 수동 검증:
  1. OS/브라우저 다크모드 ON 상태에서 앱 실행
  2. 게임 버튼(빨강·파랑·초록·노랑) 색상이 원래 디자인 색상과 동일하게 표시되는지 확인
  3. 배경(`--vb-bg: #0e0e10`) 이중 어두워짐 없는지 확인
  4. OS 다크모드 OFF 상태에서도 게임 UI 색상 정상인지 교차 확인
