// FILE : frontend/components/Region/FeedRegionOverlay.tsx
// ROOT : frontend/components/Region/FeedRegionOverlay.tsx
// STATUS : MODIFY MODE
// ROLE : FEED REGION SELECT OVERLAY
// CHANGE SUMMARY :
// - 로그인 사용자는 기존 getCurrentRegion / updateFeedRegion API 저장 유지
// - 비로그인 사용자는 localStorage 기반 임시 피드 지역 저장 추가
// - direct fetch 없음
// - regionsApi 사용 유지
// - RegionContext setRegion 동기화 유지
// - DB / API / 백엔드 수정 없음

'use client'

// SECTION 01 : IMPORT

import {
  useEffect,
  useState
} from 'react'

import type {
  CSSProperties
} from 'react'

import type {
  Region
} from '@/types/region'

import RegionGpsSelector from './RegionGpsSelector'

import RegionDbSelector from './RegionDbSelector'

import {
  useRegion
} from '@/components/Region/RegionContext'

import {
  getCurrentRegion,
  updateFeedRegion
} from '@/lib/regionsApi'

// SECTION 02 : TYPE

type Props = {
  onClose: () => void
}

// SECTION 03 : CONSTANT

const PUBLIC_FEED_REGION_STORAGE_KEY =
  'publicFeedRegion'

// SECTION 04 : COMPONENT

export default function FeedRegionOverlay({
  onClose
}: Props) {
  const {
    setRegion
  } = useRegion()

  const [currentRegion, setCurrentRegion] =
    useState<Region | null>(null)

  const [selectedRegion, setSelectedRegion] =
    useState<Region | null>(null)

  const [query, setQuery] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [gpsLoading, setGpsLoading] =
    useState(false)

  // SECTION 05 : DATA FUNCTION

  function hasAccessToken() {
    if (typeof window === 'undefined') {
      return false
    }

    return Boolean(
      localStorage.getItem('accessToken') ||
      localStorage.getItem('token')
    )
  }

  function loadPublicFeedRegion() {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const saved =
        localStorage.getItem(PUBLIC_FEED_REGION_STORAGE_KEY)

      if (!saved) {
        return null
      }

      const parsed =
        JSON.parse(saved) as Region

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !parsed.id
      ) {
        return null
      }

      return parsed
    } catch {
      return null
    }
  }

  function savePublicFeedRegion(
    region: Region
  ) {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(
      PUBLIC_FEED_REGION_STORAGE_KEY,
      JSON.stringify(region)
    )
  }

  async function loadCurrentRegion() {
    if (!hasAccessToken()) {
      const publicRegion =
        loadPublicFeedRegion()

      if (publicRegion) {
        setCurrentRegion(publicRegion)
        setSelectedRegion(publicRegion)
        setRegion(publicRegion)
      }

      return
    }

    try {
      const data =
        await getCurrentRegion()

      if (data?.region) {
        setCurrentRegion(data.region)
        setSelectedRegion(data.region)
        setRegion(data.region)
      }
    } catch (error) {
      console.error(
        'region load error',
        error
      )

      const publicRegion =
        loadPublicFeedRegion()

      if (publicRegion) {
        setCurrentRegion(publicRegion)
        setSelectedRegion(publicRegion)
        setRegion(publicRegion)
      }
    }
  }

  // SECTION 06 : EVENT FUNCTION

  async function handleSave() {
    if (!selectedRegion) {
      alert('지역 선택 필요')
      return
    }

    setLoading(true)

    try {
      if (!hasAccessToken()) {
        savePublicFeedRegion(selectedRegion)
        setCurrentRegion(selectedRegion)
        setRegion(selectedRegion)
        onClose()
        return
      }

      const response =
        await updateFeedRegion(selectedRegion.id)

      if (response.ok) {
        setCurrentRegion(selectedRegion)
        setRegion(selectedRegion)
        onClose()
        return
      }

      alert('저장 실패')
    } catch (error) {
      console.error(
        'region save error',
        error
      )

      alert('저장 실패')
    } finally {
      setLoading(false)
    }
  }

  // SECTION 07 : EFFECT

  useEffect(() => {
    void loadCurrentRegion()
  }, [])

  // SECTION 08 : RETURN

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={titleStyle}>
          피드 지역 설정
        </h2>

        <div style={sectionStyle}>
          <div style={labelStyle}>
            현재 지역
          </div>

          <div style={boxStyle}>
            {currentRegion
              ? currentRegion.fullName
              : '설정되지 않음'}
          </div>
        </div>

        <div style={sectionStyle}>
          <RegionGpsSelector
            gpsLoading={gpsLoading}
            setGpsLoading={setGpsLoading}
            setSelectedRegion={setSelectedRegion}
            setQuery={setQuery}
          />
        </div>

        <div style={sectionStyle}>
          <RegionDbSelector
            query={query}
            setQuery={setQuery}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
          />
        </div>

        <div style={sectionStyle}>
          <div style={labelStyle}>
            선택된 지역
          </div>

          <div style={boxStyle}>
            {selectedRegion
              ? selectedRegion.fullName
              : '지역 선택 필요'}
          </div>
        </div>

        <div style={buttonRowStyle}>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...buttonStyle,
              background: '#999'
            }}
          >
            취소
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            style={buttonStyle}
          >
            {loading
              ? '저장 중...'
              : '적용'}
          </button>
        </div>
      </div>
    </div>
  )
}

// SECTION 09 : STYLE

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999
}

const modalStyle: CSSProperties = {
  width: '100%',
  maxWidth: 520,
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  boxSizing: 'border-box'
}

const titleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 20
}

const sectionStyle: CSSProperties = {
  marginBottom: 20
}

const labelStyle: CSSProperties = {
  fontWeight: 600,
  marginBottom: 6
}

const boxStyle: CSSProperties = {
  width: '100%',
  height: 48,
  display: 'flex',
  alignItems: 'center',
  padding: '0 14px',
  border: '1px solid #ddd',
  borderRadius: 10,
  fontSize: 14,
  boxSizing: 'border-box'
}

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: 10
}

const buttonStyle: CSSProperties = {
  width: '100%',
  height: 48,
  borderRadius: 10,
  background: '#2b6fd6',
  color: '#fff',
  border: 'none',
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer'
}

// SECTION 10 : VALIDATION

/*
VALIDATION:
- 단일 파일 통코드 출력
- direct fetch 없음
- regionsApi 사용 유지
- 로그인 사용자는 DB 저장 updateFeedRegion 유지
- 비로그인 사용자는 localStorage publicFeedRegion 저장
- RegionContext setRegion 동기화 유지
- DB 스키마 변경 없음
- Backend API 변경 없음
- 비로그인 저장 주체 없음 원칙 유지
*/