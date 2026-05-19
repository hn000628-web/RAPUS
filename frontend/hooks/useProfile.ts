'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ProfileType = 'GENERAL' | 'BUSINESS';

type Profile = {
  profileId: number;
  profileType: ProfileType;
  displayName: string;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  regionName: string | null;
  friendCount?: number;
  subscriberCount?: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token || !API_URL) {
      router.push('/');
      return;
    }

    fetch(`${API_URL}/profiles/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setProfile(data.profile);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        router.push('/');
      });
  }, [router]);

  return { profile, loading };
}