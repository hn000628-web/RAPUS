'use client';

export default function SearchPage() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '24px 16px',
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        검색
      </h1>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <input
          placeholder="이름, 아이디, 지역으로 검색"
          style={{
            width: '100%',
            height: 40,
            borderRadius: 8,
            border: '1px solid #ddd',
            padding: '0 12px',
            fontSize: 14,
          }}
        />

        <div
          style={{
            marginTop: 24,
            fontSize: 14,
            color: '#777',
            textAlign: 'center',
          }}
        >
          검색 결과가 여기에 표시됩니다.
        </div>
      </div>
    </div>
  );
}
