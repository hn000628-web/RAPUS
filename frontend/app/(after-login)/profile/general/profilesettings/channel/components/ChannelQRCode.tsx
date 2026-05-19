// FILE : frontend/app/(after-login)/profile/general/profilesettings/channel/components/ChannelQRCode.tsx
// ROOT : frontend/app/(after-login)/profile/general/profilesettings/channel/components/ChannelQRCode.tsx
// STATUS : MODIFY MODE
// ROLE : GENERAL PROFILE CHANNEL QR CODE COMPONENT
// CHANGE SUMMARY :
// - invalid UTF-8 parsing error 해결
// - 깨진 문자열 제거
// - QR 코드 렌더링 유지
// - RAPUS 브랜드 카드 PNG 생성 유지
// - 이미지 팝업 보기 유지
// - 다운로드 / 공유 / 팝업 버튼 정상 한글화
// - STRICT TS SAFE 유지
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

// SECTION 03 : COMPONENT

export default function ChannelQRCode({
  channelCode,
  channelId,
  channelName
}: ChannelQRCodeProps) {
  const qrRef =
    useRef<HTMLDivElement | null>(null)

  const [isPopupOpen, setPopupOpen] =
    useState(false)

  const [cardImage, setCardImage] =
    useState<string | null>(null)

  // SECTION 04 : GUARD

  if (!channelCode || channelCode.trim() === '') {
    return null
  }

  const safeCode =
    channelCode.trim()

  const displayName =
    channelName || channelId || safeCode

  const channelUrl =
    `xxx.com/@${encodeURIComponent(safeCode)}`

  // SECTION 05 : CARD GENERATOR

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

    const canvas =
      document.createElement('canvas')

    canvas.width = 460
    canvas.height = 640

    const ctx =
      canvas.getContext('2d')

    if (!ctx) {
      return
    }

    const image =
      new Image()

    image.onload = () => {
      ctx.fillStyle = '#f1f5f9'
      ctx.fillRect(0, 0, 460, 640)

      ctx.fillStyle = '#ffffff'

      roundRect(
        ctx,
        30,
        30,
        400,
        580,
        28
      )

      ctx.fill()

      ctx.strokeStyle = '#e2e8f0'

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
          130,
          0,
          330,
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

      ctx.fillStyle = gradient
      ctx.font = '900 44px Arial'
      ctx.textAlign = 'center'

      ctx.fillText(
        'RAPUS',
        230,
        105
      )

      ctx.fillStyle = '#334155'
      ctx.font = '700 24px Arial'

      ctx.fillText(
        `@${displayName}`,
        230,
        150
      )

      ctx.shadowColor = 'rgba(0,0,0,0.08)'
      ctx.shadowBlur = 20
      ctx.fillStyle = '#ffffff'

      roundRect(
        ctx,
        90,
        200,
        280,
        280,
        22
      )

      ctx.fill()

      ctx.shadowBlur = 0
      ctx.strokeStyle = '#e2e8f0'

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
        image,
        106,
        216,
        248,
        248
      )

      ctx.fillStyle = '#94a3b8'
      ctx.font = '15px Arial'

      ctx.fillText(
        `xxx.com/@${safeCode}`,
        230,
        535
      )

      ctx.fillStyle = '#c7d2fe'
      ctx.font = '13px Arial'

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
    }

    image.src =
      `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgData)))}`
  }

  // SECTION 06 : DOWNLOAD

  function handleDownload() {
    generateCardImage(true)
  }

  // SECTION 07 : ROUND RECT

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

  // SECTION 08 : SHARE

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'RAPUS Channel',
          text: 'RAPUS Channel QR',
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

  // SECTION 09 : POPUP EVENT

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
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.92)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}
      >
        {cardImage && (
          <img
            src={cardImage}
            alt="RAPUS QR 카드"
            style={{
              width: 360,
              borderRadius: 26,
              boxShadow: '0 25px 70px rgba(0,0,0,0.45)'
            }}
          />
        )}

        <button
          type="button"
          onClick={closePopup}
          style={{
            marginTop: 28,
            background: '#111827',
            color: '#ffffff',
            border: 'none',
            padding: '11px 24px',
            borderRadius: 14,
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 800
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
          fontSize: 13,
          color: '#64748b',
          fontWeight: 700
        }}
      >
        QR Code
      </div>

      <div
        ref={qrRef}
        style={{
          background: '#ffffff',
          padding: 20,
          borderRadius: 20,
          boxShadow: '0 12px 34px rgba(0,0,0,0.08)'
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
            background: '#111827',
            color: '#ffffff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 8,
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
            background: '#e2e8f0',
            color: '#111827',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 8,
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
            background: '#22c55e',
            color: '#ffffff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 8,
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