// frontend/app/admin/ads/normal/page.tsx
export default function NormalAdsPage() {
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600 }}>일반 광고</h2>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          border: '1px dashed #ccc',
          borderRadius: 8,
          fontSize: 14,
          color: '#555',
        }}
      >
        <ul style={{ lineHeight: 1.8 }}>
          <li>광고 유형: 프로필 / 게시물</li>
          <li>광고주: 일반 / 사업자 계정</li>
          <li>노출 수</li>
          <li>클릭 수</li>
          <li>활성 / 중단 상태</li>
        </ul>
      </div>
    </div>
  );
}
