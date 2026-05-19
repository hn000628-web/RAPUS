// FILE : frontend/app/(after-login)/profile/business/create/photo/page.tsx
// ROOT : frontend/app/(after-login)/profile/business/create/photo/page.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS PHOTO CREATE PAGE
// CHANGE SUMMARY :
// - business-gallery-api.ts 에서 제거된 getMyBusinessProfileContext import 제거
// - getMe() 기반 BUSINESS 컨텍스트 resolve 로직을 페이지 내부에 추가
// - business-gallery-api.ts 는 사진첩 전담 helper만 사용하도록 정리
// - uploadBusinessGalleryAsset 실제 계약(file, context) 기준으로 호출 유지
// - fileName / filePath undefined 가능성 정규화 처리 유지
// - channelCode + profileId BUSINESS 컨텍스트 기반 업로드 구조 유지
// - 기존 UI / 스타일 / JSX 구조 유지

'use client'

// SECTION 01 : IMPORT

import {
  useEffect,
  useRef,
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

import { getMe } from '@/lib/authApi'

import {
  uploadBusinessGalleryAsset,
  connectBusinessGalleryImage
} from '@/lib/business/business-gallery-api'

// SECTION 02 : CONSTANT

const MAX_FILES = 9

// SECTION 03 : TYPE

type UploadResult = {
  assetId: number | null
  fileName: string
  filePath: string
}

type BusinessContext = {
  profileId: number
  channelCode: string
  profileType: 'BUSINESS'
}

// SECTION 04 : COMPONENT

export default function PhotoCreatePage() {
  const router = useRouter()

  const fileInputRef =
    useRef<HTMLInputElement | null>(null)

  // SECTION 05 : STATE

  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const canSubmit = files.length > 0 && !loading
  const remain = MAX_FILES - files.length

  // SECTION 06 : EFFECT

  useEffect(() => {
    previewUrls.forEach(URL.revokeObjectURL)

    const next = files.map((file) => URL.createObjectURL(file))

    setPreviewUrls(next)

    return () => {
      next.forEach(URL.revokeObjectURL)
    }
  }, [files])

// SECTION 07 : DATA FUNCTION

const normalizeRequiredProfileId = (
  profileId: unknown
): number => {
  const normalizedProfileId = Number(profileId)

  if (
    !Number.isInteger(normalizedProfileId) ||
    normalizedProfileId <= 0
  ) {
    throw new Error('profileId invalid')
  }

  return normalizedProfileId
}

const normalizeRequiredChannelCode = (
  channelCode: unknown
): string => {
  if (typeof channelCode !== 'string') {
    throw new Error('channelCode missing')
  }

  const normalizedChannelCode = channelCode.trim()

  if (!normalizedChannelCode) {
    throw new Error('channelCode missing')
  }

  return normalizedChannelCode
}

const tryResolveBusinessContext = (
  value: unknown
): BusinessContext | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const target = value as {
    profileId?: unknown
    id?: unknown
    channelCode?: unknown
    profileType?: unknown
    type?: unknown
    profile?: {
      profileId?: unknown
      id?: unknown
      channelCode?: unknown
      profileType?: unknown
      type?: unknown
    } | null
  }

  const nestedProfile =
    target.profile && typeof target.profile === 'object'
      ? target.profile
      : null

  const rawProfileId =
    target.profileId ??
    target.id ??
    nestedProfile?.profileId ??
    nestedProfile?.id

  const rawChannelCode =
    target.channelCode ??
    nestedProfile?.channelCode

  const rawProfileType =
    target.profileType ??
    target.type ??
    nestedProfile?.profileType ??
    nestedProfile?.type

  const normalizedProfileType =
    String(rawProfileType ?? '').trim().toUpperCase()

  if (normalizedProfileType !== 'BUSINESS') {
    return null
  }

  try {
    return {
      profileId: normalizeRequiredProfileId(rawProfileId),
      channelCode: normalizeRequiredChannelCode(rawChannelCode),
      profileType: 'BUSINESS'
    }
  } catch {
    return null
  }
}

const getMyBusinessContext = async (): Promise<BusinessContext> => {
  const me = await getMe()

  const typedMe = me as {
    ok?: boolean
    user?: {
      profileId?: unknown
      id?: unknown
      channelCode?: unknown
      profileType?: unknown
      type?: unknown
      currentProfile?: unknown
      profile?: unknown
      businessProfile?: unknown
      currentBusinessProfile?: unknown
      business?: unknown
      profiles?: unknown[]
    }
    profileId?: unknown
    id?: unknown
    channelCode?: unknown
    profileType?: unknown
    type?: unknown
    currentProfile?: unknown
    profile?: unknown
    businessProfile?: unknown
    currentBusinessProfile?: unknown
    business?: unknown
    profiles?: unknown[]
    data?: {
      profileId?: unknown
      id?: unknown
      channelCode?: unknown
      profileType?: unknown
      type?: unknown
      currentProfile?: unknown
      profile?: unknown
      businessProfile?: unknown
      currentBusinessProfile?: unknown
      business?: unknown
      profiles?: unknown[]
      user?: {
        profileId?: unknown
        id?: unknown
        channelCode?: unknown
        profileType?: unknown
        type?: unknown
        currentProfile?: unknown
        profile?: unknown
        businessProfile?: unknown
        currentBusinessProfile?: unknown
        business?: unknown
        profiles?: unknown[]
      }
    }
  }

  const rootProfiles = Array.isArray(typedMe.profiles)
    ? typedMe.profiles
    : []

  const userProfiles = Array.isArray(typedMe.user?.profiles)
    ? typedMe.user.profiles
    : []

  const dataProfiles = Array.isArray(typedMe.data?.profiles)
    ? typedMe.data.profiles
    : []

  const dataUserProfiles = Array.isArray(typedMe.data?.user?.profiles)
    ? typedMe.data.user.profiles
    : []

  const candidates: unknown[] = [
    typedMe,
    typedMe.user,

    typedMe.currentProfile,
    typedMe.profile,
    typedMe.businessProfile,
    typedMe.currentBusinessProfile,
    typedMe.business,

    typedMe.user?.currentProfile,
    typedMe.user?.profile,
    typedMe.user?.businessProfile,
    typedMe.user?.currentBusinessProfile,
    typedMe.user?.business,

    typedMe.data,
    typedMe.data?.user,

    typedMe.data?.currentProfile,
    typedMe.data?.profile,
    typedMe.data?.businessProfile,
    typedMe.data?.currentBusinessProfile,
    typedMe.data?.business,

    typedMe.data?.user?.currentProfile,
    typedMe.data?.user?.profile,
    typedMe.data?.user?.businessProfile,
    typedMe.data?.user?.currentBusinessProfile,
    typedMe.data?.user?.business,

    ...rootProfiles,
    ...userProfiles,
    ...dataProfiles,
    ...dataUserProfiles
  ]

  for (const candidate of candidates) {
    const resolved = tryResolveBusinessContext(candidate)

    if (resolved) {
      return resolved
    }
  }

  console.error('BUSINESS CONTEXT RESOLVE FAIL', me)
  console.log(
    'BUSINESS CONTEXT RAW JSON',
    JSON.stringify(me, null, 2)
  )

  throw new Error('business context missing')
}

const openPicker = () => {
  fileInputRef.current?.click()
}

const handleFiles = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const list = e.target.files
    ? Array.from(e.target.files)
    : []

  if (!list.length) {
    return
  }

  setFiles((prev) => {
    const merged = [...prev, ...list]

    const uniq: File[] = []
    const seen = new Set<string>()

    for (const file of merged) {
      const key = `${file.name}_${file.size}_${file.lastModified}`

      if (seen.has(key)) {
        continue
      }

      seen.add(key)
      uniq.push(file)
    }

    return uniq.slice(0, MAX_FILES)
  })

  e.target.value = ''
}

const removeAt = (idx: number) => {
  setFiles((prev) => prev.filter((_, i) => i !== idx))
}

const clearAll = () => {
  setFiles([])
}

const uploadSingleFile = async (params: {
  profileId: number
  channelCode: string
  file: File
}): Promise<UploadResult> => {
  const result = await uploadBusinessGalleryAsset(
    params.file,
    {
      profileId: params.profileId,
      channelCode: params.channelCode
    }
  )

  if (!result?.assetId) {
    throw new Error('business gallery upload fail')
  }

  return {
    assetId: result.assetId,
    fileName: result.fileName ?? '',
    filePath: result.filePath ?? ''
  }
}

  // SECTION 08 : EVENT FUNCTION

  const handleSubmit = async () => {
    if (!canSubmit) {
      return
    }

    try {
      setLoading(true)

      const context = await getMyBusinessContext()

      if (!context?.profileId || !context?.channelCode) {
        alert('비지니스 프로필 컨텍스트 확인 실패')
        return
      }

      const profileId = context.profileId
      const channelCode = context.channelCode

      const assetIds: number[] = []

      for (const file of files) {
        const uploaded = await uploadSingleFile({
          profileId,
          channelCode,
          file
        })

        if (!uploaded.assetId) {
          throw new Error('assetId missing')
        }

        assetIds.push(uploaded.assetId)
      }

      for (const imageAssetId of assetIds) {
        await connectBusinessGalleryImage({
          profileId,
          channelCode,
          imageAssetId
        })
      }

      alert('사진 등록 완료')
      router.push('/profile')
    } catch (error) {
      console.error(error)
      alert('업로드 실패')
    } finally {
      setLoading(false)
    }
  }

  // SECTION 09 : UI BLOCK

  const EmptyUploadUI = (
    <label style={panelInnerBoxStyle}>
      사진 추가하기
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFiles}
        style={{ display: 'none' }}
      />
    </label>
  )

  const PreviewGridUI = (
    <div style={panelGridStyle}>
      {previewUrls.map((src, idx) => (
        <div
          key={`${src}_${idx}`}
          style={panelThumbWrapStyle}
        >
          <div
            style={{
              ...panelThumbStyle,
              backgroundImage: `url(${src})`
            }}
          />

          <button
            onClick={() => removeAt(idx)}
            style={panelRemoveBtnStyle}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )

  // SECTION 10 : RETURN

  return (
    <div style={pageStyle}>
      <div style={contentWrapperStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>
            사진 등록
          </h1>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFiles}
            style={{ display: 'none' }}
          />

          <div style={stitchPanelStyle}>
            <div style={panelTopRowStyle}>
              <button
                onClick={openPicker}
                disabled={remain <= 0}
                style={{
                  ...panelAddBtnStyle,
                  background: '#1877f2',
                  color: '#fff',
                  opacity: remain <= 0 ? 0.5 : 1
                }}
              >
                + 추가
              </button>

              <div style={{ flex: 1 }} />

              {files.length > 0 && (
                <button
                  onClick={clearAll}
                  style={{
                    ...panelClearBtnStyle,
                    background: '#ff4d4f',
                    color: '#fff'
                  }}
                >
                  전체삭제
                </button>
              )}
            </div>

            <div style={panelHintStyle}>
              {files.length === 0
                ? `사진 선택 (최대 ${MAX_FILES}장)`
                : `선택된 사진 ${files.length}장`}
            </div>

            {previewUrls.length === 0
              ? EmptyUploadUI
              : PreviewGridUI}
          </div>

          <div style={inlineButtonWrap}>
            <button
              disabled={!canSubmit}
              onClick={handleSubmit}
              style={inlineButtonStyle}
            >
              {loading ? '등록중...' : '사진 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// SECTION 11 : STYLE

const pageStyle: React.CSSProperties = {
  background: '#f0f2f5',
  minHeight: '100vh'
}

const contentWrapperStyle: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '16px'
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
}

const titleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 20
}

const stitchPanelStyle: React.CSSProperties = {
  border: '2px dashed #cfd6dd',
  borderRadius: 14,
  padding: 12,
  background: '#f5f6f7'
}

const panelTopRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10
}

const panelAddBtnStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #ddd',
  fontSize: 13,
  cursor: 'pointer'
}

const panelClearBtnStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #ddd',
  fontSize: 13,
  cursor: 'pointer'
}

const panelHintStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#666',
  marginTop: 8,
  marginBottom: 10
}

const panelInnerBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 100,
  border: '1px solid #ccc',
  borderRadius: 12,
  background: '#fff',
  cursor: 'pointer',
  color: '#999'
}

const panelGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3,1fr)',
  gap: 10
}

const panelThumbWrapStyle: React.CSSProperties = {
  position: 'relative',
  aspectRatio: '1 / 1'
}

const panelThumbStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  borderRadius: 12
}

const panelRemoveBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: 6,
  right: 6,
  width: 24,
  height: 24,
  borderRadius: '50%',
  background: 'rgba(0,0,0,0.6)',
  color: '#fff',
  border: 'none',
  cursor: 'pointer'
}

const inlineButtonWrap: React.CSSProperties = {
  marginTop: 24
}

const inlineButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: 14,
  borderRadius: 12,
  border: 'none',
  background: '#1877f2',
  color: '#fff',
  fontSize: 15,
  cursor: 'pointer'
}