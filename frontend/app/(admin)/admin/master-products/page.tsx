'use client'

import type { ChangeEvent, DragEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  connectMasterProductsFromBarcodes,
  fetchMasterProductDetail,
  fetchMissingThumbnailMasterProducts,
  fetchMasterProductsList,
  fetchMasterProductsSummary,
  uploadMasterProductThumbnailBatch,
  updateMasterProductThumbnail,
  type MasterProductDetail,
  type MasterProductListItem,
  type MissingThumbnailMasterProduct,
  type MissingThumbnailMasterProductsResponse,
  type MasterProductsSummaryResponse,
  type MasterProductThumbnailBatchReportRow,
  type UploadMasterProductThumbnailBatchResponse
} from '@/lib/admin/masterProductsApi'
import styles from './master-products.module.css'

type StatCard = {
  label: string
  value: number
  description: string
}

const BATCH_THUMBNAIL_REPORT_COLUMNS = [
  'fileName',
  'productCode',
  'scanCodeValue',
  'uploadStatus',
  'reason',
  'linkedThumbnail',
  'createdAt'
] as const

const MISSING_THUMBNAIL_PAGE_SIZE = 20
const REGISTERED_THUMBNAIL_PAGE_SIZE = 20

function escapeCsvValue(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function buildBatchThumbnailReportRows(
  result: UploadMasterProductThumbnailBatchResponse
): MasterProductThumbnailBatchReportRow[] {
  return [
    ...result.successFiles,
    ...result.skippedFiles.map((item) => ({
      fileName: item.fileName,
      productCode: item.productCode,
      scanCodeValue: item.scanCodeValue,
      uploadStatus: item.uploadStatus,
      reason: item.reason,
      linkedThumbnail: item.linkedThumbnail,
      createdAt: item.createdAt
    })),
    ...result.failedFiles.map((item) => ({
      fileName: item.fileName,
      productCode: item.productCode,
      scanCodeValue: item.scanCodeValue,
      uploadStatus: item.uploadStatus,
      reason: item.reason,
      linkedThumbnail: item.linkedThumbnail,
      createdAt: item.createdAt
    }))
  ]
}

export default function AdminMasterProductsPage() {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isBatchThumbnailModalOpen, setIsBatchThumbnailModalOpen] = useState(false)
  const [isSyncGuideModalOpen, setIsSyncGuideModalOpen] = useState(false)
  const [batchThumbnailFiles, setBatchThumbnailFiles] = useState<File[]>([])
  const [isBatchThumbnailDragging, setIsBatchThumbnailDragging] = useState(false)
  const [batchThumbnailUploading, setBatchThumbnailUploading] = useState(false)
  const [batchThumbnailError, setBatchThumbnailError] = useState('')
  const [batchThumbnailResult, setBatchThumbnailResult] =
    useState<UploadMasterProductThumbnailBatchResponse | null>(null)
  const [originType, setOriginType] = useState('국산(한국)')
  const [originCustomText, setOriginCustomText] = useState('')
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null)
  const [connectLoading, setConnectLoading] = useState(false)
  const [connectMessage, setConnectMessage] = useState('')
  const [connectError, setConnectError] = useState('')
  const [isRegisteredThumbnailModalOpen, setIsRegisteredThumbnailModalOpen] = useState(false)
  const [registeredThumbnailProducts, setRegisteredThumbnailProducts] = useState<MasterProductListItem[]>([])
  const [registeredThumbnailLoading, setRegisteredThumbnailLoading] = useState(false)
  const [registeredThumbnailError, setRegisteredThumbnailError] = useState('')
  const [isMissingThumbnailModalOpen, setIsMissingThumbnailModalOpen] = useState(false)
  const [missingThumbnailPage, setMissingThumbnailPage] = useState(1)
  const [missingThumbnailProducts, setMissingThumbnailProducts] =
    useState<MissingThumbnailMasterProductsResponse>({
      items: [],
      page: 1,
      pageSize: MISSING_THUMBNAIL_PAGE_SIZE,
      totalCount: 0,
      totalPages: 1
    })
  const [missingThumbnailLoading, setMissingThumbnailLoading] = useState(false)
  const [missingThumbnailError, setMissingThumbnailError] = useState('')
  const [selectedThumbnailProduct, setSelectedThumbnailProduct] = useState<MasterProductDetail | null>(null)
  const [thumbnailDetailLoading, setThumbnailDetailLoading] = useState(false)
  const [thumbnailUploadFile, setThumbnailUploadFile] = useState<File | null>(null)
  const [thumbnailUploadPreviewUrl, setThumbnailUploadPreviewUrl] = useState<string | null>(null)
  const [thumbnailUploadLoading, setThumbnailUploadLoading] = useState(false)
  const [thumbnailUploadError, setThumbnailUploadError] = useState('')
  const [summary, setSummary] = useState<MasterProductsSummaryResponse>({
    totalProducts: 0,
    connectedBarcodeCount: 0,
    thumbnailRegisteredCount: 0,
    approvedCount: 0,
    pendingReviewCount: 0,
    unlinkedBarcodeCount: 0
  })
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null)
  const thumbnailEditInputRef = useRef<HTMLInputElement | null>(null)
  const batchThumbnailInputRef = useRef<HTMLInputElement | null>(null)
  const currentObjectUrlRef = useRef<string | null>(null)
  const thumbnailUploadObjectUrlRef = useRef<string | null>(null)
  const batchThumbnailFileCount = batchThumbnailFiles.length
  const isBatchThumbnailCountOverLimit = batchThumbnailFileCount > 100

  const clearThumbnailPreview = () => {
    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current)
      currentObjectUrlRef.current = null
    }
    setThumbnailPreviewUrl(null)
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ''
    }
  }

  const clearThumbnailUploadPreview = () => {
    if (thumbnailUploadObjectUrlRef.current) {
      URL.revokeObjectURL(thumbnailUploadObjectUrlRef.current)
      thumbnailUploadObjectUrlRef.current = null
    }
    setThumbnailUploadPreviewUrl(null)
    setThumbnailUploadFile(null)
    if (thumbnailEditInputRef.current) {
      thumbnailEditInputRef.current.value = ''
    }
  }

  const closeRegisterModal = () => {
    clearThumbnailPreview()
    setOriginType('국산(한국)')
    setOriginCustomText('')
    setIsRegisterModalOpen(false)
  }

  const openBatchThumbnailModal = () => {
    setIsBatchThumbnailModalOpen(true)
  }

  const openSyncGuideModal = () => {
    setIsSyncGuideModalOpen(true)
  }

  const closeSyncGuideModal = () => {
    setIsSyncGuideModalOpen(false)
  }

  const closeBatchThumbnailModal = () => {
    if (batchThumbnailUploading) {
      return
    }
    setBatchThumbnailFiles([])
    setIsBatchThumbnailDragging(false)
    setBatchThumbnailError('')
    setBatchThumbnailResult(null)
    if (batchThumbnailInputRef.current) {
      batchThumbnailInputRef.current.value = ''
    }
    setIsBatchThumbnailModalOpen(false)
  }

  const selectBatchThumbnailFiles = (files: File[]) => {
    setBatchThumbnailResult(null)
    setBatchThumbnailError('')
    setIsBatchThumbnailDragging(false)

    if (files.length === 0) {
      setBatchThumbnailFiles([])
      return
    }

    if (files.length > 100) {
      setBatchThumbnailError('이미지 파일은 최대 100개까지 선택할 수 있습니다.')
      setBatchThumbnailFiles(files)
      if (batchThumbnailInputRef.current) {
        batchThumbnailInputRef.current.value = ''
      }
      return
    }

    const allowedExtensions = ['.zip', '.jpg', '.jpeg', '.png', '.webp']
    const invalidFile = files.find((file) => {
      const lowerFileName = file.name.toLowerCase()
      return !allowedExtensions.some((extension) => lowerFileName.endsWith(extension))
    })

    if (invalidFile) {
      setBatchThumbnailError('ZIP 또는 이미지 파일만 업로드할 수 있습니다.')
      setBatchThumbnailFiles([])
      if (batchThumbnailInputRef.current) {
        batchThumbnailInputRef.current.value = ''
      }
      return
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0)

    if (totalSize > 50 * 1024 * 1024) {
      setBatchThumbnailError('업로드 파일은 합산 50MB 이하만 업로드할 수 있습니다.')
      setBatchThumbnailFiles([])
      if (batchThumbnailInputRef.current) {
        batchThumbnailInputRef.current.value = ''
      }
      return
    }

    setBatchThumbnailFiles(files)
  }

  const handleBatchThumbnailFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectBatchThumbnailFiles(Array.from(event.target.files ?? []))
  }

  const handleBatchThumbnailDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    if (!batchThumbnailUploading) {
      setIsBatchThumbnailDragging(true)
    }
  }

  const handleBatchThumbnailDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsBatchThumbnailDragging(false)
  }

  const handleBatchThumbnailDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    if (batchThumbnailUploading) {
      return
    }
    selectBatchThumbnailFiles(Array.from(event.dataTransfer.files ?? []))
  }

  const handleBatchThumbnailUpload = async () => {
    if (batchThumbnailFiles.length === 0 || batchThumbnailUploading) {
      return
    }

    setBatchThumbnailUploading(true)
    setBatchThumbnailError('')
    setBatchThumbnailResult(null)

    try {
      const result = await uploadMasterProductThumbnailBatch({
        files: batchThumbnailFiles
      })
      setBatchThumbnailResult(result)
      setBatchThumbnailFiles([])
      if (batchThumbnailInputRef.current) {
        batchThumbnailInputRef.current.value = ''
      }
      await loadSummary()
    } catch {
      setBatchThumbnailError('썸네일 ZIP 업로드 반영에 실패했습니다.')
    } finally {
      setBatchThumbnailUploading(false)
    }
  }

  const handleBatchThumbnailReportDownload = () => {
    if (!batchThumbnailResult) {
      return
    }

    const rows = buildBatchThumbnailReportRows(batchThumbnailResult)
    const csvLines = [
      BATCH_THUMBNAIL_REPORT_COLUMNS.join(','),
      ...rows.map((row) =>
        BATCH_THUMBNAIL_REPORT_COLUMNS.map((column) => escapeCsvValue(row[column])).join(',')
      )
    ]
    const csvContent = `\uFEFF${csvLines.join('\r\n')}`
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8'
    })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    link.href = downloadUrl
    link.download = `master_product_thumbnail_upload_result_${timestamp}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(downloadUrl)
  }

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = ''
      }
      return
    }

    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current)
    }
    const nextObjectUrl = URL.createObjectURL(file)
    currentObjectUrlRef.current = nextObjectUrl
    setThumbnailPreviewUrl(nextObjectUrl)
  }

  useEffect(() => {
    return () => {
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current)
      }
      if (thumbnailUploadObjectUrlRef.current) {
        URL.revokeObjectURL(thumbnailUploadObjectUrlRef.current)
      }
    }
  }, [])

  const loadSummary = useCallback(async () => {
    const nextSummary = await fetchMasterProductsSummary()
    setSummary(nextSummary)
  }, [])

  const loadMissingThumbnailProducts = useCallback(async (page: number) => {
    setMissingThumbnailLoading(true)
    setMissingThumbnailError('')

    try {
      const result = await fetchMissingThumbnailMasterProducts({
        page,
        pageSize: MISSING_THUMBNAIL_PAGE_SIZE
      })
      setMissingThumbnailProducts(result)
      setMissingThumbnailPage(result.page)
    } catch {
      setMissingThumbnailError('대표 썸네일 미등록 상품을 불러오지 못했습니다.')
    } finally {
      setMissingThumbnailLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  const handleConnectProducts = async () => {
    if (connectLoading) {
      return
    }

    setConnectLoading(true)
    setConnectMessage('')
    setConnectError('')

    try {
      const result = await connectMasterProductsFromBarcodes()
      setConnectMessage(
        `신규 생성 ${result.createdCount}건 / 연결 ${result.linkedCount}건 / 스킵 ${result.skippedCount}건 / 실패 ${result.failedCount}건`
      )
      await loadSummary()
    } catch {
      setConnectError('신규 상품 연결에 실패했습니다.')
    } finally {
      setConnectLoading(false)
    }
  }

  const openMissingThumbnailModal = () => {
    setIsMissingThumbnailModalOpen(true)
    void loadMissingThumbnailProducts(1)
  }

  const loadRegisteredThumbnailProducts = useCallback(async () => {
    setRegisteredThumbnailLoading(true)
    setRegisteredThumbnailError('')

    try {
      const firstPage = await fetchMasterProductsList({
        page: 1,
        pageSize: REGISTERED_THUMBNAIL_PAGE_SIZE
      })
      const pages = [firstPage]

      for (let nextPage = 2; nextPage <= firstPage.totalPages; nextPage += 1) {
        const response = await fetchMasterProductsList({
          page: nextPage,
          pageSize: REGISTERED_THUMBNAIL_PAGE_SIZE
        })
        pages.push(response)
      }

      setRegisteredThumbnailProducts(
        pages
          .flatMap((page) => page.items)
          .filter((product) => product.thumbnailImageAssetId !== null || Boolean(product.thumbnailUrl))
      )
    } catch {
      setRegisteredThumbnailError('대표 썸네일 등록 상품을 불러오지 못했습니다.')
    } finally {
      setRegisteredThumbnailLoading(false)
    }
  }, [])

  const openRegisteredThumbnailModal = () => {
    setIsRegisteredThumbnailModalOpen(true)
    void loadRegisteredThumbnailProducts()
  }

  const closeRegisteredThumbnailModal = () => {
    setIsRegisteredThumbnailModalOpen(false)
    setRegisteredThumbnailError('')
  }

  const closeMissingThumbnailModal = () => {
    setIsMissingThumbnailModalOpen(false)
    setMissingThumbnailError('')
  }

  const openThumbnailEditModal = async (product: MissingThumbnailMasterProduct) => {
    clearThumbnailUploadPreview()
    setThumbnailDetailLoading(true)
    setThumbnailUploadError('')

    try {
      const detail = await fetchMasterProductDetail(product.id)
      setSelectedThumbnailProduct(detail)
    } catch {
      setThumbnailUploadError('상품 상세 정보를 불러오지 못했습니다.')
    } finally {
      setThumbnailDetailLoading(false)
    }
  }

  const closeThumbnailEditModal = () => {
    clearThumbnailUploadPreview()
    setThumbnailUploadError('')
    setThumbnailDetailLoading(false)
    setSelectedThumbnailProduct(null)
  }

  const handleThumbnailUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setThumbnailUploadError('png, jpg, webp 이미지만 등록할 수 있습니다.')
      if (thumbnailEditInputRef.current) {
        thumbnailEditInputRef.current.value = ''
      }
      return
    }

    if (thumbnailUploadObjectUrlRef.current) {
      URL.revokeObjectURL(thumbnailUploadObjectUrlRef.current)
    }

    const nextObjectUrl = URL.createObjectURL(file)
    thumbnailUploadObjectUrlRef.current = nextObjectUrl
    setThumbnailUploadPreviewUrl(nextObjectUrl)
    setThumbnailUploadFile(file)
    setThumbnailUploadError('')
  }

  const handleThumbnailUpload = async () => {
    if (!selectedThumbnailProduct || !thumbnailUploadFile || thumbnailUploadLoading) {
      return
    }

    setThumbnailUploadLoading(true)
    setThumbnailUploadError('')

    try {
      await updateMasterProductThumbnail({
        productId: selectedThumbnailProduct.id,
        file: thumbnailUploadFile
      })
      const nextPage =
        missingThumbnailProducts.items.length === 1 && missingThumbnailPage > 1
          ? missingThumbnailPage - 1
          : missingThumbnailPage
      await loadMissingThumbnailProducts(nextPage)
      await loadSummary()
      const detail = await fetchMasterProductDetail(selectedThumbnailProduct.id)
      setSelectedThumbnailProduct(detail)
      clearThumbnailUploadPreview()
    } catch {
      setThumbnailUploadError('대표 썸네일 등록에 실패했습니다.')
    } finally {
      setThumbnailUploadLoading(false)
    }
  }

  const moveMissingThumbnailPage = (nextPage: number) => {
    if (
      missingThumbnailLoading ||
      nextPage < 1 ||
      nextPage > missingThumbnailProducts.totalPages
    ) {
      return
    }

    void loadMissingThumbnailProducts(nextPage)
  }

  const statCards: StatCard[] = useMemo(() => {
    const missingThumbnailCount = Math.max(
      0,
      summary.totalProducts - summary.thumbnailRegisteredCount
    )

    return [
      { label: '전체 상품', value: summary.totalProducts, description: 'RAPUS 표준 상품 원장' },
      {
        label: '연결 바코드 수',
        value: summary.connectedBarcodeCount,
        description: `미연결 ${summary.unlinkedBarcodeCount}건`
      },
      {
        label: '대표 썸네일 등록',
        value: summary.thumbnailRegisteredCount,
        description: '대표 이미지 등록 기준'
      },
      {
        label: '썸네일 미등록',
        value: missingThumbnailCount,
        description: '대표 이미지 미등록 상품'
      },
      { label: '승인 완료', value: summary.approvedCount, description: '판매자 검색 노출 가능' },
      { label: '검수 필요', value: summary.pendingReviewCount, description: '관리자 확인 대기' }
    ]
  }, [summary])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>공용 프로덕트 관리</h1>
          <p className={styles.description}>RAPUS 표준 상품 원장 / 판매자 검색 기준 데이터</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryButton}>
            QR 미리보기
          </button>
          <Link href="/admin/master-products/list" className={styles.secondaryLinkButton}>
            상품 리스트 보기
          </Link>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={openSyncGuideModal}
          >
            동기화 안내
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={openBatchThumbnailModal}
          >
            썸네일 이미지 등록
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={connectLoading}
            onClick={() => void handleConnectProducts()}
          >
            {connectLoading ? '연결 중...' : '신규 상품 연결'}
          </button>
        </div>
      </header>

      {connectMessage ? <p className={styles.connectStatus}>{connectMessage}</p> : null}
      {connectError ? <p className={styles.connectError}>{connectError}</p> : null}

      {typeof document !== 'undefined' && isSyncGuideModalOpen
        ? createPortal(
            <div className={styles.registerModalOverlay} role="presentation">
              <section
                className={styles.syncGuideModal}
                role="dialog"
                aria-modal="true"
                aria-label="동기화 안내 모달"
              >
                <div className={styles.registerModalHeader}>
                  <div className={styles.registerModalTitleGroup}>
                    <h2>동기화 안내</h2>
                    <p className={styles.registerModalDescription}>
                      POS/ERP 업로드 전 칼럼 구조와 SKIPPED 정책을 확인합니다.
                    </p>
                  </div>
                  <button type="button" className={styles.modalCloseButton} onClick={closeSyncGuideModal}>
                    닫기
                  </button>
                </div>

                <div className={styles.syncGuideHero}>
                  <span className={styles.syncGuideIcon}>SYNC</span>
                  <div>
                    <strong>투게더포스 기준 동기화</strong>
                    <p>
                      라푸스 마켓관리자는 POS 프로그램 &quot;투게더포스&quot;의 DB 칼럼 구조를
                      기준으로 동기화됩니다.
                    </p>
                  </div>
                </div>

                <div className={styles.syncGuideTextBlock}>
                  <p>
                    다른 POS/ERP 사용 시 칼럼 구조 차이로 인해 일부 데이터가 정상 반영되지
                    않을 수 있습니다.
                  </p>
                  <p>
                    CSV/엑셀 업로드 시 칼럼명이 다른 경우 일부 항목은 SKIPPED 처리될 수
                    있습니다.
                  </p>
                  <p>
                    업로드 오류 또는 동기화 실패 파일은 고객지원으로 전달해 주세요.
                  </p>
                </div>

                <div className={styles.syncGuideSupportList}>
                  <strong>현재 지원 기준</strong>
                  <ul>
                    <li>투게더포스 CSV 구조</li>
                    <li>바코드 기반 재고 동기화</li>
                    <li>행사/재고/판매가 batch sync</li>
                  </ul>
                </div>

                <div className={styles.registerModalFooter}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={closeSyncGuideModal}
                  >
                    확인
                  </button>
                </div>
              </section>
            </div>,
            document.body
          )
        : null}

      {typeof document !== 'undefined' && isBatchThumbnailModalOpen
        ? createPortal(
            <div className={styles.registerModalOverlay} role="presentation">
              <section
                className={styles.batchThumbnailModal}
                role="dialog"
                aria-modal="true"
                aria-label="썸네일 이미지 등록 규칙 모달"
              >
                <div className={styles.registerModalHeader}>
                  <div className={styles.registerModalTitleGroup}>
                    <h2>썸네일 이미지 등록</h2>
                    <p className={styles.registerModalDescription}>
                      바코드(scanCodeValue) 기준으로 공용 프로덕트 원장 대표 이미지를 일괄 연결합니다.
                    </p>
                  </div>
                  <button type="button" className={styles.modalCloseButton} onClick={closeBatchThumbnailModal}>
                    닫기
                  </button>
                </div>

                <div className={styles.batchRulePanel}>
                  <span className={styles.batchRuleLabel}>파일명 규칙</span>
                  <code>[barcode].[ext]</code>
                  <p>바코드(scanCodeValue) 기준으로 상품 대표 이미지를 연결합니다.</p>
                </div>

                <div className={styles.batchExampleGrid}>
                  <code>8801234567890.jpg</code>
                  <code>8801234567890.jpeg</code>
                  <code>8801234567890.webp</code>
                  <code>8801234567890.png</code>
                </div>

                <div className={styles.batchPolicyGrid}>
                  <article>
                    <strong>대표 이미지</strong>
                    <p>바코드 1개당 대표 썸네일 1개를 연결합니다.</p>
                  </article>
                  <article>
                    <strong>매칭 기준</strong>
                    <p>scanCodeValue 조회 후 내부 productCode를 확인해 원장 상품에 연결합니다.</p>
                  </article>
                  <article>
                    <strong>업로드 제한</strong>
                    <p>현재 기준 최대 100개 이미지, ZIP 50MB 이하로 준비합니다.</p>
                  </article>
                  <article>
                    <strong>저장 구조</strong>
                    <p>image_assets가 파일 경로를 보유하고 master_product_thumbnails가 relation만 연결합니다.</p>
                  </article>
                </div>

                <label
                  className={`${styles.batchUploadArea} ${
                    batchThumbnailFiles.length > 0 || isBatchThumbnailDragging ? styles.batchUploadAreaActive : ''
                  }`}
                  onDragOver={handleBatchThumbnailDragOver}
                  onDragLeave={handleBatchThumbnailDragLeave}
                  onDrop={handleBatchThumbnailDrop}
                >
                  <input
                    ref={batchThumbnailInputRef}
                    type="file"
                    accept=".zip,.jpg,.jpeg,.png,.webp"
                    multiple
                    disabled={batchThumbnailUploading}
                    onChange={handleBatchThumbnailFileChange}
                  />
                  <span
                    className={`${styles.batchUploadCount} ${
                      isBatchThumbnailCountOverLimit ? styles.batchUploadCountWarning : ''
                    }`}
                  >
                    현재 업로드 파일 {batchThumbnailFileCount} / 100
                  </span>
                  <strong>ZIP 또는 이미지 파일을 드래그하거나 클릭하여 업로드하세요.</strong>
                  <span>지원 형식: .zip, .jpg, .jpeg, .png, .webp</span>
                  <span>최대 100개 이미지 / 50MB 이하</span>
                  {batchThumbnailFiles.length > 0 ? (
                    <div className={styles.batchSelectedFileList}>
                      <span>선택한 파일</span>
                      <ul>
                        {batchThumbnailFiles.map((file) => (
                          <li key={`${file.name}-${file.size}`}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </label>

                {batchThumbnailResult ? (
                  <>
                    <div className={styles.batchResultGrid}>
                      <article>
                        <span>전체</span>
                        <strong>{batchThumbnailResult.totalFiles}</strong>
                      </article>
                      <article>
                        <span>성공</span>
                        <strong>{batchThumbnailResult.successCount}</strong>
                      </article>
                      <article>
                        <span>SKIPPED</span>
                        <strong>{batchThumbnailResult.skippedCount}</strong>
                      </article>
                      <article>
                        <span>실패</span>
                        <strong>{batchThumbnailResult.failedCount}</strong>
                      </article>
                    </div>

                    <div className={styles.batchReportActions}>
                      <div>
                        <strong>업로드 결과 리포트</strong>
                        <span>SUCCESS / SKIPPED / FAILED 파일 단위 결과를 CSV로 내려받습니다.</span>
                      </div>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={handleBatchThumbnailReportDownload}
                      >
                        결과 CSV 다운로드
                      </button>
                    </div>

                    {batchThumbnailResult.skippedFiles.length > 0 ? (
                      <div className={styles.batchIssueList}>
                        <strong>SKIPPED 상세</strong>
                        <ul>
                          {batchThumbnailResult.skippedFiles.map((item) => (
                            <li key={`${item.fileName}-${item.reason}`}>
                              <span>{item.fileName}</span>
                              <em>{item.reason}</em>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {batchThumbnailResult.failedFiles.length > 0 ? (
                      <div className={styles.batchIssueList}>
                        <strong>실패 상세</strong>
                        <ul>
                          {batchThumbnailResult.failedFiles.map((item) => (
                            <li key={`${item.fileName}-${item.reason}`}>
                              <span>{item.fileName}</span>
                              <em>{item.reason}</em>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </>
                ) : null}

                {batchThumbnailError ? (
                  <p className={styles.batchErrorText}>{batchThumbnailError}</p>
                ) : null}

                <div className={styles.registerModalFooter}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={batchThumbnailUploading}
                    onClick={closeBatchThumbnailModal}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={
                      batchThumbnailFiles.length === 0 ||
                      batchThumbnailUploading ||
                      isBatchThumbnailCountOverLimit
                    }
                    onClick={() => void handleBatchThumbnailUpload()}
                  >
                    {batchThumbnailUploading ? '업로드 중...' : '업로드 시작'}
                  </button>
                </div>
              </section>
            </div>,
            document.body
          )
        : null}

      <section className={styles.statsGrid}>
        {statCards.map((card) => {
          if (card.label === '전체 상품') {
            return (
              <Link
                key={card.label}
                href="/admin/master-products/list"
                className={`${styles.statCard} ${styles.statCardLink}`}
              >
                <p className={styles.statLabel}>{card.label}</p>
                <strong className={styles.statValue}>{card.value}</strong>
                <span className={styles.statHint}>{card.description}</span>
              </Link>
            )
          }
          if (card.label === '연결 바코드 수') {
            return (
              <Link
                key={card.label}
                href="/admin/barcodes"
                className={`${styles.statCard} ${styles.statCardLink}`}
              >
                <p className={styles.statLabel}>{card.label}</p>
                <strong className={styles.statValue}>{card.value}</strong>
                <span className={styles.statHint}>{card.description}</span>
              </Link>
            )
          }
          if (card.label === '대표 썸네일 등록') {
            return (
              <button
                key={card.label}
                type="button"
                className={`${styles.statCard} ${styles.statCardButton}`}
                onClick={openRegisteredThumbnailModal}
              >
                <p className={styles.statLabel}>{card.label}</p>
                <strong className={styles.statValue}>{card.value}</strong>
                <span className={styles.statHint}>{card.description}</span>
              </button>
            )
          }
          if (card.label === '썸네일 미등록') {
            return (
              <button
                key={card.label}
                type="button"
                className={`${styles.statCard} ${styles.statCardButton}`}
                onClick={openMissingThumbnailModal}
              >
                <p className={styles.statLabel}>{card.label}</p>
                <strong className={styles.statValue}>{card.value}</strong>
                <span className={styles.statHint}>{card.description}</span>
              </button>
            )
          }
          return (
            <article key={card.label} className={styles.statCard}>
              <p className={styles.statLabel}>{card.label}</p>
              <strong className={styles.statValue}>{card.value}</strong>
              <span className={styles.statHint}>{card.description}</span>
            </article>
          )
        })}
      </section>

      {typeof document !== 'undefined' && isRegisteredThumbnailModalOpen
        ? createPortal(
            <div className={styles.registerModalOverlay} role="presentation">
              <section
                className={styles.missingThumbnailModal}
                role="dialog"
                aria-modal="true"
                aria-label="대표 썸네일 등록 상품 모달"
              >
                <div className={styles.registerModalHeader}>
                  <div className={styles.registerModalTitleGroup}>
                    <h2>대표 썸네일 등록 상품</h2>
                    <p className={styles.registerModalDescription}>
                      대표 이미지가 연결된 공용 프로덕트 목록입니다.
                    </p>
                  </div>
                  <button type="button" className={styles.modalCloseButton} onClick={closeRegisteredThumbnailModal}>
                    닫기
                  </button>
                </div>

                <div className={styles.missingThumbnailSummary}>
                  <strong>총 {registeredThumbnailProducts.length}개 상품</strong>
                  <span>대표 이미지 등록 기준</span>
                </div>

                {registeredThumbnailError ? <p className={styles.connectError}>{registeredThumbnailError}</p> : null}

                {registeredThumbnailLoading ? (
                  <div className={styles.emptyState}>상품 목록을 불러오는 중입니다.</div>
                ) : registeredThumbnailProducts.length > 0 ? (
                  <div className={styles.missingProductGrid}>
                    {registeredThumbnailProducts.map((product) => (
                      <article key={product.id} className={styles.missingProductCard}>
                        <div className={styles.registeredProductThumbnail}>
                          {product.thumbnailUrl ? (
                            <Image
                              src={product.thumbnailUrl}
                              alt={`${product.productName || product.normalizedProductName || product.productCode} 대표 썸네일`}
                              className={styles.imagePreview}
                              width={240}
                              height={160}
                              unoptimized
                            />
                          ) : (
                            <span>이미지 경로 확인 필요</span>
                          )}
                        </div>
                        <div className={styles.missingProductBody}>
                          <strong>{product.productName || product.normalizedProductName || '상품명 미등록'}</strong>
                          <span className={styles.missingProductCode}>{product.productCode}</span>
                          <span className={styles.missingProductBarcode}>
                            {product.gtin || '바코드 미연결'}
                          </span>
                          <p>{product.brandName || product.manufacturerName || '브랜드/제조사 미등록'}</p>
                          <p>{product.categoryName || '카테고리 미등록'}</p>
                          <p>{product.specInfo || product.unitLabel || '규격 미등록'}</p>
                          <span className={styles.badge}>{product.approvalStatus}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>대표 썸네일 등록 상품이 없습니다.</div>
                )}
              </section>
            </div>,
            document.body
          )
        : null}

      {typeof document !== 'undefined' && isMissingThumbnailModalOpen
        ? createPortal(
            <div className={styles.registerModalOverlay} role="presentation">
              <section
                className={styles.missingThumbnailModal}
                role="dialog"
                aria-modal="true"
                aria-label="대표 썸네일 미등록 상품 모달"
              >
                <div className={styles.registerModalHeader}>
                  <div className={styles.registerModalTitleGroup}>
                    <h2>대표 썸네일 미등록 상품</h2>
                    <p className={styles.registerModalDescription}>
                      대표 이미지가 아직 연결되지 않은 공용 프로덕트 목록입니다.
                    </p>
                  </div>
                  <button type="button" className={styles.modalCloseButton} onClick={closeMissingThumbnailModal}>
                    닫기
                  </button>
                </div>

                <div className={styles.missingThumbnailSummary}>
                  <strong>총 {missingThumbnailProducts.totalCount}개 상품</strong>
                  <span>
                    {missingThumbnailProducts.page} / {missingThumbnailProducts.totalPages} 페이지
                  </span>
                </div>

                {missingThumbnailError ? <p className={styles.connectError}>{missingThumbnailError}</p> : null}

                {missingThumbnailLoading ? (
                  <div className={styles.emptyState}>상품 목록을 불러오는 중입니다.</div>
                ) : missingThumbnailProducts.items.length > 0 ? (
                  <div className={styles.missingProductGrid}>
                    {missingThumbnailProducts.items.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className={`${styles.missingProductCard} ${styles.missingProductCardButton}`}
                        onClick={() => void openThumbnailEditModal(product)}
                      >
                        <div className={styles.missingProductPlaceholder}>썸네일 미등록</div>
                        <div className={styles.missingProductBody}>
                          <strong>{product.productName || product.normalizedProductName || '상품명 미등록'}</strong>
                          <span className={styles.missingProductCode}>{product.productCode}</span>
                          <span className={styles.missingProductBarcode}>
                            {product.gtin || '바코드 미연결'}
                          </span>
                          <p>{product.brandName || product.manufacturerName || '브랜드/제조사 미등록'}</p>
                          <p>{product.categoryName || '카테고리 미등록'}</p>
                          <p>{product.specInfo || '규격 미등록'}</p>
                          <span className={styles.badge}>{product.approvalStatus}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>대표 썸네일 미등록 상품이 없습니다.</div>
                )}

                <div className={styles.paginationRow}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={missingThumbnailPage <= 1 || missingThumbnailLoading}
                    onClick={() => moveMissingThumbnailPage(missingThumbnailPage - 1)}
                  >
                    이전
                  </button>
                  <span>
                    {missingThumbnailProducts.page} / {missingThumbnailProducts.totalPages}
                  </span>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={
                      missingThumbnailPage >= missingThumbnailProducts.totalPages ||
                      missingThumbnailLoading
                    }
                    onClick={() => moveMissingThumbnailPage(missingThumbnailPage + 1)}
                  >
                    다음
                  </button>
                </div>
              </section>
            </div>,
            document.body
          )
        : null}

      {typeof document !== 'undefined' && (selectedThumbnailProduct || thumbnailDetailLoading)
        ? createPortal(
            <div className={styles.registerModalOverlay} role="presentation">
              <section
                className={styles.thumbnailEditModal}
                role="dialog"
                aria-modal="true"
                aria-label="공용 프로덕트 수정 모달"
              >
                <div className={styles.registerModalHeader}>
                  <div className={styles.registerModalTitleGroup}>
                    <h2>공용 프로덕트 수정</h2>
                    <p className={styles.registerModalDescription}>
                      상품 정보를 확인하고 대표 썸네일을 등록/변경합니다.
                    </p>
                  </div>
                  <button type="button" className={styles.modalCloseButton} onClick={closeThumbnailEditModal}>
                    닫기
                  </button>
                </div>

                {thumbnailDetailLoading || !selectedThumbnailProduct ? (
                  <div className={styles.emptyState}>상품 상세 정보를 불러오는 중입니다.</div>
                ) : (
                  <div className={styles.thumbnailEditContent}>
                    <section className={styles.thumbnailEditInfo}>
                      <p className={styles.statLabel}>상품명</p>
                      <strong>
                        {selectedThumbnailProduct.productName ||
                          selectedThumbnailProduct.normalizedProductName ||
                          '상품명 미등록'}
                      </strong>
                      <p>productCode: {selectedThumbnailProduct.productCode}</p>
                      <p>바코드: {selectedThumbnailProduct.gtin || '바코드 미연결'}</p>
                      <p>브랜드: {selectedThumbnailProduct.brandName || '브랜드 미등록'}</p>
                      <p>제조사: {selectedThumbnailProduct.manufacturerName || '제조사 미등록'}</p>
                      <p>카테고리: {selectedThumbnailProduct.categoryName || '카테고리 미등록'}</p>
                      <p>규격: {selectedThumbnailProduct.specInfo || selectedThumbnailProduct.unitLabel || '규격 미등록'}</p>
                      <p>
                        상태: {selectedThumbnailProduct.approvalStatus} /{' '}
                        {selectedThumbnailProduct.isActive === 1 ? '활성' : '비활성'}
                      </p>
                    </section>

                    <section className={styles.thumbnailEditPicker}>
                      <label className={styles.imagePickerLabel}>
                        <input
                          ref={thumbnailEditInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className={styles.hiddenFileInput}
                          onChange={handleThumbnailUploadChange}
                        />
                        <div className={styles.thumbnailEditPreview}>
                          {thumbnailUploadPreviewUrl ? (
                            <Image
                              src={thumbnailUploadPreviewUrl}
                              alt="등록할 대표 썸네일 미리보기"
                              className={styles.imagePreview}
                              width={360}
                              height={360}
                              unoptimized
                            />
                          ) : selectedThumbnailProduct.thumbnailUrl ? (
                            <Image
                              src={selectedThumbnailProduct.thumbnailUrl}
                              alt="현재 대표 썸네일"
                              className={styles.imagePreview}
                              width={360}
                              height={360}
                              unoptimized
                            />
                          ) : (
                            <span>썸네일 미등록</span>
                          )}
                        </div>
                      </label>
                      <p className={styles.helperText}>png, jpg, webp / 최대 1024px 권장</p>
                      {thumbnailUploadPreviewUrl ? (
                        <button type="button" className={styles.removeImageButton} onClick={clearThumbnailUploadPreview}>
                          선택 이미지 제거
                        </button>
                      ) : null}
                    </section>
                  </div>
                )}

                {thumbnailUploadError ? <p className={styles.connectError}>{thumbnailUploadError}</p> : null}

                <div className={styles.registerModalFooter}>
                  <button type="button" className={styles.secondaryButton} onClick={closeThumbnailEditModal}>
                    취소
                  </button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={!thumbnailUploadFile || thumbnailUploadLoading || thumbnailDetailLoading}
                    onClick={() => void handleThumbnailUpload()}
                  >
                    {thumbnailUploadLoading ? '저장 중...' : '썸네일 저장'}
                  </button>
                </div>
              </section>
            </div>,
            document.body
          )
        : null}

      {typeof document !== 'undefined' && isRegisterModalOpen
        ? createPortal(
            <div className={styles.registerModalOverlay} role="presentation">
              <section className={styles.registerModal} role="dialog" aria-modal="true" aria-label="신규 상품 등록 모달">
                <div className={styles.registerModalHeader}>
                  <div className={styles.registerModalTitleGroup}>
                    <h2>신규 상품 등록</h2>
                    <p className={styles.registerModalDescription}>
                      RAPUS 공용 상품 원장에 등록할 표준 상품 정보를 입력합니다.
                    </p>
                  </div>
                  <button type="button" className={styles.modalCloseButton} onClick={closeRegisterModal}>
                    닫기
                  </button>
                </div>

                <div className={styles.registerModalBody}>
                  <section className={styles.modalSection}>
                    <h3>기본정보</h3>
                    <div className={styles.modalGridBasic}>
                      <label className={styles.formRow}>
                        <span>RAPUS 상품코드</span>
                        <input value="RP-AUTO-GENERATED" readOnly />
                      </label>
                      <label className={styles.formRow}>
                        <span>바코드</span>
                        <input placeholder="13자리 숫자 바코드" />
                      </label>
                      <label className={styles.formRow}>
                        <span>제조사</span>
                        <input placeholder="제조사 입력" />
                      </label>
                      <label className={styles.formRow}>
                        <span>제품명</span>
                        <input placeholder="제품명 입력" />
                      </label>
                      <label className={`${styles.formRow} ${styles.basicInfoWide}`}>
                        <span>표준 카테고리</span>
                        <input placeholder="카테고리 선택" />
                      </label>
                      <div className={styles.basicInfoImageCell}>
                        <label className={styles.imagePickerLabel}>
                          <input
                            ref={thumbnailInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className={styles.hiddenFileInput}
                            onChange={handleThumbnailChange}
                          />
                          <div className={styles.imagePlaceholder}>
                            {thumbnailPreviewUrl ? (
                              <Image
                                src={thumbnailPreviewUrl}
                                alt="선택한 썸네일 미리보기"
                                className={styles.imagePreview}
                                width={640}
                                height={360}
                                unoptimized
                              />
                            ) : (
                              <span>대표 썸네일 등록 Placeholder</span>
                            )}
                          </div>
                        </label>
                        <p className={styles.helperText}>최대 1024px / webp 권장</p>
                        {thumbnailPreviewUrl ? (
                          <button type="button" className={styles.removeImageButton} onClick={clearThumbnailPreview}>
                            선택 이미지 제거
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </section>

                  <section className={styles.modalSection}>
                    <h3>규격정보</h3>
                    <div className={styles.modalGrid}>
                      <label className={styles.formRow}>
                        <span>용량</span>
                        <input placeholder="예: 500" />
                      </label>
                      <label className={styles.formRow}>
                        <span>단위</span>
                        <select defaultValue="ml">
                          <option value="ml">ml</option>
                          <option value="g">g</option>
                          <option value="oz">oz</option>
                        </select>
                      </label>
                      <label className={styles.formRow}>
                        <span>패키징</span>
                        <input placeholder="단품 / 1+1 / 묶음 / 박스" />
                      </label>
                      <label className={styles.formRow}>
                        <span>원산지</span>
                        <select value={originType} onChange={(event) => setOriginType(event.target.value)}>
                          <option value="국산(한국)">국산(한국)</option>
                          <option value="수입산(중국)">수입산(중국)</option>
                          <option value="수입산(미국)">수입산(미국)</option>
                          <option value="수입산(일본)">수입산(일본)</option>
                          <option value="수입산(기타)">수입산(기타) : 직접입력</option>
                        </select>
                      </label>
                      {originType === '수입산(기타)' ? (
                        <label className={styles.formRow}>
                          <span>원산지 직접입력</span>
                          <input
                            value={originCustomText}
                            onChange={(event) => setOriginCustomText(event.target.value)}
                            placeholder="원산지 직접 입력"
                          />
                        </label>
                      ) : null}
                    </div>
                  </section>
                </div>

                <div className={styles.registerModalFooter}>
                  <button type="button" className={styles.secondaryButton} onClick={closeRegisterModal}>
                    취소
                  </button>
                  <button type="button" className={styles.primaryButton} onClick={closeRegisterModal}>
                    목업 저장
                  </button>
                </div>
              </section>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
