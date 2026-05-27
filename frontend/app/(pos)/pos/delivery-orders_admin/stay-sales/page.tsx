'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { usePosKeyboardMode } from '../../components/PosKeyboardModeContext'
import PosTopbar from '../../components/PosTopbar'

import styles from './DeliveryOrderStaySalesPage.module.css'

type SalesViewMode = 'DAILY' | 'MONTHLY'

type DeliverySalesSummary = {
  totalSalesAmount: number
  deliverySalesAmount: number
  pickupSalesAmount: number
  reservationSalesAmount: number
  cardSalesAmount: number
  cashSalesAmount: number
  qrSalesAmount: number
  orderCount: number
}

type DeliverySidebarKey = 'ORDER_HISTORY' | 'ORDER_LIST' | 'RESERVATION' | 'SALES_HISTORY'

type DeliverySidebarItem = {
  key: DeliverySidebarKey
  label: string
  href?: string
  disabled?: boolean
}

const DELIVERY_STAY_SALES_SIDEBAR_ITEMS: DeliverySidebarItem[] = [
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

const YEAR = 2026
const MONTH = 5

const DAILY_SALES_BY_DAY: Record<number, DeliverySalesSummary> = {
  12: {
    totalSalesAmount: 580000,
    deliverySalesAmount: 260000,
    pickupSalesAmount: 140000,
    reservationSalesAmount: 180000,
    cardSalesAmount: 400000,
    cashSalesAmount: 120000,
    qrSalesAmount: 60000,
    orderCount: 96
  },
  13: {
    totalSalesAmount: 420000,
    deliverySalesAmount: 180000,
    pickupSalesAmount: 110000,
    reservationSalesAmount: 130000,
    cardSalesAmount: 252000,
    cashSalesAmount: 100000,
    qrSalesAmount: 68000,
    orderCount: 72
  },
  14: {
    totalSalesAmount: 650000,
    deliverySalesAmount: 310000,
    pickupSalesAmount: 150000,
    reservationSalesAmount: 190000,
    cardSalesAmount: 360000,
    cashSalesAmount: 170000,
    qrSalesAmount: 120000,
    orderCount: 105
  },
  18: {
    totalSalesAmount: 240000,
    deliverySalesAmount: 90000,
    pickupSalesAmount: 70000,
    reservationSalesAmount: 80000,
    cardSalesAmount: 160000,
    cashSalesAmount: 50000,
    qrSalesAmount: 30000,
    orderCount: 36
  }
}

const EMPTY_SUMMARY: DeliverySalesSummary = {
  totalSalesAmount: 0,
  deliverySalesAmount: 0,
  pickupSalesAmount: 0,
  reservationSalesAmount: 0,
  cardSalesAmount: 0,
  cashSalesAmount: 0,
  qrSalesAmount: 0,
  orderCount: 0
}

const SALES_ITEMS: Array<{ key: keyof DeliverySalesSummary; label: string }> = [
  {
    key: 'totalSalesAmount',
    label: '전체 매출'
  },
  {
    key: 'deliverySalesAmount',
    label: '배달 매출'
  },
  {
    key: 'pickupSalesAmount',
    label: '포장 매출'
  },
  {
    key: 'reservationSalesAmount',
    label: '예약 주문 매출'
  },
  {
    key: 'cardSalesAmount',
    label: '카드 결제'
  },
  {
    key: 'cashSalesAmount',
    label: '현금 결제'
  },
  {
    key: 'qrSalesAmount',
    label: 'QR 결제'
  }
]

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()

const formatCurrency = (value: number) => `${value.toLocaleString('ko-KR')}원`

export default function DeliveryOrderStaySalesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()

  const [currentYear, setCurrentYear] = useState(YEAR)
  const [currentMonth, setCurrentMonth] = useState(MONTH)
  const [selectedDay, setSelectedDay] = useState(12)
  const [viewMode, setViewMode] = useState<SalesViewMode>('DAILY')
  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState(false)

  const daysInMonth = useMemo(
    () => getDaysInMonth(currentYear, currentMonth),
    [currentYear, currentMonth]
  )

  const monthSummary = useMemo<DeliverySalesSummary>(() => {
    const summary = { ...EMPTY_SUMMARY }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const item = DAILY_SALES_BY_DAY[day]

      if (!item) {
        continue
      }

      summary.totalSalesAmount += item.totalSalesAmount
      summary.deliverySalesAmount += item.deliverySalesAmount
      summary.pickupSalesAmount += item.pickupSalesAmount
      summary.reservationSalesAmount += item.reservationSalesAmount
      summary.cardSalesAmount += item.cardSalesAmount
      summary.cashSalesAmount += item.cashSalesAmount
      summary.qrSalesAmount += item.qrSalesAmount
      summary.orderCount += item.orderCount
    }

    return summary
  }, [daysInMonth])

  const selectedSummary = useMemo(
    () => DAILY_SALES_BY_DAY[selectedDay] ?? EMPTY_SUMMARY,
    [selectedDay]
  )

  const currentSummary = viewMode === 'DAILY' ? selectedSummary : monthSummary

  const calendarDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1
      const item = DAILY_SALES_BY_DAY[day]

      return {
        day,
        totalSalesAmount: item?.totalSalesAmount ?? 0,
        isSelected: selectedDay === day
      }
    })
  }, [daysInMonth, selectedDay])

  const activeMenu: DeliverySidebarKey = pathname === '/pos/delivery-orders/stay-sales'
    ? 'SALES_HISTORY'
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

  const handleMoveToToday = () => {
    setCurrentYear(YEAR)
    setCurrentMonth(MONTH)
    setSelectedDay(12)
  }

  const handleMoveToThisMonth = () => {
    setCurrentYear(YEAR)
    setCurrentMonth(MONTH)
    setSelectedDay(12)
  }

  const handleOpenCalendarPicker = () => {
    setIsCalendarPickerOpen(true)
  }

  const handleApplyCalendar = () => {
    setIsCalendarPickerOpen(false)
    setSelectedDay(1)
  }

  return (
    <div className={styles.page}>
      <div className={styles.posShell}>
        <div className={styles.topbarWrap}>
          <div className={styles.topbarInner}>
            <PosTopbar
              title="딜리버리 매출현황"
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
            <aside className={styles.deliverySidebar} aria-label="딜리버리 오더 전용 메뉴">
              <div className={styles.deliverySidebarBox}>
                <nav className={styles.deliverySidebarMenu} aria-label="딜리버리 오더 전용 사이드바">
                  {DELIVERY_STAY_SALES_SIDEBAR_ITEMS.map((item) => {
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

            <section className={styles.workspaceContent}>
              <section className={styles.summaryPanel}>
                <p className={styles.pageDescription}>
                  배달 / 포장 / 예약 주문 매출 및 결제 내역을 확인합니다.
                </p>

                <div className={styles.titleRow}>
                  <h1 className={styles.pageTitle}>딜리버리 매출현황</h1>

                  <div className={styles.viewActions}>
                    <button
                      type="button"
                      className={viewMode === 'DAILY' ? styles.viewButtonActive : styles.viewButton}
                      onClick={() => setViewMode('DAILY')}
                    >
                      1일 매출 전체보기
                    </button>

                    <button
                      type="button"
                      className={viewMode === 'MONTHLY' ? styles.viewButtonActive : styles.viewButton}
                      onClick={() => setViewMode('MONTHLY')}
                    >
                      월별 매출 보기
                    </button>
                  </div>
                </div>

                <div className={styles.summaryMain}>
                  <h2 className={styles.summaryTitle}>
                    {viewMode === 'DAILY'
                      ? `${currentMonth}월 ${selectedDay}일 매출`
                      : `${currentMonth}월 매출`}
                  </h2>

                  <p className={styles.summaryBigValue}>
                    {formatCurrency(currentSummary.totalSalesAmount)}
                  </p>

                  <div className={styles.summaryRows}>
                    {SALES_ITEMS.map((item) => (
                      <div key={item.key} className={styles.summaryRow}>
                        <span>{item.label}</span>
                        <strong>{formatCurrency(currentSummary[item.key] as number)}</strong>
                      </div>
                    ))}

                    <div className={styles.summaryRow}>
                      <span>주문 건수</span>
                      <strong>{currentSummary.orderCount}건</strong>
                    </div>
                  </div>
                </div>
              </section>
            </section>

            <aside className={styles.calendarPanel}>
              <div className={styles.calendarHeader}>
                <h2 className={styles.calendarTitle}>{currentYear}년 {currentMonth}월 캘린더</h2>

                <div className={styles.calendarActionRow}>
                  <button type="button" className={styles.calendarActionButton} onClick={handleMoveToToday}>
                    오늘
                  </button>

                  <button type="button" className={styles.calendarActionButton} onClick={handleMoveToThisMonth}>
                    이번달
                  </button>

                  <button type="button" className={styles.calendarActionButton} onClick={handleOpenCalendarPicker}>
                    캘린더 선택
                  </button>
                </div>
              </div>

              <div className={styles.weekRow}>
                <span>일</span>
                <span>월</span>
                <span>화</span>
                <span>수</span>
                <span>목</span>
                <span>금</span>
                <span>토</span>
              </div>

              <div className={styles.calendarGrid}>
                {calendarDays.map((dayInfo) => (
                  <button
                    key={dayInfo.day}
                    type="button"
                    className={
                      dayInfo.isSelected
                        ? `${styles.calendarCell} ${styles.calendarCellActive}`
                        : styles.calendarCell
                    }
                    onClick={() => setSelectedDay(dayInfo.day)}
                  >
                    <span className={styles.calendarDate}>{String(dayInfo.day).padStart(2, '0')}</span>
                    <span className={styles.calendarAmount}>
                      {dayInfo.totalSalesAmount > 0
                        ? formatCurrency(dayInfo.totalSalesAmount)
                        : '없음'}
                    </span>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </main>

        {isCalendarPickerOpen ? (
          <div
            className={styles.modalOverlay}
            onClick={() => setIsCalendarPickerOpen(false)}
            role="presentation"
          >
            <div
              className={styles.modalCard}
              role="dialog"
              aria-modal="true"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>달력 선택</h3>

              <div className={styles.modalBody}>
                <label className={styles.modalLabel}>
                  연도
                  <input
                    className={styles.modalInput}
                    value={currentYear}
                    type="number"
                    min={2024}
                    max={2028}
                    onChange={(event) => setCurrentYear(Number(event.target.value))}
                  />
                </label>

                <label className={styles.modalLabel}>
                  월
                  <input
                    className={styles.modalInput}
                    value={currentMonth}
                    type="number"
                    min={1}
                    max={12}
                    onChange={(event) => setCurrentMonth(Number(event.target.value))}
                  />
                </label>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalSecondaryButton}
                  onClick={() => setIsCalendarPickerOpen(false)}
                >
                  취소
                </button>

                <button
                  type="button"
                  className={styles.modalPrimaryButton}
                  onClick={handleApplyCalendar}
                >
                  적용
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
