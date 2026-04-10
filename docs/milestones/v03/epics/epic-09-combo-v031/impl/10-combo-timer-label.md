# 10. 콤보타이머 레이블 텍스트 추가

> 관련 이슈: [#92](https://github.com/alruminum/memory-battle/issues/92)

---

## 결정 근거

- **레이블 위치 — 바 위**: `ComboTimer`는 `flexDirection: 'column'` 컨테이너이므로 트랙 div 앞에 `<span>` 하나를 삽입하면 자연스럽게 게이지 바 위에 표시된다. 바 아래 배치는 게이지와 하단 요소(배너 광고) 사이 여백이 줄어들어 배제.
- **스타일 — dim 색상 소폰트**: 게이지 바 자체가 시각적 정보 전달의 주체이므로, 레이블은 보조 역할이어야 한다. `var(--vb-text-dim)` + `fontSize: 9` + `letterSpacing: 2` 조합은 기존 ComboIndicator·HUD 레이블 패턴과 동일하게 적용해 일관성을 유지한다.
- **collapse 처리 — 별도 불필요**: `collapsePhase === 'done'` 시 컴포넌트 전체가 `null` 반환하므로 레이블도 함께 사라진다. collapse 애니메이션 중(`collapsePhase === 'breaking'`)에도 트랙과 함께 레이블이 collapse 처리되는 것이 자연스러워 별도 조건 추가 불필요.
- **버린 대안 — 바 오른쪽 인라인 배치**: `flexDirection: 'row'`로 변경해 레이블과 바를 나란히 배치하는 방안. 바의 width(200px)가 고정이므로 전체 컴포넌트 너비가 늘어나 레이아웃에 영향. 배제.

---

## 생성/수정 파일

- `src/components/game/ComboTimer.tsx` (수정) — 게이지 바 위에 '콤보타이머' 레이블 span 추가

---

## 인터페이스 정의

변경 없음. `ComboTimerProps` 인터페이스는 그대로 유지.

```typescript
interface ComboTimerProps {
  computerShowTime: number   // 변경 없음
  inputStartTime: number     // 변경 없음
  isActive: boolean          // 변경 없음
  isBreaking?: boolean       // 변경 없음
}
```

---

## 핵심 로직

`ComboTimer.tsx` return 블록에서 트랙 div 직전에 레이블 span 삽입:

```tsx
return (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 4px' }}>
    {/* 접근성·테스트용 elapsed 텍스트 (시각적 숨김) — 변경 없음 */}
    <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
      {(elapsedMs / 1000).toFixed(2)}
    </span>

    {/* 레이블 텍스트 — 신규 추가 */}
    <span style={{
      fontSize: 9,
      fontWeight: 600,
      color: 'var(--vb-text-dim)',
      letterSpacing: 2,
      marginBottom: 4,
    }}>
      콤보타이머
    </span>

    {/* 트랙 — 변경 없음 */}
    <div
      data-testid="combo-timer-track"
      className={`combo-timer-track${collapsePhase === 'breaking' ? ' collapse' : ''}`}
      style={{ ... }}
    >
      ...
    </div>
  </div>
)
```

**변경 diff 요약**:
- 추가: `<span>콤보타이머</span>` (트랙 div 직전, `marginBottom: 4`)
- 나머지 로직·스타일·JSX 구조 변경 없음

---

## 주의사항

- **레이아웃 shift**: 레이블 span(높이 약 11px) + `marginBottom: 4` = 총 약 15px 증가. `GamePage.tsx`의 ComboTimer 래핑 div에 `minHeight: 40`이 설정되어 있으므로 레이아웃 shift 발생 여부를 수동 확인 필요. 필요 시 래핑 div의 `minHeight`를 55로 조정 (engineer 재량).
- **collapsePhase 조건**: 레이블에는 별도 collapse 클래스 불필요. 컴포넌트 전체 null 반환으로 함께 처리됨.
- **DB 영향도**: 없음.
- **Breaking Change**: 없음. Props 인터페이스·사용처(`GamePage.tsx`) 변경 없음.

---

## 테스트 경계

- 단위 테스트 가능: 없음 (UI 텍스트 렌더링)
- 통합 테스트 필요: 없음
- 수동 검증:
  - INPUT 상태 진입 시 게이지 바 위에 '콤보타이머' 텍스트가 표시되는지 확인
  - INPUT 외 상태(SHOWING, IDLE, RESULT)에서 ComboTimer 전체 미표시 확인 (레이블 포함)
  - 콤보 깨짐(isBreaking=true) 후 collapse 완료 시 레이블도 함께 사라지는지 확인
  - 레이아웃 shift 없이 ComboTimer 영역 높이 변화가 자연스러운지 확인
