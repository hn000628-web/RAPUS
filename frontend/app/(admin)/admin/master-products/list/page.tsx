'use client'

import Link from 'next/link'
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  fetchMasterProductDetail,
  fetchMasterProductsList,
  updateMasterProductThumbnail,
  type MasterProductDetail,
  type MasterProductListItem,
  type MasterProductsListResponse
} from '@/lib/admin/masterProductsApi'
import styles from './master-products-list.module.css'

const PAGE_SIZE = 20

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

function getStatusLabel(product: MasterProductListItem): string {
  if (product.isActive === 0) {
    return '비활성'
  }

  if (product.approvalStatus === 'APPROVED') {
    return '승인 완료'
  }

  if (product.approvalStatus === 'REJECTED') {
    return '반려'
  }

  return '검수 필요'
}

function getStatusClass(product: MasterProductListItem): string {
  if (product.isActive === 0) {
    return styles.badgeInactive
  }

  if (product.approvalStatus === 'APPROVED') {
    return styles.badgeActive
  }

  return styles.badgePending
}

export default function AdminMasterProductsListPage() {
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [list, setList] = useState<MasterProductsListResponse>(INITIAL_LIST)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<MasterProductDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null)
  const [thumbnailUploadLoading, setThumbnailUploadLoading] = useState(false)
  const [thumbnailUploadError, setThumbnailUploadError] = useState('')
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null)

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await fetchMasterProductsList({
        page,
        pageSize: PAGE_SIZE,
        keyword
      })
      setList(response)
    } catch {
      setErrorMessage('상품 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [keyword, page])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl)
      }
    }
  }, [thumbnailPreviewUrl])

  const visibleProducts = useMemo(() => {
    return list.items
  }, [list.items])

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setKeyword(keywordInput.trim())
    setPage(1)
  }

  const clearThumbnailSelection = () => {
    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl)
    }
    setThumbnailPreviewUrl(null)
    setThumbnailFile(null)
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ''
    }
  }

  const openProductEditModal = async (productId: number) => {
    clearThumbnailSelection()
    setDetailLoading(true)
    setDetailError('')
    setThumbnailUploadError('')

    try {
      const detail = await fetchMasterProductDetail(productId)
      setSelectedProduct(detail)
    } catch {
      setDetailError('상품 상세 정보를 불러오지 못했습니다.')
    } finally {
      setDetailLoading(false)
    }
  }

  const closeProductEditModal = () => {
    clearThumbnailSelection()
    setThumbnailUploadError('')
    setSelectedProduct(null)
  }

  const openThumbnailFilePicker = () => {
    thumbnailInputRef.current?.click()
  }

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setThumbnailUploadError('png, jpg, webp 이미지만 등록할 수 있습니다.')
      event.target.value = ''
      return
    }

    clearThumbnailSelection()
    setThumbnailFile(file)
    setThumbnailPreviewUrl(URL.createObjectURL(file))
    setThumbnailUploadError('')
  }

  const handleThumbnailUpload = async () => {
    if (!selectedProduct || !thumbnailFile || thumbnailUploadLoading) {
      return
    }

    setThumbnailUploadLoading(true)
    setThumbnailUploadError('')

    try {
      await updateMasterProductThumbnail({
        productId: selectedProduct.id,
        file: thumbnailFile
      })
      await loadProducts()
      const detail = await fetchMasterProductDetail(selectedProduct.id)
      setSelectedProduct(detail)
      clearThumbnailSelection()
    } catch {
      setThumbnailUploadError('대표 썸네일 등록에 실패했습니다.')
    } finally {
      setThumbnailUploadLoading(false)
    }
  }

  const goPrevPage = () => {
    setPage((currentPage) => Math.max(1, currentPage - 1))
  }

  const goNextPage = () => {
    setPage((currentPage) => Math.min(list.totalPages, currentPage + 1))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <nav className={styles.breadcrumb}>
              <Link href="/admin">관리자 홈</Link>
              <span>/</span>
              <Link href="/admin/master-products">공용 프로덕트 관리</Link>
              <span>/</span>
              <strong>리스트</strong>
            </nav>
            <h1 className={styles.title}>공용 프로덕트 목록</h1>
            <p className={styles.description}>RAPUS 표준 상품 원장 / 판매자 검색 기준 데이터</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/admin/master-products" className={styles.secondaryButton}>
              프로덕트 관리
            </Link>
            <Link href="/admin/master-products" className={styles.primaryButton}>
              상품 연결 관리
            </Link>
          </div>
        </div>

        <form className={styles.searchSection} onSubmit={handleSearchSubmit}>
          <input
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="제품명 / productCode / barcode / 제조사 검색"
          />
          <button type="submit" className={styles.searchButton}>
            검색
          </button>
        </form>
      </header>

      <section className={styles.resultMeta}>
        <strong>
          총 {list.totalCount.toLocaleString()}개 상품 · 페이지당 {list.pageSize}개
        </strong>
        {isLoading ? (
          <span>불러오는 중...</span>
        ) : null}
      </section>

      {errorMessage ? (
        <section className={styles.emptyState}>
          {errorMessage}
        </section>
      ) : null}

      {!errorMessage && visibleProducts.length === 0 && !isLoading ? (
        <section className={styles.emptyState}>
          표시할 공용 프로덕트가 없습니다.
        </section>
      ) : null}

      <section className={styles.cardGrid}>
        {visibleProducts.map((product) => {
          const displayName = getDisplayName(product)
          const makerName = getMakerName(product)

          return (
            <button
              key={product.id}
              type="button"
              className={styles.productCard}
              aria-label={`${displayName} 공용 프로덕트 수정`}
              onClick={() => void openProductEditModal(product.id)}
            >
              <div className={styles.thumbnail}>
                {product.thumbnailUrl ? (
                  <div
                    className={styles.thumbnailImage}
                    style={{
                      backgroundImage: `url(${product.thumbnailUrl})`
                    }}
                    aria-label={`${displayName} 썸네일`}
                  />
                ) : (
                  <div className={styles.thumbnailLabel}>
                    {getThumbnailLabel(product)}
                  </div>
                )}
                <div className={styles.overlay}>
                  <strong>{displayName}</strong>
                  <p>{makerName}</p>
                </div>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.productCode}>{product.productCode}</p>
                <p className={styles.barcode}>{product.gtin || '바코드 미연결'}</p>
                <p className={styles.category}>{product.categoryName || '카테고리 미등록'}</p>
                <p className={styles.spec}>{product.specInfo || product.unitLabel || '규격 미등록'}</p>
                <span className={`${styles.badge} ${getStatusClass(product)}`}>
                  {getStatusLabel(product)}
                </span>
              </div>
            </button>
          )
        })}
      </section>

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

      {detailLoading ? (
        <div className={styles.modalOverlay}>
          <section className={styles.editModal} role="dialog" aria-modal="true">
            <p className={styles.emptyState}>상품 상세 정보를 불러오는 중입니다.</p>
          </section>
        </div>
      ) : null}

      {detailError ? (
        <section className={styles.emptyState}>{detailError}</section>
      ) : null}

      {selectedProduct ? (
        <div className={styles.modalOverlay}>
          <section
            className={styles.editModal}
            role="dialog"
            aria-modal="true"
            aria-label="공용 프로덕트 수정 모달"
          >
            <div className={styles.editModalHeader}>
              <div>
                <h2>공용 프로덕트 수정</h2>
                <p>상품 정보 확인과 대표 썸네일 등록/변경을 진행합니다.</p>
              </div>
              <button type="button" className={styles.secondaryButton} onClick={closeProductEditModal}>
                닫기
              </button>
            </div>

            <div className={styles.editModalContent}>
              <section className={styles.editInfoGrid}>
                <div>
                  <span>상품명</span>
                  <strong>{getDisplayName(selectedProduct)}</strong>
                </div>
                <div>
                  <span>productCode</span>
                  <strong>{selectedProduct.productCode}</strong>
                </div>
                <div>
                  <span>바코드</span>
                  <strong>{selectedProduct.gtin || '바코드 미연결'}</strong>
                </div>
                <div>
                  <span>브랜드</span>
                  <strong>{selectedProduct.brandName || '브랜드 미등록'}</strong>
                </div>
                <div>
                  <span>제조사</span>
                  <strong>{selectedProduct.manufacturerName || '제조사 미등록'}</strong>
                </div>
                <div>
                  <span>카테고리</span>
                  <strong>{selectedProduct.categoryName || '카테고리 미등록'}</strong>
                </div>
                <div>
                  <span>규격</span>
                  <strong>{selectedProduct.specInfo || selectedProduct.unitLabel || '규격 미등록'}</strong>
                </div>
                <div>
                  <span>승인/활성 상태</span>
                  <strong>
                    {selectedProduct.approvalStatus} / {selectedProduct.isActive === 1 ? '활성' : '비활성'}
                  </strong>
                </div>
              </section>

              <section className={styles.editThumbnailPanel}>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className={styles.hiddenFileInput}
                  onChange={handleThumbnailChange}
                />
                <button
                  type="button"
                  className={styles.thumbnailPicker}
                  onClick={openThumbnailFilePicker}
                >
                  <div className={styles.editThumbnailPreview}>
                    {thumbnailPreviewUrl || selectedProduct.thumbnailUrl ? (
                      <div
                        className={styles.editThumbnailImage}
                        style={{
                          backgroundImage: `url(${thumbnailPreviewUrl || selectedProduct.thumbnailUrl || ''})`
                        }}
                      />
                    ) : (
                      <span>썸네일 미등록</span>
                    )}
                  </div>
                </button>
                <p>png, jpg, webp / 최대 1024px 권장</p>
                {thumbnailPreviewUrl ? (
                  <button type="button" className={styles.secondaryButton} onClick={clearThumbnailSelection}>
                    선택 이미지 제거
                  </button>
                ) : null}
                {thumbnailFile ? (
                  <span className={styles.selectedFileName}>
                    {thumbnailFile.name}
                  </span>
                ) : null}
              </section>
            </div>

            {thumbnailUploadError ? (
              <p className={styles.errorText}>{thumbnailUploadError}</p>
            ) : null}

            <div className={styles.editModalFooter}>
              <button type="button" className={styles.secondaryButton} onClick={closeProductEditModal}>
                취소
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={!thumbnailFile || thumbnailUploadLoading}
                onClick={() => void handleThumbnailUpload()}
              >
                {thumbnailUploadLoading ? '업로드 중...' : '썸네일 저장'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
