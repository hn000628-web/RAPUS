'use client';

import { useEffect, useState } from 'react';

type SessionUser = {
  userId: number;
  profileId: number;
  profileType: 'PERSONAL' | 'BUSINESS';
} | null;

export default function useSessionUser(): SessionUser {
  const [user, setUser] = useState<SessionUser>(null);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem('accessToken');

    if (!API_URL || !token) {
      setUser(null);
      return;
    }

    const fetchSession = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem('accessToken');
          setUser(null);
          return;
        }

        const data = await res.json();

        setUser({
          userId: data.userId,
          profileId: data.profileId,
          profileType: data.profileType,
        });
      } catch (err) {
        console.error('Session fetch error:', err);
        setUser(null);
      }
    };

    fetchSession();
  }, []);

  return user;
}
