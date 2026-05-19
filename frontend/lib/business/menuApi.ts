import { apiFetch } from '@/lib/api'

export type PostType =
  | 'INFO'
  | 'SUMMARY'
  | 'GENERAL'
  | 'GALLERY'
  | 'PRODUCT'
  | 'EVENT'
  | 'REVIEW'

export type BusinessMenuConfigItem = {
  id: number
  menuType: PostType
  label: string
  sortOrder: number
  isEnabled: boolean
  isDefault: boolean
  isRequired: boolean
  deletable: boolean
  postType: PostType
  title: string
  name: string
  isActive: boolean
  isSystem: boolean
}

export type MenuItem = BusinessMenuConfigItem

export type SaveBusinessMenuConfigItem = {
  menuType: PostType
  label: string
  sortOrder: number
  isEnabled: boolean
}

export async function getBusinessMenus(
  channelCode?: string
): Promise<BusinessMenuConfigItem[]> {
  const normalizedChannelCode = String(channelCode || '').trim()

  const res = await apiFetch<{
    ok: boolean
    profileId?: number | null
    channelCode?: string | null
    menus: BusinessMenuConfigItem[]
  }>(
    normalizedChannelCode
      ? `business/menu/public?channelCode=${encodeURIComponent(normalizedChannelCode)}`
      : 'business/menu-config'
  )

  return Array.isArray(res.menus) ? res.menus : []
}

export async function saveBusinessMenus(
  menus: SaveBusinessMenuConfigItem[],
  channelCode: string,
  profileId?: number
) {
  return apiFetch('business/menu-config', {
    method: 'PATCH',
    body: {
      profileId,
      channelCode,
      menus
    }
  })
}
