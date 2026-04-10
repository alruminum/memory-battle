# Bugfix #97 — 콤보 영역 간격 조정

> 관련 이슈: [#97](https://github.com/alruminum/memory-battle/issues/97)
> 분류: UI 간격 조정

---

## 버그 요약

콤보 묶음 컨테이너(ComboTimer + ComboIndicator) 내부 타이머·스택 간격과,
묶음 컨테이너 하단에서 버튼 패드(ButtonPad)까지의 시각적 여백이 부족하다.

- ComboTimer 게이지와 ComboIndicator 블록 사이 간격 없음 (`flex-column` + `gap` 미설정)
- 콤보 묶음 컨테이너 하단과 버튼 패드 사이 여백 없음 (`marginBottom` 미설정)
- ComboTimer anchor 래퍼 `height: 28`이 타이머 글로우 헤드를 포함하기에 빠듯하여 여백 부족에 기여

---

## 근본 원인

| 위치 | 원인 |
|---|---|
| 콤보 묶음 컨테이너 | `flexDirection: 'column'`이지만 `gap` 없음 → 타이머·스택 밀착 |
| 콤보 묶음 컨테이너 | `marginBottom` 없음 → 아래 버튼 패드와 밀착 |
| ComboTimer anchor 래퍼 | `height: 28` — #95에서 24px + 여유 4px로 설정됐으나, 실질적 시각 여백으로는 부족 |

---

## 결정 근거

### 수정 1: 콤보 묶음 컨테이너에 `gap: 6`, `marginBottom: 16` 추가

- `gap: 6` — ComboTimer anchor 래퍼(34px)와 ComboIndicator 사이 6px 간격을 명시적으로 부여.
  `gap`은 flex 자식 간 간격으로 자식 수가 바뀌어도 유효하며, 래퍼에 padding을 추가하는 것보다 의도가 명확하다.
- `marginBottom: 16` — 묶음 컨테이너 하단에서 버튼 패드 래퍼(flex: 3)까지 일정한 여백을 보장.
  버튼 패드 래퍼는 `alignItems: 'flex-start'`로 렌더링되므로, 콤보 컨테이너에 margin을 주는 방식이
  버튼 패드 래퍼의 flex 레이아웃을 깨지 않고 간격을 제어하는 가장 안전한 방법이다.
- 버린 대안 — 버튼 패드 래퍼에 `marginTop` 추가: `flex: 3`인 래퍼에 margin을 추가하면
  flex stretch 계산에서 의도치 않은 높이 변화를 유발할 수 있다.

### 수정 2: ComboTimer anchor 래퍼 `height: 28` → `height: 34`

- #95에서 계산한 ComboTimer 실제 DOM 높이는 ~24px이며 `height: 28`(여유 4px)로 설정됐다.
- 글로우 헤드 점(`height: 8px`, `top: -2px` 기준)이 anchor 래퍼 상단 경계에 가깝게 위치해
  시각적으로 잘릴 위험이 있고, 타이머와 스택 사이 실질 간격이 줄어든다.
- `height: 34` (24px 실제 높이 + 여유 10px)로 늘리면:
  - 글로우 헤드가 anchor 래퍼 안에 충분히 수용됨(`overflow: visible`은 유지)
  - 타이머와 스택(ComboIndicator) 사이 gap(6px) 이전에도 4px 추가 여백이 확보됨
- 버린 대안 — ComboTimer 컴포넌트 내부 padding-top 추가: ComboTimer는 활성/비활성 여부에 따라
  `return null`을 하므로, 내부 padding 변경은 비활성 시 anchor 래퍼 내 공간 활용에 영향이 없다.
  래퍼 height 조정이 단일 변경 지점(GamePage.tsx 내)으로 더 명확하다.

---

## 수정 파일

- `src/pages/GamePage.tsx` (수정 2곳)

---

## src/pages/GamePage.tsx

### 변경 1 — 콤보 묶음 컨테이너 (line ~295–299)

```typescript
// ❌ 수정 전
<div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flexShrink: 0,
  minHeight: 60,
}}>

// ✅ 수정 후
<div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flexShrink: 0,
  minHeight: 60,
  gap: 6,
  marginBottom: 16,
}}>
```

### 변경 2 — ComboTimer anchor 래퍼 (line ~307–313)

```typescript
// ❌ 수정 전
<div style={{
  height: 28,
  overflow: 'visible',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}}>

// ✅ 수정 후
<div style={{
  height: 34,
  overflow: 'visible',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}}>
```

### 핵심 로직 (변경 후 렌더 트리)

```
콤보 묶음 컨테이너
  display: flex / flex-direction: column
  align-items: center
  flex-shrink: 0 / min-height: 60
  gap: 6          ← [신규] 자식 간 6px 간격
  margin-bottom: 16  ← [신규] 버튼 패드와의 하단 여백
  ├─ ComboTimer anchor 래퍼
  │    height: 34  ← [변경: 28 → 34]
  │    overflow: visible / display: flex / align/justify center
  │    └─ <ComboTimer> (활성 시 ~24px, 비활성 시 null)
  └─ <ComboIndicator comboStreak={comboStreak} />
     (6px gap으로 anchor 래퍼와 분리)

버튼 패드 래퍼
  flex: 3 / align-items: flex-start
  (콤보 묶음의 margin-bottom: 16 이 여기까지 여백 제공)
```

---

## 주의사항

- **DB 영향도**: 없음.
- **Breaking Change**: 없음 — 외부 인터페이스·Props 변경 없음. 레이아웃 수치만 변경.
- **anchor 래퍼 height 주석 업데이트**: 코드 내 `height: 28` 계산 근거 주석(`[#95]`)을 `height: 34`로 업데이트하고 이슈 번호를 `[#97]`로 변경한다.
- **minHeight: 60 유효성**: anchor 래퍼 34px + gap 6px + ComboIndicator ~24px = 64px로 minHeight 60을 초과하므로 minHeight는 실질적으로 비활성화된다. 제거해도 무관하나, 콤보 컨테이너 최소 크기 가드로서 유지한다(레이아웃 안정성).
- **#95 수정과의 관계**: #95에서 `height: 28` anchor 래퍼를 도입하여 ComboIndicator 위치 고정 문제를 해결했다. 이번 변경은 해당 높이값을 조정하는 것으로, #95의 고정 높이 anchor 설계 원칙은 그대로 유지된다.

---

## 수용 기준

| # | 검증 항목 | 방법 |
|---|---|---|
| AC1 | 게임 화면에서 ComboTimer 영역과 ComboIndicator 블록 사이에 시각적 간격이 존재함 (밀착 없음) | `(BROWSER:DOM)` |
| AC2 | ComboIndicator 블록 하단과 버튼 패드 상단 사이에 시각적 여백이 존재함 | `(BROWSER:DOM)` |
| AC3 | ComboTimer 비활성(IDLE) 상태에서 anchor 래퍼가 34px 높이를 유지하며 ComboIndicator 위치가 활성 상태와 동일함 | `(BROWSER:DOM)` |
| AC4 | 기존 vitest 전체 통과 | `(TEST)` |

---

## 테스트 경계

- 단위 테스트 가능: 없음 (스타일 수치 변경만)
- 통합 테스트 필요: 없음
- 수동 검증:
  - INPUT 상태에서 ComboTimer 게이지와 ComboIndicator 사이 간격 확인
  - IDLE 상태에서 anchor 래퍼 공간 유지 + ComboIndicator 위치 불변 확인
  - ButtonPad 상단 시각적 여백 확인
