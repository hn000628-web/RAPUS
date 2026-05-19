// FILE : frontend/components/viewer/ImageViewer.tsx
// ROOT : frontend/components/viewer/ImageViewer.tsx
// STATUS : MODIFY MODE
// ROLE : COMMON IMAGE VIEWER COMPONENT
// CHANGE SUMMARY :
// - 공용 ImageViewer 컴포넌트 구조 유지
// - ESC 닫기 유지
// - 좌우 방향키 이전 / 다음 이동 추가
// - index 범위 안전 처리 추가
// - div 클릭 버튼을 button 태그로 정규화
// - 이미지 alt 속성 추가
// - business / general / gallery / feed 공용 사용 가능 구조 유지
// - API / DB / Service 영향 없음

'use client'

// SECTION 01 : IMPORT

import {
  useEffect
} from 'react'

// SECTION 02 : TYPE

export type ImageViewerItem = {
  imageUrl: string
  alt?: string
}

type Props = {
  open: boolean
  images: ImageViewerItem[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

// SECTION 03 : COMPONENT

export default function ImageViewer({
  open,
  images,
  index,
  onClose,
  onPrev,
  onNext
}: Props) {
  // SECTION 04 : DATA

  const safeIndex =
    Math.max(
      0,
      Math.min(
        index,
        images.length - 1
      )
    )

  const current =
    images[safeIndex]

  const hasPrev =
    safeIndex > 0

  const hasNext =
    safeIndex < images.length - 1

  // SECTION 05 : EFFECT

  useEffect(() => {
    function handleKey(
      event: KeyboardEvent
    ) {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (
        event.key === 'ArrowLeft' &&
        hasPrev
      ) {
        onPrev()
        return
      }

      if (
        event.key === 'ArrowRight' &&
        hasNext
      ) {
        onNext()
      }
    }

    if (open) {
      window.addEventListener(
        'keydown',
        handleKey
      )

      document.body.style.overflow =
        'hidden'
    }

    return () => {
      window.removeEventListener(
        'keydown',
        handleKey
      )

      document.body.style.overflow =
        ''
    }
  }, [
    open,
    hasPrev,
    hasNext,
    onClose,
    onPrev,
    onNext
  ])

  // SECTION 06 : GUARD

  if (
    !open ||
    images.length === 0 ||
    !current
  ) {
    return null
  }

  // SECTION 07 : UI BLOCK

  const CloseButtonUI = (
    <button
      type="button"
      aria-label="이미지 보기 닫기"
      onClick={(event) => {
        event.stopPropagation()
        onClose()
      }}
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: 44,
        height: 44,
        border: 0,
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.6)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        fontWeight: 700,
        cursor: 'pointer',
        zIndex: 100000
      }}
    >
      ×
    </button>
  )

  const PrevButtonUI =
    hasPrev && (
      <button
        type="button"
        aria-label="이전 이미지"
        onClick={(event) => {
          event.stopPropagation()
          onPrev()
        }}
        style={{
          position: 'absolute',
          left: 20,
          top: '50%',
          width: 52,
          height: 64,
          border: 0,
          background: 'transparent',
          color: '#ffffff',
          fontSize: 54,
          lineHeight: 1,
          cursor: 'pointer',
          userSelect: 'none',
          transform: 'translateY(-50%)'
        }}
      >
        ‹
      </button>
    )

  const NextButtonUI =
    hasNext && (
      <button
        type="button"
        aria-label="다음 이미지"
        onClick={(event) => {
          event.stopPropagation()
          onNext()
        }}
        style={{
          position: 'absolute',
          right: 20,
          top: '50%',
          width: 52,
          height: 64,
          border: 0,
          background: 'transparent',
          color: '#ffffff',
          fontSize: 54,
          lineHeight: 1,
          cursor: 'pointer',
          userSelect: 'none',
          transform: 'translateY(-50%)'
        }}
      >
        ›
      </button>
    )

  const ImageUI = (
    <img
      src={current.imageUrl}
      alt={current.alt || '확대 이미지'}
      onClick={(event) => {
        event.stopPropagation()
      }}
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
      }}
    />
  )

  const IndicatorUI = (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        width: '100%',
        textAlign: 'center',
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 700
      }}
    >
      {safeIndex + 1} / {images.length}
    </div>
  )

  // SECTION 08 : RETURN

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="이미지 확대 보기"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.95)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {CloseButtonUI}

      {PrevButtonUI}

      {ImageUI}

      {NextButtonUI}

      {IndicatorUI}
    </div>
  )
}