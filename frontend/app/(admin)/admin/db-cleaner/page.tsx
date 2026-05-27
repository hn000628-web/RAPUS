'use client'

import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '@/lib/adminApi'
import styles from './db-cleaner.module.css'

type CleanupIssueType =
  | 'DUPLICATE'
  | 'ORPHAN'
  | 'INACTIVE'
  | 'SOFT_DELETED'
  | 'WARNING'
  | 'INVALID'

type CleanupIssueDomain =
  | 'GENERAL'
  | 'POS'
  | 'IMAGE'
  | 'PRODUCT'
  | 'EVENT'
  | 'SCAN_CODE'

type CleanupIssueItem = {
  issueId: string
  issueType: CleanupIssueType
  issueDomain: CleanupIssueDomain
  tableName: string
  targetId: number | string
  displayName: string | null
  channelCode: string | null
  description: string
  referenceCount: number
  canHardDelete: boolean
  protectReason: string | null
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string | null
}

type CleanupIssuesSummary = {
  totalCount: number
  deletableCount: number
  protectedCount: number
  duplicateCount: number
  orphanCount: number
  inactiveCount: number
  softDeletedCount: number
  posInactiveOrderCount: number
  posOrphanOrderItemCount: number
  posOrphanOrderItemOptionCount: number
  posInvalidProductRelationCount: number
  posInvalidLocationRelationCount: number
  orphanImageCount: number
  orphanProductThumbnailCount: number
  orphanEventRelationCount: number
  orphanScanCodeCount: number
  invalidProductImageRelationCount: number
}

type CleanupIssuesResponse = {
  summary: CleanupIssuesSummary
  issues: CleanupIssueItem[]
}

type CleanupIssuesCleanResponse = {
  success: boolean
  deletedCount: number
  skippedCount: number
  results: Array<{
    issueType: string
    tableName: string
    targetId: number | string
    deleted: boolean
    skipped: boolean
    reason: string | null
  }>
}

type ClearDevPosInactiveOrdersResponse = {
  ok: boolean
  deletedOrders: number
  deletedOrderItems: number
  deletedOrderItemOptions: number
}

type FilterType =
  | 'ALL'
  | 'DELETABLE'
  | 'PROTECTED'
  | CleanupIssueType
  | CleanupIssueDomain

const FILTERS: Array<{ key: FilterType; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'DELETABLE', label: 'Deletable' },
  { key: 'PROTECTED', label: 'Protected' },
  { key: 'ORPHAN', label: 'Orphan' },
  { key: 'INVALID', label: 'Invalid' },
  { key: 'IMAGE', label: 'Image' },
  { key: 'PRODUCT', label: 'Product' },
  { key: 'EVENT', label: 'Event' },
  { key: 'SCAN_CODE', label: 'Scan Code' },
  { key: 'POS', label: 'POS' },
  { key: 'DUPLICATE', label: 'Duplicate' },
  { key: 'INACTIVE', label: 'Inactive' },
  { key: 'SOFT_DELETED', label: 'Soft Deleted' }
]

const EMPTY_SUMMARY: CleanupIssuesSummary = {
  totalCount: 0,
  deletableCount: 0,
  protectedCount: 0,
  duplicateCount: 0,
  orphanCount: 0,
  inactiveCount: 0,
  softDeletedCount: 0,
  posInactiveOrderCount: 0,
  posOrphanOrderItemCount: 0,
  posOrphanOrderItemOptionCount: 0,
  posInvalidProductRelationCount: 0,
  posInvalidLocationRelationCount: 0,
  orphanImageCount: 0,
  orphanProductThumbnailCount: 0,
  orphanEventRelationCount: 0,
  orphanScanCodeCount: 0,
  invalidProductImageRelationCount: 0
}

const DOMAIN_FILTERS: CleanupIssueDomain[] = [
  'GENERAL',
  'POS',
  'IMAGE',
  'PRODUCT',
  'EVENT',
  'SCAN_CODE'
]

const TYPE_FILTERS: CleanupIssueType[] = [
  'DUPLICATE',
  'ORPHAN',
  'INACTIVE',
  'SOFT_DELETED',
  'WARNING',
  'INVALID'
]

function getStatusLabel(item: CleanupIssueItem) {
  if (!item.canHardDelete) {
    return 'PROTECTED'
  }

  if (item.issueType === 'INVALID') {
    return 'INVALID'
  }

  if (item.issueType === 'ORPHAN') {
    return 'ORPHAN'
  }

  if (item.issueType === 'WARNING') {
    return 'WARNING'
  }

  return 'DELETABLE'
}

export default function DBBlockCleanerPage() {
  const [summary, setSummary] = useState<CleanupIssuesSummary>(EMPTY_SUMMARY)
  const [issues, setIssues] = useState<CleanupIssueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL')

  async function loadIssues() {
    setLoading(true)
    setStatusMessage('')

    try {
      const data = await adminFetch<CleanupIssuesResponse>('/db-cleaner/issues')
      setSummary(data.summary)
      setIssues(data.issues)

      if (data.summary.totalCount === 0) {
        setStatusMessage('No cleanup issues found')
      }
    } catch (error) {
      console.error(error)
      setStatusMessage('Load error')
      setSummary(EMPTY_SUMMARY)
      setIssues([])
    } finally {
      setLoading(false)
    }
  }

  async function runCleanup(endpoint: string, confirmMessage: string) {
    const ok = confirm(confirmMessage)
    if (!ok) {
      return
    }

    setCleaning(true)
    setStatusMessage('Cleaning...')

    try {
      const data = await adminFetch<CleanupIssuesCleanResponse>(
        endpoint,
        { method: 'POST' }
      )

      if (data.success) {
        setStatusMessage(
          `Clean complete (cleaned: ${data.deletedCount}, skipped: ${data.skippedCount})`
        )
        await loadIssues()
      } else {
        setStatusMessage('Failed')
      }
    } catch (error) {
      console.error(error)
      setStatusMessage('Error')
    } finally {
      setCleaning(false)
    }
  }

  async function clearDevPosInactiveOrders() {
    const ok = confirm(
      'POS 비활성 미결제 주문 이력을 삭제합니다. 결제 완료 주문은 삭제되지 않습니다. 계속하시겠습니까?'
    )

    if (!ok) {
      return
    }

    setCleaning(true)
    setStatusMessage('POS 비활성 주문 이력 정리 중...')

    try {
      const data = await adminFetch<ClearDevPosInactiveOrdersResponse>(
        '/db-cleaner/pos/inactive-orders/clear',
        { method: 'POST' }
      )

      setStatusMessage(
        `POS 비활성 주문 정리 완료 (orders: ${data.deletedOrders}, items: ${data.deletedOrderItems}, options: ${data.deletedOrderItemOptions})`
      )

      await loadIssues()
    } catch (error) {
      console.error(error)
      setStatusMessage('POS 비활성 주문 정리 중 오류가 발생했습니다.')
    } finally {
      setCleaning(false)
    }
  }

  useEffect(() => {
    void loadIssues()
  }, [])

  const filteredIssues = useMemo(() => {
    if (activeFilter === 'ALL') {
      return issues
    }

    if (activeFilter === 'DELETABLE') {
      return issues.filter((item) => item.canHardDelete)
    }

    if (activeFilter === 'PROTECTED') {
      return issues.filter((item) => !item.canHardDelete)
    }

    if (DOMAIN_FILTERS.includes(activeFilter as CleanupIssueDomain)) {
      return issues.filter((item) => item.issueDomain === activeFilter)
    }

    if (TYPE_FILTERS.includes(activeFilter as CleanupIssueType)) {
      return issues.filter((item) => item.issueType === activeFilter)
    }

    return issues
  }, [activeFilter, issues])

  const summaryCards = [
    { label: 'Total Issues', value: summary.totalCount },
    { label: 'Protected', value: summary.protectedCount },
    { label: 'Deletable', value: summary.deletableCount },
    { label: 'Orphan Images', value: summary.orphanImageCount },
    { label: 'Orphan Product Thumbnails', value: summary.orphanProductThumbnailCount },
    { label: 'Orphan Event Relations', value: summary.orphanEventRelationCount },
    { label: 'Orphan Scan Codes', value: summary.orphanScanCodeCount },
    { label: 'Invalid Product Images', value: summary.invalidProductImageRelationCount },
    { label: 'POS Orphan Items', value: summary.posOrphanOrderItemCount },
    { label: 'POS Invalid Relations', value: summary.posInvalidProductRelationCount }
  ]

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>DB Cleanup</h1>
          <p>
            상품/이미지/행사/스캔코드 orphan relation을 진단하고 삭제가 아닌 soft cleanup 중심으로 정리합니다.
          </p>
        </div>
        <button type="button" className={styles.secondaryButton} onClick={() => void loadIssues()} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh All'}
        </button>
      </header>

      <section className={styles.summaryGrid}>
        {summaryCards.map((card) => (
          <article key={card.label} className={styles.summaryCard}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Cleanup Actions</h2>
            <p>Protected rows are shown for diagnosis only and cannot be hard deleted.</p>
          </div>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.dangerButton}
            disabled={cleaning || loading}
            onClick={() => void runCleanup('/db-cleaner/issues/clean', '삭제 가능한 cleanup issue를 전체 정리할까요?')}
          >
            Clean Deletable All
          </button>
          <button
            type="button"
            className={styles.warningButton}
            disabled={cleaning || loading}
            onClick={() => void runCleanup('/db-cleaner/orphan-images/clean', 'Orphan image_assets를 soft cleanup 처리할까요?')}
          >
            Cleanup Orphan Images
          </button>
          <button
            type="button"
            className={styles.warningButton}
            disabled={cleaning || loading}
            onClick={() => void runCleanup('/db-cleaner/orphan-relations/clean', 'Orphan relation을 정리할까요?')}
          >
            Cleanup Orphan Relations
          </button>
          <button
            type="button"
            className={styles.warningButton}
            disabled={cleaning || loading}
            onClick={() => void runCleanup('/db-cleaner/invalid-product-images/clean', 'Invalid product image relation을 정리할까요?')}
          >
            Cleanup Invalid Product Images
          </button>
          <button
            type="button"
            className={styles.tealButton}
            disabled={cleaning || loading}
            onClick={() => void clearDevPosInactiveOrders()}
          >
            개발용 POS 비활성 주문 정리
          </button>
        </div>

        {statusMessage ? <p className={styles.statusText}>{statusMessage}</p> : null}
      </section>

      <section className={styles.panel}>
        <h2>Filter</h2>
        <div className={styles.filterRow}>
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={
                activeFilter === filter.key
                  ? styles.filterButtonActive
                  : styles.filterButton
              }
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Details</h2>
            <p>{filteredIssues.length} issue rows</p>
          </div>
        </div>

        {loading ? <p className={styles.emptyState}>Loading...</p> : null}

        {!loading && filteredIssues.length === 0 ? (
          <p className={styles.emptyState}>No cleanup issues found</p>
        ) : null}

        {!loading && filteredIssues.length > 0 ? (
          <div className={styles.issueList}>
            {filteredIssues.map((item) => {
              const statusLabel = getStatusLabel(item)

              return (
                <article key={item.issueId} className={styles.issueCard}>
                  <div className={styles.issueTop}>
                    <div>
                      <strong>{item.displayName ?? String(item.targetId)}</strong>
                      <span>{item.tableName} / {String(item.targetId)}</span>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[`status${statusLabel}`]}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p>{item.description}</p>
                  <div className={styles.issueMeta}>
                    <span>domain: {item.issueDomain}</span>
                    <span>type: {item.issueType}</span>
                    <span>channel: {item.channelCode ?? '-'}</span>
                    <span>refs: {item.referenceCount}</span>
                    <span>protect: {item.protectReason ?? '-'}</span>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </section>
    </main>
  )
}
