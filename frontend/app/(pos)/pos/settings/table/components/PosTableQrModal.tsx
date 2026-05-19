// FILE : frontend/app/(pos)/pos/settings/table/components/PosTableQrModal.tsx
// ROOT : frontend/app/(pos)/pos/settings/table/components/PosTableQrModal.tsx
// STATUS : CREATE MODE
// ROLE : POS TABLE QR ORDER MODAL COMPONENT
// CHANGE SUMMARY :
// - POS 테이블 QR 오더 보기 전용 모달 신규 생성
// - react-qr-code 기반 QR 렌더링 적용
// - qrCodeValue / tableOrderUrl 기반 QR payload 표시
// - Frontend QR URL 생성 금지 구조 유지
// - PNG 저장 / 공유 / 닫기 기능 추가
// - strict TypeScript safe 구조 적용
// - API / DB / Service 영향 없음

'use client'

// SECTION 01 : IMPORT

import {
  useRef,
  useState
} from 'react'

import QRCode from 'react-qr-code'

// SECTION 02 : TYPE

type PosTableQrStatus =
  | 'CONNECTED'
  | 'DISCONNECTED'

type PosTableQrModalProps = {
  isOpen: boolean
  businessName: string
  tableName: string
  zoneName: string
  tableOptionName: string
  tableCode?: string | null
  tableOrderUrl?: string | null
  qrCodeValue?: string | null
  qrStatus: PosTableQrStatus
  onClose: () => void
}

// SECTION 03 : CONSTANT

const CARD_WIDTH =
  460

const CARD_HEIGHT =
  640

const DEFAULT_BRAND_NAME =
  'RAPUS'

const DEFAULT_QR_TITLE =
  'TABLE ORDER'

// SECTION 04 : COMPONENT

export default function PosTableQrModal({
  isOpen,
  businessName,
  tableName,
  zoneName,
  tableOptionName,
  tableCode,
  tableOrderUrl,
  qrCodeValue,
  qrStatus,
  onClose
}: PosTableQrModalProps) {
  // SECTION 05 : REF / STATE

  const qrRef =
    useRef<HTMLDivElement | null>(null)

  const [cardImage, setCardImage] =
    useState<string | null>(null)

  // SECTION 06 : GUARD DATA

  if (!isOpen) {
    return null
  }

  const safeTableName =
    tableName.trim() || '테이블'

  const safeBusinessName =
    businessName.trim() || '상호명 미설정'

  const safeZoneName =
    zoneName.trim() || '위치 미설정'

  const safeTableOptionName =
    tableOptionName.trim() || '좌석 옵션 없음'

  const safeTableCode =
    tableCode?.trim() || ''

  const qrValue =
    qrCodeValue?.trim() ||
    tableOrderUrl?.trim() ||
    ''

  const hasQrValue =
    qrValue.length > 0

  const statusLabel =
    qrStatus === 'CONNECTED'
      ? 'QR 연결'
      : 'QR 미연결'

  const fileSafeName =
    safeTableCode ||
    safeTableName.replace(/\s+/g, '-')

  // SECTION 07 : DRAW UTIL

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath()
    ctx.moveTo(
      x + radius,
      y
    )
    ctx.lineTo(
      x + width - radius,
      y
    )
    ctx.quadraticCurveTo(
      x + width,
      y,
      x + width,
      y + radius
    )
    ctx.lineTo(
      x + width,
      y + height - radius
    )
    ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    )
    ctx.lineTo(
      x + radius,
      y + height
    )
    ctx.quadraticCurveTo(
      x,
      y + height,
      x,
      y + height - radius
    )
    ctx.lineTo(
      x,
      y + radius
    )
    ctx.quadraticCurveTo(
      x,
      y,
      x + radius,
      y
    )
    ctx.closePath()
  }

  // SECTION 08 : CARD GENERATOR

  function generateCardImage(
    download: boolean
  ) {
    if (!hasQrValue) {
      return
    }

    const svg =
      qrRef.current?.querySelector('svg')

    if (!svg) {
      return
    }

    const svgData =
      new XMLSerializer().serializeToString(svg)

    const svgBlob =
      new Blob(
        [svgData],
        {
          type: 'image/svg+xml;charset=utf-8'
        }
      )

    const svgUrl =
      URL.createObjectURL(svgBlob)

    const canvas =
      document.createElement('canvas')

    canvas.width =
      CARD_WIDTH

    canvas.height =
      CARD_HEIGHT

    const ctx =
      canvas.getContext('2d')

    if (!ctx) {
      URL.revokeObjectURL(svgUrl)
      return
    }

    const img =
      new Image()

    img.onload = () => {
      ctx.clearRect(
        0,
        0,
        CARD_WIDTH,
        CARD_HEIGHT
      )

      ctx.fillStyle =
        '#f1f5f9'

      ctx.fillRect(
        0,
        0,
        CARD_WIDTH,
        CARD_HEIGHT
      )

      ctx.fillStyle =
        '#ffffff'

      roundRect(
        ctx,
        30,
        30,
        400,
        580,
        28
      )

      ctx.fill()

      ctx.strokeStyle =
        '#e2e8f0'

      ctx.lineWidth =
        1

      roundRect(
        ctx,
        30,
        30,
        400,
        580,
        28
      )

      ctx.stroke()

      const gradient =
        ctx.createLinearGradient(
          120,
          0,
          340,
          0
        )

      gradient.addColorStop(
        0,
        '#1877f2'
      )

      gradient.addColorStop(
        1,
        '#22c55e'
      )

      ctx.fillStyle =
        gradient

      ctx.font =
        '900 44px Arial'

      ctx.textAlign =
        'center'

      ctx.textBaseline =
        'middle'

      ctx.fillText(
        DEFAULT_BRAND_NAME,
        230,
        82
      )

      ctx.fillStyle =
        '#0f172a'

      ctx.font =
        '800 20px Arial'

      ctx.fillText(
        safeBusinessName,
        230,
        122
      )

      ctx.fillStyle =
        '#0f172a'

      ctx.font =
        '900 26px Arial'

      ctx.fillText(
        DEFAULT_QR_TITLE,
        230,
        156
      )

      ctx.fillStyle =
        '#334155'

      ctx.font =
        '800 24px Arial'

      ctx.fillText(
        safeTableName,
        230,
        196
      )

      ctx.fillStyle =
        '#64748b'

      ctx.font =
        '700 16px Arial'

      ctx.fillText(
        `${safeZoneName} · ${safeTableOptionName}`,
        230,
        224
      )

      ctx.shadowColor =
        'rgba(0, 0, 0, 0.08)'

      ctx.shadowBlur =
        20

      ctx.fillStyle =
        '#ffffff'

      roundRect(
        ctx,
        90,
        230,
        280,
        280,
        22
      )

      ctx.fill()

      ctx.shadowBlur =
        0

      ctx.strokeStyle =
        '#e2e8f0'

      roundRect(
        ctx,
        90,
        230,
        280,
        280,
        22
      )

      ctx.stroke()

      ctx.drawImage(
        img,
        106,
        246,
        248,
        248
      )

      ctx.fillStyle =
        qrStatus === 'CONNECTED'
          ? '#16a34a'
          : '#f59e0b'

      ctx.font =
        '800 15px Arial'

      ctx.fillText(
        statusLabel,
        230,
        535
      )

      ctx.fillStyle =
        '#94a3b8'

      ctx.font =
        '13px Arial'

      ctx.fillText(
        qrValue,
        230,
        565
      )

      const pngFile =
        canvas.toDataURL('image/png')

      setCardImage(pngFile)

      if (download) {
        const link =
          document.createElement('a')

        link.download =
          `table-qr-${fileSafeName}.png`

        link.href =
          pngFile

        link.click()
      }

      URL.revokeObjectURL(svgUrl)
    }

    img.onerror = () => {
      URL.revokeObjectURL(svgUrl)
    }

    img.src =
      svgUrl
  }

  // SECTION 09 : EVENT

  function handleDownload() {
    generateCardImage(true)
  }

  async function handleShare() {
    if (!hasQrValue) {
      return
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'RAPUS Table Order',
          text: `${safeTableName} 테이블 주문 QR`,
          url: qrValue
        })

        return
      }

      await navigator.clipboard.writeText(qrValue)
      alert('QR URL이 복사되었습니다.')
    } catch {
      return
    }
  }

  function handleOverlayClick() {
    onClose()
  }

  function handleCardClick(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    event.stopPropagation()
  }

  // SECTION 10 : STYLE

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'rgba(15, 23, 42, 0.72)'
  }

  const modalStyle: React.CSSProperties = {
    width: 360,
    maxWidth: '100%',
    borderRadius: 28,
    padding: 22,
    background: '#ffffff',
    boxShadow: '0 25px 70px rgba(0, 0, 0, 0.35)'
  }

  const brandStyle: React.CSSProperties = {
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: 1,
    background: 'linear-gradient(90deg, #1877f2, #22c55e)',
    WebkitBackgroundClip: 'text',
    color: 'transparent'
  }

  const titleStyle: React.CSSProperties = {
    marginBottom: 4,
    textAlign: 'center',
    color: '#111827',
    fontSize: 18,
    fontWeight: 900
  }

  const businessNameStyle: React.CSSProperties = {
    marginBottom: 4,
    textAlign: 'center',
    color: '#334155',
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 1.35,
    minHeight: 20,
    maxHeight: 42,
    overflow: 'hidden',
    wordBreak: 'break-word'
  }

  const metaStyle: React.CSSProperties = {
    marginBottom: 16,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 13,
    fontWeight: 800
  }

  const qrBoxStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 20,
    background: '#ffffff',
    boxShadow: '0 12px 34px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0'
  }

  const urlStyle: React.CSSProperties = {
    marginTop: 14,
    color: '#64748b',
    fontSize: 12,
    fontWeight: 700,
    textAlign: 'center',
    wordBreak: 'break-all'
  }

  const statusStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    padding: '5px 10px',
    borderRadius: 999,
    border:
      qrStatus === 'CONNECTED'
        ? '1px solid #86efac'
        : '1px solid #fbbf24',
    background:
      qrStatus === 'CONNECTED'
        ? '#dcfce7'
        : '#fffbeb',
    color:
      qrStatus === 'CONNECTED'
        ? '#15803d'
        : '#d97706',
    fontSize: 12,
    fontWeight: 900
  }

  const actionRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18
  }

  const primaryButtonStyle: React.CSSProperties = {
    padding: '10px 14px',
    border: 0,
    borderRadius: 12,
    background: '#111827',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer'
  }

  const secondaryButtonStyle: React.CSSProperties = {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: 12,
    background: '#ffffff',
    color: '#111827',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer'
  }

  const disabledButtonStyle: React.CSSProperties = {
    ...secondaryButtonStyle,
    opacity: 0.45,
    cursor: 'not-allowed'
  }

  const emptyStyle: React.CSSProperties = {
    padding: 22,
    borderRadius: 18,
    background: '#f8fafc',
    color: '#64748b',
    fontSize: 14,
    fontWeight: 800,
    textAlign: 'center'
  }

  // SECTION 11 : RETURN

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="테이블 QR 오더 보기"
      style={overlayStyle}
      onClick={handleOverlayClick}
    >
      <div
        style={modalStyle}
        onClick={handleCardClick}
      >
        <div style={brandStyle}>
          {DEFAULT_BRAND_NAME}
        </div>

        <div style={businessNameStyle}>
          {safeBusinessName}
        </div>

        <div style={titleStyle}>
          {DEFAULT_QR_TITLE}
        </div>

        <div style={metaStyle}>
          {safeTableName}
          <br />
          {safeZoneName} · {safeTableOptionName}
          {safeTableCode && (
            <>
              <br />
              CODE : {safeTableCode}
            </>
          )}
        </div>

        {hasQrValue ? (
          <>
            <div
              ref={qrRef}
              style={qrBoxStyle}
            >
              <QRCode
                value={qrValue}
                size={190}
                bgColor="#ffffff"
                fgColor="#111827"
              />
            </div>

            <div style={urlStyle}>
              {qrValue}
            </div>

            <div
              style={{
                textAlign: 'center'
              }}
            >
              <span style={statusStyle}>
                {statusLabel}
              </span>
            </div>

            <div style={actionRowStyle}>
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={handleDownload}
              >
                PNG 저장
              </button>

              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={handleShare}
              >
                공유
              </button>

              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={onClose}
              >
                닫기
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={emptyStyle}>
              QR URL이 생성되지 않았습니다.
            </div>

            <div style={actionRowStyle}>
              <button
                type="button"
                style={disabledButtonStyle}
                disabled
              >
                PNG 저장
              </button>

              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={onClose}
              >
                닫기
              </button>
            </div>
          </>
        )}

        {cardImage && (
          <img
            src={cardImage}
            alt="생성된 테이블 QR 카드 미리보기"
            style={{
              display: 'none'
            }}
          />
        )}
      </div>
    </div>
  )
}



