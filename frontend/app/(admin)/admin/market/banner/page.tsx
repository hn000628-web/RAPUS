'use client'

import {
  useEffect,
  useRef,
  useState
} from 'react'

import Link from 'next/link'

import {
  deleteMarketBrandAdLogo,
  deleteMarketHeroBanner,
  getMarketBrandAdConfig,
  getMarketBrandAdLogosManage,
  getMarketHeroBannerManageConfig,
  hideMarketBrandAdLogo,
  hideMarketHeroBanner,
  reorderMarketBrandAdLogos,
  updateMarketBrandAdConfig,
  uploadMarketBrandAdLogo,
  updateMarketBrandAdLogoSelection,
  reorderMarketHeroBanners,
  type MarketBrandAdConfig,
  type MarketBrandAdLogo,
  type MarketHeroBanner,
  updateMarketHeroBannerLinkUrl,
  updateMarketHeroBannerText,
  updateMarketHeroBannerSelection,
  uploadMarketHeroBanner
} from '@/lib/market-banner-api'

import {
  buildMediaUrl
} from '@/lib/config'

type BannerSection = {
  key: 'hero' | 'recommend' | 'brand' | 'event-strip' | 'visibility'
  title: string
  description: string
  currentPreview: string
  status: '노출중' | '숨김'
}

const BANNER_SECTIONS: BannerSection[] = [
  {
    key: 'hero',
    title: '히어로 베너 관리',
    description: '마켓 첫 화면 상단의 RAPUS MARKET PICK 영역을 관리합니다.',
    currentPreview: '오늘 장보기, 그런 생활마트에서 가볍게',
    status: '노출중'
  },
  {
    key: 'recommend',
    title: '추천 코너 관리',
    description: '히어로 우측 추천 코너 카드의 문구와 노출 상태를 관리합니다.',
    currentPreview: '간편식 / 생활용품 / 음료 추천 코너',
    status: '노출중'
  },
  {
    key: 'brand',
    title: '브랜드 광고 관리',
    description: '농심, 오뚜기, SAMYANG, CJ 제일제당 등 브랜드 탭 광고를 관리합니다.',
    currentPreview: '농심 · 오뚜기 · SAMYANG · CJ 제일제당 · 동원F&B · 풀무원 · 롯데',
    status: '노출중'
  },
  {
    key: 'event-strip',
    title: '행사 띠베너 관리',
    description: '마켓 상품 영역에 노출되는 행사 안내 띠베너를 관리합니다.',
    currentPreview: '오늘의 특가 · 행사상품 · 빠른 확인',
    status: '숨김'
  },
  {
    key: 'visibility',
    title: '노출 상태 관리',
    description: '마켓 채널 화면에 표시되는 광고 영역의 공개 여부를 관리합니다.',
    currentPreview: '히어로 베너, 추천 코너, 브랜드 광고 전체 노출',
    status: '노출중'
  }
]

function getStatusStyle(status: BannerSection['status']) {
  if (status === '노출중') {
    return {
      background: '#dcfce7',
      color: '#166534',
      borderColor: '#bbf7d0'
    }
  }

  return {
    background: '#f1f5f9',
    color: '#475569',
    borderColor: '#e2e8f0'
  }
}

const DEFAULT_MARKET_CHANNEL_CODE =
  'B012712392766'
const DEFAULT_BRAND_AD_TITLE =
  '스폰서 브랜드'
const DEFAULT_BRAND_AD_DESCRIPTION =
  '오늘 장보기 인기 브랜드 특가'
const BRAND_LOGO_LIMIT =
  15

const HERO_IMAGE_LIMIT =
  5

function createEmptyHeroImageSlots() {
  return Array.from(
    {
      length: HERO_IMAGE_LIMIT
    },
    () => null as File | null
  )
}

function createEmptyHeroBannerSlots() {
  return Array.from(
    {
      length: HERO_IMAGE_LIMIT
    },
    () => null as MarketHeroBanner | null
  )
}

function createEmptyBrandLogoSlots() {
  return Array.from(
    {
      length: BRAND_LOGO_LIMIT
    },
    () => null as MarketBrandAdLogo | null
  )
}

export default function AdminMarketBannerPage() {
  const heroImageInputRef =
    useRef<HTMLInputElement | null>(null)
  const [heroImageSlots, setHeroImageSlots] =
    useState<Array<File | null>>(() => createEmptyHeroImageSlots())
  const [selectedHeroSlotIndex, setSelectedHeroSlotIndex] =
    useState<number | null>(null)
  const [heroUploadStatus, setHeroUploadStatus] =
    useState('')
  const [heroUploading, setHeroUploading] =
    useState(false)
  const [heroPreviewUrls, setHeroPreviewUrls] =
    useState<string[]>([])
  const [savedHeroPreviewUrls, setSavedHeroPreviewUrls] =
    useState<string[]>(() => Array.from(
      {
        length: HERO_IMAGE_LIMIT
      },
      () => ''
    ))
  const [savedHeroBanners, setSavedHeroBanners] =
    useState<Array<MarketHeroBanner | null>>(() => createEmptyHeroBannerSlots())
  const [isChannelSearchOpen, setIsChannelSearchOpen] =
    useState(false)
  const [isHeroTextModalOpen, setIsHeroTextModalOpen] =
    useState(false)
  const [heroTextTitleInput, setHeroTextTitleInput] =
    useState('')
  const [heroTextDescriptionInput, setHeroTextDescriptionInput] =
    useState('')
  const [isHeroLinkModalOpen, setIsHeroLinkModalOpen] =
    useState(false)
  const [heroLinkUrlInput, setHeroLinkUrlInput] =
    useState('')
  const [brandAdConfig, setBrandAdConfig] =
    useState<MarketBrandAdConfig>({
      channelCode: DEFAULT_MARKET_CHANNEL_CODE,
      title: DEFAULT_BRAND_AD_TITLE,
      description: DEFAULT_BRAND_AD_DESCRIPTION,
      displayStatus: 'VISIBLE',
      isActive: 1
    })
  const [isBrandTextModalOpen, setIsBrandTextModalOpen] =
    useState(false)
  const [brandAdTitleInput, setBrandAdTitleInput] =
    useState('')
  const [brandAdDescriptionInput, setBrandAdDescriptionInput] =
    useState('')
  const brandLogoImageInputRef =
    useRef<HTMLInputElement | null>(null)
  const [brandLogoSlots, setBrandLogoSlots] =
    useState<Array<MarketBrandAdLogo | null>>(() => createEmptyBrandLogoSlots())
  const [pendingBrandLogoFiles, setPendingBrandLogoFiles] =
    useState<Array<File | null>>(() => Array.from({ length: BRAND_LOGO_LIMIT }, () => null))
  const [selectedBrandLogoSlotIndex, setSelectedBrandLogoSlotIndex] =
    useState<number | null>(null)

  async function loadCurrentHeroBanners() {
    try {
      const heroConfig =
        await getMarketHeroBannerManageConfig(DEFAULT_MARKET_CHANNEL_CODE)
      const nextSavedPreviewUrls =
        Array.from(
          {
            length: HERO_IMAGE_LIMIT
          },
          () => ''
        )
      const nextSavedHeroBanners =
        createEmptyHeroBannerSlots()

      heroConfig.banners.forEach((banner) => {
        const slotIndex =
          Number(banner.sortOrder) - 1

        if (
          slotIndex < 0 ||
          slotIndex >= HERO_IMAGE_LIMIT ||
          !banner.imageUrl
        ) {
          return
        }

        nextSavedHeroBanners[slotIndex] =
          banner
        nextSavedPreviewUrls[slotIndex] =
          buildMediaUrl(banner.imageUrl)
      })

      setSavedHeroBanners(nextSavedHeroBanners)
      setSavedHeroPreviewUrls(nextSavedPreviewUrls)
    } catch {
      setSavedHeroBanners(createEmptyHeroBannerSlots())
      setSavedHeroPreviewUrls(Array.from(
        {
          length: HERO_IMAGE_LIMIT
        },
        () => ''
      ))
    }
  }

  async function loadBrandAdConfig() {
    try {
      const nextBrandAdConfig =
        await getMarketBrandAdConfig(DEFAULT_MARKET_CHANNEL_CODE)

      setBrandAdConfig(nextBrandAdConfig)
    } catch {
      setBrandAdConfig({
        channelCode: DEFAULT_MARKET_CHANNEL_CODE,
        title: DEFAULT_BRAND_AD_TITLE,
        description: DEFAULT_BRAND_AD_DESCRIPTION,
        displayStatus: 'VISIBLE',
        isActive: 1
      })
    }
  }

  async function loadBrandAdLogos() {
    try {
      const logos =
        await getMarketBrandAdLogosManage(DEFAULT_MARKET_CHANNEL_CODE)
      const nextSlots =
        createEmptyBrandLogoSlots()

      logos.forEach((logo) => {
        const slotIndex =
          Number(logo.sortOrder) - 1

        if (slotIndex < 0 || slotIndex >= BRAND_LOGO_LIMIT) {
          return
        }

        if (nextSlots[slotIndex]) {
          return
        }

        nextSlots[slotIndex] =
          logo
      })

      setBrandLogoSlots(nextSlots)
    } catch {
      setBrandLogoSlots(createEmptyBrandLogoSlots())
    }
  }

  useEffect(() => {
    void loadCurrentHeroBanners()
    void loadBrandAdConfig()
    void loadBrandAdLogos()
  }, [])

  useEffect(() => {
    const nextPreviewUrls =
      heroImageSlots.map((file) => {
        return file
          ? URL.createObjectURL(file)
          : ''
      })

    setHeroPreviewUrls(nextPreviewUrls)

    return () => {
      nextPreviewUrls.forEach((previewUrl) => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
      })
    }
  }, [
    heroImageSlots
  ])

  async function handleRegisterHeroBanner() {
    const orderedHeroImageEntries =
      heroImageSlots
        .map((file, slotIndex) => {
          return {
            file,
            sortOrder: slotIndex + 1
          }
        })
        .filter((entry): entry is { file: File; sortOrder: number } => {
          return Boolean(entry.file)
        })

    if (orderedHeroImageEntries.length < 1) {
      setHeroUploadStatus('히어로 베너 이미지를 먼저 선택해 주세요.')
      return
    }

    if (orderedHeroImageEntries.length > HERO_IMAGE_LIMIT) {
      setHeroUploadStatus('히어로 이미지는 최대 5개까지 등록할 수 있습니다.')
      return
    }

    try {
      setHeroUploading(true)
      setHeroUploadStatus('히어로 베너를 저장하는 중입니다.')

      for (const entry of orderedHeroImageEntries) {
        await uploadMarketHeroBanner({
          channelCode: DEFAULT_MARKET_CHANNEL_CODE,
          file: entry.file,
          sortOrder: entry.sortOrder,
          title: 'RAPUS MARKET PICK',
          description: '오늘 장보기, 그런 생활마트에서 가볍게'
        })
      }

      await loadCurrentHeroBanners()
      setHeroUploadStatus('히어로 베너가 저장되었습니다. 마켓 메인 히어로에 반영됩니다.')
      setHeroImageSlots(createEmptyHeroImageSlots())
      setSelectedHeroSlotIndex(null)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '알 수 없는 오류'

      setHeroUploadStatus(`히어로 베너 저장에 실패했습니다. (${errorMessage})`)
    } finally {
      setHeroUploading(false)
    }
  }

  async function syncHeroBannerConfig(
    action: () => Promise<unknown>,
    pendingMessage: string,
    successMessage: string
  ) {
    try {
      setHeroUploading(true)
      setHeroUploadStatus(pendingMessage)
      await action()
      await loadCurrentHeroBanners()
      setHeroUploadStatus(successMessage)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '알 수 없는 오류'

      setHeroUploadStatus(`히어로 베너 설정 저장에 실패했습니다. (${errorMessage})`)
    } finally {
      setHeroUploading(false)
    }
  }

  function getSelectedSavedHeroBanner() {
    if (selectedHeroSlotIndex === null) {
      return null
    }

    return savedHeroBanners[selectedHeroSlotIndex] ?? null
  }

  function requireSelectedSavedHeroBanner() {
    const banner =
      getSelectedSavedHeroBanner()

    if (!banner) {
      setHeroUploadStatus('저장된 히어로 이미지를 먼저 선택해 주세요.')
      return null
    }

    return banner
  }

  function handleMoveHeroSlot(direction: 'prev' | 'next') {
    if (selectedHeroSlotIndex === null) {
      setHeroUploadStatus('먼저 순서를 변경할 슬롯을 선택해 주세요.')
      return
    }

    const targetSlotIndex =
      direction === 'prev'
        ? selectedHeroSlotIndex - 1
        : selectedHeroSlotIndex + 1

    if (
      targetSlotIndex < 0 ||
      targetSlotIndex >= HERO_IMAGE_LIMIT
    ) {
      setHeroUploadStatus('더 이상 이동할 수 없는 슬롯입니다.')
      return
    }

    void handleReorderHeroSlots(
      selectedHeroSlotIndex,
      targetSlotIndex
    )
  }

  function getSelectableHeroSlotIndexes() {
    return Array.from({
      length: HERO_IMAGE_LIMIT
    }).map((_, slotIndex) => {
      const hasPendingImage =
        Boolean(heroImageSlots[slotIndex])
      const hasSavedImage =
        Boolean(savedHeroBanners[slotIndex])

      return hasPendingImage || hasSavedImage
        ? slotIndex
        : null
    }).filter((slotIndex): slotIndex is number => {
      return slotIndex !== null
    })
  }

  function handleSelectHeroSlide(direction: 'prev' | 'next') {
    const selectableSlotIndexes =
      getSelectableHeroSlotIndexes()

    if (selectableSlotIndexes.length < 1) {
      setHeroUploadStatus('전환할 히어로 이미지가 없습니다.')
      return
    }

    if (selectedHeroSlotIndex === null) {
      const firstSlotIndex =
        selectableSlotIndexes[0]

      setSelectedHeroSlotIndex(firstSlotIndex)
      setHeroUploadStatus(`${firstSlotIndex + 1}번 이미지가 선택되었습니다.`)
      return
    }

    const currentPosition =
      selectableSlotIndexes.indexOf(selectedHeroSlotIndex)

    if (currentPosition < 0) {
      const firstSlotIndex =
        selectableSlotIndexes[0]

      setSelectedHeroSlotIndex(firstSlotIndex)
      setHeroUploadStatus(`${firstSlotIndex + 1}번 이미지가 선택되었습니다.`)
      return
    }

    const targetPosition =
      direction === 'prev'
        ? currentPosition - 1
        : currentPosition + 1

    if (
      targetPosition < 0 ||
      targetPosition >= selectableSlotIndexes.length
    ) {
      setHeroUploadStatus(
        direction === 'prev'
          ? '이전 이미지가 없습니다.'
          : '다음 이미지가 없습니다.'
      )
      return
    }

    const targetSlotIndex =
      selectableSlotIndexes[targetPosition]

    setSelectedHeroSlotIndex(targetSlotIndex)
    setHeroUploadStatus(`${targetSlotIndex + 1}번 이미지가 선택되었습니다.`)
  }

  async function handleReorderHeroSlots(
    fromSlotIndex: number,
    toSlotIndex: number
  ) {
    if (fromSlotIndex === toSlotIndex) {
      return
    }

    const nextBanners =
      [...savedHeroBanners]
    const movingBanner =
      nextBanners[fromSlotIndex]

    if (!movingBanner) {
      setHeroUploadStatus('저장된 히어로 이미지만 순서를 변경할 수 있습니다.')
      return
    }

    const targetBanner =
      nextBanners[toSlotIndex]

    nextBanners[toSlotIndex] =
      movingBanner
    nextBanners[fromSlotIndex] =
      targetBanner

    const reorderItems =
      nextBanners
        .map((banner, slotIndex) => {
          return banner
            ? {
                bannerId: banner.id,
                sortOrder: slotIndex + 1
              }
            : null
        })
        .filter((item): item is { bannerId: number; sortOrder: number } => {
          return Boolean(item)
        })

    if (reorderItems.length < 1) {
      return
    }

    setSelectedHeroSlotIndex(toSlotIndex)

    await syncHeroBannerConfig(
      () => reorderMarketHeroBanners({
        channelCode: DEFAULT_MARKET_CHANNEL_CODE,
        items: reorderItems
      }),
      '히어로 이미지 순서를 저장하는 중입니다.',
      '히어로 이미지 순서가 저장되었습니다.'
    )
  }

  function handleToggleHeroVisibility() {
    const banner =
      requireSelectedSavedHeroBanner()

    if (!banner) {
      return
    }

    const nextIsVisible =
      banner.displayStatus !== 'VISIBLE'

    void syncHeroBannerConfig(
      () => {
        if (!nextIsVisible) {
          return hideMarketHeroBanner({
            channelCode: DEFAULT_MARKET_CHANNEL_CODE,
            bannerId: banner.id
          })
        }

        return updateMarketHeroBannerSelection({
          channelCode: DEFAULT_MARKET_CHANNEL_CODE,
          bannerId: banner.id,
          isVisible: true
        })
      },
      nextIsVisible
        ? '히어로 이미지를 노출 처리하는 중입니다.'
        : '히어로 이미지를 숨김 처리하는 중입니다.',
      nextIsVisible
        ? '히어로 이미지가 노출 상태로 변경되었습니다.'
        : '히어로 이미지가 숨김 상태로 변경되었습니다.'
    )
  }

  function handleDeleteHeroBanner() {
    const banner =
      requireSelectedSavedHeroBanner()

    if (!banner) {
      return
    }

    void syncHeroBannerConfig(
      () => deleteMarketHeroBanner({
        channelCode: DEFAULT_MARKET_CHANNEL_CODE,
        bannerId: banner.id
      }),
      '히어로 이미지 연결을 해제하는 중입니다.',
      '히어로 이미지 연결이 해제되었습니다.'
    )

    setSelectedHeroSlotIndex(null)
  }

  function handleOpenHeroTextModal() {
    const banner =
      requireSelectedSavedHeroBanner()

    if (!banner) {
      return
    }

    setHeroTextTitleInput(String(banner.title ?? ''))
    setHeroTextDescriptionInput(String(banner.description ?? ''))
    setIsHeroTextModalOpen(true)
  }

  function handleCloseHeroTextModal() {
    setIsHeroTextModalOpen(false)
  }

  function handleSaveHeroText() {
    const banner =
      requireSelectedSavedHeroBanner()

    if (!banner) {
      return
    }

    void syncHeroBannerConfig(
      () => updateMarketHeroBannerText({
        channelCode: DEFAULT_MARKET_CHANNEL_CODE,
        bannerId: banner.id,
        title: heroTextTitleInput.trim(),
        description: heroTextDescriptionInput.trim()
      }),
      '히어로 네비게이션 문구를 저장하는 중입니다.',
      '히어로 네비게이션 문구가 저장되었습니다.'
    )

    setIsHeroTextModalOpen(false)
  }

  function handleOpenHeroLinkModal() {
    const banner =
      requireSelectedSavedHeroBanner()

    if (!banner) {
      return
    }

    setHeroLinkUrlInput(String(banner.linkUrl ?? ''))
    setIsHeroLinkModalOpen(true)
  }

  function handleCloseHeroLinkModal() {
    setIsHeroLinkModalOpen(false)
  }

  function handleSaveHeroLinkUrl() {
    const banner =
      requireSelectedSavedHeroBanner()

    if (!banner) {
      return
    }

    void syncHeroBannerConfig(
      () => updateMarketHeroBannerLinkUrl({
        channelCode: DEFAULT_MARKET_CHANNEL_CODE,
        bannerId: banner.id,
        linkUrl: heroLinkUrlInput.trim()
      }),
      '히어로 연결 URL을 저장하는 중입니다.',
      '히어로 연결 URL이 저장되었습니다.'
    )

    setIsHeroLinkModalOpen(false)
  }

  function handleOpenBrandTextModal() {
    setBrandAdTitleInput(String(brandAdConfig.title ?? ''))
    setBrandAdDescriptionInput(String(brandAdConfig.description ?? ''))
    setIsBrandTextModalOpen(true)
  }

  function handleCloseBrandTextModal() {
    setIsBrandTextModalOpen(false)
  }

  function handleSaveBrandText() {
    void syncHeroBannerConfig(
      async () => {
        const nextConfig =
          await updateMarketBrandAdConfig({
            channelCode: DEFAULT_MARKET_CHANNEL_CODE,
            brandAdTitle: brandAdTitleInput.trim(),
            brandAdDescription: brandAdDescriptionInput.trim()
          })

        setBrandAdConfig(nextConfig)
      },
      '브랜드 광고 문구를 저장하는 중입니다.',
      '브랜드 광고 문구가 저장되었습니다.'
    )

    setIsBrandTextModalOpen(false)
  }

  async function syncBrandLogoConfig(
    action: () => Promise<Array<MarketBrandAdLogo>>,
    pendingMessage: string,
    successMessage: string
  ) {
    try {
      setHeroUploading(true)
      setHeroUploadStatus(pendingMessage)
      const nextLogos =
        await action()
      const nextSlots =
        createEmptyBrandLogoSlots()

      nextLogos.forEach((logo) => {
        const slotIndex =
          Number(logo.sortOrder) - 1

        if (slotIndex < 0 || slotIndex >= BRAND_LOGO_LIMIT) {
          return
        }

        if (nextSlots[slotIndex]) {
          return
        }

        nextSlots[slotIndex] =
          logo
      })

      setBrandLogoSlots(nextSlots)
      setHeroUploadStatus(successMessage)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '알 수 없는 오류'

      setHeroUploadStatus(`브랜드 로고 설정 저장에 실패했습니다. (${errorMessage})`)
    } finally {
      setHeroUploading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'transparent',
        padding: '24px 28px'
      }}
    >
      <section
        style={{
          border: '0',
          background: 'transparent',
          padding: 0,
          boxShadow: 'none'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '22px'
          }}
        >
          <div>
            <p
              style={{
                margin: '0 0 8px',
                color: '#2563eb',
                fontSize: '12px',
                fontWeight: 900,
                letterSpacing: '0.02em'
              }}
            >
              MARKET AD CONTROL
            </p>
            <h1
              style={{
                margin: 0,
                color: '#0f172a',
                fontSize: '30px',
                lineHeight: 1.25
              }}
            >
              베너 광고 관리
            </h1>
            <p
              style={{
                margin: '10px 0 0',
                color: '#64748b',
                fontSize: '14px',
                lineHeight: 1.6
              }}
            >
              마켓 채널 화면의 히어로 베너, 추천 코너, 브랜드 광고 노출 구성을 관리합니다.
            </p>

            <div
              role="tablist"
              aria-label="배너 광고 관리 메뉴"
              style={{
                marginTop: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected="true"
                style={{
                  minHeight: '34px',
                  border: '1px solid #2563eb',
                  borderRadius: '999px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  padding: '0 14px',
                  fontSize: '13px',
                  fontWeight: 900,
                  cursor: 'default'
                }}
              >
                메인
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '8px',
              flexWrap: 'wrap'
            }}
          >
            <button
              type="button"
              aria-expanded={isChannelSearchOpen}
              onClick={() => {
                setIsChannelSearchOpen((current) => !current)
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '42px',
                border: isChannelSearchOpen
                  ? '1px solid #2563eb'
                  : '1px solid #cbd5e1',
                borderRadius: '12px',
                background: isChannelSearchOpen
                  ? '#eff6ff'
                  : '#ffffff',
                color: isChannelSearchOpen
                  ? '#1d4ed8'
                  : '#0f172a',
                padding: '0 16px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              채널 검색
            </button>

            <Link
              href="/admin/market"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '42px',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                background: '#ffffff',
                color: '#0f172a',
                padding: '0 16px',
                fontSize: '14px',
                fontWeight: 800,
                textDecoration: 'none'
              }}
            >
              마켓관리로 돌아가기
            </Link>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {BANNER_SECTIONS.map((section) => {
              const statusStyle =
                getStatusStyle(section.status)
              const selectedSavedHeroBanner =
                getSelectedSavedHeroBanner()
              const selectedHeroVisibilityLabel =
                selectedSavedHeroBanner?.displayStatus === 'HIDDEN'
                  ? '노출'
                  : '숨김'

              return (
                <article
                key={section.title}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  background: '#ffffff',
                  padding: '18px',
                  minHeight: '230px',
                  width: '100%'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '14px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        color: '#0f172a',
                        fontSize: '18px',
                        lineHeight: 1.35
                      }}
                    >
                      {section.title}
                    </h2>

                    {section.key === 'hero' ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '24px',
                          borderRadius: '999px',
                          padding: '0 10px',
                          border: '1px solid #bfdbfe',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontSize: '12px',
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        메인페이지
                      </span>
                    ) : null}
                  </div>

                  <span
                    style={{
                      border: `1px solid ${statusStyle.borderColor}`,
                      borderRadius: '999px',
                      background: statusStyle.background,
                      color: statusStyle.color,
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: 900,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {section.status}
                  </span>
                </div>

                <p
                  style={{
                    margin: '0 0 14px',
                    color: '#64748b',
                    fontSize: '13px',
                    lineHeight: 1.6
                  }}
                >
                  {section.description}
                </p>

                <div
                  style={{
                    border: '1px solid #dbeafe',
                    borderRadius: '14px',
                    background: '#eff6ff',
                    padding: '14px',
                    minHeight: '72px',
                    color: '#1e3a8a',
                    fontSize: '13px',
                    fontWeight: 800,
                    lineHeight: 1.55
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      color: '#2563eb',
                      fontSize: '11px',
                      fontWeight: 900
                    }}
                  >
                    현재 노출 예시
                  </span>
                  {section.key === 'brand' ? (
                    <>
                      {brandAdConfig.title}
                      <br />
                      {brandAdConfig.description}
                    </>
                  ) : section.currentPreview}
                </div>

                {section.key === 'hero' ? (
                  <div
                    style={{
                      marginTop: '12px',
                      color: '#475569',
                      fontSize: '13px',
                      fontWeight: 800,
                      lineHeight: 1.6
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                        marginBottom: '10px'
                      }}
                    >
                      <span>
                        히어로 이미지 슬롯
                      </span>
                      <span>
                        {savedHeroBanners.filter(Boolean).length} / {HERO_IMAGE_LIMIT}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap'
                      }}
                    >
                      {Array.from({
                        length: HERO_IMAGE_LIMIT
                      }).map((_, slotIndex) => {
                        const previewUrl =
                          heroPreviewUrls[slotIndex] ||
                          savedHeroPreviewUrls[slotIndex]
                        const file =
                          heroImageSlots[slotIndex]
                        const savedBanner =
                          savedHeroBanners[slotIndex]
                        const hasSavedPreview =
                          Boolean(savedHeroPreviewUrls[slotIndex])
                        const isSelected =
                          selectedHeroSlotIndex === slotIndex
                        const isHidden =
                          savedBanner?.displayStatus === 'HIDDEN'

                        return (
                          <button
                            type="button"
                            key={slotIndex}
                            onClick={() => {
                              setSelectedHeroSlotIndex(slotIndex)
                              setHeroUploadStatus(`${slotIndex + 1}번 슬롯이 선택되었습니다.`)
                            }}
                            style={{
                              width: '100px',
                              height: '100px',
                              border: isSelected
                                ? '2px solid #2563eb'
                                : '1px solid #cbd5e1',
                              borderRadius: '12px',
                              background: previewUrl
                                ? '#0f172a'
                                : isSelected
                                  ? '#eff6ff'
                                  : '#f8fafc',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#94a3b8',
                              fontSize: '12px',
                              fontWeight: 900,
                              position: 'relative',
                              padding: 0,
                              cursor: 'pointer'
                            }}
                          >
                            <span
                              style={{
                                position: 'absolute',
                                top: '6px',
                                left: '6px',
                                zIndex: 2,
                                borderRadius: '999px',
                                background: isSelected
                                  ? '#2563eb'
                                  : 'rgba(15, 23, 42, 0.72)',
                                color: '#ffffff',
                                padding: '3px 7px',
                                fontSize: '11px',
                                fontWeight: 900
                              }}
                            >
                              {slotIndex + 1}번
                            </span>

                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt={`히어로 이미지 미리보기 ${slotIndex + 1}`}
                                style={{
                                  width: '100px',
                                  height: '100px',
                                  objectFit: 'contain',
                                  background: '#ffffff'
                                }}
                              />
                            ) : (
                              <span>
                                빈 슬롯
                              </span>
                            )}

                            {file ? (
                              <span
                                style={{
                                  position: 'absolute',
                                  left: '6px',
                                  right: '6px',
                                  bottom: '6px',
                                  borderRadius: '8px',
                                  background: 'rgba(15, 23, 42, 0.72)',
                                  color: '#ffffff',
                                  padding: '3px 5px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontSize: '10px'
                                }}
                              >
                                {file.name}
                              </span>
                            ) : hasSavedPreview ? (
                              <span
                                style={{
                                  position: 'absolute',
                                  left: '6px',
                                  right: '6px',
                                  bottom: '6px',
                                  borderRadius: '8px',
                                  background: 'rgba(22, 101, 52, 0.78)',
                                  color: '#ffffff',
                                  padding: '3px 5px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontSize: '10px'
                                }}
                              >
                                {isHidden ? '숨김' : '저장됨'}
                              </span>
                            ) : null}

                            {savedBanner ? (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  zIndex: 2,
                                  borderRadius: '999px',
                                  background: isHidden
                                    ? '#f1f5f9'
                                    : '#dcfce7',
                                  color: isHidden
                                    ? '#475569'
                                    : '#166534',
                                  padding: '3px 7px',
                                  fontSize: '10px',
                                  fontWeight: 900
                                }}
                              >
                                {isHidden ? 'HIDDEN' : 'ON'}
                              </span>
                            ) : null}
                          </button>
                        )
                      })}
                    </div>

                    {heroUploadStatus ? (
                      <p
                        style={{
                          margin: '6px 0 0',
                          color: heroUploadStatus.includes('실패')
                            ? '#dc2626'
                            : '#2563eb'
                        }}
                      >
                        {heroUploadStatus}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {section.key === 'brand' ? (
                  <div
                    style={{
                      marginTop: '12px',
                      color: '#475569',
                      fontSize: '13px',
                      fontWeight: 800,
                      lineHeight: 1.6
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                        marginBottom: '10px'
                      }}
                    >
                      <span>
                        브랜드 로고 슬롯
                      </span>
                      <span>
                        {brandLogoSlots.filter((slot) => Boolean(slot)).length} / {BRAND_LOGO_LIMIT}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap'
                      }}
                    >
                      {Array.from({ length: BRAND_LOGO_LIMIT }).map((_, slotIndex) => {
                        const savedLogo =
                          brandLogoSlots[slotIndex]
                        const previewUrl =
                          savedLogo?.imageUrl
                            ? buildMediaUrl(savedLogo.imageUrl)
                            : ''
                        const isSelected =
                          selectedBrandLogoSlotIndex === slotIndex
                        const isHidden =
                          savedLogo?.displayStatus === 'HIDDEN'

                        return (
                          <button
                            key={`brand-slot-${slotIndex}`}
                            type="button"
                            onClick={() => {
                              setSelectedBrandLogoSlotIndex(slotIndex)
                              setHeroUploadStatus(`${slotIndex + 1}번 브랜드 로고 슬롯이 선택되었습니다.`)
                            }}
                            style={{
                              width: '50px',
                              height: '50px',
                              border: isSelected
                                ? '2px solid #2563eb'
                                : '1px solid #e5e7eb',
                              borderRadius: '8px',
                              background: '#ffffff',
                              padding: 0,
                              overflow: 'hidden',
                              position: 'relative',
                              cursor: 'pointer'
                            }}
                          >
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt={`브랜드 로고 ${slotIndex + 1}`}
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  objectFit: 'contain',
                                  background: '#ffffff'
                                }}
                              />
                            ) : null}
                            <span
                              style={{
                                position: 'absolute',
                                left: '2px',
                                top: '2px',
                                padding: '0 4px',
                                borderRadius: '999px',
                                background: 'rgba(15, 23, 42, 0.72)',
                                color: '#ffffff',
                                fontSize: '9px',
                                fontWeight: 900
                              }}
                            >
                              {slotIndex + 1}
                            </span>
                            {savedLogo ? (
                              <span
                                style={{
                                  position: 'absolute',
                                  right: '2px',
                                  top: '2px',
                                  padding: '0 4px',
                                  borderRadius: '999px',
                                  background: isHidden ? '#f1f5f9' : '#dcfce7',
                                  color: isHidden ? '#475569' : '#166534',
                                  fontSize: '8px',
                                  fontWeight: 900
                                }}
                              >
                                {isHidden ? 'H' : 'V'}
                              </span>
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginTop: '16px'
                  }}
                >
                  {section.key === 'hero' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectHeroSlide('prev')
                        }}
                        style={{
                          minHeight: '38px',
                          border: '1px solid #0f172a',
                          borderRadius: '10px',
                          background: '#0f172a',
                          color: '#ffffff',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        이전 이미지
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleSelectHeroSlide('next')
                        }}
                        style={{
                          minHeight: '38px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                          background: '#ffffff',
                          color: '#0f172a',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        다음 이미지
                      </button>
                    </>
                  ) : null}

                  {section.key === 'hero' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          handleMoveHeroSlot('prev')
                        }}
                        style={{
                          minHeight: '38px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                          background: '#ffffff',
                          color: '#0f172a',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        순서 앞으로
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleMoveHeroSlot('next')
                        }}
                        style={{
                          minHeight: '38px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                          background: '#ffffff',
                          color: '#0f172a',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        순서 뒤로
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleHeroVisibility}
                        style={{
                          minHeight: '38px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                          background: '#ffffff',
                          color: '#0f172a',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {selectedHeroVisibilityLabel}
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteHeroBanner}
                        style={{
                          minHeight: '38px',
                          border: '1px solid #fecaca',
                          borderRadius: '10px',
                          background: '#fff1f2',
                          color: '#be123c',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        삭제
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenHeroTextModal}
                        style={{
                          minHeight: '38px',
                          border: '1px solid #93c5fd',
                          borderRadius: '10px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        문구수정
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenHeroLinkModal}
                        style={{
                          minHeight: '38px',
                          border: '1px solid #93c5fd',
                          borderRadius: '10px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        URL 수정
                      </button>
                    </>
                  ) : null}

                  {section.key === 'brand' ? (
                    <button
                      type="button"
                      onClick={handleOpenBrandTextModal}
                      style={{
                        minHeight: '38px',
                        border: '1px solid #93c5fd',
                        borderRadius: '10px',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        padding: '0 14px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      텍스트 수정
                    </button>
                  ) : null}

                  {section.key === 'brand' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedBrandLogoSlotIndex === null || selectedBrandLogoSlotIndex <= 0) {
                            setHeroUploadStatus('앞으로 이동할 브랜드 로고 슬롯을 선택해 주세요.')
                            return
                          }

                          const fromLogo = brandLogoSlots[selectedBrandLogoSlotIndex]
                          const toLogo = brandLogoSlots[selectedBrandLogoSlotIndex - 1]

                          if (!fromLogo) {
                            setHeroUploadStatus('저장된 브랜드 로고를 선택해 주세요.')
                            return
                          }

                          const items = [
                            {
                              logoId: fromLogo.id,
                              sortOrder: selectedBrandLogoSlotIndex
                            }
                          ]

                          if (toLogo) {
                            items.push({
                              logoId: toLogo.id,
                              sortOrder: selectedBrandLogoSlotIndex + 1
                            })
                          }

                          void syncBrandLogoConfig(
                            () => reorderMarketBrandAdLogos({
                              channelCode: DEFAULT_MARKET_CHANNEL_CODE,
                              items
                            }),
                            '브랜드 로고 순서를 변경하는 중입니다.',
                            '브랜드 로고 순서가 변경되었습니다.'
                          )
                          setSelectedBrandLogoSlotIndex(selectedBrandLogoSlotIndex - 1)
                        }}
                        style={{
                          minHeight: '38px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                          background: '#ffffff',
                          color: '#0f172a',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        순서 앞으로
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedBrandLogoSlotIndex === null || selectedBrandLogoSlotIndex >= BRAND_LOGO_LIMIT - 1) {
                            setHeroUploadStatus('뒤로 이동할 브랜드 로고 슬롯을 선택해 주세요.')
                            return
                          }

                          const fromLogo = brandLogoSlots[selectedBrandLogoSlotIndex]
                          const toLogo = brandLogoSlots[selectedBrandLogoSlotIndex + 1]

                          if (!fromLogo) {
                            setHeroUploadStatus('저장된 브랜드 로고를 선택해 주세요.')
                            return
                          }

                          const items = [
                            {
                              logoId: fromLogo.id,
                              sortOrder: selectedBrandLogoSlotIndex + 2
                            }
                          ]

                          if (toLogo) {
                            items.push({
                              logoId: toLogo.id,
                              sortOrder: selectedBrandLogoSlotIndex + 1
                            })
                          }

                          void syncBrandLogoConfig(
                            () => reorderMarketBrandAdLogos({
                              channelCode: DEFAULT_MARKET_CHANNEL_CODE,
                              items
                            }),
                            '브랜드 로고 순서를 변경하는 중입니다.',
                            '브랜드 로고 순서가 변경되었습니다.'
                          )
                          setSelectedBrandLogoSlotIndex(selectedBrandLogoSlotIndex + 1)
                        }}
                        style={{
                          minHeight: '38px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                          background: '#ffffff',
                          color: '#0f172a',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        순서 뒤로
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedBrandLogoSlotIndex === null) {
                            setHeroUploadStatus('먼저 브랜드 로고 슬롯을 선택해 주세요.')
                            return
                          }

                          brandLogoImageInputRef.current?.click()
                        }}
                        style={{
                          minHeight: '38px',
                          border: '1px solid #2563eb',
                          borderRadius: '10px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        이미지 선택
                      </button>
                      <input
                        ref={brandLogoImageInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(event) => {
                          const nextFile =
                            event.target.files?.[0] ?? null

                          if (selectedBrandLogoSlotIndex === null || !nextFile) {
                            event.target.value = ''
                            return
                          }

                          setPendingBrandLogoFiles((current) => {
                            const next = [...current]
                            next[selectedBrandLogoSlotIndex] = nextFile
                            return next
                          })
                          setHeroUploadStatus(`${selectedBrandLogoSlotIndex + 1}번 브랜드 로고 이미지가 선택되었습니다.`)
                          event.target.value = ''
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedBrandLogoSlotIndex === null) {
                            setHeroUploadStatus('먼저 브랜드 로고 슬롯을 선택해 주세요.')
                            return
                          }

                          const selectedFile =
                            pendingBrandLogoFiles[selectedBrandLogoSlotIndex]

                          if (!selectedFile) {
                            setHeroUploadStatus('먼저 업로드할 브랜드 로고 이미지를 선택해 주세요.')
                            return
                          }

                          void syncBrandLogoConfig(
                            () => uploadMarketBrandAdLogo({
                              channelCode: DEFAULT_MARKET_CHANNEL_CODE,
                              file: selectedFile,
                              sortOrder: selectedBrandLogoSlotIndex + 1
                            }),
                            '브랜드 로고를 저장하는 중입니다.',
                            '브랜드 로고가 저장되었습니다.'
                          )
                        }}
                        style={{
                          minHeight: '38px',
                          border: '1px solid #2563eb',
                          borderRadius: '10px',
                          background: '#2563eb',
                          color: '#ffffff',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        로고등록
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedBrandLogoSlotIndex === null) {
                            setHeroUploadStatus('먼저 브랜드 로고 슬롯을 선택해 주세요.')
                            return
                          }

                          const selectedLogo =
                            brandLogoSlots[selectedBrandLogoSlotIndex]

                          if (!selectedLogo) {
                            setHeroUploadStatus('저장된 브랜드 로고를 선택해 주세요.')
                            return
                          }

                          void syncBrandLogoConfig(
                            () => {
                              if (selectedLogo.displayStatus === 'HIDDEN') {
                                return updateMarketBrandAdLogoSelection({
                                  channelCode: DEFAULT_MARKET_CHANNEL_CODE,
                                  logoId: selectedLogo.id,
                                  isVisible: true
                                })
                              }

                              return hideMarketBrandAdLogo({
                                channelCode: DEFAULT_MARKET_CHANNEL_CODE,
                                logoId: selectedLogo.id
                              })
                            },
                            selectedLogo.displayStatus === 'HIDDEN'
                              ? '브랜드 로고를 노출 처리하는 중입니다.'
                              : '브랜드 로고를 숨김 처리하는 중입니다.',
                            selectedLogo.displayStatus === 'HIDDEN'
                              ? '브랜드 로고가 노출 상태로 변경되었습니다.'
                              : '브랜드 로고가 숨김 처리되었습니다.'
                          )
                        }}
                        style={{
                          minHeight: '38px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                          background: '#ffffff',
                          color: '#0f172a',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {brandLogoSlots[selectedBrandLogoSlotIndex ?? -1]?.displayStatus === 'HIDDEN'
                          ? '노출'
                          : '숨김'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedBrandLogoSlotIndex === null) {
                            setHeroUploadStatus('먼저 브랜드 로고 슬롯을 선택해 주세요.')
                            return
                          }

                          const selectedLogo =
                            brandLogoSlots[selectedBrandLogoSlotIndex]

                          if (!selectedLogo) {
                            setHeroUploadStatus('저장된 브랜드 로고를 선택해 주세요.')
                            return
                          }

                          void syncBrandLogoConfig(
                            () => deleteMarketBrandAdLogo({
                              channelCode: DEFAULT_MARKET_CHANNEL_CODE,
                              logoId: selectedLogo.id
                            }),
                            '브랜드 로고를 삭제하는 중입니다.',
                            '브랜드 로고가 삭제되었습니다.'
                          )
                        }}
                        style={{
                          minHeight: '38px',
                          border: '1px solid #fecaca',
                          borderRadius: '10px',
                          background: '#fff1f2',
                          color: '#be123c',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        삭제
                      </button>
                    </>
                  ) : null}

                  {section.key === 'hero' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedHeroSlotIndex === null) {
                            setHeroUploadStatus('먼저 이미지를 등록할 슬롯을 선택해 주세요.')
                            return
                          }

                          heroImageInputRef.current?.click()
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '38px',
                          border: '1px solid #2563eb',
                          borderRadius: '10px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        이미지 선택
                      </button>
                    <input
                      ref={heroImageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(event) => {
                        const nextFiles =
                          Array.from(event.target.files ?? [])

                        if (selectedHeroSlotIndex === null) {
                          setHeroUploadStatus('먼저 이미지를 등록할 슬롯을 선택해 주세요.')
                          event.target.value = ''
                          return
                        }

                        if (nextFiles.length > 0) {
                          setHeroImageSlots((currentSlots) => {
                            const nextSlots =
                              [...currentSlots]

                            nextFiles
                              .slice(0, HERO_IMAGE_LIMIT - selectedHeroSlotIndex)
                              .forEach((nextFile, fileIndex) => {
                                nextSlots[selectedHeroSlotIndex + fileIndex] =
                                  nextFile
                              })

                            return nextSlots
                          })

                          if (
                            selectedHeroSlotIndex + nextFiles.length >
                            HERO_IMAGE_LIMIT
                          ) {
                            setHeroUploadStatus('히어로 이미지는 최대 5개까지 등록할 수 있습니다.')
                          } else {
                            setHeroUploadStatus(
                              `${selectedHeroSlotIndex + 1}번 슬롯부터 ${nextFiles.length}개 이미지가 반영되었습니다.`
                            )
                          }

                          if (
                            selectedHeroSlotIndex + nextFiles.length <=
                            HERO_IMAGE_LIMIT
                          ) {
                            const lastSelectedSlotIndex =
                              selectedHeroSlotIndex + nextFiles.length - 1

                            setSelectedHeroSlotIndex(lastSelectedSlotIndex)
                          } else {
                            setSelectedHeroSlotIndex(HERO_IMAGE_LIMIT - 1)
                          }
                        }

                        event.target.value = ''
                      }}
                    />
                      <button
                        type="button"
                        onClick={() => {
                          void handleRegisterHeroBanner()
                        }}
                        style={{
                          minHeight: '38px',
                          border: '1px solid #2563eb',
                          borderRadius: '10px',
                          background: heroUploading
                            ? '#94a3b8'
                            : '#2563eb',
                          color: '#ffffff',
                          padding: '0 14px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: heroUploading
                            ? 'not-allowed'
                            : 'pointer'
                        }}
                        disabled={heroUploading}
                      >
                        {heroUploading
                          ? '등록중...'
                          : '베너등록'}
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {isHeroTextModalOpen ? (
        <div
          role="presentation"
          onMouseDown={handleCloseHeroTextModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(15, 23, 42, 0.48)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="히어로 네비게이션 문구 수정"
            onMouseDown={(event) => {
              event.stopPropagation()
            }}
            style={{
              width: 'min(520px, 100%)',
              borderRadius: '14px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '18px',
              boxShadow: '0 20px 44px rgba(15, 23, 42, 0.2)',
              display: 'grid',
              gap: '12px'
            }}
          >
            <h3
              style={{
                margin: 0,
                color: '#0f172a',
                fontSize: '18px',
                fontWeight: 900
              }}
            >
              히어로 네비게이션 문구 수정
            </h3>

            <label
              style={{
                display: 'grid',
                gap: '6px',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 800
              }}
            >
              제목
              <input
                value={heroTextTitleInput}
                onChange={(event) => {
                  setHeroTextTitleInput(event.target.value)
                }}
                placeholder="네비게이션 상단 문구"
                style={{
                  minHeight: '40px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0 12px',
                  fontSize: '13px',
                  color: '#0f172a'
                }}
              />
            </label>

            <label
              style={{
                display: 'grid',
                gap: '6px',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 800
              }}
            >
              설명
              <textarea
                value={heroTextDescriptionInput}
                onChange={(event) => {
                  setHeroTextDescriptionInput(event.target.value)
                }}
                placeholder="네비게이션 하단 문구"
                rows={3}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: '#0f172a',
                  resize: 'vertical'
                }}
              />
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}
            >
              <button
                type="button"
                onClick={handleCloseHeroTextModal}
                style={{
                  minHeight: '38px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  background: '#ffffff',
                  color: '#0f172a',
                  padding: '0 14px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveHeroText}
                style={{
                  minHeight: '38px',
                  border: '1px solid #2563eb',
                  borderRadius: '10px',
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '0 14px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                저장
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isHeroLinkModalOpen ? (
        <div
          role="presentation"
          onMouseDown={handleCloseHeroLinkModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(15, 23, 42, 0.48)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="히어로 연결 URL 수정"
            onMouseDown={(event) => {
              event.stopPropagation()
            }}
            style={{
              width: 'min(520px, 100%)',
              borderRadius: '14px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '18px',
              boxShadow: '0 20px 44px rgba(15, 23, 42, 0.2)',
              display: 'grid',
              gap: '12px'
            }}
          >
            <h3
              style={{
                margin: 0,
                color: '#0f172a',
                fontSize: '18px',
                fontWeight: 900
              }}
            >
              히어로 연결 URL 수정
            </h3>

            <label
              style={{
                display: 'grid',
                gap: '6px',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 800
              }}
            >
              링크 URL
              <input
                value={heroLinkUrlInput}
                onChange={(event) => {
                  setHeroLinkUrlInput(event.target.value)
                }}
                placeholder="https://... 또는 /market/... 형태"
                style={{
                  minHeight: '40px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0 12px',
                  fontSize: '13px',
                  color: '#0f172a'
                }}
              />
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}
            >
              <button
                type="button"
                onClick={handleCloseHeroLinkModal}
                style={{
                  minHeight: '38px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  background: '#ffffff',
                  color: '#0f172a',
                  padding: '0 14px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveHeroLinkUrl}
                style={{
                  minHeight: '38px',
                  border: '1px solid #2563eb',
                  borderRadius: '10px',
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '0 14px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                저장
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isBrandTextModalOpen ? (
        <div
          role="presentation"
          onMouseDown={handleCloseBrandTextModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(15, 23, 42, 0.48)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="브랜드 광고 문구 수정"
            onMouseDown={(event) => {
              event.stopPropagation()
            }}
            style={{
              width: 'min(560px, 100%)',
              borderRadius: '14px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '18px',
              boxShadow: '0 20px 44px rgba(15, 23, 42, 0.2)',
              display: 'grid',
              gap: '12px'
            }}
          >
            <h3
              style={{
                margin: 0,
                color: '#0f172a',
                fontSize: '18px',
                fontWeight: 900
              }}
            >
              브랜드 광고 문구 수정
            </h3>

            <label
              style={{
                display: 'grid',
                gap: '6px',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 800
              }}
            >
              제목
              <input
                value={brandAdTitleInput}
                onChange={(event) => {
                  setBrandAdTitleInput(event.target.value)
                }}
                placeholder="브랜드 광고 제목"
                style={{
                  minHeight: '40px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0 12px',
                  fontSize: '13px',
                  color: '#0f172a'
                }}
              />
            </label>

            <label
              style={{
                display: 'grid',
                gap: '6px',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 800
              }}
            >
              설명
              <textarea
                value={brandAdDescriptionInput}
                onChange={(event) => {
                  setBrandAdDescriptionInput(event.target.value)
                }}
                placeholder="브랜드 광고 설명"
                rows={3}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: '#0f172a',
                  resize: 'vertical'
                }}
              />
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}
            >
              <button
                type="button"
                onClick={handleCloseBrandTextModal}
                style={{
                  minHeight: '38px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  background: '#ffffff',
                  color: '#0f172a',
                  padding: '0 14px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveBrandText}
                style={{
                  minHeight: '38px',
                  border: '1px solid #2563eb',
                  borderRadius: '10px',
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '0 14px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                저장
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )

}
