import type { ButtonColor, GameStatus } from '../../types'

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
}

const COLORS = {
  orange: { base: '#FF6200', light: '#FF8C35', dark: '#A83F00' },
  blue:   { base: '#0A7AFF', light: '#3D9AFF', dark: '#0055BB' },
  green:  { base: '#18B84A', light: '#38D46A', dark: '#0E7A30' },
  yellow: { base: '#F5C000', light: '#FFD740', dark: '#A07C00' },
}

const CORNER_BUTTONS: { color: ButtonColor; top?: number | string; bottom?: number | string; left?: number | string; right?: number | string }[] = [
  { color: 'orange', top: 0,    left: 0 },
  { color: 'blue',   top: 0,    right: 0 },
  { color: 'green',  bottom: 0, left: 0 },
  { color: 'yellow', bottom: 0, right: 0 },
]

const PAD = 292
const BTN = 110
const CENTER = 88

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
}: ButtonPadProps) {
  const isClearing = clearingStage !== null
  const isCounting = countdown !== null

  const centerLabel = () => {
    if (isCounting) {
      return <span style={{ fontSize: 14, fontWeight: 800, color: '#FF6900', letterSpacing: 1 }}>READY</span>
    }
    if (isClearing) {
      return (
        <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
          <div style={{ fontSize: 9, color: '#FF6900', fontWeight: 800, letterSpacing: 1 }}>STAGE</div>
          <div style={{ fontSize: 20, color: '#fff', fontWeight: 900 }}>{clearingStage}</div>
          <div style={{ fontSize: 9, color: '#FF6900', fontWeight: 700 }}>CLEAR ✓</div>
        </div>
      )
    }
    if (status === 'IDLE') {
      return <span style={{ fontSize: 13, fontWeight: 800, color: '#ccc', letterSpacing: 2 }}>START</span>
    }
    if (status === 'RESULT') {
      return <span style={{ fontSize: 13, fontWeight: 800, color: '#ccc', letterSpacing: 1 }}>RETRY</span>
    }
    return (
      <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
        <div style={{ fontSize: 8, color: '#888', letterSpacing: 1, fontWeight: 700 }}>SCORE</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{score}</div>
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
        background: 'linear-gradient(145deg, #2a2a35 0%, #16161f 50%, #0e0e16 100%)',
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
          background: 'radial-gradient(circle at 35% 35%, #3a3a4a, #1a1a24)',
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
            onPointerDown={() => !disabled && !isClearing && onPress(color)}
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
                : `radial-gradient(circle at 35% 30%, ${c.light}99, ${c.base}88 55%, ${c.dark}77)`,
              // 측면 그림자로 입체감 + 점등 글로우
              boxShadow: isFlashing
                ? [
                    `0 3px 0 ${c.dark}`,
                    `0 6px 20px rgba(0,0,0,0.5)`,
                    `0 0 30px ${c.base}cc`,
                    `0 0 60px ${c.base}66`,
                  ].join(', ')
                : [
                    `0 6px 0 ${c.dark}99`,
                    `0 8px 16px rgba(0,0,0,0.6)`,
                  ].join(', '),
              transform: isFlashing ? 'scale(1.06) translateY(3px)' : 'scale(1)',
              filter: isFlashing ? 'brightness(1.4)' : 'brightness(0.75)',
              transition: 'transform 70ms ease, filter 70ms ease, box-shadow 70ms ease',
              pointerEvents: (disabled || isClearing) ? 'none' : 'auto',
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
          border: `2px solid ${isClearing ? '#FF6900' : 'rgba(255,255,255,0.10)'}`,
          cursor: isCenterClickable ? 'pointer' : 'default',
          background: isClearing
            ? 'radial-gradient(circle at 40% 35%, #2a2a3e, #111120)'
            : 'radial-gradient(circle at 40% 35%, #252535, #101018)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isClearing
            ? '0 0 16px #FF690066, inset 0 2px 1px rgba(255,255,255,0.08)'
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
