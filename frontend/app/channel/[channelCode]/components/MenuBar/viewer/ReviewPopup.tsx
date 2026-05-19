// FILE : frontend/app/channel/[channelCode]/components/viewer/ReviewPopup.tsx
// ROOT : frontend/app/channel/[channelCode]/components/viewer/ReviewPopup.tsx
// STATUS : MODIFY MODE
// ROLE : REVIEW WRITE POPUP
// CHANGE SUMMARY :
// - 사진 첨부 버튼 UI 추가
// - 텍스트 입력 하단 배치
// - 파일 업로드 input 숨김
// - ESC 키 닫기 유지
// - 별점, 방문일 선택, 제출 버튼 유지

'use client'

import { useEffect, useState } from 'react'

export type ReviewPopupData = {
  rating: number
  content: string
  visitDay: '평일' | '주말' | '공휴일' | null
  imageFile?: File | null
}

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (data: ReviewPopupData) => void
}

export default function ReviewPopup({ open, onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [visitDay, setVisitDay] = useState<'평일' | '주말' | '공휴일' | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  // ESC 닫기
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    if (open) {
      window.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = () => {
    if (!content.trim() || rating === 0 || !visitDay) return
    onSubmit({ rating, content, visitDay, imageFile })
    setRating(0)
    setContent('')
    setVisitDay(null)
    setImageFile(null)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 320,
          maxWidth: '90%',
          background: '#fff',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <h3 style={{ fontWeight: 700, fontSize: 16 }}>리뷰 작성</h3>

        {/* 별점 선택 */}
        <div>
          별점:
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              onClick={() => setRating(n)}
              style={{
                cursor: 'pointer',
                color: n <= rating ? '#facc15' : '#d1d5db',
                fontSize: 22,
                marginLeft: 4
              }}
            >
              ★
            </span>
          ))}
        </div>

        {/* 리뷰 내용 입력 */}
        <textarea
          placeholder="리뷰 내용을 작성해주세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            minHeight: 80,
            resize: 'none',
            padding: 8,
            borderRadius: 6,
            border: '1px solid #d1d5db'
          }}
        />

        {/* 사진 첨부 버튼 */}
        <label
          htmlFor="review-image-upload"
          style={{
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: 6,
            background: '#111827',
            color: '#fff',
            fontWeight: 700,
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          사진 추가
        </label>
        <input
          type="file"
          id="review-image-upload"
          accept="image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            setImageFile(file)
          }}
        />

        {/* 방문일 선택 */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['평일', '주말', '공휴일'].map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setVisitDay(day as '평일' | '주말' | '공휴일')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: visitDay === day ? '1px solid #111827' : '1px solid #d1d5db',
                background: visitDay === day ? '#f3f4f6' : '#fff',
                cursor: 'pointer'
              }}
            >
              {day}
            </button>
          ))}
        </div>

        {/* 작성 완료 버튼 */}
        <button
          type="button"
          onClick={handleSubmit}
          style={{
            marginTop: 8,
            padding: '8px 0',
            borderRadius: 6,
            background: '#111827',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          작성 완료
        </button>
      </div>
    </div>
  )
}