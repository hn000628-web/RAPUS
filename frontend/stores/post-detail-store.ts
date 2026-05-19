/* ==================================================
SECTION 01 : IMPORT
================================================== */

import { apiFetch } from '@/lib/api'

import type {
  PostImage,
  PostDetail,
} from '../components/feed-detail/post-detail.types'

/* ==================================================
SECTION 02 : TYPE
================================================== */

type ApiOkResponse = {
  ok: boolean
  post?: PostDetail
}

/* ==================================================
SECTION 03 : IMAGE NORMALIZE
================================================== */

const normalizeImages = (
  post: PostDetail,
): PostImage[] => {

  const images = post.images ?? []

  return images.map((img) => ({
    ...img,
    imageUrl: img.imageUrl,
  }))
}

/* ==================================================
SECTION 04 : STORE
================================================== */

export const postDetailStore = {

  /* ==================================================
  SECTION 05 : FETCH POST
  ================================================== */

  async fetch(postId: number): Promise<{
    post: PostDetail
    images: PostImage[]
  }> {

    const data =
      await apiFetch<ApiOkResponse>(
        `posts/${postId}`
      )

    if (!data.ok || !data.post) {
      throw new Error(
        '게시물을 불러오지 못했습니다.'
      )
    }

    return {
      post: data.post,
      images: normalizeImages(data.post),
    }
  },

  /* ==================================================
  SECTION 06 : DELETE POST
  ================================================== */

  async delete(postId: number): Promise<void> {

    await apiFetch(
      `posts/${postId}`,
      {
        method: 'DELETE',
      }
    )

  },

}