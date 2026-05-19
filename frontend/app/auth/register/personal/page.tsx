'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type RegionItem = {
  code: string;
  label: string;
};

export default function RegisterPersonalPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');

  const [regionQuery, setRegionQuery] = useState('');
  const [regionResults, setRegionResults] = useState<RegionItem[]>([]);
  const [regionCode, setRegionCode] = useState<string | undefined>();
  const [regionLabel, setRegionLabel] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  /* ===========================
     대표지역 검색
  =========================== */
  const handleRegionSearch = async () => {
    const keyword = regionQuery.trim();

    if (keyword.length < 2) {
      alert('2글자 이상 입력하세요.');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/regions/search?q=${encodeURIComponent(keyword)}`
      );

      if (!res.ok) {
        setRegionResults([]);
        return;
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        setRegionResults([]);
        return;
      }

      setRegionResults(data);
    } catch {
      setRegionResults([]);
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     가입 완료
  =========================== */
  const handleSubmit = () => {
    if (!email || !password) return alert('이메일과 비밀번호를 입력하세요.');
    if (!regionCode) return alert('대표지역을 선택하세요.');

    router.push('/feed');
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>
        일반회원 가입
      </h1>

      <input
        type="email"
        placeholder="이메일 주소 (아이디)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />

      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />

      <input
        type="password"
        placeholder="2차 비밀번호 (선택)"
        value={password2}
        onChange={(e) => setPassword2(e.target.value)}
        style={inputStyle}
      />

      <input
        type="tel"
        placeholder="연락처"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={inputStyle}
      />

      <input
        type="text"
        placeholder="닉네임 / 이름"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        style={inputStyle}
      />

      {/* ===== 대표지역 검색 ===== */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="대표지역 검색 (예: 월곡동)"
            value={regionQuery}
            onChange={(e) => setRegionQuery(e.target.value)}
            style={{ flex: 1, padding: 12 }}
          />
          <button type="button" onClick={handleRegionSearch}>
            {loading ? '검색중...' : '검색'}
          </button>
        </div>

        {regionResults.length > 0 && (
          <ul style={resultBox}>
            {regionResults.map((r) => (
              <li key={r.code}>
                <button
                  type="button"
                  onClick={() => {
                    setRegionCode(r.code);
                    setRegionLabel(r.label);
                    setRegionQuery(r.label);
                    setRegionResults([]);
                  }}
                  style={resultItem}
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {regionCode && (
          <div style={{ fontSize: 12, marginTop: 6 }}>
            선택됨: <strong>{regionLabel}</strong>
          </div>
        )}
      </div>

      <button
        style={{
          width: '100%',
          padding: 14,
          cursor: 'pointer',
        }}
        onClick={handleSubmit}
      >
        가입 완료
      </button>
    </div>
  );
}

/* ======================
   Styles
====================== */
const inputStyle = {
  width: '100%',
  padding: 12,
  marginBottom: 12,
};

const resultBox = {
  marginTop: 8,
  border: '1px solid #eee',
  borderRadius: 6,
  maxHeight: 220,
  overflowY: 'auto' as const,
  padding: 4,
  background: '#fff',
};

const resultItem = {
  width: '100%',
  textAlign: 'left' as const,
  padding: 8,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
};
