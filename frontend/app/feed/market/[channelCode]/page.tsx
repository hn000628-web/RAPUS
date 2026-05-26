'use client'

import {
  useMemo,
  useState
} from 'react'

import Image from 'next/image'
import {
  notFound,
  useParams
} from 'next/navigation'

import styles from './market-channel.module.css'

type CategoryType =
  | '전체'
  | '생활용품'
  | '식품'
  | '음료'
  | '주방'
  | '욕실'
  | '문구'
  | '청소'
  | '기타'

type MarketProduct = {
  id: string
  productName: string
  brandName: string
  productCode: string
  gtin: string
  categoryName: CategoryType
  specInfo: string
  priceLabel: string
  thumbnailUrl: string | null
}

type MarketChannel = {
  channelCode: string
  marketName: string
  regionName: string
  industryName: string
  status: '영업중' | '영업종료'
  description: string
  products: MarketProduct[]
}

const PAGE_SIZE =
  20

const CATEGORY_OPTIONS: CategoryType[] = [
  '전체',
  '생활용품',
  '식품',
  '음료',
  '주방',
  '욕실',
  '문구',
  '청소',
  '기타'
]

const MARKET_CHANNELS: MarketChannel[] = [
  {
    channelCode: 'B8X7C6V5B4N3M',
    marketName: '라푸스 마켓',
    regionName: '풍암동',
    industryName: 'Market',
    status: '영업중',
    description: '오프라인 판매점 / 마트 / 생활용품 중심의 지역 마켓 허브입니다.',
    products: [
      {
        id: 'rapus-001',
        productName: '진라면 매운맛',
        brandName: '오뚜기',
        productCode: 'RPA7K9D2M4Q8',
        gtin: '8801234567890',
        categoryName: '식품',
        specInfo: '120g',
        priceLabel: '1,100원',
        thumbnailUrl: null
      },
      {
        id: 'rapus-002',
        productName: '포카리스웨트 500ml',
        brandName: '동아오츠카',
        productCode: 'RPB3L8F1H9W2',
        gtin: '8801094300762',
        categoryName: '음료',
        specInfo: '500ml',
        priceLabel: '1,500원',
        thumbnailUrl: null
      },
      {
        id: 'rapus-003',
        productName: '크리넥스 미용티슈 250매',
        brandName: '유한킴벌리',
        productCode: 'RPC9M3P6G1K5',
        gtin: '8801165662304',
        categoryName: '생활용품',
        specInfo: '250매',
        priceLabel: '4,900원',
        thumbnailUrl: null
      }
    ]
  },
  {
    channelCode: 'B1B2C3D4E5F6G',
    marketName: '그린 생활마트',
    regionName: '상무지구',
    industryName: '생활용품',
    status: '영업중',
    description: '세제, 욕실, 청소용품을 빠르게 비교할 수 있는 생활형 마켓입니다.',
    products: [
      {
        id: 'green-001',
        productName: '비트 진드기 액체세제 2L',
        brandName: '라이온코리아',
        productCode: 'RPD5J7R2T8V9',
        gtin: '8806325606379',
        categoryName: '생활용품',
        specInfo: '2L',
        priceLabel: '8,900원',
        thumbnailUrl: null
      },
      {
        id: 'green-002',
        productName: '2080 클래식 칫솔 4입',
        brandName: '애경산업',
        productCode: 'RPE1W4Z6U9Y2',
        gtin: '8801046190634',
        categoryName: '욕실',
        specInfo: '4입',
        priceLabel: '3,200원',
        thumbnailUrl: null
      }
    ]
  },
  {
    channelCode: 'M1F2O3O4D5S6T',
    marketName: '동네 식품관',
    regionName: '치평동',
    industryName: '식품',
    status: '영업중',
    description: '가공식품, 간편식, 로컬 식재료를 모아 보여주는 식품형 마켓입니다.',
    products: [
      {
        id: 'food-001',
        productName: '허니버터칩 60g',
        brandName: '해태제과',
        productCode: 'RPF8X2C4V7B1',
        gtin: '8801019310793',
        categoryName: '식품',
        specInfo: '60g',
        priceLabel: '1,700원',
        thumbnailUrl: null
      },
      {
        id: 'food-002',
        productName: '백미 10kg',
        brandName: '농협',
        productCode: 'RPG6N9M2Q4W8',
        gtin: '8801234123456',
        categoryName: '식품',
        specInfo: '10kg',
        priceLabel: '29,800원',
        thumbnailUrl: null
      }
    ]
  },
  {
    channelCode: 'D1R2I3N4K5H6B',
    marketName: '오늘의 음료창고',
    regionName: '금호동',
    industryName: '음료',
    status: '영업종료',
    description: '탄산, 커피, 생수, 행사 음료를 확인하는 음료 전문 마켓입니다.',
    products: [
      {
        id: 'drink-001',
        productName: '삼다수 500ml',
        brandName: '제주특별자치도개발공사',
        productCode: 'RPI2T6V9B3C8',
        gtin: '8801215020272',
        categoryName: '음료',
        specInfo: '500ml',
        priceLabel: '900원',
        thumbnailUrl: null
      }
    ]
  }
]

function getChannelCodeFromParams(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] || ''
  }

  return value || ''
}

function getThumbnailLabel(product: MarketProduct): string {
  return product.categoryName.trim().slice(0, 2)
}

export default function MarketChannelHubPage() {
  const params =
    useParams()
  const channelCode =
    getChannelCodeFromParams(params?.channelCode)

  const channel =
    MARKET_CHANNELS.find((item) => {
      return item.channelCode === channelCode
    })

  const [keyword, setKeyword] =
    useState('')
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryType>('전체')
  const [page, setPage] =
    useState(1)
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] =
    useState(false)

  const filteredProducts =
    useMemo(() => {
      if (!channel) {
        return []
      }

      const keywordText =
        keyword.trim().toLowerCase()

      return channel.products.filter((product) => {
        const categoryMatched =
          selectedCategory === '전체' ||
          product.categoryName === selectedCategory

        const keywordMatched =
          !keywordText ||
          [
            product.productName,
            product.brandName,
            product.productCode,
            product.gtin,
            product.categoryName,
            product.specInfo
          ]
            .join(' ')
            .toLowerCase()
            .includes(keywordText)

        return categoryMatched && keywordMatched
      })
    }, [
      channel,
      keyword,
      selectedCategory
    ])

  if (!channel) {
    notFound()
  }

  const totalPages =
    Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const safePage =
    Math.min(page, totalPages)
  const pagedProducts =
    filteredProducts.slice(
      (safePage - 1) * PAGE_SIZE,
      safePage * PAGE_SIZE
    )

  function handleSelectCategory(category: CategoryType) {
    setSelectedCategory(category)
    setPage(1)
    setIsCategoryMenuOpen(false)
  }

  function handlePrevPage() {
    setPage((currentPage) => {
      return Math.max(1, currentPage - 1)
    })
  }

  function handleNextPage() {
    setPage((currentPage) => {
      return Math.min(totalPages, currentPage + 1)
    })
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.commerceHeader}>
          <div className={styles.utilityBar}>
            <span>
              지역: {channel.regionName}
            </span>
            <span>
              영업상태: {channel.status}
            </span>
            <span>
              채널코드: {channel.channelCode}
            </span>
          </div>

          <div className={styles.mainHeader}>
            <div className={styles.commerceHeaderGroup}>
              <div className={styles.headerLeftGroup}>
                <div className={styles.categoryArea}>
                  <button
                    type="button"
                    className={styles.categoryTrigger}
                    aria-expanded={isCategoryMenuOpen}
                    aria-controls="market-category-menu"
                    onClick={() => {
                      setIsCategoryMenuOpen((currentValue) => {
                        return !currentValue
                      })
                    }}
                  >
                    <span aria-hidden="true">
                      ☰
                    </span>
                    {selectedCategory === '전체'
                      ? '카테고리'
                      : selectedCategory}
                  </button>

                  {isCategoryMenuOpen ? (
                    <div
                      id="market-category-menu"
                      className={styles.categoryDropdown}
                    >
                      {CATEGORY_OPTIONS.map((category) => (
                        <button
                          key={category}
                          type="button"
                          className={
                            category === selectedCategory
                              ? `${styles.categoryDropdownButton} ${styles.categoryDropdownButtonActive}`
                              : styles.categoryDropdownButton
                          }
                          onClick={() => {
                            handleSelectCategory(category)
                          }}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className={styles.storeIdentity}>
                  <strong className={styles.storeName}>
                    {channel.marketName}
                  </strong>
                </div>
              </div>

              <div className={styles.headerSearchGroup}>
                <label className={styles.searchBox}>
                  <input
                    value={keyword}
                    onChange={(event) => {
                      setKeyword(event.target.value)
                      setPage(1)
                    }}
                    placeholder={`${channel.marketName}에서 상품 검색`}
                  />
                </label>
              </div>

              <div
                className={styles.headerActions}
                aria-label="마켓 허브 목업 액션"
              >
                <button type="button">
                  장바구니
                </button>
                <div
                  className={styles.businessHoursBox}
                  aria-label="영업시간 안내"
                >
                  <span className={styles.businessHoursTitle}>
                    영업시간 안내
                  </span>
                  <strong className={styles.businessHoursTime}>
                    09:00 ~ 22:00
                  </strong>
                  <span className={styles.businessHoursNotice}>
                    연중무휴
                  </span>
                </div>
              </div>
            </div>
          </div>

        </header>

        <section
          className={styles.heroBanner}
          aria-label="마켓 프로모션"
        >
          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>
              RAPUS MARKET PICK
            </span>
            <h1>
              오늘 장보기,
              <br />
              {channel.marketName}에서 가볍게
            </h1>
            <p>
              생활용품부터 간편식까지 지역 마켓 추천 상품을 한눈에 확인하세요.
            </p>
            <div className={styles.heroTags}>
              <span>
                오늘의 특가
              </span>
              <span>
                행사상품
              </span>
              <span>
                빠른 확인
              </span>
            </div>
          </div>

          <div
            className={styles.heroVisual}
            aria-hidden="true"
          >
            <div className={styles.heroProductShape}>
              MARKET
            </div>
            <div className={styles.heroBottleShape} />
            <div className={styles.heroBoxShape} />
          </div>

          <aside className={styles.heroSidePanel}>
            <strong>
              추천 코너
            </strong>
            <div>
              <span>
                간편식
              </span>
              <b>
                오늘 바로 찾는 식품
              </b>
            </div>
            <div>
              <span>
                생활용품
              </span>
              <b>
                자주 쓰는 필수템
              </b>
            </div>
            <div>
              <span>
                음료
              </span>
              <b>
                가볍게 담는 음료
              </b>
            </div>
          </aside>
        </section>

        <section className={styles.layout}>
          <section className={styles.rightPanel}>
            {pagedProducts.length === 0 ? (
              <section className={styles.emptyState}>
                <strong>
                  검색 결과가 없습니다.
                </strong>
                <p>
                  상품명, 브랜드명, 카테고리로 다시 검색해 주세요.
                </p>
              </section>
            ) : (
              <div className={styles.cardGrid}>
                {pagedProducts.map((product) => (
                  <article
                    key={product.id}
                    className={styles.productCard}
                  >
                    <div className={styles.thumbnail}>
                      <span className={styles.brandBadge}>
                        {product.brandName}
                      </span>

                      <span className={styles.badge}>
                        행사상품
                      </span>

                      <span className={styles.priceBadge}>
                        {product.priceLabel}
                      </span>

                      {product.thumbnailUrl ? (
                        <Image
                          src={product.thumbnailUrl}
                          alt={`${product.productName} 썸네일`}
                          className={styles.thumbnailImage}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                          unoptimized
                        />
                      ) : (
                        <div className={styles.thumbnailPlaceholder}>
                          {getThumbnailLabel(product)}
                        </div>
                      )}
                    </div>

                    <div className={styles.cardBody}>
                      <strong className={styles.productName}>
                        {product.productName}
                      </strong>

                      <p className={styles.metaText}>
                        {product.categoryName} · {product.specInfo}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {totalPages > 1 ? (
              <nav
                className={styles.pagination}
                aria-label="마켓 상품 목록 페이지"
              >
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={handlePrevPage}
                >
                  이전
                </button>

                <span>
                  {safePage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={handleNextPage}
                >
                  다음
                </button>
              </nav>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  )
}
