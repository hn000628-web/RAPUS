import { type CSSProperties } from 'react'

export default function MeteoAiProductPage() {
  const items = ['상품 분석', '상품 자동분류', '바코드 매핑', '상품 원장 검증', '공급사 분석']

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>상품AI</h1>
        <span style={badgeStyle}>PREVIEW</span>
      </div>

      <section style={panelStyle}>
        <ul style={listStyle}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}

const panelStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  background: '#ffffff',
  padding: 16,
  maxWidth: 760
}

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: '#374151',
  fontSize: 14,
  lineHeight: 1.9
}

const badgeStyle: CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 999,
  padding: '2px 8px',
  fontSize: 11,
  fontWeight: 700,
  color: '#374151',
  background: '#f9fafb'
}
