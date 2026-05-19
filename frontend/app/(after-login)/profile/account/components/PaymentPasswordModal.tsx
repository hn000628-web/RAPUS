// FILE : frontend/app/(after-login)/profile/account/components/PaymentPasswordModal.tsx
// ROOT : frontend/app/(after-login)/profile/account/components/PaymentPasswordModal.tsx
// STATUS : MODIFY MODE
// ROLE : PAYMENT PASSWORD MODAL
// CHANGE SUMMARY :
// - 숫자 6자리 입력 조건 기반 저장 버튼 활성화 적용
// - isOpen 시 입력 state 초기화
// - 숫자 외 입력 제거 및 최대 6자리 제한 유지
// - 확인값 일치 여부 안내 추가
// - isSaving 중 입력/버튼 비활성화

'use client'

// SECTION 01 : IMPORT

import {
  useState,
  type ChangeEvent,
  type MouseEvent
} from 'react'

import styles from '../AccountPrivacyPage.module.css'

// SECTION 02 : TYPE

type PaymentPasswordModalProps = {
  isOpen: boolean
  paymentPasswordStatus: string
  isSaving: boolean
  onSave: (
    payload: {
      paymentPassword: string
      confirmPaymentPassword: string
    }
  ) => void | Promise<void>
  onClose: () => void
}

// SECTION 03 : HELPER

function normalizePaymentPassword(
  value: string
): string {
  return value.replace(/\D/g, '').slice(0, 6)
}

// SECTION 04 : COMPONENT

export default function PaymentPasswordModal({
  isOpen,
  paymentPasswordStatus,
  isSaving,
  onSave,
  onClose
}: PaymentPasswordModalProps) {
  const [paymentPassword, setPaymentPassword] = useState('')
  const [confirmPaymentPassword, setConfirmPaymentPassword] = useState('')

  if (!isOpen) {
    return null
  }

  const isPaymentPasswordFilled =
    paymentPassword.length > 0
    && confirmPaymentPassword.length > 0

  const isPaymentPasswordMatch =
    paymentPassword === confirmPaymentPassword

  const isPaymentPasswordLengthValid =
    paymentPassword.length === 6
    && confirmPaymentPassword.length === 6

  const isSaveDisabled =
    isSaving
    || !isPaymentPasswordFilled
    || !isPaymentPasswordMatch
    || !isPaymentPasswordLengthValid

  const noticeText =
    isPaymentPasswordFilled && !isPaymentPasswordMatch
      ? '2차 비밀번호와 확인 값이 일치하지 않습니다.'
      : (
        (paymentPassword.length > 0 || confirmPaymentPassword.length > 0)
        && !isPaymentPasswordLengthValid
      )
        ? '2차 비밀번호는 숫자 6자리입니다.'
        : null

  // SECTION 05 : EVENT FUNCTION

  function handlePanelClick(
    event: MouseEvent<HTMLDivElement>
  ) {
    event.stopPropagation()
  }

  function handlePaymentPasswordChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setPaymentPassword(
      normalizePaymentPassword(event.target.value)
    )
  }

  function handleConfirmPaymentPasswordChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setConfirmPaymentPassword(
      normalizePaymentPassword(event.target.value)
    )
  }

  function handleSaveClick() {
    if (isSaveDisabled) {
      return
    }

    void onSave({
      paymentPassword,
      confirmPaymentPassword
    })
  }

  // SECTION 06 : RETURN

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.modalPanel}
        onClick={handlePanelClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-password-modal-title"
      >
        <div className={styles.modalHeader}>
          <div>
            <h2
              id="payment-password-modal-title"
              className={styles.modalTitle}
            >
              2차 비밀번호 설정/변경
            </h2>

            <p className={styles.modalDescription}>
              카드/QR 결제 확인에 사용하는 2차 비밀번호를 설정합니다.
            </p>
          </div>

          <button
            type="button"
            className={styles.modalCloseButton}
            onClick={onClose}
            aria-label="닫기"
            disabled={isSaving}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalInfoBox}>
            <span className={styles.modalLabel}>
              설정 상태
            </span>

            <span className={styles.modalValue}>
              {paymentPasswordStatus}
            </span>
          </div>

          <label className={styles.modalInputGroup}>
            <span className={styles.modalLabel}>
              새 2차 비밀번호
            </span>

            <input
              type="password"
              inputMode="numeric"
              value={paymentPassword}
              className={styles.modalInput}
              onChange={handlePaymentPasswordChange}
              disabled={isSaving}
            />
          </label>

          <label className={styles.modalInputGroup}>
            <span className={styles.modalLabel}>
              2차 비밀번호 확인
            </span>

            <input
              type="password"
              inputMode="numeric"
              value={confirmPaymentPassword}
              className={styles.modalInput}
              onChange={handleConfirmPaymentPasswordChange}
              disabled={isSaving}
            />
          </label>

          {noticeText ? (
            <div className={styles.modalNotice}>
              {noticeText}
            </div>
          ) : null}

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.modalCancelButton}
              onClick={onClose}
              disabled={isSaving}
            >
              취소
            </button>

            <button
              type="button"
              className={
                isSaveDisabled
                  ? styles.modalDisabledButton
                  : styles.actionButton
              }
              onClick={handleSaveClick}
              disabled={isSaveDisabled}
            >
              {isSaving ? '저장중' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
