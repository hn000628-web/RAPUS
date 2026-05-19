// FILE : frontend/app/(after-login)/profile/business/create/product/page.tsx
// ROOT : C:\Users\kjm\social-platform\frontend\app\(after-login)\profile\business\create\product\page.tsx
// STATUS : CREATE MODE
// ROLE : BUSINESS PRODUCT CREATE PAGE UI
// CHANGE SUMMARY :
// - PRODUCT 전용 상품 / 메뉴 / 서비스 등록 페이지 신규 생성
// - 기본 정보 / 가격 / 이미지 / 옵션 / 판매 설정 UI 구성
// - 옵션 그룹 / 옵션 항목 추가 삭제 UI 포함
// - API / DB / Service 연결 없음
// - posts.postType = PRODUCT 전용 등록 UI 기준
// - 기존 게시글 등록 페이지와 분리

'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'

type ProductKind = 'MENU' | 'PRODUCT' | 'SERVICE'

type SaleStatus = 'ACTIVE' | 'SOLD_OUT' | 'HIDDEN'

type OptionChoiceType = 'SINGLE' | 'MULTIPLE'

type ProductImageItem = {
  id: number
  label: string
  previewUrl: string | null
}

type ProductOptionItem = {
  id: number
  name: string
  priceDelta: string
  isAvailable: boolean
}

type ProductOptionGroup = {
  id: number
  name: string
  choiceType: OptionChoiceType
  required: boolean
  minSelect: string
  maxSelect: string
  items: ProductOptionItem[]
}

const DEFAULT_IMAGE_SLOTS: ProductImageItem[] = [
  {
    id: 1,
    label: '대표 이미지',
    previewUrl: null
  },
  {
    id: 2,
    label: '상세 이미지 1',
    previewUrl: null
  },
  {
    id: 3,
    label: '상세 이미지 2',
    previewUrl: null
  }
]

function createOptionItem(id: number): ProductOptionItem {
  return {
    id,
    name: '',
    priceDelta: '0',
    isAvailable: true
  }
}

function createOptionGroup(id: number): ProductOptionGroup {
  return {
    id,
    name: '',
    choiceType: 'SINGLE',
    required: false,
    minSelect: '0',
    maxSelect: '1',
    items: [
      createOptionItem(Date.now())
    ]
  }
}

export default function BusinessProductCreatePage() {
  // SECTION 01 : ROUTER
  const router = useRouter()

  // SECTION 02 : BASIC STATE
  const [productKind, setProductKind] = useState<ProductKind>('MENU')
  const [title, setTitle] = useState('')
  const [priceAmount, setPriceAmount] = useState('')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')

  // SECTION 03 : IMAGE STATE
  const [images, setImages] = useState<ProductImageItem[]>(DEFAULT_IMAGE_SLOTS)

  // SECTION 04 : OPTION STATE
  const [optionGroups, setOptionGroups] = useState<ProductOptionGroup[]>([
    createOptionGroup(1)
  ])

  // SECTION 05 : SALE STATE
  const [saleStatus, setSaleStatus] = useState<SaleStatus>('ACTIVE')
  const [isOrderable, setIsOrderable] = useState(true)
  const [isPickupAvailable, setIsPickupAvailable] = useState(false)
  const [isReservationAvailable, setIsReservationAvailable] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState('')

  // SECTION 06 : DISPLAY STATE
  const [isBest, setIsBest] = useState(false)
  const [isPopular, setIsPopular] = useState(false)
  const [isSearchVisible, setIsSearchVisible] = useState(true)

  // SECTION 07 : DERIVED VALUE
  const previewPriceText = useMemo(() => {
    const numeric = Number(String(priceAmount).replace(/[^\d]/g, ''))

    if (!Number.isFinite(numeric) || numeric <= 0) {
      return '가격 미입력'
    }

    return `${numeric.toLocaleString('ko-KR')}원`
  }, [priceAmount])

  const productKindLabel = useMemo(() => {
    if (productKind === 'MENU') {
      return '메뉴'
    }

    if (productKind === 'SERVICE') {
      return '서비스'
    }

    return '상품'
  }, [productKind])

  // SECTION 08 : IMAGE HANDLER
  const handleImagePreview = (imageId: number, file: File | null) => {
    if (!file) {
      return
    }

    const nextUrl = URL.createObjectURL(file)

    setImages((prev) =>
      prev.map((item) =>
        item.id === imageId
          ? {
              ...item,
              previewUrl: nextUrl
            }
          : item
      )
    )
  }

  // SECTION 09 : OPTION GROUP HANDLER
  const handleAddOptionGroup = () => {
    setOptionGroups((prev) => [
      ...prev,
      createOptionGroup(Date.now())
    ])
  }

  const handleRemoveOptionGroup = (groupId: number) => {
    setOptionGroups((prev) => {
      if (prev.length <= 1) {
        return prev
      }

      return prev.filter((group) => group.id !== groupId)
    })
  }

  const handleUpdateOptionGroup = (
    groupId: number,
    patch: Partial<ProductOptionGroup>
  ) => {
    setOptionGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              ...patch
            }
          : group
      )
    )
  }

  // SECTION 10 : OPTION ITEM HANDLER
  const handleAddOptionItem = (groupId: number) => {
    setOptionGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: [
                ...group.items,
                createOptionItem(Date.now())
              ]
            }
          : group
      )
    )
  }

  const handleRemoveOptionItem = (groupId: number, itemId: number) => {
    setOptionGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) {
          return group
        }

        if (group.items.length <= 1) {
          return group
        }

        return {
          ...group,
          items: group.items.filter((item) => item.id !== itemId)
        }
      })
    )
  }

  const handleUpdateOptionItem = (
    groupId: number,
    itemId: number,
    patch: Partial<ProductOptionItem>
  ) => {
    setOptionGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) {
          return group
        }

        return {
          ...group,
          items: group.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  ...patch
                }
              : item
          )
        }
      })
    )
  }

  // SECTION 11 : SUBMIT HANDLER
  const handleSubmit = () => {
    window.alert('UI 전용 화면입니다. PRODUCT create API 연결 전입니다.')
  }

  // SECTION 12 : RENDER
  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>
              PRODUCT CREATE
            </p>

            <h1 style={styles.title}>
              상품 / 메뉴 / 서비스 등록
            </h1>

            <p style={styles.description}>
              상품 상세 페이지에 표시될 기본 정보와 옵션을 등록합니다.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              type="button"
              style={styles.ghostButton}
              onClick={() => {
                router.back()
              }}
            >
              뒤로가기
            </button>

            <button
              type="button"
              style={styles.darkButton}
              onClick={handleSubmit}
            >
              등록하기
            </button>
          </div>
        </header>

        <section style={styles.grid}>
          <section style={styles.formColumn}>
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>
                  기본 정보
                </h2>

                <p style={styles.cardDesc}>
                  상품 상세 페이지의 제목, 가격, 설명에 사용됩니다.
                </p>
              </div>

              <div style={styles.kindGrid}>
                <button
                  type="button"
                  style={{
                    ...styles.kindButton,
                    ...(productKind === 'MENU' ? styles.kindButtonActive : null)
                  }}
                  onClick={() => {
                    setProductKind('MENU')
                  }}
                >
                  메뉴
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.kindButton,
                    ...(productKind === 'PRODUCT' ? styles.kindButtonActive : null)
                  }}
                  onClick={() => {
                    setProductKind('PRODUCT')
                  }}
                >
                  상품
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.kindButton,
                    ...(productKind === 'SERVICE' ? styles.kindButtonActive : null)
                  }}
                  onClick={() => {
                    setProductKind('SERVICE')
                  }}
                >
                  서비스
                </button>
              </div>

              <label style={styles.label}>
                이름
                <input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value)
                  }}
                  placeholder="예: 피자, 김치찌개, 헤어 커트"
                  style={styles.input}
                />
              </label>

              <label style={styles.label}>
                가격
                <input
                  value={priceAmount}
                  onChange={(event) => {
                    setPriceAmount(event.target.value)
                  }}
                  placeholder="예: 18900"
                  inputMode="numeric"
                  style={styles.input}
                />
              </label>

              <label style={styles.label}>
                한 줄 설명
                <input
                  value={summary}
                  onChange={(event) => {
                    setSummary(event.target.value)
                  }}
                  placeholder="예: 치즈가 풍부한 대표 인기 메뉴입니다."
                  style={styles.input}
                />
              </label>

              <label style={styles.label}>
                상세 설명
                <textarea
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value)
                  }}
                  placeholder="상품 / 메뉴 / 서비스 상세 설명을 입력하세요."
                  style={styles.textarea}
                />
              </label>
            </section>

            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>
                  이미지
                </h2>

                <p style={styles.cardDesc}>
                  대표 이미지와 상세 이미지를 등록합니다. 현재는 UI 미리보기만 동작합니다.
                </p>
              </div>

              <div style={styles.imageGrid}>
                {images.map((image) => {
                  return (
                    <label
                      key={image.id}
                      style={styles.imageSlot}
                    >
                      {image.previewUrl ? (
                        <img
                          src={image.previewUrl}
                          alt={image.label}
                          style={styles.imagePreview}
                        />
                      ) : (
                        <span style={styles.imagePlaceholder}>
                          {image.label}
                        </span>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        style={styles.fileInput}
                        onChange={(event) => {
                          handleImagePreview(
                            image.id,
                            event.target.files?.[0] ?? null
                          )
                        }}
                      />
                    </label>
                  )
                })}
              </div>
            </section>

            <section style={styles.card}>
              <div style={styles.cardHeaderRow}>
                <div>
                  <h2 style={styles.cardTitle}>
                    옵션
                  </h2>

                  <p style={styles.cardDesc}>
                    사이즈, 토핑, 추가 서비스 같은 선택 항목을 구성합니다.
                  </p>
                </div>

                <button
                  type="button"
                  style={styles.smallDarkButton}
                  onClick={handleAddOptionGroup}
                >
                  옵션 그룹 추가
                </button>
              </div>

              <div style={styles.optionGroupList}>
                {optionGroups.map((group, groupIndex) => {
                  return (
                    <section
                      key={group.id}
                      style={styles.optionGroup}
                    >
                      <div style={styles.optionGroupHeader}>
                        <strong style={styles.optionGroupTitle}>
                          옵션 그룹 {groupIndex + 1}
                        </strong>

                        <button
                          type="button"
                          style={styles.textButton}
                          onClick={() => {
                            handleRemoveOptionGroup(group.id)
                          }}
                        >
                          삭제
                        </button>
                      </div>

                      <div style={styles.optionGrid}>
                        <label style={styles.label}>
                          그룹명
                          <input
                            value={group.name}
                            onChange={(event) => {
                              handleUpdateOptionGroup(group.id, {
                                name: event.target.value
                              })
                            }}
                            placeholder="예: 사이즈"
                            style={styles.input}
                          />
                        </label>

                        <label style={styles.label}>
                          선택 방식
                          <select
                            value={group.choiceType}
                            onChange={(event) => {
                              handleUpdateOptionGroup(group.id, {
                                choiceType: event.target.value as OptionChoiceType
                              })
                            }}
                            style={styles.select}
                          >
                            <option value="SINGLE">
                              단일 선택
                            </option>
                            <option value="MULTIPLE">
                              다중 선택
                            </option>
                          </select>
                        </label>

                        <label style={styles.checkLabel}>
                          <input
                            type="checkbox"
                            checked={group.required}
                            onChange={(event) => {
                              handleUpdateOptionGroup(group.id, {
                                required: event.target.checked
                              })
                            }}
                          />
                          필수 선택
                        </label>

                        <label style={styles.label}>
                          최소 선택
                          <input
                            value={group.minSelect}
                            onChange={(event) => {
                              handleUpdateOptionGroup(group.id, {
                                minSelect: event.target.value
                              })
                            }}
                            inputMode="numeric"
                            style={styles.input}
                          />
                        </label>

                        <label style={styles.label}>
                          최대 선택
                          <input
                            value={group.maxSelect}
                            onChange={(event) => {
                              handleUpdateOptionGroup(group.id, {
                                maxSelect: event.target.value
                              })
                            }}
                            inputMode="numeric"
                            style={styles.input}
                          />
                        </label>
                      </div>

                      <div style={styles.optionItemList}>
                        {group.items.map((item, itemIndex) => {
                          return (
                            <div
                              key={item.id}
                              style={styles.optionItem}
                            >
                              <span style={styles.optionNumber}>
                                {itemIndex + 1}
                              </span>

                              <input
                                value={item.name}
                                onChange={(event) => {
                                  handleUpdateOptionItem(group.id, item.id, {
                                    name: event.target.value
                                  })
                                }}
                                placeholder="옵션명"
                                style={styles.optionNameInput}
                              />

                              <input
                                value={item.priceDelta}
                                onChange={(event) => {
                                  handleUpdateOptionItem(group.id, item.id, {
                                    priceDelta: event.target.value
                                  })
                                }}
                                placeholder="추가금액"
                                inputMode="numeric"
                                style={styles.optionPriceInput}
                              />

                              <label style={styles.optionAvailableLabel}>
                                <input
                                  type="checkbox"
                                  checked={item.isAvailable}
                                  onChange={(event) => {
                                    handleUpdateOptionItem(group.id, item.id, {
                                      isAvailable: event.target.checked
                                    })
                                  }}
                                />
                                판매
                              </label>

                              <button
                                type="button"
                                style={styles.optionDeleteButton}
                                onClick={() => {
                                  handleRemoveOptionItem(group.id, item.id)
                                }}
                              >
                                ×
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      <button
                        type="button"
                        style={styles.addOptionItemButton}
                        onClick={() => {
                          handleAddOptionItem(group.id)
                        }}
                      >
                        옵션 항목 추가
                      </button>
                    </section>
                  )
                })}
              </div>
            </section>

            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>
                  판매 설정
                </h2>

                <p style={styles.cardDesc}>
                  주문 가능 여부와 노출 상태를 설정합니다.
                </p>
              </div>

              <div style={styles.settingGrid}>
                <label style={styles.label}>
                  판매 상태
                  <select
                    value={saleStatus}
                    onChange={(event) => {
                      setSaleStatus(event.target.value as SaleStatus)
                    }}
                    style={styles.select}
                  >
                    <option value="ACTIVE">
                      판매중
                    </option>
                    <option value="SOLD_OUT">
                      품절
                    </option>
                    <option value="HIDDEN">
                      비공개
                    </option>
                  </select>
                </label>

                <label style={styles.label}>
                  예상 소요 시간
                  <input
                    value={estimatedTime}
                    onChange={(event) => {
                      setEstimatedTime(event.target.value)
                    }}
                    placeholder="예: 20분, 1시간, 당일 가능"
                    style={styles.input}
                  />
                </label>

                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={isOrderable}
                    onChange={(event) => {
                      setIsOrderable(event.target.checked)
                    }}
                  />
                  주문 가능
                </label>

                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={isPickupAvailable}
                    onChange={(event) => {
                      setIsPickupAvailable(event.target.checked)
                    }}
                  />
                  포장 가능
                </label>

                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={isReservationAvailable}
                    onChange={(event) => {
                      setIsReservationAvailable(event.target.checked)
                    }}
                  />
                  예약 가능
                </label>
              </div>
            </section>

            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>
                  노출 설정
                </h2>

                <p style={styles.cardDesc}>
                  검색피드와 상품 카드에서 사용할 표시 옵션입니다.
                </p>
              </div>

              <div style={styles.badgeSettingGrid}>
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={isBest}
                    onChange={(event) => {
                      setIsBest(event.target.checked)
                    }}
                  />
                  BEST 표시
                </label>

                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(event) => {
                      setIsPopular(event.target.checked)
                    }}
                  />
                  인기 표시
                </label>

                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={isSearchVisible}
                    onChange={(event) => {
                      setIsSearchVisible(event.target.checked)
                    }}
                  />
                  검색 노출
                </label>
              </div>
            </section>
          </section>

          <aside style={styles.previewColumn}>
            <div style={styles.previewSticky}>
              <p style={styles.previewLabel}>
                미리보기
              </p>

              <div style={styles.previewCard}>
                <div style={styles.previewImage}>
                  {images[0]?.previewUrl ? (
                    <img
                      src={images[0].previewUrl}
                      alt="대표 이미지 미리보기"
                      style={styles.previewImageFile}
                    />
                  ) : (
                    <span style={styles.previewImageText}>
                      대표 이미지
                    </span>
                  )}
                </div>

                <div style={styles.previewBody}>
                  <div style={styles.previewBadgeRow}>
                    {isBest && (
                      <span style={styles.previewBadge}>
                        BEST
                      </span>
                    )}

                    {isPopular && (
                      <span style={styles.previewBadge}>
                        인기
                      </span>
                    )}

                    {isPickupAvailable && (
                      <span style={styles.previewBadge}>
                        포장 가능
                      </span>
                    )}
                  </div>

                  <p style={styles.previewCategory}>
                    {productKindLabel}
                  </p>

                  <h2 style={styles.previewTitle}>
                    {title || '상품명을 입력하세요'}
                  </h2>

                  <div style={styles.previewPriceRow}>
                    <strong style={styles.previewPrice}>
                      {previewPriceText}
                    </strong>

                    {isOrderable && saleStatus === 'ACTIVE' && (
                      <span style={styles.previewStatus}>
                        주문 가능
                      </span>
                    )}

                    {saleStatus === 'SOLD_OUT' && (
                      <span style={styles.previewStatusMuted}>
                        품절
                      </span>
                    )}

                    {saleStatus === 'HIDDEN' && (
                      <span style={styles.previewStatusMuted}>
                        비공개
                      </span>
                    )}
                  </div>

                  <p style={styles.previewSummary}>
                    {summary || '한 줄 설명이 표시됩니다.'}
                  </p>

                  <div style={styles.previewDivider} />

                  <p style={styles.previewSmallTitle}>
                    옵션
                  </p>

                  <div style={styles.previewOptionList}>
                    {optionGroups.map((group) => {
                      const groupName = group.name || '옵션 그룹'

                      return (
                        <div
                          key={group.id}
                          style={styles.previewOptionGroup}
                        >
                          <strong>
                            {groupName}
                          </strong>

                          <span>
                            {group.choiceType === 'SINGLE' ? '단일 선택' : '다중 선택'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div style={styles.previewNotice}>
                현재 화면은 UI 전용입니다. 실제 저장은 PRODUCT create API 연결 후 처리합니다.
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
  )
}

// SECTION 13 : STYLES
const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f3f4f6',
    color: '#111827',
    fontFamily:
      'Arial, Helvetica, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  shell: {
    width: '100%',
    maxWidth: 1180,
    margin: '0 auto',
    padding: '48px 24px 80px'
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 24,
    marginBottom: 28
  },
  eyebrow: {
    margin: '0 0 8px',
    color: '#6b7280',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '0.08em'
  },
  title: {
    margin: 0,
    color: '#111827',
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: '-0.05em',
    lineHeight: 1.18
  },
  description: {
    margin: '10px 0 0',
    color: '#6b7280',
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.6
  },
  headerActions: {
    display: 'flex',
    gap: 10,
    flexShrink: 0
  },
  ghostButton: {
    height: 42,
    padding: '0 18px',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    background: '#ffffff',
    color: '#111827',
    fontSize: 14,
    fontWeight: 900,
    cursor: 'pointer'
  },
  darkButton: {
    height: 42,
    padding: '0 20px',
    border: 'none',
    borderRadius: 10,
    background: '#111827',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 900,
    cursor: 'pointer'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 360px',
    gap: 24,
    alignItems: 'start'
  },
  formColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    minWidth: 0
  },
  previewColumn: {
    minWidth: 0
  },
  previewSticky: {
    position: 'sticky',
    top: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: 18,
    background: '#ffffff',
    padding: 22,
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)'
  },
  cardHeader: {
    marginBottom: 18
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18
  },
  cardTitle: {
    margin: 0,
    color: '#111827',
    fontSize: 19,
    fontWeight: 900,
    letterSpacing: '-0.03em'
  },
  cardDesc: {
    margin: '7px 0 0',
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 1.6,
    fontWeight: 600
  },
  kindGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 10,
    marginBottom: 18
  },
  kindButton: {
    height: 46,
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    background: '#ffffff',
    color: '#374151',
    fontSize: 15,
    fontWeight: 900,
    cursor: 'pointer'
  },
  kindButtonActive: {
    borderColor: '#111827',
    background: '#111827',
    color: '#ffffff'
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 14,
    color: '#374151',
    fontSize: 13,
    fontWeight: 900
  },
  input: {
    height: 44,
    padding: '0 13px',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    outline: 'none',
    background: '#ffffff',
    color: '#111827',
    fontSize: 14,
    fontWeight: 700
  },
  textarea: {
    minHeight: 132,
    padding: '13px',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    outline: 'none',
    resize: 'vertical',
    background: '#ffffff',
    color: '#111827',
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.6
  },
  select: {
    height: 44,
    padding: '0 13px',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    outline: 'none',
    background: '#ffffff',
    color: '#111827',
    fontSize: 14,
    fontWeight: 800
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12
  },
  imageSlot: {
    aspectRatio: '16 / 10',
    border: '1px dashed #d1d5db',
    borderRadius: 14,
    overflow: 'hidden',
    background: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative'
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  },
  imagePlaceholder: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: 900
  },
  fileInput: {
    display: 'none'
  },
  smallDarkButton: {
    height: 36,
    padding: '0 14px',
    border: 'none',
    borderRadius: 9,
    background: '#111827',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
    flexShrink: 0
  },
  optionGroupList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14
  },
  optionGroup: {
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    background: '#f9fafb',
    padding: 16
  },
  optionGroupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14
  },
  optionGroupTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: 900
  },
  textButton: {
    border: 'none',
    background: 'transparent',
    color: '#dc2626',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer'
  },
  optionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
    marginBottom: 14
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#374151',
    fontSize: 14,
    fontWeight: 900
  },
  optionItemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  optionItem: {
    display: 'grid',
    gridTemplateColumns: '32px minmax(0, 1fr) 120px 72px 36px',
    gap: 8,
    alignItems: 'center'
  },
  optionNumber: {
    width: 28,
    height: 28,
    borderRadius: 999,
    background: '#111827',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionNameInput: {
    height: 38,
    padding: '0 10px',
    border: '1px solid #d1d5db',
    borderRadius: 9,
    color: '#111827',
    fontSize: 13,
    fontWeight: 700
  },
  optionPriceInput: {
    height: 38,
    padding: '0 10px',
    border: '1px solid #d1d5db',
    borderRadius: 9,
    color: '#111827',
    fontSize: 13,
    fontWeight: 700
  },
  optionAvailableLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    color: '#374151',
    fontSize: 12,
    fontWeight: 900
  },
  optionDeleteButton: {
    width: 34,
    height: 34,
    border: '1px solid #e5e7eb',
    borderRadius: 9,
    background: '#ffffff',
    color: '#dc2626',
    fontSize: 18,
    fontWeight: 900,
    cursor: 'pointer'
  },
  addOptionItemButton: {
    height: 38,
    width: '100%',
    marginTop: 10,
    border: '1px solid #d1d5db',
    borderRadius: 9,
    background: '#ffffff',
    color: '#111827',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer'
  },
  settingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12
  },
  badgeSettingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12
  },
  previewLabel: {
    margin: 0,
    color: '#6b7280',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '0.08em'
  },
  previewCard: {
    border: '1px solid #e5e7eb',
    borderRadius: 18,
    background: '#ffffff',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
  },
  previewImage: {
    width: '100%',
    aspectRatio: '16 / 11',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewImageFile: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  },
  previewImageText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: 900
  },
  previewBody: {
    padding: 18
  },
  previewBadgeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10
  },
  previewBadge: {
    padding: '5px 8px',
    borderRadius: 999,
    background: '#f3f4f6',
    color: '#111827',
    fontSize: 11,
    fontWeight: 900
  },
  previewCategory: {
    margin: '0 0 6px',
    color: '#6b7280',
    fontSize: 13,
    fontWeight: 900
  },
  previewTitle: {
    margin: 0,
    color: '#111827',
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: '-0.04em'
  },
  previewPriceRow: {
    marginTop: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  previewPrice: {
    color: '#111827',
    fontSize: 22,
    fontWeight: 900
  },
  previewStatus: {
    padding: '6px 10px',
    borderRadius: 999,
    background: '#ecfdf3',
    color: '#15803d',
    fontSize: 12,
    fontWeight: 900
  },
  previewStatusMuted: {
    padding: '6px 10px',
    borderRadius: 999,
    background: '#f3f4f6',
    color: '#6b7280',
    fontSize: 12,
    fontWeight: 900
  },
  previewSummary: {
    margin: '12px 0 0',
    color: '#4b5563',
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.6
  },
  previewDivider: {
    height: 1,
    background: '#edf0f5',
    margin: '18px 0'
  },
  previewSmallTitle: {
    margin: '0 0 10px',
    color: '#111827',
    fontSize: 14,
    fontWeight: 900
  },
  previewOptionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  previewOptionGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    padding: '10px 12px',
    borderRadius: 10,
    background: '#f9fafb',
    color: '#374151',
    fontSize: 13,
    fontWeight: 800
  },
  previewNotice: {
    padding: 12,
    borderRadius: 12,
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    color: '#6b7280',
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.6
  }
}