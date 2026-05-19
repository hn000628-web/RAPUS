'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  isLoggedIn: boolean;
  isCheckingAuth: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // ❗ PHASE 3: UX 기준선
    // 실제 refresh API는 다음 PHASE에서 연결
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isCheckingAuth,
        login: () => setIsLoggedIn(true),
        logout: () => setIsLoggedIn(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext not found');
  return ctx;
}
