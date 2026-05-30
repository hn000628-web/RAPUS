'use client'

const adminMenus = [
  'AI 엔진 상태',
  'AI 데이터셋',
  'AI 원장 관리',
  '바코드 원장',
  '상품 원장',
  '이미지 원장',
  '브랜드 원장',
  'AI 로그',
  'AI 테스트',
  'AI 스냅샷'
]

export default function MeteoAiAdminPage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <h1 style={styles.title}>메테오AI_admin</h1>
        <p style={styles.subtitle}>AI 운영센터</p>
        <p style={styles.caption}>권한 정책(UI 안내): meteoAiGrade &gt;= 24 또는 OWNER_ACCOUNT</p>
      </section>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>운영/설정 관리 메뉴</h2>
        <div style={styles.grid}>
          {adminMenus.map((menu) => (
            <div key={menu} style={styles.card}>{menu}</div>
          ))}
        </div>
      </section>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    padding: '24px',
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
    display: 'grid',
    gap: '20px'
  },
  hero: {
    borderRadius: '16px',
    background: '#111827',
    color: '#ffffff',
    padding: '28px'
  },
  title: { margin: 0, fontSize: '30px', fontWeight: 700 },
  subtitle: { marginBottom: '6px', opacity: 0.9 },
  caption: { margin: 0, color: '#cbd5e1', fontSize: '14px' },
  panel: {
    borderRadius: '14px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    padding: '20px'
  },
  panelTitle: { marginTop: 0, marginBottom: '12px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px'
  },
  card: {
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
    padding: '12px',
    fontWeight: 600,
    textAlign: 'center'
  }
}
