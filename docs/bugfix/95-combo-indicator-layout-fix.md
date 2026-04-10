# Bugfix #95 — ComboIndicator 위치 불일정 + streak 0 미표시

> 관련 이슈: [#95](https://github.com/alruminum/memory-battle/issues/95)
> 분류: FUNCTIONAL_BUG (이슈 1) + SPEC 변경 (이슈 2)

---

## 버그 요약

### 이슈 1 — ComboIndicator 위치 불일정 (FUNCTIONAL_BUG)

ComboTimer가 비활성 상태(IDLE, RESULT 등)에서 `return null`로 DOM에서 완전히 제거될 때,
아래에 위치한 ComboIndicator가 위로 올라가며 세로 위치가 달라진다.

- ComboTimer 활성(INPUT) 시: ComboIndicator가 ComboTimer 아래 위치
- ComboTimer 비활성(IDLE/RESULT) 시: ComboIndicator가 묶음 컨테이너 최상단으로 올라감

### 이슈 2 — streak 0일 때 ComboIndicator 미표시 (SPEC 변경)

`ComboIndicator.tsx:8` `if (comboStreak === 0) return null` 에 의해
streak=0 시 컴포넌트가 DOM에서 사라진다.

**스펙 변경 확정**: streak 0일 때도 5칸 빈 블록 + x1을 항상 표시.

---

## 근본 원인

| 이슈 | 원인 |
|---|---|
| 이슈 1 | `GamePage.tsx` 콤보 묶음 컨테이너가 `flex-column`으로 구성되어 있고 ComboTimer `return null` 시 DOM element 자체가 제거됨 → 아래 형제 요소인 ComboIndicator의 `translateY`가 위로 이동 |
| 이슈 2 | `ComboIndicator.tsx:8` early return — streak=0 시 컴포넌트 렌더링 자체를 차단 |

---

## 결정 근거

### 이슈 1: ComboTimer 래퍼 고정 높이 anchor

**선택**: `GamePage.tsx`에서 `<ComboTimer>` 를 고정 높이 래퍼 div로 감싼다.

```
ComboTimer 활성화 시 실제 DOM 높이 계산:
  - 바깥 div padding-top: 0px
  - "콤보타이머" span: fontSize 9 → line-height ≈ 12px + marginBottom 4px = 16px
  - track div: height 4px
  - 바깥 div padding-bottom: 4px
  합계 ≈ 24px → 여유 포함 height: 28px 지정
```

**버린 대안 A**: ComboTimer 내부에서 `return null` 대신 `visibility: hidden` placeholder 반환
→ ComboTimer 컴포넌트가 자신의 렌더링 조건 외에 "자리 유지용 더미 DOM"을 반환해야 하므로 단일 책임 원칙 위반.

**버린 대안 B**: 현재 묶음 컨테이너 `minHeight: 60` 값을 더 크게 늘리기
→ ComboTimer/ComboIndicator 상대 위치가 여전히 바뀌므로 근본 해결이 아님.

**선택 이유**: 래퍼 div에 `height: 28`을 고정하면 ComboTimer가 null이어도 28px 공간이 항상 유지됨.
ComboTimer 활성화 시 실제 크기가 28px이므로 overflow 없음. overflow: visible 추가로 글로우 헤드 점도 잘림 없음.

### 이슈 2: early return 제거

streak=0 시 컴포넌트 내부 파생값:
- `multiplier = Math.floor(0 / 5) + 1 = 1`
- `filledCount = 0 % 5 = 0` → 5칸 모두 `isFilled=false` (빈 블록)
- 표시 결과: 5칸 빈 블록 + "x1" 텍스트

이 상태가 유저가 요청한 "0일 때도 표시" 기준에 부합한다.
`if (comboStreak === 0) return null` 한 줄 제거만으로 구현 완료.

---

## 수정 파일

- `src/components/game/ComboIndicator.tsx` (수정) — streak 0 early return 제거
- `src/pages/GamePage.tsx` (수정) — ComboTimer 고정 높이 래퍼 추가
- `docs/ui-spec.md` (수정) — ComboIndicator 표시 규칙 업데이트

---

## src/components/game/ComboIndicator.tsx

### 변경 diff

```typescript
// 제거할 라인 (line 8)
- if (comboStreak === 0) return null
```

제거 후 streak=0 진입 시 렌더링되는 DOM:
- 5칸 블록: 모두 `isFilled=false` → `background: 'var(--vb-border)'`, `boxShadow: 'none'`
- 배율 텍스트: `x1`
- blockPop 애니메이션: 트리거 안됨 (`filledCount-1 = -1`, 조건 `i === filledCount - 1` 불만족)

### 의사코드

```typescript
export function ComboIndicator({ comboStreak }: ComboIndicatorProps) {
  // [수정] if (comboStreak === 0) return null  ← 이 줄 삭제

  const multiplier = Math.floor(comboStreak / 5) + 1
  const filledCount = comboStreak % 5
  // ... (이후 동일)
}
```

---

## src/pages/GamePage.tsx

### 변경 위치

콤보 묶음 컨테이너 내부 `<ComboTimer ... />` 부분을 고정 높이 래퍼로 감싼다.

### 핵심 로직

```typescript
{/* 콤보 묶음: ComboTimer 게이지(위) + ComboIndicator 블록(아래) */}
<div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flexShrink: 0,
  minHeight: 60,
}}>
  {/* [신규] ComboTimer 고정 높이 anchor 래퍼
      height: 28 — ComboTimer 활성화 시 실제 DOM 높이(~24px)와 일치, 여유 4px 포함
      overflow: visible — 글로우 헤드 점(right: -3, height 8px)이 트랙 영역 밖에 위치하므로 clip 방지
      ComboTimer return null 시에도 28px 공간이 유지되어 ComboIndicator Y 좌표 고정됨
  */}
  <div style={{
    height: 28,
    overflow: 'visible',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <ComboTimer
      computerShowTime={computerShowTime}
      inputStartTime={sequenceStartTime}
      isActive={status === 'INPUT' && clearingStage === null}
      isBreaking={status === 'RESULT' && gameOverReason !== null}
      isShowing={status === 'SHOWING'}
    />
  </div>
  <ComboIndicator comboStreak={comboStreak} />
</div>
```

---

## docs/ui-spec.md

### 변경 위치

`### ComboIndicator 표시 규칙` 테이블

### 변경 내용

```markdown
// 변경 전
| `comboStreak === 0` | null (미표시) |
| `comboStreak > 0` | `x{floor(comboStreak/5)+1} COMBO STREAK` 텍스트 상시 표시 |

// 변경 후
| `comboStreak === 0` | 5칸 빈 블록 + x1 상시 표시 (항상 보임) |
| `comboStreak > 0` | `x{floor(comboStreak/5)+1}` + 진행 블록 상시 표시 |
```

---

## 수용 기준

| # | 검증 항목 | 방법 |
|---|---|---|
| AC1 | ComboTimer 비활성(IDLE) 상태에서 ComboIndicator의 `getBoundingClientRect().top`이 ComboTimer 활성(INPUT) 상태와 동일한 값을 가짐 | (BROWSER:DOM) |
| AC2 | comboStreak=0 시 `ComboIndicator` 컴포넌트가 DOM에 존재하고 (`data-testid` 또는 역할 요소로 쿼리), 5칸 블록 div + "x1" 텍스트가 렌더링됨 | (BROWSER:DOM) |
| AC3 | comboStreak=1 시 블록 1칸 filled + x1, comboStreak=4 시 블록 4칸 filled + x1 정상 표시 | (BROWSER:DOM) |
| AC4 | comboStreak=5 시 블록 5칸 모두 빈 상태 + x2 표시 (배율 상승 직후 filledCount=0) | (BROWSER:DOM) |
| AC5 | `docs/ui-spec.md` ComboIndicator 표시 규칙 테이블이 구현과 일치함 (streak=0 → 항상 표시 명시) | (MANUAL) |

---

## 주의사항

- **ComboTimer 높이 변동 가능성**: ComboTimer 내부 레이아웃이 향후 변경되면 래퍼 `height: 28` 재조정 필요. 컴포넌트 상단에 주석으로 래퍼 높이 계산 근거를 남긴다.
- **streak=0 blockPop 트리거 없음**: `filledCount=0`이므로 `i === filledCount - 1` 조건(`i === -1`)이 절대 충족되지 않음 → 어떤 블록도 blockPop 애니메이션 미실행. 의도된 동작.
- **GamePage.tsx 콤보 묶음 컨테이너 `minHeight: 60` 유지**: 래퍼 28px + ComboIndicator 공간(~24px) = ~52px이므로 현재 minHeight 60이 충분히 수용함. 변경 불필요.
- **다른 모듈 영향 없음**: ComboIndicator Props 인터페이스 변경 없음. GamePage 외 호출부 없음.
