'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Post {
  id: string;
  title: string;
  status: 'active' | 'hidden';
  createdAt: string;
}

export default function AdminUserPostsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 실제 API 연동
    // 테스트용 게시물 데이터
    const mockPosts: Post[] = [
      {
        id: 'p1',
        title: '오늘의 점심 메뉴',
        status: 'active',
        createdAt: '2026-02-01',
      },
      {
        id: 'p2',
        title: '신메뉴 출시 안내',
        status: 'active',
        createdAt: '2026-01-28',
      },
      {
        id: 'p3',
        title: '이벤트 종료 공지',
        status: 'hidden',
        createdAt: '2026-01-20',
      },
    ];

    setPosts(mockPosts);
    setLoading(false);
  }, [userId]);

  const handleHidePost = (postId: string) => {
    if (!confirm('이 게시물을 숨김 처리하시겠습니까?')) return;

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, status: 'hidden' } : post
      )
    );
  };

  const handleDeletePost = (postId: string) => {
    if (!confirm('이 게시물을 삭제하시겠습니까? (소프트 삭제)')) return;

    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  return (
    <div style={{ padding: '24px' }}>
      <button onClick={() => router.back()} style={{ marginBottom: '16px' }}>
        ← 유저 목록으로
      </button>

      <h1>유저 게시물 관리</h1>
      <p style={{ color: '#666' }}>유저 ID: {userId}</p>

      {loading ? (
        <p>로딩 중...</p>
      ) : posts.length === 0 ? (
        <p>게시물이 없습니다.</p>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '16px',
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>게시물 ID</th>
              <th style={thStyle}>제목</th>
              <th style={thStyle}>상태</th>
              <th style={thStyle}>작성일</th>
              <th style={thStyle}>관리</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td style={tdStyle}>{post.id}</td>
                <td style={tdStyle}>{post.title}</td>
                <td style={tdStyle}>
                  {post.status === 'active' ? '노출' : '숨김'}
                </td>
                <td style={tdStyle}>{post.createdAt}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleHidePost(post.id)}
                    disabled={post.status === 'hidden'}
                  >
                    숨김
                  </button>
                  <button
                    style={{ marginLeft: '8px' }}
                    onClick={() => handleDeletePost(post.id)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  borderBottom: '1px solid #ccc',
  textAlign: 'left',
  padding: '8px',
};

const tdStyle: React.CSSProperties = {
  borderBottom: '1px solid #eee',
  padding: '8px',
};
