// FILE : frontend/app/feed/place/page.tsx
// ROOT : frontend/app/feed/place/page.tsx
// STATUS : MODIFY MODE
// ROLE : PLACE FEED PAGE
// CHANGE SUMMARY :
// - 상단 타이틀을 항상 "플레이스"로 고정
// - 지역명은 카드 하단 메타 영역에서만 1회 표시
// - buildRegionName() 구조 유지
// - 기존 API / RegionContext / FeedRegionOverlay / 라우팅 구조 유지
// - DB 직접 접근 없음

'use client'

// SECTION 01 : IMPORT

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import type {
  CSSProperties,
  KeyboardEvent
} from 'react'

import {
  useRouter,
  useSearchParams
} from 'next/navigation'

import {
  getPlaceFeed,
  getPlaceProductPreview,
  getPlaceRepresentativeImages
} from '@/lib/place-feed-api'

import {
  buildProfileStoreRoute
} from '@/lib/profile-summary-api'

import type {
  PlaceFeedItem
} from '@/lib/place-feed-api'

import type {
  PlaceFeedTypeCode
} from '@/lib/profile-summary-api'

import {
  useRegion
} from '@/components/Region/RegionContext'

import FeedRegionOverlay from '@/components/Region/FeedRegionOverlay'

import PlaceFeedLayout from '@/app/feed/place/PlaceFeedLayout'

import PlaceFeedSidebar from '@/app/feed/place/PlaceFeedSidebar'

import type {
  PlaceIndustryFilter,
  BusinessStatusFilter,
  PlaceSortType,
  PlaceSearchScope
} from '@/app/feed/place/PlaceFeedSidebar'

// SECTION 02 : TYPE

type StoredFeedRegion = {
  id: number
  name?: string | null
  fullName?: string | null
}

type PlaceIndustryFilterValue =
  | 'ALL'
  | 'Food'
  | 'Beauty'
  | 'Fitness'
  | 'Medical'
  | 'Education'
  | 'Auto'
  | 'Real Estate'
  | 'Shop'
  | 'IT'
  | 'Media'
  | 'Travel'
  | 'Pet'
  | 'Event'
  | 'Service'
  | 'Etc'

type PlaceModalSlideMode =
  | 'representative'
  | 'product'

type PlaceModalProductPreviewItem = {
  key: string
  title: string | null
  priceAmount: number | null
  imageUrl: string | null
  postId: number | null
  sourceType?: 'PROFILE' | 'HERO' | 'FALLBACK'
}

type PlaceStoreGroup = {
  channelCode: string
  placeFeedTypeCode?: PlaceFeedTypeCode | null
  displayName: string
  regionName: string | null
  industryName: string | null
  industrySubtypeName: string | null
  distanceLabel: string | null
  closedOverlayText: string | null
  storeImageUrl: string | null
  sourcePlace: PlaceFeedItem
  slideMode: PlaceModalSlideMode
  productPreviewItems: PlaceModalProductPreviewItem[]
}

// SECTION 03 : CONSTANT

const PUBLIC_FEED_REGION_STORAGE_KEY =
  'publicFeedRegion'

const PLACE_INDUSTRY_FILTERS: PlaceIndustryFilter[] = [
  {
    label: '전체',
    value: 'ALL'
  },
  {
    label: '음식점',
    value: 'Food'
  },
  {
    label: '뷰티',
    value: 'Beauty'
  },
  {
    label: '피트니스',
    value: 'Fitness'
  },
  {
    label: '의료',
    value: 'Medical'
  },
  {
    label: '교육',
    value: 'Education'
  },
  {
    label: '자동차',
    value: 'Auto'
  },
  {
    label: '부동산',
    value: 'Real Estate'
  },
  {
    label: '쇼핑',
    value: 'Shop'
  },
  {
    label: 'IT',
    value: 'IT'
  },
  {
    label: '미디어',
    value: 'Media'
  },
  {
    label: '여행',
    value: 'Travel'
  },
  {
    label: '반려동물',
    value: 'Pet'
  },
  {
    label: '이벤트',
    value: 'Event'
  },
  {
    label: '서비스',
    value: 'Service'
  },
  {
    label: '기타',
    value: 'Etc'
  }
]

const DEFAULT_LIMIT =
  16
const MAX_PRODUCT_MODAL_ITEMS =
  5
const MAX_REPRESENTATIVE_MODAL_ITEMS =
  6
const MODAL_SLIDE_CARD_SIZE_DESKTOP =
  300
const MODAL_SLIDE_CARD_SIZE_MOBILE =
  'min(300px, 78vw)'

const CARD_WIDTH =
  225

const CARD_COLUMN_GAP =
  18

const FALLBACK_IMAGE_LABEL =
  'PLACE'

// SECTION 04 : COMPONENT

function PlaceFeedPageContent() {
  const router =
    useRouter()
  const searchParams = useSearchParams()

  const {
    region
  } = useRegion()

  const [places, setPlaces] =
    useState<PlaceFeedItem[]>([])

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const [keyword, setKeyword] =
    useState('')

  const [selectedIndustry, setSelectedIndustry] =
    useState<PlaceIndustryFilterValue>('ALL')

  const [selectedSort, setSelectedSort] =
    useState<PlaceSortType>('LATEST')

  const [selectedBusinessStatus, setSelectedBusinessStatus] =
    useState<BusinessStatusFilter>('ALL')
  const [selectedSearchScope, setSelectedSearchScope] =
    useState<PlaceSearchScope>('ALL')

  const [regionOverlayOpen, setRegionOverlayOpen] =
    useState(false)
  const [storeProductModalOpen, setStoreProductModalOpen] =
    useState(false)
  const [selectedStoreGroup, setSelectedStoreGroup] =
    useState<PlaceStoreGroup | null>(null)
  const [storeProductPreviewLoading, setStoreProductPreviewLoading] =
    useState(false)
  const [canSlidePrev, setCanSlidePrev] =
    useState(false)
  const [canSlideNext, setCanSlideNext] =
    useState(false)
  const [isStoreViewHovered, setIsStoreViewHovered] =
    useState(false)
  const [isStoreOrderHovered, setIsStoreOrderHovered] =
    useState(false)
  const [failedPreviewImageKeys, setFailedPreviewImageKeys] =
    useState<Set<string>>(new Set())

  const [contentWidth, setContentWidth] =
    useState(0)

  const [viewportWidth, setViewportWidth] =
    useState(0)

  const contentWrapRef =
    useRef<HTMLDivElement | null>(null)
  const storeProductSliderRef =
    useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const queryKeyword =
      searchParams?.get('q')?.trim() || ''
    setKeyword(queryKeyword)
  }, [searchParams])

  useEffect(() => {
    function syncViewportWidth() {
      setViewportWidth(window.innerWidth)
    }

    syncViewportWidth()

    window.addEventListener(
      'resize',
      syncViewportWidth
    )

    return () => {
      window.removeEventListener(
        'resize',
        syncViewportWidth
      )
    }
  }, [])

  useEffect(() => {
    const target = contentWrapRef.current
    if (!target) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }

      setContentWidth(entry.contentRect.width)
    })

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [])

  const selectedRegion =
    useMemo(
      () => {
        if (region?.id) {
          return {
            id: region.id,
            name: region.name,
            fullName: region.fullName
          }
        }

        return loadStoredFeedRegion()
      },
      [
        region
      ]
    )

  // SECTION 05 : DATA FUNCTION

  function loadStoredFeedRegion(): StoredFeedRegion | null {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const saved =
        localStorage.getItem(PUBLIC_FEED_REGION_STORAGE_KEY)

      if (!saved) {
        return null
      }

      const parsed =
        JSON.parse(saved) as StoredFeedRegion

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !parsed.id
      ) {
        return null
      }

      return parsed
    } catch {
      return null
    }
  }

  const loadPlaceFeed = useCallback(
    async () => {
      try {
        setLoading(true)
        setErrorMessage(null)

        const nextPlaces =
          await getPlaceFeed({
            regionId: selectedRegion?.id ?? null,
            keyword:
              keyword.trim()
                ? keyword.trim()
                : null,
            limit: DEFAULT_LIMIT,
            businessStatus: selectedBusinessStatus,
            searchScope: selectedSearchScope
          })

        setPlaces(nextPlaces)
      } catch (error) {
        console.error(
          'PLACE FEED LOAD FAILED',
          error
        )

        setPlaces([])
        setErrorMessage(
          '플레이스 정보를 불러오지 못했습니다.'
        )
      } finally {
        setLoading(false)
      }
    },
    [
      selectedRegion?.id,
      keyword,
      selectedBusinessStatus,
      selectedSearchScope
    ]
  )

  function getVisiblePlaces() {
    const filteredByIndustry =
      selectedIndustry === 'ALL'
        ? places
        : places.filter((place) => {
            const industryText =
              [
                place.industryName,
                place.industrySubtypeName
              ]
                .filter(Boolean)
                .join(' ')

            return industryText.includes(selectedIndustry)
          })

    const filteredByBusinessStatus =
      selectedBusinessStatus === 'ALL'
        ? filteredByIndustry
        : filteredByIndustry.filter((place) => {
            const closed =
              typeof place.closedOverlayText === 'string' &&
              place.closedOverlayText.includes('영업종료')

            return (
              selectedBusinessStatus === 'OPEN'
                ? !closed
                : closed
            )
          })

    const filteredPlaces =
      selectedSort === 'DISTANCE'
        ? [...filteredByBusinessStatus].sort((a, b) => {
            if (
              a.distanceKm !== null &&
              b.distanceKm !== null
            ) {
              return a.distanceKm - b.distanceKm
            }

            if (
              a.distanceKm !== null &&
              b.distanceKm === null
            ) {
              return -1
            }

            if (
              a.distanceKm === null &&
              b.distanceKm !== null
            ) {
              return 1
            }

            return 0
          })
        : filteredByBusinessStatus

    return filteredPlaces
  }

  function buildMetaText(
    place: PlaceFeedItem
  ) {
    const values =
      [
        place.industrySubtypeName,
        place.industryName,
        place.regionName
      ].filter(Boolean)

    if (values.length === 0) {
      return '플레이스'
    }

    return values.join(' · ')
  }

  function buildCardCategoryText(
    place: PlaceFeedItem
  ) {
    const values =
      [
        place.industrySubtypeName,
        place.industryName
      ].filter(Boolean)

    if (values.length === 0) {
      return '플레이스'
    }

    return values.join(' · ')
  }

  function buildCardLocationText(
    place: PlaceFeedItem
  ) {
    const regionName =
      String(place.regionName || '').trim()
    const distanceLabel =
      String(place.distanceLabel || '').trim()

    if (regionName && distanceLabel) {
      return `${regionName} · ${distanceLabel}`
    }

    if (regionName) {
      return regionName
    }

    if (distanceLabel) {
      return distanceLabel
    }

    return '지역 정보 없음'
  }

  function formatPriceAmount(value: number) {
    return `${value.toLocaleString()}원`
  }

  function buildClosedOverlayMessage(value: string | null): string {
    const raw = String(value || '').trim()
    if (!raw) {
      return '현재 영업이 종료되었습니다'
    }

    const normalized = raw.includes('·')
      ? raw.split('·').slice(1).join('·').trim()
      : raw.replace('영업종료', '').trim()

    const candidate = normalized || raw
    const hasMojibake =
      candidate.includes('�') ||
      candidate.includes('???') ||
      /[ÃÂ�]/.test(candidate)

    if (hasMojibake) {
      return '현재 영업이 종료되었습니다'
    }

    return candidate
  }

  function isProductLikeItem(place: PlaceFeedItem): boolean {
    return (
      Boolean(place.matchedProductTitle) ||
      typeof place.matchedProductPriceAmount === 'number' ||
      typeof place.matchedProductPostId === 'number'
    )
  }

  function buildProductPreviewKey(place: PlaceFeedItem): string {
    if (typeof place.matchedProductPostId === 'number') {
      return `post:${place.matchedProductPostId}`
    }

    const title = String(place.matchedProductTitle || '').trim().toLowerCase()
    const price = typeof place.matchedProductPriceAmount === 'number'
      ? String(place.matchedProductPriceAmount)
      : 'noprice'

    return `fallback:${place.channelCode}:${title}:${price}`
  }

  function buildStoreGroupForModal(
    anchor: PlaceFeedItem,
    placeItems: PlaceFeedItem[]
  ): PlaceStoreGroup {
    const sameStoreItems = placeItems.filter((item) => item.channelCode === anchor.channelCode)
    const productLikeItems = sameStoreItems.filter(isProductLikeItem)

    const anchorKey = buildProductPreviewKey(anchor)
    const dedupe = new Set<string>()
    const merged: PlaceModalProductPreviewItem[] = []

    if (isProductLikeItem(anchor)) {
      merged.push({
        key: anchorKey,
        title: String(anchor.matchedProductTitle || '').trim() || '상품',
        priceAmount: typeof anchor.matchedProductPriceAmount === 'number'
          ? anchor.matchedProductPriceAmount
          : null,
        imageUrl: anchor.imageUrl,
        postId: typeof anchor.matchedProductPostId === 'number'
          ? anchor.matchedProductPostId
          : null
      })
      dedupe.add(anchorKey)
    }

    const supplementItems = productLikeItems
      .filter((item) => buildProductPreviewKey(item) !== anchorKey)
      .sort((a, b) => {
        const aHasPrice = typeof a.matchedProductPriceAmount === 'number'
        const bHasPrice = typeof b.matchedProductPriceAmount === 'number'
        if (aHasPrice !== bHasPrice) {
          return aHasPrice ? -1 : 1
        }

        const aTitle = String(a.matchedProductTitle || '').trim()
        const bTitle = String(b.matchedProductTitle || '').trim()
        return aTitle.localeCompare(bTitle, 'ko')
      })

    for (const item of supplementItems) {
      const key = buildProductPreviewKey(item)
      if (dedupe.has(key)) {
        continue
      }
      dedupe.add(key)
      if (merged.length >= MAX_PRODUCT_MODAL_ITEMS) {
        break
      }

      merged.push({
        key,
        title: String(item.matchedProductTitle || '').trim() || '상품',
        priceAmount: typeof item.matchedProductPriceAmount === 'number'
          ? item.matchedProductPriceAmount
          : null,
        imageUrl: item.imageUrl,
        postId: typeof item.matchedProductPostId === 'number'
          ? item.matchedProductPostId
          : null
      })
    }

    return {
      channelCode: anchor.channelCode,
      placeFeedTypeCode: anchor.placeFeedTypeCode ?? null,
      displayName: anchor.displayName,
      regionName: anchor.regionName,
      industryName: anchor.industryName,
      industrySubtypeName: anchor.industrySubtypeName,
      distanceLabel: anchor.distanceLabel,
      closedOverlayText: anchor.closedOverlayText,
      storeImageUrl: anchor.imageUrl,
      sourcePlace: anchor,
      slideMode: 'product',
      productPreviewItems: merged.slice(0, MAX_PRODUCT_MODAL_ITEMS)
    }
  }

function buildRepresentativePreviewItems(
    anchor: PlaceFeedItem,
    placeItems: PlaceFeedItem[]
  ): PlaceModalProductPreviewItem[] {
    const sameStoreItems =
      placeItems.filter((item) => item.channelCode === anchor.channelCode)

    const imageCandidates = [
      anchor.imageUrl,
      ...sameStoreItems.map((item) => item.imageUrl)
    ]

    const dedupe = new Set<string>()
    const items: PlaceModalProductPreviewItem[] = []

    for (const imageUrl of imageCandidates) {
      const normalizedImageUrl = String(imageUrl || '').trim()
      if (!normalizedImageUrl) {
        continue
      }

      if (dedupe.has(normalizedImageUrl)) {
        continue
      }

      dedupe.add(normalizedImageUrl)
      items.push({
        key: `rep:${anchor.channelCode}:${normalizedImageUrl}`,
        title: null,
        priceAmount: null,
        imageUrl: normalizedImageUrl,
        postId: null,
        sourceType: 'FALLBACK'
      })

      if (items.length >= 1) {
        break
      }
    }

    return items.slice(0, 1)
  }

  function mergeRepresentativePreviewItems(params: {
    channelCode: string
    currentItems: PlaceModalProductPreviewItem[]
    apiItems: Array<{
      imageUrl: string
      sourceType: 'PROFILE' | 'HERO' | 'FALLBACK'
    }>
  }): PlaceModalProductPreviewItem[] {
    const dedupe = new Set<string>()
    const merged: PlaceModalProductPreviewItem[] = []
    const fallbackItems = params.currentItems.filter((item) => item.sourceType === 'FALLBACK')

    // NO SEARCH 정책: 프로필 1 + 대표(hero) 최대 5를 우선 표시
    for (const item of params.apiItems) {
      const imageUrl = String(item.imageUrl || '').trim()
      if (!imageUrl) {
        continue
      }
      if (dedupe.has(imageUrl)) {
        continue
      }
      dedupe.add(imageUrl)
      merged.push({
        key: `rep:${params.channelCode}:${imageUrl}`,
        title: null,
        priceAmount: null,
        imageUrl,
        postId: null,
        sourceType: item.sourceType
      })

      if (merged.length >= MAX_REPRESENTATIVE_MODAL_ITEMS) {
        return merged.slice(0, MAX_REPRESENTATIVE_MODAL_ITEMS)
      }
    }

    for (const item of fallbackItems) {
      const imageUrl = String(item.imageUrl || '').trim()
      if (!imageUrl) {
        continue
      }
      if (dedupe.has(imageUrl)) {
        continue
      }
      dedupe.add(imageUrl)
      merged.push({
        ...item,
        sourceType: 'FALLBACK'
      })
      if (merged.length >= MAX_REPRESENTATIVE_MODAL_ITEMS) {
        return merged.slice(0, MAX_REPRESENTATIVE_MODAL_ITEMS)
      }
    }

    return merged.slice(0, MAX_REPRESENTATIVE_MODAL_ITEMS)
  }

  function buildProductPreviewKeyFromPreviewItem(
    item: PlaceModalProductPreviewItem,
    channelCode: string
  ): string {
    if (typeof item.postId === 'number') {
      return `post:${item.postId}`
    }

    const title = String(item.title || '').trim().toLowerCase()
    const price = typeof item.priceAmount === 'number'
      ? String(item.priceAmount)
      : 'noprice'

    return `fallback:${channelCode}:${title}:${price}`
  }

  function mergePreviewItemsWithAnchorPriority(params: {
    channelCode: string
    currentItems: PlaceModalProductPreviewItem[]
    apiItems: Array<{
      productName: string
      priceAmount: number | null
      thumbnailUrl: string | null
      matchedProductPostId: number | null
      productCode: string
      productId: number
    }>
    hasAnchorAtFirst: boolean
  }): PlaceModalProductPreviewItem[] {
    const dedupe = new Set<string>()
    const merged: PlaceModalProductPreviewItem[] = []

    if (params.hasAnchorAtFirst && params.currentItems[0]) {
      const anchor = params.currentItems[0]
      const anchorKey = buildProductPreviewKeyFromPreviewItem(anchor, params.channelCode)
      dedupe.add(anchorKey)
      merged.push(anchor)
    }

    const startIndex = params.hasAnchorAtFirst ? 1 : 0
    for (let index = startIndex; index < params.currentItems.length; index += 1) {
      const item = params.currentItems[index]
      const key = buildProductPreviewKeyFromPreviewItem(item, params.channelCode)
      if (dedupe.has(key)) {
        continue
      }
      dedupe.add(key)
      merged.push(item)
      if (merged.length >= MAX_PRODUCT_MODAL_ITEMS) {
        return merged.slice(0, MAX_PRODUCT_MODAL_ITEMS)
      }
    }

    for (const item of params.apiItems) {
      const key =
        typeof item.matchedProductPostId === 'number'
          ? `post:${item.matchedProductPostId}`
          : `api:${params.channelCode}:${item.productId}:${item.productCode}`

      if (dedupe.has(key)) {
        continue
      }

      dedupe.add(key)
      merged.push({
        key,
        title: String(item.productName || '').trim() || '상품',
        priceAmount: typeof item.priceAmount === 'number' ? item.priceAmount : null,
        imageUrl: item.thumbnailUrl,
        postId: typeof item.matchedProductPostId === 'number' ? item.matchedProductPostId : null
      })

      if (merged.length >= MAX_PRODUCT_MODAL_ITEMS) {
        break
      }
    }

    return merged.slice(0, MAX_PRODUCT_MODAL_ITEMS)
  }

  // SECTION 06 : EVENT FUNCTION

  function handleSearchSubmit() {
    void loadPlaceFeed()
  }

  function handleSearchInputKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSearchSubmit()
    }
  }

  function handleRetry() {
    void loadPlaceFeed()
  }

  function handleOpenPlace(
    channelCode: string,
    placeFeedTypeCode?: PlaceFeedTypeCode | null,
    openOrder = false
  ) {
    const safeChannelCode = String(channelCode || '').trim()
    if (!safeChannelCode) {
      return
    }

    const routePath =
      buildProfileStoreRoute(
        safeChannelCode,
        placeFeedTypeCode
      )

    router.push(
      openOrder
        ? `${routePath}?openOrder=true`
        : routePath
    )
  }

  function handleOpenChannelGuide(
    channelCode: string
  ) {
    const safeChannelCode = String(channelCode || '').trim()
    if (!safeChannelCode) {
      return
    }

    router.push(`/channel/${safeChannelCode}`)
  }

  async function handleOpenStoreProductModal(place: PlaceFeedItem) {
    setFailedPreviewImageKeys(new Set())

    const hasSearchKeyword =
      keyword.trim().length > 0

    const baseGroup = hasSearchKeyword
        ? buildStoreGroupForModal(place, displayedPlaces)
        : {
          channelCode: place.channelCode,
          placeFeedTypeCode: place.placeFeedTypeCode ?? null,
          displayName: place.displayName,
          regionName: place.regionName,
          industryName: place.industryName,
          industrySubtypeName: place.industrySubtypeName,
          distanceLabel: place.distanceLabel,
          closedOverlayText: place.closedOverlayText,
          storeImageUrl: place.imageUrl,
          sourcePlace: place,
          slideMode: 'representative' as const,
          productPreviewItems: buildRepresentativePreviewItems(place, displayedPlaces)
        }

    setSelectedStoreGroup(baseGroup)
    setStoreProductModalOpen(true)
    setStoreProductPreviewLoading(
      hasSearchKeyword
        ? baseGroup.productPreviewItems.length < MAX_PRODUCT_MODAL_ITEMS
        : true
    )

    if (!hasSearchKeyword) {
      try {
        const representativeItems = await getPlaceRepresentativeImages(
          baseGroup.channelCode,
          MAX_REPRESENTATIVE_MODAL_ITEMS
        )

        setSelectedStoreGroup((previousGroup) => {
          if (
            !previousGroup ||
            previousGroup.channelCode !== baseGroup.channelCode ||
            previousGroup.slideMode !== 'representative'
          ) {
            return previousGroup
          }

          return {
            ...previousGroup,
            productPreviewItems: mergeRepresentativePreviewItems({
              channelCode: baseGroup.channelCode,
              currentItems: previousGroup.productPreviewItems,
              apiItems: representativeItems
            })
          }
        })
      } catch (error) {
        console.error(
          'PLACE REPRESENTATIVE IMAGES LOAD FAILED',
          error
        )
      } finally {
        setStoreProductPreviewLoading(false)
      }
      return
    }

    if (
      baseGroup.productPreviewItems.length >= MAX_PRODUCT_MODAL_ITEMS
    ) {
      setStoreProductPreviewLoading(false)
      return
    }

    try {
      const previewItems = await getPlaceProductPreview(
        baseGroup.channelCode,
        MAX_PRODUCT_MODAL_ITEMS
      )

      setSelectedStoreGroup((previousGroup) => {
        if (
          !previousGroup ||
          previousGroup.channelCode !== baseGroup.channelCode
        ) {
          return previousGroup
        }

        const mergedItems = mergePreviewItemsWithAnchorPriority({
          channelCode: baseGroup.channelCode,
          currentItems: previousGroup.productPreviewItems,
          apiItems: previewItems,
          hasAnchorAtFirst: isProductLikeItem(place)
        })

        return {
          ...previousGroup,
          productPreviewItems: mergedItems
        }
      })
    } catch (error) {
      console.error(
        'PLACE PRODUCT PREVIEW LOAD FAILED',
        error
      )
    } finally {
      setStoreProductPreviewLoading(false)
    }
  }

  function handleCloseStoreProductModal() {
    setStoreProductModalOpen(false)
    setSelectedStoreGroup(null)
    setStoreProductPreviewLoading(false)
    setCanSlidePrev(false)
    setCanSlideNext(false)
    setFailedPreviewImageKeys(new Set())
  }

  function markPreviewImageFailed(key: string) {
    setFailedPreviewImageKeys((previous) => {
      if (previous.has(key)) {
        return previous
      }

      const next = new Set(previous)
      next.add(key)
      return next
    })
  }

  function updateStoreProductSliderButtons() {
    const slider =
      storeProductSliderRef.current

    if (!slider) {
      setCanSlidePrev(false)
      setCanSlideNext(false)
      return
    }

    const hasPrev =
      slider.scrollLeft > 0
    const hasNext =
      slider.scrollLeft + slider.clientWidth < slider.scrollWidth - 1

    setCanSlidePrev(hasPrev)
    setCanSlideNext(hasNext)
  }

  function handleSlideProducts(direction: 'prev' | 'next') {
    const slider =
      storeProductSliderRef.current

    if (!slider) {
      return
    }

    const firstCard =
      slider.firstElementChild as HTMLElement | null
    const step =
      firstCard
        ? firstCard.offsetWidth + 12
        : 312

    slider.scrollBy({
      left: direction === 'next' ? step : -step,
      behavior: 'smooth'
    })
  }

  function handleResetFilter() {
    setSelectedIndustry('ALL')
    setSelectedSort('LATEST')
    setSelectedBusinessStatus('ALL')
    setSelectedSearchScope('ALL')
  }

  function handleOpenRegionOverlay() {
    setRegionOverlayOpen(true)
  }

  function handleCloseRegionOverlay() {
    setRegionOverlayOpen(false)
  }

  // SECTION 07 : EFFECT

  useEffect(() => {
    void loadPlaceFeed()
  }, [
    loadPlaceFeed
  ])

  useEffect(() => {
    function handleOpenRegionOverlayFromTopbar() {
      setRegionOverlayOpen(true)
    }

    window.addEventListener(
      'open-feed-region-overlay',
      handleOpenRegionOverlayFromTopbar
    )

    return () => {
      window.removeEventListener(
        'open-feed-region-overlay',
        handleOpenRegionOverlayFromTopbar
      )
    }
  }, [])

  useEffect(() => {
    if (!storeProductModalOpen) {
      return
    }

    updateStoreProductSliderButtons()

    const slider =
      storeProductSliderRef.current

    if (!slider) {
      return
    }

    const handleScroll = () => {
      updateStoreProductSliderButtons()
    }

    slider.addEventListener('scroll', handleScroll)

    const timerId = window.setTimeout(() => {
      updateStoreProductSliderButtons()
    }, 80)

    return () => {
      slider.removeEventListener('scroll', handleScroll)
      window.clearTimeout(timerId)
    }
  }, [
    storeProductModalOpen,
    selectedStoreGroup?.productPreviewItems.length
  ])

  // SECTION 08 : UI BLOCK

  const visiblePlaces =
    getVisiblePlaces()

  const isMobile640OrLess =
    viewportWidth > 0 && viewportWidth <= 640

  const displayedPlaces =
    visiblePlaces
  const modalSlideCardSize =
    isMobile640OrLess
      ? MODAL_SLIDE_CARD_SIZE_MOBILE
      : `${MODAL_SLIDE_CARD_SIZE_DESKTOP}px`

  const gridWidthForFourColumns =
    CARD_WIDTH * 4 + CARD_COLUMN_GAP * 3

  const gridWidthForThreeColumns =
    CARD_WIDTH * 3 + CARD_COLUMN_GAP * 2

  const gridWidthForTwoColumns =
    CARD_WIDTH * 2 + CARD_COLUMN_GAP

  const cardColumnCount =
    isMobile640OrLess
      ? 2
      : contentWidth >= gridWidthForFourColumns
      ? 4
      : contentWidth >= gridWidthForThreeColumns
        ? 3
        : contentWidth >= gridWidthForTwoColumns
          ? 2
          : 1

  const HeaderUI = null

  const SearchUI = (
    <div style={searchHeaderRowStyle}>
      {!isMobile640OrLess && (
        <button
          type="button"
          style={regionBadgeStyle}
          onClick={handleOpenRegionOverlay}
          aria-label="피드지역 선택"
        >
          <span style={regionBadgeIconStyle}>⌖</span>
          <span>피드지역</span>
          <span style={regionBadgeChevronStyle}>▾</span>
        </button>
      )}

      <div style={searchWrapStyle}>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={handleSearchInputKeyDown}
          placeholder="플레이스 검색"
          style={searchInputStyle}
        />

        <button
          type="button"
          style={searchButtonStyle}
          onClick={handleSearchSubmit}
          aria-label="플레이스 검색"
        >
          🔍
        </button>
      </div>
    </div>
  )

  const SidebarUI = (
    <PlaceFeedSidebar
      industryFilters={PLACE_INDUSTRY_FILTERS}
      selectedIndustry={selectedIndustry}
      selectedSort={selectedSort}
      onSelectIndustry={(value) => {
        setSelectedIndustry(value as PlaceIndustryFilterValue)
      }}
      onSelectSort={setSelectedSort}
      selectedBusinessStatus={selectedBusinessStatus}
      selectedSearchScope={selectedSearchScope}
      onSelectBusinessStatus={setSelectedBusinessStatus}
      onSelectSearchScope={setSelectedSearchScope}
      onReset={handleResetFilter}
    />
  )

  const MobileFilterUI = (
    <div style={mobileFilterWrapStyle}>
      {PLACE_INDUSTRY_FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          style={{
            ...mobileFilterButtonStyle,
            ...(selectedIndustry === filter.value
              ? selectedMobileFilterButtonStyle
              : null)
          }}
          onClick={() => {
            setSelectedIndustry(
              filter.value as PlaceIndustryFilterValue
            )
          }}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )

  const PlaceCardsUI = (
    <div
      style={{
        ...gridStyle,
        gridTemplateColumns: isMobile640OrLess
          ? 'repeat(2, minmax(0, 1fr))'
          : `repeat(${cardColumnCount}, ${CARD_WIDTH}px)`
      }}
    >
      {displayedPlaces.map((place) => {
        const isProductEventCard =
          Boolean(place.matchedProductTitle) ||
          typeof place.matchedProductPriceAmount === 'number' ||
          typeof place.matchedProductPostId === 'number'

        const showTitlePill =
          isProductEventCard &&
          Boolean(place.matchedProductTitle)

        const showPricePill =
          isProductEventCard &&
          typeof place.matchedProductPriceAmount === 'number'
        const matchedProductPriceAmount =
          typeof place.matchedProductPriceAmount === 'number'
            ? place.matchedProductPriceAmount
            : null

        return (
          <button
            key={`${place.channelCode}-${place.matchedProductPostId ?? place.displayName}`}
            type="button"
            className="place-feed-click-card"
            style={cardStyle}
            onClick={() => {
              handleOpenStoreProductModal(place)
            }}
            aria-label={`${place.displayName} 매장 미리보기 열기`}
            title="자세히 보기"
          >
            <div style={imageWrapStyle}>
              {place.closedOverlayText && (
                <div style={closedOverlayStyle}>
                  <div style={closedOverlayTopLineStyle}>
                    영업종료
                  </div>
                  <div style={closedOverlayBottomLineStyle}>
                    {buildClosedOverlayMessage(place.closedOverlayText)}
                  </div>
                </div>
              )}

              {(showTitlePill || showPricePill) && (
                <div style={productOverlayStyle}>
                  {showTitlePill && (
                    <div style={productOverlayTitleStyle}>
                      {place.matchedProductTitle}
                    </div>
                  )}
                  {showPricePill && (
                    <div style={productOverlayPriceStyle}>
                      {formatPriceAmount(matchedProductPriceAmount as number)}
                    </div>
                  )}
                </div>
              )}

              {place.imageUrl ? (
                <img
                  src={place.imageUrl}
                  alt={place.displayName}
                  style={imageStyle}
                />
              ) : (
                <div style={emptyImageStyle}>
                  {FALLBACK_IMAGE_LABEL}
                </div>
              )}
            </div>

            <div style={cardBodyStyle}>
              <div style={placeNameStyle}>
                {place.displayName}
              </div>

              <div style={metaStyle}>
                {buildCardCategoryText(place)}
              </div>

              <div style={distanceStyle}>
                {buildCardLocationText(place)}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )

  const StoreProductModalUI = storeProductModalOpen && selectedStoreGroup ? (
    <div
      style={{
        ...storeModalOverlayStyle,
        ...(isMobile640OrLess
          ? storeModalOverlayMobileStyle
          : null)
      }}
      onClick={handleCloseStoreProductModal}
    >
      <section
        style={{
          ...storeModalPanelStyle,
          ...(isMobile640OrLess
            ? storeModalPanelMobileStyle
            : null)
        }}
        role="dialog"
        aria-modal="true"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div style={storeModalHeaderStyle}>
          <div>
            <h3 style={storeModalTitleStyle}>{selectedStoreGroup.displayName}</h3>
            <p style={storeModalMetaStyle}>
              {selectedStoreGroup.regionName || '지역 정보 없음'}
            </p>
            <p style={storeModalMetaStyle}>
              {buildMetaText(selectedStoreGroup.sourcePlace)}
            </p>
          </div>
          <button
            type="button"
            style={storeModalCloseButtonStyle}
            onClick={handleCloseStoreProductModal}
          >
            닫기
          </button>
        </div>

        <div
          style={{
            ...storeModalBodyStyle,
            ...(isMobile640OrLess
              ? storeModalBodyMobileStyle
              : null)
          }}
        >
          {selectedStoreGroup.productPreviewItems.length > 0 ? (
            <div style={modalProductSliderWrapStyle}>
              {selectedStoreGroup.productPreviewItems.length > 1 ? (
                <button
                  type="button"
                  style={{
                    ...modalProductSlideButtonStyle,
                    ...modalProductSlideButtonPrevStyle,
                    ...(canSlidePrev
                      ? null
                      : modalProductSlideButtonDisabledStyle)
                  }}
                  onClick={() => {
                    handleSlideProducts('prev')
                  }}
                  aria-label="이전 상품"
                  disabled={!canSlidePrev}
                >
                  ‹
                </button>
              ) : null}

              <div
                ref={storeProductSliderRef}
                className="place-store-product-slider-track"
                style={modalProductSliderStyle}
              >
                {selectedStoreGroup.productPreviewItems.map((productItem) => (
                  <div
                    key={productItem.key}
                    style={{
                      ...modalProductSlideItemStyle,
                      flex: `0 0 ${modalSlideCardSize}`,
                      width: modalSlideCardSize,
                      maxWidth: modalSlideCardSize
                    }}
                  >
                    <div
                      style={{
                        ...modalProductImageWrapStyle,
                        width: modalSlideCardSize,
                        height: modalSlideCardSize,
                        maxHeight: modalSlideCardSize,
                        ...(isMobile640OrLess
                          ? modalProductImageWrapMobileStyle
                          : null)
                      }}
                    >
                      {(() => {
                        const imageKey = productItem.key
                        const imageFailed = failedPreviewImageKeys.has(imageKey)
                        const canRenderImage =
                          Boolean(productItem.imageUrl) &&
                          !imageFailed

                        return (
                          <>
                            {selectedStoreGroup.slideMode === 'product' ? (
                              <div style={productOverlayStyle}>
                                {productItem.title ? (
                                  <div style={productOverlayTitleStyle}>{productItem.title}</div>
                                ) : null}
                                {typeof productItem.priceAmount === 'number' ? (
                                  <div style={productOverlayPriceStyle}>
                                    {formatPriceAmount(productItem.priceAmount)}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                            {canRenderImage ? (
                              <img
                                src={productItem.imageUrl || ''}
                                alt={`${selectedStoreGroup.displayName} 상품 이미지`}
                                style={imageStyle}
                                onError={() => {
                                  markPreviewImageFailed(imageKey)
                                }}
                              />
                            ) : (
                              <div style={emptyImageStyle}>
                                {selectedStoreGroup.slideMode === 'representative'
                                  ? '대표 이미지 없음'
                                  : (productItem.title || '이미지 없음')}
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>
                ))}
              </div>

              {selectedStoreGroup.productPreviewItems.length > 1 ? (
                <button
                  type="button"
                  style={{
                    ...modalProductSlideButtonStyle,
                    ...modalProductSlideButtonNextStyle,
                    ...(canSlideNext
                      ? null
                      : modalProductSlideButtonDisabledStyle)
                  }}
                  onClick={() => {
                    handleSlideProducts('next')
                  }}
                  aria-label="다음 상품"
                  disabled={!canSlideNext}
                >
                  ›
                </button>
              ) : null}
            </div>
          ) : storeProductPreviewLoading ? (
            <div style={stateBoxStyle}>
              <div style={stateTextStyle}>대표 메뉴를 불러오는 중...</div>
            </div>
          ) : (
            <div style={stateBoxStyle}>
              <div style={stateTextStyle}>
                {selectedStoreGroup.slideMode === 'representative'
                  ? '등록된 대표 이미지가 없습니다.'
                  : '노출 가능한 메뉴가 없습니다.'}
              </div>
            </div>
          )}
        </div>

        <div style={storeModalFooterStyle}>
          <button
            type="button"
            style={{
              ...storeViewButtonStyle,
              ...(isStoreViewHovered
                ? storeActionButtonHoverStyle
                : null)
            }}
            onMouseEnter={() => {
              setIsStoreViewHovered(true)
            }}
            onMouseLeave={() => {
              setIsStoreViewHovered(false)
            }}
            onClick={() => {
              handleOpenPlace(
                selectedStoreGroup.channelCode,
                selectedStoreGroup.placeFeedTypeCode,
                false
              )
            }}
          >
            매장보기
          </button>
          <button
            type="button"
            style={{
              ...storeOrderButtonStyle,
              ...(isStoreOrderHovered
                ? storeActionButtonHoverStyle
                : null)
            }}
            onMouseEnter={() => {
              setIsStoreOrderHovered(true)
            }}
            onMouseLeave={() => {
              setIsStoreOrderHovered(false)
            }}
            onClick={() => {
              handleOpenChannelGuide(selectedStoreGroup.channelCode)
            }}
          >
            매장안내
          </button>
        </div>
      </section>
    </div>
  ) : null

  const ContentUI = (
    <div
      ref={contentWrapRef}
      style={contentWrapStyle}
    >
      {loading && (
        <div style={stateBoxStyle}>
          불러오는 중...
        </div>
      )}

      {!loading && errorMessage && (
        <div style={stateBoxStyle}>
          <div style={stateTitleStyle}>
            조회 실패
          </div>

          <div style={stateTextStyle}>
            {errorMessage}
          </div>

          <button
            type="button"
            onClick={handleRetry}
            style={retryButtonStyle}
          >
            다시 불러오기
          </button>
        </div>
      )}

      {!loading &&
        !errorMessage &&
        displayedPlaces.length === 0 && (
          <div style={stateBoxStyle}>
            <div style={stateTitleStyle}>
              등록된 플레이스가 없습니다.
            </div>

            <div style={stateTextStyle}>
              선택한 지역 또는 필터에 맞는 비즈니스가 없습니다.
            </div>
          </div>
        )}

      {!loading &&
        !errorMessage &&
        displayedPlaces.length > 0 &&
        PlaceCardsUI}
    </div>
  )

  // SECTION 09 : RETURN

  return (
    <>
      <PlaceFeedLayout
        header={HeaderUI}
        search={SearchUI}
        sidebar={SidebarUI}
        mobileFilters={MobileFilterUI}
      >
        {ContentUI}
      </PlaceFeedLayout>

      {regionOverlayOpen && (
        <FeedRegionOverlay
          onClose={handleCloseRegionOverlay}
        />
      )}

      {StoreProductModalUI}

      <style jsx global>{`
        .place-store-product-slider-track {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .place-store-product-slider-track::-webkit-scrollbar {
          display: none;
        }

        .place-feed-click-card {
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
          border: 1px solid transparent;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
          cursor: pointer;
        }

        .place-feed-click-card:hover {
          transform: translateY(-2px);
          border-color: rgba(15, 23, 42, 0.16);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
        }

        .place-feed-click-card:active {
          transform: translateY(0);
        }

        .place-feed-click-card:focus-visible {
          outline: 2px solid #111827;
          outline-offset: 3px;
        }
      `}</style>
    </>
  )
}

// SECTION 10 : STYLE

const searchWrapStyle: CSSProperties = {
  width: '100%',
  height: 48,
  border: '1px solid #e5e7eb',
  borderRadius: 999,
  display: 'flex',
  alignItems: 'center',
  padding: '0 8px 0 10px',
  boxSizing: 'border-box',
  background: '#ffffff'
}

export default function PlaceFeedPage() {
  return (
    <Suspense fallback={<div>장소 피드를 불러오는 중입니다.</div>}>
      <PlaceFeedPageContent />
    </Suspense>
  )
}

const searchHeaderRowStyle: CSSProperties = {
  width: '100%',
  maxWidth: 760,
  display: 'flex',
  alignItems: 'center',
  gap: 10
}

const regionBadgeStyle: CSSProperties = {
  height: 40,
  borderRadius: 999,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  color: '#111827',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '0 14px',
  fontSize: 13,
  fontWeight: 900,
  boxSizing: 'border-box',
  cursor: 'pointer',
  flexShrink: 0,
  whiteSpace: 'nowrap'
}

const regionBadgeIconStyle: CSSProperties = {
  color: '#2563eb',
  fontSize: 14,
  lineHeight: 1
}

const regionBadgeChevronStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  lineHeight: 1
}

const searchInputStyle: CSSProperties = {
  flex: 1,
  height: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  padding: '0 12px',
  fontSize: 15,
  color: '#111827',
  boxSizing: 'border-box'
}

const searchButtonStyle: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: 'none',
  background: '#111827',
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 900,
  cursor: 'pointer'
}

const mobileFilterWrapStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  padding: '0 0 2px'
}

const mobileFilterButtonStyle: CSSProperties = {
  flex: '0 0 auto',
  height: 34,
  borderRadius: 999,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  color: '#374151',
  padding: '0 13px',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer'
}

const selectedMobileFilterButtonStyle: CSSProperties = {
  borderColor: '#ff6f0f',
  color: '#ff6f0f',
  background: '#fff7ed'
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(4, ${CARD_WIDTH}px)`,
  gap: '32px 18px',
  width: '100%',
  justifyContent: 'center',
  padding: 0,
  boxSizing: 'border-box'
}

const contentWrapStyle: CSSProperties = {
  width: '100%'
}

const cardStyle: CSSProperties = {
  border: 'none',
  background: '#ffffff',
  padding: 0,
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: 12,
  overflow: 'hidden'
}

const imageWrapStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 11',
  borderRadius: 12,
  background: '#f3f4f6',
  overflow: 'hidden'
}

const closedOverlayStyle: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2,
  minWidth: 240,
  minHeight: 84,
  maxWidth: 'calc(100% - 18px)',
  padding: '14px 20px',
  boxSizing: 'border-box',
  borderRadius: 14,
  background: 'rgba(17, 24, 39, 0.82)',
  border: '1px solid rgba(255, 255, 255, 0.24)',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1.25,
  textAlign: 'center',
  pointerEvents: 'none'
}

const closedOverlayTopLineStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  lineHeight: 1.25
}

const closedOverlayBottomLineStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 17,
  fontWeight: 800,
  lineHeight: 1.25
}

const productOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 3,
  pointerEvents: 'none'
}

const productOverlayTitleStyle: CSSProperties = {
  position: 'absolute',
  top: 12,
  left: 12,
  background: '#ffffff',
  color: '#111827',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1,
  padding: '8px 12px',
  borderRadius: 999,
  boxShadow: '0 4px 10px rgba(15, 23, 42, 0.16)',
  maxWidth: '68%',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  boxSizing: 'border-box'
}

const productOverlayPriceStyle: CSSProperties = {
  position: 'absolute',
  right: 12,
  bottom: 12,
  width: 'fit-content',
  background: '#ffffff',
  color: '#111827',
  fontSize: 13,
  fontWeight: 900,
  lineHeight: 1,
  padding: '8px 12px',
  borderRadius: 999,
  boxShadow: '0 4px 10px rgba(15, 23, 42, 0.16)',
  maxWidth: '72%',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  boxSizing: 'border-box'
}

const imageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
  objectFit: 'cover'
}

const emptyImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9ca3af',
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0.5
}

const cardBodyStyle: CSSProperties = {
  padding: '10px 6px 4px',
  boxSizing: 'border-box'
}

const storeViewButtonStyle: CSSProperties = {
  flex: 1,
  height: 46,
  minHeight: 46,
  padding: '0 18px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#111827',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1,
  cursor: 'pointer'
}

const storeOrderButtonStyle: CSSProperties = {
  flex: 1,
  height: 46,
  minHeight: 46,
  padding: '0 18px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#111827',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  fontWeight: 900,
  lineHeight: 1,
  cursor: 'pointer'
}

const storeActionButtonHoverStyle: CSSProperties = {
  border: '1px solid #111827',
  background: '#111827',
  color: '#ffffff'
}

const storeModalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1200,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '72px 16px 24px',
  background: 'rgba(15, 23, 42, 0.55)',
  boxSizing: 'border-box',
  overflowY: 'auto'
}

const storeModalPanelStyle: CSSProperties = {
  width: 'min(450px, calc(100vw - 32px))',
  minHeight: 520,
  maxHeight: 'calc(100vh - 112px)',
  borderRadius: 24,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  boxShadow: '0 24px 70px rgba(15, 23, 42, 0.28)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
}

const storeModalOverlayMobileStyle: CSSProperties = {
  padding: '56px 12px 16px'
}

const storeModalPanelMobileStyle: CSSProperties = {
  width: 'calc(100vw - 24px)',
  maxHeight: 'calc(100vh - 72px)'
}

const storeModalHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  padding: 18,
  borderBottom: '1px solid #e5e7eb'
}

const storeModalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 900,
  color: '#111827'
}

const storeModalMetaStyle: CSSProperties = {
  margin: '4px 0 0',
  fontSize: 13,
  lineHeight: 1.4,
  color: '#64748b'
}

const storeModalCloseButtonStyle: CSSProperties = {
  height: 36,
  padding: '0 14px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#111827',
  fontSize: 13,
  fontWeight: 800,
  whiteSpace: 'nowrap',
  cursor: 'pointer'
}

const storeModalBodyStyle: CSSProperties = {
  padding: 16,
  overflowY: 'hidden'
}

const storeModalBodyMobileStyle: CSSProperties = {
  overflowY: 'auto'
}

const modalProductSliderStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  gap: 12,
  overflowX: 'auto',
  overflowY: 'hidden',
  scrollBehavior: 'smooth',
  scrollSnapType: 'x mandatory'
}

const modalProductSliderWrapStyle: CSSProperties = {
  position: 'relative',
  width: '100%'
}

const modalProductSlideButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 34,
  height: 34,
  borderRadius: 999,
  border: '1px solid rgba(148, 163, 184, 0.5)',
  background: 'rgba(255, 255, 255, 0.92)',
  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.18)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#0f172a',
  fontSize: 22,
  lineHeight: 1,
  cursor: 'pointer',
  zIndex: 3
}

const modalProductSlideButtonPrevStyle: CSSProperties = {
  left: 8
}

const modalProductSlideButtonNextStyle: CSSProperties = {
  right: 8
}

const modalProductSlideButtonDisabledStyle: CSSProperties = {
  opacity: 0.35,
  pointerEvents: 'none'
}

const modalProductSlideItemStyle: CSSProperties = {
  flex: '0 0 300px',
  width: 300,
  maxWidth: 300,
  scrollSnapAlign: 'start'
}

const modalProductImageWrapStyle: CSSProperties = {
  position: 'relative',
  width: 300,
  height: 300,
  maxHeight: 300,
  aspectRatio: '1 / 1',
  borderRadius: 12,
  background: '#f3f4f6',
  overflow: 'hidden'
}

const modalProductImageWrapMobileStyle: CSSProperties = {
  width: 'min(300px, 78vw)',
  height: 'min(300px, 78vw)',
  maxHeight: 'min(300px, 78vw)'
}

const storeModalFooterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: 16,
  borderTop: '1px solid #e5e7eb'
}

const placeNameStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: '#111827',
  lineHeight: 1.35,
  wordBreak: 'break-word'
}

const distanceStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 14,
  fontWeight: 800,
  color: '#111827',
  lineHeight: 1.35
}

const metaStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 13,
  fontWeight: 500,
  color: '#6b7280',
  lineHeight: 1.35,
  wordBreak: 'break-word'
}

const stateBoxStyle: CSSProperties = {
  minHeight: 240,
  border: '1px dashed #d1d5db',
  borderRadius: 14,
  background: '#fafafa',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  boxSizing: 'border-box',
  textAlign: 'center',
  color: '#6b7280'
}

const stateTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 900,
  color: '#111827',
  marginBottom: 6
}

const stateTextStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#6b7280',
  lineHeight: 1.5
}

const retryButtonStyle: CSSProperties = {
  marginTop: 14,
  height: 38,
  padding: '0 16px',
  borderRadius: 10,
  border: 'none',
  background: '#111827',
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer'
}

// SECTION 11 : VALIDATION

/*
VALIDATION:
- 단일 파일 기준 코드 정합성 유지
- 상단 타이틀 "플레이스" 고정
- 지역명 중복 제거(카드 하단 메타 1회 표시)
- 기존 page.tsx 기반 SidebarUI 구조 유지
- PlaceFeedLayout, PlaceFeedSidebar 구성 유지
- 모바일 필터는 page.tsx에서 주입 유지
- getPlaceFeed() 공용 API 연결 유지
- RegionContext + publicFeedRegion fallback 유지
- FeedRegionOverlay 연결 유지
- profileId 미사용 정책 유지
- channelCode 공개 이동 구조 유지
- 프론트 DB 직접 접근 없음
- 비로그인/공용 READ 필드 구조 유지
- 카드 grid minmax 180px 적용 유지
- 이미지 aspectRatio 4 / 3 적용 유지
*/


