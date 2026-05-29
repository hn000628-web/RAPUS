const dashboardCards = [
  { title: '오늘의 운영지수', value: '84.2', note: '전일 대비 +2.1' },
  { title: 'AI 상태', value: 'ACTIVE', note: 'OpenAI / Google 정상' },
  { title: '등록 AI 수', value: '2', note: 'Provider Mock' },
  { title: '전략 제안', value: '5건', note: '우선 실행 2건' },
  { title: '최근 분석', value: '12건', note: '최근 24시간 기준' }
]

export default function MeteoAiDashboardPage() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>운영대시보드</h1>
      <p style={{ margin: 0, color: '#6b7280' }}>모든 수치는 Mock Data 기반입니다.</p>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12
        }}
      >
        {dashboardCards.map((card) => (
          <article
            key={card.title}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: 16,
              background: '#ffffff'
            }}
          >
            <h2 style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>{card.title}</h2>
            <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700 }}>{card.value}</p>
            <p style={{ margin: '6px 0 0', color: '#4b5563', fontSize: 13 }}>{card.note}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

