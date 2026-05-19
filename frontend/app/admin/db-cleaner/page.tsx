'use client'

import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '@/lib/adminApi'

type CleanupIssueType = 'DUPLICATE' | 'ORPHAN' | 'INACTIVE' | 'SOFT_DELETED'

type CleanupIssueItem = {
  issueId: string
  issueType: CleanupIssueType
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

const FILTERS: Array<{ key: FilterType; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'DELETABLE', label: 'Deletable' },
  { key: 'PROTECTED', label: 'Protected' },
  { key: 'DUPLICATE', label: 'Duplicate' },
  { key: 'ORPHAN', label: 'Orphan' },
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
  posInvalidLocationRelationCount: 0
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
    }

    setLoading(false)
  }

  async function cleanAllDeletableIssues() {
    const ok = confirm('삭제 가능한 cleanup issue를 전체 정리할까요?')
    if (!ok) {
      return
    }

    setCleaning(true)
    setStatusMessage('Cleaning...')

    try {
      const data = await adminFetch<CleanupIssuesCleanResponse>(
        '/db-cleaner/issues/clean',
        { method: 'POST' }
      )

      if (data.success) {
        setStatusMessage(
          `Clean complete (deleted: ${data.deletedCount}, skipped: ${data.skippedCount})`
        )
        await loadIssues()
      } else {
        setStatusMessage('Failed')
      }
    } catch (error) {
      console.error(error)
      setStatusMessage('Error')
    }

    setCleaning(false)
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
    }

    setCleaning(false)
  }

  useEffect(() => {
    loadIssues()
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

    return issues.filter((item) => item.issueType === activeFilter)
  }, [activeFilter, issues])

  return (
    <div style={{ maxWidth: 1280 }}>
      <h1>DB Cleanup</h1>

      <p>
        전체 DB에서 연결이 끊긴 row, inactive row, orphan relation, duplicate row를 진단하고
        삭제 가능한 항목만 안전하게 정리합니다.
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          border: '1px solid #ddd',
          background: '#fff'
        }}
      >
        <h2>Summary</h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div>Total Issues: {summary.totalCount}</div>
          <div>Deletable: {summary.deletableCount}</div>
          <div>Protected: {summary.protectedCount}</div>
          <div>Duplicate: {summary.duplicateCount}</div>
          <div>Orphan: {summary.orphanCount}</div>
          <div>Inactive: {summary.inactiveCount}</div>
          <div>Soft Deleted: {summary.softDeletedCount}</div>
          <div>POS Inactive Orders: {summary.posInactiveOrderCount}</div>
          <div>POS Orphan Order Items: {summary.posOrphanOrderItemCount}</div>
          <div>POS Orphan Order Item Options: {summary.posOrphanOrderItemOptionCount}</div>
          <div>POS Invalid Product Relations: {summary.posInvalidProductRelationCount}</div>
          <div>POS Invalid Location Relations: {summary.posInvalidLocationRelationCount}</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={loadIssues} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh All'}
          </button>

          <button
            onClick={cleanAllDeletableIssues}
            disabled={cleaning || loading}
            style={{
              marginLeft: 10,
              background: '#ff4d4f',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              cursor: 'pointer'
            }}
          >
            {cleaning ? 'Cleaning...' : 'Clean Deletable All'}
          </button>

          <button
            onClick={clearDevPosInactiveOrders}
            disabled={cleaning || loading}
            style={{
              marginLeft: 10,
              background: '#0f766e',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              cursor: 'pointer'
            }}
          >
            개발용 POS 비활성 주문 정리
          </button>
        </div>

        <p style={{ marginTop: 10 }}>{statusMessage}</p>
        <p style={{ marginTop: 4 }}>
          Protected rows are shown for diagnosis only and cannot be hard deleted.
        </p>
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 16,
          border: '1px solid #ddd',
          background: '#fff'
        }}
      >
        <h3>Filter</h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              style={{
                padding: '6px 10px',
                border: '1px solid #bbb',
                background: activeFilter === filter.key ? '#111827' : '#fff',
                color: activeFilter === filter.key ? '#fff' : '#111827',
                cursor: 'pointer'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          border: '1px solid #eee',
          padding: 20,
          background: '#fff'
        }}
      >
        <h3>Details</h3>

        {loading && <p>Loading...</p>}

        {!loading && filteredIssues.length === 0 && <p>No cleanup issues found</p>}

        {!loading &&
          filteredIssues.map((item) => (
            <div
              key={item.issueId}
              style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #f0f0f0' }}
            >
              issueType: {item.issueType} /
              tableName: {item.tableName} /
              targetId: {String(item.targetId)} /
              displayName: {item.displayName ?? '-'} /
              channelCode: {item.channelCode ?? '-'} /
              description: {item.description} /
              referenceCount: {item.referenceCount} /
              canHardDelete: {item.canHardDelete ? 'true' : 'false'} /
              protectReason: {item.protectReason ?? '-'} /
              deletedAt: {item.deletedAt ?? '-'}
            </div>
          ))}
      </div>
    </div>
  )
}
