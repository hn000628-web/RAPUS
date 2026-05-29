'use client'

import { type CSSProperties, useMemo, useState } from 'react'

type ProviderMode = 'SINGLE' | 'FAILOVER' | 'PARALLEL'

type ProviderItem = {
  id: number
  provider: string
  model: string
  priority: number
  status: 'ACTIVE' | 'INACTIVE'
}

const initialProviders: ProviderItem[] = [
  {
    id: 1,
    provider: 'OpenAI',
    model: 'gpt-5.5',
    priority: 1,
    status: 'ACTIVE'
  },
  {
    id: 2,
    provider: 'Google',
    model: 'gemini-2.5-pro',
    priority: 2,
    status: 'ACTIVE'
  }
]

export default function MeteoAiProvidersPage() {
  const [providers, setProviders] = useState<ProviderItem[]>(initialProviders)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    provider: 'OpenAI',
    model: '',
    apiKey: '',
    priority: '3',
    mode: 'SINGLE' as ProviderMode
  })

  const nextId = useMemo(() => (providers.length ? Math.max(...providers.map((p) => p.id)) + 1 : 1), [providers])

  const onAddProvider = () => {
    if (!form.model.trim()) return

    setProviders((prev) => [
      ...prev,
      {
        id: nextId,
        provider: form.provider,
        model: form.model.trim(),
        priority: Number(form.priority) || 0,
        status: 'ACTIVE'
      }
    ])

    setForm({
      provider: 'OpenAI',
      model: '',
      apiKey: '',
      priority: '3',
      mode: 'SINGLE'
    })
    setIsModalOpen(false)
  }

  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>AI 제공자</h1>
          <p style={{ margin: '6px 0 0', color: '#6b7280' }}>OpenAI / Gemini 다중 운용 구조 목업</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            border: '1px solid #111827',
            borderRadius: 8,
            background: '#111827',
            color: '#ffffff',
            padding: '10px 14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          AI 등록
        </button>
      </div>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#ffffff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Provider', 'Model', 'Priority', 'Status', 'Action'].map((header) => (
                <th
                  key={header}
                  style={{
                    textAlign: 'left',
                    fontSize: 13,
                    color: '#6b7280',
                    padding: 12,
                    borderBottom: '1px solid #e5e7eb'
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {providers.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6' }}>{item.provider}</td>
                <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6' }}>{item.model}</td>
                <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6' }}>Priority {item.priority}</td>
                <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6' }}>{item.status}</td>
                <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" style={actionButtonStyle}>
                      수정
                    </button>
                    <button type="button" style={actionButtonStyle}>
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17, 24, 39, 0.55)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            zIndex: 100
          }}
        >
          <section
            style={{
              width: '100%',
              maxWidth: 520,
              background: '#ffffff',
              borderRadius: 10,
              border: '1px solid #d1d5db',
              padding: 16,
              display: 'grid',
              gap: 12
            }}
          >
            <h2 style={{ margin: 0, fontSize: 18 }}>AI 등록</h2>

            <label style={fieldStyle}>
              Provider
              <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} style={inputStyle}>
                <option value="OpenAI">OpenAI</option>
                <option value="Google">Google</option>
              </select>
            </label>

            <label style={fieldStyle}>
              Model
              <input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="직접 입력"
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              API Key
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                placeholder="password 타입"
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              Priority
              <input
                type="number"
                min={1}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              Mode
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value as ProviderMode })}
                style={inputStyle}
              >
                <option value="SINGLE">SINGLE</option>
                <option value="FAILOVER">FAILOVER</option>
                <option value="PARALLEL">PARALLEL</option>
              </select>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setIsModalOpen(false)} style={actionButtonStyle}>
                닫기
              </button>
              <button type="button" onClick={onAddProvider} style={{ ...actionButtonStyle, borderColor: '#111827', color: '#111827' }}>
                등록
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}

const fieldStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  fontSize: 13,
  color: '#374151'
}

const inputStyle: CSSProperties = {
  height: 38,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '0 10px',
  fontSize: 14
}

const actionButtonStyle: CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 8,
  background: '#ffffff',
  color: '#374151',
  padding: '7px 10px',
  fontSize: 13,
  cursor: 'pointer'
}
