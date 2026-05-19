'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type PhotoItem = {
  id: number;
  imageUrl: string;
  createdAt: string;
};

type HeroItem = {
  photoId: number;
  sortOrder: number;
};

export default function PersonalPhotos() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [heroMap, setHeroMap] = useState<
    Record<number, number>
  >({});
  const [profilePhotoId, setProfilePhotoId] =
    useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:4000';

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const token =
          localStorage.getItem('accessToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const profileRes = await fetch(
          `${API_BASE}/profiles/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          },
        );

        if (profileRes.ok) {
          const profileData =
            await profileRes.json();

          const heroes =
            profileData?.profile?.heroImages ??
            [];

          const map: Record<
            number,
            number
          > = {};

          heroes.forEach(
            (h: HeroItem) => {
              map[h.photoId] =
                h.sortOrder;
            },
          );

          setHeroMap(map);

          // 🔥 ADD: 프로필 이미지 ID 저장
          setProfilePhotoId(
            profileData?.profile
              ?.profilePhotoId ?? null,
          );
        }

        const meRes = await fetch(
          `${API_BASE}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          },
        );

        if (!meRes.ok) {
          setLoading(false);
          return;
        }

        const meData = await meRes.json();
        const profileId =
          meData?.user?.profileId;

        if (!profileId) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          `${API_BASE}/photos?profileId=${profileId}`,
          { cache: 'no-store' },
        );

        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = await res.json();
        setPhotos(data.photos ?? []);
      } catch (err) {
        console.error(
          '사진 로딩 에러:',
          err,
        );
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [API_BASE]);

  const handleDelete = async (
    photoId: number,
  ) => {
    const token =
      localStorage.getItem('accessToken');
    if (!token) return;

    const ok = confirm(
      '이 사진을 삭제하시겠습니까?',
    );
    if (!ok) return;

    const res = await fetch(
      `${API_BASE}/photos/${photoId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      alert('삭제 실패');
      return;
    }

    setPhotos((prev) =>
      prev.filter(
        (p) => p.id !== photoId,
      ),
    );
  };

  const openViewer = (
    index: number,
  ) => {
    router.push(
      `/profile/view/photo?index=${index}`,
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        로딩중...
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div style={{ padding: 20 }}>
        업로드된 사진이 없습니다.
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <div style={gridStyle}>
        {photos.map(
          (photo, idx) => {
            const heroOrder =
              heroMap[photo.id];

            const isProfile =
              profilePhotoId ===
              photo.id;

            return (
              <div
                key={photo.id}
                style={cardStyle}
              >
                <div
                  style={deleteBtnStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(photo.id);
                  }}
                >
                  ×
                </div>

                {/* 🔵 프로필 우선 */}
                {isProfile ? (
                  <div style={heroBadgeStyle}>
                    프로필 이미지
                  </div>
                ) : heroOrder ? (
                  <div style={heroBadgeStyle}>
                    대표이미지 {heroOrder}
                  </div>
                ) : null}

                <div
                  onClick={() =>
                    openViewer(idx)
                  }
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url('${API_BASE}${photo.imageUrl}')`,
                    backgroundSize:
                      'cover',
                    backgroundPosition:
                      'center',
                    borderRadius: 12,
                    cursor: 'pointer',
                  }}
                />
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}

/* ===== styles ===== */

const wrapperStyle: React.CSSProperties =
  {
    paddingTop: '0',
  };

const gridStyle: React.CSSProperties =
  {
    display: 'grid',
    gridTemplateColumns:
      'repeat(3, 1fr)',
    gap: 8,
  };

const cardStyle: React.CSSProperties =
  {
    position: 'relative',
    width: '100%',
    aspectRatio: '1 / 1',
    overflow: 'hidden',
  };

const deleteBtnStyle: React.CSSProperties =
  {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: '50%',
    background:
      'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center',
    cursor: 'pointer',
    zIndex: 10,
  };

const heroBadgeStyle: React.CSSProperties =
  {
    position: 'absolute',
    bottom: 6,
    left: 6,
    padding: '4px 8px',
    borderRadius: 6,
    background:
      'rgba(24,119,242,0.9)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    zIndex: 11,
    pointerEvents: 'none',
  };