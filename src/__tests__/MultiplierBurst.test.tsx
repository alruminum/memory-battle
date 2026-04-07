import { render, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MultiplierBurst } from '../components/game/MultiplierBurst'

// ────────────────────────────────────────────────
// 헬퍼: xN 텍스트 div 선택
// font-size: 88px (React는 숫자를 'px' 단위로 직렬화)
// ────────────────────────────────────────────────
function getXnElement(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>('div[style*="font-size: 88px"]')
}

// ────────────────────────────────────────────────
// getMultiplierColor — 컴포넌트 렌더링으로 간접 검증
// ────────────────────────────────────────────────
describe('getMultiplierColor — 간접 검증 (xN 텍스트 color 스타일)', () => {
  it('multiplier=1 → 흰색 #FFFFFF', () => {
    const { container } = render(
      <MultiplierBurst multiplier={1} isVisible={true} onComplete={vi.fn()} />
    )
    const el = getXnElement(container)
    expect(el).not.toBeNull()
    expect(el!.style.color).toBe('rgb(255, 255, 255)')
  })

  it('multiplier=2 → 노랑 #FACC15', () => {
    const { container } = render(
      <MultiplierBurst multiplier={2} isVisible={true} onComplete={vi.fn()} />
    )
    const el = getXnElement(container)
    expect(el).not.toBeNull()
    expect(el!.style.color).toBe('rgb(250, 204, 21)')
  })

  it('multiplier=3 → 주황 #FB923C', () => {
    const { container } = render(
      <MultiplierBurst multiplier={3} isVisible={true} onComplete={vi.fn()} />
    )
    const el = getXnElement(container)
    expect(el).not.toBeNull()
    expect(el!.style.color).toBe('rgb(251, 146, 60)')
  })

  it('multiplier=4 → 빨강 #F87171', () => {
    const { container } = render(
      <MultiplierBurst multiplier={4} isVisible={true} onComplete={vi.fn()} />
    )
    const el = getXnElement(container)
    expect(el).not.toBeNull()
    expect(el!.style.color).toBe('rgb(248, 113, 113)')
  })

  it('multiplier=5 → 보라 #E879F9', () => {
    const { container } = render(
      <MultiplierBurst multiplier={5} isVisible={true} onComplete={vi.fn()} />
    )
    const el = getXnElement(container)
    expect(el).not.toBeNull()
    expect(el!.style.color).toBe('rgb(232, 121, 249)')
  })

  it('multiplier=10 → 보라 #E879F9 (x5+ 케이스)', () => {
    const { container } = render(
      <MultiplierBurst multiplier={10} isVisible={true} onComplete={vi.fn()} />
    )
    const el = getXnElement(container)
    expect(el).not.toBeNull()
    expect(el!.style.color).toBe('rgb(232, 121, 249)')
  })

  it('multiplier=0 → 흰색 (<=1 브랜치)', () => {
    const { container } = render(
      <MultiplierBurst multiplier={0} isVisible={true} onComplete={vi.fn()} />
    )
    const el = getXnElement(container)
    expect(el).not.toBeNull()
    expect(el!.style.color).toBe('rgb(255, 255, 255)')
  })

  it('multiplier=-1 → 흰색 (<=1 브랜치)', () => {
    const { container } = render(
      <MultiplierBurst multiplier={-1} isVisible={true} onComplete={vi.fn()} />
    )
    const el = getXnElement(container)
    expect(el).not.toBeNull()
    expect(el!.style.color).toBe('rgb(255, 255, 255)')
  })
})

// ────────────────────────────────────────────────
// 렌더링 — idle 상태
// ────────────────────────────────────────────────
describe('렌더링 — idle 상태', () => {
  it('isVisible=false → null 렌더 (container.firstChild === null)', () => {
    const { container } = render(
      <MultiplierBurst multiplier={2} isVisible={false} onComplete={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })
})

// ────────────────────────────────────────────────
// 렌더링 — burst 상태
// ────────────────────────────────────────────────
describe('렌더링 — burst 상태 (isVisible=true)', () => {
  it('xN 텍스트가 렌더된다', () => {
    const { container } = render(
      <MultiplierBurst multiplier={3} isVisible={true} onComplete={vi.fn()} />
    )
    const el = getXnElement(container)
    expect(el).not.toBeNull()
    expect(el!.textContent).toBe('x3')
  })

  it('COMBO BOOST 배지가 렌더된다', () => {
    const { getByText } = render(
      <MultiplierBurst multiplier={3} isVisible={true} onComplete={vi.fn()} />
    )
    expect(getByText('COMBO BOOST')).toBeTruthy()
  })

  it('파티클이 정확히 16개 렌더된다', () => {
    const { container } = render(
      <MultiplierBurst multiplier={3} isVisible={true} onComplete={vi.fn()} />
    )
    const particles = container.querySelectorAll('div[style*="border-radius: 50%"]')
    expect(particles.length).toBe(16)
  })

  it('루트 div에 pointerEvents: none이 적용된다', () => {
    const { container } = render(
      <MultiplierBurst multiplier={3} isVisible={true} onComplete={vi.fn()} />
    )
    const root = container.firstChild as HTMLElement
    expect(root.style.pointerEvents).toBe('none')
  })

  it('루트 div에 position: fixed가 적용된다', () => {
    const { container } = render(
      <MultiplierBurst multiplier={3} isVisible={true} onComplete={vi.fn()} />
    )
    const root = container.firstChild as HTMLElement
    expect(root.style.position).toBe('fixed')
  })

  it('루트 div에 zIndex: 100이 적용된다', () => {
    const { container } = render(
      <MultiplierBurst multiplier={3} isVisible={true} onComplete={vi.fn()} />
    )
    const root = container.firstChild as HTMLElement
    expect(root.style.zIndex).toBe('100')
  })
})

// ────────────────────────────────────────────────
// 타이머 — phase 전환
// ────────────────────────────────────────────────
describe('타이머 — phase 전환', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('1399ms 진행 → 오버레이 존재, onComplete 미호출', () => {
    const onComplete = vi.fn()
    const { container } = render(
      <MultiplierBurst multiplier={2} isVisible={true} onComplete={onComplete} />
    )
    act(() => { vi.advanceTimersByTime(1399) })
    expect(container.firstChild).not.toBeNull()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('1800ms 진행 → onComplete 1회 호출', () => {
    const onComplete = vi.fn()
    render(
      <MultiplierBurst multiplier={2} isVisible={true} onComplete={onComplete} />
    )
    act(() => { vi.advanceTimersByTime(1800) })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('1800ms 진행 → container.firstChild === null (phase=idle)', () => {
    const onComplete = vi.fn()
    const { container } = render(
      <MultiplierBurst multiplier={2} isVisible={true} onComplete={onComplete} />
    )
    act(() => { vi.advanceTimersByTime(1800) })
    expect(container.firstChild).toBeNull()
  })

  it('isVisible true→false 전환 → 즉시 null, 이후 타이머 소진해도 onComplete 미호출', () => {
    const onComplete = vi.fn()
    const { container, rerender } = render(
      <MultiplierBurst multiplier={2} isVisible={true} onComplete={onComplete} />
    )
    act(() => {
      rerender(<MultiplierBurst multiplier={2} isVisible={false} onComplete={onComplete} />)
    })
    expect(container.firstChild).toBeNull()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('isVisible 재활성화 (true→false→true) → 애니메이션 재시작, onComplete 두 번째 호출', () => {
    const onComplete = vi.fn()
    const { container, rerender } = render(
      <MultiplierBurst multiplier={2} isVisible={true} onComplete={onComplete} />
    )
    act(() => { vi.advanceTimersByTime(1800) })
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(container.firstChild).toBeNull()

    act(() => {
      rerender(<MultiplierBurst multiplier={2} isVisible={false} onComplete={onComplete} />)
    })
    act(() => {
      rerender(<MultiplierBurst multiplier={2} isVisible={true} onComplete={onComplete} />)
    })
    expect(container.firstChild).not.toBeNull()
    act(() => { vi.advanceTimersByTime(1800) })
    expect(onComplete).toHaveBeenCalledTimes(2)
  })
})
