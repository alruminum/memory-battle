# 13. 카운트다운 힌트 텍스트 가독성 개선

> 관련 이슈: [#83](https://github.com/alruminum/memory-battle/issues/83)

---

## 결정 근거

| 항목 | 현재 값 | 변경 값 | 이유 |
|---|---|---|---|
| 1줄 fontSize | `13` | `15` | 유저 요청 — 다소 작다는 피드백 |
| 2줄 fontSize | `12` | `13` | 유저 요청 — 1줄보다 작아 균형 맞추기 |
| 2줄 color | `var(--vb-text-dim)` (`#505055`) | `var(--vb-text-mid)` (`#8b8b90`) | `#505055`는 어두운 배경과 대비가 낮아 거의 보이지 않음. `#8b8b90`은 배경 대비 충분하면서도 1줄(`#e8e8ea`)보다 어두워 위계 유지 |
| 2줄 fontWeight | `500` | 유지 | 색상 교체만으로 가독성 확보 충분 |

**1줄/2줄 시각 위계 유지 기준:**
- 1줄: fontSize 15 + color `#e8e8ea` (밝고 크게 — 주요 행동 지침)
- 2줄: fontSize 13 + color `#8b8b90` (중간 밝기 + 작게 — 보조 설명)

**대안 검토:**

| 대안 | 설명 | 미채택 이유 |
|---|---|---|
| 2줄 color → `var(--vb-text)` | 1줄과 동일한 밝기 | 위계 구분 불가 — 1줄과 동등하게 보임 |
| 2줄 fontWeight → 700 | 굵기로 보완 | color 교체만으로 충분. 굵기 추가는 과잉 |
| 인라인 hex 값 직접 지정 | `#8b8b90` 직접 적기 | CSS 변수 일관성 파괴. `--vb-text-mid` 변수가 이미 존재하므로 변수 사용 |

---

## 생성/수정 파일

- `src/pages/GamePage.tsx` (수정) — StageArea 힌트 블록 L57–73: fontSize + color 변경

---

## 인터페이스 정의

외부 인터페이스 변경 없음. Props, 반환 타입, store 스키마, data-testid 모두 유지.

---

## 핵심 로직

### Before (`src/pages/GamePage.tsx` L57–73)

```tsx
{/* 힌트 문구 블록 — 2줄 고정, 타이머 전환 없음 (#82) */}
<div className="countdown-hint" style={{ padding: '2px 0' }}>
  <div style={{
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--vb-text)',
    lineHeight: 1.5,
  }}>
    깜빡이는 순서 그대로 누르세요
  </div>
  <div style={{
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--vb-text-dim)',
    lineHeight: 1.5,
    marginTop: 2,
  }}>
    상대방보다 더 빨리 눌러 콤보를 쌓고 고득점을 노리세요
  </div>
</div>
```

### After

```tsx
{/* 힌트 문구 블록 — 2줄 고정, 타이머 전환 없음 (#82) */}
<div className="countdown-hint" style={{ padding: '2px 0' }}>
  <div style={{
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--vb-text)',
    lineHeight: 1.5,
  }}>
    깜빡이는 순서 그대로 누르세요
  </div>
  <div style={{
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--vb-text-mid)',
    lineHeight: 1.5,
    marginTop: 2,
  }}>
    상대방보다 더 빨리 눌러 콤보를 쌓고 고득점을 노리세요
  </div>
</div>
```

**변경 요약:**
- 1줄 `fontSize: 13` → `fontSize: 15`
- 2줄 `fontSize: 12` → `fontSize: 13`
- 2줄 `color: 'var(--vb-text-dim)'` → `color: 'var(--vb-text-mid)'`

---

## 주의사항

- **Breaking Change 없음**: data-testid(`hint-line1`, `hint-line2`), 텍스트 내용, CSS class 모두 유지. 기존 E-1~E-5 단위 테스트 영향 없음.
- **DB 영향도**: 없음. 순수 UI 스타일 수정.
- **CSS 변수 확인**: `--vb-text-mid: #8b8b90` 이미 `src/index.css`에 선언되어 있음. 신규 선언 불필요.
- **`--vb-text-dim` 타 위치 확인 필수**: `src/pages/GamePage.tsx` 내 `--vb-text-dim` 참조가 힌트 블록 외 다른 위치에도 있으면 이번 수정과 무관함을 확인 후 진행한다. 힌트 블록 L68만 교체 대상.

---

## 테스트 경계

- **단위 테스트 가능**: 없음 — 이번 변경은 fontSize/color 스타일 값 수정. JSDOM은 computed style을 지원하지 않으므로 단위 테스트로 검증 불가. 기존 E-1~E-5 (텍스트 내용 TC)는 영향 없음.
- **통합 테스트 필요**: 없음
- **수동 검증**:
  1. [BROWSER:DOM] DevTools Elements 패널에서 1줄 `font-size: 15px`, 2줄 `font-size: 13px` 확인
  2. [BROWSER:DOM] DevTools Elements 패널에서 2줄 `color` computed value = `rgb(139, 139, 144)` (`#8b8b90`) 확인
  3. [MANUAL] 카운트다운(3→2→1) 진행 중 1줄/2줄 힌트 문구가 명확히 구분되어 읽히는지 육안 확인
  4. [MANUAL] 게임 플레이 (SHOWING/INPUT) 진입 시 힌트 블록이 기존과 동일하게 사라지는지 확인 (회귀 없음)

---

## 수용 기준

| # | 항목 | 대상 | 유형 |
|---|---|---|---|
| AC1 | 1줄("깜빡이는 순서 그대로 누르세요") font-size = 15px | GamePage StageArea 힌트 1줄 | BROWSER:DOM |
| AC2 | 2줄("상대방보다 더 빨리...") font-size = 13px | GamePage StageArea 힌트 2줄 | BROWSER:DOM |
| AC3 | 2줄 color computed value = `rgb(139, 139, 144)` (#8b8b90) | GamePage StageArea 힌트 2줄 | BROWSER:DOM |
| AC4 | 카운트다운 중 1줄이 2줄보다 크고 밝게 표시 (위계 유지) | GamePage StageArea 힌트 블록 | MANUAL |
| AC5 | SHOWING 진입 시 힌트 블록 미노출 (회귀 없음) | GamePage StageArea | MANUAL |
