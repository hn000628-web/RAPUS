// FILE : frontend/app/(after-login)/profile/account/page.tsx
// ROOT : frontend/app/(after-login)/profile/account/page.tsx
// STATUS : MODIFY MODE
// ROLE : GENERAL ACCOUNT PRIVACY MANAGEMENT PAGE API CONNECTED UI
// CHANGE SUMMARY :
// - getMe() -> profileId/channelCode 컨텍스트 추출 안정화
// - accountApi 기반 조회/저장 흐름 유지
// - 모달 onSave/isSaving 연결 유지
// - 저장 성공 시 카드 값 갱신 + 모달 닫기
// - 에러는 errorMessage 영역에만 표시

'use client'

// SECTION 01 : IMPORT

import {
  useCallback,
  useEffect,
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

import {
  getMe
} from '@/lib/authApi'

import {
  createMyDeliveryAddress,
  deleteMyDeliveryAddress,
  getProfileAccount,
  listMyDeliveryAddresses,
  setDefaultDeliveryAddress,
  verifyAdultForDev,
  updateMyDeliveryAddress,
  updatePaymentPassword,
  updatePrimaryPassword,
  updateProfileAccountBasic,
  updateProfileAccountBirthDate
} from '@/lib/accountApi'

import type {
  DeliveryAddressItem,
  DeliveryAddressListResponseData,
  ProfileAccountResponseData
} from '@/lib/accountApi'

import AddressManageModal from './components/AddressManageModal'
import ContactPhoneModal from './components/ContactPhoneModal'
import AdultBirthDateModal from './components/AdultBirthDateModal'
import AdultVerificationModal from './components/AdultVerificationModal'
import PrimaryPasswordModal from './components/PrimaryPasswordModal'
import PaymentPasswordModal from './components/PaymentPasswordModal'
import DeliverySettingsModal from './components/DeliverySettingsModal'

import styles from './AccountPrivacyPage.module.css'

// SECTION 02 : TYPE

type StatusTone =
  | 'READY'
  | 'WARNING'
  | 'SAFE'
  | 'DANGER'

type InfoCardProps = {
  title: string
  value: string
  description: string
  badgeText: string
  badgeTone: StatusTone
  buttonText?: string
  onButtonClick?: () => void
}

type ProfileAccountContext = {
  profileId: number
  channelCode: string
}

type AddressSavePayload = {
  detailAddress: string | null
}

type ContactPhoneSavePayload = {
  contactPhone: string | null
}

type BirthDateSavePayload = {
  birthDate: string | null
}

type PrimaryPasswordSavePayload = {
  newPassword: string
  confirmPassword: string
}

type PaymentPasswordSavePayload = {
  paymentPassword: string
  confirmPaymentPassword: string
}

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

// SECTION 03 : CONSTANT

const DEFAULT_ADDRESS_EMPTY_TEXT = '미등록'
const DEFAULT_BIRTH_DATE_EMPTY_TEXT = '미등록'
const DEFAULT_ADULT_VERIFICATION_STATUS = 'UNVERIFIED'

// SECTION 04 : COMPONENT

export default function AccountPrivacyPage() {
  const router = useRouter()

  const [accountContext, setAccountContext] =
    useState<ProfileAccountContext | null>(null)

  const [accountData, setAccountData] =
    useState<ProfileAccountResponseData | null>(null)
  const [deliveryAddresses, setDeliveryAddresses] =
    useState<DeliveryAddressListResponseData | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isContactPhoneModalOpen, setIsContactPhoneModalOpen] = useState(false)
  const [isBirthDateModalOpen, setIsBirthDateModalOpen] = useState(false)
  const [isAdultVerificationModalOpen, setIsAdultVerificationModalOpen] = useState(false)
  const [isPrimaryPasswordModalOpen, setIsPrimaryPasswordModalOpen] = useState(false)
  const [isPaymentPasswordModalOpen, setIsPaymentPasswordModalOpen] = useState(false)
  const [isDeliverySettingsModalOpen, setIsDeliverySettingsModalOpen] = useState(false)

  // SECTION 05 : DATA LOAD

  const loadProfileAccount = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const me = await getMe()
      const context = resolveAccountContext(me)

      const nextAccountData = await getProfileAccount({
        profileId: context.profileId,
        channelCode: context.channelCode
      })

      const nextDeliveryAddresses = await listMyDeliveryAddresses({
        profileId: context.profileId,
        channelCode: context.channelCode
      })

      setAccountContext(context)
      setAccountData(nextAccountData)
      setDeliveryAddresses(nextDeliveryAddresses)
    } catch {
      setErrorMessage('프로필 컨텍스트를 확인하지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfileAccount()
  }, [loadProfileAccount])

  // SECTION 06 : EVENT FUNCTION

  function moveToProfilePage() {
    router.push('/profile')
  }

  function closeAllModals() {
    setIsAddressModalOpen(false)
    setIsContactPhoneModalOpen(false)
    setIsBirthDateModalOpen(false)
    setIsAdultVerificationModalOpen(false)
    setIsPrimaryPasswordModalOpen(false)
    setIsPaymentPasswordModalOpen(false)
    setIsDeliverySettingsModalOpen(false)
  }

  // SECTION 07 : SAVE FUNCTION

  async function saveAddress(payload: AddressSavePayload) {
    if (!accountContext) {
      setErrorMessage('프로필 컨텍스트가 없습니다.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const updated = await updateProfileAccountBasic({
        profileId: accountContext.profileId,
        channelCode: accountContext.channelCode,
        detailAddress: payload.detailAddress,
        contactPhone: accountData?.contactPhone ?? null
      })

      setAccountData((prev: ProfileAccountResponseData | null) => {
        if (!prev) return prev
        return {
          ...prev,
          detailAddress: updated.detailAddress,
          contactPhone: updated.contactPhone
        }
      })

      setIsAddressModalOpen(false)
    } catch {
      setErrorMessage('기본주소 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveContactPhone(payload: ContactPhoneSavePayload) {
    if (!accountContext) {
      setErrorMessage('프로필 컨텍스트가 없습니다.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const updated = await updateProfileAccountBasic({
        profileId: accountContext.profileId,
        channelCode: accountContext.channelCode,
        detailAddress: accountData?.detailAddress ?? null,
        contactPhone: payload.contactPhone
      })

      setAccountData((prev: ProfileAccountResponseData | null) => {
        if (!prev) return prev
        return {
          ...prev,
          detailAddress: updated.detailAddress,
          contactPhone: updated.contactPhone
        }
      })

      setIsContactPhoneModalOpen(false)
    } catch {
      setErrorMessage('기본연락처 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveBirthDate(payload: BirthDateSavePayload) {
    if (!accountContext) {
      setErrorMessage('프로필 컨텍스트가 없습니다.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const updated = await updateProfileAccountBirthDate({
        profileId: accountContext.profileId,
        channelCode: accountContext.channelCode,
        birthDate: payload.birthDate
      })

      setAccountData((prev: ProfileAccountResponseData | null) => {
        if (!prev) return prev
        return {
          ...prev,
          birthDate: updated.birthDate
        }
      })

      setIsBirthDateModalOpen(false)
    } catch {
      setErrorMessage('생년월일 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  async function savePrimaryPassword(payload: PrimaryPasswordSavePayload) {
    if (!accountContext) {
      setErrorMessage('프로필 컨텍스트가 없습니다.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const updated = await updatePrimaryPassword({
        profileId: accountContext.profileId,
        channelCode: accountContext.channelCode,
        newPassword: payload.newPassword,
        confirmPassword: payload.confirmPassword
      })

      setAccountData((prev: ProfileAccountResponseData | null) => {
        if (!prev) return prev
        return {
          ...prev,
          primaryPasswordStatus: updated.primaryPasswordStatus
        }
      })

      setIsPrimaryPasswordModalOpen(false)
    } catch {
      setErrorMessage('1차 비밀번호 변경에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  async function savePaymentPassword(payload: PaymentPasswordSavePayload) {
    if (!accountContext) {
      setErrorMessage('프로필 컨텍스트가 없습니다.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const updated = await updatePaymentPassword({
        profileId: accountContext.profileId,
        channelCode: accountContext.channelCode,
        paymentPassword: payload.paymentPassword,
        confirmPaymentPassword: payload.confirmPaymentPassword
      })

      setAccountData((prev: ProfileAccountResponseData | null) => {
        if (!prev) return prev
        return {
          ...prev,
          paymentPasswordStatus: updated.paymentPasswordStatus,
          paymentPasswordLockedUntil: updated.paymentPasswordLockedUntil
        }
      })

      setIsPaymentPasswordModalOpen(false)
    } catch {
      setErrorMessage('2차 비밀번호 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveDeliveryAddress(payload: DeliveryAddressSavePayload) {
    if (!accountContext) {
      setErrorMessage('프로필 컨텍스트가 없습니다.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const basePayload = {
        profileId: accountContext.profileId,
        channelCode: accountContext.channelCode,
        label: payload.label,
        recipientName: payload.recipientName,
        recipientPhone: payload.recipientPhone,
        deliveryAddress: payload.deliveryAddress,
        deliveryDetailAddress: payload.deliveryDetailAddress,
        entrancePassword: payload.entrancePassword,
        deliveryMemo: payload.deliveryMemo,
        isDefault: payload.isDefault ? 1 : 0
      }

      const updated =
        payload.id
          ? await updateMyDeliveryAddress(payload.id, basePayload)
          : await createMyDeliveryAddress(basePayload)

      setDeliveryAddresses(updated)
    } catch {
      setErrorMessage('배송정보 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  async function removeDeliveryAddress(addressId: number) {
    if (!accountContext) {
      setErrorMessage('프로필 컨텍스트가 없습니다.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const updated = await deleteMyDeliveryAddress(addressId, {
        profileId: accountContext.profileId,
        channelCode: accountContext.channelCode
      })

      setDeliveryAddresses(updated)
    } catch {
      setErrorMessage('배송주소 삭제에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  async function makeDefaultDeliveryAddress(addressId: number) {
    if (!accountContext) {
      setErrorMessage('프로필 컨텍스트가 없습니다.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const updated = await setDefaultDeliveryAddress(addressId, {
        profileId: accountContext.profileId,
        channelCode: accountContext.channelCode
      })

      setDeliveryAddresses(updated)
    } catch {
      setErrorMessage('기본 배송지 설정에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveAdultVerificationForDev() {
    if (!accountContext) {
      setErrorMessage('프로필 컨텍스트가 없습니다.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const updated = await verifyAdultForDev({
        profileId: accountContext.profileId,
        channelCode: accountContext.channelCode
      })

      setAccountData((prev: ProfileAccountResponseData | null) => {
        if (!prev) {
          return prev
        }

        return {
          ...prev,
          birthDate: updated.birthDate,
          adultVerificationStatus: updated.adultVerificationStatus
        }
      })

      setIsAdultVerificationModalOpen(false)
    } catch (error) {
      setErrorMessage(
        buildAdultVerificationErrorMessage(error)
      )
    } finally {
      setIsSaving(false)
    }
  }

  // SECTION 08 : DERIVED VALUE

  const addressValue = accountData?.detailAddress ?? DEFAULT_ADDRESS_EMPTY_TEXT
  const contactPhoneValue = formatKoreanPhoneDisplay(
    accountData?.contactPhone
  )
  const birthDateValue = accountData?.birthDate ?? DEFAULT_BIRTH_DATE_EMPTY_TEXT

  const adultVerificationStatus = accountData?.adultVerificationStatus ?? DEFAULT_ADULT_VERIFICATION_STATUS
  const adultVerificationText = buildAdultVerificationText(adultVerificationStatus)
  const adultVerificationBadgeTone: StatusTone = adultVerificationStatus === 'VERIFIED' ? 'SAFE' : 'DANGER'

  const primaryPasswordText = buildPasswordStatusText(accountData?.primaryPasswordStatus ?? 'NOT_SET')
  const paymentPasswordText = buildPasswordStatusText(accountData?.paymentPasswordStatus ?? 'NOT_SET')
  const paymentPasswordBadgeTone: StatusTone = accountData?.paymentPasswordStatus === 'SET' ? 'SAFE' : 'READY'
  const isDeliveryRegistered = Boolean(deliveryAddresses?.isRegistered)
  const defaultDeliveryAddress = getDefaultDeliveryAddress(deliveryAddresses?.addresses ?? [])
  const hasEntrancePassword = Boolean(
    defaultDeliveryAddress?.hasEntrancePassword
  )
  const deliveryAddressSummary = isDeliveryRegistered
    ? `기본 배송지: ${defaultDeliveryAddress?.label || defaultDeliveryAddress?.deliveryAddress || '주소 미입력'} · 등록 배송지: ${deliveryAddresses?.totalCount ?? 0}개`
    : '등록된 배송주소가 없습니다.'

  // SECTION 09 : UI BLOCK

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.backButton}
            onClick={moveToProfilePage}
            disabled={isSaving}
          >
            마이페이지로 돌아가기
          </button>
        </div>

        <div className={styles.titleBox}>
          <h1 className={styles.pageTitle}>개인정보 관리</h1>
          <p className={styles.pageDescription}>
            기본주소, 기본연락처, 생년월일, 비밀번호 상태를 관리합니다.
          </p>
        </div>

        {isLoading ? <div className={styles.notice}>개인정보를 불러오는 중입니다.</div> : null}
        {errorMessage ? <div className={styles.notice}>{errorMessage}</div> : null}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>기본 정보 관리</h2>
            <span className={styles.sectionHint}>프로필 기본값</span>
          </div>

          <div className={styles.cardGrid}>
            <InfoCard
              title="기본주소"
              value={addressValue}
              description="주문, 예약, 배송에 사용할 기본 주소입니다."
              badgeText={accountData?.detailAddress ? '등록됨' : '미등록'}
              badgeTone={accountData?.detailAddress ? 'SAFE' : 'WARNING'}
              buttonText="주소 관리"
              onButtonClick={() => setIsAddressModalOpen(true)}
            />

            <InfoCard
              title="기본연락처"
              value={contactPhoneValue}
              description="예약/주문/결제 확인에 사용할 기본 연락처입니다."
              badgeText={accountData?.contactPhone ? '등록됨' : '미등록'}
              badgeTone={accountData?.contactPhone ? 'SAFE' : 'WARNING'}
              buttonText="연락처 관리"
              onButtonClick={() => setIsContactPhoneModalOpen(true)}
            />

            <InfoCard
              title="배송정보관리"
              value={deliveryAddressSummary}
              description={`주문, 배달, 배송 요청에 사용할 기본 배송정보입니다. 공동현관 비밀번호 ${hasEntrancePassword ? '등록됨' : '미등록'}.`}
              badgeText={isDeliveryRegistered ? '등록됨' : '미등록'}
              badgeTone={isDeliveryRegistered ? 'SAFE' : 'WARNING'}
              buttonText="배송정보 관리"
              onButtonClick={() => setIsDeliverySettingsModalOpen(true)}
            />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>성인인증 관리</h2>
            <span className={styles.sectionHint}>본인확인 연동 예정</span>
          </div>

          <div className={styles.cardGrid}>
            <InfoCard
              title="생년월일"
              value={birthDateValue}
              description="성인 여부 확인에 사용할 생년월일입니다."
              badgeText={accountData?.birthDate ? '등록됨' : '미등록'}
              badgeTone={accountData?.birthDate ? 'SAFE' : 'WARNING'}
              buttonText="생년월일 관리"
              onButtonClick={() => setIsBirthDateModalOpen(true)}
            />

            <InfoCard
              title="성인인증 여부"
              value={adultVerificationText}
              description="연령 제한 기능에서 사용하는 성인 인증 상태입니다."
              badgeText={adultVerificationText}
              badgeTone={adultVerificationBadgeTone}
              buttonText="성인인증 진행"
              onButtonClick={() => setIsAdultVerificationModalOpen(true)}
            />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>비밀번호 관리</h2>
            <span className={styles.sectionHint}>보안 설정</span>
          </div>

          <div className={styles.cardGrid}>
            <InfoCard
              title="1차 비밀번호"
              value={primaryPasswordText}
              description="일반 로그인에 사용하는 비밀번호 상태입니다."
              badgeText={primaryPasswordText}
              badgeTone="SAFE"
              buttonText="1차 비밀번호 변경"
              onButtonClick={() => setIsPrimaryPasswordModalOpen(true)}
            />

            <InfoCard
              title="2차 비밀번호"
              value={paymentPasswordText}
              description="카드/QR 결제 확인에 사용하는 2차 비밀번호 상태입니다."
              badgeText={paymentPasswordText}
              badgeTone={paymentPasswordBadgeTone}
              buttonText="2차 비밀번호 설정/변경"
              onButtonClick={() => setIsPaymentPasswordModalOpen(true)}
            />
          </div>
        </section>
      </div>

      {isAddressModalOpen ? (
        <AddressManageModal
          isOpen={isAddressModalOpen}
          currentAddress={accountData?.detailAddress ?? ''}
          isSaving={isSaving}
          onSave={saveAddress}
          onClose={closeAllModals}
        />
      ) : null}

      {isContactPhoneModalOpen ? (
        <ContactPhoneModal
          isOpen={isContactPhoneModalOpen}
          currentPhone={accountData?.contactPhone ?? ''}
          isSaving={isSaving}
          onSave={saveContactPhone}
          onClose={closeAllModals}
        />
      ) : null}

      {isBirthDateModalOpen ? (
        <AdultBirthDateModal
          isOpen={isBirthDateModalOpen}
          currentBirthDate={accountData?.birthDate ?? ''}
          isSaving={isSaving}
          onSave={saveBirthDate}
          onClose={closeAllModals}
        />
      ) : null}

      {isAdultVerificationModalOpen ? (
        <AdultVerificationModal
          isOpen={isAdultVerificationModalOpen}
          birthDate={birthDateValue}
          verificationStatus={adultVerificationText}
          isSaving={isSaving}
          onVerifyForDev={saveAdultVerificationForDev}
          onClose={closeAllModals}
        />
      ) : null}

      {isPrimaryPasswordModalOpen ? (
        <PrimaryPasswordModal
          isOpen={isPrimaryPasswordModalOpen}
          isSaving={isSaving}
          onSave={savePrimaryPassword}
          onClose={closeAllModals}
        />
      ) : null}

      {isPaymentPasswordModalOpen ? (
        <PaymentPasswordModal
          isOpen={isPaymentPasswordModalOpen}
          paymentPasswordStatus={paymentPasswordText}
          isSaving={isSaving}
          onSave={savePaymentPassword}
          onClose={closeAllModals}
        />
      ) : null}

      {isDeliverySettingsModalOpen ? (
        <DeliverySettingsModal
          isOpen={isDeliverySettingsModalOpen}
          addresses={deliveryAddresses?.addresses ?? []}
          isSaving={isSaving}
          onSave={saveDeliveryAddress}
          onDelete={removeDeliveryAddress}
          onSetDefault={makeDefaultDeliveryAddress}
          onClose={closeAllModals}
        />
      ) : null}
    </main>
  )
}

// SECTION 10 : CHILD COMPONENT

function InfoCard({
  title,
  value,
  description,
  badgeText,
  badgeTone,
  buttonText,
  onButtonClick
}: InfoCardProps) {
  const isActionEnabled = typeof onButtonClick === 'function'

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTextBox}>
          <h3 className={styles.cardTitle}>{title}</h3>
          <p className={styles.cardValue}>{value}</p>
        </div>

        <StatusBadge text={badgeText} tone={badgeTone} />
      </div>

      <p className={styles.cardDescription}>{description}</p>

      {buttonText ? (
        <div className={styles.cardAction}>
          <button
            type="button"
            className={isActionEnabled ? styles.actionButton : styles.disabledButton}
            onClick={onButtonClick}
            disabled={!isActionEnabled}
          >
            {buttonText}
          </button>
        </div>
      ) : null}
    </article>
  )
}

function StatusBadge({
  text,
  tone
}: {
  text: string
  tone: StatusTone
}) {
  return (
    <span className={[styles.badge, styles[`badge${tone}`]].join(' ')}>
      {text}
    </span>
  )
}

// SECTION 11 : HELPER FUNCTION

function resolveAccountContext(value: unknown): ProfileAccountContext {
  const source = value as {
    user?: {
      profileId?: number
      channelCode?: string
    }
  }

  const profileId = source.user?.profileId
  const channelCode = source.user?.channelCode

  if (!profileId || !Number.isInteger(profileId) || profileId <= 0) {
    throw new Error('PROFILE_ID_NOT_FOUND')
  }

  if (typeof channelCode !== 'string' || channelCode.trim().length !== 13) {
    throw new Error('CHANNEL_CODE_NOT_FOUND')
  }

  return {
    profileId,
    channelCode: channelCode.trim()
  }
}

function buildPasswordStatusText(status: 'SET' | 'NOT_SET') {
  return status === 'SET' ? '설정됨' : '미설정'
}

function formatKoreanPhoneDisplay(
  value: string | null | undefined
) {
  if (!value) {
    return '미등록'
  }

  const digits =
    value.replace(/\D/g, '')

  if (
    digits.length === 11 &&
    digits.startsWith('010')
  ) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  return value
}

function buildAdultVerificationText(status: string) {
  if (status === 'VERIFIED') {
    return '인증됨'
  }

  if (status === 'EXPIRED') {
    return '만료됨'
  }

  if (status === 'REQUIRED') {
    return '인증필요'
  }

  if (status === 'FAILED') {
    return '실패'
  }

  return '미인증'
}

function buildAdultVerificationErrorMessage(
  error: unknown
) {
  if (
    error instanceof Error
    && error.message === 'BIRTH_DATE_REQUIRED'
  ) {
    return '생년월일이 등록되어 있지 않습니다.'
  }

  if (
    error instanceof Error
    && error.message === 'ADULT_VERIFICATION_UNDER_AGE'
  ) {
    return '만 19세 미만은 개발용 임시 성인인증을 진행할 수 없습니다.'
  }

  if (
    error instanceof Error
    && error.message === 'INVALID_BIRTH_DATE_FORMAT'
  ) {
    return '생년월일 형식이 올바르지 않습니다.'
  }

  return '개발용 임시 성인인증 처리에 실패했습니다.'
}

function getDefaultDeliveryAddress(
  addresses: DeliveryAddressItem[]
): DeliveryAddressItem | null {
  if (addresses.length < 1) {
    return null
  }

  return (
    addresses.find((item) => item.isDefault === 1)
    ?? addresses[0]
    ?? null
  )
}
