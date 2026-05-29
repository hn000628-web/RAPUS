import Link from 'next/link'
import { type CSSProperties } from 'react'

export default function AddressAdminHomePage() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 14 }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>관리자 주소관리</h1>
      <p style={{ margin: 0, color: '#6b7280' }}>AddressMainCode / AddressSubCode / AddressCode24 운영 목업</p>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          maxWidth: 720
        }}
      >
        <Link href="/address/main" style={menuCardStyle}>
          권역관리
        </Link>
        <Link href="/address/place" style={menuCardStyle}>
          건물관리
        </Link>
      </section>
    </main>
  )
}

const menuCardStyle: CSSProperties = {
  textDecoration: 'none',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 18,
  background: '#ffffff',
  color: '#111827',
  fontWeight: 700
}
