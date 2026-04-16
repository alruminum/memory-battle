---
depth: std
---
# 01. useCoin 훅 + gameStore 코인 필드 (F1 인프라)

## 결정 근거

- **useCoin 훅 2-param 설계 (`addCoins(amount, type)`)**: userId는 훅 내부에서 `useGameStore.getState().userId`로 조회한다. 호출 지점마다 userId를 전달하면 누락 버그 위험과 boilerplate가 증가한다. 전체 설계 문서(architecture.md § useCoin 훅 시그니처 결정)에서 이미 2-param으로 확정된 사항이므로 3-param으로 변경 금지.
- **Supabase RPC `add_coins` 원자 처리**: 클라이언트 SELECT→UPDATE 2-step은 동시 요청 시 race condition 가능. 단일 트랜잭션 RPC로 `user_coins.balance` 업데이트와 `coin_transactions` INSERT를 원자적으로 처리한다. `GREATEST(0, balance + amount)` 로 음수 잔액을 DB 레벨에서 차단.
- **`setCoinBalance` store 액션**: useCoin이 RPC 결과(최신 balance)를 store에 반영한다. 컴포넌트가 `useGameStore.coinBalance`를 구독해 잔액을 표시할 수 있다. useCoin이 store를 직접 수정하는 것보다 setCoinBalance 액션을 경유해야 Zustand devtools에서 추적 가능.
- **`revive()` store 액션 — 코인 차감 없음**: 코인 차감(`addCoins(-5, 'revival')`)은 RevivalButton / GameOverOverlay 컴포넌트에서 먼저 수행한다. store.revive()는 순수 상태 전환(sequence 초기화, revivalUsed=true, status='SHOWING')만 담당한다. 이렇게 분리해야 코인 부족 시 상태 전환 없이 오류 처리 가능.
- **`sequence = []` 초기화**: useGameEngine의 useEffect가 `status === 'SHOWING' && sequence.length === 0` 조건으로 새 시퀀스를 생성한다. revive() 이후 stage 값이 유지되므로, 기존 useGameEngine 로직을 수정하지 않고 동일 스테이지 길이의 새 시퀀스가 자동 생성된다.
- **`hasTodayReward` 유지**: Story 2(F6)에서 별도 제거 예정. 이번 모듈에서는 건드리지 않는다.
- **`CoinTxType` 공유 타입**: `src/types/index.ts`에 정의해 useCoin, GameOverOverlay, RevivalButton, PointExchangeButton 등 다수 파일이 동일 타입을 참조하도록 한다.

---

## 생성/수정 파일

- `src/types/index.ts` (수정) — `CoinTxType` 추가, `UserCoinsRow`·`CoinTransactionRow` re-export 추가 (gen:types 재생성 후)
- `src/hooks/useCoin.ts` (신규) — `getBalance()`, `addCoins()` 구현
- `src/store/gameStore.ts` (수정) — `coinBalance`, `revivalUsed`, `revive()`, `setCoinBalance()` 추가

> **선행 작업 (RELEASE.md 참조, 인간이 처리)**
> - Supabase 콘솔: `user_coins`, `coin_transactions` DDL + RLS 정책 실행
> - Supabase 콘솔: `add_coins` RPC 함수 등록
> - `npm run gen:types` 실행 → `src/types/database.types.ts` 재생성
> - database.types.ts 하단에 편의 타입 별칭 수동 추가 (아래 참조)

---

## src/types/index.ts

### 변경 사항

```typescript
// 추가
export type CoinTxType = 'ad_reward' | 'record_bonus' | 'revival' | 'toss_points_exchange'

// 추가 (gen:types 완료 후 — database.types.ts에 alias 추가된 이후)
export type { UserCoinsRow, CoinTransactionRow } from './database.types'
```

### database.types.ts 하단 수동 추가 (gen:types 재실행마다 복원 필요)

```typescript
export type ScoreRow    = Database['public']['Tables']['scores']['Row']
export type ScoreInsert = Database['public']['Tables']['scores']['Insert']

// [v0.4] 코인 테이블 타입
export type UserCoinsRow          = Database['public']['Tables']['user_coins']['Row']
export type UserCoinsInsert       = Database['public']['Tables']['user_coins']['Insert']
export type CoinTransactionRow    = Database['public']['Tables']['coin_transactions']['Row']
export type CoinTransactionInsert = Database['public']['Tables']['coin_transactions']['Insert']

// [DEPRECATED v0.4] daily_reward — 코드에서 사용 제거, 타입만 보존 참조용
// export type DailyRewardRow    = Database['public']['Tables']['daily_reward']['Row']
// export type DailyRewardInsert = Database['public']['Tables']['daily_reward']['Insert']
```

---

## src/hooks/useCoin.ts

### 인터페이스

```typescript
interface UseCoinReturn {
  getBalance: () => Promise<number>       // Supabase SELECT → store.setCoinBalance 동기화
  addCoins: (amount: number, type: CoinTxType) => Promise<number>  // RPC 호출 → 최신 balance 반환. 실패 시 throw (PostgrestError)
}

export function useCoin(): UseCoinReturn
```

### 핵심 로직

```typescript
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'
import type { CoinTxType } from '../types'

export function useCoin() {
  const setCoinBalance = useGameStore((s) => s.setCoinBalance)

  // Supabase SELECT user_coins WHERE user_id = ...
  const getBalance = async (): Promise<number> => {
    const userId = useGameStore.getState().userId
    if (!userId) return 0

    const { data, error } = await supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle()   // 첫 플레이어는 row 없음 → null 처리

    if (error) {
      console.error('[useCoin] getBalance error:', error)
      return 0
    }

    const balance = data?.balance ?? 0
    setCoinBalance(balance)
    return balance
  }

  // Supabase RPC add_coins (원자 증감)
  const addCoins = async (amount: number, type: CoinTxType): Promise<number> => {
    const userId = useGameStore.getState().userId
    if (!userId) return 0

    const { data, error } = await supabase.rpc('add_coins', {
      p_user_id: userId,
      p_amount: amount,   // ⚠️ p_delta 아님 — p_amount 사용
      p_type: type,
    })

    if (error) {
      console.error('[useCoin] addCoins error:', error)
      // 오류 시 throw — 호출자 try/catch 또는 .catch()에서 배지·토스트 표시 등 UX 처리
      // ⚠️ return getBalance()로 처리하면 호출자 try/catch가 성공으로 인식해
      //    코인 미지급 상태에서 배지·부활 등 후속 동작이 실행되는 버그 발생
      throw error
    }

    const newBalance = (data as number) ?? 0
    setCoinBalance(newBalance)
    return newBalance
  }

  return { getBalance, addCoins }
}
```

### 주의사항

- `userId`는 매 호출마다 `useGameStore.getState().userId`로 조회한다. 훅 마운트 시점에 캡처하면 userId 세팅 전 빈 문자열로 고착될 수 있다.
- `.maybeSingle()`: 신규 유저는 user_coins row가 없다. `add_coins` RPC의 `INSERT … ON CONFLICT DO UPDATE` 구조로 첫 적립 시 row가 생성된다.
- `data as number`: supabase RPC 반환 타입은 `unknown`. `gen:types` 시 RPC 반환 타입이 자동 추론되는 경우 캐스팅 불필요.

---

## src/store/gameStore.ts

### 인터페이스 변경 (추가 필드·액션만)

```typescript
interface GameStore {
  // ... 기존 필드 유지 ...

  // [v0.4] 코인
  coinBalance: number    // Supabase user_coins.balance 미러 (앱 진입·이벤트마다 갱신)
  revivalUsed: boolean   // 이 판 부활 사용 여부 (startGame/resetGame 시 false 초기화)

  // [v0.4] 액션
  setCoinBalance: (balance: number) => void  // useCoin에서 잔액 동기화
  revive: () => void   // RESULT→SHOWING 전환 (코인 차감은 호출자 책임, 시퀀스 초기화, stage/score/combo 유지)
}
```

### 초기값 추가

```typescript
// create<GameStore>((set, get) => ({
//   ... 기존 초기값 ...
  coinBalance: 0,
  revivalUsed: false,
```

### setCoinBalance 구현

```typescript
  setCoinBalance: (balance) => set({ coinBalance: balance }),
```

### revive 구현

```typescript
  // RESULT → SHOWING 전환
  // ⚠️ 코인 차감(addCoins(-5,'revival'))은 호출 전 이미 완료되어야 한다
  // ⚠️ sequence=[] → useGameEngine useEffect가 현재 stage 길이의 새 시퀀스를 생성
  revive: () =>
    set((state) => {
      // 가드: RESULT 상태가 아니거나 이미 부활 사용 시 무시
      if (state.status !== 'RESULT') return {}
      if (state.revivalUsed) return {}
      return {
        status: 'SHOWING',
        sequence: [],       // useGameEngine이 감지해 stage 길이 새 시퀀스 생성
        currentIndex: 0,
        revivalUsed: true,
        // score, stage, comboStreak, fullComboCount, maxComboStreak 유지
      }
    }),
```

### startGame / resetGame 수정 (revivalUsed 초기화 추가)

```typescript
  startGame: () =>
    set({
      // ... 기존 필드 ...
      revivalUsed: false,   // 추가
      // coinBalance는 초기화하지 않는다 (앱 진입 시 getBalance가 세팅, 게임 시작마다 리셋 불필요)
    }),

  resetGame: () =>
    set({
      // ... 기존 필드 ...
      revivalUsed: false,   // 추가
    }),
```

### 주의사항

- `revive()` 가드에서 `revivalUsed` 확인 필수: 동일 판에서 두 번 부활하는 버그 방지.
- `revive()` 내부에서 `coinBalance`를 직접 차감하지 않는다. useCoin.addCoins가 DB와 동기화된 정확한 값을 setCoinBalance로 갱신하므로 store에서 이중 차감하면 불일치 발생.
- `sequence = []` + `status = 'SHOWING'`은 useGameEngine의 기존 SHOWING useEffect 조건(`sequence.length === 0`)을 트리거한다. useGameEngine 코드를 수정하지 않아도 된다.
- `revivalUsed`는 `startGame()` / `resetGame()` 모두에서 `false`로 초기화해야 한다. 두 곳 중 하나라도 빠지면 다음 판 시작 시 부활 버튼이 나타나지 않는 버그 발생.

---

## 테스트 경계

- `useCoin.getBalance()`: userId = '' 시 0 반환, supabase 오류 시 0 반환 (console.error)
- `useCoin.addCoins()`: RPC 성공 시 setCoinBalance 호출 후 새 balance 반환. 오류 시 throw (PostgrestError) — 호출자 catch에서 처리됨 확인
- `addCoins` throw 정책 검증: impl 03/04/05 호출자 패턴과 호환 확인
  - impl 03: `try { await addCoins(...); setCoinReward(...) } catch { showToast() }` → throw 시 catch 진입, setCoinReward 미실행 ✅
  - impl 04: `addCoins(...).catch(() => { console.warn() })` → throw 시 .catch() 진입 ✅
  - impl 05: `try { await addCoins(-5, 'revival'); revive() } catch { showToast() }` → throw 시 revive() 미실행 ✅
- `store.revive()`: status !== 'RESULT'이면 no-op, revivalUsed=true이면 no-op, 정상 케이스에서 status='SHOWING' + sequence=[] + revivalUsed=true 확인

---

## 의존 모듈

- **선행**: Supabase `add_coins` RPC 등록 완료 (RELEASE.md)
- **선행**: `npm run gen:types` 실행 → database.types.ts 최신화
- **이후**: impl 02 (daily-reward-removal), impl 03~07은 이 모듈 완료 후 착수 가능
