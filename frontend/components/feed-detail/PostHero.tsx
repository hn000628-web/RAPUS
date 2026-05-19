'use client';

import { useRef } from 'react';

type Props = {
  hero: string | null;
  canSlide: boolean;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
};

export default function PostHero({
  hero,
  canSlide,
  index,
  total,
  onPrev,
  onNext,
}: Props) {

  const startX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;

    const endX = e.changedTouches[0].clientX;
    const diff = startX.current - endX;

    if (Math.abs(diff) < 50) return;

    if (diff > 0) {
      onNext();
    } else {
      onPrev();
    }

    startX.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (startX.current === null) return;

    const diff = startX.current - e.clientX;

    if (Math.abs(diff) < 50) return;

    if (diff > 0) {
      onNext();
    } else {
      onPrev();
    }

    startX.current = null;
  };

  if (!hero) return null;

  return (
    <div
      style={wrapStyle}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >

      {/* 이미지 */}
      <img
        src={hero}
        alt=""
        style={imageStyle}
        draggable={false}
      />

      {/* 좌측 이동 */}
      {canSlide && (
        <button
          onClick={onPrev}
          style={leftBtnStyle}
        >
          ‹
        </button>
      )}

      {/* 우측 이동 */}
      {canSlide && (
        <button
          onClick={onNext}
          style={rightBtnStyle}
        >
          ›
        </button>
      )}

      {/* 인덱스 표시 */}
      {total > 1 && (
        <div style={indexStyle}>
          {index + 1} / {total}
        </div>
      )}

    </div>
  );
}

/* ===== 스타일 ===== */

const wrapStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  overflow: 'hidden',
  borderRadius: 12,
};

const imageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  userSelect: 'none',
};

const leftBtnStyle: React.CSSProperties = {
  position: 'absolute',
  left: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(0,0,0,0.35)',
  color: '#fff',
  fontSize: 22,
  cursor: 'pointer',
};

const rightBtnStyle: React.CSSProperties = {
  ...leftBtnStyle,
  left: 'auto',
  right: 10,
};

const indexStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '4px 10px',
  borderRadius: 999,
  background: 'rgba(0,0,0,0.55)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
};