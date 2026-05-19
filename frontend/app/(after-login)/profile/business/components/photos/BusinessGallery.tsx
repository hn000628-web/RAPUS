// FILE : frontend/app/(after-login)/profile/business/components/photos/BusinessGallery.tsx
// ROOT : frontend/app/(after-login)/profile/business/components/photos/BusinessGallery.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS GALLERY COMPONENT
// CHANGE SUMMARY :
// - 관리자 뷰 기준으로 본문 상단 사진첩 중복 타이틀 제거
// - business-gallery-api.ts 기준으로 사진첩 목록 조회 유지
// - general 사진첩 viewer 흐름을 참고한 ImageViewer 연동 유지
// - channelCode 기준 조회 구조 유지
// - 로딩 / 빈 상태 / 오류 상태 UI 유지
// - 저장/연결/해제는 담당하지 않고 read 전용 표시 역할만 유지

'use client'

// SECTION 01 : IMPORT

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import { useParams } from 'next/navigation'

import ImageViewer from '@/components/viewer/ImageViewer'

import {
  BusinessGalleryItem,
  getBusinessGalleryByChannelCode
} from '@/lib/business/business-gallery-api'

// SECTION 02 : TYPE

type ViewerImage = {
  id: number
  imageUrl: string
}

type BusinessGalleryProps = {
  channelCode?: string | null
}

// SECTION 03 : COMPONENT

export default function BusinessGallery(
  props: BusinessGalleryProps
) {
  const params = useParams()

  const routeChannelCode =
    typeof params?.channelCode === 'string'
      ? params.channelCode
      : Array.isArray(params?.channelCode)
        ? params.channelCode[0]
        : ''

  const resolvedChannelCode =
    (props.channelCode ?? routeChannelCode ?? '').trim()

  const [items, setItems] = useState<BusinessGalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  // SECTION 04 : DATA FUNCTION

  async function loadGallery() {
    if (!resolvedChannelCode) {
      setItems([])
      setErrorMessage('channelCode missing')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setErrorMessage(null)

      const data =
        await getBusinessGalleryByChannelCode(
          resolvedChannelCode
        )

      setItems(
        Array.isArray(data.items)
          ? data.items
          : []
      )
    } catch (error) {
      console.error(
        '[BUSINESS GALLERY LOAD FAIL]',
        error
      )

      setItems([])
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'gallery load failed'
      )
    } finally {
      setLoading(false)
    }
  }

  // SECTION 05 : EFFECT

  useEffect(() => {
    loadGallery()
  }, [resolvedChannelCode])

  // SECTION 06 : VIEWER FUNCTION

  const viewerImages = useMemo<ViewerImage[]>(() => {
    return items
      .filter((item) => Boolean(item.imageUrl))
      .map((item) => ({
        id: item.galleryId,
        imageUrl: item.imageUrl || ''
      }))
  }, [items])

  function openViewer(
    index: number
  ) {
    if (
      !Array.isArray(viewerImages) ||
      viewerImages.length === 0
    ) {
      return
    }

    setCurrentIndex(index)
    setViewerOpen(true)
  }

  function closeViewer() {
    setViewerOpen(false)
  }

  function onPrev() {
    setCurrentIndex((prev) =>
      Math.max(0, prev - 1)
    )
  }

  function onNext() {
    setCurrentIndex((prev) =>
      Math.min(
        viewerImages.length - 1,
        prev + 1
      )
    )
  }

  // SECTION 07 : UI BLOCK

  const LoadingUI = (
    <div
      style={{
        padding: 0
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 8
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            style={{
              background: '#eee',
              aspectRatio: '1 / 1',
              borderRadius: 10
            }}
          />
        ))}
      </div>
    </div>
  )

  const EmptyUI = (
    <div
      style={{
        padding: 0
      }}
    >
      <div
        style={{
          padding: '32px 16px',
          borderRadius: 12,
          background: '#f7f7f7',
          color: '#666',
          textAlign: 'center',
          fontSize: 14
        }}
      >
        등록된 사진이 없습니다.
      </div>
    </div>
  )

  const ErrorUI = (
    <div
      style={{
        padding: 0
      }}
    >
      <div
        style={{
          padding: '24px 16px',
          borderRadius: 12,
          background: '#fff4f4',
          color: '#c62828',
          fontSize: 14
        }}
      >
        {errorMessage || '사진첩을 불러오지 못했습니다.'}
      </div>
    </div>
  )

  const GalleryGridUI = (
    <div
      style={{
        padding: 0
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 8
        }}
      >
        {viewerImages.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => openViewer(index)}
            style={{
              border: 0,
              padding: 0,
              margin: 0,
              background: '#eee',
              borderRadius: 10,
              overflow: 'hidden',
              aspectRatio: '1 / 1',
              cursor: 'pointer'
            }}
          >
            <img
              src={photo.imageUrl}
              alt={`business-gallery-${photo.id}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </button>
        ))}
      </div>
    </div>
  )

  const ViewerUI = viewerImages.length > 0 ? (
    <ImageViewer
      open={viewerOpen}
      images={viewerImages}
      index={currentIndex}
      onClose={closeViewer}
      onPrev={onPrev}
      onNext={onNext}
    />
  ) : null

  // SECTION 08 : RETURN

  if (loading) {
    return LoadingUI
  }

  if (errorMessage) {
    return ErrorUI
  }

  if (viewerImages.length === 0) {
    return EmptyUI
  }

  return (
    <>
      {GalleryGridUI}
      {ViewerUI}
    </>
  )
}