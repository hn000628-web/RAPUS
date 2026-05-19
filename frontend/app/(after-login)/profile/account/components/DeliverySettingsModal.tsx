// FILE : frontend/app/(after-login)/profile/account/components/DeliverySettingsModal.tsx
// ROOT : frontend/app/(after-login)/profile/account/components/DeliverySettingsModal.tsx
// STATUS : MODIFY MODE
// ROLE : DELIVERY ADDRESS BOOK LIST + CREATE/EDIT MODAL

'use client'

import {
  useEffect,
  useRef,
  useMemo,
  useState,
  type MouseEvent
} from 'react'

import type {
  DeliveryAddressItem
} from '@/lib/accountApi'

import styles from '../AccountPrivacyPage.module.css'

type DeliveryModalMode =
  | 'list'
  | 'create'
  | 'edit'

type DeliveryAddressSavePayload = {
  id?: number
  label: string
  recipientName: string | null
  recipientPhone: string | null
  deliveryAddress: string
  deliveryDetailAddress: string | null
  entrancePassword: string | null
  deliveryMemo: string | null
  isDefault: boolean
}

type DeliverySettingsModalProps = {
  isOpen: boolean
  addresses: DeliveryAddressItem[]
  isSaving: boolean
  onSave: (payload: DeliveryAddressSavePayload) => void | Promise<void>
  onDelete: (addressId: number) => void | Promise<void>
  onSetDefault: (addressId: number) => void | Promise<void>
  onClose: () => void
}

type DeliveryFormState = {
  id?: number
  label: string
  recipientName: string
  recipientPhone: string
  deliveryAddress: string
  deliveryDetailAddress: string
  entrancePassword: string
  deliveryMemo: string
  isDefault: boolean
}

const INITIAL_FORM: DeliveryFormState = {
  label: '',
  recipientName: '',
  recipientPhone: '',
  deliveryAddress: '',
  deliveryDetailAddress: '',
  entrancePassword: '',
  deliveryMemo: '',
  isDefault: false
}

function normalizeNullableText(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim()
  return trimmed || null
}

function buildFormFromItem(item: DeliveryAddressItem): DeliveryFormState {
  return {
    id: item.id,
    label: item.label ?? '',
    recipientName: item.recipientName ?? '',
    recipientPhone: item.recipientPhone ?? '',
    deliveryAddress: item.deliveryAddress ?? '',
    deliveryDetailAddress: item.deliveryDetailAddress ?? '',
    entrancePassword: '',
    deliveryMemo: item.deliveryMemo ?? '',
    isDefault: item.isDefault === 1
  }
}

export default function DeliverySettingsModal({
  isOpen,
  addresses,
  isSaving,
  onSave,
  onDelete,
  onSetDefault,
  onClose
}: DeliverySettingsModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [mode, setMode] = useState<DeliveryModalMode>('list')
  const [form, setForm] = useState<DeliveryFormState>(INITIAL_FORM)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)

  const hasAddresses = addresses.length > 0

  const defaultAddressId = useMemo(() => {
    return addresses.find((item) => item.isDefault === 1)?.id ?? null
  }, [addresses])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    setMode('list')
    setSelectedAddressId(null)
    setForm(INITIAL_FORM)
    if (panelRef.current) {
      panelRef.current.scrollTop = 0
    }
  }, [isOpen])

  useEffect(() => {
    if (!selectedAddressId) {
      return
    }

    const isExisting = addresses.some((item) => item.id === selectedAddressId)

    if (!isExisting) {
      setSelectedAddressId(null)
    }
  }, [selectedAddressId, addresses])

  if (!isOpen) {
    return null
  }

  const isEditMode = mode === 'edit'
  const isFormMode = mode === 'create' || mode === 'edit'
  const hasStoredEntrancePassword =
    isEditMode
      ? Boolean(addresses.find((item) => item.id === form.id)?.hasEntrancePassword)
      : false

  const selectedAddress = selectedAddressId
    ? addresses.find((item) => item.id === selectedAddressId) ?? null
    : null

  const normalizedLabel = (form.label ?? '').trim()
  const normalizedDeliveryAddress = (form.deliveryAddress ?? '').trim()
  const isSaveDisabled =
    isSaving
    || !normalizedLabel
    || !normalizedDeliveryAddress

  function handlePanelClick(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation()
  }

  function handleOpenCreate() {
    setForm({
      ...INITIAL_FORM,
      isDefault: addresses.length < 1
    })
    setMode('create')
  }

  function handleOpenEdit(item: DeliveryAddressItem) {
    setForm(buildFormFromItem(item))
    setMode('edit')
  }

  function handleBackToList() {
    setMode('list')
    setSelectedAddressId(null)
  }

  function handleChange<K extends keyof DeliveryFormState>(
    key: K,
    value: DeliveryFormState[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  async function handleSave() {
    if (isSaveDisabled) {
      return
    }

    const payload = {
      id: form.id,
      label: normalizedLabel,
      recipientName: normalizeNullableText(form.recipientName),
      recipientPhone: normalizeNullableText(form.recipientPhone),
      deliveryAddress: normalizedDeliveryAddress,
      deliveryDetailAddress: normalizeNullableText(form.deliveryDetailAddress),
      entrancePassword: normalizeNullableText(form.entrancePassword),
      deliveryMemo: normalizeNullableText(form.deliveryMemo),
      isDefault: form.isDefault
    }

    try {
      await Promise.resolve(onSave(payload))
      setForm(INITIAL_FORM)
      setSelectedAddressId(null)
      setMode('list')
    } catch {
      // 저장 실패 시 폼 화면에 머무르게 유지한다.
    }
  }

  function handleDelete() {
    if (!form.id || isSaving) {
      return
    }

    void onDelete(form.id)
    setMode('list')
  }

  function handleDeleteAddress(addressId: number) {
    if (isSaving) {
      return
    }

    void onDelete(addressId)

    if (selectedAddressId === addressId) {
      setSelectedAddressId(null)
    }
  }

  function handleAddressSelect(addressId: number) {
    setSelectedAddressId(addressId)
  }

  async function handleSetDefaultAddress() {
    if (!selectedAddress || isSaving || selectedAddress.isDefault === 1) {
      return
    }

    await onSetDefault(selectedAddress.id)
    setSelectedAddressId(null)
  }

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        className={`${styles.modalPanel} ${styles.deliveryModalPanel}`}
        onClick={handlePanelClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-address-modal-title"
      >
        <div className={styles.modalHeader}>
          <div>
            <h2 id="delivery-address-modal-title" className={styles.modalTitle}>
              {mode === 'list' ? '배송주소관리' : mode === 'create' ? '배송주소지 등록' : '배송주소지 수정'}
            </h2>
            <p className={styles.modalDescription}>
              {mode === 'list'
                ? '배송주소 목록을 확인하고 등록/수정할 수 있습니다.'
                : '배송지 정보를 입력한 뒤 저장해 주세요.'}
            </p>
          </div>

          <button
            type="button"
            className={styles.modalCloseButton}
            onClick={onClose}
            aria-label="배송주소관리 모달 닫기"
            disabled={isSaving}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {mode === 'list' ? (
            <>
              <div className={styles.modalInfoBox}>
                {hasAddresses ? (
                  <div className={styles.inputGrid}>
                    {addresses.map((item, index) => (
                      <div
                        key={item.id}
                        className={styles.modalMethodCard}
                        style={{
                          backgroundColor: selectedAddressId === item.id ? '#eff3ff' : undefined,
                          borderColor: selectedAddressId === item.id ? '#3b82f6' : undefined
                        }}
                        onClick={() => handleAddressSelect(item.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            handleAddressSelect(item.id)
                          }
                        }}
                      >
                        <p className={styles.modalMethodTitle}>
                          {index + 1}. {item.deliveryAddress} {item.deliveryDetailAddress ?? ''} [{item.label}]
                          {item.isDefault === 1 ? ' [기본]' : ''}
                        </p>
                        <p className={styles.modalMethodDescription}>
                          {item.deliveryMemo || '메모 없음'}
                        </p>
                        <div className={styles.modalActions}>
                          <button
                            type="button"
                            className={styles.modalCancelButton}
                            onClick={(event) => {
                              event.stopPropagation()
                              handleOpenEdit(item)
                            }}
                            disabled={isSaving}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className={styles.modalCancelButton}
                            onClick={(event) => {
                              event.stopPropagation()
                              handleDeleteAddress(item.id)
                            }}
                            disabled={isSaving}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className={styles.modalValue}>등록된 배송주소가 없습니다.</span>
                )}
              </div>
            </>
          ) : (
            <>
              <label className={styles.modalInputGroup}>
                <span className={styles.modalLabel}>배송지명</span>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={form.label}
                  placeholder="예) 자택,회사"
                  onChange={(event) => handleChange('label', event.target.value)}
                  disabled={isSaving}
                />
              </label>

              <label className={styles.modalInputGroup}>
                <span className={styles.modalLabel}>받는 사람</span>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={form.recipientName}
                  placeholder="받는 사람을 입력하세요"
                  onChange={(event) => handleChange('recipientName', event.target.value)}
                  disabled={isSaving}
                />
              </label>

              <label className={styles.modalInputGroup}>
                <span className={styles.modalLabel}>연락처</span>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={form.recipientPhone}
                  placeholder="연락처를 입력하세요"
                  onChange={(event) => handleChange('recipientPhone', event.target.value)}
                  disabled={isSaving}
                />
              </label>

              <label className={styles.modalInputGroup}>
                <span className={styles.modalLabel}>배송지 주소</span>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={form.deliveryAddress}
                  placeholder="배송지 주소를 입력하세요"
                  onChange={(event) => handleChange('deliveryAddress', event.target.value)}
                  disabled={isSaving}
                />
              </label>

              <label className={styles.modalInputGroup}>
                <span className={styles.modalLabel}>상세 주소</span>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={form.deliveryDetailAddress}
                  placeholder="상세 주소를 입력하세요"
                  onChange={(event) => handleChange('deliveryDetailAddress', event.target.value)}
                  disabled={isSaving}
                />
              </label>

              <label className={styles.modalInputGroup}>
                <span className={styles.modalLabel}>
                  건물 공동현관 출입정보 {hasStoredEntrancePassword ? '(등록됨)' : '(미등록)'}
                </span>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={form.entrancePassword}
                  placeholder="예) #1234, 경비실 호출, 공동현관 없음"
                  onChange={(event) => handleChange('entrancePassword', event.target.value)}
                  disabled={isSaving}
                />
                <span className={styles.modalMethodDescription}>
                  배송 시 라이더에게 전달될 수 있는 건물 출입구 진입 정보입니다.
                </span>
              </label>

              <label className={styles.modalInputGroup}>
                <span className={styles.modalLabel}>배송 메모</span>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={form.deliveryMemo}
                  placeholder="배송 메모를 입력하세요"
                  onChange={(event) => handleChange('deliveryMemo', event.target.value)}
                  disabled={isSaving}
                />
              </label>

              {isEditMode ? (
                <label className={styles.modalInputGroup}>
                  <span className={styles.modalLabel}>기본 배송지</span>
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(event) => handleChange('isDefault', event.target.checked)}
                    disabled={isSaving}
                  />
                </label>
              ) : null}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancelButton}
                  onClick={handleBackToList}
                  disabled={isSaving}
                >
                  취소
                </button>

                {isEditMode ? (
                  <button
                    type="button"
                    className={styles.modalCancelButton}
                    onClick={handleDelete}
                    disabled={isSaving}
                  >
                    삭제
                  </button>
                ) : null}

                <button
                  type="button"
                  className={isSaveDisabled ? styles.modalDisabledButton : styles.actionButton}
                  onClick={handleSave}
                  disabled={isSaveDisabled}
                >
                  {isSaving ? '저장중' : '저장'}
                </button>
              </div>

              {isEditMode && form.id && form.id !== defaultAddressId ? (
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalCancelButton}
                    onClick={() => void onSetDefault(form.id!)}
                    disabled={isSaving}
                  >
                    기본 배송지로 설정
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        {mode === 'list' ? (
          <div className={styles.modalFooter}>
            <div className={styles.modalFooterActions}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={handleOpenCreate}
                disabled={isSaving}
              >
                배송주소지 등록
              </button>
              <button
                type="button"
                className={isSaving || !selectedAddress || selectedAddress.isDefault === 1
                  ? styles.modalDisabledButton
                  : styles.actionButton}
                onClick={() => void handleSetDefaultAddress()}
                disabled={isSaving || !selectedAddress || selectedAddress.isDefault === 1}
              >
                기본주소 선택
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
