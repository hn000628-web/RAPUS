// FILE : frontend/app/(after-login)/profile/business/settings/region/page.tsx
// ROOT : frontend/app/(after-login)/profile/business/settings/region/page.tsx
// STATUS : AUTO SEARCH + UX FIX FINAL (SELECT -> LIST HIDE FIX)

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  getMyBusinessProfileFull,
  updateBusinessChannelRegion
} from '@/lib/business/profile-settings-api'

import {
  searchRegions
} from '@/lib/regionsApi'

import type { Region } from '@/types/region'

const FIELD_HEIGHT = 56

export default function RegionSettingsPage() {

  const router = useRouter()

  const [profileId, setProfileId] = useState<number | null>(null)

  const [currentRegionLabel, setCurrentRegionLabel] =
    useState('지역 미설정')

  const [query, setQuery] = useState('')

  const [results, setResults] = useState<Region[]>([])

  const [selectedRegion, setSelectedRegion] =
    useState<Region | null>(null)

  const [detailAddress, setDetailAddress] =
    useState('')

  const [loading, setLoading] = useState(false)

  const [searchLoading, setSearchLoading] =
    useState(false)

  // INIT LOAD
  useEffect(() => {

    async function load() {

      try {

        const data =
          await getMyBusinessProfileFull()

        const regionName =
          data.placeMeta.activityRegion?.fullName ??
          data.placeMeta.feedRegion?.fullName ??
          '지역 미설정'

        setProfileId(data.profile.id)
        setCurrentRegionLabel(regionName)
        setDetailAddress(data.placeMeta.detailAddress ?? '')

        if (data.activityRegionId) {
          setSelectedRegion({
            id: data.activityRegionId,
            name: regionName,
            fullName: regionName
          })
        }

      } catch (error) {
        console.error(error)
        alert('지역 정보를 불러오지 못했습니다.')
      }
    }

    void load()

  }, [])

  // AUTO SEARCH
  useEffect(() => {

    const q = query.trim()

    if (q.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {

      try {

        setSearchLoading(true)

        const response =
          await searchRegions(q)

        if (!response.ok) {
          setResults([])
          return
        }

        setResults(response.regions || [])

      } catch (error) {
        console.error(error)
        setResults([])
      } finally {
        setSearchLoading(false)
      }

    }, 300)

    return () => clearTimeout(timer)

  }, [query])

  // SAVE
  async function handleSave() {

    if (!profileId) {
      alert('프로필 정보를 찾을 수 없습니다.')
      return
    }

    if (!selectedRegion) {
      alert('지역을 선택해 주세요.')
      return
    }

    setLoading(true)

    try {

      await updateBusinessChannelRegion(profileId, {
        activityRegionId: selectedRegion.id,
        feedRegionId: selectedRegion.id,
        detailAddress: detailAddress.trim() || null
      })

      alert('지역 설정이 저장되었습니다.')

      router.push('/profile/business/settings')

    } catch (error) {
      console.error(error)
      alert('지역 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setSelectedRegion(null)
    setDetailAddress('')
  }

  const selectedLabel =
    selectedRegion?.fullName ||
    selectedRegion?.name ||
    '선택된 지역이 없습니다.'

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#f5f6f7' }}>

      <div
        style={{
          width: '100%',
          maxWidth: 720,
          margin: '0 auto',
          padding: '16px 20px'
        }}
      >

        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 20
          }}
        >

          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
            지역 설정
          </h1>

          {/* 현재 지역 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              현재 지역
            </div>
            <div style={boxStyle}>
              {currentRegionLabel}
            </div>
          </div>

          {/* 검색 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              지역 검색
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="2자 이상 입력 시 자동 검색"
              style={inputStyle}
            />
          </div>

          {/* 결과 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              검색 결과
            </div>

            {query && (
              <div style={resultBoxStyle}>

                {searchLoading ? (
                  <div style={rowStyle}>
                    검색 중...
                  </div>
                ) : results.length === 0 ? (
                  <div style={rowStyle}>
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  results.map((region, index) => (
                    <button
                      key={region.id}
                      onClick={() => {
                        setSelectedRegion(region)
                        setQuery('')
                        setResults([])
                      }}
                      style={{
                        ...rowButtonStyle,
                        background:
                          selectedRegion?.id === region.id
                            ? '#eff6ff'
                            : '#fff',
                        borderBottom:
                          index === results.length - 1
                            ? 'none'
                            : '1px solid #e5e7eb'
                      }}
                    >
                      {region.fullName || region.name}
                    </button>
                  ))
                )}

              </div>
            )}
          </div>

          {/* 선택 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              선택 지역
            </div>
            <div style={boxStyle}>
              {selectedLabel}
            </div>
          </div>

          {/* 상세주소 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              상세 주소
            </div>
            <input
              value={detailAddress}
              onChange={(e) => setDetailAddress(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* 저장 */}
          <button
            onClick={handleSave}
            disabled={loading}
            style={primaryBtn}
          >
            {loading ? '저장 중...' : '지역 저장'}
          </button>

          <div style={{ marginTop: 12 }}>
            <button
              onClick={handleClear}
              style={secondaryBtn}
            >
              초기화
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// STYLE

const baseField: React.CSSProperties = {
  width: '100%',
  height: FIELD_HEIGHT,
  padding: '0 16px',
  border: '1px solid #d1d5db',
  borderRadius: 14,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center'
}

const boxStyle = { ...baseField }

const inputStyle: React.CSSProperties = {
  ...baseField,
  display: 'block'
}

const resultBoxStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: 14,
  overflow: 'hidden',
  boxSizing: 'border-box'
}

const rowStyle: React.CSSProperties = {
  width: '100%',
  minHeight: FIELD_HEIGHT,
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  boxSizing: 'border-box'
}

const rowButtonStyle: React.CSSProperties = {
  width: '100%',
  minHeight: FIELD_HEIGHT,
  padding: '12px 16px',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  boxSizing: 'border-box'
}

const primaryBtn: React.CSSProperties = {
  width: '100%',
  height: FIELD_HEIGHT,
  borderRadius: 14,
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  fontWeight: 600,
  boxSizing: 'border-box'
}

const secondaryBtn: React.CSSProperties = {
  width: '100%',
  height: FIELD_HEIGHT,
  borderRadius: 14,
  background: '#9ca3af',
  color: '#fff',
  border: 'none',
  boxSizing: 'border-box'
}
