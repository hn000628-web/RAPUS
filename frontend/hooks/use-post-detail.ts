'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  PostImage,
  PostDetailState,
} from '../components/feed-detail/post-detail.types';
import { postDetailStore } from '../stores/post-detail-store';

export default function usePostDetail(postId: number) {
  const [state, setState] = useState<PostDetailState>({
    status: 'LOADING',
    post: null,
    images: [],
    currentIndex: 0,
    errorMessage: null,
  });

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setState((prev: PostDetailState) => ({
        ...prev,
        status: 'LOADING',
        errorMessage: null,
      }));

      try {
        const { post, images } =
          await postDetailStore.fetch(postId);

        if (!alive) return;

        setState({
          status: 'READY',
          post,
          images,
          currentIndex: 0,
          errorMessage: null,
        });
      } catch (e) {
        const message =
          e instanceof Error ? e.message : '서버 오류';

        if (!alive) return;

        setState({
          status: 'ERROR',
          post: null,
          images: [],
          currentIndex: 0,
          errorMessage: message,
        });
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, [postId]);

  const hero: PostImage | null = useMemo(() => {
    if (state.images.length === 0) return null;
    const safeIndex = Math.min(
      Math.max(state.currentIndex, 0),
      state.images.length - 1,
    );
    return state.images[safeIndex];
  }, [state.images, state.currentIndex]);

  const authorLabel =
    state.post?.displayName?.trim()
      ? state.post.displayName
      : '작성자 정보 없음';

  const createdDateLabel = state.post?.createdAt
    ? new Date(state.post.createdAt).toLocaleDateString()
    : '';

  const setIndex = (next: number) => {
    setState((prev: PostDetailState) => {
      if (prev.images.length === 0) return prev;
      const max = prev.images.length - 1;
      const clamped = Math.min(Math.max(next, 0), max);
      return { ...prev, currentIndex: clamped };
    });
  };

  const onPrev = () => setIndex(state.currentIndex - 1);
  const onNext = () => setIndex(state.currentIndex + 1);

  const canSlide = state.images.length >= 2;

  return {
    state,
    hero,
    authorLabel,
    createdDateLabel,
    canSlide,
    setIndex,
    onPrev,
    onNext,
  };
}