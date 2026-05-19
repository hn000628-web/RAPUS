'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const categories = [
  { label: '전체', path: '/home' },
  { label: '#플레이스', path: '/home/place' },
  { label: '#행사/공연', path: '/home/event' },
  { label: '#중고거래', path: '/home/used' },
  { label: '#구인&구직', path: '/home/job' },
  { label: '#자동차', path: '/home/car' },
  { label: '#부동산', path: '/home/realestate' },
  { label: '#모임', path:'/home/group' },
];

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 0);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <div style={wrapStyle}>
      <div style={sliderWrapStyle}>
        {showLeft && (
          <button style={arrowLeftStyle} onClick={scrollLeft}>‹</button>
        )}

        <div ref={scrollRef} style={keywordWrapStyle} onScroll={checkScroll}>
          {categories.map((cat) => (
            <HoverableKeyword
              key={cat.label}
              label={cat.label}
              active={pathname === cat.path}
              onClick={() => router.push(cat.path)}
            />
          ))}
        </div>

        {showRight && (
          <button style={arrowRightStyle} onClick={scrollRight}>›</button>
        )}
      </div>

      <div style={contentStyle}>{children}</div>
    </div>
  );
}

/* ---------- Hoverable Keyword Component ---------- */
function HoverableKeyword({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);

  const style = {
    ...keywordStyle,
    background: active || hover ? '#000' : '#f2f2f2',
    color: active || hover ? '#fff' : '#333',
    fontWeight: active || hover ? 500 : 400,
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={style}
    >
      {label}
    </div>
  );
}

/* ===== styles ===== */
const wrapStyle: React.CSSProperties = { width: '100%', background: '#ffffff', minHeight: '100vh' };

const sliderWrapStyle: React.CSSProperties = {
  position: 'relative',
  background: '#fff',
  padding: '12px 0',
  maxWidth: 1200,
  margin: '0 auto',
};

const keywordWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  padding: '0 40px',
  overflowX: 'auto',
  scrollbarWidth: 'none',
};

const keywordStyle: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: 13,
  borderRadius: 999,
  cursor: 'pointer',
  userSelect: 'none',
  flexShrink: 0,
};

const arrowBase: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: 'none',
  background: '#fff',
  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  cursor: 'pointer',
  zIndex: 20,
};

const arrowLeftStyle: React.CSSProperties = { ...arrowBase, left: 4 };
const arrowRightStyle: React.CSSProperties = { ...arrowBase, right: 4 };

const contentStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '0px 0',
};