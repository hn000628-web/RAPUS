// FILE : frontend/app/(pos)/pos/table/[tableNo]/page.tsx
// ROOT : frontend/app/(pos)/pos/table/[tableNo]/page.tsx
// STATUS : MODIFY MODE
// ROLE : POS TABLE PAGE
// CHANGE SUMMARY :
// - 테이블 주문 화면 헤더에 QR 오더 버튼 추가
// - QR 오더 버튼 클릭 시 현재 tableNo 기준 UI 목업 알림 처리
// - 기존 POS 주문 UI / 수량 / 총액 계산 로직 유지
// - 기존 테이블 메인 이동 버튼 유지
// - API 호출 없음
// - DB 직접 접근 없음

'use client'

// SECTION 01 : IMPORT

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent
} from 'react'

import {
  useParams,
  useRouter
} from 'next/navigation'

import styles from './PostablePage.module.css'

import PosTopbar from '../../components/PosTopbar'
import { usePosKeyboardMode } from '../../components/PosKeyboardModeContext'
import PosCategorySidebar from '../../components/tableCategorySidebar'
import PosOrderList from '../../components/PosOrderList'
import PosOrderFooter from '../../components/PosOrderFooter'
import PosTableQrModal from '../../settings/table/components/PosTableQrModal'
import { getMe } from '@/lib/authApi'
import { getPosProductCategories } from '@/lib/business/pos/posCategoriesApi'
import { getPosMenus, PosMenuContext, PosMenuItem as PosDbMenuItem } from '@/lib/business/pos/posMenuApi'
import { cancelPosOrder, completePosPayment, createPosOrder, getActivePosOrder } from '@/lib/business/pos/posOrdersApi'
import { getPosTableSettings, PosTableSettingItem, updatePosTableResourceStatus } from '@/lib/business/pos/posTableSettingsApi'
import { mediaUrl } from '@/lib/media'

// SECTION 02 : TYPE

type PosCategory = {
  id: string
  label: string
}

type PosMenuItem = {
  id: string
  categoryId: string
  name: string
  description: string
  price: number
  thumbnailUrl: string | null
  options: PosMenuOption[]
}
type PosMenuOption = {
  id: string
  label: string
  extraPrice: number
  optionId?: number | null
  optionValueId?: number | null
  optionType?: 'SIZE' | 'TEMPERATURE' | 'ADDON' | 'CHOICE' | 'CUSTOM' | null
  isQuantityEnabled: boolean
  isQuantityLimitEnabled: boolean
  minOptionQuantity: number
  maxOptionQuantity: number | null
  defaultOptionQuantity: number
}

type PosOrderType = 'DINE_IN' | 'TAKEOUT'
type PosPaymentType = 'CARD' | 'CASH' | 'UNPAID'
type PosPaymentMethod = 'CARD' | 'CASH' | 'QR'
type PosPaymentMethodOption = {
  method: PosPaymentMethod
  label: string
  keyCode: string
  keyNumber: string
  guideLabel: string
}

type PosReservationForm = {
  reserverName: string
  phoneNumber: string
  reservationDate: string
  reservationTime: string
  partySize: string
  memo: string
}

// SECTION 03 : CONSTANT

// NOTE:
// 현재는 mock 주문 데이터이며, 추후 실제 연동 시
// orderNumber -> totalAmount -> QR payment session 생성 순서로 연결한다.
// (DB -> Service -> Controller -> Front API -> UI)
const MOCK_PAYMENT_ORDER = {
  orderNumber: 'XDXD-540134'
} as const

const TABLE_ORDER_BLOCK_MESSAGE =
  '테이블 정리대기 상태입니다. 정리완료 후 주문을 등록할 수 있습니다.'

const PAYMENT_METHOD_OPTIONS: PosPaymentMethodOption[] = [
  {
    method: 'CARD',
    label: '카드',
    keyCode: 'Numpad8',
    keyNumber: '8',
    guideLabel: '카드 선택'
  },
  {
    method: 'CASH',
    label: '현금',
    keyCode: 'Numpad7',
    keyNumber: '7',
    guideLabel: '현금 선택'
  },
  {
    method: 'QR',
    label: 'QR',
    keyCode: 'Numpad9',
    keyNumber: '9',
    guideLabel: 'QR 선택'
  }
]

// SECTION 04 : COMPONENT

export default function PosTablePage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const params = useParams<{ tableNo: string | string[] }>()

  const tableNoRaw =
    Array.isArray(params?.tableNo)
      ? params.tableNo[0]
      : params?.tableNo

  const safeTableNoRaw =
    tableNoRaw && tableNoRaw.length > 0
      ? tableNoRaw
      : '0'

  const tableNo =
    Number.parseInt(
      safeTableNoRaw,
      10
    )

  const tableNoLabel =
    Number.isFinite(tableNo) && tableNo > 0
      ? `${tableNo}번`
      : `${safeTableNoRaw}번`

  const [dbCategories, setDbCategories] =
    useState<PosCategory[]>([])
  const [dbMenuItems, setDbMenuItems] =
    useState<PosMenuItem[]>([])
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>('')
  const [selectedMenuId, setSelectedMenuId] =
    useState<string>('')
  const [optionQuantitiesByMenu, setOptionQuantitiesByMenu] =
    useState<Record<string, Record<string, number>>>({})
  const [isMenuLoading, setIsMenuLoading] =
    useState<boolean>(false)
  const [menuLoadError, setMenuLoadError] =
    useState<string | null>(null)
  const [failedMenuThumbnailKeys, setFailedMenuThumbnailKeys] =
    useState<Set<string>>(new Set())

  const [quantities, setQuantities] =
    useState<Record<string, number>>({})

  const [selectedOrderType, setSelectedOrderType] =
    useState<PosOrderType>('DINE_IN')

  const [selectedPaymentType, setSelectedPaymentType] =
    useState<PosPaymentType>('CARD')

  const [isOrderConfirmed, setIsOrderConfirmed] =
    useState<boolean>(false)

  const [isOrderSubmitted, setIsOrderSubmitted] =
    useState<boolean>(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] =
    useState<boolean>(false)
  const [isQrModalOpen, setIsQrModalOpen] =
    useState<boolean>(false)
  const [isReservationModalOpen, setIsReservationModalOpen] =
    useState<boolean>(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PosPaymentMethod | null>(null)
  const [currentBusinessName, setCurrentBusinessName] =
    useState<string>('상호명 미설정')
  const [currentChannelCode, setCurrentChannelCode] =
    useState<string>('')
  const [currentProfileId, setCurrentProfileId] =
    useState<number | null>(null)
  const [currentPosTable, setCurrentPosTable] =
    useState<PosTableSettingItem | null>(null)
  const [createdOrderId, setCreatedOrderId] =
    useState<number | null>(null)
  const [createdOrderCode, setCreatedOrderCode] =
    useState<string | null>(null)
  const [createdOrderNumber, setCreatedOrderNumber] =
    useState<string | null>(null)
  const [isOrderSubmitting, setIsOrderSubmitting] =
    useState<boolean>(false)
  const [orderSubmitError, setOrderSubmitError] =
    useState<string | null>(null)
  const [receivedCashAmount, setReceivedCashAmount] =
    useState<number>(0)
  const [reservationForm, setReservationForm] =
    useState<PosReservationForm>({
      reserverName: '',
      phoneNumber: '',
      reservationDate: '',
      reservationTime: '',
      partySize: '1',
      memo: ''
    })

  // SECTION 05 : DATA

  const activeCategories = useMemo(
    () => dbCategories,
    [dbCategories]
  )

  const activeMenuItems = useMemo(
    () => dbMenuItems,
    [dbMenuItems]
  )

  const visibleMenus = useMemo(
    () => activeMenuItems.filter((item) => item.categoryId === selectedCategoryId),
    [activeMenuItems, selectedCategoryId]
  )
  const selectedMenu = useMemo(
    () => visibleMenus.find((menu) => menu.id === selectedMenuId) ?? null,
    [visibleMenus, selectedMenuId]
  )
  const selectedMenuQuantity = useMemo(
    () => (selectedMenu ? (quantities[selectedMenu.id] ?? 0) : 0),
    [selectedMenu, quantities]
  )
  const selectedMenuOptions = useMemo<PosMenuOption[]>(
    () => {
      if (!selectedMenu) {
        return []
      }

      return selectedMenu.options
    },
    [selectedMenu]
  )

  const orderItems = useMemo(
    () =>
      activeMenuItems
        .filter((item) => (quantities[item.id] ?? 0) > 0)
        .map((item) => ({
          ...item,
          quantity: quantities[item.id] ?? 0
        })),
    [activeMenuItems, quantities]
  )

  const orderItemsForDisplay = useMemo(
    () =>
      orderItems.map((item) => {
        const optionQuantityMap = optionQuantitiesByMenu[item.id] ?? {}
        const selectedOptions = (item.options ?? [])
          .map((option) => {
            const quantity = getResolvedOptionQuantity(
              option,
              optionQuantityMap[option.id] ?? 0
            )

            return {
              id: option.id,
              label: option.label,
              quantity,
              extraPrice: option.extraPrice
            }
          })
          .filter((option) => option.quantity > 0)

        return {
          ...item,
          selectedOptions
        }
      }),
    [orderItems, optionQuantitiesByMenu]
  )

  const totalAmount = useMemo(
    () => {
      const menuBaseAmount = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )

      const optionExtraAmount = orderItems.reduce((sum, item) => {
        const optionQuantityMap = optionQuantitiesByMenu[item.id] ?? {}

        const optionAmount = item.options.reduce((optionSum, option) => {
          const optionCount = getResolvedOptionQuantity(
            option,
            optionQuantityMap[option.id] ?? 0
          )
          return optionSum + option.extraPrice * optionCount
        }, 0)

        return sum + optionAmount * item.quantity
      }, 0)

      return menuBaseAmount + optionExtraAmount
    },
    [orderItems, optionQuantitiesByMenu]
  )

  const totalOrderItemCount = useMemo(
    () =>
      orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
    [orderItems]
  )

  const qrTableCode = useMemo(
    () => safeTableNoRaw.trim(),
    [safeTableNoRaw]
  )

  const qrOrderUrl = useMemo(() => {
    if (!currentChannelCode || !qrTableCode) {
      return ''
    }

    return `https://rapus.kr/order/qr/${currentChannelCode}/table/${qrTableCode}`
  }, [currentChannelCode, qrTableCode])

  const changeAmount = useMemo(
    () => Math.max(receivedCashAmount - totalAmount, 0),
    [receivedCashAmount, totalAmount]
  )

  const isCashPaymentInsufficient =
    selectedPaymentMethod === 'CASH' &&
    receivedCashAmount < totalAmount

  const isTableOrderBlocked =
    useMemo(
      () => isCleaningResourceStatus(currentPosTable?.resourceStatus),
      [currentPosTable?.resourceStatus]
    )

  const findMenuOption = (menuId: string, optionId: string): PosMenuOption | null => {
    const targetMenu = activeMenuItems.find((menu) => menu.id === menuId)
    return targetMenu?.options.find((option) => option.id === optionId) ?? null
  }

  // SECTION 06 : EVENT
  const isEditableTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
      return false
    }

    const tagName = target.tagName

    return tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable
  }

  const handleIncrease = (menuId: string) => {
    setIsOrderSubmitted(false)
    setIsOrderConfirmed(false)
    setOrderSubmitError(null)
    setQuantities((prev) => ({
      ...prev,
      [menuId]: (prev[menuId] ?? 0) + 1
    }))
  }

  const handleDecrease = (menuId: string) => {
    setIsOrderSubmitted(false)
    setIsOrderConfirmed(false)
    setOrderSubmitError(null)
    setQuantities((prev) => {
      const current = prev[menuId] ?? 0

      if (current <= 1) {
        const next = {
          ...prev
        }

        delete next[menuId]
        setOptionQuantitiesByMenu((prevOptions) => {
          if (!(menuId in prevOptions)) {
            return prevOptions
          }

          const nextOptions = {
            ...prevOptions
          }

          delete nextOptions[menuId]
          return nextOptions
        })

        return next
      }

      return {
        ...prev,
        [menuId]: current - 1
      }
    })
  }
  const handleSelectMenu = (menuId: string) => {
    setSelectedMenuId(menuId)
  }

  const handleIncreaseOption = (menuId: string, optionId: string) => {
    const targetOption = findMenuOption(menuId, optionId)
    if (!targetOption?.isQuantityEnabled) {
      return
    }

    setIsOrderSubmitted(false)
    setIsOrderConfirmed(false)
    setOrderSubmitError(null)
    setOptionQuantitiesByMenu((prev) => {
      const currentMenuOptions = prev[menuId] ?? {}
      const currentCount = currentMenuOptions[optionId] ?? 0
      const nextCount = currentCount > 0
        ? currentCount + 1
        : getOptionDefaultQuantity(targetOption)

      return {
        ...prev,
        [menuId]: {
          ...currentMenuOptions,
          [optionId]: getResolvedOptionQuantity(targetOption, nextCount)
        }
      }
    })
  }

  const handleDecreaseOption = (menuId: string, optionId: string) => {
    const targetOption = findMenuOption(menuId, optionId)
    if (!targetOption?.isQuantityEnabled) {
      return
    }

    setIsOrderSubmitted(false)
    setIsOrderConfirmed(false)
    setOrderSubmitError(null)
    setOptionQuantitiesByMenu((prev) => {
      const currentMenuOptions = prev[menuId] ?? {}
      const currentCount = getResolvedOptionQuantity(
        targetOption,
        currentMenuOptions[optionId] ?? 0
      )
      const minQuantity = getOptionMinQuantity(targetOption)

      if (currentCount <= 0) {
        return prev
      }

      const nextMenuOptions = { ...currentMenuOptions }

      if (currentCount <= minQuantity) {
        delete nextMenuOptions[optionId]
      } else {
        nextMenuOptions[optionId] = currentCount - 1
      }

      return {
        ...prev,
        [menuId]: nextMenuOptions
      }
    })
  }

  const handleToggleSingleOption = (menuId: string, optionId: string) => {
    const targetOption = findMenuOption(menuId, optionId)
    if (!targetOption || targetOption.isQuantityEnabled) {
      return
    }

    setIsOrderSubmitted(false)
    setIsOrderConfirmed(false)
    setOrderSubmitError(null)
    setOptionQuantitiesByMenu((prev) => {
      const currentMenuOptions = prev[menuId] ?? {}
      const nextMenuOptions = { ...currentMenuOptions }

      if ((currentMenuOptions[optionId] ?? 0) > 0) {
        delete nextMenuOptions[optionId]
      } else {
        nextMenuOptions[optionId] = 1
      }

      return {
        ...prev,
        [menuId]: nextMenuOptions
      }
    })
  }

  const handleClearOrder = () => {
    setIsOrderSubmitted(false)
    setIsOrderConfirmed(false)
    setOrderSubmitError(null)
    setQuantities({})
    setOptionQuantitiesByMenu({})
  }

  const handleOpenPaymentModal = () => {
    if (totalAmount <= 0) {
      return
    }

    setIsPaymentModalOpen(true)
    setSelectedPaymentMethod(null)
  }

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false)
    setSelectedPaymentMethod(null)
    setReceivedCashAmount(0)
  }

  const handleSelectPaymentMethod = (method: PosPaymentMethod) => {
    setSelectedPaymentMethod(method)
  }

  const handleConfirmPayment = async () => {
    if (!selectedPaymentMethod) {
      window.alert('결제수단을 선택해주세요.')
      return
    }

    if (!currentProfileId || !currentChannelCode || !currentPosTable?.id) {
      window.alert('결제 컨텍스트를 확인할 수 없습니다.')
      return
    }

    if (!createdOrderId || !createdOrderCode) {
      window.alert('결제할 주문 정보를 확인할 수 없습니다.')
      return
    }

    if (selectedPaymentMethod === 'CASH' && receivedCashAmount < totalAmount) {
      window.alert('받은 금액이 부족합니다.')
      return
    }

    if (isOrderSubmitting) {
      return
    }

    try {
      setIsOrderSubmitting(true)

      const result = await completePosPayment({
        profileId: currentProfileId,
        channelCode: currentChannelCode,
        locationId: currentPosTable.id,
        orderId: createdOrderId,
        orderCode: createdOrderCode,
        paymentMethod: selectedPaymentMethod,
        receivedCashAmount: selectedPaymentMethod === 'CASH' ? receivedCashAmount : null,
        paidStaffCode: currentChannelCode,
        paidStaffNameSnapshot: currentBusinessName
      })

      if (result.error || !result.data) {
        const message = result.error || '결제 처리에 실패했습니다.'
        window.alert(message)
        return
      }

      setQuantities({})
      setIsOrderSubmitted(false)
      setIsOrderConfirmed(false)
      setCreatedOrderId(null)
      setCreatedOrderCode(null)
      setCreatedOrderNumber(null)
      setOrderSubmitError(null)
      setReceivedCashAmount(0)
      handleClosePaymentModal()
      window.alert(`${tableNoLabel} 테이블 결제가 완료되었습니다.`)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '결제 처리 중 오류가 발생했습니다.'

      window.alert(message)
    } finally {
      setIsOrderSubmitting(false)
    }
  }

  const handleOpenCashDrawer = () => {
    console.log('[CASH DRAWER OPEN MOCK]')
    window.alert('돈통 열림 요청 목업입니다.')
  }

  const handleSubmitPayment = () => {
    handleOpenPaymentModal()
  }

  const handleChangeReceivedCashAmount = (value: string) => {
    const digitsOnlyValue =
      value.replace(/[^\d]/g, '')

    if (!digitsOnlyValue) {
      setReceivedCashAmount(0)
      return
    }

    const parsedValue =
      Number.parseInt(digitsOnlyValue, 10)

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      setReceivedCashAmount(0)
      return
    }

    setReceivedCashAmount(parsedValue)
  }

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleOpenPosSettingsMock = () => {
    router.push('/pos/settings')
  }

  const handleGoMenuCategorySettings = () => {
    router.push('/pos/settings/menu/category')
  }

  const handleGoMenuCreate = () => {
    router.push('/pos/settings/menu/create')
  }

  const handleOpenQrOrder = () => {
    setIsQrModalOpen(true)
  }

  const handleOpenReservationModal = () => {
    setIsReservationModalOpen(true)
  }

  const handleCloseReservationModal = () => {
    setIsReservationModalOpen(false)
  }

  const handleChangeReservationForm = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setReservationForm((previousValue) => ({
      ...previousValue,
      [name]: value
    }))
  }

  const handleSubmitReservationForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsReservationModalOpen(false)
  }

  const handleGoTableOverview = () => {
    router.push('/pos/table')
  }

  const handlePrintOrder = () => {
    window.print()
  }

  const handleConfirmOrder = async () => {
    if (!isOrderSubmitted || totalAmount <= 0) {
      return
    }

    if (isTableOrderBlocked) {
      setOrderSubmitError(TABLE_ORDER_BLOCK_MESSAGE)
      window.alert(TABLE_ORDER_BLOCK_MESSAGE)
      return
    }

    if (isOrderSubmitting) {
      return
    }

    if (!currentProfileId || !currentChannelCode) {
      setOrderSubmitError('로그인 BUSINESS 컨텍스트를 확인할 수 없습니다.')
      window.alert('로그인 BUSINESS 컨텍스트를 확인할 수 없습니다.')
      return
    }

    if (!Number.isFinite(tableNo) || tableNo <= 0) {
      setOrderSubmitError('유효한 테이블 정보를 확인할 수 없습니다.')
      window.alert('유효한 테이블 정보를 확인할 수 없습니다.')
      return
    }

    if (!currentPosTable?.id) {
      setOrderSubmitError('POS 테이블 정보를 찾을 수 없습니다.')
      window.alert('POS 테이블 정보를 찾을 수 없습니다.')
      return
    }

    if (orderItems.length < 1) {
      setOrderSubmitError('주문할 상품을 먼저 선택해주세요.')
      window.alert('주문할 상품을 먼저 선택해주세요.')
      return
    }

    try {
      setIsOrderSubmitting(true)
      setOrderSubmitError(null)

      const requestItems = orderItems.map((item) => {
        const productId = Number(item.id)

        if (!Number.isFinite(productId) || productId <= 0) {
          throw new Error('DB 상품 기준 주문만 등록할 수 있습니다.')
        }

        const optionQuantityMap = optionQuantitiesByMenu[item.id] ?? {}
        const optionPayload = (item.options ?? [])
          .map((option) => {
            const quantity = getResolvedOptionQuantity(
              option,
              optionQuantityMap[option.id] ?? 0
            )
            if (quantity <= 0) {
              return null
            }

            const resolvedOptionId =
              Number.isFinite(option.optionId) &&
              Number(option.optionId) > 0
                ? Number(option.optionId)
                : null

            const resolvedOptionValueId =
              Number.isFinite(option.optionValueId) &&
              Number(option.optionValueId) > 0
                ? Number(option.optionValueId)
                : null

            const useDbOptionReference =
              resolvedOptionId !== null &&
              resolvedOptionValueId !== null

            return {
              optionId: useDbOptionReference ? resolvedOptionId : null,
              optionValueId: useDbOptionReference ? resolvedOptionValueId : null,
              optionName: option.label,
              optionType: option.optionType ?? 'CUSTOM',
              optionValueName: option.label,
              priceDelta: option.extraPrice,
              quantity
            }
          })
          .filter((option): option is NonNullable<typeof option> => option !== null)

        return {
          productId,
          productName: item.name,
          unitPrice: item.price,
          quantity: item.quantity,
          options: optionPayload
        }
      })

      const result = await createPosOrder({
        profileId: currentProfileId,
        channelCode: currentChannelCode,
        locationId: currentPosTable.id,
        locationName: currentPosTable.tableName?.trim() || `${tableNoLabel} 테이블`,
        orderSource: 'POS',
        orderFlowType: 'TABLE',
        previousOrderId: createdOrderId,
        previousOrderCode: createdOrderCode,
        customerMemo: null,
        items: requestItems
      })

      if (result.error || !result.data) {
        const message = result.error || '주문 등록에 실패했습니다.'
        setOrderSubmitError(message)
        window.alert(message)
        return
      }

      setCreatedOrderId(result.data.orderId)
      setCreatedOrderCode(result.data.orderCode)
      setCreatedOrderNumber(result.data.orderNumber ?? result.data.orderCode)
      setIsOrderConfirmed(true)
      setOrderSubmitError(null)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '주문 등록 중 오류가 발생했습니다.'

      setOrderSubmitError(message)
      window.alert(message)
    } finally {
      setIsOrderSubmitting(false)
    }
  }

  const handleSubmitOrder = () => {
    if (isTableOrderBlocked) {
      setOrderSubmitError(TABLE_ORDER_BLOCK_MESSAGE)
      window.alert(TABLE_ORDER_BLOCK_MESSAGE)
      return
    }

    if (totalAmount <= 0) {
      return
    }

      setIsOrderSubmitted(true)
      setIsOrderConfirmed(false)
      setOrderSubmitError(null)
  }

  const handleCompleteTableCleanup = async () => {
    if (!currentProfileId || !currentChannelCode || !currentPosTable?.id) {
      setOrderSubmitError('테이블 정리완료 처리에 필요한 컨텍스트를 확인할 수 없습니다.')
      return
    }

    try {
      setIsOrderSubmitting(true)
      setOrderSubmitError(null)

      const result = await updatePosTableResourceStatus(
        currentPosTable.id,
        {
          profileId: currentProfileId,
          channelCode: currentChannelCode,
          resourceStatus: 'AVAILABLE'
        }
      )

      setCurrentPosTable((prev) =>
        prev
          ? {
            ...prev,
            resourceStatus: result.resourceStatus,
            updatedAt: new Date().toISOString()
          }
          : prev
      )
      window.alert('정리완료 처리되었습니다.')
      router.push('/pos/table')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '테이블 정리완료 처리에 실패했습니다.'

      setOrderSubmitError(message)
      window.alert(message)
    } finally {
      setIsOrderSubmitting(false)
    }
  }

  const handleEditOrder = () => {
    setIsOrderSubmitted(false)
    setIsOrderConfirmed(false)
    setOrderSubmitError(null)
  }

  const handleCancelOrder = async () => {
    if (!currentProfileId || !currentChannelCode || !currentPosTable?.id) {
      setOrderSubmitError('주문취소에 필요한 컨텍스트를 확인할 수 없습니다.')
      return
    }

    const shouldCancel = window.confirm('현재 진행중 주문을 취소하시겠습니까?')
    if (!shouldCancel) {
      return
    }

    try {
      setIsOrderSubmitting(true)
      setOrderSubmitError(null)

      const result = await cancelPosOrder({
        profileId: currentProfileId,
        channelCode: currentChannelCode,
        locationId: currentPosTable.id,
        orderId: createdOrderId,
        orderCode: createdOrderCode
      })

      if (result.error || !result.data) {
        const message = result.error || '주문취소에 실패했습니다.'
        setOrderSubmitError(message)
        window.alert(message)
        return
      }

      setQuantities({})
      setIsOrderSubmitted(false)
      setIsOrderConfirmed(false)
      setCreatedOrderId(null)
      setCreatedOrderCode(null)
      setCreatedOrderNumber(null)
      setOrderSubmitError(null)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '주문취소 중 오류가 발생했습니다.'

      setOrderSubmitError(message)
      window.alert(message)
    } finally {
      setIsOrderSubmitting(false)
    }
  }

  const handleGoKeyboardSettings = () => {
    router.push('/pos/settings/keyboard')
  }

  useEffect(() => {
    let isMounted = true

    const loadPosMenuData = async () => {
      setIsMenuLoading(true)
      setMenuLoadError(null)

      try {
        const meResponse = await getMe()
        const loginUser = meResponse.user

        if (loginUser.profileType !== 'BUSINESS') {
          throw new Error('BUSINESS 프로필 로그인 컨텍스트가 필요합니다.')
        }

        const context: PosMenuContext = {
          profileId: loginUser.profileId,
          channelCode: loginUser.channelCode
        }

        setCurrentBusinessName(loginUser.displayName?.trim() || '상호명 미설정')
        setCurrentChannelCode(loginUser.channelCode?.trim() || '')
        setCurrentProfileId(loginUser.profileId)

        const [categoryResponse, menuResponse] = await Promise.all([
          getPosProductCategories(),
          getPosMenus(context)
        ])

        const tableSettingsResponse = await getPosTableSettings({
          profileId: context.profileId,
          channelCode: context.channelCode
        })

        if (!isMounted) {
          return
        }

        const normalizedCategories = categoryResponse.categories
          .filter((item) => Number(item.isActive) === 1)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({
            id: String(item.id),
            label: item.categoryName?.trim() || '미분류'
          }))

        const normalizedMenus = menuResponse.items
          .filter((item) => toIsMenuVisible(item))
          .map((item) => mapDbMenuToUiMenu(item))

        const resolvedPosTable =
          resolveCurrentPosTable({
            routeTableNo: tableNo,
            routeTableNoRaw: safeTableNoRaw,
            tables: tableSettingsResponse.tables
          })

        if (isCleaningResourceStatus(resolvedPosTable?.resourceStatus)) {
          setDbCategories(normalizedCategories)
          setDbMenuItems(normalizedMenus)
          setCurrentPosTable(resolvedPosTable)
          setOrderSubmitError(TABLE_ORDER_BLOCK_MESSAGE)
          setQuantities({})
          setOptionQuantitiesByMenu({})
          return
        }

        setDbCategories(normalizedCategories)
        setDbMenuItems(normalizedMenus)
        setCurrentPosTable(resolvedPosTable)

        setSelectedCategoryId((previousCategoryId) => {
          const hasSelectedCategory = normalizedCategories.some((item) => item.id === previousCategoryId)

          if (hasSelectedCategory) {
            return previousCategoryId
          }

          return normalizedCategories[0]?.id ?? ''
        })

        if (resolvedPosTable?.id) {
          const activeOrderResult = await getActivePosOrder({
            profileId: context.profileId,
            channelCode: context.channelCode,
            locationId: resolvedPosTable.id
          })

          if (activeOrderResult.error || !activeOrderResult.data?.order) {
            setCreatedOrderId(null)
            setCreatedOrderCode(null)
            setCreatedOrderNumber(null)
            setIsOrderSubmitted(false)
            setIsOrderConfirmed(false)
            setOrderSubmitError(null)
          setQuantities({})
          setOptionQuantitiesByMenu({})
          return
        }

          const restoredQuantities =
            activeOrderResult.data.items.reduce<Record<string, number>>((accumulator, item) => {
              if (item.productId > 0 && item.quantity > 0) {
                accumulator[String(item.productId)] = item.quantity
              }

              return accumulator
            }, {})

          const restoredOptionQuantitiesByMenu =
            activeOrderResult.data.items.reduce<Record<string, Record<string, number>>>((accumulator, item) => {
              const menuId = String(item.productId)
              const matchedMenu = normalizedMenus.find((menu) => menu.id === menuId)

              if (!matchedMenu || !item.options || item.options.length < 1) {
                return accumulator
              }

              const optionQuantityMap: Record<string, number> = {}

              for (const activeOption of item.options) {
                if (!activeOption || activeOption.quantity <= 0) {
                  continue
                }

                const matchedMenuOption =
                  matchedMenu.options.find((menuOption) => {
                    if (
                      activeOption.productOptionValueId &&
                      menuOption.optionValueId &&
                      activeOption.productOptionValueId === menuOption.optionValueId
                    ) {
                      return true
                    }

                    return menuOption.label === activeOption.optionValueName
                  }) ?? null

                if (!matchedMenuOption) {
                  continue
                }

                optionQuantityMap[matchedMenuOption.id] =
                  getResolvedOptionQuantity(
                    matchedMenuOption,
                    (optionQuantityMap[matchedMenuOption.id] ?? 0) + activeOption.quantity
                  )
              }

              if (Object.keys(optionQuantityMap).length > 0) {
                accumulator[menuId] = optionQuantityMap
              }

              return accumulator
            }, {})

          setQuantities(restoredQuantities)
          setOptionQuantitiesByMenu(restoredOptionQuantitiesByMenu)
          setCreatedOrderId(activeOrderResult.data.order.orderId)
          setCreatedOrderCode(activeOrderResult.data.order.orderCode)
          setCreatedOrderNumber(
            activeOrderResult.data.order.orderNumber ||
            activeOrderResult.data.order.orderCode
          )
          setIsOrderSubmitted(true)
          setIsOrderConfirmed(true)
          setOrderSubmitError(null)
        } else {
          setCreatedOrderId(null)
          setCreatedOrderCode(null)
          setCreatedOrderNumber(null)
          setIsOrderSubmitted(false)
          setIsOrderConfirmed(false)
          setOrderSubmitError(null)
          setQuantities({})
          setOptionQuantitiesByMenu({})
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'POS 메뉴 / 카테고리 정보를 불러오지 못했습니다.'

        setMenuLoadError(message)
        setDbCategories([])
        setDbMenuItems([])
        setCurrentProfileId(null)
        setCurrentPosTable(null)
        setCurrentBusinessName('상호명 미설정')
        setCurrentChannelCode('')
        setSelectedCategoryId('')
        setOptionQuantitiesByMenu({})
      } finally {
        if (!isMounted) {
          return
        }

        setIsMenuLoading(false)
      }
    }

    loadPosMenuData()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isPaymentModalOpen) {
      return
    }

    const handlePaymentModalKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return
      }

      if (event.code === 'Numpad7') {
        event.preventDefault()
        handleSelectPaymentMethod('CASH')
        return
      }

      if (event.code === 'Numpad8') {
        event.preventDefault()
        handleSelectPaymentMethod('CARD')
        return
      }

      if (event.code === 'Numpad9') {
        event.preventDefault()
        handleSelectPaymentMethod('QR')
        return
      }

      if (event.code === 'Numpad5') {
        event.preventDefault()
        handleOpenCashDrawer()
        return
      }

      if (event.code === 'NumpadEnter') {
        event.preventDefault()
        handleConfirmPayment()
        return
      }

      if (event.code === 'NumpadDecimal' || event.code === 'Escape') {
        event.preventDefault()
        handleClosePaymentModal()
      }
    }

    window.addEventListener('keydown', handlePaymentModalKeyDown)

    return () => {
      window.removeEventListener('keydown', handlePaymentModalKeyDown)
    }
  }, [isPaymentModalOpen, selectedPaymentMethod, totalAmount, totalOrderItemCount, safeTableNoRaw, tableNoLabel])

  useEffect(() => {
    if (visibleMenus.length < 1) {
      setSelectedMenuId('')
      return
    }

    const isValidSelectedMenu =
      visibleMenus.some((menu) => menu.id === selectedMenuId)

    if (!isValidSelectedMenu) {
      setSelectedMenuId(visibleMenus[0].id)
    }
  }, [visibleMenus, selectedMenuId])

  // SECTION 07 : RETURN

  return (
    <div className={styles.page}>
      <div className={styles.posShell}>
        <div className={styles.topbarWrap}>
          <div className={styles.topbarInner}>
            <PosTopbar
              title="주문 관리"
              onHomeClick={() => router.push('/pos')}
              onSettingsClick={handleOpenPosSettingsMock}
              onMyPageClick={handleGoMyPage}
              syncStatus="ONLINE"
              homeShortcutLabel="F1"
              keyboardMode={keyboardMode}
              onToggleKeyboardMode={toggleKeyboardMode}
            />
          </div>
        </div>

        <div className={styles.mainViewport}>
          <div className={styles.mainGrid}>
            {isTableOrderBlocked ? (
              <aside className={styles.sidebar}>
                <div className={styles.emptySidebarBox}>
                  <strong className={styles.emptySidebarTitle}>정리대기</strong>
                  <p className={styles.description}>
                    정리완료 후 메뉴를 선택할 수 있습니다.
                  </p>
                </div>
              </aside>
            ) : isMenuLoading ? (
              <aside className={styles.sidebar}>
                <p className={styles.description}>메뉴바를 불러오는 중입니다.</p>
              </aside>
            ) : activeCategories.length < 1 ? (
              <aside className={styles.sidebar}>
                <div className={styles.emptySidebarBox}>
                  <strong className={styles.emptySidebarTitle}>등록된 메뉴바가 없습니다.</strong>
                  <button
                    type="button"
                    className={styles.emptyActionButton}
                    onClick={handleGoMenuCategorySettings}
                  >
                    메뉴바 등록
                  </button>
                </div>
              </aside>
            ) : (
              <PosCategorySidebar
                menus={activeCategories}
                selectedMenuId={selectedCategoryId}
                onSelectMenu={setSelectedCategoryId}
                className={styles.sidebar}
              />
            )}

            <main className={styles.main}>
              <div className={styles.header}>
                <div className={styles.headerTop}>
                  <div>
                    <h1 className={styles.title}>
                      테이블 주문
                    </h1>

                    <p className={styles.description}>
                      {tableNoLabel} 테이블 주문 화면입니다.
                    </p>
                  </div>

                  <div className={styles.headerActions}>
                    <button
                      type="button"
                      className={styles.qrOrderButton}
                      onClick={handleGoTableOverview}
                    >
                      테이블 현황
                    </button>

                    <button
                      type="button"
                      className={styles.qrOrderButton}
                      onClick={handleOpenReservationModal}
                    >
                      예약
                    </button>

                    <button
                      type="button"
                      className={styles.qrOrderButton}
                      onClick={handleOpenQrOrder}
                    >
                      QR 오더
                    </button>

                    <button
                      type="button"
                      className={styles.qrOrderButton}
                      onClick={handlePrintOrder}
                    >
                      인쇄하기
                    </button>

                    <button
                      type="button"
                      className={
                        isOrderConfirmed
                          ? `${styles.orderConfirmButton} ${styles.orderConfirmButtonDone}`
                          : styles.orderConfirmButton
                      }
                      onClick={handleConfirmOrder}
                      disabled={isTableOrderBlocked || isOrderSubmitting || isOrderConfirmed || !isOrderSubmitted || totalAmount <= 0}
                    >
                      {isOrderSubmitting ? '등록중' : (isOrderConfirmed ? '확정완료' : '확정')}
                    </button>
                  </div>
                </div>
              </div>

              {isTableOrderBlocked ? (
                <section className={styles.emptyMenuState}>
                  <strong className={styles.emptyMenuTitle}>테이블 정리대기 상태입니다.</strong>
                  <p className={styles.emptyMenuText}>
                    정리완료 후 주문을 등록할 수 있습니다.
                  </p>
                  <div className={styles.emptyActionRow}>
                    <button
                      type="button"
                      className={styles.emptyActionButton}
                      onClick={handleCompleteTableCleanup}
                      disabled={isOrderSubmitting}
                    >
                      {isOrderSubmitting ? '처리중' : '정리완료'}
                    </button>
                  </div>
                </section>
              ) : (
              <div className={styles.orderWorkspace}>
                <section className={styles.menuColumn}>
                  <h2 className={styles.columnTitle}>1. 메뉴 선택</h2>
                  <div className={styles.menuScrollArea}>
                {isMenuLoading ? (
                  <p className={styles.description}>메뉴를 불러오는 중입니다.</p>
                ) : null}

                {!isMenuLoading && menuLoadError ? (
                  <p className={styles.description}>{menuLoadError}</p>
                ) : null}

                {!isMenuLoading && activeCategories.length < 1 ? (
                  <section className={styles.emptyMenuState}>
                    <strong className={styles.emptyMenuTitle}>메뉴바 / 메뉴를 등록해주세요.</strong>
                    <p className={styles.emptyMenuText}>
                      POS에서 사용할 메뉴바와 메뉴/서비스를 먼저 등록해야 주문을 받을 수 있습니다.
                    </p>
                    <div className={styles.emptyActionRow}>
                      <button
                        type="button"
                        className={styles.emptyActionButton}
                        onClick={handleGoMenuCategorySettings}
                      >
                        메뉴바 등록
                      </button>
                      <button
                        type="button"
                        className={styles.emptySecondaryButton}
                        onClick={handleGoMenuCreate}
                      >
                        메뉴 / 서비스 등록
                      </button>
                    </div>
                  </section>
                ) : null}

                {!isMenuLoading && activeCategories.length > 0 && activeMenuItems.length < 1 ? (
                  <section className={styles.emptyMenuState}>
                    <strong className={styles.emptyMenuTitle}>등록된 메뉴/서비스가 없습니다.</strong>
                    <p className={styles.emptyMenuText}>
                      POS에서 사용할 메뉴/서비스를 먼저 등록해야 주문을 받을 수 있습니다.
                    </p>
                    <div className={styles.emptyActionRow}>
                      <button
                        type="button"
                        className={styles.emptyActionButton}
                        onClick={handleGoMenuCreate}
                      >
                        메뉴 / 서비스 등록
                      </button>
                    </div>
                  </section>
                ) : null}

                {!isMenuLoading && activeCategories.length > 0 && activeMenuItems.length > 0 && visibleMenus.length < 1 ? (
                  <section className={styles.emptyMenuState}>
                    <strong className={styles.emptyMenuTitle}>이 메뉴바에 등록된 메뉴/서비스가 없습니다.</strong>
                    <p className={styles.emptyMenuText}>
                      선택한 메뉴바에 메뉴/서비스를 등록해 주세요.
                    </p>
                    <div className={styles.emptyActionRow}>
                      <button
                        type="button"
                        className={styles.emptyActionButton}
                        onClick={handleGoMenuCreate}
                      >
                        메뉴 / 서비스 등록
                      </button>
                    </div>
                  </section>
                ) : null}

                {!isMenuLoading && visibleMenus.length > 0 ? (
                  <section className={styles.menuGrid}>
                    {visibleMenus.map((menu) => {
                      const isActive = selectedMenuId === menu.id
                      const hasThumbnail =
                        Boolean(menu.thumbnailUrl) &&
                        !failedMenuThumbnailKeys.has(menu.id)

                      return (
                        <article
                          key={menu.id}
                          className={[
                            styles.menuCard,
                            hasThumbnail ? styles.menuImageCard : '',
                            isActive ? styles.menuCardActive : ''
                          ].filter(Boolean).join(' ')}
                          onClick={() => handleSelectMenu(menu.id)}
                        >
                          {hasThumbnail ? (
                            <>
                              <img
                                className={styles.menuThumbnailImage}
                                src={menu.thumbnailUrl || ''}
                                alt={`${menu.name} 썸네일`}
                                onError={() => {
                                  setFailedMenuThumbnailKeys((prev) => {
                                    const next = new Set(prev)
                                    next.add(menu.id)
                                    return next
                                  })
                                }}
                              />

                              <strong className={styles.menuImageNamePill}>
                                {menu.name}
                              </strong>

                              <span className={styles.menuImagePricePill}>
                                {menu.price.toLocaleString('ko-KR')}원
                              </span>
                            </>
                          ) : (
                            <>
                              <div className={styles.menuTop}>
                                <strong className={styles.menuName}>
                                  {menu.name}
                                </strong>

                                <span className={styles.menuPrice}>
                                  {menu.price.toLocaleString('ko-KR')}원
                                </span>
                              </div>

                              <p className={styles.menuDescription}>
                                {menu.description}
                              </p>
                            </>
                          )}
                        </article>
                      )
                    })}
                  </section>
                ) : null}
                  </div>
                </section>

                <section className={styles.detailColumn}>
                  <h2 className={styles.columnTitle}>2. 수량 선택 / 옵션 선택</h2>
                  {!selectedMenu ? (
                    <div className={styles.emptyDetailState}>
                      <p className={styles.emptyMenuText}>메뉴를 선택하면 수량/옵션을 설정할 수 있습니다.</p>
                    </div>
                  ) : (
                    <div className={styles.detailPanel}>
                      <div className={styles.detailTop}>
                        <div>
                          <strong className={styles.detailMenuName}>{selectedMenu.name}</strong>
                          <p className={styles.detailMenuPrice}>
                            기본 금액 {selectedMenu.price.toLocaleString('ko-KR')}원
                          </p>
                        </div>
                        <div className={styles.quantityRow}>
                          <button
                            type="button"
                            className={styles.stepButton}
                            onClick={() => handleDecrease(selectedMenu.id)}
                          >
                            -
                          </button>

                          <strong className={styles.quantityValue}>
                            {selectedMenuQuantity}
                          </strong>

                          <button
                            type="button"
                            className={styles.stepButton}
                            onClick={() => handleIncrease(selectedMenu.id)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className={styles.optionBlock}>
                        <h3 className={styles.optionTitle}>3. 옵션 선택</h3>
                        <div className={styles.optionList}>
                          {selectedMenuOptions.map((option) => {
                            const selectedOptionCount =
                              getResolvedOptionQuantity(
                                option,
                                optionQuantitiesByMenu[selectedMenu.id]?.[option.id] ?? 0
                              )
                            const maxOptionQuantity = getOptionMaxQuantity(option)
                            const hasQuantityLimit =
                              option.isQuantityEnabled &&
                              option.isQuantityLimitEnabled &&
                              maxOptionQuantity !== null
                            return (
                              <div key={option.id} className={styles.optionItem}>
                                <span className={styles.optionLeft}>
                                  {!option.isQuantityEnabled ? (
                                    <input
                                      type="checkbox"
                                      checked={selectedOptionCount > 0}
                                      onChange={() => handleToggleSingleOption(selectedMenu.id, option.id)}
                                    />
                                  ) : null}
                                  <span>{option.label}</span>
                                </span>
                                <div className={styles.optionRight}>
                                  <strong className={styles.optionPrice}>
                                    {option.extraPrice > 0 ? `+ ${option.extraPrice.toLocaleString('ko-KR')}원` : '0원'}
                                  </strong>
                                  {option.isQuantityEnabled ? (
                                    <div className={styles.optionQuantityRow}>
                                      <button
                                        type="button"
                                        className={styles.optionStepButton}
                                        onClick={() => handleDecreaseOption(selectedMenu.id, option.id)}
                                        disabled={selectedOptionCount <= 0}
                                      >
                                        -
                                      </button>
                                      <strong className={styles.optionQuantityValue}>
                                        {selectedOptionCount}
                                      </strong>
                                      <button
                                        type="button"
                                        className={styles.optionStepButton}
                                        onClick={() => handleIncreaseOption(selectedMenu.id, option.id)}
                                        disabled={maxOptionQuantity !== null && selectedOptionCount >= maxOptionQuantity}
                                      >
                                        +
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                                {hasQuantityLimit ? (
                                  <p className={styles.optionLimitNotice}>
                                  최대 {maxOptionQuantity}개까지 선택할 수 있습니다.
                                  </p>
                                ) : null}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>
              )}
            </main>

            {!isTableOrderBlocked ? (
            <aside className={styles.orderPanel}>
              <p className={styles.paymentGuideText}>
                {totalAmount <= 0
                  ? '주문 대기'
                  : !isOrderSubmitted
                    ? '주문 작성중'
                    : !isOrderConfirmed
                      ? '주문등록'
                      : '결제 가능합니다.'}
              </p>
              {orderSubmitError ? (
                <p className={styles.description}>
                  {orderSubmitError}
                </p>
              ) : null}
              <PosOrderList
                title={`${tableNoLabel} 테이블 주문 내역`}
                subtitle={createdOrderNumber ? `주문번호 ${createdOrderNumber}` : null}
                orderItems={orderItemsForDisplay}
                onClear={handleClearOrder}
              />
            </aside>
            ) : null}
          </div>
        </div>

        {!isTableOrderBlocked ? (
        <div className={styles.footerWrap}>
          <PosOrderFooter
            totalAmount={totalAmount}
            tertiaryButtonLabel={isOrderConfirmed ? '주문취소' : undefined}
            tertiaryDisabled={isTableOrderBlocked || !isOrderConfirmed || isOrderSubmitting}
            secondaryButtonLabel={
              isOrderSubmitting
                ? '등록중'
                : isOrderConfirmed
                  ? '수정하기'
                  : '주문하기'
            }
            secondaryDisabled={isTableOrderBlocked || totalAmount <= 0 || isOrderSubmitting}
            disabled={isTableOrderBlocked || totalAmount <= 0 || !isOrderSubmitted || !isOrderConfirmed}
            buttonLabel="결제하기"
            totalLabel={`${tableNoLabel} 테이블 총 금액`}
            onSubmitPayment={handleSubmitPayment}
            onSubmitTertiary={handleCancelOrder}
            onSubmitSecondary={isOrderConfirmed ? handleEditOrder : handleSubmitOrder}
          />
        </div>
        ) : null}
      </div>

      {isPaymentModalOpen && (
        <div
          className={styles.paymentModalOverlay}
          role="presentation"
          onClick={handleClosePaymentModal}
        >
          <div
            className={styles.paymentModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.paymentModalHeader}>
              <div className={styles.paymentHeaderTop}>
                <div>
                  <h2 id="payment-modal-title" className={styles.paymentModalTitle}>
                    {tableNoLabel} 테이블 결제
                  </h2>
                  <p className={styles.paymentOrderNumber}>
                    <span className={styles.paymentOrderNumberLabel}>주문번호</span>
                    <span className={styles.paymentOrderNumberValue}>
                      {createdOrderNumber ?? MOCK_PAYMENT_ORDER.orderNumber}
                    </span>
                  </p>
                </div>

                {selectedPaymentMethod === 'CASH' ? (
                  <div className={styles.cashSummaryGrid}>
                    <article className={styles.cashSummaryCard}>
                      <span className={styles.cashSummaryLabel}>입력금액(받은 금액)</span>
                      <strong className={styles.cashSummaryValue}>
                        {receivedCashAmount.toLocaleString('ko-KR')}원
                      </strong>
                    </article>
                    <article className={`${styles.cashSummaryCard} ${styles.cashSummaryCardChange}`}>
                      <span className={styles.cashSummaryLabel}>거스름돈</span>
                      <strong className={styles.cashSummaryValue}>
                        {changeAmount.toLocaleString('ko-KR')}원
                      </strong>
                    </article>
                  </div>
                ) : null}
              </div>

              <p className={styles.paymentModalDescription}>
                결제수단을 선택한 뒤 결제를 진행하세요.
              </p>
            </div>

            <div className={styles.paymentModalContent}>
              <section className={styles.paymentMethodSection}>
                <div className={styles.paymentSummaryCard}>
                  <p className={styles.summaryLabel}>총 결제금액</p>
                  <p className={styles.summaryAmount}>{totalAmount.toLocaleString('ko-KR')}원</p>
                  <p className={styles.summarySubText}>주문 항목 수: {totalOrderItemCount}개</p>
                </div>

                <p className={styles.paymentMethodGuide}>
                  {selectedPaymentMethod === 'CARD'
                    ? '카드 단말기 결제를 진행합니다.'
                    : selectedPaymentMethod === 'CASH'
                      ? '현금 수납 후 결제를 완료합니다.'
                      : selectedPaymentMethod === 'QR'
                        ? `주문번호 ${createdOrderNumber ?? MOCK_PAYMENT_ORDER.orderNumber} 기준으로 QR 결제 화면을 불러옵니다.`
                        : '결제수단을 먼저 선택해주세요.'}
                </p>

                {selectedPaymentMethod === 'CASH' ? (
                  <div className={styles.cashPaymentBox}>
                    <label className={styles.cashInputLabel} htmlFor="received-cash-amount">
                      받은 금액
                    </label>
                    <input
                      id="received-cash-amount"
                      type="text"
                      inputMode="numeric"
                      className={styles.cashAmountInput}
                      value={receivedCashAmount > 0 ? receivedCashAmount.toLocaleString('ko-KR') : ''}
                      onChange={(event) => handleChangeReceivedCashAmount(event.target.value)}
                      placeholder="0"
                    />

                    {isCashPaymentInsufficient ? (
                      <p className={styles.cashWarningText}>받은 금액이 부족합니다.</p>
                    ) : null}

                    {receivedCashAmount >= totalAmount ? (
                      <div className={styles.changeAmountBox}>
                        <span className={styles.changeAmountLabel}>거스름돈</span>
                        <strong className={styles.changeAmountValue}>
                          {changeAmount.toLocaleString('ko-KR')}원
                        </strong>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className={styles.paymentModalActions}>
                  <button
                    type="button"
                    className={styles.paymentCancelButton}
                    onClick={handleClosePaymentModal}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className={styles.paymentOrderCancelButton}
                    onClick={handleCancelOrder}
                    disabled={!isOrderConfirmed || isOrderSubmitting}
                  >
                    주문 취소
                  </button>
                  <button
                    type="button"
                    className={styles.cashDrawerButton}
                    onClick={handleOpenCashDrawer}
                  >
                    돈통 열림
                  </button>
                  <button
                    type="button"
                    className={styles.paymentConfirmButton}
                    onClick={handleConfirmPayment}
                    disabled={!selectedPaymentMethod || isOrderSubmitting || isCashPaymentInsufficient}
                  >
                    결제 진행
                  </button>
                </div>
              </section>

              <aside className={styles.keypadPanel}>
                <div className={styles.paymentMethodGrid}>
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <button
                      key={option.method}
                      type="button"
                      className={
                        selectedPaymentMethod === option.method
                          ? `${styles.paymentMethodButton} ${styles.paymentMethodButtonActive}`
                          : styles.paymentMethodButton
                      }
                      onClick={() => handleSelectPaymentMethod(option.method)}
                    >
                      <span className={styles.paymentMethodName}>{option.label}</span>
                      <strong className={styles.paymentMethodKey}>{option.keyNumber}</strong>
                    </button>
                  ))}
                </div>

                <h3 className={styles.keypadTitle}>숫자 키패드</h3>
                <p className={styles.keypadDescription}>
                  결제 중 사용할 수 있는 숫자 키패드 단축키입니다.
                </p>

                <div className={styles.keypadBody}>
                  <div className={styles.keypadGridMock} aria-hidden="true">
                    <div className={styles.keypadCell}>1</div>
                    <div className={styles.keypadCell}>2</div>
                    <div className={styles.keypadCell}>3</div>
                    <div className={styles.keypadCell}>4</div>
                    <div className={styles.keypadCell}>5</div>
                    <div className={styles.keypadCell}>6</div>
                    <div className={styles.keypadCell}>7</div>
                    <div className={styles.keypadCell}>8</div>
                    <div className={styles.keypadCell}>9</div>
                    <div className={styles.keypadCell}>.</div>
                    <div className={styles.keypadCell}>0</div>
                    <div className={styles.keypadCell}>←</div>
                  </div>

                  <ul className={styles.keypadList}>
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <li key={option.method} className={styles.keypadItem}>
                        <span className={styles.keyBadge}>{`숫자패드 ${option.keyNumber}`}</span>
                        <span>{option.guideLabel}</span>
                      </li>
                    ))}
                    <li className={styles.keypadItem}><span className={styles.keyBadge}>숫자패드 5</span><span>돈통 열림</span></li>
                    <li className={styles.keypadItem}><span className={styles.keyBadge}>숫자패드 Enter</span><span>결제 완료</span></li>
                    <li className={styles.keypadItem}><span className={styles.keyBadge}>숫자패드 .</span><span>취소</span></li>
                    <li className={styles.keypadItem}><span className={styles.keyBadge}>숫자패드 4</span><span>결제 화면</span></li>
                  </ul>
                </div>

                <button
                  type="button"
                  className={styles.keySettingButton}
                  onClick={handleGoKeyboardSettings}
                >
                  키 설정 변경
                </button>
              </aside>
            </div>
          </div>
        </div>
      )}

      <PosTableQrModal
        isOpen={isQrModalOpen}
        businessName={currentBusinessName}
        tableName={`${tableNoLabel} 테이블`}
        zoneName="홀"
        tableOptionName="4인석"
        tableCode={qrTableCode || null}
        tableOrderUrl={qrOrderUrl || null}
        qrCodeValue={qrOrderUrl || null}
        qrStatus={qrOrderUrl ? 'CONNECTED' : 'DISCONNECTED'}
        onClose={() => setIsQrModalOpen(false)}
      />

      {isReservationModalOpen ? (
        <div
          className={styles.reservationModalOverlay}
          role="presentation"
          onClick={handleCloseReservationModal}
        >
          <section
            className={styles.reservationModalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="table-reservation-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.reservationModalHeader}>
              <h2 id="table-reservation-modal-title" className={styles.reservationModalTitle}>
                {`${tableNoLabel} 테이블 예약 등록`}
              </h2>
              <p className={styles.reservationModalDescription}>
                {`현재 선택된 ${tableNoLabel} 테이블 기준으로 예약 정보를 등록합니다.`}
              </p>
            </header>

            <form className={styles.reservationForm} onSubmit={handleSubmitReservationForm}>
              <div className={styles.reservationFieldGrid}>
                <label className={styles.reservationField}>
                  <span className={styles.reservationFieldLabel}>예약자명</span>
                  <input
                    name="reserverName"
                    className={styles.reservationInput}
                    value={reservationForm.reserverName}
                    onChange={handleChangeReservationForm}
                    placeholder="예약자명을 입력하세요"
                  />
                </label>

                <label className={styles.reservationField}>
                  <span className={styles.reservationFieldLabel}>연락처</span>
                  <input
                    name="phoneNumber"
                    className={styles.reservationInput}
                    value={reservationForm.phoneNumber}
                    onChange={handleChangeReservationForm}
                    placeholder="연락처를 입력하세요"
                  />
                </label>

                <label className={styles.reservationField}>
                  <span className={styles.reservationFieldLabel}>예약일</span>
                  <input
                    type="date"
                    name="reservationDate"
                    className={styles.reservationInput}
                    value={reservationForm.reservationDate}
                    onChange={handleChangeReservationForm}
                  />
                </label>

                <label className={styles.reservationField}>
                  <span className={styles.reservationFieldLabel}>예약시간</span>
                  <input
                    type="time"
                    name="reservationTime"
                    className={styles.reservationInput}
                    value={reservationForm.reservationTime}
                    onChange={handleChangeReservationForm}
                  />
                </label>

                <label className={styles.reservationField}>
                  <span className={styles.reservationFieldLabel}>인원</span>
                  <input
                    type="number"
                    min={1}
                    name="partySize"
                    className={styles.reservationInput}
                    value={reservationForm.partySize}
                    onChange={handleChangeReservationForm}
                  />
                </label>

                <label className={styles.reservationField}>
                  <span className={styles.reservationFieldLabel}>메모</span>
                  <textarea
                    name="memo"
                    className={styles.reservationTextarea}
                    value={reservationForm.memo}
                    onChange={handleChangeReservationForm}
                    placeholder="요청사항을 입력하세요"
                  />
                </label>
              </div>

              <div className={styles.reservationModalActions}>
                <button
                  type="button"
                  className={styles.reservationCancelButton}
                  onClick={handleCloseReservationModal}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className={styles.reservationSubmitButton}
                >
                  예약 등록
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function resolveCurrentPosTable(input: {
  routeTableNo: number
  routeTableNoRaw: string
  tables: PosTableSettingItem[]
}): PosTableSettingItem | null {
  const { routeTableNo, routeTableNoRaw, tables } = input

  if (!Array.isArray(tables) || tables.length < 1) {
    return null
  }

  const bySortOrder = Number.isFinite(routeTableNo)
    ? tables.find((table) => table.sortOrder === routeTableNo)
    : null

  if (bySortOrder) {
    return bySortOrder
  }

  const byId = Number.isFinite(routeTableNo)
    ? tables.find((table) => table.id === routeTableNo)
    : null

  if (byId) {
    return byId
  }

  const normalizedLabel = routeTableNoRaw.trim()
  if (normalizedLabel.length > 0) {
    const byTableName = tables.find((table) => {
      const tableName = table.tableName?.trim() || ''
      return (
        tableName === normalizedLabel ||
        tableName === `${normalizedLabel}번` ||
        tableName === `${normalizedLabel}번 테이블`
      )
    })

    if (byTableName) {
      return byTableName
    }
  }

  return null
}

function toIsMenuVisible(item: PosDbMenuItem): boolean {
  if (item.saleStatus === 'OFF') {
    return false
  }

  return Boolean(item.isActive)
}

function isCleaningResourceStatus(
  resourceStatus: string | null | undefined
): boolean {
  const normalizedStatus =
    String(resourceStatus ?? '').trim().toUpperCase()

  return (
    normalizedStatus === 'CLEANING' ||
    normalizedStatus === 'CHECKOUT_PENDING'
  )
}

function getSafePositiveInteger(
  value: number | string | null | undefined,
  fallback: number
): number {
  const numericValue = Number(value)
  return Number.isInteger(numericValue) && numericValue >= 1
    ? numericValue
    : fallback
}

function getSafeNullablePositiveInteger(
  value: number | string | null | undefined
): number | null {
  const numericValue = Number(value)
  return Number.isInteger(numericValue) && numericValue >= 1
    ? numericValue
    : null
}

function getOptionMinQuantity(option: PosMenuOption): number {
  return getSafePositiveInteger(option.minOptionQuantity, 1)
}

function getOptionDefaultQuantity(option: PosMenuOption): number {
  return getSafePositiveInteger(
    option.defaultOptionQuantity ?? option.minOptionQuantity,
    getOptionMinQuantity(option)
  )
}

function getOptionMaxQuantity(option: PosMenuOption): number | null {
  if (!option.isQuantityLimitEnabled) {
    return null
  }

  return getSafeNullablePositiveInteger(option.maxOptionQuantity)
}

function getResolvedOptionQuantity(
  option: PosMenuOption,
  rawQuantity: number
): number {
  if (rawQuantity <= 0) {
    return 0
  }

  if (!option.isQuantityEnabled) {
    return 1
  }

  const minQuantity = getOptionMinQuantity(option)
  const maxQuantity = getOptionMaxQuantity(option)
  const normalizedQuantity = Math.max(minQuantity, rawQuantity)

  return maxQuantity === null
    ? normalizedQuantity
    : Math.min(maxQuantity, normalizedQuantity)
}

function mapDbMenuToUiMenu(item: PosDbMenuItem): PosMenuItem {
  const normalizedOptions: PosMenuOption[] = (item.options ?? [])
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .flatMap((group) => {
      const groupId = Number(group.id ?? 0)
      const values = Array.isArray(group.values) ? group.values : []

      return values
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((value, index) => {
          const valueId = Number(value.id ?? 0)
          const optionIdSeed = valueId > 0
            ? valueId
            : groupId > 0
              ? Number(`${groupId}${index + 1}`)
              : index + 1

          return {
            id: `${item.id}-opt-${optionIdSeed}`,
            label: value.optionValueName?.trim() || group.optionName?.trim() || '옵션',
            extraPrice: Number.isFinite(value.priceDelta) ? value.priceDelta : 0,
            optionId: Number.isFinite(groupId) && groupId > 0 ? groupId : null,
            optionValueId: Number.isFinite(valueId) && valueId > 0 ? valueId : null,
            optionType: group.optionType ?? 'CUSTOM',
            isQuantityEnabled: Boolean(value.isQuantityEnabled),
            isQuantityLimitEnabled: Boolean(value.isQuantityLimitEnabled),
            minOptionQuantity: getSafePositiveInteger(value.minOptionQuantity, 1),
            maxOptionQuantity: Boolean(value.isQuantityLimitEnabled)
              ? getSafeNullablePositiveInteger(value.maxOptionQuantity)
              : null,
            defaultOptionQuantity: getSafePositiveInteger(
              value.defaultOptionQuantity ?? value.minOptionQuantity,
              1
            )
          }
        })
    })

  return {
    id: String(item.id),
    categoryId: String(item.categoryId ?? item.categoryCode ?? 'uncategorized'),
    name: item.productName?.trim() || '상품명 미설정',
    description: item.productDescription?.trim() || '',
    price: Number.isFinite(item.basePrice) ? item.basePrice : 0,
    thumbnailUrl: mediaUrl(item.thumbnail?.filePath) || null,
    options: normalizedOptions
  }
}
