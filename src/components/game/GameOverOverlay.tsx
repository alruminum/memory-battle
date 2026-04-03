import type { GameOverReason } from '../../store/gameStore'

interface GameOverOverlayProps {
  reason: Exclude<GameOverReason, null>
  onConfirm: () => void
}

const TEXTS = {
  timeout: {
    title: '타임오버',
    desc: '제한시간 내에 입력하지 못했어요',
  },
  wrong: {
    title: '잘못된 입력',
    desc: '틀린 버튼을 눌렀어요',
  },
} as const

export function GameOverOverlay({ reason, onConfirm }: GameOverOverlayProps): JSX.Element {
  const { title, desc } = TEXTS[reason]

  return (
    // backgroundColor는 .gameover-backdrop CSS 클래스에서만 관리 (C-2 권고: 인라인 제거)
    // @supports backdrop-filter 분기를 인라인 style로 처리 불가 → CSS 클래스 전용
    <div
      onClick={onConfirm}
      className="gameover-backdrop"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* 바텀 패널: 슬라이드업 애니메이션 */}
      <div
        className="gameover-panel"
        style={{
          backgroundColor: 'var(--vb-surface)',
          borderTop: '1px solid var(--vb-border)',
          borderRadius: '16px 16px 0 0',
          padding: '28px 24px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* 핸들바 */}
        <div style={{
          width: 32,
          height: 4,
          backgroundColor: 'var(--vb-text-dim)',
          borderRadius: 2,
          margin: '0 auto 12px',
        }} />

        {/* 경고 아이콘 */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,59,59,0.15)',
          border: '1px solid rgba(255,59,59,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          marginBottom: 12,
        }}>
          ⚠
        </div>

        {/* GAME OVER 타이틀 */}
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 13,
          color: 'var(--vb-text-dim)',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          GAME OVER
        </div>

        {/* 제목 */}
        <div style={{
          fontFamily: 'var(--vb-font-score)',
          fontSize: 28,
          fontWeight: 900,
          color: 'var(--vb-accent)',
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}>
          {title}
        </div>

        {/* 설명 */}
        <div style={{
          fontFamily: 'var(--vb-font-body)',
          fontSize: 14,
          color: 'var(--vb-text-mid)',
        }}>
          {desc}
        </div>

        {/* 힌트 */}
        <div style={{
          fontFamily: 'var(--vb-font-body)',
          fontSize: 12,
          color: 'var(--vb-text-dim)',
          marginTop: 20,
        }}>
          화면을 탭하여 계속
        </div>
      </div>
    </div>
  )
}
