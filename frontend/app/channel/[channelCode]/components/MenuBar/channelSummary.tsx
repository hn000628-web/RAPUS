// FILE : frontend/app/channel/[channelCode]/components/MenuBar/channelSummary.tsx
// ROOT : frontend/app/channel/[channelCode]/components/MenuBar/channelSummary.tsx
// STATUS : MODIFY MODE
// ROLE : PUBLIC CHANNEL SUMMARY VIEW COMPONENT

'use client'

import type { CSSProperties } from 'react'

type ChannelSummaryProps = {
  bio?: string | null
}

export default function ChannelSummary({
  bio
}: ChannelSummaryProps) {
  const summary =
    typeof bio === 'string'
      ? bio.trim()
      : ''

  if (!summary) {
    return (
      <div style={cardStyle}>
        <div style={emptyTitleStyle}>
          소개 정보 없음
        </div>

        <div style={emptyTextStyle}>
          아직 등록된 공개 소개가 없습니다.
        </div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={summaryTextStyle}>
        {summary}
      </div>
    </div>
  )
}

const cardStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 20,
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  background: '#ffffff'
}

const summaryTextStyle: CSSProperties = {
  color: '#111827',
  fontSize: 14,
  lineHeight: 1.65,
  whiteSpace: 'pre-line'
}

const emptyTitleStyle: CSSProperties = {
  marginBottom: 8,
  color: '#111827',
  fontSize: 15,
  fontWeight: 800
}

const emptyTextStyle: CSSProperties = {
  color: '#9ca3af',
  fontSize: 14,
  lineHeight: 1.6
}
