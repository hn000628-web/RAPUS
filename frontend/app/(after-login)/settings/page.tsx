'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f0f2f5', // 외부 그레이
        padding: '-10px 0', // 위아래 여유
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          background: '#fff', // 내부 흰색
          borderRadius: 16,
          padding: '20px 30px', // 내부 위아래 여유
          boxShadow: '0 4px 0px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
          전체 설정
        </h1>

        <SettingCard
          title="계정 정보"
          onClick={() => router.push('/settings/account-status')}
        />

        <SettingCard
          title="프로필 설정"
          onClick={() => router.push('/settings/profile')}
        />

        <SettingCard
          title="지역 설정"
          onClick={() => router.push('/settings/region')}
        />

        <SettingCard
          title="관심사 설정"
          onClick={() => router.push('/settings/interests')}
        />

        <SettingCard
          title="광고"
          onClick={() => router.push('/settings/ads')}
        />

        <SettingCard
          title="친구 / 구독 설정"
          onClick={() => router.push('/settings/relationship')}
        />

        <SettingCard
          title="시스템 설정"
          onClick={() => router.push('/settings/system')}
        />
      </div>
    </div>
  );
}

/* ---------- UI Part ---------- */

function SettingCard({
  title,
  desc,
  onClick,
}: {
  title: string;
  desc?: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? '#1877f2' : '#fff',
        color: hover ? '#fff' : '#000',
        borderRadius: 12,
        padding: '16px 18px',
        marginBottom: 12,
        cursor: 'pointer',
        border: '1px solid #e5e5e5',
        fontSize: 15,
        fontWeight: 600,
        transition: 'all 0.2s ease',
      }}
    >
      {title}

      {desc && (
        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            color: hover ? '#fff' : '#666',
          }}
        >
          {desc}
        </div>
      )}
    </div>
  );
}