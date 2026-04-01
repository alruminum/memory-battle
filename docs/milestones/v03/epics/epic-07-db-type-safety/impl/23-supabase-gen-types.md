# 23. Supabase 타입 자동화 도입

## 결정 근거

- **왜 `supabase gen types`인가**: Supabase CLI가 공식 제공하는 타입 생성 기능으로, DB 스키마를 단일 진실 공급원(Single Source of Truth)으로 삼아 TypeScript 타입을 파생시킨다. 수동으로 관리하는 인터페이스(`{ user_id: string; score: number; stage: number }`)는 컬럼 추가/삭제 시 컴파일 타임에 잡히지 않는다. 이번 `difficulty` 사건(Epic 05에서 컬럼 제거했으나 INSERT payload에 잔존)이 그 증거.
- **버린 대안: 수동 타입 관리** — 관리 부담이 크고 스키마 변경 누락 시 런타임 오류가 됨. Schema-First 원칙 위배.
- **버린 대안: `@supabase/supabase-js` 제네릭만 활용** — `Database` 제네릭 타입이 없으면 `from('scores')` 반환값이 `any`로 추론된다. 타입 생성 없이는 제네릭을 제대로 활용할 수 없음.
- **`supabase` 패키지 버전**: `devDependencies`에 추가. 런타임에는 불필요하므로 번들에 포함되지 않음.
- **`database.types.ts` 커밋 여부**: 생성 파일을 레포에 커밋한다. CI 없는 환경에서는 자동 재생성 불가능하므로, 스키마 변경 시 수동으로 재실행하고 커밋하는 워크플로우가 현실적임. `docs/db-schema.md`에 워크플로우 기술.

---

## 생성/수정 파일

- `src/types/database.types.ts` (신규) — `supabase gen types typescript` 실행 결과. DB 타입 단일 진실 공급원
- `src/types/index.ts` (수정) — 기존 GameStatus/ButtonColor 유지 + database.types 편의 타입 re-export 추가
- `src/lib/supabase.ts` (수정) — `createClient`에 `Database` 제네릭 주입
- `src/hooks/useRanking.ts` (수정) — INSERT payload를 생성된 타입 기반으로 교체
- `src/hooks/useDailyReward.ts` (수정) — INSERT payload를 생성된 타입 기반으로 교체
- `package.json` (수정) — `gen:types` 스크립트 추가
- `docs/db-schema.md` (수정) — daily_reward 테이블 DDL 추가 + 타입 자동화 워크플로우 섹션 추가

---

## 인터페이스 정의

### `src/types/database.types.ts` — 예상 구조

`supabase gen types typescript --project-id jptzbftptvymesxylcyf` 실행 시 생성되는 파일의 핵심 구조.
실제 파일은 CLI 실행 결과가 정본이며 아래는 현재 DB 스키마(`docs/db-schema.md`) 기준 예상 형태다.

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      scores: {
        Row: {
          id: string            // UUID
          user_id: string
          score: number
          stage: number
          played_at: string     // TIMESTAMPTZ → ISO 8601 string
        }
        Insert: {
          id?: string           // DEFAULT gen_random_uuid()
          user_id: string
          score: number
          stage: number
          played_at?: string    // DEFAULT NOW()
        }
        Update: {
          id?: string
          user_id?: string
          score?: number
          stage?: number
          played_at?: string
        }
        Relationships: []
      }
      daily_chances: {
        Row: {
          user_id: string       // PRIMARY KEY
          used_count: number    // DEFAULT 0
          last_date: string     // DATE → string
        }
        Insert: {
          user_id: string
          used_count?: number
          last_date?: string
        }
        Update: {
          user_id?: string
          used_count?: number
          last_date?: string
        }
        Relationships: []
      }
      daily_reward: {
        Row: {
          user_id: string       // 복합 PK (user_id, reward_date)
          reward_date: string   // DATE → string, 복합 PK
        }
        Insert: {
          user_id: string
          reward_date: string
        }
        Update: {
          user_id?: string
          reward_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ranking_daily: {
        Args: Record<PropertyKey, never>
        Returns: { user_id: string; best_score: number }[]
      }
      ranking_monthly: {
        Args: Record<PropertyKey, never>
        Returns: { user_id: string; best_score: number }[]
      }
      ranking_season: {
        Args: { season_start: string }
        Returns: { user_id: string; best_score: number }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// 편의 타입 — 자주 쓰는 테이블 Row/Insert 타입을 별칭으로 export
export type ScoreRow = Database['public']['Tables']['scores']['Row']
export type ScoreInsert = Database['public']['Tables']['scores']['Insert']
export type DailyChancesRow = Database['public']['Tables']['daily_chances']['Row']
export type DailyChancesInsert = Database['public']['Tables']['daily_chances']['Insert']
export type DailyRewardRow = Database['public']['Tables']['daily_reward']['Row']
export type DailyRewardInsert = Database['public']['Tables']['daily_reward']['Insert']
```

> **주의**: 위 구조는 현재 `docs/db-schema.md` 기준 예상값이다. 실제 CLI 실행 결과가 다를 수 있으므로 CLI 실행 후 확인 필수. 편의 타입 별칭(`ScoreRow` 등)은 CLI 생성 파일 하단에 수동으로 추가한다.

---

### `src/lib/supabase.ts` — Database 제네릭 주입

현재 `supabase.ts`를 읽어 확인 후, `createClient` 호출에 `Database` 제네릭을 추가한다.

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

이 변경으로 `supabase.from('scores').insert(...)` 호출 시 payload가 `ScoreInsert` 타입으로 자동 검사된다.

---

### `src/hooks/useRanking.ts` — INSERT payload 타입 교체

```typescript
import type { ScoreInsert } from '../types/database.types'

// submitScore 내부 — 기존
await supabase.from('scores').insert({
  user_id: uid,
  score,
  stage,
})

// 변경 후 — 명시적 타입 주석 추가 (supabase.ts에 제네릭 주입 시 타입 추론으로 자동 검사되지만,
// 의도를 명확히 하기 위해 로컬 변수로 분리)
const payload: ScoreInsert = {
  user_id: uid,
  score,
  stage,
}
await supabase.from('scores').insert(payload)
```

`useRanking.ts`의 RPC 응답 타입(`as { user_id: string; best_score: number }[]`) 캐스팅도 `Database['public']['Functions']['ranking_daily']['Returns']`로 교체할 수 있으나, 이 스토리 범위에서는 INSERT payload 타입 교체만 처리한다. RPC 반환 타입 교체는 선택적 개선 사항으로 남긴다.

---

### `src/hooks/useDailyReward.ts` — INSERT payload 타입 교체

```typescript
import type { DailyRewardInsert } from '../types/database.types'

// markTodayRewarded 내부 — 기존
await supabase
  .from('daily_reward')
  .insert({ user_id: userId, reward_date: todayKST() })

// 변경 후 — 명시적 타입 주석 추가
const rewardPayload: DailyRewardInsert = {
  user_id: userId,
  reward_date: todayKST(),
}
await supabase.from('daily_reward').insert(rewardPayload)
```

> `useDailyReward.ts`의 SELECT 쿼리는 `supabase.from('daily_reward').select('user_id').eq(...)` 형태로, `Database` 제네릭 주입만으로 자동 타입 검사된다. 별도 수정 불필요.

---

### `package.json` — gen:types 스크립트

```json
{
  "scripts": {
    "dev": "granite dev",
    "build": "ait build",
    "lint": "eslint .",
    "preview": "vite preview",
    "deploy": "ait deploy",
    "gen:types": "supabase gen types typescript --project-id jptzbftptvymesxylcyf --schema public > src/types/database.types.ts"
  }
}
```

> `--project-id`는 `.env`의 `VITE_SUPABASE_URL`에서 추출한 ID(`jptzbftptvymesxylcyf`)를 사용한다.
> `--schema public`으로 public 스키마만 생성해 파일 크기를 최소화한다.

---

## 핵심 로직

### 실행 워크플로우

```
1. npm install supabase --save-dev
2. npx supabase login  (최초 1회, 브라우저 인증)
3. npm run gen:types   → src/types/database.types.ts 생성
4. 파일 하단에 편의 타입 별칭 수동 추가 (ScoreRow, ScoreInsert 등)
5. src/lib/supabase.ts — createClient<Database> 제네릭 추가
6. src/hooks/useRanking.ts — ScoreInsert 타입으로 payload 교체
7. npm run build 로 컴파일 에러 없음 확인
8. src/types/database.types.ts 커밋
```

### DB 스키마 변경 시 재생성 절차

```
1. Supabase 콘솔에서 스키마 변경 (DDL 실행)
2. docs/db-schema.md 업데이트
3. npm run gen:types  → src/types/database.types.ts 재생성
4. 편의 타입 별칭이 사라졌는지 확인 후 재추가
5. 컴파일 에러 확인 후 수정
6. 커밋
```

---

## 주의사항

- **DB 영향도 분석**: 이 스토리는 코드/타입 변경만이며 DB 스키마 변경 없음. DDL 없음.
- **`supabase login` 필요**: `gen:types` 실행 전 `npx supabase login`으로 인증 필요. CI/CD가 없으므로 로컬에서만 실행. 팀 환경이라면 `SUPABASE_ACCESS_TOKEN` 환경변수 방식 사용 가능.
- **편의 타입 별칭 유실 주의**: `npm run gen:types`는 파일을 덮어쓴다(`>`). 별칭 추가 라인을 스크립트 내에서 append(`>>`)하거나, 별칭을 별도 파일(`src/types/index.ts`)에서 re-export하는 방법이 안전하다. 이 impl에서는 별도 파일 방식을 권장한다.

```typescript
// src/types/index.ts (수정) — 기존 타입 유지 + 편의 타입 re-export 추가
// 기존 내용 (삭제하지 않음)
export type GameStatus = 'IDLE' | 'SHOWING' | 'INPUT' | 'RESULT'
export type ButtonColor = 'orange' | 'blue' | 'green' | 'yellow'

// 추가: DB 편의 타입 re-export
export type { Database } from './database.types'
export type { ScoreRow, ScoreInsert, DailyChancesRow, DailyChancesInsert, DailyRewardRow, DailyRewardInsert } from './database.types'
```

단, `database.types.ts` CLI 생성 파일 하단에 편의 타입을 직접 추가하는 경우, 재생성 후 반드시 재추가해야 함을 README/RELEASE.md에 기록한다.

- **`supabase` CLI는 devDependency**: 런타임 번들에 포함되지 않도록 `--save-dev`로 설치.
- **Breaking Change 검토**: `supabase.ts`에 `Database` 제네릭 주입 후 `supabase.from(...)` 반환 타입이 강타입으로 바뀐다. 기존 코드에서 잘못된 컬럼명이나 타입 불일치가 있으면 컴파일 에러 발생 — 이는 의도된 동작(버그 조기 발견). 에러 발생 시 코드를 수정한다.
- **의존 모듈**: `src/lib/supabase.ts`를 import하는 모든 파일이 `Database` 제네릭 주입의 영향을 받는다. 확인된 파일 목록:

  | 파일 | 사용 테이블 | 영향 내용 |
  |---|---|---|
  | `src/hooks/useRanking.ts` | `scores` | INSERT payload 타입 교체 필요 |
  | `src/hooks/useDailyReward.ts` | `daily_reward` | INSERT payload 타입 교체 필요, SELECT 자동 검사 |

  > `useDailyChances.ts`는 존재하지 않음 (daily_chances 테이블 접근 코드는 현재 없음).

---

## 테스트 경계

- 단위 테스트 가능: 없음 (타입 레벨 변경이므로 컴파일 체크로 대체)
- 통합 테스트 필요: 없음
- 수동 검증:
  1. `npm run build` 성공 (컴파일 에러 없음)
  2. 개발 환경에서 게임 플레이 후 점수 INSERT가 정상 동작하는지 확인
  3. `supabase.from('scores').insert({ user_id: 'x', score: 100, stage: 5, invalid_col: 'y' })` 형태로 잘못된 컬럼 추가 시 TypeScript 컴파일 에러 발생 확인 (타입 안전성 검증)
