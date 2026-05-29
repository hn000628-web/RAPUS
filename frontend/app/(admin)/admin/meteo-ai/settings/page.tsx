'use client'

import { type CSSProperties, useState } from 'react'

type ProviderKey = 'OPENAI' | 'GEMINI' | 'CLAUDE'

const providerRows: Array<{ key: ProviderKey; label: string }> = [
  { key: 'OPENAI', label: 'OpenAI' },
  { key: 'GEMINI', label: 'Google Gemini' },
  { key: 'CLAUDE', label: 'Claude' }
]

export default function MeteoAiSettingsPage() {
  const [baseAi, setBaseAi] = useState<ProviderKey>('OPENAI')
  const [secondaryAi, setSecondaryAi] = useState<ProviderKey>('GEMINI')
  const [openAiKey, setOpenAiKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [claudeKey, setClaudeKey] = useState('')
  const [primaryProvider, setPrimaryProvider] = useState('OpenAI')
  const [primaryModel, setPrimaryModel] = useState('GPT-5')
  const [secondaryProvider, setSecondaryProvider] = useState('Google Gemini')
  const [secondaryModel, setSecondaryModel] = useState('Gemini 2.5 Flash')
  const [imageProvider, setImageProvider] = useState('OpenAI')
  const [imageModel, setImageModel] = useState('gpt-image-1')

  return (
    <div style={{ padding: 24, display: 'grid', gap: 12 }}>
      <div>
        <span style={masterBadgeStyle}>METEO AI MASTER ONLY</span>
      </div>
      <h1 style={{ margin: 0, fontSize: 20 }}>AI 설정</h1>
      <p style={{ margin: 0, color: '#6b7280', fontSize: 12, fontWeight: 700, letterSpacing: 0.4 }}>
        METEO AI PROVIDER SETTINGS
      </p>
      <p style={{ margin: 0, color: '#4b5563', fontSize: 14 }}>현재 목업 단계입니다.</p>
      <section style={noticeStyle}>
        <p style={{ margin: 0, color: '#374151', fontSize: 13, lineHeight: 1.6 }}>
          본 영역은 메테오AI 핵심 설정 관리 영역입니다.
          <br />
          AI Provider 설정, API Key 관리, 기본 AI 설정은 METEO AI MASTER만 관리할 수 있습니다.
        </p>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>베이스 AI</h2>
        <p style={helperTextStyle}>1순위 OpenAI, 2순위 Google Gemini, Claude는 선택 Provider로 운영 예정</p>

        <div style={{ display: 'grid', gap: 12 }}>
          {providerRows.map((provider) => {
            const value =
              provider.key === 'OPENAI' ? openAiKey : provider.key === 'GEMINI' ? geminiKey : claudeKey
            const onChange =
              provider.key === 'OPENAI'
                ? setOpenAiKey
                : provider.key === 'GEMINI'
                  ? setGeminiKey
                  : setClaudeKey

            return (
              <article key={provider.key} style={providerRowStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <strong style={{ fontSize: 15 }}>{provider.label}</strong>
                  <span style={statusBadgeStyle}>연결안됨</span>
                </div>

                <label style={labelStyle}>
                  API KEY
                  <input
                    type="password"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="목업 입력"
                    style={inputStyle}
                  />
                </label>

                <button type="button" style={mockButtonStyle}>
                  연결 테스트
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>기본 AI 선택</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={radioLabelStyle}>
            <input type="radio" name="base-ai" checked={baseAi === 'OPENAI'} onChange={() => setBaseAi('OPENAI')} />
            OpenAI
          </label>
          <label style={radioLabelStyle}>
            <input type="radio" name="base-ai" checked={baseAi === 'GEMINI'} onChange={() => setBaseAi('GEMINI')} />
            Google Gemini
          </label>
          <label style={radioLabelStyle}>
            <input type="radio" name="base-ai" checked={baseAi === 'CLAUDE'} onChange={() => setBaseAi('CLAUDE')} />
            Claude
          </label>
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>보조 AI 선택</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={radioLabelStyle}>
            <input
              type="radio"
              name="secondary-ai"
              checked={secondaryAi === 'GEMINI'}
              onChange={() => setSecondaryAi('GEMINI')}
            />
            Google Gemini
          </label>
          <label style={radioLabelStyle}>
            <input
              type="radio"
              name="secondary-ai"
              checked={secondaryAi === 'CLAUDE'}
              onChange={() => setSecondaryAi('CLAUDE')}
            />
            Claude
          </label>
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>AI MODEL ROUTING</h2>

        <article style={routeBlockStyle}>
          <h3 style={routeTitleStyle}>기본 AI</h3>
          <label style={labelStyle}>
            Provider
            <select value={primaryProvider} onChange={(e) => setPrimaryProvider(e.target.value)} style={inputStyle}>
              <option>OpenAI</option>
              <option>Google Gemini</option>
              <option>Claude</option>
            </select>
          </label>
          <label style={labelStyle}>
            Model
            <select value={primaryModel} onChange={(e) => setPrimaryModel(e.target.value)} style={inputStyle}>
              <option>GPT-5</option>
              <option>GPT-5 Thinking</option>
              <option>GPT-5 Mini</option>
              <option>GPT-5 Nano</option>
            </select>
          </label>
          <p style={helperTextStyle}>주요 질문응답, 콘텐츠 생성, 업무 처리</p>
        </article>

        <article style={routeBlockStyle}>
          <h3 style={routeTitleStyle}>보조 AI</h3>
          <label style={labelStyle}>
            Provider
            <select value={secondaryProvider} onChange={(e) => setSecondaryProvider(e.target.value)} style={inputStyle}>
              <option>Google Gemini</option>
              <option>OpenAI</option>
              <option>Claude</option>
            </select>
          </label>
          <label style={labelStyle}>
            Model
            <select value={secondaryModel} onChange={(e) => setSecondaryModel(e.target.value)} style={inputStyle}>
              <option>Gemini 2.5 Flash</option>
              <option>Gemini 2.5 Pro</option>
              <option>Gemini 2.5 Flash Lite</option>
            </select>
          </label>
          <p style={helperTextStyle}>빠른 응답, 대량 처리, 보조 분석</p>
        </article>

        <article style={routeBlockStyle}>
          <h3 style={routeTitleStyle}>이미지 AI</h3>
          <label style={labelStyle}>
            Provider
            <select value={imageProvider} onChange={(e) => setImageProvider(e.target.value)} style={inputStyle}>
              <option>OpenAI</option>
              <option>Google Gemini</option>
              <option>Claude</option>
            </select>
          </label>
          <label style={labelStyle}>
            Model
            <select value={imageModel} onChange={(e) => setImageModel(e.target.value)} style={inputStyle}>
              <option>gpt-image-1</option>
              <option>Gemini 2.5 Flash</option>
            </select>
          </label>
          <p style={helperTextStyle}>이미지 생성, 이미지 보정, 썸네일 생성</p>
        </article>
      </section>

      <section style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" style={saveButtonStyle}>
          저장
        </button>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>AI 설정 구조 안내</h2>
        <ul style={guideListStyle}>
          <li>베이스 AI 1순위: OpenAI</li>
          <li>보조 AI: Google Gemini</li>
          <li>선택 Provider: Claude</li>
          <li>현재 구조: OpenAI + Gemini 중심 운영</li>
        </ul>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>예정 권한 구조 (목업 안내)</h2>
        <ul style={guideListStyle}>
          <li>meteoAiGrade = 0: 일반 사용자</li>
          <li>meteoAiGrade = 24: METEO AI MASTER</li>
          <li>현재는 24만 운영</li>
          <li>향후 적용 예정: 사이드바 숨김, 라우트 접근 차단, 백엔드 권한 검증</li>
        </ul>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>향후 지원 모델</h2>
        <ul style={guideListStyle}>
          <li>OpenAI: GPT-5, GPT-5 Thinking, GPT-5 Mini, GPT-5 Nano, gpt-image-1</li>
          <li>Google Gemini: Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash Lite</li>
          <li>Claude: Claude Sonnet, Claude Opus</li>
        </ul>
      </section>

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>AI 운영 정책</h2>
        <p style={policyTextStyle}>
          사용자는 AI를 사용하지만 AI Provider, AI Model, AI Routing은 노출하지 않는다.
          <br />
          디자인팀: 이미지 업로드 → 추천 포맷 표시 → 선택 → 적용
          <br />
          운영팀: 상품 등록 → AI 추천 → 적용
          <br />
          AI 설정은 METEO AI MASTER 전용 관리 영역이다.
        </p>
      </section>
    </div>
  )
}

const cardStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  background: '#ffffff',
  padding: 16
}

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  marginBottom: 8
}

const helperTextStyle: CSSProperties = {
  margin: '0 0 12px',
  color: '#6b7280',
  fontSize: 13,
  lineHeight: 1.5
}

const providerRowStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 12,
  display: 'grid',
  gap: 10
}

const statusBadgeStyle: CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 999,
  padding: '2px 8px',
  fontSize: 11,
  fontWeight: 700,
  color: '#4b5563',
  background: '#f9fafb'
}

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  fontSize: 13,
  color: '#374151'
}

const inputStyle: CSSProperties = {
  height: 36,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '0 10px',
  fontSize: 14
}

const mockButtonStyle: CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 8,
  background: '#ffffff',
  color: '#111827',
  padding: '8px 11px',
  fontWeight: 600,
  cursor: 'pointer',
  width: 120
}

const radioLabelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#374151',
  fontSize: 14
}

const saveButtonStyle: CSSProperties = {
  border: '1px solid #111827',
  borderRadius: 8,
  background: '#111827',
  color: '#ffffff',
  padding: '9px 14px',
  fontWeight: 700,
  cursor: 'pointer'
}

const masterBadgeStyle: CSSProperties = {
  border: '1px solid #b45309',
  borderRadius: 999,
  padding: '3px 10px',
  fontSize: 11,
  fontWeight: 800,
  color: '#92400e',
  background: '#fffbeb'
}

const noticeStyle: CSSProperties = {
  border: '1px solid #fde68a',
  borderRadius: 10,
  background: '#fffbeb',
  padding: 12
}

const guideListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: '#374151',
  fontSize: 14,
  lineHeight: 1.8
}

const routeBlockStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 12,
  marginTop: 10,
  display: 'grid',
  gap: 8
}

const routeTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: '#111827'
}

const policyTextStyle: CSSProperties = {
  margin: 0,
  color: '#374151',
  fontSize: 14,
  lineHeight: 1.8
}
