// FILE : frontend/app/(after-login)/profile/account/components/AddressManageModal.tsx
// ROOT : frontend/app/(after-login)/profile/account/components/AddressManageModal.tsx
// STATUS : MODIFY MODE
// ROLE : DEFAULT ADDRESS MODAL
// CHANGE SUMMARY :
// - 기본주소 관리 모달에 RegionGpsSelector / RegionDbSelector 적용
// - 현재 주소 / 현재 위치 사용 / 동 이름 검색 / 선택된 지역 / 상세 주소 구조 반영
// - 저장은 기존 onSave({ detailAddress }) 구조 유지
// - 모달 내부에서 accountApi / regionsApi 저장 함수 직접 호출 없음
// - 지역 선택 + 상세 주소 조합 기반 저장 버튼 활성화 유지

'use client'

// SECTION 01 : IMPORT

import {
  useState,
  type ChangeEvent,
  type MouseEvent
} from 'react'

import type {
  Region
} from '@/types/region'

import RegionGpsSelector from '@/components/Region/RegionGpsSelector'
import RegionDbSelector from '@/components/Region/RegionDbSelector'

import styles from '../AccountPrivacyPage.module.css'

// SECTION 02 : TYPE

type AddressManageModalProps = {
  isOpen: boolean
  currentAddress: string
  isSaving: boolean
  onSave: (
    payload: {
      detailAddress: string | null
    }
  ) => void | Promise<void>
  onClose: () => void
}

// SECTION 03 : HELPER

function buildNextAddress(
  selectedRegion: Region | null,
  detailAddress: string
): string {
  const regionName =
    selectedRegion?.fullName?.trim() ?? ''

  const detail =
    detailAddress.trim()

  if (regionName && detail) {
    return `${regionName} ${detail}`
  }

  if (regionName) {
    return regionName
  }

  return detail
}

function normalizeNullableText(
  value: string
): string | null {
  const trimmedValue =
    value.trim()

  return trimmedValue || null
}

// SECTION 04 : COMPONENT

export default function AddressManageModal({
  isOpen,
  currentAddress,
  isSaving,
  onSave,
  onClose
}: AddressManageModalProps) {
  const [selectedRegion, setSelectedRegionState] =
    useState<Region | null>(null)

  const [query, setQuery] =
    useState('')

  const [detailAddress, setDetailAddress] =
    useState(currentAddress)

  const [gpsLoading, setGpsLoading] =
    useState(false)

  if (!isOpen) {
    return null
  }

  const currentAddressText =
    currentAddress.trim() || '[주소 미설정]'

  const normalizedCurrentAddress =
    normalizeNullableText(currentAddress)

  const normalizedNextAddress =
    normalizeNullableText(
      buildNextAddress(
        selectedRegion,
        detailAddress
      )
    )

  const isChanged =
    normalizedCurrentAddress !== normalizedNextAddress

  const isSaveDisabled =
    isSaving || !isChanged

  // SECTION 05 : EVENT FUNCTION

  function handlePanelClick(
    event: MouseEvent<HTMLDivElement>
  ) {
    event.stopPropagation()
  }

  function handleDetailAddressChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setDetailAddress(event.target.value)
  }

  function handleSelectedRegionChange(
    region: Region
  ) {
    setSelectedRegionState(region)
  }

  function handleSaveClick() {
    if (isSaveDisabled) {
      return
    }

    void onSave({
      detailAddress: normalizedNextAddress
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
        aria-labelledby="address-manage-modal-title"
      >
        <div className={styles.modalHeader}>
          <div>
            <h2
              id="address-manage-modal-title"
              className={styles.modalTitle}
            >
              기본주소 관리
            </h2>

            <p className={styles.modalDescription}>
              주문/예약/배송에 사용할 기본 주소를 관리합니다.
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
              현재 주소
            </span>

            <span className={styles.modalValue}>
              {currentAddressText}
            </span>
          </div>

          <div className={styles.modalInputGroup}>
            <span className={styles.modalLabel}>
              현재 위치 사용
            </span>

            <RegionGpsSelector
              gpsLoading={gpsLoading}
              setGpsLoading={setGpsLoading}
              setSelectedRegion={handleSelectedRegionChange}
              setQuery={setQuery}
            />
          </div>

          <div className={styles.modalInputGroup}>
            <span className={styles.modalLabel}>
              동 이름 검색
            </span>

            <RegionDbSelector
              query={query}
              setQuery={setQuery}
              selectedRegion={selectedRegion}
              setSelectedRegion={handleSelectedRegionChange}
            />
          </div>

          <div className={styles.modalInfoBox}>
            <span className={styles.modalLabel}>
              선택된 지역
            </span>

            <span className={styles.modalValue}>
              {selectedRegion?.fullName || '지역 선택 필요'}
            </span>
          </div>

          <label className={styles.modalInputGroup}>
            <span className={styles.modalLabel}>
              상세 주소
            </span>

            <input
              type="text"
              value={detailAddress}
              placeholder="예: 건물명 / 호수"
              className={styles.modalInput}
              onChange={handleDetailAddressChange}
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
