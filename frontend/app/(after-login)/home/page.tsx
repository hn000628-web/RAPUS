'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ViewCount from '@/components/ViewCount';

type PostImage = {
  imageUrl: string;
  sortOrder: number;
};

type Post = {
  id: number;
  title: string;
  createdAt: string;
  displayName: string;
  profileImageUrl?: string | null;
  type: 'GENERAL' | 'AD';
  category: string;
  regionName?: string | null;
  viewCount?: number;
  images?: PostImage[];
};

const GAP_X = 16;
const GAP_Y = 24;
const RADIUS = 16;

export default function HomePage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/feed?countryCode=KR`
        );

        const data = await res.json();

        if (res.ok && data.ok) {
          setPosts(data.posts || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [API_BASE_URL]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => post.type === 'GENERAL');
  }, [posts]);

  if (loading) {
    return <div style={{ padding: 20 }}>불러오는 중...</div>;
  }

  const categoryMap: Record<string, string> = {
    GENERAL: '일반',
    PLACE: '플레이스',
    USED: '중고거래',
    JOB: '구인·구직',
    AUTO: '자동차',
    REAL_ESTATE: '부동산',
    EVENT: '행사',
    MEETUP: '모임',
  };

  return (
    <div
      style={{
        background: '#ffffff',
        minHeight: '100vh',
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 40,
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          columnGap: GAP_X,
          rowGap: GAP_Y,
        }}
      >
        {filteredPosts.map((post) => {
          const thumbnail = post.images?.[0]?.imageUrl ?? null;

          const thumbUrl = thumbnail
            ? thumbnail.startsWith('http')
              ? thumbnail
              : `${API_BASE_URL}${thumbnail}`
            : null;

          const dateLabel = new Date(
            post.createdAt
          ).toLocaleDateString();

          const categoryLabel =
            categoryMap[post.category] ?? post.category;

          const regionLabel =
            post.regionName ?? '';

          return (
            <button
              key={post.id}
              onClick={() =>
                router.push(`/profile/post/${post.id}`)
              }
              style={{
                width: '100%',
                border: 0,
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: RADIUS,
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#e5e5e5',
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
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: '10px 14px',
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.55), rgba(0,0,0,0))',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {post.title}
                </div>
              </div>

              <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: '#e0e0e0',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {post.profileImageUrl && (
                    <img
                      src={
                        post.profileImageUrl.startsWith('http')
                          ? post.profileImageUrl
                          : `${API_BASE_URL}${post.profileImageUrl}`
                      }
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#333',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {post.displayName} · {categoryLabel}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: '#777',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {dateLabel} ·{' '}
                    <ViewCount value={post.viewCount} />
                    {regionLabel && ` · ${regionLabel}`}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}