// FILE : frontend/app/(pos)/pos/settings/table/page.tsx
// ROOT : frontend/app/(pos)/pos/settings/table/page.tsx
// STATUS : MODIFY MODE
// ROLE : POS TABLE SETTINGS PAGE
// CHANGE SUMMARY :
// - PosTableQrModal import 異붽?
// - QR 蹂닿린 踰꾪듉 ?ㅼ젣 紐⑤떖 ?ㅽ뵂?쇰줈 蹂寃?// - selectedQrTable state 異붽?
// - PosTableItem??tableCode / tableOrderUrl / qrCodeValue 異붽?
// - API ?묐떟 QR ?꾨뱶 留ㅽ븨 異붽?
// - 湲곗〈 ?뚯씠釉?議고쉶 / 異붽? / ?섏젙 / ??젣 濡쒖쭅 ?좎?

'use client'

// SECTION 01 : IMPORT

import {
  useCallback,
  useEffect,
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

import {
  getMe,
  type MeResponse
} from '@/lib/authApi'
import {
  getProfileByChannelCode
} from '@/lib/profile-summary-api'

import {
  createPosTableSetting,
  getPosTableSettings,
  updatePosTableSetting
} from '@/lib/business/pos/posTableSettingsApi'
import {
  emitPosTableSettingsSync,
  subscribePosTableSettingsSync
} from '@/lib/business/pos/shared/posTableSettingsRuntimeSync'

import type {
  PosResourceType,
  PosTableQrStatus,
  PosTableSettingItem
} from '@/lib/business/pos/posTableSettingsApi'

import PosTableQrModal from './components/PosTableQrModal'

import styles from './PosTableSettingsPage.module.css'

// SECTION 02 : TYPE

type QrStatus =
  PosTableQrStatus

type PosTableItem = {
  id: number
  resourceType: PosResourceType
  tableName: string
  zoneName: string
  tableOptionName: string
  tableTypeCode: PosTableTypeCode
  defaultPrice: number
  qrStatus: QrStatus
  tableCode: string | null
  tableOrderUrl: string | null
  qrCodeValue: string | null
}

type EditingDraft = {
  tableName: string
  zoneName: string
  tableOptionName: string
  tableTypeCode: PosTableTypeCode
  tableCode: string
  defaultPrice: string
}

type BusinessContext = {
  profileId: number
  channelCode: string
}

type PosResourceFilterType =
  | 'ALL'
  | PosResourceType

type PosTableTypeCode =
  | 'STANDARD'
  | 'DELUXE'
  | 'PREMIUM'
  | 'VIP'

// SECTION 03 : CONSTANT

const DEFAULT_ZONE_NAME =
  '홀'

const DEFAULT_TABLE_OPTION_NAME =
  '4인석'

const DEFAULT_BUSINESS_NAME =
  '상호명 미설정'

const DEFAULT_TABLE_TYPE_CODE: PosTableTypeCode =
  'STANDARD'

const POS_RESOURCE_TYPE_OPTIONS: Array<{
  value: PosResourceFilterType
  label: string
  description: string
  addLabel: string
  defaultName: string
}> = [
  { value: 'ALL', label: '전체', description: '전체 리소스 보기', addLabel: '테이블 추가', defaultName: '테이블' },
  { value: 'TABLE', label: '테이블', description: '식당 / 카페 / 술집', addLabel: '테이블 추가', defaultName: '테이블' },
  { value: 'ROOM', label: '객실/룸', description: '호텔 / 모텔 / 노래방 / 나이트클럽 룸', addLabel: '객실 추가', defaultName: '객실' },
  { value: 'SPACE', label: '공간', description: '공간임대 / 스터디룸 / 회의실 / 파티룸 / 연습실', addLabel: '공간 추가', defaultName: '공간' },
  { value: 'SEAT', label: '좌석', description: '독서실 / 스터디카페 / 좌석제 매장', addLabel: '좌석 추가', defaultName: '좌석' },
  { value: 'BOOTH', label: '부스/시술석', description: '미용실 / 네일샵 / 마사지샵 / 상담실 / 병원 진료석', addLabel: '부스 추가', defaultName: '부스' }
]

const POS_TABLE_TYPE_OPTIONS: Array<{
  value: PosTableTypeCode
  label: string
}> = [
  { value: 'STANDARD', label: '스탠다드' },
  { value: 'DELUXE', label: '디럭스' },
  { value: 'PREMIUM', label: '프리미엄' },
  { value: 'VIP', label: 'VIP' }
]

// SECTION 04 : COMPONENT

export default function PosTableSettingsPage() {
  const router = useRouter()

  // SECTION 05 : STATE

  const [businessContext, setBusinessContext] =
    useState<BusinessContext | null>(null)

  const [tables, setTables] =
    useState<PosTableItem[]>([])

  const [businessName, setBusinessName] =
    useState<string>(DEFAULT_BUSINESS_NAME)

  const [editingTableId, setEditingTableId] =
    useState<number | null>(null)

  const [editingDraft, setEditingDraft] =
    useState<EditingDraft>({
      tableName: '',
      zoneName: '',
      tableOptionName: '',
      tableTypeCode: DEFAULT_TABLE_TYPE_CODE,
      tableCode: '',
      defaultPrice: '0'
    })

  const [selectedQrTable, setSelectedQrTable] =
    useState<PosTableItem | null>(null)

  const [selectedResourceType, setSelectedResourceType] =
    useState<PosResourceFilterType>('ALL')

  const [selectedTableTypeCode, setSelectedTableTypeCode] =
    useState<PosTableTypeCode>(DEFAULT_TABLE_TYPE_CODE)

  const [isLoading, setIsLoading] =
    useState<boolean>(true)

  const [isSaving, setIsSaving] =
    useState<boolean>(false)

  const [errorMessage, setErrorMessage] =
    useState<string>('')

  // SECTION 06 : CONTEXT RESOLVE FUNCTION

  function resolveBusinessContext(
    loginInfo: MeResponse
  ): BusinessContext | null {

    const user =
      loginInfo?.user

    if (!user) {
      return null
    }

    const profileId =
      Number(user.profileId || 0)

    const channelCode =
      String(user.channelCode || '').trim()

    const isBusinessProfile =
      user.profileType === 'BUSINESS'

    if (
      !isBusinessProfile ||
      !profileId ||
      !channelCode
    ) {
      return null
    }

    return {
      profileId,
      channelCode
    }

  }

  function resolveBusinessName(
    candidates: Array<unknown>
  ): string {
    for (const candidate of candidates) {
      const value =
        String(candidate ?? '').trim()

      if (value) {
        return value
      }
    }

    return DEFAULT_BUSINESS_NAME
  }

  // SECTION 07 : DATA MAP FUNCTION

  function mapApiTableToViewItem(
    table: PosTableSettingItem
  ): PosTableItem {

    return {
      id: table.id,
      resourceType: table.resourceType ?? 'TABLE',
      tableName: table.tableName,
      zoneName: table.zoneName,
      tableOptionName: table.tableOptionName,
      tableTypeCode: normalizeTableTypeCode(table.tableTypeCode),
      defaultPrice: Number(table.defaultPrice ?? 0),
      qrStatus: table.qrStatus,
      tableCode: table.tableCode ?? null,
      tableOrderUrl: table.tableOrderUrl ?? null,
      qrCodeValue: table.qrCodeValue ?? null
    }

  }

  function getResourceTypeMeta(resourceType: PosResourceFilterType) {
    return POS_RESOURCE_TYPE_OPTIONS.find((item) => item.value === resourceType) ?? POS_RESOURCE_TYPE_OPTIONS[0]
  }

  function getDefaultResourceName(
    resourceType: PosResourceFilterType,
    nextIndex: number
  ): string {
    const meta = getResourceTypeMeta(resourceType)
    return `${meta.defaultName} ${nextIndex}`
  }

  function getAddButtonLabel(
    resourceType: PosResourceFilterType
  ): string {
    return getResourceTypeMeta(resourceType).addLabel
  }

  function resolveCreateResourceType(
    resourceType: PosResourceFilterType
  ): PosResourceType {
    if (resourceType === 'ALL') {
      return 'TABLE'
    }
    return resourceType
  }

  function getErrorMessage(
    error: unknown
  ): string {

    if (error instanceof Error) {
      return error.message
    }

    return '테이블 설정 처리 중 오류가 발생했습니다.'

  }

  function normalizeDefaultPriceInput(
    value: string
  ): number {
    const trimmed = String(value || '').trim()
    if (!trimmed) {
      return 0
    }

    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
      return 0
    }

    if (parsed < 0) {
      return 0
    }

    return Math.floor(parsed)
  }

  function normalizeTableTypeCode(
    value: string | null | undefined
  ): PosTableTypeCode {
    const normalizedValue =
      String(value ?? '').trim().toUpperCase()

    if (
      normalizedValue === 'STANDARD' ||
      normalizedValue === 'DELUXE' ||
      normalizedValue === 'PREMIUM' ||
      normalizedValue === 'VIP'
    ) {
      return normalizedValue
    }

    return DEFAULT_TABLE_TYPE_CODE
  }

  function normalizeTableCodeInput(
    value: string
  ): string {
    const uppercaseValue =
      String(value ?? '').toUpperCase()

    const alphanumericOnly =
      uppercaseValue.replace(/[^A-Z0-9]/g, '')

    return alphanumericOnly.slice(0, 3)
  }

  // SECTION 08 : DATA LOAD FUNCTION

  const loadTables = useCallback(
    async (
      context: BusinessContext,
      resourceType: PosResourceType | 'ALL' = 'TABLE'
    ) => {

      const response =
        await getPosTableSettings({
          profileId: context.profileId,
          channelCode: context.channelCode,
          resourceType
        })

      setTables(
        response.tables
          .filter((table) => Number(table.isActive ?? 1) === 1)
          .map(mapApiTableToViewItem)
      )

    },
    []
  )

  const loadBusinessContextAndTables = useCallback(
    async () => {

      setIsLoading(true)
      setErrorMessage('')

      try {

        const loginInfo =
          await getMe()

        const resolvedContext =
          resolveBusinessContext(loginInfo)

        if (!resolvedContext) {
          throw new Error('BUSINESS 프로필 컨텍스트를 찾을 수 없습니다.')
        }

        const meDisplayName =
          String(loginInfo.user?.displayName || '').trim()
        let nextBusinessName =
          resolveBusinessName([meDisplayName])

        try {
          const profileSummary =
            await getProfileByChannelCode(
              resolvedContext.channelCode
            )

          nextBusinessName =
            resolveBusinessName([
              profileSummary.channelName,
              profileSummary.displayName,
              (profileSummary as { businessName?: string | null }).businessName,
              (profileSummary as { storeName?: string | null }).storeName,
              nextBusinessName
            ])
        } catch {
          // profile summary load fail 시 getMe fallback 사용
        }

        const nextContext: BusinessContext =
          resolvedContext

        setBusinessName(nextBusinessName)

        setBusinessContext(nextContext)

        await loadTables(
          nextContext,
          selectedResourceType
        )

      } catch (error) {

        setBusinessContext(null)
        setBusinessName(DEFAULT_BUSINESS_NAME)

        setErrorMessage(
          getErrorMessage(error)
        )

      } finally {

        setIsLoading(false)

      }

    },
    [
      loadTables
    ]
  )

  // SECTION 09 : EVENT FUNCTION

  function handleBack() {

    router.push('/pos/settings')

  }

  async function handleAddTable() {

    if (!businessContext || isSaving) {
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    try {

      const nextIndex =
        tables.length + 1

      await createPosTableSetting({
        profileId: businessContext.profileId,
        channelCode: businessContext.channelCode,
        tableName: getDefaultResourceName(
          selectedResourceType,
          nextIndex
        ),
        zoneName: DEFAULT_ZONE_NAME,
        tableOptionName: DEFAULT_TABLE_OPTION_NAME,
        tableTypeCode: selectedTableTypeCode,
        defaultPrice: 0,
        resourceType: resolveCreateResourceType(selectedResourceType),
        sortOrder: nextIndex
      })

      await loadTables(
        businessContext,
        selectedResourceType
      )
      emitPosTableSettingsSync({
        channelCode: businessContext.channelCode,
        reason: 'create'
      })

    } catch (error) {

      setErrorMessage(
        getErrorMessage(error)
      )

    } finally {

      setIsSaving(false)

    }

  }

  function handleStartEdit(
    table: PosTableItem
  ) {

    setEditingTableId(table.id)

    setEditingDraft({
      tableName: table.tableName,
      zoneName: table.zoneName,
      tableOptionName: table.tableOptionName,
      tableTypeCode: normalizeTableTypeCode(table.tableTypeCode),
      tableCode: normalizeTableCodeInput(table.tableCode ?? ''),
      defaultPrice: String(table.defaultPrice ?? 0)
    })

  }

  function handleCancelEdit() {

    setEditingTableId(null)

    setEditingDraft({
      tableName: '',
      zoneName: '',
      tableOptionName: '',
      tableTypeCode: DEFAULT_TABLE_TYPE_CODE,
      tableCode: '',
      defaultPrice: '0'
    })

  }

  function handleChangeEditingDraft(
    key: keyof EditingDraft,
    value: string
  ) {

    setEditingDraft((prev) => ({
      ...prev,
      [key]: value
    }))

  }

  async function handleSaveEdit(
    tableId: number
  ) {

    if (!businessContext || isSaving) {
      return
    }

    const nextTableName =
      editingDraft.tableName.trim()

    const nextZoneName =
      editingDraft.zoneName.trim()

    const nextTableOptionName =
      editingDraft.tableOptionName.trim()
    const nextTableTypeCode =
      normalizeTableTypeCode(editingDraft.tableTypeCode)
    const nextDefaultPrice =
      normalizeDefaultPriceInput(editingDraft.defaultPrice)

    if (
      !nextTableName ||
      !nextZoneName ||
      !nextTableOptionName
    ) {
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    try {

      await updatePosTableSetting(
        tableId,
        {
          profileId: businessContext.profileId,
          channelCode: businessContext.channelCode,
          tableName: nextTableName,
          zoneName: nextZoneName,
          tableOptionName: nextTableOptionName,
          tableTypeCode: nextTableTypeCode,
          defaultPrice: nextDefaultPrice
        }
      )

      await loadTables(
        businessContext,
        selectedResourceType
      )
      emitPosTableSettingsSync({
        channelCode: businessContext.channelCode,
        reason: 'update'
      })

      handleCancelEdit()

    } catch (error) {

      setErrorMessage(
        getErrorMessage(error)
      )

    } finally {

      setIsSaving(false)

    }

  }

  async function handleDeleteTable(
    tableId: number
  ) {

    if (!businessContext || isSaving) {
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    try {

      await updatePosTableSetting(
        tableId,
        {
          profileId: businessContext.profileId,
          channelCode: businessContext.channelCode,
          isActive: 0
        }
      )

      await loadTables(
        businessContext,
        selectedResourceType
      )
      emitPosTableSettingsSync({
        channelCode: businessContext.channelCode,
        reason: 'soft-disconnect'
      })

      if (editingTableId === tableId) {
        handleCancelEdit()
      }

      if (selectedQrTable?.id === tableId) {
        setSelectedQrTable(null)
      }

    } catch (error) {

      setErrorMessage(
        getErrorMessage(error)
      )

    } finally {

      setIsSaving(false)

    }

  }

  function handleOpenQrView(
    table: PosTableItem
  ) {

    setSelectedQrTable(table)

  }

  function handleCloseQrView() {

    setSelectedQrTable(null)

  }

  async function handleSaveTables() {

    if (!businessContext) {
      return
    }

    await loadTables(
      businessContext,
      selectedResourceType
    )
    emitPosTableSettingsSync({
      channelCode: businessContext.channelCode,
      reason: 'save'
    })

    window.alert('테이블 설정을 최신 DB 기준으로 다시 불러왔습니다.')

  }

  // SECTION 10 : EFFECT

  useEffect(() => {

    void loadBusinessContextAndTables()

  }, [
    loadBusinessContextAndTables
  ])

  useEffect(() => {
    if (!businessContext) {
      return
    }

    void loadTables(
      businessContext,
      selectedResourceType
    )
  }, [
    businessContext,
    selectedResourceType,
    loadTables
  ])

  useEffect(() => {
    if (!businessContext) {
      return
    }

    return subscribePosTableSettingsSync({
      channelCode: businessContext.channelCode,
      onSync: () => {
        void loadTables(
          businessContext,
          selectedResourceType
        )
      }
    })
  }, [
    businessContext,
    loadTables,
    selectedResourceType
  ])

  // SECTION 11 : RETURN

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarTitle}>
          테이블 설정
        </div>

        <div className={styles.topbarActions}>
          <button
            type="button"
            className={styles.topbarButton}
            onClick={() => router.push('/pos')}
          >
            홈
          </button>

          <button
            type="button"
            className={styles.topbarButton}
            onClick={() => router.push('/pos/settings')}
          >
            설정
          </button>

          <button
            type="button"
            className={styles.topbarButton}
            onClick={() => router.push('/profile')}
          >
            마이페이지
          </button>
        </div>
      </header>

      <div className={styles.shell}>
        <section className={styles.headerCard}>
          <div>
            <h1 className={styles.pageTitle}>
              테이블 설정
            </h1>

            <p className={styles.pageDescription}>
              테이블/객실/공간/좌석/부스의 개수, 이름, 위치, 상태, QR 상태를 관리합니다.
            </p>
            <p className={styles.pageDescription}>
              테이블 코드는 저장 시 서버에서 자동 생성되며, 생성 후 변경할 수 없습니다.
            </p>

            {errorMessage && (
              <p className={styles.pageDescription}>
                {errorMessage}
              </p>
            )}
          </div>

          <div className={styles.headerActions}>
            <select
              className={styles.typeSelect}
              value={selectedResourceType}
              onChange={(event) => setSelectedResourceType(event.target.value as PosResourceFilterType)}
              disabled={isLoading || isSaving}
            >
              {POS_RESOURCE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className={styles.typeSelect}
              value={selectedTableTypeCode}
              onChange={(event) => setSelectedTableTypeCode(event.target.value as PosTableTypeCode)}
              disabled={isLoading || isSaving}
              aria-label="운영 등급"
            >
              {POS_TABLE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  운영 등급: {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleBack}
            >
              뒤로가기
            </button>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleSaveTables}
              disabled={isLoading || isSaving || !businessContext}
            >
              저장
            </button>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleAddTable}
              disabled={isLoading || isSaving || !businessContext}
            >
              {getAddButtonLabel(selectedResourceType)}
            </button>
          </div>
        </section>

        <section className={styles.tableSection}>
          <div className={styles.tableGrid}>
            {isLoading ? (
              <article className={styles.tableCard}>
                <div className={styles.tableContent}>
                  <div className={styles.tableTop}>
                    <div className={styles.tableMainInfo}>
                      <h2 className={styles.tableName}>
                        테이블 정보를 불러오는 중입니다.
                      </h2>

                      <div className={styles.tableMeta}>
                        잠시만 기다려주세요.
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ) : (
              tables.map((table) => {
                const isEditing =
                  editingTableId === table.id

                return (
                  <article
                    key={table.id}
                    className={styles.tableCard}
                  >
                    <div className={styles.tableContent}>
                      <div className={styles.tableTop}>
                        <div className={styles.tableMainInfo}>
                          {isEditing ? (
                            <div className={styles.editPanel}>
                              <label className={styles.editField}>
                                <span className={styles.editLabel}>
                                  테이블명
                                </span>

                                <input
                                  type="text"
                                  value={editingDraft.tableName}
                                  className={styles.editInput}
                                  onChange={(event) =>
                                    handleChangeEditingDraft(
                                      'tableName',
                                      event.target.value
                                    )
                                  }
                                />
                              </label>

                              <label className={styles.editField}>
                                <span className={styles.editLabel}>
                                  위치
                                </span>

                                <input
                                  type="text"
                                  value={editingDraft.zoneName}
                                  placeholder="예: 홀, 창가, 룸"
                                  className={styles.editInput}
                                  onChange={(event) =>
                                    handleChangeEditingDraft(
                                      'zoneName',
                                      event.target.value
                                    )
                                  }
                                />
                              </label>

                              <label className={styles.editField}>
                                <span className={styles.editLabel}>
                                  좌석 옵션
                                </span>

                                <input
                                  type="text"
                                  value={editingDraft.tableOptionName}
                                  placeholder="예: 2인석, 4인석"
                                  className={styles.editInput}
                                  onChange={(event) =>
                                    handleChangeEditingDraft(
                                      'tableOptionName',
                                      event.target.value
                                    )
                                  }
                                />
                              </label>

                              <label className={styles.editField}>
                                <span className={styles.editLabel}>
                                  운영 등급
                                </span>

                                <select
                                  value={editingDraft.tableTypeCode}
                                  className={styles.editInput}
                                  onChange={(event) =>
                                    handleChangeEditingDraft(
                                      'tableTypeCode',
                                      normalizeTableTypeCode(event.target.value)
                                    )
                                  }
                                >
                                  {POS_TABLE_TYPE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label className={styles.editField}>
                                <span className={styles.editLabel}>
                                  테이블 코드
                                </span>

                                <input
                                  type="text"
                                  value={editingDraft.tableCode}
                                  className={`${styles.editInput} ${styles.readonlyInput}`}
                                  disabled
                                  readOnly
                                />
                                <span className={styles.editHelpText}>
                                  테이블 코드는 생성 후 변경할 수 없습니다.
                                </span>
                              </label>

                              <label className={styles.editField}>
                                <span className={styles.editLabel}>
                                  기본가격
                                </span>

                                <input
                                  type="number"
                                  min={0}
                                  value={editingDraft.defaultPrice}
                                  placeholder="60000"
                                  className={styles.editInput}
                                  onChange={(event) =>
                                    handleChangeEditingDraft(
                                      'defaultPrice',
                                      event.target.value
                                    )
                                  }
                                />
                              </label>
                            </div>
                          ) : (
                            <>
                              <h2 className={styles.tableName}>
                                {table.tableName}
                              </h2>

                              <div className={styles.tableMeta}>
                                {table.zoneName} · {table.tableOptionName}
                              </div>

                              <div className={styles.tableMeta}>
                                기본가격 {Number(table.defaultPrice || 0).toLocaleString('ko-KR')}원
                              </div>
                            </>
                          )}
                        </div>

                        {!isEditing && (
                          <div className={styles.badgeRow}>
                            <span className={styles.tableTypeBadge}>
                              {table.tableTypeCode}
                            </span>
                            <span
                              className={
                                table.qrStatus === 'CONNECTED'
                                  ? styles.connectedBadge
                                  : styles.disconnectedBadge
                              }
                            >
                              {table.qrStatus === 'CONNECTED'
                                ? 'QR 연결'
                                : 'QR 미연결'}
                            </span>
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <div className={styles.optionInfoBox}>
                          <div className={styles.optionLabel}>
                            좌석 옵션
                          </div>

                          <div className={styles.optionValue}>
                            {table.tableOptionName}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.buttonArea}>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className={styles.primaryCardButton}
                            onClick={() => handleSaveEdit(table.id)}
                            disabled={isSaving}
                          >
                            저장
                          </button>

                          <button
                            type="button"
                            className={styles.secondaryCardButton}
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={styles.primaryCardButton}
                            onClick={() => handleStartEdit(table)}
                            disabled={isSaving}
                          >
                            수정
                          </button>

                          <button
                            type="button"
                            className={styles.secondaryCardButton}
                            onClick={() => handleOpenQrView(table)}
                            disabled={isSaving}
                          >
                            QR 보기
                          </button>

                          <button
                            type="button"
                            className={styles.secondaryCardButton}
                            onClick={() => handleDeleteTable(table.id)}
                            disabled={isSaving}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </section>
      </div>

      {selectedQrTable && (
        <PosTableQrModal
          isOpen={Boolean(selectedQrTable)}
          tableName={selectedQrTable.tableName}
          zoneName={selectedQrTable.zoneName}
          tableOptionName={selectedQrTable.tableOptionName}
          tableCode={selectedQrTable.tableCode}
          tableOrderUrl={selectedQrTable.tableOrderUrl}
          qrCodeValue={selectedQrTable.qrCodeValue}
          qrStatus={selectedQrTable.qrStatus}
          businessName={businessName}
          onClose={handleCloseQrView}
        />
      )}
    </main>
  )
}
