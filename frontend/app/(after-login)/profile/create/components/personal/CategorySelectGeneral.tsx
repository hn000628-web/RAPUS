'use client';

import type { Category } from '../../../types';

type Props = {
  category: Category | '';
  setCategory: (v: Category) => void;
  loading: boolean;
};

export default function CategorySelect({
  category,
  setCategory,
  loading,
}: Props) {

  const options: { value: Category; label: string }[] = [
  { value: 'GENERAL', label: '라이프' },
  ];

  return (
    <select
      value={category || ''}
      disabled={loading}
      onChange={(e) => {
        if (e.target.value) {
          setCategory(e.target.value as Category);
        }
      }}
      style={{
        width: '100%',
        height: 48,
        borderRadius: 12,
        border: '1px solid #e0e0e0',
        padding: '0 12px',
        fontSize: 14,
        opacity: loading ? 0.6 : 1,
      }}
    >
      <option value="" disabled>
        카테고리 선택
      </option>

      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
