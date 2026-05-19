// components/feed-detail/post-detail.types.ts

export type PostImage = {
  id: number;
  imageUrl: string;
  sortOrder: number;
};

export type PostStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED';

export type PostType = 'GENERAL' | 'AD';

export type PostDetail = {
  id: number;
  profileId: number;
  type: PostType;
  title: string;
  content: string;
  price?: number | null;
  isNegotiable?: number;
  status: PostStatus;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  images: PostImage[];

  /* 🔥 작성자 */
  displayName?: string;
  profileType?: string;

  /* 🔥 ADD (FeedService에서 내려오는 데이터) */
  category?: string;
  regionName?: string;
};

/* ============================== */

export type PostDetailState = {
  status: 'LOADING' | 'READY' | 'ERROR';
  post: PostDetail | null;
  images: PostImage[];
  currentIndex: number;
  errorMessage: string | null;
};