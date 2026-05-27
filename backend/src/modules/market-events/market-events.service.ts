import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import db from '../../config/database';

type MarketEventStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'HIDDEN';
type MarketEventType = 'NORMAL' | 'PROMOTION' | 'SEASON' | 'CLEARANCE' | 'COUPON';

type MarketEventQuery = {
  channelCode?: string;
};

type CreateMarketEventInput = {
  channelCode?: string;
  eventCode?: string;
  eventTitle?: string;
  eventDescription?: string | null;
  eventType?: string;
  eventStatus?: string;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  bannerImageAssetId?: number | string | null;
};

type UpdateMarketEventInput = Partial<CreateMarketEventInput>;

type ConnectMarketEventProductInput = {
  productCode?: string;
};

type CountRow = {
  count: number;
};

type MarketEventRow = {
  id: number;
  eventCode: string;
  channelCode: string;
  eventTitle: string;
  eventDescription: string | null;
  eventType: MarketEventType;
  eventStatus: MarketEventStatus;
  eventStartAt: string | null;
  eventEndAt: string | null;
  bannerImageAssetId: number | null;
  connectedProductCount: number;
  hasBanner: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type MarketEventProductRow = {
  id: number;
  channelCode: string;
  productCode: string;
  barcode: string | null;
  productName: string;
  brandName: string | null;
  salePrice: number;
  currentStock: number;
  safeStock: number;
  isSoldOut: number;
  displayStatus: string;
  eventStatus: string;
  thumbnailUrl: string | null;
};

const EVENT_TYPES: MarketEventType[] = [
  'NORMAL',
  'PROMOTION',
  'SEASON',
  'CLEARANCE',
  'COUPON',
];

const EVENT_STATUSES: MarketEventStatus[] = [
  'SCHEDULED',
  'ACTIVE',
  'ENDED',
  'HIDDEN',
];

@Injectable()
export class MarketEventsService {
  getEvents(query: MarketEventQuery) {
    const channelCode = this.requireChannelCode(query.channelCode);
    const items = db
      .prepare(
        `
        SELECT
          em.id AS id,
          em.eventCode AS eventCode,
          em.channelCode AS channelCode,
          em.eventTitle AS eventTitle,
          em.eventDescription AS eventDescription,
          em.eventType AS eventType,
          em.eventStatus AS eventStatus,
          em.eventStartAt AS eventStartAt,
          em.eventEndAt AS eventEndAt,
          em.bannerImageAssetId AS bannerImageAssetId,
          COUNT(mp.id) AS connectedProductCount,
          CASE WHEN em.bannerImageAssetId IS NULL THEN 0 ELSE 1 END AS hasBanner,
          em.createdAt AS createdAt,
          em.updatedAt AS updatedAt
        FROM market_event_masters em
        LEFT JOIN market_products mp
          ON mp.channelCode = em.channelCode
          AND mp.eventCode = em.eventCode
          AND COALESCE(mp.isDeleted, 0) = 0
        WHERE em.channelCode = ?
        GROUP BY em.id
        ORDER BY
          CASE em.eventStatus
            WHEN 'ACTIVE' THEN 1
            WHEN 'SCHEDULED' THEN 2
            WHEN 'ENDED' THEN 3
            ELSE 4
          END,
          em.eventStartAt ASC,
          em.id DESC
      `,
      )
      .all(channelCode) as MarketEventRow[];

    return {
      summary: {
        totalEvents: items.length,
        activeEvents: items.filter((item) => item.eventStatus === 'ACTIVE').length,
        scheduledEvents: items.filter((item) => item.eventStatus === 'SCHEDULED').length,
        endedEvents: items.filter((item) => item.eventStatus === 'ENDED').length,
      },
      items,
    };
  }

  getEventDetail(eventCodeRaw: string) {
    const eventCode = this.normalizeEventCode(eventCodeRaw);
    const event = this.getEventByCodeOnly(eventCode);
    const products = this.getEventProducts(event.channelCode, event.eventCode);

    return {
      event: {
        ...event,
        connectedProductCount: products.length,
        hasBanner: event.bannerImageAssetId ? 1 : 0,
      },
      products,
      productCount: products.length,
      bannerImageAssetId: event.bannerImageAssetId,
    };
  }

  createEvent(input: CreateMarketEventInput): MarketEventRow {
    const channelCode = this.requireChannelCode(input.channelCode);
    this.assertBusinessChannel(channelCode);
    const eventCode = this.normalizeEventCode(input.eventCode);
    const eventTitle = this.requireText(input.eventTitle, 'eventTitle required');
    const eventType = this.normalizeEventType(input.eventType);
    const eventStatus = this.normalizeEventStatus(input.eventStatus);

    const duplicate = db
      .prepare(
        `
        SELECT COUNT(*) AS count
        FROM market_event_masters
        WHERE eventCode = ?
      `,
      )
      .get(eventCode) as CountRow | undefined;

    if (duplicate?.count) {
      throw new ConflictException('EVENT_CODE_ALREADY_EXISTS');
    }

    db.prepare(
      `
      INSERT INTO market_event_masters(
        eventCode,
        channelCode,
        eventTitle,
        eventDescription,
        eventType,
        eventStatus,
        eventStartAt,
        eventEndAt,
        createdAt,
        updatedAt
      )
      VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `,
    ).run(
      eventCode,
      channelCode,
      eventTitle,
      this.normalizeNullableText(input.eventDescription),
      eventType,
      eventStatus,
      this.normalizeNullableText(input.eventStartAt),
      this.normalizeNullableText(input.eventEndAt),
    );

    return this.getEventByCode(channelCode, eventCode);
  }

  updateEvent(eventCodeRaw: string, input: UpdateMarketEventInput): MarketEventRow {
    const channelCode = this.requireChannelCode(input.channelCode);
    const eventCode = this.normalizeEventCode(eventCodeRaw);
    const existing = this.getEventByCode(channelCode, eventCode);
    const eventTitle =
      input.eventTitle === undefined
        ? existing.eventTitle
        : this.requireText(input.eventTitle, 'eventTitle required');

    db.prepare(
      `
      UPDATE market_event_masters
      SET
        eventTitle = ?,
        eventDescription = ?,
        eventType = ?,
        eventStatus = ?,
        eventStartAt = ?,
        eventEndAt = ?,
        bannerImageAssetId = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE channelCode = ?
        AND eventCode = ?
    `,
    ).run(
      eventTitle,
      input.eventDescription === undefined
        ? existing.eventDescription
        : this.normalizeNullableText(input.eventDescription),
      input.eventType === undefined
        ? existing.eventType
        : this.normalizeEventType(input.eventType),
      input.eventStatus === undefined
        ? existing.eventStatus
        : this.normalizeEventStatus(input.eventStatus),
      input.eventStartAt === undefined
        ? existing.eventStartAt
        : this.normalizeNullableText(input.eventStartAt),
      input.eventEndAt === undefined
        ? existing.eventEndAt
        : this.normalizeNullableText(input.eventEndAt),
      input.bannerImageAssetId === undefined
        ? existing.bannerImageAssetId
        : this.normalizeNullableImageAssetId(input.bannerImageAssetId),
      channelCode,
      eventCode,
    );

    return this.getEventByCode(channelCode, eventCode);
  }

  connectEventProduct(
    eventCodeRaw: string,
    input: ConnectMarketEventProductInput,
  ) {
    const eventCode = this.normalizeEventCode(eventCodeRaw);
    const event = this.getEventByCodeOnly(eventCode);
    const productCode = this.normalizeProductCode(input.productCode);
    const product = this.getMarketProductForEvent(
      event.channelCode,
      productCode,
    );

    db.prepare(
      `
      UPDATE market_products
      SET
        eventCode = ?,
        eventTitle = ?,
        eventStartAt = ?,
        eventEndAt = ?,
        eventStatus = ?,
        displayStatus = 'EVENT_ONLY',
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND channelCode = ?
    `,
    ).run(
      event.eventCode,
      event.eventTitle,
      event.eventStartAt,
      event.eventEndAt,
      event.eventStatus === 'HIDDEN' ? 'NONE' : event.eventStatus,
      product.id,
      event.channelCode,
    );

    return this.getEventDetail(event.eventCode);
  }

  disconnectEventProduct(eventCodeRaw: string, productCodeRaw: string) {
    const eventCode = this.normalizeEventCode(eventCodeRaw);
    const event = this.getEventByCodeOnly(eventCode);
    const productCode = this.normalizeProductCode(productCodeRaw);
    const product = this.getMarketProductForEvent(
      event.channelCode,
      productCode,
    );

    db.prepare(
      `
      UPDATE market_products
      SET
        eventCode = NULL,
        eventTitle = NULL,
        eventStartAt = NULL,
        eventEndAt = NULL,
        eventStatus = 'NONE',
        displayStatus = CASE
          WHEN displayStatus = 'EVENT_ONLY' THEN 'VISIBLE'
          ELSE displayStatus
        END,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND channelCode = ?
        AND eventCode = ?
    `,
    ).run(product.id, event.channelCode, event.eventCode);

    return this.getEventDetail(event.eventCode);
  }

  private getEventByCode(channelCode: string, eventCode: string): MarketEventRow {
    const event = db
      .prepare(
        `
        SELECT
          em.id AS id,
          em.eventCode AS eventCode,
          em.channelCode AS channelCode,
          em.eventTitle AS eventTitle,
          em.eventDescription AS eventDescription,
          em.eventType AS eventType,
          em.eventStatus AS eventStatus,
          em.eventStartAt AS eventStartAt,
          em.eventEndAt AS eventEndAt,
          em.bannerImageAssetId AS bannerImageAssetId,
          COUNT(mp.id) AS connectedProductCount,
          CASE WHEN em.bannerImageAssetId IS NULL THEN 0 ELSE 1 END AS hasBanner,
          em.createdAt AS createdAt,
          em.updatedAt AS updatedAt
        FROM market_event_masters em
        LEFT JOIN market_products mp
          ON mp.channelCode = em.channelCode
          AND mp.eventCode = em.eventCode
          AND COALESCE(mp.isDeleted, 0) = 0
        WHERE em.channelCode = ?
          AND em.eventCode = ?
        GROUP BY em.id
        LIMIT 1
      `,
      )
      .get(channelCode, eventCode) as MarketEventRow | undefined;

    if (!event) {
      throw new NotFoundException('MARKET_EVENT_NOT_FOUND');
    }

    return event;
  }

  private getEventByCodeOnly(eventCode: string): MarketEventRow {
    const event = db
      .prepare(
        `
        SELECT
          em.id AS id,
          em.eventCode AS eventCode,
          em.channelCode AS channelCode,
          em.eventTitle AS eventTitle,
          em.eventDescription AS eventDescription,
          em.eventType AS eventType,
          em.eventStatus AS eventStatus,
          em.eventStartAt AS eventStartAt,
          em.eventEndAt AS eventEndAt,
          em.bannerImageAssetId AS bannerImageAssetId,
          COUNT(mp.id) AS connectedProductCount,
          CASE WHEN em.bannerImageAssetId IS NULL THEN 0 ELSE 1 END AS hasBanner,
          em.createdAt AS createdAt,
          em.updatedAt AS updatedAt
        FROM market_event_masters em
        LEFT JOIN market_products mp
          ON mp.channelCode = em.channelCode
          AND mp.eventCode = em.eventCode
          AND COALESCE(mp.isDeleted, 0) = 0
        WHERE em.eventCode = ?
        GROUP BY em.id
        LIMIT 1
      `,
      )
      .get(eventCode) as MarketEventRow | undefined;

    if (!event) {
      throw new NotFoundException('MARKET_EVENT_NOT_FOUND');
    }

    return event;
  }

  private getEventProducts(
    channelCode: string,
    eventCode: string,
  ): MarketEventProductRow[] {
    return db
      .prepare(
        `
        SELECT
          mp.id AS id,
          mp.channelCode AS channelCode,
          mp.productCode AS productCode,
          mp.barcode AS barcode,
          mp.productName AS productName,
          mp.supplierName AS brandName,
          mp.salePrice AS salePrice,
          mp.currentStock AS currentStock,
          COALESCE(mp.safeStock, 0) AS safeStock,
          mp.isSoldOut AS isSoldOut,
          mp.displayStatus AS displayStatus,
          mp.eventStatus AS eventStatus,
          CASE
            WHEN ia.filePath IS NOT NULL AND ia.filePath LIKE '/%' THEN ia.filePath
            WHEN ia.filePath IS NOT NULL THEN '/media/' || ia.filePath
            ELSE NULL
          END AS thumbnailUrl
        FROM market_products mp
        LEFT JOIN market_product_thumbnails mpt
          ON mpt.marketProductId = mp.id
          AND mpt.channelCode = mp.channelCode
          AND mpt.isActive = 1
        LEFT JOIN image_assets ia
          ON ia.id = mpt.imageAssetId
          AND ia.isActive = 1
        WHERE mp.channelCode = ?
          AND mp.eventCode = ?
          AND mp.isDeleted = 0
          AND mp.deletedAt IS NULL
        GROUP BY mp.id
        ORDER BY mp.updatedAt DESC, mp.id DESC
      `,
      )
      .all(channelCode, eventCode) as MarketEventProductRow[];
  }

  private getMarketProductForEvent(
    channelCode: string,
    productCode: string,
  ): { id: number; productCode: string } {
    const product = db
      .prepare(
        `
        SELECT id, productCode
        FROM market_products
        WHERE channelCode = ?
          AND productCode = ?
          AND isDeleted = 0
          AND deletedAt IS NULL
        LIMIT 1
      `,
      )
      .get(channelCode, productCode) as
      | { id: number; productCode: string }
      | undefined;

    if (!product) {
      throw new NotFoundException('MARKET_PRODUCT_NOT_FOUND');
    }

    return product;
  }

  private assertBusinessChannel(channelCode: string): void {
    const row = db
      .prepare(
        `
        SELECT COUNT(*) AS count
        FROM profiles
        WHERE channelCode = ?
        LIMIT 1
      `,
      )
      .get(channelCode) as CountRow | undefined;

    if (!row?.count) {
      throw new BadRequestException('CHANNEL_NOT_FOUND');
    }
  }

  private requireChannelCode(value?: string): string {
    const channelCode = String(value ?? '').trim();
    if (!/^B[A-Z0-9]{12}$/.test(channelCode)) {
      throw new BadRequestException('channelCode invalid');
    }
    return channelCode;
  }

  private normalizeEventCode(value?: string): string {
    const eventCode = String(value ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9]{12}$/.test(eventCode)) {
      throw new BadRequestException('eventCode invalid');
    }
    return eventCode;
  }

  private normalizeProductCode(value?: string): string {
    const productCode = String(value ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9]{12}$/.test(productCode)) {
      throw new BadRequestException('productCode invalid');
    }
    return productCode;
  }

  private normalizeNullableImageAssetId(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const imageAssetId = Number(value);
    if (!Number.isInteger(imageAssetId) || imageAssetId <= 0) {
      throw new BadRequestException('bannerImageAssetId invalid');
    }

    const asset = db
      .prepare(
        `
        SELECT id
        FROM image_assets
        WHERE id = ?
          AND isActive = 1
        LIMIT 1
      `,
      )
      .get(imageAssetId) as { id: number } | undefined;

    if (!asset) {
      throw new BadRequestException('IMAGE_ASSET_NOT_FOUND');
    }

    return imageAssetId;
  }

  private requireText(value: unknown, message: string): string {
    const text = String(value ?? '').trim();
    if (!text) {
      throw new BadRequestException(message);
    }
    return text;
  }

  private normalizeNullableText(value: unknown): string | null {
    const text = String(value ?? '').trim();
    return text.length > 0 ? text : null;
  }

  private normalizeEventType(value?: string): MarketEventType {
    const eventType = String(value ?? 'NORMAL').trim().toUpperCase();
    if (!EVENT_TYPES.includes(eventType as MarketEventType)) {
      throw new BadRequestException('eventType invalid');
    }
    return eventType as MarketEventType;
  }

  private normalizeEventStatus(value?: string): MarketEventStatus {
    const eventStatus = String(value ?? 'SCHEDULED').trim().toUpperCase();
    if (!EVENT_STATUSES.includes(eventStatus as MarketEventStatus)) {
      throw new BadRequestException('eventStatus invalid');
    }
    return eventStatus as MarketEventStatus;
  }
}
