// FILE : frontend/app/(pos)/pos/components/views/PosTableView.tsx
// ROOT : frontend/app/(pos)/pos/components/views/PosTableView.tsx
// STATUS : MODIFY MODE
// ROLE : POS TABLE VIEW COMPONENT
// CHANGE SUMMARY :
// - POS 메인 테이블 화면에 선택용 셀렉트 추가
// - 선택된 테이블 카드 시각 강조 연결
// - 기존 테이블 카드 구조 유지
// - DB/API 연결 없음

// SECTION 01 : IMPORT
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react'

import styles from '../../../food_admin/PosTablePage.module.css'

import { PosTableItem } from '../posTypes'

// SECTION 02 : TYPE
type PosTableViewProps = {
  tables: PosTableItem[]
  selectedTableNo: number | null
  onClickTable: (tableNo: number) => void
  onClickTableOrderButton: (
    event: MouseEvent<HTMLButtonElement>,
    tableNo: number
  ) => void
  onClickTableCleaningAction: (
    event: MouseEvent<HTMLButtonElement>,
    table: PosTableItem
  ) => void
  onTableCardKeyDown: (
    event: KeyboardEvent<HTMLElement>,
    tableNo: number
  ) => void
  onGoTableSettings: () => void
  isTableStatusModalOpen: boolean
  onOpenTableStatusModal: () => void
  onCloseTableStatusModal: () => void
  usingTableCount: number
  emptyTableCount: number
}

type TableStatusFilter = 'ALL' | 'IN_USE' | 'EMPTY'
type LocationFilter = string

const TABLE_FILTER_ITEMS: { key: TableStatusFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'IN_USE', label: '사용중' },
  { key: 'EMPTY', label: '비어있음' }
]

const CANVAS_FALLBACK_COLUMN_WIDTH = 210
const CANVAS_FALLBACK_ROW_HEIGHT = 170
const CANVAS_FALLBACK_PADDING = 24
const DEFAULT_FLOOR_LABEL = '1층'
const DEFAULT_ZONE_LABEL = '홀'

// SECTION 03 : COMPONENT
export default function PosTableView({
  tables,
  selectedTableNo,
  onClickTable,
  onClickTableCleaningAction,
  onTableCardKeyDown,
  onGoTableSettings,
  isTableStatusModalOpen,
  onOpenTableStatusModal,
  onCloseTableStatusModal,
  usingTableCount,
  emptyTableCount
}: PosTableViewProps) {
  const [tableStatusFilter, setTableStatusFilter] = useState<TableStatusFilter>('ALL')
  const [floorFilter, setFloorFilter] = useState<LocationFilter>('')
  const [zoneFilter, setZoneFilter] = useState<LocationFilter>('')

  const floorOptions = useMemo(
    () => buildLocationOptions(
      tables,
      (table) => table.floor?.trim() || '1층',
      (table) => Number(table.floorSortOrder ?? 1)
    ),
    [tables]
  )

  const floorSelectOptions =
    floorOptions.length > 0
      ? floorOptions
      : [{ label: DEFAULT_FLOOR_LABEL, sortOrder: 1 }]
  const activeFloorFilter =
    floorFilter || floorSelectOptions[0]?.label || DEFAULT_FLOOR_LABEL

  const zoneOptions = useMemo(
    () => buildLocationOptions(
      tables.filter((table) => (table.floor?.trim() || DEFAULT_FLOOR_LABEL) === activeFloorFilter),
      (table) => table.zone?.trim() || DEFAULT_ZONE_LABEL,
      (table) => Number(table.zoneSortOrder ?? 1)
    ),
    [activeFloorFilter, tables]
  )

  const zoneSelectOptions =
    zoneOptions.length > 0
      ? zoneOptions
      : [{ label: DEFAULT_ZONE_LABEL, sortOrder: 1 }]
  const activeZoneFilter =
    zoneFilter || zoneSelectOptions[0]?.label || DEFAULT_ZONE_LABEL

  useEffect(() => {
    if (!floorSelectOptions.some((floor) => floor.label === floorFilter)) {
      setFloorFilter(floorSelectOptions[0]?.label || DEFAULT_FLOOR_LABEL)
    }
  }, [floorFilter, floorSelectOptions])

  useEffect(() => {
    if (!zoneSelectOptions.some((zone) => zone.label === zoneFilter)) {
      setZoneFilter(zoneSelectOptions[0]?.label || DEFAULT_ZONE_LABEL)
    }
  }, [zoneFilter, zoneSelectOptions])

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const tableFloor =
        table.floor?.trim() || DEFAULT_FLOOR_LABEL
      const tableZone =
        table.zone?.trim() || DEFAULT_ZONE_LABEL

      if (tableFloor !== activeFloorFilter) {
        return false
      }

      if (tableZone !== activeZoneFilter) {
        return false
      }

      if (tableStatusFilter === 'ALL') {
        return true
      }

      if (tableStatusFilter === 'IN_USE') {
        return table.status === 'USING' || table.amount > 0
      }

      return table.status === 'EMPTY'
    })
  }, [activeFloorFilter, activeZoneFilter, tableStatusFilter, tables])

  const shouldUseLayoutCanvas =
    Boolean(activeFloorFilter)

  const tableStatusFilterControls =
    tables.length > 0 ? (
      <div className={`${styles.tableSelectRow} ${styles.tableStatusHeaderFilters}`}>
        <label className={styles.tableSelectField}>
          <span className={styles.tableSelectLabel}>층</span>
          <select
            className={`${styles.tableSelectBox} ${styles.tableFloorSelectBox}`}
            value={activeFloorFilter}
            onChange={(event) => {
              setFloorFilter(event.target.value)
              setZoneFilter('')
            }}
          >
            {floorSelectOptions.map((floor) => (
              <option key={floor.label} value={floor.label}>
                {floor.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.tableSelectField}>
          <span className={styles.tableSelectLabel}>구역</span>
          <select
            className={`${styles.tableSelectBox} ${styles.tableZoneSelectBox}`}
            value={activeZoneFilter}
            onChange={(event) => {
              setZoneFilter(event.target.value)
            }}
          >
            {zoneSelectOptions.map((zone) => (
              <option key={zone.label} value={zone.label}>
                {zone.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.tableSelectField}>
          <span className={styles.tableSelectLabel}>상태</span>
          <select
            className={`${styles.tableSelectBox} ${styles.tableStatusSelectBox}`}
            value={tableStatusFilter}
            onChange={(event) => {
              setTableStatusFilter(event.target.value as TableStatusFilter)
            }}
          >
            {TABLE_FILTER_ITEMS.map((filterItem) => (
              <option key={filterItem.key} value={filterItem.key}>
                {filterItem.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    ) : null

  const tableStatusContent =
    tables.length < 1 ? (
      <div className={styles.emptyStateBox}>
        <strong className={styles.emptyStateTitle}>등록된 테이블이 없습니다.</strong>
        <p className={styles.emptyStateText}>테이블 설정에서 먼저 테이블을 추가하세요.</p>
        <button
          type="button"
          className={styles.tableOrderButton}
          onClick={onGoTableSettings}
        >
          테이블 설정으로 이동
        </button>
      </div>
    ) : (
      shouldUseLayoutCanvas ? (
        <div className={styles.tableLayoutCanvas}>
          {filteredTables.map((table, index) => {
            const isSelected = selectedTableNo === table.tableNo
            const layout =
              getTableLayoutStyle(table, index)
            const cleaningActionLabel = getCleaningActionLabel(table.status)
            const normalizedShape = String(table.layoutShape ?? '').trim().toUpperCase()
            const isVerticalCard =
              Number(table.layoutHeight ?? 140) > Number(table.layoutWidth ?? 180)

            return (
              <article
                key={table.tableNo}
                className={[
                  styles.tableLayoutCard,
                  cleaningActionLabel ? styles.tableLayoutCardWithCleanup : '',
                  isSelected ? styles.tableCardSelected : '',
                  normalizedShape === 'ROUND' && !isVerticalCard ? styles.tableLayoutCardRound : '',
                  isVerticalCard ? styles.tableLayoutCardVertical : '',
                  normalizedShape === 'ROOM' ? styles.tableLayoutCardRoom : ''
                ].filter(Boolean).join(' ')}
                style={layout}
                onClick={() => onClickTable(table.tableNo)}
                onKeyDown={(event) => onTableCardKeyDown(event, table.tableNo)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.tableCardContent}>
                  <span className={styles.tableName}>{table.label}</span>
                  <span className={styles.tableLocationMeta}>
                    {table.floor?.trim() || '1층'} · {table.zone?.trim() || '홀'}
                  </span>
                  <span className={styles.tableAmount}>
                    {table.amount.toLocaleString('ko-KR')}원
                  </span>
                  {cleaningActionLabel ? (
                    <div className={styles.tableCardStatusActionRow}>
                      <span className={`${styles.tableStatus} ${styles.cleanupStatusBadge}`}>
                        {getTableStatusLabel(table)}
                      </span>
                      <button
                        type="button"
                        className={`${styles.tableOrderButton} ${styles.cleanupCompleteButton}`}
                        onClick={(event) => onClickTableCleaningAction(event, table)}
                      >
                        {cleaningActionLabel}
                      </button>
                    </div>
                  ) : (
                    <div className={styles.tableStatusRow}>
                      <span className={styles.tableStatus}>{getTableStatusLabel(table)}</span>
                      {shouldShowCookingBadge(table) && table.cookingStatusLabel ? (
                        <span className={styles.tableCookingStatus}>{table.cookingStatusLabel}</span>
                      ) : null}
                    </div>
                  )}
                </div>

              </article>
            )
          })}
        </div>
      ) : null
    )

  return (
    <>
      <section className={styles.posDashboardPanel}>
        <div className={styles.posDashboardHero}>
          <div>
            <p className={styles.posDashboardEyebrow}>요식업 POS 메인</p>
            <h1 className={styles.posDashboardTitle}>오늘 매장 운영 현황</h1>
            <p className={styles.posDashboardDescription}>
              테이블 도면은 테이블 현황 모달에서 확인하고, 주문/조리/매출 화면으로 빠르게 이동합니다.
            </p>
          </div>
          <button
            type="button"
            className={styles.posDashboardPrimaryButton}
            onClick={onOpenTableStatusModal}
          >
            테이블 현황 열기
          </button>
        </div>

        <div className={`${styles.posDashboardSummaryGrid} ${styles.posTableSummaryGrid}`}>
          <button
            type="button"
            className={`${styles.posDashboardSummaryCard} ${styles.posDashboardSummaryCardClickable}`}
            onClick={onOpenTableStatusModal}
            aria-label="사용중 테이블 카드 열기"
          >
            <span className={styles.posDashboardSummaryLabel}>사용중 테이블</span>
            <strong className={styles.posDashboardSummaryValue}>{usingTableCount}개</strong>
          </button>
          <button
            type="button"
            className={`${styles.posDashboardSummaryCard} ${styles.posDashboardSummaryCardClickable}`}
            onClick={onOpenTableStatusModal}
            aria-label="비어있는 테이블 카드 열기"
          >
            <span className={styles.posDashboardSummaryLabel}>비어있는 테이블</span>
            <strong className={styles.posDashboardSummaryValue}>{emptyTableCount}개</strong>
          </button>
        </div>

      </section>

      {isTableStatusModalOpen ? (
        <div className={styles.tableStatusModalOverlay} role="presentation">
          <section
            className={styles.tableStatusModalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="table-status-modal-title"
          >
            <header className={styles.tableStatusModalHeader}>
              <div>
                <h2 id="table-status-modal-title" className={styles.tableStatusModalTitle}>테이블 현황</h2>
                <p className={styles.tableStatusModalDescription}>
                  층/구역별 테이블 상태를 확인하고 주문내역으로 이동할 수 있습니다.
                </p>
              </div>
              {tableStatusFilterControls}
              <button
                type="button"
                className={`${styles.tableStatusModalCloseButton} ${styles.tableStatusModalCloseButtonText}`}
                onClick={onCloseTableStatusModal}
                aria-label="테이블 현황 닫기"
              >
                닫기
              </button>
            </header>

            <div className={styles.tableStatusModalBody}>
              {tableStatusContent}
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}

function getTableLayoutStyle(
  table: PosTableItem,
  index: number
): CSSProperties {
  const rawLayoutX =
    Number(table.layoutX ?? 0)
  const rawLayoutY =
    Number(table.layoutY ?? 0)
  const hasSavedPosition =
    rawLayoutX !== 0 || rawLayoutY !== 0
  const left =
    hasSavedPosition
      ? rawLayoutX
      : CANVAS_FALLBACK_PADDING + (index % 4) * CANVAS_FALLBACK_COLUMN_WIDTH
  const top =
    hasSavedPosition
      ? rawLayoutY
      : CANVAS_FALLBACK_PADDING + Math.floor(index / 4) * CANVAS_FALLBACK_ROW_HEIGHT
  const width =
    Number(table.layoutWidth ?? 180) || 180
  const height =
    Number(table.layoutHeight ?? 140) || 140
  const rotate =
    Number(table.layoutRotate ?? 0) || 0
  const shape =
    String(table.layoutShape ?? '').trim().toUpperCase()
  const resolvedWidth =
    shape === 'ROUND'
      ? Math.max(width, 180)
      : Math.max(width, 180)
  const resolvedHeight =
    shape === 'ROUND'
      ? Math.max(height, 180)
      : Math.max(height, 140)

  return {
    left,
    top,
    width: resolvedWidth,
    height: resolvedHeight,
    transform: `rotate(${rotate}deg)`,
    borderRadius: shape === 'ROUND' ? '999px' : shape === 'ROOM' ? '18px' : '14px'
  }
}

function buildLocationOptions(
  tables: PosTableItem[],
  getLabel: (table: PosTableItem) => string,
  getSortOrder: (table: PosTableItem) => number
) {
  const optionMap = new Map<string, number>()

  tables.forEach((table) => {
    const label =
      getLabel(table).trim()

    if (!label) {
      return
    }

    const sortOrder =
      getSortOrder(table)
    const previousSortOrder =
      optionMap.get(label)

    if (previousSortOrder === undefined || sortOrder < previousSortOrder) {
      optionMap.set(label, sortOrder)
    }
  })

  return Array.from(optionMap.entries())
    .map(([label, sortOrder]) => ({
      label,
      sortOrder
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'ko-KR'))
}

// SECTION 04 : UTIL
function getTableStatusLabel(table: PosTableItem) {
  const resourceStatus =
    String(table.resourceStatus ?? '').trim().toUpperCase()

  if (resourceStatus === 'CLEANING' || resourceStatus === 'CHECKOUT_PENDING') {
    return '정리대기'
  }

  if (resourceStatus === 'AVAILABLE') {
    return '비어있음'
  }

  if (resourceStatus === 'IN_USE') {
    return '사용중'
  }

  if (resourceStatus === 'RESERVED') {
    return '예약'
  }

  if (resourceStatus === 'MAINTENANCE') {
    return '점검중'
  }

  if (resourceStatus === 'DISABLED') {
    return '사용불가'
  }

  if (resourceStatus === 'CLEAN_DONE' || table.status === 'CLEAN_DONE') {
    return '청소완료'
  }

  if (table.status === 'EMPTY') {
    return '비어있음'
  }

  if (table.status === 'PAYMENT_WAITING') {
    return '확정'
  }

  return '사용중'
}

function shouldShowCookingBadge(table: PosTableItem) {
  return String(table.resourceStatus ?? '').trim().toUpperCase() === 'IN_USE'
}

function getCleaningActionLabel(status: PosTableItem['status']) {
  if (status === 'CHECKOUT_PENDING') {
    return '정리완료'
  }

  if (status === 'CLEANING') {
    return '정리완료'
  }

  if (status === 'CLEAN_DONE') {
    return '비어있음 처리'
  }

  return null
}
