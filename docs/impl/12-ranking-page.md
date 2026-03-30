# 12. 랭킹 화면

## 생성 파일
- `src/components/ranking/RankingTab.tsx`
- `src/components/ranking/RankingRow.tsx`
- `src/pages/RankingPage.tsx`

---

## RankingTab.tsx

```typescript
interface RankingTabProps {
  active: 'daily' | 'monthly' | 'season'
  onChange: (tab: 'daily' | 'monthly' | 'season') => void
}
```

## RankingRow.tsx

```typescript
interface RankingRowProps {
  rank: number
  userId: string
  score: number
  isMe: boolean   // 내 항목 하이라이트
}
```

---

## RankingRow.tsx — 유저 식별자 표시 방식

내 항목: "나" 표시 (`isMe === true`)
타인 항목: "익명 N" (N = rank 번호 기반, 고정값)

```typescript
const displayName = isMe ? '나' : `익명 ${rank}`
```

hash 값 직접 노출 금지.

## RankingPage.tsx

- 탭 전환 시 `refetch()` 호출 → `isLoading` 재활성화
- TOP 50 리스트
- **하단 고정**: 내 순위 (50위 밖이어도 항상 표시)

```typescript
interface RankingPageProps {
  onBack: () => void
}
```

### 로딩 상태 UI

`isLoading === true`일 때 리스트 영역에 스켈레톤 10행 표시:

```typescript
// 각 스켈레톤 행
<div style={{ height: 44, borderRadius: 4, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
```

### 에러/빈 상태 UI

| 상태 | UI |
|---|---|
| `error` 발생 | "랭킹을 불러올 수 없습니다" + [재시도] 버튼 (`refetch()` 호출) |
| 빈 배열 반환 | "아직 기록이 없습니다" 텍스트 중앙 표시 |

### 하단 고정 내 순위 행

```typescript
// myRanks.daily === 0 → 50위 밖
const myRankLabel = myRanks[activeTab] > 0 ? `${myRanks[activeTab]}위` : '순위권 밖'
```

- 스크롤 영역 외부 `position: sticky; bottom: 0` 배치
- 상단 구분선 border 추가
- `myRanks[activeTab] === 0`이고 userId 없으면 (비로그인) 하단 행 미표시
