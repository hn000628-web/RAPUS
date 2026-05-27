// FILE : frontend/app/channel/[channelCode]/page.tsx
// ROOT : frontend/app/channel/[channelCode]/page.tsx
// STATUS : MODIFY MODE
// ROLE : PUBLIC BUSINESS CHANNEL USER VIEW PAGE
// CHANGE SUMMARY :
// - ChannelOrder 컴포넌트 import 추가
// - 공개 채널 메뉴바에 오더 탭 하드코딩 추가
// - 오더 탭 위치를 메뉴/상품/서비스와 예약 사이로 고정
// - 오더 탭 클릭 시 ChannelOrder UI 목업 렌더링
// - 기존 ChannelReservations / ImageViewer / hero prev / hero next 유지
// - 기존 PC 2컬럼 / 모바일 1컬럼 반응형 유지
// - API / DB / Service 영향 없음

'use client'

// SECTION 01 : IMPORT

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import {
  useParams,
  useSearchParams
} from 'next/navigation'

import {
  getPlaceFeed,
  type PlaceFeedItem
} from '@/lib/place-feed-api'

import {
  getBusinessProfileDetail
} from '@/lib/business/profileApi'

import {
  getBusinessInfoView,
  type BusinessInfoView
} from '@/lib/business/profile-info-api'

import {
  getBusinessMenus,
  type MenuItem
} from '@/lib/business/menuApi'
import {
  getProfileFavoriteStatus,
  toggleProfileFavorite
} from '@/lib/favoritesApi'
import TopMenuZone from '@/components/topbar/TopMenuZone'

import ChannelInfo from './components/MenuBar/channelInfo'
import ChannelSummary from './components/MenuBar/channelSummary'
import ChannelProducts from './components/MenuBar/channelProducts'
import ChannelEvents from './components/MenuBar/channelEvents'
import ChannelGallery from './components/MenuBar/channelGallery'
import ChannelReviews from './components/MenuBar/channelReviews'
import ChannelReservations from './components/MenuBar/channelReservations'
import ChannelOrder from './components/MenuBar/channelOrder'
import ImageViewer from './components/MenuBar/viewer/ImageViewer'

import styles from './PublicChannelPage.module.css'

// SECTION 02 : TYPE

type ChannelPageProps = {
  params: {
    channelCode: string
  }
}

type TabItem = {
  id: string
  label: string
  postType?: string | null
}

type ProfileDetailLike = {
  profile?: {
    id?: number
    displayName?: string | null
    bio?: string | null
    businessType?: string | null
    businessTypeCode?: string | null
  } | null
  industry?: {
    industry?: {
      name?: string | null
    } | null
    industrySubtype?: {
      name?: string | null
    } | null
  } | null
  media?: {
    avatar?: {
      imageUrl?: string | null
      filePath?: string | null
    } | null
    heroImages?: Array<{
      imageUrl?: string | null
      filePath?: string | null
      sortOrder?: number | null
    }> | null
  } | null
  placeMeta?: {
    contactPhone?: string | null
    detailAddress?: string | null
    activityRegion?: {
      name?: string | null
      fullName?: string | null
    } | null
    feedRegion?: {
      name?: string | null
      fullName?: string | null
    } | null
  } | null
  infoBlocks?: Array<{
    id?: number
    blockType?: string | null
    title?: string | null
    content?: string | null
    linkUrl?: string | null
    sortOrder?: number | null
  }> | null
}

type ChannelPostViewItem = {
  id: number
  title: string
  content?: string | null
  priceAmount?: number | null
  imageUrl?: string | null
  createdAt?: string | null
}

type ChannelGalleryViewItem = {
  galleryId: number
  imageUrl: string | null
  createdAt?: string | null
}

type BusinessPostApiItem = {
  id: number
  title: string | null
  content: string | null
  priceAmount: number | null
  createdAt: string | null
  images?: Array<{
    imageUrl?: string | null
    filePath?: string | null
  }>
  imageUrl?: string | null
}

type ChannelInfoSection = {
  id?: number
  type: 'TEXT' | 'LINK' | 'IMAGE' | 'SECTION'
  title?: string | null
  content?: string | null
  url?: string | null
  imageUrl?: string | null
  description?: string | null
  sortOrder?: number | null
}

type MenuItemWithName = MenuItem & {
  name?: string | null
}

// SECTION 03 : CONSTANT

const FIXED_TABS: TabItem[] = [
  {
    id: 'info',
    label: '안내',
    postType: 'INFO'
  },
  {
    id: 'summary',
    label: '소개',
    postType: 'SUMMARY'
  }
]

const FALLBACK_DYNAMIC_TABS: TabItem[] = [
  {
    id: 'event',
    label: '이벤트',
    postType: 'EVENT'
  },
  {
    id: 'product',
    label: '메뉴/상품/서비스',
    postType: 'PRODUCT'
  },
  {
    id: 'gallery',
    label: '사진첩',
    postType: 'GALLERY'
  }
]

const ORDER_TAB: TabItem = {
  id: 'order',
  label: '오더',
  postType: 'ORDER'
}

const RESERVATION_TAB: TabItem = {
  id: 'reservation',
  label: '예약',
  postType: 'RESERVATION'
}

const MENU_SCROLL_AMOUNT = 180

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API ||
  'http://localhost:4000'

// SECTION 04 : UTIL FUNCTION

function normalizeImageUrl(
  value?: string | null
): string | null {
  const raw = String(value || '').trim()

  if (!raw) {
    return null
  }

  if (/^(https?:|blob:|\/)/.test(raw)) {
    return raw
  }

  return `/media/${raw}`
}

function formatIndustryLabel(
  detail: ProfileDetailLike | null
): string {
  const industryName =
    String(detail?.industry?.industry?.name || '').trim()

  const subtypeName =
    String(detail?.industry?.industrySubtype?.name || '').trim()

  if (industryName && subtypeName) {
    return `${industryName} · ${subtypeName}`
  }

  if (subtypeName) {
    return subtypeName
  }

  if (industryName) {
    return industryName
  }

  return '업종 정보 없음'
}

function resolveBusinessTypeLabel(
  detail: ProfileDetailLike | null
): string {
  const raw = String(
    detail?.profile?.businessTypeCode ||
    detail?.profile?.businessType ||
    ''
  )
    .trim()
    .toUpperCase()

  if (raw === 'STORE') {
    return '고정형마켓'
  }

  if (raw === 'SHOPPING_MALL') {
    return '쇼핑몰형'
  }

  if (raw === 'FREELANCER') {
    return '프리랜서'
  }

  if (raw === 'MOBILE_BIZ' || raw === 'MOBILE') {
    return '이동형'
  }

  return '고정형마켓'
}

function normalizePostType(
  value?: string | null
): string {
  return String(value || '').trim().toUpperCase()
}

function mapBusinessPostsToViewItems(
  rows: BusinessPostApiItem[]
): ChannelPostViewItem[] {
  return rows.map(row => {
    const firstImage =
      Array.isArray(row.images) && row.images.length > 0
        ? row.images[0]
        : null

    const resolvedImageUrl =
      normalizeImageUrl(
        row.imageUrl ||
        firstImage?.imageUrl ||
        firstImage?.filePath ||
        null
      )

    return {
      id: row.id,
      title: String(row.title || '').trim() || '제목 없음',
      content: row.content,
      priceAmount: row.priceAmount,
      imageUrl: resolvedImageUrl,
      createdAt: row.createdAt
    }
  })
}

function mapGalleryResponseToViewItems(
  rows: Array<{
    galleryId: number
    imageUrl?: string | null
    filePath?: string | null
    createdAt?: string | null
  }>
): ChannelGalleryViewItem[] {
  return rows.map(row => {
    return {
      galleryId: row.galleryId,
      imageUrl: normalizeImageUrl(row.imageUrl || row.filePath || null),
      createdAt: row.createdAt || null
    }
  })
}

function mapInfoSections(
  sections?: BusinessInfoView['sections'] | null
): ChannelInfoSection[] {
  if (!Array.isArray(sections)) {
    return []
  }

  return sections.map(section => {
    return {
      id: section.id,
      type: section.type,
      title: section.title ?? null,
      content: section.content ?? section.value ?? null,
      url: section.url ?? null,
      imageUrl: section.imageUrl ?? null,
      description: null,
      sortOrder: section.sortOrder ?? 0
    }
  })
}

function mapDetailInfoBlocks(
  blocks?: ProfileDetailLike['infoBlocks']
): ChannelInfoSection[] {
  if (!Array.isArray(blocks)) {
    return []
  }

  return blocks.map(block => {
    return {
      id: block.id,
      type: (normalizePostType(block.blockType) || 'TEXT') as ChannelInfoSection['type'],
      title: block.title ?? null,
      content: block.content ?? null,
      url: block.linkUrl ?? null,
      imageUrl: null,
      description: null,
      sortOrder: Number(block.sortOrder ?? 0)
    }
  })
}

function insertOrderAndReservationTabs(
  tabs: TabItem[]
): TabItem[] {
  const filteredTabs =
    tabs.filter(tab => {
      const tabType =
        normalizePostType(tab.postType || tab.id)

      return tabType !== 'ORDER' && tabType !== 'RESERVATION'
    })

  const productIndex =
    filteredTabs.findIndex(tab => {
      return normalizePostType(tab.postType || tab.id) === 'PRODUCT'
    })

  if (productIndex < 0) {
    return [
      ...filteredTabs,
      ORDER_TAB,
      RESERVATION_TAB
    ]
  }

  return [
    ...filteredTabs.slice(0, productIndex + 1),
    ORDER_TAB,
    RESERVATION_TAB,
    ...filteredTabs.slice(productIndex + 1)
  ]
}

// SECTION 05 : COMPONENT

export default function PublicChannelPage({
  params
}: ChannelPageProps) {
  // SECTION 06 : ROUTE / REF

  const routeParams =
    useParams<{
      channelCode?: string
    }>()
  const searchParams = useSearchParams()

  const menuBarRef =
    useRef<HTMLDivElement | null>(null)
  const autoOrderTabHandledRef =
    useRef(false)

  const channelCode = useMemo(() => {
    return String(
      routeParams?.channelCode ||
      params?.channelCode ||
      ''
    ).trim()
  }, [
    routeParams,
    params?.channelCode
  ])

  const shouldAutoOpenOrder = useMemo(() => {
    return searchParams?.get('openOrder') === 'true'
  }, [searchParams])

  // SECTION 07 : STATE

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [detail, setDetail] =
    useState<ProfileDetailLike | null>(null)

  const [infoView, setInfoView] =
    useState<BusinessInfoView | null>(null)

  const [menus, setMenus] =
    useState<MenuItem[]>([])

  const [generalPostItems, setGeneralPostItems] =
    useState<ChannelPostViewItem[]>([])

  const [productPostItems, setProductPostItems] =
    useState<ChannelPostViewItem[]>([])

  const [eventPostItems, setEventPostItems] =
    useState<ChannelPostViewItem[]>([])

  const [galleryDbItems, setGalleryDbItems] =
    useState<ChannelGalleryViewItem[]>([])

  const [activeTab, setActiveTab] =
    useState<string>('info')

  const [canScrollLeft, setCanScrollLeft] =
    useState(false)

  const [canScrollRight, setCanScrollRight] =
    useState(false)

  const [heroViewerOpen, setHeroViewerOpen] =
    useState(false)

  const [heroViewerIndex, setHeroViewerIndex] =
    useState(0)

  const [viewerMode, setViewerMode] =
    useState<'hero' | 'avatar'>('hero')

  const [isFavoriteRegistered, setIsFavoriteRegistered] =
    useState(false)

  const [isFavoriteLoading, setIsFavoriteLoading] =
    useState(false)

  const detailFavoriteFallback = useMemo(() => {
    const source = detail as unknown as Record<string, unknown> | null
    if (!source) {
      return false
    }

    const directCandidate =
      source.isSaved ??
      source.isFavorite ??
      source.isBookmarked ??
      source.bookmarked ??
      source.saved

    if (typeof directCandidate === 'boolean') {
      return directCandidate
    }

    const relationCandidate = source.relation as Record<string, unknown> | undefined
    if (!relationCandidate) {
      return false
    }

    const nestedCandidate =
      relationCandidate.isSaved ??
      relationCandidate.isFavorite ??
      relationCandidate.isBookmarked ??
      relationCandidate.bookmarked ??
      relationCandidate.saved

    return typeof nestedCandidate === 'boolean'
      ? nestedCandidate
      : false
  }, [detail])

  useEffect(() => {
    if (!channelCode) {
      setIsFavoriteRegistered(false)
      return
    }

    let canceled = false

    const loadFavoriteStatus = async () => {
      try {
        const response = await getProfileFavoriteStatus(channelCode)
        if (!canceled) {
          setIsFavoriteRegistered(Boolean(response?.isActive))
        }
      } catch {
        if (!canceled) {
          setIsFavoriteRegistered(detailFavoriteFallback)
        }
      }
    }

    loadFavoriteStatus()

    return () => {
      canceled = true
    }
  }, [channelCode, detailFavoriteFallback])

  const handleFavoriteToggle = useCallback(async () => {
    if (!channelCode || isFavoriteLoading) {
      return
    }

    setIsFavoriteLoading(true)
    try {
      const response = await toggleProfileFavorite(channelCode)
      setIsFavoriteRegistered(Boolean(response?.isFavorite))
    } catch {
      // 인증 만료/네트워크 오류는 기존 상태를 유지한다.
    } finally {
      setIsFavoriteLoading(false)
    }
  }, [channelCode, isFavoriteLoading])

  // SECTION 08 : MENU SCROLL FUNCTION

  const updateMenuScrollState = useCallback(() => {
    const element =
      menuBarRef.current

    if (!element) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    const maxScrollLeft =
      element.scrollWidth - element.clientWidth

    if (maxScrollLeft <= 1) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    setCanScrollLeft(element.scrollLeft > 1)
    setCanScrollRight(element.scrollLeft < maxScrollLeft - 1)
  }, [])

  const handleMenuScrollLeft = useCallback(() => {
    menuBarRef.current?.scrollBy({
      left: -MENU_SCROLL_AMOUNT,
      behavior: 'smooth'
    })
  }, [])

  const handleMenuScrollRight = useCallback(() => {
    menuBarRef.current?.scrollBy({
      left: MENU_SCROLL_AMOUNT,
      behavior: 'smooth'
    })
  }, [])

  // SECTION 09 : DATA LOAD EFFECT

  useEffect(() => {
    if (!channelCode) {
      setError('채널코드가 없습니다.')
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const settled =
          await Promise.allSettled([
            getBusinessProfileDetail(channelCode),
            getBusinessInfoView(channelCode),
            getBusinessMenus(channelCode),
            getPlaceFeed({
              limit: 200
            })
          ])

        if (cancelled) {
          return
        }

        const profileDetail =
          settled[0].status === 'fulfilled'
            ? settled[0].value as ProfileDetailLike
            : null

        const businessInfo =
          settled[1].status === 'fulfilled'
            ? settled[1].value
            : null

        const menuRes =
          settled[2].status === 'fulfilled'
            ? settled[2].value
            : []

        if (!profileDetail) {
          throw new Error('프로필 상세 정보를 불러오지 못했습니다.')
        }

        const profileId =
          Number(profileDetail?.profile?.id || 0)

        const [
          generalItems,
          productItems,
          eventItems,
          galleryItems
        ] =
          profileId > 0
            ? await Promise.all([
                fetch(
                  `${RAW_API_BASE}/api/business/posts?profileId=${profileId}&channelCode=${channelCode}&postType=GENERAL&status=ACTIVE`
                )
                  .then(response => response.json())
                  .then(data => {
                    return mapBusinessPostsToViewItems(
                      Array.isArray(data?.posts)
                        ? data.posts
                        : []
                    )
                  }),
                fetch(
                  `${RAW_API_BASE}/api/business/posts?profileId=${profileId}&channelCode=${channelCode}&postType=PRODUCT&status=ACTIVE`
                )
                  .then(response => response.json())
                  .then(data => {
                    return mapBusinessPostsToViewItems(
                      Array.isArray(data?.posts)
                        ? data.posts
                        : []
                    )
                  }),
                fetch(
                  `${RAW_API_BASE}/api/business/posts?profileId=${profileId}&channelCode=${channelCode}&postType=EVENT&status=ACTIVE`
                )
                  .then(response => response.json())
                  .then(data => {
                    return mapBusinessPostsToViewItems(
                      Array.isArray(data?.posts)
                        ? data.posts
                        : []
                    )
                  }),
                fetch(
                  `${RAW_API_BASE}/api/business/gallery/${encodeURIComponent(channelCode)}`
                )
                  .then(response => response.json())
                  .then(data => {
                    return mapGalleryResponseToViewItems(
                      Array.isArray(data?.items)
                        ? data.items
                        : []
                    )
                  })
              ])
            : [
                [],
                [],
                [],
                []
              ]

        const activeMenus =
          Array.isArray(menuRes)
            ? menuRes
                .filter(item => {
                  return item.isActive
                })
                .sort((a, b) => {
                  return a.sortOrder - b.sortOrder
                })
            : []

        setDetail(profileDetail)
        setInfoView(businessInfo)
        setMenus(activeMenus)
        setGeneralPostItems(generalItems)
        setProductPostItems(productItems)
        setEventPostItems(eventItems)
        setGalleryDbItems(galleryItems)
        setActiveTab(
          shouldAutoOpenOrder
            ? 'order'
            : 'info'
        )
      } catch (err) {
        console.error('PUBLIC CHANNEL LOAD FAILED ->', err)

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : '채널 데이터 로딩 실패'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [
    channelCode,
    shouldAutoOpenOrder
  ])

  // SECTION 10 : MEMO DATA

  const businessName = useMemo(() => {
    return String(detail?.profile?.displayName || '').trim() || '비즈니스 정보 없음'
  }, [
    detail
  ])

  const businessMeta = useMemo(() => {
    return formatIndustryLabel(detail)
  }, [
    detail
  ])

  const businessTypeLabel = useMemo(() => {
    return resolveBusinessTypeLabel(detail)
  }, [
    detail
  ])

  const heroImageUrl = useMemo(() => {
    return normalizeImageUrl(
      detail?.media?.heroImages?.[0]?.imageUrl ||
      detail?.media?.heroImages?.[0]?.filePath ||
      null
    )
  }, [
    detail
  ])

  const heroViewerImages = useMemo(() => {
    const heroImages =
      Array.isArray(detail?.media?.heroImages)
        ? detail.media.heroImages
        : []

    const sorted =
      heroImages
        .slice()
        .sort((a, b) => {
          return Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
        })

    const mapped =
      sorted
        .map(item => {
          return normalizeImageUrl(item.imageUrl || item.filePath || null)
        })
        .filter((url): url is string => {
          return Boolean(url)
        })
        .map(url => {
          return {
            imageUrl: url,
            alt: `${businessName} 대표 이미지`
          }
        })

    if (mapped.length > 0) {
      return mapped
    }

    if (heroImageUrl) {
      return [
        {
          imageUrl: heroImageUrl,
          alt: `${businessName} 대표 이미지`
        }
      ]
    }

    return []
  }, [
    detail?.media?.heroImages,
    heroImageUrl,
    businessName
  ])

  const avatarImageUrl = useMemo(() => {
    return normalizeImageUrl(
      detail?.media?.avatar?.imageUrl ||
      detail?.media?.avatar?.filePath ||
      null
    )
  }, [
    detail
  ])

  const heroImageCount =
    heroViewerImages.length

  const safeHeroIndex =
    Math.min(
      Math.max(heroViewerIndex, 0),
      Math.max(heroImageCount - 1, 0)
    )

  const currentHeroImageUrl =
    heroImageCount > 0
      ? heroViewerImages[safeHeroIndex]?.imageUrl || null
      : heroImageUrl

  const avatarViewerImages = useMemo(() => {
    if (!avatarImageUrl) {
      return []
    }

    return [
      {
        imageUrl: avatarImageUrl,
        alt: `${businessName} 프로필 이미지`
      }
    ]
  }, [
    avatarImageUrl,
    businessName
  ])

  const activeViewerImages =
    viewerMode === 'avatar'
      ? avatarViewerImages
      : heroViewerImages

  const tabs = useMemo<TabItem[]>(() => {
    const dynamicTabs =
      menus.length > 0
        ? menus
            .filter(menu => {
              return ![
                'INFO',
                'SUMMARY',
                'ORDER',
                'RESERVATION',
                'REVIEW'
              ].includes(normalizePostType(menu.postType))
            })
            .map(menu => {
              const menuWithName =
                menu as MenuItemWithName

              return {
                id: String(menu.id),
                label: menu.title || menuWithName.name || '메뉴',
                postType: menu.postType
              }
            })
        : FALLBACK_DYNAMIC_TABS

    const baseTabs =
      insertOrderAndReservationTabs([
        ...FIXED_TABS,
        ...dynamicTabs
      ])

    return [
      ...baseTabs,
      {
        id: 'review',
        label: '리뷰',
        postType: 'REVIEW'
      }
    ]
  }, [
    menus
  ])

  useEffect(() => {
    if (!shouldAutoOpenOrder || autoOrderTabHandledRef.current) {
      return
    }

    const hasOrderTab = tabs.some((tab) => {
      return normalizePostType(tab.postType || tab.id) === 'ORDER'
    })

    if (!hasOrderTab) {
      return
    }

    autoOrderTabHandledRef.current = true
    setActiveTab('order')
  }, [shouldAutoOpenOrder, tabs])

  const activeMenu = useMemo(() => {
    return tabs.find(tab => {
      return tab.id === activeTab
    }) || tabs[0] || null
  }, [
    tabs,
    activeTab
  ])

  const activePostType = useMemo(() => {
    return normalizePostType(activeMenu?.postType || activeMenu?.id)
  }, [
    activeMenu
  ])

  const galleryItems = useMemo(() => {
    return galleryDbItems
  }, [
    galleryDbItems
  ])

  const channelInfoSections = useMemo(() => {
    if (infoView) {
      return mapInfoSections(infoView.sections)
    }

    return mapDetailInfoBlocks(detail?.infoBlocks)
  }, [
    infoView,
    detail?.infoBlocks
  ])

  const channelRegionName = useMemo(() => {
    return (
      detail?.placeMeta?.activityRegion?.fullName ||
      detail?.placeMeta?.activityRegion?.name ||
      detail?.placeMeta?.feedRegion?.fullName ||
      detail?.placeMeta?.feedRegion?.name ||
      null
    )
  }, [
    detail?.placeMeta
  ])

  const heroClosedOverlayText = useMemo(() => {
    const summary =
      String(infoView?.hours?.summary || '').trim()

    if (!summary) {
      return null
    }

    if (summary.includes('휴무')) {
      return summary.includes('영업종료')
        ? summary
        : `영업종료 · ${summary}`
    }

    if (summary.includes('영업종료')) {
      return summary
    }

    return null
  }, [
    infoView?.hours?.summary
  ])

  // SECTION 11 : EVENT FUNCTION

  const handleHeroPrev = useCallback(() => {
    setHeroViewerIndex(prev => {
      if (heroImageCount <= 1) {
        return 0
      }

      return prev <= 0
        ? heroImageCount - 1
        : prev - 1
    })
  }, [
    heroImageCount
  ])

  const handleHeroNext = useCallback(() => {
    setHeroViewerIndex(prev => {
      if (heroImageCount <= 1) {
        return 0
      }

      return prev >= heroImageCount - 1
        ? 0
        : prev + 1
    })
  }, [
    heroImageCount
  ])

  // SECTION 12 : SCROLL EFFECT

  useEffect(() => {
    updateMenuScrollState()
  }, [
    tabs.length,
    activeTab,
    updateMenuScrollState
  ])

  useEffect(() => {
    const element =
      menuBarRef.current

    if (!element) {
      return
    }

    const handleScroll = () => {
      updateMenuScrollState()
    }

    const handleResize = () => {
      updateMenuScrollState()
    }

    element.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true
      }
    )

    window.addEventListener(
      'resize',
      handleResize
    )

    const timer =
      window.setTimeout(
        updateMenuScrollState,
        0
      )

    return () => {
      element.removeEventListener(
        'scroll',
        handleScroll
      )

      window.removeEventListener(
        'resize',
        handleResize
      )

      window.clearTimeout(timer)
    }
  }, [
    tabs.length,
    activeTab,
    updateMenuScrollState
  ])

  // SECTION 13 : UI BLOCK

  const loadingUI = (
    <div className={styles.loadingBox}>
      로딩중...
    </div>
  )

  const errorUI = (
    <div className={styles.loadingBox}>
      오류 발생: {error}
    </div>
  )

  const activeContentUI = (
    <section className={styles.contentPanel}>
      {activePostType === 'INFO' && (
        <ChannelInfo
          bio={null}
          contactPhone={infoView?.contactPhone ?? detail?.placeMeta?.contactPhone ?? null}
          regionName={channelRegionName}
          detailAddress={infoView?.detailAddress ?? detail?.placeMeta?.detailAddress ?? null}
          hours={infoView?.hours ?? null}
          sections={channelInfoSections}
        />
      )}

      {activePostType === 'SUMMARY' && (
        <ChannelSummary
          bio={infoView?.bio ?? detail?.profile?.bio ?? null}
        />
      )}

      {activePostType === 'PRODUCT' && (
        <ChannelProducts
          items={productPostItems}
          loading={false}
          errorMessage={null}
        />
      )}

      {activePostType === 'ORDER' && (
        <ChannelOrder
          channelCode={channelCode}
          autoOpenOrder={shouldAutoOpenOrder}
        />
      )}

      {activePostType === 'EVENT' && (
        <ChannelEvents
          items={eventPostItems}
          loading={false}
          errorMessage={null}
          detailRouteType="event"
        />
      )}

      {activePostType === 'GENERAL' && (
        <ChannelEvents
          items={generalPostItems}
          loading={false}
          errorMessage={null}
          detailRouteType="post"
        />
      )}

      {activePostType === 'GALLERY' && (
        <ChannelGallery
          items={galleryItems}
          loading={false}
          errorMessage={null}
        />
      )}

      {activePostType === 'RESERVATION' && (
        <ChannelReservations />
      )}

      {activePostType === 'REVIEW' && (
        <ChannelReviews />
      )}

      {![  
        'INFO',
        'SUMMARY',
        'PRODUCT',
        'ORDER',
        'EVENT',
        'GALLERY',
        'RESERVATION',
        'REVIEW',
        'GENERAL'
      ].includes(activePostType) && (
        <div className={styles.emptyContent}>
          <div className={styles.emptyTitle}>
            게시물 없음
          </div>

          <div className={styles.emptyText}>
            해당 메뉴에 공개 게시물이 없습니다.
          </div>
        </div>
      )}
    </section>
  )

  // SECTION 14 : RETURN GUARD

  if (loading) {
    return (
      <>
        <TopMenuZone />
        {loadingUI}
      </>
    )
  }

  if (error) {
    return (
      <>
        <TopMenuZone />
        {errorUI}
      </>
    )
  }

  // SECTION 15 : RETURN

  return (
    <>
      <TopMenuZone />
      <main className={styles.page}>
      <section className={styles.shell}>
        <section className={styles.detailGrid}>
          <section className={styles.mediaColumn}>
            <div className={styles.heroImage}>
              {heroClosedOverlayText && (
                <div className={styles.heroClosedOverlay}>
                  {heroClosedOverlayText}
                </div>
              )}

              {currentHeroImageUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setViewerMode('hero')
                    setHeroViewerIndex(safeHeroIndex)
                    setHeroViewerOpen(true)
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    margin: 0,
                    padding: 0,
                    border: 0,
                    background: 'transparent',
                    cursor: 'zoom-in'
                  }}
                >
                  <img
                    src={currentHeroImageUrl}
                    alt={`${businessName} 대표 이미지`}
                    className={styles.heroImageFile}
                  />
                </button>
              ) : (
                <div className={styles.heroPlaceholder}>
                  대표 이미지 영역
                </div>
              )}

              {heroImageCount > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="이전 히어로 이미지"
                    onClick={event => {
                      event.stopPropagation()
                      handleHeroPrev()
                    }}
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 34,
                      height: 34,
                      border: 'none',
                      borderRadius: 999,
                      background: 'rgba(17, 24, 39, 0.62)',
                      color: '#fff',
                      fontSize: 20,
                      fontWeight: 800,
                      lineHeight: 1,
                      cursor: 'pointer',
                      zIndex: 2
                    }}
                  >
                    {'<'}
                  </button>

                  <button
                    type="button"
                    aria-label="다음 히어로 이미지"
                    onClick={event => {
                      event.stopPropagation()
                      handleHeroNext()
                    }}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 34,
                      height: 34,
                      border: 'none',
                      borderRadius: 999,
                      background: 'rgba(17, 24, 39, 0.62)',
                      color: '#fff',
                      fontSize: 20,
                      fontWeight: 800,
                      lineHeight: 1,
                      cursor: 'pointer',
                      zIndex: 2
                    }}
                  >
                    {'>'}
                  </button>
                </>
              )}

              {heroImageCount > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    right: 12,
                    bottom: 12,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(17, 24, 39, 0.72)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    zIndex: 2
                  }}
                >
                  {safeHeroIndex + 1}/{heroImageCount}
                </div>
              )}
            </div>

          </section>

          <section className={styles.infoColumn}>
            <div className={styles.businessHead}>
              <div className={styles.businessTopLine}>
                <button
                  type="button"
                  className={styles.avatarFrame}
                  onClick={() => {
                    if (!avatarImageUrl) {
                      return
                    }

                    setViewerMode('avatar')
                    setHeroViewerIndex(0)
                    setHeroViewerOpen(true)
                  }}
                  style={{
                    margin: 0,
                    padding: 0,
                    cursor: avatarImageUrl
                      ? 'zoom-in'
                      : 'default'
                  }}
                >
                  {avatarImageUrl ? (
                    <img
                      src={avatarImageUrl}
                      alt={`${businessName} 프로필 이미지`}
                      className={styles.avatarImage}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      프로필
                    </div>
                  )}
                </button>

                <div className={styles.businessTextBlock}>
                  <div className={styles.businessMeta}>
                    <h1 className={styles.businessName}>
                      {businessName}
                    </h1>

                    {businessTypeLabel && (
                      <span className={styles.category}>
                        {businessTypeLabel}
                      </span>
                    )}

                    {businessTypeLabel && businessMeta && (
                      <span className={styles.category}>
                        ·
                      </span>
                    )}

                    <span className={styles.category}>
                      {businessMeta}
                    </span>
                  </div>

                  <div className={styles.ratingLine}>
                    <span className={styles.rating}>
                      평점 -
                    </span>

                    <span className={styles.review}>
                      방문자 리뷰 -
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.actionGroup}>
              <button
                type="button"
                className={`${styles.actionButton} ${styles.favoriteActionButton}`}
                aria-label={isFavoriteRegistered ? '즐겨찾기 해제' : '즐겨찾기 등록'}
                aria-pressed={isFavoriteRegistered}
                onClick={handleFavoriteToggle}
                disabled={isFavoriteLoading}
              >
                <span className={styles.favoriteActionIcon} aria-hidden="true">
                  {isFavoriteRegistered ? '♥' : '♡'}
                </span>
              </button>

              <button
                type="button"
                className={styles.actionButton}
              >
                공유
              </button>
            </div>

            <div className={styles.primaryActions}>
              <button
                type="button"
                className={styles.primaryButton}
              >
                전화
              </button>

              <button
                type="button"
                className={styles.primaryButton}
              >
                길찾기
              </button>

              <button
                type="button"
                className={styles.primaryButton}
              >
                지도보기
              </button>
            </div>

            <div className={styles.menuBarOuter}>
              {canScrollLeft && (
                <button
                  type="button"
                  aria-label="이전 메뉴"
                  className={`${styles.menuScrollButton} ${styles.menuScrollButtonLeft}`}
                  onClick={handleMenuScrollLeft}
                >
                  {'<'}
                </button>
              )}

              <div
                ref={menuBarRef}
                className={styles.menuBar}
              >
                {tabs.map(tab => {
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={
                        tab.id === activeTab
                          ? `${styles.menuButton} ${styles.activeMenuButton}`
                          : styles.menuButton
                      }
                      onClick={() => {
                        setActiveTab(tab.id)
                      }}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {canScrollRight && (
                <button
                  type="button"
                  aria-label="다음 메뉴"
                  className={`${styles.menuScrollButton} ${styles.menuScrollButtonRight}`}
                  onClick={handleMenuScrollRight}
                >
                  {'>'}
                </button>
              )}
            </div>

            {activeContentUI}
          </section>
        </section>
      </section>

      <ImageViewer
        open={heroViewerOpen}
        images={activeViewerImages}
        index={heroViewerIndex}
        onClose={() => {
          setHeroViewerOpen(false)
        }}
        onPrev={() => {
          setHeroViewerIndex(prev => {
            return Math.max(0, prev - 1)
          })
        }}
        onNext={() => {
          setHeroViewerIndex(prev => {
            return Math.min(activeViewerImages.length - 1, prev + 1)
          })
        }}
      />
      </main>
    </>
  )
}
