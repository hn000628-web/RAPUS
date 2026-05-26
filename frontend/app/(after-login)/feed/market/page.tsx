'use client'

import {
  Suspense,
  useMemo,
  useState
} from 'react'

import type {
  CSSProperties,
  FormEvent
} from 'react'

import {
  useRouter,
  useSearchParams
} from 'next/navigation'

import Image from 'next/image'

import PlaceFeedLayout from '@/app/feed/place/PlaceFeedLayout'
import PlaceFeedSidebar from '@/app/feed/place/PlaceFeedSidebar'

import type {
  BusinessStatusFilter,
  PlaceIndustryFilter,
  PlaceSearchScope,
  PlaceSortType
} from '@/app/feed/place/PlaceFeedSidebar'

type MarketIndustryFilterValue =
  | 'ALL'
  | 'SHOP_MART'
  | 'LIFE'
  | 'FOOD'
  | 'BEVERAGE'

type MarketMockCard = {
  id: string
  channelCode: string
  name: string
  industryName: string
  regionName: string
  description: string
  imageUrl: string | null
  businessStatus: 'OPEN' | 'CLOSED'
  distanceOrder: number
}

const MARKET_INDUSTRY_FILTERS: PlaceIndustryFilter[] = [
  {
    label: '전체',
    value: 'ALL'
  },
  {
    label: '마트',
    value: 'SHOP_MART'
  },
  {
    label: '생활용품',
    value: 'LIFE'
  },
  {
    label: '식품',
    value: 'FOOD'
  },
  {
    label: '음료',
    value: 'BEVERAGE'
  }
]

const MARKET_MOCK_CARDS: MarketMockCard[] = [
  {
    id: 'market-rapus',
    channelCode: 'B8X7C6V5B4N3M',
    name: '라푸스 마켓',
    industryName: 'Market',
    regionName: '풍암동',
    description: '오프라인 판매점 / 마트 / 생활용품',
    imageUrl: null,
    businessStatus: 'OPEN',
    distanceOrder: 1
  },
  {
    id: 'market-green',
    channelCode: 'B1B2C3D4E5F6G',
    name: '그린 생활마트',
    industryName: '생활용품',
    regionName: '상무지구',
    description: '세제 / 욕실 / 청소용품 전문 스토어',
    imageUrl: null,
    businessStatus: 'OPEN',
    distanceOrder: 2
  },
  {
    id: 'market-food',
    channelCode: 'M1F2O3O4D5S6T',
    name: '동네 식품관',
    industryName: '식품',
    regionName: '치평동',
    description: '가공식품 / 간편식 / 로컬 식재료',
    imageUrl: null,
    businessStatus: 'OPEN',
    distanceOrder: 3
  },
  {
    id: 'market-drink',
    channelCode: 'D1R2I3N4K5H6B',
    name: '오늘의 음료창고',
    industryName: '음료',
    regionName: '금호동',
    description: '탄산 / 커피 / 생수 / 행사 음료',
    imageUrl: null,
    businessStatus: 'CLOSED',
    distanceOrder: 4
  }
]

function MarketFeedPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialKeyword =
    searchParams?.get('q')?.trim() || ''

  const [keyword, setKeyword] =
    useState(initialKeyword)
  const [selectedIndustry, setSelectedIndustry] =
    useState<MarketIndustryFilterValue>('ALL')
  const [selectedSort, setSelectedSort] =
    useState<PlaceSortType>('LATEST')
  const [selectedBusinessStatus, setSelectedBusinessStatus] =
    useState<BusinessStatusFilter>('ALL')
  const [selectedSearchScope, setSelectedSearchScope] =
    useState<PlaceSearchScope>('PRODUCT')

  const displayedMarkets =
    useMemo(() => {
      const keywordText =
        keyword.trim().toLowerCase()

      const filteredByKeyword =
        keywordText
          ? MARKET_MOCK_CARDS.filter((market) => {
              const searchableText = [
                market.name,
                market.industryName,
                market.regionName,
                market.description
              ]
                .join(' ')
                .toLowerCase()

              return searchableText.includes(keywordText)
            })
          : MARKET_MOCK_CARDS

      const filteredByIndustry =
        selectedIndustry === 'ALL'
          ? filteredByKeyword
          : filteredByKeyword.filter((market) => {
              if (selectedIndustry === 'SHOP_MART') {
                return market.industryName === 'Market'
              }

              if (selectedIndustry === 'LIFE') {
                return market.industryName === '생활용품'
              }

              if (selectedIndustry === 'FOOD') {
                return market.industryName === '식품'
              }

              if (selectedIndustry === 'BEVERAGE') {
                return market.industryName === '음료'
              }

              return true
            })

      const filteredByStatus =
        selectedBusinessStatus === 'ALL'
          ? filteredByIndustry
          : filteredByIndustry.filter((market) => {
              return market.businessStatus === selectedBusinessStatus
            })

      if (selectedSort === 'DISTANCE') {
        return [...filteredByStatus].sort((a, b) => {
          return a.distanceOrder - b.distanceOrder
        })
      }

      return filteredByStatus
    }, [
      keyword,
      selectedBusinessStatus,
      selectedIndustry,
      selectedSort
    ])

  function handleSearchSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const params =
      new URLSearchParams()

    const trimmed =
      keyword.trim()

    if (trimmed) {
      params.set('q', trimmed)
    }

    const query =
      params.toString()

    router.push(
      query
        ? `/market?${query}`
        : '/market'
    )
  }

  function handleResetFilters() {
    setSelectedIndustry('ALL')
    setSelectedSort('LATEST')
    setSelectedBusinessStatus('ALL')
    setSelectedSearchScope('PRODUCT')
  }

  function handleOpenMarketHub(channelCode: string) {
    router.push(`/market/${channelCode}`)
  }

  const HeaderUI = (
    <div style={headerStyle}>
      <h1 style={titleStyle}>
        지역 마켓
      </h1>

      <p style={descriptionStyle}>
        내 지역 마트에서 구매 가능한 상품을 확인하세요.
      </p>
    </div>
  )

  const SearchUI = (
    <form
      onSubmit={handleSearchSubmit}
      style={searchHeaderRowStyle}
    >
      <div style={searchWrapStyle}>
        <input
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value)
          }}
          placeholder="마켓 검색"
          style={searchInputStyle}
        />

        <button
          type="submit"
          style={searchButtonStyle}
          aria-label="마켓 검색"
        >
          검색
        </button>
      </div>
    </form>
  )

  const SidebarUI = (
    <PlaceFeedSidebar
      industryFilters={MARKET_INDUSTRY_FILTERS}
      selectedIndustry={selectedIndustry}
      selectedSort={selectedSort}
      selectedBusinessStatus={selectedBusinessStatus}
      selectedSearchScope={selectedSearchScope}
      onSelectIndustry={(value) => {
        setSelectedIndustry(value as MarketIndustryFilterValue)
      }}
      onSelectSort={setSelectedSort}
      onSelectBusinessStatus={setSelectedBusinessStatus}
      onSelectSearchScope={setSelectedSearchScope}
      onReset={handleResetFilters}
      title="마켓"
    />
  )

  const MobileFilterUI = (
    <div style={mobileFiltersWrapStyle}>
      {MARKET_INDUSTRY_FILTERS.map((filter) => {
        const selected =
          selectedIndustry === filter.value

        return (
          <button
            key={filter.value}
            type="button"
            style={{
              ...mobileFilterButtonStyle,
              ...(selected
                ? selectedMobileFilterButtonStyle
                : null)
            }}
            onClick={() => {
              setSelectedIndustry(
                filter.value as MarketIndustryFilterValue
              )
            }}
          >
            {filter.label}
          </button>
        )
      })}
    </div>
  )

  const ContentUI = (
    <div style={contentWrapStyle}>
      {displayedMarkets.length === 0 ? (
        <div style={stateBoxStyle}>
          <div style={stateTitleStyle}>
            마켓 상품을 찾을 수 없습니다.
          </div>

          <div style={stateTextStyle}>
            선택한 필터 또는 검색어에 맞는 마켓 목업 카드가 없습니다.
          </div>
        </div>
      ) : (
        <div style={gridStyle}>
          {displayedMarkets.map((market) => {
            const isClosed =
              market.businessStatus === 'CLOSED'

            return (
              <article
                key={market.id}
                style={cardStyle}
                className="place-feed-click-card"
                role="button"
                tabIndex={0}
                aria-label={`${market.name} 마켓 허브로 이동`}
                onClick={() => {
                  handleOpenMarketHub(market.channelCode)
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    event.preventDefault()
                    handleOpenMarketHub(market.channelCode)
                  }
                }}
              >
                <div style={imageWrapStyle}>
                  {isClosed ? (
                    <div style={closedOverlayStyle}>
                      <div style={closedOverlayTopLineStyle}>
                        영업종료
                      </div>
                    </div>
                  ) : null}

                  {market.imageUrl ? (
                    <Image
                      src={market.imageUrl}
                      alt={`${market.name} 대표 이미지`}
                      width={320}
                      height={220}
                      style={imageStyle}
                      unoptimized
                    />
                  ) : (
                    <div style={emptyImageStyle}>
                      MARKET
                    </div>
                  )}
                </div>

                <div style={cardBodyStyle}>
                  <div style={placeNameStyle}>
                    {market.name}
                  </div>

                  <div style={distanceStyle}>
                    {market.regionName}
                  </div>

                  <div style={metaStyle}>
                    {market.industryName}
                  </div>

                  <div style={metaStyle}>
                    {market.description}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )

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

      <style jsx global>{`
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

        .place-feed-click-card:focus-visible {
          outline: 2px solid #111827;
          outline-offset: 3px;
        }
      `}</style>
    </>
  )
}

export default function MarketFeedPage() {
  return (
    <Suspense fallback={<div>마켓 피드를 불러오는 중입니다.</div>}>
      <MarketFeedPageContent />
    </Suspense>
  )
}

const headerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 32,
  lineHeight: 1.1,
  color: '#111827',
  fontWeight: 900
}

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: '#475569',
  fontSize: 15,
  lineHeight: 1.45,
  fontWeight: 600
}

const searchHeaderRowStyle: CSSProperties = {
  width: '100%',
  maxWidth: 760,
  display: 'flex',
  alignItems: 'center',
  gap: 10
}

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
  minWidth: 54,
  height: 36,
  borderRadius: 999,
  border: 'none',
  background: '#111827',
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 900,
  cursor: 'pointer'
}

const mobileFiltersWrapStyle: CSSProperties = {
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

const contentWrapStyle: CSSProperties = {
  width: '100%'
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 225px)',
  gap: '32px 18px',
  width: '100%',
  justifyContent: 'center',
  padding: 0,
  boxSizing: 'border-box'
}

const cardStyle: CSSProperties = {
  border: 'none',
  background: '#ffffff',
  padding: 0,
  textAlign: 'left',
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

const closedOverlayStyle: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 2,
  minWidth: 120,
  padding: '12px 18px',
  boxSizing: 'border-box',
  borderRadius: 14,
  background: 'rgba(17, 24, 39, 0.82)',
  border: '1px solid rgba(255, 255, 255, 0.24)',
  color: '#ffffff',
  textAlign: 'center',
  pointerEvents: 'none'
}

const closedOverlayTopLineStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  lineHeight: 1.25
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
