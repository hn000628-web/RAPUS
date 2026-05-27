// FILE : frontend/app/(pos)/market_admin/events/page.tsx
// ROLE : MARKET EVENT MANAGEMENT PAGE

'use client'

// SECTION 01 : IMPORT
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'

import {
  createMarketEvent,
  fetchMarketEvents,
  updateMarketEvent,
  type MarketEventMaster,
  type MarketEventStatus,
  type MarketEventType,
  type MarketEventsResponse
} from '@/lib/market-events-api'
import { usePosKeyboardMode } from '../../pos/components/PosKeyboardModeContext'
import PosTopbar from '../../pos/components/PosTopbar'
import styles from './market-events.module.css'

// SECTION 02 : TYPE
type EventFormState = {
  eventCode: string
  eventTitle: string
  eventDescription: string
  eventType: MarketEventType
  eventStatus: MarketEventStatus
  eventStartAt: string
  eventEndAt: string
}

type SummaryCard = {
  id: string
  label: string
  value: string
  description: string
}

// SECTION 03 : CONSTANT
const MARKET_CHANNEL_CODE = 'B8X7C6V5B4N3M'

const DEFAULT_EVENT_FORM: EventFormState = {
  eventCode: '',
  eventTitle: '',
  eventDescription: '',
  eventType: 'NORMAL',
  eventStatus: 'SCHEDULED',
  eventStartAt: '',
  eventEndAt: ''
}

const EVENT_TYPE_OPTIONS: Array<{
  value: MarketEventType
  label: string
}> = [
  { value: 'NORMAL', label: '일반' },
  { value: 'PROMOTION', label: '프로모션' },
  { value: 'SEASON', label: '시즌' },
  { value: 'CLEARANCE', label: '클리어런스' },
  { value: 'COUPON', label: '쿠폰' }
]

const EVENT_STATUS_OPTIONS: Array<{
  value: MarketEventStatus
  label: string
}> = [
  { value: 'SCHEDULED', label: '예정' },
  { value: 'ACTIVE', label: '진행중' },
  { value: 'ENDED', label: '종료' },
  { value: 'HIDDEN', label: '숨김' }
]

// SECTION 04 : STATE
export default function MarketEventsPage() {
  const router = useRouter()
  const {
    keyboardMode,
    toggleKeyboardMode
  } = usePosKeyboardMode()
  const [events, setEvents] = useState<MarketEventMaster[]>([])
  const [summary, setSummary] = useState<MarketEventsResponse['summary']>({
    totalEvents: 0,
    activeEvents: 0,
    scheduledEvents: 0,
    endedEvents: 0
  })
  const [formState, setFormState] = useState<EventFormState>(DEFAULT_EVENT_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // SECTION 05 : DATA
  const summaryCards = useMemo<SummaryCard[]>(() => {
    return [
      {
        id: 'total',
        label: '전체 행사',
        value: `${summary.totalEvents}개`,
        description: '등록된 행사 그룹'
      },
      {
        id: 'active',
        label: '진행중 행사',
        value: `${summary.activeEvents}개`,
        description: '현재 운영중인 행사'
      },
      {
        id: 'scheduled',
        label: '예정 행사',
        value: `${summary.scheduledEvents}개`,
        description: '시작 대기 행사'
      },
      {
        id: 'ended',
        label: '종료 행사',
        value: `${summary.endedEvents}개`,
        description: '종료된 행사 이력'
      }
    ]
  }, [summary])

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)

      const response = await fetchMarketEvents(MARKET_CHANNEL_CODE)

      setEvents(response.items)
      setSummary(response.summary)
    } catch (error) {
      console.error(error)
      setErrorMessage('행사 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  // SECTION 06 : EVENT
  const handleGoMarketHome = () => {
    router.push('/market_admin')
  }

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleOpenPosSettings = () => {
    router.push('/pos')
  }

  const handleChangeTextField = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const {
      name,
      value
    } = event.target

    setFormState((current) => ({
      ...current,
      [name]: value
    }))
  }

  const handleChangeSelectField = (event: ChangeEvent<HTMLSelectElement>) => {
    const {
      name,
      value
    } = event.target

    setFormState((current) => ({
      ...current,
      [name]: value
    }))
  }

  const handleCreateEvent = async () => {
    try {
      setIsCreating(true)
      setErrorMessage(null)

      await createMarketEvent({
        channelCode: MARKET_CHANNEL_CODE,
        eventCode: formState.eventCode,
        eventTitle: formState.eventTitle,
        eventDescription: formState.eventDescription || null,
        eventType: formState.eventType,
        eventStatus: formState.eventStatus,
        eventStartAt: formState.eventStartAt || null,
        eventEndAt: formState.eventEndAt || null
      })

      setFormState(DEFAULT_EVENT_FORM)
      await loadEvents()
    } catch (error) {
      console.error(error)
      setErrorMessage('행사를 생성하지 못했습니다. 행사코드와 필수값을 확인해 주세요.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEndEvent = async (eventItem: MarketEventMaster) => {
    try {
      setErrorMessage(null)

      await updateMarketEvent(eventItem.eventCode, {
        channelCode: MARKET_CHANNEL_CODE,
        eventStatus: 'ENDED'
      })

      await loadEvents()
    } catch (error) {
      console.error(error)
      setErrorMessage('행사 상태를 변경하지 못했습니다.')
    }
  }

  // SECTION 07 : UI
  const renderStatusBadge = (status: MarketEventStatus) => {
    const className = [
      styles.statusBadge,
      styles[`status${status}`]
    ].filter(Boolean).join(' ')

    return (
      <span className={className}>
        {status}
      </span>
    )
  }

  const renderEventPeriod = (eventItem: MarketEventMaster) => {
    if (!eventItem.eventStartAt && !eventItem.eventEndAt) {
      return '기간 미설정'
    }

    return `${eventItem.eventStartAt ?? '-'} ~ ${eventItem.eventEndAt ?? '-'}`
  }

  // SECTION 08 : RETURN
  return (
    <div className={styles.page}>
      <div className={styles.topbarWrap}>
        <div className={styles.topbarInner}>
          <PosTopbar
            title="MARKET 행사관리"
            onHomeClick={handleGoMarketHome}
            onSettingsClick={handleOpenPosSettings}
            onMyPageClick={handleGoMyPage}
            syncStatus="ONLINE"
            keyboardMode={keyboardMode}
            onToggleKeyboardMode={toggleKeyboardMode}
          />
        </div>
      </div>

      <main className={styles.main}>
        <section className={styles.operationHeader}>
          <div className={styles.headerCopy}>
            <div className={styles.headerBadgeRow}>
              <span className={styles.adminBadge}>EVENT MANAGEMENT</span>
              <span className={styles.statusBadge}>EVENT MASTER</span>
            </div>
            <h1 className={styles.title}>행사관리</h1>
            <p className={styles.headerDescription}>
              행사 그룹, 행사 기간, 연결 상품 상태를 eventCode 기준으로 관리합니다.
            </p>
            <div className={styles.metaGrid}>
              <span>채널 : {MARKET_CHANNEL_CODE}</span>
              <span>연결 기준 : market_products.eventCode</span>
            </div>
          </div>

          <div className={styles.quickActions}>
            <button
              type="button"
              className={styles.secondaryActionButton}
              onClick={handleGoMarketHome}
            >
              운영 허브
            </button>
            <button
              type="button"
              className={styles.primaryActionButton}
              onClick={handleCreateEvent}
              disabled={isCreating}
            >
              {isCreating ? '행사 생성 중...' : '행사 생성'}
            </button>
          </div>
        </section>

        <section className={styles.summaryGrid} aria-label="행사 요약">
          {summaryCards.map((card) => (
            <article key={card.id} className={styles.summaryCard}>
              <span className={styles.cardLabel}>{card.label}</span>
              <strong className={styles.cardValue}>{card.value}</strong>
              <p>{card.description}</p>
            </article>
          ))}
        </section>

        <section className={styles.formPanel}>
          <div>
            <h2 className={styles.sectionTitle}>행사 생성</h2>
            <p className={styles.sectionDescription}>
              12자리 행사코드를 기준으로 행사 마스터를 등록합니다.
            </p>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.formField}>
              <span>행사코드</span>
              <input
                name="eventCode"
                value={formState.eventCode}
                maxLength={12}
                placeholder="EV0000000001"
                onChange={handleChangeTextField}
              />
            </label>
            <label className={styles.formField}>
              <span>행사명</span>
              <input
                name="eventTitle"
                value={formState.eventTitle}
                placeholder="7월 라면 기획전"
                onChange={handleChangeTextField}
              />
            </label>
            <label className={styles.formField}>
              <span>행사 유형</span>
              <select
                name="eventType"
                value={formState.eventType}
                onChange={handleChangeSelectField}
              >
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.formField}>
              <span>상태</span>
              <select
                name="eventStatus"
                value={formState.eventStatus}
                onChange={handleChangeSelectField}
              >
                {EVENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.formField}>
              <span>시작일</span>
              <input
                type="date"
                name="eventStartAt"
                value={formState.eventStartAt}
                onChange={handleChangeTextField}
              />
            </label>
            <label className={styles.formField}>
              <span>종료일</span>
              <input
                type="date"
                name="eventEndAt"
                value={formState.eventEndAt}
                onChange={handleChangeTextField}
              />
            </label>
            <label className={styles.formFieldWide}>
              <span>설명</span>
              <textarea
                name="eventDescription"
                value={formState.eventDescription}
                rows={3}
                placeholder="행사 운영 메모를 입력하세요."
                onChange={handleChangeTextField}
              />
            </label>
          </div>
        </section>

        <section className={styles.eventPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.sectionTitle}>행사 목록</h2>
              <p className={styles.sectionDescription}>
                eventCode 기준으로 연결 상품 수와 배너 연결 여부를 확인합니다.
              </p>
            </div>
            <button type="button" className={styles.secondaryActionButton}>
              행사 업로드
            </button>
          </div>

          {errorMessage ? (
            <p className={styles.errorBox}>{errorMessage}</p>
          ) : null}

          {isLoading ? (
            <p className={styles.emptyState}>행사 데이터를 불러오는 중입니다.</p>
          ) : null}

          {!isLoading && events.length === 0 ? (
            <p className={styles.emptyState}>아직 등록된 행사가 없습니다.</p>
          ) : null}

          {!isLoading && events.length > 0 ? (
            <div className={styles.eventTableWrap}>
              <table className={styles.eventTable}>
                <thead>
                  <tr>
                    <th>행사코드</th>
                    <th>행사명</th>
                    <th>행사기간</th>
                    <th>상태</th>
                    <th>연결 상품 수</th>
                    <th>배너 여부</th>
                    <th>운영</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((eventItem) => (
                    <tr key={eventItem.id}>
                      <td className={styles.eventCode}>{eventItem.eventCode}</td>
                      <td>
                        <strong>{eventItem.eventTitle}</strong>
                        <span>{eventItem.eventType}</span>
                      </td>
                      <td>{renderEventPeriod(eventItem)}</td>
                      <td>{renderStatusBadge(eventItem.eventStatus)}</td>
                      <td>{eventItem.connectedProductCount.toLocaleString()}개</td>
                      <td>{eventItem.hasBanner ? '연결됨' : '미등록'}</td>
                      <td>
                        <div className={styles.eventActions}>
                          <button type="button">행사 상품 보기</button>
                          <button
                            type="button"
                            onClick={() => handleEndEvent(eventItem)}
                            disabled={eventItem.eventStatus === 'ENDED'}
                          >
                            행사 종료
                          </button>
                          <button type="button">배너 관리</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}
