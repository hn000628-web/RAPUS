'use client'

// SECTION 01 : IMPORT
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMe } from '@/lib/authApi'
import {
  GetCurrentRoomCheckInResponse,
  PosRoomResource,
  getCurrentRoomCheckIn,
  getPosRooms
} from '@/lib/business/pos/roomsApi'

import PosSidebar from '../pos/components/PosSidebar'
import PosTopbar from '../pos/components/PosTopbar'
import { usePosKeyboardMode } from '../pos/components/PosKeyboardModeContext'
import { POS_ROOM_MENUS, PosMenuKey } from '../pos/components/posTypes'
import styles from './RoomsPage.module.css'

// SECTION 02 : TYPE
type RoomStatus = 'VACANT' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'INSPECTION'
type RoomFilter = 'ALL' | RoomStatus

type RoomItem = {
  id: number
  label: string
  status: RoomStatus
  amount: number
  roomNo: string
  locationId: number
}

type RoomApiContext = {
  profileId: number
  channelCode: string
}

// SECTION 03 : CONSTANT

const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  VACANT: '공실',
  OCCUPIED: '체크인',
  RESERVED: '예약',
  CLEANING: '청소중',
  INSPECTION: '점검중'
}

const ROOM_STATUS_BADGE_CLASS: Record<RoomStatus, string> = {
  VACANT: 'roomStatusVacant',
  OCCUPIED: 'roomStatusOccupied',
  RESERVED: 'roomStatusReserved',
  CLEANING: 'roomStatusCleaning',
  INSPECTION: 'roomStatusInspection'
}

const ROOM_FILTER_ITEMS: { key: RoomFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'OCCUPIED', label: '체크인' },
  { key: 'RESERVED', label: '예약' },
  { key: 'VACANT', label: '공실' },
  { key: 'CLEANING', label: '청소중' },
  { key: 'INSPECTION', label: '점검중' }
]

// SECTION 04 : STATE
export default function PosRoomsPage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const [activeMenu, setActiveMenu] = useState<PosMenuKey>('ROOM_STATUS')
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState<RoomFilter>('ALL')
  const [roomApiContext, setRoomApiContext] = useState<RoomApiContext | null>(null)
  const [dbRooms, setDbRooms] = useState<PosRoomResource[]>([])
  const [isRoomsLoading, setIsRoomsLoading] = useState<boolean>(false)
  const [roomsLoadErrorMessage, setRoomsLoadErrorMessage] = useState<string>('')
  const [isProfileContextMissing, setIsProfileContextMissing] = useState<boolean>(false)
  const [currentCheckInByLocationId, setCurrentCheckInByLocationId] = useState<Record<number, GetCurrentRoomCheckInResponse | null>>({})

  const mapResourceStatusToRoomStatus = (resourceStatus: string): RoomStatus => {
    if (resourceStatus === 'IN_USE') {
      return 'OCCUPIED'
    }
    if (resourceStatus === 'RESERVED' || resourceStatus === 'CHECKIN_READY') {
      return 'RESERVED'
    }
    if (resourceStatus === 'CLEANING') {
      return 'CLEANING'
    }
    if (resourceStatus === 'MAINTENANCE' || resourceStatus === 'DISABLED') {
      return 'INSPECTION'
    }
    return 'VACANT'
  }

  const visibleRooms = useMemo(() => {
    return dbRooms.map((room) => ({
      id: room.locationId,
      label: `객실 ${room.locationName}`,
      status: mapResourceStatusToRoomStatus(room.resourceStatus),
      amount: 0,
      roomNo: room.roomNo,
      locationId: room.locationId
    }))
  }, [dbRooms])

  // SECTION 05 : DATA FUNCTION
  const selectedRoom = useMemo(
    () => visibleRooms.find((room) => room.id === selectedRoomId) ?? null,
    [selectedRoomId, visibleRooms]
  )

  const filteredRooms = useMemo(() => {
    if (activeFilter === 'ALL') {
      return visibleRooms
    }

    return visibleRooms.filter((room) => room.status === activeFilter)
  }, [activeFilter, visibleRooms])

  const summary = useMemo(() => {
    return {
      usingCount: 2,
      occupiedCount: 1,
      reservedCount: 1,
      vacantCount: 5,
      totalAmount: 150000
    }
  }, [])

  // SECTION 06 : EVENT FUNCTION
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

  const handleSelectRoom = (roomId: number) => {
    setSelectedRoomId(roomId)
  }

  const handleSelectRoomFromDropdown = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextRoomId = Number(event.target.value)

    if (Number.isNaN(nextRoomId)) {
      return
    }

    setSelectedRoomId(nextRoomId)
  }

  const handleOpenRoomDetail = (room: RoomItem) => {
    setSelectedRoomId(room.id)
    router.push(`/pos/rooms/${room.roomNo}`)
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

  const handleGoTableSettings = () => {
    router.push('/pos/settings/table')
  }

  // SECTION 07 : EFFECT
  useEffect(() => {
    const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!(event.target instanceof HTMLElement)) {
        return
      }

      const tagName = event.target.tagName.toLowerCase()

      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        event.target.isContentEditable
      ) {
        return
      }

      // Ctrl + F1 은 키보드 모드와 무관하게 항상 홈 이동
      if (event.ctrlKey && event.code === 'F1') {
        event.preventDefault()
        router.push('/pos')
        return
      }

      // F1 단독은 POS 키보드 모드에서만 홈 이동
      if (keyboardMode === 'POS' && event.code === 'F1') {
        event.preventDefault()
        router.push('/pos')
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown)

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown)
    }
  }, [keyboardMode, router])

  useEffect(() => {
    let cancelled = false

    async function loadRoomApiContext() {
      try {
        setRoomsLoadErrorMessage('')
        setIsProfileContextMissing(false)
        const me = await getMe()

        if (cancelled) {
          return
        }

        const profileId = me?.user?.profileId
        const channelCode = me?.user?.channelCode

        if (!profileId || !channelCode) {
          console.warn('[POS ROOMS] profile context missing')
          setIsProfileContextMissing(true)
          setRoomApiContext(null)
          return
        }

        setRoomApiContext({
          profileId,
          channelCode
        })
      } catch (error) {
        console.warn('[POS ROOMS] failed to load auth context', error)
        setRoomsLoadErrorMessage('프로필 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.')
        setRoomApiContext(null)
      }
    }

    loadRoomApiContext()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!roomApiContext) {
      return
    }
    const context = roomApiContext

    let cancelled = false

    async function loadRooms() {
      try {
        setIsRoomsLoading(true)
        setRoomsLoadErrorMessage('')
        const response = await getPosRooms(context)

        if (cancelled) {
          return
        }

        const rooms = Array.isArray(response?.rooms) ? response.rooms : []
        setDbRooms(rooms)

        if (rooms.length > 0) {
          setSelectedRoomId((prev) => {
            const exists = rooms.some((room) => room.locationId === prev)
            return exists ? prev : rooms[0].locationId
          })
        } else {
          setSelectedRoomId(null)
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        console.warn('[POS ROOMS] failed to load room resources', error)
        setDbRooms([])
        setSelectedRoomId(null)
        setRoomsLoadErrorMessage('객실 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      } finally {
        if (!cancelled) {
          setIsRoomsLoading(false)
        }
      }
    }

    loadRooms()

    return () => {
      cancelled = true
    }
  }, [roomApiContext])

  useEffect(() => {
    if (!roomApiContext) {
      return
    }
    if (dbRooms.length === 0 || !selectedRoom) {
      return
    }
    const locationId: number = selectedRoom.locationId
    const context = roomApiContext

    if (currentCheckInByLocationId[locationId] !== undefined) {
      return
    }

    let cancelled = false

    async function loadCurrentRoomCheckIn() {
      try {
        const response = await getCurrentRoomCheckIn({
          locationId,
          profileId: context.profileId,
          channelCode: context.channelCode
        })

        if (cancelled) {
          return
        }

        setCurrentCheckInByLocationId((prev) => ({
          ...prev,
          [locationId]: response
        }))
      } catch (error) {
        if (cancelled) {
          return
        }

        console.warn('[POS ROOMS] current check-in lookup failed', {
          locationId,
          error
        })

        setCurrentCheckInByLocationId((prev) => ({
          ...prev,
          [locationId]: null
        }))
      }
    }

    loadCurrentRoomCheckIn()

    return () => {
      cancelled = true
    }
  }, [roomApiContext, dbRooms, selectedRoom, currentCheckInByLocationId])

  const isResolvingProfileContext =
    !roomApiContext &&
    !isProfileContextMissing &&
    !roomsLoadErrorMessage

  const showEmptyState =
    !isRoomsLoading &&
    (isProfileContextMissing || Boolean(roomsLoadErrorMessage) || dbRooms.length === 0)

  const emptyStateTitle =
    isProfileContextMissing
      ? '프로필 정보를 확인할 수 없습니다.'
      : roomsLoadErrorMessage
        ? '객실 정보를 불러오지 못했습니다.'
        : '환영합니다.'

  const emptyStateDescription =
    isProfileContextMissing
      ? 'BUSINESS 프로필의 profileId와 channelCode를 확인한 뒤 다시 시도해 주세요.'
      : roomsLoadErrorMessage
        ? '객실 목록 조회에 실패했습니다.'
        : '객실/룸을 추가해 주세요.'

  const emptyStateSubDescription =
    isProfileContextMissing
      ? '프로필 정보를 확인한 뒤 객실/룸 설정으로 이동해 리소스를 등록할 수 있습니다.'
      : roomsLoadErrorMessage
        ? roomsLoadErrorMessage
        : '객실현황을 사용하려면 먼저 객실 또는 룸 리소스를 등록해야 합니다.'

  // SECTION 08 : UI BLOCK
  const roomCards = filteredRooms.map((room) => {
    const isSelected = room.id === selectedRoomId

    return (
      <article
        key={room.id}
        className={`${styles.roomCard} ${isSelected ? styles.roomCardSelected : ''}`}
        onClick={() => handleOpenRoomDetail(room)}
      >
        <div className={styles.roomCardContent}>
          <strong className={styles.roomName}>{room.label}</strong>
          <strong className={styles.roomAmount}>{room.amount.toLocaleString('ko-KR')}원</strong>
          <span className={`${styles.roomStatus} ${styles[ROOM_STATUS_BADGE_CLASS[room.status]]}`}>
            {ROOM_STATUS_LABEL[room.status]}
          </span>
        </div>

        <div className={styles.roomCardAction}>
          <div className={styles.roomDetailButton}>
            객실내역
          </div>
        </div>
      </article>
    )
  })

  // SECTION 09 : RETURN
  return (
    <div className={styles.page}>
      <div className={styles.posShell}>
        <div className={styles.topbarWrap}>
          <div className={styles.topbarInner}>
            <PosTopbar
              title="객실현황"
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
              <div className={styles.contentGrid}>
                <section className={styles.roomPanel} aria-label="객실 현황 목록">
                  <div className={styles.roomSelectRow}>
                    <div className={styles.statusFilterRow} aria-label="객실 상태 필터">
                      {ROOM_FILTER_ITEMS.map((filterItem) => (
                        <button
                          key={filterItem.key}
                          type="button"
                          className={`${styles.statusFilterButton} ${activeFilter === filterItem.key ? styles.statusFilterButtonActive : ''}`}
                          onClick={() => {
                            setActiveFilter(filterItem.key)
                          }}
                        >
                          {filterItem.label}
                        </button>
                      ))}
                    </div>

                    <div className={styles.roomSelectGroup}>
                      <label className={styles.roomSelectLabel} htmlFor="room-select">
                        객실 선택
                      </label>
                      <select
                        id="room-select"
                        className={styles.roomSelectBox}
                        value={selectedRoomId ?? ''}
                        onChange={handleSelectRoomFromDropdown}
                        disabled={isResolvingProfileContext || isRoomsLoading || visibleRooms.length === 0}
                      >
                        {visibleRooms.length > 0 ? (
                          visibleRooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.label}
                            </option>
                          ))
                        ) : (
                          <option value="">
                            선택 가능한 객실이 없습니다.
                          </option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className={styles.roomGridScroll}>
                    {isResolvingProfileContext || isRoomsLoading ? (
                      <div className={styles.emptyState}>
                        <strong className={styles.emptyStateTitle}>
                          객실 정보를 불러오는 중입니다.
                        </strong>
                        <p className={styles.emptyStateDescription}>
                          잠시만 기다려 주세요.
                        </p>
                      </div>
                    ) : showEmptyState ? (
                      <div className={styles.emptyState}>
                        <strong className={styles.emptyStateTitle}>
                          {emptyStateTitle}
                        </strong>
                        <p className={styles.emptyStateDescription}>
                          {emptyStateDescription}
                        </p>
                        <p className={styles.emptyStateDescription}>
                          {emptyStateSubDescription}
                        </p>
                        <button
                          type="button"
                          className={styles.emptyStateButton}
                          onClick={handleGoTableSettings}
                        >
                          객실/룸 설정
                        </button>
                      </div>
                    ) : (
                      <div className={styles.roomGrid}>{roomCards}</div>
                    )}
                  </div>
                </section>

                <aside className={styles.summaryPanel}>
                  <div className={styles.summaryInner}>
                    <div className={styles.summaryBox}>
                      <h2 className={styles.summaryTitle}>오늘 요약</h2>
                      <div className={styles.summaryList}>
                        <div className={styles.summaryRow}><span>사용중 객실</span><strong>{summary.usingCount}개</strong></div>
                        <div className={styles.summaryRow}><span>체크인 객실</span><strong>{summary.occupiedCount}개</strong></div>
                        <div className={styles.summaryRow}><span>예약 객실</span><strong>{summary.reservedCount}개</strong></div>
                        <div className={styles.summaryRow}><span>공실 객실</span><strong>{summary.vacantCount}개</strong></div>
                        <div className={styles.summaryRow}><span>객실 매출 합계</span><strong>{summary.totalAmount.toLocaleString('ko-KR')}원</strong></div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </main>
          </div>
        </div>

        <div className={styles.footerWrap}>
          <div className={styles.mainFooter}>
            <strong className={styles.footerTotalText}>
              매출 합계 : {summary.totalAmount.toLocaleString('ko-KR')}원
            </strong>
          </div>
        </div>
      </div>
    </div>
  )
}
