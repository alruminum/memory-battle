/**
 * index.css coinFloatUp keyframe / .coin-float-up 클래스 존재 확인 (impl 07)
 * impl: docs/milestones/v04/epics/epic-12-coin-v04/impl/07-coin-ui-polish.md
 * issue: #113
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const cssContent = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf-8')

describe('index.css — coinFloatUp keyframe (impl 07)', () => {
  it('TC-13 | `@keyframes coinFloatUp` 정의가 존재함', () => {
    expect(cssContent).toContain('@keyframes coinFloatUp')
  })

  it('TC-14 | `.coin-float-up` 클래스가 존재함', () => {
    expect(cssContent).toContain('.coin-float-up')
  })

  it('TC-15 | `.coin-float-up` animation duration이 1.2s', () => {
    // ".coin-float-up { animation: coinFloatUp 1.2s ..." 패턴 확인
    expect(cssContent).toMatch(/\.coin-float-up\s*\{[^}]*1\.2s/)
  })
})
