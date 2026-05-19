'use client';

type Props = {
  value?: number | null;
  showSuffix?: boolean;
};

function formatCount(count: number): string {
  if (count < 1000) return String(count);

  if (count < 1_000_000) {
    const k = count / 1000;
    return k >= 100 ? `${Math.floor(k)}K` : `${k.toFixed(1)}K`;
  }

  const m = count / 1_000_000;
  return m >= 100 ? `${Math.floor(m)}M` : `${m.toFixed(1)}M`;
}

export default function ViewCount({
  value,
  showSuffix = true,
}: Props) {

  // 🔥 핵심: null / undefined 안전 처리
  const safeValue = typeof value === 'number' ? value : 0;

  const formatted = formatCount(safeValue);

  return (
    <span>
      {formatted}
      {showSuffix ? '회' : ''}
    </span>
  );
}