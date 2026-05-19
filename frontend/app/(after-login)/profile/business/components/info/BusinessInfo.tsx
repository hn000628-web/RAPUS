// FILE : frontend/app/(after-login)/profile/business/components/info/BusinessInfo.tsx
// ROOT : frontend/app/(after-login)/profile/business/components/info/BusinessInfo.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS INFO / PLACE GUIDE VIEW COMPONENT
// CHANGE SUMMARY :
// - 안내 페이지 상단 타이틀 "안내 정보" 제거
// - 소개 / 추가 안내 자동 타이틀 제거
// - 저장된 데이터베이스 값만 read-only로 렌더링
// - 연락처 / 주소 / 영업 안내 / 주간 영업시간 출력 유지
// - bio / sections 출력 유지
// - 기존 props / 데이터 구조 / API 영향 없음

'use client'

// SECTION 01 : IMPORT

import React, { useMemo } from 'react'

// SECTION 02 : TYPE

type ProfileBlock = {
  id?: number
  type: 'TEXT' | 'LINK' | 'IMAGE' | 'SECTION'
  title?: string
  value?: string | null
  content?: string | null
  url?: string | null
  imageUrl?: string | null
  sortOrder?: number
}

type BusinessHoursDay = {
  dayKey: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
  dayLabel: string
  isClosed: boolean
  openTime: string
  closeTime: string
}

type BusinessHoursPayload = {
  summary?: string | null
  weeklyHours?: BusinessHoursDay[] | null
}

// SECTION 03 : PROPS

type Props = {
  bio?: string | null
  contactPhone?: string | null
  regionName?: string | null
  detailAddress?: string | null
  hours?: BusinessHoursPayload | null
  sections?: ProfileBlock[] | null
}

// SECTION 04 : COMPONENT

export default function BusinessInfo({
  bio,
  contactPhone,
  regionName,
  detailAddress,
  hours,
  sections
}: Props) {
  const safeSections =
    sections ?? []

  const hasBio =
    !!bio && bio.trim() !== ''

  const hasContactPhone =
    !!contactPhone && contactPhone.trim() !== ''

  const weeklyHours =
    Array.isArray(hours?.weeklyHours)
      ? hours.weeklyHours
      : []

  const hasHoursSummary =
    !!hours?.summary && hours.summary.trim() !== ''

  const hasWeeklyHours =
    weeklyHours.length > 0

  // SECTION 05 : SORT

  const sortedSections =
    useMemo(() => {
      return [...safeSections]
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) -
            (b.sortOrder ?? 0)
        )
    }, [safeSections])

  // SECTION 06 : HELPER

  function getBlockText(
    block: ProfileBlock
  ): string {
    return (
      block.value ??
      block.content ??
      ''
    )
  }

  function normalizeText(
    value?: string | null
  ): string {
    if (typeof value !== 'string') {
      return ''
    }

    return value.trim()
  }

  function buildFullAddress(): string {
    const safeRegionName =
      normalizeText(regionName)

    const safeDetailAddress =
      normalizeText(detailAddress)

    if (safeRegionName && safeDetailAddress) {
      return `${safeRegionName} ${safeDetailAddress}`
    }

    if (safeRegionName) {
      return safeRegionName
    }

    if (safeDetailAddress) {
      return safeDetailAddress
    }

    return ''
  }

  const displayAddress =
    buildFullAddress()

  const hasFullAddress =
    displayAddress !== ''

  const hasMainInfo =
    hasContactPhone ||
    hasFullAddress ||
    hasHoursSummary ||
    hasWeeklyHours

  const hasAnyInfo =
    hasMainInfo ||
    hasBio ||
    sortedSections.length > 0

  // SECTION 07 : RENDER

  return (
    <div style={wrap}>
      {!hasAnyInfo && (
        <div style={emptyCard}>
          안내 정보가 아직 등록되지 않았습니다.
        </div>
      )}

      {hasMainInfo && (
        <div style={card}>
          {hasContactPhone && (
            <div style={row}>
              <div style={label}>
                연락처
              </div>

              <div style={value}>
                {contactPhone}
              </div>
            </div>
          )}

          {hasFullAddress && (
            <div style={row}>
              <div style={label}>
                주소
              </div>

              <div style={value}>
                {displayAddress}
              </div>
            </div>
          )}

          {hasHoursSummary && (
            <div style={row}>
              <div style={label}>
                영업 안내
              </div>

              <div style={value}>
                {hours?.summary}
              </div>
            </div>
          )}

          {hasWeeklyHours && (
            <div style={hoursWrap}>
              <div style={label}>
                주간 영업시간
              </div>

              <div style={hoursTable}>
                {weeklyHours.map((day) => (
                  <div
                    key={day.dayKey}
                    style={hoursRow}
                  >
                    <div style={hoursDay}>
                      {day.dayLabel}
                    </div>

                    <div style={hoursValue}>
                      {day.isClosed
                        ? '휴무'
                        : `${day.openTime} - ${day.closeTime}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {hasBio && (
        <div style={card}>
          <div style={bioStyle}>
            {bio}
          </div>
        </div>
      )}

      {sortedSections.length > 0 && (
        <div style={card}>
          <div style={blocksWrap}>
            {sortedSections.map((block) => {
              if (block.type === 'SECTION') {
                return (
                  <div
                    key={block.id}
                    style={subSectionTitle}
                  >
                    {block.title}
                  </div>
                )
              }

              if (block.type === 'TEXT') {
                return (
                  <div
                    key={block.id}
                    style={row}
                  >
                    {block.title && (
                      <div style={label}>
                        {block.title}
                      </div>
                    )}

                    <div style={value}>
                      {getBlockText(block)}
                    </div>
                  </div>
                )
              }

              if (block.type === 'LINK') {
                return (
                  <div
                    key={block.id}
                    style={row}
                  >
                    {block.title && (
                      <div style={label}>
                        {block.title}
                      </div>
                    )}

                    <a
                      href={block.url || '#'}
                      target='_blank'
                      rel='noreferrer'
                      style={link}
                    >
                      {block.url}
                    </a>
                  </div>
                )
              }

              if (block.type === 'IMAGE') {
                return (
                  <div
                    key={block.id}
                    style={imageWrap}
                  >
                    {block.title && (
                      <div style={label}>
                        {block.title}
                      </div>
                    )}

                    {block.imageUrl && (
                      <img
                        src={block.imageUrl}
                        alt={block.title || 'guide-image'}
                        style={image}
                      />
                    )}
                  </div>
                )
              }

              return null
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// SECTION 08 : STYLE

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16
}

const card: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 16,
  border: '1px solid #eceff3',
  borderRadius: 14,
  background: '#fff'
}

const emptyCard: React.CSSProperties = {
  padding: 16,
  border: '1px solid #eceff3',
  borderRadius: 14,
  background: '#fff',
  fontSize: 14,
  color: '#666'
}

const subSectionTitle: React.CSSProperties = {
  marginTop: 6,
  fontWeight: 700,
  fontSize: 14,
  color: '#222'
}

const bioStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#333',
  lineHeight: 1.7,
  whiteSpace: 'pre-wrap'
}

const row: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4
}

const label: React.CSSProperties = {
  fontSize: 12,
  color: '#888'
}

const value: React.CSSProperties = {
  fontSize: 14,
  color: '#222',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap'
}

const link: React.CSSProperties = {
  fontSize: 14,
  color: '#1877f2',
  textDecoration: 'none',
  wordBreak: 'break-all'
}

const imageWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
}

const image: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  objectFit: 'cover'
}

const blocksWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14
}

const hoursWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8
}

const hoursTable: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
}

const hoursRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '8px 10px',
  borderRadius: 10,
  background: '#f8fafc'
}

const hoursDay: React.CSSProperties = {
  fontSize: 13,
  color: '#555',
  fontWeight: 600
}

const hoursValue: React.CSSProperties = {
  fontSize: 13,
  color: '#222'
}