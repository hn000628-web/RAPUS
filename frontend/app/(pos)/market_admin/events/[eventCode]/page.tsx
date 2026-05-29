import { redirect } from 'next/navigation'

const DEFAULT_MARKET_CHANNEL_CODE = 'B8X7C6V5B4N3M'

type LegacyMarketEventDetailPageProps = {
  params: Promise<{
    eventCode: string
  }>
}

export default async function LegacyMarketEventDetailPage({
  params,
}: LegacyMarketEventDetailPageProps) {
  const { eventCode } = await params

  redirect(`/market_admin/${DEFAULT_MARKET_CHANNEL_CODE}/events/${eventCode}`)
}
