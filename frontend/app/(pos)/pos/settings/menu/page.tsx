// FILE : frontend/app/(pos)/pos/settings/menu/page.tsx
// ROOT : frontend/app/(pos)/pos/settings/menu/page.tsx
// STATUS : MODIFY MODE
// ROLE : POS MENU / PRODUCT SETTINGS PAGE
// CHANGE SUMMARY :
// - 상단 Topbar + 헤더 카드 유지
// - 본문 목업 카드 제거
// - getMe() + getPosMenus() 기반 DB 상품 카드 로딩 적용
// - 로딩/에러/빈 상태 UI 추가

'use client'

// SECTION 01 : IMPORT
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import PosTopbar from '../../components/PosTopbar'
import { usePosKeyboardMode } from '../../components/PosKeyboardModeContext'
import styles from './PosMenuSettingsPage.module.css'

import { getMe } from '@/lib/authApi'
import {
  getPosMenus,
  type PosMenuItem
} from '@/lib/business/pos/posMenuApi'
import { mediaUrl } from '@/lib/media'

// SECTION 02 : TYPE
type ProfileContext = {
  profileId: number
  channelCode: string
}

type CategoryProductStat = {
  key: string
  categoryName: string
  count: number
}

// SECTION 03 : COMPONENT
export default function PosMenuSettingsPage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()

  const [context, setContext] = useState<ProfileContext | null>(null)
  const [products, setProducts] = useState<PosMenuItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false)
  const [modalThumbnailUrl, setModalThumbnailUrl] = useState('')
  const [modalThumbnailName, setModalThumbnailName] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const me = await getMe()
        const profileId = Number(me?.user?.profileId || 0)
        const channelCode = String(me?.user?.channelCode || '').trim()
        const profileType = String(me?.user?.profileType || '')

        if (!profileId || !channelCode || profileType !== 'BUSINESS') {
          throw new Error('BUSINESS 프로필 컨텍스트를 확인할 수 없습니다.')
        }

        const profileContext: ProfileContext = {
          profileId,
          channelCode
        }

        setContext(profileContext)

        const response = await getPosMenus(profileContext)
        setProducts(Array.isArray(response?.items) ? response.items : [])
      } catch (error) {
        console.error('POS 상품 목록 로딩 오류', error)
        setProducts([])
        setErrorMessage('POS 상품 목록을 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    void init()
  }, [])

  const categoryStats = useMemo<CategoryProductStat[]>(() => {
    const map = new Map<string, CategoryProductStat>()

    products.forEach((product) => {
      const categoryName = String(product.categoryName || '').trim() || '미분류'
      const categoryId = Number(product.categoryId || 0)
      const key = categoryId > 0 ? String(categoryId) : categoryName

      const current = map.get(key)

      if (current) {
        map.set(key, {
          ...current,
          count: current.count + 1
        })
        return
      }

      map.set(key, {
        key,
        categoryName,
        count: 1
      })
    })

    return Array.from(map.values()).sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName, 'ko')
    )
  }, [products])

  const handleGoPos = () => {
    router.push('/pos')
  }

  const handleGoPosSettings = () => {
    router.push('/pos/settings')
  }

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleSettingsClick = () => {
    router.push('/pos/settings')
  }

  const handleGoCreateMenu = () => {
    router.push('/pos/settings/menu/create')
  }

  const handleGoEditMenu = (menuId: number) => {
    if (!menuId || Number.isNaN(menuId) || menuId <= 0) {
      return
    }

    router.push(`/pos/settings/menu/create?mode=edit&menuId=${menuId}`)
  }

  const handleOpenThumbnailModal = (
    imageUrl: string,
    imageName: string
  ) => {
    if (!imageUrl) {
      return
    }

    setModalThumbnailUrl(imageUrl)
    setModalThumbnailName(imageName)
    setIsThumbnailModalOpen(true)
  }

  const handleCloseThumbnailModal = () => {
    setIsThumbnailModalOpen(false)
    setModalThumbnailUrl('')
    setModalThumbnailName('')
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbarWrap}>
        <div className={styles.topbarInner}>
          <PosTopbar
            title="메뉴 / 상품 설정"
            onHomeClick={handleGoPos}
            onSettingsClick={handleSettingsClick}
            onMyPageClick={handleGoMyPage}
            syncStatus="ONLINE"
            homeShortcutLabel="F1"
            keyboardMode={keyboardMode}
            onToggleKeyboardMode={toggleKeyboardMode}
          />
        </div>
      </div>

      <main className={styles.content}>
        <section className={styles.headerCard}>
          <div className={styles.headerStatsWrap}>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>전체 상품</span>
              <strong className={styles.statValue}>{products.length}개</strong>
            </article>

            {categoryStats.map((item) => (
              <article key={item.key} className={styles.statCard}>
                <span className={styles.statLabel}>{item.categoryName}</span>
                <strong className={styles.statValue}>{item.count}개</strong>
              </article>
            ))}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleGoPosSettings}
            >
              뒤로가기
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleGoPos}
            >
              POS로 이동
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleGoCreateMenu}
            >
              메뉴 등록
            </button>
          </div>
        </section>

        <section className={styles.productSection}>
          {isLoading && (
            <article className={styles.loadingCard}>
              POS 상품 목록을 불러오는 중입니다.
            </article>
          )}

          {!isLoading && errorMessage && (
            <article className={styles.errorCard}>
              {errorMessage}
            </article>
          )}

          {!isLoading && !errorMessage && products.length < 1 && (
            <article className={styles.emptyCard}>
              <p>등록된 POS 상품이 없습니다.</p>
              <p>메뉴 등록 버튼을 눌러 상품을 추가하세요.</p>
            </article>
          )}

          {!isLoading && !errorMessage && products.length > 0 && (
            <div className={styles.productGrid}>
              {products.map((product) => {
                const categoryName = product.categoryName || '미분류'
                const description = product.productDescription || '상품 설명 없음'
                const priceText = `${Number(product.basePrice || 0).toLocaleString('ko-KR')}원`
                const availableOrderTimings: string[] = []
                const availableOrderModes: string[] = []

                if (Boolean(product.allowNormalOrder)) {
                  availableOrderTimings.push('일반주문')
                }

                if (Boolean(product.allowReservationOrder)) {
                  availableOrderTimings.push('예약주문')
                }

                if (Boolean(product.allowDineIn)) {
                  availableOrderModes.push('매장이용')
                }

                if (Boolean(product.allowTakeout)) {
                  availableOrderModes.push('픽업포장')
                }

                if (Boolean(product.allowDelivery)) {
                  availableOrderModes.push('배달')
                }

                const optionSummaryLines = (product.options ?? [])
                  .flatMap((group) => {
                    const values = group?.values ?? []
                    return values.map((value) => {
                      const optionName = String(value.optionValueName || '').trim()
                      const optionPrice = Number(value.priceDelta || 0)

                      if (!optionName) {
                        return ''
                      }

                      if (optionPrice > 0) {
                        return `${optionName} (+${optionPrice.toLocaleString('ko-KR')}원)`
                      }

                      return `${optionName} (기본값)`
                    })
                  })
                  .filter((line) => line.length > 0)

                const thumbnailUrl = mediaUrl(product.thumbnail?.filePath)
                const thumbnailName = String(
                  product.thumbnail?.fileName || product.productName || '상품 썸네일'
                )

                let saleLabel = '판매중'
                let saleClassName = styles.productStatusOn

                if (product.isSoldOut === true) {
                  saleLabel = '품절'
                  saleClassName = styles.productStatusSoldOut
                } else if (product.isActive === false) {
                  saleLabel = '판매중지'
                  saleClassName = styles.productStatusOff
                }

                return (
                  <article
                    key={product.id}
                    className={styles.productCard}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleGoEditMenu(product.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleGoEditMenu(product.id)
                      }
                    }}
                  >
                    <div className={styles.productTop}>
                      <h3 className={styles.productName}>{product.productName}</h3>
                      <p className={styles.productPrice}>{priceText}</p>
                    </div>

                    <p className={styles.productDescription}>{description}</p>

                    {optionSummaryLines.length > 0 ? (
                      <div className={styles.optionSummaryWrap}>
                        <p className={styles.optionSummaryTitle}>옵션 설정</p>
                        <p className={styles.optionSummaryText}>
                          {optionSummaryLines.join(' · ')}
                        </p>
                      </div>
                    ) : (
                      <div className={styles.optionSummaryWrap}>
                        <p className={styles.optionSummaryTitle}>옵션 설정</p>
                        <p className={styles.optionSummaryEmpty}>미설정</p>
                      </div>
                    )}

                    <div className={styles.productMetaRow}>
                      <span className={styles.productBadge}>{categoryName}</span>
                      <span className={`${styles.productBadge} ${saleClassName}`}>{saleLabel}</span>
                      <span className={styles.productBadge}>{product.isActive ? '노출' : '숨김'}</span>
                    </div>

                    <div className={styles.productActionRow}>
                      <button
                        type="button"
                        className={styles.thumbnailViewButton}
                        disabled={!thumbnailUrl}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          handleOpenThumbnailModal(
                            thumbnailUrl,
                            thumbnailName
                          )
                        }}
                      >
                        썸네일
                      </button>
                    </div>

                    <div className={styles.orderAvailabilityWrap}>
                      <p className={styles.orderAvailabilityTitle}>주문 가능</p>
                      <div className={styles.orderAvailabilityBadges}>
                        {availableOrderTimings.length > 0 ? (
                          availableOrderTimings.map((item) => (
                            <span key={`${product.id}-${item}`} className={styles.productBadge}>
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className={styles.orderAvailabilityEmpty}>미설정</span>
                        )}
                      </div>

                      <p className={styles.orderAvailabilityTitle}>주문 방식</p>
                      <div className={styles.orderAvailabilityBadges}>
                        {availableOrderModes.length > 0 ? (
                          availableOrderModes.map((item) => (
                            <span key={`${product.id}-${item}`} className={styles.productBadge}>
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className={styles.orderAvailabilityEmpty}>미설정</span>
                        )}
                      </div>
                    </div>

                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {isThumbnailModalOpen && (
        <div
          className={styles.thumbnailModalOverlay}
          onClick={handleCloseThumbnailModal}
        >
          <div
            className={styles.thumbnailModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.thumbnailModalHeader}>
              <h3 className={styles.thumbnailModalTitle}>{modalThumbnailName}</h3>
              <button
                type="button"
                className={styles.thumbnailModalClose}
                onClick={handleCloseThumbnailModal}
              >
                닫기
              </button>
            </div>

            <div className={styles.thumbnailModalBody}>
              <img
                src={modalThumbnailUrl}
                alt={modalThumbnailName}
                className={styles.thumbnailModalImage}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
