'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RecoverIdPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+82');
  const [phone, setPhone] = useState('');

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
        <h1 style={{ marginBottom: 20 }}>아이디 찾기</h1>

        {/* 탭 */}
        <div style={{ display: 'flex', marginBottom: 20 }}>
          <button
            onClick={() => setTab('email')}
            style={{
              flex: 1,
              padding: 10,
              background: tab === 'email' ? '#eee' : '#fff',
            }}
          >
            이메일
          </button>
          <button
            onClick={() => setTab('phone')}
            style={{
              flex: 1,
              padding: 10,
              background: tab === 'phone' ? '#eee' : '#fff',
            }}
          >
            연락처
          </button>
        </div>

        {/* 이메일 */}
        {tab === 'email' && (
          <>
            <input
              type="email"
              placeholder="이메일 입력"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: 12, marginBottom: 16 }}
            />
          </>
        )}

        {/* 연락처 + 국가번호 */}
        {tab === 'phone' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                style={{ padding: 12 }}
              >
                <option value="+82">🇰🇷 +82</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+81">🇯🇵 +81</option>
              </select>
              <input
                type="tel"
                placeholder="연락처 입력"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ flex: 1, padding: 12 }}
              />
            </div>
          </>
        )}

        <button
          style={{ width: '100%', padding: 14 }}
          onClick={() => {
            // TODO: 이메일 또는 (countryCode + phone)로 계정 조회
            alert('등록된 계정이 있습니다.');
            router.push('/');
          }}
        >
          확인
        </button>
      </div>
    </main>
  );
}
