// FILE: frontend/components/profile/PersonalHeader.tsx
// ROOT: frontend/components/profile/PersonalHeader.tsx

'use client'

// SECTION 01 : IMPORT
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'

// SECTION 02 : TYPE
type ProfileHeaderProps = {
  heroImages: string[]
  profileImage?: string | null
  name: string
  description?: string
  region?: string
  friendCount?: number
}

// SECTION 03 : CONSTANT
const HERO_HEIGHT = 260
const PROFILE_SIZE = 110

// SECTION 04 : COMPONENT
export default function PersonalHeader({
  heroImages,
  profileImage,
  name,
  description,
  region,
  friendCount = 0
}: ProfileHeaderProps) {

  const router = useRouter()

// SECTION 05 : STATE
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hoverProfile, setHoverProfile] = useState(false)
  const [hoverPost, setHoverPost] = useState(false)

// SECTION 06 : DERIVED STATE
  const total = heroImages?.length || 0

  const safeIndex = useMemo(() => {
    if (total === 0) return 0
    if (currentIndex >= total) return 0
    if (currentIndex < 0) return 0
    return currentIndex
  }, [currentIndex, total])

  const currentHero =
    total > 0 ? heroImages[safeIndex] : ''

// SECTION 07 : EVENT HANDLER
  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (total <= 1) return
    setCurrentIndex(prev =>
      prev === 0 ? total - 1 : prev - 1
    )
  }

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (total <= 1) return
    setCurrentIndex(prev =>
      prev === total - 1 ? 0 : prev + 1
    )
  }

// SECTION 08 : NAVIGATION
  const openHeroViewer = () => {
    if (total === 0) return

    try {
      const encoded =
        encodeURIComponent(JSON.stringify(heroImages))

      router.push(
        `/profile/view/hero?index=${safeIndex}&images=${encoded}`
      )
    } catch {
      console.error('Hero viewer open failed')
    }
  }

  const openProfilePhoto = () => {
    if (!profileImage) return

    const encoded = encodeURIComponent(profileImage)

    router.push(
      `/profile/view/photo?image=${encoded}&mode=single`
    )
  }

// SECTION 09 : UI BLOCK - HERO
  const HeroUI = (
    <section
      onClick={openHeroViewer}
      style={{
        height: HERO_HEIGHT,
        backgroundImage:
          currentHero
            ? `url('${encodeURI(currentHero)}')`
            : undefined,
        backgroundColor:
          currentHero ? undefined : '#ddd',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        cursor:
          currentHero ? 'zoom-in' : 'default'
      }}
    >
      {total > 1 && (
        <>
          <button
            onClick={goPrev}
            style={{ ...navBtnStyle, left: 16 }}
          >
            ‹
          </button>

          <button
            onClick={goNext}
            style={{ ...navBtnStyle, right: 16 }}
          >
            ›
          </button>

          <div style={heroCounterStyle}>
            {safeIndex + 1} / {total}
          </div>
        </>
      )}
    </section>
  )

// SECTION 10 : UI BLOCK - PROFILE
const ProfileUI = (
  <section style={summarySectionStyle}>

    <div style={summaryRowStyle}>

      {/* 🔥 프로필 이미지 영역 */}
      <div
        onClick={openProfilePhoto}

        onMouseEnter={(e)=>{
          e.currentTarget.style.transform='scale(1.05)'
        }}

        onMouseLeave={(e)=>{
          e.currentTarget.style.transform='scale(1)'
        }}

        style={{
          ...profileImageStyle(profileImage),

          cursor: profileImage ? 'zoom-in' : 'default',
          transition:'all 0.2s',
          position:'relative'
        }}
      >

        {/* 🔥 hover overlay */}
        {profileImage && (
          <div
            style={{
              position:'absolute',
              inset:0,
              borderRadius:'50%',
              background:'rgba(0,0,0,0.2)',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              color:'#fff',
              fontSize:18,
              opacity:0,
              transition:'opacity 0.2s'
            }}
            className="profile-overlay"
          >
            🔍
          </div>
        )}

      </div>

      <div style={infoAreaStyle}>

        <div style={nameStyle}>
          {name}
        </div>

        <div style={badgeStyle}>
          일반계정
        </div>

        {region && (
          <div style={regionStyle}>
            {region}
          </div>
        )}

        <div style={followerStyle}>
          👥 친구 {friendCount.toLocaleString()}
        </div>

      </div>

    </div>

    {description && (
      <div style={descriptionStyle}>
        {description}
      </div>
    )}

    <div style={actionRowStyle}>

      <button
        onClick={() =>
          router.push('/profile/general/profilesettings')
        }
        onMouseEnter={() => setHoverProfile(true)}
        onMouseLeave={() => setHoverProfile(false)}
        style={{
          ...btnStyle,
          flex: 1,
          background:
            hoverProfile ? '#1877f2' : '#fff',
          color:
            hoverProfile ? '#fff' : '#000'
        }}
      >
        프로필 설정
      </button>

      <button
        onClick={() =>
          router.push('/profile/general/create/select')
        }
        onMouseEnter={() => setHoverPost(true)}
        onMouseLeave={() => setHoverPost(false)}
        style={{
          ...btnStyle,
          flex: 1,
          background:
            hoverPost ? '#1877f2' : '#fff',
          color:
            hoverPost ? '#fff' : '#000'
        }}
      >
        게시물 / 사진 등록
      </button>

    </div>

  </section>
)

// SECTION 11 : RETURN
  return (
    <div>
      {HeroUI}
      {ProfileUI}
    </div>
  )
}

// SECTION 12 : STYLE
const summarySectionStyle: React.CSSProperties = {
  padding: '16px',
  background: '#fff'
}

const summaryRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16
}

const infoAreaStyle: React.CSSProperties = {
  flex: 1,
  marginLeft: 10
}

const nameStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700
}

const badgeStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#777'
}

const regionStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#888'
}

const followerStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 13
}

const descriptionStyle: React.CSSProperties = {
  marginTop: 16,
  fontSize: 13,
  color: '#666'
}

const actionRowStyle: React.CSSProperties = {
  marginTop: 20,
  display: 'flex',
  gap: 10
}

const btnStyle: React.CSSProperties = {
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: 6,
  cursor: 'pointer'
}

const navBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'rgba(0,0,0,0.4)',
  color: '#fff',
  border: 'none',
  width: 36,
  height: 36,
  borderRadius: '50%'
}

const heroCounterStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(0,0,0,0.4)',
  padding: '4px 10px',
  borderRadius: 20,
  color: '#fff'
}

function profileImageStyle(profileImage?: string | null): React.CSSProperties {
  return {
    width: PROFILE_SIZE,
    height: PROFILE_SIZE,
    borderRadius: '50%',
    backgroundImage: profileImage
      ? `url('${encodeURI(profileImage)}')`
      : undefined,
    backgroundColor: '#eee',
    backgroundSize: 'cover',
    border: '4px solid #fff'
  }
}