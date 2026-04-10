# 16. ComboTimer 바 게이지 + 콤보 깨짐 배율 유지

> 관련 이슈: [#90](https://github.com/alruminum/memory-battle/issues/90)
> 디자인 확정: Variant B (미니멀 슬라이드 게이지) — `design-preview-90.html`

---

## 결정 근거

### (1) ComboTimer 바 게이지 — Variant B 채택 이유

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **B. 미니멀 슬라이드 게이지 (채택)** | 4px 얇은 바 + 선단 글로우 헤드. 시간선처럼 읽힘 | 채택 |
| A. 세그먼트 블록 | 5칸 세그먼트 × 개별 폭발 분해 | 미채택 — 디자인 확정에서 Variant B 선택됨 |
| C. 아크 게이지 | 반원 SVG | 미채택 — 디자인 확정에서 Variant B 선택됨 |
| 기존 텍스트(`0.00 / 2.50 SEC`) | 현행 | 교체 대상 |

**B 채택 이유**: `design-preview-90.html` DESIGN_HANDOFF에서 Variant B 확정. 얇은 바가 ComboIndicator 블록과 시각적으로 자연스럽게 이어지며, 콤보 영역 한 묶음의 응집성이 가장 높다.

### (2) 콤보 깨짐 시 배율 유지

| 옵션 | 설명 | 채택 여부 |
|---|---|---|
| **A. floor(prev/5)×5 리셋 (채택)** | 스택만 0으로, 배율(xN) 유지 | 채택 |
| B. 기존 0 리셋 | streak=0, 배율=x1로 초기화 | 미채택 — 획득 배율이 사라지는 패널티가 너무 커 게임 흐름 단절 |

**A 채택 이유**: "어렵게 쌓은 배율은 보상으로 유지, 스택만 초기화"는 유저 동기를 유지하면서 틀렸을 때의 의미 있는 패널티(스택 reset)를 부여한다. PRD v0.3 콤보 설계 의도와 부합.

---

## 생성/수정 파일

- `src/components/game/ComboTimer.tsx` (수정) — 전면 교체: 텍스트 표시 → 슬림 바 게이지 (Variant B)
- `src/pages/GamePage.tsx` (수정) — combo-wrapper 구조 도입: ComboTimer 바 위 + ComboIndicator 아래를 한 묶음으로 버튼 패드 위에 배치
- `src/store/gameStore.ts` (수정) — `stageClear`: 실패 시 `newComboStreak = floor(prev/5)*5` (배율 유지)
- `src/index.css` (수정) — `@keyframes slimFlash` + `@keyframes slimTrackFlash` 추가
- `src/components/game/ComboTimer.test.tsx` (수정) — 새 Props 인터페이스 + 게이지 기반 TC로 전면 교체
- `src/store/gameStore.test.ts` (수정) — B-4-2 설명 보강 + 배율 유지 TC 추가 (B-4-8~B-4-10)

---

## 인터페이스 정의

### ComboTimer.tsx (신규 Props)

```typescript
interface ComboTimerProps {
  computerShowTime: number   // 컴퓨터 시연 총 시간 (ms). flashDuration × sequenceLength
  inputStartTime: number     // INPUT 페이즈 시작 시각 (timestamp). store.sequenceStartTime. 0 = 미설정
  isActive: boolean          // INPUT 상태 여부. true일 때 바 게이지가 줄어들기 시작
  isBreaking: boolean        // 콤보 깨짐 상태. true 시 collapse 애니메이션 후 숨김
}
```

### gameStore.ts — stageClear 반환값 (변경 없음)

```typescript
stageClear: (inputCompleteTime: number, flashDuration: number) => {
  isFullCombo: boolean
  multiplierIncreased: boolean
}
```

---

## 핵심 로직

### ComboTimer.tsx — 내부 상태 머신

```typescript
type CollapsePhase = 'none' | 'breaking' | 'done'

// isBreaking → breaking → (600ms) → done
useEffect(() => {
  if (isBreaking && collapsePhase === 'none') {
    setCollapsePhase('breaking')
    const tid = setTimeout(() => setCollapsePhase('done'), 600)
    return () => clearTimeout(tid)
  }
}, [isBreaking, collapsePhase])

// 게임 재시작(isBreaking=false) 시 리셋
useEffect(() => {
  if (!isBreaking) setCollapsePhase('none')
}, [isBreaking])

// 렌더링 조건
// · isActive=false && collapsePhase='none' → null (INPUT 아닐 때 숨김)
// · collapsePhase='done'                   → null (붕괴 완료 후 숨김)
// · isActive=true OR collapsePhase='breaking' → 게이지 렌더링
if (!isActive && collapsePhase === 'none') return null
if (collapsePhase === 'done') return null
```

### ComboTimer.tsx — 바 게이지 수치

```typescript
// elapsed 계산: 기존 ComboTimer의 interval 로직 그대로 재사용
// ratio: 1.0(시작) → 0.0(타임아웃)
const ratio = Math.max(0, 1 - elapsedMs / computerShowTime)
const fillWidth = `${ratio * 100}%`

// 상태별 색상
const isOver = elapsedMs >= computerShowTime
const fillColor = isOver ? 'var(--vb-combo-over)' : 'var(--vb-accent)'
const glowColor = isOver
  ? 'rgba(248,113,113,0.7)'
  : 'rgba(212,168,67,0.7)'

// CSS class 조합
const fillClass = [
  'combo-timer-fill',
  isOver ? 'over' : '',
  collapsePhase === 'breaking' ? 'collapse' : '',
].filter(Boolean).join(' ')
```

### ComboTimer.tsx — 마크업 구조

```tsx
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 4px' }}>
  {/* 트랙 */}
  <div
    className={`combo-timer-track${collapsePhase === 'breaking' ? ' collapse' : ''}`}
    style={{ position: 'relative', height: 4, width: 200, background: 'var(--timer-track)', borderRadius: 2, overflow: 'visible' }}
  >
    {/* 채우는 바 */}
    <div
      className={fillClass}
      style={{
        height: '100%',
        width: fillWidth,
        borderRadius: 2,
        background: fillColor,
        position: 'relative',
        transition: 'width 80ms linear, background 200ms ease',
        transformOrigin: 'left center',
      }}
    >
      {/* 글로우 헤드 — collapse 시 숨김 */}
      {collapsePhase !== 'breaking' && (
        <div style={{
          position: 'absolute',
          right: -3,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: fillColor,
          boxShadow: `0 0 10px 3px ${glowColor}`,
          transition: 'background 200ms ease, box-shadow 200ms ease',
        }} />
      )}
    </div>
  </div>
</div>
```

### index.css — 추가 keyframes

```css
@keyframes slimFlash {
  0%   { opacity: 1; transform: scaleX(1); }
  20%  { opacity: 1; background: var(--vb-combo-over); }
  50%  { opacity: 0.7; transform: scaleX(0.6); }
  80%  { opacity: 0.3; transform: scaleX(0.2); }
  100% { opacity: 0; transform: scaleX(0); }
}

@keyframes slimTrackFlash {
  0%   { background: var(--timer-track); }
  20%  { background: rgba(248,113,113,0.3); }
  100% { background: var(--timer-track); }
}

.combo-timer-fill.collapse {
  animation: slimFlash 0.5s ease-in forwards;
}

.combo-timer-track.collapse {
  animation: slimTrackFlash 0.5s ease-out forwards;
}
```

### gameStore.ts — stageClear 배율 유지 로직

```typescript
// Before
const newComboStreak = isFullCombo ? prevComboStreak + 1 : 0

// After (배율 유지: 스택만 초기화, 배율 하한으로 리셋)
const prevMultiplierBase = Math.floor(prevComboStreak / 5) * 5
const newComboStreak = isFullCombo ? prevComboStreak + 1 : prevMultiplierBase
```

배율별 리셋 결과:

| 실패 전 streak | 배율 | 리셋 후 streak | 배율 유지 |
|---|---|---|---|
| 0~4 | x1 | 0 | x1 (동일) |
| 5~9 | x2 | 5 | x2 ✓ |
| 10~14 | x3 | 10 | x3 ✓ |
| N×5 ~ (N+1)×5-1 | x(N+1) | N×5 | x(N+1) ✓ |

### GamePage.tsx — 레이아웃 변경

```tsx
// Before: 콤보 인디케이터 단독 + 하단 ComboTimer 단독
//
// [Stage area] (flex: 2)
// [ComboIndicator] (minHeight: 56, 단독 div)
// [ButtonPad] (flex: 3)
// [ComboTimer] (minHeight: 40, 하단)
// [BannerAd]

// After: combo-wrapper로 한 묶음, 버튼 패드 위에 배치
//
// [Stage area] (flex: 2)
// [combo-wrapper] (flexShrink: 0, flexDirection: column, alignItems: center)
//   ├── [ComboTimer gauge bar]  ← 위
//   └── [ComboIndicator blocks] ← 아래
// [ButtonPad] (flex: 3)
// [BannerAd]

// combo-wrapper JSX:
<div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flexShrink: 0,
  minHeight: 60,  // 게이지 4px + 패딩 + 콤보인디케이터 ~40px 확보
}}>
  <ComboTimer
    computerShowTime={computerShowTime}
    inputStartTime={sequenceStartTime}
    isActive={status === 'INPUT'}
    isBreaking={status === 'RESULT' && gameOverReason !== null}
  />
  <ComboIndicator comboStreak={comboStreak} />
</div>
```

---

## 주의사항

### 모듈 경계
- `ComboTimer.tsx`는 `isActive`/`isBreaking` 두 Props로만 외부와 통신. 내부 collapse 타이머는 컴포넌트 로컬 상태로 관리.
- `ComboIndicator.tsx`는 변경 없음. `comboStreak` props 값만 달라짐(배율 유지로 더 높은 값 가능).

### 에러 처리
- `computerShowTime <= 0`이면 게이지가 즉시 0%로 고정. `stage === 0` 방어 로직(기존 `flashDuration * (stage > 0 ? stage : 1)`)은 GamePage에서 그대로 유지.
- `inputStartTime === 0`이면 interval 시작 안 함 (기존 guard 유지).

### CSS 충돌 방지
- 클래스명 `combo-timer-fill`, `combo-timer-track` 사용 (기존 코드에서 이 이름은 미사용 확인 완료).
- `--timer-track: #1e1e2e` CSS 변수는 `index.css` `:root`에 이미 정의됨 (design-preview-90.html 기준 확인).

### GamePage 기존 ComboTimer wrapper div 제거
- `{/* 타임워치 */}` 주석 달린 `<div style={{ flexShrink: 0, minHeight: 40 }}>` 블록 전체 제거 (ComboTimer가 combo-wrapper 안으로 이동).
- `{/* 콤보 인디케이터 */}` 주석 달린 `<div style={{ ... minHeight: 56 ... }}>` 블록도 제거하고 combo-wrapper로 통합.

### DB 영향도
없음. UI 및 로컬 게임 로직 전용 수정.

### Breaking Change
- `ComboTimer.tsx` Props에 `isBreaking: boolean` 추가 → **`GamePage.tsx` 업데이트 필수** (미전달 시 TypeScript 에러)
- `gameStore.ts`의 `stageClear` 반환값/시그니처 변경 없음 → 의존 파일 변경 불필요
- `ComboTimer.test.tsx`의 기존 TC 전면 교체 필요 (DOM 구조가 text span → div.combo-timer-fill로 변경)

---

## 테스트 경계

### ComboTimer.test.tsx 교체 TC 명세

| TC ID | 케이스 | 검증 방식 |
|---|---|---|
| CT-1-1 | `isActive=false && isBreaking=false` → null 반환 | `queryByTestId('combo-timer-track') === null` |
| CT-1-2 | `isActive=true` → 트랙 렌더링 | `getByTestId('combo-timer-track')` 존재 |
| CT-2-1 | `elapsed < computerShowTime` → fill width > 0% | `style.width` not '0%' |
| CT-2-2 | `elapsed >= computerShowTime` → fill에 `.over` 클래스 | fill 클래스에 `over` 포함 |
| CT-2-3 | `elapsed >= computerShowTime` 후 추가 시간 경과 → width 0%에서 고정 | 2회 측정 동일값 |
| CT-3-1 | `isBreaking=true` → 600ms 후 null 반환 | advanceTimersByTime(600) → track 없음 |
| CT-3-2 | `isBreaking=false` → true 전환 시 `.collapse` 클래스 추가 | fill 클래스에 `collapse` 포함 |
| CT-4-1 | `computerShowTime` 변경 후 새 값 기준으로 비율 반영 (stale closure 방지) | ref 업데이트 검증 |

### gameStore.test.ts 추가 TC 명세

| TC ID | 케이스 | 기대값 |
|---|---|---|
| B-4-8 | `comboStreak=8` (x2), 풀콤보 미달성 → streak=5 (x2 유지) | `comboStreak === 5` |
| B-4-9 | `comboStreak=13` (x3), 풀콤보 미달성 → streak=10 (x3 유지) | `comboStreak === 10` |
| B-4-10 | `comboStreak=5` (x2 하한), 풀콤보 미달성 → streak=5 (x2 유지) | `comboStreak === 5` |

> B-4-2 (`comboStreak=4, failure → 0`): 기존 테스트 결과값은 그대로 통과 (floor(4/5)×5=0). 설명 보강만 필요.

- **단위 테스트 가능**: `stageClear()` — `gameStore.test.ts` B-4 그룹에서 커버
- **통합 테스트 필요**: 없음
- **수동 검증**:
  1. [MANUAL-1] x2 이상에서 틀렸을 때 ComboIndicator가 `x2 블록0개` 상태로 유지되는지 확인
  2. [MANUAL-2] 게임오버 시 ComboTimer 바에 빨강 플래시 + 좌측 수축 붕괴 애니메이션 재생 확인 (GameOverOverlay 뒤에 가릴 수 있음)
  3. [MANUAL-3] INPUT 중 게이지 바가 노란색으로 왼쪽에서 줄어드는지 확인 (100%→0%)
  4. [MANUAL-4] ComboTimer 바가 버튼 패드 바로 위, ComboIndicator 바로 위에 위치하는지 레이아웃 확인

---

## 수용 기준

| # | 항목 | 유형 |
|---|---|---|
| AC1 | INPUT 중 노란 바 게이지가 100%→0% 감소 | (TEST) |
| AC2 | 타임아웃/오답 시 빨강 플래시 + 좌측 수축 붕괴 (600ms) | (TEST: class 확인) |
| AC3 | 게이지 바가 ComboIndicator 바로 위에 배치, combo-wrapper 한 묶음 | (MANUAL) |
| AC4 | 풀와이드 아님 — 바 width 200px 고정 | (MANUAL) |
| AC5 | x2+ 콤보 중 틀렸을 때 배율 유지 (streak=5 이상 하한 리셋) | (TEST: B-4-8~B-4-10) |
| AC6 | x1 구간(streak 0~4)에서 틀렸을 때 streak=0 (기존 동일) | (TEST: B-4-2) |
| AC7 | `ComboTimer.test.tsx` CT-1 ~ CT-4 전체 PASS | (TEST) |
| AC8 | `gameStore.test.ts` B-4-2 + B-4-8~B-4-10 PASS | (TEST) |
