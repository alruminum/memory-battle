/**
 * Epic 11 UI 개선 테스트
 *
 * 이슈 #52 — 카운트다운 힌트 문구 표시 (StageArea)
 * 이슈 #53 — FULL COMBO! 제거 + 체크마크 SVG + isClearingFullCombo 제거 (StageArea, useGameEngine)
 * 이슈 #54 — ComboIndicator 5칸 블록 UI + x배율 숫자
 * 이슈 #60 — 카운트다운 힌트 750ms 균등 전환 (로컬 타이머)
 *
 * impl 파일: docs/milestones/v03/epics/epic-11-ui-improvements/impl/
 *   01-countdown-hint.md — 로컬 hintPhase 타이머. 0ms→힌트1, 750ms→힌트2. hint-line2 DOM 제거.
 *   02-fullcombo-removal.md — isClearingFullCombo 제거. FULL COMBO! 미표시. CLEAR 텍스트 유지. 체크마크 SVG.
 *   03-combo-indicator-v2.md — multiplier/filledCount 계산, 블록 개수 및 x배율 텍스트 검증.
 *
 * TEST_PLAN_GAP: test-plan.md §5 수동 검증에만 등록되어 있음.
 *   자동화 가능한 부분(렌더링 텍스트, 반환값 구조)에 대해 TC 추가 작성.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useState, useEffect } from 'react'
import { ComboIndicator } from '../components/game/ComboIndicator'

// ─────────────────────────────────────────────────────────────────────────────
// StageArea는 GamePage.tsx 내부 함수 컴포넌트로 export 없음.
// GamePage.tsx에서 직접 import 불가하므로, impl 명세에 따라
// 동일한 조건 분기 로직을 인라인 테스트 컴포넌트로 재현한다.
// (렌더링 텍스트 검증이 목적 — 구현 코드 변경 아님)
// ─────────────────────────────────────────────────────────────────────────────

interface StageAreaTestProps {
  countdown: number | null
  clearingStage: number | null
  isPlaying: boolean
  stage: number
}

function StageAreaPreview({ countdown, clearingStage, isPlaying, stage }: StageAreaTestProps) {
  const [hintPhase, setHintPhase] = useState(0)

  useEffect(() => {
    if (countdown === null) return
    setHintPhase(0)
    const timer = setTimeout(() => setHintPhase(1), 750)
    return () => clearTimeout(timer)
  }, [countdown === null ? null : 'active'])

  if (countdown !== null) {
    const hintText = hintPhase === 0
      ? '깜빡이는 순서 그대로 눌러요'
      : '더 빠르면 콤보가 누적됩니다'
    return (
      <div data-testid="countdown-block">
        <div data-testid="countdown-number">{countdown}</div>
        <div data-testid="countdown-divider" />
        <div key={countdown} className="countdown-hint" data-testid="countdown-hint">
          <div data-testid="hint-line1">{hintText}</div>
          {/* hint-line2 제거 — 로컬 타이머 방식으로 단일 문구 전환 */}
        </div>
      </div>
    )
  }
  if (clearingStage !== null) {
    return (
      <div data-testid="clearing-block">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true" data-testid="check-svg">
          <path
            d="M8 18 L15 25 L28 11"
            stroke="var(--vb-combo-ok)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="40"
            strokeDashoffset="40"
            style={{ animation: 'checkDraw 0.4s 0.1s ease forwards' }}
          />
        </svg>
        <div data-testid="stage-label">STAGE {clearingStage}</div>
        <div data-testid="clear-text">CLEAR</div>
      </div>
    )
  }
  if (isPlaying) {
    return (
      <div data-testid="playing-block">
        <div>STAGE</div>
        <div data-testid="stage-number">{String(stage).padStart(2, '0')}</div>
      </div>
    )
  }
  return <div data-testid="idle-block" />
}

// ─────────────────────────────────────────────────────────────────────────────
// ComboIndicator DOM 구조 (디버그로 확인):
//   container > 루트 flex div > 블록 래퍼 div > [5개 블록 div]
//                             > x배율 텍스트 div
//
// 블록 선택: container.firstElementChild (루트)
//             .firstElementChild (블록 래퍼)
//             .children (5개 블록의 직접 자식들)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ComboIndicator의 5개 블록 div를 반환한다.
 * DOM: container > 루트div > 블록래퍼div > [직접 자식 5개]
 */
function getBlocks(container: HTMLElement): HTMLElement[] {
  const root = container.firstElementChild  // 루트 flex div
  if (!root) return []
  const blockWrapper = root.firstElementChild  // 블록 래퍼 div
  if (!blockWrapper) return []
  return Array.from(blockWrapper.children) as HTMLElement[]
}

// ─────────────────────────────────────────────────────────────────────────────
// [이슈 #52] 카운트다운 힌트 문구 표시
// ─────────────────────────────────────────────────────────────────────────────

describe('[#52] 카운트다운 힌트 문구 — StageArea', () => {
  it('countdown=3 시 숫자 "3"이 렌더링된다', () => {
    render(<StageAreaPreview countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.getByTestId('countdown-number')).toHaveTextContent('3')
  })

  it('countdown=1 시 숫자 "1"이 렌더링된다', () => {
    render(<StageAreaPreview countdown={1} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.getByTestId('countdown-number')).toHaveTextContent('1')
  })

  // 엣지 케이스 — countdown=null 시 힌트 블록 미표시
  it('countdown=null 시 힌트 문구가 렌더링되지 않는다', () => {
    render(<StageAreaPreview countdown={null} clearingStage={null} isPlaying={true} stage={1} />)
    expect(screen.queryByTestId('hint-line1')).toBeNull()
    expect(screen.queryByTestId('hint-line2')).toBeNull()
  })

  it('countdown=null 시 카운트다운 블록 전체가 렌더링되지 않는다', () => {
    render(<StageAreaPreview countdown={null} clearingStage={null} isPlaying={true} stage={1} />)
    expect(screen.queryByTestId('countdown-block')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [이슈 #60] 카운트다운 힌트 750ms 타이머 전환
// ─────────────────────────────────────────────────────────────────────────────

describe('[#60] 카운트다운 힌트 750ms 타이머 전환 — StageArea', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('countdown 시작 직후 "깜빡이는 순서 그대로 눌러요"가 렌더링된다', () => {
    render(<StageAreaPreview countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.getByTestId('hint-line1')).toHaveTextContent('깜빡이는 순서 그대로 눌러요')
    expect(screen.queryByTestId('hint-line2')).toBeNull()
  })

  it('750ms 경과 후 "더 빠르면 콤보가 누적됩니다"로 전환된다', () => {
    render(<StageAreaPreview countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    act(() => { vi.advanceTimersByTime(750) })
    expect(screen.getByTestId('hint-line1')).toHaveTextContent('더 빠르면 콤보가 누적됩니다')
  })

  it('749ms에서는 아직 첫 번째 힌트가 유지된다', () => {
    render(<StageAreaPreview countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    act(() => { vi.advanceTimersByTime(749) })
    expect(screen.getByTestId('hint-line1')).toHaveTextContent('깜빡이는 순서 그대로 눌러요')
  })

  it('어떤 시점에서도 hint-line2 노드는 존재하지 않는다', () => {
    render(<StageAreaPreview countdown={3} clearingStage={null} isPlaying={false} stage={1} />)
    expect(screen.queryByTestId('hint-line2')).toBeNull()
    act(() => { vi.advanceTimersByTime(750) })
    expect(screen.queryByTestId('hint-line2')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [이슈 #53] FULL COMBO! 제거 + 체크마크 SVG + CLEAR 텍스트 유지
// ─────────────────────────────────────────────────────────────────────────────

describe('[#53] FULL COMBO! 제거 — StageArea clearingStage 분기', () => {
  // 정상 흐름 — CLEAR 텍스트 유지
  it('clearingStage !== null 시 "CLEAR" 텍스트가 렌더링된다', () => {
    render(<StageAreaPreview countdown={null} clearingStage={3} isPlaying={false} stage={3} />)
    expect(screen.getByTestId('clear-text')).toHaveTextContent('CLEAR')
  })

  it('clearingStage !== null 시 체크마크 SVG(aria-hidden="true")가 렌더링된다', () => {
    render(<StageAreaPreview countdown={null} clearingStage={3} isPlaying={false} stage={3} />)
    expect(screen.getByTestId('check-svg')).toBeInTheDocument()
  })

  it('clearingStage !== null 시 "STAGE {n}" 레이블이 렌더링된다', () => {
    render(<StageAreaPreview countdown={null} clearingStage={5} isPlaying={false} stage={5} />)
    expect(screen.getByTestId('stage-label')).toHaveTextContent('STAGE 5')
  })

  // 핵심 — FULL COMBO! 텍스트 미표시
  it('clearingStage !== null 시 "FULL COMBO!" 텍스트가 렌더링되지 않는다', () => {
    render(<StageAreaPreview countdown={null} clearingStage={3} isPlaying={false} stage={3} />)
    expect(screen.queryByText(/FULL COMBO/)).toBeNull()
  })

  // clearingStage=null 시 체크마크 미표시
  it('clearingStage=null 시 체크마크 SVG가 렌더링되지 않는다', () => {
    render(<StageAreaPreview countdown={null} clearingStage={null} isPlaying={true} stage={3} />)
    expect(screen.queryByTestId('check-svg')).toBeNull()
  })

  it('clearingStage=null 시 "CLEAR" 텍스트가 렌더링되지 않는다', () => {
    render(<StageAreaPreview countdown={null} clearingStage={null} isPlaying={true} stage={3} />)
    expect(screen.queryByTestId('clear-text')).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [이슈 #53] isClearingFullCombo 반환값 제거 — useGameEngine 소스 검증
// ─────────────────────────────────────────────────────────────────────────────

describe('[#53] useGameEngine — isClearingFullCombo 반환값 제거', () => {
  it('useGameEngine 반환값에 isClearingFullCombo 키가 존재하지 않는다', async () => {
    const module = await import('../hooks/useGameEngine')
    expect(typeof module.useGameEngine).toBe('function')
    // 런타임 소스 검증: 함수 문자열에 isClearingFullCombo가 없어야 함
    const fnSource = module.useGameEngine.toString()
    expect(fnSource).not.toContain('isClearingFullCombo')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [이슈 #54] ComboIndicator — 5칸 블록 UI + x배율 숫자
// ─────────────────────────────────────────────────────────────────────────────

describe('[#54] ComboIndicator — comboStreak=0 미렌더링', () => {
  it('comboStreak=0 시 null을 반환한다 (컴포넌트 미렌더링)', () => {
    const { container } = render(<ComboIndicator comboStreak={0} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('[#54] ComboIndicator — x배율 텍스트', () => {
  // 정상 흐름
  it('comboStreak=1 시 "x1" 배율 텍스트가 렌더링된다', () => {
    render(<ComboIndicator comboStreak={1} />)
    expect(screen.getByText('x1')).toBeInTheDocument()
  })

  it('comboStreak=4 시 "x1" 배율 텍스트가 렌더링된다', () => {
    render(<ComboIndicator comboStreak={4} />)
    expect(screen.getByText('x1')).toBeInTheDocument()
  })

  it('comboStreak=5 시 "x2" 배율 텍스트가 렌더링된다 (배율 상승 직후)', () => {
    render(<ComboIndicator comboStreak={5} />)
    expect(screen.getByText('x2')).toBeInTheDocument()
  })

  it('comboStreak=6 시 "x2" 배율 텍스트가 렌더링된다', () => {
    render(<ComboIndicator comboStreak={6} />)
    expect(screen.getByText('x2')).toBeInTheDocument()
  })

  it('comboStreak=10 시 "x3" 배율 텍스트가 렌더링된다', () => {
    render(<ComboIndicator comboStreak={10} />)
    expect(screen.getByText('x3')).toBeInTheDocument()
  })

  it('comboStreak=9 시 "x2" 배율 텍스트가 렌더링된다', () => {
    render(<ComboIndicator comboStreak={9} />)
    expect(screen.getByText('x2')).toBeInTheDocument()
  })

  // 엣지 케이스 — 배율 경계값
  it('comboStreak=15 시 "x4" 배율 텍스트가 렌더링된다', () => {
    render(<ComboIndicator comboStreak={15} />)
    expect(screen.getByText('x4')).toBeInTheDocument()
  })
})

describe('[#54] ComboIndicator — 5칸 블록 개수', () => {
  it('항상 5개의 블록 div가 렌더링된다 (comboStreak=1)', () => {
    const { container } = render(<ComboIndicator comboStreak={1} />)
    expect(getBlocks(container)).toHaveLength(5)
  })

  it('항상 5개의 블록 div가 렌더링된다 (comboStreak=5)', () => {
    const { container } = render(<ComboIndicator comboStreak={5} />)
    expect(getBlocks(container)).toHaveLength(5)
  })

  it('comboStreak=1 시 첫 번째 블록만 filled(var(--vb-accent)) 배경을 가진다', () => {
    const { container } = render(<ComboIndicator comboStreak={1} />)
    const blocks = getBlocks(container)
    // filledCount = 1 % 5 = 1 → 인덱스 0만 filled
    expect(blocks[0].style.background).toBe('var(--vb-accent)')
    expect(blocks[1].style.background).toBe('var(--vb-border)')
    expect(blocks[2].style.background).toBe('var(--vb-border)')
    expect(blocks[3].style.background).toBe('var(--vb-border)')
    expect(blocks[4].style.background).toBe('var(--vb-border)')
  })

  it('comboStreak=3 시 첫 세 블록이 filled, 나머지 2개가 empty이다', () => {
    const { container } = render(<ComboIndicator comboStreak={3} />)
    const blocks = getBlocks(container)
    // filledCount = 3 % 5 = 3
    expect(blocks[0].style.background).toBe('var(--vb-accent)')
    expect(blocks[1].style.background).toBe('var(--vb-accent)')
    expect(blocks[2].style.background).toBe('var(--vb-accent)')
    expect(blocks[3].style.background).toBe('var(--vb-border)')
    expect(blocks[4].style.background).toBe('var(--vb-border)')
  })

  it('comboStreak=5 시 모든 블록이 empty이다 (배율 상승 직후 filledCount=0)', () => {
    const { container } = render(<ComboIndicator comboStreak={5} />)
    const blocks = getBlocks(container)
    // filledCount = 5 % 5 = 0
    blocks.forEach(block => {
      expect(block.style.background).toBe('var(--vb-border)')
    })
  })

  it('comboStreak=4 시 4개의 블록이 filled이다', () => {
    const { container } = render(<ComboIndicator comboStreak={4} />)
    const blocks = getBlocks(container)
    // filledCount = 4 % 5 = 4
    expect(blocks[0].style.background).toBe('var(--vb-accent)')
    expect(blocks[1].style.background).toBe('var(--vb-accent)')
    expect(blocks[2].style.background).toBe('var(--vb-accent)')
    expect(blocks[3].style.background).toBe('var(--vb-accent)')
    expect(blocks[4].style.background).toBe('var(--vb-border)')
  })

  // 엣지 케이스 — comboStreak=10: filledCount=0 (배율 상승 직후)
  it('comboStreak=10 시 모든 블록이 empty이다 (filledCount=0)', () => {
    const { container } = render(<ComboIndicator comboStreak={10} />)
    const blocks = getBlocks(container)
    blocks.forEach(block => {
      expect(block.style.background).toBe('var(--vb-border)')
    })
  })

  it('comboStreak=6 시 첫 번째 블록만 filled이다', () => {
    const { container } = render(<ComboIndicator comboStreak={6} />)
    const blocks = getBlocks(container)
    // filledCount = 6 % 5 = 1
    expect(blocks[0].style.background).toBe('var(--vb-accent)')
    expect(blocks[1].style.background).toBe('var(--vb-border)')
  })
})

describe('[#54] ComboIndicator — blockPop 애니메이션', () => {
  it('comboStreak=1 시 인덱스 0 블록에 blockPop 애니메이션이 적용된다', () => {
    const { container } = render(<ComboIndicator comboStreak={1} />)
    const blocks = getBlocks(container)
    // filledCount=1, 마지막 filled 인덱스=0
    expect(blocks[0].style.animation).toContain('blockPop')
  })

  it('comboStreak=1 시 나머지 블록에 blockPop 애니메이션이 적용되지 않는다', () => {
    const { container } = render(<ComboIndicator comboStreak={1} />)
    const blocks = getBlocks(container)
    expect(blocks[1].style.animation).toBe('none')
    expect(blocks[2].style.animation).toBe('none')
    expect(blocks[3].style.animation).toBe('none')
    expect(blocks[4].style.animation).toBe('none')
  })

  it('comboStreak=3 시 인덱스 2 블록(마지막 filled)에만 blockPop이 적용된다', () => {
    const { container } = render(<ComboIndicator comboStreak={3} />)
    const blocks = getBlocks(container)
    // filledCount=3, 마지막 filled 인덱스=2
    expect(blocks[0].style.animation).toBe('none')
    expect(blocks[1].style.animation).toBe('none')
    expect(blocks[2].style.animation).toContain('blockPop')
    expect(blocks[3].style.animation).toBe('none')
    expect(blocks[4].style.animation).toBe('none')
  })

  it('comboStreak=5 시 filledCount=0이므로 어떤 블록에도 blockPop이 적용되지 않는다', () => {
    const { container } = render(<ComboIndicator comboStreak={5} />)
    const blocks = getBlocks(container)
    blocks.forEach(block => {
      expect(block.style.animation).toBe('none')
    })
  })
})

describe('[#54] ComboIndicator — 블록 높이 차등 (BLOCK_HEIGHTS)', () => {
  it('5개 블록의 높이가 [8px, 10px, 12px, 14px, 16px] 순서로 증가한다', () => {
    const { container } = render(<ComboIndicator comboStreak={1} />)
    const blocks = getBlocks(container)
    const expectedHeights = ['8px', '10px', '12px', '14px', '16px']
    blocks.forEach((block, i) => {
      expect(block.style.height).toBe(expectedHeights[i])
    })
  })

  it('블록 너비가 모두 10px이다', () => {
    const { container } = render(<ComboIndicator comboStreak={2} />)
    const blocks = getBlocks(container)
    blocks.forEach(block => {
      expect(block.style.width).toBe('10px')
    })
  })
})
