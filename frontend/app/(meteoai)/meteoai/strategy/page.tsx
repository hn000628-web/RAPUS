const strategyCards = [
  { title: '재고전략', summary: '회전율 하락 SKU 정리 및 자동 보충 추천' },
  { title: '광고전략', summary: '지역/시간대 기반 타겟 광고 예산 재분배' },
  { title: '행사전략', summary: '행사 강도와 상품군 매칭 시나리오 제안' },
  { title: '가격전략', summary: '탄력 가격 구간과 마진 방어 구간 제시' },
  { title: '지역전략', summary: '권역별 수요 편차 반영 확장 우선순위 산정' }
]

export default function MeteoAiStrategyPage() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>전략센터</h1>
      <p style={{ margin: 0, color: '#6b7280' }}>재고, 광고, 행사, 가격, 지역 전략 카드 기반 Mock 화면</p>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12
        }}
      >
        {strategyCards.map((card) => (
          <article
            key={card.title}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              background: '#ffffff',
              padding: 16
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16 }}>{card.title}</h2>
            <p style={{ margin: '8px 0 0', color: '#4b5563', fontSize: 14, lineHeight: 1.5 }}>{card.summary}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

