// FILE : frontend/app/feed/place/PlaceFeedSidebar.tsx
// ROOT : frontend/app/feed/place/PlaceFeedSidebar.tsx
// STATUS : MODIFY MODE
// ROLE : PLACE FEED SIDEBAR
// CHANGE SUMMARY :
// - 사이드바 버튼/라벨 전수 한글화 기준 정리
// - SORT / FILTER / REGION 관련 문구 일관성 유지
// - industryFilters.label 한글 사용 전제 명시
// - UI / 스타일 / 로직 변경 없음

'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'

export type PlaceIndustryFilter = {
  label: string // 반드시 한글 라벨 사용
  value: string
}

export type PlaceSortType =
  | 'LATEST'
  | 'DISTANCE'

export type BusinessStatusFilter =
  | 'ALL'
  | 'OPEN'
  | 'CLOSED'

type Props = {
  industryFilters: PlaceIndustryFilter[]
  selectedIndustry: string
  selectedSort: PlaceSortType
  selectedBusinessStatus: BusinessStatusFilter
  onSelectIndustry: (value: string) => void
  onSelectSort: (value: PlaceSortType) => void
  onSelectBusinessStatus: (value: BusinessStatusFilter) => void
  onReset: () => void
}

const SORT_FILTERS: Array<{
  label: string
  value: PlaceSortType
}> = [
  {
    label: '최신순',
    value: 'LATEST'
  },
  {
    label: '가까운 순', // 미세 수정 (띄어쓰기 통일)
    value: 'DISTANCE'
  }
]

const BUSINESS_STATUS_FILTERS: Array<{
  label: string
  value: BusinessStatusFilter
}> = [
  {
    label: '전체',
    value: 'ALL'
  },
  {
    label: '영업중',
    value: 'OPEN'
  },
  {
    label: '휴무',
    value: 'CLOSED'
  }
]

export default function PlaceFeedSidebar({
  industryFilters,
  selectedIndustry,
  selectedSort,
  selectedBusinessStatus,
  onSelectIndustry,
  onSelectSort,
  onSelectBusinessStatus,
  onReset
}: Props) {
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] =
    useState(false)
  const [isSortDropdownOpen, setIsSortDropdownOpen] =
    useState(false)
  const [isBusinessStatusDropdownOpen, setIsBusinessStatusDropdownOpen] =
    useState(false)

  const selectedIndustryLabel = industryFilters.find((filter) => {
    return filter.value === selectedIndustry
  })?.label || '전체'

  const selectedSortLabel = SORT_FILTERS.find((filter) => {
    return filter.value === selectedSort
  })?.label || '최신순'

  const selectedBusinessStatusLabel = BUSINESS_STATUS_FILTERS.find((filter) => {
    return filter.value === selectedBusinessStatus
  })?.label || '전체'

  const handleSelectIndustry = (value: string) => {
    onSelectIndustry(value)
    setIsIndustryDropdownOpen(false)
  }

  const handleSelectSort = (value: PlaceSortType) => {
    onSelectSort(value)
    setIsSortDropdownOpen(false)
  }

  const handleSelectBusinessStatus = (value: BusinessStatusFilter) => {
    onSelectBusinessStatus(value)
    setIsBusinessStatusDropdownOpen(false)
  }

  return (
    <aside style={sidebarStyle}>
      <div style={headerRowStyle}>
        <div style={sidebarTitleStyle}>
          플레이스
        </div>
      </div>

      <div style={filterHeaderRowStyle}>
        <div style={filterHeaderTitleStyle}>
          필터
        </div>

        <button
          type="button"
          onClick={onReset}
          style={resetButtonStyle}
        >
          전체 초기화
        </button>
      </div>

      <section style={filterGroupStyle}>
        <div style={filterLabelStyle}>
          정렬
        </div>

        <div style={dropdownContainerStyle}>
          <button
            type="button"
            onClick={() => {
              setIsSortDropdownOpen((prev) => !prev)
            }}
            style={industryDropdownButtonStyle}
          >
            <span>{selectedSortLabel}</span>
            <span style={dropdownArrowStyle}>▼</span>
          </button>

          {isSortDropdownOpen && (
            <div style={sortDropdownPanelStyle}>
              {SORT_FILTERS.map((filter) => {
                const selected =
                  selectedSort === filter.value

                return (
                  <button
                    key={filter.value}
                    type="button"
                    style={{
                      ...industryOptionButtonStyle,
                      ...(selected
                        ? selectedIndustryOptionButtonStyle
                        : null)
                    }}
                    onClick={() => handleSelectSort(filter.value)}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section style={filterGroupStyle}>
        <div style={filterLabelStyle}>
          영업상태
        </div>

        <div style={dropdownContainerStyle}>
          <button
            type="button"
            onClick={() => {
              setIsBusinessStatusDropdownOpen((prev) => !prev)
            }}
            style={industryDropdownButtonStyle}
          >
            <span>{selectedBusinessStatusLabel}</span>
            <span style={dropdownArrowStyle}>▼</span>
          </button>

          {isBusinessStatusDropdownOpen && (
            <div style={sortDropdownPanelStyle}>
              {BUSINESS_STATUS_FILTERS.map((filter) => {
                const selected =
                  selectedBusinessStatus === filter.value

                return (
                  <button
                    key={filter.value}
                    type="button"
                    style={{
                      ...industryOptionButtonStyle,
                      ...(selected
                        ? selectedIndustryOptionButtonStyle
                        : null)
                    }}
                    onClick={() => handleSelectBusinessStatus(filter.value)}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section style={filterGroupStyle}>
        <div style={filterLabelStyle}>
          업종
        </div>

        <div style={dropdownContainerStyle}>
          <button
            type="button"
            onClick={() => {
              setIsIndustryDropdownOpen((prev) => !prev)
            }}
            style={industryDropdownButtonStyle}
          >
            <span>{selectedIndustryLabel}</span>
            <span style={dropdownArrowStyle}>▼</span>
          </button>

          {isIndustryDropdownOpen && (
            <div style={industryDropdownPanelStyle}>
              {industryFilters.map((filter) => {
                const selected =
                  selectedIndustry === filter.value

                return (
                  <button
                    key={filter.value}
                    type="button"
                    style={{
                      ...industryOptionButtonStyle,
                    ...(selected
                        ? selectedIndustryOptionButtonStyle
                        : null)
                    }}
                    onClick={() => handleSelectIndustry(filter.value)}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </aside>
  )
}

const sidebarStyle: CSSProperties = {
  width: 230,
  flex: '0 0 230px',
  position: 'sticky',
  top: 88,
  paddingTop: 8,
  boxSizing: 'border-box'
}

const headerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 12
}

const filterHeaderRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 18
}

const sidebarTitleStyle: CSSProperties = {
  fontSize: 21,
  fontWeight: 900,
  color: '#111827',
  lineHeight: 1.2
}

const filterHeaderTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 900,
  color: '#111827',
  lineHeight: 1.2
}

const resetButtonStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#6b7280',
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'underline',
  cursor: 'pointer',
  padding: 0
}

const filterGroupStyle: CSSProperties = {
  padding: '18px 0',
  borderTop: '1px solid #f1f5f9'
}

const filterLabelStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 900,
  color: '#111827',
  marginBottom: 12
}

const dropdownContainerStyle: CSSProperties = {
  position: 'relative'
}

const industryDropdownButtonStyle: CSSProperties = {
  width: '100%',
  height: 36,
  borderRadius: 999,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  color: '#374151',
  fontSize: 13,
  fontWeight: 800,
  textAlign: 'left',
  padding: '0 14px',
  cursor: 'pointer',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}

const dropdownArrowStyle: CSSProperties = {
  fontSize: 11,
  color: '#6b7280'
}

const industryDropdownPanelStyle: CSSProperties = {
  marginTop: 8,
  width: '100%',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.08)',
  padding: '6px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  maxHeight: 280,
  overflowY: 'auto',
  boxSizing: 'border-box',
  zIndex: 5
}

const sortDropdownPanelStyle: CSSProperties = {
  ...industryDropdownPanelStyle
}

const industryOptionButtonStyle: CSSProperties = {
  width: '100%',
  height: 34,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  color: '#374151',
  fontSize: 13,
  fontWeight: 800,
  textAlign: 'left',
  padding: '0 12px',
  cursor: 'pointer',
  boxSizing: 'border-box'
}

const selectedIndustryOptionButtonStyle: CSSProperties = {
  borderColor: '#ff6f0f',
  color: '#ff6f0f',
  background: '#fff7ed'
}
