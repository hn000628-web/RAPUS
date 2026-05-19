// FILE : frontend/app/(pos)/pos/table/settings/_components/TableManagePanel.tsx
// ROOT : frontend/app/(pos)/pos/table/settings/_components/TableManagePanel.tsx
// STATUS : MODIFY MODE
// ROLE : POS TABLE SETTINGS TABLE PANEL
// CHANGE SUMMARY :
// - /pos/settings/table ??湲곗〈 議고쉶/?섏젙 API ?ъ궗??// - 移대뱶 [?섏젙] 踰꾪듉 紐⑤떖 ?곌껐 + PATCH ???+ 紐⑸줉 ?ъ“??// - 湲곗〈 QR 蹂닿린 紐⑤떖 援ъ“ ?ъ궗??
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
  { value: 'ALL', label: '?댁쁺 ?깃툒: ?꾩껜' },
  { value: 'STANDARD', label: '?댁쁺 ?깃툒: ?ㅽ깲?ㅻ뱶' },
  { value: 'DELUXE', label: 'TABLE TYPE: DELUXE' },
  { value: 'PREMIUM', label: '?댁쁺 ?깃툒: ?꾨━誘몄뾼' },
  { value: 'VIP', label: '?댁쁺 ?깃툒: VIP' }
]

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: '?꾩껜' },
  { value: 'IN_USE', label: 'IN_USE' },
  { value: 'AVAILABLE', label: '鍮꾩뼱?덉쓬' },
  { value: 'RESERVED', label: '?덉빟' },
  { value: 'WAITING', label: '?湲곗쨷' }
] as const

const FALLBACK_TABLE_CARDS: TablePanelCardItem[] = Array.from({ length: 8 }, (_, index) => ({
  id: `fallback-${index + 1}`,
  tableName: `?뚯씠釉?${index + 1}`,
  isActive: 1,
  tableTypeCode: 'STANDARD',
  qrStatus: 'CONNECTED',
  qrStatusLabel: 'QR ?곌껐',
  zoneName: '?',
  tableOptionName: '4?몄꽍',
  zoneTypeLabel: '? 쨌 4?몄꽍',
  defaultPrice: 0,
  defaultPriceLabel: '₩0',
  seatOptionLabel: '4?몄꽍',
  resourceStatusCode: 'AVAILABLE',
  resourceStatusLabel: '鍮꾩뼱?덉쓬',
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
    return '?덉빟'
  }

  if (status === 'WAITING') {
    return '?湲곗쨷'
  }

  if (status === 'AVAILABLE') {
    return '鍮꾩뼱?덉쓬'
  }

  return '鍮꾩뼱?덉쓬'
}

function mapTableSettingToCard(item: PosTableSettingItem): TablePanelCardItem {
  const tableTypeCode =
    normalizeTableTypeCode(item.tableTypeCode)

  const zoneName =
    String(item.zoneName ?? '').trim() || '?'

  const seatOptionName =
    String(item.tableOptionName ?? '').trim() || '4?몄꽍'

  const defaultPrice =
    Number(item.defaultPrice ?? 0)

  const resourceStatusCode =
    String(item.resourceStatus ?? '').trim().toUpperCase() || 'AVAILABLE'

  return {
    id: String(item.id),
    tableName: String(item.tableName ?? '').trim() || `?뚯씠釉?${item.id}`,
    isActive: Number(item.isActive ?? 1),
    tableTypeCode,
    qrStatus: item.qrStatus,
    qrStatusLabel: item.qrStatus === 'CONNECTED' ? 'QR CONNECTED' : 'QR DISCONNECTED',
    zoneName,
    tableOptionName: seatOptionName,
    zoneTypeLabel: `${zoneName} 쨌 ${seatOptionName}`,
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
  hideCreateButton
}: TableManagePanelProps) {
  const [selectedResourceFilter] =
    useState<PosResourceType | 'ALL'>('TABLE')
  const [selectedTableTypeFilter, setSelectedTableTypeFilter] =
    useState<'ALL' | PosTableTypeCode>('ALL')
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<(typeof STATUS_FILTER_OPTIONS)[number]['value']>('ALL')
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
          throw new Error('BUSINESS 而⑦뀓?ㅽ듃瑜??뺤씤?????놁뒿?덈떎.')
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

  const filteredCards = useMemo(() => {
    return tableCards.filter((card) => {
      const activeMatch =
        card.isActive === 1

      const tableTypeMatch =
        selectedTableTypeFilter === 'ALL' ||
        card.tableTypeCode === selectedTableTypeFilter

      const statusMatch =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'AVAILABLE'
          ? card.resourceStatusLabel === '鍮꾩뼱?덉쓬'
          : selectedStatusFilter === 'IN_USE'
            ? card.resourceStatusLabel === 'IN_USE'
            : selectedStatusFilter === 'RESERVED'
              ? card.resourceStatusLabel === '?덉빟'
              : selectedStatusFilter === 'WAITING'
                ? card.resourceStatusLabel === '?湲곗쨷'
                : true)

      return activeMatch && tableTypeMatch && statusMatch
    })
  }, [selectedStatusFilter, selectedTableTypeFilter, tableCards])

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
          : '??젣 泥섎━ 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.'
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
      setEditError('?섏젙???뚯씠釉??뺣낫瑜??뺤씤?????놁뒿?덈떎.')
      return false
    }

    const nextTableName =
      editForm.tableName.trim()
    const nextZoneName =
      editForm.zoneName.trim()
    const nextTableOptionName =
      editForm.tableOptionName.trim()
    const nextDefaultPrice =
      Number.parseInt(String(editForm.defaultPrice || '0').replace(/[^\d-]/g, ''), 10)

    if (!nextTableName || !nextZoneName || !nextTableOptionName) {
      setEditError('?뚯씠釉붾챸, ?꾩튂/援ъ뿭, 醫뚯꽍 ?듭뀡? ?꾩닔?낅땲??')
      return false
    }

    if (!Number.isFinite(nextDefaultPrice) || nextDefaultPrice < 0) {
      setEditError('湲곕낯媛寃⑹? 0 ?댁긽???レ옄?ъ빞 ?⑸땲??')
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
          : '?섏젙 ???以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.'
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

  const handleAddTable = useCallback(async () => {
    if (!businessContext || isCreateSaving || isEditSaving || isDeleteSaving) {
      return
    }

    setIsCreateSaving(true)

    try {
      const nextIndex =
        tableCards.length + 1

      await createPosTableSetting({
        profileId: businessContext.profileId,
        channelCode: businessContext.channelCode,
        tableName: `?뚯씠釉?${nextIndex}`,
        zoneName: '?',
        tableOptionName: '4?몄꽍',
        tableTypeCode: 'STANDARD',
        resourceType: 'TABLE',
        defaultPrice: 0,
        sortOrder: nextIndex
      })

      await loadTableCards(
        businessContext,
        selectedResourceFilter
      )

      emitPosTableSettingsSync({
        channelCode: businessContext.channelCode,
        reason: 'create'
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '?뚯씠釉?異붽? 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.'
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
        <div className={styles.moduleHeader}>
          <h2 className={styles.moduleTitle}>?뚯씠釉붽?由?</h2>
        </div>

        <div className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>?꾩껜 ?뚯씠釉?</p>
            <p className={styles.summaryValue}>{tableSummary.total}媛?</p>
          </article>
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>QR ?곌껐</p>
            <p className={styles.summaryValue}>{tableSummary.qrConnected}媛?</p>
          </article>
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>?ъ슜以?</p>
            <p className={styles.summaryValue}>{tableSummary.inUse}媛?</p>
          </article>
          <article className={styles.summaryCard}>
            <p className={styles.summaryLabel}>鍮꾪솢??</p>
            <p className={styles.summaryValue}>{tableSummary.inactive}媛?</p>
          </article>
        </div>

        <div className={styles.tableManageControlRow}>
          <div className={styles.tableManageSelectGroup}>
            <span
              className={`${styles.tableManageSelect} ${styles.tableManageFixedSelect}`}
              aria-label="由ъ냼?????怨좎젙"
            >
              ?뚯씠釉?            </span>

            <select
              className={styles.tableManageSelect}
              value={selectedStatusFilter}
              aria-label="?곹깭 ?꾪꽣"
              onChange={(event) => setSelectedStatusFilter(event.target.value as (typeof STATUS_FILTER_OPTIONS)[number]['value'])}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className={styles.tableManageSelect}
              value={selectedTableTypeFilter}
              aria-label="?댁쁺 ?깃툒"
              onChange={(event) => setSelectedTableTypeFilter(event.target.value as 'ALL' | PosTableTypeCode)}
            >
              {TABLE_TYPE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {!hideCreateButton ? (
            <button
              type="button"
              className={styles.primaryInlineButton}
              onClick={() => {
                void handleAddTable()
              }}
              disabled={isCreateSaving || isDeleteSaving || isEditSaving}
            >
              {isCreateSaving ? '추가중' : '+ 테이블추가'}
            </button>
          ) : null}
        </div>
      </header>

      <div className={styles.tableManageGrid}>
        {isLoading ? (
          <article className={styles.tableManageCard}>
            <div className={styles.tableManageCardTop}>
              <h3 className={styles.tableManageCardTitle}>?뚯씠釉??뺣낫瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎.</h3>
            </div>
            <p className={styles.tableManageMeta}>?좎떆留?湲곕떎?ㅼ＜?몄슂.</p>
          </article>
        ) : filteredCards.length < 1 ? (
          <article className={styles.tableManageCard}>
            <div className={styles.tableManageCardTop}>
              <h3 className={styles.tableManageCardTitle}>?깅줉???뚯씠釉붿씠 ?놁뒿?덈떎.</h3>
            </div>
            <p className={styles.tableManageMeta}>?꾪꽣 議곌굔??蹂寃쏀븯嫄곕굹 ?뚯씠釉붿쓣 異붽??댁＜?몄슂.</p>
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
              <p className={styles.tableManageMetaStrong}>{item.defaultPriceLabel}</p>
              <p className={styles.tableManageMeta}>{item.resourceStatusLabel}</p>

              <div className={styles.tableManageOptionBox}>
                <p className={styles.tableManageOptionLabel}>醫뚯꽍 ?듭뀡</p>
                <p className={styles.tableManageOptionValue}>{item.seatOptionLabel}</p>
              </div>

              <div className={styles.tableManageActionRow}>
                <button
                  type="button"
                  className={styles.tableManagePrimaryButton}
                  onClick={() => handleOpenEditModal(item)}
                  disabled={isDeleteSaving || isEditSaving}
                >
                  ?섏젙
                </button>
                <button
                  type="button"
                  className={styles.tableManageOutlineButton}
                  onClick={() => setSelectedQrTable(item)}
                  disabled={isDeleteSaving || isEditSaving}
                >
                  QR 蹂닿린
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
            aria-label="?뚯씠釉??섏젙"
            style={EDIT_MODAL_CARD_STYLE}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className={styles.moduleTitle}>?뚯씠釉??섏젙</h3>

            <div style={EDIT_MODAL_GRID_STYLE}>
              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>?뚯씠釉붾챸</span>
                <input
                  type="text"
                  value={editForm.tableName}
                  style={EDIT_INPUT_STYLE}
                  onChange={(event) => setEditForm((prev) => prev ? { ...prev, tableName: event.target.value } : prev)}
                />
              </label>

              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>?꾩튂/援ъ뿭</span>
                <input
                  type="text"
                  value={editForm.zoneName}
                  style={EDIT_INPUT_STYLE}
                  onChange={(event) => setEditForm((prev) => prev ? { ...prev, zoneName: event.target.value } : prev)}
                />
              </label>

              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>醫뚯꽍 ?듭뀡</span>
                <input
                  type="text"
                  value={editForm.tableOptionName}
                  style={EDIT_INPUT_STYLE}
                  onChange={(event) => setEditForm((prev) => prev ? { ...prev, tableOptionName: event.target.value } : prev)}
                />
              </label>

              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>?댁쁺 ?깃툒</span>
                <select
                  value={editForm.tableTypeCode}
                  style={EDIT_INPUT_STYLE}
                  onChange={(event) => setEditForm((prev) => prev ? { ...prev, tableTypeCode: normalizeTableTypeCode(event.target.value) } : prev)}
                >
                  <option value="STANDARD">?ㅽ깲?ㅻ뱶</option>
                   <option value="DELUXE">?붾윮??</option>
                  <option value="PREMIUM">?꾨━誘몄뾼</option>
                  <option value="VIP">VIP</option>
                </select>
              </label>

              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>湲곕낯媛寃?</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editForm.defaultPrice}
                  style={EDIT_INPUT_STYLE}
                  onChange={(event) => setEditForm((prev) => prev ? { ...prev, defaultPrice: event.target.value } : prev)}
                />
              </label>

              <label style={EDIT_FIELD_STYLE}>
                <span style={EDIT_LABEL_STYLE}>?곹깭 / QR</span>
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
              ?뚯씠釉?肄붾뱶? QR ?앹꽦 ?뺣낫??湲곗〈 ?ㅼ젙 ?뺤콉???곕씪 蹂꾨룄 愿由щ맗?덈떎.
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
                痍⑥냼
              </button>
              <button
                type="button"
                className={styles.tableManagePrimaryButton}
                onClick={handleSaveEdit}
                disabled={isEditSaving}
              >
                {isEditSaving ? '??μ쨷' : '?섏젙 ?꾨즺'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
