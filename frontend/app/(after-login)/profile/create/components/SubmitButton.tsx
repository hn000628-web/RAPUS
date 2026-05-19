'use client'

/* ==================================================
SECTION 01 : TYPE
================================================== */

type Props = {
  loading: boolean
  onClick: () => void
  fixed?: boolean // ✅ 추가 (default: true)
  label?: string  // ✅ 버튼 텍스트 커스터마이즈
}

/* ==================================================
SECTION 02 : COMPONENT
================================================== */

export default function SubmitButton({
  loading,
  onClick,
  fixed = true,
  label
}: Props) {

  /* ==================================================
  SECTION 03 : STYLE (WRAPPER)
  ================================================== */

  const wrapperStyle: React.CSSProperties = fixed
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 16px',
        background: '#f5f6f7',
        borderTop: '1px solid #e6e6e6',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 50,
      }
    : {
        width: '100%',
        marginTop: 20,
      }

  /* ==================================================
  SECTION 04 : BUTTON LABEL
  ================================================== */

  const buttonLabel =
    loading
      ? '처리중...'
      : label ?? '등록하기'

  /* ==================================================
  SECTION 05 : RENDER
  ================================================== */

  return (
    <div style={wrapperStyle}>
      <button
        onClick={onClick}
        disabled={loading}
        style={{
          width: '100%',
          maxWidth: 720,
          padding: '14px 0',
          borderRadius: 10,
          border: 'none',
          background: loading ? '#9bbcf5' : '#1877f2',
          color: '#fff',
          fontSize: 15,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {buttonLabel}
      </button>
    </div>
  )
}