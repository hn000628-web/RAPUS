// FILE : frontend/app/(pos)/market_admin/[channelCode]/events/[eventCode]/page.tsx
// ROLE : CHANNEL BASED MARKET EVENT DETAIL MOCK PAGE

// SECTION 01 : IMPORT
import Link from 'next/link'

import { EVENT_CARDS, PRODUCT_ROWS } from '../../../_components/mockData'
import styles from '../../../events/[eventCode]/market-event-detail.module.css'

// SECTION 02 : TYPE
type MarketEventDetailPageProps = {
  params: Promise<{
    channelCode: string
    eventCode: string
  }>
}

type MockEventProduct = {
  id: string
  productCode: string
  productName: string
  brandName: string
  salePrice: number
  currentStock: number
  eventStatus: string
  isSoldOut: boolean
}

// SECTION 03 : MOCK DATA
const MOCK_EVENT_PRODUCTS: MockEventProduct[] = PRODUCT_ROWS.map((row, index) => ({
  id: `mock-event-product-${index + 1}`,
  productCode: row[2] ?? '-',
  productName: row[1] ?? '상품명 미등록',
  brandName: index === 0 ? '농심' : index === 1 ? '산지직송' : '정육센터',
  salePrice: Number((row[3] ?? '0').replaceAll(',', '')),
  currentStock: Number(row[4] ?? '0'),
  eventStatus: index === 0 ? 'ACTIVE' : index === 1 ? 'SCHEDULED' : 'READY',
  isSoldOut: Number(row[4] ?? '0') <= 0,
}))

function getMockEvent(eventCode: string) {
  return (
    EVENT_CARDS.find((event) => event.eventCode === eventCode)
    ?? {
      eventCode,
      title: '행사 상세 mock',
      period: '기간 미설정',
      productCount: '0개 상품',
      status: 'MOCK' as const,
    }
  )
}

// SECTION 04 : PAGE
export default async function MarketEventDetailPage({
  params,
}: MarketEventDetailPageProps) {
  const {
    channelCode,
    eventCode,
  } = await params
  const event = getMockEvent(eventCode)

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.headerPanel}>
          <div>
            <span className={styles.headerBadge}>EVENT DETAIL</span>
            <h1>{event.title}</h1>
            <p>
              channelCode {channelCode} · eventCode {event.eventCode}
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link href={`/market_admin/${channelCode}/events`}>
              행사 목록
            </Link>
            <Link href={`/market_admin/${channelCode}`}>
              운영 허브
            </Link>
          </div>
        </section>

        <section className={styles.infoGrid}>
          <article>
            <span>행사 상태</span>
            <strong>{event.status}</strong>
          </article>
          <article>
            <span>행사 유형</span>
            <strong>PROMOTION</strong>
          </article>
          <article>
            <span>행사 기간</span>
            <strong>{event.period}</strong>
          </article>
          <article>
            <span>행사 상품 수</span>
            <strong>{event.productCount}</strong>
          </article>
          <article>
            <span>운영 채널</span>
            <strong>{channelCode}</strong>
          </article>
          <article className={styles.infoWide}>
            <span>행사 설명</span>
            <strong>현재 단계는 mock 기반 행사 상세 UI Shell입니다.</strong>
          </article>
        </section>

        <section className={styles.bannerPanel}>
          <div>
            <h2>행사 배너</h2>
            <p>bannerImageAssetId 연결 구조를 위한 mock preview입니다.</p>
          </div>
          <div className={styles.bannerContent}>
            <div className={styles.bannerPreview}>
              <span>배너 미등록</span>
            </div>
            <div className={styles.bannerControls}>
              <button type="button" disabled>
                배너 등록
              </button>
              <button type="button" disabled>
                배너 변경
              </button>
              <button type="button" disabled>
                배너 제거
              </button>
            </div>
          </div>
        </section>

        <section className={styles.productPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>행사 상품 리스트</h2>
              <p>eventCode로 연결될 마켓 운영 상품 mock 목록입니다.</p>
            </div>
            <span>{MOCK_EVENT_PRODUCTS.length.toLocaleString()}개 연결</span>
          </div>

          <div className={styles.productGrid}>
            {MOCK_EVENT_PRODUCTS.map((product) => (
              <article
                key={product.id}
                className={styles.productCard}
              >
                <div className={styles.productThumbnail}>
                  <span>NO IMAGE</span>
                  {product.isSoldOut ? (
                    <strong className={styles.soldOutOverlay}>품절</strong>
                  ) : null}
                </div>
                <div className={styles.productBody}>
                  <span className={styles.eventBadge}>{product.eventStatus}</span>
                  <strong>{product.productName}</strong>
                  <p>{product.brandName}</p>
                  <p>판매가 {product.salePrice.toLocaleString()}원</p>
                  <p>
                    재고 {product.currentStock.toLocaleString()}개 ·{' '}
                    {product.isSoldOut ? '품절' : '판매 가능'}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.removeButton}
                  disabled
                >
                  행사 제거
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.productPanel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>행사 상품 추가</h2>
              <p>실제 저장 없이 상품 검색과 연결 위치만 준비합니다.</p>
            </div>
          </div>
          <input
            className={styles.searchInput}
            placeholder="상품명 / 바코드 / productCode 검색"
            disabled
          />
          <div className={styles.searchList}>
            {MOCK_EVENT_PRODUCTS.slice(0, 2).map((product) => (
              <article
                key={`search-${product.id}`}
                className={styles.searchItem}
              >
                <div>
                  <strong>{product.productName}</strong>
                  <span>{product.productCode} · channelCode {channelCode}</span>
                </div>
                <button type="button" disabled>
                  상품 연결
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
