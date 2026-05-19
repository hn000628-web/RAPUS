// FILE : frontend/app/(after-login)/profile/business/create/posts/page.tsx
// ROOT : frontend/app/(after-login)/profile/business/create/posts/page.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS POST CREATE PAGE
// CHANGE SUMMARY :
// - getProfileCategories import 제거 유지
// - getProfileCategories 호출 제거 유지
// - /api/business/profile/:profileId/categories 404 제거 유지
// - authApi.ts getMe() 기반 로그인 컨텍스트 조회 적용 유지
// - getMyBusinessProfileFull() 기반 프로필 업종 조회 유지
// - getMyBusinessProfileFull() 기반 프로필 지역 조회 추가
// - 새로고침 시 businessPostCreateRegion 값이 없으면 프로필 지역을 tradeRegionId에 자동 세팅
// - 비즈니스 포스트 작성 기본 지역설정 ON 구조 적용
// - profileIndustryLabel state 유지
// - BusinessPostFields에 profileIndustryLabel 전달 유지
// - 업종 미설정 BUSINESS 프로필은 포스트 등록 차단 유지
// - profileId + channelCode 단일 귀속 컨텍스트 state 유지
// - BUSINESS 전용 createBusinessPost API 연결 유지
// - 이미지 저장은 mediaApi.ts uploadBusinessPostImage 사용 유지
// - businessPostCreateRegion sessionStorage 값 반영 유지
// - PRODUCT 타입에서만 priceAmount 전달 유지
// - GENERAL / EVENT 타입에서는 priceAmount null 고정 유지
// - category가 PRODUCT가 아니면 price state 자동 초기화 유지
// - 등록 성공 후 폼 입력값 / 이미지 / 카테고리 / 상태 초기화 유지
// - 등록 성공 후 비즈니스 기본 지역 ON 복구 유지
// - 기존 UI / 스타일 구조 유지

'use client'

// SECTION 01 : IMPORT

import {
  useEffect,
  useState
} from 'react'

import type {
  CSSProperties
} from 'react'

import type {
  MeResponse
} from '@/lib/authApi'

import {
  getMe
} from '@/lib/authApi'

import type {
  BusinessPostType
} from './components/businessPostTypes'

import StatusToggle from '../../../business/create/posts/components/statusToggle'
import ImageUploader from '../../../business/create/posts/components/ImageUploader'
import BusinessPostFields from './components/BusinessPostFields'

import {
  uploadBusinessPostImage
} from '@/lib/business/mediaApi'

import {
  createBusinessPost
} from '@/lib/business/business-posts-api'

import {
  getMyBusinessProfileFull
} from '@/lib/business/profile-settings-api'

// SECTION 02 : CONSTANT

const POST_REGION_STORAGE_KEY = 'businessPostCreateRegion'

type ProfileType = 'GENERAL' | 'BUSINESS'

type StoredPostRegion = {
  id: number
  name: string
  fullName: string
}

type BusinessMeUser =
  MeResponse['user'] & {
    activityRegionId?: number | null
    activityRegionName?: string | null
    feedRegionId?: number | null
    feedRegionName?: string | null
  }

type BusinessMeResponse =
  MeResponse & {
    user: BusinessMeUser
  }

type BusinessRegionUnknown = {
  id?: number | null
  name?: string | null
  fullName?: string | null
  pathName?: string | null
}

type BusinessProfileFullUnknown = {
  profile?: {
    id?: number
    activityRegionId?: number | null
    feedRegionId?: number | null
    primaryIndustryId?: number | null
    primaryIndustrySubtypeId?: number | null
    primaryIndustryCode?: string | null
    primaryIndustrySubtypeCode?: string | null
  }

  placeMeta?: {
    activityRegion?: BusinessRegionUnknown | null
    feedRegion?: BusinessRegionUnknown | null
    detailAddress?: string | null
  }

  activityRegionId?: number | null
  feedRegionId?: number | null
  activityRegionName?: string | null
  feedRegionName?: string | null

  industry?: {
    code?: string | null
    name?: string | null
    name_ko?: string | null
    nameKo?: string | null
  }

  industrySubtype?: {
    code?: string | null
    name?: string | null
    name_ko?: string | null
    nameKo?: string | null
  }

  primaryIndustry?: {
    code?: string | null
    name?: string | null
    name_ko?: string | null
    nameKo?: string | null
  }

  primaryIndustrySubtype?: {
    code?: string | null
    name?: string | null
    name_ko?: string | null
    nameKo?: string | null
  }

  industryMeta?: {
    label?: string | null
    industryCode?: string | null
    industryName?: string | null
    industryNameKo?: string | null
    subtypeCode?: string | null
    subtypeName?: string | null
    subtypeNameKo?: string | null
  }

  businessIndustryLabel?: string | null
  industryLabel?: string | null
}

type ResolvedBusinessProfileRegion = {
  id: number
  name: string
}

// SECTION 03 : COMPONENT

export default function CreatePage() {
  const [profileType, setProfileType] =
    useState<ProfileType>('GENERAL')

  const [profileId, setProfileId] =
    useState<number | null>(null)

  const [channelCode, setChannelCode] =
    useState<string | null>(null)

  const [profileRegionId, setProfileRegionId] =
    useState<number | null>(null)

  const [profileRegionName, setProfileRegionName] =
    useState<string | null>(null)

  const [profileIndustryLabel, setProfileIndustryLabel] =
    useState<string | null>(null)

  const [meLoading, setMeLoading] =
    useState(true)

  const [category, setCategory] =
    useState<BusinessPostType | ''>('')

  const [tradeRegionId, setTradeRegionId] =
    useState<number | null>(null)

  const [status, setStatus] =
    useState<'ACTIVE' | 'DRAFT'>('ACTIVE')

  const [title, setTitle] =
    useState('')

  const [keywords, setKeywords] =
    useState('')

  const [content, setContent] =
    useState('')

  const [price, setPrice] =
    useState('')

  const [images, setImages] =
    useState<File[]>([])

  const [loading, setLoading] =
    useState(false)

  const [regionSelectorResetKey, setRegionSelectorResetKey] =
    useState(0)

  const isDisabled =
    loading || meLoading

  // SECTION 04 : DATA FUNCTION

  function hasStoredPostRegion() {
    if (typeof window === 'undefined') {
      return false
    }

    return Boolean(
      sessionStorage.getItem(POST_REGION_STORAGE_KEY)
    )
  }

  function loadStoredPostRegion() {
    const stored =
      sessionStorage.getItem(POST_REGION_STORAGE_KEY)

    if (!stored) {
      return
    }

    try {
      const parsed =
        JSON.parse(stored) as StoredPostRegion

      if (!parsed.id) {
        return
      }

      setTradeRegionId(parsed.id)

      setProfileRegionId(parsed.id)

      setProfileRegionName(
        parsed.fullName ||
        parsed.name ||
        null
      )
    } catch (error) {
      console.error(
        'business post region parse error',
        error
      )
    }
  }

  function resetFormAfterSubmit() {
    setCategory('')

    if (profileRegionId !== null) {
      setTradeRegionId(profileRegionId)
    } else {
      setTradeRegionId(null)
    }

    setStatus('ACTIVE')

    setTitle('')
    setKeywords('')
    setContent('')
    setPrice('')
    setImages([])

    setRegionSelectorResetKey((prev) => prev + 1)

    sessionStorage.removeItem(
      POST_REGION_STORAGE_KEY
    )
  }

  function normalizePriceAmount(
    value: string
  ): number | null {
    const normalized =
      value.replace(/,/g, '').trim()

    if (!normalized) {
      return null
    }

    const amount =
      Number(normalized)

    if (!Number.isFinite(amount)) {
      return null
    }

    return Math.trunc(amount)
  }

  function resolveProfileIndustryLabel(
    data: BusinessProfileFullUnknown
  ): string | null {
    const directLabel =
      data.businessIndustryLabel ||
      data.industryLabel ||
      data.industryMeta?.label ||
      null

    if (directLabel) {
      return directLabel
    }

    const industryName =
      data.industryMeta?.industryNameKo ||
      data.industryMeta?.industryName ||
      data.primaryIndustry?.name_ko ||
      data.primaryIndustry?.nameKo ||
      data.primaryIndustry?.name ||
      data.industry?.name_ko ||
      data.industry?.nameKo ||
      data.industry?.name ||
      data.profile?.primaryIndustryCode ||
      data.industryMeta?.industryCode ||
      null

    const subtypeName =
      data.industryMeta?.subtypeNameKo ||
      data.industryMeta?.subtypeName ||
      data.primaryIndustrySubtype?.name_ko ||
      data.primaryIndustrySubtype?.nameKo ||
      data.primaryIndustrySubtype?.name ||
      data.industrySubtype?.name_ko ||
      data.industrySubtype?.nameKo ||
      data.industrySubtype?.name ||
      data.profile?.primaryIndustrySubtypeCode ||
      data.industryMeta?.subtypeCode ||
      null

    if (
      industryName &&
      subtypeName
    ) {
      return `${industryName}(${subtypeName})`
    }

    if (industryName) {
      return industryName
    }

    return null
  }

  function resolveProfileRegionLabel(
    region: BusinessRegionUnknown | null | undefined,
    fallbackName?: string | null
  ): string | null {
    if (!region && !fallbackName) {
      return null
    }

    return (
      region?.fullName ||
      region?.pathName ||
      region?.name ||
      fallbackName ||
      null
    )
  }

  function resolveBusinessProfileRegion(
    data: BusinessProfileFullUnknown
  ): ResolvedBusinessProfileRegion | null {
    const activityRegion =
      data.placeMeta?.activityRegion ?? null

    const feedRegion =
      data.placeMeta?.feedRegion ?? null

    const activityRegionId =
      activityRegion?.id ??
      data.activityRegionId ??
      data.profile?.activityRegionId ??
      null

    const feedRegionId =
      feedRegion?.id ??
      data.feedRegionId ??
      data.profile?.feedRegionId ??
      null

    const regionId =
      activityRegionId ||
      feedRegionId ||
      null

    if (!regionId) {
      return null
    }

    const regionName =
      resolveProfileRegionLabel(
        activityRegion,
        data.activityRegionName
      ) ||
      resolveProfileRegionLabel(
        feedRegion,
        data.feedRegionName
      ) ||
      '프로필 지역'

    return {
      id: regionId,
      name: regionName
    }
  }

  function applyProfileRegionDefault(
    region: ResolvedBusinessProfileRegion | null
  ) {
    if (!region) {
      return
    }

    setProfileRegionId(region.id)
    setProfileRegionName(region.name)

    if (!hasStoredPostRegion()) {
      setTradeRegionId(region.id)
      setRegionSelectorResetKey((prev) => prev + 1)
    }
  }

  async function loadBusinessProfileMeta() {
    try {
      const data =
        await getMyBusinessProfileFull() as BusinessProfileFullUnknown

      const industryLabel =
        resolveProfileIndustryLabel(data)

      const profileRegion =
        resolveBusinessProfileRegion(data)

      setProfileIndustryLabel(industryLabel)

      applyProfileRegionDefault(profileRegion)
    } catch (error) {
      console.error(
        'business profile meta load error',
        error
      )

      setProfileIndustryLabel(null)
    }
  }

  async function uploadPostImages(
    files: File[],
    ownerChannelCode: string
  ): Promise<number[]> {
    if (files.length === 0) {
      return []
    }

    const assetIds: number[] = []

    for (let index = 0; index < files.length; index += 1) {
      const result =
        await uploadBusinessPostImage(
          files[index],
          {
            channelCode: ownerChannelCode
          },
          undefined,
          index + 1
        )

      assetIds.push(result.assetId)
    }

    return assetIds
  }

  // SECTION 05 : INIT

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const data =
          await getMe() as BusinessMeResponse

        if (data.ok && data.user?.profileType) {
          setProfileType(data.user.profileType)

          const resolvedProfileId =
            Number(data.user.profileId)

          const resolvedChannelCode =
            String(data.user.channelCode || '')

          if (resolvedProfileId) {
            setProfileId(resolvedProfileId)
          }

          if (resolvedChannelCode) {
            setChannelCode(resolvedChannelCode)
          }

          const activityRegionId =
            data.user.activityRegionId ?? null

          const feedRegionId =
            data.user.feedRegionId ?? null

          const activityRegionName =
            data.user.activityRegionName ?? null

          const feedRegionName =
            data.user.feedRegionName ?? null

          const resolvedRegionId =
            activityRegionId ||
            feedRegionId ||
            null

          const resolvedRegionName =
            activityRegionName ||
            feedRegionName ||
            null

          if (resolvedRegionId) {
            setProfileRegionId(resolvedRegionId)

            if (!hasStoredPostRegion()) {
              setTradeRegionId(resolvedRegionId)
            }
          }

          if (resolvedRegionName) {
            setProfileRegionName(resolvedRegionName)
          }

          if (data.user.profileType === 'BUSINESS') {
            await loadBusinessProfileMeta()
          }
        }

        loadStoredPostRegion()
      } catch (error) {
        console.error(error)
        loadStoredPostRegion()
      } finally {
        setMeLoading(false)
      }
    }

    void fetchMe()
  }, [])

  // SECTION 06 : CATEGORY EFFECT

  useEffect(() => {
    if (category !== 'PRODUCT' && price) {
      setPrice('')
    }
  }, [
    category,
    price
  ])

  // SECTION 07 : SUBMIT

  const handleSubmit = async () => {
    if (isDisabled) {
      return
    }

    if (!profileId || !channelCode) {
      alert('비즈니스 프로필 정보를 찾을 수 없습니다.')
      return
    }

    if (profileType !== 'BUSINESS') {
      alert('비즈니스 프로필에서만 게시물을 작성할 수 있습니다.')
      return
    }

    if (!profileIndustryLabel) {
      alert('피드 노출을 위해 비즈니스 업종 설정이 필요합니다.')
      return
    }

    if (!category) {
      alert('카테고리 선택')
      return
    }

    if (!title.trim()) {
      alert('제목 입력')
      return
    }

    if (!content.trim()) {
      alert('내용 입력')
      return
    }

    try {
      setLoading(true)

      const imageAssetIds =
        await uploadPostImages(
          images,
          channelCode
        )

      const priceAmount =
        category === 'PRODUCT'
          ? normalizePriceAmount(price)
          : null

      await createBusinessPost({
        profileId,
        channelCode,
        title: title.trim(),
        content: content.trim(),
        postType: category,
        regionId: tradeRegionId,
        priceAmount,
        eventStartAt: null,
        eventEndAt: null,
        status,
        imageAssetIds
      })

      resetFormAfterSubmit()

      alert('등록 완료')
    } catch (error) {
      console.error(error)
      alert('실패')
    } finally {
      setLoading(false)
    }
  }

  // SECTION 08 : RETURN

  return (
    <div style={pageStyle}>
      <div style={wrapperStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>
            게시물 작성
          </h1>

          <StatusToggle
            status={status}
            setStatus={setStatus}
            loading={isDisabled}
          />

          <div style={uploadPanelWrap}>
            <ImageUploader
              images={images}
              setImages={setImages}
              loading={isDisabled}
            />
          </div>

          <BusinessPostFields
            key={regionSelectorResetKey}
            category={category}
            setCategory={setCategory}
            tradeRegionId={tradeRegionId}
            setTradeRegionId={setTradeRegionId}
            profileRegionId={profileRegionId}
            profileRegionName={profileRegionName}
            profileIndustryLabel={profileIndustryLabel}
            title={title}
            setTitle={setTitle}
            keywords={keywords}
            setKeywords={setKeywords}
            content={content}
            setContent={setContent}
            price={price}
            setPrice={setPrice}
            loading={isDisabled}
          />

          <div style={buttonWrap}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isDisabled}
              style={{
                ...buttonStyle,
                opacity: isDisabled ? 0.6 : 1
              }}
            >
              {loading ? '등록중...' : '등록하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// SECTION 09 : STYLE

const pageStyle: CSSProperties = {
  background: '#f0f2f5',
  minHeight: '100vh'
}

const wrapperStyle: CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '16px'
}

const cardStyle: CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
}

const titleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 20
}

const uploadPanelWrap: CSSProperties = {
  marginTop: 12,
  marginBottom: 16
}

const buttonWrap: CSSProperties = {
  marginTop: 24
}

const buttonStyle: CSSProperties = {
  width: '100%',
  padding: 14,
  borderRadius: 12,
  border: 'none',
  background: '#1877f2',
  color: '#fff',
  fontSize: 15,
  cursor: 'pointer'
}
