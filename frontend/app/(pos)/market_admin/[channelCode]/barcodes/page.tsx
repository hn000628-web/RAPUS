import {
  MarketAdminRouteShell,
  MockTable,
} from '../../_components/MarketAdminRouteShell'
import { BARCODE_ROWS } from '../../_components/mockData'
import styles from '../../_components/market-admin-route-shell.module.css'

type MarketAdminBarcodesPageProps = {
  params: Promise<{
    channelCode: string
  }>
}

export default async function MarketAdminBarcodesPage({
  params,
}: MarketAdminBarcodesPageProps) {
  const { channelCode } = await params

  return (
    <MarketAdminRouteShell
      activePath={`/market_admin/${channelCode}/barcodes`}
      channelCode={channelCode}
      title="바코드 / 상품원장 관리"
      description="CSV 업로드와 scanCodeValue 기반 상품 원장 연결을 검수하는 mock 화면입니다."
    >
      <section className={styles.panel}>
        <div className={styles.dropZone}>
          <p className={styles.dropTitle}>CSV / 엑셀 파일 업로드 영역</p>
          <p className={styles.dropText}>
            현재 단계는 mock UI이며 실제 업로드 API는 연결하지 않았습니다.
          </p>
        </div>
      </section>

      <section className={styles.panel}>
        <MockTable
          columns={['scanCodeValue', 'productCode', '상품명', '연결 상태']}
          rows={BARCODE_ROWS}
        />
      </section>
    </MarketAdminRouteShell>
  )
}
