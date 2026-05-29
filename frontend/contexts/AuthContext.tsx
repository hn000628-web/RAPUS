'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  clearClientAuthState,
  getMe,
  logout as requestLogout
} from '@/lib/authApi'

/* ==================================================
SECTION 02 TYPES
================================================== */

type Profile = {
  userId?: number
  profileId?: number
  profileType?: 'GENERAL' | 'BUSINESS'
  channelCode?: string
  displayName?: string
  email?: string
}

type AuthType = {
  loading: boolean
  isLogin: boolean
  profile: Profile | null
  logout: () => Promise<void>
}

/* ==================================================
SECTION 03 CONTEXT
================================================== */

const AuthContext = createContext<AuthType>({
  loading: true,
  isLogin: false,
  profile: null,
  logout: async () => {}
})

function normalizeProfileFromMe(user: Record<string, any> | null | undefined): Profile {
  if (!user || typeof user !== 'object') {
    return {}
  }

  return {
    userId: user.userId,
    profileId: user.profileId,
    profileType: user.profileType,
    channelCode: user.channelCode,
    displayName: user.displayName ?? undefined,
    email: user.email
  }
}

/* ==================================================
SECTION 04 PROVIDER
================================================== */

export function AuthProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLogin, setIsLogin] = useState(false)

  const refreshProfile = async (
    mounted: boolean,
    expectedAccessToken?: string | null
  ): Promise<void> => {
    const token = localStorage.getItem('accessToken')
    const resolvedToken = expectedAccessToken ?? token

    if (!resolvedToken) {
      if (!mounted) {
        return
      }

      clearClientAuthState()
      setProfile(null)
      setIsLogin(false)
      setLoading(false)
      return
    }

    if (!mounted) {
      return
    }

    setLoading(true)
    setProfile(null)

    try {
      const data = await getMe()
      const currentToken = localStorage.getItem('accessToken')

      if (currentToken !== resolvedToken) {
        return
      }

      if (!mounted) {
        return
      }

      setProfile(normalizeProfileFromMe(data?.user as Record<string, any> | undefined))
      setIsLogin(true)
    } catch {
      if (!mounted) {
        return
      }

      const currentToken = localStorage.getItem('accessToken')

      if (currentToken && currentToken !== resolvedToken) {
        return
      }

      clearClientAuthState()
      setProfile(null)
      setIsLogin(false)
    } finally {
      if (mounted) {
        setLoading(false)
      }
    }
  }

  /* =========================
  LOAD AUTH
  ========================= */

  useEffect(() => {
    let mounted = true

    async function load() {
      const token = localStorage.getItem('accessToken')
      await refreshProfile(mounted, token)
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  /* =========================
  AUTH CHANGE SYNC
  ========================= */

  useEffect(() => {
    let mounted = true

    async function onAuthChange() {
      const token = localStorage.getItem('accessToken')
      await refreshProfile(mounted, token)
    }

    window.addEventListener('auth-change', onAuthChange)

    return () => {
      mounted = false
      window.removeEventListener('auth-change', onAuthChange)
    }
  }, [])

  /* =========================
  LOGOUT
  ========================= */

  const logout = async () => {
    try {
      await requestLogout()
    } catch {
      clearClientAuthState()
    }

    setProfile(null)
    setIsLogin(false)
    window.dispatchEvent(new Event('auth-change'))
  }

  /* =========================
  CONTEXT VALUE
  ========================= */

  const value = useMemo(() => ({
    loading,
    isLogin,
    profile,
    logout
  }), [loading, isLogin, profile])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/* ==================================================
SECTION 05 HOOK
================================================== */

export function useAuth() {
  return useContext(AuthContext)
}
