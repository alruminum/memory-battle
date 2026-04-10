/**
 * color-scheme-fix.test.ts
 * 회귀 테스트 — issue #87
 *
 * index.html / src/index.css 에 `color-scheme: dark` 선언이 실제로 존재하는지
 * 파일을 직접 읽어 검증한다. 이 테스트가 깨지면 UA 강제 invert 필터 버그가 재현됨.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const ROOT = resolve(__dirname, '../..')

describe('color-scheme 선언 회귀 테스트 (issue #87)', () => {
  // ── index.html ───────────────────────────────────────────────────
  describe('index.html', () => {
    const html = readFileSync(resolve(ROOT, 'index.html'), 'utf-8')

    it('<meta name="color-scheme" content="dark"> 태그가 존재한다', () => {
      expect(html).toMatch(/name="color-scheme"/)
    })

    it('content 값이 "dark"이다', () => {
      expect(html).toMatch(/name="color-scheme"\s+content="dark"/)
    })

    it('<head> 안에 선언되어 있다 (파싱 단계 즉시 적용)', () => {
      const headSection = html.slice(0, html.indexOf('</head>'))
      expect(headSection).toMatch(/name="color-scheme"/)
    })
  })

  // ── src/index.css ─────────────────────────────────────────────────
  describe('src/index.css', () => {
    const css = readFileSync(resolve(ROOT, 'src/index.css'), 'utf-8')

    it(':root 블록에 color-scheme: dark 선언이 존재한다', () => {
      const rootBlock = css.match(/:root\s*\{([^}]+)\}/)
      expect(rootBlock).not.toBeNull()
      expect(rootBlock![1]).toMatch(/color-scheme\s*:\s*dark/)
    })

    it('color-scheme 선언이 UA 필터를 차단하는 dark 값이다', () => {
      expect(css).toMatch(/color-scheme\s*:\s*dark/)
    })
  })
})
