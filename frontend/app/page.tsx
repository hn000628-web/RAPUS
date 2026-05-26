// FILE : frontend/app/page.tsx
// ROOT : frontend/app/page.tsx
// STATUS : MODIFY MODE
// ROLE : RAPUS MAIN HOME PAGE

'use client'

import {
  useEffect,
  useState
} from 'react'

import type {
  FormEvent
} from 'react'

import {
  useRouter
} from 'next/navigation'

import TopMenuZone from '@/components/topbar/TopMenuZone'
import { useAuth } from '@/contexts/AuthContext'
import FeedRegionOverlay from '@/components/Region/FeedRegionOverlay'

import styles from './page.module.css'

type SearchCategory =
  | '라이프'
  | '플레이스'
  | '라이프 서비스'
  | '마켓'

type MainCategoryItem = {
  key: SearchCategory
  title: SearchCategory
  description: string
  icon: string
  href: string
}

const SEARCH_CATEGORIES: SearchCategory[] = [
  '라이프',
  '플레이스',
  '라이프 서비스',
  '마켓'
]

const RECOMMENDED_KEYWORDS = [
  '맛집',
  '카페',
  '병원',
  '중고거래',
  '숙박',
  '미용',
  '운동',
  '학원'
]

const MAIN_CATEGORY_ITEMS: MainCategoryItem[] = [
  {
    key: '라이프',
    title: '라이프',
    description: '지역 생활 피드',
    icon: 'N',
    href: '/feed/life'
  },
  {
    key: '플레이스',
    title: '플레이스',
    description: '비즈니스 / 장소',
    icon: 'P',
    href: '/place'
  },
  {
    key: '라이프 서비스',
    title: '라이프 서비스',
    description: '전문가 / 생활 서비스',
    icon: 'S',
    href: '/feed/life-service'
  },
  {
    key: '마켓',
    title: '마켓',
    description: '마트 / 식료품',
    icon: '🛒',
    href: '/market'
  }
]

export default function HomePage() {
  const router = useRouter()
  const { isLogin } = useAuth()

  const [category, setCategory] =
    useState<SearchCategory>('라이프')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [hasStoredAccessToken, setHasStoredAccessToken] = useState(false)
  const [regionOverlayOpen, setRegionOverlayOpen] = useState(false)

  useEffect(() => {
    function syncStoredAccessToken() {
      setHasStoredAccessToken(
        Boolean(localStorage.getItem('accessToken'))
      )
    }

    syncStoredAccessToken()

    window.addEventListener('auth-change', syncStoredAccessToken)

    return () => {
      window.removeEventListener('auth-change', syncStoredAccessToken)
    }
  }, [])

  const showLoggedInTopbar =
    isLogin ||
    hasStoredAccessToken

  function buildSearchUrl(
    keyword: string = searchKeyword
  ) {
    const params = new URLSearchParams()
    const trimmedKeyword = keyword.trim()

    params.set('category', category)

    if (trimmedKeyword.length > 0) {
      params.set('q', trimmedKeyword)
    }

    return `/search?${params.toString()}`
  }

  function handleSearchSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    router.push(buildSearchUrl())
  }

  function handleSelectCategory(
    nextCategory: SearchCategory
  ) {
    setCategory(nextCategory)
    setDropdownOpen(false)
  }

  function handleKeywordClick(
    keyword: string
  ) {
    setSearchKeyword(keyword)
    router.push(buildSearchUrl(keyword))
  }

  function handleOpenMainCategory(
    href: string
  ) {
    router.push(href)
  }

  function handleGoLogin() {
    router.push('/login')
  }

  function handleGoSignup() {
    router.push('/signup')
  }

  function handleGoBusiness() {
    router.push('/signup')
  }

  return (
    <main
      className={
        showLoggedInTopbar
          ? `${styles.page} ${styles.pageWithLoggedInTopbar}`
          : styles.page
      }
    >
      {showLoggedInTopbar ? (
        <>
          <TopMenuZone />
        </>
      ) : (
        <header className={styles.topbar}>
          <div className={styles.mobileTopbarLeftGroup}>
            <button
              type="button"
              className={styles.topbarLogo}
              onClick={() => router.push('/')}
            >
              RAPUS
            </button>

            <FeedRegionButton
              className={`${styles.regionButton} ${styles.mobileFeedRegionButton}`}
              onClick={() => setRegionOverlayOpen(true)}
            />
          </div>

          <div className={styles.topbarActions}>
            <button
              type="button"
              className={styles.topbarGhostButton}
              onClick={handleGoBusiness}
            >
              비즈니스
            </button>

            <button
              type="button"
              className={styles.topbarGhostButton}
              onClick={handleGoSignup}
            >
              회원가입
            </button>

            <button
              type="button"
              className={styles.topbarPrimaryButton}
              onClick={handleGoLogin}
            >
              로그인
            </button>
          </div>
        </header>
      )}

      <section className={styles.hero}>
        <h1 className={styles.logo}>RAPUS</h1>

        <div className={styles.searchPanel}>
          <div className={styles.searchRow}>
            <FeedRegionButton
              className={`${styles.regionButton} ${styles.desktopFeedRegionButton}`}
              onClick={() => setRegionOverlayOpen(true)}
            />

            <form
              className={styles.searchShell}
              onSubmit={handleSearchSubmit}
            >
              <div className={styles.categorySelect}>
                <button
                  type="button"
                  className={styles.categoryButton}
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  aria-expanded={dropdownOpen}
                >
                  <span>{category}</span>
                  <span className={styles.chevron}>▾</span>
                </button>

                {dropdownOpen ? (
                  <div className={styles.categoryMenu}>
                    {SEARCH_CATEGORIES.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={styles.categoryMenuItem}
                        onClick={() => handleSelectCategory(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <input
                className={styles.searchInput}
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="지역 또는 키워드 검색"
              />

              <button
                type="submit"
                className={styles.searchButton}
                aria-label="검색"
              >
                🔍
              </button>
            </form>
          </div>

          <div className={styles.keywordScroller}>
            {RECOMMENDED_KEYWORDS.map((keyword) => (
              <button
                key={keyword}
                type="button"
                className={styles.keywordChip}
                onClick={() => handleKeywordClick(keyword)}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.categoryGrid}>
          {MAIN_CATEGORY_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={styles.categoryCard}
              onClick={() => handleOpenMainCategory(item.href)}
            >
              <span className={styles.categoryIcon}>
                {item.icon}
              </span>

              <span className={styles.categoryTitle}>
                {item.title}
              </span>

              <span className={styles.categoryDescription}>
                {item.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      {regionOverlayOpen ? (
        <FeedRegionOverlay
          onClose={() => setRegionOverlayOpen(false)}
        />
      ) : null}
    </main>
  )
}

function FeedRegionButton({
  className,
  onClick
}: {
  className: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label="피드지역 선택"
      onClick={onClick}
    >
      <span className={styles.regionIcon}>⌖</span>
      <span>피드지역</span>
      <span className={styles.chevron}>▾</span>
    </button>
  )
}
