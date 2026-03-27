# 05. 게임 화면 컴포넌트

## 생성 파일
- `src/components/game/ButtonPad.tsx`
- `src/components/game/TimerGauge.tsx`
- `src/components/game/ScoreDisplay.tsx`
- `src/pages/GamePage.tsx`

---

## ButtonPad.tsx

```typescript
interface ButtonPadProps {
  flashingButton: ButtonColor | null  // SHOWING 중 점등 버튼
  disabled: boolean                   // SHOWING 중 터치 차단
  onPress: (color: ButtonColor) => void
}
```

- 4개 원형 버튼 200×200px: orange / blue / green / yellow
- `flashingButton === color` 이면 밝기 증가 (brightness 애니메이션)
- `disabled=true` 이면 `pointer-events: none`

---

## TimerGauge.tsx

```typescript
interface TimerGaugeProps {
  timeLeft: number   // 0~2000ms
  duration: number   // 2000
}
```

- 너비: `(timeLeft / duration) * 100%`
- 50% 이하: 빨간색 전환 (`timeLeft / duration < 0.5`)
- INPUT 상태가 아닐 때는 숨김 또는 full 상태

---

## ScoreDisplay.tsx

```typescript
interface ScoreDisplayProps {
  score: number
  stage: number
}
```

- 현재 점수 + 스테이지 표시
- `stage >= 10`: `COMBO!` 텍스트 표시

---

## GamePage.tsx

레이아웃:
```
┌─────────────────┐
│  ScoreDisplay   │
│                 │
│   ButtonPad     │
│                 │
│  TimerGauge     │
├─────────────────┤
│   BannerAd      │  ← height: 96px, 하단 고정
└─────────────────┘
```

- `useGameEngine()` 훅 연결
- `useTimer()` 로 TimerGauge에 timeLeft 전달
- BannerAd 자리 확보 (컴포넌트는 09에서 구현, placeholder div로 먼저 처리)
