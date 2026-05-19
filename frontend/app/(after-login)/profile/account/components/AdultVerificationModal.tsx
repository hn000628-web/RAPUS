// FILE : frontend/app/(after-login)/profile/account/components/AdultVerificationModal.tsx
// ROOT : frontend/app/(after-login)/profile/account/components/AdultVerificationModal.tsx
// STATUS : MODIFY MODE
// ROLE : ADULT VERIFICATION DEV VERIFY MODAL
// CHANGE SUMMARY :
// - 개발용 임시 성인인증 API 호출용 모달로 정리
// - isSaving / onVerifyForDev props 추가
// - 버튼 클릭 시 상위 page 저장 함수 호출
// - 모달 내부 accountApi 직접 호출 없음
// - 기존 props 구조 유지 및 확장

'use client'

// SECTION 01 : IMPORT

import {
  type MouseEvent
} from 'react'

import styles from '../AccountPrivacyPage.module.css'

// SECTION 02 : TYPE

type AdultVerificationModalProps = {
  isOpen: boolean
  birthDate: string
  verificationStatus: string
  isSaving: boolean
  onVerifyForDev: () => void | Promise<void>
  onClose: () => void
}

function buildDisplayedBirthDate(
  birthDate: string
): string {
  if (!birthDate || birthDate.trim() === '' || birthDate === '미등록') {
    return '미등록'
  }

  return birthDate
}

// SECTION 03 : COMPONENT

export default function AdultVerificationModal({
  isOpen,
  birthDate,
  verificationStatus,
  isSaving,
  onVerifyForDev,
  onClose
}: AdultVerificationModalProps) {
  if (!isOpen) {
    return null
  }

  const displayedBirthDate = buildDisplayedBirthDate(birthDate)

  // SECTION 04 : EVENT FUNCTION

  function handlePanelClick(
    event: MouseEvent<HTMLDivElement>
  ) {
    event.stopPropagation()
  }

  // SECTION 05 : RETURN

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
        aria-labelledby="adult-verification-modal-title"
      >
        <div className={styles.modalHeader}>
          <div>
            <h2
              id="adult-verification-modal-title"
              className={styles.modalTitle}
            >
              성인인증 진행
            </h2>

            <p className={styles.modalDescription}>
              주류, 성인 제한 상품, QR/POS 주문 전 성인 여부 확인에 사용합니다.
            </p>
          </div>

          <button
            type="button"
            className={styles.modalCloseButton}
            onClick={onClose}
            aria-label="성인인증 진행 모달 닫기"
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalInfoBox}>
            <span className={styles.modalLabel}>
              생년월일
            </span>

            <span className={styles.modalValue}>
              {displayedBirthDate}
            </span>
          </div>

          <div className={styles.modalInfoBox}>
            <span className={styles.modalLabel}>
              인증 상태
            </span>

            <span className={styles.modalValue}>
              {verificationStatus}
            </span>
          </div>

          <div className={styles.modalMethodCard}>
            <h3 className={styles.modalMethodTitle}>
              개발용 임시 성인인증
            </h3>

            <p className={styles.modalMethodDescription}>
              현재는 개발/테스트용 임시 처리입니다. 생년월일 기준 만 19세 이상이면
              성인인증 상태를 VERIFIED로 저장합니다. 실제 서비스에서는 본인확인 API
              결과로 대체합니다.
            </p>
          </div>

          <div className={styles.modalNotice}>
            주민등록번호 입력, 신분증 업로드, 외부 본인확인 연동 없이 profile/account
            전용 개발용 API만 호출합니다.
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.modalCancelButton}
              onClick={onClose}
              disabled={isSaving}
            >
              닫기
            </button>

            <button
              type="button"
              className={styles.actionButton}
              onClick={onVerifyForDev}
              disabled={isSaving}
            >
              {isSaving ? '인증 처리중' : '개발용 임시 성인인증 진행'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
