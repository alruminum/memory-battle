# 11. 메인 화면

> v0.2 변경: useDailyChances → useDailyReward 교체, 남은 기회 도트 UI 제거, 시작 버튼 항상 활성화

## 생성 파일
- `src/components/game/DifficultySelector.tsx`
- `src/pages/MainPage.tsx`

---

## DifficultySelector.tsx

```typescript
interface DifficultySelectorProps {
  value: Difficulty
  onChange: (d: Difficulty) => void
}
```
- Easy(x1) / Medium(x2) / Hard(x3) 3개 버튼
- 선택된 항목 하이라이트

---

## MainPage.tsx

### 진입 시 초기화 순서

```typescript
// MainPage.tsx 내 useEffect
useEffect(() => {
  (async () => {
    setIsInitializing(true)
    try {
      const uid = await getUserId()
      setUserId(uid)        // gameStore에 저장
      ranking.refetch()     // 내 랭킹 뱃지용 (비동기, await 불필요)
    } catch (e) {
      showToast('랭킹 연동 실패. 오프라인 모드로 진행됩니다')
    } finally {
      setIsInitializing(false)
    }
  })()
}, [])
// hasTodayReward 조회는 useDailyReward 훅 내부에서 userId 변경 감지 후 자동 실행
```

### import 변경

```typescript
// 제거
import { useDailyChances } from '../hooks/useDailyChances'

// 추가
import { useDailyReward } from '../hooks/useDailyReward'
```

### 제거 항목 (v0.2)

- `dailyChances.init(uid)` 초기화 호출 제거
- `dailyChances.consumeChance()` 호출 제거 (`handleStart`에서 기회 차감 로직 제거)
- `const { userId, dailyChancesLeft, setUserId, difficulty } = useGameStore()` — `dailyChancesLeft` 구조분해 제거
- Today's Plays 도트 UI 섹션 전체 제거 (totalDots, activeDots 변수 포함)
- `noChances` 변수 및 관련 조건부 렌더링 (기회 소진 안내 문구) 제거
- 시작 버튼 `disabled` 조건에서 `noChances` 제거 → `isInitializing` 중에만 비활성화

### 로딩 상태 관리

- `isInitializing: boolean` — 초기화 완료 전 시작 버튼 비활성화 + "..." 표시
- `ranking.isLoading: boolean` — 내 랭킹 뱃지 로딩 중일 때 "—위" 표시

### 에러 처리 정책

| 시나리오 | 처리 |
|---|---|
| `getUserId()` 실패 | `getDeviceId()` fallback → 완전 실패 시 랜덤 UUID로 임시 ID 사용 |
| `ranking.refetch()` 실패 | 내 랭킹 뱃지 "—위" 표시, 게임 진행 차단 안 함 |

> 에러 발생 시 게임 자체는 차단하지 않음. 기회 제한 없으므로 Supabase 실패해도 게임 진행 가능.

### 레이아웃

```
┌─────────────────────┐
│  기억력배틀         │
│                     │
│  일간 N위  월간 N위  시즌 N위  │
│                     │
│  [Easy][Medium][Hard]│
│                     │
│  [시작하기]         │  ← isInitializing 중에만 disabled (기회 조건 없음)
└─────────────────────┘
```
