'use client'

import {
  useParams
} from 'next/navigation'

import type {
  PlaceFeedTypeCode
} from '@/lib/profile-summary-api'

type PlaceTypeChannelPageProps = {
  placeFeedTypeCode: Exclude<PlaceFeedTypeCode, 'NORMAL'>
  title: string
  description: string
}

function getChannelCodeFromParams(
  value: string | string[] | undefined
) {
  if (Array.isArray(value)) {
    return value[0] || ''
  }

  return value || ''
}

export default function PlaceTypeChannelPage({
  placeFeedTypeCode,
  title,
  description
}: PlaceTypeChannelPageProps) {
  const params =
    useParams()

  const channelCode =
    getChannelCodeFromParams(params?.channelCode)

  return (
    <main style={page}>
      <section style={panel}>
        <span style={badge}>
          {placeFeedTypeCode}
        </span>

        <h1 style={heading}>
          {title}
        </h1>

        <p style={copy}>
          {description}
        </p>

        <div style={metaBox}>
          <span style={metaLabel}>
            채널코드
          </span>
          <strong style={metaValue}>
            {channelCode || '미확인'}
          </strong>
        </div>
      </section>
    </main>
  )
}

const page = {
  minHeight: '100vh',
  background: '#f8fafc',
  padding: '32px 16px'
}

const panel = {
  width: '100%',
  maxWidth: 720,
  margin: '0 auto',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  background: '#ffffff',
  padding: 24,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)'
}

const badge = {
  display: 'inline-flex',
  borderRadius: 999,
  background: '#eff6ff',
  color: '#2563eb',
  fontSize: 12,
  fontWeight: 900,
  padding: '6px 10px'
}

const heading = {
  margin: '16px 0 0',
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 900
}

const copy = {
  margin: '10px 0 0',
  color: '#475569',
  fontSize: 14,
  lineHeight: 1.6
}

const metaBox = {
  display: 'grid',
  gap: 6,
  marginTop: 18,
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  background: '#f8fafc',
  padding: 14
}

const metaLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 800
}

const metaValue = {
  color: '#0f172a',
  fontSize: 15,
  fontWeight: 900
}
