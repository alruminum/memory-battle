import { useEffect, useRef, useState } from 'react'

const BLOCK_HEIGHTS = [8, 10, 12, 14, 16]  // px, 인덱스 0(좌)→4(우), 높이 차등

interface ComboIndicatorProps {
  comboStreak: number
  isBreaking?: boolean  // 콤보 타이머 만료 시 true. 기본값: false
}

export function ComboIndicator({ comboStreak, isBreaking = false }: ComboIndicatorProps) {
  const [animKey, setAnimKey] = useState(0)
  const prevBreaking = useRef(false)

  // isBreaking false→true 전환마다 animKey 증분 → key 변경으로 CSS 애니메이션 재시작
  useEffect(() => {
    if (isBreaking && !prevBreaking.current) {
      setAnimKey(k => k + 1)
    }
    prevBreaking.current = isBreaking
  }, [isBreaking])

  // [#95] streak=0 early return 제거 — 5칸 빈 블록 + x1 항상 표시 (docs/ui-spec.md ComboIndicator 표시 규칙)
  const multiplier = Math.floor(comboStreak / 5) + 1
  const filledCount = comboStreak % 5   // 0: 막 배율 상승 직후(빈 상태), 1~4: 진행 중

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '4px 14px',
    }}>
      {/* key 변경으로 전체 내부 DOM remount → 애니메이션 재시작 */}
      <div
        key={animKey}
        className={isBreaking ? 'combo-breaking' : ''}
        style={{ display: 'flex', alignItems: 'center', gap: 10 }}
      >
        {/* 좌: 블록 5칸 */}
        <div style={{
          display: 'flex',
          gap: 3,
          alignItems: 'flex-end',
          height: 20,
        }}>
          {BLOCK_HEIGHTS.map((h, i) => {
            const isFilled = i < filledCount
            // isBreaking 시: blockBreak 0.3s (5칸 전체 동시 붕괴)
            // 평시: 방금 채워진 블록에만 blockPop 0.3s
            const blockAnimation = isBreaking
              ? 'blockBreak 0.3s ease-in forwards'
              : (isFilled && i === filledCount - 1) ? 'blockPop 0.3s ease' : 'none'
            return (
              <div
                key={i}
                style={{
                  width: 10,
                  height: h,
                  borderRadius: '2px 2px 0 0',
                  background: isFilled ? 'var(--vb-accent)' : 'var(--vb-border)',
                  transformOrigin: 'bottom',
                  animation: blockAnimation,
                  // isBreaking 중에는 glow 제거 (붕괴 연출과 충돌 방지)
                  boxShadow: isBreaking ? 'none' : (isFilled ? '0 0 7px 2px rgba(212, 168, 67, 0.5)' : 'none'),
                }}
              />
            )
          })}
        </div>

        {/* 우: x{배율} 숫자 */}
        <div
          className={isBreaking ? 'combo-mult-break' : ''}
          style={{
            fontFamily: 'var(--vb-font-score)',
            fontSize: 18,
            fontWeight: 900,
            color: 'var(--vb-accent)',
            lineHeight: 1,
          }}
        >
          x{multiplier}
        </div>
      </div>
    </div>
  )
}
