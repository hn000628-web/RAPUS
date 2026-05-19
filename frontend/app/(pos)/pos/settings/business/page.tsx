'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { usePosKeyboardMode } from '../../components/PosKeyboardModeContext'
import PosTopbar from '../../components/PosTopbar'
import styles from '../PosSettingsPage.module.css'

type BusinessFormState = {
  businessName: string
  address: string
  businessNumber: string
  mainPhone: string
  subPhone: string
  fax: string
  managerEmail: string
}

const INITIAL_FORM: BusinessFormState = {
  businessName: '주식회사 샘플호스피탈리티',
  address: '서울특별시 강남구 테헤란로 123',
  businessNumber: '123-45-67890',
  mainPhone: '02-1234-5678',
  subPhone: '010-2222-3333',
  fax: '02-9876-5432',
  managerEmail: 'manager@example.com'
}

export default function PosBusinessSettingsPage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()
  const [form, setForm] = useState<BusinessFormState>(INITIAL_FORM)

  const updateField = (key: keyof BusinessFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className={styles.page}>
      <header className={styles.topbarWrap}>
        <div className={styles.topbarInner}>
          <PosTopbar
            title="비지니스 관리"
            onHomeClick={() => router.push('/pos')}
            onSettingsClick={() => router.push('/pos/settings')}
            onMyPageClick={() => router.push('/profile')}
            keyboardMode={keyboardMode}
            onToggleKeyboardMode={toggleKeyboardMode}
          />
        </div>
      </header>

      <main className={styles.content}>
        <section style={{ marginBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#111827' }}>비지니스 관리</h1>
          <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: '14px' }}>
            사업장 기본정보를 입력/수정하는 목업 화면입니다.
          </p>
        </section>

        <section
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '18px',
            backgroundColor: '#ffffff',
            padding: '18px',
            display: 'grid',
            gap: '12px',
            maxWidth: '860px'
          }}
        >
          <BusinessInput label="상호" value={form.businessName} onChange={(value) => updateField('businessName', value)} />
          <BusinessInput label="주소" value={form.address} onChange={(value) => updateField('address', value)} />
          <BusinessInput label="사업자번호" value={form.businessNumber} onChange={(value) => updateField('businessNumber', value)} />
          <BusinessInput label="대표 연락처" value={form.mainPhone} onChange={(value) => updateField('mainPhone', value)} />
          <BusinessInput label="보조 연락처" value={form.subPhone} onChange={(value) => updateField('subPhone', value)} />
          <BusinessInput label="팩스" value={form.fax} onChange={(value) => updateField('fax', value)} />
          <BusinessInput label="담당자 이메일" value={form.managerEmail} onChange={(value) => updateField('managerEmail', value)} />

          <p style={{ margin: '6px 0 0', color: '#2563eb', fontSize: '13px', fontWeight: 800 }}>
            사업장 정보는 영수증 / 예약 / 운영 정책에 사용됩니다.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="button"
              style={{
                height: '38px',
                border: '1px solid #111827',
                backgroundColor: '#111827',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '0 16px',
                fontSize: '13px',
                fontWeight: 900,
                cursor: 'pointer'
              }}
              onClick={() => {
                console.log('비지니스 관리 저장(UI 목업)', form)
              }}
            >
              저장
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

type BusinessInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

function BusinessInput({ label, value, onChange }: BusinessInputProps) {
  return (
    <label style={{ display: 'grid', gap: '6px' }}>
      <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%',
          height: '40px',
          border: '1px solid #d1d5db',
          borderRadius: '10px',
          padding: '0 12px',
          boxSizing: 'border-box',
          color: '#111827',
          fontSize: '14px',
          fontWeight: 700
        }}
      />
    </label>
  )
}
