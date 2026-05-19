'use client';

import { useRouter } from 'next/navigation';

export default function AdsAccountPage() {
  const router = useRouter();

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '72px 16px 120px', // ⬅ CTA + safe-area 고려
      }}
    >
      {/* 페이지 타이틀 */}
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
        광고 계정
      </h1>

      <p style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>
        광고는 <strong>노출(CPM)</strong> 기준으로만 집계됩니다.
        <br />
        광고 등록은 게시물 단위로 이루어집니다.
      </p>

      {/* 계정 정보 */}
      <Section title="계정 정보">
        <InfoRow label="계정 유형" value="일반 계정" />
        <InfoRow label="계정 상태" value="정상" />
      </Section>

      {/* 지출 증빙 */}
      <Section title="지출 증빙 정보">
        <InfoRow label="증빙 유형" value="휴대폰 번호" />
        <InfoRow label="지출 증빙 번호" value="010-****-5678" />
        <HintText>
          일반 계정은 휴대폰 번호가 지출 증빙 번호로 사용됩니다.
        </HintText>
      </Section>

      {/* CPM 포인트 */}
      <Section title="CPM 포인트 (선결제)">
        <InfoRow label="잔여 포인트" value="32,500 P" />
        <InfoRow label="누적 사용 포인트" value="147,500 P" />

        <div style={{ marginTop: 12 }}>
          <button
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 10,
              border: '1px solid #ddd',
              background: '#000',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            포인트 충전
          </button>
        </div>
      </Section>

      {/* 광고 원칙 */}
      <Section title="광고 운영 원칙">
        <Bullet>광고는 게시물 단위로만 적용됩니다.</Bullet>
        <Bullet>게시물 노출 시 1회 노출로 집계됩니다.</Bullet>
        <Bullet>클릭, 좋아요, 댓글은 통계용 지표입니다.</Bullet>
        <Bullet>CPM 포인트 소진 시 광고 노출이 중단됩니다.</Bullet>
      </Section>

      {/* 하단 CTA */}
      <BottomCTA
        onClick={() => router.push('/settings/ads/select-post')}
      />
    </div>
  );
}

/* ---------- 공통 UI ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid #e5e5e5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        marginBottom: 8,
        color: '#333',
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function HintText({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: '#777', marginTop: 8 }}>
      {children}
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 13,
        color: '#444',
        marginBottom: 6,
        lineHeight: 1.5,
      }}
    >
      • {children}
    </div>
  );
}

function BottomCTA({ onClick }: { onClick: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
        background: '#f0f2f5',
        borderTop: '1px solid #ddd',
        zIndex: 1000, // ⬅ 중요
      }}
    >
      <button
        onClick={onClick}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 12,
          background: '#000',
          color: '#fff',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        광고 등록
      </button>
    </div>
  );
}
