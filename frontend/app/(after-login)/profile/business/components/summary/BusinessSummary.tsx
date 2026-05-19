// FILE : frontend/app/(after-login)/profile/business/components/BusinessSummary.tsx
// ROOT : frontend/app/(after-login)/profile/business/components/BusinessSummary.tsx
// STATUS : SUMMARY VIEW + LOADING STATE READY

'use client'

// ==================================================
// SECTION 01 : IMPORT
// ==================================================


// ==================================================
// SECTION 02 : TYPES
// ==================================================

type Props = {
  bio?: string | null
}

// ==================================================
// SECTION 03 : COMPONENT
// ==================================================

export default function BusinessSummary({
  bio
}: Props) {
  const summary =
    typeof bio === 'string'
      ? bio.trim()
      : ''

  // ==================================================
  // EMPTY STATE
  // ==================================================

  if (!summary) {
    return (
      <div style={cardStyle}>
        <div style={emptyText}>
          소개가 아직 등록되지 않았습니다.
        </div>
      </div>
    )
  }

  // ==================================================
  // NORMAL UI
  // ==================================================

  return (
    <div style={cardStyle}>
      <div style={summaryText}>
        {summary}
      </div>
    </div>
  )
}

// ==================================================
// SECTION 04 : STYLE
// ==================================================

const cardStyle: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  border: '1px solid #e5e7eb',
  boxSizing: 'border-box'
}

const summaryText: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.6,
  color: '#111827',
  whiteSpace: 'pre-line'
}

const emptyText: React.CSSProperties = {
  fontSize: 14,
  color: '#9ca3af'
}

/* =========================
SKELETON
========================= */

const skeletonTitle: React.CSSProperties = {
  width: '40%',
  height: 16,
  background: '#e5e7eb',
  borderRadius: 6,
  marginBottom: 12
}

const skeletonLine: React.CSSProperties = {
  width: '100%',
  height: 12,
  background: '#e5e7eb',
  borderRadius: 6,
  marginBottom: 8
}

const skeletonLineShort: React.CSSProperties = {
  width: '70%',
  height: 12,
  background: '#e5e7eb',
  borderRadius: 6
}