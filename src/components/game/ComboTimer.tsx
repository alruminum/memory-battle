import { useState, useEffect, useRef } from 'react'

type CollapsePhase = 'none' | 'breaking' | 'done'

interface ComboTimerProps {
  computerShowTime: number   // 컴퓨터 시연 총 시간 (ms). flashDuration × sequenceLength
  inputStartTime: number     // INPUT 페이즈 시작 시각 (timestamp). store.sequenceStartTime. 0 = 미설정
  isActive: boolean          // INPUT 상태 여부. true일 때 바 게이지가 줄어들기 시작
  isBreaking?: boolean       // 콤보 깨짐 상태. true 시 collapse 애니메이션 후 숨김 (optional, defaults false)
  isShowing?: boolean        // SHOWING 페이즈 여부. true 시 풀 바(100%) 정적 렌더링 (DOM 유지, 레이아웃 안정화)
}

export function ComboTimer({ computerShowTime, inputStartTime, isActive, isBreaking = false, isShowing = false }: ComboTimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [collapsePhase, setCollapsePhase] = useState<CollapsePhase>('none')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const computerShowTimeRef = useRef(computerShowTime)

  // computerShowTime이 바뀔 때마다 ref 동기화 (interval 재시작 없이 최신값 유지)
  useEffect(() => {
    computerShowTimeRef.current = computerShowTime
  }, [computerShowTime])

  // isBreaking 상태 머신: false→none 리셋 / true→breaking(즉시)+done(600ms)
  // [isBreaking]만 dep: collapsePhase를 dep에 포함하면 'none'→'breaking' 전환 시
  // cleanup이 재실행되어 setTimeout이 취소되는 버그 발생
  useEffect(() => {
    if (!isBreaking) {
      setCollapsePhase('none')
      return
    }
    // isBreaking=true → collapse 시작
    setCollapsePhase('breaking')
    const tid = setTimeout(() => setCollapsePhase('done'), 600)
    return () => clearTimeout(tid)
  }, [isBreaking])

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

    const startInterval = () => {
      if (intervalRef.current) return  // 이미 실행 중이면 중복 시작 방지
      intervalRef.current = setInterval(() => {
        const next = Date.now() - inputStartTime
        if (next >= computerShowTimeRef.current) {
          // 상한 도달: interval 정지 + 값 clamp
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

    // 초기 시작: hidden이 아닐 때만 interval 시작
    if (!document.hidden) {
      startInterval()
    }

    const handleVisibility = () => {
      if (document.hidden) {
        stopInterval()
      } else {
        // 복귀 시: elapsed 즉시 반영 후 interval 재개
        const next = Date.now() - inputStartTime
        setElapsedMs(Math.min(next, computerShowTimeRef.current))
        if (next < computerShowTimeRef.current) {
          startInterval()
        }
        // next >= computerShowTimeRef.current이면 clamped 상한값으로 고정된 채 interval 재시작 불필요
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      stopInterval()
    }
  }, [isActive, inputStartTime])

  // 렌더링 조건
  // · isActive=false && isShowing=false && collapsePhase='none' → null (INPUT/SHOWING 아닐 때 숨김)
  // · isShowing=true                        → 풀 바(100%) 정적 렌더 (DOM 유지, 레이아웃 안정화)
  // · collapsePhase='done'                  → null (붕괴 완료 후 숨김)
  if (!isActive && !isShowing && collapsePhase === 'none') return null
  if (collapsePhase === 'done') return null

  // SHOWING 중에는 elapsed를 0으로 취급 → 항상 풀 바(100%) 표시
  const displayElapsedMs = (isShowing && !isActive) ? 0 : elapsedMs

  // 게이지 수치
  const ratio = Math.max(0, 1 - displayElapsedMs / computerShowTime)
  const fillWidth = `${ratio * 100}%`

  // 상태별 색상
  const isOver = displayElapsedMs >= computerShowTime
  const fillColor = isOver ? 'var(--vb-combo-over)' : 'var(--vb-accent)'
  const glowColor = isOver
    ? 'rgba(248,113,113,0.7)'
    : 'rgba(212,168,67,0.7)'

  // CSS class 조합
  const fillClass = [
    'combo-timer-fill',
    isOver ? 'over' : '',
    collapsePhase === 'breaking' ? 'collapse' : '',
  ].filter(Boolean).join(' ')

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
            transition: 'width 80ms linear, background 200ms ease',
            transformOrigin: 'left center',
          }}
        >
          {/* 글로우 헤드 — collapse 시 숨김 */}
          {collapsePhase !== 'breaking' && (
            <div style={{
              position: 'absolute',
              right: -3,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: fillColor,
              boxShadow: `0 0 10px 3px ${glowColor}`,
              transition: 'background 200ms ease, box-shadow 200ms ease',
            }} />
          )}
        </div>
      </div>
    </div>
  )
}
