'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import PosSidebar from '../../../components/PosSidebar'
import PosTopbar from '../../../components/PosTopbar'
import { usePosKeyboardMode } from '../../../components/PosKeyboardModeContext'
import { POS_ROOM_MENUS, PosMenuKey } from '../../../components/posTypes'
import styles from '../RoomManagementPage.module.css'

type ManageStatus =
  | 'CHECKOUT_PENDING'
  | 'CLEAN_WAITING'
  | 'CLEANING'
  | 'MAINTENANCE'
  | 'CLEAN_DONE'

type ManageFilter = 'ALL' | ManageStatus

type ManageRoomItem = {
  id: number
  roomName: string
  status: ManageStatus
  checkOutTime?: string
  assignee?: string
  memo: string
}

const FILTER_ITEMS: Array<{ key: ManageFilter; label: string }> = [
  { key: 'ALL', label: '전체' },
  { key: 'CHECKOUT_PENDING', label: '체크아웃' },
  { key: 'CLEAN_WAITING', label: '청소대기' },
  { key: 'CLEANING', label: '청소중' },
  { key: 'MAINTENANCE', label: '점검필요' },
  { key: 'CLEAN_DONE', label: '완료' }
]

const STATUS_LABEL: Record<ManageStatus, string> = {
  CHECKOUT_PENDING: '체크아웃',
  CLEAN_WAITING: '청소대기',
  CLEANING: '청소중',
  MAINTENANCE: '점검필요',
  CLEAN_DONE: '완료'
}

const INITIAL_ITEMS: ManageRoomItem[] = [
  {
    id: 1,
    roomName: '객실 201',
    status: 'CLEAN_WAITING',
    checkOutTime: '11:00',
    memo: '수건 추가 확인'
  },
  {
    id: 2,
    roomName: '객실 305',
    status: 'CLEANING',
    assignee: '미배정',
    memo: '욕실 점검 필요'
  },
  {
    id: 3,
    roomName: '객실 102',
    status: 'MAINTENANCE',
    memo: 'TV 리모컨 없음'
  },
  {
    id: 4,
    roomName: '객실 408',
    status: 'CHECKOUT_PENDING',
    checkOutTime: '13:30',
    memo: '체크아웃 확인 필요'
  },
  {
    id: 5,
    roomName: '객실 120',
    status: 'CLEAN_DONE',
    memo: '청소 및 비품 세팅 완료'
  }
]

export default function RoomManagementPage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const [activeMenu, setActiveMenu] = useState<PosMenuKey>('COOKING')
  const [activeFilter, setActiveFilter] = useState<ManageFilter>('ALL')
  const [items, setItems] = useState<ManageRoomItem[]>(INITIAL_ITEMS)

  const filteredItems = useMemo(() => {
    if (activeFilter === 'ALL') {
      return items
    }
    return items.filter((item) => item.status === activeFilter)
  }, [activeFilter, items])

  const summary = useMemo(() => {
    return {
      total: items.length,
      checkout: items.filter((item) => item.status === 'CHECKOUT_PENDING').length,
      cleanWaiting: items.filter((item) => item.status === 'CLEAN_WAITING').length,
      cleaning: items.filter((item) => item.status === 'CLEANING').length,
      maintenance: items.filter((item) => item.status === 'MAINTENANCE').length,
      done: items.filter((item) => item.status === 'CLEAN_DONE').length
    }
  }, [items])

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

    if (menu === 'TABLE') {
      router.push('/pos/rooms/table')
      return
    }

    if (menu === 'RESERVATION') {
      router.push('/pos/rooms/reservations')
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

  const handleStartCleaning = (id: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'CLEANING' } : item))
    )
  }

  const handleCompleteCleaning = (id: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'CLEAN_DONE' } : item))
    )
  }

  const handleReportIssue = (id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'MAINTENANCE',
              memo: item.memo ? `${item.memo} / 문제 보고됨` : '문제 보고됨'
            }
          : item
      )
    )
  }

  const handleConfirm = (id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'CLEAN_DONE',
              memo: item.memo ? `${item.memo} / 확인 완료` : '확인 완료'
            }
          : item
      )
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.posShell}>
        <div className={styles.topbarWrap}>
          <div className={styles.topbarInner}>
            <PosTopbar
              title="객실관리"
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
              <section className={styles.filterRow} aria-label="객실관리 상태 필터">
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
              </section>

              <section className={styles.listScroll}>
                {filteredItems.length === 0 ? (
                  <article className={styles.emptyState}>
                    <strong className={styles.emptyStateTitle}>
                      처리할 객실 관리 항목이 없습니다.
                    </strong>
                    <p className={styles.emptyStateDescription}>
                      체크아웃 또는 청소/점검 상태의 객실이 생기면 이곳에 표시됩니다.
                    </p>
                  </article>
                ) : (
                  <div className={styles.listGrid}>
                    {filteredItems.map((item) => (
                      <article key={item.id} className={styles.roomCard}>
                        <div className={styles.cardTop}>
                          <strong className={styles.roomName}>{item.roomName}</strong>
                          <span className={`${styles.statusBadge} ${styles[`status${item.status}`]}`}>
                            {STATUS_LABEL[item.status]}
                          </span>
                        </div>

                        <div className={styles.cardMeta}>
                          {item.checkOutTime ? <span>체크아웃: {item.checkOutTime}</span> : null}
                          {item.assignee ? <span>담당자: {item.assignee}</span> : null}
                        </div>

                        <p className={styles.memoText}>메모: {item.memo}</p>

                        <div className={styles.cardActions}>
                          {item.status === 'CLEAN_WAITING' ? (
                            <button type="button" className={styles.actionPrimary} onClick={() => handleStartCleaning(item.id)}>
                              청소 시작
                            </button>
                          ) : null}

                          {item.status === 'CLEANING' ? (
                            <>
                              <button type="button" className={styles.actionPrimary} onClick={() => handleCompleteCleaning(item.id)}>
                                청소 완료
                              </button>
                              <button type="button" className={styles.actionSecondary} onClick={() => handleReportIssue(item.id)}>
                                문제 보고
                              </button>
                            </>
                          ) : null}

                          {item.status === 'MAINTENANCE' ? (
                            <button type="button" className={styles.actionSecondary} onClick={() => handleConfirm(item.id)}>
                              확인
                            </button>
                          ) : null}

                          {item.status === 'CHECKOUT_PENDING' ? (
                            <button type="button" className={styles.actionSecondary} onClick={() => handleStartCleaning(item.id)}>
                              청소 시작
                            </button>
                          ) : null}

                          {item.status === 'CLEAN_DONE' ? (
                            <button type="button" className={styles.actionSecondary} disabled>
                              완료됨
                            </button>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </main>

            <aside className={styles.summaryPanel}>
              <div className={styles.summaryCard}>
                <h2 className={styles.summaryTitle}>관리 요약</h2>
                <div className={styles.summaryList}>
                  <div className={styles.summaryRow}><span>전체</span><strong>{summary.total}건</strong></div>
                  <div className={styles.summaryRow}><span>체크아웃</span><strong>{summary.checkout}건</strong></div>
                  <div className={styles.summaryRow}><span>청소대기</span><strong>{summary.cleanWaiting}건</strong></div>
                  <div className={styles.summaryRow}><span>청소중</span><strong>{summary.cleaning}건</strong></div>
                  <div className={styles.summaryRow}><span>점검필요</span><strong>{summary.maintenance}건</strong></div>
                  <div className={styles.summaryRow}><span>완료</span><strong>{summary.done}건</strong></div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className={styles.footerWrap}>
          <div className={styles.footerInner}>
            <strong className={styles.footerText}>객실관리 대상: {summary.total}건</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
