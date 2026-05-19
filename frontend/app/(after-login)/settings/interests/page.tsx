'use client';

import { useState } from 'react';

const INTERESTS = [
  // 일 · 창작
  '개발',
  '디자인',
  '영상',
  '웹툰',
  '프리랜서',
  '스타트업',
  '마케팅',

  // 라이프스타일
  '부동산',
  '음식',
  '운동',
  '피트니스',
  '사진',
  '여행',
  '음악',
  '패션',

  // 사유 · 가치관
  '철학',
  '인문학',
  '심리',
  '사회',

  // 종교 · 신앙
  '종교',
  '기독교',
  '천주교',
  '불교',
  '이슬람',
];

export default function InterestsPage() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleInterest = (tag: string) => {
    setSelected((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '24px 16px',
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
        관심사 설정
      </h1>

      <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
        탐색 및 추천 피드에 사용됩니다.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        {INTERESTS.map((tag) => {
          const active = selected.includes(tag);

          return (
            <button
              key={tag}
              onClick={() => toggleInterest(tag)}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                border: active ? '1px solid #1877f2' : '1px solid #ddd',
                background: active ? '#e7f0ff' : '#fff',
                color: active ? '#1877f2' : '#333',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              #{tag}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 32 }}>
        <button
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 8,
            border: 'none',
            background: '#1877f2',
            color: '#fff',
            fontSize: 15,
            cursor: 'pointer',
          }}
          onClick={() => {
            // TODO: 관심사 저장 API
            alert('관심사가 저장되었습니다.');
          }}
        >
          저장
        </button>
      </div>
    </div>
  );
}
