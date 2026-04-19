# 기억력배틀 — 아키텍처 설계도

> 변경 이력
> - v0.5 (2026-04-19): F5 폐기 (Epic 13) — 시스템 구조도·화면 흐름·ResultFlow·모듈 의존 관계에서 PointExchangeButton/grantCoinExchange/toss_points_exchange 경로 제거.
> - v0.4.2 (2026-04-16): DESIGN_REVIEW_FAIL 수정 — useCoin.addCoins 2-param 통일(userId 내부 조회 확정), GameOverOverlay 즉시 부활 경로에 addCoins(-5,'revival') 명시
> - v0.4.1 (2026-04-15): DESIGN_REVIEW_FAIL 수정 — GameOverOverlay 즉시 부활 경로 추가, ResultFlow 광고→코인→부활버튼→교환버튼→다시하기 시퀀스 명시, 부활 진입점 설계 결정 주석 추가
> - v0.4 (2026-04-15): 코인 시스템 반영 — useCoin 훅, user_coins/coin_transactions DB 추가, result/ 서브 컴포넌트 3종, revive() 상태 전환, daily_reward 폐기
> - v0.3.2 (2026-04-03): 게임오버 오버레이 추가 (GameOverOverlay)
> - v0.3.1 (2026-04-02): ComboTimer, MultiplierBurst 추가
> - v0.3 (2026-04-01): 난이도 제거, 스테이지 기반 속도/타이머, 스택형 콤보

---

## 시스템 전체 구조

```mermaid
graph TD
  subgraph 토스앱["Toss App (네이티브)"]
    SDK["@apps-in-toss/web-framework SDK"]
    AdsSDK["TossAds SDK"]
  end

  subgraph WebView["WebView (미니앱)"]
    Main["MainPage\n시작·랭킹·코인잔액"]
    Game["GamePage\n게임·타이머·배너광고"]
    Result["ResultPage\n결과·리워드광고·코인·부활 [v0.5: 교환 제거]"]
    Ranking["RankingPage\n일간·월간·시즌"]

    subgraph Hooks["Hooks"]
      Engine["useGameEngine\n상태머신 훅"]
      RankHook["useRanking\n기간별 랭킹"]
      CoinHook["useCoin [v0.4]\n잔액·적립·차감"]
    end

    subgraph Components["Components"]
      GameComps["game/\nButtonPad · ComboIndicator\nComboTimer · MultiplierBurst\nGameOverOverlay · ScoreDisplay"]
      ResultComps["result/ [v0.4]\nCoinRewardBadge · RevivalButton\nPointExchangeButton"]
      AdsComps["ads/\nBannerAd · RewardAd"]
    end

    Store["Zustand Store\ngameStore.ts"]
    AIT["lib/ait.ts\nSDK 래퍼"]
    SB["lib/supabase.ts\nDB 클라이언트"]
  end

  subgraph Supabase["Supabase (PostgreSQL)"]
    ScoresTable["scores\n랭킹 기록"]
    UserCoinsTable["user_coins [v0.4]\n잔액"]
    CoinTxTable["coin_transactions [v0.4]\n거래 내역"]
    DailyRewardTable["daily_reward\n[DEPRECATED v0.4]"]
  end

  Main --> Game --> Result
  Result --> Ranking
  Result --> Game

  Game --> Engine --> Store
  Engine --> AIT
  Result --> AIT
  Result --> SB
  Main --> SB
  Result --> CoinHook
  Main --> CoinHook

  CoinHook --> SB
  AIT --> SDK
  AIT --> AdsSDK
  SB --> ScoresTable
  SB --> UserCoinsTable
  SB --> CoinTxTable
```

---

## 게임 상태 머신

```mermaid
stateDiagram-v2
  [*] --> IDLE : 앱 진입

  IDLE --> SHOWING : startGame()
  SHOWING --> INPUT : 시퀀스 표시 완료
  INPUT --> SHOWING : 정답 입력 → 다음 라운드 (stageClear)
  INPUT --> RESULT : 오답 또는 타이머 만료 (gameOver)
  RESULT --> IDLE : resetGame()

  RESULT --> SHOWING : revive() [v0.4]\nbalance≥5 AND revivalUsed=false\n동일 스테이지 · 시퀀스 초기화\nscore·combo·stage 유지

  SHOWING : SHOWING\n버튼 깜빡임 중\n(유저 입력 불가)
  INPUT : INPUT\n유저 입력 대기\n(스테이지별 타이머 동작)
  RESULT : RESULT\n게임 오버\n(점수 저장·광고·코인·부활 UI)
```

---

## 화면 흐름도

```mermaid
flowchart TD
  A["MainPage\n시작·랭킹\n🪙 잔액 [v0.4]"] -->|시작 버튼| B["GamePage\n시퀀스 표시 → 입력\n배너광고"]
  B -->|오답 / 타임아웃| C_OV["GameOverOverlay\n게임오버 타이틀 + 탭 유도"]

  C_OV -->|"balance≥5 · !revivalUsed\naddCoins(-5,'revival') → revive()\n즉시 부활"| B
  C_OV -->|"탭 · 결과 보기\nrevivalUsed=true or balance<5"| C["ResultPage\n점수·랭킹·코인·부활 [v0.5: 교환 제거]"]

  C -->|"revive() 5코인\n!revivalUsed · balance≥5"| B
  C -->|다시하기| A
  C -->|랭킹 보기| D["RankingPage\n일간 / 월간 / 시즌"]
  D -->|뒤로| A
  A -->|랭킹 탭| D

  subgraph ResultFlow["ResultPage 내부 흐름 — 광고→코인→부활→다시하기 순서 [v0.5: 교환 제거]"]
    R1["① 리워드 광고 자동 시작\n강제·스킵불가"] -->|완시청 userEarnedReward| R2["② 코인 1~5개 랜덤 지급\n🪙 +N 획득! 피드백\naddCoins(N, 'ad_reward')"]
    R2 --> R3{③ 최고기록 갱신?}
    R3 -->|Yes| R4["③-a 🏆 +1코인 보상\naddCoins(1, 'record_bonus')"]
    R3 -->|No| R_RV
    R4 --> R_RV["④ RevivalButton 상태 결정\n· !revivalUsed · balance≥5: 활성\n· !revivalUsed · balance<5: disabled\n· revivalUsed=true: 미표시"]
    R_RV --> R5["⑤ 다시하기 버튼 활성화"]
    R1 -->|스킵 · 광고 실패| R_RV
  end
  %% ~~PointExchangeButton (⑤→⑥ 단계)~~ [v0.5 삭제 — F5 폐기]
```

> **설계 결정 — 부활 진입점 v0.4**: 부활은 두 경로에서 가능하다.
>
> | 진입점 | 조건 | 이후 흐름 |
> |---|---|---|
> | **GameOverOverlay (즉시 부활)** | balance≥5 AND revivalUsed=false | addCoins(-5, 'revival') → store.revive() → SHOWING 복귀 (ResultPage 미진입) |
> | **ResultPage (결과 확인 후 부활)** | revivalUsed=false AND balance≥5 (광고 완시청 후 잔액 기준) | RevivalButton 탭 → SHOWING 복귀 |
>
> `revivalUsed=true`이면 ResultPage에서 RevivalButton은 **미표시** (disabled가 아님 — PRD §12 F4 "부활 버튼 미표시" 기준).
> GameOverOverlay에서 즉시 부활 시 `revivalUsed=true`로 설정되므로, ResultPage에 진입하더라도 버튼이 나타나지 않아 판당 1회 보장.

---

## DB ERD

```mermaid
erDiagram
  scores {
    UUID id PK
    TEXT user_id "getUserKeyForGame().hash"
    INTEGER score "최종 점수"
    INTEGER stage "게임 오버 시점 스테이지"
    TIMESTAMPTZ played_at
  }

  user_coins {
    TEXT user_id PK "getUserKeyForGame().hash"
    INTEGER balance "잔액 CHECK >= 0"
  }

  coin_transactions {
    UUID id PK
    TEXT user_id
    TEXT type "ad_reward|record_bonus|revival|toss_points_exchange"
    INTEGER amount "양수=적립, 음수=차감"
    TIMESTAMPTZ created_at
  }

  scores }o--o{ user_coins : "user_id"
  user_coins ||--o{ coin_transactions : "user_id"
```

> `daily_reward` 테이블: 코드/훅 v0.4에서 제거됨, 물리 삭제는 v2

---

## 점수 계산 흐름 (v0.3.2-hotfix 기준, v0.4 변경 없음)

```mermaid
flowchart TD
  A["addInput(color)"] --> B{정답?}
  B -->|No — 오답| Z["gameOver('wrong')\nmaxComboStreak 갱신\n점수: 맞춘 버튼 누적분만"]
  B -->|Yes| C["calcButtonScore(comboStreak)\n= getComboMultiplier(streak)\n배율 즉시 적용 v0.3.2-hotfix"]
  C --> D{마지막 버튼?}
  D -->|No| E["score += buttonScore\n다음 입력 대기"]
  D -->|Yes — stageClear| F["stageClear(inputCompleteTime, flashDuration)"]

  F --> G{userInputTime < computerShowTime?}
  G -->|Yes — 풀콤보| H["comboStreak +1\nmultiplierIncreased 판정"]
  G -->|No| I["comboStreak = floor(prev/5)*5\n배율 유지 (Epic 11 Story 11)"]
  H --> J["score += calcClearBonus(stage) × multiplier"]
  I --> J
  J --> K["SHOWING (다음 스테이지)"]
```

---

## 코인 시스템 아키텍처 (v0.4 신설)

```mermaid
flowchart TD
  subgraph useCoin["useCoin 훅"]
    UC1["getBalance()\n userId=store.getState().userId 내부 조회\n→ Supabase SELECT user_coins"]
    UC2["addCoins(amount, type)\n userId=store.getState().userId 내부 조회\n→ Supabase RPC add_coins atomic\n→ coin_transactions INSERT 포함"]
  end

  subgraph GameOverFlow["게임오버 후 ResultPage 흐름 [v0.5: 교환 단계 제거]"]
    GO1["showRewardAd()\n완시청 → resolve(true)"]
    GO2["randomCoinReward()\n1개30% 2개30% 3개25% 4개10% 5개5%\n샌드박스: 고정 2개"]
    GO3{최고기록 갱신?}
    GO4["addCoins(1, 'record_bonus')"]
    GO5["RevivalButton\nbalance≥5 AND !revivalUsed\n→ addCoins(-5, 'revival')\n→ store.revive()"]
  end
  %% ~~GO6: PointExchangeButton balance≥10 → grantCoinExchange() → addCoins(-10, 'toss_points_exchange')~~ [v0.5 삭제]

  GO1 -->|완시청| GO2
  GO2 --> GO3
  GO3 -->|Yes| GO4
  GO3 -->|No| GO5
  GO4 --> GO5

  GO2 --> useCoin
  GO4 --> useCoin
  GO5 --> useCoin
```

### useCoin 훅 시그니처 결정 — 2-param, userId 내부 조회

> **확정된 설계**: `addCoins(amount: number, type: CoinTxType): Promise<number>`
> — userId는 호출자가 전달하지 않는다. 훅 내부에서 `useGameStore.getState().userId`로 조회.
>
> **근거**:
> 1. 모든 호출 지점(stories.md, GameOverFlow diagram)이 2-param 패턴 사용
> 2. `game-logic.md` `revive: () => void` — 훅이 userId를 캡슐화한다는 설계 의도
> 3. React Hook 패턴 — 컴포넌트가 userId를 직접 관리할 필요 없음
>
> **3-param 미채택 근거**: caller마다 userId 전달 책임 분산 → 누락 버그 위험, boilerplate 증가.

### add_coins Supabase RPC 설계

```sql
-- 원자적 잔액 업데이트 + 거래 내역 INSERT
-- balance 음수 차단: GREATEST(0, balance + amount)
CREATE OR REPLACE FUNCTION add_coins(
  p_user_id TEXT,
  p_amount  INTEGER,
  p_type    TEXT
)
RETURNS INTEGER   -- 업데이트 후 최종 balance 반환
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  INSERT INTO user_coins (user_id, balance)
  VALUES (p_user_id, GREATEST(0, p_amount))
  ON CONFLICT (user_id) DO UPDATE
    SET balance = GREATEST(0, user_coins.balance + p_amount)
  RETURNING balance INTO v_balance;

  INSERT INTO coin_transactions (user_id, type, amount)
  VALUES (p_user_id, p_type, p_amount);

  RETURN v_balance;
END;
$$;
```

> **선택 근거**: 클라이언트 SELECT → UPDATE 2-step은 race condition 발생 가능.
> RPC 단일 트랜잭션으로 atomic 처리. `GREATEST(0, ...)` 로 음수 차단.

---

## 모듈 의존 관계 (v0.4)

```
useCoin ─────────────────────────────┐
    ↑                                ↓
gameStore (coinBalance,          lib/supabase.ts ──→ Supabase
revivalUsed, revive(),               ↑
setCoinBalance)               lib/ait.ts ──→ SDK
    ↑                                ↑
ResultPage ──────────────────────────┤
  ├── CoinRewardBadge   (F2: 광고 코인 피드백)
  └── RevivalButton      (F4: 5코인 부활)
  %% ~~PointExchangeButton (F5: 10코인 교환)~~ [v0.5 삭제]

MainPage ───────────────────────────→ useCoin (잔액 표시)
```

### 구현 의존성 순서 (게이트)

| 순서 | 모듈 | 선행 의존 | 병행 가능 |
|---|---|---|---|
| 1 | F1: useCoin + gameStore coin fields | Supabase add_coins RPC | — |
| 2 | F6: daily_reward 코드 제거 | — | F1과 병행 |
| 3 | F2: CoinRewardBadge + ResultPage 광고 코인 | F1 | F3/F4와 병행 |
| 4 | F3: 최고기록 코인 보상 | F1 | F2/F4와 병행 |
| 5 | F4: RevivalButton + revive() | F1 | F2/F3와 병행 |
| ~~6~~ | ~~F5: PointExchangeButton + grantCoinExchange~~ | ~~F1~~ | ~~—~~ | [v0.5 폐기] |
| 6 | Polishing: 잔액 UI + float-up 애니메이션 | F2~F4 | — |

> ⚠️ F1 완료 전에는 F2~F6 구현 불가 (useCoin이 모든 코인 기능의 공통 기반)
> v0.5 변경: F5 제거로 의존 범위 F2~F5 → F2~F4로 조정.
