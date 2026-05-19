'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterEntryPage() {
  const router = useRouter();
  const [includeBusiness, setIncludeBusiness] = useState(false);

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '100px auto',
        textAlign: 'center',
      }}
    >
      {/* 상단 */}
      <h1 style={{ marginBottom: 16 }}>환영합니다.</h1>

      <p style={{ marginBottom: 8 }}>
        당신의 스토리(개인/비지니스)를 공유하세요.
      </p>

      {/* 🔹 구조 설명 (CTA 상단 배치) */}
      <p
        style={{
          marginBottom: 32,
          fontSize: 14,
          opacity: 0.7,
        }}
      >
        ※ 하나의 계정으로 개인과 비지니스 활동을 모두 이용할 수 있습니다.
      </p>

      {/* 🔹 선택 옵션 */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          cursor: 'pointer',
          fontSize: 14,
          marginBottom: 24,
        }}
      >
        <span style={{ opacity: 0.6 }}>
          [선택사항]
        </span>

        <input
          type="checkbox"
          checked={includeBusiness}
          onChange={() =>
            setIncludeBusiness(!includeBusiness)
          }
        />

        비지니스(스토어/브랜드) 함께 운영
      </label>

      {/* 회원가입 버튼 */}
      <button
        onClick={() =>
          router.push(
            `/auth/register/form?business=${includeBusiness}`
          )
        }
        style={{
          width: '100%',
          padding: '16px',
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        회원가입
      </button>
    </div>
  );
}
