// FILE : frontend/app/channel/[channelCode]/components/MenuBar/channelReviews.tsx
// ROOT : frontend/app/channel/[channelCode]/components/MenuBar/channelReviews.tsx
// STATUS : MODIFY MODE
// ROLE : CHANNEL REVIEWS TAB
// CHANGE SUMMARY :
// - ReviewPopup 래퍼 컴포넌트로 정리
// - Props 기본값으로 page.tsx의 <ChannelReviews /> 단독 사용 호환

'use client'

import { useState } from 'react'
import ReviewPopup, { ReviewPopupData } from './viewer/ReviewPopup'

type Props = {
  open?: boolean
  onClose?: () => void
  onSubmit?: (data: ReviewPopupData) => void
}

export default function ChannelReviews({ open, onClose, onSubmit }: Props) {
  const [localOpen, setLocalOpen] = useState(false)

  const controlled = typeof open === 'boolean'
  const isOpen = controlled ? open : localOpen

  function handleOpen() {
    if (!controlled) setLocalOpen(true)
  }

  function handleClose() {
    onClose?.()
    if (!controlled) setLocalOpen(false)
  }

  function handleSubmit(data: ReviewPopupData) {
    onSubmit?.(data)
  }

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>방문자 리뷰</div>

      {!controlled && (
        <button
          type="button"
          onClick={handleOpen}
          style={{
            width: 'fit-content',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          리뷰 작성
        </button>
      )}

      <ReviewPopup
        open={isOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    </section>
  )
}
