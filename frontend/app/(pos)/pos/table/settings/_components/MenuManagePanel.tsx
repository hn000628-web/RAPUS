// FILE : frontend/app/(pos)/pos/table/settings/_components/MenuManagePanel.tsx
// ROOT : frontend/app/(pos)/pos/table/settings/_components/MenuManagePanel.tsx
// STATUS : MODIFY
// ROLE : POS TABLE SETTINGS MENU PANEL

'use client'

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import BaseModal from '@/components/ui/modal/BaseModal'
import { getMe } from '@/lib/authApi'
import {
  getPosProductCategories,
  type PosProductCategory
} from '@/lib/business/pos/posCategoriesApi'
import {
  createPosMenu,
  type CreatePosMenuInput,
  deletePosMenu,
  getPosMenus,
  type PosMenuContext,
  type PosMenuItem,
  type PosMenuOptionGroup,
  type PosMenuOptionValue,
  updatePosMenu
} from '@/lib/business/pos/posMenuApi'
import { uploadPosProductThumbnail } from '@/lib/business/mediaApi'
import {
  emitPosTableSettingsSync,
  subscribePosTableSettingsSync
} from '@/lib/business/pos/shared/posTableSettingsRuntimeSync'
import { mediaUrl } from '@/lib/media'

import styles from '../PosTableSettingsPage.module.css'

type MenuManagePanelProps = {
  onCreateActionChange?: (action: (() => void) | null) => void
  hideCreateButton?: boolean
}

type MenuFilter = 'ALL' | 'ON_SALE' | 'STOPPED' | 'HIDDEN'

type MenuCreatePreviewOption = {
  id: string
  enabled: boolean
  title: string
  priceText: string
  optionType: 'CUSTOM'
}

type MenuCreateMockForm = {
  menuName: string
  categoryId: number
  basePrice: string
  dailySalesLimit: string
  description: string
  menuStatus: 'ON_SALE' | 'STOPPED'
  isSoldOut: boolean
  isRepresentative: boolean
  showOnTableOrder: boolean
  allowNormalOrder: boolean
  allowReservationOrder: boolean
  allowDineIn: boolean
  allowTakeout: boolean
  allowDelivery: boolean
  thumbnailMockLabel: string
  options: MenuCreatePreviewOption[]
}

type MenuCreateTextField =
  | 'menuName'
  | 'basePrice'
  | 'dailySalesLimit'
  | 'description'

type MenuCreateOptionUpdateKey =
  | 'title'
  | 'priceText'

let optionLocalSequence = 0

function createOptionLocalId(): string {
  optionLocalSequence += 1
  return `custom-${optionLocalSequence}-${Date.now()}`
}

function createEmptyPreviewOption(): MenuCreatePreviewOption {
  return {
    id: createOptionLocalId(),
    enabled: false,
    title: '',
    priceText: '',
    optionType: 'CUSTOM'
  }
}

function createInitialMenuCreateForm(): MenuCreateMockForm {
  return {
    menuName: '',
    categoryId: 0,
    basePrice: '',
    dailySalesLimit: '',
    description: '',
    menuStatus: 'ON_SALE',
    isSoldOut: false,
    isRepresentative: false,
    showOnTableOrder: true,
    allowNormalOrder: true,
    allowReservationOrder: false,
    allowDineIn: true,
    allowTakeout: true,
    allowDelivery: true,
    thumbnailMockLabel: '',
    options: []
  }
}

function mapMenuItemOptionsToFormOptions(
  item: PosMenuItem
): MenuCreatePreviewOption[] {
  return (item.options ?? []).flatMap((group) =>
    (group.values ?? []).map((value) => ({
      id: createOptionLocalId(),
      enabled: Boolean(value.isActive ?? true),
      title: value.optionValueName ?? '',
      priceText:
        Number(value.priceDelta ?? 0) > 0
          ? String(value.priceDelta)
          : '',
      optionType: 'CUSTOM' as const
    }))
  )
}

function mapMenuItemToForm(
  item: PosMenuItem
): MenuCreateMockForm {
  return {
    menuName: item.productName ?? '',
    categoryId: item.categoryId ?? 0,
    basePrice: String(item.basePrice ?? ''),
    dailySalesLimit:
      item.dailySalesLimit === null || item.dailySalesLimit === undefined
        ? ''
        : String(item.dailySalesLimit),
    description: item.productDescription ?? '',
    menuStatus: item.menuStatus ?? (item.saleStatus === 'OFF' ? 'STOPPED' : 'ON_SALE'),
    isSoldOut: Boolean(item.isSoldOut),
    isRepresentative: Boolean(item.isRepresentative),
    showOnTableOrder: Boolean(item.showOnTableOrder ?? true),
    allowNormalOrder: Boolean(item.allowNormalOrder ?? true),
    allowReservationOrder: Boolean(item.allowReservationOrder ?? false),
    allowDineIn: Boolean(item.allowDineIn ?? true),
    allowTakeout: Boolean(item.allowTakeout ?? true),
    allowDelivery: Boolean(item.allowDelivery ?? true),
    thumbnailMockLabel: item.thumbnail?.fileName ?? '',
    options: mapMenuItemOptionsToFormOptions(item)
  }
}

function isHiddenOnTableOrder(item: PosMenuItem): boolean {
  return Number(item.showOnTableOrder ?? 1) === 0
}

function isOnSale(item: PosMenuItem): boolean {
  return Boolean(item.isActive) && item.menuStatus === 'ON_SALE'
}

function isStopped(item: PosMenuItem): boolean {
  return item.menuStatus === 'STOPPED' || Boolean(item.isSoldOut)
}

function parseMenuPrice(value: string): number {
  const normalizedValue = value.replaceAll(',', '').trim()

  if (!normalizedValue) {
    return 0
  }

  return Number(normalizedValue)
}

function parseMenuLimit(value: string): number | null {
  const normalizedValue = value.replaceAll(',', '').trim()

  if (!normalizedValue) {
    return null
  }

  const numericValue = Number(normalizedValue)

  if (!Number.isInteger(numericValue) || numericValue < 0) {
    return null
  }

  return numericValue
}

// SECTION 01 : COMPONENT
export default function MenuManagePanel({
  onCreateActionChange,
  hideCreateButton
}: MenuManagePanelProps) {
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null)

  const [context, setContext] = useState<PosMenuContext | null>(null)
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([])
  const [categories, setCategories] = useState<PosProductCategory[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isCategoryLoading, setIsCategoryLoading] = useState<boolean>(false)
  const [activeFilter, setActiveFilter] = useState<MenuFilter>('ALL')
  const [isMenuCreateModalOpen, setIsMenuCreateModalOpen] = useState<boolean>(false)
  const [isMenuCreateSaving, setIsMenuCreateSaving] = useState<boolean>(false)
  const [editingMenuId, setEditingMenuId] = useState<number | null>(null)
  const [deletingMenuId, setDeletingMenuId] = useState<number | null>(null)
  const [menuCreateErrorMessage, setMenuCreateErrorMessage] = useState<string>('')
  const [menuCreateThumbnailFile, setMenuCreateThumbnailFile] = useState<File | null>(
    null
  )
  const [menuCreateThumbnailObjectUrl, setMenuCreateThumbnailObjectUrl] = useState<string>('')
  const [menuCreateUploadedThumbnailUrl, setMenuCreateUploadedThumbnailUrl] = useState<string>('')
  const [menuCreateStoredThumbnailUrl, setMenuCreateStoredThumbnailUrl] = useState<string>('')
  const [isImageViewerOpen, setIsImageViewerOpen] = useState<boolean>(false)
  const [imageViewerUrl, setImageViewerUrl] = useState<string>('')
  const menuCreateThumbnailObjectUrlRef = useRef<string | null>(null)
  const [menuCreateForm, setMenuCreateForm] = useState<MenuCreateMockForm>(
    () => createInitialMenuCreateForm()
  )

  const loadMenus = useCallback(async () => {
    setIsLoading(true)

    try {
      const me = await getMe()
      const user = me.user

      if (user.profileType !== 'BUSINESS') {
        setContext(null)
        setMenuItems([])
        return
      }

      const nextContext: PosMenuContext = {
        profileId: Number(user.profileId),
        channelCode: String(user.channelCode)
      }

      setContext(nextContext)

      const response = await getPosMenus(nextContext)
      setMenuItems(response.items ?? [])
    } catch (error) {
      console.error('硫붾돱 紐⑸줉 議고쉶 ?ㅽ뙣', error)
      setMenuItems([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    setIsCategoryLoading(true)

    try {
      const response = await getPosProductCategories()
      setCategories(response.categories ?? [])
    } catch (error) {
      console.error('移댄뀒怨좊━ 紐⑸줉 議고쉶 ?ㅽ뙣', error)
      setCategories([])
    } finally {
      setIsCategoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMenus()
    void loadCategories()
  }, [loadCategories, loadMenus])

  useEffect(() => {
    if (!context?.channelCode) {
      return
    }

    return subscribePosTableSettingsSync({
      channelCode: context.channelCode,
      onSync: () => {
        void loadMenus()
      }
    })
  }, [context?.channelCode, loadMenus])

  useEffect(() => {
    if (!isMenuCreateModalOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isImageViewerOpen) {
          setIsImageViewerOpen(false)
          setImageViewerUrl('')
          return
        }

        setIsMenuCreateModalOpen(false)
        setMenuCreateForm(createInitialMenuCreateForm())
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isImageViewerOpen, isMenuCreateModalOpen])

  const openImageViewer = useCallback((url: string) => {
    if (!url) {
      return
    }

    setImageViewerUrl(url)
    setIsImageViewerOpen(true)
  }, [])

  const closeImageViewer = useCallback(() => {
    setIsImageViewerOpen(false)
    setImageViewerUrl('')
  }, [])

  const resetMenuCreateThumbnailStates = useCallback(() => {
    if (menuCreateThumbnailObjectUrlRef.current) {
      URL.revokeObjectURL(menuCreateThumbnailObjectUrlRef.current)
      menuCreateThumbnailObjectUrlRef.current = null
    }

    setMenuCreateThumbnailFile(null)
    setMenuCreateThumbnailObjectUrl('')
    setMenuCreateUploadedThumbnailUrl('')
    setMenuCreateStoredThumbnailUrl('')
  }, [])

  const summary = useMemo(() => {
    const total = menuItems.length
    const onSale = menuItems.filter(isOnSale).length
    const stopped = menuItems.filter(isStopped).length
    const hidden = menuItems.filter(isHiddenOnTableOrder).length

    return {
      total,
      onSale,
      stopped,
      hidden
    }
  }, [menuItems])

  const filteredItems = useMemo(() => {
    if (activeFilter === 'ON_SALE') {
      return menuItems.filter(isOnSale)
    }

    if (activeFilter === 'STOPPED') {
      return menuItems.filter(isStopped)
    }

    if (activeFilter === 'HIDDEN') {
      return menuItems.filter(isHiddenOnTableOrder)
    }

    return menuItems
  }, [activeFilter, menuItems])

  const activeCategories = useMemo(
    () => categories.filter((category) => Number(category.isActive ?? 1) === 1),
    [categories]
  )

  const selectedCreateCategory = useMemo(
    () =>
      activeCategories.find(
        (category) => category.id === menuCreateForm.categoryId
      ) ?? null,
    [activeCategories, menuCreateForm.categoryId]
  )

  const previewMenuName =
    menuCreateForm.menuName.trim() || 'PREVIEW_NAME'

  const previewDescription =
    menuCreateForm.description.trim() || '메뉴 설명을 입력하세요'

  const previewPrice =
    parseMenuPrice(menuCreateForm.basePrice)

  const previewPriceText =
    Number.isFinite(previewPrice) && previewPrice > 0
      ? `${previewPrice.toLocaleString('ko-KR')}원`
      : '0원'

  const previewCategoryName =
    selectedCreateCategory?.categoryName?.trim() || 'CATEGORY'

  const previewSaleStatusText =
    menuCreateForm.menuStatus === 'ON_SALE' ? 'ON' : 'OFF'

  const previewVisibleText =
    menuCreateForm.showOnTableOrder ? 'ON' : 'OFF'

  const availableOrderTimings = useMemo(() => {
    const items: string[] = []

    if (menuCreateForm.allowNormalOrder) {
      items.push('일반 주문')
    }

    if (menuCreateForm.allowReservationOrder) {
      items.push('예약 주문')
    }

    return items
  }, [
    menuCreateForm.allowNormalOrder,
    menuCreateForm.allowReservationOrder
  ])

  const availableOrderModes = useMemo(() => {
    const items: string[] = []

    if (menuCreateForm.allowDineIn) {
      items.push('매장 주문')
    }

    if (menuCreateForm.allowTakeout) {
      items.push('포장/방문')
    }

    if (menuCreateForm.allowDelivery) {
      items.push('배달')
    }

    return items
  }, [
    menuCreateForm.allowDelivery,
    menuCreateForm.allowDineIn,
    menuCreateForm.allowTakeout
  ])

  const openMenuCreateModal = useCallback(() => {
    setEditingMenuId(null)
    setMenuCreateForm(createInitialMenuCreateForm())
    resetMenuCreateThumbnailStates()
    setIsImageViewerOpen(false)
    setImageViewerUrl('')
    setMenuCreateErrorMessage('')
    setIsMenuCreateModalOpen(true)
  }, [resetMenuCreateThumbnailStates])

  useEffect(() => {
    onCreateActionChange?.(openMenuCreateModal)

    return () => {
      onCreateActionChange?.(null)
    }
  }, [openMenuCreateModal, onCreateActionChange])

  const openMenuEditModal = (item: PosMenuItem) => {
    setEditingMenuId(item.id)
    setMenuCreateForm(mapMenuItemToForm(item))
    resetMenuCreateThumbnailStates()
    setMenuCreateStoredThumbnailUrl(mediaUrl(item.thumbnail?.filePath))
    setIsImageViewerOpen(false)
    setImageViewerUrl('')
    setMenuCreateErrorMessage('')
    setIsMenuCreateModalOpen(true)
  }

  const closeMenuCreateModal = () => {
    setIsMenuCreateModalOpen(false)
    setIsImageViewerOpen(false)
    setImageViewerUrl('')
    setEditingMenuId(null)
    setMenuCreateForm(createInitialMenuCreateForm())
    resetMenuCreateThumbnailStates()
    setMenuCreateErrorMessage('')
    setIsMenuCreateSaving(false)

    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ''
    }
  }

  const handleDeleteMenu = async (item: PosMenuItem) => {
    if (!context || deletingMenuId !== null) {
      return
    }

    try {
      setDeletingMenuId(item.id)
      await deletePosMenu(
        item.id,
        context
      )
      emitPosTableSettingsSync({
        channelCode: context.channelCode,
        reason: 'delete'
      })
      await loadMenus()
    } catch (error) {
      console.error('POS 硫붾돱 ??젣 ?ㅽ뙣', error)
    } finally {
      setDeletingMenuId(null)
    }
  }

  const updateMenuCreateTextField = (
    field: MenuCreateTextField,
    value: string
  ) => {
    setMenuCreateForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const openThumbnailFilePicker = () => {
    thumbnailInputRef.current?.click()
  }

  const handleThumbnailFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (menuCreateThumbnailObjectUrlRef.current) {
      URL.revokeObjectURL(menuCreateThumbnailObjectUrlRef.current)
      menuCreateThumbnailObjectUrlRef.current = null
    }

    const nextObjectUrl = URL.createObjectURL(file)
    menuCreateThumbnailObjectUrlRef.current = nextObjectUrl
    setMenuCreateThumbnailObjectUrl(nextObjectUrl)

    setMenuCreateThumbnailFile(file)
    setMenuCreateUploadedThumbnailUrl('')

    setMenuCreateForm((prev) => ({
      ...prev,
      thumbnailMockLabel: file.name
    }))
  }

  const updateMenuCreateCategory = (value: number) => {
    setMenuCreateForm((prev) => ({
      ...prev,
      categoryId: value
    }))
  }

  const updateMenuCreateBooleanField = (
    field: 'isSoldOut' | 'isRepresentative' | 'showOnTableOrder',
    value: boolean
  ) => {
    setMenuCreateForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const updateMenuCreateStatus = (
    value: MenuCreateMockForm['menuStatus']
  ) => {
    setMenuCreateForm((prev) => ({
      ...prev,
      menuStatus: value
    }))
  }

  const updateMenuCreateAvailabilityField = (
    field:
      | 'allowNormalOrder'
      | 'allowReservationOrder'
      | 'allowDineIn'
      | 'allowTakeout'
      | 'allowDelivery',
    value: boolean
  ) => {
    setMenuCreateForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMenuCreateOptionToggle = (optionId: string) => {
    setMenuCreateForm((prev) => ({
      ...prev,
      options: prev.options.map((option) =>
        option.id === optionId
          ? {
            ...option,
            enabled: !option.enabled
          }
          : option
      )
    }))
  }

  const updateMenuCreateOptionTextField = (
    optionId: string,
    field: MenuCreateOptionUpdateKey,
    value: string
  ) => {
    setMenuCreateForm((prev) => ({
      ...prev,
      options: prev.options.map((option) =>
        option.id === optionId
          ? {
            ...option,
            [field]: value
          }
          : option
      )
    }))
  }

  const addMenuCreateOption = () => {
    setMenuCreateForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        createEmptyPreviewOption()
      ]
    }))
  }

  const removeMenuCreateOption = (optionId: string) => {
    setMenuCreateForm((prev) => ({
      ...prev,
      options: prev.options.filter((option) => option.id !== optionId)
    }))
  }

  const buildMenuCreateOptionsPayload = (): PosMenuOptionGroup[] => {
    const values: PosMenuOptionValue[] = menuCreateForm.options
      .map((option, index) => {
        const optionValueName = option.title.trim()

        if (!optionValueName) {
          return null
        }

        const priceDelta = parseMenuPrice(option.priceText)

        if (!Number.isFinite(priceDelta) || priceDelta < 0) {
          return null
        }

        const optionValue: PosMenuOptionValue = {
          optionValueName,
          priceDelta,
          isDefault: false,
          isActive: option.enabled,
          optionValueType: option.optionType,
          isVisible: true,
          sortOrder: index
        }

        return optionValue
      })
      .filter((value): value is PosMenuOptionValue => value !== null)

    if (values.length < 1) {
      return []
    }

    return [
      {
        optionName: values[0]?.optionValueName ?? '湲곕낯 ?듭뀡',
        optionType: 'CUSTOM',
        isRequired: false,
        isMultiple: true,
        minSelectCount: 0,
        maxSelectCount: 99,
        isActive: true,
        sortOrder: 0,
        values
      }
    ]
  }

  const submitMenuCreate = async () => {
    const trimmedMenuName = menuCreateForm.menuName.trim()

    if (!trimmedMenuName) {
      setMenuCreateErrorMessage('硫붾돱紐낆쓣 ?낅젰?섏꽭??')
      return
    }

    const basePrice = parseMenuPrice(menuCreateForm.basePrice)

    if (!Number.isFinite(basePrice) || basePrice < 0) {
      setMenuCreateErrorMessage('湲곕낯媛寃⑹? 0???댁긽 ?レ옄濡??낅젰?섏꽭??')
      return
    }

    const nextDailySalesLimit = parseMenuLimit(
      menuCreateForm.dailySalesLimit
    )
    const normalizedDailySalesLimit =
      menuCreateForm.dailySalesLimit.trim() === ''
        ? null
        : nextDailySalesLimit

    if (
      menuCreateForm.dailySalesLimit.trim() !== '' &&
      normalizedDailySalesLimit === null
    ) {
      setMenuCreateErrorMessage('1일 판매가능 수량은 0 이상 정수로 입력해 주세요')
      return
    }

    if (!context) {
      setMenuCreateErrorMessage('POS ?ъ뾽???뺣낫瑜??뺤씤?????놁뒿?덈떎.')
      return
    }

    if (!menuCreateForm.categoryId || !selectedCreateCategory) {
      setMenuCreateErrorMessage('移댄뀒怨좊━瑜??좏깮?섏꽭??')
      return
    }

    const nextMenuStatus =
      menuCreateForm.isSoldOut
        ? 'STOPPED'
        : menuCreateForm.menuStatus

    const hasInvalidOptionPrice = menuCreateForm.options.some((option) => {
      if (!option.priceText.trim()) {
        return false
      }

      const priceDelta = parseMenuPrice(option.priceText)
      return !Number.isFinite(priceDelta) || priceDelta < 0
    })

    if (hasInvalidOptionPrice) {
      setMenuCreateErrorMessage('?듭뀡 異붽?湲덉븸? 0???댁긽 ?レ옄濡??낅젰?섏꽭??')
      return
    }

    const optionsPayload = buildMenuCreateOptionsPayload()

    let nextThumbnailImageAssetId: number | undefined

    if (menuCreateThumbnailFile) {
      const uploadResult = await uploadPosProductThumbnail(
        menuCreateThumbnailFile,
        {
          channelCode: context.channelCode
        }
      )

      nextThumbnailImageAssetId = uploadResult.assetId
      setMenuCreateUploadedThumbnailUrl(mediaUrl(uploadResult.filePath))
      setMenuCreateThumbnailObjectUrl('')

      if (menuCreateThumbnailObjectUrlRef.current) {
        URL.revokeObjectURL(menuCreateThumbnailObjectUrlRef.current)
        menuCreateThumbnailObjectUrlRef.current = null
      }
      setMenuCreateThumbnailFile(null)
    }

    const payload: CreatePosMenuInput = {
      profileId: context.profileId,
      channelCode: context.channelCode,
      categoryId: menuCreateForm.categoryId,
      productName: trimmedMenuName,
      productDescription: menuCreateForm.description.trim() || null,
      basePrice,
      productKind: 'MAIN_PRODUCT',
      saleStatus: nextMenuStatus === 'ON_SALE' ? 'ON' : 'OFF',
      isActive: nextMenuStatus === 'ON_SALE',
      isSoldOut: menuCreateForm.isSoldOut,
      isRepresentative: menuCreateForm.isRepresentative,
      showOnTableOrder: menuCreateForm.showOnTableOrder,
      allowNormalOrder: menuCreateForm.allowNormalOrder,
      allowReservationOrder: menuCreateForm.allowReservationOrder,
      allowDineIn: menuCreateForm.allowDineIn,
      allowTakeout: menuCreateForm.allowTakeout,
      allowDelivery: menuCreateForm.allowDelivery,
      dailySalesLimit:
        normalizedDailySalesLimit,
      menuStatus: nextMenuStatus,
      options: optionsPayload,
      sortOrder: 0
    }

    if (typeof nextThumbnailImageAssetId === 'number') {
      payload.thumbnailImageAssetId = nextThumbnailImageAssetId
    }

    try {
      setIsMenuCreateSaving(true)
      setMenuCreateErrorMessage('')

      if (editingMenuId !== null) {
        await updatePosMenu(
          editingMenuId,
          payload
        )
      } else {
        await createPosMenu(payload)
      }

      emitPosTableSettingsSync({
        channelCode: context.channelCode,
        reason: editingMenuId !== null ? 'update' : 'create'
      })
      await loadMenus()
      closeMenuCreateModal()
    } catch (error) {
      console.error('POS 硫붾돱 ????ㅽ뙣', error)
      setMenuCreateErrorMessage('硫붾돱 ??μ뿉 ?ㅽ뙣?덉뒿?덈떎. ?낅젰媛믪쓣 ?뺤씤?섏꽭??')
    } finally {
      setIsMenuCreateSaving(false)
    }
  }

  const menuCreateThumbnailPreviewUrl = useMemo(
    () =>
      menuCreateThumbnailObjectUrl
      || menuCreateUploadedThumbnailUrl
      || menuCreateStoredThumbnailUrl,
    [
      menuCreateThumbnailObjectUrl,
      menuCreateUploadedThumbnailUrl,
      menuCreateStoredThumbnailUrl
    ]
  )

  const menuCreateThumbnailAlt = menuCreateForm.menuName.trim() || '상품 이미지'

  const menuCreateThumbnailPreviewButton = menuCreateThumbnailPreviewUrl ? (
    <button
      type="button"
      className={styles.thumbnailPreviewButton}
      onClick={() => openImageViewer(menuCreateThumbnailPreviewUrl)}
      aria-label={`${menuCreateThumbnailAlt} 확대보기`}
    >
      <img
        src={menuCreateThumbnailPreviewUrl}
        alt={menuCreateThumbnailAlt}
        className={styles.thumbnailPreviewImage}
      />
    </button>
  ) : (
    <div className={styles.thumbnailPreviewButton} aria-hidden="true">
      <span className={styles.thumbnailPreviewPlaceholder}>
        이미지를 선택해 주세요
      </span>
    </div>
  )

  const menuCreateLeftThumbnailRow = (
    <div className={styles.thumbnailPreviewRow}>
      {menuCreateThumbnailPreviewButton}
      {menuCreateForm.thumbnailMockLabel ? (
        <span className={styles.thumbnailFileName}>
          {menuCreateForm.thumbnailMockLabel}
        </span>
      ) : null}
    </div>
  )

  const menuCreateRightThumbnailRow = (
    <div className={styles.thumbnailPreviewRow}>
      {menuCreateThumbnailPreviewButton}
      {menuCreateForm.thumbnailMockLabel ? (
        <span className={styles.thumbnailFileNamePreview}>
          {menuCreateForm.thumbnailMockLabel}
        </span>
      ) : null}
    </div>
  )

  return (
    <>
      <section className={styles.modulePanel}>
      <header className={styles.moduleHeader}>
        <div className={styles.moduleHeaderRow}>
          <h2 className={styles.moduleTitle}>메뉴관리</h2>
          {!hideCreateButton ? (
            <button
              type="button"
              className={styles.primaryInlineButton}
              onClick={openMenuCreateModal}
            >
              + 메뉴추가
            </button>
          ) : null}
        </div>
      </header>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <p className={styles.summaryLabel}>전체 메뉴</p>
          <p className={styles.summaryValue}>{summary.total}개</p>
        </article>
        <article className={styles.summaryCard}>
          <p className={styles.summaryLabel}>판매중</p>
          <p className={styles.summaryValue}>{summary.onSale}개</p>
        </article>
        <article className={styles.summaryCard}>
          <p className={styles.summaryLabel}>품절/중지</p>
          <p className={styles.summaryValue}>{summary.stopped}개</p>
        </article>
        <article className={styles.summaryCard}>
          <p className={styles.summaryLabel}>숨김</p>
          <p className={styles.summaryValue}>{summary.hidden}개</p>
        </article>
      </div>

      <div className={styles.filterRow}>
        <button
          type="button"
          className={`${styles.pillButton} ${activeFilter === 'ALL' ? styles.pillButtonActive : ''}`}
          onClick={() => setActiveFilter('ALL')}
        >
          전체
        </button>
        <button
          type="button"
          className={`${styles.pillButton} ${activeFilter === 'ON_SALE' ? styles.pillButtonActive : ''}`}
          onClick={() => setActiveFilter('ON_SALE')}
        >
          판매중
        </button>
        <button
          type="button"
          className={`${styles.pillButton} ${activeFilter === 'STOPPED' ? styles.pillButtonActive : ''}`}
          onClick={() => setActiveFilter('STOPPED')}
        >
          품절
        </button>
        <button
          type="button"
          className={`${styles.pillButton} ${activeFilter === 'HIDDEN' ? styles.pillButtonActive : ''}`}
          onClick={() => setActiveFilter('HIDDEN')}
        >
          숨김
        </button>
      </div>

      <div className={styles.itemGrid}>
        {isLoading ? (
          <article className={styles.itemCard}>
            <p className={styles.itemStatus}>메뉴 목록을 불러오는 중입니다.</p>
          </article>
        ) : filteredItems.length < 1 ? (
          <article className={styles.itemCard}>
            <p className={styles.itemStatus}>조회된 메뉴가 없습니다.</p>
          </article>
        ) : (
          filteredItems.map((item) => (
            <article key={item.id} className={styles.itemCard}>
              <div className={styles.itemTop}>
                <h3 className={styles.itemTitle}>{item.productName}</h3>
                <p className={styles.itemPrice}>
                  {Number(item.basePrice ?? 0).toLocaleString('ko-KR')}원
                </p>
              </div>
              <p className={styles.itemStatus}>
                {item.isSoldOut
                  ? '품절'
                  : item.menuStatus === 'STOPPED'
                    ? '판매중지'
                    : isHiddenOnTableOrder(item)
                      ? '숨김'
                      : '판매중'}
              </p>
              <div className={styles.cardActionRow}>
                <button
                  type="button"
                  className={styles.cardActionButton}
                  onClick={() => openMenuEditModal(item)}
                >
                  수정
                </button>
                <button type="button" className={styles.cardActionButton}>
                  옵션
                </button>
                <button type="button" className={styles.cardActionButton}>
                  숨김
                </button>
                <button
                  type="button"
                  className={`${styles.cardActionButton} ${styles.cardDeleteButton}`}
                  disabled={deletingMenuId === item.id}
                  onClick={() => {
                    void handleDeleteMenu(item)
                  }}
                >
                  {deletingMenuId === item.id ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <BaseModal
        open={isMenuCreateModalOpen}
        type="info"
        title={editingMenuId !== null ? '메뉴 수정' : '메뉴 추가'}
        description="테이블 주문에서 사용할 메뉴 정보를 입력합니다."
        onClose={closeMenuCreateModal}
        autoClose={false}
        hideDefaultButton
        showCloseButton
        hideIcon
        panelStyle={{
          width: 'min(1120px, calc(100vw - 48px))',
          maxHeight: 'calc(100dvh - 80px)',
          minHeight: 'auto',
          padding: 0,
          alignItems: 'stretch',
          gap: 0,
          overflow: 'hidden'
        }}
        bodyStyle={{
          minHeight: 0,
          overflow: 'auto',
          padding: '18px 20px',
          background: '#f8fafc',
          boxSizing: 'border-box'
        }}
        footer={
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.modalCancelButton}
            disabled={isMenuCreateSaving}
            onClick={closeMenuCreateModal}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.modalSubmitButton}
            disabled={isMenuCreateSaving}
            onClick={submitMenuCreate}
          >
            {isMenuCreateSaving ? '저장 중...' : '저장'}
          </button>
        </div>
        }
      >
              <div className={styles.modalCreateLayout}>
                <div className={styles.modalFormColumn}>
                  <section className={styles.createSectionCard}>
                    <div className={styles.createSectionHeader}>
                      <h4 className={styles.createSectionTitle}>메뉴 정보</h4>
                      <p className={styles.createSectionDescription}>
                        테이블 주문에서 사용할 메뉴 정보를 입력합니다.
                      </p>
                    </div>

                    <div className={styles.thumbnailMockBox}>
                      <h5 className={styles.createSectionTitle}>상품 이미지</h5>
                      {menuCreateLeftThumbnailRow}
                      <button
                        type="button"
                        className={styles.thumbnailMockButton}
                        onClick={openThumbnailFilePicker}
                      >
                        이미지 업로드
                      </button>
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        className={styles.visuallyHiddenFileInput}
                        onChange={handleThumbnailFileChange}
                      />
                    </div>

                    <div className={styles.createFieldGrid}>
                      <label className={styles.createField}>
                        <span className={styles.createLabel}>카테고리</span>
                        <select
                          className={styles.createSelect}
                          value={menuCreateForm.categoryId}
                          onChange={(event) =>
                            updateMenuCreateCategory(Number(event.target.value))
                          }
                          disabled={isCategoryLoading}
                        >
                          <option value={0}>
                            {isCategoryLoading ? '로딩 중...' : '카테고리'}
                          </option>
                          {activeCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.categoryName}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className={styles.createField}>
                        <span className={styles.createLabel}>메뉴명</span>
                        <input
                          className={styles.createInput}
                          type="text"
                          value={menuCreateForm.menuName}
                          onChange={(event) =>
                            updateMenuCreateTextField('menuName', event.target.value)
                          }
                          placeholder="메뉴명을 입력하세요"
                        />
                      </label>

                      <label className={styles.createField}>
                        <span className={styles.createLabel}>가격</span>
                        <input
                          className={styles.createInput}
                          type="text"
                          inputMode="numeric"
                          value={menuCreateForm.basePrice}
                          onChange={(event) =>
                            updateMenuCreateTextField('basePrice', event.target.value)
                          }
                          placeholder="예: 8,900"
                        />
                      </label>

                      <label className={styles.createField}>
                        <span className={styles.createLabel}>1일 판매가능 수량</span>
                        <input
                          className={styles.createInput}
                          type="text"
                          inputMode="numeric"
                          value={menuCreateForm.dailySalesLimit}
                          onChange={(event) =>
                            updateMenuCreateTextField(
                              'dailySalesLimit',
                              event.target.value.replace(/\D/g, '')
                            )
                          }
                          placeholder="예: 50"
                        />
                        <p className={styles.createHint}>비워두면 제한 없음</p>
                      </label>

                      <label className={`${styles.createField} ${styles.createFieldWide}`}>
                        <span className={styles.createLabel}>메뉴 설명</span>
                        <textarea
                          className={styles.createTextarea}
                          value={menuCreateForm.description}
                          onChange={(event) =>
                            updateMenuCreateTextField('description', event.target.value)
                          }
                          placeholder="메뉴 설명을 입력하세요"
                        />
                      </label>
                    </div>
                  </section>

                  <section className={styles.createSectionCard}>
                    <h4 className={styles.createSectionTitle}>판매 상태</h4>
                    <div className={styles.createToggleGrid}>
                      <div className={styles.createField}>
                        <span className={styles.createLabel}>판매 상태</span>
                        <div className={styles.createRadioGroup}>
                          <label>
                            <input
                              type="radio"
                              name="tablePosMenuCreateStatus"
                              checked={menuCreateForm.menuStatus === 'ON_SALE'}
                              onChange={() => updateMenuCreateStatus('ON_SALE')}
                            />
                            판매중</label>
                          <label>
                            <input
                              type="radio"
                              name="tablePosMenuCreateStatus"
                              checked={menuCreateForm.menuStatus === 'STOPPED'}
                              onChange={() => updateMenuCreateStatus('STOPPED')}
                            />
                            판매중지
                          </label>
                        </div>
                      </div>

                      <label className={styles.createCheckRow}>
                        <input
                          type="checkbox"
                          checked={menuCreateForm.isSoldOut}
                          onChange={(event) =>
                            updateMenuCreateBooleanField('isSoldOut', event.target.checked)
                          }
                        />
                        품절
                      </label>

                      <label className={styles.createCheckRow}>
                        <input
                          type="checkbox"
                          checked={menuCreateForm.isRepresentative}
                          onChange={(event) =>
                            updateMenuCreateBooleanField('isRepresentative', event.target.checked)
                          }
                        />
                        대표 메뉴로 설정
                      </label>

                      <label className={styles.createCheckRow}>
                        <input
                          type="checkbox"
                          checked={menuCreateForm.showOnTableOrder}
                          onChange={(event) =>
                            updateMenuCreateBooleanField('showOnTableOrder', event.target.checked)
                          }
                        />
                        테이블 주문에서 표시
                      </label>
                    </div>
                  </section>

                  <section className={styles.createSectionCard}>
                    <div className={styles.createSectionHeader}>
                      <h4 className={styles.createSectionTitle}>주문 설정</h4>
                      <p className={styles.createSectionDescription}>
                        메뉴 주문 설정과 주문 방식을 선택합니다.
                      </p>
                    </div>
                    <div className={styles.orderSettingGrid}>
                      <div className={styles.orderSettingGroup}>
                        <p className={styles.orderSettingTitle}>주문 가능 설정</p>
                        <label className={styles.createCheckRow}>
                          <input
                            type="checkbox"
                            checked={menuCreateForm.allowNormalOrder}
                            onChange={(event) =>
                              updateMenuCreateAvailabilityField('allowNormalOrder', event.target.checked)
                            }
                          />
                          일반 주문</label>
                        <label className={styles.createCheckRow}>
                          <input
                            type="checkbox"
                            checked={menuCreateForm.allowReservationOrder}
                            onChange={(event) =>
                              updateMenuCreateAvailabilityField('allowReservationOrder', event.target.checked)
                            }
                          />
                          예약 주문</label>
                      </div>
                      <div className={styles.orderSettingGroup}>
                        <p className={styles.orderSettingTitle}>주문 방식 설정</p>
                        <label className={styles.createCheckRow}>
                          <input
                            type="checkbox"
                            checked={menuCreateForm.allowDineIn}
                            onChange={(event) =>
                              updateMenuCreateAvailabilityField('allowDineIn', event.target.checked)
                            }
                          />
                          매장 주문
                        </label>
                        <label className={styles.createCheckRow}>
                          <input
                            type="checkbox"
                            checked={menuCreateForm.allowTakeout}
                            onChange={(event) =>
                              updateMenuCreateAvailabilityField('allowTakeout', event.target.checked)
                            }
                          />
                          포장/방문
                        </label>
                        <label className={styles.createCheckRow}>
                          <input
                            type="checkbox"
                            checked={menuCreateForm.allowDelivery}
                            onChange={(event) =>
                              updateMenuCreateAvailabilityField('allowDelivery', event.target.checked)
                            }
                          />
                          배달
                        </label>
                      </div>
                    </div>
                  </section>

                  <section className={styles.createSectionCard}>
                    <div className={styles.createSectionHeader}>
                      <h4 className={styles.createSectionTitle}>옵션 설정</h4>
                      <p className={styles.createSectionDescription}>
                        테이블 주문에서 사용할 수 있는 옵션을 설정하세요.
                      </p>
                    </div>
                    <div className={styles.optionRows}>
                      {menuCreateForm.options.map((option) => (
                        <div
                          key={option.id}
                          className={styles.optionRow}
                        >
                          <label className={styles.optionCheckLabel}>
                            <input
                              type="checkbox"
                              checked={option.enabled}
                              onChange={() => handleMenuCreateOptionToggle(option.id)}
                            />
                          </label>

                          <span className={styles.optionTypeBadge}>옵션</span>

                          <input
                            className={styles.optionInput}
                            type="text"
                            value={option.title}
                            onChange={(event) =>
                              updateMenuCreateOptionTextField(
                                option.id,
                                'title',
                                event.target.value
                              )
                            }
                            placeholder="옵션명을 입력하세요"
                          />

                          <input
                            className={styles.optionPriceInput}
                            type="text"
                            inputMode="numeric"
                            value={option.priceText}
                            onChange={(event) =>
                              updateMenuCreateOptionTextField(
                                option.id,
                                'priceText',
                                event.target.value
                              )
                            }
                            placeholder="가격 입력"
                          />

                          <button
                            type="button"
                            className={styles.optionDeleteButton}
                            onClick={() => removeMenuCreateOption(option.id)}
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className={styles.addOptionButton}
                      onClick={addMenuCreateOption}
                    >
                      + 옵션 추가
                    </button>
                  </section>

                  {menuCreateErrorMessage ? (
                    <p className={styles.menuCreateErrorMessage}>
                      {menuCreateErrorMessage}
                    </p>
                  ) : null}
                </div>

                <aside className={styles.modalPreviewColumn}>
                  <section className={styles.previewPanel}>
                    <h4 className={styles.previewTitle}>미리보기</h4>
                    <div className={styles.previewTopArea}>
                      {menuCreateRightThumbnailRow}
                      <div className={styles.previewMetaList}>
                        <p>등록 상태: CATEGORY</p>
                        <p>판매상태: {previewSaleStatusText}</p>
                        <p>메뉴명: {previewMenuName}</p>
                        <p>가격: {previewPriceText}</p>
                        <p>카테고리: {previewCategoryName}</p>
                        <p>
                          메뉴 상태: {menuCreateForm.isRepresentative ? '대표 메뉴' : '일반 메뉴'}
                        </p>
                      </div>
                    </div>

                    <section className={styles.previewSectionCard}>
                      <h5 className={styles.previewSectionTitle}>1. 메뉴명/가격</h5>
                      <div className={styles.previewMenuCard}>
                        <div className={styles.previewCardTop}>
                          <strong>{previewMenuName}</strong>
                          <span>{previewPriceText}</span>
                        </div>
                        <p className={styles.previewDescriptionText}>
                          {previewDescription}
                        </p>
                        <div className={styles.previewBadges}>
                          <span>{previewCategoryName}</span>
                          <span>{previewSaleStatusText}</span>
                          <span>{previewVisibleText}</span>
                        </div>
                      </div>
                    </section>

                    <section className={styles.previewSectionCard}>
                      <h5 className={styles.previewSectionTitle}>2. 수량 확인</h5>
                      <div className={styles.previewQuantityCard}>
                        <strong>{previewMenuName}</strong>
                        <span>{previewPriceText}</span>
                        <div className={styles.previewQuantityRow}>
                          <button type="button" disabled>-</button>
                          <strong>1</strong>
                          <button type="button" disabled>+</button>
                        </div>
                      </div>
                    </section>

                    <section className={styles.previewSectionCard}>
                      <h5 className={styles.previewSectionTitle}>3. 주문 채널</h5>
                      <div className={styles.previewOrderGroup}>
                        <p>주문 가능</p>
                        <div className={styles.previewBadges}>
                          {availableOrderTimings.length > 0 ? (
                            availableOrderTimings.map((item) => (
                              <span key={item}>{item}</span>
                            ))
                          ) : (
                            <span>설정된 주문 가능 항목 없음</span>
                          )}
                        </div>
                        <p>주문 방식</p>
                        <div className={styles.previewBadges}>
                          {availableOrderModes.length > 0 ? (
                            availableOrderModes.map((item) => (
                              <span key={item}>{item}</span>
                            ))
                          ) : (
                            <span>설정된 주문 방식 없음</span>
                          )}
                        </div>
                      </div>
                    </section>
                  </section>
                </aside>
              </div>
      </BaseModal>
      </section>

      {isImageViewerOpen ? (
        <div
          className={styles.imageViewerOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeImageViewer()
            }
          }}
        >
          <div
            className={styles.imageViewerDialog}
            onMouseDown={(event) => {
              event.stopPropagation()
            }}
          >
            <button
              type="button"
              className={styles.imageViewerCloseButton}
              onClick={closeImageViewer}
              aria-label="닫기"
            >
              ×
            </button>
            <img
              src={imageViewerUrl}
              alt={menuCreateThumbnailAlt || '상품 이미지 확대보기'}
              className={styles.imageViewerImage}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
