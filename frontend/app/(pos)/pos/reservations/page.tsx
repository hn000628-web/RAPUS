 'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import PosSidebar from '../components/PosSidebar'
import PosTopbar from '../components/PosTopbar'
import { usePosKeyboardMode } from '../components/PosKeyboardModeContext'
import { PosMenuKey, PosMenuOption } from '../components/posTypes'
import { TABLE_POS_SIDEBAR_MENUS } from '../components/tablePosMenuConfig'

import styles from './ReservationsPage.module.css'

type StoreReservationType = 'TABLE' | 'PICKUP' | 'DELIVERY'

type StoreReservationStatus = '예약확정' | '픽업예정' | '배달예정' | '배달중' | '고객도착'

type StoreReservationItem = {
  id: number
  type: StoreReservationType
  name: string
  time: string
  status: StoreReservationStatus
  summary: string
  memo: string
}

type ReservationDayData = {
  date: number
  items: StoreReservationItem[]
}

const NOW_YEAR = 2026
const NOW_MONTH = 5
const NOW_DAY = 12

const STORE_RESERVATIONS: StoreReservationItem[] = [
  {
    id: 101,
    type: 'TABLE',
    name: '4인',
    time: '18:00',
    status: '예약확정',
    summary: '방문예약 + 주문',
    memo: '매장 좌석 선호: 창가석'
  },
  {
    id: 102,
    type: 'PICKUP',
    name: '김밥세트',
    time: '18:30',
    status: '픽업예정',
    summary: '김밥세트 외 2건',
    memo: '가방 보관 요청'
  },
  {
    id: 103,
    type: 'DELIVERY',
    name: '치킨세트',
    time: '19:20',
    status: '배달예정',
    summary: '치킨세트 외 1건',
    memo: '문 앞 전달 요청'
  },
  {
    id: 104,
    type: 'TABLE',
    name: '2인',
    time: '18:45',
    status: '고객도착',
    summary: '방문예약',
    memo: '연락처 재확인 필요'
  },
  {
    id: 105,
    type: 'PICKUP',
    name: '아메리카노',
    time: '19:00',
    status: '픽업예정',
    summary: '커피 세트',
    memo: '차갑게 2잔'
  },
  {
    id: 106,
    type: 'DELIVERY',
    name: '파스타세트',
    time: '20:10',
    status: '배달중',
    summary: '파스타세트 외 3건',
    memo: '엘리베이터 앞 전달'
  }
]

const MENU_OPTIONS: PosMenuOption[] = [
  {
    key: 'TABLE',
    label: '테이블 현황'
  },
  {
    key: 'COOKING',
    label: '조리현황'
  },
  {
    key: 'ORDER_HISTORY',
    label: '주문현황'
  },
  {
    key: 'RESERVATION',
    label: '예약현황'
  },
  {
    key: 'SALES_HISTORY',
    label: '매출현황'
  }
]

const RESERVATION_SIDE_PATHS: Record<
  Extract<PosMenuKey, 'TABLE' | 'COOKING' | 'ORDER_HISTORY' | 'RESERVATION' | 'SALES_HISTORY'>,
  string
> = {
  TABLE: '/pos/table',
  COOKING: '/pos/cooking',
  ORDER_HISTORY: '/pos/orders',
  RESERVATION: '/pos/reservations',
  SALES_HISTORY: '/pos/table/stay-sales'
}

const CALENDAR_MONTH_DAYS = Array.from({ length: 31 }, (_, index) => index + 1)
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const CALENDAR_ITEMS_BY_DAY: ReservationDayData[] = [
  { date: 3, items: [STORE_RESERVATIONS[0], STORE_RESERVATIONS[1]] },
  { date: 4, items: [STORE_RESERVATIONS[2]] },
  { date: 10, items: [STORE_RESERVATIONS[3]] },
  { date: 12, items: [STORE_RESERVATIONS[4], STORE_RESERVATIONS[5]] }
]

const DAY_TO_ITEMS_MAP = CALENDAR_ITEMS_BY_DAY.reduce(
  (acc, record) => {
    acc[record.date] = record.items
    return acc
  },
  {} as Record<number, StoreReservationItem[]>
)

const formatReservationTypeLabel = (type: StoreReservationType) => {
  if (type === 'TABLE') {
    return '테이블예약'
  }

  if (type === 'PICKUP') {
    return '픽업예약'
  }

  return '배달예약'
}

export default function ReservationsPage() {
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const router = useRouter()
  const pathname = usePathname()
  const currentPathname = pathname ?? '/pos/reservations'
  const [selectedDay, setSelectedDay] = useState<number>(NOW_DAY)
  const [selectedMonth, setSelectedMonth] = useState<number>(NOW_MONTH)
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false)
  const [draftMonth, setDraftMonth] = useState<number>(NOW_MONTH)

  const reservationMonth = `${NOW_YEAR}년 ${selectedMonth}월`
  const selectedItems = useMemo(() => DAY_TO_ITEMS_MAP[selectedDay] ?? [], [selectedDay])

  const selectedDayLabel = `${selectedMonth}월 ${selectedDay}일`

  const activeMenu: Extract<
    PosMenuKey,
    'TABLE' | 'COOKING' | 'ORDER_HISTORY' | 'RESERVATION' | 'SALES_HISTORY'
  > = currentPathname === '/pos/reservations'
    ? 'RESERVATION'
    : 'TABLE'

  const handleChangeMenu = (menu: PosMenuKey) => {
    if (menu === 'RESERVATION') {
      return
    }

    if (menu === 'MENU_MANAGE') {
      router.push('/pos/table/settings')
      return
    }

    if (
      menu === 'TABLE' ||
      menu === 'COOKING' ||
      menu === 'ORDER_HISTORY' ||
      menu === 'SALES_HISTORY'
    ) {
      router.push(RESERVATION_SIDE_PATHS[menu])
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
    setSelectedDay(Math.min(NOW_DAY, 31))
    setSelectedMonth(NOW_MONTH)
  }

  const handleMoveToThisMonth = () => {
    setSelectedMonth(NOW_MONTH)
    setSelectedDay(NOW_DAY)
  }

  const handleOpenCalendarSelect = () => {
    setDraftMonth(selectedMonth)
    setIsCalendarOpen(true)
  }

  const handleSelectDay = (day: number) => {
    setSelectedDay(day)
    setIsCalendarOpen(false)
  }

  const handleApplyCalendar = () => {
    setSelectedMonth(draftMonth)
    const nextMonthStart = draftMonth === NOW_MONTH ? NOW_DAY : 1
    setSelectedDay(Math.min(nextMonthStart, 31))
    setIsCalendarOpen(false)
  }

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
              menuOptions={TABLE_POS_SIDEBAR_MENUS}
              className={styles.sidebar}
            />

            <main className={styles.main}>
              <section className={styles.leftPanel}>
                <p className={styles.pageDescription}>
                  방문 / 픽업 / 배달 예약 현황과 유형별 건수를 확인합니다.
                </p>

                <h1 className={styles.pageTitle}>예약현황</h1>

                <div className={styles.dayNotice}>
                  <h2 className={styles.dayTitle}>{selectedDayLabel} 예약 리스트</h2>
                  <p className={styles.dayCount}>
                    총 {selectedItems.length}건
                  </p>
                </div>

                <div className={styles.reservationList}>
                  {selectedItems.length === 0 ? (
                    <p className={styles.emptyText}>선택한 날짜의 예약이 없습니다.</p>
                  ) : (
                    selectedItems.map((item) => (
                      <article key={item.id} className={styles.reservationCard}>
                        <div className={styles.reservationCardHeader}>
                          <strong>{formatReservationTypeLabel(item.type)}</strong>
                          <span className={styles.cardTime}>{item.time}</span>
                        </div>

                        <p className={styles.cardNameRow}>
                          {item.name}
                        </p>

                        <p className={styles.cardSummaryRow}>
                          {item.summary}
                        </p>

                        <p className={styles.cardStatusRow}>
                          상태: {item.status}
                        </p>

                        <p className={styles.cardMemoRow}>메모: {item.memo}</p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </main>

            <aside className={styles.rightPanel} aria-label="월간 예약 캘린더">
              <div className={styles.calendarCard}>
                <div className={styles.calendarHeader}>
                  <h2>{reservationMonth} 캘린더</h2>
                  <button
                    type="button"
                    className={styles.calendarSelectButton}
                    onClick={handleOpenCalendarSelect}
                  >
                    캘린더 선택
                  </button>
                </div>

                <div className={styles.calendarTools}>
                  <button type="button" onClick={handleMoveToToday}>오늘</button>
                  <button type="button" onClick={handleMoveToThisMonth}>이번달</button>
                </div>

                <div className={styles.calendarWeekRow}>
                  {DAY_LABELS.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className={styles.calendarGrid}>
                  {CALENDAR_MONTH_DAYS.map((day) => {
                    const items = DAY_TO_ITEMS_MAP[day] ?? []
                    const isSelected = day === selectedDay

                    return (
                      <button
                        key={day}
                        type="button"
                        className={`${styles.calendarCell} ${isSelected ? styles.calendarCellActive : ''}`}
                        onClick={() => handleSelectDay(day)}
                      >
                        <span className={styles.calendarCellDate}>{day}</span>
                        <span className={styles.calendarCellCount}>
                          {items.length > 0 ? `예약 ${items.length}건` : '없음'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </aside>
          </div>
        </div>

        {isCalendarOpen ? (
          <div className={styles.modalBackdrop} role="presentation" onClick={() => setIsCalendarOpen(false)}>
            <div className={styles.modalPanel} role="dialog" onClick={(event) => event.stopPropagation()}>
              <h3 className={styles.modalTitle}>캘린더 선택</h3>
              <p className={styles.modalDescription}>
                월을 선택하면 해당 월로 이동합니다.
              </p>

              <div className={styles.monthButtonGrid}>
                {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                  <button
                    key={month}
                    type="button"
                    className={`${styles.monthButton} ${draftMonth === month ? styles.monthButtonActive : ''}`}
                    onClick={() => setDraftMonth(month)}
                  >
                    {month}월
                  </button>
                ))}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalSecondaryButton}
                  onClick={() => setIsCalendarOpen(false)}
                >
                  닫기
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
