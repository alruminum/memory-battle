# 11. 모바일 탭 하이라이트 제거

> 버그픽스 — 관련 이슈: [#81](https://github.com/alruminum/memory-battle/issues/81)

---

## 버그 근본 원인

`src/index.css`에 `-webkit-tap-highlight-color: transparent` 전역 리셋이 없다.
WebKit 계열(iOS Safari, Android Chrome)은 `<button>` 탭 시 기본 파란색 사각형 하이라이트를 렌더링하며,
이를 제거하려면 `-webkit-tap-highlight-color: transparent`를 명시해야 한다.
추가로 `outline: none` 미적용 시 모바일 포커스 링이 함께 노출된다.

---

## 결정 근거

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **A. `src/index.css` 전역 button 블록에 추가 (채택)** | 단일 위치 수정으로 프로젝트 내 모든 `<button>` 요소에 일괄 적용. `ButtonPad.tsx`의 컬러 버튼 4개 + 중앙 버튼 모두 커버. | 채택 |
| **B. `ButtonPad.tsx` 인라인 스타일에 개별 적용** | 컬러 버튼 4개 + 중앙 버튼 각각 style 객체에 속성 추가 필요. 변경 지점이 5곳으로 분산되며, 향후 추가되는 버튼에도 매번 적용 필요. | 미채택 |

**A 채택 이유:**
- CSS 리셋은 전역 스타일시트에 두는 것이 표준 패턴
- 수정 지점 1곳 (index.css) — 영향 범위가 명확
- `ButtonPad.tsx` 인라인 스타일의 `border: 'none'` 과 동일한 의도로, CSS 레벨에서 처리가 적절
- Breaking Change 없음: `outline: none`은 게임 UI에서 시각적 포커스 링이 불필요하므로 전역 적용 무방

---

## 생성/수정 파일

- `src/index.css` (수정) — 기존 `* { box-sizing, margin, padding }` 블록 아래 `button` 전역 리셋 블록 추가

---

## 인터페이스 정의

외부 인터페이스 변경 없음. Props, 반환 타입, Zustand store 스키마 모두 유지.

---

## 핵심 로직

### Before (`src/index.css` 기존 전역 리셋 블록)

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

### After (추가 블록)

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

button {
  -webkit-tap-highlight-color: transparent;
  outline: none;
}
```

삽입 위치: `*` 블록(L123~127) 직후.

---

## 주의사항

- **DB 영향도**: 없음. CSS 전용 수정.
- **Breaking Change 없음**: `ButtonPad.tsx` 기존 인라인 스타일에 `border: 'none'`이 이미 있으며, 이번 추가 속성과 충돌 없음.
- **접근성 참고**: `outline: none` 전역 적용은 키보드 포커스 표시를 제거하는 부작용이 있으나, 이 프로젝트는 모바일 터치 전용 게임 앱이므로 키보드 네비게이션 요구사항이 없다. 향후 접근성 요구 발생 시 `:focus-visible` 선택자로 교체 고려.

---

## 테스트 경계

- **단위 테스트 가능**: 없음 — 순수 CSS 수정
- **통합 테스트 필요**: 없음
- **수동 검증**:
  1. [MANUAL-1] iOS Safari 또는 Android Chrome에서 컬러 버튼 4개 탭 → 파란색 하이라이트 미노출 확인
  2. [MANUAL-2] 중앙 버튼(스타트/클리어) 탭 → 파란색 하이라이트 미노출 확인
  3. [MANUAL-3] 데스크톱 Chrome에서 버튼 클릭 후 포커스 링 미노출 확인 (회귀 없음)

---

## 수용 기준

| # | 항목 | 대상 | 유형 |
|---|---|---|---|
| AC1 | 모바일 브라우저에서 컬러 버튼 4개 탭 후 파란색 사각형 하이라이트 미노출 | 컬러 버튼 4개 | MANUAL |
| AC2 | 모바일 브라우저에서 중앙 버튼 탭 후 파란색 사각형 하이라이트 미노출 | 중앙 버튼 | MANUAL |
| AC3 | `src/index.css`에 `button { -webkit-tap-highlight-color: transparent; outline: none; }` 블록 존재 | index.css | BROWSER:DOM |
| AC4 | 게임 동작(버튼 입력, 시퀀스 진행) 정상 (CSS 추가로 인한 회귀 없음) | 게임 전체 | MANUAL |
