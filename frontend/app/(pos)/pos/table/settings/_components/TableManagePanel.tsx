// FILE : frontend/app/(pos)/pos/table/settings/_components/TableManagePanel.tsx
// ROOT : frontend/app/(pos)/pos/table/settings/_components/TableManagePanel.tsx
// STATUS : MODIFY MODE
// ROLE : POS TABLE SETTINGS TABLE PANEL
// CHANGE SUMMARY :
// - /pos/settings/table 기존 조회/수정 API 재사용
// - 카드 [수정] 버튼 모달 연결 + PATCH 저장 + 목록 갱신
// - 기존 QR 보기 모달 구조 재사용
'use client'

// SECTION 01 : IMPORT
import { useCallback, useEffect, useMemo, useState } from 'react'

import { getMe } from '@/lib/authApi'
import {
  createPosTableSetting,
  getPosTableSettings,
  type PosResourceType,
  type PosTableQrStatus,
  type PosTableSettingItem,
  updatePosTableSetting
} from '@/lib/business/pos/posTableSettingsApi'
import {
  emitPosTableSettingsSync,
  subscribePosTableSettingsSync
} from '@/lib/business/pos/shared/posTableSettingsRuntimeSync'

import PosTableQrModal from '../../../settings/table/components/PosTableQrModal'
import styles from '../PosTableSettingsPage.module.css'

// SECTION 02 : TYPE
type TableManagePanelProps = {
  onSaveActionChange?: (action: (() => Promise<boolean>) | null) => void
  onSavingChange?: (saving: boolean) => void
  onSaveSuccess?: () => void
  onCreateActionChange?: (action: (() => void) | null) => void
  onFloorControlChange?: (control: {
    selectedFloor: string
    floorOptions: string[]
    onSelectFloor: (floor: string) => void
    onAddFloor: () => void
  } | null) => void
  onStatusControlChange?: (control: {
    selectedStatus: string
    statusOptions: Array<{ value: string; label: string }>
    onSelectStatus: (status: string) => void
  } | null) => void
  onTypeControlChange?: (control: {
    selectedTableType: string
    tableTypeOptions: Array<{ value: string; label: string }>
    onSelectTableType: (tableType: string) => void
  } | null) => void
  viewMode?: 'DASHBOARD' | 'LIST'
  hideCreateButton?: boolean
}

type PosModuleCode =
  | 'TABLE_POS'
  | 'DELIVERY_POS'
  | 'ROOM_POS'
  | 'RESERVATION_POS'
  | 'SALES_POS'

type PosTableTypeCode =
  | 'STANDARD'
  | 'DELUXE'
  | 'PREMIUM'
  | 'VIP'

type BusinessContext = {
  profileId: number
  channelCode: string
}

type TablePanelCardItem = {
  id: string
  tableName: string
  isActive: number
  tableTypeCode: PosTableTypeCode
  qrStatus: PosTableQrStatus
  qrStatusLabel: string
  zoneName: string
  tableOptionName: string
  zoneTypeLabel: string
  floor: string
  zone: string
  floorSortOrder: number
  zoneSortOrder: number
  defaultPrice: number
  defaultPriceLabel: string
  seatOptionLabel: string
  resourceStatusCode: string
  resourceStatusLabel: string
  tableCode: string | null
  tableOrderUrl: string | null
  qrCodeValue: string | null
}

type TableEditForm = {
  tableName: string
  zoneName: string
  tableOptionName: string
  floor: string
  zone: string
  floorSortOrder: string
  zoneSortOrder: string
  tableTypeCode: PosTableTypeCode
  defaultPrice: string
}

// SECTION 03 : CONSTANT
const TABLE_POS_MODULE_CODE: PosModuleCode = 'TABLE_POS'

const TABLE_POS_PACKAGE_TABS = [
  'MENU_MANAGE',
  'CATEGORY_MANAGE',
  'TABLE_MANAGE'
] as const

const TABLE_TYPE_FILTER_OPTIONS: Array<{
  value: 'ALL' | PosTableTypeCode
  label: string
}> = [
  { value: 'ALL', label: '운영 등급: 전체' },
  { value: 'STANDARD', label: '운영 등급: 스탠다드' },
  { value: 'DELUXE', label: '운영 등급: 디럭스' },
  { value: 'PREMIUM', label: '운영 등급: 프리미엄' },
  { value: 'VIP', label: '운영 등급: VIP' }
]

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'IN_USE', label: '사용중' },
  { value: 'AVAILABLE', label: '비어있음' },
  { value: 'RESERVED', label: '예약' },
  { value: 'WAITING', label: '대기중' }
] as const

const FALLBACK_TABLE_CARDS: TablePanelCardItem[] = Array.from({ length: 8 }, (_, index) => ({
  id: `fallback-${index + 1}`,
  tableName: `테이블 ${index + 1}`,
  isActive: 1,
  tableTypeCode: 'STANDARD',
  qrStatus: 'CONNECTED',
  qrStatusLabel: 'QR 연결',
  zoneName: '홀',
  tableOptionName: '4인석',
  zoneTypeLabel: '홀 · 4인석',
  floor: '1층',
  zone: '홀',
  floorSortOrder: 1,
  zoneSortOrder: 1,
  defaultPrice: 0,
  defaultPriceLabel: '₩0',
  seatOptionLabel: '4인석',
  resourceStatusCode: 'AVAILABLE',
  resourceStatusLabel: '비어있음',
  tableCode: null,
  tableOrderUrl: null,
  qrCodeValue: null
}))

const EDIT_MODAL_OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  background: 'rgba(15, 23, 42, 0.62)'
}

const EDIT_MODAL_CARD_STYLE: React.CSSProperties = {
  width: 'min(560px, 100%)',
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  boxShadow: '0 24px 48px rgba(15, 23, 42, 0.22)',
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 12
}

const EDIT_MODAL_GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10
}

const EDIT_FIELD_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
}

const EDIT_LABEL_STYLE: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: '#334155'
}

const EDIT_INPUT_STYLE: React.CSSProperties = {
  height: 38,
  border: '1px solid #d1d5db',
  borderRadius: 10,
  padding: '0 10px',
  fontSize: 14,
  fontWeight: 700,
  color: '#0f172a',
  background: '#ffffff'
}

const EDIT_HELP_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  fontWeight: 700,
  color: '#64748b'
}

const EDIT_ACTION_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8
}

// SECTION 04 : UTIL
function normalizeTableTypeCode(value: string | undefined): PosTableTypeCode {
  const normalized =
    String(value ?? '').trim().toUpperCase()

  if (
    normalized === 'STANDARD' ||
    normalized === 'DELUXE' ||
    normalized === 'PREMIUM' ||
    normalized === 'VIP'
  ) {
    return normalized
  }

  return 'STANDARD'
}

function toResourceStatusLabel(status: string | undefined): string {
  if (status === 'IN_USE') {
    return 'IN_USE'
  }

  if (status === 'RESERVED') {
    return '예약'
  }

  if (status === 'WAITING') {
    return '대기중'
  }

  if (status === 'AVAILABLE') {
    return '비어있음'
  }

  return '비어있음'
}

function getFloorSortOrder(floor: string): number {
  const normalizedFloor =
    floor.trim()

  const basementMatch =
    normalizedFloor.match(/^B(\d+)/i)

  if (basementMatch) {
    return Number.parseInt(basementMatch[1] ?? '1', 10) * -1
  }

  const numberMatch =
    normalizedFloor.match(/-?\d+/)

  if (!numberMatch) {
    return 1
  }

  const parsedOrder =
    Number.parseInt(numberMatch[0] ?? '1', 10)

  return Number.isFinite(parsedOrder) ? parsedOrder : 1
}

function mapTableSettingToCard(item: PosTableSettingItem): TablePanelCardItem {
  const tableTypeCode =
    normalizeTableTypeCode(item.tableTypeCode)

  const zoneName =
    String(item.zoneName ?? '').trim() || '홀'

  const seatOptionName =
    String(item.tableOptionName ?? '').trim() || '4인석'
  const floor =
    String(item.floor ?? '').trim() || '1층'
  const zone =
    String(item.zone ?? '').trim() || '홀'
  const floorSortOrder =
    Number(item.floorSortOrder ?? 1)
  const zoneSortOrder =
    Number(item.zoneSortOrder ?? 1)

  const defaultPrice =
    Number(item.defaultPrice ?? 0)

  const resourceStatusCode =
    String(item.resourceStatus ?? '').trim().toUpperCase() || 'AVAILABLE'

  return {
    id: String(item.id),
    tableName: String(item.tableName ?? '').trim() || `테이블 ${item.id}`,
    isActive: Number(item.isActive ?? 1),
    tableTypeCode,
    qrStatus: item.qrStatus,
    qrStatusLabel: item.qrStatus === 'CONNECTED' ? 'QR CONNECTED' : 'QR DISCONNECTED',
    zoneName,
    tableOptionName: seatOptionName,
    zoneTypeLabel: `${zoneName} · ${seatOptionName}`,
    floor,
    zone,
    floorSortOrder: Number.isFinite(floorSortOrder) ? floorSortOrder : 1,
    zoneSortOrder: Number.isFinite(zoneSortOrder) ? zoneSortOrder : 1,
    defaultPrice,
    defaultPriceLabel: `${defaultPrice.toLocaleString('ko-KR')}원`,
    seatOptionLabel: seatOptionName,
    resourceStatusCode,
    resourceStatusLabel: toResourceStatusLabel(resourceStatusCode),
    tableCode: item.tableCode ?? null,
    tableOrderUrl: item.tableOrderUrl ?? null,
    qrCodeValue: item.qrCodeValue ?? null
  }
}
// SECTION 05 : COMPONENT
export default function TableManagePanel({
  onSaveActionChange,
  onSavingChange,
  onSaveSuccess,
  onCreateActionChange,
  onFloorControlChange,
  onStatusControlChange,
  onTypeControlChange,
  viewMode = 'LIST',
  hideCreateButton
}: TableManagePanelProps) {
  const [selectedResourceFilter] =
    useState<PosResourceType | 'ALL'>('TABLE')
  const [selectedTableTypeFilter, setSelectedTableTypeFilter] =
    useState<'ALL' | PosTableTypeCode>('ALL')
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<(typeof STATUS_FILTER_OPTIONS)[number]['value']>('ALL')
  const [selectedFloorFilter, setSelectedFloorFilter] =
    useState<string>('ALL')
  const [temporaryFloors, setTemporaryFloors] =
    useState<string[]>([])
  const [businessContext, setBusinessContext] =
    useState<BusinessContext | null>(null)
  const [tableCards, setTableCards] =
    useState<TablePanelCardItem[]>([])
  const [selectedQrTable, setSelectedQrTable] =
    useState<TablePanelCardItem | null>(null)
  const [selectedEditTable, setSelectedEditTable] =
    useState<TablePanelCardItem | null>(null)
  const [editForm, setEditForm] =
    useState<TableEditForm | null>(null)
  const [businessName, setBusinessName] =
    useState<string>('')
  const [isLoading, setIsLoading] =
    useState<boolean>(true)
  const [hasApiError, setHasApiError] =
    useState<boolean>(false)
  const [isEditSaving, setIsEditSaving] =
    useState<boolean>(false)
  const [isDeleteSaving, setIsDeleteSaving] =
    useState<boolean>(false)
  const [isCreateSaving, setIsCreateSaving] =
    useState<boolean>(false)
  const [deletingTableId, setDeletingTableId] =
    useState<string | null>(null)
  const [editError, setEditError] =
    useState<string>('')

  const loadTableCards = useCallback(
    async (context: BusinessContext, resourceFilter: PosResourceType | 'ALL') => {
      const response = await getPosTableSettings({
        profileId: context.profileId,
        channelCode: context.channelCode,
        resourceType: resourceFilter
      })

      const mappedCards =
        (response.tables ?? []).map(mapTableSettingToCard)
      setTableCards(mappedCards)
    },
    []
  )

  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true)
      setHasApiError(false)

      try {
        const me = await getMe()
        const profileId =
          Number(me.user?.profileId ?? 0)
        const channelCode =
          String(me.user?.channelCode ?? '').trim()

        if (!profileId || !channelCode) {
          throw new Error('BUSINESS 컨텍스트를 확인할 수 없습니다.')
        }

        const context: BusinessContext = {
          profileId,
          channelCode
        }

        setBusinessContext(context)

        const nextBusinessName =
          String(me.user?.displayName ?? '').trim() || 'BUSINESS'
        setBusinessName(nextBusinessName)

        await loadTableCards(
          context,
          selectedResourceFilter
        )
      } catch {
        setHasApiError(true)
        setTableCards(FALLBACK_TABLE_CARDS)
        setBusinessName('BUSINESS')
      } finally {
        setIsLoading(false)
      }
    }

    void loadInitial()
  }, [loadTableCards, selectedResourceFilter])

  const floorOptions = useMemo(() => {
    const floorMap =
      new Map<string, number>()

    tableCards.forEach((card) => {
      if (card.isActive !== 1) {
        return
      }

      const nextFloor =
        card.floor.trim() || '1층'
      const nextSortOrder =
        Number.isFinite(card.floorSortOrder)
          ? card.floorSortOrder
          : getFloorSortOrder(nextFloor)

      if (!floorMap.has(nextFloor)) {
        floorMap.set(nextFloor, nextSortOrder)
      }
    })

    temporaryFloors.forEach((floor) => {
      const nextFloor =
        floor.trim()

      if (!nextFloor || floorMap.has(nextFloor)) {
        return
      }

      floorMap.set(nextFloor, getFloorSortOrder(nextFloor))
    })

    return Array.from(floorMap.entries())
      .sort(([leftFloor, leftOrder], [rightFloor, rightOrder]) => {
        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder
        }

        return leftFloor.localeCompare(rightFloor, 'ko-KR')
      })
      .map(([floor]) => floor)
  }, [tableCards, temporaryFloors])

  const filteredCards = useMemo(() => {
    return tableCards.filter((card) => {
      const activeMatch =
        card.isActive === 1

      const floorMatch =
        selectedFloorFilter === 'ALL' ||
        card.floor === selectedFloorFilter

      const tableTypeMatch =
        selectedTableTypeFilter === 'ALL' ||
        card.tableTypeCode === selectedTableTypeFilter

      const statusMatch =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'AVAILABLE'
          ? card.resourceStatusLabel === '비어있음'
          : selectedStatusFilter === 'IN_USE'
            ? card.resourceStatusLabel === '사용중'
            : selectedStatusFilter === 'RESERVED'
              ? card.resourceStatusLabel === '예약'
              : selectedStatusFilter === 'WAITING'
                ? card.resourceStatusLabel === '대기중'
                : true)

      return activeMatch && floorMatch && tableTypeMatch && statusMatch
    })
  }, [selectedFloorFilter, selectedStatusFilter, selectedTableTypeFilter, tableCards])
  const tableSummary = useMemo(() => {
    const total = tableCards.length
    const qrConnected = tableCards.filter((card) => card.qrStatus === 'CONNECTED').length
    const inUse = tableCards.filter((card) => card.resourceStatusCode === 'IN_USE').length
    const inactive = tableCards.filter((card) => card.isActive === 0).length

    return { total, qrConnected, inUse, inactive }
  }, [tableCards])

  const handleSoftDisconnect = async (item: TablePanelCardItem) => {
    if (!businessContext || isDeleteSaving || isEditSaving) {
      return
    }
    const tableId =
      Number(item.id)

    if (!Number.isFinite(tableId) || tableId <= 0) {
      return
    }

    setIsDeleteSaving(true)
    setDeletingTableId(item.id)

    try {
      await updatePosTableSetting(
        tableId,
        {
          profileId: businessContext.profileId,
          channelCode: businessContext.channelCode,
          isActive: 0
        }
      )

      await loadTableCards(
        businessContext,
        selectedResourceFilter
      )
      emitPosTableSettingsSync({
        channelCode: businessContext.channelCode,
        reason: 'soft-disconnect'
      })

      if (selectedQrTable?.id === item.id) {
        setSelectedQrTable(null)
      }

      if (selectedEditTable?.id === item.id) {
        handleCloseEditModal()
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '삭제 처리 중 오류가 발생했습니다.'
      setEditError(message)
    } finally {
      setIsDeleteSaving(false)
      setDeletingTableId(null)
    }
  }

  const handleOpenEditModal = (item: TablePanelCardItem) => {
    setSelectedEditTable(item)
    setEditForm({
      tableName: item.tableName,
      zoneName: item.zoneName,
      tableOptionName: item.tableOptionName,
      floor: item.floor,
      zone: item.zone,
      floorSortOrder: String(item.floorSortOrder),
      zoneSortOrder: String(item.zoneSortOrder),
      tableTypeCode: item.tableTypeCode,
      defaultPrice: String(item.defaultPrice)
    })
    setEditError('')
  }

  const handleCloseEditModal = () => {
    if (isEditSaving) {
      return
    }
    setSelectedEditTable(null)
    setEditForm(null)
    setEditError('')
  }

  const handleSaveEdit = useCallback(async (): Promise<boolean> => {
    if (!selectedEditTable || !editForm || !businessContext) {
      return false
    }

    const tableId =
      Number(selectedEditTable.id)

    if (!Number.isFinite(tableId) || tableId <= 0) {
      setEditError('수정할 테이블 정보를 확인할 수 없습니다.')
      return false
    }

    const nextTableName =
      editForm.tableName.trim()
    const nextZoneName =
      editForm.zoneName.trim()
    const nextTableOptionName =
      editForm.tableOptionName.trim()
    const nextFloor =
      editForm.floor.trim() || '1층'
    const nextZone =
      editForm.zone.trim() || '홀'
    const nextFloorSortOrder =
      Number.parseInt(String(editForm.floorSortOrder || '1').replace(/[^\d-]/g, ''), 10)
    const nextZoneSortOrder =
      Number.parseInt(String(editForm.zoneSortOrder || '1').replace(/[^\d-]/g, ''), 10)
    const nextDefaultPrice =
      Number.parseInt(String(editForm.defaultPrice || '0').replace(/[^\d-]/g, ''), 10)

    if (!nextTableName || !nextZoneName || !nextTableOptionName) {
      setEditError('테이블명, 위치/구역, 좌석 옵션은 필수입니다.')
      return false
    }

    if (!Number.isInteger(nextFloorSortOrder) || !Number.isInteger(nextZoneSortOrder)) {
      setEditError('층 정렬과 구역 정렬은 숫자로 입력해 주세요.')
      return false
    }

    if (!Number.isFinite(nextDefaultPrice) || nextDefaultPrice < 0) {
      setEditError('기본가격은 0 이상의 숫자여야 합니다.')
      return false
    }

    setIsEditSaving(true)
    setEditError('')

    try {
      await updatePosTableSetting(
        tableId,
        {
          profileId: businessContext.profileId,
          channelCode: businessContext.channelCode,
          tableName: nextTableName,
          zoneName: nextZoneName,
          tableOptionName: nextTableOptionName,
          floor: nextFloor,
          zone: nextZone,
          floorSortOrder: nextFloorSortOrder,
          zoneSortOrder: nextZoneSortOrder,
          tableTypeCode: normalizeTableTypeCode(editForm.tableTypeCode),
          defaultPrice: nextDefaultPrice
        }
      )

      await loadTableCards(
        businessContext,
        selectedResourceFilter
      )
      emitPosTableSettingsSync({
        channelCode: businessContext.channelCode,
        reason: 'update'
      })

      handleCloseEditModal()
      onSaveSuccess?.()
      return true
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '수정 저장 중 오류가 발생했습니다.'
      setEditError(message)
      return false
    } finally {
      setIsEditSaving(false)
    }
  }, [
    businessContext,
    editForm,
    loadTableCards,
    onSaveSuccess,
    selectedEditTable,
    selectedResourceFilter
  ])

  const handleSaveFromHeader = useCallback(async (): Promise<boolean> => {
    if (selectedEditTable && editForm) {
      return handleSaveEdit()
    }

    if (!businessContext || isDeleteSaving || isEditSaving) {
      return false
    }

    await loadTableCards(
      businessContext,
      selectedResourceFilter
    )
    emitPosTableSettingsSync({
      channelCode: businessContext.channelCode,
      reason: 'save'
    })
    onSaveSuccess?.()
    return true
  }, [
    businessContext,
    editForm,
    handleSaveEdit,
    isDeleteSaving,
    isEditSaving,
    loadTableCards,
    onSaveSuccess,
    selectedEditTable,
    selectedResourceFilter
  ])

  const handleAddFloor = () => {
    const nextFloor =
      window.prompt('추가할 플로어명을 입력해 주세요. 예) 2층')?.trim()

    if (!nextFloor) {
      return
    }

    setTemporaryFloors((prev) => (
      prev.includes(nextFloor)
        ? prev
        : [...prev, nextFloor]
    ))
    setSelectedFloorFilter(nextFloor)
  }

  const handleAddTable = useCallback(async () => {
    if (!businessContext || isCreateSaving || isEditSaving || isDeleteSaving) {
      return
    }

    setIsCreateSaving(true)

    try {
      const nextIndex =
        tableCards.length + 1
      const selectedFloor =
        selectedFloorFilter === 'ALL'
          ? '1층'
          : selectedFloorFilter
      const selectedFloorSortOrder =
        getFloorSortOrder(selectedFloor)

      await createPosTableSetting({
        profileId: businessContext.profileId,
        channelCode: businessContext.channelCode,
        tableName: `테이블 ${nextIndex}`,
        zoneName: '홀',
        tableOptionName: '4인석',
        floor: selectedFloor,
        zone: '홀',
        floorSortOrder: selectedFloorSortOrder,
        zoneSortOrder: 1,
        tableTypeCode: 'STANDARD',
        resourceType: 'TABLE',
        defaultPrice: 0,
        sortOrder: nextIndex
      })

      await loadTableCards(
        businessContext,
        selectedResourceFilter
      )

      setTemporaryFloors((prev) => (
        prev.filter((floor) => floor !== selectedFloor)
      ))

      emitPosTableSettingsSync({
        channelCode: businessContext.channelCode,
        reason: 'create'
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '테이블 추가 중 오류가 발생했습니다.'
      setEditError(message)
    } finally {
      setIsCreateSaving(false)
    }
  }, [
    businessContext,
    isCreateSaving,
    isDeleteSaving,
    isEditSaving,
    loadTableCards,
    selectedFloorFilter,
    selectedResourceFilter,
    tableCards.length
  ])
  useEffect(() => {
    onCreateActionChange?.(handleAddTable)

    return () => {
      onCreateActionChange?.(null)
    }
  }, [handleAddTable, onCreateActionChange])

  useEffect(() => {
    onFloorControlChange?.({
      selectedFloor: selectedFloorFilter,
      floorOptions,
      onSelectFloor: (floor: string) => setSelectedFloorFilter(floor),
      onAddFloor: handleAddFloor
    })

    return () => {
      onFloorControlChange?.(null)
    }
  }, [floorOptions, handleAddFloor, onFloorControlChange, selectedFloorFilter])

  useEffect(() => {
    onStatusControlChange?.({
      selectedStatus: selectedStatusFilter,
      statusOptions: STATUS_FILTER_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label
      })),
      onSelectStatus: (status: string) =>
        setSelectedStatusFilter(status as (typeof STATUS_FILTER_OPTIONS)[number]['value'])
    })

    return () => {
      onStatusControlChange?.(null)
    }
  }, [onStatusControlChange, selectedStatusFilter])

  useEffect(() => {
    onTypeControlChange?.({
      selectedTableType: selectedTableTypeFilter,
      tableTypeOptions: TABLE_TYPE_FILTER_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label
      })),
      onSelectTableType: (tableType: string) =>
        setSelectedTableTypeFilter(tableType as 'ALL' | PosTableTypeCode)
    })

    return () => {
      onTypeControlChange?.(null)
    }
  }, [onTypeControlChange, selectedTableTypeFilter])

  useEffect(() => {
    onSavingChange?.(
      isLoading || isEditSaving || isDeleteSaving
    )
  }, [isDeleteSaving, isEditSaving, isLoading, onSavingChange])

  useEffect(() => {
    if (!onSaveActionChange) {
      return
    }

    onSaveActionChange(handleSaveFromHeader)

    return () => {
      onSaveActionChange(null)
    }
  }, [handleSaveFromHeader, onSaveActionChange])

  useEffect(() => {
    if (!businessContext) {
      return
    }

    return subscribePosTableSettingsSync({
      channelCode: businessContext.channelCode,
      onSync: () => {
        void loadTableCards(
          businessContext,
          selectedResourceFilter
        )
      }
    })
  }, [
    businessContext,
    loadTableCards,
    selectedResourceFilter
  ])

  return (
    <section className={styles.modulePanel}>
      <header className={styles.tableManageHeader}>
      </header>

      {viewMode === 'DASHBOARD' ? (
        <div className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>전체 테이블</p>
            <p className={styles.summaryValue}>{tableSummary.total}개</p>
          </article>
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>QR 연결</p>
            <p className={styles.summaryValue}>{tableSummary.qrConnected}개</p>
          </article>
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>사용중</p>
            <p className={styles.summaryValue}>{tableSummary.inUse}개</p>
          </article>
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>비활성</p>
            <p className={styles.summaryValue}>{tableSummary.inactive}개</p>
          </article>
        </div>
      ) : (
      <div className={styles.tableManageGrid}>
        {isLoading ? (
          <article className={styles.tableManageCard}>
            <div className={styles.tableManageCardTop}>
              <h3 className={styles.tableManageCardTitle}>테이블 정보를 불러오는 중입니다.</h3>
            </div>
            <p className={styles.tableManageMeta}>잠시만 기다려주세요.</p>
          </article>
        ) : filteredCards.length < 1 ? (
          <article className={styles.tableManageCard}>
            <div className={styles.tableManageCardTop}>
              <h3 className={styles.tableManageCardTitle}>등록된 테이블이 없습니다.</h3>
            </div>
            <p className={styles.tableManageMeta}>필터 조건을 변경하거나 테이블을 추가해 주세요.</p>
          </article>
        ) : (
          filteredCards.map((item) => (
            <article key={item.id} className={styles.tableManageCard}>
              <div className={styles.tableManageCardTop}>
                <h3 className={styles.tableManageCardTitle}>{item.tableName}</h3>
                <div className={styles.tableManageBadgeRow}>
                  <span className={styles.tableManageTypeBadge}>{item.tableTypeCode}</span>
                  <span className={styles.tableManageQrBadge}>{item.qrStatusLabel}</span>
                </div>
              </div>

              <p className={styles.tableManageMeta}>{item.zoneTypeLabel}</p>
              <p className={styles.tableManageMeta}>{item.floor} · {item.zone}</p>
              <p className={styles.tableManageMetaStrong}>{item.defaultPriceLabel}</p>
              <p className={styles.tableManageMeta}>{item.resourceStatusLabel}</p>

              <div className={styles.tableManageOptionBox}>
                <p className={styles.tableManageOptionLabel}>좌석 옵션</p>
                <p className={styles.tableManageOptionValue}>{item.seatOptionLabel}</p>
              </div>

              <div className={styles.tableManageActionRow}>
                <button
                  type="button"
                  className={styles.tableManagePrimaryButton}
                  onClick={() => handleOpenEditModal(item)}
                  disabled={isDeleteSaving || isEditSaving}
                >
                  수정
                </button>
                <button
                  type="button"
                  className={styles.tableManageOutlineButton}
                  onClick={() => setSelectedQrTable(item)}
                  disabled={isDeleteSaving || isEditSaving}
                >
                  QR 보기
                </button>
                <button
                  type="button"
                  className={styles.tableManageOutlineButton}
                  onClick={() => handleSoftDisconnect(item)}
                  disabled={isDeleteSaving || isEditSaving}
                >
                  {isDeleteSaving && deletingTableId === item.id ? 'DELETING' : 'DELETE'}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
      )}

      {selectedQrTable ? (
        <PosTableQrModal
          isOpen={Boolean(selectedQrTable)}
          businessName={businessName}
          tableName={selectedQrTable.tableName}
          zoneName={selectedQrTable.zoneName}
          tableOptionName={selectedQrTable.tableOptionName}
          tableCode={selectedQrTable.tableCode}
          tableOrderUrl={selectedQrTable.tableOrderUrl}
          qrCodeValue={selectedQrTable.qrCodeValue}
          qrStatus={selectedQrTable.qrStatus}
          onClose={() => setSelectedQrTable(null)}
        />
      ) : null}

      {selectedEditTable && editForm ? (
        <div
          role="presentation"
          style={EDIT_MODAL_OVERLAY_STYLE}
          onClick={handleCloseEditModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="테이블 수정"
            style={EDIT_MODAL_CARD_STYLE}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className={styles.moduleTitle}>테이블 수정</h3>

            <div style={EDIT_MODAL_GRID_STYLE}>
              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>테이블명</span>
                <input
                  type="text"
                  value={editForm.tableName}
                  style={EDIT_INPUT_STYLE}
                  onChange={(event) => setEditForm((prev) => prev ? { ...prev, tableName: event.target.value } : prev)}
                />
              </label>

              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>위치/구역</span>
                <input
                  type="text"
                  value={editForm.zoneName}
                  style={EDIT_INPUT_STYLE}
                  onChange={(event) => setEditForm((prev) => prev ? { ...prev, zoneName: event.target.value } : prev)}
                />
              </label>

              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>좌석 옵션</span>
                <input
                  type="text"
                  value={editForm.tableOptionName}
                  style={EDIT_INPUT_STYLE}
                  onChange={(event) => setEditForm((prev) => prev ? { ...prev, tableOptionName: event.target.value } : prev)}
                />
              </label>

              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>층</span>
                <input
                  type="text"
                  value={editForm.floor}
                  style={EDIT_INPUT_STYLE}
                  onChange={(event) => setEditForm((prev) => prev ? { ...prev, floor: event.target.value } : prev)}
                />
              </label>

              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>구역</span>
                <input
                  type="text"
                  value={editForm.zone}
                  style={EDIT_INPUT_STYLE}
                  onChange={(event) => setEditForm((prev) => prev ? { ...prev, zone: event.target.value } : prev)}
                />
              </label>

              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>층 정렬</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editForm.floorSortOrder}
                  style={EDIT_INPUT_STYLE}
                  onChange={(event) => setEditForm((prev) => prev ? { ...prev, floorSortOrder: event.target.value } : prev)}
                />
              </label>

              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>구역 정렬</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editForm.zoneSortOrder}
                  style={EDIT_INPUT_STYLE}
                  onChange={(event) => setEditForm((prev) => prev ? { ...prev, zoneSortOrder: event.target.value } : prev)}
                />
              </label>
              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>운영 등급</span>
                <select
                  value={editForm.tableTypeCode}
                  style={EDIT_INPUT_STYLE}
                  onChange={(event) => setEditForm((prev) => prev ? { ...prev, tableTypeCode: normalizeTableTypeCode(event.target.value) } : prev)}
                >
                  <option value="STANDARD">스탠다드</option>
                   <option value="DELUXE">디럭스</option>
                  <option value="PREMIUM">프리미엄</option>
                  <option value="VIP">VIP</option>
                </select>
              </label>

              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>기본가격</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editForm.defaultPrice}
                  style={EDIT_INPUT_STYLE}
                  onChange={(event) => setEditForm((prev) => prev ? { ...prev, defaultPrice: event.target.value } : prev)}
                />
              </label>

              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>상태 / QR</span>
                <input
                  type="text"
                  value={`${selectedEditTable.resourceStatusLabel} / ${selectedEditTable.qrStatusLabel}`}
                  style={{
                    ...EDIT_INPUT_STYLE,
                    background: '#f8fafc'
                  }}
                  readOnly
                  disabled
                />
              </label>
            </div>

            <p style={EDIT_HELP_STYLE}>
              테이블 코드와 QR 생성 정보는 기존 설정 정책에 따라 별도 관리됩니다.
            </p>

            {editError ? (
              <p style={{ ...EDIT_HELP_STYLE, color: '#b91c1c' }}>
                {editError}
              </p>
            ) : null}

            <div style={EDIT_ACTION_ROW_STYLE}>
              <button
                type="button"
                className={styles.tableManageOutlineButton}
                onClick={handleCloseEditModal}
                disabled={isEditSaving}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.tableManagePrimaryButton}
                onClick={handleSaveEdit}
                disabled={isEditSaving}
              >
                {isEditSaving ? '저장중' : '수정 완료'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
