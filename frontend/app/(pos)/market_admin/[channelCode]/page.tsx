import { MarketAdminConsole } from '../_components/MarketAdminConsole'

type MarketAdminChannelPageProps = {
  params: Promise<{
    channelCode: string
  }>
}

export default async function MarketAdminChannelPage({
  params,
}: MarketAdminChannelPageProps) {
  const { channelCode } = await params

  return <MarketAdminConsole channelCode={channelCode} />
}
