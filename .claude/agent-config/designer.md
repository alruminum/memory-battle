## 프로젝트 특화 — 컨텍스트 파악

Phase 0에서 아래 파일을 **반드시** 읽는다 (건너뛰기 금지):

- `src/index.css` — CSS 변수 전체 (색상, 폰트 변수)
- `src/components/game/ComboIndicator.tsx` — 콤보 UI 구조·스타일
- `src/components/game/ButtonPad.tsx` — 게임 패드 레이아웃·버튼 스타일
- 디자인 대상 컴포넌트 파일 (이슈에 명시된 경우)

---

## 프로젝트 특화 — 디자인 토큰 (실측값, 반드시 적용)

> ⚠️ 아래 값은 `src/index.css`에서 직접 추출한 실제 값이다.
> 새 컬러 팔레트 도입 금지. 아래 값을 그대로 사용한다.

### 배경 / 서피스
| 토큰 | 값 | 용도 |
|---|---|---|
| `--vb-bg` | `#0e0e10` | 페이지 메인 배경 |
| `--vb-surface` | `#18181b` | 카드/컨테이너 배경 |
| `--vb-surface-2` | `#1f1f23` | 중첩 서피스 |
| `--vb-border` | `#2a2a2e` | 테두리, 빈 블록 |

### 강조색
| 토큰 | 값 | 용도 |
|---|---|---|
| `--vb-accent` | `#D4A843` | 골드 — 콤보 블록, 점수, CTA |
| `--vb-accent-dim` | `#8B7332` | 골드 어두운 버전 |
| `--vb-danger` | `#ff3b3b` | 위험 상태 |
| `--vb-combo-ok` | `#34D399` | 콤보 성공 |
| `--vb-combo-over` | `#F87171` | 콤보 초과/브레이크 |

### 텍스트
| 토큰 | 값 |
|---|---|
| `--vb-text` | `#e8e8ea` |
| `--vb-text-mid` | `#8b8b90` |
| `--vb-text-dim` | `#505055` |

### 게임 버튼 4색 (반드시 이 색만 사용)
| 버튼 | Base | Light | Dark |
|---|---|---|---|
| Orange | `#FF6200` | `#FF8C35` | `#A83F00` |
| Blue | `#0A7AFF` | `#3D9AFF` | `#0055BB` |
| Green | `#18B84A` | `#38D46A` | `#0E7A30` |
| Yellow | `#F5C000` | `#FFD740` | `#A07C00` |

### 폰트
| 변수 | 값 | 용도 |
|---|---|---|
| `--vb-font-score` | `'Barlow Condensed', sans-serif` | 점수, 배율, 스테이지 숫자 (weight: 600/800/900) |
| `--vb-font-body` | `'Space Grotesk', sans-serif` | 본문, 설명 텍스트 (weight: 400/600/700) |

Google Fonts import:
```
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;800;900&family=Space+Grotesk:wght@400;600;700&display=swap');
```

### MultiplierBurst 배율 색상
| 배율 | 색상 |
|---|---|
| x1 | `#FFFFFF` |
| x2 | `#FACC15` |
| x3 | `#FB923C` |
| x4 | `#F87171` |
| x5+ | `#E879F9` |

### ComboTimer
- 타이머 트랙 배경: `#1e1e2e`
- 정상 fill: `#D4A843` + glow `rgba(212,168,67,0.7)`
- 초과 fill: `#F87171` + glow `rgba(248,113,113,0.7)`

---

## 프로젝트 특화 — 디자인 제약

- **스타일**: 인라인 style 객체 사용. Tailwind 클래스 금지
- **플랫폼**: 앱인토스 WebView — 외부 Google Fonts `@import` 가능, 모바일 브라우저 기준
- **게임 앱 특성**: 세로 스크롤 우선, 터치 친화적(최소 44px), 게임의 긴장감·성취감 강화
- **룩앤필 원칙**: 기존 화면에 부분 추가·수정하는 작업은 위 토큰 값을 그대로 따른다. 새 컬러 팔레트 도입 금지
- **배경 금지 색상**: 보라(#6B21A8 등), Lunaris 계열 보라/파랑, 밝은 배경 계열 — 전부 금지
- **Pencil 시안 기준**: 다크 배경(`#0e0e10`) + 골드 강조(`#D4A843`) + 4색 게임 버튼이 기본 팔레트

---

## 프로젝트 특화 — M+V 분리 (구체 예시)

```tsx
// 올바른 예 — 더미 데이터로 View 구현
const DUMMY_SCORE = 1250
const DUMMY_RANK = { daily: 3, monthly: 12, season: 45 }

// 금지 — 실제 store import
import { useGameStore } from '../store/gameStore'
```
