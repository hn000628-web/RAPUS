'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getMe } from '@/lib/authApi'
import {
  CheckOutRoomRequest,
  GetCurrentRoomCheckInResponse,
  PosRoomResource,
  RoomResourceStatus,
  RoomUseType,
  checkInRoom,
  checkOutRoom,
  completeRoomCleaning,
  getCurrentRoomCheckIn,
  getPosRooms
} from '@/lib/business/pos/roomsApi'
import styles from './RoomDetailPage.module.css'
import RoomHeaderActions from './RoomHeaderActions'
import { CheckInModalSubmitPayload } from './CheckInModal'

// SECTION 01 : TYPE

type RoomStatus =
  | 'CHECK_IN'
  | 'EMPTY'
  | 'RESERVED'
  | 'CLEANING'
  | 'CLEAN_DONE'
  | 'INSPECTION'

type RoomApiContext = {
  profileId: number
  channelCode: string
}

type SideMenuItem = {
  id: string
  label: string
  active: boolean
}

type InfoRow = {
  label: string
  value: string
}

type SummaryRow = {
  label: string
  value: string
  highlight?: boolean
}

type RoomStatusMeta = {
  status: RoomStatus
  statusLabel: string
  usageType: RoomUseType | null
  usageTypeLabel: string
}

// SECTION 02 : CONSTANT

const SIDE_MENU_ITEMS: SideMenuItem[] = [
  { id: 'room-info', label: '객실정보', active: true },
  { id: 'room-service', label: '룸서비스', active: false },
  { id: 'usage-history', label: '이용내역', active: false },
  { id: 'payment-history', label: '결제내역', active: false },
  { id: 'cleaning-inspection', label: '청소/점검', active: false },
  { id: 'memo', label: '메모', active: false }
]

// SECTION 03 : UTIL

function formatCurrency(value: number) {
  return `${value.toLocaleString('ko-KR')}원`
}

function formatDateTime(value: string | null | undefined): string {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return '-'
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return raw
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}

function formatBaseUsageTime(baseUsageMinutes: number | null): string {
  if (baseUsageMinutes === null || baseUsageMinutes === undefined) {
    return '-'
  }

  if (baseUsageMinutes === 1440) {
    return '1박 24시간'
  }

  if (baseUsageMinutes === 180) {
    return '3시간'
  }

  if (baseUsageMinutes < 60) {
    return `${baseUsageMinutes}분`
  }

  const hours = Math.floor(baseUsageMinutes / 60)
  const minutes = baseUsageMinutes % 60

  if (minutes === 0) {
    return `${hours}시간`
  }

  return `${hours}시간 ${minutes}분`
}

function formatCurrentUseTime(checkedInAt: string | null | undefined): string {
  const raw = String(checkedInAt ?? '').trim()
  if (!raw) {
    return '-'
  }

  const startedAt = new Date(raw)
  if (Number.isNaN(startedAt.getTime())) {
    return '-'
  }

  const diffMs = Date.now() - startedAt.getTime()
  if (diffMs < 0) {
    return '-'
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  return `${hours}시간 ${minutes}분`
}

function getStatusClassName(status: RoomStatus) {
  if (status === 'CHECK_IN') {
    return `${styles.statusBadge} ${styles.statusCheckIn}`
  }

  if (status === 'EMPTY') {
    return `${styles.statusBadge} ${styles.statusEmpty}`
  }

  if (status === 'RESERVED') {
    return `${styles.statusBadge} ${styles.statusReserved}`
  }

  if (status === 'CLEANING') {
    return `${styles.statusBadge} ${styles.statusCleaning}`
  }

  if (status === 'CLEAN_DONE') {
    return `${styles.statusBadge} ${styles.statusReserved}`
  }

  return `${styles.statusBadge} ${styles.statusInspection}`
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return '요청 처리 중 오류가 발생했습니다.'
}

function decodeRoomNo(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }

  const lowered = raw.toLowerCase()
  if (lowered === 'undefined' || lowered === 'null') {
    return ''
  }

  try {
    return decodeURIComponent(raw).trim()
  } catch {
    return raw
  }
}

function normalizeRoomValue(value: unknown): string {
  return String(value ?? '').trim()
}

function stripRoomPrefix(value: string): string {
  return value.replace(/^객실\s*/u, '').trim()
}

function formatRoomTitle(locationName: string): string {
  const safeName = normalizeRoomValue(locationName)
  if (!safeName) {
    return '객실'
  }

  if (safeName.startsWith('객실')) {
    return safeName
  }

  return `객실 ${safeName}`
}

function findMatchedRoom(
  rooms: PosRoomResource[],
  decodedRoomNo: string
): PosRoomResource | null {
  const normalizedTarget = normalizeRoomValue(decodedRoomNo)
  if (!normalizedTarget) {
    return null
  }

  const targetWithoutPrefix = stripRoomPrefix(normalizedTarget)

  return (
    rooms.find((room) => {
      const locationName = normalizeRoomValue(room.locationName)
      const roomNo = normalizeRoomValue(room.roomNo)
      const tableCode = normalizeRoomValue(room.tableCode)
      const prefixedName = formatRoomTitle(locationName)
      const locationWithoutPrefix = stripRoomPrefix(locationName)

      return (
        locationName === normalizedTarget ||
        roomNo === normalizedTarget ||
        tableCode === normalizedTarget ||
        prefixedName === normalizedTarget ||
        (targetWithoutPrefix !== '' &&
          (locationName === targetWithoutPrefix ||
            roomNo === targetWithoutPrefix ||
            locationWithoutPrefix === targetWithoutPrefix))
      )
    }) ?? null
  )
}

function resolveRoomStatusMeta(
  room: PosRoomResource,
  current: GetCurrentRoomCheckInResponse | null
): RoomStatusMeta {
  const currentCheckIn = current?.currentCheckIn
  const useType = currentCheckIn?.useType ?? current?.currentUseType ?? room.currentUseType ?? null
  const resourceStatus = current?.resourceStatus ?? room.resourceStatus

  if (useType === 'STAY') {
    return {
      status: 'CHECK_IN',
      statusLabel: '숙박',
      usageType: useType,
      usageTypeLabel: '숙박'
    }
  }

  if (useType === 'SHORT_STAY') {
    return {
      status: 'CHECK_IN',
      statusLabel: '대실',
      usageType: useType,
      usageTypeLabel: '대실'
    }
  }

  if (resourceStatus === 'CLEANING') {
    return {
      status: 'CLEANING',
      statusLabel: '청소중',
      usageType: null,
      usageTypeLabel: '-'
    }
  }

  if (resourceStatus === 'CLEAN_DONE') {
    return {
      status: 'CLEAN_DONE',
      statusLabel: '청소완료',
      usageType: null,
      usageTypeLabel: '-'
    }
  }

  if (resourceStatus === 'MAINTENANCE' || resourceStatus === 'DISABLED') {
    return {
      status: 'INSPECTION',
      statusLabel: '점검중',
      usageType: null,
      usageTypeLabel: '-'
    }
  }

  if (resourceStatus === 'RESERVED' || resourceStatus === 'CHECKIN_READY' || resourceStatus === 'WAITING') {
    return {
      status: 'RESERVED',
      statusLabel: '예약',
      usageType: null,
      usageTypeLabel: '-'
    }
  }

  if (resourceStatus === 'IN_USE') {
    return {
      status: 'CHECK_IN',
      statusLabel: '체크인',
      usageType: null,
      usageTypeLabel: '-'
    }
  }

  return {
    status: 'EMPTY',
    statusLabel: '공실',
    usageType: null,
    usageTypeLabel: '-'
  }
}

function renderInfoRows(rows: InfoRow[]) {
  return rows.map((row) => (
    <div
      className={styles.infoRow}
      key={row.label}
    >
      <span className={styles.infoLabel}>
        {row.label}
      </span>

      <strong className={styles.infoValue}>
        {row.value}
      </strong>
    </div>
  ))
}

function renderSummaryRows(rows: SummaryRow[]) {
  return rows.map((row) => (
    <div
      className={
        row.highlight
          ? styles.summaryTotal
          : styles.summaryRow
      }
      key={row.label}
    >
      <span>
        {row.label}
      </span>

      <strong>
        {row.value}
      </strong>
    </div>
  ))
}

// SECTION 04 : PAGE

export default function RoomDetailPage() {
  const router = useRouter()
  const routeParams = useParams<{ roomNo?: string | string[] }>()
  const rawRoomNo = Array.isArray(routeParams?.roomNo)
    ? routeParams.roomNo[0] ?? ''
    : routeParams?.roomNo ?? ''
  const decodedRoomNo = useMemo(
    () => decodeRoomNo(rawRoomNo),
    [rawRoomNo]
  )

  const [roomApiContext, setRoomApiContext] = useState<RoomApiContext | null>(null)
  const [isContextLoading, setIsContextLoading] = useState<boolean>(true)
  const [contextErrorMessage, setContextErrorMessage] = useState<string>('')

  const [rooms, setRooms] = useState<PosRoomResource[]>([])
  const [isRoomsLoading, setIsRoomsLoading] = useState<boolean>(false)
  const [roomsErrorMessage, setRoomsErrorMessage] = useState<string>('')

  const [currentCheckInResponse, setCurrentCheckInResponse] = useState<GetCurrentRoomCheckInResponse | null>(null)
  const [isCurrentCheckInLoading, setIsCurrentCheckInLoading] = useState<boolean>(false)
  const [currentCheckInErrorMessage, setCurrentCheckInErrorMessage] = useState<string>('')

  const [isCheckInSubmitting, setIsCheckInSubmitting] = useState<boolean>(false)
  const [checkInActionErrorMessage, setCheckInActionErrorMessage] = useState<string>('')
  const [isCheckOutSubmitting, setIsCheckOutSubmitting] = useState<boolean>(false)
  const [checkOutActionErrorMessage, setCheckOutActionErrorMessage] = useState<string>('')
  const [isCleaningSubmitting, setIsCleaningSubmitting] = useState<boolean>(false)
  const [cleaningActionErrorMessage, setCleaningActionErrorMessage] = useState<string>('')

  const matchedRoom = useMemo(
    () => findMatchedRoom(rooms, decodedRoomNo),
    [rooms, decodedRoomNo]
  )

  const locationId = matchedRoom
    ? (matchedRoom.locationId ?? matchedRoom.id ?? null)
    : null

  const loadRooms = useCallback(async (context: RoomApiContext) => {
    setIsRoomsLoading(true)
    setRoomsErrorMessage('')

    try {
      const response = await getPosRooms({
        profileId: context.profileId,
        channelCode: context.channelCode
      })

      const nextRooms = Array.isArray(response?.rooms) ? response.rooms : []
      setRooms(nextRooms)
    } catch (error) {
      setRooms([])
      setRoomsErrorMessage('객실 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      console.warn('[ROOM DETAIL] failed to load rooms', error)
    } finally {
      setIsRoomsLoading(false)
    }
  }, [])

  const loadCurrentCheckIn = useCallback(async (
    context: RoomApiContext,
    targetLocationId: number
  ) => {
    setIsCurrentCheckInLoading(true)
    setCurrentCheckInErrorMessage('')

    try {
      const response = await getCurrentRoomCheckIn({
        locationId: targetLocationId,
        profileId: context.profileId,
        channelCode: context.channelCode
      })

      setCurrentCheckInResponse(response)
    } catch (error) {
      setCurrentCheckInResponse(null)
      setCurrentCheckInErrorMessage('현재 체크인 정보를 불러오지 못했습니다.')
      console.warn('[ROOM DETAIL] failed to load current check-in', error)
    } finally {
      setIsCurrentCheckInLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadContext() {
      setIsContextLoading(true)
      setContextErrorMessage('')

      try {
        const me = await getMe()
        if (cancelled) {
          return
        }

        const profileId = me?.user?.profileId
        const channelCode = me?.user?.channelCode

        if (!profileId || !channelCode) {
          setRoomApiContext(null)
          setContextErrorMessage('프로필 정보를 확인할 수 없습니다.')
          return
        }

        setRoomApiContext({
          profileId,
          channelCode
        })
      } catch (error) {
        if (cancelled) {
          return
        }

        setRoomApiContext(null)
        setContextErrorMessage('프로필 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
        console.warn('[ROOM DETAIL] failed to load profile context', error)
      } finally {
        if (!cancelled) {
          setIsContextLoading(false)
        }
      }
    }

    loadContext()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!roomApiContext) {
      return
    }

    void loadRooms(roomApiContext)
  }, [roomApiContext, loadRooms])

  useEffect(() => {
    if (!roomApiContext || !locationId) {
      setCurrentCheckInResponse(null)
      return
    }

    void loadCurrentCheckIn(roomApiContext, locationId)
  }, [roomApiContext, locationId, loadCurrentCheckIn])

  const handleGoTableSettings = () => {
    router.push('/pos/settings/table')
  }

  const handleSubmitCheckIn = async (
    payload: CheckInModalSubmitPayload
  ) => {
    if (!roomApiContext || !locationId || !matchedRoom) {
      throw new Error('객실 정보를 확인한 뒤 다시 시도해 주세요.')
    }

    setIsCheckInSubmitting(true)
    setCheckInActionErrorMessage('')
    setCheckOutActionErrorMessage('')

    try {
      await checkInRoom(locationId, {
        profileId: roomApiContext.profileId,
        channelCode: roomApiContext.channelCode,
        useType: payload.useType,
        inputType: payload.inputType,
        guestName: payload.guestName,
        guestPhone: payload.guestPhone,
        vehicleNumber: payload.vehicleNumber,
        guestCount: payload.guestCount,
        memo: payload.memo,
        qrReferenceCode: payload.qrReferenceCode,
        expectedCheckOutAt: payload.expectedCheckOutAt,
        basePriceSnapshot: matchedRoom.defaultPrice,
        baseUsageMinutes: matchedRoom.baseUsageMinutes ?? null
      })

      await Promise.all([
        loadRooms(roomApiContext),
        loadCurrentCheckIn(roomApiContext, locationId)
      ])
    } catch (error) {
      const message = getErrorMessage(error)
      setCheckInActionErrorMessage(message)
      throw new Error(message)
    } finally {
      setIsCheckInSubmitting(false)
    }
  }

  const handleCheckOut = async () => {
    if (!roomApiContext || !currentCheckInResponse?.currentCheckIn?.id) {
      setCheckOutActionErrorMessage('현재 체크인된 객실이 아닙니다.')
      return
    }

    setIsCheckOutSubmitting(true)
    setCheckOutActionErrorMessage('')
    setCheckInActionErrorMessage('')

    try {
      const requestBody: CheckOutRoomRequest = {
        profileId: roomApiContext.profileId,
        channelCode: roomApiContext.channelCode,
        memo: null
      }

      await checkOutRoom(currentCheckInResponse.currentCheckIn.id, requestBody)

      if (locationId) {
        await Promise.all([
          loadRooms(roomApiContext),
          loadCurrentCheckIn(roomApiContext, locationId)
        ])
      } else {
        await loadRooms(roomApiContext)
      }
    } catch (error) {
      setCheckOutActionErrorMessage(getErrorMessage(error))
    } finally {
      setIsCheckOutSubmitting(false)
    }
  }

  const handleCompleteCleaning = async () => {
    if (!roomApiContext || !locationId) {
      setCleaningActionErrorMessage('객실 정보를 확인한 뒤 다시 시도해 주세요.')
      return
    }

    setIsCleaningSubmitting(true)
    setCleaningActionErrorMessage('')
    setCheckInActionErrorMessage('')
    setCheckOutActionErrorMessage('')

    try {
      await completeRoomCleaning(locationId, {
        profileId: roomApiContext.profileId,
        channelCode: roomApiContext.channelCode
      })

      await Promise.all([
        loadRooms(roomApiContext),
        loadCurrentCheckIn(roomApiContext, locationId)
      ])
    } catch (error) {
      setCleaningActionErrorMessage(getErrorMessage(error))
    } finally {
      setIsCleaningSubmitting(false)
    }
  }

  const viewState = (() => {
    if (isContextLoading || isRoomsLoading) {
      return 'LOADING'
    }

    if (contextErrorMessage) {
      return 'CONTEXT_ERROR'
    }

    if (!roomApiContext) {
      return 'CONTEXT_MISSING'
    }

    if (roomsErrorMessage) {
      return 'ROOMS_ERROR'
    }

    if (rooms.length === 0) {
      return 'NO_ROOMS'
    }

    if (!matchedRoom) {
      return 'ROOM_NOT_FOUND'
    }

    return 'READY'
  })()

  const statusMeta = useMemo(() => {
    if (!matchedRoom) {
      return null
    }

    return resolveRoomStatusMeta(matchedRoom, currentCheckInResponse)
  }, [matchedRoom, currentCheckInResponse])

  const currentResourceStatus: RoomResourceStatus | null =
    currentCheckInResponse?.resourceStatus ??
    matchedRoom?.resourceStatus ??
    null

  const canCompleteCleaning = Boolean(
    roomApiContext &&
    locationId &&
    !currentCheckInResponse?.currentCheckIn &&
    !isCurrentCheckInLoading &&
    (currentResourceStatus === 'CLEANING' || currentResourceStatus === 'CLEAN_DONE')
  )

  const basePrice = currentCheckInResponse?.currentCheckIn?.basePriceSnapshot ?? 0
  const extensionAmount = currentCheckInResponse?.currentCheckIn?.extensionAmountSnapshot ?? 0
  const discountAmount = currentCheckInResponse?.currentCheckIn?.discountAmountSnapshot ?? 0
  const extraOrderAmount = 0
  const totalAmount = basePrice + extraOrderAmount + extensionAmount - discountAmount

  const roomInfoRows: InfoRow[] = matchedRoom && statusMeta
    ? [
        { label: '객실 번호', value: matchedRoom.locationName },
        { label: '객실 타입', value: matchedRoom.tableOptionName || matchedRoom.tableTypeCode || '-' },
        { label: '현재 상태', value: statusMeta.statusLabel },
        { label: '이용 구분', value: statusMeta.usageTypeLabel },
        { label: '기본 요금', value: formatCurrency(basePrice) },
        { label: '기준 이용', value: formatBaseUsageTime(matchedRoom.baseUsageMinutes) }
      ]
    : []

  const usageRows: InfoRow[] = matchedRoom
    ? [
        { label: '체크인 시간', value: formatDateTime(currentCheckInResponse?.currentCheckIn?.checkedInAt) },
        {
          label: '체크아웃 예정',
          value: formatDateTime(
            currentCheckInResponse?.currentCheckIn?.expectedCheckOutAt ??
            currentCheckInResponse?.expectedCheckOutAt ??
            matchedRoom.expectedCheckOutAt
          )
        },
        { label: '현재 이용 시간', value: formatCurrentUseTime(currentCheckInResponse?.currentCheckIn?.checkedInAt ?? null) },
        { label: '연장 상태', value: extensionAmount > 0 ? '연장 있음' : '연장 없음' }
      ]
    : []

  const customerRows: InfoRow[] = matchedRoom
    ? [
        {
          label: '고객명',
          value: currentCheckInResponse?.currentCheckIn?.guestName || '등록된 고객 정보 없음'
        },
        {
          label: '연락처',
          value: currentCheckInResponse?.currentCheckIn?.guestPhone || '-'
        },
        {
          label: '차량 번호',
          value: currentCheckInResponse?.currentCheckIn?.vehicleNumber || '-'
        },
        {
          label: '인원수',
          value:
            currentCheckInResponse?.currentCheckIn?.guestCount !== null &&
            currentCheckInResponse?.currentCheckIn?.guestCount !== undefined
              ? `${currentCheckInResponse.currentCheckIn.guestCount}명`
              : '-'
        },
        {
          label: '예약 구분',
          value: (() => {
            const inputType = currentCheckInResponse?.currentCheckIn?.inputType
            if (!inputType) {
              return '-'
            }
            if (inputType === 'QR') {
              return 'QR'
            }
            if (inputType === 'PHOTO') {
              return '사진'
            }
            if (inputType === 'MANUAL') {
              return '수기'
            }
            return '정보없음'
          })()
        }
      ]
    : []

  const managementRows: InfoRow[] = matchedRoom
    ? [
        { label: '객실관리 담당자', value: '-' },
        { label: '청소 담당자', value: '-' },
        {
          label: '청소 상태',
          value: matchedRoom.resourceStatus === 'CLEANING' ? '진행중' : '대기'
        },
        {
          label: '점검 상태',
          value:
            matchedRoom.resourceStatus === 'MAINTENANCE' || matchedRoom.resourceStatus === 'DISABLED'
              ? '점검중'
              : '정상'
        },
        {
          label: '관리자 메모',
          value: currentCheckInResponse?.currentCheckIn?.memo || '-'
        }
      ]
    : []

  const summaryRows: SummaryRow[] = [
    { label: '객실 요금', value: formatCurrency(basePrice) },
    { label: '추가 주문', value: formatCurrency(extraOrderAmount) },
    { label: '연장 요금', value: formatCurrency(extensionAmount) },
    { label: '할인', value: `-${formatCurrency(discountAmount)}` },
    { label: '결제 예정 금액', value: formatCurrency(totalAmount), highlight: true }
  ]

  const roomNameForTitle = matchedRoom?.locationName || decodedRoomNo
  const roomTitle = formatRoomTitle(roomNameForTitle)
  const roomNoForModal = stripRoomPrefix(roomNameForTitle) || roomNameForTitle || '-'
  const roomStatusBadgeClass = statusMeta ? getStatusClassName(statusMeta.status) : getStatusClassName('EMPTY')
  const roomStatusLabel = statusMeta?.statusLabel ?? '공실'

  return (
    <main className={styles.page}>
      <div className={styles.posShell}>
        <header className={styles.topbarWrap}>
          <div className={styles.topbarInner}>
            <div className={styles.topbarTitle}>
              객실 관리
            </div>

            <div className={styles.topbarActions}>
              <button
                className={styles.syncBadge}
                type="button"
              >
                서버싱크: 실시간 ON
              </button>

              <button
                className={styles.keyboardBadge}
                type="button"
              >
                키보드: POS
              </button>

              <button
                className={styles.topbarButton}
                type="button"
              >
                홈(F1)
              </button>

              <button
                className={styles.topbarButton}
                type="button"
              >
                설정
              </button>

              <button
                className={styles.topbarButton}
                type="button"
              >
                마이페이지
              </button>
            </div>
          </div>
        </header>

        <section className={styles.mainViewport}>
          <div className={styles.mainGrid}>
            <aside className={styles.sidebar}>
              <div className={styles.sidebarBox}>
                <h2 className={styles.sidebarTitle}>
                  객실 메뉴
                </h2>

                <nav
                  aria-label="객실 상세 메뉴"
                  className={styles.sideMenu}
                >
                  {SIDE_MENU_ITEMS.map((item) => (
                    <button
                      className={
                        item.active
                          ? `${styles.sideMenuButton} ${styles.sideMenuButtonActive}`
                          : styles.sideMenuButton
                      }
                      key={item.id}
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            <section className={styles.main}>
              {viewState === 'READY' && matchedRoom && statusMeta ? (
                <>
                  <div className={styles.header}>
                    <div className={styles.headerTop}>
                      <div>
                        <div className={styles.titleRow}>
                          <h1 className={styles.title}>
                            {roomTitle}
                          </h1>

                          <span className={roomStatusBadgeClass}>
                            {roomStatusLabel}
                          </span>
                        </div>

                        <p className={styles.description}>
                          {roomTitle} 상세 관리 화면입니다.
                        </p>
                        {currentCheckInErrorMessage ? (
                          <p className={styles.description}>
                            {currentCheckInErrorMessage}
                          </p>
                        ) : null}
                        {checkOutActionErrorMessage ? (
                          <p className={styles.description}>
                            {checkOutActionErrorMessage}
                          </p>
                        ) : null}
                        {cleaningActionErrorMessage ? (
                          <p className={styles.description}>
                            {cleaningActionErrorMessage}
                          </p>
                        ) : null}
                      </div>

                      <RoomHeaderActions
                        roomNo={roomNoForModal}
                        initialUsageType={statusMeta.usageType || 'STAY'}
                        canCheckIn={Boolean(roomApiContext && locationId)}
                        isCheckInSubmitting={isCheckInSubmitting}
                        checkInErrorMessage={checkInActionErrorMessage}
                        canCompleteCleaning={canCompleteCleaning}
                        isCleaningSubmitting={isCleaningSubmitting}
                        onCompleteCleaning={handleCompleteCleaning}
                        onSubmitCheckIn={handleSubmitCheckIn}
                      />
                    </div>
                  </div>

                  <div className={styles.detailScrollArea}>
                    <div className={styles.detailGrid}>
                      <article className={styles.infoCard}>
                        <div className={styles.cardHeader}>
                          <h2 className={styles.cardTitle}>
                            객실 상태
                          </h2>

                          <span className={roomStatusBadgeClass}>
                            {roomStatusLabel}
                          </span>
                        </div>

                        <div className={styles.infoGrid}>
                          {renderInfoRows(roomInfoRows)}
                        </div>
                      </article>

                      <article className={styles.infoCard}>
                        <div className={styles.cardHeader}>
                          <h2 className={styles.cardTitle}>
                            이용 시간
                          </h2>
                        </div>

                        <div className={styles.infoGrid}>
                          {renderInfoRows(usageRows)}
                        </div>
                      </article>

                      <article className={styles.infoCard}>
                        <div className={styles.cardHeader}>
                          <h2 className={styles.cardTitle}>
                            고객 / 예약 정보
                          </h2>
                        </div>

                        <div className={styles.infoGrid}>
                          {renderInfoRows(customerRows)}
                        </div>
                      </article>

                      <article className={styles.infoCard}>
                        <div className={styles.cardHeader}>
                          <h2 className={styles.cardTitle}>
                            객실 관리
                          </h2>
                        </div>

                        <div className={styles.infoGrid}>
                          {renderInfoRows(managementRows)}
                        </div>
                      </article>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.detailScrollArea}>
                  <article className={styles.infoCard}>
                    <div className={styles.cardHeader}>
                      <h2 className={styles.cardTitle}>
                        객실 상세
                      </h2>
                    </div>

                    {viewState === 'LOADING' ? (
                      <div className={styles.infoGrid}>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>안내</span>
                          <strong className={styles.infoValue}>객실 정보를 불러오는 중입니다.</strong>
                        </div>
                      </div>
                    ) : null}

                    {viewState === 'CONTEXT_ERROR' || viewState === 'CONTEXT_MISSING' ? (
                      <div className={styles.infoGrid}>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>오류</span>
                          <strong className={styles.infoValue}>
                            {contextErrorMessage || '프로필 정보를 확인할 수 없습니다.'}
                          </strong>
                        </div>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={handleGoTableSettings}
                        >
                          객실/룸 설정
                        </button>
                      </div>
                    ) : null}

                    {viewState === 'ROOMS_ERROR' ? (
                      <div className={styles.infoGrid}>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>오류</span>
                          <strong className={styles.infoValue}>
                            객실 정보를 불러오지 못했습니다.
                          </strong>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>안내</span>
                          <strong className={styles.infoValue}>
                            잠시 후 다시 시도해 주세요.
                          </strong>
                        </div>
                      </div>
                    ) : null}

                    {viewState === 'NO_ROOMS' ? (
                      <div className={styles.infoGrid}>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>안내</span>
                          <strong className={styles.infoValue}>등록된 객실이 없습니다.</strong>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>안내</span>
                          <strong className={styles.infoValue}>객실/룸을 추가해 주세요.</strong>
                        </div>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={handleGoTableSettings}
                        >
                          객실/룸 설정
                        </button>
                      </div>
                    ) : null}

                    {viewState === 'ROOM_NOT_FOUND' ? (
                      <div className={styles.infoGrid}>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>안내</span>
                          <strong className={styles.infoValue}>객실을 찾을 수 없습니다.</strong>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>안내</span>
                          <strong className={styles.infoValue}>
                            객실/룸 설정에서 등록된 객실 정보를 확인해 주세요.
                          </strong>
                        </div>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={handleGoTableSettings}
                        >
                          객실/룸 설정
                        </button>
                      </div>
                    ) : null}
                  </article>
                </div>
              )}
            </section>

            <aside className={styles.orderPanel}>
              <div className={styles.summaryPanel}>
                <div className={styles.summaryHeader}>
                  <h2 className={styles.summaryTitle}>
                    {roomTitle} 이용 내역
                  </h2>

                  <button
                    className={styles.clearButton}
                    type="button"
                  >
                    전체 삭제
                  </button>
                </div>

                <div className={styles.summaryList}>
                  {renderSummaryRows(summaryRows)}
                </div>

                <div className={styles.summaryNotice}>
                  결제/정산 확정 로직은 추후 Service 연동 단계에서 반영됩니다.
                </div>
              </div>
            </aside>
          </div>
        </section>

        <footer className={styles.footerWrap}>
          <div className={styles.footerInner}>
            <div className={styles.footerAmount}>
              <span className={styles.footerIcon}>
                R
              </span>

              <strong>
                {roomTitle} 총 금액 :
                {' '}
                {formatCurrency(totalAmount)}
              </strong>
            </div>

            <div className={styles.footerActions}>
              <button
                className={styles.footerButton}
                type="button"
              >
                결제하기
              </button>

              <button
                className={`${styles.footerButton} ${(!currentCheckInResponse?.currentCheckIn || isCheckOutSubmitting || isCurrentCheckInLoading) ? styles.footerButtonDisabled : ''}`}
                type="button"
                disabled={!currentCheckInResponse?.currentCheckIn || isCheckOutSubmitting || isCurrentCheckInLoading}
                onClick={handleCheckOut}
              >
                {isCheckOutSubmitting ? '처리 중...' : '체크아웃'}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
