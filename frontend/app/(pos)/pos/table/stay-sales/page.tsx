'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import PosHeaderMenuBar from '../../components/PosHeaderMenuBar'
import PosTopbar from '../../components/PosTopbar'
import { usePosKeyboardMode } from '../../components/PosKeyboardModeContext'
import { PosMenuKey } from '../../components/posTypes'
import {
  TABLE_POS_SIDEBAR_MENUS,
  TABLE_POS_SIDEBAR_PATHS
} from '../../components/tablePosMenuConfig'
import sharedStyles from '../PosTablePage.module.css'

import styles from './TableStaySalesPage.module.css'

type SalesModalType = 'DAILY' | 'MONTHLY'

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
  const [selectedSalesModal, setSelectedSalesModal] = useState<SalesModalType | null>(null)
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

  const handleOpenSalesModal = (modalType: SalesModalType) => {
    setSelectedSalesModal(modalType)
  }

  const handleCloseSalesModal = () => {
    setSelectedSalesModal(null)
  }

  const handleMonthlyCalendarDayClick = (day: number) => {
    setSelectedDay(day)
    setSelectedSalesModal('DAILY')
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
            <main className={styles.main}>
              <PosHeaderMenuBar
                activeMenu={activeMenu}
                onChangeMenu={handleChangeMenu}
                menuOptions={TABLE_POS_SIDEBAR_MENUS}
              />

              <div className={styles.menuScrollArea}>
                <section className={sharedStyles.posDashboardPanel}>
                  <article className={sharedStyles.posDashboardHero}>
                    <div>
                      <p className={sharedStyles.posDashboardEyebrow}>요식업 POS 매출현황</p>
                      <h1 className={sharedStyles.posDashboardTitle}>매출현황</h1>
                      <p className={sharedStyles.posDashboardDescription}>
                        선택한 날짜의 주문 매출과 결제 내역을 확인하고 일별/월별 매출 상세를 빠르게 확인합니다.
                      </p>
                    </div>
                  </article>

                  <section className={styles.salesContentGrid}>
                    <button
                      type="button"
                      className={`${sharedStyles.posDashboardSummaryCard} ${sharedStyles.posDashboardSummaryCardClickable}`}
                      onClick={() => handleOpenSalesModal('DAILY')}
                    >
                      <span className={sharedStyles.posDashboardSummaryLabel}>1일 매출</span>
                      <strong className={sharedStyles.posDashboardSummaryValue}>
                        {formatCurrency(selectedSummary.totalSalesAmount)}
                      </strong>
                      <small className={sharedStyles.posDashboardSummaryHint}>
                        클릭하여 1일 매출 현황 보기
                      </small>
                    </button>

                    <button
                      type="button"
                      className={`${sharedStyles.posDashboardSummaryCard} ${sharedStyles.posDashboardSummaryCardClickable}`}
                      onClick={() => handleOpenSalesModal('MONTHLY')}
                    >
                      <span className={sharedStyles.posDashboardSummaryLabel}>월간 매출</span>
                      <strong className={sharedStyles.posDashboardSummaryValue}>
                        {formatCurrency(monthSummary.totalSalesAmount)}
                      </strong>
                      <small className={sharedStyles.posDashboardSummaryHint}>
                        클릭하여 월간 매출 현황 보기
                      </small>
                    </button>
                  </section>
                </section>
              </div>
            </main>
          </div>
        </div>

        {selectedSalesModal ? (
          <div className={styles.salesModalOverlay} role="dialog" aria-modal="true">
            <div
              className={`${styles.salesModalPanel} ${
                selectedSalesModal === 'MONTHLY' ? styles.salesCalendarModalPanel : styles.salesSummaryModalPanel
              }`}
            >
              <header className={styles.salesModalHeader}>
                <div>
                  <h2 className={styles.salesModalTitle}>
                    {selectedSalesModal === 'DAILY' ? '1일 매출현황' : null}
                    {selectedSalesModal === 'MONTHLY' ? '월간 매출현황' : null}
                  </h2>
                  <p className={styles.salesModalDescription}>
                    {selectedSalesModal === 'DAILY' ? '선택한 날짜의 주문 매출과 결제 내역을 확인합니다.' : null}
                    {selectedSalesModal === 'MONTHLY' ? '월간 매출과 날짜별 매출 캘린더를 확인합니다.' : null}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.salesModalCloseButton}
                  onClick={handleCloseSalesModal}
                >
                  닫기
                </button>
              </header>

              <div className={styles.salesModalBody}>
                {selectedSalesModal === 'MONTHLY' ? (
                  <section className={styles.calendarPanel}>
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
                        <button
                          type="button"
                          className={styles.calendarActionButton}
                          onClick={() => handleOpenSalesModal('MONTHLY')}
                        >
                          월별 매출 보기
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
                          onClick={() => handleMonthlyCalendarDayClick(dayInfo.day)}
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
                  </section>
                ) : (
                  <section className={styles.summaryPanel}>
                    <div className={styles.summaryMain}>
                      <h2 className={styles.summaryTitle}>{`${currentMonth}월 ${selectedDay}일 매출`}</h2>
                      <p className={styles.summaryBigValue}>
                        {formatCurrency(selectedSummary.totalSalesAmount)}
                      </p>

                      <div className={styles.summaryRows}>
                        {SALES_ITEMS.map((item) => (
                          <div key={item.key} className={styles.summaryRow}>
                            <span>{item.label}</span>
                            <strong>
                              {formatCurrency(selectedSummary[item.key])}
                            </strong>
                          </div>
                        ))}
                        <div className={styles.summaryRow}>
                          <span>주문 건수</span>
                          <strong>{selectedSummary.orderCount}건</strong>
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        ) : null}

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
