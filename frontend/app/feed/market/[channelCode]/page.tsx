'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import type {
  FormEvent
} from 'react'

import Image from 'next/image'
import QRCode from 'react-qr-code'

import {
  notFound,
  useRouter,
  useParams
} from 'next/navigation'

import {
  login
} from '@/lib/authApi'

import type {
  ProfileDetailPayload
} from '@/lib/profile-summary-api'

import {
  buildProfileStoreRoute,
  getProfileByChannelCode
} from '@/lib/profile-summary-api'

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

type MarketCategoryCardItem = {
  key: string
  title: string
  description: string
  tone: 'grocery' | 'meat' | 'fruit' | 'vegetable' | 'seafood'
  products: string[]
}

type GlobalMenuItem = {
  label: string
  path: string
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

const SPONSOR_LOGOS = [
  '농심',
  '오뚜기',
  'SAMYANG',
  'CJ 제일제당',
  '동원F&B',
  '풀무원',
  '롯데'
]

const MARKET_CATEGORY_CARDS: MarketCategoryCardItem[] = [
  {
    key: 'grocery',
    title: '공산품',
    description: '라면, 카레, 식초 등 다양한 식재료',
    tone: 'grocery',
    products: [
      '라면',
      '카레',
      '식초'
    ]
  },
  {
    key: 'meat',
    title: '정육',
    description: '신선한 고기와 다양한 정육 상품',
    tone: 'meat',
    products: [
      '소고기',
      '삼겹살'
    ]
  },
  {
    key: 'fruit',
    title: '청과',
    description: '신선한 제철 과일',
    tone: 'fruit',
    products: [
      '수박',
      '사과',
      '오렌지'
    ]
  },
  {
    key: 'vegetable',
    title: '야채',
    description: '신선한 야채를 합리적인 가격으로',
    tone: 'vegetable',
    products: [
      '상추',
      '파프리카',
      '당근'
    ]
  },
  {
    key: 'seafood',
    title: '수산',
    description: '신선한 수산물',
    tone: 'seafood',
    products: [
      '생선',
      '새우',
      '조개'
    ]
  }
]

const GLOBAL_MENU_ITEMS: GlobalMenuItem[] = [
  {
    label: '홈(검색)',
    path: '/'
  },
  {
    label: '플레이스',
    path: '/place'
  },
  {
    label: '마켓',
    path: '/market'
  },
  {
    label: '라이프',
    path: '/life'
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

function MarketCategoryShowcaseCard({
  item
}: {
  item: MarketCategoryCardItem
}) {
  return (
    <article className={`${styles.categoryCard} ${styles[`categoryTone${item.tone}`]}`}>
      <div className={styles.categoryText}>
        <h2>
          {item.title}
        </h2>
        <p>
          {item.description}
        </p>
        <button
          type="button"
          aria-label={`${item.title} 대표 상품 보기`}
        >
          ›
        </button>
      </div>

      <div
        className={styles.categoryProducts}
        aria-hidden="true"
      >
        {item.products.map((product) => (
          <span key={product}>
            {product}
          </span>
        ))}
      </div>
    </article>
  )
}

export default function MarketChannelHubPage() {
  const router =
    useRouter()
  const globalMenuRef =
    useRef<HTMLDivElement | null>(null)
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
  const [isLoginModalOpen, setIsLoginModalOpen] =
    useState(false)
  const [isChannelInfoModalOpen, setIsChannelInfoModalOpen] =
    useState(false)
  const [isChannelQrOpen, setIsChannelQrOpen] =
    useState(false)
  const [isChannelImageModalOpen, setIsChannelImageModalOpen] =
    useState(false)
  const [channelImageIndex, setChannelImageIndex] =
    useState(0)
  const [channelInfoLoading, setChannelInfoLoading] =
    useState(false)
  const [channelInfoError, setChannelInfoError] =
    useState('')
  const [channelInfo, setChannelInfo] =
    useState<ProfileDetailPayload | null>(null)
  const [isGlobalMenuOpen, setIsGlobalMenuOpen] =
    useState(false)
  const [loginEmail, setLoginEmail] =
    useState('')
  const [loginPassword, setLoginPassword] =
    useState('')
  const [loginLoading, setLoginLoading] =
    useState(false)
  const [selectedLoginProfile, setSelectedLoginProfile] =
    useState<'GENERAL' | 'BUSINESS'>('GENERAL')

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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (isChannelImageModalOpen) {
          setIsChannelImageModalOpen(false)
          return
        }

        setIsLoginModalOpen(false)
        setIsChannelInfoModalOpen(false)
        setIsChannelQrOpen(false)
      }
    }

    if (
      isLoginModalOpen ||
      isChannelInfoModalOpen ||
      isChannelImageModalOpen
    ) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    isLoginModalOpen,
    isChannelInfoModalOpen,
    isChannelImageModalOpen
  ])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target =
        event.target as Node | null

      if (
        globalMenuRef.current &&
        target &&
        globalMenuRef.current.contains(target)
      ) {
        return
      }

      setIsGlobalMenuOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsGlobalMenuOpen(false)
      }
    }

    if (isGlobalMenuOpen) {
      document.addEventListener('pointerdown', handlePointerDown)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    isGlobalMenuOpen
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
  const searchPlaceholderMarketName =
    channel.marketName?.trim() || '라푸스 마켓'
  const channelInfoName =
    channelInfo?.displayName ||
    channel.marketName
  const channelInfoBio =
    channelInfo?.bio ||
    channel.description
  const channelInfoRegion =
    channelInfo?.activityRegion?.fullName ||
    channelInfo?.feedRegion?.fullName ||
    channelInfo?.activityRegion?.name ||
    channelInfo?.feedRegion?.name ||
    channel.regionName
  const channelInfoAddress =
    [
      channelInfoRegion,
      channelInfo?.detailAddress
    ]
      .filter((value) => Boolean(value))
      .join(' ')
  const channelInfoPhone =
    channelInfo?.contactPhone ||
    '전화번호 미설정'
  const channelInfoImageUrl =
    channelInfo?.avatarImage?.imageUrl ||
    channelInfo?.heroImage?.imageUrl ||
    ''
  const channelImageUrls =
    useMemo(() => {
      if (!channel) {
        return []
      }

      const candidates = [
        channelInfo?.avatarImage?.imageUrl,
        channelInfo?.heroImage?.imageUrl,
        ...channel.products.map((product) => product.thumbnailUrl)
      ]

      const dedupe =
        new Set<string>()
      const nextUrls: string[] =
        []

      for (const candidate of candidates) {
        const imageUrl =
          String(candidate || '').trim()

        if (!imageUrl || dedupe.has(imageUrl)) {
          continue
        }

        dedupe.add(imageUrl)
        nextUrls.push(imageUrl)

        if (nextUrls.length >= 6) {
          break
        }
      }

      return nextUrls
    }, [
      channel,
      channelInfo?.avatarImage?.imageUrl,
      channelInfo?.heroImage?.imageUrl
    ])
  const activeChannelImageUrl =
    channelImageUrls[
      Math.min(
        channelImageIndex,
        Math.max(channelImageUrls.length - 1, 0)
      )
    ] || ''
  const channelThumbnailImageUrl =
    channelInfoImageUrl ||
    channelImageUrls[0] ||
    ''
  const hasMultipleChannelImages =
    channelImageUrls.length > 1
  const channelInfoHoursSummary =
    channelInfo?.businessHours?.summary ||
    channel.status
  const channelInfoOpenStatus =
    channelInfo?.businessHours
      ? channelInfo.businessHours.isOpenNow
        ? '영업중'
        : '영업종료'
      : channel.status
  const channelGuidePath =
    `/channel/${channel.channelCode}`
  const channelGuideUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${channelGuidePath}`
      : channelGuidePath
  const channelInfoInitial =
    channelInfoName.trim().slice(0, 1) || 'M'

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

  function handleGlobalMenuMove(path: string) {
    setIsGlobalMenuOpen(false)
    router.push(path)
  }

  async function handleOpenChannelInfoModal() {
    if (!channel) {
      return
    }

    setIsChannelInfoModalOpen(true)
    setIsChannelQrOpen(false)
    setChannelInfoError('')

    if (
      channelInfo?.channelCode === channel.channelCode
    ) {
      return
    }

    try {
      setChannelInfoLoading(true)

      const summary =
        await getProfileByChannelCode(channel.channelCode)

      setChannelInfo(summary)
    } catch (error) {
      console.error('MARKET CHANNEL INFO LOAD FAILED', error)
      setChannelInfoError('채널 안내 정보를 불러오지 못했습니다.')
    } finally {
      setChannelInfoLoading(false)
    }
  }

  function handleCloseChannelInfoModal() {
    setIsChannelInfoModalOpen(false)
    setIsChannelQrOpen(false)
    setIsChannelImageModalOpen(false)
  }

  function handleOpenChannelImageModal() {
    if (channelImageUrls.length < 1) {
      return
    }

    setChannelImageIndex(0)
    setIsChannelImageModalOpen(true)
  }

  function handleCloseChannelImageModal() {
    setIsChannelImageModalOpen(false)
  }

  function handleMoveChannelImage(direction: 'prev' | 'next') {
    if (channelImageUrls.length < 2) {
      return
    }

    setChannelImageIndex((currentIndex) => {
      if (direction === 'prev') {
        return currentIndex <= 0
          ? channelImageUrls.length - 1
          : currentIndex - 1
      }

      return currentIndex >= channelImageUrls.length - 1
        ? 0
        : currentIndex + 1
    })
  }

  function handleOpenChannelPage() {
    if (!channel) {
      return
    }

    router.push(channelGuidePath)
  }

  function handleOpenMarketStorePage() {
    if (!channel) {
      return
    }

    router.push(
      buildProfileStoreRoute(
        channel.channelCode,
        channelInfo?.placeFeedTypeCode ?? 'MARKET'
      )
    )
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loginLoading) {
      return
    }

    const normalizedEmail =
      loginEmail.trim()
    const normalizedPassword =
      loginPassword.trim()

    if (
      !normalizedEmail ||
      !normalizedPassword
    ) {
      alert('이메일과 비밀번호를 입력해 주세요.')
      return
    }

    setLoginLoading(true)

    try {
      const data =
        await login({
          email: normalizedEmail,
          password: normalizedPassword,
          profileType: selectedLoginProfile
        })

      if (!data?.accessToken) {
        alert('로그인에 실패했습니다.')
        return
      }

      localStorage.setItem('accessToken', data.accessToken)
      window.dispatchEvent(new Event('auth-change'))

      if (data?.user?.userId) {
        localStorage.setItem('userId', String(data.user.userId))
      }

      localStorage.setItem('profileType', selectedLoginProfile)
      localStorage.setItem('activeProfileType', selectedLoginProfile)

      localStorage.removeItem('profileId')
      localStorage.removeItem('activeProfileId')
      localStorage.removeItem('generalProfileId')
      localStorage.removeItem('businessProfileId')

      setIsLoginModalOpen(false)
      setLoginPassword('')
    } catch (error) {
      console.error(error)
      alert('서버 오류가 발생했습니다.')
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.commerceHeader}>
          <div className={styles.mainHeader}>
            <div className={styles.commerceHeaderGroup}>
              <div className={styles.headerLeftGroup}>
                <div className={styles.categoryArea}>
                  <button
                    type="button"
                    className={styles.categoryTrigger}
                    aria-label="카테고리 메뉴 열기"
                    aria-expanded={isCategoryMenuOpen}
                    aria-controls="market-category-menu"
                    onClick={() => {
                      setIsCategoryMenuOpen((currentValue) => {
                        return !currentValue
                      })
                    }}
                  >
                    <span className={styles.hamburgerLine} />
                    <span className={styles.hamburgerLine} />
                    <span className={styles.hamburgerLine} />
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

                <button
                  type="button"
                  className={styles.storeIdentity}
                  onClick={handleOpenChannelInfoModal}
                >
                  <strong
                    className={styles.storeName}
                    aria-label={channel.marketName}
                  >
                    RAPUS MART
                  </strong>
                </button>
              </div>

              <div className={styles.headerSearchGroup}>
                <label className={styles.searchBox}>
                  <input
                    value={keyword}
                    onChange={(event) => {
                      setKeyword(event.target.value)
                      setPage(1)
                    }}
                    placeholder={`${searchPlaceholderMarketName}의 상품을 검색합니다.`}
                  />
                  <button
                    type="button"
                    className={styles.searchButton}
                  >
                    검색
                  </button>
                </label>
              </div>

              <div
                className={styles.headerActions}
                aria-label="마켓 사용자 메뉴"
              >
                <div
                  ref={globalMenuRef}
                  className={styles.globalMenuArea}
                >
                  <button
                    type="button"
                    className={styles.globalMenuTrigger}
                    aria-label="서브메뉴 열기"
                    aria-expanded={isGlobalMenuOpen}
                    aria-controls="market-global-menu"
                    onClick={() => {
                      setIsGlobalMenuOpen((currentValue) => {
                        return !currentValue
                      })
                    }}
                  >
                    <span />
                    <span />
                    <span />
                  </button>

                  {isGlobalMenuOpen ? (
                    <div
                      id="market-global-menu"
                      className={styles.globalMenuPopover}
                    >
                      {GLOBAL_MENU_ITEMS.map((item) => (
                        <button
                          key={item.path}
                          type="button"
                          className={styles.globalMenuItem}
                          onClick={() => {
                            handleGlobalMenuMove(item.path)
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsLoginModalOpen(true)
                  }}
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push('/signup')
                  }}
                >
                  회원가입
                </button>
                <button
                  type="button"
                  className={styles.cartButton}
                  aria-label="장바구니"
                >
                  장바구니
                </button>
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

        <section
          className={styles.sponsorStrip}
          aria-label="스폰서 브랜드"
        >
          {SPONSOR_LOGOS.map((logo) => (
            <span key={logo}>
              {logo}
            </span>
          ))}
        </section>

        <section
          className={styles.categoryShowcase}
          aria-label="대표 카테고리"
        >
          <div className={styles.categoryTopGrid}>
            {MARKET_CATEGORY_CARDS.slice(0, 2).map((item) => (
              <MarketCategoryShowcaseCard
                key={item.key}
                item={item}
              />
            ))}
          </div>

          <div className={styles.categoryBottomGrid}>
            {MARKET_CATEGORY_CARDS.slice(2).map((item) => (
              <MarketCategoryShowcaseCard
                key={item.key}
                item={item}
              />
            ))}
          </div>
        </section>

        <section className={styles.layout}>
          <section className={styles.rightPanel}>
            <div className={styles.dealHeader}>
              <div>
                <h2>
                  오늘의 특가
                </h2>
                <span>
                  행사상품을 모아 확인하세요.
                </span>
              </div>

              <button type="button">
                전체보기
              </button>
            </div>

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

      {isLoginModalOpen ? (
        <div
          className={styles.loginModalOverlay}
          role="presentation"
          onMouseDown={() => {
            setIsLoginModalOpen(false)
          }}
        >
          <section
            className={styles.loginModalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-login-title"
            onMouseDown={(event) => {
              event.stopPropagation()
            }}
          >
            <button
              type="button"
              className={styles.loginModalCloseButton}
              aria-label="로그인 모달 닫기"
              onClick={() => {
                setIsLoginModalOpen(false)
              }}
            >
              ×
            </button>

            <h2
              id="market-login-title"
              className={styles.loginModalLogo}
            >
              RAPUS
            </h2>
            <p className={styles.loginModalSubtitle}>
              Connect Local Business &amp; People
            </p>

            <div className={styles.loginProfileTabs}>
              <button
                type="button"
                className={
                  selectedLoginProfile === 'GENERAL'
                    ? `${styles.loginProfileTab} ${styles.loginProfileTabActive}`
                    : styles.loginProfileTab
                }
                onClick={() => {
                  setSelectedLoginProfile('GENERAL')
                }}
                disabled={loginLoading}
              >
                일반
              </button>
              <button
                type="button"
                className={
                  selectedLoginProfile === 'BUSINESS'
                    ? `${styles.loginProfileTab} ${styles.loginProfileTabActive}`
                    : styles.loginProfileTab
                }
                onClick={() => {
                  setSelectedLoginProfile('BUSINESS')
                }}
                disabled={loginLoading}
              >
                비즈니스
              </button>
            </div>

            <form
              className={styles.loginModalForm}
              onSubmit={handleLoginSubmit}
            >
              <input
                type="email"
                placeholder="이메일"
                value={loginEmail}
                onChange={(event) => {
                  setLoginEmail(event.target.value)
                }}
                autoComplete="email"
                required
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={loginPassword}
                onChange={(event) => {
                  setLoginPassword(event.target.value)
                }}
                autoComplete="current-password"
                required
              />
              <p className={styles.loginHint}>
                개발 임시 비밀번호는 1234입니다.
              </p>

              <button
                type="button"
                className={styles.signupSubmitButton}
                disabled={loginLoading}
                onClick={() => {
                  router.push('/signup')
                }}
              >
                회원가입
              </button>

              <button
                type="submit"
                className={styles.loginSubmitButton}
                disabled={loginLoading}
              >
                {loginLoading
                  ? '로그인 중...'
                  : '로그인'}
              </button>
            </form>

            <div className={styles.loginModalFooter}>
              RAPUS Platform v1.0
            </div>
          </section>
        </div>
      ) : null}

      {isChannelInfoModalOpen ? (
        <div
          className={styles.channelInfoOverlay}
          role="presentation"
          onMouseDown={handleCloseChannelInfoModal}
        >
          <section
            className={styles.channelInfoCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-channel-info-title"
            onMouseDown={(event) => {
              event.stopPropagation()
            }}
          >
            <button
              type="button"
              className={styles.channelInfoCloseButton}
              aria-label="채널 안내 모달 닫기"
              onClick={handleCloseChannelInfoModal}
            >
              ×
            </button>

            <div className={styles.channelInfoHeader}>
              <button
                type="button"
                className={
                  channelImageUrls.length > 0
                    ? `${styles.channelInfoAvatar} ${styles.channelInfoAvatarButton}`
                    : styles.channelInfoAvatar
                }
                onClick={handleOpenChannelImageModal}
                disabled={channelImageUrls.length < 1}
                aria-label={
                  channelImageUrls.length > 0
                    ? '대표 이미지 슬라이드 보기'
                    : '대표 이미지 없음'
                }
              >
                {channelThumbnailImageUrl ? (
                  <Image
                    src={channelThumbnailImageUrl}
                    alt={`${channelInfoName} 대표 이미지`}
                    fill
                    sizes="82px"
                    unoptimized
                  />
                ) : (
                  channelInfoInitial
                )}
              </button>

              <div>
                <p className={styles.channelInfoEyebrow}>
                  MARKET CHANNEL
                </p>
                <h2 id="market-channel-info-title">
                  {channelInfoName}
                </h2>
                <span>
                  {channel.channelCode}
                </span>
              </div>
            </div>

            {channelInfoLoading ? (
              <div className={styles.channelInfoState}>
                채널 안내 정보를 불러오는 중...
              </div>
            ) : (
              <>
                {channelInfoError ? (
                  <div className={styles.channelInfoNotice}>
                    {channelInfoError}
                  </div>
                ) : null}

                <dl className={styles.channelInfoList}>
                  <div>
                    <dt>
                      주소
                    </dt>
                    <dd>
                      {channelInfoAddress || '주소 미설정'}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      영업시간
                    </dt>
                    <dd>
                      {channelInfoHoursSummary}
                      <span className={styles.channelInfoStatus}>
                        {channelInfoOpenStatus}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>
                      전화번호
                    </dt>
                    <dd>
                      {channelInfoPhone}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      소개
                    </dt>
                    <dd>
                      {channelInfoBio || '소개 미설정'}
                    </dd>
                  </div>
                </dl>

                {isChannelQrOpen ? (
                  <div className={styles.channelQrBox}>
                    <QRCode
                      value={channelGuideUrl}
                      size={132}
                      bgColor="#ffffff"
                      fgColor="#111827"
                    />
                    <span>
                      {channelGuideUrl}
                    </span>
                  </div>
                ) : null}

                <div className={styles.channelInfoActions}>
                  <button
                    type="button"
                    onClick={handleOpenChannelPage}
                  >
                    자세히 보기
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}

      {isChannelImageModalOpen && activeChannelImageUrl ? (
        <div
          className={styles.channelImageOverlay}
          role="presentation"
          onMouseDown={handleCloseChannelImageModal}
        >
          <section
            className={styles.channelImageModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-channel-image-title"
            onMouseDown={(event) => {
              event.stopPropagation()
            }}
          >
            <div className={styles.channelImageModalHeader}>
              <div>
                <span>
                  MARKET CHANNEL
                </span>
                <h3 id="market-channel-image-title">
                  {channelInfoName}
                </h3>
                <p>
                  {channelInfoRegion || channel.regionName}
                  {' · '}
                  {channelInfoHoursSummary}
                </p>
              </div>

              <button
                type="button"
                className={styles.channelImageCloseButton}
                aria-label="이미지 모달 닫기"
                onClick={handleCloseChannelImageModal}
              >
                닫기
              </button>
            </div>

            <div className={styles.channelImageSlider}>
              {hasMultipleChannelImages ? (
                <button
                  type="button"
                  className={`${styles.channelImageNavButton} ${styles.channelImageNavPrev}`}
                  aria-label="이전 이미지"
                  onClick={() => {
                    handleMoveChannelImage('prev')
                  }}
                >
                  ‹
                </button>
              ) : null}

              <div className={styles.channelImageFrame}>
                <Image
                  src={activeChannelImageUrl}
                  alt={`${channelInfoName} 대표 이미지 ${channelImageIndex + 1}`}
                  fill
                  sizes="(max-width: 768px) 88vw, 520px"
                  unoptimized
                />
              </div>

              {hasMultipleChannelImages ? (
                <button
                  type="button"
                  className={`${styles.channelImageNavButton} ${styles.channelImageNavNext}`}
                  aria-label="다음 이미지"
                  onClick={() => {
                    handleMoveChannelImage('next')
                  }}
                >
                  ›
                </button>
              ) : null}

              <span className={styles.channelImageCount}>
                {channelImageIndex + 1} / {channelImageUrls.length}
              </span>
            </div>

            <div className={styles.channelImageActions}>
              <button
                type="button"
                className={styles.channelImageStoreButton}
                onClick={handleOpenMarketStorePage}
              >
                매장보기
              </button>
              <button
                type="button"
                className={styles.channelImageGuideButton}
                onClick={handleOpenChannelPage}
              >
                매장안내
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
