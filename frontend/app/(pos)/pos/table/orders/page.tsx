'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import PosTopbar from '../../components/PosTopbar'
import PosHeaderMenuBar from '../../components/PosHeaderMenuBar'
import { usePosKeyboardMode } from '../../components/PosKeyboardModeContext'
import { PosMenuKey } from '../../components/posTypes'
import {
  TABLE_POS_SIDEBAR_MENUS,
  TABLE_POS_SIDEBAR_PATHS
} from '../../components/tablePosMenuConfig'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchPosOrderDashboard,
  fetchPosOrderDashboardDetail,
  updatePosOrderDashboardStatus,
  type PosOrderDashboardCategory,
  type PosOrderDashboardDisplayStatusGroup,
  type PosOrderDashboardDetail,
  type PosOrderDashboardItem,
  type PosOrderStatus,
  type UpdatePosOrderStatusInput
} from '@/lib/business/pos/posOrderDashboardApi'

import styles from './PosOrdersPage.module.css'

type OrderCategoryItem = {
  key: Exclude<PosOrderDashboardCategory, 'ALL'>
  title: string
  description: string
}

type SummaryItem = {
  label: string
  value: string
}

type DisplayOrderSourceMode = 'API' | 'MOCK'

type DisplayOrder = PosOrderDashboardItem & {
  sourceMode: DisplayOrderSourceMode
}

type DisplayOrderDetail = PosOrderDashboardDetail & {
  sourceMode: DisplayOrderSourceMode
}

const RESTAURANT_SIDE_MENU_PATHS = TABLE_POS_SIDEBAR_PATHS

const ORDER_CATEGORIES: OrderCategoryItem[] = [
  {
    key: 'TABLE',
    title: '테이블 주문',
    description: '오픈 테이블에서 접수된 주문을 확인합니다.'
  },
  {
    key: 'RESERVATION',
    title: '예약 주문',
    description: '예약 주문 상태를 확인합니다.'
  },
  {
    key: 'DELIVERY',
    title: '배달 주문',
    description: '배달 주문 상태와 배차 정보를 확인합니다.'
  },
  {
    key: 'PICKUP',
    title: '픽업 주문',
    description: '픽업 주문 상태와 준비 완료 여부를 확인합니다.'
  },
  {
    key: 'QR',
    title: 'QR 주문',
    description: 'QR 주문 상태를 간편하게 확인합니다.'
  },
  {
    key: 'KIOSK',
    title: '키오스크 주문',
    description: '키오스크에서 접수된 주문을 확인합니다.'
  }
]

const ORDER_TYPE_TABS: Array<
  | (OrderCategoryItem & { key: Exclude<PosOrderDashboardCategory, 'ALL'> })
  | { key: 'ALL'; title: string; description: string }
> = [
  {
    key: 'ALL',
    title: '전체',
    description: '현재 접수된 주문을 실시간으로 확인합니다.'
  },
  ...ORDER_CATEGORIES
]

type ManualOrderType = 'RESERVATION' | 'PICKUP' | 'DELIVERY'

type ManualOrderForm = {
  customerName: string
  customerPhone: string
  menuSummary: string
  expectedAmount: string
  orderMemo: string
  reservationDate: string
  reservationTime: string
  peopleCount: string
  pickupAt: string
  deliveryAddress: string
  deliveryDetailAddress: string
  deliveryMemo: string
}

const MANUAL_ORDER_TYPES: Array<{
  key: ManualOrderType
  label: string
}> = [
  { key: 'RESERVATION', label: '예약주문' },
  { key: 'PICKUP', label: '픽업주문' },
  { key: 'DELIVERY', label: '배달주문' }
]

const INITIAL_MANUAL_ORDER_FORM: ManualOrderForm = {
  customerName: '',
  customerPhone: '',
  menuSummary: '',
  expectedAmount: '',
  orderMemo: '',
  reservationDate: '',
  reservationTime: '',
  peopleCount: '',
  pickupAt: '',
  deliveryAddress: '',
  deliveryDetailAddress: '',
  deliveryMemo: ''
}

const getMockOrderNo = (category: Exclude<PosOrderDashboardCategory, 'ALL' | 'TABLE'>) => {
  if (category === 'RESERVATION') {
    return `R-`
  }

  if (category === 'PICKUP') {
    return `P-`
  }

  return `D-`
}

const getMockOrderDisplayCategoryLabel = (
  category: Exclude<PosOrderDashboardCategory, 'ALL' | 'TABLE'>
) => {
  if (category === 'RESERVATION') {
    return '예약 주문'
  }

  if (category === 'PICKUP') {
    return '픽업 주문'
  }

  return '배달 주문'
}

const formatCurrency = (amount: number) => {
  return `${amount.toLocaleString('ko-KR')}원`
}

const formatKoreanDateTime = (value: Date) => {
  return `${String(value.getFullYear()).padStart(4, '0')}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')} ${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}:${String(value.getSeconds()).padStart(2, '0')}`
}

const getReceivedAtText = (value: Date) => {
  return `오늘 ${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
}

const createNextMockOrder = (
  category: Exclude<PosOrderDashboardCategory, 'ALL' | 'TABLE'>,
  form: ManualOrderForm
): DisplayOrder => {
  const now = new Date()
  const safeAmount = Number.parseInt(form.expectedAmount, 10)
  const amount = Number.isNaN(safeAmount) || safeAmount < 0 ? 0 : safeAmount
  const safePrefix = getMockOrderNo(category)
  const serial = String(Math.abs(now.getTime()) % 1000).padStart(3, '0')
  const orderNo = `M-${safePrefix}${serial}`

  let source = ''

  if (category === 'RESERVATION') {
    const reserveAt = form.reservationTime
      ? `${form.reservationDate || '미지정'} ${form.reservationTime}`
      : form.reservationDate || '미지정'
    const headcount = form.peopleCount ? `${form.peopleCount}명` : '미지정'
    source = `${reserveAt} · ${headcount}`
  } else if (category === 'PICKUP') {
    source = form.pickupAt ? `픽업 예정: ${form.pickupAt}` : '픽업 예정: 미정'
  } else {
    const address = form.deliveryAddress || '주소 미입력'
    const detail = form.deliveryDetailAddress
      ? ` / ${form.deliveryDetailAddress}`
      : ''
    source = `${address}${detail}`
  }

  return {
    id: -1 - now.getTime(),
    orderId: -1 - now.getTime(),
    orderNo,
    orderCode: `MOCK-${orderNo}`,
    revisionCode: null,
    category,
    categoryLabel: getMockOrderDisplayCategoryLabel(category),
    status: '대기',
    orderStatus: 'CREATED',
    paymentStatus: 'UNPAID',
    amount,
    receivedAt: formatKoreanDateTime(now),
    receivedAtText: getReceivedAtText(now),
    summary: form.menuSummary,
    source,
    itemCount: 1,
    orderItemCount: 1,
    orderCompositionType: 'SINGLE',
    orderCompositionLabel: '단일 주문',
    totalQuantity: 1,
    sourceMode: 'MOCK'
  }
}

const getOrderStatusClassName = (status: PosOrderStatus) => {
  if (status === 'CREATED' || status === 'CONFIRMED') {
    return styles.statusReceived
  }

  if (status === 'PREPARING' || status === 'READY') {
    return styles.statusProgress
  }

  if (status === 'COMPLETED') {
    return styles.statusDone
  }

  return styles.statusCanceled
}

const getDisplayStatusGroupClassName = (
  group: PosOrderDashboardDisplayStatusGroup | undefined
) => {
  if (group === 'RECEIVED') {
    return styles.statusReceived
  }

  if (group === 'PROGRESS') {
    return styles.statusProgress
  }

  if (group === 'DONE') {
    return styles.statusDone
  }

  if (group === 'CANCELED') {
    return styles.statusCanceled
  }

  return null
}

const getOrderDisplayStatusClassName = (
  order: PosOrderDashboardItem | PosOrderDashboardDetail
) => {
  return getDisplayStatusGroupClassName(order.displayStatusGroup) ??
    getOrderStatusClassName(order.orderStatus)
}

const getDisplayOrderStatusLabel = (
  order: PosOrderDashboardItem | PosOrderDashboardDetail
) => {
  if (order.orderStatus === 'CREATED') {
    return '대기'
  }

  if (order.orderStatus === 'CONFIRMED') {
    return '접수'
  }

  if (order.displayStatusLabel) {
    return order.displayStatusLabel
  }

  if (order.category !== 'TABLE') {
    return order.status
  }

  if (order.orderStatus === 'PREPARING') {
    return '조리중'
  }

  if (order.orderStatus === 'READY' || order.orderStatus === 'COMPLETED') {
    return '조리완료(사용중)'
  }

  return '취소'
}

const getOrderDisplayStatusGroup = (
  order: DisplayOrder
): PosOrderDashboardDisplayStatusGroup => {
  if (order.displayStatusGroup) {
    return order.displayStatusGroup
  }

  if (order.status === '대기' || order.status === '접수') {
    return 'RECEIVED'
  }

  if (order.status === '처리중') {
    return 'PROGRESS'
  }

  if (order.status === '완료') {
    return 'DONE'
  }

  return 'CANCELED'
}

const getMockUiStatus = (
  orderStatus: UpdatePosOrderStatusInput['nextStatus']
) => {
  if (orderStatus === 'PREPARING') {
    return '처리중' as const
  }

  if (orderStatus === 'COMPLETED') {
    return '완료' as const
  }

  if (orderStatus === 'CANCELLED') {
    return '취소' as const
  }

  return '접수' as const
}

const createMockDetail = (order: DisplayOrder): DisplayOrderDetail => ({
  ...order,
  sourceMode: 'MOCK',
  subtotalAmount: order.amount,
  discountAmount: 0,
  taxAmount: 0,
  totalAmount: order.amount,
  memo: null,
  fulfillment: {
    fulfillmentType: order.category,
    sourceLabelSnapshot: order.source,
    deliveryAddress: order.category === 'DELIVERY' ? order.source : null,
    deliveryDetailAddress: null,
    deliveryPhone: null,
    deliveryMemo: null,
    pickupExpectedAt: order.category === 'PICKUP' ? order.source : null,
    reservationExpectedAt: order.category === 'RESERVATION' ? order.source : null,
    kioskDeviceCode: order.category === 'KIOSK' ? order.source : null,
    qrCodeValue: order.category === 'QR' ? order.source : null,
    customerRequestMemo: null
  },
  items: [
    {
      id: order.id,
      productId: null,
      productName: order.summary,
      categoryName: order.categoryLabel,
      unitPrice: order.amount,
      quantity: order.totalQuantity,
      lineTotalAmount: order.amount,
      options: []
    }
  ],
  statusEvents: [
    {
      id: order.id,
      fromStatus: null,
      toStatus: order.orderStatus,
      changedByType: 'SYSTEM',
      changedByProfileId: null,
      changedByStaffCode: null,
      reason: 'MOCK_ORDER_STATUS',
      createdAt: order.receivedAt
    }
  ]
})

const isClosedOrderStatus = (status: PosOrderStatus) => {
  return (
    status === 'COMPLETED' ||
    status === 'CANCELLED' ||
    status === 'ADMIN_DISABLED' ||
    status === 'REPLACED'
  )
}

export default function PosOrdersPage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const { loading: authLoading, profile } = useAuth()
  const channelCode = String(profile?.channelCode ?? '').trim()
  const [activeCategory, setActiveCategory] =
    useState<PosOrderDashboardCategory>('ALL')
  const [apiOrders, setApiOrders] =
    useState<DisplayOrder[]>([])
  const [mockOrders, setMockOrders] =
    useState<DisplayOrder[]>([])
  const [selectedOrder, setSelectedOrder] =
    useState<DisplayOrderDetail | null>(null)
  const [isLoadingOrders, setIsLoadingOrders] =
    useState<boolean>(false)
  const [isLoadingDetail, setIsLoadingDetail] =
    useState<boolean>(false)
  const [isUpdatingStatus, setIsUpdatingStatus] =
    useState<boolean>(false)
  const [errorMessage, setErrorMessage] =
    useState<string>('')
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] =
    useState<boolean>(false)
  const [manualOrderType, setManualOrderType] =
    useState<ManualOrderType>('PICKUP')
  const [manualOrderForm, setManualOrderForm] =
    useState<ManualOrderForm>(INITIAL_MANUAL_ORDER_FORM)
  const [selectedOrderModal, setSelectedOrderModal] =
    useState<PosOrderDashboardDisplayStatusGroup | null>(null)

  const getCategoryMeta = (category: PosOrderDashboardCategory) => {
    if (category === 'ALL') {
      return {
        title: '주문현황',
        description: '현재 접수된 주문을 실시간으로 확인합니다.'
      }
    }

    return (
      ORDER_CATEGORIES.find((item) => item.key === category) ?? {
        title: '주문 현황',
        description: '현재 접수된 주문을 확인합니다.'
      }
    )
  }

  const orders = useMemo(() => {
    if (activeCategory === 'ALL') {
      return [
        ...apiOrders,
        ...mockOrders
      ]
    }
    return [
      ...apiOrders.filter((order) => order.category === activeCategory),
      ...mockOrders.filter((order) => order.category === activeCategory)
    ]
  }, [activeCategory, apiOrders, mockOrders])

  const summaryItems: SummaryItem[] = useMemo(() => {
    const summary = orders.reduce(
      (accumulator, order) => {
        accumulator.totalOrders += 1
        const displayStatusGroup = getOrderDisplayStatusGroup(order)

        if (displayStatusGroup === 'RECEIVED') {
          accumulator.receivedOrders += 1
        } else if (displayStatusGroup === 'PROGRESS') {
          accumulator.progressOrders += 1
        } else if (displayStatusGroup === 'DONE') {
          accumulator.doneOrders += 1
        } else {
          accumulator.canceledOrders += 1
        }

        return accumulator
      },
      {
        totalOrders: 0,
        receivedOrders: 0,
        progressOrders: 0,
        doneOrders: 0,
        canceledOrders: 0
      }
    )

    return [
      { label: '전체 주문', value: `${summary.totalOrders}건` },
      { label: '접수', value: `${summary.receivedOrders}건` },
      { label: '처리중', value: `${summary.progressOrders}건` },
      { label: '완료', value: `${summary.doneOrders}건` },
      { label: '취소', value: `${summary.canceledOrders}건` }
    ]
  }, [orders])

  const receivedCount = summaryItems.find((item) => item.label === '접수')?.value ?? '0건'
  const progressCount = summaryItems.find((item) => item.label === '처리중')?.value ?? '0건'
  const doneCount = summaryItems.find((item) => item.label === '완료')?.value ?? '0건'
  const canceledCount = summaryItems.find((item) => item.label === '취소')?.value ?? '0건'

  const modalStatusLabelMap: Record<PosOrderDashboardDisplayStatusGroup, string> = {
    RECEIVED: '접수대기',
    PROGRESS: '진행중',
    DONE: '완료',
    CANCELED: '취소'
  }

  const selectedModalOrders = useMemo(() => {
    if (!selectedOrderModal) {
      return []
    }

    return orders.filter((order) => getOrderDisplayStatusGroup(order) === selectedOrderModal)
  }, [orders, selectedOrderModal])

  const loadOrders = useCallback(async () => {
    if (authLoading) {
      return
    }

    if (!channelCode) {
      setApiOrders([])
      setErrorMessage('주문현황을 조회할 채널 정보를 확인할 수 없습니다.')
      return
    }

    setIsLoadingOrders(true)

    try {
      const response = await fetchPosOrderDashboard({
        channelCode,
        category: activeCategory,
        status: 'ALL',
        limit: 100,
        offset: 0
      })

      setApiOrders(
        response.items.map((order) => ({
          ...order,
          sourceMode: 'API'
        }))
      )
      setErrorMessage('')
    } catch {
      setApiOrders([])
      setErrorMessage('주문현황을 불러오지 못했습니다.')
    } finally {
      setIsLoadingOrders(false)
    }
  }, [activeCategory, authLoading, channelCode])

  useEffect(() => {
    setSelectedOrder(null)
    void loadOrders()
  }, [loadOrders])

  const handleGoPosHome = () => {
    router.push('/pos')
  }

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleOpenManualOrderModal = () => {
    setIsManualOrderModalOpen(true)
  }

  const handleCloseManualOrderModal = () => {
    setIsManualOrderModalOpen(false)
    setManualOrderType('PICKUP')
    setManualOrderForm(INITIAL_MANUAL_ORDER_FORM)
  }

  const handleChangeManualOrderForm = (
    field: keyof ManualOrderForm,
    value: string
  ) => {
    setManualOrderForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCreateManualOrder = () => {
    const nextOrder = createNextMockOrder(
      manualOrderType,
      {
        ...manualOrderForm,
        menuSummary: manualOrderForm.menuSummary || '메뉴 미입력'
      }
    )

    setMockOrders((prev) => [nextOrder, ...prev])
    setActiveCategory(manualOrderType)
    setSelectedOrder(createMockDetail(nextOrder))
    handleCloseManualOrderModal()
  }

  const handleOpenPosSettings = () => {
    router.push('/pos/settings')
  }

  const handleChangeCategory = (category: PosOrderDashboardCategory) => {
    setActiveCategory(category)
    setSelectedOrder(null)
  }

  const handleSelectOrder = async (orderId: number) => {
    const targetOrder =
      orders.find((order) => order.orderId === orderId) ?? null

    if (targetOrder?.sourceMode === 'MOCK') {
      setSelectedOrder(createMockDetail(targetOrder))
      setErrorMessage('')
      return
    }

    if (!channelCode) {
      setErrorMessage('주문 상세를 조회할 채널 정보를 확인할 수 없습니다.')
      return
    }

    setIsLoadingDetail(true)

    try {
      const detail =
        await fetchPosOrderDashboardDetail(orderId, channelCode)

      setSelectedOrder({
        ...detail,
        sourceMode: 'API'
      })
      setErrorMessage('')
    } catch {
      setErrorMessage('주문 상세를 불러오지 못했습니다.')
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const handleUpdateStatus = async (
    orderId: number,
    nextStatus: UpdatePosOrderStatusInput['nextStatus']
  ) => {
    const targetOrder =
      selectedOrder?.orderId === orderId
        ? selectedOrder
        : orders.find((order) => order.orderId === orderId) ?? null

    if (targetOrder?.category === 'TABLE') {
      return
    }

    if (targetOrder?.sourceMode === 'MOCK') {
      const nextUiStatus = getMockUiStatus(nextStatus)

      setMockOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId
            ? {
              ...order,
              status: nextUiStatus,
              orderStatus: nextStatus
            }
            : order
        )
      )

      setSelectedOrder((prev) => {
        if (!prev || prev.orderId !== orderId || prev.sourceMode !== 'MOCK') {
          return prev
        }

        return {
          ...prev,
          status: nextUiStatus,
          orderStatus: nextStatus,
          statusEvents: [
            ...prev.statusEvents,
            {
              id: Date.now(),
              fromStatus: prev.orderStatus,
              toStatus: nextStatus,
              changedByType: 'OWNER',
              changedByProfileId: null,
              changedByStaffCode: null,
              reason: 'MOCK_ORDER_STATUS_UPDATE',
              createdAt: new Date().toISOString()
            }
          ]
        }
      })
      setErrorMessage('')
      return
    }

    if (!channelCode) {
      setErrorMessage('주문 상태를 변경할 채널 정보를 확인할 수 없습니다.')
      return
    }

    setIsUpdatingStatus(true)

    try {
      await updatePosOrderDashboardStatus(orderId, {
        channelCode,
        nextStatus,
        changedByType: 'OWNER',
        reason: 'POS 주문현황 상태 변경'
      })

      await loadOrders()

      if (selectedOrder?.orderId === orderId) {
        const detail =
          await fetchPosOrderDashboardDetail(orderId, channelCode)
        setSelectedOrder({
          ...detail,
          sourceMode: 'API'
        })
      }

      setErrorMessage('')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '주문 상태 변경에 실패했습니다.'
      )
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleChangeMenu = (menu: PosMenuKey) => {
    if (menu === 'ORDER_HISTORY') {
      return
    }

    if (
      menu === 'TABLE' ||
      menu === 'COOKING' ||
      menu === 'RESERVATION' ||
      menu === 'SALES_HISTORY' ||
      menu === 'MENU_MANAGE'
    ) {
      router.push(RESTAURANT_SIDE_MENU_PATHS[menu])
    }
  }

  const handleOpenOrderStatusModal = (status: PosOrderDashboardDisplayStatusGroup) => {
    setSelectedOrderModal(status)
  }

  const handleCloseOrderStatusModal = () => {
    setSelectedOrderModal(null)
    setSelectedOrder(null)
  }

  const handleCloseOrderDetailModal = () => {
    setSelectedOrder(null)
  }

  const handlePrintOrder = () => {
    if (typeof window === 'undefined') {
      return
    }

    window.print()
  }

  return (
    <div className={styles.page}>
      <div className={styles.posShell}>
        <div className={styles.topbarWrap}>
              <div className={styles.topbarInner}>
            <PosTopbar
              title="테이블 주문"
              onHomeClick={handleGoPosHome}
              onSettingsClick={handleOpenPosSettings}
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
            <main className={styles.main}>
              <PosHeaderMenuBar
                activeMenu="ORDER_HISTORY"
                onChangeMenu={handleChangeMenu}
                menuOptions={TABLE_POS_SIDEBAR_MENUS}
              />

              {errorMessage ? (
                <p className={styles.description}>{errorMessage}</p>
              ) : null}

              <div className={styles.menuScrollArea}>
                <section className={styles.posDashboardPanel}>
                  <article className={styles.posDashboardHero}>
                    <div>
                      <p className={styles.posDashboardEyebrow}>요식업 POS 주문현황</p>
                      <h1 className={styles.posDashboardTitle}>오늘 주문 운영 현황</h1>
                      <p className={styles.posDashboardDescription}>
                        오늘 접수된 주문 상태를 확인하고 접수대기/진행중/완료/취소 목록을 빠르게 확인합니다.
                      </p>
                    </div>
                    <div className={styles.posDashboardHeroActions}>
                      <select
                        aria-label="주문 유형 필터"
                        className={styles.orderTypeSelect}
                        value={activeCategory}
                        onChange={(event) => {
                          handleChangeCategory(event.target.value as PosOrderDashboardCategory)
                        }}
                      >
                        {ORDER_TYPE_TABS.map((category) => (
                          <option key={category.key} value={category.key}>
                            {category.title}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={styles.posDashboardPrimaryButton}
                        onClick={handleOpenManualOrderModal}
                      >
                        주문등록
                      </button>
                    </div>
                  </article>

                  <section className={styles.posDashboardSummaryGrid}>
                    <button
                      type="button"
                      className={styles.posDashboardSummaryCard}
                      onClick={() => handleOpenOrderStatusModal('RECEIVED')}
                    >
                      <span className={styles.posDashboardSummaryLabel}>접수대기</span>
                      <strong className={styles.posDashboardSummaryValue}>{receivedCount}</strong>
                      <small className={styles.posDashboardSummaryHint}>신규 접수 주문 확인</small>
                    </button>
                    <button
                      type="button"
                      className={styles.posDashboardSummaryCard}
                      onClick={() => handleOpenOrderStatusModal('PROGRESS')}
                    >
                      <span className={styles.posDashboardSummaryLabel}>진행중</span>
                      <strong className={styles.posDashboardSummaryValue}>{progressCount}</strong>
                      <small className={styles.posDashboardSummaryHint}>처리/조리 진행 주문 확인</small>
                    </button>
                    <button
                      type="button"
                      className={styles.posDashboardSummaryCard}
                      onClick={() => handleOpenOrderStatusModal('DONE')}
                    >
                      <span className={styles.posDashboardSummaryLabel}>완료</span>
                      <strong className={styles.posDashboardSummaryValue}>{doneCount}</strong>
                      <small className={styles.posDashboardSummaryHint}>완료된 주문 내역 확인</small>
                    </button>
                    <button
                      type="button"
                      className={styles.posDashboardSummaryCard}
                      onClick={() => handleOpenOrderStatusModal('CANCELED')}
                    >
                      <span className={styles.posDashboardSummaryLabel}>취소</span>
                      <strong className={styles.posDashboardSummaryValue}>{canceledCount}</strong>
                      <small className={styles.posDashboardSummaryHint}>취소 처리 주문 확인</small>
                    </button>
                  </section>
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>

      {selectedOrderModal ? (
        <div className={styles.cookingStatusModalOverlay} role="dialog" aria-modal="true">
          <div className={`${styles.cookingStatusModalPanel} ${styles.orderStatusModalPanel}`}>
            <header className={styles.cookingStatusModalHeader}>
              <div>
                <div className={styles.orderStatusModalTitleRow}>
                  <h2 className={styles.cookingStatusModalTitle}>{modalStatusLabelMap[selectedOrderModal]}</h2>
                  <span className={styles.orderStatusModalCountBadge}>
                    {selectedModalOrders.length}
                  </span>
                </div>
                <p className={styles.cookingStatusModalDescription}>
                  해당 상태의 주문 목록을 확인합니다.
                </p>
              </div>
              <button
                type="button"
                className={`${styles.tableStatusModalCloseButton} ${styles.tableStatusModalCloseButtonText}`}
                onClick={handleCloseOrderStatusModal}
              >
                닫기
              </button>
            </header>

            <div className={`${styles.cookingStatusModalBody} ${styles.orderStatusModalBody}`}>
              <section className={styles.ordersPanel} aria-label="주문 목록">
                {errorMessage ? (
                  <div className={styles.errorBox}>{errorMessage}</div>
                ) : null}

                <div className={styles.orderList}>
                  {isLoadingOrders ? (
                    <div className={styles.loadingState}>
                      주문현황을 불러오는 중입니다.
                    </div>
                  ) : null}

                  {!isLoadingOrders && selectedModalOrders.length === 0 ? (
                    <div className={styles.emptyState}>
                      현재 표시할 주문이 없습니다.
                    </div>
                  ) : null}

                  {!isLoadingOrders && selectedModalOrders.map((order) => {
                    const isTableOrder = order.category === 'TABLE'

                    return (
                      <article
                        key={order.orderId}
                        className={
                          selectedOrder?.orderId === order.orderId
                            ? styles.orderCardSelected
                            : styles.orderCard
                        }
                      >
                        <div className={styles.orderCardHeader}>
                          <div>
                            <div className={styles.orderNoRow}>
                              <strong className={styles.orderNo}>{order.orderNo}</strong>
                              <span
                                className={
                                  order.orderCompositionType === 'COMPOSITE'
                                    ? `${styles.compositionBadge} ${styles.compositionBadgeComposite}`
                                    : `${styles.compositionBadge} ${styles.compositionBadgeSingle}`
                                }
                              >
                                {order.orderCompositionLabel}
                              </span>
                            </div>
                            <p className={styles.orderSummary}>{order.summary}</p>
                          </div>

                          <div className={styles.orderHeaderActions}>
                            <span className={`${styles.statusBadge} ${getOrderDisplayStatusClassName(order)}`}>
                              {getDisplayOrderStatusLabel(order)}
                            </span>
                            <span className={styles.orderTypeInlineLabel}>
                              {order.categoryLabel}
                            </span>
                            <button
                              type="button"
                              className={styles.orderPrintButton}
                              onClick={handlePrintOrder}
                            >
                              인쇄
                            </button>
                          </div>
                        </div>

                        <div className={styles.orderBottomRow}>
                          <div className={styles.orderMetaGrid}>
                            <div className={styles.orderMetaItem}>
                              <span className={styles.orderMetaLabel}>주문유형</span>
                              <strong className={styles.orderMetaValue}>
                                {order.categoryLabel}
                              </strong>
                            </div>

                            <div className={styles.orderMetaItem}>
                              <span className={styles.orderMetaLabel}>결제금액</span>
                              <strong className={styles.orderMetaValue}>
                                {formatCurrency(order.amount)}
                              </strong>
                            </div>

                            <div className={styles.orderMetaItem}>
                              <span className={styles.orderMetaLabel}>주문시간</span>
                              <strong className={styles.orderMetaValue}>{order.receivedAtText}</strong>
                            </div>

                            <div className={styles.orderMetaItem}>
                              <span className={styles.orderMetaLabel}>주소</span>
                              <strong className={styles.orderMetaValue}>{order.source}</strong>
                            </div>
                          </div>

                          <div className={styles.orderActions}>
                            <button
                              type="button"
                              className={styles.secondaryButton}
                              onClick={() => handleSelectOrder(order.orderId)}
                              disabled={isLoadingDetail}
                            >
                              주문상세확인
                            </button>
                            {!isTableOrder ? (
                            <>
                              {selectedOrderModal === 'RECEIVED' ? (
                                <button
                                  type="button"
                                  className={styles.secondaryButton}
                                  onClick={() => handleUpdateStatus(order.orderId, 'PREPARING')}
                                  disabled={isUpdatingStatus || isClosedOrderStatus(order.orderStatus)}
                                >
                                  접수진행
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className={styles.secondaryButton}
                                onClick={() => handleUpdateStatus(order.orderId, 'CANCELLED')}
                                disabled={isUpdatingStatus || isClosedOrderStatus(order.orderStatus)}
                              >
                                취소
                              </button>
                              {selectedOrderModal !== 'RECEIVED' ? (
                                <button
                                  type="button"
                                  className={styles.primaryButton}
                                  onClick={() => handleUpdateStatus(order.orderId, 'COMPLETED')}
                                  disabled={isUpdatingStatus || isClosedOrderStatus(order.orderStatus)}
                                >
                                  완료
                                </button>
                              ) : null}
                              </>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
            </section>

            </div>

            {selectedOrder ? (
              <div
                className={styles.orderDetailModalOverlay}
                role="presentation"
                onClick={handleCloseOrderDetailModal}
              >
                <section
                  className={styles.orderDetailModal}
                  role="dialog"
                  aria-modal="true"
                  aria-label="주문 상세 내역"
                  onClick={(event) => event.stopPropagation()}
                >
                  <header className={styles.orderDetailModalHeader}>
                    <div>
                      <p className={styles.orderDetailPaymentGuide}>결제 가능합니다.</p>
                      <h3 className={styles.orderDetailTitle}>
                        주문 내역
                      </h3>
                      <p className={styles.orderDetailOrderCode}>
                        주문번호 {selectedOrder.orderNo}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.orderDetailCloseButton}
                      onClick={handleCloseOrderDetailModal}
                    >
                      닫기
                    </button>
                  </header>

                  <div className={styles.orderDetailList}>
                    {selectedOrder.items.map((item) => (
                      <article key={item.id} className={styles.orderDetailItemCard}>
                        <strong className={styles.orderDetailItemName}>{item.productName}</strong>
                        <p className={styles.orderDetailItemPrice}>
                          {item.quantity}개 · {formatCurrency(item.lineTotalAmount)}
                        </p>
                        {item.options.length > 0 ? (
                          <ul className={styles.orderDetailOptionList}>
                            {item.options.map((option) => (
                              <li key={option.id} className={styles.orderDetailOptionItem}>
                                - 옵션: {option.optionValueName} X {option.quantity} · +{formatCurrency(option.lineOptionAmount)}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </article>
                    ))}
                  </div>

                  <footer className={styles.orderDetailModalFooter}>
                    <strong className={styles.orderDetailTotalText}>
                      총 금액 : {formatCurrency(selectedOrder.totalAmount)}
                    </strong>
                  </footer>
                </section>
              </div>
            ) : null}

          </div>
        </div>
      ) : null}

      {isManualOrderModalOpen ? (
              <div
                className={styles.manualOrderModalOverlay}
                role="presentation"
                onClick={handleCloseManualOrderModal}
              >
                <section
                  className={styles.manualOrderModal}
                  role="dialog"
                  aria-modal="true"
                  aria-label="주문등록"
                  onClick={(event) => event.stopPropagation()}
                >
                  <header className={styles.manualOrderModalHeader}>
                    <div>
                      <h3 className={styles.manualOrderModalTitle}>주문등록</h3>
                      <p className={styles.manualOrderModalDescription}>
                        전화 또는 현장 문의로 접수된 주문을 등록합니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.modalCloseButton}
                      onClick={handleCloseManualOrderModal}
                    >
                      닫기
                    </button>
                  </header>

                  <div>
                    <div className={styles.manualOrderFieldLabel}>주문유형</div>
                    <div className={styles.manualOrderTypeButtonRow}>
                      {MANUAL_ORDER_TYPES.map((item) => {
                        const isActive = manualOrderType === item.key

                        return (
                          <button
                            key={item.key}
                            type="button"
                            className={`${styles.manualOrderTypeButton} ${isActive ? styles.manualOrderTypeButtonActive : ''}`}
                            onClick={() => setManualOrderType(item.key)}
                          >
                            {item.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className={styles.manualOrderForm}>
                    <label className={styles.manualOrderFormField}>
                      <span>고객명</span>
                      <input
                        type="text"
                        value={manualOrderForm.customerName}
                        onChange={(event) => {
                          handleChangeManualOrderForm('customerName', event.target.value)
                        }}
                        placeholder="고객명을 입력하세요"
                      />
                    </label>

                    <label className={styles.manualOrderFormField}>
                      <span>연락처</span>
                      <input
                        type="text"
                        value={manualOrderForm.customerPhone}
                        onChange={(event) => {
                          handleChangeManualOrderForm('customerPhone', event.target.value)
                        }}
                        placeholder="연락처를 입력하세요"
                      />
                    </label>

                    <label className={styles.manualOrderFormField}>
                      <span>메뉴 요약</span>
                      <input
                        type="text"
                        value={manualOrderForm.menuSummary}
                        onChange={(event) => {
                          handleChangeManualOrderForm('menuSummary', event.target.value)
                        }}
                        placeholder="메뉴 요약을 입력하세요"
                      />
                    </label>

                    <label className={styles.manualOrderFormField}>
                      <span>예상 금액</span>
                      <input
                        type="number"
                        min={0}
                        value={manualOrderForm.expectedAmount}
                        onChange={(event) => {
                          handleChangeManualOrderForm('expectedAmount', event.target.value)
                        }}
                        placeholder="숫자 입력"
                      />
                    </label>

                    <label className={styles.manualOrderFormField}>
                      <span>주문 메모</span>
                      <textarea
                        value={manualOrderForm.orderMemo}
                        onChange={(event) => {
                          handleChangeManualOrderForm('orderMemo', event.target.value)
                        }}
                        placeholder="메모를 입력하세요"
                      />
                    </label>

                    {manualOrderType === 'RESERVATION' ? (
                      <>
                        <label className={styles.manualOrderFormField}>
                          <span>예약일</span>
                          <input
                            type="date"
                            value={manualOrderForm.reservationDate}
                            onChange={(event) => {
                              handleChangeManualOrderForm('reservationDate', event.target.value)
                            }}
                          />
                        </label>
                        <label className={styles.manualOrderFormField}>
                          <span>예약시간</span>
                          <input
                            type="time"
                            value={manualOrderForm.reservationTime}
                            onChange={(event) => {
                              handleChangeManualOrderForm('reservationTime', event.target.value)
                            }}
                          />
                        </label>
                        <label className={styles.manualOrderFormField}>
                          <span>인원수</span>
                          <input
                            type="number"
                            min={1}
                            value={manualOrderForm.peopleCount}
                            onChange={(event) => {
                              handleChangeManualOrderForm('peopleCount', event.target.value)
                            }}
                            placeholder="인원수"
                          />
                        </label>
                      </>
                    ) : null}

                    {manualOrderType === 'PICKUP' ? (
                      <label className={styles.manualOrderFormField}>
                        <span>픽업 예정시간</span>
                        <input
                          type="datetime-local"
                          value={manualOrderForm.pickupAt}
                          onChange={(event) => {
                            handleChangeManualOrderForm('pickupAt', event.target.value)
                          }}
                        />
                      </label>
                    ) : null}

                    {manualOrderType === 'DELIVERY' ? (
                      <>
                        <label className={styles.manualOrderFormField}>
                          <span>배달주소</span>
                          <input
                            type="text"
                            value={manualOrderForm.deliveryAddress}
                            onChange={(event) => {
                              handleChangeManualOrderForm('deliveryAddress', event.target.value)
                            }}
                            placeholder="주소를 입력하세요"
                          />
                        </label>
                        <label className={styles.manualOrderFormField}>
                          <span>상세주소</span>
                          <input
                            type="text"
                            value={manualOrderForm.deliveryDetailAddress}
                            onChange={(event) => {
                              handleChangeManualOrderForm('deliveryDetailAddress', event.target.value)
                            }}
                            placeholder="상세주소를 입력하세요"
                          />
                        </label>
                        <label className={styles.manualOrderFormField}>
                          <span>배달메모</span>
                          <input
                            type="text"
                            value={manualOrderForm.deliveryMemo}
                            onChange={(event) => {
                              handleChangeManualOrderForm('deliveryMemo', event.target.value)
                            }}
                            placeholder="요청사항을 입력하세요"
                          />
                        </label>
                      </>
                    ) : null}
                  </div>

                  <footer className={styles.modalActionRow}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handleCloseManualOrderModal}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={handleCreateManualOrder}
                    >
                      등록
                    </button>
                  </footer>
                </section>
              </div>
      ) : null}
      </div>
  )
}
