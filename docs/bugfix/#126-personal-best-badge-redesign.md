---
depth: std
design: required
---
# #126 NEW PERSONAL BEST 배지 리디자인 — Variant C "사이드 바 임팩트"

> **이슈**: [#126](https://github.com/alruminum/memory-battle/issues/126)
> **라벨**: `v04`, `design-fix`
> **Variant**: C — "사이드 바 임팩트" (기존 Variant A 계획 대체)

---

## Design Ref

| 항목 | 값 |
|---|---|
| Pencil Frame ID | `AUFEl` |
| 배경 컨텍스트 프레임 | `RXloq` |
| Font Display | `Barlow Condensed` (이미 `index.css`에 로드됨 — weight 600/800/900) |

### 디자인 토큰

| 토큰 | 값 | 매핑 |
|---|---|---|
| badge-surface | `#18181b` | `--vb-surface` (동일) |
| badge-text-primary | `#F5F5F5` | — |
| badge-accent-start | `#D4A843` | `--vb-accent` (동일) |
| badge-accent-end | `#8B7332` | `--vb-accent-dim` (동일) |
| badge-stroke | `#FFFFFF18` | — |
| badge-glow | `#D4A84340` | — |
| badge-corner-radius | `6px` | — |
| font-display | `Barlow Condensed` | `--vb-font-score` |

### 컴포넌트 구조 (Pencil → React 매핑)

```
NewRecordBadge (frame 루트, position: relative, overflow: hidden)
├── cLeftBar (div, position: absolute)     // 왼쪽 골드 그라디언트 세로 바 3×56px
└── cContent (div, flex-col)               // 텍스트 컨테이너
    ├── "NEW RECORD" (span)                // 메인 타이틀
    └── cSubRow (div, flex-row)            // 서브 로우
        ├── divider-line (div)             // 수평 구분선 12px
        └── "PERSONAL BEST" (span)         // 서브 레이블
```

---

## 사전 분석 — suspected_files 검증

| 파일 | 실제 관련 여부 | 근거 |
|---|---|---|
| `src/components/game/MultiplierBurst.tsx` | ❌ 무관 | COMBO BOOST 배지만 있음. NEW PERSONAL BEST 코드 없음 |
| `src/__tests__/MultiplierBurst.test.tsx` | ❌ 무관 | MultiplierBurst 컴포넌트만 커버 |
| `src/pages/ResultPage.tsx` | ✅ 대상 | L172–199에 배지 JSX 위치. 새 컴포넌트로 교체 |

**추가 수정 파일:**
- `src/components/result/NewRecordBadge.tsx` — 신규 생성
- `src/index.css` — 애니메이션 keyframe 3개 추가

---

## 현재 코드 (ResultPage.tsx L172–199)

```tsx
{/* NEW PERSONAL BEST 배지 */}
{isNewBest && (
  <div style={{
    display: 'inline-block',
    marginTop: 14,
    padding: '6px 20px',
    borderRadius: 20,
    backgroundColor: 'rgba(200,255,0,0.12)',
    border: '1px solid var(--vb-accent)',
  }}>
    <span style={{
      fontFamily: 'var(--vb-font-score)',
      fontSize: 11,
      fontWeight: 800,
      color: 'var(--vb-accent)',
      letterSpacing: 2.5,
    }}>NEW PERSONAL BEST</span>
  </div>
)}
```

**문제점 3가지 (이슈 원본):**
1. `🏆`, `🪙` 이모지 — 텍스트 렌더링 불안정, 시각 노이즈 (이미 제거된 버전이 위 코드이나 isNewBest 배지 자체는 여전히 단순 pill 형태)
2. 영어 "NEW PERSONAL BEST" + 한국어 "최고기록!" 중복 (일부 이전 버전에서 존재)
3. `🪙 +1` — 중복 코인 표시 (일부 이전 버전에서 존재)

> **현재 실제 코드**: 이미 이모지·한국어·코인+1이 제거된 단순 pill 형태. Variant C는 이를 "사이드 바 임팩트" 배지로 승급.

---

## depth 판정 근거

| 항목 | 판단 |
|---|---|
| 신규 파일 생성 (`NewRecordBadge.tsx`) | std |
| CSS keyframe 3개 신설 | std |
| absolute position 레이어 구조 | std |
| 비즈니스 로직 변경 없음 | — |

→ **`depth: std`** (Variant A 기준 `simple`에서 상향. 신규 컴포넌트 + 애니메이션 신설)

---

## 수정 사항 1 — `src/index.css` (font import 수정 + keyframe 추가)

### 1-A. Google Fonts import — Barlow Condensed 700 weight 추가

현재 import (`wght@600;800;900`)에 700이 없으나, `NewRecordBadge`의 "PERSONAL BEST" 서브 레이블이 `fontWeight: 700`을 사용. 700이 없으면 브라우저가 800으로 폴백하여 디자인 스펙과 불일치.

```css
/* 변경 전 */
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;800;900&family=Space+Grotesk:wght@400;600;700&display=swap');

/* 변경 후 — 700 추가 */
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Space+Grotesk:wght@400;600;700&display=swap');
```

**결정 근거**: 디자인 핸드오프 스펙(`fontWeight: 700`)을 정확히 구현하기 위해 추가. 이미 로드 중인 패밀리에 weight 하나 추가이므로 네트워크 비용 미미 (Google Fonts 단일 요청 내 처리).

### 1-B. keyframe 3개 신규 추가

전역 CSS에 배지 전용 keyframe 추가. 기존 `vb-bg-in`, `vb-particle-fly` 등과 동일한 위치에 삽입.

```css
/* NewRecordBadge animations */
@keyframes nr-bar-grow {
  from { transform: scaleY(0); transform-origin: top center; }
  to   { transform: scaleY(1); transform-origin: top center; }
}

@keyframes nr-content-slide-in {
  from { transform: translateX(-8px); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}

@keyframes nr-badge-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

**keyframe 네이밍 규칙**: `nr-` prefix로 네임스페이스 분리 (기존 `vb-` 패턴 준수).

---

## 수정 사항 2 — `src/components/result/NewRecordBadge.tsx` (신규 생성)

```tsx
export function NewRecordBadge() {
  return (
    <div
      role="status"
      aria-label="개인 최고 기록 달성"
      aria-live="polite"
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-block',
        backgroundColor: '#18181b',
        border: '1px solid #FFFFFF18',
        borderRadius: 6,
        boxShadow: '0 0 12px #D4A84340',
        animation: 'nr-badge-fade-in 300ms ease-out both',
      }}
    >
      {/* cLeftBar — 왼쪽 골드 그라디언트 세로 바 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 3,
          height: 56,
          background: 'linear-gradient(180deg, #D4A843 0%, #8B7332 100%)',
          animation: 'nr-bar-grow 350ms ease-out both',
        }}
      />

      {/* cContent — 텍스트 컨테이너 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          padding: '10px 14px 10px 17px',
          justifyContent: 'center',
          animation: 'nr-content-slide-in 350ms ease-out 80ms both',
        }}
      >
        {/* NEW RECORD 메인 타이틀 */}
        <span
          style={{
            fontFamily: 'var(--vb-font-score)',
            fontSize: 20,
            fontWeight: 900,
            color: '#F5F5F5',
            letterSpacing: 3,
            lineHeight: 1,
          }}
        >
          NEW RECORD
        </span>

        {/* cSubRow — 구분선 + PERSONAL BEST */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {/* divider-line */}
          <div
            style={{
              width: 12,
              height: 1,
              backgroundColor: '#D4A843',
              flexShrink: 0,
            }}
          />
          {/* PERSONAL BEST 서브 레이블 */}
          <span
            style={{
              fontFamily: 'var(--vb-font-score)',
              fontSize: 8,
              fontWeight: 700,
              color: '#D4A843',
              letterSpacing: 2,
              lineHeight: 1,
            }}
          >
            PERSONAL BEST
          </span>
        </div>
      </div>
    </div>
  )
}
```

**결정 근거:**
- `overflow: hidden` 필수 — cLeftBar(`position: absolute`)가 배지 외부로 삐져나오는 것 방지
- `display: inline-block` — ResultPage 최종 점수 카드의 `textAlign: 'center'` 컨텍스트에서 중앙 정렬
- `role="status" aria-live="polite"` — 최고기록 알림 접근성 (이슈 Notes for Engineer §5)
- `lineHeight: 1` — 두 텍스트 요소 간 여백이 gap:3px으로만 제어되도록
- `animation delay 80ms` — barGrow가 먼저 시작 후 콘텐츠 슬라이드 인 타이밍 순서 보장

---

## 수정 사항 3 — `src/pages/ResultPage.tsx`

### 변경 내용

1. `NewRecordBadge` import 추가
2. `isNewBest` 배지 블록 교체 (L172–199)

```tsx
// import 추가 (기존 result/ 계열과 함께)
import { NewRecordBadge } from '../components/result/NewRecordBadge'
```

```tsx
// 교체 전 (인라인 pill 배지)
{isNewBest && (
  <div style={{
    display: 'inline-block',
    marginTop: 14,
    padding: '6px 20px',
    borderRadius: 20,
    backgroundColor: 'rgba(200,255,0,0.12)',
    border: '1px solid var(--vb-accent)',
  }}>
    <span style={{
      fontFamily: 'var(--vb-font-score)',
      fontSize: 11,
      fontWeight: 800,
      color: 'var(--vb-accent)',
      letterSpacing: 2.5,
    }}>NEW PERSONAL BEST</span>
  </div>
)}

// 교체 후
{isNewBest && (
  <div style={{ marginTop: 14 }}>
    <NewRecordBadge />
  </div>
)}
```

**wrapper div 유지 근거**: 최종 점수 카드 내부의 `marginTop: 14` 간격을 ResultPage 레벨에서 제어. `NewRecordBadge` 자체는 마진 없이 독립적으로 재사용 가능하게 유지.

---

## 비즈니스 로직 경계

- `addCoins(1, 'record_bonus')` 호출 — **수정 없음**
- `CoinRewardBadge` — **수정 없음**
- `isNewBest` 판단 로직 — **수정 없음**

---

## 생성/수정 파일 목록

| 파일 | 작업 |
|---|---|
| `src/components/result/NewRecordBadge.tsx` | **신규 생성** |
| `src/index.css` | 수정 — font import 700 weight 추가 + keyframe 3개 추가 (`nr-bar-grow`, `nr-content-slide-in`, `nr-badge-fade-in`) |
| `src/pages/ResultPage.tsx` | 수정 — import 추가 + 배지 블록 교체 (L172-199) |

---

## 테스트 영향

| 파일 | 영향 여부 | 처리 |
|---|---|---|
| `src/__tests__/MultiplierBurst.test.tsx` | ❌ 없음 | 변경 불필요 |
| 기타 ResultPage 테스트 | ❌ 없음 | `isNewBest` 배지 직접 커버 테스트 없음 |

**기존 테스트 파손 없음.** `NewRecordBadge` 신규 단위 테스트는 std depth 선택사항이나, 컴포넌트가 순수 뷰(props/state 없음)이므로 스냅샷 테스트로 커버 가능. 이번 이슈 범위에서는 별도 지시 없으면 생략.

---

## 주의사항

1. **`overflow: hidden` 필수** — 루트 배지 div에 없으면 cLeftBar absolute가 카드 패널 밖으로 삐져나옴
2. **다른 이모지 건드리지 않기** — `🪙 {coinBalance}` (L225), `+{coinReward} 🪙` (L418), `CoinRewardBadge`의 `🪙`은 이 이슈 범위 밖
3. **Barlow Condensed 700 weight 추가 필요** — `index.css` 첫 줄 import가 `wght@600;800;900`만 포함. "PERSONAL BEST" 서브 레이블 `fontWeight: 700` 사용을 위해 700 추가 필수 (수정 사항 1-A 참조). 미추가 시 브라우저 폴백으로 800이 렌더됨
4. **`--vb-accent` 현재 값 확인** — `index.css` L9: `#D4A843`. 디자인 토큰 `badge-accent-start`와 일치. 하드코딩 값(`#D4A843`)을 `var(--vb-accent)`로 대체해도 무방하나, 설계 의도(독립 토큰)와 다를 수 있으므로 하드코딩 유지 권장

---

## 검증 기준

| 케이스 | 기대 결과 |
|---|---|
| `isNewBest=true` 시 배지 렌더 | NewRecordBadge 표시: 왼쪽 골드 바 + "NEW RECORD" 텍스트 + "PERSONAL BEST" 서브 레이블 |
| 왼쪽 바 | 3px 너비, 높이 56px, 골드 그라디언트, scaleY 애니메이션 |
| 텍스트 | 이모지 없음, 한국어 없음, "NEW RECORD" + "PERSONAL BEST" 영문만 |
| 접근성 | `role="status"` `aria-label="개인 최고 기록 달성"` 포함 |
| `isNewBest=false` 시 | 배지 미표시 (기존 동작 유지) |
| 코인 지급 | 최고기록 시 `addCoins(1, 'record_bonus')` 정상 호출 (로직 불변) |
| 카드 내 overflow | 배지가 최종 점수 카드 경계 안에 클리핑됨 |
