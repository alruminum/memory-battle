# Epic 04: 화면 완성

> 상태: 완료

## Story 11: 메인 화면

- [x] `src/components/game/DifficultySelector.tsx` — Easy/Medium/Hard, 배율 안내
- [x] `src/pages/MainPage.tsx` — useDailyReward 연동, 시작 버튼 항상 활성화

## Story 12: 랭킹 화면

- [x] `src/components/ranking/RankingTab.tsx` — 일간/월간/시즌 탭 전환
- [x] `src/components/ranking/RankingRow.tsx` — 순위 + 점수, 내 항목 하이라이트
- [x] `src/pages/RankingPage.tsx` — TOP 50 + 하단 고정 내 순위

## Story 13: 라우팅 연결

- [x] 페이지 라우팅 설정 (Main → Game → Result → Main/Ranking)
- [x] 뒤로가기 처리 (앱인토스 네이티브 백버튼 대응)
