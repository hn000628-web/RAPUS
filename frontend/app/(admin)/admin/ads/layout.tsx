// frontend/app/admin/ads/layout.tsx
import AdsTabs from '../ads/components/AdsTabs';

export default function AdsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section style={{ padding: '24px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>Ads</h1>
      <p style={{ marginTop: 8, color: '#666', fontSize: 14 }}>
        광고 등록 및 노출 현황을 관리합니다.
      </p>

      <div style={{ marginTop: 24 }}>
        <AdsTabs />
      </div>

      <div style={{ marginTop: 24 }}>
        {children}
      </div>
    </section>
  );
}
