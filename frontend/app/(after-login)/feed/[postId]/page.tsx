'use client';

import { useParams } from 'next/navigation';
import PostDetailContainer from '../../../../components/feed-detail/PostDetailContainer';

type Params = {
  postId?: string;
};

export default function PostDetailPage() {
  const params = useParams<Params>();

  const postId =
    typeof params?.postId === 'string'
      ? Number(params.postId)
      : null;

  if (!postId || Number.isNaN(postId)) {
    return (
      <div className="mx-auto max-w-[640px] px-6 py-10">
        게시물을 찾을 수 없습니다.
      </div>
    );
  }

  return <PostDetailContainer postId={postId} />;
}
