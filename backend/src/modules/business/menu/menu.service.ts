import {
  BadRequestException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'

import Database from 'better-sqlite3'

// ==================================================
// SECTION 01 : TYPE
// ==================================================

type JwtUser = {
  sub?: number
  profileId?: number
  profileType?: 'GENERAL' | 'BUSINESS'
}

type MenuType =
  | 'INFO'
  | 'SUMMARY'
  | 'REVIEW'
  | 'EVENT'
  | 'PRODUCT'
  | 'GENERAL'
  | 'GALLERY'

type BusinessProfileRow = {
  id: number
  channelCode: string
}

type MenuRow = {
  id: number
  postType: MenuType
  name: string
  title: string
  sortOrder: number
  isActive: number
  isSystem: number
  isDefault: number
  isRequired: number
  deletable: number
}

type SaveMenuItem = {
  menuType: MenuType
  label?: string
  sortOrder?: number
  isEnabled?: boolean | number
}

type DefaultMenuConfig = {
  menuType: MenuType
  label: string
  sortOrder: number
  isDefault: 0 | 1
  isRequired: 0 | 1
  isEnabled: 0 | 1
  deletable: 0 | 1
}

const DEFAULT_MENU_CONFIGS: DefaultMenuConfig[] = [
  { menuType: 'INFO', label: '안내', sortOrder: 1, isDefault: 1, isRequired: 1, isEnabled: 1, deletable: 0 },
  { menuType: 'SUMMARY', label: '소개', sortOrder: 2, isDefault: 1, isRequired: 1, isEnabled: 1, deletable: 0 },
  { menuType: 'REVIEW', label: '리뷰', sortOrder: 3, isDefault: 1, isRequired: 1, isEnabled: 1, deletable: 0 },
  { menuType: 'EVENT', label: '이벤트', sortOrder: 4, isDefault: 0, isRequired: 0, isEnabled: 1, deletable: 1 },
  { menuType: 'PRODUCT', label: '메뉴/상품/서비스', sortOrder: 5, isDefault: 0, isRequired: 0, isEnabled: 1, deletable: 1 },
  { menuType: 'GENERAL', label: '게시물', sortOrder: 6, isDefault: 0, isRequired: 0, isEnabled: 1, deletable: 1 },
  { menuType: 'GALLERY', label: '사진첩', sortOrder: 7, isDefault: 0, isRequired: 0, isEnabled: 1, deletable: 1 }
]

const DEFAULT_MENU_MAP = new Map<MenuType, DefaultMenuConfig>(
  DEFAULT_MENU_CONFIGS.map((config) => [config.menuType, config])
)

// ==================================================
// SECTION 02 : SERVICE
// ==================================================

@Injectable()
export class MenuService {
  private readonly db: Database.Database

  constructor() {
    this.db = new Database('data/prod.sqlite')
  }

  // ==================================================
  // SECTION 03 : PROFILE RESOLVER
  // ==================================================

  private getBusinessProfile(user: JwtUser): BusinessProfileRow {
    if (!user?.profileId) {
      throw new UnauthorizedException('PROFILE_REQUIRED')
    }

    if (user.profileType !== 'BUSINESS') {
      throw new UnauthorizedException('BUSINESS_PROFILE_REQUIRED')
    }

    const profile = this.db.prepare(`
      SELECT id, channelCode
      FROM profiles
      WHERE id = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(user.profileId) as BusinessProfileRow | undefined

    if (!profile) {
      throw new UnauthorizedException('PROFILE_NOT_FOUND')
    }

    return profile
  }

  // ==================================================
  // SECTION 04 : MENU DEFAULT ENSURE
  // ==================================================

  public ensureDefaultBusinessMenuConfig(profileId: number, channelCode: string): void {
    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO profile_categories(
        profileId,
        channelCode,
        postType,
        name,
        title,
        sortOrder,
        isActive,
        isSystem,
        isDefault,
        isRequired,
        deletable,
        createdAt,
        updatedAt
      )
      VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `)

    const tx = this.db.transaction(() => {
      for (const config of DEFAULT_MENU_CONFIGS) {
        insert.run(
          profileId,
          channelCode,
          config.menuType,
          config.label,
          config.label,
          config.sortOrder,
          config.isEnabled,
          config.isDefault,
          config.isDefault,
          config.isRequired,
          config.deletable
        )
      }
    })

    tx()
  }

  private fetchRows(profileId: number): MenuRow[] {
    return this.db.prepare(`
      SELECT
        id,
        postType,
        name,
        title,
        sortOrder,
        isActive,
        isSystem,
        COALESCE(isDefault, 0) as isDefault,
        COALESCE(isRequired, 0) as isRequired,
        COALESCE(deletable, 1) as deletable
      FROM profile_categories
      WHERE profileId = ?
      ORDER BY sortOrder ASC, id ASC
    `).all(profileId) as MenuRow[]
  }

  private mapMenuResponse(rows: MenuRow[]) {
    return rows.map((row) => ({
      id: row.id,
      profileId: undefined,
      channelCode: undefined,
      menuType: row.postType,
      label: row.title || row.name,
      sortOrder: row.sortOrder,
      isEnabled: row.isActive === 1,
      isDefault: row.isDefault === 1,
      isRequired: row.isRequired === 1,
      deletable: row.deletable === 1,
      postType: row.postType,
      title: row.title,
      name: row.name,
      isActive: row.isActive === 1,
      isSystem: row.isSystem === 1
    }))
  }

  private assertValidMenuType(menuType: string): asserts menuType is MenuType {
    if (!DEFAULT_MENU_MAP.has(menuType as MenuType)) {
      throw new BadRequestException(`INVALID_MENU_TYPE_${menuType}`)
    }
  }

  // ==================================================
  // SECTION 05 : GET MENUS
  // ==================================================

  async getMenus(user: JwtUser) {
    const profile = this.getBusinessProfile(user)
    this.ensureDefaultBusinessMenuConfig(profile.id, profile.channelCode)

    const rows = this.fetchRows(profile.id)

    return {
      ok: true,
      profileId: profile.id,
      channelCode: profile.channelCode,
      menus: this.mapMenuResponse(rows)
    }
  }

  // ==================================================
  // SECTION 05-1 : GET MENUS BY CHANNELCODE (PUBLIC READ)
  // ==================================================

  async getMenusByChannelCode(channelCode: string) {
    const normalizedChannelCode = String(channelCode || '').trim()

    if (!normalizedChannelCode) {
      throw new BadRequestException('CHANNEL_CODE_REQUIRED')
    }

    const profile = this.db.prepare(`
      SELECT id, channelCode
      FROM profiles
      WHERE channelCode = ?
        AND profileType = 'BUSINESS'
      LIMIT 1
    `).get(normalizedChannelCode) as BusinessProfileRow | undefined

    if (!profile) {
      return {
        ok: true,
        profileId: null,
        channelCode: normalizedChannelCode,
        menus: []
      }
    }

    this.ensureDefaultBusinessMenuConfig(profile.id, profile.channelCode)
    const rows = this.fetchRows(profile.id)

    return {
      ok: true,
      profileId: profile.id,
      channelCode: profile.channelCode,
      menus: this.mapMenuResponse(rows)
    }
  }

  // ==================================================
  // SECTION 06 : SAVE MENUS (PATCH)
  // ==================================================

  async saveMenus(user: JwtUser, menus: SaveMenuItem[]) {
    if (!Array.isArray(menus)) {
      throw new BadRequestException('INVALID_MENUS')
    }

    const profile = this.getBusinessProfile(user)
    this.ensureDefaultBusinessMenuConfig(profile.id, profile.channelCode)

    const uniqueMenuTypes = new Set<MenuType>()

    for (const [index, item] of menus.entries()) {
      if (!item?.menuType) {
        throw new BadRequestException(`MENU_TYPE_REQUIRED_AT_${index}`)
      }

      this.assertValidMenuType(item.menuType)

      if (uniqueMenuTypes.has(item.menuType)) {
        throw new BadRequestException(`DUPLICATE_MENU_TYPE_${item.menuType}`)
      }

      uniqueMenuTypes.add(item.menuType)

      if (!item.label || String(item.label).trim() === '') {
        throw new BadRequestException(`LABEL_REQUIRED_AT_${index}`)
      }

      if (
        item.sortOrder !== undefined &&
        (
          typeof item.sortOrder !== 'number' ||
          Number.isNaN(item.sortOrder) ||
          item.sortOrder < 1
        )
      ) {
        throw new BadRequestException(`INVALID_SORT_ORDER_AT_${index}`)
      }
    }

    for (const requiredType of ['INFO', 'SUMMARY', 'REVIEW'] as const) {
      if (!uniqueMenuTypes.has(requiredType)) {
        throw new BadRequestException(`REQUIRED_MENU_MISSING_${requiredType}`)
      }
    }

    const updateStmt = this.db.prepare(`
      UPDATE profile_categories
      SET
        title = ?,
        name = ?,
        sortOrder = ?,
        isActive = ?,
        isSystem = ?,
        isDefault = ?,
        isRequired = ?,
        deletable = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE profileId = ?
        AND postType = ?
    `)

    const deleteStmt = this.db.prepare(`
      DELETE FROM profile_categories
      WHERE profileId = ?
        AND postType = ?
        AND COALESCE(deletable, 1) = 1
    `)

    const tx = this.db.transaction((payload: SaveMenuItem[]) => {
      const sorted = [...payload].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      )

      sorted.forEach((item, index) => {
        const policy = DEFAULT_MENU_MAP.get(item.menuType)

        if (!policy) {
          throw new BadRequestException(`MENU_POLICY_NOT_FOUND_${item.menuType}`)
        }

        const isEnabled = policy.isRequired === 1
          ? 1
          : (item.isEnabled ? 1 : 0)

        updateStmt.run(
          String(item.label || '').trim(),
          String(item.label || '').trim(),
          index + 1,
          isEnabled,
          policy.isDefault,
          policy.isDefault,
          policy.isRequired,
          policy.deletable,
          profile.id,
          item.menuType
        )
      })

      for (const policy of DEFAULT_MENU_CONFIGS) {
        const exists = sorted.some((item) => item.menuType === policy.menuType)
        if (!exists && policy.deletable === 1) {
          deleteStmt.run(profile.id, policy.menuType)
        }
      }
    })

    tx(menus)

    const rows = this.fetchRows(profile.id)

    return {
      ok: true,
      profileId: profile.id,
      channelCode: profile.channelCode,
      menus: this.mapMenuResponse(rows)
    }
  }
}
