'use client';

/* ======================
   HERO 1 TYPE (로컬 선언)
====================== */
type Hero1Ad = {
  id: string;
  title: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  linkUrl?: string;
  active: boolean;
};

type Props = {
  hero: Hero1Ad | null;
};

export default function HeroSlot1({ hero }: Props) {
  if (!hero || !hero.active) return null;

  return (
    <section style={wrapper}>
      <a href={hero.linkUrl ?? '#'} style={{ display: 'block' }}>
        {hero.mediaType === 'IMAGE' ? (
          <img
            src={hero.mediaUrl}
            alt={hero.title}
            style={media}
          />
        ) : (
          <video
            src={hero.mediaUrl}
            style={media}
            controls
            preload="metadata"
          />
        )}
      </a>
    </section>
  );
}

/* ======================
   Styles
====================== */
const wrapper: React.CSSProperties = {
  width: '100%',
  maxWidth: 540,
  margin: '0 auto 12px',
};

const media: React.CSSProperties = {
  width: '100%',
  aspectRatio: '16 / 9',
  objectFit: 'cover',
  borderRadius: 12,
};
