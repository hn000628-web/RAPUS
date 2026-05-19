'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const MOCK_POSTS = [
  {
    id: '1',
    title: '풍암동 투룸 500/30',
    thumbnail: 'https://via.placeholder.com/80',
    isAd: false,
    stats: {
      impressions: 1240,
      clicks: 32,
      likes: 18,
      comments: 4,
    },
  },
  {
    id: '2',
    title: '풍암동 투룸 100/20',
    thumbnail: 'https://via.placeholder.com/80',
    isAd: false,
    stats: {
      impressions: 860,
      clicks: 12,
      likes: 6,
      comments: 1,
    },
  },
  {
    id: '3',
    title: '오늘 라지 9,900원 특가',
    thumbnail: 'https://via.placeholder.com/80',
    isAd: true,
    stats: {
      impressions: 5420,
      clicks: 210,
      likes: 64,
      comments: 12,
    },
  },
];

export default function SelectAdPostPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '72px 16px 120px',
      }}
    >
      {/* 타이틀 */}
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        유료 전환할 게시물 선택
      </h1>

      {/* 설명 */}
      <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
        게시물은 기본적으로 <strong>무료 노출</strong>됩니다.
        <br />
        성과가 좋은 게시물을 <strong>유료 상단 노출</strong>로 전환해보세요.
      </p>

      {/* 게시물 리스트 */}
      {MOCK_POSTS.map((post) => {
        const isSelected = selectedId === post.id;

        return (
          <div
            key={post.id}
            onClick={() => {
              if (!post.isAd) setSelectedId(post.id);
            }}
            style={{
              display: 'flex',
              gap: 12,
              padding: 12,
              background: isSelected ? '#f0f2f5' : '#fff',
              border: isSelected
                ? '2px solid #000'
                : '1px solid #e5e5e5',
              borderRadius: 12,
              marginBottom: 12,
              alignItems: 'flex-start',
              cursor: post.isAd ? 'default' : 'pointer',
              opacity: post.isAd ? 0.6 : 1,
            }}
          >
            <img
              src={post.thumbnail}
              alt=""
              style={{ width: 64, height: 64, borderRadius: 8 }}
            />

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{post.title}</div>

              <div
                style={{
                  fontSize: 12,
                  color: post.isAd ? '#000' : '#777',
                  marginTop: 2,
                }}
              >
                상태: {post.isAd ? '상단 노출 중' : '무료 노출'}
              </div>

              {/* 통계 */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  marginTop: 6,
                  fontSize: 11,
                  color: '#555',
                  flexWrap: 'wrap',
                }}
              >
                <Stat label="노출" value={post.stats.impressions} />
                <Stat label="클릭" value={post.stats.clicks} />
                <Stat label="좋아요" value={post.stats.likes} />
                <Stat label="댓글" value={post.stats.comments} />
              </div>

              {/* 🔁 유료 전환 해제 */}
              {post.isAd && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // ✅ 유료 전환 해제 API 호출 위치
                    alert('유료 전환이 해제되었습니다.');
                  }}
                  style={{
                    marginTop: 6,
                    padding: 0,
                    fontSize: 12,
                    color: '#555',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  유료 전환 해제
                </button>
              )}
            </div>

            {post.isAd && (
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                상단 노출
              </span>
            )}
          </div>
        );
      })}

      {/* 하단 CTA */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 16px',
          background: '#f0f2f5',
          borderTop: '1px solid #ddd',
        }}
      >
        <button
          disabled={!selectedId}
          onClick={() => {
            if (selectedId) {
              // ✅ 유료 전환 API 호출 위치
              router.push('/settings/ads');
            }
          }}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 12,
            background: selectedId ? '#000' : '#ccc',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: selectedId ? 'pointer' : 'default',
          }}
        >
          유료 전환
        </button>
      </div>
    </div>
  );
}

/* ---------- 통계 UI ---------- */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: '#f5f5f5',
        borderRadius: 6,
        padding: '2px 6px',
        whiteSpace: 'nowrap',
      }}
    >
      {label} {value}
    </div>
  );
}
