// FILE : frontend/app/(after-login)/profile/business/posts/[postId]/page.tsx
// ROOT : frontend/app/(after-login)/profile/business/posts/[postId]/page.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS OWNER POST DETAIL PAGE
// CHANGE SUMMARY :
// - BusinessOwnerPostDetail.module.css CSS Module 연결 유지
// - 사업자 본인 관리 전용 UI 유지
// - API import 없이 postId 라우트 파라미터 기반 임시 상세 UI 유지
// - 관리 작업 섹션을 상세 내용 섹션 위에 유지
// - 통계 메타 카드 유지
// - 조회수 / 클릭수 / 평점 / 리뷰수 임시 표시 유지
// - 상세 내용 하단에 리뷰 관리 UI 추가
// - 일반 리뷰 / 주문 후기 / 방문 후기 임시 리뷰 목록 추가
// - 사용자용 공개 상세 /channel/[channelCode]/post/[postId] 와 UI 책임 분리 유지

'use client'

// SECTION 01 : IMPORT

import {
  useParams,
  useRouter
} from 'next/navigation'

import styles from './BusinessOwnerPostDetail.module.css'

// SECTION 02 : TYPE

type Params = {
  postId?: string | string[]
}

type OwnerPostDetailView = {
  id: number
  title: string
  postTypeLabel: string
  statusLabel: string
  visibilityLabel: string
  priceLabel: string
  viewCountLabel: string
  clickCountLabel: string
  ratingLabel: string
  reviewCountLabel: string
  content: string
  createdAtLabel: string
  updatedAtLabel: string
}

type OwnerPostReviewView = {
  id: number
  reviewerName: string
  sourceLabel: string
  ratingLabel: string
  content: string
  createdAtLabel: string
}

// SECTION 03 : CONSTANT

const TEMP_POST_TYPE_LABEL =
  '메뉴 / 상품 / 서비스'

const TEMP_STATUS_LABEL =
  '등록됨'

const TEMP_VISIBILITY_LABEL =
  '공개'

const TEMP_PRICE_LABEL =
  '가격 정보 API 연결 예정'

const TEMP_VIEW_COUNT_LABEL =
  '0회'

const TEMP_CLICK_COUNT_LABEL =
  '0회'

const TEMP_RATING_LABEL =
  '평점 없음'

const TEMP_REVIEW_COUNT_LABEL =
  '0개'

const TEMP_CONTENT =
  '이 영역은 사업자 본인이 포스트 내용을 확인하고 수정 / 삭제 / 공개 상태를 관리하기 위한 전용 상세 UI입니다. 현재는 API 연결 전 단계이므로 라우트의 postId 기준으로 화면 구조만 표시합니다.'

const TEMP_REVIEWS: OwnerPostReviewView[] = [
  {
    id: 1,
    reviewerName: '일반 사용자',
    sourceLabel: '일반 리뷰',
    ratingLabel: '평점 대기',
    content: '사용자가 포스트를 보고 직접 남기는 리뷰 영역입니다. API 연결 전 임시 리뷰입니다.',
    createdAtLabel: 'API 연결 예정'
  },
  {
    id: 2,
    reviewerName: '주문 사용자',
    sourceLabel: '주문 후기',
    ratingLabel: '평점 대기',
    content: '주문 완료 후 남기는 구매 후기 영역입니다. 주문 시스템 연결 후 인증 후기와 연동합니다.',
    createdAtLabel: 'API 연결 예정'
  },
  {
    id: 3,
    reviewerName: '방문 사용자',
    sourceLabel: '방문 후기',
    ratingLabel: '평점 대기',
    content: '예약 또는 방문 완료 후 남기는 방문 후기 영역입니다. 방문 인증 구조 연결 전 임시 UI입니다.',
    createdAtLabel: 'API 연결 예정'
  }
]

// SECTION 04 : COMPONENT

export default function BusinessPostDetailPage() {
  const params =
    useParams() as Params | null

  const router =
    useRouter()

  // SECTION 05 : SAFE PARSE

  const postIdRaw =
    params?.postId

  const postIdValue =
    typeof postIdRaw === 'string'
      ? postIdRaw
      : Array.isArray(postIdRaw)
        ? postIdRaw[0]
        : undefined

  const postId =
    typeof postIdValue === 'string'
      ? Number(postIdValue)
      : NaN

  // SECTION 06 : VALIDATION

  if (
    !postId ||
    Number.isNaN(postId) ||
    postId <= 0
  ) {
    return (
      <main className={styles.page}>
        <section className={styles.invalidBox}>
          <h1 className={styles.invalidTitle}>
            게시물을 찾을 수 없습니다.
          </h1>

          <p className={styles.invalidText}>
            올바르지 않은 게시물 주소입니다.
          </p>

          <button
            type="button"
            onClick={() => router.push('/profile/business')}
            className={styles.primaryButton}
          >
            비즈니스 페이지로 돌아가기
          </button>
        </section>
      </main>
    )
  }

  // SECTION 07 : VIEW MODEL

  const postDetail: OwnerPostDetailView = {
    id: postId,
    title: `사업자 포스트 #${postId}`,
    postTypeLabel: TEMP_POST_TYPE_LABEL,
    statusLabel: TEMP_STATUS_LABEL,
    visibilityLabel: TEMP_VISIBILITY_LABEL,
    priceLabel: TEMP_PRICE_LABEL,
    viewCountLabel: TEMP_VIEW_COUNT_LABEL,
    clickCountLabel: TEMP_CLICK_COUNT_LABEL,
    ratingLabel: TEMP_RATING_LABEL,
    reviewCountLabel: TEMP_REVIEW_COUNT_LABEL,
    content: TEMP_CONTENT,
    createdAtLabel: 'API 연결 예정',
    updatedAtLabel: 'API 연결 예정'
  }

  const reviews =
    TEMP_REVIEWS

  // SECTION 08 : EVENT FUNCTION

  function handleBack() {
    router.push('/profile/business')
  }

  function handleEdit() {
    router.push(`/profile/business/posts/${postId}/edit`)
  }

  function handlePublicPreview() {
    alert(
      '공개 사용자용 상세 URL은 channelCode 연결 후 /channel/[channelCode]/post/[postId] 구조로 연결합니다.'
    )
  }

  function handleDelete() {
    alert(
      '삭제 기능은 관리자용 DELETE API 연결 후 활성화합니다.'
    )
  }

  function handleReviewList() {
    alert(
      '전체 리뷰 관리는 post_reviews API 연결 후 활성화합니다.'
    )
  }

  // SECTION 09 : RENDER

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.topBar}>
          <button
            type="button"
            onClick={handleBack}
            className={styles.backButton}
          >
            ← 목록으로
          </button>

          <div className={styles.pageBadge}>
            사업자 관리 상세
          </div>
        </div>

        <section className={styles.hero}>
          <div className={styles.imagePlaceholder}>
            <div className={styles.imageIcon}>
              MENU
            </div>

            <div className={styles.imageText}>
              대표 이미지 API 연결 예정
            </div>
          </div>

          <div className={styles.summary}>
            <div className={styles.typeRow}>
              <span className={styles.typeBadge}>
                {postDetail.postTypeLabel}
              </span>

              <span className={styles.statusBadge}>
                {postDetail.statusLabel}
              </span>

              <span className={styles.visibilityBadge}>
                {postDetail.visibilityLabel}
              </span>
            </div>

            <h1 className={styles.title}>
              {postDetail.title}
            </h1>

            <div className={styles.price}>
              {postDetail.priceLabel}
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>
                  Post ID
                </span>

                <span className={styles.metaValue}>
                  {postDetail.id}
                </span>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>
                  조회수
                </span>

                <span className={styles.metaValue}>
                  {postDetail.viewCountLabel}
                </span>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>
                  클릭수
                </span>

                <span className={styles.metaValue}>
                  {postDetail.clickCountLabel}
                </span>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>
                  평점
                </span>

                <span className={styles.metaValue}>
                  {postDetail.ratingLabel}
                </span>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>
                  리뷰수
                </span>

                <span className={styles.metaValue}>
                  {postDetail.reviewCountLabel}
                </span>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>
                  생성일
                </span>

                <span className={styles.metaValue}>
                  {postDetail.createdAtLabel}
                </span>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>
                  수정일
                </span>

                <span className={styles.metaValue}>
                  {postDetail.updatedAtLabel}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.manageCard}>
          <div className={styles.sectionHeader}>
            관리 작업
          </div>

          <div className={styles.actionGrid}>
            <button
              type="button"
              onClick={handleEdit}
              className={styles.primaryButton}
            >
              수정하기
            </button>

            <button
              type="button"
              onClick={handlePublicPreview}
              className={styles.secondaryButton}
            >
              공개보기
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className={styles.dangerButton}
            >
              삭제하기
            </button>
          </div>

          <p className={styles.notice}>
            현재 페이지는 사업자 본인 관리용 UI입니다. 일반 방문자용 공개 상세는 별도 라우트에서 분리합니다.
          </p>
        </section>

        <section className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            상세 내용
          </div>

          <p className={styles.contentText}>
            {postDetail.content}
          </p>
        </section>

        <section className={styles.reviewCard}>
          <div className={styles.reviewHeaderRow}>
            <div>
              <div className={styles.sectionHeader}>
                리뷰 관리
              </div>

              <p className={styles.reviewDescription}>
                해당 포스트에 연결되는 일반 리뷰 / 주문 후기 / 방문 후기를 관리하는 영역입니다.
              </p>
            </div>

            <button
              type="button"
              onClick={handleReviewList}
              className={styles.reviewListButton}
            >
              전체 리뷰 보기
            </button>
          </div>

          <div className={styles.reviewSummaryGrid}>
            <div className={styles.reviewSummaryItem}>
              <span className={styles.reviewSummaryLabel}>
                평균 평점
              </span>

              <span className={styles.reviewSummaryValue}>
                {postDetail.ratingLabel}
              </span>
            </div>

            <div className={styles.reviewSummaryItem}>
              <span className={styles.reviewSummaryLabel}>
                전체 리뷰
              </span>

              <span className={styles.reviewSummaryValue}>
                {postDetail.reviewCountLabel}
              </span>
            </div>

            <div className={styles.reviewSummaryItem}>
              <span className={styles.reviewSummaryLabel}>
                인증 후기
              </span>

              <span className={styles.reviewSummaryValue}>
                API 연결 예정
              </span>
            </div>
          </div>

          <div className={styles.reviewList}>
            {reviews.map((review) => (
              <article
                key={review.id}
                className={styles.reviewItem}
              >
                <div className={styles.reviewTopRow}>
                  <div className={styles.reviewUserBlock}>
                    <span className={styles.reviewUserName}>
                      {review.reviewerName}
                    </span>

                    <span className={styles.reviewDate}>
                      {review.createdAtLabel}
                    </span>
                  </div>

                  <div className={styles.reviewBadgeRow}>
                    <span className={styles.reviewSourceBadge}>
                      {review.sourceLabel}
                    </span>

                    <span className={styles.reviewRatingBadge}>
                      {review.ratingLabel}
                    </span>
                  </div>
                </div>

                <p className={styles.reviewContent}>
                  {review.content}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

// SECTION 10 : VALIDATION

/*
VALIDATION:
- CSSProperties import 없음
- inline style 없음
- BusinessOwnerPostDetail.module.css 연결 유지
- 공용 사용자 상세 컴포넌트 재사용 없음
- API import 없음
- route param postId 안전 파싱 유지
- /profile/business/posts/[postId] 전용 관리 UI 표시
- 조회수 / 클릭수 / 평점 / 리뷰수 통계 카드 표시
- 관리 작업 섹션은 상세 내용 섹션 위에 배치
- 상세 내용 하단에 리뷰 관리 UI 추가
- 리뷰 목록은 일반 리뷰 / 주문 후기 / 방문 후기 임시 데이터로 표시
- 수정 버튼은 /profile/business/posts/[postId]/edit 이동
- 공개보기 / 삭제 / 전체 리뷰 보기는 API 연결 전 alert 처리
- 사용자용 공개 상세 /channel/[channelCode]/post/[postId] 와 책임 분리
- 모바일 대응은 CSS Module에서 처리
*/