// FILE : frontend/app/(after-login)/profile/account/components/AdultBirthDateModal.tsx
// ROOT : frontend/app/(after-login)/profile/account/components/AdultBirthDateModal.tsx
// STATUS : MODIFY MODE
// ROLE : ADULT BIRTH DATE MODAL
// CHANGE SUMMARY :
// - 생년월일 입력 변경 여부 기준 저장 버튼 활성화 적용
// - isOpen 시 입력 state 초기화
// - 미등록은 null로 normalize 처리
// - YYYY-MM-DD 형식이 아닐 때 저장 버튼 비활성화
// - 성인 여부 계산 없이 생년월일 저장 UI만 담당

'use client'

// SECTION 01 : IMPORT

import {
  useState,
  type ChangeEvent,
  type MouseEvent
} from 'react'

import styles from '../AccountPrivacyPage.module.css'

// SECTION 02 : TYPE

type AdultBirthDateModalProps = {
  isOpen: boolean
  currentBirthDate: string
  isSaving: boolean
  onSave: (
    payload: {
      birthDate: string | null
    }
  ) => void | Promise<void>
  onClose: () => void
}

// SECTION 03 : HELPER

function normalizeBirthDateInput(
  value: string
): string | null {
  const trimmedValue = value.trim()

  return trimmedValue || null
}

function normalizeCurrentBirthDate(
  value: string
): string | null {
  if (!value || value === '미등록') {
    return null
  }

  return value.trim() || null
}

function isValidBirthDateFormat(
  value: string
): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

// SECTION 04 : COMPONENT

export default function AdultBirthDateModal({
  isOpen,
  currentBirthDate,
  isSaving,
  onSave,
  onClose
}: AdultBirthDateModalProps) {
  const [birthDate, setBirthDate] = useState(
    currentBirthDate === '미등록'
      ? ''
      : currentBirthDate
  )

  if (!isOpen) {
    return null
  }

  const normalizedCurrentBirthDate =
    normalizeCurrentBirthDate(currentBirthDate)

  const normalizedBirthDate =
    normalizeBirthDateInput(birthDate)

  const isChanged =
    normalizedCurrentBirthDate !== normalizedBirthDate

  const isBirthDateValid =
    normalizedBirthDate === null
    || isValidBirthDateFormat(normalizedBirthDate)

  const isSaveDisabled =
    isSaving || !isChanged || !isBirthDateValid

  // SECTION 05 : EVENT FUNCTION

  function handlePanelClick(
    event: MouseEvent<HTMLDivElement>
  ) {
    event.stopPropagation()
  }

  function handleBirthDateChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setBirthDate(event.target.value)
  }

  function handleSaveClick() {
    if (isSaveDisabled) {
      return
    }

    void onSave({
      birthDate: normalizedBirthDate
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
        aria-labelledby="adult-birth-date-modal-title"
      >
        <div className={styles.modalHeader}>
          <div>
            <h2
              id="adult-birth-date-modal-title"
              className={styles.modalTitle}
            >
              생년월일 관리
            </h2>

            <p className={styles.modalDescription}>
              성인 인증에 사용할 생년월일을 관리합니다.
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
          <label className={styles.modalInputGroup}>
            <span className={styles.modalLabel}>
              생년월일
            </span>

            <input
              type="date"
              value={birthDate}
              className={styles.modalInput}
              onChange={handleBirthDateChange}
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
