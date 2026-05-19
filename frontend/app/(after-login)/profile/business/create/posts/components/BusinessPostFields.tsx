// FILE : frontend/app/(after-login)/profile/business/create/posts/components/BusinessPostFields.tsx
// ROOT : frontend/app/(after-login)/profile/business/create/posts/components/BusinessPostFields.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS POST CREATE FIELD COMPONENT
// CHANGE SUMMARY :
// - 제목 하단에 프로필 업종 표시 UI 추가
// - 업종은 포스트 입력값이 아니라 프로필 상속 표시값으로만 사용
// - profileIndustryLabel optional props 추가
// - 업종 미설정 상태 표시 추가
// - RegionSelector 공용 import 제거 유지
// - BusinessRegionSelector 비즈니스 전용 컴포넌트 import 유지
// - 비즈니스 게시물 작성 전용 지역 선택 컴포넌트 연결 유지
// - 기존 props / UI / 스타일 / 상태 구조 유지

'use client'

// SECTION 01 : IMPORT

import type {
  CSSProperties,
  Dispatch,
  SetStateAction
} from 'react'

import type {
  BusinessPostType
} from './businessPostTypes'

import CategorySelectGeneral from './CategorySelectGeneral'
import BusinessRegionSelector from './BusinessRegionSelector'

// SECTION 02 : TYPE

type Props = {
  category: BusinessPostType | ''
  setCategory: Dispatch<SetStateAction<BusinessPostType | ''>>

  tradeRegionId: number | null
  setTradeRegionId: Dispatch<SetStateAction<number | null>>

  profileRegionId: number | null
  profileRegionName: string | null

  profileIndustryLabel?: string | null

  title: string
  setTitle: Dispatch<SetStateAction<string>>

  keywords: string
  setKeywords: Dispatch<SetStateAction<string>>

  content: string
  setContent: Dispatch<SetStateAction<string>>

  price: string
  setPrice: Dispatch<SetStateAction<string>>

  loading: boolean
}

// SECTION 03 : CONSTANT

const baseFieldStyle: CSSProperties = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid #e0e0e0',
  outline: 'none',
  boxSizing: 'border-box'
}

const industryBoxStyle: CSSProperties = {
  width: '100%',
  minHeight: 48,
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#f8fafc',
  boxSizing: 'border-box',
  padding: '10px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12
}

const industryLabelWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  minWidth: 0
}

const industryTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#64748b'
}

const industryValueStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#111827',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}

const industryMissingStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#dc2626',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}

// SECTION 04 : COMPONENT

export default function BusinessPostFields({
  category,
  setCategory,
  tradeRegionId,
  setTradeRegionId,
  profileRegionId,
  profileRegionName,
  profileIndustryLabel,
  title,
  setTitle,
  keywords,
  setKeywords,
  content,
  setContent,
  price,
  setPrice,
  loading
}: Props) {
  const isUsed =
    category === 'PRODUCT'

  const hasIndustry =
    typeof profileIndustryLabel === 'string' &&
    profileIndustryLabel.trim().length > 0

  // SECTION 05 : DATA FUNCTION

  const formatNumber = (
    value: string
  ) => {
    const num =
      Number(value.replace(/,/g, ''))

    if (Number.isNaN(num)) {
      return ''
    }

    return num.toLocaleString()
  }

  // SECTION 06 : RETURN

  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="제목을 입력하세요"
          value={title}
          disabled={loading}
          onChange={(event) => setTitle(event.target.value)}
          style={{
            ...baseFieldStyle,
            height: 52,
            padding: '0 16px',
            fontSize: 18,
            fontWeight: 600,
            opacity: loading ? 0.6 : 1
          }}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={industryBoxStyle}>
          <div style={industryLabelWrapStyle}>
            <div style={industryTitleStyle}>
              프로필 업종
            </div>

            <div
              style={
                hasIndustry
                  ? industryValueStyle
                  : industryMissingStyle
              }
            >
              {hasIndustry
                ? profileIndustryLabel
                : '업종 미설정'}
            </div>
          </div>

          {!hasIndustry && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#dc2626',
                whiteSpace: 'nowrap'
              }}
            >
              등록 필요
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <CategorySelectGeneral
          category={category}
          setCategory={setCategory}
          loading={loading}
        />
      </div>

      <BusinessRegionSelector
        profileRegionId={profileRegionId}
        profileRegionName={profileRegionName}
        tradeRegionId={tradeRegionId}
        setTradeRegionId={setTradeRegionId}
        loading={loading}
      />

      {isUsed && (
        <div style={{ marginTop: 10, marginBottom: 10 }}>
          <input
            placeholder="가격 입력"
            value={formatNumber(price)}
            disabled={loading}
            onChange={(event) => setPrice(event.target.value)}
            style={{
              ...baseFieldStyle,
              height: 52,
              padding: '0 16px',
              fontSize: 16,
              fontWeight: 500,
              opacity: loading ? 0.6 : 1
            }}
          />
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="키워드 입력 (# , . / 공백 모두 가능)"
          value={keywords}
          disabled={loading}
          onChange={(event) => setKeywords(event.target.value)}
          style={{
            ...baseFieldStyle,
            height: 46,
            padding: '0 14px',
            fontSize: 14,
            fontWeight: 500,
            background: '#f8f9fa',
            opacity: loading ? 0.6 : 1
          }}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <textarea
          placeholder="내용을 입력하세요"
          value={content}
          disabled={loading}
          onChange={(event) => setContent(event.target.value)}
          style={{
            ...baseFieldStyle,
            minHeight: 180,
            padding: 16,
            resize: 'none',
            fontSize: 15,
            fontWeight: 400,
            lineHeight: 1.6,
            opacity: loading ? 0.6 : 1
          }}
        />
      </div>
    </>
  )
}