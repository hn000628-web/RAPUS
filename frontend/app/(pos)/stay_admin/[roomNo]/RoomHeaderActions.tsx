'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'
import type { RoomUseType } from '@/lib/business/pos/roomsApi'
import styles from './RoomDetailPage.module.css'
import CheckInModal, { CheckInModalSubmitPayload } from './CheckInModal'

type RoomHeaderActionsProps = {
  roomNo: string
  initialUsageType: RoomUseType
  canCheckIn: boolean
  isCheckInSubmitting: boolean
  checkInErrorMessage: string
  canCompleteCleaning: boolean
  isCleaningSubmitting: boolean
  onCompleteCleaning: () => Promise<void>
  onSubmitCheckIn: (payload: CheckInModalSubmitPayload) => Promise<void>
}

export default function RoomHeaderActions({
  roomNo,
  initialUsageType,
  canCheckIn,
  isCheckInSubmitting,
  checkInErrorMessage,
  canCompleteCleaning,
  isCleaningSubmitting,
  onCompleteCleaning,
  onSubmitCheckIn
}: RoomHeaderActionsProps) {
  const [isQrOrderModalOpen, setIsQrOrderModalOpen] = useState(false)
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false)

  return (
    <>
      <div className={styles.headerActions}>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={() => setIsCheckInModalOpen(true)}
        >
          체크인
        </button>

        <button
          className={styles.primaryButton}
          type="button"
          onClick={() => setIsQrOrderModalOpen(true)}
        >
          QR오더
        </button>

        <button
          className={styles.secondaryButton}
          type="button"
        >
          연장
        </button>

        <button
          className={styles.secondaryButton}
          type="button"
          disabled={!canCompleteCleaning || isCleaningSubmitting}
          style={!canCompleteCleaning || isCleaningSubmitting ? disabledSecondaryStyle : undefined}
          onClick={() => {
            void onCompleteCleaning()
          }}
        >
          {isCleaningSubmitting ? '처리 중..' : '청소완료'}
        </button>
      </div>

      <CheckInModal
        open={isCheckInModalOpen}
        roomNo={roomNo}
        initialUsageType={initialUsageType}
        canSubmitCheckIn={canCheckIn}
        isSubmitting={isCheckInSubmitting}
        submitErrorMessage={checkInErrorMessage}
        onClose={() => setIsCheckInModalOpen(false)}
        onSubmit={async (payload) => {
          try {
            await onSubmitCheckIn(payload)
            setIsCheckInModalOpen(false)
          } catch {
            // 페이지에서 에러 상태를 관리하며 모달은 연 상태를 유지한다.
          }
        }}
      />

      {isQrOrderModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="room-qr-order-modal-title"
          style={modalOverlayStyle}
          onClick={() => setIsQrOrderModalOpen(false)}
        >
          <div
            style={modalPanelStyle}
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="room-qr-order-modal-title"
              style={modalTitleStyle}
            >
              객실 {roomNo} QR오더
            </h2>

            <p style={modalDescriptionStyle}>
              고객이 QR을 스캔하면 룸서비스 메뉴표로 이동합니다.
            </p>

            <div style={mockQrWrapStyle}>
              <div style={mockQrGridStyle}>
                <span style={mockQrLabelStyle}>QR 목업</span>
              </div>
            </div>

            <div style={modalActionRowStyle}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => setIsQrOrderModalOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  zIndex: 1000
}

const modalPanelStyle: CSSProperties = {
  width: 'min(440px, 100%)',
  borderRadius: 14,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)',
  padding: 18,
  boxSizing: 'border-box'
}

const modalTitleStyle: CSSProperties = {
  margin: 0,
  color: '#111827',
  fontSize: 20,
  fontWeight: 900,
  letterSpacing: '-0.02em'
}

const modalDescriptionStyle: CSSProperties = {
  margin: '10px 0 14px',
  color: '#4b5563',
  fontSize: 14,
  fontWeight: 700
}

const mockQrWrapStyle: CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 12,
  padding: 14,
  background: '#f8fafc'
}

const mockQrGridStyle: CSSProperties = {
  width: 180,
  height: 180,
  margin: '0 auto',
  borderRadius: 12,
  background:
    'repeating-linear-gradient(45deg, #111827 0 8px, #f8fafc 8px 16px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const mockQrLabelStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.92)',
  color: '#111827',
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 900
}

const modalActionRowStyle: CSSProperties = {
  marginTop: 14,
  display: 'flex',
  justifyContent: 'flex-end'
}

const disabledSecondaryStyle: CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed'
}
