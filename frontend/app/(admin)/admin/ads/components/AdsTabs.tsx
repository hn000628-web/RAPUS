// frontend/app/admin/ads/components/AdsTabs.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdsTabs() {
  const pathname = usePathname();

  const isNormal = pathname.includes('/admin/ads/normal');
  const isSponsor = pathname.includes('/admin/ads/hero');

  const tabStyle = (active: boolean) => ({
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    background: active ? '#111' : '#f2f2f2',
    color: active ? '#fff' : '#333',
    textDecoration: 'none',
  });

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Link href="/admin/ads/normal" style={tabStyle(isNormal)}>
        일반 광고
      </Link>
      <Link href="/admin/ads/hero" style={tabStyle(isSponsor)}>
        히어로 광고
      </Link>
    </div>
  );
}
