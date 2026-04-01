interface TimerGaugeProps {
  timeLeft: number
  duration: number
  active: boolean
}

export function TimerGauge({ timeLeft, duration, active }: TimerGaugeProps) {
  const ratio = active ? timeLeft / duration : 1
  const isWarning = ratio < 0.5

  return (
    <div style={{ width: '100%', padding: '0 24px' }}>
      <div style={{
        width: '100%',
        height: 12,
        borderRadius: 6,
        backgroundColor: 'var(--timer-track)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          borderRadius: 6,
          width: `${ratio * 100}%`,
          backgroundColor: active ? (isWarning ? '#ef4444' : '#D4A843') : '#2a2a3e',
          transition: 'width 100ms linear, background-color 200ms ease',
        }} />
      </div>
    </div>
  )
}
