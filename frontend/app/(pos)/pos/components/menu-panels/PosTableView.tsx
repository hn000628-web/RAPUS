// FILE : frontend/app/(pos)/pos/components/views/PosTableView.tsx
// ROOT : frontend/app/(pos)/pos/components/views/PosTableView.tsx
// STATUS : MODIFY MODE
// ROLE : POS TABLE VIEW COMPONENT
// CHANGE SUMMARY :
// - POS 메인 테이블 화면에 선택용 셀렉트 추가
// - 선택된 테이블 카드 시각 강조 연결
// - 기존 테이블 카드 / 주문내역 버튼 구조 유지
// - DB/API 연결 없음

// SECTION 01 : IMPORT
import { useMemo, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react'

import styles from '../../PosPage.module.css'

import { PosTableItem } from '../posTypes'

// SECTION 02 : TYPE
type PosTableViewProps = {
  tables: PosTableItem[]
  selectedTableNo: number | null
  onChangeSelectedTableNo: (tableNo: number | null) => void
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
}

type TableStatusFilter = 'ALL' | 'IN_USE' | 'EMPTY'

const TABLE_FILTER_ITEMS: { key: TableStatusFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'IN_USE', label: '사용중' },
  { key: 'EMPTY', label: '비어있음' }
]

// SECTION 03 : COMPONENT
export default function PosTableView({
  tables,
  selectedTableNo,
  onChangeSelectedTableNo,
  onClickTable,
  onClickTableOrderButton,
  onClickTableCleaningAction,
  onTableCardKeyDown,
  onGoTableSettings
}: PosTableViewProps) {
  const [tableStatusFilter, setTableStatusFilter] = useState<TableStatusFilter>('ALL')

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChangeSelectedTableNo(Number(event.target.value))
  }

  const filteredTables = useMemo(() => {
    if (tableStatusFilter === 'ALL') {
      return tables
    }

    if (tableStatusFilter === 'IN_USE') {
      return tables.filter((table) => table.status === 'USING' || table.amount > 0)
    }

    return tables.filter((table) => table.status === 'EMPTY')
  }, [tableStatusFilter, tables])

  if (tables.length < 1) {
    return (
      <section className={styles.tablePanel}>
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
      </section>
    )
  }

  return (
    <section className={styles.tablePanel}>
      <div className={styles.tableSelectRow}>
        <label className={styles.tableSelectLabel} htmlFor="pos-table-select">
          테이블 선택
        </label>
        <select
          id="pos-table-select"
          className={styles.tableSelectBox}
          value={selectedTableNo ?? tables[0].tableNo}
          onChange={handleSelectChange}
          disabled={tables.length < 1}
        >
          {tables.map((table) => (
            <option key={table.tableNo} value={table.tableNo}>
              {table.label}
            </option>
          ))}
        </select>

        <div className={styles.tableFilterGroup} aria-label="테이블 상태 필터">
          {TABLE_FILTER_ITEMS.map((filterItem) => (
            <button
              key={filterItem.key}
              type="button"
              className={`${styles.tableFilterButton} ${tableStatusFilter === filterItem.key ? styles.tableFilterButtonActive : ''}`}
              onClick={() => {
                setTableStatusFilter(filterItem.key)
              }}
            >
              {filterItem.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableGrid}>
        {filteredTables.map((table) => {
          const isSelected = selectedTableNo === table.tableNo

          return (
            <article
              key={table.tableNo}
              className={isSelected ? `${styles.tableCard} ${styles.tableCardSelected}` : styles.tableCard}
              onClick={() => onClickTable(table.tableNo)}
              onKeyDown={(event) => onTableCardKeyDown(event, table.tableNo)}
              role="button"
              tabIndex={0}
            >
              <div className={styles.tableCardContent}>
                <span className={styles.tableName}>{table.label}</span>
                <span className={styles.tableAmount}>
                  {table.amount.toLocaleString('ko-KR')}원
                </span>
                <div className={styles.tableStatusRow}>
                  <span className={styles.tableStatus}>{getTableStatusLabel(table)}</span>
                  {shouldShowCookingBadge(table) && table.cookingStatusLabel ? (
                    <span className={styles.tableCookingStatus}>{table.cookingStatusLabel}</span>
                  ) : null}
                </div>
              </div>

              <div className={styles.tableCardAction}>
                {getCleaningActionLabel(table.status) ? (
                  <button
                    type="button"
                    className={styles.tableOrderButton}
                    onClick={(event) => onClickTableCleaningAction(event, table)}
                  >
                    {getCleaningActionLabel(table.status)}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.tableOrderButton}
                    onClick={(event) => onClickTableOrderButton(event, table.tableNo)}
                  >
                    주문내역
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
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
