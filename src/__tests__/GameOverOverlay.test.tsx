import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GameOverOverlay } from '../components/game/GameOverOverlay'

describe('GameOverOverlay — 이벤트 핸들러', () => {
  it('pointerdown 이벤트 발생 시 onConfirm이 호출된다 (wrong reason)', () => {
    const onConfirm = vi.fn()
    const { container } = render(
      <GameOverOverlay reason="wrong" onConfirm={onConfirm} />
    )
    const backdrop = container.firstChild as HTMLElement
    fireEvent.pointerDown(backdrop)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('pointerdown 이벤트 발생 시 onConfirm이 호출된다 (timeout reason)', () => {
    const onConfirm = vi.fn()
    const { container } = render(
      <GameOverOverlay reason="timeout" onConfirm={onConfirm} />
    )
    const backdrop = container.firstChild as HTMLElement
    fireEvent.pointerDown(backdrop)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('click 이벤트로는 onConfirm이 호출되지 않는다', () => {
    const onConfirm = vi.fn()
    const { container } = render(
      <GameOverOverlay reason="wrong" onConfirm={onConfirm} />
    )
    const backdrop = container.firstChild as HTMLElement
    // onClick 핸들러가 없으므로 click 이벤트만으로는 호출되지 않아야 한다
    fireEvent.click(backdrop)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('pointerdown 이후 추가 click이 와도 onConfirm은 1회만 호출된다', () => {
    const onConfirm = vi.fn()
    const { container } = render(
      <GameOverOverlay reason="wrong" onConfirm={onConfirm} />
    )
    const backdrop = container.firstChild as HTMLElement
    fireEvent.pointerDown(backdrop)
    fireEvent.click(backdrop)
    // onClick 핸들러 없음 → click분은 카운트 안됨 → pointerDown 1회만
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('backdrop이 gameover-backdrop 클래스를 갖는다', () => {
    const { container } = render(
      <GameOverOverlay reason="wrong" onConfirm={vi.fn()} />
    )
    const backdrop = container.firstChild as HTMLElement
    expect(backdrop.classList.contains('gameover-backdrop')).toBe(true)
  })
})
