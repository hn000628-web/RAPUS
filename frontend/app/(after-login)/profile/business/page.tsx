// FILE : frontend/app/(after-login)/profile/business/page.tsx
// ROOT : frontend/app/(after-login)/profile/business/page.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS PROFILE MAIN PAGE
// CHANGE SUMMARY :
// - BUSINESS ?꾨줈???ㅻ뜑 ?섎떒?먯꽌 吏??二쇱냼 ?쒖떆 ?쒓굅
// - ?낆쥌 ?쒖떆 ?놁뿉 以묐났 異쒕젰?섎뜕 regionText ?쒓굅
// - ?덈궡 ??쓽 二쇱냼 / 吏???뺣낫 異쒕젰? 湲곗〈 ?좎?
// - BUSINESS ?꾨줈???ㅻ뜑??紐⑹뾽 ?됱젏 UI ?좎?
// - ?됱젏 ?꾩튂???꾨컮? ?ㅻⅨ履??띿뒪???곸뿭 / ?낆쥌 ?쒖떆 諛붾줈 ?쇱そ 湲곗? ?좎?
// - MOCK_TOTAL_SCORE / MOCK_REVIEW_COUNT ?섎뱶肄붾뵫 ?곸닔 ?좎?
// - ?됱젏 UI??珥앹젏 4.2 / 諛⑸Ц??由щ럭 3,897 紐⑹뾽 湲곗? ?좎?
// - CSS Module ratingInline / ratingStar / ratingScore / ratingReviewText ?대옒???ъ슜 ?좎?
// - BUSINESS 硫붿씤 ?섏씠吏 ?덉뼱濡??щ씪?대뱶 踰꾪듉 hover ?곹깭 ?좎?
// - ?덉뼱濡??곸뿭 留덉슦???ㅻ쾭 ??醫뚯슦 踰꾪듉 / ?대?吏 移댁슫??諛곗? ?щ챸 釉붾옓 媛뺤“ ?좎?
// - 醫뚯슦 ?щ씪?대뱶 踰꾪듉 湲곕낯 ?곹깭???쏀븳 ?щ챸???좎?
// - 醫뚯슦 ?щ씪?대뱶 踰꾪듉 吏곸젒 hover ????吏꾪븳 ?щ챸 釉붾옓 踰꾪듉 ?좎?
// - ?덉뼱濡??대?吏 ?щ씪?대뵫 ?곹깭 currentHeroIndex ?좎?
// - ?덉뼱濡??대?吏 媛쒖닔 ?쒖떆 ?쇱슫??諛곗? 1/5 援ъ“ ?좎?
// - ?덉뼱濡?/ ?꾨컮? ?대?吏 ?대┃ ??怨듭슜 ImageViewer ?대┝ ?좎?
// - frontend/components/viewer/ImageViewer.tsx 怨듭슜 而댄룷?뚰듃 import ?좎?
// - viewerImages / viewerIndex / isImageViewerOpen ?곹깭 ?좎?
// - ?덉뼱濡??대┃ ???꾩옱 ?덉뼱濡??대?吏 湲곗? 酉곗뼱 ?ㅽ뵂
// - ?꾨컮? ?대┃ ???꾨컮? ?대?吏 湲곗? 酉곗뼱 ?ㅽ뵂
// - ESC ?リ린 / 諛곌꼍 ?대┃ ?リ린 / ?댁쟾 / ?ㅼ쓬 ?대룞? 怨듭슜 ImageViewer ?대떦
// - BUSINESS ?≪뀡 踰꾪듉?먯꽌 ?꾪솕 / 吏??/ 硫붿떆吏 ?쒓굅 ?좎?
// - 鍮꾩쫰?덉뒪 ?ㅼ젙 / 寃뚯떆臾??깅줉 踰꾪듉 ?좎?
// - QR肄붾뱶 踰꾪듉 ?좎?
// - QR肄붾뱶 踰꾪듉 ?대┃ ???꾩옱 ?섏씠吏?먯꽌 QR ?앹뾽 ?쒖떆 ?좎?
// - react-qr-code 湲곕컲 ?몃씪??QR ?앹뾽 ?좎?
// - channelCode 湲곕컲 businessChannelShareUrl ?앹꽦 ?좎?
// - BusinessHeader ?섏〈 ?쒓굅 ?좎?
// - GENERAL 愿由??섏씠吏? ?숈씪??吏곸젒 JSX 湲곕컲 2而щ읆 UI 援ъ“ ?좎?
// - ?쇱そ? ?덉뼱濡?/ ?꾨컮? / ?곹샇 / 鍮꾩쫰?덉뒪 怨꾩젙 / ?됱젏 / ?낆쥌 / ?≪뀡 踰꾪듉 ?대떦 ?좎?
// - ?ㅻⅨ履쎌? ??硫붾돱 / ??肄섑뀗痢??대떦 ?좎?
// - TypeScript strict null ?ㅻ쪟 諛⑹?瑜??꾪빐 safeProfile ?좎?
// - CSS Module 湲곕컲 BusinessProfilePage.module.css ?곌껐 ?좎?
// - TabBar inline style ?쒓굅 ??CSS Module className 援ъ“ ?좎?
// - 硫붾돱諛?label 10???쒗븳 ?좎?
// - 硫붾돱諛?overflow 諛쒖깮 ??醫뚯슦 ?대룞 踰꾪듉 ?좎?
// - 硫붾돱諛?紐⑤컮??媛濡??ㅼ??댄봽 ????좎?
// - BUSINESS 硫붿씤 ?섏씠吏?먯꽌 ?ㅼ젣 ?곸꽭 ?꾨줈??議고쉶 ?좎?
// - ?ㅻ뜑/怨듯넻 ?뺣낫??getBusinessProfileDetail(channelCode) ?좎?
// - ?덈궡 ???꾩슜 ?곗씠?곕뒗 getBusinessInfoView(channelCode) helper ?곌껐 ?좎?
// - BusinessInfo 而댄룷?뚰듃??bio / contactPhone / regionName / detailAddress / hours / sections ?꾨떖 ?좎?
// - GALLERY ??뿉??BusinessGallery ??channelCode ?꾨떖 ?좎?
// - BUSINESS API 寃쎄퀎 ?좎?
// - API / DB / Service ?곹뼢 ?놁쓬

'use client'

// SECTION 01 : IMPORT

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import type {
  MouseEvent
} from 'react'

import {
  useRouter
} from 'next/navigation'

import QRCode from 'react-qr-code'

import ImageViewer from '@/components/viewer/ImageViewer'

import {
  getBusinessMenus
} from '@/lib/business/menuApi'

import {
  getBusinessProfileDetail
} from '@/lib/business/profileApi'

import {
  getBusinessInfoView,
  type BusinessInfoView
} from '@/lib/business/profile-info-api'

import {
  getBusinessHoursSetting,
  type BusinessHoursState as BusinessHoursApiState
} from '@/lib/business/business-hours-api'

import {
  getMe
} from '@/lib/authApi'

import {
  buildProfileStoreRoute
} from '@/lib/profile-summary-api'

import type {
  PlaceFeedTypeCode
} from '@/lib/profile-summary-api'

import {
  useAuthGuard
} from '@/lib/useAuthGuard'

import BusinessInfo from '@/app/(after-login)/profile/business/components/info/BusinessInfo'
import BusinessSummary from '@/app/(after-login)/profile/business/components/summary/BusinessSummary'
import BusinessGeneralPosts from '@/app/(after-login)/profile/business/components/posts/BusinessGeneralPosts'
import BusinessGallery from '@/app/(after-login)/profile/business/components/photos/BusinessGallery'
import BusinessProducts from '@/app/(after-login)/profile/business/components/product/BusinessProducts'
import BusinessEvents from '@/app/(after-login)/profile/business/components/event/BusinessEvents'
import BusinessReviews from '@/app/(after-login)/profile/business/components/review/BusinessReviews'
import HeroOverlayStatus from '@/app/(after-login)/profile/business/components/HeroImage/HeroOverlayStatus'

import styles from './BusinessProfilePage.module.css'

// SECTION 02 : TYPE

type TabType =
  | 'summary'
  | 'info'
  | 'GENERAL'
  | 'GALLERY'
  | 'PRODUCT'
  | 'EVENT'
  | 'REVIEW'

type ProfileBlockType =
  | 'TEXT'
  | 'LINK'
  | 'IMAGE'
  | 'SECTION'

type BusinessMenu = {
  id?: number
  title: string
  postType?: string | null
  sortOrder: number
  isActive: boolean
}

type BusinessBlock = {
  id?: number
  type: ProfileBlockType
  title?: string
  content?: string
  url?: string
  description?: string
  sortOrder: number
}

type BusinessAvatar = {
  id: number
  imageUrl?: string | null
  filePath?: string | null
}

type BusinessHeroImage = {
  id: number
  sortOrder: number
  imageUrl?: string | null
}

type BusinessRegion = {
  id: number
  name?: string | null
  fullName?: string | null
}

type BusinessPageProfile = {
  profileType: 'BUSINESS'
  displayName: string | null
  bio: string | null
  avatar: BusinessAvatar | null
  heroImages: BusinessHeroImage[]
  blocks: BusinessBlock[]
  region: BusinessRegion | null
  businessTypeLabel?: string
  industryDisplay?: string
  channelCode?: string
  placeFeedTypeCode?: PlaceFeedTypeCode | null
}

type StoredSessionShape = {
  profileType: string | null
}

type BusinessProfileDetailResponse = {
  profile: {
    id?: number
    profileType: 'BUSINESS'
    displayName: string | null
    bio: string | null
    channelCode: string
    businessTypeCode?: string | null
    placeFeedTypeCode?: PlaceFeedTypeCode | null
  }
  industry: {
    industry: {
      name: string | null
    } | null
    industrySubtype: {
      name: string | null
    } | null
  }
  placeMeta: {
    activityRegion: {
      id: number
      name: string | null
      fullName: string | null
    } | null
  }
  infoBlocks: Array<{
    id?: number
    blockType: string
    title?: string | null
    content?: string | null
    linkUrl?: string | null
    description?: string | null
    sortOrder: number
  }>
  media: {
    avatar: {
      id: number
      filePath?: string | null
      imageUrl?: string | null
    } | null
    heroImages: Array<{
      id: number
      sortOrder: number
      filePath?: string | null
      imageUrl?: string | null
    }>
  }
}

type TabItem = {
  key: TabType
  label: string
}

type TabBarProps = {
  activeTab: TabType
  onClick: (tab: TabType) => void
  menus: BusinessMenu[]
}

type ImageViewerItem = {
  imageUrl: string
}

type HeroControlHoverType =
  | 'prev'
  | 'next'
  | null

type HoursDayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

// SECTION 03 : CONSTANT

const PROFILE_TYPE_KEYS = [
  'activeProfileType',
  'profileType',
  'ptype'
] as const

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api'

const API_BASE =
  RAW_API_BASE
    .replace(/\/+$/, '')
    .replace(/\/api$/, '')

const TAB_LABEL_MAX_LENGTH =
  10

const TAB_SCROLL_AMOUNT =
  180

const DEFAULT_BUSINESS_NAME =
  '비즈니스 프로필'

const DEFAULT_BUSINESS_TYPE_LABEL =
  '고정형마켓'

const DEFAULT_SUBSCRIBER_COUNT =
  0

const MOCK_TOTAL_SCORE =
  4.2

const MOCK_REVIEW_COUNT =
  3897

const BUSINESS_SETTINGS_PATH =
  '/profile/business/settings'

const BUSINESS_HOURS_SETTINGS_PATH =
  '/profile/business/settings/hours'

const BUSINESS_CONTENT_CREATE_PATH =
  '/profile/business/create/select'

const DEFAULT_BUSINESS_CHANNEL_URL =
  '/channel/unknown'

const HERO_STATUS_DAY_ORDER: HoursDayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
]

const HERO_STATUS_DAY_LABEL: Record<HoursDayKey, string> = {
  sunday: '일요일',
  monday: '월요일',
  tuesday: '화요일',
  wednesday: '수요일',
  thursday: '목요일',
  friday: '금요일',
  saturday: '토요일'
}

// SECTION 04 : COMPONENT

export default function BusinessProfilePage() {
  useAuthGuard()

  const router =
    useRouter()

  // SECTION 05 : STATE

  const [profile, setProfile] =
    useState<BusinessPageProfile | null>(null)

  const [infoView, setInfoView] =
    useState<BusinessInfoView | null>(null)

  const [menus, setMenus] =
    useState<BusinessMenu[]>([])

  const [loading, setLoading] =
    useState(true)

  const [activeTab, setActiveTab] =
    useState<TabType>('info')

  const [isQrPopupOpen, setQrPopupOpen] =
    useState(false)

  const [isImageViewerOpen, setImageViewerOpen] =
    useState(false)

  const [imageViewerIndex, setImageViewerIndex] =
    useState(0)

  const [currentHeroIndex, setCurrentHeroIndex] =
    useState(0)

  const [isHeroHovered, setHeroHovered] =
    useState(false)

  const [heroControlHover, setHeroControlHover] =
    useState<HeroControlHoverType>(null)

  const [heroBusinessStatusLabel, setHeroBusinessStatusLabel] =
    useState('영업종료')

  const [heroBusinessIsOpen, setHeroBusinessIsOpen] =
    useState(false)

  const contentRef =
    useRef<HTMLDivElement | null>(null)

  // SECTION 06 : DATA FUNCTION

  function getStoredSession(): StoredSessionShape {
    if (typeof window === 'undefined') {
      return {
        profileType: null
      }
    }

    let profileType: string | null =
      null

    for (const key of PROFILE_TYPE_KEYS) {
      const raw =
        window.localStorage.getItem(key)

      if (raw) {
        profileType = raw
        break
      }
    }

    return {
      profileType
    }
  }

  function normalizeImageUrl(
    filePath?: string | null
  ): string | null {
    if (!filePath) {
      return null
    }

    const trimmed =
      filePath.trim()

    if (!trimmed) {
      return null
    }

    if (trimmed.startsWith('blob:')) {
      return trimmed
    }

    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://')
    ) {
      try {
        const parsedUrl =
          new URL(trimmed)

        if (parsedUrl.pathname.startsWith('/api/media/')) {
          parsedUrl.pathname =
            parsedUrl.pathname.replace(
              /^\/api\/media\//,
              '/media/'
            )

          return parsedUrl.toString()
        }

        if (parsedUrl.pathname.startsWith('/uploads/')) {
          parsedUrl.pathname =
            parsedUrl.pathname.replace(
              /^\/uploads\//,
              '/media/'
            )

          return parsedUrl.toString()
        }

        return parsedUrl.toString()
      } catch {
        return trimmed
      }
    }

    if (trimmed.startsWith('/api/media/')) {
      return `${API_BASE}${trimmed.replace(/^\/api\/media\//, '/media/')}`
    }

    if (trimmed.startsWith('api/media/')) {
      return `${API_BASE}/${trimmed.replace(/^api\/media\//, 'media/')}`
    }

    if (trimmed.startsWith('/media/')) {
      return `${API_BASE}${trimmed}`
    }

    if (trimmed.startsWith('/uploads/')) {
      return `${API_BASE}${trimmed.replace(/^\/uploads\//, '/media/')}`
    }

    if (trimmed.startsWith('/')) {
      return `${API_BASE}${trimmed.replace(/^\/api\//, '/')}`
    }

    return `${API_BASE}/media/${trimmed.replace(/^\/+/, '')}`
  }

  function createEmptyBusinessProfile(
    channelCode?: string
  ): BusinessPageProfile {
    return {
      profileType: 'BUSINESS',
      displayName: null,
      bio: null,
      avatar: null,
      heroImages: [],
      blocks: [],
      region: null,
      industryDisplay: undefined,
      channelCode,
      placeFeedTypeCode: null
    }
  }

  function buildIndustryDisplay(
    detail: BusinessProfileDetailResponse
  ): string | undefined {
    const industryName =
      detail.industry?.industry?.name || null

    const subtypeName =
      detail.industry?.industrySubtype?.name || null

    if (industryName && subtypeName) {
      return `${industryName} · ${subtypeName}`
    }

    if (subtypeName) {
      return subtypeName
    }

    if (industryName) {
      return industryName
    }

    return undefined
  }

  function mapBusinessTypeCodeToLabel(
    businessTypeCode?: string | null
  ): string | undefined {
    if (businessTypeCode === 'STORE') {
      return '오프라인스토어'
    }

    if (businessTypeCode === 'SHOPPING_MALL') {
      return '온라인스토어'
    }

    if (businessTypeCode === 'FREELANCER') {
      return '프리랜서'
    }

    if (businessTypeCode === 'MOBILE_BIZ') {
      return '이동형'
    }

    return undefined
  }

  function resolveBusinessTypeLabel(
    detail: BusinessProfileDetailResponse
  ): string | undefined {
    const direct =
      mapBusinessTypeCodeToLabel(
        detail.profile?.businessTypeCode
      )

    if (direct) {
      return direct
    }

    const unknownDetail =
      detail as unknown as {
        businessTypeCode?: string | null
        profile?: {
          businessTypeCode?: string | null
        } | null
      }

    const mapped =
      mapBusinessTypeCodeToLabel(
      unknownDetail.businessTypeCode ||
        unknownDetail.profile?.businessTypeCode ||
        null
      )

    return mapped || DEFAULT_BUSINESS_TYPE_LABEL
  }

  function mapBlocks(
    detail: BusinessProfileDetailResponse
  ): BusinessBlock[] {
    if (!Array.isArray(detail.infoBlocks)) {
      return []
    }

    return detail.infoBlocks.map((block) => ({
      id: block.id,
      type: (block.blockType || 'TEXT') as ProfileBlockType,
      title: block.title ?? undefined,
      content: block.content ?? undefined,
      url: block.linkUrl ?? undefined,
      description: block.description ?? undefined,
      sortOrder: block.sortOrder
    }))
  }

  function mapHeroImages(
    detail: BusinessProfileDetailResponse
  ): BusinessHeroImage[] {
    if (!Array.isArray(detail.media?.heroImages)) {
      return []
    }

    return detail.media.heroImages.map((hero) => ({
      id: hero.id,
      sortOrder: hero.sortOrder,
      imageUrl: normalizeImageUrl(
        hero.imageUrl ??
        hero.filePath
      )
    }))
  }

  function mapAvatar(
    detail: BusinessProfileDetailResponse
  ): BusinessAvatar | null {
    if (!detail.media?.avatar) {
      return null
    }

    return {
      id: detail.media.avatar.id,
      filePath: detail.media.avatar.filePath ?? null,
      imageUrl: normalizeImageUrl(
        detail.media.avatar.imageUrl ??
        detail.media.avatar.filePath
      )
    }
  }

  function mapRegion(
    detail: BusinessProfileDetailResponse
  ): BusinessRegion | null {
    const region =
      detail.placeMeta?.activityRegion

    if (!region) {
      return null
    }

    return {
      id: region.id,
      name: region.name ?? null,
      fullName: region.fullName ?? null
    }
  }

  function mapBusinessProfile(
    detail: BusinessProfileDetailResponse
  ): BusinessPageProfile {
    return {
      profileType: 'BUSINESS',
      displayName: detail.profile.displayName,
      bio: detail.profile.bio,
      avatar: mapAvatar(detail),
      heroImages: mapHeroImages(detail),
      blocks: mapBlocks(detail),
      region: mapRegion(detail),
      businessTypeLabel: resolveBusinessTypeLabel(detail),
      industryDisplay: buildIndustryDisplay(detail),
      channelCode: detail.profile.channelCode,
      placeFeedTypeCode: detail.profile.placeFeedTypeCode ?? null
    }
  }

  function createFallbackInfoView(
    detail: BusinessProfileDetailResponse
  ): BusinessInfoView {
    return {
      bio: detail.profile?.bio ?? null,
      contactPhone: null,
      detailAddress: null,
      hours: null,
      sections: Array.isArray(detail.infoBlocks)
        ? detail.infoBlocks.map((block) => ({
            id: block.id,
            type: (block.blockType || 'TEXT') as
              | 'TEXT'
              | 'LINK'
              | 'IMAGE'
              | 'SECTION',
            title: block.title ?? undefined,
            value: block.content ?? null,
            content: block.content ?? null,
            url: block.linkUrl ?? null,
            imageUrl: null,
            sortOrder: block.sortOrder
          }))
        : []
    }
  }

  function resolveHeroBusinessStatus(
    hoursData: BusinessHoursApiState & {
      temporaryClosed?: 0 | 1
      isOpenNow?: boolean
    }
  ) {
    const dayKey =
      HERO_STATUS_DAY_ORDER[new Date().getDay()]

    const dayLabel =
      HERO_STATUS_DAY_LABEL[dayKey]

    const today =
      hoursData[dayKey]

    if (!today) {
      return {
        isOpen: false,
        label: '영업종료'
      }
    }

    if (hoursData.temporaryClosed === 1) {
      return {
        isOpen: false,
        label: '영업종료'
      }
    }

    if (today.isClosed) {
      return {
        isOpen: false,
        label: `${dayLabel} · 휴무`
      }
    }

    const isOpen =
      Boolean(hoursData.isOpenNow)

    const startTime =
      today.startTime || '--:--'

    const endTime =
      today.endTime || '--:--'

    const statusLabel =
      isOpen
        ? '영업중'
        : '영업종료'

    return {
      isOpen,
      label: `${statusLabel} ${dayLabel} 시작 : ${startTime} - 마감 : ${endTime}`
    }
  }

  const heroImages =
    useMemo(() => {
      if (!profile?.heroImages) {
        return []
      }

      return profile.heroImages
        .slice()
        .sort((
          a,
          b
        ) => {
          return a.sortOrder - b.sortOrder
        })
        .map((hero) => hero.imageUrl)
        .filter((
          imageUrl
        ): imageUrl is string => {
          return Boolean(imageUrl)
        })
    }, [
      profile?.heroImages
    ])

  const heroImageCount =
    useMemo(() => {
      return heroImages.length
    }, [
      heroImages.length
    ])

  const hasMultipleHeroImages =
    useMemo(() => {
      return heroImageCount > 1
    }, [
      heroImageCount
    ])

  const heroImageUrl =
    useMemo(() => {
      return heroImages[currentHeroIndex] || ''
    }, [
      heroImages,
      currentHeroIndex
    ])

  const profileImage =
    useMemo(() => {
      return (
        profile?.avatar?.imageUrl ||
        heroImageUrl ||
        ''
      )
    }, [
      profile?.avatar?.imageUrl,
      heroImageUrl
    ])

  const industryDisplay =
    profile?.industryDisplay ?? ''

  const businessTypeLabel =
    profile?.businessTypeLabel ?? ''

  const businessMetaLine =
    [businessTypeLabel, industryDisplay]
      .filter((value) => Boolean(value))
      .join(' · ')

  const businessName =
    profile?.displayName ||
    DEFAULT_BUSINESS_NAME

  const businessChannelShareUrl =
    useMemo(() => {
      if (profile?.channelCode) {
        const routePath =
          buildProfileStoreRoute(
            profile.channelCode,
            profile.placeFeedTypeCode
          )

        if (typeof window !== 'undefined') {
          return `${window.location.origin}${routePath}`
        }

        return routePath
      }

      return DEFAULT_BUSINESS_CHANNEL_URL
    }, [
      profile?.channelCode,
      profile?.placeFeedTypeCode
    ])

  const viewerImages =
    useMemo<ImageViewerItem[]>(() => {
      const items: ImageViewerItem[] = []

      if (profileImage) {
        items.push({
          imageUrl: profileImage
        })
      }

      for (const imageUrl of heroImages) {
        if (
          imageUrl &&
          !items.some((item) => item.imageUrl === imageUrl)
        ) {
          items.push({
            imageUrl
          })
        }
      }

      return items
    }, [
      profileImage,
      heroImages
    ])

  // SECTION 07 : STYLE DATA

  const heroControlBaseOpacity =
    isHeroHovered
      ? 1
      : 0.38

  const heroCountOpacity =
    isHeroHovered
      ? 1
      : 0.68

  const heroPrevButtonBackground =
    heroControlHover === 'prev'
      ? 'rgba(0, 0, 0, 0.78)'
      : isHeroHovered
        ? 'rgba(0, 0, 0, 0.58)'
        : 'rgba(0, 0, 0, 0.26)'

  const heroNextButtonBackground =
    heroControlHover === 'next'
      ? 'rgba(0, 0, 0, 0.78)'
      : isHeroHovered
        ? 'rgba(0, 0, 0, 0.58)'
        : 'rgba(0, 0, 0, 0.26)'

  const heroCountBackground =
    isHeroHovered
      ? 'rgba(0, 0, 0, 0.68)'
      : 'rgba(0, 0, 0, 0.42)'

  // SECTION 08 : API FUNCTION

  async function loadBusinessProfile() {
    try {
      setLoading(true)

      const stored =
        getStoredSession()

      const me =
        await getMe()

      if (
        !me?.user ||
        me.user.profileType !== 'BUSINESS'
      ) {
        router.replace('/profile')
        return
      }

      const channelCode =
        me.user.channelCode

      if (!channelCode) {
        setProfile(
          createEmptyBusinessProfile()
        )
        setInfoView(null)
        return
      }

      const detail =
        await getBusinessProfileDetail(channelCode)

      const mappedProfile =
        mapBusinessProfile(
          detail as BusinessProfileDetailResponse
        )

      setProfile(mappedProfile)

      try {
        const hoursData =
          await getBusinessHoursSetting(
            detail?.profile?.id ?? null,
            channelCode
          )

        const heroStatus =
          resolveHeroBusinessStatus(hoursData)

        setHeroBusinessIsOpen(heroStatus.isOpen)
        setHeroBusinessStatusLabel(heroStatus.label)
      } catch (hoursError) {
        console.error(
          'BUSINESS HOURS LOAD FAILED',
          hoursError
        )

        setHeroBusinessIsOpen(
          mappedProfile.region?.name !== '영업종료'
        )
        setHeroBusinessStatusLabel('영업종료')
      }

      try {
        const info =
          await getBusinessInfoView(channelCode)

        console.log(
          'BUSINESS INFO RESPONSE',
          info
        )

        setInfoView(info)
      } catch (infoError) {
        console.error(
          'BUSINESS INFO LOAD FAILED',
          infoError
        )

        setInfoView(
          createFallbackInfoView(
            detail as BusinessProfileDetailResponse
          )
        )
      }
    } catch (error) {
      console.error(
        'BUSINESS PROFILE LOAD FAILED',
        error
      )

      router.replace('/')
    } finally {
      setLoading(false)
    }
  }

  async function loadBusinessMenus() {
    try {
      const data =
        await getBusinessMenus()

      if (!Array.isArray(data)) {
        setMenus([])
        setActiveTab('info')
        return
      }

      const activeMenus =
        data
          .filter((menu: BusinessMenu) => {
            return menu.isActive
          })
          .sort((
            a: BusinessMenu,
            b: BusinessMenu
          ) => {
            return a.sortOrder - b.sortOrder
          })

      setMenus(activeMenus)
      setActiveTab('info')
    } catch (error) {
      console.error(
        'BUSINESS MENUS LOAD FAILED',
        error
      )

      setMenus([])
      setActiveTab('info')
    }
  }

  // SECTION 09 : EVENT FUNCTION

  function handleTabClick(
    tab: TabType
  ) {
    setActiveTab(tab)
  }

  function handleOpenBusinessSettings() {
    router.push(BUSINESS_SETTINGS_PATH)
  }

  function handleOpenBusinessHours() {
    router.push(BUSINESS_HOURS_SETTINGS_PATH)
  }

  function handleOpenCreatePost() {
    router.push(BUSINESS_CONTENT_CREATE_PATH)
  }

  function handleOpenStoreView() {
    const channelCode = profile?.channelCode
    if (!channelCode) {
      return
    }

    router.push(
      buildProfileStoreRoute(
        channelCode,
        profile?.placeFeedTypeCode
      )
    )
  }

  function handleOpenQrCode() {
    setQrPopupOpen(true)
  }

  function handleCloseQrCode() {
    setQrPopupOpen(false)
  }

  function handleOpenImageViewer(
    imageUrl: string
  ) {
    const targetIndex =
      viewerImages.findIndex((item) => {
        return item.imageUrl === imageUrl
      })

    if (targetIndex < 0) {
      return
    }

    setImageViewerIndex(targetIndex)
    setImageViewerOpen(true)
  }

  function handleCloseImageViewer() {
    setImageViewerOpen(false)
  }

  function handlePrevImage() {
    setImageViewerIndex((prev) => {
      return Math.max(
        0,
        prev - 1
      )
    })
  }

  function handleNextImage() {
    setImageViewerIndex((prev) => {
      return Math.min(
        viewerImages.length - 1,
        prev + 1
      )
    })
  }

  function handlePrevHeroImage(
    event: MouseEvent<HTMLButtonElement>
  ) {
    event.stopPropagation()

    if (!hasMultipleHeroImages) {
      return
    }

    setCurrentHeroIndex((prev) => {
      if (prev <= 0) {
        return heroImageCount - 1
      }

      return prev - 1
    })
  }

  function handleNextHeroImage(
    event: MouseEvent<HTMLButtonElement>
  ) {
    event.stopPropagation()

    if (!hasMultipleHeroImages) {
      return
    }

    setCurrentHeroIndex((prev) => {
      if (prev >= heroImageCount - 1) {
        return 0
      }

      return prev + 1
    })
  }

  function handleHeroMouseEnter() {
    setHeroHovered(true)
  }

  function handleHeroMouseLeave() {
    setHeroHovered(false)
    setHeroControlHover(null)
  }

  function handlePrevControlMouseEnter() {
    setHeroControlHover('prev')
  }

  function handleNextControlMouseEnter() {
    setHeroControlHover('next')
  }

  function handleControlMouseLeave() {
    setHeroControlHover(null)
  }

  // SECTION 10 : EFFECT

  useEffect(() => {
    let cancelled =
      false

    const run = async () => {
      if (cancelled) {
        return
      }

      await loadBusinessProfile()
    }

    run()

    return () => {
      cancelled = true
    }
  }, [
    router
  ])

  useEffect(() => {
    let cancelled =
      false

    const run = async () => {
      if (cancelled) {
        return
      }

      await loadBusinessMenus()
    }

    run()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (heroImages.length === 0) {
      setCurrentHeroIndex(0)
      return
    }

    if (currentHeroIndex > heroImages.length - 1) {
      setCurrentHeroIndex(0)
    }
  }, [
    heroImages.length,
    currentHeroIndex
  ])

  // SECTION 11 : UI BLOCK

  const LoadingUI = (
    <main className={styles.page}>
      <div className={styles.loadingBox}>
        濡쒕뵫以?..
      </div>
    </main>
  )

  if (loading) {
    return LoadingUI
  }

  if (!profile) {
    return null
  }

  const safeProfile =
    profile

  const HeroUI = (
    <div
      className={styles.heroImage}
      style={{
        position: 'relative'
      }}
      onMouseEnter={handleHeroMouseEnter}
      onMouseLeave={handleHeroMouseLeave}
    >
      <button
        type="button"
        onClick={() => {
          if (heroImageUrl) {
            handleOpenImageViewer(heroImageUrl)
          }
        }}
        aria-label="????대?吏 ?ш쾶 蹂닿린"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          padding: 0,
          border: 0,
          background: 'transparent',
          cursor: heroImageUrl ? 'pointer' : 'default'
        }}
      >
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt={`${businessName} ????대?吏`}
            className={styles.heroImageFile}
          />
        ) : (
          <div className={styles.heroPlaceholder} />
        )}
      </button>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 2
        }}
      >
        <HeroOverlayStatus
          isOpen={heroBusinessIsOpen}
          label={heroBusinessStatusLabel}
        />
      </div>

      {hasMultipleHeroImages && (
        <>
          <button
            type="button"
            onClick={handlePrevHeroImage}
            onMouseEnter={handlePrevControlMouseEnter}
            onMouseLeave={handleControlMouseLeave}
            aria-label="이전 대표 이미지"
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              zIndex: 3,
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.62)',
              borderRadius: 999,
              background: heroPrevButtonBackground,
              color: '#ffffff',
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1,
              opacity: heroControlBaseOpacity,
              cursor: 'pointer',
              transform: 'translateY(-50%)',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.22)',
              backdropFilter: 'blur(6px)',
              transition:
                'opacity 0.16s ease, background 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease'
            }}
          >
            {'<'}
          </button>

          <button
            type="button"
            onClick={handleNextHeroImage}
            onMouseEnter={handleNextControlMouseEnter}
            onMouseLeave={handleControlMouseLeave}
            aria-label="다음 대표 이미지"
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              zIndex: 3,
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.62)',
              borderRadius: 999,
              background: heroNextButtonBackground,
              color: '#ffffff',
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1,
              opacity: heroControlBaseOpacity,
              cursor: 'pointer',
              transform: 'translateY(-50%)',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.22)',
              backdropFilter: 'blur(6px)',
              transition:
                'opacity 0.16s ease, background 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease'
            }}
          >
            {'>'}
          </button>

          <div
            aria-label="대표 이미지 개수"
            style={{
              position: 'absolute',
              right: 14,
              bottom: 14,
              zIndex: 3,
              minWidth: 54,
              height: 30,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 12px',
              border: '1px solid rgba(255, 255, 255, 0.58)',
              borderRadius: 999,
              background: heroCountBackground,
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 900,
              lineHeight: 1,
              opacity: heroCountOpacity,
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.22)',
              backdropFilter: 'blur(6px)',
              transition:
                'opacity 0.16s ease, background 0.16s ease, box-shadow 0.16s ease'
            }}
          >
            {currentHeroIndex + 1}/{heroImageCount}
          </div>
        </>
      )}
    </div>
  )

  const ProfileHeaderUI = (
    <div className={styles.profileHead}>
      <div className={styles.profileTopLine}>
        <button
          type="button"
          className={styles.avatarFrame}
          onClick={() => {
            if (profileImage) {
              handleOpenImageViewer(profileImage)
            }
          }}
          aria-label="프로필 이미지 크게 보기"
          style={{
            padding: 0,
            cursor: profileImage ? 'pointer' : 'default'
          }}
        >
          {profileImage ? (
            <img
              src={profileImage}
              alt={`${businessName} 프로필 이미지`}
              className={styles.avatarImage}
            />
          ) : (
            <div className={styles.avatarPlaceholder} />
          )}
        </button>

        <div className={styles.profileTextBlock}>
          <div className={styles.profileMeta}>
            <h1 className={styles.profileName}>
              {businessName}
            </h1>

            {businessMetaLine && (
              <span className={styles.profileTypeLabel}>
                {businessMetaLine}
              </span>
            )}
          </div>

          <div className={styles.profileSubLine}>
            <span
              className={styles.ratingInline}
              aria-label={`총점 ${MOCK_TOTAL_SCORE.toFixed(1)}, 방문자 리뷰 ${MOCK_REVIEW_COUNT.toLocaleString()}개`}
            >
              <span className={styles.ratingStar}>
                *
              </span>

              <span className={styles.ratingScore}>
                {MOCK_TOTAL_SCORE.toFixed(1)}
              </span>

              <span className={styles.ratingReviewText}>
                방문자 리뷰 {MOCK_REVIEW_COUNT.toLocaleString()}
              </span>
            </span>

            <span className={styles.subscriberText}>
              팔로워 {DEFAULT_SUBSCRIBER_COUNT.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={styles.storeViewButton}
          onClick={handleOpenStoreView}
          disabled={!profile?.channelCode}
        >
          스토어뷰
        </button>
      </div>
    </div>
  )

  const ActionUI = (
    <div className={styles.actionGroup}>
      <button
        type="button"
        className={styles.actionButton}
        onClick={handleOpenBusinessHours}
      >
        영업설정
      </button>

      <button
        type="button"
        className={styles.actionButton}
        onClick={handleOpenBusinessSettings}
      >
        비즈니스 설정
      </button>

      <button
        type="button"
        className={styles.actionButton}
        onClick={handleOpenCreatePost}
      >
        게시물 사진 등록
      </button>

      <button
        type="button"
        className={styles.actionButton}
        onClick={handleOpenQrCode}
      >
        URL 경로(QR코드)
      </button>
    </div>
  )

  const BusinessProfileHeaderUI = (
    <section className={styles.mediaColumn}>
      {HeroUI}

      <div className={styles.mediaProfileBlock}>
        {ProfileHeaderUI}

        {ActionUI}
      </div>
    </section>
  )

  const TabBarUI = (
    <div className={styles.tabPanel}>
      <TabBar
        activeTab={activeTab}
        onClick={handleTabClick}
        menus={menus}
      />
    </div>
  )

  const ActiveContentUI = (
    <section
      ref={contentRef}
      className={styles.contentPanel}
    >
      {activeTab === 'summary' && (
        <BusinessSummary
          bio={infoView?.bio ?? safeProfile.bio ?? null}
        />
      )}

      {activeTab === 'info' && (
        <BusinessInfo
          bio={null}
          contactPhone={infoView?.contactPhone ?? null}
          regionName={safeProfile.region?.fullName ?? null}
          detailAddress={infoView?.detailAddress ?? null}
          hours={infoView?.hours ?? null}
          sections={infoView?.sections ?? []}
        />
      )}

      {activeTab === 'GENERAL' && (
        <BusinessGeneralPosts />
      )}

      {activeTab === 'GALLERY' && (
        <BusinessGallery
          channelCode={safeProfile.channelCode ?? ''}
        />
      )}

      {activeTab === 'PRODUCT' && (
        <BusinessProducts />
      )}

      {activeTab === 'EVENT' && (
        <BusinessEvents />
      )}

      {activeTab === 'REVIEW' && (
        <BusinessReviews />
      )}
    </section>
  )

  const ContentColumnUI = (
    <section className={styles.contentColumn}>
      {TabBarUI}

      {ActiveContentUI}
    </section>
  )

  const QRPopupUI =
    isQrPopupOpen && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="비즈니스 QR코드"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: 'rgba(15, 23, 42, 0.72)'
        }}
        onClick={handleCloseQrCode}
      >
        <div
          style={{
            width: 330,
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            padding: 24,
            borderRadius: 26,
            background: '#ffffff',
            boxShadow: '0 28px 90px rgba(0,0,0,0.32)'
          }}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: 2,
              background: 'linear-gradient(90deg,#1877f2,#22c55e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            RAPUS
          </div>

          <div
            style={{
              color: '#111827',
              fontSize: 16,
              fontWeight: 900,
              textAlign: 'center',
              wordBreak: 'break-word'
            }}
          >
            {businessName}
          </div>

          <div
            style={{
              padding: 18,
              border: '1px solid #eef2f7',
              borderRadius: 22,
              background: '#ffffff',
              boxShadow: '0 12px 34px rgba(15, 23, 42, 0.08)'
            }}
          >
            <QRCode
              value={businessChannelShareUrl}
              size={180}
              bgColor="#ffffff"
              fgColor="#111827"
            />
          </div>

          <div
            style={{
              width: '100%',
              color: '#64748b',
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1.45,
              textAlign: 'center',
              wordBreak: 'break-all'
            }}
          >
            {businessChannelShareUrl}
          </div>

          <button
            type="button"
            onClick={handleCloseQrCode}
            style={{
              width: '100%',
              height: 42,
              border: 0,
              borderRadius: 999,
              background: '#111827',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            닫기
          </button>
        </div>
      </div>
    )

  const ImageViewerUI = (
    <ImageViewer
      open={isImageViewerOpen}
      images={viewerImages}
      index={imageViewerIndex}
      onClose={handleCloseImageViewer}
      onPrev={handlePrevImage}
      onNext={handleNextImage}
    />
  )

  const MainUI = (
    <main className={styles.page}>
      <section className={styles.shell}>
        <section className={styles.detailGrid}>
          {BusinessProfileHeaderUI}

          {ContentColumnUI}
        </section>
      </section>

      {QRPopupUI}

      {ImageViewerUI}
    </main>
  )

  // SECTION 12 : RETURN

  return MainUI
}

// SECTION 13 : TAB BAR

function TabBar({
  activeTab,
  onClick,
  menus
}: TabBarProps) {
  const tabScrollRef =
    useRef<HTMLDivElement | null>(null)

  const [canScrollLeft, setCanScrollLeft] =
    useState(false)

  const [canScrollRight, setCanScrollRight] =
    useState(false)

  const tabs =
    useMemo<TabItem[]>(() => {
      const menuWithFallbacks =
        ensureFixedMenus(menus)

      return menuWithFallbacks
        .filter((menu) => menu.isActive)
        .map((menu) => ({
          key: mapPostTypeToTab(menu),
          label: menu.title
        }))
    }, [
      menus
    ])

  const updateScrollState =
    useCallback(() => {
      const element =
        tabScrollRef.current

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

      setCanScrollLeft(
        element.scrollLeft > 1
      )

      setCanScrollRight(
        element.scrollLeft < maxScrollLeft - 1
      )
    }, [])

  const handleScrollLeft =
    useCallback(() => {
      tabScrollRef.current?.scrollBy({
        left: -TAB_SCROLL_AMOUNT,
        behavior: 'smooth'
      })
    }, [])

  const handleScrollRight =
    useCallback(() => {
      tabScrollRef.current?.scrollBy({
        left: TAB_SCROLL_AMOUNT,
        behavior: 'smooth'
      })
    }, [])

  useEffect(() => {
    const element =
      tabScrollRef.current

    updateScrollState()

    if (!element) {
      return
    }

    const handleScroll = () => {
      updateScrollState()
    }

    const handleResize = () => {
      updateScrollState()
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
        updateScrollState,
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
    updateScrollState
  ])

  return (
    <div className={styles.tabOuter}>
      {canScrollLeft && (
        <button
          type="button"
          aria-label="이전 메뉴"
          onClick={handleScrollLeft}
          className={`${styles.tabScrollButton} ${styles.tabScrollButtonLeft}`}
        >
          {'<'}
        </button>
      )}

      <div
        ref={tabScrollRef}
        className={styles.tabScroll}
      >
        {tabs.map((tab, index) => {
          const active =
            activeTab === tab.key

          const displayLabel =
            truncateTabLabel(tab.label)

          return (
            <button
              key={`${tab.key}-${index}`}
              type="button"
              title={tab.label}
              onClick={() => onClick(tab.key)}
              className={
                active
                  ? `${styles.tabItem} ${styles.tabItemActive}`
                  : styles.tabItem
              }
            >
              {displayLabel}
            </button>
          )
        })}
      </div>

      {canScrollRight && (
        <button
          type="button"
          aria-label="다음 메뉴"
          onClick={handleScrollRight}
          className={`${styles.tabScrollButton} ${styles.tabScrollButtonRight}`}
        >
          {'>'}
        </button>
      )}
    </div>
  )
}

// SECTION 14 : MAP

function mapPostTypeToTab(
  menu: BusinessMenu
): TabType {
  const rawPostType =
    menu.postType?.trim()

  if (!rawPostType) {
    return 'info'
  }

  const normalizedPostType =
    rawPostType.toUpperCase()

  if (normalizedPostType === 'INFO') {
    return 'info'
  }

  if (normalizedPostType === 'SUMMARY') {
    return 'summary'
  }

  if (normalizedPostType === 'GENERAL') {
    return 'GENERAL'
  }

  if (normalizedPostType === 'GALLERY') {
    return 'GALLERY'
  }

  if (normalizedPostType === 'PRODUCT') {
    return 'PRODUCT'
  }

  if (normalizedPostType === 'EVENT') {
    return 'EVENT'
  }

  if (normalizedPostType === 'REVIEW') {
    return 'REVIEW'
  }

  return 'info'
}

function ensureFixedMenus(
  menus: BusinessMenu[]
): BusinessMenu[] {
  const normalizedMenus =
    menus.map((menu, index) => ({
      ...menu,
      postType: menu.postType?.trim()?.toUpperCase() ?? '',
      sortOrder: Number(menu.sortOrder || index + 1),
      isActive: menu.isActive !== false
    }))

  const requiredFixedMenus: BusinessMenu[] = [
    {
      id: -1,
      title: '안내',
      postType: 'INFO',
      sortOrder: 0,
      isActive: true
    },
    {
      id: -2,
      title: '소개',
      postType: 'SUMMARY',
      sortOrder: 0,
      isActive: true
    },
    {
      id: -3,
      title: '리뷰',
      postType: 'REVIEW',
      sortOrder: 0,
      isActive: true
    }
  ]

  const existingTypeSet =
    new Set(
      normalizedMenus.map((menu) => menu.postType)
    )

  const maxSortOrder =
    normalizedMenus.reduce((max, menu) => {
      return Math.max(max, menu.sortOrder)
    }, 0)

  const fallbackMenus =
    requiredFixedMenus
      .filter((menu) => !existingTypeSet.has(menu.postType || ''))
      .map((menu, index) => ({
        ...menu,
        sortOrder: maxSortOrder + index + 1
      }))

  return [...normalizedMenus, ...fallbackMenus]
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

// SECTION 15 : UTIL

function truncateTabLabel(
  label: string
): string {
  const normalizedLabel =
    label.trim()

  const characters =
    Array.from(normalizedLabel)

  if (characters.length <= TAB_LABEL_MAX_LENGTH) {
    return normalizedLabel
  }

  return `${characters.slice(0, TAB_LABEL_MAX_LENGTH - 1).join('')}…`
}

// SECTION FINAL : VALIDATION

/*
VALIDATION:
- ROOT ?ы븿 ?꾨즺
- ?⑥씪 page.tsx ?듭퐫??異쒕젰 ?꾨즺
- SECTION 援ъ“ ?좎? ?꾨즺
- BUSINESS ?꾨줈???ㅻ뜑 ?섎떒 regionText ?쒖떆 ?쒓굅 ?꾨즺
- ?덈궡 ??BusinessInfo regionName ?꾨떖 ?좎? ?꾨즺
- 紐⑹뾽 ?됱젏 ?곸닔 MOCK_TOTAL_SCORE / MOCK_REVIEW_COUNT ?좎? ?꾨즺
- ?됱젏 UI瑜??꾨컮? ?ㅻⅨ履??띿뒪???곸뿭 / ?낆쥌 ?쒖떆 諛붾줈 ?쇱そ??諛곗튂 ?좎? ?꾨즺
- CSS Module ratingInline / ratingStar / ratingScore / ratingReviewText ?대옒???ъ슜 ?좎? ?꾨즺
- ?대? ImageViewer 而댄룷?뚰듃 ?쒓굅 ?좎? ?꾨즺
- 怨듭슜 ImageViewer import ?곸슜 ?좎? ?꾨즺
- ImageViewerItem 濡쒖뺄 ????곸슜 ?꾨즺
- ?덉뼱濡??대?吏 currentHeroIndex ?щ씪?대뱶 ?곹깭 ?좎? ?꾨즺
- ?덉뼱濡??곸뿭 hover ?곹깭 isHeroHovered ?좎? ?꾨즺
- ?덉뼱濡?醫뚯슦 踰꾪듉 hover ?곹깭 heroControlHover ?좎? ?꾨즺
- 留덉슦???ㅻ쾭 ???щ챸 釉붾옓 踰꾪듉 媛뺤“ ?곸슜 ?좎? ?꾨즺
- ?덉뼱濡??대?吏 1/N ?쇱슫??移댁슫??諛곗? ?щ챸 釉붾옓 hover ?곸슜 ?좎? ?꾨즺
- ?덉뼱濡??대?吏 ?대┃ ???꾩옱 ?대?吏 湲곗? 酉곗뼱 ?곌껐 ?좎? ?꾨즺
- ?꾨컮? ?대?吏 ?대┃ 酉곗뼱 ?곌껐 ?좎? ?꾨즺
- API / DB / Service 蹂寃??놁쓬
*/

