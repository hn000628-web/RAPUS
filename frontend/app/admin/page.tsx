export default function AdminHomePage() {
  return (
    <div
      style={{
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>
        Admin
      </h1>

      <p style={{ color: '#666', fontSize: 14 }}>
        관리자 페이지입니다.
        <br />
        상단 햄버거 메뉴를 통해 Users / Ads 관리로 이동하세요.
      </p>
    </div>
  );
}
