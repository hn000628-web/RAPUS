// FILE : frontend/app/(after-login)/profile/components/ProfileEntrySection/GeneralProfileEntrySection.tsx
// ROOT : frontend/app/(after-login)/profile/components/ProfileEntrySection/GeneralProfileEntrySection.tsx
// STATUS : MODIFY MODE
// ROLE : GENERAL PROFILE ENTRY SECTION
// CHANGE SUMMARY :
// - 기존 하드코딩 프로필 선택 카드 UI를 GeneralProfileEntrySection 내부로 이전
// - GENERAL 프로필 전용 카드만 표시
// - profileType 이 GENERAL 이 아니면 렌더링 차단
// - 계정정보 카드 기준과 동일한 박스 카드 UI 구조 적용
// - JSX multi-line / 섹션형 구조 유지

'use client'

// SECTION 01 : IMPORT
import { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'

// SECTION 02 : TYPE
interface GeneralProfileEntrySectionProps {
  profileType: 'GENERAL' | 'BUSINESS'
  onEnter?: () => void
}

// SECTION 03 : COMPONENT
export default function GeneralProfileEntrySection({
  profileType,
  onEnter
}: GeneralProfileEntrySectionProps) {
  const router = useRouter()

  // SECTION 04 : RENDER LOGIC
  const isGeneralProfile = profileType === 'GENERAL'

  if (!isGeneralProfile) {
    return null
  }

  // SECTION 05 : EVENT FUNCTION
  function handleEnterGeneralProfile() {
    if (onEnter) {
      onEnter()
      return
    }

    router.push('/profile/general')
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
          onClick={handleEnterGeneralProfile}
        >
          <div style={profileIcon}>
            일반
          </div>

          <div style={profileContent}>
            <strong style={cardTitle}>
              일반 프로필
            </strong>

            <span style={cardDescription}>
              개인 피드와 일반 활동 영역
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