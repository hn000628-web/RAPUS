'use client'

import { useEffect, useMemo, useState } from 'react'
import type { RoomCheckInInputType, RoomUseType } from '@/lib/business/pos/roomsApi'
import styles from './RoomDetailPage.module.css'

type CheckInEntryMode = RoomCheckInInputType

export type CheckInModalSubmitPayload = {
  useType: RoomUseType
  inputType: RoomCheckInInputType
  guestName: string | null
  guestPhone: string | null
  vehicleNumber: string | null
  guestCount: number | null
  memo: string | null
  qrReferenceCode: string | null
  expectedCheckOutAt: string | null
}

type CheckInModalProps = {
  open: boolean
  roomNo: string
  initialUsageType: RoomUseType
  canSubmitCheckIn: boolean
  isSubmitting: boolean
  submitErrorMessage: string
  onClose: () => void
  onSubmit: (payload: CheckInModalSubmitPayload) => Promise<void>
}

export default function CheckInModal({
  open,
  roomNo,
  initialUsageType,
  canSubmitCheckIn,
  isSubmitting,
  submitErrorMessage,
  onClose,
  onSubmit
}: CheckInModalProps) {
  const [usageType, setUsageType] = useState<RoomUseType>(initialUsageType)
  const [entryMode, setEntryMode] = useState<CheckInEntryMode>('QR')
  const [memo, setMemo] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [carNumber, setCarNumber] = useState('')
  const [peopleCount, setPeopleCount] = useState('')
  const [noInfoConfirmed, setNoInfoConfirmed] = useState(false)

  const usageTypeLabel = useMemo(
    () => (usageType === 'STAY' ? '숙박' : '대실'),
    [usageType]
  )

  useEffect(() => {
    if (!open) {
      return
    }

    setUsageType(initialUsageType)
    setEntryMode('QR')
    setMemo('')
    setCustomerName('')
    setCustomerPhone('')
    setCarNumber('')
    setPeopleCount('')
    setNoInfoConfirmed(false)
  }, [open, initialUsageType])

  if (!open) {
    return null
  }

  const canSubmit =
    canSubmitCheckIn &&
    !isSubmitting &&
    (entryMode !== 'NONE' || noInfoConfirmed)

  const normalizedGuestCount = (() => {
    const trimmed = peopleCount.trim()

    if (!trimmed) {
      return null
    }

    const parsed = Number(trimmed)

    if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 0) {
      return null
    }

    return Math.floor(parsed)
  })()

  const buildSubmitPayload = (): CheckInModalSubmitPayload => ({
    useType: usageType,
    inputType: entryMode,
    guestName: customerName.trim() ? customerName.trim() : null,
    guestPhone: customerPhone.trim() ? customerPhone.trim() : null,
    vehicleNumber: carNumber.trim() ? carNumber.trim() : null,
    guestCount: normalizedGuestCount,
    memo: memo.trim() ? memo.trim() : null,
    qrReferenceCode: null,
    expectedCheckOutAt: null
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="check-in-modal-title"
      style={overlayStyle}
      onClick={onClose}
    >
      <div
        style={panelStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="check-in-modal-title" style={titleStyle}>
          객실 {roomNo} 체크인
        </h2>

        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>이용 유형 선택</h3>
          <div style={chipRowStyle}>
            <button
              type="button"
              className={usageType === 'STAY' ? styles.primaryButton : styles.secondaryButton}
              onClick={() => setUsageType('STAY')}
            >
              숙박
            </button>
            <button
              type="button"
              className={usageType === 'SHORT_STAY' ? styles.primaryButton : styles.secondaryButton}
              onClick={() => setUsageType('SHORT_STAY')}
            >
              대실
            </button>
          </div>
          <p style={hintStyle}>현재 선택: {usageTypeLabel}</p>
        </section>

        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>정보 입력 방식 선택</h3>
          <div style={chipRowStyle}>
            {(['QR', 'PHOTO', 'MANUAL', 'NONE'] as CheckInEntryMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={entryMode === mode ? styles.primaryButton : styles.secondaryButton}
                onClick={() => setEntryMode(mode)}
              >
                {mode === 'QR' && 'QR'}
                {mode === 'PHOTO' && '사진'}
                {mode === 'MANUAL' && '수기'}
                {mode === 'NONE' && '정보없음'}
              </button>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          {entryMode === 'QR' ? (
            <>
              <p style={hintStyle}>예약/고객 QR을 확인한 후 체크인합니다.</p>
              <div style={mockQrAreaStyle}>QR 확인 목업 영역</div>
            </>
          ) : null}

          {entryMode === 'PHOTO' ? (
            <>
              <p style={hintStyle}>신분증/예약확인/차량번호 등 사진을 등록할 수 있습니다.</p>
              <div style={mockUploadStyle}>
                <button type="button" className={styles.secondaryButton}>사진 선택</button>
                <span style={hintStyle}>선택된 파일 없음(목업)</span>
              </div>
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                placeholder="메모 입력(선택)"
                style={textareaStyle}
              />
            </>
          ) : null}

          {entryMode === 'MANUAL' ? (
            <div style={manualGridStyle}>
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="고객명"
                style={inputStyle}
              />
              <input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="연락처"
                style={inputStyle}
              />
              <input
                value={carNumber}
                onChange={(event) => setCarNumber(event.target.value)}
                placeholder="차량번호"
                style={inputStyle}
              />
              <input
                value={peopleCount}
                onChange={(event) => setPeopleCount(event.target.value)}
                placeholder="인원수"
                style={inputStyle}
              />
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                placeholder="메모"
                style={textareaStyle}
              />
            </div>
          ) : null}

          {entryMode === 'NONE' ? (
            <>
              <p style={hintStyle}>고객 정보 없이 바로 체크인 처리합니다.</p>
              <label style={checkboxRowStyle}>
                <input
                  type="checkbox"
                  checked={noInfoConfirmed}
                  onChange={(event) => setNoInfoConfirmed(event.target.checked)}
                />
                정보 없이 체크인을 진행하는 것을 확인했습니다.
              </label>
            </>
          ) : null}
        </section>

        {!canSubmitCheckIn ? (
          <p style={errorMessageStyle}>
            객실 정보를 확인한 뒤 체크인을 진행해 주세요.
          </p>
        ) : null}

        {submitErrorMessage ? (
          <p style={errorMessageStyle}>
            {submitErrorMessage}
          </p>
        ) : null}

        <div style={footerActionStyle}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={!canSubmit}
            style={!canSubmit ? disabledStyle : undefined}
            onClick={async () => {
              if (!canSubmit) {
                return
              }

              await onSubmit(buildSubmitPayload())
            }}
          >
            {isSubmitting ? '처리 중...' : '체크인 처리'}
          </button>
        </div>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  zIndex: 1100
}

const panelStyle: React.CSSProperties = {
  width: 'min(680px, 100%)',
  maxHeight: '90vh',
  overflowY: 'auto',
  borderRadius: 14,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)',
  padding: 18,
  boxSizing: 'border-box'
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#111827',
  fontSize: 22,
  fontWeight: 900
}

const sectionStyle: React.CSSProperties = {
  marginTop: 14,
  paddingTop: 10,
  borderTop: '1px solid #e5e7eb'
}

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#111827',
  fontSize: 16,
  fontWeight: 900
}

const chipRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: 10
}

const hintStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700
}

const mockQrAreaStyle: React.CSSProperties = {
  marginTop: 10,
  minHeight: 140,
  borderRadius: 12,
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#334155',
  fontWeight: 800
}

const mockUploadStyle: React.CSSProperties = {
  marginTop: 10,
  minHeight: 96,
  borderRadius: 12,
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: 12
}

const manualGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  marginTop: 10
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  padding: '0 12px',
  fontSize: 14,
  boxSizing: 'border-box'
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 90,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  padding: 10,
  fontSize: 14,
  boxSizing: 'border-box',
  resize: 'vertical'
}

const checkboxRowStyle: React.CSSProperties = {
  marginTop: 10,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#334155',
  fontSize: 14,
  fontWeight: 700
}

const footerActionStyle: React.CSSProperties = {
  marginTop: 16,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  flexWrap: 'wrap'
}

const disabledStyle: React.CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed'
}

const errorMessageStyle: React.CSSProperties = {
  margin: '12px 0 0',
  color: '#b91c1c',
  fontSize: 13,
  fontWeight: 800
}
