'use client'

import { useState } from 'react'

type OperateMode = 'SINGLE' | 'FAILOVER' | 'PARALLEL'

export default function MeteoAiSettingsPage() {
  const [mode, setMode] = useState<OperateMode>('SINGLE')

  return (
    <main style={{ padding: 24, display: 'grid', gap: 14 }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>설정</h1>
      <p style={{ margin: 0, color: '#6b7280' }}>기본 운용모드 선택 Mock UI</p>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 10, background: '#ffffff', padding: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>기본 운용모드</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {(['SINGLE', 'FAILOVER', 'PARALLEL'] as OperateMode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              style={{
                border: '1px solid #d1d5db',
                borderRadius: 8,
                background: mode === item ? '#111827' : '#ffffff',
                color: mode === item ? '#ffffff' : '#111827',
                padding: '8px 12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12
        }}
      >
        <article style={cardStyle}>
          <h3 style={titleStyle}>SINGLE</h3>
          <p style={bodyStyle}>단일 AI 사용</p>
        </article>
        <article style={cardStyle}>
          <h3 style={titleStyle}>FAILOVER</h3>
          <p style={bodyStyle}>OpenAI 실패 시 Gemini 자동 전환</p>
        </article>
        <article style={cardStyle}>
          <h3 style={titleStyle}>PARALLEL</h3>
          <p style={bodyStyle}>OpenAI와 Gemini 동시 실행 후 결과 비교</p>
        </article>
      </section>
    </main>
  )
}

const cardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  background: '#ffffff',
  padding: 16
}

const titleStyle = {
  margin: 0,
  fontSize: 15
}

const bodyStyle = {
  margin: '8px 0 0',
  color: '#4b5563',
  fontSize: 14,
  lineHeight: 1.5
}

