'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  createMasterProductCategory,
  FeedExposeType,
  fetchMasterProductCategories,
  MasterProductCategoriesResponse,
  MasterProductCategory,
  updateMasterProductCategory
} from '@/lib/master-product-categories-api'
import styles from './master-product-categories.module.css'

const EMPTY_RESPONSE: MasterProductCategoriesResponse = {
  summary: {
    totalCount: 0,
    activeCount: 0,
    depth1Count: 0,
    depth2Count: 0
  },
  categories: []
}

export default function MasterProductCategoriesPage() {
  const [data, setData] = useState<MasterProductCategoriesResponse>(EMPTY_RESPONSE)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [categoryCode, setCategoryCode] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [parentCategoryId, setParentCategoryId] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [feedExposeType, setFeedExposeType] = useState<FeedExposeType>('MARKET_FEED')
  const [editingCode, setEditingCode] = useState<string | null>(null)

  async function loadCategories() {
    setLoading(true)
    setStatusMessage('')

    try {
      const response = await fetchMasterProductCategories()
      setData(response)
    } catch (error) {
      console.error(error)
      setStatusMessage('카테고리 목록을 불러오지 못했습니다.')
      setData(EMPTY_RESPONSE)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCategories()
  }, [])

  const depth1Categories = useMemo(() => {
    return data.categories.filter((category) => category.depth === 1)
  }, [data.categories])

  function resetForm() {
    setCategoryCode('')
    setCategoryName('')
    setParentCategoryId('')
    setSortOrder('0')
    setFeedExposeType('MARKET_FEED')
    setEditingCode(null)
  }

  function startEdit(category: MasterProductCategory) {
    setEditingCode(category.categoryCode)
    setCategoryCode(category.categoryCode)
    setCategoryName(category.categoryName)
    setParentCategoryId(category.parentCategoryId ? String(category.parentCategoryId) : '')
    setSortOrder(String(category.sortOrder))
    setFeedExposeType(category.feedExposeType)
    setStatusMessage('')
  }

  async function toggleActive(category: MasterProductCategory) {
    setSaving(true)
    setStatusMessage('')

    try {
      await updateMasterProductCategory(
        category.categoryCode,
        {
          isActive: category.isActive === 1 ? 0 : 1
        }
      )
      setStatusMessage('카테고리 상태가 변경되었습니다.')
      await loadCategories()
    } catch (error) {
      console.error(error)
      setStatusMessage('카테고리 상태 변경에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setStatusMessage('')

    const body = {
      categoryCode,
      categoryName,
      parentCategoryId: parentCategoryId || null,
      sortOrder,
      feedExposeType
    }

    try {
      if (editingCode) {
        await updateMasterProductCategory(editingCode, body)
        setStatusMessage('카테고리가 수정되었습니다.')
      } else {
        await createMasterProductCategory(body)
        setStatusMessage('카테고리가 생성되었습니다.')
      }

      resetForm()
      await loadCategories()
    } catch (error) {
      console.error(error)
      setStatusMessage('카테고리 저장에 실패했습니다. categoryCode 중복 또는 입력값을 확인해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>공용 상품 카테고리 관리</h1>
          <p>공산품 / 청과 / 야채 / 정육 / 수산 / 냉장 / 냉동 등 공용 상품 원장 분류를 관리합니다.</p>
        </div>
        <button type="button" className={styles.secondaryButton} disabled={loading} onClick={() => void loadCategories()}>
          {loading ? '불러오는 중...' : '새로고침'}
        </button>
      </header>

      <section className={styles.summaryGrid}>
        <article>
          <span>전체 카테고리</span>
          <strong>{data.summary.totalCount}</strong>
        </article>
        <article>
          <span>활성 카테고리</span>
          <strong>{data.summary.activeCount}</strong>
        </article>
        <article>
          <span>Depth 1</span>
          <strong>{data.summary.depth1Count}</strong>
        </article>
        <article>
          <span>Depth 2</span>
          <strong>{data.summary.depth2Count}</strong>
        </article>
      </section>

      {statusMessage ? <p className={styles.statusMessage}>{statusMessage}</p> : null}

      <section className={styles.layout}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>카테고리 리스트</h2>
            <span>{data.categories.length} rows</span>
          </div>

          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>카테고리명</span>
              <span>categoryCode</span>
              <span>depth</span>
              <span>parent</span>
              <span>feedExposeType</span>
              <span>sortOrder</span>
              <span>상품수</span>
              <span>상태</span>
              <span>관리</span>
            </div>

            {data.categories.map((category) => (
              <div key={category.id} className={styles.tableRow}>
                <strong>{category.categoryName}</strong>
                <span>{category.categoryCode}</span>
                <span>{category.depth}</span>
                <span>{category.parentCategoryName ?? '-'}</span>
                <span className={styles.feedBadge}>{category.feedExposeType}</span>
                <span>{category.sortOrder}</span>
                <span>{category.linkedProductCount}</span>
                <span className={category.isActive === 1 ? styles.activeBadge : styles.inactiveBadge}>
                  {category.isActive === 1 ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <div className={styles.rowActions}>
                  <button type="button" onClick={() => startEdit(category)}>
                    수정
                  </button>
                  <button type="button" disabled={saving} onClick={() => void toggleActive(category)}>
                    {category.isActive === 1 ? '비활성' : '활성'}
                  </button>
                </div>
              </div>
            ))}

            {!loading && data.categories.length === 0 ? (
              <p className={styles.emptyState}>등록된 카테고리가 없습니다.</p>
            ) : null}
          </div>
        </div>

        <form className={styles.formPanel} onSubmit={(event) => void handleSubmit(event)}>
          <div className={styles.panelHeader}>
            <h2>{editingCode ? '카테고리 수정' : '카테고리 생성'}</h2>
            {editingCode ? (
              <button type="button" className={styles.textButton} onClick={resetForm}>
                신규 입력
              </button>
            ) : null}
          </div>

          <label className={styles.formRow}>
            <span>카테고리명</span>
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="예: 라면"
              required
            />
          </label>

          <label className={styles.formRow}>
            <span>categoryCode</span>
            <input
              value={categoryCode}
              onChange={(event) => setCategoryCode(event.target.value.toUpperCase())}
              placeholder="예: NOODLE"
              readOnly={Boolean(editingCode)}
              required
            />
          </label>

          <label className={styles.formRow}>
            <span>부모 카테고리</span>
            <select
              value={parentCategoryId}
              onChange={(event) => setParentCategoryId(event.target.value)}
            >
              <option value="">Depth 1 카테고리</option>
              {depth1Categories
                .filter((category) => category.categoryCode !== editingCode)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.categoryName} ({category.categoryCode})
                  </option>
                ))}
            </select>
          </label>

          <label className={styles.formRow}>
            <span>sortOrder</span>
            <input
              type="number"
              min="0"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
          </label>

          <label className={styles.formRow}>
            <span>feedExposeType</span>
            <select
              value={feedExposeType}
              onChange={(event) => setFeedExposeType(event.target.value as FeedExposeType)}
            >
              <option value="NONE">NONE</option>
              <option value="MARKET_FEED">MARKET_FEED</option>
              <option value="EVENT_FEED">EVENT_FEED</option>
              <option value="PROMOTION_FEED">PROMOTION_FEED</option>
            </select>
          </label>

          <button type="submit" className={styles.primaryButton} disabled={saving}>
            {saving ? '저장 중...' : editingCode ? '수정 저장' : '카테고리 생성'}
          </button>
        </form>
      </section>
    </main>
  )
}
