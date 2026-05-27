'use client';

import { useState } from 'react';
import HeroAdCreateForm, { HeroAdFormData } from './HeroAdCreateForm';

/* ======================
   Types
====================== */
type HeroAd = {
  id: string;
  advertiser: string;
  scope: 'NATIONAL' | 'LOCAL';
  regionCode?: string;   // ✅ 단일 지역 코드
  period: string;
  active: boolean;
};

/* ======================
   Mock List (UI 단계)
====================== */
const INITIAL_HERO_ADS: HeroAd[] = [
  {
    id: 'h1',
    advertiser: '삼성전자',
    scope: 'NATIONAL',
    period: '2026.03.01 ~ 2026.06.30',
    active: true,
  },
];

/* ======================
   Page
====================== */
export default function HeroAdsPage() {
  const [ads, setAds] = useState<HeroAd[]>(INITIAL_HERO_ADS);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div>
      {/* ===== HEADER ===== */}
      <header style={header}>
        <h2 style={title}>히어로 광고</h2>
        <button
          style={button}
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? '목록으로' : '+ 히어로 광고 등록'}
        </button>
      </header>

      {/* ===== CONTENT ===== */}
      {isCreating ? (
        <HeroAdCreateForm
          onCreate={(newAd: HeroAdFormData) => {
            // ✅ 타입 그대로 저장
            setAds((prev) => [...prev, newAd]);
            setIsCreating(false);
          }}
        />
      ) : (
        <HeroAdList ads={ads} />
      )}
    </div>
  );
}

/* ======================
   Hero Ad List
====================== */
function HeroAdList({ ads }: { ads: HeroAd[] }) {
  return (
    <table style={table}>
      <thead>
        <tr>
          <th style={th}>광고주</th>
          <th style={th}>노출 범위</th>
          <th style={th}>노출 지역</th>
          <th style={th}>계약 기간</th>
          <th style={th}>상태</th>
        </tr>
      </thead>
      <tbody>
        {ads.map((ad) => (
          <tr key={ad.id} style={row}>
            <td style={td}>{ad.advertiser}</td>
            <td style={td}>
              {ad.scope === 'NATIONAL' ? '전국' : '지역'}
            </td>
            <td style={td}>
              {ad.scope === 'LOCAL'
                ? ad.regionCode ?? '-'
                : '-'}
            </td>
            <td style={td}>{ad.period}</td>
            <td style={td}>
              {ad.active ? '활성' : '중단'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ======================
   Styles
====================== */
const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
};

const title: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
};

const button: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: 13,
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};

const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
};

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  background: '#f5f6f7',
  fontWeight: 600,
};

const td: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #eee',
};

const row: React.CSSProperties = {
  background: '#fff',
};
