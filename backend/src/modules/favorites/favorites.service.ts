import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import db from '../../config/database'

type JwtUser = {
  profileId?: number
  channelCode?: string
}

type FavoriteStatus = 'ACTIVE' | 'DELETED'

type ProfileType = 'GENERAL' | 'BUSINESS'

type PostType = 'GENERAL' | 'GALLERY' | 'PRODUCT' | 'EVENT' | 'REVIEW'

type ActorContext = {
  actorProfileId: number
  actorChannelCode: string
}

type ProviderProfileRow = {
  id: number
  channelCode: string
  profileType: ProfileType
  displayName: string | null
  channelURL: string | null
}

type ProductRow = {
  id: number
  profileId: number
  channelCode: string
  productCode: string
  productName: string | null
  basePrice: number | null
  currency: string | null
}

type PostRow = {
  id: number
  profileId: number
  channelCode: string
  postCode: string
  postType: PostType
  title: string | null
  content: string | null
}

@Injectable()
export class FavoritesService {
  private normalizeRequiredCode(value: unknown, fieldName: string): string {
    const code = String(value ?? '').trim().toUpperCase()
    if (!code) {
      throw new BadRequestException(`${fieldName} is required`)
    }
    return code
  }

  private normalizeChannelCode13(value: unknown, fieldName: string): string {
    const code = this.normalizeRequiredCode(value, fieldName)
    if (!/^[A-Z][A-Z0-9]{12}$/.test(code)) {
      throw new BadRequestException(`${fieldName} must be a 13 character channelCode`)
    }
    return code
  }

  private normalizeBusinessCode12(value: unknown, fieldName: string): string {
    const code = this.normalizeRequiredCode(value, fieldName)
    if (!/^[A-Z0-9]{12}$/.test(code)) {
      throw new BadRequestException(`${fieldName} must be a 12 character business code`)
    }
    return code
  }

  private normalizeStatus(value?: string): FavoriteStatus {
    const normalized = String(value ?? 'ACTIVE').trim().toUpperCase()
    if (normalized !== 'ACTIVE' && normalized !== 'DELETED') {
      throw new BadRequestException('status must be ACTIVE or DELETED')
    }
    return normalized
  }

  private getActorContext(user?: JwtUser): ActorContext {
    const actorProfileId = Number(user?.profileId ?? 0)
    const actorChannelCode = String(user?.channelCode ?? '').trim().toUpperCase()

    if (!actorProfileId || !actorChannelCode) {
      throw new UnauthorizedException('invalid auth context')
    }

    const actor = db
      .prepare(
        `
          SELECT id, channelCode
          FROM profiles
          WHERE id = ?
            AND channelCode = ?
          LIMIT 1
        `
      )
      .get(actorProfileId, actorChannelCode) as { id?: number; channelCode?: string } | undefined

    if (!actor?.id || !actor?.channelCode) {
      throw new UnauthorizedException('actor profile not found')
    }

    return {
      actorProfileId: actorProfileId,
      actorChannelCode: actorChannelCode
    }
  }

  private getProviderProfile(providerChannelCode: string): ProviderProfileRow {
    const row = db
      .prepare(
        `
          SELECT
            id,
            channelCode,
            profileType,
            displayName,
            channelURL
          FROM profiles
          WHERE channelCode = ?
          LIMIT 1
        `
      )
      .get(providerChannelCode) as ProviderProfileRow | undefined

    if (!row?.id) {
      throw new NotFoundException('provider profile not found')
    }

    return row
  }

  private getTargetProduct(providerChannelCode: string, productCode: string): ProductRow {
    const row = db
      .prepare(
        `
          SELECT
            id,
            profileId,
            channelCode,
            productCode,
            productName,
            basePrice,
            currency
          FROM pos_products
          WHERE channelCode = ?
            AND productCode = ?
          LIMIT 1
        `
      )
      .get(providerChannelCode, productCode) as ProductRow | undefined

    if (!row?.id) {
      throw new NotFoundException('product not found')
    }

    return row
  }

  private getTargetPost(providerChannelCode: string, postCode: string): PostRow {
    const row = db
      .prepare(
        `
          SELECT
            id,
            profileId,
            channelCode,
            postCode,
            postType,
            title,
            content
          FROM posts
          WHERE channelCode = ?
            AND postCode = ?
          LIMIT 1
        `
      )
      .get(providerChannelCode, postCode) as PostRow | undefined

    if (!row?.id) {
      throw new NotFoundException('post not found')
    }

    return row
  }

  toggleProfileFavorite(user: JwtUser | undefined, providerChannelCodeInput: string) {
    const actor = this.getActorContext(user)
    const providerChannelCode = this.normalizeChannelCode13(providerChannelCodeInput, 'providerChannelCode')
    const provider = this.getProviderProfile(providerChannelCode)

    if (actor.actorChannelCode === providerChannelCode) {
      throw new BadRequestException('self favorite is not allowed')
    }

    const exists = db
      .prepare(
        `
          SELECT id, status
          FROM profile_favorites
          WHERE actorChannelCode = ?
            AND providerChannelCode = ?
          LIMIT 1
        `
      )
      .get(actor.actorChannelCode, providerChannelCode) as { id: number; status: FavoriteStatus } | undefined

    let nextStatus: FavoriteStatus = 'ACTIVE'

    const tx = db.transaction(() => {
      if (!exists?.id) {
        db.prepare(
          `
            INSERT INTO profile_favorites(
              actorProfileId,
              actorChannelCode,
              providerProfileId,
              providerChannelCode,
              providerProfileType,
              status,
              createdAt,
              updatedAt
            )
            VALUES(?,?,?,?,?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
          `
        ).run(
          actor.actorProfileId,
          actor.actorChannelCode,
          provider.id,
          provider.channelCode,
          provider.profileType
        )
        nextStatus = 'ACTIVE'
        return
      }

      nextStatus = exists.status === 'ACTIVE' ? 'DELETED' : 'ACTIVE'
      db.prepare(
        `
          UPDATE profile_favorites
          SET
            status = ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `
      ).run(nextStatus, exists.id)
    })

    tx()

    return {
      ok: true as const,
      status: nextStatus,
      isFavorite: nextStatus === 'ACTIVE',
      actorChannelCode: actor.actorChannelCode,
      providerChannelCode: provider.channelCode
    }
  }

  toggleProductFavorite(
    user: JwtUser | undefined,
    params: {
      providerChannelCode: string
      productCode: string
    }
  ) {
    const actor = this.getActorContext(user)
    const providerChannelCode = this.normalizeChannelCode13(params.providerChannelCode, 'providerChannelCode')
    const productCode = this.normalizeBusinessCode12(params.productCode, 'productCode')
    const product = this.getTargetProduct(providerChannelCode, productCode)
    const provider = this.getProviderProfile(providerChannelCode)

    const exists = db
      .prepare(
        `
          SELECT id, status
          FROM product_favorites
          WHERE actorChannelCode = ?
            AND providerChannelCode = ?
            AND productCode = ?
          LIMIT 1
        `
      )
      .get(actor.actorChannelCode, providerChannelCode, productCode) as { id: number; status: FavoriteStatus } | undefined

    let nextStatus: FavoriteStatus = 'ACTIVE'
    let favoriteProfileCount = 0

    const tx = db.transaction(() => {
      if (!exists?.id) {
        db.prepare(
          `
            INSERT INTO product_favorites(
              actorProfileId,
              actorChannelCode,
              providerProfileId,
              providerChannelCode,
              productId,
              productCode,
              status,
              createdAt,
              updatedAt
            )
            VALUES(?,?,?,?,?,?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
          `
        ).run(
          actor.actorProfileId,
          actor.actorChannelCode,
          provider.id,
          provider.channelCode,
          product.id,
          product.productCode
        )
        db.prepare(
          `
            UPDATE pos_products
            SET
              favoriteProfileCount = COALESCE(favoriteProfileCount, 0) + 1,
              favoriteUpdatedAt = CURRENT_TIMESTAMP
            WHERE channelCode = ?
              AND productCode = ?
          `
        ).run(provider.channelCode, product.productCode)
        nextStatus = 'ACTIVE'
      } else {
        nextStatus = exists.status === 'ACTIVE' ? 'DELETED' : 'ACTIVE'
        db.prepare(
          `
            UPDATE product_favorites
            SET
              status = ?,
              updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
          `
        ).run(nextStatus, exists.id)

        if (nextStatus === 'ACTIVE') {
          db.prepare(
            `
              UPDATE pos_products
              SET
                favoriteProfileCount = COALESCE(favoriteProfileCount, 0) + 1,
                favoriteUpdatedAt = CURRENT_TIMESTAMP
              WHERE channelCode = ?
                AND productCode = ?
            `
          ).run(provider.channelCode, product.productCode)
        } else {
          db.prepare(
            `
              UPDATE pos_products
              SET
                favoriteProfileCount = CASE
                  WHEN COALESCE(favoriteProfileCount, 0) > 0 THEN favoriteProfileCount - 1
                  ELSE 0
                END,
                favoriteUpdatedAt = CURRENT_TIMESTAMP
              WHERE channelCode = ?
                AND productCode = ?
            `
          ).run(provider.channelCode, product.productCode)
        }
      }

      const countRow = db.prepare(
        `
          SELECT COALESCE(favoriteProfileCount, 0) AS favoriteProfileCount
          FROM pos_products
          WHERE channelCode = ?
            AND productCode = ?
          LIMIT 1
        `
      ).get(provider.channelCode, product.productCode) as { favoriteProfileCount?: number } | undefined

      favoriteProfileCount = Number(countRow?.favoriteProfileCount ?? 0)
    })

    tx()

    return {
      ok: true as const,
      status: nextStatus,
      isFavorite: nextStatus === 'ACTIVE',
      actorChannelCode: actor.actorChannelCode,
      providerChannelCode: provider.channelCode,
      productCode: product.productCode,
      favoriteProfileCount
    }
  }

  togglePostRecommendation(
    user: JwtUser | undefined,
    params: {
      providerChannelCode: string
      postCode: string
    }
  ) {
    const actor = this.getActorContext(user)
    const providerChannelCode = this.normalizeChannelCode13(params.providerChannelCode, 'providerChannelCode')
    const postCode = this.normalizeBusinessCode12(params.postCode, 'postCode')
    const post = this.getTargetPost(providerChannelCode, postCode)
    const provider = this.getProviderProfile(providerChannelCode)

    const exists = db
      .prepare(
        `
          SELECT id, status
          FROM post_recommendations
          WHERE actorChannelCode = ?
            AND providerChannelCode = ?
            AND postCode = ?
          LIMIT 1
        `
      )
      .get(actor.actorChannelCode, providerChannelCode, postCode) as { id: number; status: FavoriteStatus } | undefined

    let nextStatus: FavoriteStatus = 'ACTIVE'

    const tx = db.transaction(() => {
      if (!exists?.id) {
        db.prepare(
          `
            INSERT INTO post_recommendations(
              actorProfileId,
              actorChannelCode,
              providerProfileId,
              providerChannelCode,
              postId,
              postCode,
              postType,
              status,
              createdAt,
              updatedAt
            )
            VALUES(?,?,?,?,?,?,?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
          `
        ).run(
          actor.actorProfileId,
          actor.actorChannelCode,
          provider.id,
          provider.channelCode,
          post.id,
          post.postCode,
          post.postType
        )
        nextStatus = 'ACTIVE'
        return
      }

      nextStatus = exists.status === 'ACTIVE' ? 'DELETED' : 'ACTIVE'
      db.prepare(
        `
          UPDATE post_recommendations
          SET
            status = ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `
      ).run(nextStatus, exists.id)
    })

    tx()

    return {
      ok: true as const,
      status: nextStatus,
      isRecommended: nextStatus === 'ACTIVE',
      actorChannelCode: actor.actorChannelCode,
      providerChannelCode: provider.channelCode,
      postCode: post.postCode
    }
  }

  getMyProfileFavorites(user: JwtUser | undefined, statusInput?: string) {
    const actor = this.getActorContext(user)
    const status = this.normalizeStatus(statusInput)

    const items = db
      .prepare(
        `
          SELECT
            pf.id,
            pf.providerProfileId,
            pf.providerChannelCode,
            pf.providerProfileType,
            p.displayName,
            p.channelURL,
            pf.status,
            pf.createdAt
          FROM profile_favorites pf
          LEFT JOIN profiles p
            ON p.id = pf.providerProfileId
          WHERE pf.actorChannelCode = ?
            AND pf.status = ?
          ORDER BY pf.createdAt DESC
        `
      )
      .all(actor.actorChannelCode, status)

    return {
      ok: true as const,
      items
    }
  }

  getMyProductFavorites(user: JwtUser | undefined, statusInput?: string) {
    const actor = this.getActorContext(user)
    const status = this.normalizeStatus(statusInput)

    const items = db
      .prepare(
        `
          SELECT
            pf.id,
            pf.providerProfileId,
            pf.providerChannelCode,
            pf.productId,
            pf.productCode,
            p.productName,
            p.basePrice,
            p.currency,
            pf.status,
            pf.createdAt
          FROM product_favorites pf
          LEFT JOIN pos_products p
            ON p.id = pf.productId
          WHERE pf.actorChannelCode = ?
            AND pf.status = ?
          ORDER BY pf.createdAt DESC
        `
      )
      .all(actor.actorChannelCode, status)

    return {
      ok: true as const,
      items
    }
  }

  getMyPostRecommendations(user: JwtUser | undefined, statusInput?: string) {
    const actor = this.getActorContext(user)
    const status = this.normalizeStatus(statusInput)

    const items = db
      .prepare(
        `
          SELECT
            pr.id,
            pr.providerProfileId,
            pr.providerChannelCode,
            pr.postId,
            pr.postCode,
            pr.postType,
            p.title,
            p.content,
            pr.status,
            pr.createdAt
          FROM post_recommendations pr
          LEFT JOIN posts p
            ON p.id = pr.postId
          WHERE pr.actorChannelCode = ?
            AND pr.status = ?
          ORDER BY pr.createdAt DESC
        `
      )
      .all(actor.actorChannelCode, status)

    return {
      ok: true as const,
      items
    }
  }

  getProfileFavoriteStatus(user: JwtUser | undefined, providerChannelCodeInput: string) {
    const actor = this.getActorContext(user)
    const providerChannelCode = this.normalizeChannelCode13(providerChannelCodeInput, 'providerChannelCode')

    const row = db
      .prepare(
        `
          SELECT status
          FROM profile_favorites
          WHERE actorChannelCode = ?
            AND providerChannelCode = ?
          LIMIT 1
        `
      )
      .get(actor.actorChannelCode, providerChannelCode) as { status: FavoriteStatus } | undefined

    return {
      ok: true as const,
      isActive: row?.status === 'ACTIVE',
      status: row?.status ?? null
    }
  }

  getProductFavoriteStatus(
    user: JwtUser | undefined,
    params: {
      providerChannelCode: string
      productCode: string
    }
  ) {
    const actor = this.getActorContext(user)
    const providerChannelCode = this.normalizeChannelCode13(params.providerChannelCode, 'providerChannelCode')
    const productCode = this.normalizeBusinessCode12(params.productCode, 'productCode')

    const row = db
      .prepare(
        `
          SELECT status
          FROM product_favorites
          WHERE actorChannelCode = ?
            AND providerChannelCode = ?
            AND productCode = ?
          LIMIT 1
        `
      )
      .get(actor.actorChannelCode, providerChannelCode, productCode) as { status: FavoriteStatus } | undefined

    return {
      ok: true as const,
      isActive: row?.status === 'ACTIVE',
      status: row?.status ?? null
    }
  }

  getPostRecommendationStatus(
    user: JwtUser | undefined,
    params: {
      providerChannelCode: string
      postCode: string
    }
  ) {
    const actor = this.getActorContext(user)
    const providerChannelCode = this.normalizeChannelCode13(params.providerChannelCode, 'providerChannelCode')
    const postCode = this.normalizeBusinessCode12(params.postCode, 'postCode')

    const row = db
      .prepare(
        `
          SELECT status
          FROM post_recommendations
          WHERE actorChannelCode = ?
            AND providerChannelCode = ?
            AND postCode = ?
          LIMIT 1
        `
      )
      .get(actor.actorChannelCode, providerChannelCode, postCode) as { status: FavoriteStatus } | undefined

    return {
      ok: true as const,
      isActive: row?.status === 'ACTIVE',
      status: row?.status ?? null
    }
  }
}
