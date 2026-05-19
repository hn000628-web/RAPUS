// FILE : frontend/app/channel/[channelCode]/components/MenuBar/channelGallery.tsx
// ROOT : C:\Users\kjm\social-platform\frontend\app\channel\[channelCode]\components\MenuBar\channelGallery.tsx
// STATUS : FINAL MODIFIED
// ROLE : PUBLIC CHANNEL GALLERY VIEW COMPONENT
// CHANGE SUMMARY :
// - 사진 클릭 시 ImageViewer 전체뷰를 열지 않고 갤러리 상세 페이지로 이동
// - 이동 경로: /channel/[channelCode]/gallery/[galleryId]
// - ImageViewer import / viewer state / viewer handler 제거
// - useRouter / useParams 기반 route 이동 적용
// - 부모 컴포넌트에서 전달받은 items / loading / errorMessage 기준 렌더 유지
// - 공개 채널뷰 read-only 갤러리 표시 유지
// - 로딩 / 빈 상태 / 오류 상태 UI 유지
// - DB / API / Service 직접 접근 없음

'use client'

// SECTION 01 : IMPORT

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  useParams,
  useRouter
} from 'next/navigation'

// SECTION 02 : TYPE

export type ChannelGalleryItem = {
  galleryId: number
  imageUrl: string | null
  createdAt?: string | null
}

type GalleryImage = {
  id: number
  imageUrl: string
  createdAt?: string | null
}

type ChannelGalleryProps = {
  items?: ChannelGalleryItem[] | null
  loading?: boolean
  errorMessage?: string | null
}

// SECTION 03 : COMPONENT

export default function ChannelGallery({
  items,
  loading = false,
  errorMessage = null
}: ChannelGalleryProps) {
  const router =
    useRouter()

  const params =
    useParams<{
      channelCode?: string
    }>()

  const [columnCount, setColumnCount] =
    useState(2)

  // SECTION 04 : DATA

  const channelCode =
    String(params?.channelCode || '').trim()

  const safeItems =
    Array.isArray(items)
      ? items
      : []

  const galleryImages =
    useMemo<GalleryImage[]>(() => {
      return safeItems
        .filter((item) => {
          return Boolean(item.imageUrl)
        })
        .map((item) => ({
          id: item.galleryId,
          imageUrl: item.imageUrl || '',
          createdAt: item.createdAt ?? null
        }))
    }, [
      safeItems
    ])

  // SECTION 05 : EFFECT

  useEffect(() => {
    function updateColumnCount() {
      if (window.innerWidth >= 1200) {
        setColumnCount(2)
        return
      }

      if (window.innerWidth > 640) {
        setColumnCount(3)
        return
      }

      setColumnCount(2)
    }

    updateColumnCount()

    window.addEventListener(
      'resize',
      updateColumnCount
    )

    return () => {
      window.removeEventListener(
        'resize',
        updateColumnCount
      )
    }
  }, [])

  // SECTION 06 : ROUTE FUNCTION

  function moveToGalleryPage(
    galleryId: number
  ) {
    if (!channelCode) {
      return
    }

    router.push(
      `/channel/${encodeURIComponent(channelCode)}/gallery/${galleryId}`
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
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          gap: 8
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            style={{
              background: '#eeeeee',
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
          color: '#666666',
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
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          gap: 8
        }}
      >
        {galleryImages.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => {
              moveToGalleryPage(photo.id)
            }}
            style={{
              margin: 0,
              padding: 0,
              overflow: 'hidden',
              border: 0,
              borderRadius: 10,
              background: '#eeeeee',
              aspectRatio: '1 / 1',
              cursor: 'pointer'
            }}
            aria-label={`갤러리 ${photo.id} 상세 페이지로 이동`}
          >
            <img
              src={photo.imageUrl}
              alt={`channel-gallery-${photo.id}`}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                objectFit: 'cover'
              }}
            />
          </button>
        ))}
      </div>
    </div>
  )

  // SECTION 08 : RETURN

  if (loading) {
    return LoadingUI
  }

  if (errorMessage) {
    return ErrorUI
  }

  if (galleryImages.length === 0) {
    return EmptyUI
  }

  return GalleryGridUI
}

// SECTION 09 : VALIDATION

/*
VALIDATION:
- 단일 파일 통코드 출력
- 사진 클릭 시 ImageViewer 전체뷰 제거 완료
- 사진 클릭 시 /channel/[channelCode]/gallery/[galleryId] 이동 적용 완료
- useRouter 적용 완료
- useParams 기반 channelCode 확인 적용 완료
- ImageViewer import 제거 완료
- viewerOpen state 제거 완료
- currentIndex state 제거 완료
- openViewer / closeViewer / onPrev / onNext 제거 완료
- 부모 props 기반 items / loading / errorMessage 렌더 유지 완료
- 공개 채널뷰 read-only 갤러리 구조 유지 완료
- 로딩 상태 UI 유지 완료
- 빈 상태 UI 유지 완료
- 오류 상태 UI 유지 완료
- DB 직접 접근 없음
- API 직접 호출 없음
- Service 직접 호출 없음
*/