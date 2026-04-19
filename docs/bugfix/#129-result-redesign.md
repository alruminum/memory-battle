---
depth: std
design: required
---

# impl: ResultPage 레이아웃 리디자인 (Hero/Stats/CTA 3계층)

## 참조
- Issue: #129
- Pencil 확정 노드: `uAYzL` (`design/memoryBattle.pen`)
- UX Flow: `docs/ux-flow.md` § S04 ResultPage
- 현재 구현: `src/pages/ResultPage.tsx`

## Design Ref
- Pencil frame ID: `uAYzL` (ResultPage, 390×837, fill `#0e0e10`, padding [0,20], layout vertical)
- 핵심 노드
  | 노드 ID | 역할 |
  |---|---|
  | `wqPtP` | rScoreCard — Hero 카드 (surface, cornerRadius 12, padding 24) |
  | `fJbi7` | stageRow — Stage + 코인 수량 행 (space-between) |
  | `PjMOx` | rBestBadge — pill 배지 (cornerRadius 999, stroke vb-accent) |
  | `NY75d` | rComboCard — Stats 통합 카드 (surface, cornerRadius 12, padding 16, gap 12) |
  | `kQTuo` | statsDivider — 1px 구분선 (#2a2a2e) |
  | `J0Jlt` | rRankSection — Daily/Monthly/Season 랭킹 3행 |
  | `UxXnX` | rBtnArea — CTA 섹션 (gap 10, padding [8,0,32,0]) |
  | `pOzFR` | rPlayBtn — PLAY AGAIN (height 54px, fill #D4A843) |
- 디자인 토큰: `--vb-accent` (#D4A843), `--vb-surface` (#18181b), `--vb-border` (#2a2a2e), `--vb-danger` (#ff3b3b), `--vb-text-dim` (#505055)
- 컴포넌트: CoinIcon (신규 C10), NewRecordBadge (pill 재설계)

---

## 생성/수정 파일 목록

| 파일 | 작업 | 사유 |
|---|---|---|
| `src/components/result/CoinIcon.tsx` | **신규 생성** | 🪙 이모지 전면 대체 컴포넌트 (UX Flow C10 스펙) |
| `src/components/result/NewRecordBadge.tsx` | **수정** | 박스형 → pill 배지 재설계 (Pencil `PjMOx` 스펙) |
| `src/components/result/CoinRewardBadge.tsx` | **수정** | 🪙 → CoinIcon 교체 |
| `src/components/result/PointExchangeButton.tsx` | **수정** | 🪙 → CoinIcon 교체 |
| `src/pages/ResultPage.tsx` | **수정** | 전체 레이아웃 Hero/Stats/CTA 3계층 재구성 |

---

## 1. CoinIcon 컴포넌트 (신규)

### 역할
ResultPage 전역 `🪙` 이모지를 대체하는 커스텀 SVG 코인 아이콘.
UX Flow C10 스펙: size variant 최소 2종(16/20px), 이모지 금지.

### 설계 결정
- **SVG 선택 이유**: 이모지는 플랫폼(iOS/Android/WebView)마다 렌더링 형태 다름, 크기·색상 제어 불가.
  SVG는 크기·색상 완전 제어, 다크 배경 골든 엑센트 일관성 보장.
- **radialGradient**: 입체감 있는 코인 질감. 단색 원보다 실물 코인 연상.
- **size variant**: 14(pill 내부), 16(인라인 텍스트 옆), 20(float-up 단독) 3종 지원.
  UX Flow 스펙 "최소 2종" 충족, 14는 rBestBadge pill 내부 타이트한 공간 대응.

### 인터페이스

```tsx
interface CoinIconProps {
  size?: 14 | 16 | 20  // default: 16
  style?: React.CSSProperties
}
```

### 구현 의사코드

```tsx
// src/components/result/CoinIcon.tsx
export function CoinIcon({ size = 16, style }: CoinIconProps) {
  // gradient id를 size별로 분리 — 동일 페이지에 여러 크기 공존 시 충돌 방지
  const gradId = `coin-grad-${size}`
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-label="코인"
      role="img"
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#FFE08A" />  {/* 하이라이트 */}
          <stop offset="55%"  stopColor="#D4A843" />  {/* vb-accent */}
          <stop offset="100%" stopColor="#8B7332" />  {/* vb-accent-dim */}
        </radialGradient>
      </defs>
      {/* 코인 본체 — 타원으로 원근감 표현 */}
      <ellipse cx="10" cy="10.5" rx="9" ry="8" fill={`url(#${gradId})`} />
      {/* 상단 하이라이트 — 광원 반사 질감 */}
      <ellipse cx="9" cy="8" rx="4" ry="2.5" fill="rgba(255,255,255,0.25)" />
    </svg>
  )
}
```

---

## 2. NewRecordBadge 수정 (pill 재설계)

### 변경 전/후 비교

| 항목 | 변경 전 | 변경 후 |
|---|---|---|
| 형태 | 박스형 (borderRadius 6, 좌측 골드 세로 바) | pill (borderRadius 999, 전체 골드 border) |
| 텍스트 구조 | 2줄 수직: "NEW RECORD" / "PERSONAL BEST" | 1줄 수평: "🏆 PERSONAL BEST" + "+1" + CoinIcon(14) |
| backgroundColor | `#18181b` | `transparent` |
| border | `rgba(255,255,255,0.1)` 전체 | `1px solid var(--vb-accent)` |
| padding | `10px 14px 10px 17px` | `4px 12px` |
| 배치 컨텍스트 | 별도 div (marginTop 14, 점수 카드 내부) | Hero 카드 divider 아래, 중앙 정렬 인라인 |

### 설계 결정
- Pencil 노드 `PjMOx` 스펙 직접 반영: `cornerRadius 999`, `stroke $vb-accent`, `fill transparent`, `padding [4,12]`
- 2줄 → 1줄: Hero 카드 내 수직 공간 절약. 배지는 "짧고 직관적"이어야 함 (UX Flow 리디자인 노트).
- 기존 `nr-bar-grow`, `nr-content-slide-in` 키프레임 → 불필요 (좌측 세로 바 삭제). `nr-badge-fade-in`만 유지.

### 구현 의사코드

```tsx
// src/components/result/NewRecordBadge.tsx
import { CoinIcon } from './CoinIcon'

export function NewRecordBadge() {
  return (
    <div
      role="status"
      aria-label="개인 최고 기록 달성"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 999,
        border: '1px solid var(--vb-accent)',
        backgroundColor: 'transparent',
        animation: 'nr-badge-fade-in 300ms ease-out both',
      }}
    >
      <span style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--vb-accent)',
        letterSpacing: 1.5,
      }}>
        🏆 PERSONAL BEST
      </span>
      <span style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--vb-accent)',
      }}>
        +1
      </span>
      <CoinIcon size={14} />
    </div>
  )
}
```

> **주의**: `nr-badge-fade-in` 키프레임이 `src/index.css`에 정의되어 있는지 확인 필수.
> 없을 경우 `animation` 속성 제거하고 `opacity: 1` 정적 표시로 대체 (기능 우선).
> 기존 `nr-bar-grow`, `nr-content-slide-in` 키프레임은 `src/index.css`에서 삭제 가능 (더 이상 미사용).

---

## 3. CoinRewardBadge 수정

### 변경 내용
- `🪙 +{amount} 코인 획득!` → inline-flex row: `<CoinIcon size={16} /> +{amount} 코인 획득!`
- 루트 div에 `display: 'flex', alignItems: 'center', gap: 6` 추가

```tsx
// 변경 전
🪙 +{amount} 코인 획득!

// 변경 후
<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
  <CoinIcon size={16} />
  <span>+{amount} 코인 획득!</span>
</div>
```

---

## 4. PointExchangeButton 수정

### 변경 내용
- 버튼 내부: `display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6` 추가
- 라벨 텍스트: `🪙 ${COIN_EXCHANGE_AMOUNT}코인 → ...` → `<CoinIcon size={16} /> ${COIN_EXCHANGE_AMOUNT}코인 → ...`

```tsx
// 변경 전 (단순 문자열)
{isProcessing ? '교환 중...' : `🪙 ${COIN_EXCHANGE_AMOUNT}코인 → ...`}

// 변경 후 (flex 컨테이너)
<button style={{ ..., display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
  {isProcessing ? '교환 중...' : (
    <>
      <CoinIcon size={16} />
      <span>{COIN_EXCHANGE_AMOUNT}코인 → {COIN_EXCHANGE_AMOUNT}포인트 교환</span>
    </>
  )}
</button>
```

---

## 5. ResultPage 전체 레이아웃 리디자인

### 섹션 구조 (Hero / Stats / CTA 3계층)

```
[A] GAME OVER 헤더
    └─ paddingTop: 20, textAlign: center
    └─ marginBottom: 12  ← spacerHeaderHero (12px)

[B] Hero 카드 (rScoreCard)
    margin: 0 20px, padding: 24, cornerRadius: 12
    ├─ FINAL SCORE 레이블 (11px, vb-text-dim, letterSpacing 3, Barlow)
    ├─ 점수 숫자 (64px / weight 900, vb-text, Barlow)
    ├─ stageRow (marginTop 8, display flex, justifyContent space-between)
    │   ├─ "Stage {stage}" (12px, vb-text-dim, Space Grotesk)
    │   └─ inline-flex: <CoinIcon size={16}/> "{coinBalance}개" (12px, vb-accent)
    └─ isNewBest 시:
        ├─ divider (borderTop: 1px solid vb-border, margin: 16px 0 12px)
        └─ 중앙 정렬 row: <NewRecordBadge />
    └─ marginBottom: 16  ← spacerHeroStats (16px)

[C] Stats 카드 (rComboCard + rRankCard 통합)
    margin: 0 20px, padding: 16, cornerRadius: 12
    ├─ COMBO STATS 타이틀 (10px, vb-text-dim, letterSpacing 3)
    ├─ 3열 stats row (marginTop 12, justifyContent space-between)
    │   ├─ BEST COMBO / 값
    │   ├─ MULTIPLIER / 값
    │   └─ COMBO BONUS / 값
    ├─ statsDivider (borderTop: 1px solid vb-border, margin: 12px 0 0)
    └─ 랭킹 3행 (Daily/Monthly/Season)
        각 행: padding 14px 16px, borderBottom 사이 구분
        마지막 행 borderBottom 없음
    └─ marginBottom: 16  ← spacerStatsAd (16px)

[D] 광고 placeholder
    margin: 0 20px, height: 96, cornerRadius: 8
    └─ marginBottom: 16  ← spacerAdCta (16px)

[E] CTA 섹션 (rBtnArea)
    marginTop: 'auto', padding: '8px 20px 32px'
    gap: 10 (flex column)
    ├─ <PointExchangeButton />
    ├─ 광고 로딩 중 텍스트 (adLoading && !adDone)
    ├─ PLAY AGAIN 버튼 (height: 54px)  ← 기존 padding 16px 0 → 명시적 height 54
    └─ View Rankings 버튼
```

### 루트 gap 제거 전략

**현재 방식**: 각 카드 `margin: '12px 20px 0'` 또는 `margin: '16px 20px 0'`  
**변경 방식**: 루트 컨테이너 gap 없음. 각 섹션에 `marginBottom` 명시 + 수평 margin은 각 섹션 자체에 선언

```
선택 근거: Pencil 노드 uAYzL gap 제거 지침 (이슈 본문).
CSS gap 대신 marginBottom 개별 지정 → CTA의 marginTop: 'auto' 동작 보장.
gap 방식은 flex 자식 모두에 간격을 주므로 마지막 요소 뒤에도 불필요 간격 생김.
```

### PLAY AGAIN 버튼 height 변경

```tsx
// 변경 전
padding: '16px 0',

// 변경 후 (명시적 height, padding 제거로 일관성)
height: 54,
padding: 0,
```

### coin-float-up 이모지 교체

```tsx
// 변경 전
+{coinReward} 🪙

// 변경 후 (inline-flex)
<div className="coin-float-up" style={{ ..., display: 'flex', alignItems: 'center', gap: 4 }}>
  +{coinReward} <CoinIcon size={20} />
</div>
```

> 기존 `transform: 'translateX(-50%)'`는 `className="coin-float-up"` CSS에 이미 포함되어 있거나
> inline style로 선언됨 — 현재 코드 확인 후 유지.
> `coin-float-up` CSS 애니메이션은 변경 없음.

---

## 삭제 대상 (구 코드 정리)

| 삭제 대상 | 위치 | 대체 |
|---|---|---|
| 코인 잔액 독립 카드 div (`[v0.4] 코인 잔액 표시`) | ResultPage.tsx | Hero 카드 stageRow 우측으로 통합 |
| 랭킹 독립 카드 div (`랭킹 리스트`) | ResultPage.tsx | Stats 카드 하단으로 통합 |
| `<div style={{ marginTop: 14 }}><NewRecordBadge /></div>` | ResultPage.tsx | divider + `<div style={{ display:'flex', justifyContent:'center' }}>` 구조로 교체 |
| `nr-bar-grow`, `nr-content-slide-in` 키프레임 | src/index.css | NewRecordBadge pill 구조에서 미사용 → 삭제 (다른 컴포넌트 미사용 확인 후) |

---

## 기능 보존 체크리스트 (변경 없는 항목)

- [ ] 광고 완시청 → `CoinRewardBadge` + `coin-float-up` 표시 (`coinReward` 상태 유지)
- [ ] `isNewBest` → PERSONAL BEST pill 표시 + `addCoins(1,'record_bonus')` 호출
- [ ] `PointExchangeButton` disabled 상태 (`coinBalance < 10`) 및 비활성 이유 텍스트
- [ ] `adLoading && !adDone` → PLAY AGAIN 비활성(회색), "광고 로딩 중..." 텍스트 표시
- [ ] `handleExchange` → `grantCoinExchange()` → `addCoins(-10,...)` 흐름 변경 없음
- [ ] toast 3초 자동 닫힘 로직 변경 없음
- [ ] 점수 제출 (`submitScore`) + `prevBestRef` 패턴 변경 없음
- [ ] `slide-up 0.5s ease-out` 페이지 진입 애니메이션 유지

---

## 구현 순서 권장

```
1. CoinIcon.tsx 생성 (의존 없음, 최우선)
2. NewRecordBadge.tsx 수정 (CoinIcon import)
3. CoinRewardBadge.tsx 수정 (CoinIcon import)
4. PointExchangeButton.tsx 수정 (CoinIcon import)
5. ResultPage.tsx 수정 (레이아웃 전체 재구성, 위 4개 import)
6. src/index.css 정리 (nr-bar-grow, nr-content-slide-in 삭제, nr-badge-fade-in 존재 확인)
```

---

## 주의사항

### 컴포넌트 경계
- `CoinIcon`은 현재 `src/components/result/`에 배치. GamePage/MainPage 확장은 별도 이슈.
- `NewRecordBadge` 파일명 유지 → `ResultPage.tsx` import 경로 변경 불필요.

### CSS 의존성 확인 필요
- `nr-badge-fade-in` — 현재 `src/index.css` 또는 `NewRecordBadge` 내 정의 여부 확인.
  NewRecordBadge 현재 코드: `animation: 'nr-badge-fade-in 300ms ease-out both'` 참조 중.
  → 없으면 `@keyframes nr-badge-fade-in { from { opacity: 0 } to { opacity: 1 } }` 추가 (index.css).

### Stats 카드 내 랭킹 패딩 처리
- 랭킹 행은 카드 자체 padding(16px)이 아닌, 행별 `padding: '14px 16px'` 사용.
- statsDivider는 카드 내부에서 전폭 구분선이 되어야 하므로,
  Stats 카드 `padding` 제거 + 내부 섹션별 padding 적용 방식 또는
  `margin: '0 -16px'`으로 divider를 카드 전폭으로 확장하는 방식 중 선택.
  **권장**: 후자 (`margin: '12px -16px 0'`으로 divider 전폭 확장) — 카드 padding을 16 유지하며 구분선만 전폭.
