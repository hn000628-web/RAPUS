import Link from 'next/link'

// FILE : frontend/app/(admin)/admin/market/page.tsx
// ROOT : C:\Users\kjm\social-platform\frontend\app\(admin)\admin\market\page.tsx
// STATUS : MODIFY MODE
// ROLE : ADMIN MARKET MANAGEMENT PAGE

export default function AdminMarketPage() {

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f3f4f6',
        padding: '28px'
      }}
    >
      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '18px',
          background: '#ffffff',
          padding: '24px',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: '#0f172a',
                fontSize: '28px',
                lineHeight: 1.25
              }}
            >
              마켓관리
            </h1>
            <p
              style={{
                margin: '8px 0 0',
                color: '#64748b',
                fontSize: '14px',
                lineHeight: 1.6
              }}
            >
              마트 운영 콘솔의 주요 관리 기능을 선택합니다.
            </p>
          </div>

          <Link
            href="/admin/market/banner"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '44px',
              borderRadius: '12px',
              background: '#0f172a',
              color: '#ffffff',
              padding: '0 18px',
              fontSize: '14px',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.18)'
            }}
          >
            베너 관리
          </Link>
        </div>
      </section>
    </main>
  )

}
