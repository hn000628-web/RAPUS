const insights = [
  { title: '운영 분석', value: '안정', detail: '운영 리스크 지수 18/100' },
  { title: '매출 예측', value: '+6.4%', detail: '다음 7일 예상 성장률' },
  { title: '재고 예측', value: '주의 3건', detail: '상위 3개 SKU 품절 위험' },
  { title: '기상 영향', value: '보통', detail: '강수 확률 반영 수요 변동 제한적' },
  { title: '행사 영향', value: '높음', detail: '행사 카테고리 전환율 상승 예상' }
]

export default function MeteoAiInsightPage() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>인사이트</h1>
      <p style={{ margin: 0, color: '#6b7280' }}>운영 분석, 예측, 영향도를 한 화면에서 확인하는 Mock 구성</p>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12
        }}
      >
        {insights.map((item) => (
          <article
            key={item.title}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              background: '#ffffff',
              padding: 16
            }}
          >
            <h2 style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>{item.title}</h2>
            <p style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 700 }}>{item.value}</p>
            <p style={{ margin: '6px 0 0', color: '#4b5563', fontSize: 13 }}>{item.detail}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

