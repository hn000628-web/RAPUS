import Link from 'next/link'

export default function AdminHomePage() {
  return (
    <div
      style={{
        padding: 24
      }}
    >
      <h1
        style={{
          fontSize: 20,
          marginBottom: 8
        }}
      >
        Admin
      </h1>

      <p
        style={{
          color: '#666',
          fontSize: 14,
          marginBottom: 16
        }}
      >
        관리자 페이지입니다.
        <br />
        상단 네비게이션 메뉴 또는 아래 카드로 관리 화면에 이동할 수 있습니다.
      </p>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
          maxWidth: 960
        }}
      >
        <Link
          href="/admin/master-products"
          style={{
            display: 'block',
            textDecoration: 'none',
            color: 'inherit',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#ffffff',
            padding: 16
          }}
        >
          <strong
            style={{
              display: 'block',
              fontSize: 16,
              marginBottom: 8
            }}
          >
            공용 프로덕트 관리
          </strong>
          <p
            style={{
              margin: 0,
              color: '#6b7280',
              fontSize: 13,
              lineHeight: 1.5
            }}
          >
            RAPUS 표준 상품 원장 / 바코드 / 상품코드 관리
          </p>
        </Link>
      </section>
    </div>
  )
}
