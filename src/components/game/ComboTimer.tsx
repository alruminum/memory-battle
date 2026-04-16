import { useState, useEffect, useRef } from 'react'

type CollapsePhase = 'none' | 'breaking' | 'done'

// [신규] 3단계 타이머 페이즈
type TimerPhase = 'normal' | 'warning' | 'danger'

const getTimerPhase = (ratio: number): TimerPhase => {
  if (ratio <= 0.2) return 'danger'
  if (ratio <= 0.5) return 'warning'
  return 'normal'
}

// [신규] 색상 테이블
const FILL_COLORS: Record<TimerPhase, string> = {
  normal:  'var(--vb-accent)',
  warning: 'var(--vb-combo-warn)',
  danger:  'var(--vb-combo-danger)',
}
const GLOW_COLORS: Record<TimerPhase, string> = {
  normal:  'rgba(212,168,67,0.7)',
  warning: 'rgba(251,146,60,0.7)',
  danger:  'rgba(248,113,113,0.7)',
}

interface ComboTimerProps {
  computerShowTime: number   // 컴퓨터 시연 총 시간 (ms). flashDuration × sequenceLength
  inputStartTime: number     // INPUT 페이즈 시작 시각 (timestamp). store.sequenceStartTime. 0 = 미설정
  isActive: boolean          // INPUT 상태 여부. true일 때 바 게이지가 줄어들기 시작
  isBreaking?: boolean       // 콤보 깨짐 상태. true 시 collapse 애니메이션 후 숨김 (optional, defaults false)
  isShowing?: boolean        // SHOWING 페이즈 여부. true 시 풀 바(100%) 정적 렌더링 (DOM 유지, 레이아웃 안정화)
  onComboTimerExpired?: () => void  // [신규] bar가 0에 도달 시 1회 호출. isActive=true 구간에서만 발화.
}

export function ComboTimer({ computerShowTime, inputStartTime, isActive, isBreaking = false, isShowing = false, onComboTimerExpired }: ComboTimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [collapsePhase, setCollapsePhase] = useState<CollapsePhase>('none')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const computerShowTimeRef = useRef(computerShowTime)

  // computerShowTime이 바뀔 때마다 ref 동기화 (interval 재시작 없이 최신값 유지)
  useEffect(() => {
    computerShowTimeRef.current = computerShowTime
  }, [computerShowTime])

  // [신규] onComboTimerExpired 발화 — bar 0 도달 시 1회 호출
  // useEffect 방식: interval 경로 + VisibilityAPI 복귀 경로 모두 자동 커버
  const hasExpiredFiredRef = useRef(false)
  const onComboTimerExpiredRef = useRef(onComboTimerExpired)
  useEffect(() => {
    onComboTimerExpiredRef.current = onComboTimerExpired
  }, [onComboTimerExpired])

  useEffect(() => {
    if (!isActive) {
      hasExpiredFiredRef.current = false   // 다음 활성화를 위해 리셋
      return
    }
    if (!hasExpiredFiredRef.current && elapsedMs >= computerShowTime) {
      hasExpiredFiredRef.current = true
      onComboTimerExpiredRef.current?.()
    }
  }, [isActive, elapsedMs, computerShowTime])

  // isBreaking 상태 머신: false→none 리셋 / true→breaking(즉시)+done(600ms)
  useEffect(() => {
    if (!isBreaking) {
      // isBreaking prop→state 동기화: interval+VisibilityAPI 로직과 얽혀 있어
      // 인라인 파생 상태 분리 시 타이밍 부작용 우려 — 의도적 suppression
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsePhase('none')
      return
    }
    setCollapsePhase('breaking')
    const tid = setTimeout(() => setCollapsePhase('done'), 600)
    return () => clearTimeout(tid)
  }, [isBreaking])

  useEffect(() => {
    if (!isActive || inputStartTime === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // interval 정지와 elapsedMs 초기화를 동일 effect에서 처리 — 의도적 suppression
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setElapsedMs(0)
      return
    }

    const startInterval = () => {
      if (intervalRef.current) return
      intervalRef.current = setInterval(() => {
        const next = Date.now() - inputStartTime
        if (next >= computerShowTimeRef.current) {
          clearInterval(intervalRef.current!)
          intervalRef.current = null
          setElapsedMs(computerShowTimeRef.current)
        } else {
          setElapsedMs(next)
        }
      }, 100)
    }

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    if (!document.hidden) {
      startInterval()
    }

    const handleVisibility = () => {
      if (document.hidden) {
        stopInterval()
      } else {
        const next = Date.now() - inputStartTime
        setElapsedMs(Math.min(next, computerShowTimeRef.current))
        if (next < computerShowTimeRef.current) {
          startInterval()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      stopInterval()
    }
  }, [isActive, inputStartTime])

  if (!isActive && !isShowing && collapsePhase === 'none') return null
  if (collapsePhase === 'done') return null

  const displayElapsedMs = (isShowing && !isActive) ? 0 : elapsedMs

  const ratio = Math.max(0, 1 - displayElapsedMs / computerShowTime)
  const fillWidth = `${ratio * 100}%`

  // [변경] TimerPhase 기반 색상 분기 (isOver 제거)
  const phase = getTimerPhase(ratio)
  const fillColor = FILL_COLORS[phase]
  const glowColor = GLOW_COLORS[phase]

  const fillClass = [
    'combo-timer-fill',
    phase !== 'normal' ? phase : '',
    collapsePhase === 'breaking' ? 'collapse' : '',
  ].filter(Boolean).join(' ')

  const glowClass = phase === 'danger' ? 'combo-timer-glow--danger' : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 4px' }}>
      {/* 접근성·테스트용 elapsed 텍스트 (시각적 숨김) */}
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        {(elapsedMs / 1000).toFixed(2)}
      </span>
      {/* 레이블 텍스트 */}
      <span style={{
        fontSize: 9,
        fontWeight: 600,
        color: 'var(--vb-text-dim)',
        letterSpacing: 2,
        marginBottom: 4,
      }}>
        콤보타이머
      </span>
      {/* 트랙 */}
      <div
        data-testid="combo-timer-track"
        className={`combo-timer-track${collapsePhase === 'breaking' ? ' collapse' : ''}`}
        style={{
          position: 'relative',
          height: 4,
          width: 200,
          background: 'var(--timer-track)',
          borderRadius: 2,
          overflow: 'visible',
        }}
      >
        {/* 채우는 바 */}
        <div
          data-testid="combo-timer-fill"
          className={fillClass}
          style={{
            height: '100%',
            width: fillWidth,
            borderRadius: 2,
            background: fillColor,
            position: 'relative',
            transition: 'width 80ms linear',
            transformOrigin: 'left center',
          }}
        >
          {/* 글로우 헤드 — collapse 시 숨김 */}
          {collapsePhase !== 'breaking' && (
            <div
              className={glowClass}
              style={{
                position: 'absolute',
                right: -3,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: fillColor,
                boxShadow: `0 0 10px 3px ${glowColor}`,
                transition: phase === 'danger'
                  ? 'background 200ms ease'
                  : 'background 200ms ease, box-shadow 200ms ease',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
