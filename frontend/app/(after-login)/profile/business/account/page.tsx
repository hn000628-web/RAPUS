'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'

import styles from './BusinessAccountPage.module.css'
import { getMe } from '@/lib/authApi'
import { getProfileByChannelCode, type ProfileDetailPayload } from '@/lib/profile-summary-api'
import {
  getBusinessIndustrySubtypes,
  getCurrentBusinessIndustry,
  searchBusinessIndustries,
  updateBusinessIndustry
} from '@/lib/business/business-industry-api'
import {
  getBusinessTypes,
  updateBusinessType,
  type BusinessTypeCode,
  type BusinessTypeItem
} from '@/lib/business/business-type-api'
import {
  defaultBusinessHoursState,
  getBusinessHoursSetting,
  saveBusinessHoursSetting,
  type BusinessHour,
  type BusinessHoursState,
  type DayKey
} from '@/lib/business/business-hours-api'
import {
  getMyBusinessProfileFull,
  updateBusinessChannelRegion,
  updateBusinessContactSettings,
  updateBusinessLoginPassword,
  updateBusinessPaymentPassword,
  updateBusinessProfileCore,
  updateBusinessRegistrationNumber
} from '@/lib/business/profile-settings-api'
import { searchRegions } from '@/lib/regionsApi'
import type { Region } from '@/types/region'

type BusinessAccountState = {
  businessName: string
  businessIndustryName: string
  businessTypeName: string
  address: string
  businessHours: string
  businessRegistrationNumber: string
  primaryPhone: string
  secondaryPhone: string
  fax: string
  managerEmail: string
  operationPassword: string
  paymentConfirmPassword: string
}

type BusinessAccountModalType =
  | 'businessName'
  | 'address'
  | 'businessHours'
  | 'businessRegistrationNumber'
  | 'primaryPhone'
  | 'secondaryPhone'
  | 'fax'
  | 'managerEmail'
  | 'operationPassword'
  | 'paymentConfirmPassword'
  | null

type BusinessCardItem = {
  key: Exclude<BusinessAccountModalType, null>
  title: string
  description: string
  buttonText: string
}

type IndustryOption = {
  id: number
  code: string
  industryName: string
  industryCode: string
  industryId: number
  subtypeName: string
  subtypeCode: string
  displayLabel: string
  searchKeywords: string[]
}

type BusinessContext = {
  profileId: number
  channelCode: string
}

type SelectedIndustryState = {
  industryId: number | null
  industryCode: string | null
  industryName: string
  subtypeId: number | null
  subtypeCode: string | null
  subtypeName: string
}

type ProfileDetailWithBusinessType =
  ProfileDetailPayload & {
    businessTypeCode?: string | null
  }

type BusinessHoursStateWithMeta = BusinessHoursState & {
  temporaryClosed?: 0 | 1
  alwaysOpen?: 0 | 1
  isOpenNow?: boolean
}

const BUSINESS_HOURS_DAY_LABELS: Record<DayKey, string> = {
  monday: '월요일',
  tuesday: '화요일',
  wednesday: '수요일',
  thursday: '목요일',
  friday: '금요일',
  saturday: '토요일',
  sunday: '일요일'
}

const BUSINESS_HOURS_DAY_ORDER: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
]

const BUSINESS_HOURS_TODAY_KEY_MAP: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
]

const INITIAL_ACCOUNT_STATE: BusinessAccountState = {
  businessName: '',
  businessIndustryName: '',
  businessTypeName: '',
  address: '',
  businessHours: '미등록',
  businessRegistrationNumber: '',
  primaryPhone: '',
  secondaryPhone: '',
  fax: '',
  managerEmail: '',
  operationPassword: '',
  paymentConfirmPassword: ''
}

const BASIC_INFO_CARDS: BusinessCardItem[] = [
  {
    key: 'businessName',
    title: '상호',
    description: '영수증, 예약, 스토어 화면에 표시될 사업장 이름과 업종 정보입니다.',
    buttonText: '상호/업종 관리'
  },
  {
    key: 'address',
    title: '사업장 주소',
    description: '예약, 방문, 배송 안내에 사용할 사업장 주소입니다.',
    buttonText: '주소 관리'
  },
  {
    key: 'businessHours',
    title: '영업시간',
    description: '영업일, 휴무일, 운영 시간을 관리합니다.',
    buttonText: '영업시간 관리'
  },
  {
    key: 'businessRegistrationNumber',
    title: '사업자번호',
    description: '영수증, 정산, 사업자 확인에 사용할 번호입니다.',
    buttonText: '사업자번호 관리'
  }
]

const CONTACT_INFO_CARDS: BusinessCardItem[] = [
  {
    key: 'primaryPhone',
    title: '대표 연락처',
    description: '고객 문의와 예약 확인에 사용할 대표 연락처입니다.',
    buttonText: '대표 연락처 관리'
  },
  {
    key: 'secondaryPhone',
    title: '보조 연락처',
    description: '예비 연락처 또는 담당자 연락처로 사용할 번호입니다.',
    buttonText: '보조 연락처 관리'
  },
  {
    key: 'fax',
    title: '팩스',
    description: '사업장 서류 수신에 사용할 팩스 번호입니다.',
    buttonText: '팩스 관리'
  },
  {
    key: 'managerEmail',
    title: '담당자 이메일',
    description: '예약, 정산, 운영 안내를 받을 담당자 이메일입니다.',
    buttonText: '이메일 관리'
  }
]

const SECURITY_CARDS: BusinessCardItem[] = [
  {
    key: 'operationPassword',
    title: '운영 비밀번호',
    description: 'POS 및 사업장 관리 진입에 사용하는 운영 비밀번호 상태입니다.',
    buttonText: '운영 비밀번호 설정/변경'
  },
  {
    key: 'paymentConfirmPassword',
    title: '정산 승인 비밀번호',
    description: '정산 통장 변경, 1차 비밀번호 변경, 사업자 정보 변경 보호에 사용하는 비밀번호 상태입니다.',
    buttonText: '정산 승인 비밀번호 설정/변경'
  }
]

export default function BusinessAccountPage() {
  const router = useRouter()
  const [accountState, setAccountState] = useState<BusinessAccountState>(INITIAL_ACCOUNT_STATE)
  const [businessContext, setBusinessContext] = useState<BusinessContext | null>(null)
  const [businessTypes, setBusinessTypes] = useState<BusinessTypeItem[]>([])
  const [selectedBusinessTypeCode, setSelectedBusinessTypeCode] = useState<BusinessTypeCode | null>(null)
  const [industryOptions, setIndustryOptions] = useState<IndustryOption[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState<SelectedIndustryState>({
    industryId: null,
    industryCode: null,
    industryName: '',
    subtypeId: null,
    subtypeCode: null,
    subtypeName: ''
  })
  const [activeModal, setActiveModal] = useState<BusinessAccountModalType>(null)
  const [modalValue, setModalValue] = useState('')
  const [modalIndustryValue, setModalIndustryValue] = useState('')
  const [industrySearchText, setIndustrySearchText] = useState('')
  const [isIndustryLoading, setIsIndustryLoading] = useState(false)
  const [currentRegionLabel, setCurrentRegionLabel] = useState('지역 미설정')
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [regionSearchText, setRegionSearchText] = useState('')
  const [regionResults, setRegionResults] = useState<Region[]>([])
  const [isRegionLoading, setIsRegionLoading] = useState(false)
  const [isModalSaving, setIsModalSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [businessRegistrationImageFileName, setBusinessRegistrationImageFileName] = useState('')
  const [businessRegistrationImagePreviewUrl, setBusinessRegistrationImagePreviewUrl] = useState('')
  const [businessRegistrationImageError, setBusinessRegistrationImageError] = useState('')
  const [businessHours, setBusinessHours] =
    useState<BusinessHoursStateWithMeta>(defaultBusinessHoursState)
  const [businessHoursTemporaryClosed, setBusinessHoursTemporaryClosed] =
    useState(false)
  const [businessHoursAlwaysOpen, setBusinessHoursAlwaysOpen] =
    useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [settlementApprovalPassword, setSettlementApprovalPassword] = useState('')
  const [newOperationPassword, setNewOperationPassword] = useState('')
  const [newOperationPasswordConfirm, setNewOperationPasswordConfirm] = useState('')
  const businessRegistrationImageInputRef = useRef<HTMLInputElement | null>(null)


  const openModal = (modalType: Exclude<BusinessAccountModalType, null>) => {
    setActiveModal(modalType)
    setModalError('')
    if (modalType === 'operationPassword') {
      setCurrentPassword('')
      setSettlementApprovalPassword('')
      setNewOperationPassword('')
      setNewOperationPasswordConfirm('')
      setModalValue('')
      return
    }

    if (modalType === 'paymentConfirmPassword') {
      setModalValue('')
      return
    }

    if (modalType === 'businessName') {
      setModalValue(accountState.businessName ?? '')
      setModalIndustryValue(accountState.businessIndustryName ?? '')
      setIndustrySearchText('')
      return
    }

    if (modalType === 'address') {
      setModalValue(accountState.address ?? '')
      setRegionSearchText('')
      setRegionResults([])
      return
    }

    if (modalType === 'businessHours') {
      setModalValue('')
      return
    }

    setModalValue(accountState[modalType] ?? '')
  }

  const closeModal = () => {
    setActiveModal(null)
    setModalValue('')
    setModalIndustryValue('')
    setIndustrySearchText('')
    setRegionSearchText('')
    setRegionResults([])
    setModalError('')
    setBusinessRegistrationImageFileName('')
    setBusinessRegistrationImagePreviewUrl('')
    setBusinessRegistrationImageError('')
    setCurrentPassword('')
    setSettlementApprovalPassword('')
    setNewOperationPassword('')
    setNewOperationPasswordConfirm('')
    if (businessRegistrationImageInputRef.current) {
      businessRegistrationImageInputRef.current.value = ''
    }
  }


  const resolveBusinessTypeCodeFromProfile = (
    profileDetail: ProfileDetailPayload
  ): BusinessTypeCode | null => {
    const detail = profileDetail as ProfileDetailWithBusinessType
    const raw = String(detail.businessTypeCode ?? '').trim()

    if (raw === 'STORE' || raw === 'FREELANCER' || raw === 'MOBILE_BIZ') {
      return raw
    }

    return null
  }

  const resolveBusinessTypeName = (
    businessTypeCode: BusinessTypeCode | null,
    types: BusinessTypeItem[]
  ) => {
    if (!businessTypeCode) {
      return ''
    }

    return types.find((type) => type.code === businessTypeCode)?.name ?? businessTypeCode
  }

  const formatIndustryLabel = (
    industryName?: string | null,
    subtypeName?: string | null
  ) => {
    const normalizedIndustryName = industryName?.trim() ?? ''
    const normalizedSubtypeName = subtypeName?.trim() ?? ''

    if (normalizedIndustryName && normalizedSubtypeName) {
      return `${normalizedIndustryName}(${normalizedSubtypeName})`
    }

    return normalizedIndustryName || normalizedSubtypeName || ''
  }

  const parseBusinessHoursMinutes = (time: string) => {
    const [hour, minute] = (time || '').split(':').map(Number)

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return null
    }

    return (hour * 60) + minute
  }

  const getBusinessHoursSummary = (
    hours: BusinessHoursStateWithMeta,
    temporaryClosed: boolean,
    alwaysOpen = false
  ) => {
    if (temporaryClosed) {
      return '전체 OFF'
    }

    if (alwaysOpen) {
      return '24시간 영업'
    }

    const todayKey = BUSINESS_HOURS_TODAY_KEY_MAP[new Date().getDay()]
    const todayHour = hours[todayKey]

    if (!todayHour || todayHour.isClosed) {
      return '오늘 휴무'
    }

    const start = parseBusinessHoursMinutes(todayHour.startTime)
    const end = parseBusinessHoursMinutes(todayHour.endTime)

    if (start === null || end === null) {
      return '설정됨'
    }

    const now = new Date()
    const nowMinutes = (now.getHours() * 60) + now.getMinutes()
    const isOpenNow = nowMinutes >= start && nowMinutes < end

    return `${isOpenNow ? '영업중' : '영업종료'} · ${todayHour.startTime} - ${todayHour.endTime}`
  }

  const updateBusinessHoursSummary = (
    hours: BusinessHoursStateWithMeta,
    temporaryClosed: boolean,
    alwaysOpen: boolean
  ) => {
    setAccountState((prev) => ({
      ...prev,
      businessHours: getBusinessHoursSummary(hours, temporaryClosed, alwaysOpen)
    }))
  }

  const toggleBusinessHoursClosed = (day: DayKey) => {
    setBusinessHoursAlwaysOpen(false)
    setBusinessHours((prev) => {
      const nextClosed = !prev[day].isClosed

      return {
        ...prev,
        [day]: {
          ...prev[day],
          isClosed: nextClosed,
          startTime: nextClosed ? '' : (prev[day].startTime || '09:00'),
          endTime: nextClosed ? '' : (prev[day].endTime || '18:00')
        }
      }
    })
  }

  const changeBusinessHoursStartTime = (
    day: DayKey,
    value: string
  ) => {
    setBusinessHoursAlwaysOpen(false)
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        startTime: value
      }
    }))
  }

  const changeBusinessHoursEndTime = (
    day: DayKey,
    value: string
  ) => {
    setBusinessHoursAlwaysOpen(false)
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        endTime: value
      }
    }))
  }

  const toggleBusinessHoursAlwaysOpen = () => {
    setModalError('')
    setBusinessHoursAlwaysOpen((prev) => {
      const nextAlwaysOpen = !prev

      if (nextAlwaysOpen) {
        setBusinessHoursTemporaryClosed(false)
      }

      return nextAlwaysOpen
    })
  }

  const toggleBusinessHoursTemporaryClosed = () => {
    setBusinessHoursTemporaryClosed((prev) => !prev)
    setModalError('')
  }

  const saveModalValue = async () => {
    if (!activeModal) {
      return
    }

    if (activeModal === 'operationPassword') {
      if (!businessContext) {
        setModalError('비즈니스 프로필 정보를 불러오지 못했습니다.')
        return
      }

      setIsModalSaving(true)
      setModalError('')

      try {
        await updateBusinessLoginPassword(
          businessContext.profileId,
          {
            currentPassword: trimmedCurrentPassword,
            settlementApprovalPassword: trimmedSettlementApprovalPassword,
            newPassword: trimmedNewOperationPassword,
            confirmNewPassword: trimmedNewOperationPasswordConfirm
          }
        )

        setAccountState((prev) => ({
          ...prev,
          operationPassword: '설정됨'
        }))
        closeModal()
      } catch (error) {
        console.error(error)
        setModalError('운영 비밀번호를 저장하지 못했습니다.')
      } finally {
        setIsModalSaving(false)
      }
      return
    }

    if (activeModal === 'businessName') {
      if (!businessContext) {
        setModalError('비즈니스 프로필 정보를 불러오지 못했습니다.')
        return
      }

      if (!selectedBusinessTypeCode) {
        setModalError('비즈니스 타입을 선택해 주세요.')
        return
      }

      if (!selectedIndustry.industryCode || !selectedIndustry.subtypeCode) {
        setModalError('업종을 선택해 주세요.')
        return
      }

      setIsModalSaving(true)
      setModalError('')

      try {
        await updateBusinessProfileCore(
          businessContext.profileId,
          {
            displayName: modalValue.trim() || null
          }
        )

        await updateBusinessType({
          profileId: businessContext.profileId,
          channelCode: businessContext.channelCode,
          businessTypeCode: selectedBusinessTypeCode
        })

        await updateBusinessIndustry({
          profileId: businessContext.profileId,
          channelCode: businessContext.channelCode,
          industryCode: selectedIndustry.industryCode,
          industrySubtypeCode: selectedIndustry.subtypeCode
        })

        setAccountState((prev) => ({
          ...prev,
          businessName: modalValue.trim(),
          businessIndustryName: formatIndustryLabel(
            selectedIndustry.industryName,
            selectedIndustry.subtypeName
          ),
          businessTypeName: resolveBusinessTypeName(
            selectedBusinessTypeCode,
            businessTypes
          )
        }))
        closeModal()
      } catch (error) {
        console.error(error)
        setModalError('상호/업종 정보를 저장하지 못했습니다.')
      } finally {
        setIsModalSaving(false)
      }
      return
    }

    if (activeModal === 'address') {
      if (!businessContext) {
        setModalError('비즈니스 프로필 정보를 불러오지 못했습니다.')
        return
      }

      if (!selectedRegion) {
        setModalError('지역을 선택해 주세요.')
        return
      }

      setIsModalSaving(true)
      setModalError('')

      try {
        await updateBusinessChannelRegion(
          businessContext.profileId,
          {
            activityRegionId: selectedRegion.id,
            feedRegionId: selectedRegion.id,
            detailAddress: modalValue.trim() || null
          }
        )

        const nextRegionLabel =
          selectedRegion.fullName ||
          selectedRegion.name ||
          '지역 미설정'

        setCurrentRegionLabel(nextRegionLabel)
        setAccountState((prev) => ({
          ...prev,
          address: modalValue.trim()
        }))
        closeModal()
      } catch (error) {
        console.error(error)
        setModalError('사업장 주소를 저장하지 못했습니다.')
      } finally {
        setIsModalSaving(false)
      }
      return
    }

    if (activeModal === 'businessRegistrationNumber') {
      if (!businessContext) {
        setModalError('비즈니스 프로필 정보를 불러오지 못했습니다.')
        return
      }

      const normalizedBusinessRegistrationNumber = modalValue.trim()

      if (!normalizedBusinessRegistrationNumber) {
        setModalError('사업자번호를 입력해 주세요.')
        return
      }

      setIsModalSaving(true)
      setModalError('')

      try {
        const result = await updateBusinessRegistrationNumber(
          businessContext.profileId,
          {
            channelCode: businessContext.channelCode,
            businessRegistrationNumber: normalizedBusinessRegistrationNumber
          }
        )

        setAccountState((prev) => ({
          ...prev,
          businessRegistrationNumber: result.businessRegistrationNumber
        }))
        closeModal()
      } catch (error) {
        console.error(error)
        setModalError('사업자번호를 저장하지 못했습니다.')
      } finally {
        setIsModalSaving(false)
      }
      return
    }

    if (activeModal === 'businessHours') {
      if (!businessContext) {
        setModalError('비즈니스 프로필 정보를 불러오지 못했습니다.')
        return
      }

      setIsModalSaving(true)
      setModalError('')

      try {
        await saveBusinessHoursSetting({
          ...businessHours,
          temporaryClosed: businessHoursTemporaryClosed ? 1 : 0,
          alwaysOpen: businessHoursAlwaysOpen ? 1 : 0
        })

        const refreshedHours = await getBusinessHoursSetting(
          businessContext.profileId,
          businessContext.channelCode
        )
        const nextTemporaryClosed = refreshedHours.temporaryClosed === 1
        const nextAlwaysOpen = refreshedHours.alwaysOpen === 1

        setBusinessHours(refreshedHours)
        setBusinessHoursTemporaryClosed(nextTemporaryClosed)
        setBusinessHoursAlwaysOpen(nextAlwaysOpen)
        updateBusinessHoursSummary(
          refreshedHours,
          nextTemporaryClosed,
          nextAlwaysOpen
        )
        closeModal()
      } catch (error) {
        console.error(error)
        setModalError('영업시간을 저장하지 못했습니다.')
      } finally {
        setIsModalSaving(false)
      }
      return
    }

    if (
      activeModal === 'primaryPhone' ||
      activeModal === 'secondaryPhone' ||
      activeModal === 'fax' ||
      activeModal === 'managerEmail'
    ) {
      if (!businessContext) {
        setModalError('비즈니스 프로필 정보를 불러오지 못했습니다.')
        return
      }

      const trimmedValue = modalValue.trim()
      const payload =
        activeModal === 'primaryPhone'
          ? { contactPhone: trimmedValue || null }
          : activeModal === 'secondaryPhone'
            ? { secondaryPhone: trimmedValue || null }
            : activeModal === 'fax'
              ? { faxNumber: trimmedValue || null }
              : { managerEmail: trimmedValue || null }

      setIsModalSaving(true)
      setModalError('')

      try {
        const result = await updateBusinessContactSettings(
          businessContext.profileId,
          payload
        )

        setAccountState((prev) => ({
          ...prev,
          primaryPhone: result.contactPhone ?? '',
          secondaryPhone: result.secondaryPhone ?? '',
          fax: result.faxNumber ?? '',
          managerEmail: result.managerEmail ?? ''
        }))
        closeModal()
      } catch (error) {
        console.error(error)
        setModalError('연락처 정보를 저장하지 못했습니다.')
      } finally {
        setIsModalSaving(false)
      }
      return
    }

    if (activeModal === 'paymentConfirmPassword') {
      if (!businessContext) {
        setModalError('비즈니스 프로필 정보를 불러오지 못했습니다.')
        return
      }

      const trimmedPassword = modalValue.trim()

      if (!trimmedPassword) {
        setModalError('정산 승인 비밀번호를 입력해 주세요.')
        return
      }

      setIsModalSaving(true)
      setModalError('')

      try {
        await updateBusinessPaymentPassword(
          businessContext.profileId,
          trimmedPassword
        )

        setAccountState((prev) => ({
          ...prev,
          paymentConfirmPassword: '설정됨'
        }))
        closeModal()
      } catch (error) {
        console.error(error)
        setModalError('정산 승인 비밀번호를 저장하지 못했습니다.')
      } finally {
        setIsModalSaving(false)
      }
      return
    }

    setAccountState((prev) => ({
      ...prev,
      [activeModal]: modalValue.trim()
    }))

    closeModal()
  }

  const hasModal = activeModal !== null
  const isOperationPasswordModal = activeModal === 'operationPassword'
  const trimmedCurrentPassword = currentPassword.trim()
  const trimmedSettlementApprovalPassword = settlementApprovalPassword.trim()
  const trimmedNewOperationPassword = newOperationPassword.trim()
  const trimmedNewOperationPasswordConfirm = newOperationPasswordConfirm.trim()
  const showOperationPasswordMatchMessage =
    trimmedNewOperationPassword.length > 0 &&
    trimmedNewOperationPasswordConfirm.length > 0
  const isOperationPasswordMatch =
    trimmedNewOperationPassword === trimmedNewOperationPasswordConfirm
  const isOperationPasswordSaveDisabled =
    trimmedCurrentPassword.length < 1 ||
    trimmedSettlementApprovalPassword.length < 1 ||
    trimmedNewOperationPassword.length < 1 ||
    trimmedNewOperationPasswordConfirm.length < 1 ||
    !isOperationPasswordMatch
  const isBusinessNameSaveDisabled =
    activeModal === 'businessName' &&
    (
      isModalSaving ||
      !businessContext ||
      !selectedBusinessTypeCode ||
      !selectedIndustry.industryCode ||
      !selectedIndustry.subtypeCode
    )
  const isAddressSaveDisabled =
    activeModal === 'address' &&
    (
      isModalSaving ||
      !businessContext ||
      !selectedRegion
    )
  const isBusinessRegistrationNumberSaveDisabled =
    activeModal === 'businessRegistrationNumber' &&
    (
      isModalSaving ||
      !businessContext ||
      modalValue.trim().length < 1
    )
  const isBusinessHoursSaveDisabled =
    activeModal === 'businessHours' &&
    (
      isModalSaving ||
      !businessContext
    )

  const resolveDisplayValue = (key: Exclude<BusinessAccountModalType, null>) => {
    const value = accountState[key]
    if (!value || value.trim().length < 1) {
      return '미등록'
    }

    return value
  }

  const resolveIndustryDisplayValue = () => {
    const value =
      activeModal === 'businessName' && modalIndustryValue.trim().length > 0
        ? modalIndustryValue
        : accountState.businessIndustryName

    if (!value || value.trim().length < 1) {
      return '미등록'
    }

    return value
  }

  const filteredIndustryOptions = useMemo(() => {
    if (!industrySearchText.trim()) {
      return []
    }

    return industryOptions
  }, [
    industryOptions,
    industrySearchText
  ])

  useEffect(() => {
    let mounted = true

    const loadBusinessAccount = async () => {
      try {
        const me = await getMe()
        const channelCode = me.user?.channelCode?.trim()

        if (me.user?.profileType !== 'BUSINESS' || !channelCode) {
          return
        }

        const profileDetail = await getProfileByChannelCode(channelCode)
        const profileId = Number(profileDetail.id)

        if (!mounted || !profileId) {
          return
        }

        const businessTypeResponse = await getBusinessTypes()
        const nextBusinessTypes = businessTypeResponse.items
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)

        const currentBusinessTypeCode =
          resolveBusinessTypeCodeFromProfile(profileDetail)

        const currentIndustry = await getCurrentBusinessIndustry(channelCode)
        const currentIndustryLabel = formatIndustryLabel(
          currentIndustry.current.industryName,
          currentIndustry.current.industrySubtypeName
        )
        const businessProfileFull = await getMyBusinessProfileFull()
        const regionName =
          businessProfileFull.placeMeta.activityRegion?.fullName ??
          businessProfileFull.placeMeta.feedRegion?.fullName ??
          '지역 미설정'
        const currentRegionId =
          businessProfileFull.activityRegionId ??
          businessProfileFull.feedRegionId ??
          null
        const currentBusinessHours = await getBusinessHoursSetting(
          profileId,
          channelCode
        )
        const currentBusinessHoursTemporaryClosed =
          currentBusinessHours.temporaryClosed === 1
        const currentBusinessHoursAlwaysOpen =
          currentBusinessHours.alwaysOpen === 1

        if (!mounted) {
          return
        }

        setBusinessContext({
          profileId,
          channelCode
        })
        setBusinessTypes(nextBusinessTypes)
        setSelectedBusinessTypeCode(currentBusinessTypeCode)
        setSelectedIndustry({
          industryId: currentIndustry.current.industryId ?? null,
          industryCode: currentIndustry.current.industryCode ?? null,
          industryName: currentIndustry.current.industryName ?? '',
          subtypeId: currentIndustry.current.industrySubtypeId ?? null,
          subtypeCode: currentIndustry.current.industrySubtypeCode ?? null,
          subtypeName: currentIndustry.current.industrySubtypeName ?? ''
        })
        setCurrentRegionLabel(regionName)
        setSelectedRegion(
          currentRegionId
            ? {
                id: currentRegionId,
                name: regionName,
                fullName: regionName
              }
            : null
        )
        setBusinessHours(currentBusinessHours)
        setBusinessHoursTemporaryClosed(currentBusinessHoursTemporaryClosed)
        setBusinessHoursAlwaysOpen(currentBusinessHoursAlwaysOpen)
        setAccountState((prev) => ({
          ...prev,
          businessName: profileDetail.displayName ?? '',
          businessIndustryName: currentIndustryLabel,
          businessTypeName: resolveBusinessTypeName(
            currentBusinessTypeCode,
            nextBusinessTypes
          ),
          address: businessProfileFull.placeMeta.detailAddress ?? prev.address,
          businessHours: getBusinessHoursSummary(
            currentBusinessHours,
            currentBusinessHoursTemporaryClosed,
            currentBusinessHoursAlwaysOpen
          ),
          businessRegistrationNumber:
            profileDetail.businessRegistrationNumber ?? prev.businessRegistrationNumber,
          primaryPhone:
            businessProfileFull.profile.contactPhone ??
            profileDetail.contactPhone ??
            prev.primaryPhone,
          secondaryPhone:
            businessProfileFull.profile.secondaryPhone ?? prev.secondaryPhone,
          fax:
            businessProfileFull.profile.faxNumber ?? prev.fax,
          managerEmail:
            businessProfileFull.profile.managerEmail ?? prev.managerEmail,
          operationPassword:
            businessProfileFull.profile.loginPasswordStatus === 'SET'
              ? '설정됨'
              : prev.operationPassword,
          paymentConfirmPassword:
            businessProfileFull.profile.paymentPasswordStatus === 'SET'
              ? '설정됨'
              : prev.paymentConfirmPassword
        }))
      } catch (error) {
        console.error(error)
      }
    }

    void loadBusinessAccount()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (activeModal !== 'businessName') {
      return
    }

    let mounted = true
    const timerId = window.setTimeout(() => {
      const loadIndustryOptions = async () => {
        setIsIndustryLoading(true)

        try {
          const query = industrySearchText.trim().toLowerCase()
          const industryRows = await searchBusinessIndustries()
          const nestedOptions = await Promise.all(
            industryRows.items.map(async (industry) => {
              const subtypes = await getBusinessIndustrySubtypes(industry.industryCode)

              return subtypes.items.map((subtype) => {
                const option: IndustryOption = {
                  id: subtype.subtypeId,
                  code: subtype.subtypeCode,
                  industryName: industry.industryName,
                  industryCode: industry.industryCode,
                  industryId: industry.industryId,
                  subtypeName: subtype.subtypeName ?? '',
                  subtypeCode: subtype.subtypeCode,
                  displayLabel: formatIndustryLabel(
                    industry.industryName,
                    subtype.subtypeName
                  ),
                  searchKeywords: [
                    industry.industryName,
                    industry.industryCode,
                    subtype.subtypeCode,
                    subtype.subtypeName ?? '',
                    subtype.searchKeywords ?? ''
                  ]
                }

                return option
              })
            })
          )

          const nextOptions = nestedOptions
            .flat()
            .filter((option) => {
              if (!query) {
                return true
              }

              return [
                option.displayLabel,
                option.industryName,
                option.subtypeName,
                option.code,
                ...option.searchKeywords
              ].some((keyword) => keyword.toLowerCase().includes(query))
            })

          if (mounted) {
            setIndustryOptions(nextOptions)
          }
        } catch (error) {
          console.error(error)

          if (mounted) {
            setIndustryOptions([])
          }
        } finally {
          if (mounted) {
            setIsIndustryLoading(false)
          }
        }
      }

      void loadIndustryOptions()
    }, 250)

    return () => {
      mounted = false
      window.clearTimeout(timerId)
    }
  }, [activeModal, industrySearchText])

  useEffect(() => {
    if (activeModal !== 'address') {
      return
    }

    const query = regionSearchText.trim()

    if (query.length < 2) {
      setRegionResults([])
      setIsRegionLoading(false)
      return
    }

    let mounted = true
    const timerId = window.setTimeout(() => {
      const loadRegionResults = async () => {
        setIsRegionLoading(true)

        try {
          const response = await searchRegions(query)

          if (!mounted) {
            return
          }

          setRegionResults(response.ok ? response.regions ?? [] : [])
        } catch (error) {
          console.error(error)

          if (mounted) {
            setRegionResults([])
          }
        } finally {
          if (mounted) {
            setIsRegionLoading(false)
          }
        }
      }

      void loadRegionResults()
    }, 300)

    return () => {
      mounted = false
      window.clearTimeout(timerId)
    }
  }, [activeModal, regionSearchText])

  useEffect(() => {
    return () => {
      if (businessRegistrationImagePreviewUrl) {
        URL.revokeObjectURL(businessRegistrationImagePreviewUrl)
      }
    }
  }, [businessRegistrationImagePreviewUrl])


  const handleSelectIndustry = (option: IndustryOption) => {
    setSelectedIndustry({
      industryId: option.industryId,
      industryCode: option.industryCode,
      industryName: option.industryName,
      subtypeId: option.id,
      subtypeCode: option.subtypeCode,
      subtypeName: option.subtypeName
    })
    setModalIndustryValue(option.displayLabel)
    setModalError('')
  }

  const handleSelectRegion = (region: Region) => {
    setSelectedRegion(region)
    setCurrentRegionLabel(region.fullName || region.name || '지역 미설정')
    setRegionSearchText('')
    setRegionResults([])
    setModalError('')
  }

  const handleBusinessRegistrationImageSelect = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp']

    if (!allowedMimeTypes.includes(file.type)) {
      setBusinessRegistrationImageError('png, jpg, webp 이미지만 첨부할 수 있습니다.')
      event.target.value = ''
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setBusinessRegistrationImageError('이미지 크기는 5MB 이하만 가능합니다.')
      event.target.value = ''
      return
    }

    if (businessRegistrationImagePreviewUrl) {
      URL.revokeObjectURL(businessRegistrationImagePreviewUrl)
    }

    setBusinessRegistrationImageFileName(file.name)
    setBusinessRegistrationImagePreviewUrl(URL.createObjectURL(file))
    setBusinessRegistrationImageError('')
  }

  const handleRemoveBusinessRegistrationImage = () => {
    if (businessRegistrationImagePreviewUrl) {
      URL.revokeObjectURL(businessRegistrationImagePreviewUrl)
    }

    setBusinessRegistrationImageFileName('')
    setBusinessRegistrationImagePreviewUrl('')
    setBusinessRegistrationImageError('')

    if (businessRegistrationImageInputRef.current) {
      businessRegistrationImageInputRef.current.value = ''
    }
  }
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => router.push('/profile')}
          >
            마이페이지로 돌아가기
          </button>
        </div>

        <div className={styles.titleBox}>
          <h1 className={styles.pageTitle}>비지니스 정보 관리</h1>
          <p className={styles.pageDescription}>사업장 기본정보와 연락처 정보를 관리합니다.</p>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>기본 사업장 정보</h2>
            <span className={styles.sectionHint}>사업장 기본값</span>
          </div>
          <div className={styles.cardGrid}>
            {BASIC_INFO_CARDS.map((card) => (
              <InfoCard
                key={card.key}
                title={card.title}
                value={resolveDisplayValue(card.key)}
                subValue={
                  card.key === 'businessName'
                    ? `업종: ${resolveIndustryDisplayValue()} · 타입: ${accountState.businessTypeName || '미등록'}`
                    : card.key === 'address'
                      ? `지역: ${currentRegionLabel}`
                    : undefined
                }
                description={card.description}
                buttonText={card.buttonText}
                onButtonClick={() => openModal(card.key)}
              />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>연락처 정보</h2>
            <span className={styles.sectionHint}>운영 연락 정보</span>
          </div>
          <div className={styles.cardGrid}>
            {CONTACT_INFO_CARDS.map((card) => (
              <InfoCard
                key={card.key}
                title={card.title}
                value={resolveDisplayValue(card.key)}
                description={card.description}
                buttonText={card.buttonText}
                onButtonClick={() => openModal(card.key)}
              />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>운영 보안 관리</h2>
            <span className={styles.sectionHint}>보안 설정</span>
          </div>
          <div className={styles.cardGrid}>
            {SECURITY_CARDS.map((card) => (
              <InfoCard
                key={card.key}
                title={card.title}
                value={resolveDisplayValue(card.key)}
                description={card.description}
                buttonText={card.buttonText}
                onButtonClick={() => openModal(card.key)}
              />
            ))}
          </div>
        </section>
      </div>

      {hasModal ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div
            className={
              activeModal === 'businessName' || activeModal === 'businessHours'
                ? `${styles.modalPanel} ${styles.modalPanelBusinessName}`
                : styles.modalPanel
            }
          >
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>{getModalTitle(activeModal)}</h2>
                <p className={styles.modalDescription}>{getModalDescription(activeModal)}</p>
              </div>
              <button type="button" className={styles.modalCloseButton} onClick={closeModal}>
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalScrollBody}>
                {isOperationPasswordModal ? (
                  <>
                    <label className={styles.modalInputGroup}>
                      <span className={styles.modalLabel}>현재 비밀번호</span>
                      <input
                        className={styles.modalInput}
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                      />
                    </label>

                    <label className={styles.modalInputGroup}>
                      <span className={styles.modalLabel}>정산 승인 비밀번호</span>
                      <input
                        className={styles.modalInput}
                        type="password"
                        value={settlementApprovalPassword}
                        onChange={(event) => setSettlementApprovalPassword(event.target.value)}
                      />
                    </label>

                    <label className={styles.modalInputGroup}>
                      <span className={styles.modalLabel}>새 운영 비밀번호</span>
                      <input
                        className={styles.modalInput}
                        type="password"
                        value={newOperationPassword}
                        onChange={(event) => setNewOperationPassword(event.target.value)}
                      />
                    </label>

                    <label className={styles.modalInputGroup}>
                      <span className={styles.modalLabel}>새 운영 비밀번호 확인</span>
                      <input
                        className={styles.modalInput}
                        type="password"
                        value={newOperationPasswordConfirm}
                        onChange={(event) => setNewOperationPasswordConfirm(event.target.value)}
                      />
                    </label>

                    {showOperationPasswordMatchMessage ? (
                      <p
                        className={
                          isOperationPasswordMatch
                            ? `${styles.passwordMatchMessage} ${styles.passwordMatchSuccess}`
                            : `${styles.passwordMatchMessage} ${styles.passwordMatchError}`
                        }
                      >
                        {isOperationPasswordMatch ? '일치됨' : '불일치'}
                      </p>
                    ) : null}
                  </>
                ) : activeModal === 'businessName' ? (
                  <div className={styles.businessIndustryForm}>
                    <label className={styles.modalInputGroup}>
                      <span className={styles.modalLabel}>상호</span>
                      <input
                        className={styles.modalInput}
                        type="text"
                        value={modalValue}
                        onChange={(event) => setModalValue(event.target.value)}
                        placeholder="상호 입력"
                      />
                    </label>

                    <section className={styles.industrySection}>
                      <div className={styles.industrySectionHeader}>
                        <span className={styles.modalLabel}>비즈니스 타입</span>
                        <span className={styles.industrySectionHint}>
                          {businessTypes.length}개
                        </span>
                      </div>

                      <div className={styles.businessTypeGrid}>
                        {businessTypes.map((type) => {
                          const isSelected = selectedBusinessTypeCode === type.code

                          return (
                            <button
                              key={type.code}
                              type="button"
                              className={
                                isSelected
                                  ? `${styles.businessTypeButton} ${styles.businessTypeButtonActive}`
                                  : styles.businessTypeButton
                              }
                              onClick={() => {
                                setSelectedBusinessTypeCode(type.code)
                                setModalError('')
                              }}
                            >
                              <span className={styles.businessTypeName}>{type.name}</span>
                              {type.description ? (
                                <span className={styles.businessTypeDescription}>
                                  {type.description}
                                </span>
                              ) : null}
                            </button>
                          )
                        })}
                      </div>
                    </section>

                    <section className={styles.industrySection}>
                      <span className={styles.modalLabel}>현재 업종</span>
                      <div className={styles.industryCurrentBox}>
                        <strong className={styles.industryCurrentValue}>
                          {resolveIndustryDisplayValue()}
                        </strong>
                      </div>
                    </section>

                    <label className={styles.modalInputGroup}>
                      <span className={styles.modalLabel}>업종 검색</span>
                      <input
                        className={styles.modalInput}
                        type="search"
                        value={industrySearchText}
                        onChange={(event) => setIndustrySearchText(event.target.value)}
                        placeholder="업종명을 검색하세요"
                      />
                    </label>

                    <section className={styles.industrySection}>
                      <div className={styles.industrySectionHeader}>
                        <span className={styles.modalLabel}>업종 선택</span>
                        <span className={styles.industrySectionHint}>
                          {isIndustryLoading ? '조회 중' : `${filteredIndustryOptions.length}개`}
                        </span>
                      </div>

                      <div className={styles.industryGrid}>
                        {isIndustryLoading ? (
                          <div className={styles.industryEmptyState}>업종을 불러오는 중입니다.</div>
                        ) : !industrySearchText.trim() ? (
                          <div className={styles.industryEmptyState}>업종명을 검색하세요</div>
                        ) : filteredIndustryOptions.length > 0 ? (
                          filteredIndustryOptions.map((option) => {
                            const isSelected = selectedIndustry.subtypeCode === option.subtypeCode

                            return (
                              <button
                                key={`${option.industryCode}-${option.subtypeCode}`}
                                type="button"
                                className={
                                  isSelected
                                    ? `${styles.industryOptionButton} ${styles.industryOptionButtonActive}`
                                    : styles.industryOptionButton
                                }
                                onClick={() => handleSelectIndustry(option)}
                              >
                                <span className={styles.industryOptionLabel}>{option.displayLabel}</span>
                                <span className={styles.industryOptionCode}>{option.code}</span>
                              </button>
                            )
                          })
                        ) : (
                          <div className={styles.industryEmptyState}>검색 결과가 없습니다.</div>
                        )}
                      </div>
                    </section>

                    {modalError ? (
                      <p className={styles.modalError}>{modalError}</p>
                    ) : null}
                  </div>
                ) : activeModal === 'address' ? (
                  <div className={styles.addressForm}>
                    <section className={styles.industrySection}>
                      <span className={styles.modalLabel}>현재 지역</span>
                      <div className={styles.industryCurrentBox}>
                        <strong className={styles.industryCurrentValue}>
                          {currentRegionLabel}
                        </strong>
                      </div>
                    </section>

                    <label className={styles.modalInputGroup}>
                      <span className={styles.modalLabel}>지역 검색</span>
                      <input
                        className={styles.modalInput}
                        type="search"
                        value={regionSearchText}
                        onChange={(event) => setRegionSearchText(event.target.value)}
                        placeholder="2자 이상 입력 시 자동 검색"
                      />
                    </label>

                    <section className={styles.industrySection}>
                      <div className={styles.industrySectionHeader}>
                        <span className={styles.modalLabel}>검색 결과</span>
                        <span className={styles.industrySectionHint}>
                          {isRegionLoading ? '검색 중' : `${regionResults.length}개`}
                        </span>
                      </div>

                      {regionSearchText.trim() ? (
                        <div className={styles.regionResultList}>
                          {isRegionLoading ? (
                            <div className={styles.industryEmptyState}>지역을 검색하는 중입니다.</div>
                          ) : regionResults.length > 0 ? (
                            regionResults.map((region) => {
                              const isSelected = selectedRegion?.id === region.id

                              return (
                                <button
                                  key={region.id}
                                  type="button"
                                  className={
                                    isSelected
                                      ? `${styles.regionResultButton} ${styles.regionResultButtonActive}`
                                      : styles.regionResultButton
                                  }
                                  onClick={() => handleSelectRegion(region)}
                                >
                                  {region.fullName || region.name}
                                </button>
                              )
                            })
                          ) : (
                            <div className={styles.industryEmptyState}>검색 결과가 없습니다.</div>
                          )}
                        </div>
                      ) : (
                        <div className={styles.industryEmptyState}>지역명을 검색하세요</div>
                      )}
                    </section>

                    <section className={styles.industrySection}>
                      <span className={styles.modalLabel}>선택 지역</span>
                      <div className={styles.industryCurrentBox}>
                        <strong className={styles.industryCurrentValue}>
                          {selectedRegion?.fullName || selectedRegion?.name || '선택된 지역이 없습니다.'}
                        </strong>
                      </div>
                    </section>

                    <label className={styles.modalInputGroup}>
                      <span className={styles.modalLabel}>상세 주소</span>
                      <input
                        className={styles.modalInput}
                        type="text"
                        value={modalValue}
                        onChange={(event) => setModalValue(event.target.value)}
                        placeholder="상세 주소 입력"
                      />
                    </label>

                    {modalError ? (
                      <p className={styles.modalError}>{modalError}</p>
                    ) : null}
                  </div>
                ) : activeModal === 'businessHours' ? (
                  <div className={styles.businessHoursForm}>
                    <section className={styles.businessHoursTodayBox}>
                      <span className={styles.modalLabel}>Today</span>
                      <strong className={styles.businessHoursTodayText}>
                        {getBusinessHoursSummary(
                          businessHours,
                          businessHoursTemporaryClosed,
                          businessHoursAlwaysOpen
                        )}
                      </strong>
                    </section>

                    <section className={styles.businessHoursOffBox}>
                      <div>
                        <strong className={styles.businessHoursOffTitle}>24시간 운영</strong>
                        <p className={styles.businessHoursOffDescription}>
                          모든 요일을 24시간 영업 상태로 설정합니다.
                        </p>
                      </div>
                      <button
                        type="button"
                        className={
                          businessHoursAlwaysOpen
                            ? `${styles.businessHoursToggle} ${styles.businessHoursToggleOpenActive}`
                            : `${styles.businessHoursToggle} ${styles.businessHoursToggleOpenInactive}`
                        }
                        onClick={toggleBusinessHoursAlwaysOpen}
                        aria-pressed={businessHoursAlwaysOpen}
                      >
                        {businessHoursAlwaysOpen ? 'ON' : 'OFF'}
                      </button>
                    </section>

                    <section className={styles.businessHoursOffBox}>
                      <div>
                        <strong className={styles.businessHoursOffTitle}>전체 OFF</strong>
                        <p className={styles.businessHoursOffDescription}>
                          긴급한 문제 발생 시 영업시간 전체를 즉시 비활성화합니다.
                        </p>
                      </div>
                      <button
                        type="button"
                        className={
                          businessHoursTemporaryClosed
                            ? `${styles.businessHoursToggle} ${styles.businessHoursToggleActive}`
                            : styles.businessHoursToggle
                        }
                        onClick={() => {
                          toggleBusinessHoursTemporaryClosed()
                        }}
                        aria-pressed={businessHoursTemporaryClosed}
                      >
                        {businessHoursTemporaryClosed ? 'ON' : 'OFF'}
                      </button>
                    </section>

                    <section className={styles.businessHoursDayList}>
                      {BUSINESS_HOURS_DAY_ORDER.map((day) => {
                        const hour: BusinessHour = businessHours[day]

                        return (
                          <div className={styles.businessHoursDayRow} key={day}>
                            <strong className={styles.businessHoursDayName}>
                              {BUSINESS_HOURS_DAY_LABELS[day]}
                            </strong>
                            <input
                              className={styles.businessHoursTimeInput}
                              type="time"
                              value={hour.startTime}
                              disabled={
                                hour.isClosed ||
                                businessHoursTemporaryClosed ||
                                businessHoursAlwaysOpen
                              }
                              onChange={(event) => {
                                changeBusinessHoursStartTime(day, event.target.value)
                              }}
                            />
                            <input
                              className={styles.businessHoursTimeInput}
                              type="time"
                              value={hour.endTime}
                              disabled={
                                hour.isClosed ||
                                businessHoursTemporaryClosed ||
                                businessHoursAlwaysOpen
                              }
                              onChange={(event) => {
                                changeBusinessHoursEndTime(day, event.target.value)
                              }}
                            />
                            <label className={styles.businessHoursClosedCheck}>
                              <input
                                type="checkbox"
                                checked={hour.isClosed}
                                disabled={businessHoursTemporaryClosed}
                                onChange={() => {
                                  toggleBusinessHoursClosed(day)
                                }}
                              />
                              휴무
                            </label>
                          </div>
                        )
                      })}
                    </section>

                    {modalError ? (
                      <p className={styles.modalError}>{modalError}</p>
                    ) : null}
                  </div>
                ) : activeModal === 'businessRegistrationNumber' ? (
                  <div className={styles.businessRegistrationForm}>
                    <label className={styles.modalInputGroup}>
                      <span className={styles.modalLabel}>사업자번호</span>
                      <input
                        className={styles.modalInput}
                        type="text"
                        value={modalValue}
                        onChange={(event) => setModalValue(event.target.value)}
                        placeholder="사업자번호 입력"
                      />
                    </label>

                    <section className={styles.businessRegistrationImageSection}>
                      <div className={styles.businessRegistrationImageHeader}>
                        <span className={styles.modalLabel}>사업자 확인 이미지</span>
                        <span className={styles.businessRegistrationImageHint}>
                          사업자등록증 또는 사업자 확인에 사용할 이미지를 첨부합니다.
                        </span>
                      </div>

                      <div className={styles.businessRegistrationImageBox}>
                        <div className={styles.businessRegistrationImageToolbar}>
                          <input
                            ref={businessRegistrationImageInputRef}
                            className={styles.hiddenFileInput}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleBusinessRegistrationImageSelect}
                          />
                          <button
                            type="button"
                            className={styles.imageAttachButton}
                            onClick={() => businessRegistrationImageInputRef.current?.click()}
                          >
                            이미지 첨부
                          </button>

                          {businessRegistrationImageFileName ? (
                            <button
                              type="button"
                              className={styles.imageRemoveButton}
                              onClick={handleRemoveBusinessRegistrationImage}
                            >
                              첨부 이미지 제거
                            </button>
                          ) : null}
                        </div>

                        <div className={styles.businessRegistrationImageMeta}>
                          <span className={styles.businessRegistrationImageFileName}>
                            {businessRegistrationImageFileName || '선택된 이미지가 없습니다.'}
                          </span>
                          {businessRegistrationImageError ? (
                            <span className={styles.businessRegistrationImageError}>
                              {businessRegistrationImageError}
                            </span>
                          ) : null}
                        </div>

                        {businessRegistrationImagePreviewUrl ? (
                          <div className={styles.businessRegistrationImagePreviewBox}>
                            <img
                              className={styles.businessRegistrationImagePreview}
                              src={businessRegistrationImagePreviewUrl}
                              alt="사업자 확인 이미지 미리보기"
                            />
                          </div>
                        ) : null}
                      </div>
                    </section>

                    {modalError ? (
                      <p className={styles.modalError}>{modalError}</p>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <label className={styles.inputLabel}>
                      <span>{getModalLabel(activeModal)}</span>
                      <input
                        className={styles.modalInput}
                        type={activeModal === 'paymentConfirmPassword' ? 'password' : 'text'}
                        value={modalValue}
                        onChange={(event) => setModalValue(event.target.value)}
                        placeholder={`${getModalLabel(activeModal)} 입력`}
                      />
                    </label>

                    {modalError ? (
                      <p className={styles.modalError}>{modalError}</p>
                    ) : null}
                  </>
                )}
              </div>

              <div className={styles.modalFooter}>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.modalCancelButton} onClick={closeModal}>
                    취소
                  </button>
                  <button
                    type="button"
                    className={
                      isModalSaving ||
                      (isOperationPasswordModal && isOperationPasswordSaveDisabled) ||
                      isBusinessNameSaveDisabled ||
                      isAddressSaveDisabled ||
                      isBusinessRegistrationNumberSaveDisabled ||
                      isBusinessHoursSaveDisabled
                        ? styles.modalDisabledButton
                        : styles.modalSaveButton
                    }
                    onClick={saveModalValue}
                    disabled={
                      isModalSaving ||
                      (isOperationPasswordModal && isOperationPasswordSaveDisabled) ||
                      isBusinessNameSaveDisabled ||
                      isAddressSaveDisabled ||
                      isBusinessRegistrationNumberSaveDisabled ||
                      isBusinessHoursSaveDisabled
                    }
                  >
                    {isModalSaving ? '저장 중' : '저장'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

function InfoCard({
  title,
  value,
  subValue,
  description,
  buttonText,
  onButtonClick
}: {
  title: string
  value: string
  subValue?: string
  description: string
  buttonText: string
  onButtonClick: () => void
}) {
  const isRegistered = value !== '미등록'

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTextBox}>
          <h3 className={styles.cardTitle}>{title}</h3>
          <p className={styles.cardValue}>{value}</p>
          {subValue ? <p className={styles.cardSubValue}>{subValue}</p> : null}
        </div>
        <span className={`${styles.badge} ${isRegistered ? styles.badgeSAFE : styles.badgeWARNING}`}>
          {isRegistered ? '등록됨' : '미등록'}
        </span>
      </div>

      <p className={styles.cardDescription}>{description}</p>

      <div className={styles.cardAction}>
        <button type="button" className={styles.actionButton} onClick={onButtonClick}>
          {buttonText}
        </button>
      </div>
    </article>
  )
}

function getModalTitle(modalType: BusinessAccountModalType) {
  if (modalType === 'businessName') return '상호/업종 관리'
  if (modalType === 'address') return '주소 관리'
  if (modalType === 'businessHours') return '영업시간 관리'
  if (modalType === 'businessRegistrationNumber') return '사업자번호 관리'
  if (modalType === 'primaryPhone') return '대표 연락처 관리'
  if (modalType === 'secondaryPhone') return '보조 연락처 관리'
  if (modalType === 'fax') return '팩스 관리'
  if (modalType === 'managerEmail') return '담당자 이메일 관리'
  if (modalType === 'operationPassword') return '운영 비밀번호 관리'
  if (modalType === 'paymentConfirmPassword') return '정산 승인 비밀번호 관리'
  return ''
}

function getModalDescription(modalType: BusinessAccountModalType) {
  if (modalType === 'businessName') return '사업장 이름과 업종 정보를 입력하거나 수정합니다.'
  if (modalType === 'address') return '예약/방문 안내에 사용할 주소를 입력하거나 수정합니다.'
  if (modalType === 'businessHours') return '영업일, 휴무일, 운영 시간을 관리합니다.'
  if (modalType === 'businessRegistrationNumber') return '사업자 확인에 사용할 번호를 입력하거나 수정합니다.'
  if (modalType === 'primaryPhone') return '대표 연락처를 입력하거나 수정합니다.'
  if (modalType === 'secondaryPhone') return '보조 연락처를 입력하거나 수정합니다.'
  if (modalType === 'fax') return '팩스 번호를 입력하거나 수정합니다.'
  if (modalType === 'managerEmail') return '담당자 이메일을 입력하거나 수정합니다.'
  if (modalType === 'operationPassword') return '현재 비밀번호와 정산 승인 비밀번호 확인 후 운영 비밀번호를 변경합니다.'
  if (modalType === 'paymentConfirmPassword') return '정산 승인 비밀번호 설정/변경을 위한 목업 입력입니다.'
  return ''
}

function getModalLabel(modalType: BusinessAccountModalType) {
  if (modalType === 'businessName') return '상호'
  if (modalType === 'address') return '사업장 주소'
  if (modalType === 'businessHours') return '영업시간'
  if (modalType === 'businessRegistrationNumber') return '사업자번호'
  if (modalType === 'primaryPhone') return '대표 연락처'
  if (modalType === 'secondaryPhone') return '보조 연락처'
  if (modalType === 'fax') return '팩스'
  if (modalType === 'managerEmail') return '담당자 이메일'
  if (modalType === 'operationPassword') return '운영 비밀번호'
  if (modalType === 'paymentConfirmPassword') return '정산 승인 비밀번호'
  return ''
}
