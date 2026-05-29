import {
  MarketAdminRouteShell,
  MockTable,
  StatusBadge,
} from '../../_components/MarketAdminRouteShell'
import { CATEGORY_ROWS } from '../../_components/mockData'
import styles from '../../_components/market-admin-route-shell.module.css'

type MarketAdminCategoriesPageProps = {
  params: Promise<{
    channelCode: string
  }>
}

export default async function MarketAdminCategoriesPage({
  params,
}: MarketAdminCategoriesPageProps) {
  const { channelCode } = await params

  return (
    <MarketAdminRouteShell
      activePath={`/market_admin/${channelCode}/categories`}
      channelCode={channelCode}
      title="카테고리 관리"
      description="마트 피드와 행사 노출에 사용하는 운영 카테고리 mock 화면입니다."
    >
      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>카테고리 정렬</h2>
            <p className={styles.sectionDescription}>
              상품 분류, 피드 섹션, 대표 배너 연결 상태를 빠르게 확인합니다.
            </p>
          </div>
          <StatusBadge>MOCK</StatusBadge>
        </div>

        <MockTable
          columns={['카테고리', 'categoryCode', '대표 배너', 'sortOrder', '상태']}
          rows={CATEGORY_ROWS}
        />
      </section>
    </MarketAdminRouteShell>
  )
}
