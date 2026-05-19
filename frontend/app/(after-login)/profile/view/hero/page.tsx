'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Suspense } from 'react';

function HeroViewerPageContent() {

  const router = useRouter();
  const searchParams = useSearchParams();

  const imagesParam = searchParams.get('images');
  const indexParam = searchParams.get('index');

  const parsedImages: string[] =
    imagesParam
      ? JSON.parse(decodeURIComponent(imagesParam))
      : [];

  const [images, setImages] =
    useState<string[]>(parsedImages);

  const [current, setCurrent] =
    useState(
      indexParam
        ? Number(indexParam)
        : 0,
    );

  const total = images.length;

  /* ===============================
     이전
  =============================== */

  const goPrev = () => {

    setCurrent((prev) =>
      prev === 0
        ? total - 1
        : prev - 1,
    );

  };

  /* ===============================
     다음
  =============================== */

  const goNext = () => {

    setCurrent((prev) =>
      prev === total - 1
        ? 0
        : prev + 1,
    );

  };

  /* ===============================
     히어로 이미지 삭제
  =============================== */

  const handleDelete = async () => {

    if (total === 0) return;

    const ok =
      confirm(
        '이 히어로 이미지를 삭제하시겠습니까?',
      );

    if (!ok) return;

    const token =
      localStorage.getItem(
        'accessToken',
      );

    if (!token) {

      alert('로그인이 필요합니다.');
      return;

    }

    const targetUrl =
      images[current];

    try {

      console.log(
        '삭제 요청 URL:',
        targetUrl,
      );

      const res =
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/profiles/hero/delete`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type':
                'application/json',
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              imageUrl: targetUrl,
            }),
          },
        );

      console.log(
        '삭제 응답 상태:',
        res.status,
      );

      if (!res.ok) {

        const text =
          await res.text();

        console.error(
          '삭제 실패 응답:',
          text,
        );

        alert('삭제 실패');
        return;

      }

      const nextImages =
        images.filter(
          (_, idx) =>
            idx !== current,
        );

      if (nextImages.length === 0) {

        router.back();
        return;

      }

      setImages(nextImages);

      setCurrent((prev) =>
        Math.min(
          prev,
          nextImages.length - 1,
        ),
      );

    } catch (err) {

      console.error(
        '삭제 요청 오류:',
        err,
      );

      alert(
        '서버 오류로 삭제 실패',
      );

    }

  };

  if (total === 0) return null;

  return (
    <div style={wrapStyle}>

      {/* 닫기 */}
      <div
        style={closeStyle}
        onClick={() =>
          router.back()
        }
      >
        ✕
      </div>

      {/* 삭제 */}
      <div
        style={deleteStyle}
        onClick={handleDelete}
      >
        삭제
      </div>

      {/* 이전 */}
      {total > 1 && (
        <button
          onClick={goPrev}
          style={navBtnStyle}
        >
          ‹
        </button>
      )}

      {/* 이미지 */}
      <img
        src={images[current]}
        style={imageStyle}
        alt=""
      />

      {/* 다음 */}
      {total > 1 && (
        <button
          onClick={goNext}
          style={{
            ...navBtnStyle,
            right: 20,
            left: 'auto',
          }}
        >
          ›
        </button>
      )}

      {/* 인디케이터 */}
      <div style={indicatorStyle}>
        {current + 1} / {total}
      </div>

    </div>
  );
}

export default function HeroViewerPage() {
  return (
    <Suspense fallback={<div>프로필 이미지를 불러오는 중입니다.</div>}>
      <HeroViewerPageContent />
    </Suspense>
  );
}

/* ===============================
   STYLES
=============================== */

const wrapStyle: React.CSSProperties = {

  position: 'fixed',
  inset: 0,
  background: '#000',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,

};

const imageStyle: React.CSSProperties = {

  maxWidth: '95%',
  maxHeight: '85%',
  objectFit: 'contain',

};

const navBtnStyle: React.CSSProperties = {

  position: 'absolute',
  left: 20,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'rgba(255,255,255,0.2)',
  border: 'none',
  color: '#fff',
  fontSize: 24,
  width: 44,
  height: 44,
  borderRadius: '50%',
  cursor: 'pointer',

};

const closeStyle: React.CSSProperties = {

  position: 'absolute',
  top: 20,
  right: 20,
  fontSize: 28,
  color: '#fff',
  cursor: 'pointer',

};

const deleteStyle: React.CSSProperties = {

  position: 'absolute',
  top: 20,
  left: 20,
  fontSize: 16,
  color: '#ff4d4f',
  cursor: 'pointer',

};

const indicatorStyle: React.CSSProperties = {

  position: 'absolute',
  bottom: 30,
  color: '#fff',
  fontSize: 14,

};
