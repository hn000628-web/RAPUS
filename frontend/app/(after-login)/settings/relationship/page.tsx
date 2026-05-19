'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RelationshipSettingsPage() {
  const router = useRouter();

  /* ===============================
     Friend Settings (Snapshot v1.0)
     =============================== */
  const [allowRandomFriendRecommendation, setAllowRandomFriendRecommendation] =
    useState(false); // 기본값 OFF (절대값)

  const [allowFriendRequest, setAllowFriendRequest] =
    useState(true);

  const [allowFriendRequestNotification, setAllowFriendRequestNotification] =
    useState(true);

  /* ===============================
     Follow Settings (Snapshot v1.0)
     =============================== */
  const [allowFollow, setAllowFollow] =
    useState(true);

  const [allowFollowDM, setAllowFollowDM] =
    useState(true);

  const [allowFollowActivityNotification, setAllowFollowActivityNotification] =
    useState(false);

  return (
    <main
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '24px 16px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{
            marginBottom: 12,
            background: 'none',
            border: 'none',
            color: '#1877f2',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          ← 뒤로
        </button>

        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          친구 / 구독 설정
        </h1>
      </div>

      {/* Friend Settings */}
      <Section title="친구 설정">
        <ToggleItem
          label="랜덤 친구 추천 허용"
          description="추천 시스템을 통해 새로운 친구를 소개받습니다. 친구 관계에서는 1:1 보이스톡이 허용됩니다."
          checked={allowRandomFriendRecommendation}
          onChange={setAllowRandomFriendRecommendation}
        />

        <ToggleItem
          label="친구 요청 수신 허용"
          description="다른 사용자가 나에게 친구 요청을 보낼 수 있습니다."
          checked={allowFriendRequest}
          onChange={setAllowFriendRequest}
        />

        <ToggleItem
          label="친구 요청 알림 받기"
          description="친구 요청이 도착했을 때 알림을 받습니다."
          checked={allowFriendRequestNotification}
          onChange={setAllowFriendRequestNotification}
        />
      </Section>

      <Divider />

      {/* Follow Settings */}
      <Section title="구독 설정">
        <ToggleItem
          label="누구나 나를 구독 가능"
          description="다른 사용자가 나를 구독할 수 있습니다."
          checked={allowFollow}
          onChange={setAllowFollow}
        />

        <ToggleItem
          label="구독자의 DM 허용"
          description="구독자가 나에게 메시지를 보낼 수 있습니다."
          checked={allowFollowDM}
          onChange={setAllowFollowDM}
        />

        <ToggleItem
          label="구독자 활동 알림 받기"
          description="구독자의 활동에 대한 알림을 받습니다."
          checked={allowFollowActivityNotification}
          onChange={setAllowFollowActivityNotification}
        />
      </Section>
    </main>
  );
}

/* ===============================
   UI Components (Local Only)
   =============================== */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2
        style={{
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function ToggleItem({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        padding: '12px 0',
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ paddingRight: 12 }}>
        <div style={{ fontSize: 14 }}>{label}</div>
        {description && (
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            {description}
          </div>
        )}
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: '#e4e6eb',
        margin: '24px 0',
      }}
    />
  );
}
