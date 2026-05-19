'use client'

/* ==================================================
SECTION 01 IMPORT
================================================== */

import CoverSection from './CoverSection'
import AvatarSection from './AvatarSection'

/* ==================================================
SECTION 02 TYPE
================================================== */

type Props = {

  heroImages: string[]

  avatarUrl: string | null
  avatarThumbUrl?: string | null

  displayName: string
  regionName: string

  email?: string

  channelCode: string        // 🔥 내부 식별용
  channelName: string        // 🔥 UI 출력용 (추가)

}

/* ==================================================
SECTION 03 COMPONENT
================================================== */

export default function ProfileHeader({

  heroImages,
  avatarUrl,
  avatarThumbUrl,
  displayName,
  regionName,
  email,

  channelCode,
  channelName

}: Props) {

/* ==================================================
SECTION 04 CHANNEL URL BUILD
================================================== */

  const channelURL =
    channelName
      ? '@' + channelName
      : null

/* ==================================================
SECTION 05 RETURN
================================================== */

  return (

    <div>

      {/* COVER + AVATAR */}
      <div
        style={{
          position: 'relative',
          marginBottom: 72
        }}
      >

        <CoverSection
          imageUrls={heroImages || []}
          editable
        />

        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '100%',
            transform: 'translate(-50%,-50%)',
            zIndex: 10
          }}
        >

          <AvatarSection
            imageUrl={avatarUrl}
            thumbUrl={avatarThumbUrl || undefined}
            editable={true}
          />

        </div>

      </div>

      {/* TEXT AREA */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 24
        }}
      >

        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 600
          }}
        >
          {displayName || '닉네임 없음'}
        </h2>

        <p
          style={{
            marginTop: 6,
            color: '#64748b',
            fontSize: 14
          }}
        >
          {regionName || '지역 미설정'}
        </p>

        {/* email optional */}
        {email && (
          <p
            style={{
              marginTop: 4,
              color: '#94a3b8',
              fontSize: 12
            }}
          >
            {email}
          </p>
        )}

        {/* 🔥 channelName 기반 출력 */}
        {channelURL && (
          <p
            style={{
              marginTop: 10,
              fontSize: 13,
              color: '#22c55e',
              fontWeight: 600
            }}
          >
            {channelURL}
          </p>
        )}

      </div>

    </div>

  )

}