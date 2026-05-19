// FILE : frontend/app/(pos)/pos/page.tsx
// ROOT : frontend/app/(pos)/pos/page.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS POS MAIN PAGE
// CHANGE SUMMARY :
// - /pos 메인 페이지 UTF-8 한글 문구 복구
// - 예약주문 mock 카드 리스트와 요약/카운트 유지
// - 기존 POS 레이아웃 조립 구조 유지
// - DB/API 연결 없음

'use client'

// SECTION 01 : IMPORT
import { KeyboardEvent, MouseEvent, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import styles from '../PosPage.module.css'

import PosFooterBar from '../components/PosFooterBar'
import { usePosKeyboardMode } from '../components/PosKeyboardModeContext'
import PosSidebar from '../components/PosSidebar'
import PosTodaySummary from '../components/PosTodaySummary'
import PosTopbar from '../components/PosTopbar'
import {
  TABLE_POS_SIDEBAR_MENUS,
  TABLE_POS_SIDEBAR_PATHS
} from '../components/tablePosMenuConfig'
import {
  DailyOrderItem,
  PosDailySummary,
  PosMenuKey,
  PosReservationOrderItem,
  PosReservationSummary,
  PosSalesSummary,
  PosTableItem,
  SalesFilterType
} from '../components/posTypes'
import PosDeliveryView from '../components/menu-panels/PosDeliveryView'
import PosOrderHistoryView from '../components/menu-panels/PosOrderHistoryView'
import PosPickupView from '../components/menu-panels/PosPickupView'
import PosReservationView from '../components/menu-panels/PosReservationView'
import PosSalesHistoryView from '../components/menu-panels/PosSalesHistoryView'
import PosTableView from '../components/menu-panels/PosTableView'
import { getMe } from '@/lib/authApi'
import {
  getPosMenus,
  PosMenuContext,
  PosMenuItem
} from '@/lib/business/pos/posMenuApi'
import { getActivePosOrder } from '@/lib/business/pos/posOrdersApi'
import {
  getPosTableSettings,
  PosTableResourceStatus,
  PosTableSettingItem,
  updatePosTableResourceStatus
} from '@/lib/business/pos/posTableSettingsApi'
import { getPosCookingTickets } from '@/lib/business/pos/posCookingApi'

// SECTION 02 : MOCK DATA
const reservationOrders: PosReservationOrderItem[] = [
  {
    id: 'res-1',
    orderNo: 'RES-250504-001',
    reservationType: 'VISIT',
    reservationLabel: '매장방문',
    summaryText: '매장방문 / 인원 10명 / 메뉴 김치찌개 2, 공기밥 2',
    scheduledLabel: '방문예정시간',
    scheduledTime: '18:00',
    customerName: '김민지',
    status: 'WAITING'
  },
  {
    id: 'res-2',
    orderNo: 'RES-250504-002',
    reservationType: 'DELIVERY',
    reservationLabel: '배달주문',
    summaryText: '배달주문 / 요청시간 18:30 / 제육볶음 1, 콜라 2',
    scheduledLabel: '배달요청시간',
    scheduledTime: '18:30',
    customerName: '이도윤',
    status: 'WAITING'
  },
  {
    id: 'res-3',
    orderNo: 'RES-250504-003',
    reservationType: 'PICKUP',
    reservationLabel: '픽업주문',
    summaryText: '픽업주문 / 예정시간 19:10 / 돈까스 2, 아메리카노 1',
    scheduledLabel: '픽업예정시간',
    scheduledTime: '19:10',
    customerName: '박서준',
    status: 'WAITING'
  }
]

const initialDailyOrders: DailyOrderItem[] = [
  {
    id: 'do-1',
    paymentNumber: 'PAY-240501-001',
    orderNumber: 'OD-240501-001',
    tableNo: 1,
    customerChannelCode: 'A240501MOCK01',
    amount: 24000,
    orderStatus: 'ORDER_REQUESTED',
    paymentStatus: 'UNPAID',
    paymentMethod: 'CARD',
    paidAt: '',
    isQrPayment: false,
    pointAmount: 0,
    memo: '결제 대기 상태',
    orderItems: [
      { name: '클래식 버거', quantity: 2 },
      { name: '아메리카노', quantity: 2 }
    ],
    items: ['클래식 버거 x2', '아메리카노 x2']
  },
  {
    id: 'do-2',
    paymentNumber: 'PAY-240501-002',
    orderNumber: 'OD-240501-002',
    tableNo: 3,
    customerChannelCode: 'A240501MOCK02',
    amount: 18000,
    orderStatus: 'ORDER_CONFIRMED',
    paymentStatus: 'UNPAID',
    paymentMethod: 'CASH',
    paidAt: '',
    isQrPayment: false,
    pointAmount: 0,
    memo: '현장 결제 예정',
    orderItems: [
      { name: '치킨 라이스', quantity: 1 },
      { name: '감자튀김', quantity: 1 },
      { name: '레몬에이드', quantity: 1 }
    ],
    items: ['치킨 라이스 x1', '감자튀김 x1', '레몬에이드 x1']
  },
  {
    id: 'do-3',
    paymentNumber: 'PAY-240501-003',
    orderNumber: 'OD-240501-003',
    tableNo: 2,
    customerChannelCode: 'A240501MOCK03',
    amount: 7900,
    orderStatus: 'ORDER_REQUESTED',
    paymentStatus: 'PAID',
    paymentMethod: 'QR',
    paidAt: '12:10',
    isQrPayment: true,
    pointAmount: 79,
    memo: 'QR결제 1% 포인트 적립 완료',
    orderItems: [
      { name: '토마토 파스타', quantity: 1 }
    ],
    items: ['토마토 파스타 x1']
  },
  {
    id: 'do-4',
    paymentNumber: 'PAY-240501-004',
    orderNumber: 'OD-240501-004',
    tableNo: 6,
    customerChannelCode: 'A240501MOCK04',
    amount: 13500,
    orderStatus: 'ORDER_WAITING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'CARD',
    paidAt: '',
    isQrPayment: false,
    pointAmount: 0,
    memo: '고객 요청으로 잠시 대기',
    orderItems: [
      { name: '아메리카노', quantity: 1 },
      { name: '치즈스틱', quantity: 2 }
    ],
    items: ['아메리카노 x1', '치즈스틱 x2']
  },
  {
    id: 'do-5',
    paymentNumber: 'PAY-240501-005',
    orderNumber: 'OD-240501-005',
    tableNo: 4,
    customerChannelCode: 'A240501MOCK05',
    amount: 26000,
    orderStatus: 'ORDER_CONFIRMED',
    paymentStatus: 'PAID',
    paymentMethod: 'QR',
    paidAt: '13:42',
    isQrPayment: true,
    pointAmount: 260,
    memo: 'QR결제 1% 포인트 적립 완료',
    orderItems: [
      { name: '클래식 버거', quantity: 1 },
      { name: '치즈 샐러드', quantity: 1 },
      { name: '레몬에이드', quantity: 1 }
    ],
    items: ['클래식 버거 x1', '치즈 샐러드 x1', '레몬에이드 x1']
  },
  {
    id: 'do-6',
    paymentNumber: 'PAY-240501-006',
    orderNumber: 'OD-240501-006',
    tableNo: 5,
    customerChannelCode: 'A240501MOCK06',
    amount: 12000,
    orderStatus: 'ORDER_CONFIRMED',
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    paidAt: '14:15',
    isQrPayment: false,
    pointAmount: 0,
    memo: '현금결제 완료',
    orderItems: [
      { name: '치킨 라이스', quantity: 1 },
      { name: '아메리카노', quantity: 1 }
    ],
    items: ['치킨 라이스 x1', '아메리카노 x1']
  }
]

const TABLE_SIDE_MENU_PATHS = TABLE_POS_SIDEBAR_PATHS
const TABLE_ORDER_BLOCK_MESSAGE =
  '테이블 정리대기 상태입니다. 정리완료 후 주문을 등록할 수 있습니다.'

// SECTION 03 : COMPONENT
function BusinessPosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    keyboardMode,
    toggleKeyboardMode
  } = usePosKeyboardMode()

  const [activeMenu, setActiveMenu] = useState<PosContentMenuKey>(() => {
    const menuParam = searchParams.get('menu')

    if (isPosContentMenuKey(menuParam)) {
      return menuParam
    }

    return 'TABLE'
  })
  const [selectedTableNo, setSelectedTableNo] = useState<number | null>(null)
  const [selectedSalesFilter, setSelectedSalesFilter] = useState<SalesFilterType>('ALL')
  const [selectedSalesPaymentId, setSelectedSalesPaymentId] = useState<string | null>(null)
  const [selectedTableNoForOrderSummary, setSelectedTableNoForOrderSummary] = useState<number | null>(null)
  const [tableStateItems, setTableStateItems] = useState<PosTableItem[]>([])
  const [dailyOrders, setDailyOrders] = useState<DailyOrderItem[]>(initialDailyOrders)
  const [posMenuItems, setPosMenuItems] = useState<PosMenuItem[]>([])
  const [isPosMenuLoading, setIsPosMenuLoading] = useState<boolean>(false)
  const [posMenuError, setPosMenuError] = useState<string | null>(null)
  const [isPosTableLoading, setIsPosTableLoading] = useState<boolean>(false)
  const [posTableError, setPosTableError] = useState<string | null>(null)
  const [currentBusinessContext, setCurrentBusinessContext] = useState<PosMenuContext | null>(null)

  const totalTableAmount = useMemo(
    () => tableStateItems.reduce((sum, table) => sum + table.amount, 0),
    [tableStateItems]
  )

  const usingTableCount = useMemo(
    () => tableStateItems.filter((table) => table.status === 'USING').length,
    [tableStateItems]
  )

  const confirmedTableCount = useMemo(
    () => tableStateItems.filter((table) => table.status === 'PAYMENT_WAITING').length,
    [tableStateItems]
  )

  const reservationSummary = useMemo<PosReservationSummary>(() => {
    return {
      total: reservationOrders.length,
      confirmed: reservationOrders.filter((order) => order.status === 'CONFIRMED').length,
      waiting: reservationOrders.filter((order) => order.status === 'WAITING').length,
      completed: reservationOrders.filter((order) => order.status === 'COMPLETED').length
    }
  }, [])

  const dailySummary = useMemo<PosDailySummary>(() => {
    return {
      total: dailyOrders.length,
      confirmed: dailyOrders.filter((order) => order.orderStatus === 'ORDER_CONFIRMED').length,
      waiting: dailyOrders.filter((order) => order.orderStatus === 'ORDER_WAITING').length,
      requested: dailyOrders.filter((order) => order.orderStatus === 'ORDER_REQUESTED').length
    }
  }, [dailyOrders])

  const paidSalesOrders = useMemo(
    () => dailyOrders.filter((order) => order.paymentStatus === 'PAID'),
    [dailyOrders]
  )

  const salesSummary = useMemo<PosSalesSummary>(() => {
    return {
      paidCount: paidSalesOrders.length,
      totalSalesAmount: paidSalesOrders.reduce((sum, order) => sum + order.amount, 0),
      cardSalesAmount: paidSalesOrders
        .filter((order) => order.paymentMethod === 'CARD')
        .reduce((sum, order) => sum + order.amount, 0),
      cashSalesAmount: paidSalesOrders
        .filter((order) => order.paymentMethod === 'CASH')
        .reduce((sum, order) => sum + order.amount, 0),
      qrSalesAmount: paidSalesOrders
        .filter((order) => order.paymentMethod === 'QR')
        .reduce((sum, order) => sum + order.amount, 0),
      totalQrPoints: paidSalesOrders
        .filter((order) => order.paymentMethod === 'QR')
        .reduce((sum, order) => sum + Math.floor(order.amount * 0.01), 0)
    }
  }, [paidSalesOrders])

  const filteredSalesOrders = useMemo(() => {
    if (selectedSalesFilter === 'CARD') {
      return paidSalesOrders.filter((order) => order.paymentMethod === 'CARD')
    }

    if (selectedSalesFilter === 'CASH') {
      return paidSalesOrders.filter((order) => order.paymentMethod === 'CASH')
    }

    if (selectedSalesFilter === 'QR') {
      return paidSalesOrders.filter((order) => order.paymentMethod === 'QR')
    }

    if (selectedSalesFilter === 'POINT') {
      return paidSalesOrders.filter((order) => order.paymentMethod === 'QR')
    }

    return paidSalesOrders
  }, [paidSalesOrders, selectedSalesFilter])

  const selectedSalesPayment = useMemo(
    () => paidSalesOrders.find((order) => order.id === selectedSalesPaymentId) ?? null,
    [paidSalesOrders, selectedSalesPaymentId]
  )

  const selectedTableOrderSummary = useMemo(
    () => tableStateItems.find((table) => table.tableNo === selectedTableNoForOrderSummary) ?? null,
    [selectedTableNoForOrderSummary, tableStateItems]
  )

  const pageCopy = useMemo(
    () => getPageCopy(activeMenu, selectedSalesFilter),
    [activeMenu, selectedSalesFilter]
  )

  const footerCount = useMemo(() => {
    if (activeMenu === 'TABLE') {
      return tableStateItems.length
    }

    if (activeMenu === 'RESERVATION') {
      return reservationSummary.total
    }

    if (activeMenu === 'ORDER_HISTORY') {
      return dailySummary.total
    }

    return 0
  }, [activeMenu, dailySummary.total, reservationSummary.total, tableStateItems.length])

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleGoPosHome = () => {
    router.push('/pos')
  }

  const handleOpenPosSettings = () => {
    router.push('/pos/settings')
  }

  const handleChangeMenu = (menu: PosMenuKey) => {
    if (menu === 'MENU_MANAGE') {
      router.push(TABLE_SIDE_MENU_PATHS.MENU_MANAGE)
      return
    }

    if (menu === 'COOKING') {
      router.push(TABLE_SIDE_MENU_PATHS.COOKING)
      return
    }

    if (
      menu === 'TABLE' ||
      menu === 'ORDER_HISTORY' ||
      menu === 'RESERVATION' ||
      menu === 'SALES_HISTORY'
    ) {
      setActiveMenu(menu)
      setSelectedSalesPaymentId(null)
      setSelectedTableNoForOrderSummary(null)

      if (menu === 'SALES_HISTORY') {
        setSelectedSalesFilter('ALL')
      }

      router.push(TABLE_SIDE_MENU_PATHS[menu])
      return
    }

    if (menu === 'ROOM_STATUS') {
      router.push('/pos/rooms')
      return
    }

  }

  const handleClickTable = (tableNo: number) => {
    const targetTable =
      tableStateItems.find((table) => table.tableNo === tableNo)

    if (targetTable && isTableOrderEntryBlocked(targetTable)) {
      setPosTableError(TABLE_ORDER_BLOCK_MESSAGE)
      window.alert(TABLE_ORDER_BLOCK_MESSAGE)
      return
    }

    setSelectedTableNo(tableNo)
    router.push(`/pos/table/${tableNo}`)
  }

  const handleClickTableOrderButton = (
    event: MouseEvent<HTMLButtonElement>,
    tableNo: number
  ) => {
    event.stopPropagation()
    setSelectedTableNo(tableNo)
    setSelectedTableNoForOrderSummary(tableNo)
  }

  const handleClickTableCleaningAction = async (
    event: MouseEvent<HTMLButtonElement>,
    table: PosTableItem
  ) => {
    event.stopPropagation()

    if (!currentBusinessContext) {
      setPosTableError('BUSINESS 컨텍스트를 확인할 수 없습니다.')
      return
    }

    const nextResourceStatus = getNextCleaningResourceStatus(table.status)

    if (!nextResourceStatus) {
      return
    }

    try {
      const result = await updatePosTableResourceStatus(
        table.locationId,
        {
          profileId: currentBusinessContext.profileId,
          channelCode: currentBusinessContext.channelCode,
          resourceStatus: nextResourceStatus
        }
      )

      setTableStateItems((prev) =>
        prev.map((item) =>
          item.locationId === result.locationId
            ? {
              ...item,
              resourceStatus: result.resourceStatus,
              status: toTableCardStatus(result.resourceStatus, item.amount),
              paymentStatusLabel:
                result.resourceStatus === 'AVAILABLE'
                  ? '결제완료'
                  : item.paymentStatusLabel
            }
            : item
        )
      )
      setPosTableError(null)
    } catch (error) {
      setPosTableError(
        error instanceof Error
          ? error.message
          : '테이블 정리 상태 변경에 실패했습니다.'
      )
    }
  }

  const handleChangeSelectedTableNo = (tableNo: number | null) => {
    setSelectedTableNo(tableNo)
  }

  const handleTableCardKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    tableNo: number
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()

      const targetTable =
        tableStateItems.find((table) => table.tableNo === tableNo)

      if (targetTable && isTableOrderEntryBlocked(targetTable)) {
        setPosTableError(TABLE_ORDER_BLOCK_MESSAGE)
        window.alert(TABLE_ORDER_BLOCK_MESSAGE)
        return
      }

      router.push(`/pos/table/${tableNo}`)
    }
  }

  const handleConfirmOrder = (orderId: string) => {
    setDailyOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId || order.paymentStatus === 'PAID') {
          return order
        }

        return {
          ...order,
          orderStatus: 'ORDER_CONFIRMED'
        }
      })
    )
  }

  const handleRevertToWaiting = (orderId: string) => {
    setDailyOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId || order.paymentStatus === 'PAID') {
          return order
        }

        return {
          ...order,
          orderStatus: 'ORDER_WAITING'
        }
      })
    )
  }

  const handleEditOrder = (orderId: string) => {
    console.log('주문 수정 클릭', orderId)
  }

  const handlePayOrder = (orderId: string) => {
    console.log('결제하기 클릭', orderId)
  }

  const handleConfirmSelectedTableOrder = () => {
    if (selectedTableNoForOrderSummary === null) {
      return
    }

    setTableStateItems((prev) =>
      prev.map((table) => {
        if (table.tableNo !== selectedTableNoForOrderSummary || table.status === 'PAYMENT_WAITING') {
          return table
        }

        return {
          ...table,
          status: 'PAYMENT_WAITING'
        }
      })
    )
  }

  const handleRevertSelectedTableOrderToWaiting = () => {
    if (selectedTableNoForOrderSummary === null) {
      return
    }

    setTableStateItems((prev) =>
      prev.map((table) => {
        if (table.tableNo !== selectedTableNoForOrderSummary) {
          return table
        }

        return {
          ...table,
          status: 'USING',
          paymentStatusLabel: '미결제'
        }
      })
    )
  }

  const handlePrimaryFooterAction = () => {
    if (activeMenu === 'TABLE' && selectedTableOrderSummary) {
      if (selectedTableOrderSummary.status === 'PAYMENT_WAITING') {
        return
      }

      handleConfirmSelectedTableOrder()
    }
  }

  useEffect(() => {
    let isMounted = true

    const initializePosData = async () => {
      setIsPosMenuLoading(true)
      setIsPosTableLoading(true)
      setPosMenuError(null)
      setPosTableError(null)

      try {
        const meResponse = await getMe()
        const loginUser = meResponse.user

        if (loginUser.profileType !== 'BUSINESS') {
          throw new Error('BUSINESS 프로필 로그인 컨텍스트가 필요합니다.')
        }

        const context: PosMenuContext = {
          channelCode: loginUser.channelCode,
          profileId: loginUser.profileId
        }

        if (!isMounted) {
          return
        }

        setCurrentBusinessContext(context)

        try {
          const posMenuResponse = await getPosMenus(context)

          if (!isMounted) {
            return
          }

          setPosMenuItems(posMenuResponse.items ?? [])
          setPosMenuError(null)
        } catch (menuError) {
          if (!isMounted) {
            return
          }

          const message =
            menuError instanceof Error
              ? menuError.message
              : 'POS 메뉴 / 상품 정보를 불러오지 못했습니다.'

          setPosMenuItems([])
          setPosMenuError(message)
        } finally {
          if (!isMounted) {
            return
          }

          setIsPosMenuLoading(false)
        }

        try {
          const tableSettingsResponse = await getPosTableSettings({
            profileId: context.profileId,
            channelCode: context.channelCode
          })

          if (!isMounted) {
            return
          }

          const cookingStatusLabelByLocationId = new Map<number, string>()

          try {
            const cookingTicketResponse = await getPosCookingTickets({
              profileId: context.profileId,
              channelCode: context.channelCode,
              cookingStatus: 'ALL',
              isActive: 1
            })

            const cookingStatusCountByLocationId = new Map<number, {
              waiting: number
              cooking: number
              done: number
            }>()

            for (const ticket of cookingTicketResponse.tickets ?? []) {
              const locationId = Number(ticket.locationId ?? 0)
              if (!Number.isFinite(locationId) || locationId <= 0) {
                continue
              }

              const current = cookingStatusCountByLocationId.get(locationId) ?? {
                waiting: 0,
                cooking: 0,
                done: 0
              }

              if (ticket.cookingStatus === 'WAITING') {
                current.waiting += 1
              } else if (ticket.cookingStatus === 'COOKING') {
                current.cooking += 1
              } else if (ticket.cookingStatus === 'DONE') {
                current.done += 1
              }

              cookingStatusCountByLocationId.set(locationId, current)
            }

            for (const [locationId, counts] of cookingStatusCountByLocationId.entries()) {
              if (counts.waiting > 0) {
                cookingStatusLabelByLocationId.set(locationId, `조리대기 ${counts.waiting}`)
                continue
              }

              if (counts.cooking > 0) {
                cookingStatusLabelByLocationId.set(locationId, `조리중 ${counts.cooking}`)
                continue
              }

              if (counts.done > 0) {
                cookingStatusLabelByLocationId.set(locationId, '조리완료')
              }
            }
          } catch (cookingError) {
            console.error('테이블별 조리현황 조회 오류', cookingError)
          }

          const activeOrderSummaryByLocationId = new Map<
            number,
            {
              amount: number
              orderItems: Array<{
                name: string
                quantity: number
                optionSummary?: string
              }>
            }
          >()

          await Promise.all(
            tableSettingsResponse.tables.map(async (table) => {
              const result = await getActivePosOrder({
                profileId: context.profileId,
                channelCode: context.channelCode,
                locationId: table.id
              })

              if (result.data?.order && !result.error) {
                const normalizedItems = (result.data.items ?? [])
                  .map((orderItem) => {
                    const optionSummary = (orderItem.options ?? [])
                      .map((option) => `${option.optionValueName} x${Number(option.quantity ?? 0)}`)
                      .filter((text) => text.trim().length > 0)
                      .join(', ')

                    return {
                      name: orderItem.productName,
                      quantity: Number(orderItem.quantity ?? 0),
                      optionSummary: optionSummary.length > 0 ? optionSummary : undefined
                    }
                  })
                  .filter((orderItem) => orderItem.quantity > 0)

                activeOrderSummaryByLocationId.set(table.id, {
                  amount: Number(result.data.order.totalAmount ?? 0),
                  orderItems: normalizedItems
                })
              }
            })
          )

          const nextTableItems = mapPosLocationsToTableItems(
            tableSettingsResponse.tables,
            activeOrderSummaryByLocationId,
            cookingStatusLabelByLocationId
          )

          setTableStateItems(nextTableItems)
          setPosTableError(null)

          setSelectedTableNo((previousTableNo) => {
            const hasSelectedTable = nextTableItems.some((table) => table.tableNo === previousTableNo)

            if (hasSelectedTable) {
              return previousTableNo
            }
            return nextTableItems[0]?.tableNo ?? null
          })
        } catch (tableError) {
          if (!isMounted) {
            return
          }

          const message =
            tableError instanceof Error
              ? tableError.message
              : 'POS 테이블 정보를 불러오지 못했습니다.'

          setTableStateItems([])
          setSelectedTableNo(null)
          setPosTableError(message)
        } finally {
          if (!isMounted) {
            return
          }

          setIsPosTableLoading(false)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'POS 메뉴 / 상품 정보를 불러오지 못했습니다.'

        setPosMenuError(message)
        setPosTableError(message)
        setCurrentBusinessContext(null)
        setPosMenuItems([])
        setTableStateItems([])
        setSelectedTableNo(null)
        setIsPosMenuLoading(false)
        setIsPosTableLoading(false)
      }
    }

    initializePosData()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!(event.target instanceof HTMLElement)) {
        return
      }

      const tagName = event.target.tagName.toLowerCase()

      if (
        keyboardMode !== 'POS' ||
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        event.target.isContentEditable
      ) {
        return
      }

      if (event.code === 'F1') {
        event.preventDefault()
        router.push('/pos')
        return
      }

      if (event.code === 'F2') {
        event.preventDefault()
        setActiveMenu('TABLE')
        setSelectedTableNo((prev) => prev ?? tableStateItems[0]?.tableNo ?? null)
        setSelectedSalesPaymentId(null)
        setSelectedTableNoForOrderSummary(null)
        return
      }

      if (event.code === 'Enter' && activeMenu === 'TABLE' && selectedTableNo !== null) {
        event.preventDefault()
        router.push(`/pos/table/${selectedTableNo}`)
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown)

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown)
    }
  }, [activeMenu, keyboardMode, router, selectedTableNo, tableStateItems])

  const currentView = (() => {
    if (activeMenu === 'TABLE') {
      return (
        <PosTableView
          tables={tableStateItems}
          selectedTableNo={selectedTableNo}
          onChangeSelectedTableNo={handleChangeSelectedTableNo}
          onClickTable={handleClickTable}
          onClickTableOrderButton={handleClickTableOrderButton}
          onClickTableCleaningAction={handleClickTableCleaningAction}
          onTableCardKeyDown={handleTableCardKeyDown}
          onGoTableSettings={() => router.push('/pos/table/settings')}
        />
      )
    }

    if (activeMenu === 'RESERVATION') {
      return (
        <PosReservationView reservationOrders={reservationOrders} />
      )
    }

    if (activeMenu === 'DELIVERY') {
      return <PosDeliveryView />
    }

    if (activeMenu === 'PICKUP') {
      return <PosPickupView />
    }

    if (activeMenu === 'ORDER_HISTORY') {
      return (
        <PosOrderHistoryView
          dailyOrders={dailyOrders}
          onConfirmOrder={handleConfirmOrder}
          onRevertToWaiting={handleRevertToWaiting}
          onEditOrder={handleEditOrder}
          onPayOrder={handlePayOrder}
        />
      )
    }

    return (
      <PosSalesHistoryView
        salesOrders={filteredSalesOrders}
        selectedSalesPaymentId={selectedSalesPaymentId}
        onSelectSalesPayment={setSelectedSalesPaymentId}
      />
    )
  })()

  const activeSideMenu: Extract<
    PosMenuKey,
    'TABLE' | 'MENU_MANAGE' | 'ORDER_HISTORY' | 'RESERVATION' | 'SALES_HISTORY'
  > = activeMenu === 'ORDER_HISTORY' || activeMenu === 'RESERVATION' || activeMenu === 'SALES_HISTORY'
      ? activeMenu
      : 'TABLE'

  return (
    <div
      className={styles.page}
      data-pos-menu-count={posMenuItems.length}
      data-pos-menu-loading={isPosMenuLoading ? 'true' : 'false'}
      data-pos-menu-error={posMenuError ?? ''}
      data-pos-table-loading={isPosTableLoading ? 'true' : 'false'}
      data-pos-table-error={posTableError ?? ''}
      data-pos-channel-code={currentBusinessContext?.channelCode ?? ''}
      data-pos-profile-id={currentBusinessContext?.profileId ?? ''}
    >
      <div className={styles.posShell}>
        <div className={styles.topbarWrap}>
          <div className={styles.topbarInner}>
            <PosTopbar
              title="POS 메인"
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
            <PosSidebar
              activeMenu={activeSideMenu}
              onChangeMenu={handleChangeMenu}
              menuOptions={TABLE_POS_SIDEBAR_MENUS}
              className={styles.sidebar}
            />

            <main className={styles.main}>
              {activeMenu !== 'TABLE' ? (
                <div className={styles.header}>
                  <h1 className={styles.title}>{pageCopy.title}</h1>
                  <p className={styles.description}>{pageCopy.description}</p>
                  {pageCopy.salesGuide ? (
                    <p className={styles.salesFilterGuide}>{pageCopy.salesGuide}</p>
                  ) : null}
                </div>
              ) : null}

              <div className={styles.menuScrollArea}>
                {currentView}
              </div>
            </main>

            <PosTodaySummary
              activeMenu={activeMenu}
              selectedTableOrderSummary={selectedTableOrderSummary}
              usingTableCount={usingTableCount}
              confirmedTableCount={confirmedTableCount}
              totalTableAmount={totalTableAmount}
              reservationSummary={reservationSummary}
              dailySummary={dailySummary}
              salesSummary={salesSummary}
              selectedSalesFilter={selectedSalesFilter}
              selectedSalesPayment={selectedSalesPayment}
              onSelectSalesFilter={setSelectedSalesFilter}
              onResetSelectedSalesPayment={() => setSelectedSalesPaymentId(null)}
              onResetSelectedTableSummary={() => setSelectedTableNoForOrderSummary(null)}
            />
          </div>
        </div>

        <PosFooterBar
          activeMenu={activeMenu}
          count={footerCount}
          amount={activeMenu === 'SALES_HISTORY' ? salesSummary.totalSalesAmount : totalTableAmount}
          selectedTableOrderSummary={selectedTableOrderSummary}
          onPrimaryAction={handlePrimaryFooterAction}
          onSecondaryAction={handleRevertSelectedTableOrderToWaiting}
        />
      </div>
    </div>
  )
}

export default function BusinessPosPage() {
  return (
    <Suspense fallback={<div>테이블 정보를 불러오는 중입니다.</div>}>
      <BusinessPosPageContent />
    </Suspense>
  )
}

// SECTION 04 : UTIL
type PosContentMenuKey = Exclude<PosMenuKey, 'COOKING'>

function isPosContentMenuKey(
  value: string | null
): value is PosContentMenuKey {
  return (
    value === 'TABLE' ||
    value === 'RESERVATION' ||
    value === 'DELIVERY' ||
    value === 'PICKUP' ||
    value === 'ORDER_HISTORY' ||
    value === 'SALES_HISTORY'
  )
}

function getPageCopy(
  activeMenu: PosContentMenuKey,
  selectedSalesFilter: SalesFilterType
) {
  if (activeMenu === 'TABLE') {
    return {
      title: 'POS 메인',
      description: '테이블을 선택하거나 매출내역을 확인합니다.',
      salesGuide: ''
    }
  }

  if (activeMenu === 'RESERVATION') {
    return {
      title: '예약주문',
      description: '예약된 주문을 확인합니다.',
      salesGuide: ''
    }
  }

  if (activeMenu === 'DELIVERY') {
    return {
      title: '배달주문',
      description: '배달 요청 주문을 확인합니다.',
      salesGuide: ''
    }
  }

  if (activeMenu === 'PICKUP') {
    return {
      title: '픽업주문',
      description: '픽업 / 포장 주문을 확인합니다.',
      salesGuide: ''
    }
  }

  if (activeMenu === 'ORDER_HISTORY') {
    return {
      title: '주문내역(1일)',
      description: '오늘 접수된 주문의 확정/대기 상태를 관리합니다.',
      salesGuide: ''
    }
  }

  return {
    title: '매출내역(1일)',
    description: '오늘 결제완료된 주문의 매출내역을 확인합니다.',
    salesGuide: getSalesFilterGuideText(selectedSalesFilter)
  }
}

function getSalesFilterGuideText(filter: SalesFilterType) {
  if (filter === 'CARD') {
    return '카드결제 매출내역을 표시합니다.'
  }

  if (filter === 'CASH') {
    return '현금결제 매출내역을 표시합니다.'
  }

  if (filter === 'QR') {
    return 'QR결제 매출내역을 표시합니다.'
  }

  if (filter === 'POINT') {
    return '포인트 적립 발생 주문을 표시합니다.'
  }

  return '전체 결제완료 매출을 표시합니다.'
}

function mapPosLocationsToTableItems(
  locationItems: PosTableSettingItem[],
  activeOrderSummaryByLocationId?: Map<
    number,
    {
      amount: number
      orderItems: Array<{
        name: string
        quantity: number
        optionSummary?: string
      }>
    }
  >,
  cookingStatusLabelByLocationId?: Map<number, string>
): PosTableItem[] {
  return locationItems
    .filter((item) => Number(item.isActive ?? 1) === 1)
    .map((item, index) => {
    const normalizedSortOrder =
      Number.isFinite(item.sortOrder) && item.sortOrder > 0
        ? item.sortOrder
        : index + 1

    const activeOrderSummary =
      activeOrderSummaryByLocationId?.get(item.id)

    const activeOrderAmount =
      activeOrderSummary?.amount ?? 0
    const resourceStatus =
      normalizeTableResourceStatus(item.resourceStatus)
    const tableStatus =
      toTableCardStatus(resourceStatus, activeOrderAmount)

    return {
      locationId: item.id,
      tableNo: normalizedSortOrder,
      label: item.tableName?.trim() || `테이블 ${normalizedSortOrder}`,
      amount: activeOrderAmount,
      resourceStatus,
      status: tableStatus,
      cookingStatusLabel:
        shouldShowCookingStatusLabel(resourceStatus)
          ? cookingStatusLabelByLocationId?.get(item.id)
          : undefined,
      paymentStatusLabel: activeOrderAmount > 0 ? '미결제' : '결제완료',
      orderItems: activeOrderSummary?.orderItems ?? [],
      memo: item.zoneName?.trim() || ''
    }
  })
}

function normalizeTableResourceStatus(
  value: string | null | undefined
): PosTableResourceStatus {
  const normalized =
    String(value ?? '').trim().toUpperCase()

  if (
    normalized === 'AVAILABLE' ||
    normalized === 'RESERVED' ||
    normalized === 'IN_USE' ||
    normalized === 'MAINTENANCE' ||
    normalized === 'CHECKOUT_PENDING' ||
    normalized === 'CLEANING' ||
    normalized === 'CLEAN_DONE'
  ) {
    return normalized
  }

  return 'AVAILABLE'
}

function toTableCardStatus(
  resourceStatus: PosTableResourceStatus,
  activeOrderAmount: number
): PosTableItem['status'] {
  if (resourceStatus === 'CHECKOUT_PENDING') {
    return 'CLEANING'
  }

  if (resourceStatus === 'CLEANING') {
    return 'CLEANING'
  }

  if (resourceStatus === 'CLEAN_DONE') {
    return 'CLEAN_DONE'
  }

  if (resourceStatus === 'IN_USE' || activeOrderAmount > 0) {
    return 'USING'
  }

  return 'EMPTY'
}

function getNextCleaningResourceStatus(
  status: PosTableItem['status']
): PosTableResourceStatus | null {
  if (status === 'CHECKOUT_PENDING') {
    return 'AVAILABLE'
  }

  if (status === 'CLEANING') {
    return 'AVAILABLE'
  }

  if (status === 'CLEAN_DONE') {
    return 'AVAILABLE'
  }

  return null
}

function shouldShowCookingStatusLabel(
  resourceStatus: PosTableResourceStatus
): boolean {
  return resourceStatus === 'IN_USE'
}

function isTableOrderEntryBlocked(
  table: PosTableItem
): boolean {
  return (
    table.status === 'CLEANING' ||
    table.status === 'CHECKOUT_PENDING' ||
    table.resourceStatus === 'CLEANING' ||
    table.resourceStatus === 'CHECKOUT_PENDING'
  )
}
