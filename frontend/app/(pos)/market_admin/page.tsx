// FILE : frontend/app/(pos)/market_admin/page.tsx
// ROOT : frontend/app/(pos)/market_admin/page.tsx
// STATUS : CREATE MODE
// ROLE : MARKET ADMIN OPERATION HUB MOCK PAGE

'use client'

// SECTION 01 : IMPORT
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  fetchMarketAdminProducts,
  fetchMarketAdminPublicProducts,
  importMarketAdminProduct,
  updateMarketAdminProductPricing,
  updateMarketAdminProductStock,
  updateMarketAdminProductStatus,
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

const formatMarketNumberInput = (value: string) => {
  return value.replace(/\D/g, '')
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
    product.isSoldOut !== 1
  )
}

const isMarketProductEventActive = (product: MarketAdminProduct) => {
  return product.isEventActive === 1 || product.eventPrice !== null
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
    title: '행사등록',
    description: '행사 상품 / 할인율 / 노출 기간 설정',
    status: 'ACTIVE'
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
    return [
      {
        id: 'registered-products',
        label: '총 등록 상품',
        value: `${productTabCounts.ALL}개`,
        description: '채널별 판매 상품'
      },
      {
        id: 'sold-out-products',
        label: '품절 상품',
        value: `${productTabCounts.SOLD_OUT}개`,
        description: '품절 상태 상품'
      },
      {
        id: 'low-stock-products',
        label: '재고 부족 상품',
        value: `${productTabCounts.LOW_STOCK}개`,
        description: '안전 재고 이하'
      },
      {
        id: 'event-products',
        label: '행사 진행 상품',
        value: `${productTabCounts.EVENT}개`,
        description: '행사가 적용 상품'
      },
      {
        id: 'on-sale-products',
        label: '판매중 상품',
        value: `${productTabCounts.ON_SALE}개`,
        description: '판매 상태 ON'
      }
    ]
  }, [productTabCounts])

  const loadMarketProducts = useCallback(async () => {
    try {
      setProductErrorMessage(null)
      const response = await fetchMarketAdminProducts(MARKET_CHANNEL_CODE)
      setMarketProducts(response.items)
    } catch {
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
    setProductErrorMessage(null)
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
                공용 상품 원장의 productCode를 기준으로 이 채널의 판매 정보를 등록합니다.
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

          <div className={styles.productSearchRow}>
            <input
              className={styles.productSearchInput}
              value={productSearchKeyword}
              placeholder="상품명, 브랜드, productCode 검색"
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
                        {product.productCode}
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
                공용 productCode를 기준으로 등록된 이 채널의 판매 가격과 재고입니다.
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

            {filteredMarketProducts.length > 0 ? (
              filteredMarketProducts.slice(0, 5).map((product) => (
                <article key={product.id} className={styles.marketProductItem}>
                  <div>
                    <strong>
                      {product.productNameSnapshot}
                    </strong>
                    <span>
                      {product.brandNameSnapshot ?? '브랜드 미지정'} · {product.productCode}
                    </span>
                  </div>
                  <div className={styles.marketProductNumbers}>
                    <span>
                      판매가 {product.salePrice.toLocaleString()}원
                    </span>
                    <span>
                      재고 {product.stockQuantity.toLocaleString()}개
                    </span>
                    <span>
                      {product.stockStatus}
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
              ))
            ) : (
              <p className={styles.emptyText}>
                해당 조건에 맞는 마켓 판매 상품이 없습니다.
              </p>
            )}
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
