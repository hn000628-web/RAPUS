// FILE : frontend/app/feed/place/page.tsx
// ROOT : frontend/app/feed/place/page.tsx
// STATUS : MODIFY MODE
// ROLE : PLACE FEED PAGE
// CHANGE SUMMARY :
// - ?곷떒 ??댄?????긽 "?뚮젅?댁뒪"濡?怨좎젙
// - 吏??챸? ?ъ씠?쒕컮 ?꾩튂 ?곸뿭?먯꽌留??쒖떆
// - buildRegionName() 援ъ“ ?좎?
// - 湲곗〈 API / RegionContext / FeedRegionOverlay / ?쇱슦??援ъ“ ?좎?
// - DB 吏곸젒 ?묎렐 ?놁쓬

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
  getPlaceFeed
} from '@/lib/place-feed-api'

import type {
  PlaceFeedItem
} from '@/lib/place-feed-api'

import {
  useRegion
} from '@/components/Region/RegionContext'

import FeedRegionOverlay from '@/components/Region/FeedRegionOverlay'

import PlaceFeedLayout from './PlaceFeedLayout'

import PlaceFeedSidebar from './PlaceFeedSidebar'

import type {
  PlaceIndustryFilter,
  BusinessStatusFilter,
  PlaceSortType
} from './PlaceFeedSidebar'

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

  const [regionOverlayOpen, setRegionOverlayOpen] =
    useState(false)

  const [contentWidth, setContentWidth] =
    useState(0)

  const [viewportWidth, setViewportWidth] =
    useState(0)

  const contentWrapRef =
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
            businessStatus: selectedBusinessStatus
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
      selectedBusinessStatus
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

  function formatPriceAmount(value: number) {
    return `${value.toLocaleString()}원`
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
    place: PlaceFeedItem
  ) {
    router.push(
      `/channel/${place.channelCode}`
    )
  }

  function handleResetFilter() {
    setSelectedIndustry('ALL')
    setSelectedSort('LATEST')
    setSelectedBusinessStatus('ALL')
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

  // SECTION 08 : UI BLOCK

  const visiblePlaces =
    getVisiblePlaces()

  const isMobile640OrLess =
    viewportWidth > 0 && viewportWidth <= 640

  const displayedPlaces =
    visiblePlaces

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
      onSelectBusinessStatus={setSelectedBusinessStatus}
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
      {displayedPlaces.map((place) => (
        <button
          key={place.channelCode}
          type="button"
          style={cardStyle}
          onClick={() => handleOpenPlace(place)}
        >
          <div style={imageWrapStyle}>
            {place.closedOverlayText && (
              <div style={closedOverlayStyle}>
                <div style={closedOverlayTopLineStyle}>
                  영업종료
                </div>
                <div style={closedOverlayBottomLineStyle}>
                  {place.closedOverlayText.includes('·')
                    ? place.closedOverlayText.split('·')[1].trim()
                    : place.closedOverlayText.replace('영업종료', '').trim() || place.closedOverlayText}
                </div>
              </div>
            )}

            {place.matchedProductTitle && (
              <div style={productOverlayStyle}>
                <div style={productOverlayTitleStyle}>
                  {place.matchedProductTitle}
                </div>
                {typeof place.matchedProductPriceAmount === 'number' && (
                  <div style={productOverlayPriceStyle}>
                    {formatPriceAmount(place.matchedProductPriceAmount)}
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

            <div style={distanceStyle}>
              {place.distanceLabel ||
                place.regionName ||
                '거리 정보 없음'}
            </div>

            <div style={metaStyle}>
              {buildMetaText(place)}
            </div>
          </div>
        </button>
      ))}
    </div>
  )

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
  left: 10,
  right: 10,
  bottom: 10,
  zIndex: 3,
  borderRadius: 10,
  background: 'rgba(17, 24, 39, 0.82)',
  border: '1px solid rgba(255, 255, 255, 0.24)',
  padding: '8px 10px',
  boxSizing: 'border-box',
  pointerEvents: 'none'
}

const productOverlayTitleStyle: CSSProperties = {
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}

const productOverlayPriceStyle: CSSProperties = {
  marginTop: 4,
  color: '#fbbf24',
  fontSize: 13,
  fontWeight: 900,
  lineHeight: 1.1
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
- ?⑥씪 ?뚯씪 ?듭퐫??異쒕젰
- ?곷떒 ??댄?? "?뚮젅?댁뒪" 怨좎젙
- 吏??챸? ?ъ씠?쒕컮 ?꾩튂 ?곸뿭?먯꽌留??쒖떆
- 湲곗〈 page.tsx ?대? SidebarUI ?쒓굅 ?곹깭 ?좎?
- PlaceFeedLayout 而댄룷?뚰듃 ?ъ슜 ?좎?
- PlaceFeedSidebar 而댄룷?뚰듃 ?ъ슜 ?좎?
- 紐⑤컮???꾪꽣??page.tsx?먯꽌 二쇱엯 ?좎?
- getPlaceFeed() 怨듭슜 API ?곌껐 ?좎?
- RegionContext + publicFeedRegion fallback ?좎?
- FeedRegionOverlay ?곌껐 ?좎?
- profileId ?ъ슜 ?놁쓬
- channelCode 怨듦컻 ?대룞 湲곗? ?ъ슜
- ?꾨줎??DB 吏곸젒 ?묎렐 ?놁쓬
- 濡쒓렇??/ 鍮꾨줈洹몄씤 怨듯넻 READ ?쇰뱶 援ъ“ ?좎?
- 移대뱶 grid minmax 180px ?곸슜
- ?대?吏 aspectRatio 4 / 3 ?곸슜
*/


