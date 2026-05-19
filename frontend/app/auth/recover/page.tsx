'use client';

import { useRouter } from 'next/navigation';

export default function RecoverSelectPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}
    >
      <div
        style={{
          width: 360,
          padding: 24,
          background: '#fff',
          borderRadius: 8,
          textAlign: 'center',
        }}
      >
        <h1 style={{ marginBottom: 24 }}>계정 찾기</h1>

        {/* 아이디 찾기 */}
        <div
          onClick={() => router.push('/auth/recover/id')}
          style={{
            padding: 20,
            marginBottom: 16,
            border: '1px solid #ccc',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          <strong>아이디 찾기</strong>
        </div>

        {/* 비밀번호 재설정 */}
        <div
          onClick={() => router.push('/auth/recover/password')}
          style={{
            padding: 20,
            border: '1px solid #ccc',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          <strong>비밀번호 재설정</strong>
        </div>
      </div>
    </main>
  );
}
