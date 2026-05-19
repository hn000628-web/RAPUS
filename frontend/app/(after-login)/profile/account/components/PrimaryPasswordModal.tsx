'use client'

import {
  useEffect,
  useState,
  type ChangeEvent,
  type MouseEvent
} from 'react'

import styles from '../AccountPrivacyPage.module.css'

type PrimaryPasswordModalProps = {
  isOpen: boolean
  isSaving: boolean
  onSave: (
    payload: {
      newPassword: string
      confirmPassword: string
    }
  ) => void | Promise<void>
  onClose: () => void
}

export default function PrimaryPasswordModal({
  isOpen,
  isSaving,
  onSave,
  onClose
}: PrimaryPasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [secondPassword, setSecondPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (isOpen) {
      return
    }

    setCurrentPassword('')
    setSecondPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const trimmedCurrentPassword = currentPassword.trim()
  const trimmedSecondPassword = secondPassword.trim()
  const trimmedNewPassword = newPassword.trim()
  const trimmedConfirmPassword = confirmPassword.trim()

  const isAllRequiredFilled =
    trimmedCurrentPassword.length > 0 &&
    trimmedSecondPassword.length > 0 &&
    trimmedNewPassword.length > 0 &&
    trimmedConfirmPassword.length > 0

  const isPasswordMatch = trimmedNewPassword === trimmedConfirmPassword
  const isPasswordLengthValid = trimmedNewPassword.length >= 4
  const showPasswordMatchMessage =
    trimmedNewPassword.length > 0 && trimmedConfirmPassword.length > 0

  const isSaveDisabled =
    isSaving ||
    !isAllRequiredFilled ||
    !isPasswordMatch ||
    !isPasswordLengthValid

  const noticeText =
    isAllRequiredFilled && !isPasswordMatch
      ? '새 비밀번호와 새 비밀번호 확인 값이 일치하지 않습니다.'
      : trimmedNewPassword.length > 0 && !isPasswordLengthValid
        ? '새 비밀번호는 최소 4자 이상 입력해주세요.'
        : null

  function handlePanelClick(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation()
  }

  function handleCurrentPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setCurrentPassword(event.target.value)
  }

  function handleSecondPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setSecondPassword(event.target.value)
  }

  function handleNewPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setNewPassword(event.target.value)
  }

  function handleConfirmPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setConfirmPassword(event.target.value)
  }

  function handleClose() {
    setCurrentPassword('')
    setSecondPassword('')
    setNewPassword('')
    setConfirmPassword('')
    onClose()
  }

  function handleSaveClick() {
    if (isSaveDisabled) {
      return
    }

    void onSave({
      newPassword: trimmedNewPassword,
      confirmPassword: trimmedConfirmPassword
    })
  }

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleClose}
      role="presentation"
    >
      <div
        className={styles.modalPanel}
        onClick={handlePanelClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="primary-password-modal-title"
      >
        <div className={styles.modalHeader}>
          <div>
            <h2
              id="primary-password-modal-title"
              className={styles.modalTitle}
            >
              1차 비밀번호 변경
            </h2>

            <p className={styles.modalDescription}>
              현재 비밀번호와 2차 비밀번호 확인 후 1차 비밀번호를 변경합니다.
            </p>
          </div>

          <button
            type="button"
            className={styles.modalCloseButton}
            onClick={handleClose}
            aria-label="닫기"
            disabled={isSaving}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <label className={styles.modalInputGroup}>
            <span className={styles.modalLabel}>
              현재 비밀번호
            </span>

            <input
              type="password"
              value={currentPassword}
              className={styles.modalInput}
              onChange={handleCurrentPasswordChange}
              disabled={isSaving}
            />
          </label>

          <label className={styles.modalInputGroup}>
            <span className={styles.modalLabel}>
              2차 비밀번호
            </span>

            <input
              type="password"
              value={secondPassword}
              className={styles.modalInput}
              onChange={handleSecondPasswordChange}
              disabled={isSaving}
            />
          </label>

          <label className={styles.modalInputGroup}>
            <span className={styles.modalLabel}>
              새 비밀번호
            </span>

            <input
              type="password"
              value={newPassword}
              className={styles.modalInput}
              onChange={handleNewPasswordChange}
              disabled={isSaving}
            />
          </label>

          <label className={styles.modalInputGroup}>
            <span className={styles.modalLabel}>
              새 비밀번호 확인
            </span>

            <input
              type="password"
              value={confirmPassword}
              className={styles.modalInput}
              onChange={handleConfirmPasswordChange}
              disabled={isSaving}
            />
          </label>

          {showPasswordMatchMessage ? (
            <p
              className={
                isPasswordMatch
                  ? `${styles.passwordMatchMessage} ${styles.passwordMatchSuccess}`
                  : `${styles.passwordMatchMessage} ${styles.passwordMatchError}`
              }
            >
              {isPasswordMatch ? '일치됨' : '불일치'}
            </p>
          ) : null}

          {noticeText ? (
            <div className={styles.modalNotice}>
              {noticeText}
            </div>
          ) : null}

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.modalCancelButton}
              onClick={handleClose}
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
              {isSaving ? '변경중' : '변경'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
