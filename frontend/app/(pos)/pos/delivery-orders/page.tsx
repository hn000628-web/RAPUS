// FILE : frontend/app/(pos)/pos/delivery-orders/page.tsx
// ROOT : frontend/app/(pos)/pos/delivery-orders/page.tsx

'use client'

// SECTION 01 : IMPORT
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import styles from './DeliveryOrdersPage.module.css'

import { usePosKeyboardMode } from '../components/PosKeyboardModeContext'
import PosTopbar from '../components/PosTopbar'

// SECTION 02 : TYPE
type DeliveryOrderStatus =
  | 'ALL'
  | 'RECEIVED'
  | 'ACCEPTED'
  | 'COOKING'
  | 'READY'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED'

type DeliveryOrderType = 'DELIVERY' | 'PICKUP' | 'RESERVATION'

type DeliveryOrderPaymentStatus = 'PAID' | 'WAITING' | 'CANCELLED'

type DeliveryOrder = {
  id: string
  orderNo: string
  customerName: string
  customerPhone: string
  type: DeliveryOrderType
  status: Exclude<DeliveryOrderStatus, 'ALL'>
  paymentStatus: DeliveryOrderPaymentStatus
  address: string
  requestedAt: string
  promisedAt: string
  menuSummary: string
  amount: string
  memo?: string
}



// SECTION 03 : CONSTANT

const DELIVERY_ORDERS: DeliveryOrder[] = [
  {
    id: 'delivery-order-001',
    orderNo: 'DO-2401',
    customerName: '김민수',
    customerPhone: '010-1234-5678',
    type: 'DELIVERY',
    status: 'RECEIVED',
    paymentStatus: 'PAID',
    address: '광주 서구 풍암동 101-3',
    requestedAt: '12:08',
    promisedAt: '12:45',
    menuSummary: '김치찌개 2개 / 공기밥 2개',
    amount: '24,000원',
    memo: '문 앞에 두고 문자 주세요.'
  },
  {
    id: 'delivery-order-002',
    orderNo: 'DO-2402',
    customerName: '이서연',
    customerPhone: '010-2222-8899',
    type: 'PICKUP',
    status: 'ACCEPTED',
    paymentStatus: 'WAITING',
    address: '매장 방문 포장',
    requestedAt: '12:12',
    promisedAt: '12:35',
    menuSummary: '제육덮밥 1개 / 콜라 1개',
    amount: '12,500원'
  },
  {
    id: 'delivery-order-003',
    orderNo: 'DO-2403',
    customerName: '박지훈',
    customerPhone: '010-3333-4444',
    type: 'DELIVERY',
    status: 'COOKING',
    paymentStatus: 'PAID',
    address: '광주 남구 봉선동 55-8',
    requestedAt: '12:16',
    promisedAt: '12:55',
    menuSummary: '감자탕 중 1개 / 볶음밥 2개',
    amount: '39,000원',
    memo: '수저 필요'
  },
  {
    id: 'delivery-order-004',
    orderNo: 'DO-2404',
    customerName: '최하늘',
    customerPhone: '010-5555-7777',
    type: 'DELIVERY',
    status: 'READY',
    paymentStatus: 'PAID',
    address: '광주 서구 금호동 21-7',
    requestedAt: '12:20',
    promisedAt: '12:50',
    menuSummary: '돈까스 정식 2개',
    amount: '26,000원'
  },
  {
    id: 'delivery-order-005',
    orderNo: 'DO-2405',
    customerName: '정유진',
    customerPhone: '010-8888-1111',
    type: 'DELIVERY',
    status: 'PICKED_UP',
    paymentStatus: 'PAID',
    address: '광주 서구 화정동 88-2',
    requestedAt: '12:25',
    promisedAt: '13:05',
    menuSummary: '부대찌개 1개 / 라면사리 1개',
    amount: '21,000원'
  },
  {
    id: 'delivery-order-006',
    orderNo: 'DO-2406',
    customerName: '오현우',
    customerPhone: '010-9999-3131',
    type: 'RESERVATION',
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    address: '13:30 예약 배달',
    requestedAt: '11:30',
    promisedAt: '13:30',
    menuSummary: '단체 도시락 8개',
    amount: '72,000원'
  }
]

type DeliveryOrderSummaryKey =
  | 'TOTAL'
  | 'WAITING'
  | 'COOKING'
  | 'PICKUP_WAITING'
  | 'DELIVERING'
  | 'DELIVERED'

type DeliveryOrderSummaryItem = {
  key: DeliveryOrderSummaryKey
  label: string
  count: number
}

const buildDeliveryOrderSummaryItems = (orders: DeliveryOrder[]): DeliveryOrderSummaryItem[] => {
  const summaryMap: Record<DeliveryOrderSummaryKey, number> = {
    TOTAL: orders.length,
    WAITING: 0,
    COOKING: 0,
    PICKUP_WAITING: 0,
    DELIVERING: 0,
    DELIVERED: 0
  }

  orders.forEach((order) => {
    if (order.status === 'RECEIVED' || order.status === 'ACCEPTED') {
      summaryMap.WAITING += 1
      return
    }

    if (order.status === 'COOKING') {
      summaryMap.COOKING += 1
      return
    }

    if (order.status === 'READY') {
      summaryMap.PICKUP_WAITING += 1
      return
    }

    if (order.status === 'PICKED_UP') {
      summaryMap.DELIVERING += 1
      return
    }

    if (order.status === 'DELIVERED') {
      summaryMap.DELIVERED += 1
    }
  })

  return [
    { key: 'TOTAL', label: '전체', count: summaryMap.TOTAL },
    { key: 'WAITING', label: '접수대기', count: summaryMap.WAITING },
    { key: 'COOKING', label: '조리중', count: summaryMap.COOKING },
    { key: 'PICKUP_WAITING', label: '픽업대기', count: summaryMap.PICKUP_WAITING },
    { key: 'DELIVERING', label: '배달중', count: summaryMap.DELIVERING },
    { key: 'DELIVERED', label: '배달완료', count: summaryMap.DELIVERED }
  ]
}


const ORDER_TYPE_LABEL: Record<DeliveryOrderType, string> = {
  DELIVERY: '배달',
  PICKUP: '포장',
  RESERVATION: '예약'
}

const PAYMENT_STATUS_LABEL: Record<DeliveryOrderPaymentStatus, string> = {
  PAID: '결제완료',
  WAITING: '결제대기',
  CANCELLED: '결제취소'
}

const ORDER_STATUS_LABEL: Record<Exclude<DeliveryOrderStatus, 'ALL'>, string> = {
  RECEIVED: '접수대기',
  ACCEPTED: '접수완료',
  COOKING: '조리중',
  READY: '픽업대기',
  PICKED_UP: '배달중',
  DELIVERED: '완료',
  CANCELLED: '취소'
}

type DeliverySidebarKey = 'ORDER_HISTORY' | 'ORDER_LIST' | 'RESERVATION' | 'SALES_HISTORY'

type DeliverySidebarItem = {
  key: DeliverySidebarKey
  label: string
  href?: string
  disabled?: boolean
}

const DELIVERY_SIDEBAR_ITEMS: DeliverySidebarItem[] = [
  {
    key: 'ORDER_HISTORY',
    label: '주문현황',
    href: '/pos/delivery-orders'
  },
  {
    key: 'ORDER_LIST',
    label: '주문목록',
    href: '/pos/delivery-orders/orders'
  },
  {
    key: 'RESERVATION',
    label: '예약현황',
    href: '/pos/delivery-orders/reservations'
  },
  {
    key: 'SALES_HISTORY',
    label: '매출현황',
    href: '/pos/delivery-orders/stay-sales'
  }
]

// SECTION 04 : PAGE
export default function DeliveryOrdersPage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const [selectedOrderId, setSelectedOrderId] = useState<string>(DELIVERY_ORDERS[0]?.id ?? '')

  // SECTION 05 : MEMO
  const filteredOrders = useMemo(() => DELIVERY_ORDERS, [])

  const selectedOrder = useMemo(() => {
    return DELIVERY_ORDERS.find((order) => order.id === selectedOrderId) ?? filteredOrders[0]
  }, [filteredOrders, selectedOrderId])

  const activeDeliveryMenu: DeliverySidebarKey = 'ORDER_HISTORY'

  // SECTION 06 : EVENT FUNCTION
  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleGoPosHome = () => {
    router.push('/pos')
  }

  const handleOpenPosSettings = () => {
    router.push('/pos/settings')
  }


  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
  }

  const summaryItems = useMemo(() => buildDeliveryOrderSummaryItems(DELIVERY_ORDERS), [])

  // SECTION 07 : UI BLOCK
  const DeliverySidebarUI = (
    <aside className={styles.deliverySidebar} aria-label="딜리버리 오더 전용 메뉴">
      <div className={styles.deliverySidebarBox}>
        <nav className={styles.deliverySidebarMenu} aria-label="딜리버리 오더 전용 사이드바">
          {DELIVERY_SIDEBAR_ITEMS.map((item) => {
            const isActive = item.key === activeDeliveryMenu

            return (
              <button
                key={item.key}
                type="button"
                className={isActive ? styles.deliverySidebarButtonActive : styles.deliverySidebarButton}
                aria-current={isActive ? 'page' : undefined}
                aria-disabled={item.disabled ? 'true' : undefined}
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled || !item.href) {
                    return
                  }

                  router.push(item.href)
                }}
              >
                <span className={styles.deliverySidebarButtonRow}>
                  <span>{item.label}</span>
                  {item.disabled ? (
                    <span className={styles.deliverySidebarBadge}>준비중</span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )


  const OrderListUI = (
    <section className={styles.orderListPanel} aria-label="딜리버리 오더 목록">
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>딜리버리 오더 목록</h2>
          <p className={styles.sectionDescription}>
            배달 / 포장 / 예약 주문을 오더 카드 단위로 관리합니다.
          </p>
        </div>

        <strong className={styles.orderCount}>
          {filteredOrders.length}건
        </strong>
      </div>

      <div className={styles.orderList}>
        {filteredOrders.map((order) => {
          const isSelected = selectedOrder?.id === order.id

          return (
            <button
              key={order.id}
              type="button"
              className={isSelected ? styles.orderCardSelected : styles.orderCard}
              onClick={() => handleSelectOrder(order.id)}
            >
              <div className={styles.orderCardTop}>
                <strong className={styles.orderNo}>{order.orderNo}</strong>
                <span className={styles.orderType}>{ORDER_TYPE_LABEL[order.type]}</span>
              </div>

              <div className={styles.orderCardMain}>
                <span className={styles.customerName}>{order.customerName}</span>
                <span className={styles.menuSummary}>{order.menuSummary}</span>
              </div>

              <div className={styles.orderCardBottom}>
                <span className={styles.statusBadge}>{ORDER_STATUS_LABEL[order.status]}</span>
                <span className={styles.amount}>{order.amount}</span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )

  const OrderDetailUI = selectedOrder ? (
    <aside className={styles.detailPanel} aria-label="딜리버리 오더 상세">
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>오더 상세</h2>
          <p className={styles.sectionDescription}>
            선택한 딜리버리 오더의 처리 상태를 확인합니다.
          </p>
        </div>
      </div>

      <div className={styles.detailCard}>
        <div className={styles.detailTop}>
          <strong className={styles.detailOrderNo}>{selectedOrder.orderNo}</strong>
          <span className={styles.statusBadgeLarge}>
            {ORDER_STATUS_LABEL[selectedOrder.status]}
          </span>
        </div>

        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>주문유형</span>
            <strong className={styles.detailValue}>{ORDER_TYPE_LABEL[selectedOrder.type]}</strong>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>결제상태</span>
            <strong className={styles.detailValue}>
              {PAYMENT_STATUS_LABEL[selectedOrder.paymentStatus]}
            </strong>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>접수시간</span>
            <strong className={styles.detailValue}>{selectedOrder.requestedAt}</strong>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>예상완료</span>
            <strong className={styles.detailValue}>{selectedOrder.promisedAt}</strong>
          </div>
        </div>

        <div className={styles.detailBlock}>
          <span className={styles.detailLabel}>고객</span>
          <strong className={styles.detailValue}>
            {selectedOrder.customerName} / {selectedOrder.customerPhone}
          </strong>
        </div>

        <div className={styles.detailBlock}>
          <span className={styles.detailLabel}>주소 / 수령 방식</span>
          <strong className={styles.detailValue}>{selectedOrder.address}</strong>
        </div>

        <div className={styles.detailBlock}>
          <span className={styles.detailLabel}>주문 메뉴</span>
          <strong className={styles.detailValue}>{selectedOrder.menuSummary}</strong>
        </div>

        <div className={styles.detailBlock}>
          <span className={styles.detailLabel}>결제금액</span>
          <strong className={styles.detailAmount}>{selectedOrder.amount}</strong>
        </div>

        {selectedOrder.memo ? (
          <div className={styles.memoBox}>
            <span className={styles.detailLabel}>요청사항</span>
            <p>{selectedOrder.memo}</p>
          </div>
        ) : null}

        <div className={styles.actionGrid}>
          <button type="button" className={styles.primaryAction}>
            접수완료
          </button>
          <button type="button" className={styles.secondaryAction}>
            조리시작
          </button>
          <button type="button" className={styles.secondaryAction}>
            픽업대기
          </button>
          <button type="button" className={styles.secondaryAction}>
            배달완료
          </button>
        </div>
      </div>
    </aside>
  ) : (
    <aside className={styles.detailPanel} aria-label="딜리버리 오더 상세 없음">
      <div className={styles.emptyState}>
        선택 가능한 오더가 없습니다.
      </div>
    </aside>
  )


  // SECTION 08 : RETURN
  return (
    <div className={styles.page}>
      <div className={styles.posShell}>
        <div className={styles.topbarWrap}>
          <div className={styles.topbarInner}>
            <PosTopbar
              title="딜리버리 주문현황"
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

        <main className={styles.main}>
          <div className={styles.workspaceLayout}>
            {DeliverySidebarUI}

            <div className={styles.workspaceContent}>
              <header className={styles.dashboardHeader}>
                <div>
                  <h1 className={styles.pageTitle}>딜리버리 주문현황</h1>
                  <p className={styles.pageDescription}>
                    오늘 접수된 배달 / 포장 / 예약 주문의 상태를 확인합니다.
                  </p>
                </div>

                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => router.push('/pos/delivery-orders/orders')}
                >
                  주문목록 보기
                </button>
              </header>

              <section className={styles.summaryGrid} aria-label="금일 주문 현황 요약">
                {summaryItems.map((item) => (
                  <article key={item.key} className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>{item.label}</span>
                    <strong className={styles.summaryCount}>{item.count}</strong>
                    <span className={styles.summaryUnit}>건</span>
                  </article>
                ))}
              </section>

              <section className={styles.dashboardNotice} aria-label="주문 안내">
                <div>
                  <h2 className={styles.sectionTitle}>주문 안내</h2>
                  <p className={styles.sectionDescription}>
                    주문 처리는 [주문목록]에서 진행합니다.
                  </p>
                </div>

                <div className={styles.dashboardActionRow}>
                  <button
                    type="button"
                    className={styles.orderListMoveButton}
                    onClick={() => router.push('/pos/delivery-orders/orders')}
                  >
                    주문목록으로 이동
                  </button>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
