type MainRegionRow = {
  mainAddressCode: string
  regionName: string
  roadAddress: string
  status: '활성' | '비활성'
}

const rows: MainRegionRow[] = [
  {
    mainAddressCode: 'KRGWJSGUGHD',
    regionName: '광주 서구 금호권',
    roadAddress: '대한민국 광주광역시 서구 금호동',
    status: '활성'
  },
  {
    mainAddressCode: 'KRGWJSGUPAD',
    regionName: '광주 서구 풍암권',
    roadAddress: '대한민국 광주광역시 서구 풍암동',
    status: '활성'
  }
]

export default function AddressMainManagePage() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>권역관리</h1>
      <p style={{ margin: 0, color: '#6b7280' }}>
        CSV 업로드(목업): <code>regions_address_main_code_12.csv</code>
      </p>

      <section style={{ border: '1px dashed #cbd5e1', borderRadius: 10, padding: 14, background: '#f8fafc' }}>
        <p style={{ margin: 0, fontSize: 14, color: '#334155' }}>
          실제 업로드는 비활성 상태입니다. 이 화면은 UI 구조 검증용 Mock 입니다.
        </p>
        <button type="button" style={uploadButtonStyle}>
          CSV 선택 (Mock)
        </button>
      </section>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#ffffff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['AddressMainCode', '지역명', 'RoadAddress', '상태'].map((header) => (
                <th key={header} style={thStyle}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.mainAddressCode}>
                <td style={tdStyle}>{row.mainAddressCode}</td>
                <td style={tdStyle}>{row.regionName}</td>
                <td style={tdStyle}>{row.roadAddress}</td>
                <td style={tdStyle}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

const uploadButtonStyle: CSSProperties = {
  marginTop: 10,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  background: '#ffffff',
  color: '#111827',
  padding: '8px 12px',
  fontWeight: 600,
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
import { type CSSProperties } from 'react'
