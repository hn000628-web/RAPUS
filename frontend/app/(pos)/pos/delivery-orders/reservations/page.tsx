'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { usePosKeyboardMode } from '../../components/PosKeyboardModeContext'
import PosTopbar from '../../components/PosTopbar'

import styles from './DeliveryOrderReservationsPage.module.css'

type ReservationOrderType = 'DELIVERY' | 'PICKUP'
type ReservationOrderStatus = 'RECEIVED' | 'RESERVING' | 'COMPLETED'
type ReservationFilter = 'ALL' | ReservationOrderType

type ReservationOrder = {
  id: string
  reservationNo: string
  orderName: string
  orderType: ReservationOrderType
  paymentAmount: number
  reservationTime: string
  status: ReservationOrderStatus
  summary: string
  memo: string
}

type ReservationSidebarKey = 'ORDER_HISTORY' | 'ORDER_LIST' | 'RESERVATION' | 'SALES_HISTORY'

type ReservationSidebarItem = {
  key: ReservationSidebarKey
  label: string
  href?: string
  disabled?: boolean
}

type ReservationStatusSummary = {
  totalCount: number
  receivedCount: number
  reservingCount: number
  completedCount: number
}

const RESERVATION_SIDEBAR_ITEMS: ReservationSidebarItem[] = [
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

const RESERVATION_FILTERS: Array<{ key: ReservationFilter; label: string }> = [
  {
    key: 'ALL',
    label: '전체'
  },
  {
    key: 'DELIVERY',
    label: '배달주문'
  },
  {
    key: 'PICKUP',
    label: '픽업주문'
  }
]

const RESERVATION_ORDERS: ReservationOrder[] = [
  {
    id: 'reservation-order-001',
    reservationNo: 'DR-2401',
    orderName: '도시락 예약',
    orderType: 'DELIVERY',
    paymentAmount: 28000,
    reservationTime: '18:20',
    status: 'RECEIVED',
    summary: '도시락 세트 1건',
    memo: '배달 주소 확인 필요'
  },
  {
    id: 'reservation-order-002',
    reservationNo: 'DR-2402',
    orderName: '김밥세트 예약',
    orderType: 'PICKUP',
    paymentAmount: 16000,
    reservationTime: '18:30',
    status: 'RESERVING',
    summary: '김밥세트 외 2건',
    memo: '픽업 준비 완료 예정'
  },
  {
    id: 'reservation-order-003',
    reservationNo: 'DR-2403',
    orderName: '치킨 세트 예약',
    orderType: 'DELIVERY',
    paymentAmount: 42000,
    reservationTime: '19:00',
    status: 'COMPLETED',
    summary: '치킨 세트 외 2건',
    memo: '결제 완료'
  },
  {
    id: 'reservation-order-004',
    reservationNo: 'DR-2404',
    orderName: '샌드위치 예약',
    orderType: 'PICKUP',
    paymentAmount: 22000,
    reservationTime: '19:15',
    status: 'RESERVING',
    summary: '샌드위치 2개',
    memo: '예약 고객 도착 알림 예정'
  },
  {
    id: 'reservation-order-005',
    reservationNo: 'DR-2405',
    orderName: '야식 주문 예약',
    orderType: 'DELIVERY',
    paymentAmount: 35000,
    reservationTime: '20:10',
    status: 'RECEIVED',
    summary: '야식 세트 외 1건',
    memo: '전화 확인 완료'
  },
  {
    id: 'reservation-order-006',
    reservationNo: 'DR-2406',
    orderName: '간편식 픽업 예약',
    orderType: 'PICKUP',
    paymentAmount: 19000,
    reservationTime: '20:30',
    status: 'COMPLETED',
    summary: '간편식 1건',
    memo: '픽업 완료'
  }
]

const formatCurrency = (value: number) => `${value.toLocaleString('ko-KR')}원`

const getReservationStatusLabel = (status: ReservationOrderStatus) => {
  if (status === 'RECEIVED') {
    return '접수'
  }

  if (status === 'RESERVING') {
    return '예약중'
  }

  return '완료'
}

const getReservationTypeLabel = (type: ReservationOrderType) => {
  if (type === 'DELIVERY') {
    return '배달주문'
  }

  return '픽업주문'
}

const buildStatusSummary = (orders: ReservationOrder[]): ReservationStatusSummary => {
  return orders.reduce<ReservationStatusSummary>(
    (acc, item) => {
      acc.totalCount += 1

      if (item.status === 'RECEIVED') {
        acc.receivedCount += 1
      }

      if (item.status === 'RESERVING') {
        acc.reservingCount += 1
      }

      if (item.status === 'COMPLETED') {
        acc.completedCount += 1
      }

      return acc
    },
    {
      totalCount: 0,
      receivedCount: 0,
      reservingCount: 0,
      completedCount: 0
    }
  )
}

export default function DeliveryOrderReservationsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()

  const [selectedFilter, setSelectedFilter] = useState<ReservationFilter>('ALL')
  const [selectedReservationId, setSelectedReservationId] = useState<string>('')

  const filteredReservations = useMemo(() => {
    if (selectedFilter === 'ALL') {
      return RESERVATION_ORDERS
    }

    return RESERVATION_ORDERS.filter((item) => item.orderType === selectedFilter)
  }, [selectedFilter])

  const selectedReservation = useMemo(() => {
    if (!selectedReservationId) {
      return undefined
    }

    return RESERVATION_ORDERS.find((item) => item.id === selectedReservationId)
  }, [selectedReservationId])

  const summary = useMemo(() => buildStatusSummary(filteredReservations), [filteredReservations])

  const activeMenu: ReservationSidebarKey = pathname === '/pos/delivery-orders/reservations'
    ? 'RESERVATION'
    : 'ORDER_HISTORY'

  const handleGoPosHome = () => {
    router.push('/pos')
  }

  const handleOpenPosSettings = () => {
    router.push('/pos/settings')
  }

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleSelectReservation = (reservationId: string) => {
    setSelectedReservationId(reservationId)
  }

  const handleChangeFilter = (filter: ReservationFilter) => {
    setSelectedFilter(filter)
    setSelectedReservationId('')
  }

  const DeliverySidebarUI = (
    <aside className={styles.deliverySidebar} aria-label="딜리버리 전용 메뉴">
      <div className={styles.deliverySidebarBox}>
        <nav className={styles.deliverySidebarMenu} aria-label="딜리버리 전용 사이드바">
          {RESERVATION_SIDEBAR_ITEMS.map((item) => {
            const isActive = item.key === activeMenu

            return (
              <button
                key={item.key}
                type="button"
                className={isActive ? styles.deliverySidebarButtonActive : styles.deliverySidebarButton}
                aria-current={isActive ? 'page' : undefined}
                aria-disabled={item.disabled ? 'true' : undefined}
                disabled={item.disabled}
                onClick={() => {
                  if (!item.href) {
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

  const ReservationPanelUI = (
    <section className={styles.reservationPanel} aria-label="예약 주문 목록">
      <div className={styles.panelHeader}>
        <div>
          <h1 className={styles.pageTitle}>예약 주문</h1>
          <p className={styles.pageDescription}>
            예약 주문 상태와 예약 완료 여부를 확인합니다.
          </p>
        </div>

        <strong className={styles.reservationCount}>{filteredReservations.length}건</strong>
      </div>

      <div className={styles.statusGrid}>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>전체 주문</span>
          <strong className={styles.statusValue}>{summary.totalCount}건</strong>
        </div>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>접수</span>
          <strong className={styles.statusValue}>{summary.receivedCount}건</strong>
        </div>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>예약중</span>
          <strong className={styles.statusValue}>{summary.reservingCount}건</strong>
        </div>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>완료</span>
          <strong className={styles.statusValue}>{summary.completedCount}건</strong>
        </div>
      </div>

      <div className={styles.filterPanel}>
        {RESERVATION_FILTERS.map((filter) => {
          const isActive = selectedFilter === filter.key

          return (
            <button
              key={filter.key}
              type="button"
              className={isActive ? styles.filterButtonActive : styles.filterButton}
              onClick={() => handleChangeFilter(filter.key)}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      <div className={styles.reservationList}>
        {filteredReservations.map((reservation) => {
          const isSelected = reservation.id === selectedReservation?.id

          return (
            <article
              key={reservation.id}
              className={isSelected ? styles.reservationCardSelected : styles.reservationCard}
            >
              <div className={styles.reservationCardTop}>
                <div>
                  <strong className={styles.reservationNo}>{reservation.reservationNo}</strong>
                  <p className={styles.reservationName}>{reservation.orderName}</p>
                </div>

                <span className={styles.reservationStatus}>{getReservationStatusLabel(reservation.status)}</span>
              </div>

              <div className={styles.reservationCardMain}>
                <div className={styles.reservationMeta}>
                  <span>주문유형</span>
                  <strong>{getReservationTypeLabel(reservation.orderType)}</strong>
                </div>
                <div className={styles.reservationMeta}>
                  <span>결제금액</span>
                  <strong>{formatCurrency(reservation.paymentAmount)}</strong>
                </div>
                <div className={styles.reservationMeta}>
                  <span>예약시간</span>
                  <strong>{reservation.reservationTime}</strong>
                </div>
                <div className={styles.reservationMeta}>
                  <span>주문요약</span>
                  <strong>{reservation.summary}</strong>
                </div>
              </div>

              <div className={styles.reservationCardBottom}>
                <div className={styles.memoBox}>
                  <span className={styles.detailLabel}>메모</span>
                  <p className={styles.memoText}>{reservation.memo}</p>
                </div>

                <div className={styles.reservationActions}>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={() => handleSelectReservation(reservation.id)}
                  >
                    주문상세확인
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={() => handleSelectReservation(reservation.id)}
                  >
                    처리 시작
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={() => handleSelectReservation(reservation.id)}
                  >
                    완료
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )

  const DetailPanelUI = selectedReservation ? (
    <aside className={styles.detailPanel} aria-label="예약 상세">
      <div className={styles.detailCard}>
        <div className={styles.detailTop}>
          <div>
            <span className={styles.detailLabel}>선택 예약</span>
            <strong className={styles.detailTitle}>{selectedReservation.reservationNo}</strong>
          </div>
          <span className={styles.detailStatus}>{getReservationStatusLabel(selectedReservation.status)}</span>
        </div>

        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>주문명</span>
            <strong className={styles.detailValue}>{selectedReservation.orderName}</strong>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>주문유형</span>
            <strong className={styles.detailValue}>{getReservationTypeLabel(selectedReservation.orderType)}</strong>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>결제금액</span>
            <strong className={styles.detailValue}>{formatCurrency(selectedReservation.paymentAmount)}</strong>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>예약시간</span>
            <strong className={styles.detailValue}>{selectedReservation.reservationTime}</strong>
          </div>
        </div>

        <div className={styles.detailBlock}>
          <span className={styles.detailLabel}>주문요약</span>
          <strong className={styles.detailValue}>{selectedReservation.summary}</strong>
        </div>

        <div className={styles.memoBox}>
          <span className={styles.detailLabel}>메모</span>
          <p className={styles.memoText}>{selectedReservation.memo}</p>
        </div>
      </div>
    </aside>
  ) : (
    <aside className={styles.detailPanel} aria-label="예약 상세 없음">
      <div className={styles.detailPlaceholder}>
        <strong>예약을 선택하세요</strong>
        <p>
          예약 목록에서 주문을 선택하면 우측 상세 패널에서 상태와 결제 정보를 확인합니다.
        </p>
      </div>
    </aside>
  )

  return (
    <div className={styles.page}>
      <div className={styles.posShell}>
        <div className={styles.topbarWrap}>
          <div className={styles.topbarInner}>
            <PosTopbar
              title="예약 주문"
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
            {ReservationPanelUI}
            {DetailPanelUI}
          </div>
        </main>
      </div>
    </div>
  )
}
