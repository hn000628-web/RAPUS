'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import styles from '../DeliveryOrdersPage.module.css'

import { usePosKeyboardMode } from '../../components/PosKeyboardModeContext'
import PosTopbar from '../../components/PosTopbar'

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
  READY: '대기중',
  PICKED_UP: '픽업완료',
  DELIVERED: '완료',
  CANCELLED: '취소'
}

const STATUS_FILTERS: Array<{ key: DeliveryOrderStatus; label: string }> = [
  { key: 'ALL', label: '전체' },
  { key: 'RECEIVED', label: '접수대기' },
  { key: 'ACCEPTED', label: '접수완료' },
  { key: 'COOKING', label: '조리중' },
  { key: 'READY', label: '대기중' },
  { key: 'PICKED_UP', label: '픽업완료' },
  { key: 'DELIVERED', label: '완료' },
  { key: 'CANCELLED', label: '취소' }
]

const DELIVERY_ORDERS: DeliveryOrder[] = [
  {
    id: 'delivery-order-001',
    orderNo: 'D-2401',
    customerName: '김민지',
    customerPhone: '010-1234-1111',
    type: 'DELIVERY',
    status: 'RECEIVED',
    paymentStatus: 'WAITING',
    address: '서울시 강남구 테헤란로 12',
    requestedAt: '18:05',
    promisedAt: '18:35',
    menuSummary: '김치찌개 2개 / 공기밥 2개',
    amount: '24,000원',
    memo: '배달 전 전화 요청'
  },
  {
    id: 'delivery-order-002',
    orderNo: 'D-2402',
    customerName: '이서준',
    customerPhone: '010-2233-4444',
    type: 'PICKUP',
    status: 'COOKING',
    paymentStatus: 'PAID',
    address: '가게 픽업',
    requestedAt: '18:18',
    promisedAt: '18:45',
    menuSummary: '제육덮밥 1개 / 콜라 1개',
    amount: '18,000원',
    memo: '픽업 준비 중'
  },
  {
    id: 'delivery-order-003',
    orderNo: 'D-2403',
    customerName: '박하늘',
    customerPhone: '010-7788-5555',
    type: 'RESERVATION',
    status: 'READY',
    paymentStatus: 'WAITING',
    address: '예약 주문',
    requestedAt: '18:24',
    promisedAt: '18:55',
    menuSummary: '감자탕 중 1개 / 볶음밥 2개',
    amount: '32,000원',
    memo: '예약 확인 완료'
  },
  {
    id: 'delivery-order-004',
    orderNo: 'D-2404',
    customerName: '최유진',
    customerPhone: '010-5566-7788',
    type: 'DELIVERY',
    status: 'PICKED_UP',
    paymentStatus: 'PAID',
    address: '서울시 송파구 올림픽로 10',
    requestedAt: '18:30',
    promisedAt: '19:00',
    menuSummary: '돈까스 정식 2개',
    amount: '28,000원',
    memo: '배달 출발 완료'
  },
  {
    id: 'delivery-order-005',
    orderNo: 'D-2405',
    customerName: '정지우',
    customerPhone: '010-3344-8899',
    type: 'PICKUP',
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    address: '가게 픽업',
    requestedAt: '18:40',
    promisedAt: '19:05',
    menuSummary: '부대찌개 1개 / 라면사리 1개',
    amount: '22,000원',
    memo: '픽업 완료'
  }
]

const getStatusLabel = (order: DeliveryOrder) => {
  if (order.status === 'READY') {
    if (order.type === 'DELIVERY') {
      return '배송대기'
    }

    if (order.type === 'PICKUP') {
      return '픽업대기'
    }

    return '예약대기'
  }

  return ORDER_STATUS_LABEL[order.status]
}

const getPrimaryActionLabel = (order: DeliveryOrder) => {
  if (order.type === 'DELIVERY') {
    return '배송대기'
  }

  if (order.type === 'PICKUP') {
    return '픽업대기'
  }

  return '예약대기'
}

const getPrimaryActionStatus = () => 'READY' as const

const formatBillMenuItem = (value: string) => {
  return value
    .trim()
    .replace(/\s+(\d+)개/g, ' x$1')
}

const splitBillMenuItems = (menuSummary: string) => {
  return menuSummary
    .split('/')
    .map((item) => formatBillMenuItem(item))
    .filter(Boolean)
}

export default function DeliveryOrdersListPage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()

  const [orders, setOrders] = useState<DeliveryOrder[]>(DELIVERY_ORDERS)
  const [selectedStatus, setSelectedStatus] = useState<DeliveryOrderStatus>('ALL')
  const [selectedOrderId, setSelectedOrderId] = useState<string>(DELIVERY_ORDERS[0]?.id ?? '')

  const filteredOrders = useMemo(() => {
    if (selectedStatus === 'ALL') {
      return orders
    }

    return orders.filter((order) => order.status === selectedStatus)
  }, [orders, selectedStatus])

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0]
  }, [filteredOrders, orders, selectedOrderId])

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleGoPosHome = () => {
    router.push('/pos')
  }

  const handleOpenPosSettings = () => {
    router.push('/pos/settings')
  }

  const handleSelectStatus = (status: DeliveryOrderStatus) => {
    setSelectedStatus(status)

    const nextOrder = status === 'ALL'
      ? orders[0]
      : orders.find((order) => order.status === status)

    setSelectedOrderId(nextOrder?.id ?? '')
  }

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
  }

  const handleChangeOrderStatus = (orderId: string, nextStatus: Exclude<DeliveryOrderStatus, 'ALL'>) => {
    setOrders((prev) => prev.map((order) => {
      if (order.id !== orderId) {
        return order
      }

      return {
        ...order,
        status: nextStatus
      }
    }))
    setSelectedOrderId(orderId)
  }

  const activeDeliveryMenu: DeliverySidebarKey = 'ORDER_LIST'

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

  const FilterUI = (
    <section className={styles.filterPanel} aria-label="딜리버리 오더 상태 필터">
      {STATUS_FILTERS.map((filter) => {
        const isActive = selectedStatus === filter.key

        return (
          <button
            key={filter.key}
            type="button"
            className={isActive ? styles.filterButtonActive : styles.filterButton}
            onClick={() => handleSelectStatus(filter.key)}
          >
            {filter.label}
          </button>
        )
      })}
    </section>
  )

  const OrderListUI = (
    <section className={styles.orderListPanel} aria-label="딜리버리 주문 목록">
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>딜리버리 주문 목록</h2>
          <p className={styles.sectionDescription}>
            현재 접수된 배달 / 포장 / 예약 주문을 목록 단위로 관리합니다.
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
            <article
              key={order.id}
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
                <span className={styles.statusBadge}>{getStatusLabel(order)}</span>
                <span className={styles.amount}>{order.amount}</span>
              </div>

              <div className={styles.orderCardActions}>
                <button
                  type="button"
                  className={styles.orderActionButton}
                  onClick={(event) => {
                    event.stopPropagation()
                    handleSelectOrder(order.id)
                  }}
                >
                  상세보기
                </button>

                <button
                  type="button"
                  className={styles.orderActionButtonPrimary}
                  onClick={(event) => {
                    event.stopPropagation()
                    handleChangeOrderStatus(order.id, 'COOKING')
                  }}
                >
                  조리중
                </button>

                <button
                  type="button"
                  className={styles.orderActionButtonSecondary}
                  onClick={(event) => {
                    event.stopPropagation()
                    handleChangeOrderStatus(order.id, getPrimaryActionStatus())
                  }}
                >
                  {getPrimaryActionLabel(order)}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )

  const billMenuItems = selectedOrder ? splitBillMenuItems(selectedOrder.menuSummary) : []

  const OrderDetailUI = selectedOrder ? (
    <aside className={styles.detailPanel} aria-label="딜리버리 주문 상세">
      <div className={styles.detailCard}>
        <div className={styles.billHeader}>
          <div className={styles.billTitleRow}>
            <strong className={styles.billOrderId}>{selectedOrder.orderNo}</strong>
            <span className={styles.billStatusBadge}>{getStatusLabel(selectedOrder)}</span>
          </div>

          <div className={styles.billMetaRow}>
            <div className={styles.billMetaItem}>
              <span className={styles.billMetaLabel}>주문유형</span>
              <strong className={styles.billMetaValue}>{ORDER_TYPE_LABEL[selectedOrder.type]}</strong>
            </div>

            <div className={styles.billMetaItem}>
              <span className={styles.billMetaLabel}>접수시간</span>
              <strong className={styles.billMetaValue}>{selectedOrder.requestedAt}</strong>
            </div>

            <div className={styles.billMetaItem}>
              <span className={styles.billMetaLabel}>예상완료</span>
              <strong className={styles.billMetaValue}>{selectedOrder.promisedAt}</strong>
            </div>

            <div className={styles.billMetaItem}>
              <span className={styles.billMetaLabel}>결제상태</span>
              <strong className={styles.billMetaValue}>
                {PAYMENT_STATUS_LABEL[selectedOrder.paymentStatus]}
              </strong>
            </div>
          </div>
        </div>

        <section className={styles.billSection}>
          <h3 className={styles.billSectionTitle}>주문 정보</h3>

          <div className={styles.billInfoRow}>
            <span className={styles.detailLabel}>주문유형</span>
            <strong className={styles.detailValue}>{ORDER_TYPE_LABEL[selectedOrder.type]}</strong>
          </div>

          <div className={styles.billInfoRow}>
            <span className={styles.detailLabel}>접수시간</span>
            <strong className={styles.detailValue}>{selectedOrder.requestedAt}</strong>
          </div>

          <div className={styles.billInfoRow}>
            <span className={styles.detailLabel}>예상완료</span>
            <strong className={styles.detailValue}>{selectedOrder.promisedAt}</strong>
          </div>

          <div className={styles.billInfoRow}>
            <span className={styles.detailLabel}>결제상태</span>
            <strong className={styles.detailValue}>{PAYMENT_STATUS_LABEL[selectedOrder.paymentStatus]}</strong>
          </div>
        </section>

        <section className={styles.billSection}>
          <h3 className={styles.billSectionTitle}>고객 정보</h3>

          <div className={styles.billInfoRow}>
            <span className={styles.detailLabel}>고객</span>
            <strong className={styles.detailValue}>
              {selectedOrder.customerName} / {selectedOrder.customerPhone}
            </strong>
          </div>
        </section>

        <section className={styles.billSection}>
          <h3 className={styles.billSectionTitle}>배송지 / 요청사항</h3>

          <div className={styles.billInfoRow}>
            <span className={styles.detailLabel}>주소</span>
            <strong className={styles.detailValue}>{selectedOrder.address}</strong>
          </div>

          <div className={styles.billInfoRow}>
            <span className={styles.detailLabel}>요청사항</span>
            <strong className={styles.detailValue}>
              {selectedOrder.memo || "요청사항 없음"}
            </strong>
          </div>
        </section>

        <section className={styles.billSection}>
          <h3 className={styles.billSectionTitle}>주문내역</h3>

          <div className={styles.billMenuList}>
            {billMenuItems.map((menuItem, index) => (
              <div className={styles.billMenuItem} key={`${selectedOrder.id}-menu-${index}`}>
                <span>{menuItem}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.billSection}>
          <h3 className={styles.billSectionTitle}>옵션</h3>

          <div className={styles.billInfoRow}>
            <span className={styles.detailLabel}>옵션</span>
            <strong className={styles.detailValue}>별도 옵션 없음</strong>
          </div>
        </section>

        <section className={styles.billSection}>
          <h3 className={styles.billSectionTitle}>결제금액</h3>

          <div className={styles.billTotalRow}>
            <span>합계</span>
            <strong>{selectedOrder.amount}</strong>
          </div>
        </section>

        <section className={styles.billSection}>
          <h3 className={styles.billSectionTitle}>처리 버튼</h3>

          <div className={styles.billActionGroup}>
            <button type="button" className={styles.billSecondaryButton} onClick={() => window.print()}>
              인쇄
            </button>

            <button
              type="button"
              className={styles.billPrimaryButton}
              onClick={() => handleChangeOrderStatus(selectedOrder.id, "COOKING")}
            >
              조리중
            </button>

            <button
              type="button"
              className={styles.billSecondaryButton}
              onClick={() => handleChangeOrderStatus(selectedOrder.id, getPrimaryActionStatus())}
            >
              {selectedOrder.type === "DELIVERY"
                ? "배송대기"
                : selectedOrder.type === "PICKUP"
                  ? "픽업대기"
                  : "예약대기"}
            </button>
          </div>
        </section>
      </div>
    </aside>
  ) : (
    <aside className={styles.detailPanel} aria-label="딜리버리 주문 상세 없음">
      <div className={styles.emptyState}>
        선택 가능한 주문이 없습니다.
      </div>
    </aside>
  )

  return (
    <div className={styles.page}>
      <div className={styles.posShell}>
        <div className={styles.topbarWrap}>
          <div className={styles.topbarInner}>
            <PosTopbar
              title="딜리버리 주문 목록"
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
              <header className={styles.pageHeader}>
                <div>
                  <h1 className={styles.pageTitle}>딜리버리 주문 목록</h1>
                  <p className={styles.pageDescription}>
                    현재 접수된 배달 / 포장 / 예약 주문을 목록 단위로 관리합니다.
                  </p>
                </div>

                <button
                  type="button"
                  className={styles.backButton}
                  onClick={handleGoPosHome}
                >
                  POS 홈
                </button>
              </header>

              {FilterUI}

              <div className={styles.contentLayout}>
                {OrderListUI}
                {OrderDetailUI}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
