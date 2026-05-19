'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  imageUrls: string[]; // 🔥 배열로 변경
  editable?: boolean;
};

export default function CoverSection({
  imageUrls,
  editable = false,
}: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = imageUrls?.length || 0;

  const handleClick = () => {
    if (!editable) return;
    router.push('/profile/business/settings/hero');
  };

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (total <= 1) return;

    setCurrentIndex((prev) =>
      prev === 0 ? total - 1 : prev - 1,
    );
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (total <= 1) return;

    setCurrentIndex((prev) =>
      prev === total - 1 ? 0 : prev + 1,
    );
  };

  const currentImage =
    total > 0 ? imageUrls[currentIndex] : null;

  return (
    <div
      onClick={handleClick}
      style={{
        height: 180,
        width: '100%',
        borderRadius: 12,
        background: '#eee',
        overflow: 'hidden',
        cursor: editable ? 'pointer' : 'default',
        position: 'relative',
      }}
    >
      {currentImage && (
        <img
          src={currentImage}
          alt="cover"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {/* 🔥 슬라이드 컨트롤 */}
      {total > 1 && (
        <>
          <button
            onClick={goPrev}
            style={navBtnStyle}
          >
            ‹
          </button>

          <button
            onClick={goNext}
            style={{
              ...navBtnStyle,
              right: 10,
              left: 'auto',
            }}
          >
            ›
          </button>

          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.45)',
              padding: '2px 10px',
              borderRadius: 20,
              fontSize: 12,
              color: '#fff',
            }}
          >
            {currentIndex + 1} / {total}
          </div>
        </>
      )}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  position: 'absolute',
  left: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'rgba(0,0,0,0.45)',
  border: 'none',
  color: '#fff',
  width: 30,
  height: 30,
  borderRadius: '50%',
  cursor: 'pointer',
};