'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type PostImage = {
  imageUrl: string;
  sortOrder: number;
};

type Post = {
  id: number;
  type: 'GENERAL' | 'AD';
  title: string;
  content: string;
  price: number | null;
  status: string;
  createdAt: string;
  expiresAt?: string | null;
  category?: string;
  regionName?: string;
  imageUrl?: string;
  images?: PostImage[];
};

type PersonalPostsProps = {
  profileId?: number;
};

/* =========================
   URL HELPER
========================= */

const toAbsoluteUrl = (
  baseUrl: string,
  url: string,
): string => {

  if (!url) return '';

  if (url.startsWith('http'))
    return url;

  const base =
    baseUrl.endsWith('/')
      ? baseUrl.slice(0, -1)
      : baseUrl;

  const path =
    url.startsWith('/')
      ? url
      : `/${url}`;

  return `${base}${path}`;

};

/* =========================
   UI CONSTANTS
========================= */

const THUMB_H = 180;

const THUMB_W =
  Math.round((THUMB_H * 1) / 1);

const GAP_X = 12;
const GAP_Y = 28;
const RADIUS = 16;

/* 🔵 노이미지 경로 */
const NO_IMAGE = '/images/no-image.png';

/* =========================
   COMPONENT
========================= */

export default function PersonalPosts({
  profileId: _profileId,
}: PersonalPostsProps) {

  const router = useRouter();

  const [posts, setPosts] =
    useState<Post[]>([]);

  const [loading, setLoading] =
    useState(true);

  const wrapRef =
    useRef<HTMLDivElement | null>(null);

  const [cols] =
    useState<number>(3);

  /* =========================
     API URL
  ========================= */

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000';

  /* =========================
     FETCH POSTS
  ========================= */

  useEffect(() => {

    const fetchPosts = async () => {

      const token =
        localStorage.getItem(
          'accessToken',
        );

      if (!token) {

        setLoading(false);
        return;

      }

      try {

        const res =
          await fetch(
            `${API_URL}/feed/me`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (!res.ok) {
          setPosts([]);
          return;
        }

        const data:
          { posts?: Post[] } =
          await res.json();

        setPosts(data.posts || []);

      } catch {

        setPosts([]);

      } finally {

        setLoading(false);

      }

    };

    fetchPosts();

  }, [API_URL]);

  /* =========================
     D-DAY
  ========================= */

  const calculateDday = (
    expiresAt?: string | null,
  ) => {

    if (!expiresAt) return null;

    const now = new Date();
    const end = new Date(expiresAt);

    const diff =
      Math.ceil(
        (end.getTime() -
          now.getTime()) /
          (1000 * 60 * 60 * 24),
      );

    if (diff < 0) return '마감';
    if (diff === 0) return 'D-day';

    return `D-${diff}`;

  };

  /* =========================
     CLICK
  ========================= */

  const handleClick =
    (postId: number) => {

      router.push(
        `/profile/post/${postId}`,
      );

    };

  /* =========================
     GRID
  ========================= */

  const gridStyle =
    useMemo<React.CSSProperties>(
      () => {

        return {

          width: '100%',

          display: 'grid',

          gridTemplateColumns:
            `repeat(${cols}, ${THUMB_W}px)`,

          columnGap: GAP_X,

          rowGap: GAP_Y,

          justifyContent:
            cols === 2
              ? 'space-between'
              : 'start',

        };

      },
      [cols],
    );

  /* =========================
     LOADING
  ========================= */

  if (loading) {

    return (
      <div className="px-4 py-6 text-sm text-black/60">
        불러오는 중...
      </div>
    );

  }

  /* =========================
     RENDER
  ========================= */

  return (

    <div className="px-4 pb-10">

      <div
        ref={wrapRef}
        style={gridStyle}
      >

        {posts.map((post) => {

          const thumbnail =
            post.imageUrl ??
            post.images?.[0]?.imageUrl ??
            null;

          const thumbUrl =
            thumbnail
              ? toAbsoluteUrl(
                  API_URL,
                  thumbnail,
                )
              : NO_IMAGE;

          const dateLabel =
            new Date(
              post.createdAt,
            ).toLocaleDateString();

          const rawPrice: unknown =
            (post as any)?.price;

          const priceNum =
            typeof rawPrice === 'number'
              ? rawPrice
              : typeof rawPrice ===
                  'string' &&
                rawPrice.trim() !== ''
              ? Number(rawPrice)
              : null;

          const hasPrice =
            typeof priceNum ===
              'number' &&
            Number.isFinite(
              priceNum,
            );

          const ddayLabel =
            post.type === 'AD' &&
            post.expiresAt
              ? calculateDday(
                  post.expiresAt,
                )
              : null;

          const categoryLabel =
            post.category === 'USED'
              ? '중고거래'
              : post.category ===
                'GENERAL'
              ? '일반'
              : post.category ??
                '';

          return (

            <button
              key={post.id}
              type="button"
              onClick={() =>
                handleClick(
                  post.id,
                )
              }
              className="group cursor-pointer bg-transparent p-0 text-left border-0 outline-none ring-0 transition hover:opacity-95"
              style={{
                width: THUMB_W,
              }}
            >

              <div
                className="relative overflow-hidden bg-black/5"
                style={{
                  width: THUMB_W,
                  height: THUMB_H,
                  borderRadius: RADIUS,
                }}
              >

                <img
                  src={thumbUrl}
                  alt=""
                  draggable={false}
                  className="block object-cover"
                  style={{
                    width: THUMB_W,
                    height: THUMB_H,
                    borderRadius: RADIUS,
                  }}
                />

                {/* NO IMAGE TEXT */}
                {!thumbnail && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 0,
                      right: 0,
                      textAlign: 'center',
                      fontSize: 11,
                      color: '#777',
                      fontWeight: 600,
                      letterSpacing: 1,
                      pointerEvents: 'none',
                    }}
                  >
                    NO IMAGE
                  </div>
                )}

                {ddayLabel && (

                  <div
                    style={{
                      position:
                        'absolute',
                      top: 10,
                      left: 10,
                      zIndex: 10,
                      backgroundColor:
                        'rgba(0,0,0,0.75)',
                      color: '#fff',
                      padding:
                        '4px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {ddayLabel}
                  </div>

                )}

                {hasPrice && (

                  <div
                    style={{
                      position:
                        'absolute',
                      top: 10,
                      right: 10,
                      backgroundColor:
                        'rgba(0,0,0,0.75)',
                      color: '#fff',
                      padding:
                        '4px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {priceNum!.toLocaleString()}
                    원
                  </div>

                )}

                <div
                  style={{
                    position:
                      'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 60,
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))',
                  }}
                />

                <div
                  style={{
                    position:
                      'absolute',
                    left: 12,
                    right: 12,
                    bottom: 10,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    whiteSpace:
                      'nowrap',
                    overflow:
                      'hidden',
                    textOverflow:
                      'ellipsis',
                  }}
                >
                  {post.title ||
                    '(제목 없음)'}
                </div>

              </div>

              <div
                className="mt-2 text-[12px] text-black/55 leading-tight"
                style={{
                  width: THUMB_W,
                }}
              >

                {dateLabel}

                {post.type ===
                  'AD' && (
                  <span className="ml-2">
                    · AD
                  </span>
                )}

                {categoryLabel && (
                  <span className="ml-2">
                    · {categoryLabel}
                  </span>
                )}

                {post.regionName && (
                  <span className="ml-2">
                    · {post.regionName}
                  </span>
                )}

              </div>

            </button>

          );

        })}

      </div>

    </div>

  );

}