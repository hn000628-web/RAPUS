'use client';

import type { Category } from '../../../types';
import CategorySelectGeneral from '../personal/CategorySelectGeneral';
import RegionSelector from '../RegionSelector';
import type { Dispatch, SetStateAction } from 'react';

type Props = {
  category: Category | '';
  setCategory: Dispatch<SetStateAction<Category | ''>>;

  tradeRegionId: number | null;
  setTradeRegionId: Dispatch<SetStateAction<number | null>>;

  profileRegionId: number | null;
  profileRegionName: string | null;

  title: string;
  setTitle: Dispatch<SetStateAction<string>>;

  keywords: string;
  setKeywords: Dispatch<SetStateAction<string>>;

  content: string;
  setContent: Dispatch<SetStateAction<string>>;

  price: string;
  setPrice: Dispatch<SetStateAction<string>>;

  loading: boolean;
};

const baseFieldStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid #e0e0e0',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function PersonalPostFields({
  category,
  setCategory,
  tradeRegionId,
  setTradeRegionId,
  profileRegionId,
  profileRegionName,
  title,
  setTitle,
  keywords,
  setKeywords,
  content,
  setContent,
  price,
  setPrice,
  loading,
}: Props) {
  const isUsed = category === 'USED';

  const formatNumber = (value: string) => {
    const num = Number(value.replace(/,/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString();
  };

  return (
    <>
      {/* 제목 */}
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="제목을 입력하세요"
          value={title}
          disabled={loading}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            ...baseFieldStyle,
            height: 52,
            padding: '0 16px',
            fontSize: 18,
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}
        />
      </div>

      {/* 카테고리 */}
      <div style={{ marginBottom: 10 }}>
        <CategorySelectGeneral
          category={category}
          setCategory={setCategory}
          loading={loading}
        />
      </div>

      {/* 지역 선택 */}
      <RegionSelector
        category={category as 'GENERAL' | 'USED'}
        profileRegionId={profileRegionId}
        profileRegionName={profileRegionName}
        tradeRegionId={tradeRegionId}
        setTradeRegionId={setTradeRegionId}
        loading={loading}
      />

      {/* 가격 */}
      {isUsed && (
        <div style={{ marginTop: 10, marginBottom: 10 }}>
          <input
            placeholder="가격 입력"
            value={formatNumber(price)}
            disabled={loading}
            onChange={(e) => setPrice(e.target.value)}
            style={{
              ...baseFieldStyle,
              height: 52,
              padding: '0 16px',
              fontSize: 16,
              fontWeight: 500,
              opacity: loading ? 0.6 : 1,
            }}
          />
        </div>
      )}

      {/* 키워드 */}
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="키워드 입력 (# , . / 공백 모두 가능)"
          value={keywords}
          disabled={loading}
          onChange={(e) => setKeywords(e.target.value)}
          style={{
            ...baseFieldStyle,
            height: 46,
            padding: '0 14px',
            fontSize: 14,
            fontWeight: 500,
            background: '#f8f9fa',
            opacity: loading ? 0.6 : 1,
          }}
        />
      </div>

      {/* 내용 */}
      <div style={{ marginBottom: 10 }}>
        <textarea
          placeholder="내용을 입력하세요"
          value={content}
          disabled={loading}
          onChange={(e) => setContent(e.target.value)}
          style={{
            ...baseFieldStyle,
            minHeight: 180,
            padding: 16,
            resize: 'none',
            fontSize: 15,
            fontWeight: 400,
            lineHeight: 1.6,
            opacity: loading ? 0.6 : 1,
          }}
        />
      </div>
    </>
  );
}
