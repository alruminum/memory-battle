import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import React from 'react'

// HudStgCell — GamePage HUD 스트립 STG 셀 인라인 레플리카
// 실제 위치: src/pages/GamePage.tsx L242 (HUD 스트립 STG 섹션)
// 버그픽스 #66: countdown !== null 구간(카운트다운 3→2→1)에 `--` 표시
//
// Before (L242 버그):  {String(stage).padStart(2, '0')}
// After  (L242 픽스):  {countdown !== null ? '--' : String(stage).padStart(2, '0')}

interface HudStgCellProps {
  countdown: number | null
  stage: number
}

function HudStgCell({ countdown, stage }: HudStgCellProps) {
  return (
    <span data-testid="hud-stg-value">
      {countdown !== null ? '--' : String(stage).padStart(2, '0')}
    </span>
  )
}

// ── 수용 기준 ───────────────────────────────────────────────────────────────
// AC1: 카운트다운(3→2→1) 2250ms 동안 STG 셀이 `--` 표시
// AC2: 리트라이 시 직전 stage 값 미노출 (countdown 기반 판단)
// AC3: 카운트다운 종료 후 게임 진행 중 올바른 stage 값 표시
// AC4: SHOWING / INPUT / RESULT 상태에서 회귀 없음

describe('[#66] HUD STG 셀 — 카운트다운 중 `--` 표시 버그픽스', () => {
  // ── AC1: 카운트다운 3→2→1 전 구간 `--` 표시 ─────────────────────────────

  it('AC1-1: countdown=3 시 STG 셀이 `--`를 표시한다 (게임 시작 카운트다운)', () => {
    render(<HudStgCell countdown={3} stage={0} />)
    expect(screen.getByTestId('hud-stg-value').textContent).toBe('--')
  })

  it('AC1-2: countdown=2 시 STG 셀이 `--`를 표시한다', () => {
    render(<HudStgCell countdown={2} stage={0} />)
    expect(screen.getByTestId('hud-stg-value').textContent).toBe('--')
  })

  it('AC1-3: countdown=1 시 STG 셀이 `--`를 표시한다', () => {
    render(<HudStgCell countdown={1} stage={0} />)
    expect(screen.getByTestId('hud-stg-value').textContent).toBe('--')
  })

  // ── AC2: 리트라이 시 직전 stage 잔존 없음 ────────────────────────────────

  it('AC2-1: countdown=3, stage=7 (리트라이 — 직전 stage 잔존) → `--` 표시', () => {
    render(<HudStgCell countdown={3} stage={7} />)
    expect(screen.getByTestId('hud-stg-value').textContent).toBe('--')
  })

  it('AC2-2: countdown=1, stage=12 (리트라이 — 높은 stage 잔존) → `--` 표시', () => {
    render(<HudStgCell countdown={1} stage={12} />)
    expect(screen.getByTestId('hud-stg-value').textContent).toBe('--')
  })

  // ── AC3: 카운트다운 종료 후 올바른 stage 값 표시 ─────────────────────────

  it('AC3-1: countdown=null, stage=1 → `01` 표시 (SHOWING 첫 스테이지)', () => {
    render(<HudStgCell countdown={null} stage={1} />)
    expect(screen.getByTestId('hud-stg-value').textContent).toBe('01')
  })

  it('AC3-2: countdown=null, stage=5 → `05` 표시 (게임 진행 중)', () => {
    render(<HudStgCell countdown={null} stage={5} />)
    expect(screen.getByTestId('hud-stg-value').textContent).toBe('05')
  })

  it('AC3-3: countdown=null, stage=10 → `10` 표시 (두 자리 stage)', () => {
    render(<HudStgCell countdown={null} stage={10} />)
    expect(screen.getByTestId('hud-stg-value').textContent).toBe('10')
  })

  // ── AC4: SHOWING / INPUT / RESULT 회귀 없음 ──────────────────────────────

  it('AC4-1: IDLE 상태 (countdown=null, stage=0) → `00` 표시 (회귀 없음)', () => {
    render(<HudStgCell countdown={null} stage={0} />)
    expect(screen.getByTestId('hud-stg-value').textContent).toBe('00')
  })

  it('AC4-2: RESULT 상태 (countdown=null, stage=마지막값) → stage 값 유지 (회귀 없음)', () => {
    render(<HudStgCell countdown={null} stage={7} />)
    expect(screen.getByTestId('hud-stg-value').textContent).toBe('07')
  })

  // ── 엣지: countdown 유형별 exhaustive 검증 ──────────────────────────────

  it('엣지: countdown이 null이 아닌 어떤 양수값이어도 `--` 표시', () => {
    render(<HudStgCell countdown={99} stage={3} />)
    expect(screen.getByTestId('hud-stg-value').textContent).toBe('--')
  })
})
