# 04. HUD STG 카운트다운 중 숨김 (버그픽스 #66)

> 관련 이슈: [#66](https://github.com/alruminum/memory-battle/issues/66)

## 결정 근거

- **문제 원인**: GamePage.tsx의 HUD 스트립 STG 셀이 countdown 상태와 무관하게 항상 stage 값을 렌더링함.
  - 첫 게임: stage === 0 -> 00 표시
  - 리트라이: 직전 게임의 마지막 stage 값이 카운트다운 내내 노출됨
- **수정 방향**: STG 셀에 countdown !== null ? '--' : String(stage).padStart(2, '0') 조건 추가.
  - countdown이 null이 아닌 동안(3->2->1) -- 표시
  - null이 된 순간(카운트다운 완료 직후) 실제 stage 값 표시
- **검토한 대안**:
  - stage === 0 조건 사용: 리트라이 시 이전 stage 값 잔존 문제 해결 불가. 부적합.
  - StageArea 컴포넌트 내에서 처리: HUD 스트립은 별개 DOM 구조이므로 부적합.
  - countdown !== null 조건으로 HUD STG 셀 수정: countdown은 이미 useGameEngine() destructuring에 포함됨. **채택**.

---

## 생성/수정 파일

- src/pages/GamePage.tsx (수정) -- HUD 스트립 STG 셀 조건부 렌더링 추가 (1줄)

---

## 인터페이스 정의

변경 없음. GamePageProps 시그니처 유지.

```typescript
// 변경 없음
interface GamePageProps {
  onGameOver: () => void
  onRanking: () => void
}
```

---

## 핵심 로직

```tsx
// src/pages/GamePage.tsx -- HUD 스트립 STG 셀 (line ~246)

// Before
<span style={{ fontFamily: 'var(--vb-font-score)', fontSize: 22, fontWeight: 900, color: 'var(--vb-text)', lineHeight: 1 }}>
  {String(stage).padStart(2, '0')}
</span>

// After
<span style={{ fontFamily: 'var(--vb-font-score)', fontSize: 22, fontWeight: 900, color: 'var(--vb-text)', lineHeight: 1 }}>
  {countdown !== null ? '--' : String(stage).padStart(2, '0')}
</span>
```

변경 범위: 단일 표현식 교체. JSX 구조/스타일 변경 없음. countdown 변수는 이미 useGameEngine() destructuring에 포함됨.

---

## 주의사항

- **Breaking Change 없음**: GamePageProps 인터페이스 변경 없음. 호출부(App.tsx 등) 수정 불필요.
- **countdown 가용성**: GamePage 내 const { ..., countdown, ... } = useGameEngine() 이미 선언됨. 추가 선언/import 불필요.
- **DB 영향도**: 없음. 순수 렌더링 조건 변경.
- **-- 표시 텍스트**: 단순 문자열 --. 기존 HUD에도 접근성 속성 없으므로 aria-label 추가는 범위 밖.
- **countdown null 전환 시점**: 2250ms(750ms*3) 후 null -> 즉시 stage: 1 설정. 표시 순서 보장됨.

---

## 수용 기준

| 요구사항 ID | 내용 | 검증 방법 | 통과 조건 |
|---|---|---|---|
| REQ-001 | 첫 게임 카운트다운(3->2->1) 중 STG 셀에 -- 표시 | (MANUAL) | 게임 시작 탭 -> 카운트다운 3, 2, 1 동안 STG 셀이 00 대신 -- 표시됨 |
| REQ-002 | 리트라이 카운트다운 중 이전 stage 값 미표시 | (MANUAL) | 3스테이지 진행 후 게임오버 -> 리트라이 탭 -> 카운트다운 중 STG 셀에 03 대신 -- 표시됨 |
| REQ-003 | 카운트다운 종료(countdown === null) 후 실제 stage 표시 | (MANUAL) | 카운트다운 완료 후 SHOWING 진입 시 STG 셀에 01 표시됨 (이전 게임 stage 값 잔존 없음) |
| REQ-004 | countdown !== null 조건으로 단일 표현식만 변경 | (MANUAL) | GamePage.tsx diff에서 STG 셀 span 내 표현식 1줄만 변경. 다른 JSX/스타일 변경 없음. 자동화 불가 사유: 렌더러 mock 셋업 비용 대비 단순 조건 확인이므로 수동 diff 검토가 효율적 |
