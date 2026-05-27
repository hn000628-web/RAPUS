'use client';

import { useState } from 'react';

/* ======================
   Types
====================== */
export type HeroAdFormData = {
  id: string;
  advertiser: string;

  mediaType: 'IMAGE' | 'VIDEO';
  mediaFile: File | null;
  previewUrl: string | null;

  linkUrl?: string;

  scope: 'NATIONAL' | 'LOCAL';
  regionCode?: string;

  period: string;
  active: boolean;
};

type Props = {
  onCreate: (ad: HeroAdFormData) => void;
};

/* ======================
   Component
====================== */
export default function HeroAdCreateForm({ onCreate }: Props) {
  const [advertiser, setAdvertiser] = useState('');

  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [linkUrl, setLinkUrl] = useState('');

  const [scope, setScope] = useState<'NATIONAL' | 'LOCAL'>('NATIONAL');

  /* ===== 지역 ===== */
  const [regionQuery, setRegionQuery] = useState('');
  const [regionResults, setRegionResults] = useState<
    { code: string; label: string }[]
  >([]);
  const [regionCode, setRegionCode] = useState<string | undefined>();
  const [regionLabel, setRegionLabel] = useState<string | undefined>();
  const [regionLoading, setRegionLoading] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [active, setActive] = useState(true);

  /* ======================
     Region Search
  ====================== */
  const handleRegionSearch = async () => {
    const keyword = regionQuery.trim();

    if (keyword.length < 2) {
      alert('2글자 이상 입력하세요.');
      return;
    }

    try {
      setRegionLoading(true);

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
      setRegionLoading(false);
    }
  };

  /* ======================
     File Upload
  ====================== */
  const handleFileChange = (file: File | null) => {
    if (!file) return;

    setMediaFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  /* ======================
     Submit
  ====================== */
  const handleSubmit = () => {
    if (!advertiser) return alert('광고주명을 입력하세요.');
    if (!mediaFile) return alert('이미지 또는 영상을 업로드하세요.');
    if (scope === 'LOCAL' && !regionCode)
      return alert('노출 지역을 선택하세요.');
    if (!startDate || !endDate)
      return alert('계약 기간을 입력하세요.');

    onCreate({
      id: crypto.randomUUID(),
      advertiser,
      mediaType,
      mediaFile,
      previewUrl,
      linkUrl: linkUrl || undefined,
      scope,
      regionCode: scope === 'LOCAL' ? regionCode : undefined,
      period: `${startDate} ~ ${endDate}`,
      active,
    });
  };

  return (
    <div style={card}>
      <h3 style={title}>히어로 광고 등록</h3>

      <Field label="광고주명 *">
        <input
          value={advertiser}
          onChange={(e) => setAdvertiser(e.target.value)}
        />
      </Field>

      <Field label="미디어 타입 *">
        <label>
          <input
            type="radio"
            checked={mediaType === 'IMAGE'}
            onChange={() => setMediaType('IMAGE')}
          />
          이미지
        </label>
        <label style={{ marginLeft: 12 }}>
          <input
            type="radio"
            checked={mediaType === 'VIDEO'}
            onChange={() => setMediaType('VIDEO')}
          />
          영상
        </label>
      </Field>

      <Field label="미디어 업로드 *">
        <input
          type="file"
          accept={mediaType === 'IMAGE' ? 'image/*' : 'video/mp4'}
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />

        {previewUrl && (
          <div style={previewBox}>
            {mediaType === 'IMAGE' ? (
              <img src={previewUrl} style={mediaStyle} />
            ) : (
              <video src={previewUrl} style={mediaStyle} autoPlay muted loop />
            )}
          </div>
        )}
      </Field>

      <Field label="연결 링크 (선택)">
        <input
          placeholder="https://"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
        />
      </Field>

      <Field label="노출 범위 *">
        <label>
          <input
            type="radio"
            checked={scope === 'NATIONAL'}
            onChange={() => {
              setScope('NATIONAL');
              setRegionCode(undefined);
              setRegionLabel(undefined);
            }}
          />
          전국
        </label>
        <label style={{ marginLeft: 12 }}>
          <input
            type="radio"
            checked={scope === 'LOCAL'}
            onChange={() => setScope('LOCAL')}
          />
          지역
        </label>
      </Field>

      {scope === 'LOCAL' && (
        <Field label="노출 지역 *">
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={regionQuery}
              onChange={(e) => setRegionQuery(e.target.value)}
              placeholder="동 이름 입력 (예: 월곡동)"
              style={{ flex: 1 }}
            />
            <button type="button" onClick={handleRegionSearch}>
              {regionLoading ? '검색중...' : '검색'}
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
              <br />
              code: {regionCode}
            </div>
          )}
        </Field>
      )}

      <Field label="계약 기간 *">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <span style={{ margin: '0 6px' }}>~</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </Field>

      <Field label="상태">
        <input
          type="checkbox"
          checked={active}
          onChange={() => setActive(!active)}
        />{' '}
        활성
      </Field>

      <button style={button} onClick={handleSubmit}>
        저장
      </button>
    </div>
  );
}

/* ======================
   Styles
====================== */
const card = { padding: 24, border: '1px solid #eee', borderRadius: 12 };
const title = { fontSize: 16, fontWeight: 600, marginBottom: 16 };
const button = {
  marginTop: 16,
  padding: '8px 14px',
  background: '#111',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
};

const previewBox = {
  marginTop: 12,
  width: 540,
  aspectRatio: '16 / 9',
  background: '#000',
  overflow: 'hidden',
};

const mediaStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
};

const resultBox = {
  marginTop: 8,
  border: '1px solid #eee',
  borderRadius: 6,
  maxHeight: 220,
  overflowY: 'auto' as const,
  padding: 4,
};

const Field = ({ label, children }: any) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ marginBottom: 6 }}>{label}</div>
    {children}
  </div>
);
