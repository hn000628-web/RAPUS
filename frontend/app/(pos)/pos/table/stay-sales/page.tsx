'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import PosSidebar from '../../components/PosSidebar'
import PosTopbar from '../../components/PosTopbar'
import { usePosKeyboardMode } from '../../components/PosKeyboardModeContext'
import { PosMenuKey } from '../../components/posTypes'
import {
  TABLE_POS_SIDEBAR_MENUS,
  TABLE_POS_SIDEBAR_PATHS
} from '../../components/tablePosMenuConfig'

import styles from './TableStaySalesPage.module.css'

type SalesViewMode = 'DAILY' | 'MONTHLY'

type TableSalesSummary = {
  totalSalesAmount: number
  tableSalesAmount: number
  reservationSalesAmount: number
  pickupSalesAmount: number
  deliverySalesAmount: number
  cardSalesAmount: number
  cashSalesAmount: number
  qrSalesAmount: number
  orderCount: number
}

const TABLE_STAY_SALES_MENU_PATHS = TABLE_POS_SIDEBAR_PATHS

const YEAR = 2026
const MONTH = 5

const DAILY_SALES_BY_DAY: Record<number, TableSalesSummary> = {
  12: {
    totalSalesAmount: 580000,
    tableSalesAmount: 260000,
    reservationSalesAmount: 120000,
    pickupSalesAmount: 80000,
    deliverySalesAmount: 120000,
    cardSalesAmount: 400000,
    cashSalesAmount: 120000,
    qrSalesAmount: 60000,
    orderCount: 96
  },
  13: {
    totalSalesAmount: 420000,
    tableSalesAmount: 180000,
    reservationSalesAmount: 72000,
    pickupSalesAmount: 96000,
    deliverySalesAmount: 76000,
    cardSalesAmount: 252000,
    cashSalesAmount: 100000,
    qrSalesAmount: 68000,
    orderCount: 72
  },
  14: {
    totalSalesAmount: 650000,
    tableSalesAmount: 310000,
    reservationSalesAmount: 80000,
    pickupSalesAmount: 90000,
    deliverySalesAmount: 170000,
    cardSalesAmount: 360000,
    cashSalesAmount: 170000,
    qrSalesAmount: 120000,
    orderCount: 105
  },
  18: {
    totalSalesAmount: 240000,
    tableSalesAmount: 90000,
    reservationSalesAmount: 50000,
    pickupSalesAmount: 42000,
    deliverySalesAmount: 58000,
    cardSalesAmount: 160000,
    cashSalesAmount: 50000,
    qrSalesAmount: 30000,
    orderCount: 36
  }
}

const EMPTY_SUMMARY: TableSalesSummary = {
  totalSalesAmount: 0,
  tableSalesAmount: 0,
  reservationSalesAmount: 0,
  pickupSalesAmount: 0,
  deliverySalesAmount: 0,
  cardSalesAmount: 0,
  cashSalesAmount: 0,
  qrSalesAmount: 0,
  orderCount: 0
}

const SALES_ITEMS: Array<{ key: keyof TableSalesSummary; label: string }> = [
  {
    key: 'totalSalesAmount',
    label: '전체 매출'
  },
  {
    key: 'tableSalesAmount',
    label: '테이블 매출'
  },
  {
    key: 'reservationSalesAmount',
    label: '예약 매출'
  },
  {
    key: 'pickupSalesAmount',
    label: '픽업 매출'
  },
  {
    key: 'deliverySalesAmount',
    label: '배달 매출'
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

export default function TableStaySalesPage() {
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

  const monthSummary = useMemo<TableSalesSummary>(() => {
    const summary = { ...EMPTY_SUMMARY }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const item = DAILY_SALES_BY_DAY[day]

      if (!item) {
        continue
      }

      summary.totalSalesAmount += item.totalSalesAmount
      summary.tableSalesAmount += item.tableSalesAmount
      summary.reservationSalesAmount += item.reservationSalesAmount
      summary.pickupSalesAmount += item.pickupSalesAmount
      summary.deliverySalesAmount += item.deliverySalesAmount
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
      const totalSalesAmount = item?.totalSalesAmount ?? 0

      return {
        day,
        totalSalesAmount,
        isSelected: selectedDay === day
      }
    })
  }, [daysInMonth, selectedDay])

  const activeMenu: Extract<
    PosMenuKey,
    'TABLE' | 'COOKING' | 'ORDER_HISTORY' | 'RESERVATION' | 'SALES_HISTORY'
  > = pathname === '/pos/table/stay-sales'
    ? 'SALES_HISTORY'
    : 'TABLE'

  const handleChangeMenu = (menu: PosMenuKey) => {
    if (
      menu === 'TABLE' ||
      menu === 'COOKING' ||
      menu === 'ORDER_HISTORY' ||
      menu === 'RESERVATION' ||
      menu === 'SALES_HISTORY' ||
      menu === 'MENU_MANAGE'
    ) {
      router.push(TABLE_STAY_SALES_MENU_PATHS[menu])
    }
  }

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
              title="매출현황"
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
              activeMenu={activeMenu}
              onChangeMenu={handleChangeMenu}
              menuOptions={TABLE_POS_SIDEBAR_MENUS}
              className={styles.sidebar}
            />

            <main className={styles.main}>
              <section className={styles.summaryPanel}>
                <p className={styles.pageDescription}>
                  선택한 날짜의 주문 매출과 결제 내역을 확인합니다.
                </p>

                <div className={styles.titleRow}>
                  <h1 className={styles.pageTitle}>매출현황</h1>
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
                    {viewMode === 'DAILY' ? `${currentMonth}월 ${selectedDay}일 매출` : `${currentMonth}월 매출`}
                  </h2>
                  <p className={styles.summaryBigValue}>
                    {formatCurrency(currentSummary.totalSalesAmount)}
                  </p>

                  <div className={styles.summaryRows}>
                    {SALES_ITEMS.map((item) => (
                      <div key={item.key} className={styles.summaryRow}>
                        <span>{item.label}</span>
                        <strong>
                          {formatCurrency(currentSummary[item.key] as number)}
                        </strong>
                      </div>
                    ))}
                    <div className={styles.summaryRow}>
                      <span>주문 건수</span>
                      <strong>{currentSummary.orderCount}건</strong>
                    </div>
                  </div>
                </div>
              </section>
            </main>

            <aside className={styles.calendarPanel}>
              <div className={styles.calendarHeader}>
                <h2 className={styles.calendarTitle}>{currentYear}년 {currentMonth}월 캘린더</h2>
                <div className={styles.calendarActionRow}>
                  <button
                    type="button"
                    className={styles.calendarActionButton}
                    onClick={handleMoveToToday}
                  >
                    오늘
                  </button>
                  <button
                    type="button"
                    className={styles.calendarActionButton}
                    onClick={handleMoveToThisMonth}
                  >
                    이번달
                  </button>
                  <button
                    type="button"
                    className={styles.calendarActionButton}
                    onClick={handleOpenCalendarPicker}
                  >
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
                    <span className={styles.calendarDate}> {String(dayInfo.day).padStart(2, '0')}</span>
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
        </div>

        {isCalendarPickerOpen ? (
          <div
            className={styles.modalOverlay}
            onClick={() => setIsCalendarPickerOpen(false)}
            role="presentation"
          >
            <div className={styles.modalCard} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
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
