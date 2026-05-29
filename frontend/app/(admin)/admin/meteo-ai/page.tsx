import Link from 'next/link'

export default function AdminMeteoAiPage() {
  const cards = [
    {
      title: 'AI설정',
      href: '/admin/meteo-ai/settings',
      lines: ['베이스 AI 설정', 'API 키 관리', 'AI 모델 관리', 'AI 연결 상태']
    },
    {
      title: '상품AI',
      href: '/admin/meteo-ai/product',
      lines: ['상품 분석', '상품 자동분류', '바코드 매핑']
    },
    {
      title: '이미지AI',
      href: '/admin/meteo-ai/image',
      lines: ['상품 이미지 보정', '썸네일 생성', '배경제거']
    },
    {
      title: '발주AI',
      href: '/admin/meteo-ai/order',
      lines: ['발주 추천', '안전재고 분석', '품절 예측']
    },
    {
      title: '배송AI',
      href: '/admin/meteo-ai/delivery',
      lines: ['배송 추적', '입고 확인', '물류 보조']
    },
    {
      title: '마케팅AI',
      href: '/admin/meteo-ai/marketing',
      lines: ['행사 문구 생성', '배너 생성', '홍보 콘텐츠 생성']
    }
  ]

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
        메테오AI
      </h1>

      <p
        style={{
          color: '#6b7280',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.4,
          marginBottom: 14
        }}
      >
        METEO AI PREVIEW
      </p>

      <p
        style={{
          color: '#4b5563',
          fontSize: 14,
          marginBottom: 16,
          lineHeight: 1.6
        }}
      >
        현재 목업 단계입니다.
      </p>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          maxWidth: 980
        }}
      >
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 10
              }}
            >
              <strong
                style={{
                  display: 'block',
                  fontSize: 16
                }}
              >
                {card.title}
              </strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {card.title === 'AI설정' ? (
                  <span
                    style={{
                      border: '1px solid #b45309',
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#92400e',
                      background: '#fffbeb'
                    }}
                  >
                    MASTER ONLY
                  </span>
                ) : null}
                <span
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: 999,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#374151',
                    background: '#f9fafb'
                  }}
                >
                  PREVIEW
                </span>
              </div>
            </div>

            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                color: '#4b5563',
                fontSize: 14,
                lineHeight: 1.8
              }}
            >
              {card.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {card.title === 'AI설정' ? (
              <p
                style={{
                  margin: '10px 0 0',
                  color: '#6b7280',
                  fontSize: 12,
                  lineHeight: 1.5
                }}
              >
                OpenAI / Gemini / Claude AI Provider 관리
              </p>
            ) : null}
          </Link>
        ))}
      </section>
    </div>
  )
}
