# 04. 게임오버 오버레이 탭-쓰루 버그 수정

> 관련 이슈: [#50](https://github.com/alruminum/memory-battle/issues/50)

## 결정 근거

- **버그 메커니즘**: 색깔 버튼은 `onPointerDown`으로 입력을 감지하므로, 잘못 눌렀을 때 이벤트 순서가 다음과 같다.
  1. `onPointerDown` → `gameOver('wrong')` → `GameOverOverlay` 렌더
  2. 손가락이 아직 화면에 닿아 있는 상태
  3. 손가락을 들 때 `click` 이벤트 발사 → 오버레이 backdrop의 `onClick` 즉시 트리거 → `onConfirm()` 호출 → ResultPage 이동
- **타임아웃 케이스는 영향 없음**: 타임아웃은 유저가 화면을 누르고 있지 않을 때 발생하므로 `pointerdown` → `click` 연쇄가 없다.
- **수정 방향 — `onPointerDown`으로 통일**: backdrop의 `onClick`을 `onPointerDown`으로 변경한다. 색깔 버튼 입력과 동일한 이벤트 단계에서 처리하므로, 새로 발생하는 `pointerdown` 이벤트(유저가 오버레이를 의도적으로 누를 때)만 트리거된다. 오답 직후 손가락을 떼면서 올라오는 `click` 이벤트는 더 이상 `onConfirm`을 호출하지 않는다.
- **검토한 대안**:
  - `stopPropagation`/`preventDefault` 조합: 버튼 레벨에서 이벤트 전파 차단. 이미 오버레이가 렌더된 이후의 이벤트이므로 차단 시점이 너무 앞에 있어 실효 없음.
  - 오버레이 렌더 직후 일정 시간 `pointer-events: none` 설정 후 해제: 타이머 관리가 필요해 복잡도 증가, `timeout` 케이스(유저가 빠르게 재시작 원할 때)에서 UX 저하 가능성.
  - `onPointerUp` 사용: `pointerdown` + `pointerup` 쌍이 맞아야 발사되므로 탭-쓰루는 막히지만, 드래그 후 손가락을 오버레이 위에서 뗐을 때 의도치 않게 트리거될 수 있음. `onPointerDown`이 더 단순하고 버튼과 대칭적.
  - `onPointerDown`으로 통일: 색깔 버튼과 동일한 이벤트 단계 사용, 단일 파일 한 줄 수정, 추가 상태 관리 불필요. **채택**.

---

## 생성/수정 파일

- `src/components/game/GameOverOverlay.tsx` (수정) — backdrop div의 `onClick` → `onPointerDown`

---

## 인터페이스 정의

변경 없음. `GameOverOverlayProps` 시그니처 유지.

```typescript
// 변경 없음
interface GameOverOverlayProps {
  reason: Exclude<GameOverReason, null>
  onConfirm: () => void
}
```

---

## 핵심 로직

### `src/components/game/GameOverOverlay.tsx` — backdrop div 수정

```typescript
// Before
<div
  onClick={onConfirm}
  className="gameover-backdrop"
  style={{ ... }}
>

// After
<div
  onPointerDown={onConfirm}
  className="gameover-backdrop"
  style={{ ... }}
>
```

변경 범위: 단일 속성 교체. 나머지 코드(스타일, 내부 패널 구조) 변경 없음.

---

## 주의사항

- **Breaking Change 없음**: `GameOverOverlayProps` 인터페이스 변경 없음. `GamePage.tsx` 등 호출부 변경 불필요.
- **타임아웃 케이스 회귀 없음**: `onPointerDown`은 유저가 오버레이를 직접 누를 때 정상 트리거되므로 타임아웃 이후 탭 → 결과 페이지 전환 플로우는 그대로 동작한다.
- **DB 영향도**: 없음.
- **다른 이벤트 핸들러와 충돌 없음**: 오버레이 내부 패널(`.gameover-panel`)에는 별도 이벤트 핸들러가 없으므로 이벤트 버블링 경로에 변화 없음.

---

## 테스트 경계

- 단위 테스트 가능: 없음 (순수 함수 변경 없음)
- 통합 테스트 필요: 없음 (이벤트 핸들러 속성 교체만 포함)
- 수동 검증:
  - 오답 입력(버튼을 짧게 탭) → 오버레이 등장 후 즉시 ResultPage로 이동하지 않고 오버레이가 유지되는지 확인
  - 오버레이 표시 후 의도적으로 탭 → ResultPage로 정상 전환되는지 확인
  - 타임아웃 발생 → 오버레이 등장 후 탭 → ResultPage로 정상 전환되는지 확인 (기존 기능 회귀 없음)
