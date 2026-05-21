'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import styles from './ReservationsPage.module.css'
import { usePosKeyboardMode } from '../../components/PosKeyboardModeContext'
import PosHeaderMenuBar from '../../components/PosHeaderMenuBar'
import PosTopbar from '../../components/PosTopbar'
import {
  TABLE_POS_SIDEBAR_MENUS,
  TABLE_POS_SIDEBAR_PATHS
} from '../../components/tablePosMenuConfig'
import { PosMenuKey } from '../../components/posTypes'

type ReservationStatusGroup = 'TODAY' | 'WAITING' | 'COMPLETED' | 'CANCELED'
type ReservationType = 'TABLE' | 'PICKUP' | 'DELIVERY'

type ReservationItem = {
  id: number
  customerName: string
  reservationAt: string
  reservationType: ReservationType
  status: ReservationStatusGroup
  summary: string
  memo: string
}

const MOCK_RESERVATIONS: ReservationItem[] = [
  {
    id: 1,
    customerName: '김민수',
    reservationAt: '오늘 18:00',
    reservationType: 'TABLE',
    status: 'TODAY',
    summary: '4인 테이블 예약',
    memo: '창가 좌석 요청'
  },
  {
    id: 2,
    customerName: '박수진',
    reservationAt: '오늘 18:30',
    reservationType: 'PICKUP',
    status: 'WAITING',
    summary: '픽업 2건',
    memo: '포장 완료 2건'
  },
  {
    id: 3,
    customerName: '이재훈',
    reservationAt: '오늘 19:00',
    reservationType: 'DELIVERY',
    status: 'WAITING',
    summary: '배달 1건',
    memo: '문앞 요청'
  },
  {
    id: 4,
    customerName: '정유리',
    reservationAt: '오늘 17:20',
    reservationType: 'TABLE',
    status: 'COMPLETED',
    summary: '2인 테이블 예약 완료',
    memo: '결제 완료'
  },
  {
    id: 5,
    customerName: '최지우',
    reservationAt: '오늘 16:40',
    reservationType: 'DELIVERY',
    status: 'CANCELED',
    summary: '배달 예약 취소',
    memo: '고객 요청 취소'
  }
]

const RESERVATION_STATUS_META: Array<{
  key: ReservationStatusGroup
  title: string
  actionDescription: string
}> = [
  { key: 'TODAY', title: '금일예약', actionDescription: '오늘 예약 목록 확인' },
  { key: 'WAITING', title: '예약대기', actionDescription: '대기중인 예약 확인' },
  { key: 'COMPLETED', title: '완료', actionDescription: '완료된 예약 확인' },
  { key: 'CANCELED', title: '취소', actionDescription: '취소된 예약 확인' }
]

const RESERVATION_TYPE_LABEL: Record<ReservationType, string> = {
  TABLE: '테이블 예약',
  PICKUP: '픽업 예약',
  DELIVERY: '배달 예약'
}

const RESTAURANT_SIDE_MENU_PATHS = TABLE_POS_SIDEBAR_PATHS

export default function ReservationsPage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const activeMenu: PosMenuKey = 'RESERVATION'

  const [selectedReservationModal, setSelectedReservationModal] =
    useState<ReservationStatusGroup | null>(null)
  const [selectedReservationId, setSelectedReservationId] =
    useState<number | null>(null)

  const reservationCounts = useMemo(() => {
    const map: Record<ReservationStatusGroup, number> = {
      TODAY: 0,
      WAITING: 0,
      COMPLETED: 0,
      CANCELED: 0
    }

    for (const item of MOCK_RESERVATIONS) {
      map[item.status] += 1
    }

    return map
  }, [])

  const selectedReservations = useMemo(() => {
    if (!selectedReservationModal) {
      return []
    }
    return MOCK_RESERVATIONS.filter((item) => item.status === selectedReservationModal)
  }, [selectedReservationModal])

  const selectedReservationDetail = useMemo(() => {
    if (!selectedReservationId) {
      return null
    }
    return MOCK_RESERVATIONS.find((item) => item.id === selectedReservationId) ?? null
  }, [selectedReservationId])

  const handleChangeMenu = (menu: PosMenuKey) => {
    if (menu === 'RESERVATION') {
      return
    }

    if (
      menu === 'TABLE' ||
      menu === 'COOKING' ||
      menu === 'ORDER_HISTORY' ||
      menu === 'SALES_HISTORY' ||
      menu === 'MENU_MANAGE'
    ) {
      router.push(RESTAURANT_SIDE_MENU_PATHS[menu])
    }
  }

  const handleGoPosHome = () => router.push('/pos')
  const handleOpenPosSettings = () => router.push('/pos/settings')
  const handleGoMyPage = () => router.push('/profile')

  const handleOpenReservationModal = (status: ReservationStatusGroup) => {
    setSelectedReservationModal(status)
    setSelectedReservationId(null)
  }

  const handleCloseReservationModal = () => {
    setSelectedReservationModal(null)
    setSelectedReservationId(null)
  }

  const currentModalMeta =
    RESERVATION_STATUS_META.find((item) => item.key === selectedReservationModal) ?? null

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
            <main className={styles.main}>
              <PosHeaderMenuBar
                activeMenu={activeMenu}
                onChangeMenu={handleChangeMenu}
                menuOptions={TABLE_POS_SIDEBAR_MENUS}
              />

              <div className={styles.menuScrollArea}>
                <section className={styles.dashboardPanel}>
                  <article className={styles.dashboardHero}>
                    <div>
                      <p className={styles.dashboardEyebrow}>요식업 POS 예약현황</p>
                      <h1 className={styles.dashboardTitle}>오늘 예약 운영 현황</h1>
                      <p className={styles.dashboardDescription}>
                        오늘 예약 상태를 확인하고 금일예약/예약대기/완료/취소 목록을 빠르게 확인합니다.
                      </p>
                    </div>
                  </article>

                  <section className={styles.dashboardSummaryGrid}>
                    {RESERVATION_STATUS_META.map((statusMeta) => (
                      <button
                        key={statusMeta.key}
                        type="button"
                        className={styles.dashboardSummaryCard}
                        onClick={() => handleOpenReservationModal(statusMeta.key)}
                      >
                        <span className={styles.dashboardSummaryLabel}>{statusMeta.title}</span>
                        <strong className={styles.dashboardSummaryValue}>
                          {reservationCounts[statusMeta.key]}건
                        </strong>
                        <small className={styles.dashboardSummaryHint}>
                          {statusMeta.actionDescription}
                        </small>
                      </button>
                    ))}
                  </section>
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>

      {currentModalMeta ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalPanel}>
            <header className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>{currentModalMeta.title}</h2>
                <p className={styles.modalDescription}>해당 상태의 예약 목록을 확인합니다.</p>
              </div>
              <button
                type="button"
                className={styles.modalCloseButtonText}
                onClick={handleCloseReservationModal}
              >
                닫기
              </button>
            </header>

            <div className={styles.modalBody}>
              <section className={styles.ordersPanel} aria-label="예약 목록">
                <div className={styles.panelHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>{currentModalMeta.title}</h2>
                    <p className={styles.panelDescription}>예약 상태별 목록입니다.</p>
                  </div>
                </div>

                <div className={styles.orderList}>
                  {selectedReservations.length < 1 ? (
                    <div className={styles.emptyState}>현재 표시할 예약이 없습니다.</div>
                  ) : (
                    selectedReservations.map((item) => (
                      <article
                        key={item.id}
                        className={
                          selectedReservationId === item.id
                            ? styles.orderCardSelected
                            : styles.orderCard
                        }
                      >
                        <div className={styles.orderCardHeader}>
                          <div>
                            <strong className={styles.orderNo}>예약 #{item.id}</strong>
                            <p className={styles.orderSummary}>{item.summary}</p>
                          </div>
                          <span className={styles.statusBadge}>{currentModalMeta.title}</span>
                        </div>

                        <div className={styles.orderMetaGrid}>
                          <div className={styles.orderMetaItem}>
                            <span className={styles.orderMetaLabel}>유형</span>
                            <strong className={styles.orderMetaValue}>
                              {RESERVATION_TYPE_LABEL[item.reservationType]}
                            </strong>
                          </div>
                          <div className={styles.orderMetaItem}>
                            <span className={styles.orderMetaLabel}>고객명</span>
                            <strong className={styles.orderMetaValue}>{item.customerName}</strong>
                          </div>
                          <div className={styles.orderMetaItem}>
                            <span className={styles.orderMetaLabel}>예약시간</span>
                            <strong className={styles.orderMetaValue}>{item.reservationAt}</strong>
                          </div>
                          <div className={styles.orderMetaItem}>
                            <span className={styles.orderMetaLabel}>메모</span>
                            <strong className={styles.orderMetaValue}>{item.memo}</strong>
                          </div>
                        </div>

                        <div className={styles.orderActions}>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => setSelectedReservationId(item.id)}
                          >
                            예약상세확인
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <aside className={styles.detailPanel} aria-label="예약 상세">
                <h2 className={styles.detailTitle}>예약안내</h2>
                {selectedReservationDetail ? (
                  <div className={styles.detailBody}>
                    <div className={styles.detailHeader}>
                      <strong className={styles.detailOrderNo}>
                        예약 #{selectedReservationDetail.id}
                      </strong>
                      <span className={styles.statusBadge}>{currentModalMeta.title}</span>
                    </div>
                    <div className={styles.detailList}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>고객명</span>
                        <strong className={styles.detailValue}>{selectedReservationDetail.customerName}</strong>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>유형</span>
                        <strong className={styles.detailValue}>
                          {RESERVATION_TYPE_LABEL[selectedReservationDetail.reservationType]}
                        </strong>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>예약시간</span>
                        <strong className={styles.detailValue}>{selectedReservationDetail.reservationAt}</strong>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>요약</span>
                        <strong className={styles.detailValue}>{selectedReservationDetail.summary}</strong>
                      </div>
                    </div>
                    <div className={styles.memoBox}>
                      <span className={styles.memoLabel}>요청 메모</span>
                      <p className={styles.memoText}>{selectedReservationDetail.memo}</p>
                    </div>
                  </div>
                ) : (
                  <div className={styles.detailEmpty}>
                    <strong className={styles.detailEmptyTitle}>예약을 선택하세요.</strong>
                    <p className={styles.detailEmptyText}>
                      예약 목록에서 예약을 선택하면 상세 정보를 확인할 수 있습니다.
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
