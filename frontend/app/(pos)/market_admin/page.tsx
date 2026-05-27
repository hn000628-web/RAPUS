// FILE : frontend/app/(pos)/market_admin/page.tsx
// ROOT : frontend/app/(pos)/market_admin/page.tsx
// STATUS : CREATE MODE
// ROLE : MARKET ADMIN OPERATION HUB MOCK PAGE

'use client'

// SECTION 01 : IMPORT
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'

import {
  applyMarketAdminProductImport,
  confirmMarketAdminProductImport,
  fetchMarketAdminDashboardSummary,
  fetchMarketAdminProducts,
  fetchMarketAdminPublicProducts,
  importMarketAdminProduct,
  updateMarketAdminProductPricing,
  updateMarketAdminProductStock,
  updateMarketAdminProductStatus,
  uploadMarketAdminProductImportFile,
  type MarketAdminImportConfirmMode,
  type MarketAdminImportApplyResponse,
  type MarketAdminImportPreviewResponse,
  type MarketAdminImportUploadMode,
  type MarketAdminDashboardSummary,
  type MarketAdminProduct,
  type MarketAdminPublicProduct
} from '@/lib/market-admin-products-api'
import { usePosKeyboardMode } from '../pos/components/PosKeyboardModeContext'
import PosTopbar from '../pos/components/PosTopbar'
import styles from './market-admin.module.css'

// SECTION 02 : TYPE
type MarketAdminStatus =
  | 'ACTIVE'
  | 'WARNING'

type MarketAdminSummaryCard = {
  id: string
  label: string
  value: string
  status: MarketAdminStatus
  description: string
}

type MarketAdminMenuCard = {
  id: string
  icon: string
  title: string
  description: string
  status: MarketAdminStatus
  route?: string
}

type MarketAdminRealtimeItem = {
  id: string
  label: string
  value: string
  status: MarketAdminStatus
}

type MarketProductMetricCard = {
  id: string
  label: string
  value: string
  description: string
}

type MarketProductTabId =
  | 'ALL'
  | 'ON_SALE'
  | 'SOLD_OUT'
  | 'LOW_STOCK'
  | 'EVENT'

type MarketProductTab = {
  id: MarketProductTabId
  label: string
}

type MarketProductTabCounts = Record<MarketProductTabId, number>

type DashboardLoadStatus =
  | 'loading'
  | 'error'
  | 'success'

type MarketProductImportForm = {
  purchasePrice: string
  salePrice: string
  eventPrice: string
  eventStartAt: string
  eventEndAt: string
  stockQuantity: string
  safetyStockQuantity: string
  isOnSale: boolean
  isDisplayed: boolean
}

type ImportDisplayStatusLabel = Record<
  MarketAdminImportPreviewResponse['rows'][number]['displayStatus'],
  string
>

type ImportConfirmModeOption = {
  id: MarketAdminImportConfirmMode
  label: string
  description: string
}

type ImportUploadModeOption = {
  id: MarketAdminImportUploadMode
  label: string
  description: string
}

type TemplateDownloadOption = {
  id: 'csv' | 'xlsx'
  label: string
  href: string
  fileName: string
}

// SECTION 03 : CONSTANT
const MARKET_CHANNEL_CODE = 'B8X7C6V5B4N3M'
const MARKET_ADMIN_BADGE = 'MARKET ADMIN'
const MARKET_ADMIN_STATUS: MarketAdminStatus = 'ACTIVE'
const MOCK_CURRENT_TIME = '14:35'
const PUBLIC_PRODUCT_PAGE_SIZE = 6

const MARKET_PRODUCT_TABS: MarketProductTab[] = [
  {
    id: 'ALL',
    label: '전체'
  },
  {
    id: 'ON_SALE',
    label: '판매중'
  },
  {
    id: 'SOLD_OUT',
    label: '품절'
  },
  {
    id: 'LOW_STOCK',
    label: '재고부족'
  },
  {
    id: 'EVENT',
    label: '행사중'
  }
]

const DEFAULT_IMPORT_FORM: MarketProductImportForm = {
  purchasePrice: '0',
  salePrice: '0',
  eventPrice: '',
  eventStartAt: '',
  eventEndAt: '',
  stockQuantity: '0',
  safetyStockQuantity: '0',
  isOnSale: true,
  isDisplayed: true
}

const IMPORT_STATUS_LABELS: ImportDisplayStatusLabel = {
  MATCHED: '매칭완료',
  NEW_PRODUCT_REQUIRED: '신규등록필요',
  MISSING_BARCODE: '바코드없음',
  STOCK_WARNING: '재고오류',
  DUPLICATE_SCAN_CODE: '중복상품'
}

const IMPORT_CONFIRM_MODE_OPTIONS: ImportConfirmModeOption[] = [
  {
    id: 'AUTO_MATCH',
    label: '자동 반영',
    description: '신규 생성과 기존 상품 업데이트를 함께 반영'
  },
  {
    id: 'CREATE_ONLY',
    label: '신규 상품만 등록',
    description: '매칭 실패 row만 신규 상품으로 생성'
  },
  {
    id: 'UPDATE_EXISTING',
    label: '기존 상품만 업데이트',
    description: '이미 등록된 채널 상품만 업데이트'
  },
  {
    id: 'STOCK_ONLY',
    label: '재고만 업데이트',
    description: '가격은 유지하고 재고만 반영'
  },
  {
    id: 'PRICE_ONLY',
    label: '판매가만 업데이트',
    description: '재고는 유지하고 가격만 반영'
  }
]

const IMPORT_UPLOAD_MODE_OPTIONS: ImportUploadModeOption[] = [
  {
    id: 'FULL_SYNC',
    label: '전체 동기화',
    description: '파일에 없는 상품은 재고 0 / 품절 처리'
  },
  {
    id: 'PARTIAL_UPDATE',
    label: '부분 업데이트',
    description: '업로드된 row만 반영하고 기존 상품 유지'
  }
]

const TEMPLATE_DOWNLOAD_OPTIONS: TemplateDownloadOption[] = [
  {
    id: 'csv',
    label: 'CSV 템플릿 다운로드',
    href: '/templates/market_product_template.csv',
    fileName: 'market_product_template.csv'
  },
  {
    id: 'xlsx',
    label: '엑셀 템플릿 다운로드',
    href: '/templates/market_product_template.xlsx',
    fileName: 'market_product_template.xlsx'
  }
]

const formatMarketNumberInput = (value: string) => {
  return value.replace(/\D/g, '')
}

const resolveImportEventStatusLabel = (
  status: MarketAdminImportPreviewResponse['rows'][number]['eventStatus']
) => {
  switch (status) {
    case 'SCHEDULED':
      return '예정'
    case 'ACTIVE':
      return '진행중'
    case 'ENDED':
      return '종료'
    case 'NONE':
    default:
      return '미참여'
  }
}

const resolveImportEventPeriodText = (
  row: MarketAdminImportPreviewResponse['rows'][number]
) => {
  if (!row.eventStartAt && !row.eventEndAt) {
    return '-'
  }

  return `${row.eventStartAt ?? '시작일 미정'} ~ ${row.eventEndAt ?? '종료일 미정'}`
}

const resolveImportTableStatus = (
  row: MarketAdminImportPreviewResponse['rows'][number]
) => {
  if (row.displayStatus === 'MISSING_BARCODE' || row.displayStatus === 'DUPLICATE_SCAN_CODE') {
    return {
      label: '오류',
      className: styles.importStatusError
    }
  }

  if (row.displayStatus === 'NEW_PRODUCT_REQUIRED') {
    return {
      label: '신규 생성',
      className: styles.importStatusCreate
    }
  }

  if (row.stockNormalizeMemo !== null) {
    return {
      label: '재고 변경',
      className: styles.importStatusStock
    }
  }

  if (row.displayStatus === 'MATCHED') {
    return {
      label: '기존 업데이트',
      className: styles.importStatusUpdate
    }
  }

  return {
    label: '변경 없음',
    className: styles.importStatusIdle
  }
}

const resolveImportUpdateText = (
  row: MarketAdminImportPreviewResponse['rows'][number]
) => {
  if (row.errorMessage) {
    return row.errorMessage
  }

  if (row.displayStatus === 'NEW_PRODUCT_REQUIRED') {
    return 'AUTO_IMPORTED'
  }

  if (row.stockNormalizeMemo) {
    return row.stockNormalizeMemo
  }

  if (row.mappedProductCode) {
    return '업데이트 예정'
  }

  return '대기'
}

const isMarketProductOnSale = (product: MarketAdminProduct) => {
  return (
    product.isOnSale === 1 &&
    product.isDisplayed === 1 &&
    product.isSoldOut !== 1
  )
}

const isMarketProductSoldOut = (product: MarketAdminProduct) => {
  return product.isSoldOut === 1 || product.stockQuantity === 0
}

const isMarketProductLowStock = (product: MarketAdminProduct) => {
  return (
    product.stockQuantity <= product.safetyStockQuantity &&
    product.stockQuantity > 0 &&
    product.isSoldOut !== 1
  )
}

const isMarketProductEventActive = (product: MarketAdminProduct) => {
  return product.isEventActive === 1 || product.eventPrice !== null
}

const resolveMarketProductStatus = (product: MarketAdminProduct) => {
  if (product.isSoldOut === 1 || product.stockQuantity === 0) {
    return '품절'
  }

  if (product.isEventActive === 1) {
    return '행사중'
  }

  if (product.isDisplayed !== 1) {
    return '숨김'
  }

  if (product.isOnSale === 1) {
    return '판매중'
  }

  return '숨김'
}

const SUMMARY_CARDS: MarketAdminSummaryCard[] = [
  {
    id: 'today-orders',
    label: '오늘 주문',
    value: '124건',
    status: 'ACTIVE',
    description: '오늘 접수된 주문'
  },
  {
    id: 'campaign-products',
    label: '행사 진행중',
    value: '8개',
    status: 'ACTIVE',
    description: '현재 노출중 행사'
  },
  {
    id: 'low-stock',
    label: '재고 부족',
    value: '14개',
    status: 'WARNING',
    description: '재고 부족 상품'
  },
  {
    id: 'feed-status',
    label: '피드 노출 상태',
    value: '정상',
    status: 'ACTIVE',
    description: '마켓 피드 노출중'
  },
  {
    id: 'ad-status',
    label: '광고 상태',
    value: 'ACTIVE',
    status: 'ACTIVE',
    description: '플레이스 광고 운영중'
  },
  {
    id: 'today-visitors',
    label: '오늘 방문자',
    value: '2,481',
    status: 'ACTIVE',
    description: '오늘 방문자 수'
  }
]

const REALTIME_ITEMS: MarketAdminRealtimeItem[] = [
  {
    id: 'new-orders',
    label: '신규 주문',
    value: '12건',
    status: 'ACTIVE'
  },
  {
    id: 'campaign-approval',
    label: '행사 승인 대기',
    value: '3건',
    status: 'WARNING'
  },
  {
    id: 'stock-alert',
    label: '재고 경고',
    value: '5건',
    status: 'WARNING'
  },
  {
    id: 'feed-review',
    label: '피드 검수 필요',
    value: '1건',
    status: 'WARNING'
  }
]

const MENU_CARDS: MarketAdminMenuCard[] = [
  {
    id: 'products',
    icon: 'NEW',
    title: '상품등록',
    description: '신규 상품 등록 / 가격 / 카테고리 설정',
    status: 'ACTIVE'
  },
  {
    id: 'campaign-create',
    icon: 'SALE',
    title: '행사관리',
    description: '행사 그룹 / 행사 기간 / 행사 상품 운영 관리',
    status: 'ACTIVE',
    route: '/market_admin/events'
  },
  {
    id: 'stock-check',
    icon: 'INV',
    title: '재고확인',
    description: '재고 부족 / 품절 / 입고 대기 확인',
    status: 'WARNING'
  },
  {
    id: 'feed-sync',
    icon: 'FEED',
    title: '피드관리',
    description: '마켓 피드 / 행사 노출 / 검수 상태 관리',
    status: 'ACTIVE'
  },
  {
    id: 'ads',
    icon: 'ADS',
    title: '광고관리',
    description: '플레이스 / 마켓 광고 슬롯',
    status: 'ACTIVE'
  },
  {
    id: 'banners',
    icon: 'BNR',
    title: '배너관리',
    description: '카테고리 배너 및 프로모션',
    status: 'ACTIVE'
  },
  {
    id: 'order-reception',
    icon: 'ORD',
    title: '주문접수',
    description: '실시간 주문 접수 / 처리 상태 확인',
    status: 'ACTIVE'
  },
  {
    id: 'delivery',
    icon: 'DLV',
    title: '배송관리',
    description: '지역배달 / 택배발송 / 픽업 상태 관리',
    status: 'ACTIVE'
  }
]

// SECTION 04 : STATE
export default function MarketAdminPage() {
  const router = useRouter()
  const {
    keyboardMode,
    toggleKeyboardMode
  } = usePosKeyboardMode()
  const [selectedMenuId, setSelectedMenuId] = useState<string>(MENU_CARDS[0]?.id ?? '')
  const [marketProducts, setMarketProducts] = useState<MarketAdminProduct[]>([])
  const [dashboardSummary, setDashboardSummary] =
    useState<MarketAdminDashboardSummary | null>(null)
  const [dashboardLoadStatus, setDashboardLoadStatus] =
    useState<DashboardLoadStatus>('loading')
  const [selectedProductTabId, setSelectedProductTabId] =
    useState<MarketProductTabId>('ALL')
  const [publicProducts, setPublicProducts] = useState<MarketAdminPublicProduct[]>([])
  const [productSearchKeyword, setProductSearchKeyword] = useState('')
  const [selectedPublicProduct, setSelectedPublicProduct] =
    useState<MarketAdminPublicProduct | null>(null)
  const [importForm, setImportForm] =
    useState<MarketProductImportForm>(DEFAULT_IMPORT_FORM)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isProductLoading, setIsProductLoading] = useState(false)
  const [productErrorMessage, setProductErrorMessage] = useState<string | null>(null)
  const [importPreview, setImportPreview] =
    useState<MarketAdminImportPreviewResponse | null>(null)
  const [importConfirmMode, setImportConfirmMode] =
    useState<MarketAdminImportConfirmMode>('AUTO_MATCH')
  const [importUploadMode, setImportUploadMode] =
    useState<MarketAdminImportUploadMode>('FULL_SYNC')
  const [importApplySummary, setImportApplySummary] =
    useState<MarketAdminImportApplyResponse | null>(null)
  const [isImportApplyLoading, setIsImportApplyLoading] = useState(false)
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false)

  // SECTION 05 : DATA
  const selectedMenu = useMemo(() => {
    return MENU_CARDS.find((card) => card.id === selectedMenuId) ?? MENU_CARDS[0]
  }, [selectedMenuId])

  const productTabCounts = useMemo<MarketProductTabCounts>(() => {
    return {
      ALL: marketProducts.length,
      ON_SALE: marketProducts.filter(isMarketProductOnSale).length,
      SOLD_OUT: marketProducts.filter(isMarketProductSoldOut).length,
      LOW_STOCK: marketProducts.filter(isMarketProductLowStock).length,
      EVENT: marketProducts.filter(isMarketProductEventActive).length
    }
  }, [marketProducts])

  const filteredMarketProducts = useMemo(() => {
    switch (selectedProductTabId) {
      case 'ON_SALE':
        return marketProducts.filter(isMarketProductOnSale)
      case 'SOLD_OUT':
        return marketProducts.filter(isMarketProductSoldOut)
      case 'LOW_STOCK':
        return marketProducts.filter(isMarketProductLowStock)
      case 'EVENT':
        return marketProducts.filter(isMarketProductEventActive)
      case 'ALL':
      default:
        return marketProducts
    }
  }, [
    marketProducts,
    selectedProductTabId
  ])

  const productMetricCards = useMemo<MarketProductMetricCard[]>(() => {
    const summary = dashboardSummary ?? {
      totalProducts: 0,
      soldOutProducts: 0,
      lowStockProducts: 0,
      eventProducts: 0,
      activeProducts: 0
    }

    return [
      {
        id: 'registered-products',
        label: '총 등록 상품',
        value: `${summary.totalProducts}개`,
        description: '채널별 판매 상품'
      },
      {
        id: 'sold-out-products',
        label: '품절 상품',
        value: `${summary.soldOutProducts}개`,
        description: '품절 상태 상품'
      },
      {
        id: 'low-stock-products',
        label: '재고 부족 상품',
        value: `${summary.lowStockProducts}개`,
        description: '안전 재고 이하'
      },
      {
        id: 'event-products',
        label: '행사 진행 상품',
        value: `${summary.eventProducts}개`,
        description: '행사가 적용 상품'
      },
      {
        id: 'on-sale-products',
        label: '판매중 상품',
        value: `${summary.activeProducts}개`,
        description: '판매 상태 ON'
      }
    ]
  }, [dashboardSummary])

  const loadMarketProducts = useCallback(async () => {
    try {
      setProductErrorMessage(null)
      setDashboardLoadStatus('loading')
      const [
        productsResponse,
        summaryResponse
      ] = await Promise.all([
        fetchMarketAdminProducts(MARKET_CHANNEL_CODE),
        fetchMarketAdminDashboardSummary(MARKET_CHANNEL_CODE)
      ])
      setMarketProducts(productsResponse.items)
      setDashboardSummary(summaryResponse)
      setDashboardLoadStatus('success')
    } catch {
      setDashboardLoadStatus('error')
      setProductErrorMessage('마켓 등록 상품을 불러오지 못했습니다.')
    }
  }, [])

  const loadPublicProducts = useCallback(async (keyword: string) => {
    try {
      setProductErrorMessage(null)
      setIsProductLoading(true)
      const response = await fetchMarketAdminPublicProducts({
        channelCode: MARKET_CHANNEL_CODE,
        page: 1,
        pageSize: PUBLIC_PRODUCT_PAGE_SIZE,
        keyword
      })
      setPublicProducts(response.items)
    } catch {
      setProductErrorMessage('공용 프로덕트 목록을 불러오지 못했습니다.')
    } finally {
      setIsProductLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMarketProducts()
  }, [loadMarketProducts])

  // SECTION 06 : EVENT
  const handleGoPosHome = () => {
    router.push('/pos')
  }

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleOpenPosSettings = () => {
    router.push('/pos/settings')
  }

  const handleOpenProductSettings = () => {
    setIsProductModalOpen(true)
    setSelectedPublicProduct(null)
    setImportForm(DEFAULT_IMPORT_FORM)
    void loadPublicProducts(productSearchKeyword)
  }

  const handleOpenOrderBoard = () => {
    router.push('/pos/table/orders')
  }

  const handleOpenPublicProductList = () => {
    router.push('/protect')
  }

  const handleSelectMenu = (menuId: string) => {
    const targetMenu = MENU_CARDS.find((card) => card.id === menuId)

    if (targetMenu?.route) {
      router.push(targetMenu.route)
      return
    }

    setSelectedMenuId(menuId)
  }

  const handleSelectProductTab = (tabId: MarketProductTabId) => {
    setSelectedProductTabId(tabId)
  }

  const handleSearchPublicProducts = () => {
    void loadPublicProducts(productSearchKeyword)
  }

  const handleSelectPublicProduct = (product: MarketAdminPublicProduct) => {
    if (product.isRegistered) {
      return
    }

    setSelectedPublicProduct(product)
  }

  const handleChangeImportForm = (
    field: keyof MarketProductImportForm,
    value: string | boolean
  ) => {
    const nextValue =
      typeof value === 'string' &&
      (
        field === 'purchasePrice' ||
        field === 'salePrice' ||
        field === 'eventPrice' ||
        field === 'stockQuantity' ||
        field === 'safetyStockQuantity'
      )
        ? formatMarketNumberInput(value)
        : value

    setImportForm((current) => ({
      ...current,
      [field]: nextValue
    }))
  }

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false)
    setSelectedPublicProduct(null)
    setImportPreview(null)
    setImportApplySummary(null)
    setIsTemplateMenuOpen(false)
    setProductErrorMessage(null)
  }

  const handleToggleTemplateMenu = () => {
    setIsTemplateMenuOpen((current) => !current)
  }

  const handleCloseTemplateMenu = () => {
    setIsTemplateMenuOpen(false)
  }

  const handleUploadImportFile = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      setIsProductLoading(true)
      setProductErrorMessage(null)
      const response = await uploadMarketAdminProductImportFile({
        channelCode: MARKET_CHANNEL_CODE,
        file
      })
      setImportPreview(response)
      setImportApplySummary(null)
    } catch {
      setProductErrorMessage('CSV/엑셀 파일 업로드에 실패했습니다.')
    } finally {
      setIsProductLoading(false)
    }
  }

  const handleConfirmImportFile = async () => {
    if (!importPreview) {
      setProductErrorMessage('먼저 CSV/엑셀 파일을 업로드해주세요.')
      return
    }

    try {
      setIsProductLoading(true)
      setProductErrorMessage(null)
      await confirmMarketAdminProductImport({
        channelCode: MARKET_CHANNEL_CODE,
        batchId: importPreview.batchId,
        mode: importConfirmMode
      })
      await loadMarketProducts()
      setImportPreview(null)
    } catch {
      setProductErrorMessage('CSV/엑셀 일괄 반영에 실패했습니다.')
    } finally {
      setIsProductLoading(false)
    }
  }

  const handleApplyImportFile = async () => {
    if (!importPreview || importPreview.rows.length === 0) {
      setProductErrorMessage('반영할 CSV/엑셀 미리보기 데이터가 없습니다.')
      return
    }

    try {
      setIsImportApplyLoading(true)
      setProductErrorMessage(null)
      const response = await applyMarketAdminProductImport({
        channelCode: MARKET_CHANNEL_CODE,
        batchId: importPreview.batchId,
        uploadMode: importUploadMode,
        previewRows: importPreview.rows
      })
      setImportApplySummary(response)
      await loadMarketProducts()
      await loadPublicProducts(productSearchKeyword)
      setImportPreview(null)
    } catch {
      setProductErrorMessage('업로드 데이터를 마켓 운영상품으로 반영하지 못했습니다.')
    } finally {
      setIsImportApplyLoading(false)
    }
  }

  const handleImportMarketProduct = async () => {
    if (!selectedPublicProduct) {
      setProductErrorMessage('등록할 공용 상품을 선택해주세요.')
      return
    }

    try {
      setIsProductLoading(true)
      setProductErrorMessage(null)
      await importMarketAdminProduct({
        channelCode: MARKET_CHANNEL_CODE,
        productCode: selectedPublicProduct.productCode,
        purchasePrice: Number(importForm.purchasePrice || 0),
        salePrice: Number(importForm.salePrice || 0),
        eventPrice: importForm.eventPrice ? Number(importForm.eventPrice) : null,
        eventStartAt: importForm.eventStartAt || null,
        eventEndAt: importForm.eventEndAt || null,
        stockQuantity: Number(importForm.stockQuantity || 0),
        safetyStockQuantity: Number(importForm.safetyStockQuantity || 0),
        isOnSale: importForm.isOnSale,
        isDisplayed: importForm.isDisplayed,
        changeMemo: 'MARKET 운영 허브 상품 등록'
      })
      await loadMarketProducts()
      await loadPublicProducts(productSearchKeyword)
      setSelectedPublicProduct(null)
      setImportForm(DEFAULT_IMPORT_FORM)
    } catch {
      setProductErrorMessage('마켓 판매 상품 등록에 실패했습니다.')
    } finally {
      setIsProductLoading(false)
    }
  }

  const handleIncreaseSalePrice = async (product: MarketAdminProduct) => {
    try {
      setProductErrorMessage(null)
      await updateMarketAdminProductPricing(product.id, {
        channelCode: MARKET_CHANNEL_CODE,
        purchasePrice: product.purchasePrice,
        salePrice: product.salePrice + 100,
        eventPrice: product.eventPrice,
        eventStartAt: product.eventStartAt,
        eventEndAt: product.eventEndAt,
        isEventActive: product.isEventActive === 1,
        changeMemo: 'MARKET 운영 허브 판매가 빠른 수정'
      })
      await loadMarketProducts()
    } catch {
      setProductErrorMessage('판매가 수정에 실패했습니다.')
    }
  }

  const handleIncreaseStock = async (product: MarketAdminProduct) => {
    try {
      setProductErrorMessage(null)
      await updateMarketAdminProductStock(product.id, {
        channelCode: MARKET_CHANNEL_CODE,
        stockQuantity: product.stockQuantity + 1,
        safetyStockQuantity: product.safetyStockQuantity,
        isSoldOut: false,
        changeMemo: 'MARKET 운영 허브 재고 빠른 수정'
      })
      await loadMarketProducts()
    } catch {
      setProductErrorMessage('재고 수정에 실패했습니다.')
    }
  }

  const handleToggleDisplay = async (product: MarketAdminProduct) => {
    try {
      setProductErrorMessage(null)
      await updateMarketAdminProductStatus(product.id, {
        channelCode: MARKET_CHANNEL_CODE,
        isOnSale: product.isOnSale === 1,
        isDisplayed: product.isDisplayed !== 1,
        isSoldOut: product.isSoldOut === 1,
        changeMemo: 'MARKET 운영 허브 노출 상태 수정'
      })
      await loadMarketProducts()
    } catch {
      setProductErrorMessage('노출 상태 수정에 실패했습니다.')
    }
  }

  // SECTION 07 : UI
  const renderStatusBadge = (status: MarketAdminStatus) => {
    const badgeClassName = [
      styles.statusBadge,
      status === 'WARNING' ? styles.statusWarning : styles.statusActive
    ].join(' ')

    return (
      <span className={badgeClassName}>
        {status}
      </span>
    )
  }

  const renderProductRegisterModal = () => {
    if (!isProductModalOpen) {
      return null
    }

    return (
      <div className={styles.modalOverlay} role="presentation">
        <section
          className={styles.productModal}
          role="dialog"
          aria-modal="true"
          aria-label="공용 프로덕트 등록 모달"
        >
          <div className={styles.modalHeader}>
            <div>
              <h2 className={styles.modalTitle}>
                공용 프로덕트 목록
              </h2>
              <p className={styles.modalDescription}>
                공용 상품 원장의 상품 정보를 기준으로 이 채널의 판매 정보를 등록합니다.
              </p>
            </div>

            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={handleCloseProductModal}
            >
              닫기
            </button>
          </div>

          <div className={styles.bulkImportPanel}>
            <div>
              <strong>CSV/엑셀 일괄 상품등록</strong>
              <p>
                POS/ERP 파일을 업로드하면 바코드 기준으로 공용 상품을 매칭하고 채널 판매정보를 미리 확인합니다.
              </p>
            </div>

            <div className={styles.bulkImportActions}>
              <label className={styles.fileUploadButton}>
                CSV/엑셀 업로드
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleUploadImportFile}
                  disabled={isProductLoading}
                />
              </label>
              <div className={styles.templateDownloadWrap}>
                <button
                  type="button"
                  className={styles.secondaryActionButton}
                  onClick={handleToggleTemplateMenu}
                  aria-expanded={isTemplateMenuOpen}
                >
                  업로드 포맷 ▼
                </button>

                {isTemplateMenuOpen ? (
                  <div className={styles.templateDownloadMenu}>
                    {TEMPLATE_DOWNLOAD_OPTIONS.map((option) => (
                      <a
                        key={option.id}
                        href={option.href}
                        download={option.fileName}
                        onClick={handleCloseTemplateMenu}
                      >
                        {option.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className={styles.primaryActionButton}
                onClick={handleConfirmImportFile}
                disabled={isProductLoading || isImportApplyLoading || !importPreview}
              >
                미리보기 반영
              </button>
              <div className={styles.importUploadModeGroup} aria-label="업로드 모드">
                {IMPORT_UPLOAD_MODE_OPTIONS.map((option) => {
                  const isSelected = option.id === importUploadMode

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={[
                        styles.importUploadModeButton,
                        isSelected ? styles.importUploadModeButtonSelected : ''
                      ].filter(Boolean).join(' ')}
                      onClick={() => setImportUploadMode(option.id)}
                      aria-pressed={isSelected}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.description}</span>
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                className={styles.primaryActionButton}
                onClick={handleApplyImportFile}
                disabled={
                  isProductLoading ||
                  isImportApplyLoading ||
                  !importPreview ||
                  importPreview.rows.length === 0
                }
              >
                {isImportApplyLoading ? '업로드 반영 중...' : '업로드 반영'}
              </button>
            </div>
          </div>

          {importApplySummary ? (
            <div className={styles.importApplySummaryGrid}>
              <span>
                생성
                <strong>{importApplySummary.createdCount}</strong>
              </span>
              <span>
                업데이트
                <strong>{importApplySummary.updatedCount}</strong>
              </span>
              <span>
                SKIPPED
                <strong>{importApplySummary.skippedCount}</strong>
              </span>
              <span>
                품절처리
                <strong>{importApplySummary.soldOutCount}</strong>
              </span>
              <span>
                재판매복구
                <strong>{importApplySummary.restoredCount}</strong>
              </span>
            </div>
          ) : null}

          {importPreview ? (
            <div className={styles.importPreviewPanel}>
              <div className={styles.importModeGrid}>
                {IMPORT_CONFIRM_MODE_OPTIONS.map((option) => {
                  const isSelected = option.id === importConfirmMode

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={[
                        styles.importModeButton,
                        isSelected ? styles.importModeButtonSelected : ''
                      ].filter(Boolean).join(' ')}
                      onClick={() => setImportConfirmMode(option.id)}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.description}</span>
                    </button>
                  )
                })}
              </div>

              <div className={styles.importSummaryGrid}>
                <span>
                  총 행
                  <strong>{importPreview.summary.totalRows}</strong>
                </span>
                <span>
                  매칭 성공
                  <strong>{importPreview.summary.matchedRows}</strong>
                </span>
                <span>
                  신규 상품
                  <strong>{importPreview.summary.newProductRows}</strong>
                </span>
                <span>
                  오류
                  <strong>{importPreview.summary.errorRows}</strong>
                </span>
              </div>

              <div className={styles.importTableScroller}>
                <table className={styles.importPreviewTable}>
                  <thead>
                    <tr>
                      <th>상태</th>
                      <th>바코드</th>
                      <th>상품명</th>
                      <th>공급사</th>
                      <th>매입가</th>
                      <th>판매가</th>
                      <th>행사가</th>
                      <th>행사코드</th>
                      <th>행사명</th>
                      <th>행사기간</th>
                      <th>행사상태</th>
                      <th>재고</th>
                      <th>업데이트</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.rows.map((row) => {
                      const status = resolveImportTableStatus(row)

                      return (
                        <tr key={row.id}>
                          <td>
                            <span className={[
                              styles.importStatusBadge,
                              status.className
                            ].join(' ')}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td>
                            <code>{row.scanCodeValue ?? '바코드 없음'}</code>
                          </td>
                          <td>
                            <strong>{row.productName ?? '상품명 미등록'}</strong>
                          </td>
                          <td>-</td>
                          <td>-</td>
                          <td>{row.salePrice.toLocaleString()}원</td>
                          <td>-</td>
                          <td>
                            <code>{row.eventCode ?? '-'}</code>
                          </td>
                          <td>{row.eventTitle ?? '-'}</td>
                          <td>{resolveImportEventPeriodText(row)}</td>
                          <td>{resolveImportEventStatusLabel(row.eventStatus)}</td>
                          <td>
                            {row.normalizedStockQuantity === null
                              ? '기존 유지'
                              : row.normalizedStockQuantity.toLocaleString()}
                          </td>
                          <td>{resolveImportUpdateText(row)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className={styles.productSearchRow}>
            <input
              className={styles.productSearchInput}
              value={productSearchKeyword}
              placeholder="상품명, 브랜드, 바코드 검색"
              onChange={(event) => setProductSearchKeyword(event.target.value)}
            />
            <button
              type="button"
              className={styles.secondaryActionButton}
              onClick={handleSearchPublicProducts}
              disabled={isProductLoading}
            >
              검색
            </button>
          </div>

          {productErrorMessage ? (
            <p className={styles.errorMessage}>
              {productErrorMessage}
            </p>
          ) : null}

          <div className={styles.productRegisterGrid}>
            <div className={styles.publicProductList}>
              {publicProducts.map((product) => {
                const isSelected = selectedPublicProduct?.productCode === product.productCode
                const itemClassName = [
                  styles.publicProductItem,
                  isSelected ? styles.publicProductItemSelected : '',
                  product.isRegistered ? styles.publicProductItemDisabled : ''
                ].filter(Boolean).join(' ')

                return (
                  <button
                    key={product.productCode}
                    type="button"
                    className={itemClassName}
                    onClick={() => handleSelectPublicProduct(product)}
                    disabled={product.isRegistered}
                  >
                    <span className={styles.publicProductThumb}>
                      {product.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.thumbnailUrl}
                          alt=""
                        />
                      ) : (
                        'IMG'
                      )}
                    </span>

                    <span className={styles.publicProductText}>
                      <strong>
                        {product.productName}
                      </strong>
                      <span>
                        {product.brandName ?? '브랜드 미지정'} · {product.categoryName ?? '카테고리 미지정'}
                      </span>
                      <code>
                        바코드 {product.scanCodeValue ?? '미연결'}
                      </code>
                      <code>
                        시스템 코드 {product.productCode}
                      </code>
                    </span>

                    <span className={styles.registerStateBadge}>
                      {product.isRegistered ? '등록됨' : '선택'}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className={styles.importFormPanel}>
              <h3 className={styles.importFormTitle}>
                채널별 판매 정보
              </h3>
              <p className={styles.importFormDescription}>
                판매가, 재고, 노출 상태는 공용 원장과 분리되어 저장됩니다.
              </p>

              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>매입가</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={importForm.purchasePrice}
                    onChange={(event) => handleChangeImportForm('purchasePrice', event.target.value)}
                  />
                </label>
                <label className={styles.formField}>
                  <span>판매가</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={importForm.salePrice}
                    onChange={(event) => handleChangeImportForm('salePrice', event.target.value)}
                  />
                </label>
                <label className={styles.formField}>
                  <span>행사가</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={importForm.eventPrice}
                    onChange={(event) => handleChangeImportForm('eventPrice', event.target.value)}
                  />
                </label>
                <label className={styles.formField}>
                  <span>초기 재고</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={importForm.stockQuantity}
                    onChange={(event) => handleChangeImportForm('stockQuantity', event.target.value)}
                  />
                </label>
                <label className={styles.formField}>
                  <span>안전 재고</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={importForm.safetyStockQuantity}
                    onChange={(event) => handleChangeImportForm('safetyStockQuantity', event.target.value)}
                  />
                </label>
                <label className={styles.formField}>
                  <span>행사 시작일</span>
                  <input
                    type="date"
                    value={importForm.eventStartAt}
                    onChange={(event) => handleChangeImportForm('eventStartAt', event.target.value)}
                  />
                </label>
                <label className={styles.formField}>
                  <span>행사 종료일</span>
                  <input
                    type="date"
                    value={importForm.eventEndAt}
                    onChange={(event) => handleChangeImportForm('eventEndAt', event.target.value)}
                  />
                </label>
              </div>

              <div className={styles.checkboxRow}>
                <label>
                  <input
                    type="checkbox"
                    checked={importForm.isOnSale}
                    onChange={(event) => handleChangeImportForm('isOnSale', event.target.checked)}
                  />
                  판매 여부
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={importForm.isDisplayed}
                    onChange={(event) => handleChangeImportForm('isDisplayed', event.target.checked)}
                  />
                  노출 여부
                </label>
              </div>

              <button
                type="button"
                className={styles.primaryActionButton}
                onClick={handleImportMarketProduct}
                disabled={isProductLoading || !selectedPublicProduct}
              >
                내 마켓 판매상품으로 등록
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  // SECTION 08 : RETURN
  return (
    <div className={styles.page}>
      <div className={styles.topbarWrap}>
        <div className={styles.topbarInner}>
          <PosTopbar
            title="MARKET 운영 허브"
            onHomeClick={handleGoPosHome}
            onSettingsClick={handleOpenPosSettings}
            onMyPageClick={handleGoMyPage}
            syncStatus="ONLINE"
            keyboardMode={keyboardMode}
            onToggleKeyboardMode={toggleKeyboardMode}
          />
        </div>
      </div>

      <main className={styles.main}>
        <section className={styles.operationHeader} aria-label="마켓 운영 헤더">
          <div className={styles.headerCopy}>
            <div className={styles.headerBadgeRow}>
              <span className={styles.adminBadge}>
                {MARKET_ADMIN_BADGE}
              </span>
              {renderStatusBadge(MARKET_ADMIN_STATUS)}
            </div>

            <h1 className={styles.title}>
              신선마트 운영센터
            </h1>

            <div className={styles.metaGrid}>
              <span>
                채널 : {MARKET_CHANNEL_CODE}
              </span>
              <span>
                운영상태 : {MARKET_ADMIN_STATUS}
              </span>
              <span>
                현재 시간 : {MOCK_CURRENT_TIME}
              </span>
            </div>
          </div>

          <div className={styles.quickActions} aria-label="빠른 실행">
            <button
              type="button"
              className={styles.secondaryActionButton}
              onClick={handleOpenPublicProductList}
            >
              공용 프로덕트 목록
            </button>
            <button
              type="button"
              className={styles.secondaryActionButton}
              onClick={handleOpenOrderBoard}
            >
              주문 현황
            </button>
            <button
              type="button"
              className={styles.primaryActionButton}
              onClick={handleOpenProductSettings}
            >
              상품 등록
            </button>
          </div>
        </section>

        <section className={styles.productMetricGrid} aria-label="마켓 상품 관리 요약">
          {productMetricCards.map((card) => (
            <article key={card.id} className={styles.productMetricCard}>
              <span className={styles.summaryLabel}>
                {card.label}
              </span>
              <strong className={styles.productMetricValue}>
                {card.value}
              </strong>
              <p className={styles.summaryDescription}>
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className={styles.productPanel} aria-label="마켓 등록 상품">
          <div className={styles.sectionHeading}>
            <div>
              <h2 className={styles.sectionTitle}>
                채널별 판매 상품
              </h2>
              <p className={styles.sectionDescription}>
                공용 상품 원장의 상품 기준으로 등록된 이 채널의 판매 가격과 재고입니다.
              </p>
            </div>

            <button
              type="button"
              className={styles.secondaryActionButton}
              onClick={handleOpenProductSettings}
            >
              공용 상품에서 등록
            </button>
          </div>

          <div className={styles.marketProductList}>
            <div className={styles.productTabList} aria-label="상품 목록 필터">
              {MARKET_PRODUCT_TABS.map((tab) => {
                const isSelected = selectedProductTabId === tab.id
                const tabClassName = [
                  styles.productTabButton,
                  isSelected ? styles.productTabButtonActive : ''
                ].filter(Boolean).join(' ')

                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={tabClassName}
                    onClick={() => handleSelectProductTab(tab.id)}
                    aria-pressed={isSelected}
                  >
                    <span>
                      {tab.label}
                    </span>
                    <strong>
                      {productTabCounts[tab.id]}
                    </strong>
                  </button>
                )
              })}
            </div>

            {dashboardLoadStatus === 'loading' ? (
              <p className={styles.emptyText}>
                마켓 상품 통계를 불러오는 중입니다.
              </p>
            ) : null}

            {dashboardLoadStatus === 'error' ? (
              <p className={styles.errorMessage}>
                마켓 등록 상품을 불러오지 못했습니다.
              </p>
            ) : null}

            {dashboardLoadStatus === 'success' && filteredMarketProducts.length > 0 ? (
              filteredMarketProducts.slice(0, 5).map((product) => {
                const productStatus = resolveMarketProductStatus(product)

                return (
                  <article key={product.id} className={styles.marketProductItem}>
                    <div>
                      <strong>
                        {product.productNameSnapshot}
                      </strong>
                      <span>
                        {product.brandNameSnapshot ?? '브랜드 미지정'} · 바코드 {product.barcode ?? '미등록'}
                      </span>
                    </div>
                    <div className={styles.marketProductNumbers}>
                      <span>
                        판매가 {product.salePrice.toLocaleString()}원
                      </span>
                      <span>
                        재고 {product.stockQuantity.toLocaleString()}개
                      </span>
                      <span className={styles.marketProductStatusBadge}>
                        {productStatus}
                      </span>
                    </div>
                    <div className={styles.marketProductActions}>
                      <button
                        type="button"
                        onClick={() => handleIncreaseSalePrice(product)}
                      >
                        판매가 +100
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIncreaseStock(product)}
                      >
                        재고 +1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleDisplay(product)}
                      >
                        {product.isDisplayed === 1 ? '노출 OFF' : '노출 ON'}
                      </button>
                    </div>
                  </article>
                )
              })
            ) : null}

            {dashboardLoadStatus === 'success' && filteredMarketProducts.length === 0 ? (
              <p className={styles.emptyText}>
                해당 조건에 맞는 마켓 판매 상품이 없습니다.
              </p>
            ) : null}
          </div>
        </section>

        <section className={styles.summaryGrid} aria-label="운영 요약">
          {SUMMARY_CARDS.map((card) => (
            <article key={card.id} className={styles.summaryCard}>
              <div className={styles.cardTopLine}>
                <span className={styles.summaryLabel}>
                  {card.label}
                </span>
                {renderStatusBadge(card.status)}
              </div>
              <strong className={styles.summaryValue}>
                {card.value}
              </strong>
              <p className={styles.summaryDescription}>
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className={styles.realtimePanel} aria-label="실시간 운영현황">
          <div className={styles.realtimeHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                실시간 운영현황
              </h2>
              <p className={styles.sectionDescription}>
                주문, 행사, 재고, 피드 검수 흐름을 운영센터에서 바로 확인합니다.
              </p>
            </div>

            <span className={styles.liveBadge}>
              LIVE MOCK
            </span>
          </div>

          <div className={styles.realtimeGrid}>
            {REALTIME_ITEMS.map((item) => (
              <article key={item.id} className={styles.realtimeItem}>
                <div className={styles.realtimeItemTop}>
                  <span className={styles.realtimeLabel}>
                    {item.label}
                  </span>
                  {renderStatusBadge(item.status)}
                </div>
                <strong className={styles.realtimeValue}>
                  {item.value}
                </strong>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.menuPanel} aria-label="운영 메뉴">
          <div className={styles.sectionHeading}>
            <div>
              <h2 className={styles.sectionTitle}>
                운영 메뉴
              </h2>
              <p className={styles.sectionDescription}>
                상품, 주문, 재고, 광고 노출 흐름을 한 화면에서 관리합니다.
              </p>
            </div>

            <div className={styles.selectedMenuPill}>
              선택 : {selectedMenu?.title ?? '상품관리'}
            </div>
          </div>

          <div className={styles.menuGrid}>
            {MENU_CARDS.map((card) => {
              const isSelected = selectedMenuId === card.id
              const cardClassName = [
                styles.menuCard,
                isSelected ? styles.menuCardSelected : ''
              ].filter(Boolean).join(' ')

              return (
                <button
                  key={card.id}
                  type="button"
                  className={cardClassName}
                  onClick={() => handleSelectMenu(card.id)}
                >
                  <span className={styles.iconBox}>
                    {card.icon}
                  </span>

                  <span className={styles.menuContent}>
                    <span className={styles.menuTitleRow}>
                      <strong className={styles.menuTitle}>
                        {card.title}
                      </strong>
                      {renderStatusBadge(card.status)}
                    </span>
                    <span className={styles.menuDescription}>
                      {card.description}
                    </span>
                  </span>

                  <span className={styles.arrowIcon} aria-hidden="true">
                    →
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      </main>

      {renderProductRegisterModal()}
    </div>
  )
}
