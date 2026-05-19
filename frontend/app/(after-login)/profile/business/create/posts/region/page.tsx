// FILE : frontend/app/(after-login)/profile/business/create/posts/region/page.tsx
// ROOT : frontend/app/(after-login)/profile/business/create/posts/region/page.tsx
// STATUS : CREATE MODE
// ROLE : BUSINESS POST CREATE REGION SELECT PAGE
// CHANGE SUMMARY :
// - 기존 비즈니스 프로필 지역설정 페이지 구조를 포스트 작성 전용으로 분리
// - 프로필 지역 저장 API 제거
// - 포스트 작성용 선택 지역을 sessionStorage에 임시 저장
// - 지역 선택 후 /profile/business/create/posts 페이지로 복귀
// - 자동 검색 / 선택 후 리스트 숨김 UX 유지
// - 기존 UI 스타일 구조 유지

'use client'

// SECTION 01 : IMPORT

import {
  useEffect,
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

import {
  getMyBusinessProfileFull
} from '@/lib/business/profile-settings-api'

import {
  searchRegions
} from '@/lib/regionsApi'

import type {
  CSSProperties
} from 'react'

import type {
  Region
} from '@/types/region'

// SECTION 02 : CONSTANT

const FIELD_HEIGHT = 56

const POST_REGION_STORAGE_KEY = 'businessPostCreateRegion'

// SECTION 03 : TYPE

type StoredPostRegion = {
  id: number
  name: string
  fullName: string
}

// SECTION 04 : COMPONENT

export default function BusinessPostRegionPage() {
  const router = useRouter()

  const [currentRegionLabel, setCurrentRegionLabel] =
    useState('지역 미설정')

  const [query, setQuery] = useState('')

  const [results, setResults] = useState<Region[]>([])

  const [selectedRegion, setSelectedRegion] =
    useState<Region | null>(null)

  const [loading, setLoading] = useState(false)

  const [searchLoading, setSearchLoading] =
    useState(false)

  // SECTION 05 : INIT LOAD

  useEffect(() => {
    async function load() {
      try {
        const stored =
          sessionStorage.getItem(POST_REGION_STORAGE_KEY)

        if (stored) {
          const parsed =
            JSON.parse(stored) as StoredPostRegion

          setSelectedRegion({
            id: parsed.id,
            name: parsed.name,
            fullName: parsed.fullName
          })
        }

        const data =
          await getMyBusinessProfileFull()

        const regionName =
          data.placeMeta.activityRegion?.fullName ??
          data.placeMeta.feedRegion?.fullName ??
          '지역 미설정'

        setCurrentRegionLabel(regionName)

        if (!stored && data.activityRegionId) {
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

  // SECTION 06 : AUTO SEARCH

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

  // SECTION 07 : EVENT FUNCTION

  function handleSelect(region: Region) {
    setSelectedRegion(region)
    setQuery('')
    setResults([])
  }

  function handleClear() {
    sessionStorage.removeItem(POST_REGION_STORAGE_KEY)

    setQuery('')
    setResults([])
    setSelectedRegion(null)
  }

  function handleSave() {
    if (!selectedRegion) {
      alert('지역을 선택해 주세요.')
      return
    }

    setLoading(true)

    try {
      const regionName =
        selectedRegion.fullName ||
        selectedRegion.name

      const payload: StoredPostRegion = {
        id: selectedRegion.id,
        name: selectedRegion.name,
        fullName: regionName
      }

      sessionStorage.setItem(
        POST_REGION_STORAGE_KEY,
        JSON.stringify(payload)
      )

      alert('포스트 지역이 적용되었습니다.')

      router.push('/profile/business/create/posts')
    } catch (error) {
      console.error(error)
      alert('포스트 지역 적용에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    router.push('/profile/business/create/posts')
  }

  // SECTION 08 : UI VALUE

  const selectedLabel =
    selectedRegion?.fullName ||
    selectedRegion?.name ||
    '선택된 지역이 없습니다.'

  // SECTION 09 : RETURN

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#f5f6f7'
      }}
    >
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
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 20
            }}
          >
            포스트 지역 설정
          </h1>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              프로필 기본 지역
            </div>

            <div style={boxStyle}>
              {currentRegionLabel}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              지역 검색
            </div>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="2자 이상 입력 시 자동 검색"
              style={inputStyle}
            />
          </div>

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
                      type="button"
                      onClick={() => handleSelect(region)}
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

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              선택 지역
            </div>

            <div style={boxStyle}>
              {selectedLabel}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            style={primaryBtn}
          >
            {loading ? '적용 중...' : '포스트 지역 적용'}
          </button>

          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              style={secondaryBtn}
            >
              초기화
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              style={backBtn}
            >
              작성 페이지로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// SECTION 10 : STYLE

const baseField: CSSProperties = {
  width: '100%',
  height: FIELD_HEIGHT,
  padding: '0 16px',
  border: '1px solid #d1d5db',
  borderRadius: 14,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center'
}

const boxStyle: CSSProperties = {
  ...baseField
}

const inputStyle: CSSProperties = {
  ...baseField,
  display: 'block'
}

const resultBoxStyle: CSSProperties = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: 14,
  overflow: 'hidden',
  boxSizing: 'border-box'
}

const rowStyle: CSSProperties = {
  width: '100%',
  minHeight: FIELD_HEIGHT,
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  boxSizing: 'border-box'
}

const rowButtonStyle: CSSProperties = {
  width: '100%',
  minHeight: FIELD_HEIGHT,
  padding: '12px 16px',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  boxSizing: 'border-box'
}

const primaryBtn: CSSProperties = {
  width: '100%',
  height: FIELD_HEIGHT,
  borderRadius: 14,
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  fontWeight: 600,
  boxSizing: 'border-box'
}

const secondaryBtn: CSSProperties = {
  width: '100%',
  height: FIELD_HEIGHT,
  borderRadius: 14,
  background: '#9ca3af',
  color: '#fff',
  border: 'none',
  boxSizing: 'border-box'
}

const backBtn: CSSProperties = {
  width: '100%',
  height: FIELD_HEIGHT,
  borderRadius: 14,
  background: '#fff',
  color: '#111',
  border: '1px solid #d1d5db',
  fontWeight: 600,
  boxSizing: 'border-box'
}