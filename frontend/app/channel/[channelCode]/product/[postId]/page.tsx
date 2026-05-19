// FILE : frontend/app/channel/[channelCode]/product/[postId]/page.tsx
// ROOT : C:\Users\kjm\social-platform\frontend\app\channel\[channelCode]\product\[postId]\page.tsx
// STATUS : FINAL MODIFIED
// ROLE : PUBLIC PRODUCT DETAIL UI PAGE
// CHANGE SUMMARY :
// - 상품 상세 페이지에 필수 / 선택 옵션 체크 UI 추가
// - 필수 옵션은 단일 선택 구조 적용
// - 선택 옵션은 다중 선택 구조 적용
// - 주문불가 옵션은 disabled 처리
// - 선택 옵션 금액을 합산하여 예상 결제 금액 표시
// - 상품 설명 / 리뷰 영역 상단 유지
// - 가격 / 옵션 / 문의하기 / 주문하기 영역 하단 유지
// - ProductDetailPage.module.css 기반 className 구조 유지
// - DB / API / Service 연결 없음
// - mockProduct 기반 임시 UI 렌더링

'use client'

// SECTION 01 : IMPORT

import {
  useMemo,
  useState
} from 'react'

import styles from './ProductDetailPage.module.css'

// SECTION 02 : TYPE

type PageProps = {
  params: {
    channelCode: string
    postId: string
  }
}

type ProductOptionItem = {
  id: number
  name: string
  price: number
  available: boolean
}

type ProductOptionGroup = {
  id: number
  title: string
  required: boolean
  choiceType: 'SINGLE' | 'MULTIPLE'
  minSelect: number
  maxSelect: number
  items: ProductOptionItem[]
}

type ProductPost = {
  id: number
  channelCode: string
  title: string
  category: string
  basePrice: number
  summary: string
  description: string
  ratingText: string
  reviewCountText: string
  orderStatusText: string
  images: string[]
  badges: string[]
  optionGroups: ProductOptionGroup[]
}

// SECTION 03 : MOCK DATA

const mockProduct: ProductPost = {
  id: 2,
  channelCode: 'BK28FWTUNA9NC',
  title: '피자',
  category: '메뉴/상품/서비스',
  basePrice: 18900,
  summary: '치즈가 풍부한 대표 인기 메뉴입니다.',
  description:
    '고소한 치즈와 페퍼로니를 올린 메뉴형 상품 상세 페이지입니다. 현재 화면은 UI 우선 작업용 임시 데이터이며, 추후 postId 기반 API와 연결할 수 있습니다.',
  ratingText: '4.8',
  reviewCountText: '리뷰 382',
  orderStatusText: '주문 가능',
  images: [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=1400&q=80'
  ],
  badges: [
    'BEST',
    '인기 메뉴',
    '포장 가능'
  ],
  optionGroups: [
    {
      id: 1,
      title: '필수',
      required: true,
      choiceType: 'SINGLE',
      minSelect: 1,
      maxSelect: 1,
      items: [
        {
          id: 101,
          name: '1~2인용',
          price: 18900,
          available: true
        },
        {
          id: 102,
          name: '3~4인용',
          price: 24900,
          available: true
        }
      ]
    },
    {
      id: 2,
      title: '옵션',
      required: false,
      choiceType: 'MULTIPLE',
      minSelect: 0,
      maxSelect: 4,
      items: [
        {
          id: 201,
          name: '1.5L 콜라',
          price: 2500,
          available: false
        },
        {
          id: 202,
          name: '1.5L 제로콜라',
          price: 2500,
          available: true
        },
        {
          id: 203,
          name: '치즈 추가',
          price: 2000,
          available: true
        }
      ]
    }
  ]
}

// SECTION 04 : UTIL

function formatPrice(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`
}

// SECTION 05 : COMPONENT

export default function PublicProductDetailPage({
  params
}: PageProps) {
  const channelCode =
    params.channelCode

  const postId =
    params.postId

  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0)

  const [selectedOptionIds, setSelectedOptionIds] =
    useState<number[]>([
      101
    ])

  const product =
    useMemo<ProductPost>(() => {
      return {
        ...mockProduct,
        channelCode
      }
    }, [
      channelCode
    ])

  const selectedImage =
    product.images[selectedImageIndex] ??
    product.images[0]

  const hasMultipleImages =
    product.images.length > 1

  const selectedOptionItems =
    useMemo(() => {
      return product.optionGroups
        .flatMap((group) => group.items)
        .filter((item) => selectedOptionIds.includes(item.id))
    }, [
      product.optionGroups,
      selectedOptionIds
    ])

  const requiredSelectedItem =
    useMemo(() => {
      const requiredGroup =
        product.optionGroups.find((group) => group.required)

      if (!requiredGroup) {
        return null
      }

      return requiredGroup.items.find((item) =>
        selectedOptionIds.includes(item.id)
      ) ?? null
    }, [
      product.optionGroups,
      selectedOptionIds
    ])

  const selectedOptionExtraTotal =
    useMemo(() => {
      return selectedOptionItems.reduce((sum, item) => {
        if (requiredSelectedItem && item.id === requiredSelectedItem.id) {
          return sum
        }

        return sum + item.price
      }, 0)
    }, [
      selectedOptionItems,
      requiredSelectedItem
    ])

  const basePrice =
    requiredSelectedItem?.price ??
    product.basePrice

  const totalPrice =
    basePrice + selectedOptionExtraTotal

  // SECTION 06 : HANDLER

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => {
      if (prev <= 0) {
        return product.images.length - 1
      }

      return prev - 1
    })
  }

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => {
      if (prev >= product.images.length - 1) {
        return 0
      }

      return prev + 1
    })
  }

  const handleToggleOption = (
    group: ProductOptionGroup,
    item: ProductOptionItem
  ) => {
    if (!item.available) {
      return
    }

    setSelectedOptionIds((prev) => {
      const exists =
        prev.includes(item.id)

      if (group.choiceType === 'SINGLE') {
        const groupItemIds =
          group.items.map((optionItem) => optionItem.id)

        const withoutGroupItems =
          prev.filter((selectedId) => !groupItemIds.includes(selectedId))

        return [
          ...withoutGroupItems,
          item.id
        ]
      }

      if (exists) {
        return prev.filter((selectedId) => selectedId !== item.id)
      }

      const currentGroupSelectedCount =
        group.items.filter((optionItem) => prev.includes(optionItem.id)).length

      if (currentGroupSelectedCount >= group.maxSelect) {
        return prev
      }

      return [
        ...prev,
        item.id
      ]
    })
  }

  // SECTION 07 : RENDER

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          RAPUS
        </div>

        <div className={styles.headerRight}>
          <span className={styles.locationDot}>
            ●
          </span>

          <span className={styles.locationText}>
            풍암동
          </span>

          <button
            type="button"
            className={styles.loginButton}
          >
            로그인
          </button>
        </div>
      </header>

      <section className={styles.shell}>
        <section className={styles.layout}>
          <aside className={styles.mediaColumn}>
            <div className={styles.mediaFrame}>
              <img
                src={selectedImage}
                alt={product.title}
                className={styles.mainImage}
              />

              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    className={`${styles.mediaNavButton} ${styles.mediaNavButtonLeft}`}
                    aria-label="previous image"
                    onClick={handlePrevImage}
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    className={`${styles.mediaNavButton} ${styles.mediaNavButtonRight}`}
                    aria-label="next image"
                    onClick={handleNextImage}
                  >
                    ›
                  </button>
                </>
              )}

              <div className={styles.mediaCount}>
                {selectedImageIndex + 1}/{product.images.length}
              </div>
            </div>

            <div className={styles.thumbnailRow}>
              {product.images.map((image, index) => {
                const isActive =
                  selectedImageIndex === index

                return (
                  <button
                    key={image}
                    type="button"
                    className={
                      isActive
                        ? `${styles.thumbnailButton} ${styles.thumbnailButtonActive}`
                        : styles.thumbnailButton
                    }
                    onClick={() => {
                      setSelectedImageIndex(index)
                    }}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className={styles.thumbnailImage}
                    />
                  </button>
                )
              })}
            </div>
          </aside>

          <section className={styles.infoColumn}>
            <article className={styles.productCard}>
              <div className={styles.badgeRow}>
                {product.badges.map((badge) => {
                  return (
                    <span
                      key={badge}
                      className={styles.badge}
                    >
                      {badge}
                    </span>
                  )
                })}
              </div>

              <p className={styles.categoryText}>
                {product.category}
              </p>

              <h1 className={styles.productTitle}>
                {product.title}
              </h1>

              <div className={styles.divider} />

              <section className={styles.detailSection}>
                <h2 className={styles.sectionTitle}>
                  상품 설명
                </h2>

                <p className={styles.descriptionText}>
                  {product.description}
                </p>
              </section>

              <section className={styles.detailSection}>
                <h2 className={styles.sectionTitle}>
                  리뷰
                </h2>

                <div className={styles.reviewPreviewBox}>
                  <div className={styles.reviewTextBlock}>
                    <strong className={styles.reviewScore}>
                      ★ {product.ratingText}
                    </strong>

                    <p className={styles.reviewPreviewText}>
                      구매 또는 주문 완료 후 사용후기를 작성할 수 있습니다.
                    </p>

                    <p className={styles.reviewCountText}>
                      {product.reviewCountText}
                    </p>
                  </div>

                  <button
                    type="button"
                    className={styles.reviewButton}
                  >
                    리뷰 보기
                  </button>
                </div>
              </section>

              <div className={styles.divider} />

              <section className={styles.optionSection}>
                {product.optionGroups.map((group) => {
                  const selectedCount =
                    group.items.filter((item) =>
                      selectedOptionIds.includes(item.id)
                    ).length

                  return (
                    <div
                      key={group.id}
                      className={styles.optionGroup}
                    >
                      <div className={styles.optionGroupHeader}>
                        <div>
                          <h2 className={styles.optionGroupTitle}>
                            {group.title}
                          </h2>

                          <p className={styles.optionGroupRule}>
                            {group.required
                              ? `${group.minSelect}개 필수 선택`
                              : `최대 ${group.maxSelect}개 선택 가능`}
                          </p>
                        </div>

                        <span
                          className={
                            group.required
                              ? styles.requiredBadge
                              : styles.optionalBadge
                          }
                        >
                          {group.required ? '필수' : '선택'}
                        </span>
                      </div>

                      <div className={styles.optionList}>
                        {group.items.map((item) => {
                          const checked =
                            selectedOptionIds.includes(item.id)

                          return (
                            <label
                              key={item.id}
                              className={
                                item.available
                                  ? styles.optionItem
                                  : `${styles.optionItem} ${styles.optionItemDisabled}`
                              }
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!item.available}
                                className={styles.optionCheckbox}
                                onChange={() => {
                                  handleToggleOption(group, item)
                                }}
                              />

                              <span className={styles.optionName}>
                                {item.name}
                              </span>

                              <span className={styles.optionPrice}>
                                {formatPrice(item.price)}
                              </span>

                              <span
                                className={
                                  item.available
                                    ? styles.optionAvailable
                                    : styles.optionUnavailable
                                }
                              >
                                {item.available ? '주문가능' : '주문불가'}
                              </span>
                            </label>
                          )
                        })}
                      </div>

                      {!group.required && selectedCount >= group.maxSelect && (
                        <p className={styles.optionLimitText}>
                          최대 선택 수에 도달했습니다.
                        </p>
                      )}
                    </div>
                  )
                })}
              </section>

              <div className={styles.divider} />

              <section className={styles.purchaseSection}>
                <div className={styles.priceRow}>
                  <strong className={styles.priceText}>
                    {formatPrice(totalPrice)}
                  </strong>

                  <span className={styles.orderStatus}>
                    {product.orderStatusText}
                  </span>
                </div>

                <p className={styles.summaryText}>
                  {product.summary}
                </p>
              </section>

              <div className={styles.bottomActions}>
                <button
                  type="button"
                  className={styles.outlineOrderButton}
                >
                  문의하기
                </button>

                <button
                  type="button"
                  className={styles.orderButton}
                >
                  주문하기
                </button>
              </div>
            </article>

            <div className={styles.debugBox}>
              <span>
                channelCode : {channelCode}
              </span>

              <span>
                postId : {postId}
              </span>
            </div>
          </section>
        </section>
      </section>
    </main>
  )
}

// SECTION 08 : VALIDATION

/*
VALIDATION:
- 단일 파일 통코드 출력
- 필수 / 선택 옵션 체크 UI 추가
- 필수 옵션 단일 선택 처리
- 선택 옵션 다중 선택 처리
- 주문불가 옵션 disabled 처리
- 선택 옵션 금액 합산 처리
- 상품 설명 / 리뷰 영역 상단 유지
- 가격 / 옵션 / 문의하기 / 주문하기 영역 하단 유지
- CSS Module 기반 모바일 대응 구조 유지
- API 호출 없음
- DB 직접 접근 없음
- 백엔드 변경 없음
- JSX multi-line 구조 유지
*/