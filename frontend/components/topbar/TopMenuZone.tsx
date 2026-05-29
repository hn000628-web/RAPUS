'use client'

import {
  useCallback,
  useState,
  useEffect,
  useRef,
  CSSProperties
} from 'react'

import {
  usePathname,
  useRouter
} from 'next/navigation'
import Image from 'next/image'

import ServiceMenu from './ServiceMenu'
import ProfileMenu from './ProfileMenu'
import { useAuth } from '@/contexts/AuthContext'

type TopMenuZoneProps = {
  showDevViewportSize?: boolean
}

export default function TopMenuZone({
  showDevViewportSize = false
}: TopMenuZoneProps){

  const router = useRouter()
  const pathname = usePathname()
  const { profile, loading: authLoading, isLogin: authLoggedIn } = useAuth()
  const isHomePage = pathname === '/'
  const isPlacePage = pathname === '/place'

  const [serviceOpen,setServiceOpen] = useState(false)
  const [profileOpen,setProfileOpen] = useState(false)

  const [hoverService,setHoverService] = useState(false)
  const [hoverProfile,setHoverProfile] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const serviceMenuRef = useRef<HTMLDivElement | null>(null)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  const isLogin = Boolean(
    authLoggedIn &&
    !authLoading &&
    profile?.userId
  )
  useEffect(() => {
    function syncViewportSize() {
      setViewportWidth(window.innerWidth)
      setViewportHeight(window.innerHeight)
    }

    syncViewportSize()

    window.addEventListener('resize', syncViewportSize)
    return () => window.removeEventListener('resize', syncViewportSize)
  }, [])

  useEffect(() => {
    if (!isLogin) {
      setProfileOpen(false)
    }
  }, [isLogin])

  useEffect(() => {
    if (!serviceOpen) {
      return
    }

    if (!profileOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null

      if (
        profileMenuRef.current &&
        target &&
        profileMenuRef.current.contains(target)
      ) {
        return
      }

      setProfileOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileOpen])

  useEffect(() => {
    if (!serviceOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null

      if (
        serviceMenuRef.current &&
        target &&
        serviceMenuRef.current.contains(target)
      ) {
        return
      }

      setServiceOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setServiceOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [serviceOpen])

  const closeAll = useCallback(() => {
    setServiceOpen(false)
    setProfileOpen(false)
  }, [])

  const isMobileRegionTopbar =
    (isPlacePage || isHomePage) &&
    viewportWidth > 0 &&
    viewportWidth <= 640

  function toggleService(){
    setServiceOpen(prev=>!prev)
    setProfileOpen(false)
  }

  function toggleProfile(){
    setProfileOpen(prev=>!prev)
    setServiceOpen(false)
  }

  function goLogin(){
    router.push('/login')
  }

  function goHome(){
    closeAll()
    router.push('/')
  }

  function openPlaceRegionOverlay() {
    if (typeof window === 'undefined') {
      return
    }

    window.dispatchEvent(new Event('open-feed-region-overlay'))
  }

  return(

    <>

      <div
        style={{
          ...topbar,
          ...(isMobileRegionTopbar ? compactTopbar : null)
        }}
      >

        {isMobileRegionTopbar ? (
          <div
            style={{
              ...leftZone,
              ...mobilePlaceLeftGroup
            }}
          >
            <button
              type="button"
              style={placeTopbarLogoButton}
              onClick={goHome}
              aria-label="홈으로 이동"
            >
              RAPUS
            </button>

            <button
              type="button"
              style={mobileRegionBtn}
              onClick={openPlaceRegionOverlay}
              aria-label="피드지역 선택"
            >
              <span style={mobileRegionIcon}>⌖</span>
              <span>피드지역</span>
              <span style={mobileRegionChevron}>▾</span>
            </button>
          </div>
        ) : (
          <div
            style={{
              ...leftZone
            }}
          >
            {isPlacePage ? (
              <button
                type="button"
                style={placeTopbarLogoButton}
                onClick={goHome}
                aria-label="홈으로 이동"
              >
                RAPUS
              </button>
            ) : (
              <button
                type="button"
                style={placeTopbarLogoButton}
                onClick={goHome}
                aria-label="홈으로 이동"
              >
                RAPUS
              </button>
            )}
          </div>
        )}

        <div
          style={{
            ...centerZone,
            ...(isMobileRegionTopbar ? compactCenterZone : null)
          }}
        >
          {!isMobileRegionTopbar && null}
        </div>

        <div
          style={{
            ...rightZone,
            ...(isMobileRegionTopbar ? compactRightZone : null)
          }}
        >
          {showDevViewportSize && (
            <span style={devViewportBadgeStyle}>
              창:{viewportWidth}x{viewportHeight}
            </span>
          )}

          <div ref={serviceMenuRef} style={serviceMenuWrap}>
            <button
              style={{
                ...iconBtn,
                background: hoverService ? '#f3f4f6' : 'transparent'
              }}
              onMouseEnter={()=>setHoverService(true)}
              onMouseLeave={()=>setHoverService(false)}
              onClick={toggleService}
            >

              <Image
                src="/icons/service_diamond_container.svg"
                alt="service"
                width={20}
                height={20}
              />

            </button>

            {serviceOpen && (
              <ServiceMenu onClose={closeAll}/>
            )}
          </div>

          {isLogin ? (
            <div ref={profileMenuRef} style={profileMenuWrap}>

              <button
                style={{
                  ...iconBtn,
                  ...hamburgerBtn,
                  background: hoverProfile ? '#f3f4f6' : 'transparent'
                }}
                onMouseEnter={()=>setHoverProfile(true)}
                onMouseLeave={()=>setHoverProfile(false)}
                onClick={toggleProfile}
                aria-label="메뉴 열기"
              >
                ☰
              </button>

              {profileOpen && isLogin && (
                <ProfileMenu onClose={closeAll}/>
              )}

            </div>
          ) : (

            <button style={loginBtn} onClick={goLogin}>
              로그인
            </button>

          )}

        </div>

      </div>

    </>

  )
}

/* ==================================================
STYLE
================================================== */

const topbar:CSSProperties={
  position:'fixed',
  top:0,
  left:0,
  right:0,
  height:56,

  display:'flex',
  alignItems:'center',
  justifyContent:'space-between',

  padding:'0 16px',

  background:'#fff',

  border:'none',
  outline:'none',
  boxShadow:'none',

  transform:'translateZ(0)',

  zIndex:2000
}

const compactTopbar: CSSProperties = {
  padding: '0 12px',
  gap: 8
}

const leftZone:CSSProperties={
  display:'flex',
  alignItems:'center',
  minWidth:0
}

const centerZone:CSSProperties={
  flex:1,
  display:'flex',
  alignItems:'center',
  justifyContent:'center',
  minWidth:0
}

const compactCenterZone: CSSProperties = {
  marginRight: 0,
  flex: 0,
  width: 0
}

const rightZone:CSSProperties={
  display:'flex',
  alignItems:'center',
  gap:8
}

const compactRightZone: CSSProperties = {
  gap: 8
}

const devViewportBadgeStyle: CSSProperties = {
  height: 28,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  padding: '0 10px',
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#475569',
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1,
  whiteSpace: 'nowrap'
}

const profileMenuWrap: CSSProperties = {
  display: 'contents'
}

const serviceMenuWrap: CSSProperties = {
  display: 'contents'
}

const mobilePlaceLeftGroup: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0
}

const topbarLogoButton: CSSProperties = {
  border: 0,
  background: 'transparent',
  color: '#111827',
  cursor: 'pointer',
  fontSize: 18,
  fontWeight: 900,
  lineHeight: 1,
  padding: 0,
  letterSpacing: 0.4,
  flexShrink: 0
}

const placeTopbarLogoButton: CSSProperties = {
  ...topbarLogoButton,
  fontSize: 22,
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: 1,
  flexShrink: 0,
  whiteSpace: 'nowrap'
}

const iconBtn:CSSProperties={
  width:40,
  height:40,
  borderRadius:'50%',
  border:'none',
  background:'transparent',
  cursor:'pointer',
  display:'flex',
  alignItems:'center',
  justifyContent:'center'
}

const hamburgerBtn: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  lineHeight: 1
}

const loginBtn:CSSProperties={
  background:'#2563eb',
  color:'#fff',
  border:'none',
  borderRadius:18,
  height:36,
  padding:'0 14px',
  cursor:'pointer',
  fontSize:13,
  fontWeight:700
}

const mobileRegionBtn: CSSProperties = {
  height: 36,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  border: '1px solid #e5e7eb',
  borderRadius: 999,
  background: '#ffffff',
  color: '#111827',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 900,
  padding: '0 12px',
  whiteSpace: 'nowrap',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)'
}

const mobileRegionIcon: CSSProperties = {
  color: '#2563eb',
  fontSize: 14,
  lineHeight: 1
}

const mobileRegionChevron: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  lineHeight: 1
}
