---
depth: simple
---

# impl: #147 ResultPage 랭킹행 비강조 색상 CSS 변수 교체

## 수정 대상

| 항목 | 내용 |
|---|---|
| 이슈 | [#147](https://github.com/alruminum/memory-battle/issues/147) |
| 파일 | `src/pages/ResultPage.tsx` |
| 위치 | 랭킹 3행 map 블록 — 랭킹 숫자 `<div>` 인라인 스타일 |
| 현재 라인 | 266 |
| 타입 | CLEANUP (CSS 변수 일관성) |

## 현재 → 목표

```tsx
// Before (현재 코드)
color: highlight ? 'var(--vb-accent)' : 'var(--vb-text)',

// After
color: highlight ? 'var(--vb-accent)' : 'var(--vb-text-dim)',
```

변경 범위: **단일 문자열 치환 1건**. 로직·타입·컴포넌트 구조 변화 없음.

## 스펙 vs 실제 코드 불일치 메모

> 이슈 본문은 현재 코드가 `'#8b8b90'` raw hex라고 기술하지만, 워크트리 실제 코드는
> `'var(--vb-text)'` (= `#e8e8ea`, bright white)이다.
> PR #146 merge 후 해당 값이 `var(--vb-text)`로 덮어써진 것으로 추정.

이슈 본문의 "시각적 변화 없음" 주장도 부정확하다:

| 변수 | 값 | 비고 |
|---|---|---|
| `--vb-text` | `#e8e8ea` | 현재 코드 (밝은 흰색) |
| `--vb-text-mid` | `#8b8b90` | 이슈 주장 원래 값 |
| `--vb-text-dim` | `#505055` | 목표 값 (어두운 회색) |

실제 변경 후 비강조 랭킹 숫자(Monthly, Season)는 기존 밝은 흰색 → 어두운 회색으로 시각적 변화가 있다.
**이는 의도된 동작이다**: 비강조 랭킹 숫자가 강조(Daily, `--vb-accent`) 대비 충분히 묻혀야 계층구조가 명확해진다.

## 결정 근거

- `--vb-text-dim`을 채택하는 이유: 이슈 #147이 명시적으로 지정. 파일 내 다른 dim 텍스트(`FINAL SCORE` 레이블, Stage 표시, COMBO STATS 레이블, COMBO STATS 서브 레이블)도 `--vb-text-dim` 사용 — 통일.
- `--vb-text-mid` 대안 검토: `#8b8b90`으로 이슈 원본 의도에 가깝지만, 이슈가 `--vb-text-dim`을 명시적으로 지정했고 같은 파일의 다른 dim 텍스트와 일관성을 맞추는 것이 우선.
- `src/index.css` 변경 없음: `--vb-text-dim` 이미 정의됨 (line 13).

## 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/pages/ResultPage.tsx` | line 266: `'var(--vb-text)'` → `'var(--vb-text-dim)'` (1줄 치환) |
| `src/index.css` | 변경 없음 (재확인만) |

## 검증 기준

- `tsc --noEmit` PASS
- `eslint src/pages/ResultPage.tsx` PASS (no-raw-color 규칙 없으나 일관성 검증)
- 기존 테스트 (`ResultPage.*.test.tsx` 3종) PASS — color 인라인 스타일 assertion 없음, 회귀 없음

## 주의사항

- `data-testid`, DOM 구조, 텍스트 리터럴 변경 없음 → 기존 테스트 회귀 없음 (simple depth 확인 완료)
- `--vb-text-dim`이 충분히 어두워 접근성 대비비가 낮을 수 있음 (배경 `--vb-surface: #18181b` 기준). 단 이슈 scope 외 항목 — 후속 이슈로 처리.
