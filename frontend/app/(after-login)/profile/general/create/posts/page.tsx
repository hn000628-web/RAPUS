// FILE : frontend/app/(after-login)/feed/general/create/page.tsx
// ROOT : frontend/app/(after-login)/feed/general/create/page.tsx
// STATUS : RULE SAFE / POST API UNIFIED WITH PHOTO FLOW / AUTH FETCH SAFE / CATEGORY CODE SAFE
// ROLE : GENERAL POST CREATE PAGE
// OUTPUT MODE : MODIFY

'use client'

// SECTION 01 : IMPORT

import { useEffect, useState } from 'react'

import type { Category } from '../../../types'

import StatusToggle from '../../../create/components/statusToggle'
import ImageUploader from '../../../create/components/ImageUploader'
import PersonalPostFields from '../../../create/components/personal/PersonalPostFields'

import { getMyProfile } from '@/lib/profileApi'
import { getMe } from '@/lib/authApi'
import { apiFetch } from '@/lib/api'

// SECTION 02 : CONSTANT

type ProfileType = 'GENERAL' | 'BUSINESS'

// SECTION 03 : COMPONENT

export default function CreatePage() {
  // SECTION 04 : STATE

  const [profileType, setProfileType] = useState<ProfileType>('GENERAL')
  const [profileRegionId, setProfileRegionId] = useState<number | null>(null)
  const [profileRegionName, setProfileRegionName] = useState<string | null>(null)
  const [meLoading, setMeLoading] = useState(true)

  const [category, setCategory] = useState<Category | ''>('')
  const [tradeRegionId, setTradeRegionId] = useState<number | null>(null)
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT'>('DRAFT')

  const [title, setTitle] = useState('')
  const [keywords, setKeywords] = useState('')
  const [content, setContent] = useState('')
  const [price, setPrice] = useState('')
  const [images, setImages] = useState<File[]>([])

  const [loading, setLoading] = useState(false)

  const isDisabled = loading || meLoading

  // SECTION 05 : DATA FUNCTION

  async function fetchAuthAndProfile() {
    if (typeof window === 'undefined') {
      setMeLoading(false)
      return
    }

    const token = localStorage.getItem('accessToken')

    if (!token) {
      setProfileType('GENERAL')
      setProfileRegionId(null)
      setProfileRegionName(null)
      setMeLoading(false)
      return
    }

    try {
      const meRes = await getMe()

      if (meRes?.user?.profileType) {
        setProfileType(meRes.user.profileType)
      }

      const profileRes = await getMyProfile()

      if (profileRes?.profile) {
        setProfileRegionId(profileRes.profile.feedRegionId ?? null)
        setProfileRegionName(profileRes.profile.feedRegion?.name ?? null)
      }
    } catch (error) {
      console.error('CREATE_PAGE_AUTH_INIT_ERROR', error)
      setProfileType('GENERAL')
      setProfileRegionId(null)
      setProfileRegionName(null)
    } finally {
      setMeLoading(false)
    }
  }

  function resolveCategoryCode(
    categoryValue: Category | ''
  ): string | undefined {
    if (!categoryValue) {
      return undefined
    }

    const categoryMap: Record<Category, string> = {
      GENERAL: 'LIFE',
      PLACE: 'FOOD',
      EVENT: 'MEET',
      USED: 'MARKET',
      REAL_ESTATE: 'INFO',
      AUTO: 'CAR',
      JOB: 'JOB',
      GROUP: 'MEET'
    }

    return categoryMap[categoryValue]
  }

// ==================================================
// SECTION 06 : EVENT FUNCTION
// ==================================================

const handleSubmit = async () => {
  if (isDisabled) return

  if (typeof window === 'undefined') return

  const token = localStorage.getItem('accessToken')

  if (!token) {
    alert('로그인이 필요합니다')
    return
  }

  if (!category) {
    alert('카테고리 선택')
    return
  }

  if (!content.trim()) {
    alert('내용 입력')
    return
  }

  try {
    setLoading(true)

    let profileRes: any = null

    try {
      profileRes = await getMyProfile()
    } catch (error) {
      console.error('CREATE_PAGE_PROFILE_AUTH_ERROR', error)
      alert('로그인이 필요합니다')
      return
    }

    if (!profileRes?.profile) {
      alert('프로필 확인 실패')
      return
    }

    if (!profileRes.profile.channelCode) {
      alert('채널코드 없음')
      return
    }

    /* ==================================================
    🔥 IMAGE UPLOAD (FIXED)
    ================================================== */

    const imageAssetIds: number[] = []

    for (const file of images) {

      const form = new FormData()

      /* 🔥 핵심 수정 1 : field name */
      form.append('file', file)

      form.append('usageType', 'post')

      const uploadRes: any = await apiFetch('media/upload', {
        method: 'POST',
        body: form,
        isForm: true
      })

      /* 🔥 핵심 수정 2 : response structure */
if (!uploadRes?.assetId) {
  throw new Error('POST_IMAGE_UPLOAD_FAILED')
}

const assetId = uploadRes.assetId

      imageAssetIds.push(assetId)
    }

    const categoryCode = resolveCategoryCode(category)

    if (!categoryCode) {
      alert('카테고리 코드 변환 실패')
      return
    }

    const payload = {
      content: content.trim(),
      visibility: 'PUBLIC',
      categoryCode,
      imageAssetIds
    }

    const result: any = await apiFetch('posts', {
      method: 'POST',
      body: payload
    })

    if (!result?.ok) {
      throw new Error('POST_CREATE_FAILED')
    }

    alert('등록 완료')

  } catch (error) {
    console.error('CREATE_PAGE_SUBMIT_ERROR', error)
    alert('실패')
  } finally {
    setLoading(false)
  }
}
  // SECTION 07 : EFFECT

  useEffect(() => {
    void fetchAuthAndProfile()
  }, [])

  // SECTION 08 : UI BLOCK

  const HeaderUI = <h1 style={titleStyle}>게시물 작성</h1>

  const StatusUI = (
    <StatusToggle
      status={status}
      setStatus={setStatus}
      loading={isDisabled}
    />
  )

  const UploadUI = (
    <div style={uploadPanelWrap}>
      <ImageUploader
        images={images}
        setImages={setImages}
        loading={isDisabled}
      />
    </div>
  )

  const FieldsUI =
    profileType === 'BUSINESS' ? (
      <PersonalPostFields
        category={category}
        setCategory={setCategory}
        tradeRegionId={tradeRegionId}
        setTradeRegionId={setTradeRegionId}
        profileRegionId={profileRegionId}
        profileRegionName={profileRegionName}
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
    ) : (
      <PersonalPostFields
        category={category}
        setCategory={setCategory}
        tradeRegionId={tradeRegionId}
        setTradeRegionId={setTradeRegionId}
        profileRegionId={profileRegionId}
        profileRegionName={profileRegionName}
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
    )

  const SubmitUI = (
    <div style={buttonWrap}>
      <button
        onClick={handleSubmit}
        disabled={isDisabled}
        style={buttonStyle}
      >
        {loading ? '등록중...' : '등록하기'}
      </button>
    </div>
  )

  // SECTION 09 : RETURN

  return (
    <div style={pageStyle}>
      <div style={wrapperStyle}>
        <div style={cardStyle}>
          {HeaderUI}
          {StatusUI}
          {UploadUI}
          {FieldsUI}
          {SubmitUI}
        </div>
      </div>
    </div>
  )
}

// SECTION 10 : STYLE

const pageStyle = {
  background: '#f0f2f5',
  minHeight: '100vh'
}

const wrapperStyle = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '16px'
}

const cardStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
}

const titleStyle = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 20
}

const uploadPanelWrap = {
  marginTop: 12,
  marginBottom: 16
}

const buttonWrap = {
  marginTop: 24
}

const buttonStyle = {
  width: '100%',
  padding: 14,
  borderRadius: 12,
  border: 'none',
  background: '#1877f2',
  color: '#fff',
  fontSize: 15,
  cursor: 'pointer'
}
