---
depth: simple
---

# Dead Code 일괄 제거

## 배경

v03 버그 전부 해소 후 기술 부채 정리. 수정 시 이전 코드가 삭제되지 않아 누적된 미사용 코드를 일괄 제거한다. 시각적 변경 없음 — 순수 삭제 작업.

## 삭제 대상

### 파일 삭제 (6건)

| 파일 | 이유 |
|---|---|
| `src/variants/VariantA.tsx` | 시안용 파일, 어디서도 import 안 됨 |
| `src/variants/VariantB.tsx` | 동일 |
| `src/variants/VariantC.tsx` | 동일 |
| `src/components/game/ScoreDisplay.tsx` | v01 HUD로 대체됨, import 없음 |
| `src/components/game/TimerGauge.tsx` | ComboTimer로 대체됨, import 없음 |
| `src/hooks/useCombo.ts` | 파일 내 "v0.3.1: 역할 없음" 주석. 빈 객체만 반환. import 없음 |

`src/variants/` 폴더 전체 삭제 가능.

### prop 제거 (1건)

| 파일 | 변경 |
|---|---|
| `src/components/ranking/RankingRow.tsx` | `userId` prop — interface에서 제거. 함수 본문에서 미사용 |

현재:
```tsx
interface RankingRowProps {
  rank: number
  userId: string   // <- 삭제
  score: number
  isMe: boolean
}
```

수정 후:
```tsx
interface RankingRowProps {
  rank: number
  score: number
  isMe: boolean
}
```

호출부에서 `userId` prop 전달하는 곳도 함께 제거 필요.

## 결정 근거

- D1: 6개 파일 모두 grep으로 import 참조 0건 확인
- D2: useCombo.ts는 파일 내부에 "역할 없음" 명시, 하위 호환 대상 없음
- D3: RankingRow의 userId는 destructuring에서 이미 빠져있어 런타임 영향 없음

## 검증

- `tsc --noEmit` PASS
- grep으로 삭제 대상 이름이 다른 곳에서 참조되지 않는지 확인
