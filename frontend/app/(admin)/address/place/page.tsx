'use client'

import { type CSSProperties, useMemo, useState } from 'react'

type PlaceRow = {
  id: number
  mainAddressCode: string
  subAddressCode: string
  addressCode24: string
  buildingName: string
  detailAddress: string
  status: '활성' | '비활성'
}

const mainAddressOptions = ['KRGWJSGUGHD']

const initialPlaces: PlaceRow[] = [
  {
    id: 1,
    mainAddressCode: 'KRGWJSGUGHD',
    subAddressCode: 'A00000000001',
    addressCode24: 'KRGWJSGUGHDA00000000001',
    buildingName: '신선마트',
    detailAddress: '광주 서구 금호동 123-1',
    status: '활성'
  }
]

function makeSubAddressCode(nextSequence: number): string {
  const numeric = String(nextSequence).padStart(11, '0')
  return `A${numeric}`
}

export default function AddressPlaceManagePage() {
  const [rows, setRows] = useState<PlaceRow[]>(initialPlaces)
  const [mainAddressCode, setMainAddressCode] = useState(mainAddressOptions[0])
  const [buildingName, setBuildingName] = useState('')
  const [detailAddress, setDetailAddress] = useState('')

  const nextSequence = useMemo(() => rows.length + 1, [rows.length])
  const previewSubCode = useMemo(() => makeSubAddressCode(nextSequence), [nextSequence])
  const previewAddress24 = useMemo(() => `${mainAddressCode}${previewSubCode}`, [mainAddressCode, previewSubCode])

  const onSaveMock = () => {
    if (!buildingName.trim() || !detailAddress.trim()) return

    const subAddressCode = makeSubAddressCode(rows.length + 1)
    const addressCode24 = `${mainAddressCode}${subAddressCode}`

    const newRow: PlaceRow = {
      id: rows.length + 1,
      mainAddressCode,
      subAddressCode,
      addressCode24,
      buildingName: buildingName.trim(),
      detailAddress: detailAddress.trim(),
      status: '활성'
    }

    setRows((prev) => [...prev, newRow])
    setBuildingName('')
    setDetailAddress('')
  }

  return (
    <main style={{ padding: 24, display: 'grid', gap: 14 }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>건물관리</h1>
      <p style={{ margin: 0, color: '#6b7280' }}>저장 시 AddressSubCode, AddressCode24를 자동 생성하는 Mock UI</p>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 10, background: '#ffffff', padding: 16, display: 'grid', gap: 10 }}>
        <label style={fieldStyle}>
          AddressMainCode 선택
          <select value={mainAddressCode} onChange={(e) => setMainAddressCode(e.target.value)} style={inputStyle}>
            {mainAddressOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label style={fieldStyle}>
          건물명
          <input value={buildingName} onChange={(e) => setBuildingName(e.target.value)} style={inputStyle} placeholder="예: 신선마트" />
        </label>

        <label style={fieldStyle}>
          상세주소
          <input value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} style={inputStyle} placeholder="예: 광주 서구 금호동 123-1" />
        </label>

        <div style={{ border: '1px dashed #d1d5db', borderRadius: 8, padding: 12, background: '#f9fafb', fontSize: 13, color: '#374151' }}>
          <div>자동 생성 AddressSubCode: {previewSubCode}</div>
          <div style={{ marginTop: 4 }}>자동 생성 AddressCode24: {previewAddress24}</div>
        </div>

        <div>
          <button type="button" onClick={onSaveMock} style={saveButtonStyle}>
            저장 (Mock)
          </button>
        </div>
      </section>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#ffffff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['AddressCode24', '건물명', '상세주소', '상태'].map((header) => (
                <th key={header} style={thStyle}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={tdStyle}>{row.addressCode24}</td>
                <td style={tdStyle}>{row.buildingName}</td>
                <td style={tdStyle}>{row.detailAddress}</td>
                <td style={tdStyle}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

const fieldStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  fontSize: 14,
  color: '#374151'
}

const inputStyle: CSSProperties = {
  height: 38,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '0 10px',
  fontSize: 14
}

const saveButtonStyle: CSSProperties = {
  border: '1px solid #111827',
  borderRadius: 8,
  background: '#111827',
  color: '#ffffff',
  padding: '9px 13px',
  fontWeight: 700,
  cursor: 'pointer'
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: 12,
  fontSize: 13,
  color: '#6b7280',
  borderBottom: '1px solid #e5e7eb'
}

const tdStyle: CSSProperties = {
  padding: 12,
  borderBottom: '1px solid #f3f4f6',
  fontSize: 14
}
