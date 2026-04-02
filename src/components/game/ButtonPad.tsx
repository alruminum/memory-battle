import type { ButtonColor, GameStatus } from '../../types'
import { dbg } from '../../lib/debug'

interface ButtonPadProps {
  flashingButton: ButtonColor | null
  clearingStage: number | null
  countdown: number | null
  disabled: boolean
  status: GameStatus
  score: number
  onPress: (color: ButtonColor) => void
  onStart: () => void
  onRetry: () => void
  comboActive?: boolean
}

const COLORS: Record<ButtonColor, { base: string; light: string; dark: string }> = {
  orange: { base: 'var(--vb-orange-base)', light: 'var(--vb-orange-light)', dark: 'var(--vb-orange-dark)' },
  blue:   { base: 'var(--vb-blue-base)',   light: 'var(--vb-blue-light)',   dark: 'var(--vb-blue-dark)'   },
  green:  { base: 'var(--vb-green-base)',  light: 'var(--vb-green-light)',  dark: 'var(--vb-green-dark)'  },
  yellow: { base: 'var(--vb-yellow-base)', light: 'var(--vb-yellow-light)', dark: 'var(--vb-yellow-dark)' },
}

const CORNER_BUTTONS: { color: ButtonColor; top?: number | string; bottom?: number | string; left?: number | string; right?: number | string }[] = [
  { color: 'orange', top: 0,    left: 0 },
  { color: 'blue',   top: 0,    right: 0 },
  { color: 'green',  bottom: 0, left: 0 },
  { color: 'yellow', bottom: 0, right: 0 },
]

const PAD = 292   // 전체 패드 크기(px)
const BTN = 110   // 색깔 버튼 크기(px)
const CENTER = 88 // 중앙 버튼 크기(px)

export function ButtonPad({
  flashingButton,
  clearingStage,
  countdown,
  disabled,
  status,
  score,
  onPress,
  onStart,
  onRetry,
  comboActive = false,
}: ButtonPadProps) {
  const isClearing = clearingStage !== null
  const isCounting = countdown !== null

  const centerLabel = () => {
    if (isCounting) {
      return <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--vb-accent)', letterSpacing: 1 }}>READY</span>
    }
    if (isClearing) {
      return (
        <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
          <div style={{ fontSize: 9, color: 'var(--vb-accent)', fontWeight: 800, letterSpacing: 1 }}>STAGE</div>
          <div style={{ fontSize: 20, color: 'var(--vb-text)', fontWeight: 900 }}>{clearingStage}</div>
          <div style={{ fontSize: 9, color: 'var(--vb-accent)', fontWeight: 700 }}>CLEAR ✓</div>
        </div>
      )
    }
    if (status === 'IDLE') {
      return <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--vb-label-inactive)', letterSpacing: 2 }}>START</span>
    }
    if (status === 'RESULT') {
      return <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--vb-label-inactive)', letterSpacing: 1 }}>RETRY</span>
    }
    return (
      <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
        <div style={{ fontSize: 8, color: 'var(--vb-label-score-dim)', letterSpacing: 1, fontWeight: 700 }}>SCORE</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--vb-text)' }}>{score}</div>
      </div>
    )
  }

  const onCenterPress = () => {
    if (isClearing) return
    if (status === 'IDLE') onStart()
    else if (status === 'RESULT') onRetry()
  }

  const isCenterClickable = !isClearing && !isCounting && (status === 'IDLE' || status === 'RESULT')

  return (
    <div style={{ position: 'relative', width: PAD, height: PAD }}>

      {/* 게임기 바디 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 36,
        background: 'linear-gradient(145deg, var(--vb-body-bg-start) 0%, var(--vb-body-bg-mid) 50%, var(--vb-body-bg-end) 100%)',
        boxShadow: [
          'inset 0 2px 1px rgba(255,255,255,0.07)',
          'inset 0 -2px 2px rgba(0,0,0,0.5)',
          '0 24px 48px rgba(0,0,0,0.7)',
          '0 8px 16px rgba(0,0,0,0.4)',
        ].join(', '),
        border: '1px solid rgba(255,255,255,0.05)',
      }} />

      {/* 코너 스크류 장식 */}
      {([
        { top: 12, left: 12 }, { top: 12, right: 12 },
        { bottom: 12, left: 12 }, { bottom: 12, right: 12 },
      ] as React.CSSProperties[]).map((pos, i) => (
        <div key={i} style={{
          position: 'absolute',
          ...pos,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, var(--vb-screw-bg-start), var(--vb-screw-bg-end))',
          border: '1px solid rgba(255,255,255,0.08)',
          zIndex: 1,
        }} />
      ))}

      {/* 4개 컬러 버튼 */}
      {CORNER_BUTTONS.map(({ color, ...pos }) => {
        const c = COLORS[color]
        const isFlashing = flashingButton === color
        return (
          <button
            key={color}
            onPointerDown={() => {
              dbg('[ButtonPad] pointerDown color=', color, 'disabled=', disabled, 'isClearing=', isClearing)
              if (!disabled && !isClearing) onPress(color)
            }}
            style={{
              position: 'absolute',
              ...pos,
              width: BTN,
              height: BTN,
              borderRadius: '50%',
              border: 'none',
              cursor: (disabled || isClearing) ? 'default' : 'pointer',
              // 3D 그라디언트
              background: isFlashing
                ? `radial-gradient(circle at 35% 30%, ${c.light}, ${c.base} 55%, ${c.dark})`
                : `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${c.light} 60%, transparent), color-mix(in srgb, ${c.base} 53%, transparent) 55%, color-mix(in srgb, ${c.dark} 47%, transparent))`,
              // 측면 그림자로 입체감 + 점등 글로우 + 콤보 글로우
              boxShadow: isFlashing
                ? [
                    `0 3px 0 ${c.dark}`,
                    `0 6px 20px rgba(0,0,0,0.5)`,
                    `0 0 30px color-mix(in srgb, ${c.base} 80%, transparent)`,
                    `0 0 60px color-mix(in srgb, ${c.base} 40%, transparent)`,
                  ].join(', ')
                : comboActive
                  ? [
                      `0 0 16px 4px color-mix(in srgb, ${c.base} 53%, transparent)`,
                      `0 6px 0 color-mix(in srgb, ${c.dark} 53%, transparent)`,
                      `0 8px 16px rgba(0,0,0,0.4)`,
                    ].join(', ')
                  : [
                      `0 6px 0 color-mix(in srgb, ${c.dark} 60%, transparent)`,
                      `0 8px 16px rgba(0,0,0,0.6)`,
                    ].join(', '),
              transform: isFlashing ? 'scale(1.06) translateY(3px)' : 'scale(1)',
              filter: isFlashing ? 'brightness(1.4)' : 'brightness(0.75)',
              transition: 'transform 70ms ease, filter 70ms ease, box-shadow 70ms ease',
              pointerEvents: isClearing ? 'none' : 'auto',
              zIndex: 2,
            }}
          />
        )
      })}

      {/* 중앙 버튼 */}
      <button
        onPointerDown={onCenterPress}
        disabled={!isCenterClickable}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: CENTER,
          height: CENTER,
          borderRadius: '50%',
          border: `2px solid ${isClearing ? 'var(--vb-accent)' : 'rgba(255,255,255,0.10)'}`,
          cursor: isCenterClickable ? 'pointer' : 'default',
          background: isClearing
            ? 'radial-gradient(circle at 40% 35%, var(--vb-center-clear-bg-start), var(--vb-center-clear-bg-end))'
            : 'radial-gradient(circle at 40% 35%, var(--vb-center-bg-start), var(--vb-center-bg-end))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isClearing
            ? '0 0 16px color-mix(in srgb, var(--vb-accent) 40%, transparent), inset 0 2px 1px rgba(255,255,255,0.08)'
            : 'inset 0 2px 1px rgba(255,255,255,0.07), inset 0 -1px 2px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.5)',
          transition: 'border-color 200ms, box-shadow 200ms',
          zIndex: 3,
        }}
      >
        {centerLabel()}
      </button>
    </div>
  )
}
