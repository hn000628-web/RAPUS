// FILE : frontend/app/(after-login)/profile/business/settings/components/IndustrySelect.tsx
// ROOT : frontend/app/(after-login)/profile/business/settings/components/IndustrySelect.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS INDUSTRY SELECT DISPLAY SECTION
// CHANGE SUMMARY :
// - 구형 /admin fetch 제거
// - BUSINESS profileApi helper 기반 조회로 변경
// - 업종 표시 포맷을 음식점(한식) 구조로 변경
// - 기존 UI / 스타일 / 버튼 구조 유지

'use client'

// SECTION 01 : IMPORT

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  getBusinessIndustryOptions,
  getBusinessIndustrySubtypeOptions
} from '@/lib/business/profile-settings-api'

// SECTION 02 : TYPE

type Industry = {
  id: number
  name: string
}

type Subtype = {
  id: number
  name: string
}

type Props = {
  industryId: number | null
  setIndustryId: (v: number | null) => void

  subtypeId: number | null
  setSubtypeId: (v: number | null) => void

  customIndustry: string
  setCustomIndustry: (v: string) => void
}

// SECTION 03 : COMPONENT

export default function IndustrySelect({
  industryId,
  subtypeId,
  customIndustry
}: Props) {
  const router =
    useRouter()

  const [industryName, setIndustryName] =
    useState<string | null>(null)

  const [subtypeName, setSubtypeName] =
    useState<string | null>(null)

  // SECTION 04 : LOAD NAME

  useEffect(() => {
    const load = async () => {
      try {
        if (!industryId) {
          setIndustryName(null)
          setSubtypeName(null)
          return
        }

        const industries =
          await getBusinessIndustryOptions()

        const foundIndustry =
          industries.find(
            (item) => item.id === industryId
          )

        setIndustryName(
          foundIndustry?.name || null
        )

        if (!subtypeId) {
          setSubtypeName(null)
          return
        }

        const subtypes =
          await getBusinessIndustrySubtypeOptions(
            industryId
          )

        const foundSubtype =
          subtypes.find(
            (item) => item.id === subtypeId
          )

        setSubtypeName(
          foundSubtype?.name || null
        )
      } catch (error) {
        console.error('industry name load fail', error)
        setIndustryName(null)
        setSubtypeName(null)
      }
    }

    load()
  }, [industryId, subtypeId])

  // SECTION 05 : DISPLAY TEXT

  function displayText() {
    if (customIndustry) {
      return customIndustry
    }

    if (industryName && subtypeName) {
      return `${industryName}(${subtypeName})`
    }

    if (industryName) {
      return industryName
    }

    return '업종 미설정'
  }

  // SECTION 06 : RETURN

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 6
        }}
      >
        비즈니스 업종
      </div>

      <div style={boxStyle}>
        <div style={textStyle}>
          {displayText()}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              '/profile/business/account'
            )
          }
          style={btnStyle}
        >
          업종설정
        </button>
      </div>
    </div>
  )
}

// SECTION 07 : STYLE

const boxStyle: React.CSSProperties = {
  height: 48,
  borderRadius: 12,
  border: '1px solid #ddd',
  display: 'flex',
  alignItems: 'center',
  padding: '0 14px',
  background: '#fff'
}

const textStyle: React.CSSProperties = {
  flex: 1,
  fontSize: 14,
  color: '#555'
}

const btnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#1877f2',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer'
}
