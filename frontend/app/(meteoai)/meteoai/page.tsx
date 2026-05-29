import Link from 'next/link'

const menuItems = [
  { href: '/meteoai', label: '메테오AI' },
  { href: '/meteoai/dashboard', label: '운영대시보드' },
  { href: '/meteoai/providers', label: 'AI 제공자' },
  { href: '/meteoai/strategy', label: '전략센터' },
  { href: '/meteoai/insight', label: '인사이트' },
  { href: '/meteoai/settings', label: '설정' }
]

export default function MeteoAiMainPage() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 16 }}>
      <section
        style={{
          border: '1px solid #d1d5db',
          borderRadius: 10,
          padding: 20,
          background: '#ffffff'
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>MeteoAI 운영전략센터</h1>
        <p style={{ margin: '10px 0 0', color: '#4b5563', lineHeight: 1.5 }}>
          MeteoAI는 AI Orchestrator 기반 운영전략센터입니다. 현재 화면은 목업 전용이며 API/DB 연결 없이
          구조만 제공합니다.
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10
        }}
      >
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: 14,
              background: '#f9fafb',
              fontWeight: 600
            }}
          >
            {item.label}
          </Link>
        ))}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12
        }}
      >
        {[
          { title: '오늘의 운영지수', value: '84.2', desc: 'Mock Index' },
          { title: 'AI 상태', value: 'ACTIVE', desc: 'OpenAI / Google' },
          { title: '등록 AI 수', value: '2', desc: 'Provider Ready' },
          { title: '전략 제안', value: '5건', desc: '재고/광고/행사/가격/지역' },
          { title: '최근 분석', value: '12건', desc: '매출/재고/기상/행사 영향' }
        ].map((card) => (
          <article
            key={card.title}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: 16,
              background: '#ffffff'
            }}
          >
            <h2 style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>{card.title}</h2>
            <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700 }}>{card.value}</p>
            <p style={{ margin: '6px 0 0', color: '#4b5563', fontSize: 13 }}>{card.desc}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
