import { useState, useEffect, useRef } from 'react'

interface ComboTimerProps {
  computerShowTime: number   // 컴퓨터 시연 총 시간 (ms). flashDuration × sequenceLength
  inputStartTime: number     // INPUT 페이즈 시작 시각 (timestamp). store.sequenceStartTime
  isActive: boolean          // INPUT 상태 여부. true일 때만 렌더링
}

export function ComboTimer({ computerShowTime, inputStartTime, isActive }: ComboTimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isActive || inputStartTime === 0) {
      // 비활성: 타이머 정지 + 초기화
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setElapsedMs(0)
      return
    }

    // 활성: 100ms 간격으로 경과 시간 업데이트
    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - inputStartTime)
    }, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, inputStartTime])

  if (!isActive) return null

  const isOverTime = elapsedMs >= computerShowTime
  const displaySeconds = (elapsedMs / 1000).toFixed(2)
  const targetSeconds = (computerShowTime / 1000).toFixed(2)

  // 색상: 기준 시간 이내 = 초록 계열, 초과 = 빨강 계열
  const color = isOverTime ? '#F87171' : '#34D399'
  const glowColor = isOverTime ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '6px 0',
    }}>
      {/* 경과 시간 */}
      <span style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 20,
        fontWeight: 900,
        color,
        textShadow: `0 0 12px ${glowColor}`,
        transition: 'color 200ms ease, text-shadow 200ms ease',
        letterSpacing: 1,
        minWidth: 52,
        textAlign: 'right',
      }}>
        {displaySeconds}
      </span>

      {/* 구분 텍스트 */}
      <span style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--vb-text-dim)',
        letterSpacing: 1,
      }}>
        /
      </span>

      {/* 목표 시간 */}
      <span style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--vb-text-dim)',
        letterSpacing: 1,
        minWidth: 40,
      }}>
        {targetSeconds}
      </span>

      {/* 단위 */}
      <span style={{
        fontFamily: 'var(--vb-font-score)',
        fontSize: 9,
        fontWeight: 600,
        color: 'var(--vb-text-dim)',
        letterSpacing: 2,
      }}>
        SEC
      </span>
    </div>
  )
}
