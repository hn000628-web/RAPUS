import {
  buildApiUrl
} from './config'

export type MarketHeroBanner = {
  id: number
  channelCode: string
  bannerSlot: string
  imageAssetId: number
  sortOrder: number
  title: string | null
  description: string | null
  linkUrl: string | null
  displayStatus: 'VISIBLE' | 'HIDDEN'
  isActive?: number
  imageFilePath: string
  imageUrl: string
  createdAt: string | null
  updatedAt: string | null
}

type MarketHeroBannerResponse = {
  success: boolean
  banner: MarketHeroBanner | null
  banners?: MarketHeroBanner[]
  sourceChannelCode?: string
  fallbackUsed?: boolean
}

export type MarketBrandAdConfig = {
  channelCode: string
  title: string
  description: string
  displayStatus: 'VISIBLE' | 'HIDDEN'
  isActive: number
}

type MarketBrandAdResponse = {
  success: boolean
  config: MarketBrandAdConfig
  sourceChannelCode?: string
  fallbackUsed?: boolean
}

export type MarketBrandAdLogo = {
  id: number
  channelCode: string
  imageAssetId: number
  sortOrder: number
  displayStatus: 'VISIBLE' | 'HIDDEN'
  isActive: number
  imageFilePath: string
  imageUrl: string
  createdAt: string | null
  updatedAt: string | null
}

type MarketBrandAdLogosResponse = {
  success: boolean
  logos: MarketBrandAdLogo[]
  sourceChannelCode?: string
  fallbackUsed?: boolean
}

export type MarketHeroBannerConfig = {
  banner: MarketHeroBanner | null
  banners: MarketHeroBanner[]
  sourceChannelCode: string | null
  fallbackUsed: boolean
}

async function readApiErrorMessage(
  response: Response,
  fallbackMessage: string
) {
  const responseText =
    await response.text()

  if (!responseText) {
    return `${fallbackMessage} (${response.status})`
  }

  try {
    const data =
      JSON.parse(responseText) as {
        message?: string | string[]
        error?: string
      }

    if (Array.isArray(data.message)) {
      return data.message.join(', ')
    }

    return data.message || data.error || `${fallbackMessage} (${response.status})`
  } catch {
    return responseText
  }
}

export async function getMarketHeroBannerConfig(
  channelCode: string
): Promise<MarketHeroBannerConfig> {
  const params =
    new URLSearchParams({
      channelCode
    })

  const response =
    await fetch(
      buildApiUrl(`/market-admin/banners/hero?${params.toString()}`),
      {
        cache: 'no-store'
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_HERO_BANNER_LOAD_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketHeroBannerResponse

  return {
    banner: data.banner ?? null,
    banners: data.banners ?? (data.banner ? [data.banner] : []),
    sourceChannelCode: data.sourceChannelCode ?? null,
    fallbackUsed: Boolean(data.fallbackUsed)
  }
}

export async function getMarketHeroBannerManageConfig(
  channelCode: string
): Promise<MarketHeroBannerConfig> {
  const params =
    new URLSearchParams({
      channelCode
    })

  const response =
    await fetch(
      buildApiUrl(`/market-admin/banners/hero/manage?${params.toString()}`),
      {
        cache: 'no-store'
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_HERO_BANNER_MANAGE_LOAD_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketHeroBannerResponse

  return {
    banner: data.banner ?? null,
    banners: data.banners ?? (data.banner ? [data.banner] : []),
    sourceChannelCode: data.sourceChannelCode ?? null,
    fallbackUsed: Boolean(data.fallbackUsed)
  }
}

export async function getMarketHeroBanner(
  channelCode: string
): Promise<MarketHeroBanner | null> {
  const config =
    await getMarketHeroBannerConfig(channelCode)

  return config.banner
}

export async function uploadMarketHeroBanner(params: {
  channelCode: string
  file: File
  title?: string
  description?: string
  sortOrder?: number
}): Promise<MarketHeroBannerConfig> {
  const formData =
    new FormData()

  formData.append(
    'channelCode',
    params.channelCode
  )
  formData.append(
    'file',
    params.file
  )

  if (params.title) {
    formData.append(
      'title',
      params.title
    )
  }

  if (params.description) {
    formData.append(
      'description',
      params.description
    )
  }

  if (params.sortOrder !== undefined) {
    formData.append(
      'sortOrder',
      String(params.sortOrder)
    )
  }

  const response =
    await fetch(
      buildApiUrl('/market-admin/banners/hero'),
      {
        method: 'POST',
        body: formData
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_HERO_BANNER_UPLOAD_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketHeroBannerResponse

  return {
    banner: data.banner ?? null,
    banners: data.banners ?? (data.banner ? [data.banner] : []),
    sourceChannelCode: data.sourceChannelCode ?? null,
    fallbackUsed: Boolean(data.fallbackUsed)
  }
}

export async function updateMarketHeroBannerSelection(params: {
  channelCode: string
  bannerId: number
  sortOrder?: number
  isVisible?: boolean
}): Promise<MarketHeroBannerConfig> {
  const response =
    await fetch(
      buildApiUrl('/market-admin/banners/hero/select'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_HERO_BANNER_UPDATE_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketHeroBannerResponse

  return {
    banner: data.banner ?? null,
    banners: data.banners ?? (data.banner ? [data.banner] : []),
    sourceChannelCode: data.sourceChannelCode ?? null,
    fallbackUsed: Boolean(data.fallbackUsed)
  }
}

export async function reorderMarketHeroBanners(params: {
  channelCode: string
  items: Array<{
    bannerId: number
    sortOrder: number
  }>
}): Promise<MarketHeroBannerConfig> {
  const response =
    await fetch(
      buildApiUrl('/market-admin/banners/hero/reorder'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_HERO_BANNER_REORDER_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketHeroBannerResponse

  return {
    banner: data.banner ?? null,
    banners: data.banners ?? (data.banner ? [data.banner] : []),
    sourceChannelCode: data.sourceChannelCode ?? null,
    fallbackUsed: Boolean(data.fallbackUsed)
  }
}

export async function updateMarketHeroBannerText(params: {
  channelCode: string
  bannerId: number
  title?: string
  description?: string
}): Promise<MarketHeroBannerConfig> {
  const response =
    await fetch(
      buildApiUrl('/market-admin/banners/hero/text'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_HERO_BANNER_TEXT_UPDATE_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketHeroBannerResponse

  return {
    banner: data.banner ?? null,
    banners: data.banners ?? (data.banner ? [data.banner] : []),
    sourceChannelCode: data.sourceChannelCode ?? null,
    fallbackUsed: Boolean(data.fallbackUsed)
  }
}

export async function updateMarketHeroBannerLinkUrl(params: {
  channelCode: string
  bannerId: number
  linkUrl?: string | null
}): Promise<MarketHeroBannerConfig> {
  const response =
    await fetch(
      buildApiUrl('/market-admin/banners/hero/link-url'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_HERO_BANNER_LINK_URL_UPDATE_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketHeroBannerResponse

  return {
    banner: data.banner ?? null,
    banners: data.banners ?? (data.banner ? [data.banner] : []),
    sourceChannelCode: data.sourceChannelCode ?? null,
    fallbackUsed: Boolean(data.fallbackUsed)
  }
}

export async function hideMarketHeroBanner(params: {
  channelCode: string
  bannerId: number
}): Promise<MarketHeroBannerConfig> {
  const response =
    await fetch(
      buildApiUrl('/market-admin/banners/hero/hide'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_HERO_BANNER_HIDE_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketHeroBannerResponse

  return {
    banner: data.banner ?? null,
    banners: data.banners ?? (data.banner ? [data.banner] : []),
    sourceChannelCode: data.sourceChannelCode ?? null,
    fallbackUsed: Boolean(data.fallbackUsed)
  }
}

export async function deleteMarketHeroBanner(params: {
  channelCode: string
  bannerId: number
}): Promise<MarketHeroBannerConfig> {
  const response =
    await fetch(
      buildApiUrl('/market-admin/banners/hero/delete'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_HERO_BANNER_DELETE_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketHeroBannerResponse

  return {
    banner: data.banner ?? null,
    banners: data.banners ?? (data.banner ? [data.banner] : []),
    sourceChannelCode: data.sourceChannelCode ?? null,
    fallbackUsed: Boolean(data.fallbackUsed)
  }
}

export async function getMarketBrandAdConfig(
  channelCode: string
): Promise<MarketBrandAdConfig> {
  const params =
    new URLSearchParams({
      channelCode
    })

  const response =
    await fetch(
      buildApiUrl(`/market-admin/banners/brand-text?${params.toString()}`),
      {
        cache: 'no-store'
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_BRAND_AD_CONFIG_LOAD_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketBrandAdResponse

  return data.config
}

export async function updateMarketBrandAdConfig(params: {
  channelCode: string
  brandAdTitle: string
  brandAdDescription: string
}): Promise<MarketBrandAdConfig> {
  const response =
    await fetch(
      buildApiUrl('/market-admin/banners/brand-text'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_BRAND_AD_CONFIG_SAVE_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketBrandAdResponse

  return data.config
}

export async function getMarketBrandAdLogos(
  channelCode: string
): Promise<MarketBrandAdLogo[]> {
  const params =
    new URLSearchParams({
      channelCode
    })

  const response =
    await fetch(
      buildApiUrl(`/market-admin/banners/brand-logos?${params.toString()}`),
      { cache: 'no-store' }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_BRAND_AD_LOGOS_LOAD_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketBrandAdLogosResponse

  return data.logos ?? []
}

export async function getMarketBrandAdLogosManage(
  channelCode: string
): Promise<MarketBrandAdLogo[]> {
  const params =
    new URLSearchParams({
      channelCode
    })

  const response =
    await fetch(
      buildApiUrl(`/market-admin/banners/brand-logos/manage?${params.toString()}`),
      { cache: 'no-store' }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_BRAND_AD_LOGOS_MANAGE_LOAD_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketBrandAdLogosResponse

  return data.logos ?? []
}

export async function uploadMarketBrandAdLogo(params: {
  channelCode: string
  file: File
  sortOrder: number
}): Promise<MarketBrandAdLogo[]> {
  const formData =
    new FormData()

  formData.append('channelCode', params.channelCode)
  formData.append('file', params.file)
  formData.append('sortOrder', String(params.sortOrder))

  const response =
    await fetch(
      buildApiUrl('/market-admin/banners/brand-logos'),
      {
        method: 'POST',
        body: formData
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_BRAND_AD_LOGO_UPLOAD_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketBrandAdLogosResponse

  return data.logos ?? []
}

export async function updateMarketBrandAdLogoSelection(params: {
  channelCode: string
  logoId: number
  sortOrder?: number
  isVisible?: boolean
}): Promise<MarketBrandAdLogo[]> {
  const response =
    await fetch(
      buildApiUrl('/market-admin/banners/brand-logos/select'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_BRAND_AD_LOGO_UPDATE_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketBrandAdLogosResponse

  return data.logos ?? []
}

export async function reorderMarketBrandAdLogos(params: {
  channelCode: string
  items: Array<{
    logoId: number
    sortOrder: number
  }>
}): Promise<MarketBrandAdLogo[]> {
  const response =
    await fetch(
      buildApiUrl('/market-admin/banners/brand-logos/reorder'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_BRAND_AD_LOGO_REORDER_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketBrandAdLogosResponse

  return data.logos ?? []
}

export async function hideMarketBrandAdLogo(params: {
  channelCode: string
  logoId: number
}): Promise<MarketBrandAdLogo[]> {
  const response =
    await fetch(
      buildApiUrl('/market-admin/banners/brand-logos/hide'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_BRAND_AD_LOGO_HIDE_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketBrandAdLogosResponse

  return data.logos ?? []
}

export async function deleteMarketBrandAdLogo(params: {
  channelCode: string
  logoId: number
}): Promise<MarketBrandAdLogo[]> {
  const response =
    await fetch(
      buildApiUrl('/market-admin/banners/brand-logos/delete'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    ).catch(() => {
      throw new Error('API_SERVER_UNREACHABLE')
    })

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(
        response,
        'MARKET_BRAND_AD_LOGO_DELETE_FAILED'
      )
    )
  }

  const data =
    await response.json() as MarketBrandAdLogosResponse

  return data.logos ?? []
}
