'use client';

import type { PostImage } from './post-detail.types';

type Props = {
  images: PostImage[];
  currentIndex: number;
  onSelect: (index: number) => void;
};

export default function PostThumbStrip({
  images,
  currentIndex,
  onSelect,
}: Props) {
  if (images.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto border-b border-[#eee] p-3">
      {images.map((img, idx) => {
        const active = idx === currentIndex;

        return (
          <button
            key={img.id}
            type="button"
            onClick={() => onSelect(idx)}
            className={[
              'flex-none overflow-hidden rounded-[10px] border',
              active ? 'border-[#111]' : 'border-transparent',
            ].join(' ')}
            aria-label={`thumb-${idx + 1}`}
          >
            <img
              src={img.imageUrl}
              alt="thumb"
              className="h-[72px] w-[120px] object-cover"
            />
          </button>
        );
      })}
    </div>
  );
}