# 11. 메인 화면

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
      setUserId(uid)                   // gameStore에 저장
      await dailyChances.init(uid)     // Supabase daily_chances 조회 + 리셋
      ranking.refetch()                // 내 랭킹 뱃지용 (비동기, await 불필요)
    } catch (e) {
      // Supabase 실패 시 기본값(dailyChancesLeft=1) 유지
      showToast('랭킹 연동 실패. 오프라인 모드로 진행됩니다')
    } finally {
      setIsInitializing(false)
    }
  })()
}, [])
```

### 로딩 상태 관리

- `isInitializing: boolean` — 초기화 완료 전 시작 버튼 비활성화 + "로딩 중..." 표시
- `ranking.isLoading: boolean` — 내 랭킹 뱃지 로딩 중일 때 "—위" 표시

### 에러 처리 정책

| 시나리오 | 처리 |
|---|---|
| `getUserId()` 실패 | `getDeviceId()` fallback → 완전 실패 시 랜덤 UUID로 임시 ID 사용 |
| `dailyChances.init()` 실패 | `dailyChancesLeft = 1` (기본값) 유지, 하단 토스트 표시 |
| `ranking.refetch()` 실패 | 내 랭킹 뱃지 "—위" 표시, 게임 진행 차단 안 함 |

> 에러 발생 시 게임 자체는 차단하지 않음. 랭킹 저장 실패 가능성만 토스트로 안내.

### 레이아웃
```
┌─────────────────────┐
│  기억력배틀         │
│                     │
│  일간 N위  월간 N위  시즌 N위  │
│                     │
│  오늘 N번 플레이 가능│
│                     │
│  [Easy][Medium][Hard]│
│                     │
│  [시작하기]         │  ← dailyChancesLeft === 0 이면 disabled
│  오늘 기회를 모두 사용했어요. 내일 다시 오세요  │
└─────────────────────┘
```
