// FILE : frontend/app/(after-login)/profile/business/create/summary/page.tsx
// ROOT : frontend/app/(after-login)/profile/business/create/summary/page.tsx
// STATUS : CARD UI + API CONNECT FINAL

'use client'

// ==================================================
// SECTION 01 : IMPORT
// ==================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import {
  getBusinessSummary,
  updateBusinessSummary
} from '@/lib/business/business-summary-api'

// ==================================================
// SECTION 02 : CONST
// ==================================================

const MAX_LENGTH = 300

// ==================================================
// SECTION 03 : COMPONENT
// ==================================================

export default function BusinessSummaryPage() {

  const router = useRouter()

  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)

  // ==================================================
  // SECTION 04 : INIT LOAD (🔥 추가)
  // ==================================================

  useEffect(() => {

    async function load() {

      try {

        const res =
          await getBusinessSummary()

        setSummary(
          res.summary ?? ''
        )

      } catch (error) {

        console.error(error)

      } finally {

        setInitLoading(false)

      }

    }

    void load()

  }, [])

  // ==================================================
  // SECTION 05 : HANDLER
  // ==================================================

  function handleChange(value: string) {

    if (value.length > MAX_LENGTH) return

    setSummary(value)
  }

  async function handleSave() {

    setLoading(true)

    try {

      await updateBusinessSummary(
        summary.trim() || null
      )

      alert('소개가 저장되었습니다.')

      router.push('/profile/business/settings')

    } catch (error) {

      console.error(error)

      alert('저장 실패')

    } finally {

      setLoading(false)

    }
  }

  const length = summary.length

  // ==================================================
  // SECTION 06 : INIT LOADING UI
  // ==================================================

  if (initLoading) {
    return (
      <div style={centerStyle}>
        불러오는 중...
      </div>
    )
  }

  // ==================================================
  // SECTION 07 : UI
  // ==================================================

  return (
    <div style={wrapperStyle}>

      <div style={containerStyle}>

        {/* 카드 */}
        <div style={cardStyle}>

          <h1 style={titleStyle}>
            비즈니스 소개
          </h1>

          {/* TEXTAREA */}
          <div style={{ marginBottom: 12 }}>

            <textarea
              value={summary}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="비즈니스 소개를 입력해 주세요 (200~300자 권장)"
              style={textareaStyle}
            />

            {/* COUNT */}
            <div style={countStyle}>
              {length} / {MAX_LENGTH}
            </div>

          </div>

          {/* SAVE */}
          <button
            onClick={handleSave}
            disabled={loading}
            style={primaryBtn}
          >
            {loading ? '저장 중...' : '저장'}
          </button>

        </div>

      </div>
    </div>
  )
}

// ==================================================
// SECTION 08 : STYLE
// ==================================================

const wrapperStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '100vh',
  background: '#f3f4f6'
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 640,
  margin: '0 auto',
  padding: '20px 16px'
}

const cardStyle: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  boxSizing: 'border-box'
}

const titleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 16
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 160,
  padding: 16,
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  boxSizing: 'border-box',
  resize: 'none',
  outline: 'none',
  fontSize: 14,
  lineHeight: 1.5
}

const countStyle: React.CSSProperties = {
  textAlign: 'right',
  fontSize: 12,
  color: '#6b7280',
  marginTop: 6
}

const primaryBtn: React.CSSProperties = {
  width: '100%',
  height: 56,
  borderRadius: 14,
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  fontWeight: 600,
  cursor: 'pointer'
}

const centerStyle: React.CSSProperties = {
  width: '100%',
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}