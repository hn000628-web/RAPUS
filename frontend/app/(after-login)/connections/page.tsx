'use client';

import { useState } from 'react';

export default function ConnectionsPage() {
  const [tab, setTab] = useState<'friends' | 'following'>('friends');

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '24px 16px',
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        친구 / 구독
      </h1>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <TabButton
          active={tab === 'friends'}
          label="친구"
          onClick={() => setTab('friends')}
        />
        <TabButton
          active={tab === 'following'}
          label="구독"
          onClick={() => setTab('following')}
        />
      </div>

      {/* List */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e5e5',
        }}
      >
        {tab === 'friends' ? (
          <EmptyState text="아직 친구가 없습니다." />
        ) : (
          <EmptyState text="구독 중인 사용자가 없습니다." />
        )}
      </div>
    </div>
  );
}

/* ---------- UI ---------- */

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        height: 36,
        borderRadius: 18,
        border: '1px solid #ddd',
        background: active ? '#000' : '#fff',
        color: active ? '#fff' : '#000',
        fontSize: 14,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '48px 16px',
        textAlign: 'center',
        fontSize: 14,
        color: '#777',
      }}
    >
      {text}
    </div>
  );
}
