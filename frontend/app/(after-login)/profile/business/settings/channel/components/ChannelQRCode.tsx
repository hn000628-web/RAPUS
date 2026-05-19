// FILE : frontend/app/(after-login)/profile/business/settings/channel/components/ChannelQRCode.tsx
// ROOT : frontend/app/(after-login)/profile/business/settings/channel/components/ChannelQRCode.tsx
// STATUS : RECREATE MODE
// ROLE : BUSINESS CHANNEL QR CODE COMPONENT
// CHANGE SUMMARY :
// - invalid utf-8 sequence 오류 대응용 UTF-8 파일 재생성
// - 깨진 한글 버튼 문구 정상화
// - react-qr-code 기반 QR 렌더링 유지
// - QR 카드 PNG 생성 / 다운로드 / 팝업 보기 / 공유 기능 유지
// - btoa 직접 사용 제거 후 Blob URL 기반 SVG 이미지 변환으로 안정화
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

type ChannelQRCodeProps = {
  channelCode: string
  channelId: string
  channelName?: string
}

// SECTION 03 : CONSTANT

const CARD_WIDTH =
  460

const CARD_HEIGHT =
  640

const DEFAULT_BRAND_NAME =
  'RAPUS'

// SECTION 04 : COMPONENT

export default function ChannelQRCode({
  channelCode,
  channelId,
  channelName
}: ChannelQRCodeProps) {
  // SECTION 05 : REF / STATE

  const qrRef =
    useRef<HTMLDivElement | null>(null)

  const [isPopupOpen, setPopupOpen] =
    useState(false)

  const [cardImage, setCardImage] =
    useState<string | null>(null)

  // SECTION 06 : GUARD DATA

  const safeCode =
    channelCode.trim()

  if (!safeCode) {
    return null
  }

  const displayName =
    (channelName || channelId || safeCode).trim()

  const publicChannelPath =
    `/channel/${encodeURIComponent(safeCode)}`

  const publicChannelUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${publicChannelPath}`
      : publicChannelPath

  const channelUrl =
    publicChannelUrl

  const displayUrl =
    publicChannelUrl

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
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  // SECTION 08 : CARD GENERATOR

  function generateCardImage(
    download: boolean
  ) {
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
        100
      )

      ctx.fillStyle =
        '#334155'

      ctx.font =
        '700 24px Arial'

      ctx.fillText(
        `@${displayName}`,
        230,
        150
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
        200,
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
        200,
        280,
        280,
        22
      )

      ctx.stroke()

      ctx.drawImage(
        img,
        106,
        216,
        248,
        248
      )

      ctx.fillStyle =
        '#94a3b8'

      ctx.font =
        '15px Arial'

      ctx.fillText(
        displayUrl,
        230,
        535
      )

      ctx.fillStyle =
        '#a5b4fc'

      ctx.font =
        '13px Arial'

      ctx.fillText(
        'Scan to open channel',
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
          `channel-${safeCode}.png`

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
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Channel',
          text: 'Channel QR',
          url: channelUrl
        })

        return
      }

      await navigator.clipboard.writeText(channelUrl)
      alert('URL이 복사되었습니다.')
    } catch {
      return
    }
  }

  function openPopup() {
    generateCardImage(false)
    setPopupOpen(true)
  }

  function closePopup() {
    setPopupOpen(false)
  }

  // SECTION 10 : UI BLOCK

  const PopupUI =
    isPopupOpen && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="채널 QR 카드 보기"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: 'rgba(0, 0, 0, 0.92)'
        }}
        onClick={closePopup}
      >
        {cardImage && (
          <img
            src={cardImage}
            alt="채널 QR 카드"
            style={{
              width: 360,
              maxWidth: '100%',
              borderRadius: 26,
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.45)'
            }}
            onClick={(event) => {
              event.stopPropagation()
            }}
          />
        )}

        <button
          type="button"
          onClick={closePopup}
          style={{
            marginTop: 28,
            padding: '11px 24px',
            border: 0,
            borderRadius: 14,
            background: '#111827',
            color: '#ffffff',
            fontSize: 15,
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          닫기
        </button>
      </div>
    )

  // SECTION 11 : RETURN

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        marginTop: 10
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: 13,
          fontWeight: 700
        }}
      >
        QR Code
      </div>

      <div
        ref={qrRef}
        style={{
          padding: 20,
          borderRadius: 20,
          background: '#ffffff',
          boxShadow: '0 12px 34px rgba(0, 0, 0, 0.08)'
        }}
      >
        <QRCode
          value={channelUrl}
          size={150}
          bgColor="#ffffff"
          fgColor="#111827"
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: 6
        }}
      >
        <button
          type="button"
          onClick={handleDownload}
          style={{
            padding: '8px 14px',
            border: 0,
            borderRadius: 8,
            background: '#111827',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          PNG 저장
        </button>

        <button
          type="button"
          onClick={handleShare}
          style={{
            padding: '8px 14px',
            border: 0,
            borderRadius: 8,
            background: '#e2e8f0',
            color: '#111827',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          공유
        </button>

        <button
          type="button"
          onClick={openPopup}
          style={{
            padding: '8px 14px',
            border: 0,
            borderRadius: 8,
            background: '#22c55e',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          팝업
        </button>
      </div>

      {PopupUI}
    </div>
  )
}
