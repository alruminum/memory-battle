# 화면별 UI 스펙 v0.3.1

> PRD v0.5 (2026-04-19) 기준. 이전 버전: `docs/milestones/v03/` (v0.3 스냅샷), `docs/milestones/v04/` (v0.4 스냅샷)
>
> **v0.5 변경점**: ResultPage CTA 영역에서 PointExchangeButton 제거 (F5 폐기).
>
> ---
>
> PRD v0.3.1 (2026-04-02) 기준.
>
> **v0.3.1 주요 변경점**
> - 타이머 게이지 (스테이지별 입력 제한 시간 바) 제거
> - 콤보 시스템 개편: `isComboActive` 기반 → 타임워치 기반 풀콤보 판정
> - `xN` 배율 상한 제거: `min(comboStreak+1, 5)` → `floor(comboStreak/5)+1` (5연속마다 +1, 무제한)
> - 스테이지 헤더에 현재 배율 `xN` 상시 표시 추가 (comboStreak 5 이상일 때)
> - ComboTimer 컴포넌트 신규 추가 (타임워치 UI)
> - MultiplierBurst 컴포넌트 신규 추가 (배율 상승 인터랙션)
> - clearingStage 오버레이 시퀀스에 배율 상승 케이스 추가
>
> **v0.3 주요 변경점 (참고)**
> - 기회제 완전 폐지 → 플레이 횟수 무제한
> - 난이도 선택(Easy/Medium/Hard) 제거 → 스테이지 자동 난이도
> - 스택형 콤보 시스템 UI 추가 (5스테이지~)
> - ResultPage 광고 흐름 교체 + 콤보 스탯 카드 추가

---

## MainPage

| 요소 | 스펙 |
|---|---|
| 내 랭킹 뱃지 | 일간 / 월간 / 시즌 각 순위 표시. 로딩 중: "—위" |
| 시작 버튼 | **항상 활성화** (기회 소진 비활성화 로직 제거) |

**제거된 요소 (v0.1 대비)**
- `오늘 N번 플레이 가능` 남은 기회 표시 → 삭제
- Easy / Medium / Hard 난이도 선택 탭 → 삭제
- 기회 0일 때 비활성화 + "오늘 기회를 모두 사용했어요" 문구 → 삭제

---

## GamePage

| 요소 | 스펙 |
|---|---|
| 색깔 버튼 4개 | 200×200px 원형, 탭 시 밝기 증가 애니메이션 |
| 버튼 글로우 | 풀콤보 달성 후 다음 스테이지 진입 시 버튼 외곽 ring glow 강화 (`box-shadow` 증가) |
| 스테이지 헤더 | 스테이지 번호 + 현재 배율 상시 표시 (아래 규칙 참조) |
| 배너 광고 | 하단 고정, width 100%, max-width 360px, height 96px |
| ComboIndicator | 버튼 패드 위 고정 영역 (minHeight 56px, 레이아웃 shift 방지) |
| ComboTimer | 게임 화면 하단 (배너 광고 바로 위). INPUT 상태에서만 표시 |
| MultiplierBurst | 화면 중앙 오버레이. 배율 상승 시 트리거 |

**제거된 요소 (v0.3 대비)**
- 타이머 게이지 (스테이지별 입력 제한 시간 프로그레스 바) → 삭제

**제거된 요소 (v0.1 대비)**
- 헤더 좌측 난이도 레이블 (`EASY` / `MEDIUM` / `HARD`) → 삭제

### 스테이지 헤더 배율 표시 규칙

| 조건 | 표시 |
|---|---|
| `comboStreak` 0~4 | `STAGE N` (배율 x1이므로 표시 생략) |
| `comboStreak` 5 이상 | `STAGE N  x{floor(comboStreak/5)+1}` |

### ComboIndicator 표시 규칙

| 조건 | 표시 |
|---|---|
| `comboStreak === 0` | 5칸 빈 블록 + x1 상시 표시 (항상 보임) |
| `comboStreak > 0` | `x{floor(comboStreak/5)+1}` + 진행 블록 상시 표시 |
| 풀콤보 클리어 직후 | 디자인 중심 "컴퓨터를 이겼다" 피드백 (텍스트 최소화) |

> **v0.3.1 patch** (이슈 #95): streak=0 시 `null` 반환(미표시) → 항상 표시로 변경. ComboTimer 비활성 시 레이아웃 앵커 역할 겸임.

> 배율 공식: `floor(comboStreak / 5) + 1` (상한 없음)
> 구버전 `isComboActive` 기반 300ms 연속 입력 판정 및 `COMBO!` 글로우 텍스트 제거

### ComboTimer 컴포넌트 (신규)

**역할**: 컴퓨터 시연 시간을 타임워치 형태로 표시해, 유저가 컴퓨터와 경쟁하는 느낌을 유발

| 속성 | 스펙 |
|---|---|
| 위치 | 게임 화면 하단 (배너 광고 바로 위, 기존 타이머 게이지 위치) |
| 표시 시점 | INPUT 상태 (유저 입력 대기 중)에만 노출 |
| 기준 시간 | `flashDuration × sequenceLength` (컴퓨터 시연 총 시간) |
| 경과 표시 | 입력 시작 시점부터 현재까지 경과 시간을 타임워치 형태로 표시 |
| 색상 — 기준 시간 이내 | 초록/파란 계열 (콤보 가능 상태) |
| 색상 — 기준 시간 초과 | 빨간 계열 (콤보 실패 상태) |

**Props**

| Prop | 타입 | 설명 |
|---|---|---|
| `computerShowTime` | `number` (ms) | 컴퓨터 시연 총 시간 (`flashDuration × sequenceLength`) |
| `inputStartTime` | `number` | 유저 입력 시작 시각 (timestamp). `store.sequenceStartTime`. 0 = 미설정 |
| `isActive` | `boolean` | INPUT 상태 여부. true일 때 바 게이지 감소 시작 |
| `isBreaking?` | `boolean` | 콤보 깨짐 상태. true 시 collapse 애니메이션 후 숨김. 기본값 `false` |
| `isShowing?` | `boolean` | SHOWING 페이즈 여부. true 시 풀 바(100%) 정적 렌더링 (DOM 유지, 레이아웃 안정화). 기본값 `false` |
| `onComboTimerExpired?` | `() => void` | bar가 0에 도달 시 1회 호출. isActive=true 구간에서만 발화. optional |

### 스테이지 클리어 오버레이 (clearingStage 시퀀스)

| 조건 | 시퀀스 |
|---|---|
| 일반 클리어 | `STAGE N CLEAR` → 다음 스테이지 |
| 풀콤보 (배율 유지) | 디자인 중심 풀콤보 피드백 → 다음 스테이지 |
| 풀콤보 (배율 상승) | 디자인 중심 풀콤보 피드백 → MultiplierBurst → 다음 스테이지 |

> 풀콤보 조건: 유저의 전체 입력 완료 시간 < 컴퓨터 시연 시간 (`flashDuration × sequenceLength`)
> 배율 상승 여부: 클리어 후 `floor(comboStreak/5)+1` 값이 이전 배율보다 증가했는지로 판단

### MultiplierBurst 컴포넌트 (신규)

**역할**: 배율 상승 순간 화면 중앙에 `xN` scale-up + 파티클 버스트 연출

| 속성 | 스펙 |
|---|---|
| 트리거 | stageClear 후 배율이 상승한 순간 (`multiplierIncreased === true`) |
| 위치 | 화면 중앙 오버레이 |

**애니메이션 시퀀스**

1. `xN` 숫자 작은 크기에서 scale-up (400ms)
2. 숫자 주변 파티클 버스트 (8~12개, 방사형, 200ms)
3. 페이드 아웃

**배율별 색상**

| 배율 | 색상 | 헥스 |
|---|---|---|
| x2 | 노란색 | `#FACC15` |
| x3 | 주황색 | `#FB923C` |
| x4 | 빨간색 | `#F87171` |
| x5 이상 | 마젠타/보라 | `#E879F9` (배율 높을수록 진해짐) |

**Props**

| Prop | 타입 | 설명 |
|---|---|---|
| `multiplier` | `number` | 상승한 배율 값 |
| `isVisible` | `boolean` | 표시 여부 |
| `onComplete` | `() => void` | 애니메이션 완료 콜백 |

---

## ResultPage

### 표시 항목

| 섹션 | 내용 |
|---|---|
| 점수 | 이번 게임 점수 + 최고 기록 갱신 여부 |
| 스테이지 | 최고 도달 스테이지 |
| 랭킹 (진입 시) | 일간 / 월간 / 시즌 각 순위 |
| COMBO STATS 카드 | 풀콤보 달성 횟수, 최고 콤보 스택, 콤보 보너스 점수 (아래 상세) |

### COMBO STATS 카드

```
┌─────────────────────────────┐
│  COMBO STATS                │
│  풀콤보  N회                 │
│  최고 스택  xN               │
│  콤보 보너스  +N점            │
└─────────────────────────────┘
```

| 필드 | 데이터 소스 | 비고 |
|---|---|---|
| 풀콤보 달성 횟수 | `store.fullComboCount` | |
| 최고 콤보 스택 | `store.maxComboStreak` | 배율로 표시: `x{floor(maxComboStreak/5)+1}` |
| 콤보 보너스 점수 | `store.score - store.baseScore` | |

> 풀콤보 달성이 없으면 (fullComboCount === 0) 카드 미표시 또는 회색 처리

### 광고 & 다시하기 흐름

| 단계 | UI 상태 |
|---|---|
| 결과 화면 진입 즉시 | 리워드 광고 자동 시작 (스킵 불가, 다시하기 버튼 비활성화) |
| 완시청 (`userEarnedReward`) | 오늘 첫 완시청이면 "10포인트 지급!" 토스트 표시 |
| 광고 종료 (완시청 or 실패) | 다시하기 버튼 활성화 |
| 다시하기 버튼 탭 | 게임 재시작 (횟수 제한 없음) |

**제거된 요소 (v0.5)**
- 토스포인트 교환 버튼 (PointExchangeButton) → 삭제 (F5 폐기)
- 코인 부족 안내 텍스트 ("코인 N개가 필요합니다 (현재 M개)") → 삭제

**제거된 요소 (v0.1 대비)**
- `광고를 보면 1회 추가됩니다` 확인 모달 → 삭제
- 기회 소진 시 한 번 더 버튼 비활성화 로직 → 삭제
- `월간 N위 → M월 1일에 XXX원 지급 예정` 포인트 안내 → 삭제 (MVP 제외)
- difficulty 레이블 표시 → 삭제

---

## 공통 로딩/에러 상태 UI

| 상태 | UI |
|---|---|
| 초기 로딩 (MainPage) | 전체 화면 중앙 스피너 (32px), 시작 버튼 "로딩 중..." + 비활성화 |
| 랭킹 로딩 (RankingPage) | 스켈레톤 10행 (height 44px, `rgba(255,255,255,0.05)`) |
| 에러 | 하단 토스트 3초 자동 닫힘, 게임 흐름 차단 안 함 |
| 내 랭킹 뱃지 로딩 중 | "—위" 표시 |

---

## RankingPage

- **탭**: 일간 / 월간 / 시즌
- **리스트**: 순위 + 유저명 + 점수 (내 항목 하이라이트)
  - `isMe === true`: "나" 표시 + 하이라이트 스타일
  - `isMe === false`: "익명 {rank}" 표시
  - `userId` prop 없음 — `isMe` flag 기반으로만 표시
- **하단 고정**: 내 순위 항상 표시 (50위 밖이어도 노출)
- **TOP 50**까지만 표시

**RankingRow Props**

| Prop | 타입 | 설명 |
|---|---|---|
| `rank` | `number` | 순위 |
| `score` | `number` | 점수 |
| `isMe` | `boolean` | 현재 유저 여부. true이면 "나" 표시 + 하이라이트 |
