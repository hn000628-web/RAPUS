// FILE : frontend/app/(after-login)/profile/business/settings/contact/page.tsx
// ROOT : frontend/app/(after-login)/profile/business/settings/contact/page.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS CONTACT SETTINGS PAGE
// CHANGE SUMMARY :
// - 채널코드 표시 포맷 1-4-4-4 적용
// - 텍스트 박스 높이 56px 통일
// - box-sizing 적용
// - 부모 컨테이너 padding 안정화
// - 단일 귀속 컨텍스트(channelCode + profileId) 준수
// - 기존 UI / 스타일 유지

'use client'

import { useState, useEffect } from 'react'
import { getBusinessContact, updateBusinessContact } from '@/lib/business/contact-api'
import { getMe, MeResponse } from '@/lib/authApi'

export default function ContactSettingPage() {
  const [channelCode, setChannelCode] = useState('')
  const [currentContactPhone, setCurrentContactPhone] = useState('연락처 미설정')
  const [nextContactPhone, setNextContactPhone] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const meResp: MeResponse = await getMe()
        if (!meResp.user?.channelCode) throw new Error('로그인 컨텍스트 없음')

        setChannelCode(meResp.user.channelCode)

        const result = await getBusinessContact()
        setCurrentContactPhone(result.contactPhone ?? '연락처 미설정')
        setNextContactPhone(result.contactPhone ?? '')
      } catch {
        setChannelCode('')
        setCurrentContactPhone('연락처 미설정')
        setNextContactPhone('')
      }
    }
    void load()
  }, [])

  const handleSave = async () => {
    if (!channelCode || !nextContactPhone.trim()) {
      alert('채널코드 혹은 연락처 미입력')
      return
    }

    setLoading(true)
    try {
      const updated = await updateBusinessContact({ contactPhone: nextContactPhone })
      setCurrentContactPhone(updated.contactPhone ?? '연락처 미설정')
      setNextContactPhone('')
      alert('대표 연락처 등록 완료')
    } catch (err: any) {
      alert(err?.response?.data?.message || '저장 실패')
    } finally {
      setLoading(false)
    }
  }

  // 채널코드 1-4-4-4 포맷 함수
  const formatChannelCode = (code: string) => {
    if (!code || code.length !== 13) return code
    return `${code.slice(0,1)}-${code.slice(1,5)}-${code.slice(5,9)}-${code.slice(9,13)}`
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#f5f6f7' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          margin: '0 auto',
          padding: '16px 20px',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            overflow: 'hidden',
            padding: 20,
            boxSizing: 'border-box'
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>연락처 설정</h1>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>채널코드</div>
            <div
              style={{
                width: '100%',
                height: 56,
                padding: '0 16px',
                border: '1px solid #ddd',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                boxSizing: 'border-box'
              }}
            >
              {formatChannelCode(channelCode)}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>현재 대표 연락처</div>
            <div
              style={{
                width: '100%',
                height: 56,
                padding: '0 16px',
                border: '1px solid #ddd',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                boxSizing: 'border-box'
              }}
            >
              {currentContactPhone}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>변경할 대표 연락처</div>
            <input
              value={nextContactPhone}
              onChange={e => setNextContactPhone(e.target.value.replace(/[^\d-]/g, '').trim())}
              placeholder="예: 010-1234-1234"
              style={{
                width: '100%',
                height: 56,
                padding: '0 16px',
                border: '1px solid #ddd',
                borderRadius: 14,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              width: '100%',
              height: 56,
              borderRadius: 14,
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {loading ? '등록 중...' : '연락처 등록'}
          </button>
        </div>
      </div>
    </div>
  )
}
