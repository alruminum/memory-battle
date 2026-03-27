# 10. 결과 화면

## 생성 파일
- `src/pages/ResultPage.tsx`

---

## 레이아웃

```
┌─────────────────────┐
│  이번 점수: N       │
│  🏆 최고기록 갱신!  │  ← 갱신 시만 표시
│                     │
│  일간  N위          │
│  월간  N위 → M월 1일에 XXX원 지급 예정
│  시즌  N위          │
│                     │
│  [한 번 더 하기]    │  ← 기회 소진 시 disabled
│  기회 소진 안내문구 │
└─────────────────────┘
```

## 한 번 더 버튼 플로우
1. 버튼 탭
2. 확인 모달: `"광고를 보면 1회 추가됩니다"`
3. `useRewardAd().show()`
4. `true` → `useChance()` → 게임 재시작 (onPlayAgain 콜백)
5. `false` → 모달 닫기만

## props
```typescript
interface ResultPageProps {
  onPlayAgain: () => void
  onGoRanking: () => void
}
```

## 데이터
- `useRanking()` 훅으로 순위 조회
- `useGameStore()` 로 score, dailyChancesLeft
