'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import styles from './CookingPage.module.css'

import { usePosKeyboardMode } from '../../pos/components/PosKeyboardModeContext'
import PosHeaderMenuBar from '../../pos/components/PosHeaderMenuBar'
import PosTopbar from '../../pos/components/PosTopbar'
import {
  TABLE_POS_SIDEBAR_MENUS,
  TABLE_POS_SIDEBAR_PATHS
} from '../../pos/components/tablePosMenuConfig'
import {
  PosCookingStatus,
  PosCookingTicket,
  PosMenuKey
} from '../../pos/components/posTypes'
import { getMe } from '@/lib/authApi'
import {
  getPosCookingTickets,
  mapCookingTicketDto,
  updatePosCookingStatus
} from '@/lib/business/pos/posCookingApi'

type CookingSectionKey = PosCookingStatus

type BusinessContext = {
  profileId: number
  channelCode: string
}

type CookingTicketGroup = {
  groupKey: string
  orderLabel: string
  status: PosCookingStatus
  orderedAt: string
  cookingCompletedAt: string
  elapsedMinutes: number
  tickets: PosCookingTicket[]
}

const cookingSections: Array<{
  key: CookingSectionKey
  title: string
  badgeText: string
}> = [
  {
    key: 'WAITING',
    title: '조리대기',
    badgeText: '대기(준비)'
  },
  {
    key: 'COOKING',
    title: '조리중',
    badgeText: '조리중'
  },
  {
    key: 'DONE',
    title: '종료',
    badgeText: '완료'
  }
]

const RESTAURANT_SIDE_MENU_PATHS = TABLE_POS_SIDEBAR_PATHS

export default function PosCookingPage() {
  const router = useRouter()
  const {
    keyboardMode,
    toggleKeyboardMode
  } = usePosKeyboardMode()
  const activeMenu: PosMenuKey = 'COOKING'
  const [tickets, setTickets] = useState<PosCookingTicket[]>([])
  const [selectedCookingModal, setSelectedCookingModal] = useState<CookingSectionKey | null>(null)
  const [businessContext, setBusinessContext] = useState<BusinessContext | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isStatusUpdating, setIsStatusUpdating] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [elapsedTick, setElapsedTick] = useState<number>(Date.now())

  const groupedTicketsBySection = useMemo(() => {
    const groupByStatusAndOrder = (
      status: PosCookingStatus
    ): CookingTicketGroup[] => {
      const groupMap = new Map<string, PosCookingTicket[]>()

      for (const ticket of tickets) {
        if (ticket.status !== status) {
          continue
        }

        const key = ticket.orderLabel
        const current = groupMap.get(key) ?? []
        current.push(ticket)
        groupMap.set(key, current)
      }

      return Array.from(groupMap.entries()).map(([orderLabel, grouped]) => {
        const orderedAt = grouped
          .map((ticket) => String(ticket.orderedAt ?? '').trim())
          .filter((value) => value.length > 0 && value !== '-')
          .sort()[0] ?? '-'
        const cookingCompletedAt = grouped
          .map((ticket) => String(ticket.cookingCompletedAt ?? '').trim())
          .filter((value) => value.length > 0)
          .sort()
          .at(-1) ?? '-'

        const elapsedMinutes = grouped.reduce((maxValue, ticket) => {
          return Math.max(maxValue, Number(ticket.elapsedMinutes ?? 0))
        }, 0)

        return {
          groupKey: `${status}:${orderLabel}`,
          orderLabel,
          status,
          orderedAt,
          cookingCompletedAt,
          elapsedMinutes,
          tickets: grouped
        }
      })
    }

    return {
      WAITING: groupByStatusAndOrder('WAITING'),
      COOKING: groupByStatusAndOrder('COOKING'),
      DONE: groupByStatusAndOrder('DONE')
    }
  }, [tickets])

  const waitingCount = groupedTicketsBySection.WAITING.length
  const cookingCount = groupedTicketsBySection.COOKING.length
  const doneCount = groupedTicketsBySection.DONE.length

  const loadCookingTickets = useCallback(async (context: BusinessContext) => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const response = await getPosCookingTickets({
        profileId: context.profileId,
        channelCode: context.channelCode,
        cookingStatus: 'ALL',
        isActive: 1
      })

      const nextTickets: PosCookingTicket[] = (response.tickets ?? [])
        .map((ticket) => mapCookingTicketDto(ticket))
        .map((ticket): PosCookingTicket | null => {
          if (
            ticket.status !== 'WAITING' &&
            ticket.status !== 'COOKING' &&
            ticket.status !== 'DONE'
          ) {
            return null
          }

          return {
            id: String(ticket.id),
            orderLabel: ticket.orderLabel,
            menuName: ticket.menuName,
            quantity: Number(ticket.quantity ?? 0),
            optionText: ticket.optionText,
            requestText: ticket.requestText,
            orderedAt: ticket.orderedAt ?? '-',
            cookingCompletedAt: ticket.cookingCompletedAt ?? '',
            elapsedMinutes: ticket.elapsedMinutes ?? 0,
            status: ticket.status
          }
        })
        .filter((ticket): ticket is PosCookingTicket => ticket !== null)

      setTickets(nextTickets)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '조리현황 데이터를 불러오지 못했습니다.'
      setLoadError(message)
      setTickets([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setElapsedTick(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      try {
        const me = await getMe()
        const user = me.user

        if (!isMounted || user.profileType !== 'BUSINESS') {
          return
        }

        const context: BusinessContext = {
          profileId: Number(user.profileId),
          channelCode: String(user.channelCode)
        }

        setBusinessContext(context)
        await loadCookingTickets(context)
      } catch (error) {
        if (!isMounted) {
          return
        }
        const message =
          error instanceof Error
            ? error.message
            : 'BUSINESS 컨텍스트를 확인하지 못했습니다.'
        setLoadError(message)
      }
    }

    void initialize()

    return () => {
      isMounted = false
    }
  }, [loadCookingTickets])

  const handleChangeMenu = (menu: PosMenuKey) => {
    if (menu === 'COOKING') {
      return
    }

    if (
      menu === 'TABLE' ||
      menu === 'ORDER_HISTORY' ||
      menu === 'RESERVATION' ||
      menu === 'SALES_HISTORY' ||
      menu === 'MENU_MANAGE'
    ) {
      router.push(RESTAURANT_SIDE_MENU_PATHS[menu])
      return
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

  const handleMoveCookingStatus = (
    group: CookingTicketGroup,
    nextStatus: PosCookingStatus
  ) => {
    if (!businessContext || isStatusUpdating) {
      return
    }

    if (group.tickets.length < 1) {
      return
    }

    void (async () => {
      try {
        setIsStatusUpdating(true)
        await Promise.all(
          group.tickets.map(async (ticket) => {
            const ticketIdNumber = Number.parseInt(ticket.id, 10)
            if (!Number.isFinite(ticketIdNumber) || ticketIdNumber <= 0) {
              return
            }

            await updatePosCookingStatus(
              ticketIdNumber,
              {
                profileId: businessContext.profileId,
                channelCode: businessContext.channelCode,
                cookingStatus: nextStatus
              }
            )
          })
        )
        await loadCookingTickets(businessContext)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : '조리 상태 변경에 실패했습니다.'
        setLoadError(message)
      } finally {
        setIsStatusUpdating(false)
      }
    })()
  }

  const handleOpenCookingModal = (status: CookingSectionKey) => {
    setSelectedCookingModal(status)
  }

  const handleCloseCookingModal = () => {
    setSelectedCookingModal(null)
  }

  const selectedModalSection = selectedCookingModal
    ? cookingSections.find((section) => section.key === selectedCookingModal) ?? null
    : null

  const selectedModalGroups = selectedCookingModal
    ? groupedTicketsBySection[selectedCookingModal]
    : []

  return (
    <div className={styles.page}>
      <div className={styles.posShell}>
        <div className={styles.topbarWrap}>
          <div className={styles.topbarInner}>
            <PosTopbar
              title="조리현황"
              onHomeClick={handleGoPosHome}
              onSettingsClick={handleOpenPosSettings}
              onMyPageClick={handleGoMyPage}
              syncStatus="ONLINE"
              keyboardMode={keyboardMode}
              onToggleKeyboardMode={toggleKeyboardMode}
            />
          </div>
        </div>

        <div className={styles.mainViewport}>
          <div className={`${styles.mainGrid} ${styles.cookingPageGrid}`}>
            <main className={styles.main}>
              <PosHeaderMenuBar
                activeMenu={activeMenu}
                onChangeMenu={handleChangeMenu}
                menuOptions={TABLE_POS_SIDEBAR_MENUS}
              />

              {loadError ? (
                <p className={styles.description}>{loadError}</p>
              ) : null}

              <div className={styles.menuScrollArea}>
                <section className={styles.posDashboardPanel}>
                  <article className={styles.posDashboardHero}>
                    <div>
                      <p className={styles.posDashboardEyebrow}>요식업 POS 조리현황</p>
                      <h1 className={styles.posDashboardTitle}>오늘 조리 운영 현황</h1>
                      <p className={styles.posDashboardDescription}>
                        주문 상태별 조리 흐름을 확인하고 대기/조리중/종료 목록을 빠르게 확인합니다.
                      </p>
                    </div>
                  </article>

                  <section className={styles.posDashboardSummaryGrid}>
                    <button
                      type="button"
                      className={`${styles.posDashboardSummaryCard} ${styles.posDashboardSummaryCardClickable}`}
                      onClick={() => handleOpenCookingModal('WAITING')}
                    >
                      <span className={styles.posDashboardSummaryLabel}>조리대기</span>
                      <strong className={styles.posDashboardSummaryValue}>{waitingCount}건</strong>
                      <small className={styles.posDashboardSummaryHint}>대기 주문 확인</small>
                    </button>
                    <button
                      type="button"
                      className={`${styles.posDashboardSummaryCard} ${styles.posDashboardSummaryCardClickable}`}
                      onClick={() => handleOpenCookingModal('COOKING')}
                    >
                      <span className={styles.posDashboardSummaryLabel}>조리중</span>
                      <strong className={styles.posDashboardSummaryValue}>{cookingCount}건</strong>
                      <small className={styles.posDashboardSummaryHint}>진행 주문 확인</small>
                    </button>
                    <button
                      type="button"
                      className={`${styles.posDashboardSummaryCard} ${styles.posDashboardSummaryCardClickable}`}
                      onClick={() => handleOpenCookingModal('DONE')}
                    >
                      <span className={styles.posDashboardSummaryLabel}>종료</span>
                      <strong className={styles.posDashboardSummaryValue}>{doneCount}건</strong>
                      <small className={styles.posDashboardSummaryHint}>완료 주문 확인</small>
                    </button>
                  </section>
                </section>
              </div>
            </main>

          </div>
        </div>
      </div>

      {selectedModalSection ? (
        <div className={styles.cookingStatusModalOverlay} role="dialog" aria-modal="true">
          <div className={styles.cookingStatusModalPanel}>
            <header className={styles.cookingStatusModalHeader}>
              <div>
                <div className={styles.cookingStatusModalTitleRow}>
                  <h2 className={styles.cookingStatusModalTitle}>{selectedModalSection.title}</h2>
                  <span className={styles.cookingStatusModalCountBadge}>
                    {selectedModalGroups.length}
                  </span>
                </div>
                <p className={styles.cookingStatusModalDescription}>
                  해당 상태의 주문 목록을 확인합니다.
                </p>
              </div>
              <button
                type="button"
                className={`${styles.tableStatusModalCloseButton} ${styles.tableStatusModalCloseButtonText}`}
                onClick={handleCloseCookingModal}
              >
                닫기
              </button>
            </header>

            <div className={styles.cookingStatusModalBody}>
              <section className={styles.cookingSection}>
                <div className={styles.cookingSectionList}>
                  {isLoading ? (
                    <div className={styles.emptyStateBox}>
                      <h3 className={styles.emptyStateTitle}>조리현황을 불러오는 중입니다.</h3>
                      <p className={styles.emptyStateText}>잠시만 기다려주세요.</p>
                    </div>
                  ) : selectedModalGroups.length > 0 ? (
                    selectedModalGroups.map((group) => {
                      const totalQuantity = group.tickets.reduce((sum, ticket) => {
                        return sum + Number(ticket.quantity ?? 0)
                      }, 0)
                      const firstMenu = group.tickets[0]?.menuName ?? '메뉴'
                      const extraMenuCount = Math.max(0, group.tickets.length - 1)
                      const menuSummary = extraMenuCount > 0
                        ? `${firstMenu} 외 ${extraMenuCount}건 x${totalQuantity}`
                        : `${firstMenu} x${totalQuantity}`

                      return (
                        <div key={group.groupKey} className={styles.cookingCard}>
                          <div className={styles.cookingCardTop}>
                            <strong className={styles.cookingOrderLabel}>
                              {group.orderLabel}
                            </strong>
                            <div className={styles.cookingBadgeGroup}>
                              <span
                                className={getCookingStatusBadgeClassName(
                                  group.status,
                                  styles
                                )}
                              >
                                {selectedModalSection.badgeText}
                              </span>
                              <span className={styles.cookingElapsed}>
                                {group.status === 'DONE'
                                  ? `소요 ${formatDoneDurationMmSs(group.orderedAt, group.cookingCompletedAt, group.elapsedMinutes)}`
                                  : `경과 ${formatElapsedMmSs(group.orderedAt, group.elapsedMinutes, elapsedTick)}`}
                              </span>
                            </div>
                          </div>

                          <p className={styles.cookingMenuName}>{menuSummary}</p>

                          <div className={styles.cookingMeta}>
                            <span>시작: {formatLocalDateTime(group.orderedAt)}</span>
                            <span>종료: {group.status === 'DONE' ? formatLocalDateTime(group.cookingCompletedAt) : '-'}</span>
                            <span>주문항목: {group.tickets.length}개</span>
                          </div>

                          {group.tickets.some((ticket) => Boolean(ticket.requestText)) ? (
                            <p className={styles.cookingRequest}>
                              요청사항이 포함되어 있습니다.
                            </p>
                          ) : null}

                          <div className={styles.cookingActionRow}>
                            {group.status === 'WAITING' ? (
                              <button
                                type="button"
                                className={styles.cookingActionButton}
                                onClick={() => handleMoveCookingStatus(group, 'COOKING')}
                                disabled={isStatusUpdating}
                              >
                                조리시작
                              </button>
                            ) : null}

                            {group.status === 'COOKING' ? (
                              <button
                                type="button"
                                className={styles.cookingActionButton}
                                onClick={() => handleMoveCookingStatus(group, 'DONE')}
                                disabled={isStatusUpdating}
                              >
                                조리완료
                              </button>
                            ) : null}

                            {group.status === 'DONE' ? (
                              <div className={styles.cookingCompletedBadge}>완료</div>
                            ) : null}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className={styles.emptyStateBox}>
                      <h3 className={styles.emptyStateTitle}>표시할 주문이 없습니다.</h3>
                      <p className={styles.emptyStateText}>
                        현재 상태에 해당하는 조리 항목이 없습니다.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

          </div>
        </div>
      ) : null}
    </div>
  )
}

function getCookingStatusBadgeClassName(
  status: PosCookingStatus,
  cssModule: Record<string, string>
) {
  if (status === 'WAITING') {
    return `${cssModule.cookingStatusBadge} ${cssModule.cookingStatusWaiting}`
  }

  if (status === 'COOKING') {
    return `${cssModule.cookingStatusBadge} ${cssModule.cookingStatusCooking}`
  }

  return `${cssModule.cookingStatusBadge} ${cssModule.cookingStatusDone}`
}

function formatElapsedMmSs(
  orderedAt: string | null,
  fallbackMinutes: number | null,
  currentTickMs?: number
): string {
  const nowMs = typeof currentTickMs === 'number' ? currentTickMs : Date.now()
  const orderedDate = parseDbUtcTimestamp(orderedAt)

  if (orderedDate) {
    const orderedMs = orderedDate.getTime()

    if (!Number.isNaN(orderedMs)) {
      const diffSeconds = Math.floor(Math.max(0, nowMs - orderedMs) / 1000)
      const minutes = Math.floor(diffSeconds / 60)
      const seconds = diffSeconds % 60

      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
  }

  const safeMinutes = Math.max(0, Number(fallbackMinutes ?? 0))
  return `${String(safeMinutes).padStart(2, '0')}:00`
}

function formatDoneDurationMmSs(
  orderedAt: string | null,
  completedAt: string | null,
  fallbackMinutes: number | null
): string {
  const orderedDate = parseDbUtcTimestamp(orderedAt)
  const completedDate = parseDbUtcTimestamp(completedAt)

  if (orderedDate && completedDate) {
    const diffSeconds = Math.floor(
      Math.max(0, completedDate.getTime() - orderedDate.getTime()) / 1000
    )
    const minutes = Math.floor(diffSeconds / 60)
    const seconds = diffSeconds % 60

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  if (!completedDate) {
    return '-'
  }

  const safeMinutes = Math.max(0, Number(fallbackMinutes ?? 0))
  return `${String(safeMinutes).padStart(2, '0')}:00`
}

function parseDbUtcTimestamp(value: string | null | undefined): Date | null {
  const rawValue = String(value ?? '').trim()

  if (!rawValue || rawValue === '-') {
    return null
  }

  const normalizedValue = rawValue.includes('T')
    ? rawValue
    : rawValue.replace(' ', 'T')

  const hasTimezone =
    normalizedValue.endsWith('Z') ||
    /[+-]\d{2}:\d{2}$/.test(normalizedValue)

  const date =
    new Date(hasTimezone ? normalizedValue : `${normalizedValue}Z`)

  return Number.isNaN(date.getTime()) ? null : date
}

function formatLocalDateTime(value: string | null | undefined): string {
  const date = parseDbUtcTimestamp(value)

  if (!date) {
    return '-'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date)
}
