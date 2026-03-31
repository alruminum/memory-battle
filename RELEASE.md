# 기억력배틀 — Release Checklist

> 사람이 직접 해야 하는 운영/출시 항목. AI 에이전트 구현 대상 아님.

---

## 앱인토스 콘솔 설정

- [ ] [앱인토스 콘솔](https://apps-in-toss.toss.im/) 가입
- [ ] 워크스페이스 생성
- [ ] **사업자 등록** — 홈택스 등록 후 콘솔에 사업자 정보 제출 (심사 1~2 영업일)
- [ ] **앱 등록** — `appName: memory-battle` 확정 후 콘솔 등록 (**등록 후 변경 불가**)
- [ ] **게임센터 리더보드 등록**
  - 앱 로고: 600×600px PNG (투명 배경 불가)
  - 앱 이름: 기억력배틀
  - 고객센터 연락처
- [ ] **게임 등급 분류** — 앱스토어/구글플레이 기존 등급으로 대체 가능
- [ ] 정산 정보 등록 (광고 수익 정산용, 심사 2~3 영업일)
- [ ] **광고 그룹 ID 발급** (라이브용)

| 광고 타입 | 개발용 테스트 ID |
|---|---|
| 리워드 광고 | `ait-ad-test-rewarded-id` |
| 전면 광고 | `ait-ad-test-interstitial-id` |
| 배너 (리스트형) | `ait-ad-test-banner-id` |
| 배너 (네이티브) | `ait-ad-test-native-image-id` |

---

## Supabase 설정

> Epic 02 Story 6의 콘솔 작업 항목.

- [ ] Supabase 콘솔에서 `scores` 테이블 생성
- [ ] `daily_reward` 테이블 생성
- [ ] 인덱스, RLS 정책 설정
- [ ] **CORS 허용 도메인 추가**
  - 프로덕션: `https://memory-battle.apps.tossmini.com`
  - QR 테스트: `https://memory-battle.private-apps.tossmini.com`

---

## 샌드박스 QA

> 샌드박스 접속: 샌드박스 앱 → 토스 비즈니스 계정 로그인 → `intoss://memory-battle`

- [ ] 게임 플레이 전체 플로우 (시퀀스 → 입력 → 점수 → Supabase 저장)
- [ ] 게임 로그인 (`getUserKeyForGame()`) 동작 확인
- [ ] 랭킹 3종 데이터 정상 출력
- [ ] 타이머 2초 만료 → 게임 오버
- [ ] 콤보 0.3초 판정
- [ ] Supabase https 통신 정상 동작

### 샌드박스 미지원 — 별도 검증

- [ ] **배너 광고**: placeholder로 레이아웃만 확인
- [ ] **리워드 광고**: mock 모드로 기회 지급 플로우 검증

---

## 검수 제출

- [ ] 라이브 광고 그룹 ID → `ait.ts` 테스트 ID와 교체
- [ ] `index.html` viewport `user-scalable=no` 확인
- [ ] 스크린샷 업로드 (세로 636×1048px 최소 3장, 가로 1504×741px 최소 1장)
- [ ] `appName`이 콘솔 등록명과 일치하는지 최종 확인
- [ ] `npm run build` 에러 없이 완료, 번들 크기 100MB 이하 확인
- [ ] 앱인토스 검수 체크리스트 점검
- [ ] 콘솔에서 빌드 업로드 + 검수 요청 (최대 3 영업일)
