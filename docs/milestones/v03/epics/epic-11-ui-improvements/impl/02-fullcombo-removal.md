# 02. FULL COMBO! 텍스트 및 사운드 제거

> 관련 이슈: [#53](https://github.com/alruminum/memory-battle/issues/53)

## 결정 근거

- **FULL COMBO! 텍스트 제거 이유**: "FULL COMBO!" 텍스트는 콤보 달성을 구체적으로 알려주지만, 현재 디자인에서 동일 위치에 "CLEAR" 텍스트와 충돌하여 사용자에게 혼동을 줄 수 있다. 또한 콤보 정보는 `ComboIndicator`에서 이미 표시되므로 중복이다.
- **체크마크 SVG 드로우 애니메이션으로 교체 (Variant B 스타일)**: 클리어 시 체크마크가 stroke-dashoffset 0으로 드로우되는 시각적 효과는 "완료" 감각을 직관적으로 전달한다. `stroke: var(--vb-combo-ok)` (#34D399 계열)을 사용해 기존 ComboTimer 색상 체계와 일관성을 유지한다.
- **`isClearingFullCombo` 상태 완전 제거**: `GamePage.tsx`에서 `StageArea`로 전달되는 prop이고, `useGameEngine.ts`에서 관리하는 상태다. 텍스트를 제거하면 이 prop 자체가 불필요해지므로 prop과 상태를 함께 제거해 코드를 단순화한다.
- **`sound.ts` 확인 결과**: `playApplause()` 함수가 `isFullCombo` 조건에서 호출되나, `playApplause` 자체는 milestones(5스테이지) 조건과 공유되어 있다. fullCombo 전용 사운드 함수는 없으므로 sound.ts 수정 불필요. `useGameEngine.ts`의 `if (isMilestone || isFullCombo) playApplause()` 조건에서 `isFullCombo` 분기를 제거한다.
- **버린 대안**:
  - `isClearingFullCombo`를 유지하되 체크마크 색상만 바꾸는 방법: prop이 남아 코드 복잡도 유지. 제외.
  - CLEAR 텍스트도 제거하고 체크마크만 표시: STAGE 번호만으로 컨텍스트가 충분하므로 채택.

---

## 생성/수정 파일

- `src/pages/GamePage.tsx` (수정) — `StageArea` `isClearingFullCombo` prop 제거, clearingStage 분기에 체크마크 SVG 추가
- `src/hooks/useGameEngine.ts` (수정) — `isClearingFullCombo` 상태 및 관련 `isFullCombo` playApplause 조건 수정, 반환값에서 제거
- `src/index.css` (수정) — `@keyframes checkDraw` 추가

---

## 인터페이스 정의

```typescript
// GamePage.tsx — StageAreaProps에서 isClearingFullCombo 제거
interface StageAreaProps {
  countdown: number | null
  clearingStage: number | null
  isPlaying: boolean
  // isClearingFullCombo: boolean  ← 제거
  stage: number
}

// useGameEngine.ts — 반환 타입에서 isClearingFullCombo 제거
interface UseGameEngineReturn {
  flashingButton: ButtonColor | null
  clearingStage: number | null
  countdown: number | null
  handleInput: (color: ButtonColor) => void
  startGame: () => void
  retryGame: () => void
  // isClearingFullCombo: boolean  ← 제거
  multiplierIncreased: boolean
  gameOverReason: 'timeout' | 'wrong' | null
}
```

---

## 핵심 로직

### `src/index.css` — @keyframes checkDraw 추가

```css
/* 스테이지 클리어 체크마크 드로우 */
@keyframes checkDraw {
  from { stroke-dashoffset: 40; }
  to   { stroke-dashoffset: 0; }
}
```

### `src/pages/GamePage.tsx` — StageArea clearingStage 분기 수정

```typescript
// StageAreaProps — isClearingFullCombo 제거
interface StageAreaProps {
  countdown: number | null
  clearingStage: number | null
  isPlaying: boolean
  stage: number
}

function StageArea({ countdown, clearingStage, isPlaying, stage }: StageAreaProps): JSX.Element {
  // ... countdown 분기 ...

  if (clearingStage !== null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {/* 체크마크 SVG — stroke-dashoffset 드로우 애니메이션 */}
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M8 18 L15 25 L28 11"
            stroke="var(--vb-combo-ok)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="40"
            strokeDashoffset="40"
            style={{ animation: 'checkDraw 0.4s 0.1s ease forwards' }}
          />
        </svg>
        {/* STAGE 번호 */}
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 10,
          letterSpacing: 2,
          color: 'var(--vb-text-dim)',
        }}>STAGE {clearingStage}</div>
        {/* CLEAR 텍스트 유지 (FULL COMBO! 제거) */}
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 18,
          fontWeight: 800,
          color: 'var(--vb-combo-ok)',
          letterSpacing: 2,
        }}>CLEAR</div>
      </div>
    )
  }
  // ...
}

// GamePage에서 StageArea 호출 시 isClearingFullCombo prop 제거
<StageArea
  countdown={countdown}
  clearingStage={clearingStage}
  isPlaying={isPlaying}
  stage={stage}
  // isClearingFullCombo={isClearingFullCombo}  ← 제거
/>
```

### `src/hooks/useGameEngine.ts` — isClearingFullCombo 제거 및 playApplause 조건 수정

```typescript
// 제거: const [isClearingFullCombo, setIsClearingFullCombo] = useState(false)

// handleInput → round-clear 분기 수정
if (result === 'round-clear') {
  const clearedStage = sequence.length
  clearingRef.current = true
  timer.stop()
  setClearingStage(clearedStage)

  const now = Date.now()
  const flash = getFlashDuration(clearedStage)

  const { isFullCombo, multiplierIncreased: increased } =
    useGameStore.getState().stageClear(now, flash)

  // setIsClearingFullCombo(isFullCombo)  ← 제거
  setMultiplierIncreased(increased)

  // isFullCombo 분기에서만 playApplause 하지 않고 milestone 기준으로만 실행
  const isMilestone = clearedStage % 5 === 0
  if (isMilestone) playApplause()   // isFullCombo 조건 제거

  const newSeq = [...sequence, randomButton()]
  const pauseMs = isMilestone ? MILESTONE_PAUSE_MS : CLEAR_PAUSE_MS

  setTimeout(() => {
    clearingRef.current = false
    setClearingStage(null)
    // setIsClearingFullCombo(false)  ← 제거
    setMultiplierIncreased(false)
    setSequence(newSeq)
    useGameStore.setState({ status: 'SHOWING', currentIndex: 0, stage: newSeq.length })
  }, pauseMs)
  return
}

// 반환값에서 isClearingFullCombo 제거
return {
  flashingButton,
  clearingStage,
  countdown,
  handleInput,
  startGame,
  retryGame,
  // isClearingFullCombo,  ← 제거
  multiplierIncreased,
  gameOverReason,
}
```

---

## 주의사항

- **gameStore.ts `fullComboCount` 필드 유지**: `fullComboCount`는 store에서 `stageClear()` 내부에서 여전히 업데이트되고, `ResultPage.tsx`의 결과 화면(`{fullComboCount}x`)에서 사용된다. store 수정 불필요.
- **test 파일(`gameStore.test.ts`)**: `fullComboCount` 관련 TC(B-4-3, B-4-4)는 store 로직 검증이므로 유지. `isClearingFullCombo`를 직접 테스트하는 케이스가 있으면 제거 필요 — 검색 결과 `gameStore.test.ts`에는 `isClearingFullCombo` 테스트 없음. 수정 불필요.
- **playApplause 변경 영향**: fullCombo 단독 클리어(milestone 아닌 스테이지) 시 기존에는 환호성 사운드가 재생됐지만 이 변경으로 제거된다. PRD에서 fullCombo 사운드 요구사항 없음 — 허용 범위.
- **CLEAR 텍스트 색상 변경**: 기존 `var(--vb-accent)` → `var(--vb-combo-ok)` (#34D399). 체크마크와 동일 색상 사용으로 시각적 일관성 확보.
- **Breaking Change**: `isClearingFullCombo`를 소비하는 파일: `GamePage.tsx` (prop으로 전달), `useGameEngine.ts` (반환). 두 파일 모두 수정 대상 내 포함. 다른 파일에서 직접 소비하는 케이스 없음(Grep 확인).
- **DB 영향도**: 없음.

---

## 테스트 경계

- 단위 테스트 가능: 없음 (상태 제거 + 렌더링 변경)
- 통합 테스트 필요: 없음
- 수동 검증:
  - 스테이지 클리어 시 "FULL COMBO!" 텍스트가 더 이상 표시되지 않는지 확인
  - 체크마크 SVG가 stroke-dashoffset 드로우 애니메이션으로 등장하는지 확인 (--vb-combo-ok 색상)
  - "CLEAR" 텍스트가 체크마크 아래 표시되는지 확인
  - fullCombo가 아닌 일반 클리어에서도 동일하게 체크마크가 표시되는지 확인
  - milestone(5스테이지) 클리어 시 환호성 사운드 재생 확인 (비-milestone 클리어 시 사운드 없음 확인)
  - ResultPage의 `FULL COMBO ${fullComboCount}x` 표시는 정상 동작하는지 확인 (store 로직 유지)
