// FILE : frontend/app/(pos)/market_admin/events/[eventCode]/page.tsx
// ROLE : MARKET EVENT DETAIL / PRODUCT MANAGEMENT PAGE

'use client'

// SECTION 01 : IMPORT
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'

import {
  connectMarketEventProduct,
  disconnectMarketEventProduct,
  fetchMarketEventDetail,
  updateMarketEvent,
  type MarketEventDetailResponse,
  type MarketEventProduct
} from '@/lib/market-events-api'
import {
  fetchMarketAdminProducts,
  type MarketAdminProduct
} from '@/lib/market-admin-products-api'
import { usePosKeyboardMode } from '../../../pos/components/PosKeyboardModeContext'
import PosTopbar from '../../../pos/components/PosTopbar'
import styles from './market-event-detail.module.css'

// SECTION 02 : TYPE
type LoadStatus =
  | 'loading'
  | 'error'
  | 'success'

function getRouteParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return value ?? ''
}

// SECTION 03 : CONSTANT
const MARKET_CHANNEL_CODE = 'B8X7C6V5B4N3M'

// SECTION 04 : STATE
export default function MarketEventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventCode = getRouteParam(params?.eventCode).toUpperCase()
  const {
    keyboardMode,
    toggleKeyboardMode
  } = usePosKeyboardMode()
  const [detail, setDetail] = useState<MarketEventDetailResponse | null>(null)
  const [marketProducts, setMarketProducts] = useState<MarketAdminProduct[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [bannerImageAssetId, setBannerImageAssetId] = useState('')
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSavingBanner, setIsSavingBanner] = useState(false)

  // SECTION 05 : DATA
  const eventProducts = detail?.products ?? []
  const linkedProductCodes = useMemo(() => {
    return new Set(eventProducts.map((product) => product.productCode))
  }, [eventProducts])

  const searchableProducts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()

    return marketProducts
      .filter((product) => !linkedProductCodes.has(product.productCode))
      .filter((product) => {
        if (!keyword) {
          return true
        }

        return [
          product.productCode,
          product.barcode ?? '',
          product.productNameSnapshot,
          product.brandNameSnapshot ?? ''
        ].some((value) => value.toLowerCase().includes(keyword))
      })
      .slice(0, 8)
  }, [linkedProductCodes, marketProducts, searchKeyword])

  const loadDetail = useCallback(async () => {
    if (!eventCode) {
      return
    }

    try {
      setLoadStatus('loading')
      setErrorMessage(null)

      const [eventDetail, productResponse] = await Promise.all([
        fetchMarketEventDetail(eventCode),
        fetchMarketAdminProducts(MARKET_CHANNEL_CODE)
      ])

      setDetail(eventDetail)
      setMarketProducts(productResponse.items)
      setBannerImageAssetId(
        eventDetail.bannerImageAssetId
          ? String(eventDetail.bannerImageAssetId)
          : ''
      )
      setLoadStatus('success')
    } catch (error) {
      console.error(error)
      setLoadStatus('error')
      setErrorMessage('행사 상세 정보를 불러오지 못했습니다.')
    }
  }, [eventCode])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  // SECTION 06 : EVENT
  const handleGoEventList = () => {
    router.push('/market_admin/events')
  }

  const handleGoMarketHome = () => {
    router.push('/market_admin')
  }

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleOpenPosSettings = () => {
    router.push('/pos')
  }

  const handleChangeSearchKeyword = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(event.target.value)
  }

  const handleChangeBannerImageAssetId = (event: ChangeEvent<HTMLInputElement>) => {
    setBannerImageAssetId(event.target.value)
  }

  const handleSaveBanner = async () => {
    if (!detail) {
      return
    }

    try {
      setIsSavingBanner(true)
      setErrorMessage(null)
      await updateMarketEvent(eventCode, {
        channelCode: detail.event.channelCode,
        bannerImageAssetId: Number(bannerImageAssetId)
      })
      await loadDetail()
    } catch (error) {
      console.error(error)
      setErrorMessage('배너 이미지 연결에 실패했습니다.')
    } finally {
      setIsSavingBanner(false)
    }
  }

  const handleRemoveBanner = async () => {
    if (!detail) {
      return
    }

    try {
      setIsSavingBanner(true)
      setErrorMessage(null)
      await updateMarketEvent(eventCode, {
        channelCode: detail.event.channelCode,
        bannerImageAssetId: null
      })
      setBannerImageAssetId('')
      await loadDetail()
    } catch (error) {
      console.error(error)
      setErrorMessage('배너 이미지 제거에 실패했습니다.')
    } finally {
      setIsSavingBanner(false)
    }
  }

  const handleConnectProduct = async (productCode: string) => {
    try {
      setErrorMessage(null)
      const nextDetail = await connectMarketEventProduct(eventCode, productCode)
      setDetail(nextDetail)
      setBannerImageAssetId(
        nextDetail.bannerImageAssetId ? String(nextDetail.bannerImageAssetId) : ''
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('행사 상품 연결에 실패했습니다.')
    }
  }

  const handleDisconnectProduct = async (productCode: string) => {
    try {
      setErrorMessage(null)
      const nextDetail = await disconnectMarketEventProduct(eventCode, productCode)
      setDetail(nextDetail)
      setBannerImageAssetId(
        nextDetail.bannerImageAssetId ? String(nextDetail.bannerImageAssetId) : ''
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('행사 상품 제거에 실패했습니다.')
    }
  }

  // SECTION 07 : UI
  const renderProductThumbnail = (product: MarketEventProduct) => {
    const isSoldOut = product.isSoldOut === 1 || product.currentStock <= 0

    return (
      <div className={styles.productThumbnail}>
        {product.thumbnailUrl ? (
          <Image
            src={product.thumbnailUrl}
            alt={product.productName}
            width={96}
            height={96}
            unoptimized
          />
        ) : (
          <span>NO IMAGE</span>
        )}
        {isSoldOut ? (
          <strong className={styles.soldOutOverlay}>품절</strong>
        ) : null}
      </div>
    )
  }

  // SECTION 08 : RETURN
  return (
    <div className={styles.page}>
      <div className={styles.topbarWrap}>
        <div className={styles.topbarInner}>
          <PosTopbar
            title="MARKET 행사 상세"
            onHomeClick={handleGoMarketHome}
            onSettingsClick={handleOpenPosSettings}
            onMyPageClick={handleGoMyPage}
            syncStatus="ONLINE"
            keyboardMode={keyboardMode}
            onToggleKeyboardMode={toggleKeyboardMode}
          />
        </div>
      </div>

      <main className={styles.main}>
        {loadStatus === 'loading' ? (
          <p className={styles.emptyState}>행사 상세 정보를 불러오는 중입니다.</p>
        ) : null}

        {loadStatus === 'error' ? (
          <p className={styles.errorBox}>{errorMessage}</p>
        ) : null}

        {loadStatus === 'success' && detail ? (
          <>
            <section className={styles.headerPanel}>
              <div>
                <span className={styles.headerBadge}>EVENT DETAIL</span>
                <h1>{detail.event.eventTitle}</h1>
                <p>
                  {detail.event.eventCode} · {detail.event.channelCode}
                </p>
              </div>
              <div className={styles.headerActions}>
                <button type="button" onClick={handleGoEventList}>
                  행사 목록
                </button>
                <button type="button" onClick={handleGoMarketHome}>
                  운영 허브
                </button>
              </div>
            </section>

            {errorMessage ? (
              <p className={styles.errorBox}>{errorMessage}</p>
            ) : null}

            <section className={styles.infoGrid}>
              <article>
                <span>행사 상태</span>
                <strong>{detail.event.eventStatus}</strong>
              </article>
              <article>
                <span>행사 유형</span>
                <strong>{detail.event.eventType}</strong>
              </article>
              <article>
                <span>행사 시작일</span>
                <strong>{detail.event.eventStartAt ?? '미설정'}</strong>
              </article>
              <article>
                <span>행사 종료일</span>
                <strong>{detail.event.eventEndAt ?? '미설정'}</strong>
              </article>
              <article>
                <span>행사 상품 수</span>
                <strong>{detail.productCount.toLocaleString()}개</strong>
              </article>
              <article className={styles.infoWide}>
                <span>행사 설명</span>
                <strong>{detail.event.eventDescription ?? '설명 미등록'}</strong>
              </article>
            </section>

            <section className={styles.bannerPanel}>
              <div>
                <h2>행사 배너</h2>
                <p>bannerImageAssetId를 image_assets.id 기준으로 연결합니다.</p>
              </div>
              <div className={styles.bannerContent}>
                <div className={styles.bannerPreview}>
                  {detail.bannerImageAssetId ? (
                    <strong>배너 연결됨 #{detail.bannerImageAssetId}</strong>
                  ) : (
                    <span>배너 미등록</span>
                  )}
                </div>
                <div className={styles.bannerControls}>
                  <input
                    type="number"
                    min="1"
                    value={bannerImageAssetId}
                    placeholder="image_assets.id"
                    onChange={handleChangeBannerImageAssetId}
                  />
                  <button
                    type="button"
                    disabled={!bannerImageAssetId || isSavingBanner}
                    onClick={handleSaveBanner}
                  >
                    {detail.bannerImageAssetId ? '배너 변경' : '배너 등록'}
                  </button>
                  <button
                    type="button"
                    disabled={!detail.bannerImageAssetId || isSavingBanner}
                    onClick={handleRemoveBanner}
                  >
                    배너 제거
                  </button>
                </div>
              </div>
            </section>

            <section className={styles.productPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>행사 상품 리스트</h2>
                  <p>eventCode로 연결된 마켓 운영 상품입니다.</p>
                </div>
                <span>{eventProducts.length.toLocaleString()}개 연결</span>
              </div>

              {eventProducts.length === 0 ? (
                <p className={styles.emptyState}>아직 연결된 행사 상품이 없습니다.</p>
              ) : (
                <div className={styles.productGrid}>
                  {eventProducts.map((product) => (
                    <article key={product.id} className={styles.productCard}>
                      {renderProductThumbnail(product)}
                      <div className={styles.productBody}>
                        <span className={styles.eventBadge}>{product.eventStatus}</span>
                        <strong>{product.productName}</strong>
                        <p>{product.brandName ?? '브랜드 미지정'}</p>
                        <p>판매가 {product.salePrice.toLocaleString()}원</p>
                        <p>
                          재고 {product.currentStock.toLocaleString()}개 ·{' '}
                          {product.isSoldOut === 1 ? '품절' : '판매 가능'}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => void handleDisconnectProduct(product.productCode)}
                      >
                        행사 제거
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.productPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>행사 상품 추가</h2>
                  <p>상품명, 바코드, productCode로 마켓 상품을 검색해 연결합니다.</p>
                </div>
              </div>
              <input
                className={styles.searchInput}
                value={searchKeyword}
                placeholder="상품명 / 바코드 / productCode 검색"
                onChange={handleChangeSearchKeyword}
              />
              <div className={styles.searchList}>
                {searchableProducts.map((product) => (
                  <article key={product.id} className={styles.searchItem}>
                    <div>
                      <strong>{product.productNameSnapshot}</strong>
                      <span>
                        {product.productCode} · 바코드 {product.barcode ?? '미등록'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleConnectProduct(product.productCode)}
                    >
                      상품 연결
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}
