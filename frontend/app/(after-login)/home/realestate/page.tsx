'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type PostImage = {
  imageUrl: string;
  sortOrder: number;
};

type Post = {
  id: number;
  title: string;
  createdAt: string;
  price: number | null;
  isNegotiable: number;
  type: 'GENERAL' | 'AD';
  category: string;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED';
  images?: PostImage[];
};

export default function HomePage() {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    const fetchFeed = async () => {
      const res = await fetch(`${API_BASE_URL}/feed/used`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setPosts(data.posts || []);
      }
      setLoading(false);
    };
    fetchFeed();
  }, [API_BASE_URL]);

  const gridStyle = useMemo<React.CSSProperties>(() => {
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', // 🔥 최소 150px
      gap: 14,
      justifyContent: 'center', // 🔥 중앙 정렬
    };
  }, []);

  if (loading) {
    return <div style={{ padding: 20 }}>불러오는 중...</div>;
  }

  return (
    <div
      style={{
        background: '#ffffff',
        minHeight: '100vh',
        padding: '4px 12px 10px',
      }}
      ref={wrapRef}
    >
      <div style={gridStyle}>
        {posts.map((post) => {
          const thumbnail = post.images?.[0]?.imageUrl ?? null;

          const thumbUrl = thumbnail
            ? thumbnail.startsWith('http')
              ? thumbnail
              : `${API_BASE_URL}${thumbnail}`
            : null;

          const timeLabel = getTimeAgo(post.createdAt);
          const priceLabel = formatPrice(
            post.price,
            post.isNegotiable
          );

          return (
            <div
              key={post.id}
              onClick={() =>
                router.push(`/profile/post/${post.id}`)
              }
              style={{
                cursor: 'pointer',
                maxWidth: 300, // 🔥 최대 300px 제한
                width: '100%',
              }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: '#f3f3f3',
                  position: 'relative',
                }}
              >
                {thumbUrl && (
                  <img
                    src={thumbUrl}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}

                <div
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    background: 'rgba(0,0,0,0.75)',
                    color: '#fff',
                    padding: '5px 10px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {priceLabel}
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 500,
                    color: '#222',
                  }}
                >
                  {post.title}
                </div>

                <div
                  style={{
                    marginTop: 0,
                    fontSize: 12,
                    color: '#777',
                  }}
                >
                  {timeLabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* util */

function formatPrice(
  price: number | null,
  isNegotiable: number
) {
  if (price === null && isNegotiable === 1)
    return '가격협의';

  if (price === null) return '나눔';

  return `${price.toLocaleString()}원`;
}

function getTimeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = (now.getTime() - date.getTime()) / 1000;

  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400)
    return `${Math.floor(diff / 3600)}시간 전`;

  return `${Math.floor(diff / 86400)}일 전`;
}