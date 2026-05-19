'use client';

import { useState } from 'react';

const TABS = [
  { key: 'all', label: '전체' },
  { key: 'message', label: '친구' },
  { key: 'notification', label: '구독&광고' },
  { key: 'unread', label: '안읽음' },
];

export default function InboxPage() {
  const [tab, setTab] = useState('all');

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '24px 16px',
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        메시지
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 18,
              border: '1px solid #ddd',
              background: tab === t.key ? '#000' : '#fff',
              color: tab === t.key ? '#fff' : '#000',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content (임시) */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
          color: '#777',
        }}
      >
        {tab === 'all' && '전체 알림/메시지'}
        {tab === 'message' && '친구 목록'}
        {tab === 'notification' && '구독&광고 목록'}
        {tab === 'unread' && '안읽은 항목'}
      </div>
    </div>
  );
}
