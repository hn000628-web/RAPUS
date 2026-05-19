// FILE : frontend/app/(after-login)/profile/components/ProfileEntrySection/BusinessProfileEntrySection.tsx
// ROOT : frontend/app/(after-login)/profile/components/ProfileEntrySection/BusinessProfileEntrySection.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS PROFILE ENTRY SECTION
// CHANGE SUMMARY :
// - BUSINESS 전용 프로필 카드 UI로 수정
// - GENERAL 렌더링 분기 제거
// - 하드코딩 프로필 카드 UI를 섹션 컴포넌트 내부로 이전
// - profileType 이 BUSINESS 가 아닐 경우 렌더링 차단
// - GeneralProfileEntrySection 과 동일한 카드 UI 구조 적용
// - JSX multi-line / 섹션형 구조 유지

'use client'

// SECTION 01 : IMPORT
import { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'

// SECTION 02 : TYPE
interface BusinessProfileEntrySectionProps {
  profileType: 'GENERAL' | 'BUSINESS'
  onEnter?: () => void
}

// SECTION 03 : COMPONENT
export default function BusinessProfileEntrySection({
  profileType,
  onEnter
}: BusinessProfileEntrySectionProps) {
  const router = useRouter()

  // SECTION 04 : RENDER LOGIC
  const isBusinessProfile = profileType === 'BUSINESS'

  if (!isBusinessProfile) {
    return null
  }

  // SECTION 05 : EVENT FUNCTION
  function handleEnterBusinessProfile() {
    if (onEnter) {
      onEnter()
      return
    }

    router.push('/profile/business')
  }

  // SECTION 06 : RETURN
  return (
    <section style={section}>
      <div style={sectionHeader}>
        <h2 style={sectionTitle}>
          프로필
        </h2>
      </div>

      <div style={cardGrid}>
        <button
          type="button"
          style={profileCard}
          onClick={handleEnterBusinessProfile}
        >
          <div style={profileIcon}>
            비즈니스
          </div>

          <div style={profileContent}>
            <strong style={cardTitle}>
              비즈니스 프로필
            </strong>

            <span style={cardDescription}>
              매장 정보, 메뉴, 이벤트, 리뷰 관리
            </span>
          </div>
        </button>
      </div>
    </section>
  )
}

// SECTION 07 : STYLE
const section: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 18,
  padding: 18,
  marginBottom: 18,
  boxShadow: '0 8px 24px rgba(15,23,42,0.04)'
}

const sectionHeader: CSSProperties = {
  marginBottom: 14
}

const sectionTitle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: '#111827',
  margin: 0
}

const cardGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 12
}

const profileCard: CSSProperties = {
  width: '100%',
  minHeight: 70,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  borderRadius: 16,
  padding: 16,
  cursor: 'pointer',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 12
}

const profileIcon: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 26,
  background: '#f1f5f9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 700,
  color: '#475569',
  flexShrink: 0
}

const profileContent: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4
}

const cardTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: '#111827'
}

const cardDescription: CSSProperties = {
  fontSize: 12,
  color: '#6b7280',
  lineHeight: 1.4
}