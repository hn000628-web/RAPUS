'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  fetchMasterProductsList,
  type MasterProductListItem,
  type MasterProductsListResponse
} from '@/lib/admin/masterProductsApi'
import styles from './protect.module.css'

type CategoryType =
  | '전체'
  | '생활용품'
  | '식품'
  | '음료'
  | '주방'
  | '욕실'
  | '문구'
  | '청소'
  | '전자'
  | '기타'

const PAGE_SIZE = 20

const CATEGORY_OPTIONS: CategoryType[] = [
  '전체',
  '생활용품',
  '식품',
  '음료',
  '주방',
  '욕실',
  '문구',
  '청소',
  '전자',
  '기타'
]

const INITIAL_LIST: MasterProductsListResponse = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 1
}

function getDisplayName(product: MasterProductListItem): string {
  return (
    product.productName ||
    product.normalizedProductName ||
    '상품명 미등록'
  )
}

function getMakerName(product: MasterProductListItem): string {
  return (
    product.brandName ||
    product.manufacturerName ||
    '브랜드/제조사 미등록'
  )
}

function getThumbnailLabel(product: MasterProductListItem): string {
  const source =
    product.categoryName ||
    product.productName ||
    product.normalizedProductName ||
    '상품'

  return source.trim().slice(0, 2)
}

function getStatusLabel(product: MasterProductListItem): '활성' | '비활성' | '검수중' {
  if (product.isActive === 0) {
    return '비활성'
  }

  if (product.approvalStatus === 'APPROVED') {
    return '활성'
  }

  return '검수중'
}

function getStatusClass(product: MasterProductListItem): string {
  const status = getStatusLabel(product)

  if (status === '활성') {
    return styles.badgeActive
  }

  if (status === '비활성') {
    return styles.badgeInactive
  }

  return styles.badgePending
}

export default function ProtectProductListPage() {
  const [keyword, setKeyword] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('전체')
  const [page, setPage] = useState(1)
  const [list, setList] = useState<MasterProductsListResponse>(INITIAL_LIST)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await fetchMasterProductsList({
        page,
        pageSize: PAGE_SIZE,
        keyword,
        category: selectedCategory === '전체' ? undefined : selectedCategory
      })
      setList(response)
    } catch {
      setErrorMessage('공용 프로덕트 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [keyword, page, selectedCategory])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextKeyword = searchDraft.trim()
      setKeyword((currentKeyword) => {
        if (currentKeyword === nextKeyword) {
          return currentKeyword
        }
        setPage(1)
        return nextKeyword
      })
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchDraft])

  const visibleProducts = useMemo(() => {
    return list.items
  }, [list.items])

  const selectCategory = (category: CategoryType) => {
    setSelectedCategory(category)
    setPage(1)
  }

  const goPrevPage = () => {
    setPage((currentPage) => Math.max(1, currentPage - 1))
  }

  const goNextPage = () => {
    setPage((currentPage) => Math.min(list.totalPages, currentPage + 1))
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>공용 프로덕트 목록</h1>
              <Link
                href="/market_admin"
                className={styles.operationCenterLink}
              >
                운영센터
              </Link>
            </div>
            <p className={styles.description}>RAPUS 표준 상품 원장 / 판매자 검색 기준 데이터</p>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.headerCenterGroup} />
            <div className={styles.headerActions}>
              <label className={styles.liveSearchBar}>
                <span className={styles.searchLabel}>실시간 검색</span>
                <input
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="제품명 / 브랜드 / 바코드 검색"
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.contentLayout}>
        <aside className={styles.leftPanel}>
          <div className={styles.panelBlock}>
            <h2>카테고리</h2>
            <div className={styles.categoryList}>
              {CATEGORY_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={
                    item === selectedCategory
                      ? `${styles.categoryButton} ${styles.categoryButtonActive}`
                      : styles.categoryButton
                  }
                  onClick={() => selectCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className={styles.rightPanel}>
          <div className={styles.resultMeta}>
            <div>
              <strong>
                총 {list.totalCount.toLocaleString()}개 상품 · 페이지당 {list.pageSize}개
              </strong>
              <p>
                {selectedCategory === '전체' ? '전체 카테고리' : selectedCategory}
                {keyword ? ` · "${keyword}" 검색 결과` : ''}
              </p>
            </div>
            {isLoading ? <span>불러오는 중...</span> : null}
          </div>

          {errorMessage ? (
            <section className={styles.emptyState}>
              {errorMessage}
            </section>
          ) : null}

          {!errorMessage && visibleProducts.length === 0 && !isLoading ? (
            <section className={styles.emptyState}>
              <strong>검색 결과가 없습니다.</strong>
              <p>상품명, 브랜드, 바코드, 제조사명으로 다시 검색해 주세요.</p>
            </section>
          ) : null}

          <div className={styles.cardGrid}>
            {visibleProducts.map((product) => {
              const displayName = getDisplayName(product)
              const makerName = getMakerName(product)

              return (
                <article key={product.id} className={styles.productCard}>
                  <div className={styles.thumbnail}>
                    <span className={`${styles.badge} ${styles.statusOnThumbnail} ${getStatusClass(product)}`}>
                      {getStatusLabel(product)}
                    </span>
                    {product.thumbnailUrl ? (
                      <Image
                        src={product.thumbnailUrl}
                        alt={`${displayName} 썸네일`}
                        className={styles.thumbnailImage}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                        unoptimized
                      />
                    ) : (
                      <div className={styles.thumbnailPlaceholder}>
                        <div className={styles.thumbnailLabel}>{getThumbnailLabel(product)}</div>
                        <span className={styles.thumbnailEmptyText}>이미지 없음</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <strong className={styles.productName}>{displayName}</strong>
                    <p className={styles.makerName}>{makerName}</p>
                    <p className={styles.barcode}>{product.gtin || '바코드 미연결'}</p>
                    <div className={styles.metaRow}>
                      <span>{product.categoryName || '카테고리 미등록'}</span>
                      <span>{product.specInfo || product.unitLabel || '규격 미등록'}</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {list.totalPages > 1 ? (
            <nav className={styles.pagination} aria-label="공용 프로덕트 목록 페이지">
              <button
                type="button"
                onClick={goPrevPage}
                disabled={list.page <= 1 || isLoading}
              >
                이전
              </button>
              <span>
                {list.page} / {list.totalPages}
              </span>
              <button
                type="button"
                onClick={goNextPage}
                disabled={list.page >= list.totalPages || isLoading}
              >
                다음
              </button>
            </nav>
          ) : null}
        </section>
      </section>

    </main>
  )
}
