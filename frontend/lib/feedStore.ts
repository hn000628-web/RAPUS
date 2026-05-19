/* =========================================
   Feed Store
   frontend/lib/feedStore.ts
========================================= */

type FeedPost = {

  id: number

  title: string

  content: string

  imageUrl?: string

  regionId: number

  createdAt: string

}

type FeedState = {

  posts: FeedPost[]

  loading: boolean

  page: number

  hasMore: boolean

}

/* =========================================
   내부 상태
========================================= */

let state: FeedState = {

  posts: [],

  loading: false,

  page: 1,

  hasMore: true

}

/* =========================================
   피드 가져오기
========================================= */

export async function loadFeed(fetcher: Function) {

  if (state.loading)
    return

  if (!state.hasMore)
    return

  state.loading = true

  try {

    const data =
      await fetcher(state.page)

    if (data?.posts?.length) {

      state.posts = [
        ...state.posts,
        ...data.posts
      ]

      state.page += 1

    } else {

      state.hasMore = false

    }

  } catch (e) {

    console.error('feed load error', e)

  }

  state.loading = false

}

/* =========================================
   피드 가져오기
========================================= */

export function getFeed() {

  return state.posts

}

/* =========================================
   로딩 상태
========================================= */

export function isFeedLoading() {

  return state.loading

}

/* =========================================
   페이지 초기화
========================================= */

export function resetFeed() {

  state.posts = []

  state.page = 1

  state.hasMore = true

  state.loading = false

}

/* =========================================
   지역 변경 시 피드 초기화
========================================= */

export function resetFeedByRegion() {

  resetFeed()

}

/* =========================================
   피드 추가
========================================= */

export function addPost(post: FeedPost) {

  state.posts = [

    post,

    ...state.posts

  ]

}

/* =========================================
   피드 삭제
========================================= */

export function removePost(postId: number) {

  state.posts =
    state.posts.filter(
      p => p.id !== postId
    )

}