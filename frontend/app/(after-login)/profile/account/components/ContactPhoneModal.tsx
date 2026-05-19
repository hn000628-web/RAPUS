// FILE : frontend/app/(after-login)/profile/account/components/ContactPhoneModal.tsx
// ROOT : frontend/app/(after-login)/profile/account/components/ContactPhoneModal.tsx
// STATUS : MODIFY MODE
// ROLE : DEFAULT CONTACT PHONE MODAL
// CHANGE SUMMARY :
// - 기존값과 입력값 비교 기반 저장 버튼 활성화 적용
// - isOpen 시 입력 state 초기화
// - 빈 문자열은 null로 normalize 후 저장
// - isSaving 중 입력/버튼 비활성화
// - 저장 로직은 onSave handler 위임 유지

'use client'

// SECTION 01 : IMPORT

import {
  useState,
  type ChangeEvent,
  type MouseEvent
} from 'react'

import styles from '../AccountPrivacyPage.module.css'

// SECTION 02 : TYPE

type ContactPhoneModalProps = {
  isOpen: boolean
  currentPhone: string
  isSaving: boolean
  onSave: (
    payload: {
      contactPhone: string | null
    }
  ) => void | Promise<void>
  onClose: () => void
}

// SECTION 03 : HELPER FUNCTION

function normalizeNullableText(
  value: string
): string | null {
  const trimmedValue = value.trim()

  return trimmedValue || null
}

// SECTION 04 : COMPONENT

export default function ContactPhoneModal({
  isOpen,
  currentPhone,
  isSaving,
  onSave,
  onClose
}: ContactPhoneModalProps) {
  const [phone, setPhone] = useState(currentPhone)

  if (!isOpen) {
    return null
  }

  const normalizedCurrentPhone =
    normalizeNullableText(currentPhone)

  const normalizedPhone =
    normalizeNullableText(phone)

  const isChanged =
    normalizedCurrentPhone !== normalizedPhone

  const isSaveDisabled =
    isSaving || !isChanged

  // SECTION 05 : EVENT FUNCTION

  function handlePanelClick(
    event: MouseEvent<HTMLDivElement>
  ) {
    event.stopPropagation()
  }

  function handlePhoneChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setPhone(event.target.value)
  }

  function handleSaveClick() {
    if (isSaveDisabled) {
      return
    }

    void onSave({
      contactPhone: normalizedPhone
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
        aria-labelledby="contact-phone-modal-title"
      >
        <div className={styles.modalHeader}>
          <div>
            <h2
              id="contact-phone-modal-title"
              className={styles.modalTitle}
            >
              기본 연락처 관리
            </h2>

            <p className={styles.modalDescription}>
              주문/결제 확인에 사용할 기본 연락처를 관리합니다.
            </p>
          </div>

          <button
            type="button"
            className={styles.modalCloseButton}
            onClick={onClose}
            aria-label="기본 연락처 관리 모달 닫기"
            disabled={isSaving}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <label className={styles.modalInputGroup}>
            <span className={styles.modalLabel}>
              기본 연락처
            </span>

            <input
              type="tel"
              inputMode="tel"
              value={phone}
              placeholder="010-1234-1234"
              className={styles.modalInput}
              onChange={handlePhoneChange}
              disabled={isSaving}
            />
          </label>

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
