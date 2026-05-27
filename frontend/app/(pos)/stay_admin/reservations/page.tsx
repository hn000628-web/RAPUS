'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import PosSidebar from '../../pos/components/PosSidebar'
import PosTopbar from '../../pos/components/PosTopbar'
import { usePosKeyboardMode } from '../../pos/components/PosKeyboardModeContext'
import { POS_ROOM_MENUS, PosMenuKey } from '../../pos/components/posTypes'
import styles from './RoomsReservationsPage.module.css'

type RoomType = '스위트룸' | 'VIP룸' | '디럭스룸'
type AssignmentStatus = '배정완료' | '미배정'
type ReservationStatus = '예약대기' | '예약확정' | '체크인예정'

type ReservationItem = {
  id: number
  roomName: string
  roomType: RoomType
  roomTypeName: string
  roomNo: string
  assignmentStatus: AssignmentStatus
  reservationStatus: ReservationStatus
  time: string
  status: ReservationStatus
}

type ReservationFilter = 'ALL' | 'SUITE' | 'VIP' | 'NONE'

type ReservationDayData = {
  date: number
  items: ReservationItem[]
}

const INITIAL_YEAR = 2026
const INITIAL_MONTH = 5
const INITIAL_DAY = 12
const CALENDAR_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1)

const MONTH_RESERVATION_SUMMARY = {
  total: 13,
  suite: 10,
  vip: 3,
  noReservationDays: 1
}

const FILTER_ITEMS: Array<{ key: ReservationFilter; label: string }> = [
  { key: 'ALL', label: '전체' },
  { key: 'SUITE', label: '스위트룸' },
  { key: 'VIP', label: 'VIP룸' },
  { key: 'NONE', label: '예약없음' }
]

const RESERVATIONS_BY_DAY: ReservationDayData[] = [
  {
    date: 1,
    items: [
      {
        id: 1,
        roomName: '201',
        roomType: '스위트룸',
        roomTypeName: '스위트룸',
        roomNo: '201',
        assignmentStatus: '배정완료',
        reservationStatus: '예약확정',
        status: '예약확정',
        time: '14:00'
      },
      {
        id: 2,
        roomName: 'VIP 305',
        roomType: 'VIP룸',
        roomTypeName: 'VIP룸',
        roomNo: '305',
        assignmentStatus: '배정완료',
        reservationStatus: '예약대기',
        status: '예약확정'
        ,
        time: '18:00'
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
        id: 3,
        roomName: '201',
        roomType: '스위트룸',
        roomTypeName: '스위트룸',
        roomNo: '201',
        assignmentStatus: '배정완료',
        reservationStatus: '예약확정',
        status: '예약확정',
        time: '15:00'
      },
      {
        id: 4,
        roomName: '미배정',
        roomType: 'VIP룸',
        roomTypeName: 'VIP룸',
        roomNo: '미배정',
        assignmentStatus: '미배정',
        reservationStatus: '예약확정',
        status: '예약대기',
        time: '18:00'
      },
      {
        id: 5,
        roomName: '408',
        roomType: '스위트룸',
        roomTypeName: '스위트룸',
        roomNo: '408',
        assignmentStatus: '배정완료',
        reservationStatus: '체크인예정',
        status: '체크인예정',
        time: '20:00'
      }
    ]
  },
  {
    date: 4,
    items: [
      {
        id: 6,
        roomName: '305',
        roomType: '스위트룸',
        roomTypeName: '디럭스룸',
        roomNo: '305',
        assignmentStatus: '배정완료',
        reservationStatus: '예약대기',
        status: '예약대기',
        time: '16:00'
      }
    ]
  }
]

const DAY_RESERVATION_MAP = RESERVATIONS_BY_DAY.reduce(
  (acc, record) => {
    acc[record.date] = record.items
    return acc
  },
  {} as Record<number, ReservationItem[]>
)

const getMonthLabel = (year: number, month: number) => `${year}년 ${month}월`
const getCalendarSelectTitle = (year: number) => `${year}년부터 ${year + 1}년까지`

const formatDateLabel = (month: number, day: number) => `${month}월 ${day}일`
const formatDayLabel = (day: number) => `${day}일`

const formatDayKey = (year: number, month: number, day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()

const resolveSelectedDayForMonth = (
  year: number,
  month: number,
  preferredDay: number
) => {
  const daysInMonth = getDaysInMonth(year, month)

  if (preferredDay < 1) {
    return 1
  }

  if (preferredDay > daysInMonth) {
    return 1
  }

  return preferredDay
}

export default function RoomsReservationsPage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const [activeMenu, setActiveMenu] = useState<PosMenuKey>('RESERVATION')
  const [activeFilter, setActiveFilter] = useState<ReservationFilter>('ALL')
  const [selectedDay, setSelectedDay] = useState(INITIAL_DAY)
  const [isViewAllMode, setIsViewAllMode] = useState(false)
  const [isUserSelectedDate, setIsUserSelectedDate] = useState(false)
  const [year, setYear] = useState(INITIAL_YEAR)
  const [month, setMonth] = useState(INITIAL_MONTH)
  const [isCalendarSelectOpen, setIsCalendarSelectOpen] = useState(false)
  const [calendarDraftYear, setCalendarDraftYear] = useState(INITIAL_YEAR)
  const [calendarDraftMonth, setCalendarDraftMonth] = useState(INITIAL_MONTH)

  const selectedDayItems = useMemo(() => DAY_RESERVATION_MAP[selectedDay] ?? [], [selectedDay])

  const monthLabel = useMemo(() => getMonthLabel(year, month), [year, month])
  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month])
  const calendarYearOptions = useMemo(() => [year, year + 1], [year])

  const calendarDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1
      return {
        key: formatDayKey(year, month, day),
        day,
        label: formatDateLabel(month, day),
        items: DAY_RESERVATION_MAP[day] ?? [],
        isSelected: day === selectedDay
      }
    })
  }, [year, month, selectedDay, daysInMonth])

  const handleChangeMenu = (menu: PosMenuKey) => {
    setActiveMenu(menu)

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

    if (menu === 'STAY_SALES') {
      router.push('/pos/rooms/stay-sales')
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
    setIsUserSelectedDate(true)
  }

  const handleMoveToToday = () => {
    setYear(INITIAL_YEAR)
    setMonth(INITIAL_MONTH)
    setSelectedDay(resolveSelectedDayForMonth(INITIAL_YEAR, INITIAL_MONTH, INITIAL_DAY))
    setIsUserSelectedDate(false)
  }

  const handleMoveThisMonth = () => {
    setYear(INITIAL_YEAR)
    setMonth(INITIAL_MONTH)
    setSelectedDay(resolveSelectedDayForMonth(INITIAL_YEAR, INITIAL_MONTH, INITIAL_DAY))
    setIsUserSelectedDate(false)
  }

  const selectedDayLabel = formatDateLabel(month, selectedDay)

  const allItemsForSelectedDay = useMemo(() => {
    return selectedDayItems.map((item) => ({
      ...item,
      reservationStatus: item.reservationStatus ?? item.status
    }))
  }, [selectedDayItems])

  const viewAllTitle = `${selectedDayLabel} 예약 전체보기`

  return (
    <div className={styles.page}>
      <div className={styles.posShell}>
        <div className={styles.topbarWrap}>
          <div className={styles.topbarInner}>
            <PosTopbar
              title="예약현황"
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
                  월별 객실 예약 현황과 날짜별 예약 갯수를 확인합니다.
                </p>

                <div className={styles.pageTitleRow}>
                  <h1 className={styles.pageTitle}>예약현황</h1>
                  {isViewAllMode ? (
                    <button
                      type="button"
                      className={styles.viewAllButton}
                      onClick={() => setIsViewAllMode(false)}
                    >
                      요약으로 돌아가기
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.viewAllButton}
                      onClick={() => setIsViewAllMode(true)}
                    >
                      {viewAllTitle}
                    </button>
                  )}
                </div>

                {!isViewAllMode && (
                  <>
                    <div className={styles.monthSummary}>
                      <h2 className={styles.monthTitle}>{monthLabel} 예약 현황</h2>
                      <div className={styles.monthSummaryGrid}>
                        <p><span>전체 예약</span><strong>{MONTH_RESERVATION_SUMMARY.total}건</strong></p>
                        <p><span>스위트룸</span><strong>{MONTH_RESERVATION_SUMMARY.suite}건</strong></p>
                        <p><span>VIP룸</span><strong>{MONTH_RESERVATION_SUMMARY.vip}건</strong></p>
                        <p><span>예약 없는 날짜</span><strong>{MONTH_RESERVATION_SUMMARY.noReservationDays}일</strong></p>
                      </div>
                    </div>

                    <div className={styles.filterRow} aria-label="예약 타입 필터">
                      {FILTER_ITEMS.map((filterItem) => (
                        <button
                          key={filterItem.key}
                          type="button"
                          className={`${styles.filterButton} ${activeFilter === filterItem.key ? styles.filterButtonActive : ''}`}
                          onClick={() => setActiveFilter(filterItem.key)}
                        >
                          {filterItem.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {isViewAllMode && (
                  <div className={styles.selectedCard}>
                    <h3 className={styles.selectedTitle}>
                      {selectedDayLabel} 예약 전체보기
                    </h3>
                    {allItemsForSelectedDay.length === 0 ? (
                      <p className={styles.emptyText}>{`${selectedDayLabel} 예약된 내역이 없습니다.`}</p>
                    ) : (
                      <div className={styles.selectedList}>
                        {allItemsForSelectedDay.map((item) => (
                          <div key={`${item.id}`} className={styles.selectedItem}>
                            <div className={styles.selectedItemHead}>
                              <span>[{item.roomTypeName}] {item.roomNo}</span>
                              <strong>시간: {item.time}</strong>
                            </div>
                            <div className={styles.selectedItemBody}>
                              <span>배정상태: {item.assignmentStatus}</span>
                              <span>예약상태: {item.reservationStatus}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </main>

            <aside className={styles.calendarPanel} aria-label="예약 캘린더">
              <div className={styles.calendarHeader}>
                <div className={styles.calendarHeaderTop}>
                  <h2>{monthLabel} 캘린더</h2>
                  <button type="button" className={styles.calendarSelectButton} onClick={handleOpenCalendarSelect}>
                    캘린더 선택
                  </button>
                </div>
                <div className={styles.calendarActions}>
                  <button type="button" onClick={handleMoveToToday}>오늘</button>
                  <button type="button" onClick={handleMoveThisMonth}>이번달</button>
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
                    className={`${styles.calendarCell} ${dayInfo.isSelected ? styles.calendarCellActive : ''}`}
                    onClick={() => handleSelectDay(dayInfo.day)}
                  >
                    <div className={styles.calendarCellDate}>{formatDayLabel(dayInfo.day)}</div>
                    <div className={styles.calendarCellCount}>
                      {dayInfo.items.length > 0 ? `예약 ${dayInfo.items.length}건` : '없음'}
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
                            className={`${styles.choiceButton} ${isSelectedYear ? styles.choiceButtonActive : ''}`}
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
                            className={`${styles.choiceButton} ${styles.monthChoiceButton} ${isSelectedMonth ? styles.choiceButtonActive : ''}`}
                            onClick={() => setCalendarDraftMonth(option)}
                          >
                            {option}월
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.modalSecondaryButton} onClick={handleCloseCalendarSelect}>
                  취소
                </button>
                <button type="button" className={styles.modalPrimaryButton} onClick={handleApplyCalendarSelect}>
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

