import {
  MarketAdminRouteShell,
  MockTable,
} from '../../_components/MarketAdminRouteShell'
import { PRODUCT_ROWS } from '../../_components/mockData'
import styles from '../../_components/market-admin-route-shell.module.css'

type MarketAdminProductsPageProps = {
  params: Promise<{
    channelCode: string
  }>
}

export default async function MarketAdminProductsPage({
  params,
}: MarketAdminProductsPageProps) {
  const { channelCode } = await params

  return (
    <MarketAdminRouteShell
      activePath={`/market_admin/${channelCode}/products`}
      channelCode={channelCode}
      title="상품 관리"
      description="마켓 판매상품, 행사상품, 재고 상태를 검수하는 mock 운영 테이블입니다."
    >
      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <input
            className={styles.searchInput}
            placeholder="상품명 / 바코드 / 행사코드 검색"
          />
          <button className={styles.button}>검색</button>
        </div>

        <MockTable
          columns={['썸네일', '상품명', '바코드', '판매가', '재고', '상태']}
          rows={PRODUCT_ROWS}
        />
      </section>
    </MarketAdminRouteShell>
  )
}
