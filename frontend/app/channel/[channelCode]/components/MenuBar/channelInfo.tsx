// FILE : frontend/app/channel/[channelCode]/components/MenuBar/channelInfo.tsx
// ROOT : frontend/app/channel/[channelCode]/components/MenuBar/channelInfo.tsx
// STATUS : MODIFY MODE
// ROLE : PUBLIC CHANNEL INFO VIEW COMPONENT
// CHANGE SUMMARY :
// - BusinessInfoView.sections 의 id?: number / sortOrder?: number 타입 수용
// - ChannelInfoBlock.id optional 유지
// - ChannelInfoBlock.sortOrder optional 로 변경
// - sort 정렬 시 sortOrder fallback 0 적용
// - page.tsx sections 전달 타입 오류 해결
// - 사용자 공개 채널뷰 read-only 구조 유지
// - DB / API / Service 직접 접근 없음

'use client'

// SECTION 01 : IMPORT

import React, {
  useMemo
} from 'react'

// SECTION 02 : TYPES

type ChannelInfoBlockType =
  | 'TEXT'
  | 'LINK'
  | 'IMAGE'
  | 'SECTION'

type ChannelInfoBlock = {
  id?: number
  type: ChannelInfoBlockType
  title?: string | null
  content?: string | null
  url?: string | null
  imageUrl?: string | null
  description?: string | null
  sortOrder?: number | null
}

type ChannelHoursDay = {
  dayKey: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
  dayLabel: string
  isClosed: boolean
  openTime: string
  closeTime: string
}

type ChannelHoursPayload = {
  summary?: string | null
  weeklyHours?: ChannelHoursDay[] | null
  temporaryClosed?: boolean | number | null
  alwaysOpen?: boolean | number | null
}

type ChannelInfoProps = {
  bio?: string | null
  contactPhone?: string | null
  regionName?: string | null
  detailAddress?: string | null
  hours?: ChannelHoursPayload | null
  sections?: ChannelInfoBlock[] | null
}

// SECTION 03 : COMPONENT

export default function ChannelInfo({
  bio,
  contactPhone,
  regionName,
  detailAddress,
  hours,
  sections
}: ChannelInfoProps) {
  const safeSections =
    sections ?? []

  const hasBio =
    Boolean(bio?.trim())

  const hasContactPhone =
    Boolean(contactPhone?.trim())

  const hasRegion =
    Boolean(regionName?.trim() || detailAddress?.trim())

  const weeklyHours =
    Array.isArray(hours?.weeklyHours)
      ? hours.weeklyHours
      : []

  const hasHoursSummary =
    Boolean(hours?.summary?.trim())

  const hasWeeklyHours =
    weeklyHours.length > 0

  const isTemporaryClosed =
    Boolean(hours?.temporaryClosed)

  const isAlwaysOpen =
    Boolean(hours?.alwaysOpen)

  // SECTION 04 : SORT

  const sortedSections =
    useMemo(() => {
      return safeSections
        .slice()
        .sort((a, b) => {
          return Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
        })
    }, [
      safeSections
    ])

  // SECTION 05 : FILTER

  const validSections =
    sortedSections.filter((section) => {
      return Boolean(
        section.title?.trim() ||
        section.content?.trim() ||
        section.url?.trim() ||
        section.imageUrl?.trim() ||
        section.description?.trim()
      )
    })

  const hasSections =
    validSections.length > 0

  const hasAnyInfo =
    hasBio ||
    hasContactPhone ||
    hasRegion ||
    hasHoursSummary ||
    hasWeeklyHours ||
    hasSections

  // SECTION 06 : EMPTY UI

  if (!hasAnyInfo) {
    return (
      <div style={emptyContainerStyle}>
        <div style={emptyTitleStyle}>
          안내 정보 없음
        </div>

        <div style={emptyTextStyle}>
          아직 등록된 공개 안내 정보가 없습니다.
        </div>
      </div>
    )
  }

  // SECTION 07 : RETURN

  return (
    <div style={containerStyle}>
      {hasBio && (
        <InfoSection title="소개">
          <p style={textStyle}>
            {bio}
          </p>
        </InfoSection>
      )}

      {(hasContactPhone || hasRegion || hasHoursSummary || hasWeeklyHours) && (
        <InfoSection title="기본 정보">
          <div style={infoListStyle}>
            {hasContactPhone && (
              <InfoRow
                label="전화"
                value={contactPhone}
              />
            )}

            {hasRegion && (
              <InfoRow
                label="지역"
                value={
                  [regionName, detailAddress]
                    .filter(Boolean)
                    .join(' ')
                }
              />
            )}

            {hasHoursSummary && (
              <InfoRow
                label="영업 안내"
                value={hours?.summary ?? null}
              />
            )}

            {hasWeeklyHours && (
              <div style={hoursWrapStyle}>
                <div style={infoLabelStyle}>
                  주간 영업시간
                </div>

                <div style={hoursTableStyle}>
                  {isTemporaryClosed ? (
                    <div style={hoursRowStyle}>
                      <div style={hoursDayStyle}>
                        상태
                      </div>

                      <div style={hoursValueStyle}>
                        전체 OFF
                      </div>
                    </div>
                  ) : isAlwaysOpen ? (
                    <div style={hoursRowStyle}>
                      <div style={hoursDayStyle}>
                        상태
                      </div>

                      <div style={hoursValueStyle}>
                        24시간 영업
                      </div>
                    </div>
                  ) : (
                    weeklyHours.map((day) => (
                      <div
                        key={day.dayKey}
                        style={hoursRowStyle}
                      >
                        <div style={hoursDayStyle}>
                          {day.dayLabel}
                        </div>

                        <div style={hoursValueStyle}>
                          {day.isClosed
                            ? '휴무'
                            : `${day.openTime} - ${day.closeTime}`}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </InfoSection>
      )}

      {validSections.map((section, index) => (
        <InfoSection
          key={section.id ?? `channel-info-section-${index}`}
          title={section.title?.trim() || '안내'}
        >
          {section.type === 'TEXT' && section.content && (
            <p style={textStyle}>
              {section.content}
            </p>
          )}

          {section.type === 'LINK' && (
            <>
              {section.url && (
                <a
                  href={section.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                >
                  {section.url}
                </a>
              )}

              {section.description && (
                <p style={textStyle}>
                  {section.description}
                </p>
              )}
            </>
          )}

          {section.type === 'IMAGE' && section.imageUrl && (
            <img
              src={section.imageUrl}
              alt={section.title?.trim() || '안내 이미지'}
              style={imageStyle}
            />
          )}

          {section.type === 'SECTION' && (
            <>
              {section.content && (
                <p style={textStyle}>
                  {section.content}
                </p>
              )}

              {section.description && (
                <p style={subTextStyle}>
                  {section.description}
                </p>
              )}
            </>
          )}
        </InfoSection>
      ))}
    </div>
  )
}

// SECTION 08 : CHILD COMPONENT

function InfoSection({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={sectionStyle}>
      <div style={titleStyle}>
        {title}
      </div>

      {children}
    </section>
  )
}

function InfoRow({
  label,
  value
}: {
  label: string
  value?: string | null
}) {
  if (!value?.trim()) {
    return null
  }

  return (
    <div style={infoRowStyle}>
      <span style={infoLabelStyle}>
        {label}
      </span>

      <span style={infoValueStyle}>
        {value}
      </span>
    </div>
  )
}

// SECTION 09 : STYLE

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16
}

const sectionStyle: React.CSSProperties = {
  background: '#ffffff',
  padding: 16,
  border: '1px solid #eef0f3',
  borderRadius: 14
}

const titleStyle: React.CSSProperties = {
  marginBottom: 10,
  color: '#111827',
  fontSize: 15,
  fontWeight: 800
}

const textStyle: React.CSSProperties = {
  margin: 0,
  color: '#4b5563',
  fontSize: 14,
  lineHeight: 1.65,
  whiteSpace: 'pre-wrap'
}

const subTextStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#6b7280',
  fontSize: 13,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap'
}

const linkStyle: React.CSSProperties = {
  color: '#1877f2',
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.6,
  textDecoration: 'none',
  wordBreak: 'break-all'
}

const imageStyle: React.CSSProperties = {
  width: '100%',
  display: 'block',
  borderRadius: 12,
  objectFit: 'cover'
}

const infoListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8
}

const infoRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '72px minmax(0, 1fr)',
  gap: 10,
  alignItems: 'start'
}

const infoLabelStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: 13,
  fontWeight: 800
}

const infoValueStyle: React.CSSProperties = {
  color: '#111827',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.55,
  wordBreak: 'break-word'
}

const emptyContainerStyle: React.CSSProperties = {
  minHeight: 220,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  border: '1px solid #eef0f3',
  borderRadius: 14,
  background: '#ffffff',
  textAlign: 'center'
}

const emptyTitleStyle: React.CSSProperties = {
  color: '#111827',
  fontSize: 16,
  fontWeight: 800
}

const emptyTextStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: 13,
  fontWeight: 600
}

// SECTION 10 : VALIDATION

/*
VALIDATION:
- ChannelInfoBlock.id optional 처리 유지
- ChannelInfoBlock.sortOrder optional 처리 완료
- BusinessInfoView.sections sortOrder?: number 타입 수용 완료
- sortOrder fallback 0 적용 완료
- page.tsx sections 전달 타입 오류 해결
- 사용자 공개 채널뷰 read-only 유지
- DB 직접 접근 없음
- API 직접 호출 없음
*/

const hoursWrapStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8
}

const hoursTableStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
}

const hoursRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '8px 10px',
  borderRadius: 10,
  background: '#f8fafc'
}

const hoursDayStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#555',
  fontWeight: 600
}

const hoursValueStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#222'
}
