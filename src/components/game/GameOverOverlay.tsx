import React, { useState, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useCoin } from '../../hooks/useCoin'
import { RevivalButton } from './RevivalButton'
import type { GameOverReason } from '../../store/gameStore'

interface GameOverOverlayProps {
  reason: Exclude<GameOverReason, null>
  // [v0.4 F4] 코인 관련 props 추가
  coinBalance: number      // store.coinBalance 전달 (GamePage에서 구독)
  revivalUsed: boolean     // store.revivalUsed 전달 (GamePage에서 구독)
  onConfirm: () => void    // 기존 유지 — "화면을 탭하여 계속" → ResultPage 이동
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

export function GameOverOverlay({ reason, coinBalance, revivalUsed, onConfirm }: GameOverOverlayProps): JSX.Element {
  const { revive } = useGameStore()
  const { addCoins } = useCoin()
  const [isProcessing, setIsProcessing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { title, desc } = TEXTS[reason]

  function showToastMsg(msg: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(msg)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  async function handleRevive(e: React.PointerEvent) {
    e.stopPropagation()  // onConfirm 버블링 차단
    if (isProcessing) return
    setIsProcessing(true)
    try {
      // 1. 코인 차감 (DB 원자 처리) — 성공 시에만 revive()
      await addCoins(-5, 'revival')
      // 2. store 상태 전환: RESULT → SHOWING, sequence=[], revivalUsed=true
      // revive() 호출 후 status='SHOWING' → GameOverOverlay 렌더 조건(status==='RESULT') false
      // → overlay 자동 소멸 → GamePage가 새 시퀀스를 렌더. setIsProcessing(false) 불필요.
      revive()
    } catch (err) {
      console.error('[revival] addCoins failed:', err)
      showToastMsg('코인 차감 중 오류가 발생했습니다')
      setIsProcessing(false)  // 실패 시에만 isProcessing 해제 (성공 시 컴포넌트가 소멸)
    }
  }

  return (
    // backgroundColor는 .gameover-backdrop CSS 클래스에서만 관리 (C-2 권고: 인라인 제거)
    // @supports backdrop-filter 분기를 인라인 style로 처리 불가 → CSS 클래스 전용
    <div
      onPointerDown={onConfirm}
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

        {/* [v0.4 F4] 부활 버튼 — 힌트 텍스트 위에 배치 */}
        <div style={{ width: '100%', marginTop: 16 }}>
          <RevivalButton
            coinBalance={coinBalance}
            revivalUsed={revivalUsed}
            isProcessing={isProcessing}
            onRevive={handleRevive}
          />
        </div>

        {/* 힌트: 부활 버튼이 있어도 탭으로 결과 화면 이동 가능함을 안내 */}
        <div style={{
          fontFamily: 'var(--vb-font-body)',
          fontSize: 12,
          color: 'var(--vb-text-dim)',
          marginTop: 12,
        }}>
          화면을 탭하여 결과 보기
        </div>

        {/* 토스트 (addCoins 실패 시) */}
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--vb-toast-bg)',
            color: 'var(--vb-text)',
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'var(--vb-font-body)',
            zIndex: 300,
            border: '1px solid var(--vb-border)',
          }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
