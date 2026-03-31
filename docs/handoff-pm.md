# PM 인계 문서

작성일: 2026-03-31
변경 버전: prd.md v0.2

---

## 완료된 작업

| 항목 | 상태 |
|---|---|
| 앱 아이콘 (logo-light.png, logo-dark.png) | 완료 |
| 썸네일 (thumbnail.png) | 완료 |
| 노출 정보 문구 (부제, 상세설명, 검색키워드) | 확정 |
| BM 변경 — 게임오버 강제 리워드광고 방식 | PRD 반영 완료 |

---

## 구현 변경 범위

### 1. Supabase 스키마 변경
- **삭제**: `daily_chances` 테이블 사용 중단 (기회 제한 로직 폐지)
- **추가**: `daily_reward` 테이블

```sql
CREATE TABLE daily_reward (
  user_id     TEXT NOT NULL,
  reward_date DATE NOT NULL,
  PRIMARY KEY (user_id, reward_date)
);
-- 오늘 날짜로 row가 있으면 이미 수령 완료 (별도 스케줄러 불필요)
```

### 2. Zustand store 변경 (gameStore.ts)
- **제거**: `dailyChancesLeft: number` 필드
- **제거**: `useChance()` 액션
- **추가**: `hasTodayReward: boolean` (오늘 10포인트 이미 받았는지)
- **추가**: `setTodayReward()` 액션

### 3. ResultPage 흐름 변경
- 기존: "한 번 더" 버튼 클릭 → 확인 모달 → 광고 → 게임 재시작
- 변경: 게임 오버 즉시 광고 자동 시작 → 완시청 시 포인트 메시지 → 다시하기 버튼 활성화
- "기회 소진" 메시지 및 버튼 비활성화 로직 삭제

### 4. MainPage 변경
- **삭제**: "오늘 N번 플레이 가능" 남은 기회 표시 UI
- 시작 버튼 항상 활성화 (기회 제한 없음)

### 5. 광고 트리거 변경
- `showRewardAd()` 호출 시점: 버튼 클릭 → 게임 오버 직후 자동
- `userEarnedReward` 이벤트 수신 시: `daily_reward` row 확인 후 포인트 지급 또는 스킵

### 6. 포인트 지급 API
```ts
import { grantPromotionRewardForGame } from '@apps-in-toss/web-framework'

// 하루 첫 완시청 시 호출
await grantPromotionRewardForGame({
  params: { promotionCode: 'DAILY_PLAY', amount: 10 }
})
```

---

## 영향받는 impl 계획 파일 (내용 업데이트 필요)

| 파일 | 재검토 이유 |
|---|---|
| docs/impl/03-zustand-store.md | dailyChancesLeft 제거, hasTodayReward 추가 |
| docs/impl/08-daily-chances.md | 로직 전면 교체 (기회제 → 데일리 리워드 수령 기록으로 변경, 파일명 유지) |
| docs/impl/09-ad-components.md | 광고 트리거 시점 변경 (자발적 → 자동 강제) |
| docs/impl/10-result-page.md | 결과 화면 흐름 변경 |
| docs/impl/11-main-page.md | 남은 기회 UI 제거 |

---

## 주의사항

1. **프로모션 코드 콘솔 등록**: 앱인토스 개발자 콘솔에서 토스포인트 지급용 프로모션 코드 등록 필요. 검수 2~3 영업일 소요. 포인트 지급 API 호출 방식 MCP 문서 검색 선행 권장.
2. **비즈 월렛 충전**: 포인트 지급 재원. 일 1회 × DAU × 10원 기준으로 충전량 산정. 최소 300,000원 충전 필요.
3. **리워드 광고 그룹 ID**: `VITE_REWARD_AD_ID` 환경변수에 실제 광고 그룹 ID 입력 필요.
4. **daily_reward 자정 리셋**: Supabase 쿼리가 `reward_date = CURRENT_DATE` 기준이므로 별도 스케줄러 불필요.

---

## 다음 단계 제안

1. 아키텍트가 todo.md + 영향받는 impl 계획 파일 5개 검토 및 업데이트
2. 앱인토스 개발자 콘솔에서 포인트 지급 API 방식 확인 (MCP 문서 검색 선행)
3. impl 에이전트가 변경된 계획 파일 기준으로 구현 시작
