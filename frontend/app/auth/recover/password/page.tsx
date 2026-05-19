'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RecoverPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secondPassword, setSecondPassword] = useState('');

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
        <h1 style={{ marginBottom: 20 }}>비밀번호 재설정</h1>

        {/* 이메일 (아이디) */}
        <input
          type="email"
          placeholder="이메일 입력"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: 12, marginBottom: 12 }}
        />

        {/* 새 비밀번호 */}
        <input
          type="password"
          placeholder="새 비밀번호"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{ width: '100%', padding: 12, marginBottom: 12 }}
        />

        {/* 새 비밀번호 확인 */}
        <input
          type="password"
          placeholder="새 비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ width: '100%', padding: 12, marginBottom: 12 }}
        />

        {/* 2차 비밀번호 (최종 승인) */}
        <input
          type="password"
          placeholder="2차 비밀번호"
          value={secondPassword}
          onChange={(e) => setSecondPassword(e.target.value)}
          style={{ width: '100%', padding: 12, marginBottom: 16 }}
        />

        <button
          style={{ width: '100%', padding: 14 }}
          onClick={() => {
            if (newPassword !== confirmPassword) {
              alert('새 비밀번호가 일치하지 않습니다.');
              return;
            }

            // TODO:
            // 1) 이메일 인증 완료 여부 확인
            // 2) 2차 비밀번호 검증
            // 3) 비밀번호 변경 처리

            alert('비밀번호가 변경되었습니다.');
            router.push('/');
          }}
        >
          변경 완료
        </button>
      </div>
    </main>
  );
}
