'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import PosSidebar from '../../components/PosSidebar'
import PosTopbar from '../../components/PosTopbar'
import { usePosKeyboardMode } from '../../components/PosKeyboardModeContext'
import { POS_ROOM_MENUS, PosMenuKey } from '../../components/posTypes'
import styles from './RoomsStaySalesPage.module.css'

type StaySalesUseType = '숙박' | '대실'
type StaySalesPaymentMethod = '카드' | '현금' | 'QR결제'
type StaySalesStatus = '이용완료' | '체크아웃 완료' | '이용중' | '환불'
type StaySalesViewMode = 'DAILY_SUMMARY' | 'DAILY_HISTORY' | 'MONTHLY'

type StaySalesItem = {
  id: number
  useType: StaySalesUseType
  roomNo: string
  status: StaySalesStatus
  paymentMethod: StaySalesPaymentMethod
  amount: number
  checkIn: string
  checkOut: string
  memo?: string
}

type StaySalesDayData = {
  date: number
  items: StaySalesItem[]
}

type StaySalesSummary = {
  totalSalesAmount: number
  staySalesAmount: number
  shortStaySalesAmount: number
  cardSalesAmount: number
  cashSalesAmount: number
  qrSalesAmount: number
  usageCount: number
}

const INITIAL_YEAR = 2026
const INITIAL_MONTH = 5
const INITIAL_DAY = 12
const CALENDAR_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1)

const INITIAL_SUMMARY: StaySalesSummary = {
  totalSalesAmount: 580000,
  staySalesAmount: 420000,
  shortStaySalesAmount: 160000,
  cardSalesAmount: 400000,
  cashSalesAmount: 120000,
  qrSalesAmount: 60000,
  usageCount: 8
}

const EMPTY_SUMMARY: StaySalesSummary = {
  totalSalesAmount: 0,
  staySalesAmount: 0,
  shortStaySalesAmount: 0,
  cardSalesAmount: 0,
  cashSalesAmount: 0,
  qrSalesAmount: 0,
  usageCount: 0
}

const STAY_SALES_BY_DAY: StaySalesDayData[] = [
  {
    date: 1,
    items: [
      {
        id: 1,
        useType: '숙박',
        roomNo: '201호',
        status: '이용완료',
        paymentMethod: '카드',
        amount: 120000,
        checkIn: '15:00',
        checkOut: '다음날 11:00'
      },
      {
        id: 2,
        useType: '대실',
        roomNo: '305호',
        status: '이용완료',
        paymentMethod: '현금',
        amount: 60000,
        checkIn: '13:00',
        checkOut: '17:00'
      },
      {
        id: 3,
        useType: '숙박',
        roomNo: '408호',
        status: '체크아웃 완료',
        paymentMethod: 'QR결제',
        amount: 150000,
        checkIn: '전일 20:00',
        checkOut: '10:30',
        memo: '예약: R-1003'
      },
      {
        id: 4,
        useType: '숙박',
        roomNo: '120호',
        status: '이용중',
        paymentMethod: '카드',
        amount: 90000,
        checkIn: '16:00',
        checkOut: '다음날 11:00',
        memo: '청소 상태 양호'
      },
      {
        id: 5,
        useType: '숙박',
        roomNo: '502호',
        status: '이용완료',
        paymentMethod: '카드',
        amount: 160000,
        checkIn: '18:00',
        checkOut: '다음날 10:00',
        memo: '할인 적용'
      }
    ]
  },
  {
    date: 2,
    items: []
  },
  {
    date: 3,
    items: [
      {
        id: 6,
        useType: '숙박',
        roomNo: '201호',
        status: '이용완료',
        paymentMethod: '카드',
        amount: 120000,
        checkIn: '15:00',
        checkOut: '다음날 11:00'
      },
      {
        id: 7,
        useType: '대실',
        roomNo: '305호',
        status: '이용완료',
        paymentMethod: '현금',
        amount: 60000,
        checkIn: '13:00',
        checkOut: '17:00'
      },
      {
        id: 8,
        useType: '숙박',
        roomNo: '408호',
        status: '이용완료',
        paymentMethod: 'QR결제',
        amount: 140000,
        checkIn: '전일 20:00',
        checkOut: '10:30'
      }
    ]
  },
  {
    date: 12,
    items: [
      {
        id: 9,
        useType: '숙박',
        roomNo: '201호',
        status: '이용완료',
        paymentMethod: '카드',
        amount: 120000,
        checkIn: '15:00',
        checkOut: '다음날 11:00'
      },
      {
        id: 10,
        useType: '대실',
        roomNo: '305호',
        status: '이용완료',
        paymentMethod: '현금',
        amount: 60000,
        checkIn: '13:00',
        checkOut: '17:00'
      },
      {
        id: 11,
        useType: '숙박',
        roomNo: '408호',
        status: '체크아웃 완료',
        paymentMethod: 'QR결제',
        amount: 150000,
        checkIn: '전일 20:00',
        checkOut: '10:30',
        memo: '예약: R-1008'
      },
      {
        id: 12,
        useType: '숙박',
        roomNo: '120호',
        status: '환불',
        paymentMethod: '카드',
        amount: 90000,
        checkIn: '16:00',
        checkOut: '다음날 11:00',
        memo: '부분 취소 처리'
      },
      {
        id: 13,
        useType: '숙박',
        roomNo: '502호',
        status: '이용완료',
        paymentMethod: '카드',
        amount: 160000,
        checkIn: '18:00',
        checkOut: '다음날 10:00',
        memo: '예약: R-1011'
      }
    ]
  }
]

const STAY_SALES_BY_DAY_MAP = STAY_SALES_BY_DAY.reduce(
  (acc, record) => {
    acc[record.date] = record.items
    return acc
  },
  {} as Record<number, StaySalesItem[]>
)

const STAY_SALES_SUMMARY_BY_DAY: Record<number, StaySalesSummary> = {
  1: INITIAL_SUMMARY,
  3: {
    totalSalesAmount: 320000,
    staySalesAmount: 220000,
    shortStaySalesAmount: 100000,
    cardSalesAmount: 220000,
    cashSalesAmount: 60000,
    qrSalesAmount: 40000,
    usageCount: 3
  },
  12: INITIAL_SUMMARY
}

const getMonthLabel = (year: number, month: number) => `${year}년 ${month}월`
const getCalendarSelectTitle = (year: number) => `${year}년부터 ${year + 1}년까지`
const formatDateLabel = (month: number, day: number) => `${month}월 ${day}일`
const formatDayLabel = (day: number) => `${day}일`
const formatLongDateLabel = (year: number, month: number, day: number) => `${year}년 ${month}월 ${day}일`
const formatDayKey = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const formatAmount = (amount: number) => `${amount.toLocaleString('ko-KR')}원`

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()

const resolveSelectedDayForMonth = (year: number, month: number, preferredDay: number) => {
  const daysInMonth = getDaysInMonth(year, month)

  if (preferredDay < 1) {
    return 1
  }

  if (preferredDay > daysInMonth) {
    return 1
  }

  return preferredDay
}

export default function RoomsStaySalesPage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const [activeMenu, setActiveMenu] = useState<PosMenuKey>('STAY_SALES')
  const [selectedDay, setSelectedDay] = useState(INITIAL_DAY)
  const [viewMode, setViewMode] = useState<StaySalesViewMode>('DAILY_SUMMARY')
  const [year, setYear] = useState(INITIAL_YEAR)
  const [month, setMonth] = useState(INITIAL_MONTH)
  const [isCalendarSelectOpen, setIsCalendarSelectOpen] = useState(false)
  const [calendarDraftYear, setCalendarDraftYear] = useState(INITIAL_YEAR)
  const [calendarDraftMonth, setCalendarDraftMonth] = useState(INITIAL_MONTH)

  const selectedDaySummary = useMemo(
    () => STAY_SALES_SUMMARY_BY_DAY[selectedDay] ?? EMPTY_SUMMARY,
    [selectedDay]
  )

  const selectedDaySalesItems = useMemo(
    () => STAY_SALES_BY_DAY_MAP[selectedDay] ?? [],
    [selectedDay]
  )

  const monthSummary = useMemo(() => {
    const summary = { ...EMPTY_SUMMARY }

    Object.values(STAY_SALES_SUMMARY_BY_DAY).forEach((daySummary) => {
      summary.totalSalesAmount += daySummary.totalSalesAmount
      summary.staySalesAmount += daySummary.staySalesAmount
      summary.shortStaySalesAmount += daySummary.shortStaySalesAmount
      summary.cardSalesAmount += daySummary.cardSalesAmount
      summary.cashSalesAmount += daySummary.cashSalesAmount
      summary.qrSalesAmount += daySummary.qrSalesAmount
      summary.usageCount += daySummary.usageCount
    })

    return summary
  }, [])

  const currentSummary =
    viewMode === 'MONTHLY' ? monthSummary : selectedDaySummary

  const getStatusLabel = (status: StaySalesStatus) => {
    if (status === '이용완료' || status === '체크아웃 완료') {
      return '이용완료'
    }

    if (status === '환불') {
      return '환불'
    }

    return '결제완료'
  }

  const monthLabel = useMemo(() => getMonthLabel(year, month), [year, month])
  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month])
  const calendarYearOptions = useMemo(() => [year, year + 1], [year])

  const calendarDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1
      const items = STAY_SALES_BY_DAY_MAP[day] ?? []
      const totalSalesAmount = items.reduce((sum, item) => sum + item.amount, 0)

      return {
        key: formatDayKey(year, month, day),
        day,
        label: formatDateLabel(month, day),
        items,
        totalSalesAmount,
        isSelected: day === selectedDay
      }
    })
  }, [year, month, selectedDay, daysInMonth])

  const handleChangeMenu = (menu: PosMenuKey) => {
    setActiveMenu(menu)

    if (menu === 'STAY_SALES') {
      router.push('/pos/rooms/stay-sales')
      return
    }

    if (menu === 'ROOM_STATUS') {
      router.push('/pos/rooms')
      return
    }

    if (menu === 'COOKING') {
      router.push('/pos/rooms/manage')
      return
    }

    if (menu === 'RESERVATION') {
      router.push('/pos/rooms/reservations')
      return
    }

    if (menu === 'TABLE') {
      router.push('/pos/rooms/table')
      return
    }

    console.log('목업 메뉴 클릭', menu)
  }

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleGoPosHome = () => {
    router.push('/pos')
  }

  const handleOpenPosSettings = () => {
    router.push('/pos/settings')
  }

  const handleOpenCalendarSelect = () => {
    setCalendarDraftYear(year)
    setCalendarDraftMonth(month)
    setIsCalendarSelectOpen(true)
  }

  const handleCloseCalendarSelect = () => {
    setIsCalendarSelectOpen(false)
  }

  const handleApplyCalendarSelect = () => {
    const nextYear = calendarDraftYear
    const nextMonth = calendarDraftMonth
    const nextSelectedDay = resolveSelectedDayForMonth(nextYear, nextMonth, selectedDay)

    setYear(nextYear)
    setMonth(nextMonth)
    setSelectedDay(nextSelectedDay)
    setIsCalendarSelectOpen(false)
  }

  const handleSelectDay = (day: number) => {
    setSelectedDay(day)
  }

  const handleMoveToToday = () => {
    setYear(INITIAL_YEAR)
    setMonth(INITIAL_MONTH)
    setSelectedDay(resolveSelectedDayForMonth(INITIAL_YEAR, INITIAL_MONTH, INITIAL_DAY))
  }

  const handleMoveThisMonth = () => {
    setYear(INITIAL_YEAR)
    setMonth(INITIAL_MONTH)
    setSelectedDay(resolveSelectedDayForMonth(INITIAL_YEAR, INITIAL_MONTH, INITIAL_DAY))
  }

  const selectedDayLongLabel = formatLongDateLabel(year, month, selectedDay)

  const renderPanelTitle = () => {
    if (viewMode === 'MONTHLY') {
      return `${monthLabel} 매출 요약`
    }

    if (viewMode === 'DAILY_HISTORY') {
      return `${selectedDayLongLabel} 객실판매 이력`
    }

    return `${selectedDayLongLabel} 매출 요약`
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
              menuOptions={POS_ROOM_MENUS}
              className={styles.sidebar}
            />

            <main className={styles.main}>
              <section className={styles.summaryPanel}>
                <p className={styles.pageDescription}>
                  선택한 날짜의 객실 매출과 결제 내역을 확인합니다.
                </p>

                <div className={styles.pageTitleRow}>
                  <h1 className={styles.pageTitle}>매출현황</h1>
                  <div className={styles.viewActions}>
                    <button
                      type="button"
                      className={viewMode === 'DAILY_SUMMARY' ? styles.viewButtonActive : styles.viewButton}
                      onClick={() => setViewMode('DAILY_SUMMARY')}
                    >
                      1일 요약
                    </button>
                    <button
                      type="button"
                      className={viewMode === 'DAILY_HISTORY' ? styles.viewButtonActive : styles.viewButton}
                      onClick={() => setViewMode('DAILY_HISTORY')}
                    >
                      1일 전체
                    </button>
                    <button
                      type="button"
                      className={viewMode === 'MONTHLY' ? styles.viewButtonActive : styles.viewButton}
                      onClick={() => setViewMode('MONTHLY')}
                    >
                      월별 매출
                    </button>
                  </div>
                </div>

                <div className={styles.monthSummary}>
                  <h2 className={styles.monthTitle}>{renderPanelTitle()}</h2>
                  {viewMode === 'DAILY_HISTORY' ? (
                    <div className={styles.selectedCard}>
                      <div className={styles.selectedList}>
                        {selectedDaySalesItems.length > 0 ? (
                          selectedDaySalesItems.map((item) => (
                            <article className={styles.selectedItem} key={item.id}>
                              <div className={styles.selectedItemHead}>
                                <span>{item.roomNo}</span>
                                <strong>{getStatusLabel(item.status)}</strong>
                              </div>
                              <div className={styles.selectedItemBody}>
                                <p>판매유형: {item.useType}</p>
                                <p>체크인: {item.checkIn}</p>
                                <p>체크아웃: {item.checkOut}</p>
                                <p>결제수단: {item.paymentMethod}</p>
                                <p>결제금액: {formatAmount(item.amount)}</p>
                                {item.memo ? <p>{item.memo}</p> : null}
                              </div>
                            </article>
                          ))
                        ) : (
                          <p className={styles.emptyText}>선택한 날짜의 객실판매 이력이 없습니다.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={styles.summaryBigValue}>
                        {formatAmount(currentSummary.totalSalesAmount)}
                      </p>
                      <div className={styles.monthSummaryGrid}>
                        <p>
                          <span>전체 매출</span>
                          <strong>{formatAmount(currentSummary.totalSalesAmount)}</strong>
                        </p>
                        <p>
                          <span>숙박 매출</span>
                          <strong>{formatAmount(currentSummary.staySalesAmount)}</strong>
                        </p>
                        <p>
                          <span>대실 매출</span>
                          <strong>{formatAmount(currentSummary.shortStaySalesAmount)}</strong>
                        </p>
                        <p>
                          <span>카드 결제</span>
                          <strong>{formatAmount(currentSummary.cardSalesAmount)}</strong>
                        </p>
                        <p>
                          <span>현금 결제</span>
                          <strong>{formatAmount(currentSummary.cashSalesAmount)}</strong>
                        </p>
                        <p>
                          <span>QR 결제</span>
                          <strong>{formatAmount(currentSummary.qrSalesAmount)}</strong>
                        </p>
                        <p>
                          <span>이용 건수</span>
                          <strong>{currentSummary.usageCount}건</strong>
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </main>

            <aside className={styles.calendarPanel} aria-label="숙박 매출 캘린더">
              <div className={styles.calendarHeader}>
                <div className={styles.calendarHeaderTop}>
                  <h2>{monthLabel} 캘린더</h2>
                  <button
                    type="button"
                    className={styles.calendarSelectButton}
                    onClick={handleOpenCalendarSelect}
                  >
                    캘린더 선택
                  </button>
                </div>
                <div className={styles.calendarActions}>
                  <button type="button" onClick={handleMoveToToday}>
                    오늘
                  </button>
                  <button type="button" onClick={handleMoveThisMonth}>
                    이번달
                  </button>
                </div>
              </div>

              <div className={styles.calendarWeekRow}>
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
                    key={dayInfo.key}
                    type="button"
                    className={`${styles.calendarCell} ${
                      dayInfo.isSelected ? styles.calendarCellActive : ''
                    }`}
                    onClick={() => handleSelectDay(dayInfo.day)}
                  >
                    <div className={styles.calendarCellDate}>{formatDayLabel(dayInfo.day)}</div>
                    <div className={styles.calendarCellCount}>
                      {dayInfo.totalSalesAmount > 0 ? formatAmount(dayInfo.totalSalesAmount) : '없음'}
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </div>

        {isCalendarSelectOpen ? (
          <div className={styles.modalOverlay} onClick={handleCloseCalendarSelect} role="presentation">
            <div
              className={styles.modalCard}
              role="dialog"
              aria-modal="true"
              aria-labelledby="calendar-select-title"
              aria-describedby="calendar-select-description"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div>
                  <h3 id="calendar-select-title" className={styles.modalTitle}>
                    캘린더 선택
                  </h3>
                  <p id="calendar-select-description" className={styles.modalDescription}>
                    조회할 년도와 월을 선택하세요.
                  </p>
                </div>

                <button type="button" className={styles.modalCloseButton} onClick={handleCloseCalendarSelect}>
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.modalColumns}>
                  <div className={styles.modalColumn}>
                    <span className={styles.modalSectionLabel}>년도</span>
                    <div className={styles.yearButtonList}>
                      {calendarYearOptions.map((option) => {
                        const isSelectedYear = option === calendarDraftYear

                        return (
                          <button
                            key={option}
                            type="button"
                            className={`${styles.choiceButton} ${
                              isSelectedYear ? styles.choiceButtonActive : ''
                            }`}
                            onClick={() => setCalendarDraftYear(option)}
                          >
                            {option}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className={styles.modalColumn}>
                    <span className={styles.modalSectionLabel}>{getCalendarSelectTitle(calendarDraftYear)}</span>
                    <div className={styles.monthButtonGrid}>
                      {CALENDAR_MONTH_OPTIONS.map((option) => {
                        const isSelectedMonth = option === calendarDraftMonth

                        return (
                          <button
                            key={option}
                            type="button"
                            className={`${styles.choiceButton} ${styles.monthChoiceButton} ${
                              isSelectedMonth ? styles.choiceButtonActive : ''
                            }`}
                            onClick={() => setCalendarDraftMonth(option)}
                          >
                            {option}월
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.modalSecondaryButton} onClick={handleCloseCalendarSelect}>
                    취소
                  </button>
                  <button type="button" className={styles.modalPrimaryButton} onClick={handleApplyCalendarSelect}>
                    적용
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
