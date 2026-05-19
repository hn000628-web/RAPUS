// FILE : frontend/app/(pos)/pos/settings/menu/create/page.tsx
// ROOT : frontend/app/(pos)/pos/settings/menu/create/page.tsx
// STATUS : MODIFY MODE
// ROLE : POS MENU / PRODUCT CREATE PAGE
// CHANGE SUMMARY :
// - 하드코딩 카테고리(main/sub/drink/side) 제거
// - getMe() + getPosProductCategories() 기반 DB 카테고리 select 연동
// - categoryId:number 상태 기반 선택/저장 구조로 변경
// - createPosMenu payload에 categoryId 전달
// - 로딩/저장/에러 상태 유지

'use client'

// SECTION 01 : IMPORT
import type { ChangeEvent } from 'react'
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  useRouter,
  useSearchParams
} from 'next/navigation'

import PosTopbar from '../../../components/PosTopbar'
import { usePosKeyboardMode } from '../../../components/PosKeyboardModeContext'
import styles from './PosMenuCreatePage.module.css'

import { getMe } from '@/lib/authApi'
import {
  createPosMenu,
  getPosMenuById,
  type PosMenuItem,
  updatePosMenu
} from '@/lib/business/pos/posMenuApi'
import {
  getPosProductCategories,
  type PosProductCategory
} from '@/lib/business/pos/posCategoriesApi'
import { uploadPosProductThumbnail } from '@/lib/business/mediaApi'
import { mediaUrl } from '@/lib/media'

// SECTION 02 : TYPE
type SaleStatus = 'ON' | 'OFF'

type ProfileContext = {
  profileId: number
  channelCode: string
}

type CategoryOption = {
  id: number
  code: string
  name: string
  displayName: string
  sortOrder: number
  isActive: boolean
  requiresAdultVerification: boolean
  ageRestrictionType: string | null
}

type OrderAvailabilityState = {
  allowNormalOrder: boolean
  allowReservationOrder: boolean
  allowDineIn: boolean
  allowPickup: boolean
  allowDelivery: boolean
}

const DEFAULT_ORDER_AVAILABILITY: OrderAvailabilityState = {
  allowNormalOrder: true,
  allowReservationOrder: false,
  allowDineIn: true,
  allowPickup: true,
  allowDelivery: true
}

type PreviewOption = {
  id: string
  enabled: boolean
  title: string
  priceText: string
  optionType: 'CUSTOM'
}

const DEFAULT_PREVIEW_OPTIONS: PreviewOption[] = []

type PreviewOptionUpdateKey =
  | 'title'
  | 'priceText'

type PreviewOptionUpdateValue = string

type PreviewOptionId = string

type PreviewOptionEnabled = boolean

type PreviewOptionType = 'CUSTOM'

type PreviewOptionDraft = {
  id: PreviewOptionId
  enabled: PreviewOptionEnabled
  title: string
  priceText: string
  optionType: PreviewOptionType
}

function normalizePreviewOptionPriceText(
  value: string
): string {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return '가격 미입력'
  }

  if (trimmedValue === '무료') {
    return '0원'
  }

  return trimmedValue
}

function getNextPreviewOptionId(
  options: PreviewOption[]
): string {
  return `custom-${options.length + 1}-${Date.now()}`
}

function updatePreviewOptionField(
  options: PreviewOption[],
  optionId: PreviewOptionId,
  key: PreviewOptionUpdateKey,
  value: PreviewOptionUpdateValue
): PreviewOption[] {
  return options.map((option) => {
    if (option.id !== optionId) {
      return option
    }

    return {
      ...option,
      [key]: value
    }
  })
}

function togglePreviewOptionField(
  options: PreviewOption[],
  optionId: PreviewOptionId
): PreviewOption[] {
  return options.map((option) => {
    if (option.id !== optionId) {
      return option
    }

    return {
      ...option,
      enabled: !option.enabled
    }
  })
}

function createEmptyPreviewOption(
  options: PreviewOption[]
): PreviewOptionDraft {
  return {
    id: getNextPreviewOptionId(options),
    enabled: false,
    title: '',
    priceText: '',
    optionType: 'CUSTOM'
  }
}

function resolvePreviewOptionTypeLabel(
  optionType: PreviewOptionType
): string {
  void optionType
  return '커스텀'
}

function resolvePreviewOptionTitle(
  title: string
): string {
  const trimmedTitle = title.trim()

  if (!trimmedTitle) {
    return '옵션명 미입력'
  }

  return trimmedTitle
}

function resolvePreviewOptionPrice(
  priceText: string
): string {
  return normalizePreviewOptionPriceText(priceText)
}

function isCustomPreviewOption(
  optionType: PreviewOptionType
): boolean {
  return optionType === 'CUSTOM'
}

function getPreviewOptionPlaceholderTitle(
  optionType: PreviewOptionType
): string {
  void optionType
  return '옵션명 입력'
}

function getPreviewOptionPlaceholderPrice(
  optionType: PreviewOptionType
): string {
  void optionType
  return '가격 입력'
}

function canEditPreviewOptionTitle(
  optionType: PreviewOptionType
): boolean {
  void optionType
  return isCustomPreviewOption(optionType)
}

function canEditPreviewOptionPrice(
  optionType: PreviewOptionType
): boolean {
  void optionType
  return isCustomPreviewOption(optionType)
}

type PreviewOptionRowProps = {
  option: PreviewOption
  onToggle: (optionId: PreviewOptionId) => void
  onTitleChange: (optionId: PreviewOptionId, value: string) => void
  onPriceChange: (optionId: PreviewOptionId, value: string) => void
}

function buildPreviewOptionRowProps(
  option: PreviewOption,
  onToggle: (optionId: PreviewOptionId) => void,
  onTitleChange: (optionId: PreviewOptionId, value: string) => void,
  onPriceChange: (optionId: PreviewOptionId, value: string) => void
): PreviewOptionRowProps {
  return {
    option,
    onToggle,
    onTitleChange,
    onPriceChange
  }
}

function handlePreviewOptionToggle(
  options: PreviewOption[],
  optionId: PreviewOptionId
): PreviewOption[] {
  return togglePreviewOptionField(options, optionId)
}

function handlePreviewOptionTextChange(
  options: PreviewOption[],
  optionId: PreviewOptionId,
  key: PreviewOptionUpdateKey,
  value: PreviewOptionUpdateValue
): PreviewOption[] {
  return updatePreviewOptionField(options, optionId, key, value)
}

function appendPreviewOption(
  options: PreviewOption[]
): PreviewOption[] {
  return [
    ...options,
    createEmptyPreviewOption(options)
  ]
}

function removePreviewOption(
  options: PreviewOption[],
  optionId: PreviewOptionId
): PreviewOption[] {
  return options.filter((option) => option.id !== optionId)
}

function formatPreviewOptionText(
  option: PreviewOption
): {
  title: string
  price: string
} {
  return {
    title: resolvePreviewOptionTitle(option.title),
    price: resolvePreviewOptionPrice(option.priceText)
  }
}

type PreviewOptionFormatted = {
  id: string
  label: string
  enabled: boolean
  optionTypeLabel: string
  priceLabel: string
}

function mapPreviewOptionsForView(
  options: PreviewOption[]
): PreviewOptionFormatted[] {
  return options.map((option) => {
    const formattedOption = formatPreviewOptionText(option)

    return {
      id: option.id,
      label: formattedOption.title,
      enabled: option.enabled,
      optionTypeLabel: resolvePreviewOptionTypeLabel(option.optionType),
      priceLabel: formattedOption.price
    }
  })
}

// SECTION 03 : UTIL
function getErrorMessage(
  error: unknown,
  fallbackMessage: string
) {
  if (error instanceof Error) {
    return error.message
  }

  return fallbackMessage
}

function normalizeCategoryRows(
  rows: PosProductCategory[]
): CategoryOption[] {
  return [...rows]
    .filter((row) => {
      const isActive =
        Number(row.isActive || 0) === 1

      return isActive
    })
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    .map((row) => {
      const name =
        String(row.categoryName || '').trim() || '새 카테고리'
      const requiresAdultVerification =
        Number(row.requiresAdultVerification || 0) === 1 ||
        String(row.ageRestrictionType || '').trim() === 'ADULT_19'

      return {
        id: Number(row.id),
        code: String(row.categoryCode || '').trim() || 'CUSTOM',
        name,
        displayName: requiresAdultVerification ? `${name}(성인인증)` : name,
        sortOrder: Number(row.sortOrder || 0),
        isActive: Number(row.isActive || 0) === 1,
        requiresAdultVerification,
        ageRestrictionType: row.ageRestrictionType ?? null
      }
    })
    .filter((row) => row.id > 0)
}

function parsePriceInput(
  value: string
): string {
  return value.replace(/[^\d]/g, '')
}

function formatPriceInput(
  value: string
): string {
  const numericText =
    parsePriceInput(value)

  if (!numericText) {
    return ''
  }

  return Number(numericText).toLocaleString('ko-KR')
}

function mapMenuOptionsToPreviewOptions(
  options: PosMenuItem['options']
): PreviewOption[] {
  if (!Array.isArray(options) || options.length < 1) {
    return []
  }

  const rows = options
    .flatMap((group) => {
      const groupValues = Array.isArray(group.values) ? group.values : []

      return groupValues.map((value, index) => {
        const title = String(value.optionValueName || '').trim()
        const priceDelta = Number(value.priceDelta || 0)

        return {
          id: `opt-${group.id ?? 'group'}-${value.id ?? index}`,
          enabled: Boolean(value.isVisible ?? value.isActive ?? true),
          title,
          priceText:
            priceDelta > 0
              ? `${priceDelta.toLocaleString('ko-KR')}원`
              : '0원',
          optionType: 'CUSTOM'
        } as PreviewOption
      })
    })
    .filter((option) => option.title.length > 0)

  return rows
}

// SECTION 04 : COMPONENT
function PosMenuCreatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()

  const mode = searchParams.get('mode')
  const menuIdParam = searchParams.get('menuId')
  const isEditMode = mode === 'edit'
  const menuId = Number(menuIdParam || 0)

  const [context, setContext] = useState<ProfileContext | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const [productName, setProductName] = useState('')
  const [priceText, setPriceText] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number>(0)
  const [saleStatus, setSaleStatus] = useState<SaleStatus>('ON')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isVisibleOnTable, setIsVisibleOnTable] = useState(true)
  const [previewOptions, setPreviewOptions] = useState<PreviewOption[]>(DEFAULT_PREVIEW_OPTIONS)
  const [orderAvailability, setOrderAvailability] = useState<OrderAvailabilityState>(DEFAULT_ORDER_AVAILABILITY)
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailFileName, setThumbnailFileName] = useState('')
  const [thumbnailImageAssetId, setThumbnailImageAssetId] = useState<number | null>(null)
  const [previewThumbnailUrl, setPreviewThumbnailUrl] = useState('')
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false)

  // SECTION 05 : EFFECT
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const me = await getMe()
        const profileId = Number(me?.user?.profileId || 0)
        const channelCode = String(me?.user?.channelCode || '').trim()
        const profileType = String(me?.user?.profileType || '')

        if (!profileId || !channelCode || profileType !== 'BUSINESS') {
          throw new Error('프로필 컨텍스트를 확인할 수 없습니다.')
        }

        setContext({
          profileId,
          channelCode
        })
        const categoryResponse = await getPosProductCategories()

        const normalizedCategories = normalizeCategoryRows(categoryResponse.categories)

        setCategories(normalizedCategories)

        if (isEditMode) {
          if (!menuId || Number.isNaN(menuId) || menuId <= 0) {
            throw new Error('수정할 메뉴 정보를 확인할 수 없습니다.')
          }

          try {
            const menuResponse = await getPosMenuById(menuId, {
              profileId,
              channelCode
            })
            const item = menuResponse?.item

            if (!item) {
              throw new Error('수정할 메뉴 정보를 불러오지 못했습니다.')
            }

            setProductName(String(item.productName || ''))
            setPriceText(parsePriceInput(String(item.basePrice || 0)))
            setProductDescription(String(item.productDescription || ''))
            setCategoryId(Number(item.categoryId || 0))
            setSaleStatus(item.saleStatus === 'OFF' ? 'OFF' : 'ON')
            setIsVisibleOnTable(Boolean(item.isActive))
            setIsFeatured(Boolean(item.isRepresentative))
            setOrderAvailability({
              allowNormalOrder: Boolean(item.allowNormalOrder ?? true),
              allowReservationOrder: Boolean(item.allowReservationOrder ?? false),
              allowDineIn: Boolean(item.allowDineIn ?? true),
              allowPickup: Boolean(item.allowTakeout ?? true),
              allowDelivery: Boolean(item.allowDelivery ?? true)
            })
            setThumbnailFile(null)
            setThumbnailFileName(String(item.thumbnail?.fileName || ''))
            setThumbnailImageAssetId(
              item.thumbnail?.imageAssetId
                ? Number(item.thumbnail.imageAssetId)
                : null
            )
            setPreviewThumbnailUrl(mediaUrl(item.thumbnail?.filePath))

            const nextPreviewOptions =
              mapMenuOptionsToPreviewOptions(item.options)

            setPreviewOptions(nextPreviewOptions)
          } catch (error) {
            console.error('POS 메뉴 수정 데이터 로딩 오류', error)
            throw new Error('수정할 메뉴 정보를 불러오지 못했습니다.')
          }
        } else if (normalizedCategories.length > 0) {
          setCategoryId(normalizedCategories[0].id)
          setPreviewOptions(DEFAULT_PREVIEW_OPTIONS)
          setOrderAvailability(DEFAULT_ORDER_AVAILABILITY)
          setThumbnailFile(null)
          setThumbnailFileName('')
          setThumbnailImageAssetId(null)
          setPreviewThumbnailUrl('')
        }
      } catch (error) {
        console.error('POS 메뉴 등록 초기화 오류', error)
        setContext(null)
        setCategories([])
        setErrorMessage(
          getErrorMessage(
            error,
            '메뉴 등록 정보를 불러오지 못했습니다.'
          )
        )
      } finally {
        setIsLoading(false)
      }
    }

    void init()
  }, [isEditMode, menuId, mode])

  useEffect(() => {
    if (!thumbnailFile) {
      return
    }

    const objectUrl = URL.createObjectURL(thumbnailFile)
    setPreviewThumbnailUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [thumbnailFile])

  // SECTION 06 : ROUTE EVENT
  const handleGoPos = () => {
    router.push('/pos')
  }

  const handleGoMyPage = () => {
    router.push('/profile')
  }

  const handleSettingsClick = () => {
    router.push('/pos/settings')
  }

  const handleGoMenuSettings = () => {
    router.push('/pos/settings/menu')
  }

  // SECTION 07 : DERIVED STATE
  const priceValue = useMemo(() => {
    const numeric = Number.parseInt(
      parsePriceInput(priceText),
      10
    )

    if (!Number.isFinite(numeric) || numeric < 0) {
      return 0
    }

    return numeric
  }, [priceText])

  const formattedPriceText = useMemo(
    () => formatPriceInput(priceText),
    [priceText]
  )

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === categoryId) ?? null,
    [categories, categoryId]
  )

  const previewName =
    productName.trim().length > 0
      ? productName
      : '상품명 미입력'

  const previewDescription =
    productDescription.trim().length > 0
      ? productDescription
      : '설명 없음'

  const previewPriceText = `${priceValue.toLocaleString('ko-KR')}원`
  const previewCategory = selectedCategory?.displayName ?? '미선택'
  const previewSaleStatusText = saleStatus === 'ON' ? '판매중' : '판매중지'
  const previewVisibleText = isVisibleOnTable ? '노출' : '숨김'
  const previewOptionItems = useMemo(
    () => mapPreviewOptionsForView(previewOptions),
    [previewOptions]
  )

  const handleOptionToggle = (optionId: string) => {
    setPreviewOptions((prev) => handlePreviewOptionToggle(prev, optionId))
  }

  const handleOptionTitleChange = (optionId: string, value: string) => {
    setPreviewOptions((prev) =>
      handlePreviewOptionTextChange(prev, optionId, 'title', value)
    )
  }

  const handleOptionPriceChange = (optionId: string, value: string) => {
    setPreviewOptions((prev) =>
      handlePreviewOptionTextChange(prev, optionId, 'priceText', value)
    )
  }

  const handleAddOption = () => {
    setPreviewOptions((prev) => appendPreviewOption(prev))
  }

  const handleRemoveOption = (optionId: string) => {
    setPreviewOptions((prev) => removePreviewOption(prev, optionId))
  }

  const handleThumbnailButtonClick = () => {
    thumbnailInputRef.current?.click()
  }

  const handlePreviewThumbnailClick = () => {
    if (!previewThumbnailUrl) {
      return
    }

    setIsThumbnailModalOpen(true)
  }

  const handleCloseThumbnailModal = () => {
    setIsThumbnailModalOpen(false)
  }

  const handleThumbnailFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    setThumbnailFile(file ?? null)
    setThumbnailFileName(file?.name ?? '')
    setThumbnailImageAssetId(null)
  }

  const availableOrderTimings = useMemo(() => {
    const items: string[] = []
    if (orderAvailability.allowNormalOrder) {
      items.push('일반주문')
    }
    if (orderAvailability.allowReservationOrder) {
      items.push('예약주문')
    }
    return items
  }, [orderAvailability.allowNormalOrder, orderAvailability.allowReservationOrder])

  const availableOrderModes = useMemo(() => {
    const items: string[] = []
    if (orderAvailability.allowDineIn) {
      items.push('매장이용')
    }
    if (orderAvailability.allowPickup) {
      items.push('픽업포장')
    }
    if (orderAvailability.allowDelivery) {
      items.push('배달')
    }
    return items
  }, [orderAvailability.allowDineIn, orderAvailability.allowPickup, orderAvailability.allowDelivery])

  // SECTION 08 : SAVE EVENT
  const handleSave = async () => {
    if (isSaving) {
      return
    }

    if (!context?.profileId || !context?.channelCode) {
      const message = '프로필 컨텍스트를 확인할 수 없습니다.'
      setErrorMessage(message)
      window.alert(message)
      return
    }

    const trimmedProductName = productName.trim()

    if (!trimmedProductName) {
      const message = '상품명을 입력하세요.'
      setErrorMessage(message)
      window.alert(message)
      return
    }

    if (!categoryId) {
      const message = '카테고리를 선택하세요.'
      setErrorMessage(message)
      window.alert(message)
      return
    }

    if (!selectedCategory) {
      const message = '선택한 카테고리를 확인할 수 없습니다.'
      setErrorMessage(message)
      window.alert(message)
      return
    }

    if (priceValue < 0) {
      const message = '가격은 0원 이상이어야 합니다.'
      setErrorMessage(message)
      window.alert(message)
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage('')

      let nextThumbnailImageAssetId = thumbnailImageAssetId

      if (thumbnailFile) {
        const uploadResult = await uploadPosProductThumbnail(
          thumbnailFile,
          {
            channelCode: context.channelCode
          }
        )

        nextThumbnailImageAssetId = uploadResult.assetId
        setThumbnailImageAssetId(uploadResult.assetId)
        setThumbnailFileName(uploadResult.fileName)
        setPreviewThumbnailUrl(mediaUrl(uploadResult.filePath))
        setThumbnailFile(null)
      }

      const previewOptionsPayload = previewOptions
        .map((option) => ({
          title: String(option.title ?? '').trim(),
          priceText: String(option.priceText ?? '').trim(),
          enabled: option.enabled,
          optionValueType: option.optionType
        }))
        .filter((option) => option.title.length > 0)

      const payload = {
        profileId: context.profileId,
        channelCode: context.channelCode,
        categoryId,
        productName: trimmedProductName,
        productDescription: productDescription.trim() || null,
        basePrice: priceValue,
        saleStatus,
        isActive: isVisibleOnTable && saleStatus === 'ON',
        isSoldOut: saleStatus === 'OFF',
        isRepresentative: isFeatured,
        showOnTableOrder: isVisibleOnTable,
        allowNormalOrder: orderAvailability.allowNormalOrder,
        allowReservationOrder: orderAvailability.allowReservationOrder,
        allowDineIn: orderAvailability.allowDineIn,
        allowTakeout: orderAvailability.allowPickup,
        allowDelivery: orderAvailability.allowDelivery,
        thumbnailImageAssetId: nextThumbnailImageAssetId ?? undefined,
        options: previewOptionsPayload.length > 0 ? previewOptionsPayload : [],
        sortOrder: 0
      }

      if (isEditMode) {
        if (!menuId || Number.isNaN(menuId) || menuId <= 0) {
          throw new Error('수정할 메뉴 정보를 확인할 수 없습니다.')
        }

        await updatePosMenu(menuId, payload as any)
        window.alert('POS 메뉴 / 상품이 수정되었습니다.')
      } else {
        await createPosMenu(payload as any)
        window.alert('POS 메뉴 / 상품이 저장되었습니다.')
      }

      router.push('/pos/settings/menu')
    } catch (error) {
      const message = getErrorMessage(error, '메뉴 저장 중 오류가 발생했습니다.')
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSaving(false)
    }
  }

  // SECTION 09 : RETURN
  return (
    <div className={styles.page}>
      <div className={styles.topbarWrap}>
        <div className={styles.topbarInner}>
          <PosTopbar
            title="메뉴 / 상품 설정"
            onHomeClick={handleGoPos}
            onSettingsClick={handleSettingsClick}
            onMyPageClick={handleGoMyPage}
            syncStatus="ONLINE"
            homeShortcutLabel="F1"
            keyboardMode={keyboardMode}
            onToggleKeyboardMode={toggleKeyboardMode}
          />
        </div>
      </div>

      <main className={styles.content}>
        <section className={styles.headerCard}>
          <div className={styles.titleWrap}>
            <h1 className={styles.title}>
              {isEditMode ? 'POS 메뉴 / 상품 수정' : 'POS 메뉴 / 상품 등록'}
            </h1>
            <p className={styles.description}>
              {isEditMode
                ? '등록된 POS 메뉴와 상품 정보를 수정합니다.'
                : '테이블 주문 화면에 표시할 메뉴와 상품을 등록합니다.'}
            </p>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleGoMenuSettings}
              disabled={isSaving}
            >
              뒤로가기
            </button>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleGoMenuSettings}
              disabled={isSaving}
            >
              메뉴 / 상품 설정
            </button>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSave}
              disabled={isLoading || isSaving || categories.length < 1 || (isEditMode && Boolean(errorMessage))}
            >
              {isSaving ? '저장 중...' : isEditMode ? '수정 저장' : '저장'}
            </button>
          </div>
        </section>

        {isLoading && (
          <section className={styles.headerCard}>
            <p className={styles.description}>
              카테고리 정보를 불러오는 중입니다.
            </p>
          </section>
        )}

        {!isLoading && errorMessage ? (
          <section className={styles.headerCard}>
            <p className={styles.description}>
              {errorMessage}
            </p>
          </section>
        ) : null}

        <section className={styles.grid}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>메뉴 / 상품 입력</h2>

              <div className={styles.thumbnailActionGroup}>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className={styles.hiddenFileInput}
                  onChange={handleThumbnailFileChange}
                  disabled={isLoading || isSaving}
                />

                {thumbnailFileName ? (
                  <span className={styles.thumbnailFileName}>
                    {thumbnailFileName}
                  </span>
                ) : null}

                <button
                  type="button"
                  className={styles.thumbnailButton}
                  onClick={handleThumbnailButtonClick}
                  disabled={isLoading || isSaving}
                >
                  썸네일 추가
                </button>
              </div>
            </div>

            <div className={styles.formGrid}>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span className={styles.label}>카테고리 선택</span>
                <select
                  className={styles.select}
                  value={categoryId}
                  onChange={(event) => setCategoryId(Number(event.target.value))}
                  disabled={isLoading || isSaving || categories.length < 1}
                >
                  <option value={0}>미선택</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>상품명</span>
                <input
                  className={styles.input}
                  type="text"
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  placeholder="예: 클래식 버거"
                  disabled={isLoading || isSaving}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>가격</span>
                <input
                  className={styles.input}
                  type="text"
                  inputMode="numeric"
                  value={formattedPriceText}
                  onChange={(event) =>
                    setPriceText(parsePriceInput(event.target.value))
                  }
                  placeholder="예: 8,900"
                  disabled={isLoading || isSaving}
                />
              </label>

              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span className={styles.label}>상품 설명</span>
                <textarea
                  className={styles.textarea}
                  value={productDescription}
                  onChange={(event) => setProductDescription(event.target.value)}
                  placeholder="예: 대표 인기 메뉴"
                  disabled={isLoading || isSaving}
                />
              </label>

              <div className={styles.field}>
                <span className={styles.label}>판매 상태</span>
                <div className={styles.radioRow}>
                  <label>
                    <input
                      type="radio"
                      name="saleStatus"
                      value="ON"
                      checked={saleStatus === 'ON'}
                      onChange={() => setSaleStatus('ON')}
                      disabled={isLoading || isSaving}
                    />
                    판매중
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="saleStatus"
                      value="OFF"
                      checked={saleStatus === 'OFF'}
                      onChange={() => setSaleStatus('OFF')}
                      disabled={isLoading || isSaving}
                    />
                    판매중지
                  </label>
                </div>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>대표 메뉴 여부</span>
                <div className={styles.checkRow}>
                  <label>
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(event) => setIsFeatured(event.target.checked)}
                      disabled={isLoading || isSaving}
                    />
                    대표 메뉴로 설정
                  </label>
                </div>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>테이블 주문 노출 여부</span>
                <div className={styles.checkRow}>
                  <label>
                    <input
                      type="checkbox"
                      checked={isVisibleOnTable}
                      onChange={(event) => setIsVisibleOnTable(event.target.checked)}
                      disabled={isLoading || isSaving}
                    />
                    테이블 주문에 노출
                  </label>
                </div>
              </div>

              <section className={`${styles.field} ${styles.fieldWide}`}>
                <div className={styles.optionSectionHeader}>
                  <span className={styles.label}>주문 가능 설정</span>
                  <p className={styles.optionHelpText}>
                    메뉴별 주문 가능 시점과 주문 방식을 설정합니다.
                  </p>
                </div>

                <div className={styles.orderAvailabilityBox}>
                  <div className={styles.orderAvailabilityGroup}>
                    <p className={styles.orderAvailabilityTitle}>주문 시점 설정</p>
                    <label className={styles.orderAvailabilityItem}>
                      <input
                        type="checkbox"
                        checked={orderAvailability.allowNormalOrder}
                        onChange={(event) =>
                          setOrderAvailability((prev) => ({
                            ...prev,
                            allowNormalOrder: event.target.checked
                          }))
                        }
                        disabled={isLoading || isSaving}
                      />
                      일반주문 가능
                    </label>
                    <label className={styles.orderAvailabilityItem}>
                      <input
                        type="checkbox"
                        checked={orderAvailability.allowReservationOrder}
                        onChange={(event) =>
                          setOrderAvailability((prev) => ({
                            ...prev,
                            allowReservationOrder: event.target.checked
                          }))
                        }
                        disabled={isLoading || isSaving}
                      />
                      예약주문 가능
                    </label>
                  </div>

                  <div className={styles.orderAvailabilityGroup}>
                    <p className={styles.orderAvailabilityTitle}>주문 방식 설정</p>
                    <label className={styles.orderAvailabilityItem}>
                      <input
                        type="checkbox"
                        checked={orderAvailability.allowDineIn}
                        onChange={(event) =>
                          setOrderAvailability((prev) => ({
                            ...prev,
                            allowDineIn: event.target.checked
                          }))
                        }
                        disabled={isLoading || isSaving}
                      />
                      매장이용
                    </label>
                    <label className={styles.orderAvailabilityItem}>
                      <input
                        type="checkbox"
                        checked={orderAvailability.allowPickup}
                        onChange={(event) =>
                          setOrderAvailability((prev) => ({
                            ...prev,
                            allowPickup: event.target.checked
                          }))
                        }
                        disabled={isLoading || isSaving}
                      />
                      픽업/포장
                    </label>
                    <label className={styles.orderAvailabilityItem}>
                      <input
                        type="checkbox"
                        checked={orderAvailability.allowDelivery}
                        onChange={(event) =>
                          setOrderAvailability((prev) => ({
                            ...prev,
                            allowDelivery: event.target.checked
                          }))
                        }
                        disabled={isLoading || isSaving}
                      />
                      배달
                    </label>
                  </div>
                </div>
              </section>

              <section className={`${styles.field} ${styles.fieldWide}`}>
                <div className={styles.optionSectionHeader}>
                  <span className={styles.label}>옵션 설정</span>
                  <p className={styles.optionHelpText}>
                    사용자 주문 화면에 표시될 선택 옵션을 설정합니다.
                  </p>
                </div>

                <div className={styles.optionRows}>
                  {previewOptions.map((option) => {
                    const rowProps = buildPreviewOptionRowProps(
                      option,
                      handleOptionToggle,
                      handleOptionTitleChange,
                      handleOptionPriceChange
                    )

                    const optionTypeLabel = resolvePreviewOptionTypeLabel(option.optionType)
                    const titlePlaceholder = getPreviewOptionPlaceholderTitle(option.optionType)
                    const pricePlaceholder = getPreviewOptionPlaceholderPrice(option.optionType)
                    const titleDisabled = !canEditPreviewOptionTitle(option.optionType)
                    const priceDisabled = !canEditPreviewOptionPrice(option.optionType)
                    const isCustomOption = isCustomPreviewOption(option.optionType)

                    return (
                      <div key={rowProps.option.id} className={styles.optionRow}>
                        <label className={styles.optionCheckLabel}>
                          <input
                            type="checkbox"
                            checked={rowProps.option.enabled}
                            onChange={() => rowProps.onToggle(rowProps.option.id)}
                            disabled={isLoading || isSaving}
                          />
                        </label>

                        <span className={styles.optionTypeBadge}>
                          {optionTypeLabel}
                        </span>

                        <input
                          className={styles.optionInput}
                          type="text"
                          value={rowProps.option.title}
                          onChange={(event) =>
                            rowProps.onTitleChange(rowProps.option.id, event.target.value)
                          }
                          placeholder={titlePlaceholder}
                          disabled={isLoading || isSaving || titleDisabled}
                        />

                        <input
                          className={styles.optionPriceInput}
                          type="text"
                          value={rowProps.option.priceText}
                          onChange={(event) =>
                            rowProps.onPriceChange(rowProps.option.id, event.target.value)
                          }
                          placeholder={pricePlaceholder}
                          disabled={isLoading || isSaving || priceDisabled}
                        />

                        {isCustomOption ? (
                          <button
                            type="button"
                            className={styles.optionDeleteButton}
                            onClick={() => handleRemoveOption(rowProps.option.id)}
                            disabled={isLoading || isSaving}
                          >
                            삭제
                          </button>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  className={styles.addOptionButton}
                  onClick={handleAddOption}
                  disabled={isLoading || isSaving}
                >
                  + 옵션 추가
                </button>
              </section>
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>사용자 주문 화면 미리보기</h2>

            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <button
                  type="button"
                  className={`${styles.previewThumbnailBox} ${
                    previewThumbnailUrl
                      ? styles.previewThumbnailClickable
                      : styles.previewThumbnailDisabled
                  }`}
                  onClick={handlePreviewThumbnailClick}
                  disabled={!previewThumbnailUrl}
                  aria-label="썸네일 이미지 크게 보기"
                >
                  {previewThumbnailUrl ? (
                    <img
                      src={previewThumbnailUrl}
                      alt="상품 썸네일 미리보기"
                      className={styles.previewThumbnailImage}
                    />
                  ) : (
                    <span className={styles.previewThumbnailPlaceholder}>
                      썸네일 사진
                    </span>
                  )}
                </button>

                <div className={styles.previewMetaStack}>
                  <p className={styles.previewMeta}>
                    카테고리: {previewCategory}
                  </p>
                  <p className={styles.previewMeta}>
                    상태: {previewSaleStatusText}
                  </p>
                  <p className={styles.previewMeta}>
                    노출 여부: {previewVisibleText}
                  </p>
                  <p className={styles.previewMeta}>
                    대표 메뉴 여부: {isFeatured ? '대표 메뉴' : '일반 메뉴'}
                  </p>
                </div>
              </div>

              <section className={styles.previewSection}>
                <h3 className={styles.previewSectionTitle}>1. 메뉴 선택</h3>

                <div className={styles.previewMenuCard}>
                  <div className={styles.previewTop}>
                    <h4 className={styles.previewName}>{previewName}</h4>
                    <p className={styles.previewPrice}>{previewPriceText}</p>
                  </div>

                  <p className={styles.previewDescription}>
                    {previewDescription}
                  </p>

                  <div className={styles.previewStateRow}>
                    <span className={styles.previewBadge}>
                      {previewCategory}
                    </span>

                    <span
                      className={`${styles.previewBadge} ${
                        saleStatus === 'ON'
                          ? styles.previewStatusOn
                          : styles.previewStatusOff
                      }`}
                    >
                      {previewSaleStatusText}
                    </span>

                    <span className={styles.previewBadge}>
                      {previewVisibleText}
                    </span>
                  </div>

                  <div className={styles.previewAvailabilityArea}>
                    <p className={styles.previewAvailabilityTitle}>주문 가능</p>
                    <div className={styles.previewAvailabilityBadges}>
                      {availableOrderTimings.length > 0 ? (
                        availableOrderTimings.map((item) => (
                          <span key={item} className={styles.previewBadge}>
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className={styles.previewEmptyText}>설정된 주문 시점 없음</span>
                      )}
                    </div>

                    <p className={styles.previewAvailabilityTitle}>주문 방식</p>
                    <div className={styles.previewAvailabilityBadges}>
                      {availableOrderModes.length > 0 ? (
                        availableOrderModes.map((item) => (
                          <span key={item} className={styles.previewBadge}>
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className={styles.previewEmptyText}>설정된 주문 방식 없음</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className={styles.previewSection}>
                <h3 className={styles.previewSectionTitle}>2. 수량 선택</h3>

                <div className={styles.previewQuantityCard}>
                  <div className={styles.previewTop}>
                    <p className={styles.previewQuantityName}>{previewName}</p>
                    <p className={styles.previewPrice}>{previewPriceText}</p>
                  </div>

                  <div className={styles.quantityRow}>
                    <button
                      type="button"
                      className={styles.stepButton}
                      disabled
                    >
                      -
                    </button>

                    <strong className={styles.quantityValue}>1</strong>

                    <button
                      type="button"
                      className={styles.stepButton}
                      disabled
                    >
                      +
                    </button>
                  </div>
                </div>
              </section>

              <section className={styles.previewSection}>
                <h3 className={styles.previewSectionTitle}>3. 옵션 선택</h3>

                <div className={styles.previewOptionList}>
                  {previewOptionItems.map((option) => (
                    <label key={option.id} className={styles.previewOptionCard}>
                      <span className={styles.previewOptionLeft}>
                        <input
                          type="checkbox"
                          checked={option.enabled}
                          readOnly
                        />
                        <span className={styles.previewOptionTypeTag}>
                          {option.optionTypeLabel}
                        </span>
                        <span className={styles.previewOptionLabel}>{option.label}</span>
                      </span>
                      <span className={styles.previewOptionPrice}>{option.priceLabel}</span>
                    </label>
                  ))}
                </div>
              </section>

              <p className={styles.previewNotice}>
                일반주문은 즉시 주문, 예약주문은 미리 주문 또는 다음 일정 주문으로 진행됩니다.
              </p>
            </div>
          </article>
        </section>

        {isThumbnailModalOpen && previewThumbnailUrl ? (
          <div className={styles.thumbnailModalOverlay} onClick={handleCloseThumbnailModal}>
            <div className={styles.thumbnailModalCard} onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className={styles.thumbnailModalCloseButton}
                onClick={handleCloseThumbnailModal}
                aria-label="썸네일 모달 닫기"
              >
                닫기
              </button>
              <img
                src={previewThumbnailUrl}
                alt="상품 썸네일 원본 보기"
                className={styles.thumbnailModalImage}
              />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default function PosMenuCreatePage() {
  return (
    <Suspense fallback={<div>메뉴 등록 화면을 불러오는 중입니다.</div>}>
      <PosMenuCreatePageContent />
    </Suspense>
  )
}
