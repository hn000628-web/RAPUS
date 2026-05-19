// FILE : frontend/app/(pos)/pos/settings/menu/create/page.tsx
// ROOT : frontend/app/(pos)/pos/settings/menu/create/page.tsx
// STATUS : MODIFY MODE
// ROLE : POS MENU / PRODUCT CREATE PAGE
// CHANGE SUMMARY :
// - 湲곗〈 POS 硫붾돱 / ?곹뭹 ?깅줉 UI ?좎?
// - 移댄뀒怨좊━ ?섎뱶肄붾뵫 ?쒓굅
// - getPosProductCategories()濡?DB 移댄뀒怨좊━ 紐⑸줉 濡쒕뵫
// - select option??DB 移댄뀒怨좊━ 湲곗??쇰줈 異쒕젰
// - createPosMenu() ?????categoryCode ???categoryId ?꾨떖
// - 移댄뀒怨좊━ ?섏씠吏? ?숈씪?섍쾶 getMe() 湲곕컲 BUSINESS profile context 濡쒕뵫 ?곸슜
// - ????깃났 ??/pos/settings/menu 濡??대룞
// - ???以??곹깭 / 珥덇린 濡쒕뵫 ?곹깭 / ?ㅻ쪟 硫붿떆吏 / 湲곕낯 validation ?좎?
// - channelCode + profileId ?⑥씪 洹???붿껌 援ъ“ ?곸슜
// - isFeatured???꾩옱 DB 而щ읆 遺?щ줈 ????쒖쇅
// - DB 吏곸젒 ?묎렐 ?놁쓬
// - Service/Controller 吏곸젒 ?묎렐 ?놁쓬

'use client'

// SECTION 01 : IMPORT
import {
  useEffect,
  useMemo,
  useState
} from 'react'
import { useRouter } from 'next/navigation'

import PosTopbar from '../../../../components/PosTopbar'
import { usePosKeyboardMode } from '../../../../components/PosKeyboardModeContext'
import styles from './PosMenuCategoryCreatePage.module.css'

import { getMe } from '@/lib/authApi'
import { createPosMenu } from '@/lib/business/pos/posMenuApi'
import {
  getPosProductCategories,
  type PosProductCategory
} from '@/lib/business/pos/posCategoriesApi'

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
  sortOrder: number
  isActive: boolean
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
    .filter((row) => Number(row.isActive || 0) === 1)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    .map((row) => ({
      id: Number(row.id),
      code: String(row.categoryCode || '').trim() || 'CUSTOM',
      name: String(row.categoryName || '').trim() || '??移댄뀒怨좊━',
      sortOrder: Number(row.sortOrder || 0),
      isActive: Number(row.isActive || 0) === 1
    }))
    .filter((row) => row.id > 0)
}

// SECTION 04 : COMPONENT
export default function PosMenuCreatePage() {
  const router = useRouter()
  const { keyboardMode, toggleKeyboardMode } = usePosKeyboardMode()

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
          throw new Error('?꾨줈??而⑦뀓?ㅽ듃瑜??뺤씤?????놁뒿?덈떎.')
        }

        setContext({
          profileId,
          channelCode
        })

        const categoryResponse = await getPosProductCategories()
        const normalizedCategories =
          normalizeCategoryRows(categoryResponse.categories)

        setCategories(normalizedCategories)

        if (normalizedCategories.length > 0) {
          setCategoryId(normalizedCategories[0].id)
        }
      } catch (error) {
        console.error('POS 硫붾돱 ?깅줉 珥덇린???ㅻ쪟', error)
        setContext(null)
        setCategories([])
        setErrorMessage(
          getErrorMessage(
            error,
            '硫붾돱 ?깅줉 ?뺣낫瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??'
          )
        )
      } finally {
        setIsLoading(false)
      }
    }

    void init()
  }, [])

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
      priceText.replaceAll(',', ''),
      10
    )

    if (!Number.isFinite(numeric) || numeric < 0) {
      return 0
    }

    return numeric
  }, [priceText])

  const selectedCategory = useMemo(
    () =>
      categories.find((item) => item.id === categoryId) ?? null,
    [categories, categoryId]
  )

  const previewName =
    productName.trim().length > 0
      ? productName
      : '상품명 미입력'

  const previewDescription =
    productDescription.trim().length > 0
      ? productDescription
      : '?ㅻ챸 ?놁쓬'

  const previewPriceText =
    `${priceValue.toLocaleString('ko-KR')}원`

  const previewCategory =
    selectedCategory?.name ?? '미선택'

  const previewSaleStatusText =
    saleStatus === 'ON'
      ? '판매중'
      : '판매중지'

  const previewVisibleText =
    isVisibleOnTable
      ? '노출'
      : '숨김'

  // SECTION 08 : SAVE EVENT
  const handleSave = async () => {
    if (isSaving) {
      return
    }

    if (!context?.profileId || !context?.channelCode) {
      const message = '?꾨줈??而⑦뀓?ㅽ듃瑜??뺤씤?????놁뒿?덈떎.'
      setErrorMessage(message)
      window.alert(message)
      return
    }

    const trimmedProductName = productName.trim()

    if (!trimmedProductName) {
      const message = '?곹뭹紐낆쓣 ?낅젰?섏꽭??'
      setErrorMessage(message)
      window.alert(message)
      return
    }

    if (!categoryId) {
      const message = '移댄뀒怨좊━瑜??좏깮?섏꽭??'
      setErrorMessage(message)
      window.alert(message)
      return
    }

    if (!selectedCategory) {
      const message = '?좏깮??移댄뀒怨좊━瑜??뺤씤?????놁뒿?덈떎.'
      setErrorMessage(message)
      window.alert(message)
      return
    }

    if (priceValue < 0) {
      const message = '媛寃⑹? 0???댁긽?댁뼱???⑸땲??'
      setErrorMessage(message)
      window.alert(message)
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage('')

      await createPosMenu({
        profileId: context.profileId,
        channelCode: context.channelCode,
        categoryId,
        productName: trimmedProductName,
        productDescription: productDescription.trim() || null,
        basePrice: priceValue,
        saleStatus,
        isActive: isVisibleOnTable && saleStatus === 'ON',
        isSoldOut: saleStatus === 'OFF',
        sortOrder: 0
      })

      window.alert('POS 硫붾돱 / ?곹뭹????λ릺?덉뒿?덈떎.')
      router.push('/pos/settings/menu')
    } catch (error) {
      console.error('POS 硫붾돱 ????ㅻ쪟', error)

      const message =
        getErrorMessage(
          error,
          '硫붾돱 ??μ뿉 ?ㅽ뙣?덉뒿?덈떎.'
        )

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
            title="카테고리 설정"
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
            <h1 className={styles.title}>POS 硫붾돱 / ?곹뭹 ?깅줉</h1>
            <p className={styles.description}>
              ?뚯씠釉?二쇰Ц ?붾㈃???쒖떆??硫붾돱? ?곹뭹???깅줉?⑸땲??
            </p>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleGoMenuSettings}
              disabled={isSaving}
            >
              ?ㅻ줈媛湲?            </button>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleGoMenuSettings}
              disabled={isSaving}
            >
              硫붾돱 / ?곹뭹 ?ㅼ젙
            </button>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSave}
              disabled={isLoading || isSaving || categories.length < 1}
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </section>

        {isLoading && (
          <section className={styles.card}>
            <p className={styles.description}>
              硫붾돱 ?깅줉 ?뺣낫瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎.
            </p>
          </section>
        )}

        {!isLoading && errorMessage && (
          <section className={styles.card}>
            <p className={styles.description}>
              {errorMessage}
            </p>
          </section>
        )}

        {!isLoading && categories.length < 1 && (
          <section className={styles.card}>
            <p className={styles.description}>
              ?깅줉 媛?ν븳 POS 移댄뀒怨좊━媛 ?놁뒿?덈떎. 癒쇱? 移댄뀒怨좊━瑜??앹꽦?섍굅???쒖꽦?뷀븯?몄슂.
            </p>
          </section>
        )}

        <section className={styles.grid}>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>硫붾돱 / ?곹뭹 ?낅젰</h2>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.label}>상품명</span>
                <input
                  className={styles.input}
                  type="text"
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  placeholder="?? ?대옒??踰꾧굅"
                  disabled={isLoading || isSaving}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>가격</span>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  value={priceText}
                  onChange={(event) => setPriceText(event.target.value)}
                  placeholder="?? 8900"
                  disabled={isLoading || isSaving}
                />
              </label>

              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span className={styles.label}>?곹뭹 ?ㅻ챸</span>
                <textarea
                  className={styles.textarea}
                  value={productDescription}
                  onChange={(event) => setProductDescription(event.target.value)}
                  placeholder="?? ????멸린 硫붾돱"
                  disabled={isLoading || isSaving}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>移댄뀒怨좊━ ?좏깮</span>
                <select
                  className={styles.select}
                  value={categoryId}
                  onChange={(event) => setCategoryId(Number(event.target.value))}
                  disabled={isLoading || isSaving || categories.length < 1}
                >
                  <option value={0}>미선택</option>
                  {categories.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className={styles.field}>
                <span className={styles.label}>?먮ℓ ?곹깭</span>
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
                    ?먮ℓ以?                  </label>

                  <label>
                    <input
                      type="radio"
                      name="saleStatus"
                      value="OFF"
                      checked={saleStatus === 'OFF'}
                      onChange={() => setSaleStatus('OFF')}
                      disabled={isLoading || isSaving}
                    />
                    ?먮ℓ以묒?
                  </label>
                </div>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>???硫붾돱 ?щ?</span>
                <div className={styles.checkRow}>
                  <label>
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(event) => setIsFeatured(event.target.checked)}
                      disabled={isLoading || isSaving}
                    />
                    ???硫붾돱濡??ㅼ젙
                  </label>
                </div>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>?뚯씠釉?二쇰Ц ?몄텧 ?щ?</span>
                <div className={styles.checkRow}>
                  <label>
                    <input
                      type="checkbox"
                      checked={isVisibleOnTable}
                      onChange={(event) => setIsVisibleOnTable(event.target.checked)}
                      disabled={isLoading || isSaving}
                    />
                    ?뚯씠釉?二쇰Ц???몄텧
                  </label>
                </div>
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>?뚯씠釉?二쇰Ц ?붾㈃ 誘몃━蹂닿린</h2>

            <div className={styles.previewCard}>
              <p className={styles.previewMeta}>
                移댄뀒怨좊━: {previewCategory}
              </p>

              <p className={styles.previewMeta}>
                ?곹깭: {previewSaleStatusText}
              </p>

              <p className={styles.previewMeta}>
                ?몄텧 ?щ?: {previewVisibleText}
              </p>

              <p className={styles.previewMeta}>
                ???硫붾돱 ?щ?: {isFeatured ? '???硫붾돱' : '?쇰컲 硫붾돱'}
              </p>

              <div className={styles.previewMenuCard}>
                <div className={styles.previewTop}>
                  <h3 className={styles.previewName}>
                    {previewName}
                  </h3>

                  <p className={styles.previewPrice}>
                    {previewPriceText}
                  </p>
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

                <div className={styles.quantityRow}>
                  <button
                    type="button"
                    className={styles.stepButton}
                    disabled
                  >
                    -
                  </button>

                  <strong className={styles.quantityValue}>
                    0
                  </strong>

                  <button
                    type="button"
                    className={styles.stepButton}
                    disabled
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}


