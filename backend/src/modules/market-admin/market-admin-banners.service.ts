import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { createHash, randomBytes } from 'crypto';
import * as fs from 'fs';
import { join } from 'path';
import sharp from 'sharp';

import db from '../../config/database';

type MarketHeroBannerRow = {
  id: number;
  channelCode: string;
  bannerSlot: string;
  imageAssetId: number;
  sortOrder: number;
  title: string | null;
  description: string | null;
  linkUrl: string | null;
  displayStatus: 'VISIBLE' | 'HIDDEN';
  isActive: number;
  imageFilePath: string;
  imageUrl: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type ImageAssetInsertResult = {
  assetId: number;
  fileName: string;
  filePath: string;
  width: number | null;
  height: number | null;
};

type MarketBrandAdConfigRow = {
  id: number;
  channelCode: string;
  title: string | null;
  description: string | null;
  displayStatus: 'VISIBLE' | 'HIDDEN';
  isActive: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type MarketBrandAdLogoRow = {
  id: number;
  channelCode: string;
  imageAssetId: number;
  sortOrder: number;
  displayStatus: 'VISIBLE' | 'HIDDEN';
  isActive: number;
  imageFilePath: string;
  imageUrl: string;
  createdAt: string | null;
  updatedAt: string | null;
};

const DEFAULT_MARKET_CHANNEL_CODE = 'B012712392766';
const HERO_BANNER_SLOT = 'MAIN_HERO';
const HERO_BANNER_LIMIT = 5;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const DEFAULT_BRAND_AD_TITLE = '스폰서 브랜드';
const DEFAULT_BRAND_AD_DESCRIPTION = '오늘 장보기 인기 브랜드 특가';
const BRAND_AD_LOGO_LIMIT = 15;

const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

@Injectable()
export class MarketAdminBannersService {
  getBrandAdLogos(channelCodeRaw?: string) {
    this.ensureBrandAdLogoStorageReady();
    const channelCode = this.normalizeChannelCode(channelCodeRaw);
    const channelLogos = this.findActiveBrandAdLogos(channelCode);
    const fallbackLogos =
      channelLogos.length > 0 || channelCode === DEFAULT_MARKET_CHANNEL_CODE
        ? []
        : this.findActiveBrandAdLogos(DEFAULT_MARKET_CHANNEL_CODE);
    const logos = channelLogos.length > 0 ? channelLogos : fallbackLogos;
    const sourceChannelCode =
      channelLogos.length > 0 || channelCode === DEFAULT_MARKET_CHANNEL_CODE
        ? channelCode
        : DEFAULT_MARKET_CHANNEL_CODE;

    return {
      success: true,
      logos,
      sourceChannelCode,
      fallbackUsed: sourceChannelCode !== channelCode,
    };
  }

  getBrandAdLogosManage(channelCodeRaw?: string) {
    this.ensureBrandAdLogoStorageReady();
    const channelCode = this.normalizeChannelCode(channelCodeRaw);

    return {
      success: true,
      logos: this.findManageBrandAdLogos(channelCode),
      sourceChannelCode: channelCode,
      fallbackUsed: false,
    };
  }

  async uploadBrandAdLogo(params: {
    file?: Express.Multer.File;
    channelCode?: string;
    sortOrder?: number | string;
  }) {
    this.ensureBrandAdLogoStorageReady();
    const channelCode = this.normalizeChannelCode(params.channelCode);
    const sortOrder = this.normalizeBrandLogoSortOrder(params.sortOrder);
    const file = this.requireImageFile(params.file);
    const asset = await this.storeBrandLogoImage(channelCode, file);

    const result = db.transaction(() => {
      db.prepare(
        `
        UPDATE market_brand_ad_logos
        SET
          isActive = 0,
          displayStatus = 'HIDDEN',
          deletedAt = CURRENT_TIMESTAMP,
          updatedAt = CURRENT_TIMESTAMP
        WHERE channelCode = ?
          AND sortOrder = ?
          AND isActive = 1
          AND deletedAt IS NULL
      `,
      ).run(channelCode, sortOrder);

      return db.prepare(
        `
        INSERT INTO market_brand_ad_logos(
          channelCode,
          imageAssetId,
          sortOrder,
          displayStatus,
          isActive,
          createdAt,
          updatedAt
        )
        VALUES(?,?,?,'VISIBLE',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `,
      ).run(
        channelCode,
        asset.assetId,
        sortOrder,
      );
    })();

    return {
      success: true,
      logoId: Number(result.lastInsertRowid),
      imageAssetId: asset.assetId,
      fileName: asset.fileName,
      filePath: asset.filePath,
      logos: this.findManageBrandAdLogos(channelCode),
    };
  }

  updateBrandAdLogoSelection(params: {
    channelCode?: string;
    logoId?: number | string;
    sortOrder?: number | string;
    isVisible?: boolean;
  }) {
    this.ensureBrandAdLogoStorageReady();
    const channelCode = this.normalizeChannelCode(params.channelCode);
    const logoId = this.normalizeBrandLogoId(params.logoId);
    const sortOrder = params.sortOrder === undefined
      ? null
      : this.normalizeBrandLogoSortOrder(params.sortOrder);
    const isVisible = params.isVisible === undefined
      ? null
      : Boolean(params.isVisible);

    this.assertBrandLogoOwner(channelCode, logoId);

    const transaction = db.transaction(() => {
      if (sortOrder !== null) {
        db.prepare(
          `
          UPDATE market_brand_ad_logos
          SET
            sortOrder = ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
            AND channelCode = ?
            AND isActive = 1
            AND deletedAt IS NULL
        `,
        ).run(sortOrder, logoId, channelCode);
      }

      if (isVisible !== null) {
        db.prepare(
          `
          UPDATE market_brand_ad_logos
          SET
            displayStatus = ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
            AND channelCode = ?
            AND isActive = 1
            AND deletedAt IS NULL
        `,
        ).run(
          isVisible ? 'VISIBLE' : 'HIDDEN',
          logoId,
          channelCode,
        );
      }
    });

    transaction();

    return this.getBrandAdLogosManage(channelCode);
  }

  reorderBrandAdLogos(params: {
    channelCode?: string;
    items?: Array<{
      logoId?: number | string;
      sortOrder?: number | string;
    }>;
  }) {
    this.ensureBrandAdLogoStorageReady();
    const channelCode = this.normalizeChannelCode(params.channelCode);
    const items = Array.isArray(params.items) ? params.items : [];

    if (items.length < 1 || items.length > BRAND_AD_LOGO_LIMIT) {
      throw new BadRequestException('BRAND_AD_LOGO_REORDER_INVALID');
    }

    const normalizedItems = items.map((item) => ({
      logoId: this.normalizeBrandLogoId(item.logoId),
      sortOrder: this.normalizeBrandLogoSortOrder(item.sortOrder),
    }));

    normalizedItems.forEach((item) => {
      this.assertBrandLogoOwner(channelCode, item.logoId);
    });

    const transaction = db.transaction(() => {
      normalizedItems.forEach((item) => {
        db.prepare(
          `
          UPDATE market_brand_ad_logos
          SET
            sortOrder = ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
            AND channelCode = ?
            AND isActive = 1
            AND deletedAt IS NULL
        `,
        ).run(item.sortOrder, item.logoId, channelCode);
      });
    });

    transaction();

    return this.getBrandAdLogosManage(channelCode);
  }

  hideBrandAdLogo(params: {
    channelCode?: string;
    logoId?: number | string;
  }) {
    this.ensureBrandAdLogoStorageReady();
    return this.updateBrandAdLogoSelection({
      channelCode: params.channelCode,
      logoId: params.logoId,
      isVisible: false,
    });
  }

  deleteBrandAdLogo(params: {
    channelCode?: string;
    logoId?: number | string;
  }) {
    this.ensureBrandAdLogoStorageReady();
    const channelCode = this.normalizeChannelCode(params.channelCode);
    const logoId = this.normalizeBrandLogoId(params.logoId);
    this.assertBrandLogoOwner(channelCode, logoId);

    db.prepare(
      `
      UPDATE market_brand_ad_logos
      SET
        isActive = 0,
        displayStatus = 'HIDDEN',
        deletedAt = CURRENT_TIMESTAMP,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND channelCode = ?
        AND isActive = 1
        AND deletedAt IS NULL
    `,
    ).run(logoId, channelCode);

    return this.getBrandAdLogosManage(channelCode);
  }

  getBrandAdText(channelCodeRaw?: string) {
    const channelCode = this.normalizeChannelCode(channelCodeRaw);
    const channelConfig = this.findBrandAdConfig(channelCode);
    const fallbackConfig =
      channelConfig || channelCode === DEFAULT_MARKET_CHANNEL_CODE
        ? null
        : this.findBrandAdConfig(DEFAULT_MARKET_CHANNEL_CODE);
    const config = channelConfig ?? fallbackConfig;
    const sourceChannelCode =
      channelConfig || channelCode === DEFAULT_MARKET_CHANNEL_CODE
        ? channelCode
        : DEFAULT_MARKET_CHANNEL_CODE;

    return {
      success: true,
      config: {
        channelCode: sourceChannelCode,
        title: String(config?.title ?? DEFAULT_BRAND_AD_TITLE),
        description: String(config?.description ?? DEFAULT_BRAND_AD_DESCRIPTION),
        displayStatus: config?.displayStatus ?? 'VISIBLE',
        isActive: config?.isActive ?? 1,
      },
      sourceChannelCode,
      fallbackUsed: sourceChannelCode !== channelCode,
    };
  }

  updateBrandAdText(params: {
    channelCode?: string;
    brandAdTitle?: string;
    brandAdDescription?: string;
  }) {
    const channelCode = this.normalizeChannelCode(params.channelCode);
    const title = this.normalizeNullableText(params.brandAdTitle);
    const description = this.normalizeNullableText(params.brandAdDescription);
    const current = this.findBrandAdConfig(channelCode);

    if (current) {
      db.prepare(
        `
        UPDATE market_brand_ad_configs
        SET
          title = ?,
          description = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      ).run(
        title,
        description,
        current.id,
      );
    } else {
      db.prepare(
        `
        INSERT INTO market_brand_ad_configs(
          channelCode,
          title,
          description,
          displayStatus,
          isActive,
          createdAt,
          updatedAt
        )
        VALUES(?,?,?,'VISIBLE',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `,
      ).run(
        channelCode,
        title,
        description,
      );
    }

    return this.getBrandAdText(channelCode);
  }

  getHeroBanner(channelCodeRaw?: string) {
    const channelCode = this.normalizeChannelCode(channelCodeRaw);
    const channelBanners = this.findActiveHeroBanners(channelCode);
    const fallbackBanners =
      channelBanners.length > 0 || channelCode === DEFAULT_MARKET_CHANNEL_CODE
        ? []
        : this.findActiveHeroBanners(DEFAULT_MARKET_CHANNEL_CODE);
    const banners =
      channelBanners.length > 0
        ? channelBanners
        : fallbackBanners;
    const sourceChannelCode =
      channelBanners.length > 0 || channelCode === DEFAULT_MARKET_CHANNEL_CODE
        ? channelCode
        : DEFAULT_MARKET_CHANNEL_CODE;

    return {
      success: true,
      banner: banners[0] ?? null,
      banners,
      sourceChannelCode,
      fallbackUsed: sourceChannelCode !== channelCode,
    };
  }

  getHeroBannerManageList(channelCodeRaw?: string) {
    const channelCode = this.normalizeChannelCode(channelCodeRaw);
    const banners = this.findManageHeroBanners(channelCode);

    return {
      success: true,
      banner: banners.find((banner) => banner.displayStatus === 'VISIBLE') ?? null,
      banners,
      sourceChannelCode: channelCode,
      fallbackUsed: false,
    };
  }

  async uploadHeroBanner(params: {
    file?: Express.Multer.File;
    channelCode?: string;
    title?: string;
    description?: string;
    linkUrl?: string;
    sortOrder?: number | string;
  }) {
    const channelCode = this.normalizeChannelCode(params.channelCode);
    const sortOrder = this.normalizeHeroSortOrder(params.sortOrder);
    const file = this.requireImageFile(params.file);
    const title = this.normalizeNullableText(params.title);
    const description = this.normalizeNullableText(params.description);
    const linkUrl = this.normalizeHeroLinkUrl(params.linkUrl);
    const asset = await this.storeHeroImage(channelCode, file);

    try {
      db.exec('BEGIN');

      db.prepare(
        `
        UPDATE market_hero_banners
        SET
          isActive = 0,
          updatedAt = CURRENT_TIMESTAMP
        WHERE channelCode = ?
          AND bannerSlot = ?
          AND sortOrder = ?
          AND isActive = 1
      `,
      ).run(channelCode, HERO_BANNER_SLOT, sortOrder);

      const result = db.prepare(
        `
        INSERT INTO market_hero_banners(
          channelCode,
          bannerSlot,
          imageAssetId,
          sortOrder,
          title,
          description,
          linkUrl,
          displayStatus,
          isActive,
          createdAt,
          updatedAt
        )
        VALUES(?,?,?,?,?,?,?,'VISIBLE',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `,
      ).run(
        channelCode,
        HERO_BANNER_SLOT,
        asset.assetId,
        sortOrder,
        title,
        description,
        linkUrl,
      );

      db.exec('COMMIT');

      return {
        success: true,
        bannerId: Number(result.lastInsertRowid),
        imageAssetId: asset.assetId,
        fileName: asset.fileName,
        filePath: asset.filePath,
        banner: this.findActiveHeroBanner(channelCode),
        banners: this.findActiveHeroBanners(channelCode),
      };
    } catch (error) {
      db.exec('ROLLBACK');

      console.error('[MARKET HERO BANNER RELATION INSERT FAIL]', error);

      throw new InternalServerErrorException('MARKET_HERO_BANNER_SAVE_FAILED');
    }
  }

  updateHeroBannerSelection(params: {
    channelCode?: string;
    bannerId?: number | string;
    sortOrder?: number | string;
    isVisible?: boolean;
  }) {
    const channelCode = this.normalizeChannelCode(params.channelCode);
    const bannerId = this.normalizeBannerId(params.bannerId);
    const sortOrder = params.sortOrder === undefined
      ? null
      : this.normalizeHeroSortOrder(params.sortOrder);
    const isVisible = params.isVisible === undefined
      ? null
      : Boolean(params.isVisible);

    this.assertHeroBannerOwner(channelCode, bannerId);

    const transaction = db.transaction(() => {
      if (sortOrder !== null) {
        db.prepare(
          `
          UPDATE market_hero_banners
          SET
            sortOrder = ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
            AND channelCode = ?
            AND bannerSlot = ?
            AND isActive = 1
            AND deletedAt IS NULL
        `,
        ).run(sortOrder, bannerId, channelCode, HERO_BANNER_SLOT);
      }

      if (isVisible !== null) {
        db.prepare(
          `
          UPDATE market_hero_banners
          SET
            displayStatus = ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
            AND channelCode = ?
            AND bannerSlot = ?
            AND isActive = 1
            AND deletedAt IS NULL
        `,
        ).run(
          isVisible ? 'VISIBLE' : 'HIDDEN',
          bannerId,
          channelCode,
          HERO_BANNER_SLOT,
        );
      }
    });

    transaction();

    return this.getHeroBannerManageList(channelCode);
  }

  updateHeroBannerText(params: {
    channelCode?: string;
    bannerId?: number | string;
    title?: string;
    description?: string;
  }) {
    const channelCode = this.normalizeChannelCode(params.channelCode);
    const bannerId = this.normalizeBannerId(params.bannerId);
    const title = this.normalizeNullableText(params.title);
    const description = this.normalizeNullableText(params.description);

    this.assertHeroBannerOwner(channelCode, bannerId);

    db.prepare(
      `
      UPDATE market_hero_banners
      SET
        title = ?,
        description = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND channelCode = ?
        AND bannerSlot = ?
        AND isActive = 1
        AND deletedAt IS NULL
    `,
    ).run(
      title,
      description,
      bannerId,
      channelCode,
      HERO_BANNER_SLOT,
    );

    return this.getHeroBannerManageList(channelCode);
  }

  updateHeroBannerLinkUrl(params: {
    channelCode?: string;
    bannerId?: number | string;
    linkUrl?: string | null;
  }) {
    const channelCode = this.normalizeChannelCode(params.channelCode);
    const bannerId = this.normalizeBannerId(params.bannerId);
    const linkUrl = this.normalizeHeroLinkUrl(params.linkUrl);

    this.assertHeroBannerOwner(channelCode, bannerId);

    db.prepare(
      `
      UPDATE market_hero_banners
      SET
        linkUrl = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
        AND channelCode = ?
        AND bannerSlot = ?
        AND isActive = 1
        AND deletedAt IS NULL
    `,
    ).run(
      linkUrl,
      bannerId,
      channelCode,
      HERO_BANNER_SLOT,
    );

    return this.getHeroBannerManageList(channelCode);
  }

  reorderHeroBanners(params: {
    channelCode?: string;
    items?: Array<{
      bannerId?: number | string;
      sortOrder?: number | string;
    }>;
  }) {
    const channelCode = this.normalizeChannelCode(params.channelCode);
    const items = Array.isArray(params.items)
      ? params.items
      : [];

    if (items.length < 1 || items.length > HERO_BANNER_LIMIT) {
      throw new BadRequestException('HERO_REORDER_ITEMS_INVALID');
    }

    const normalizedItems = items.map((item) => ({
      bannerId: this.normalizeBannerId(item.bannerId),
      sortOrder: this.normalizeHeroSortOrder(item.sortOrder),
    }));
    const sortOrders = new Set(normalizedItems.map((item) => item.sortOrder));
    const bannerIds = new Set(normalizedItems.map((item) => item.bannerId));

    if (
      sortOrders.size !== normalizedItems.length ||
      bannerIds.size !== normalizedItems.length
    ) {
      throw new BadRequestException('HERO_REORDER_DUPLICATED');
    }

    normalizedItems.forEach((item) => {
      this.assertHeroBannerOwner(channelCode, item.bannerId);
    });

    const transaction = db.transaction(() => {
      normalizedItems.forEach((item) => {
        db.prepare(
          `
          UPDATE market_hero_banners
          SET
            sortOrder = ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
            AND channelCode = ?
            AND bannerSlot = ?
            AND isActive = 1
            AND deletedAt IS NULL
        `,
        ).run(
          item.sortOrder,
          item.bannerId,
          channelCode,
          HERO_BANNER_SLOT,
        );
      });
    });

    transaction();

    return this.getHeroBannerManageList(channelCode);
  }

  setHeroBannerVisibility(params: {
    channelCode?: string;
    bannerId?: number | string;
    isVisible: boolean;
  }) {
    return this.updateHeroBannerSelection({
      channelCode: params.channelCode,
      bannerId: params.bannerId,
      isVisible: params.isVisible,
    });
  }

  deleteHeroBanner(params: {
    channelCode?: string;
    bannerId?: number | string;
  }) {
    const channelCode = this.normalizeChannelCode(params.channelCode);
    const bannerId = this.normalizeBannerId(params.bannerId);

    this.assertHeroBannerOwner(channelCode, bannerId);

    const transaction = db.transaction(() => {
      db.prepare(
        `
        UPDATE market_hero_banners
        SET
          isActive = 0,
          displayStatus = 'HIDDEN',
          deletedAt = CURRENT_TIMESTAMP,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
          AND channelCode = ?
          AND bannerSlot = ?
          AND isActive = 1
          AND deletedAt IS NULL
      `,
      ).run(
        bannerId,
        channelCode,
        HERO_BANNER_SLOT,
      );
    });

    transaction();

    return this.getHeroBannerManageList(channelCode);
  }

  private async storeHeroImage(
    channelCode: string,
    file: Express.Multer.File,
  ): Promise<ImageAssetInsertResult> {
    const uploadDir = join(
      process.cwd(),
      'uploads',
      channelCode,
      'market-banners',
    );

    fs.mkdirSync(uploadDir, {
      recursive: true,
    });

    const checksum = createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    const fileName = `hero-${Date.now()}-${randomBytes(4).toString('hex')}.webp`;
    const fullPath = join(uploadDir, fileName);
    const filePath = `${channelCode}/market-banners/${fileName}`;

    const transformedImage = await sharp(file.buffer)
      .rotate()
      .resize({
        width: 1600,
        height: 720,
        fit: 'inside',
        withoutEnlargement: false,
      })
      .webp({
        quality: 86,
      })
      .toBuffer({
        resolveWithObject: true,
      });

    fs.writeFileSync(fullPath, transformedImage.data);

    try {
      const result = db.prepare(
        `
        INSERT INTO image_assets(
          channelCode,
          usageType,
          fileName,
          filePath,
          mimeType,
          fileSize,
          width,
          height,
          checksum,
          isActive,
          lastUsedAt,
          createdAt
        )
        VALUES(?,?,?,?,?,?,?,?,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `,
      ).run(
        channelCode,
        'hero',
        fileName,
        filePath,
        'image/webp',
        transformedImage.data.length,
        transformedImage.info.width ?? null,
        transformedImage.info.height ?? null,
        checksum,
      );

      return {
        assetId: Number(result.lastInsertRowid),
        fileName,
        filePath,
        width: transformedImage.info.width ?? null,
        height: transformedImage.info.height ?? null,
      };
    } catch (error) {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      console.error('[MARKET HERO IMAGE_ASSET INSERT FAIL]', error);

      throw new InternalServerErrorException('MARKET_HERO_IMAGE_SAVE_FAILED');
    }
  }

  private async storeBrandLogoImage(
    channelCode: string,
    file: Express.Multer.File,
  ): Promise<ImageAssetInsertResult> {
    const uploadDir = join(
      process.cwd(),
      'uploads',
      channelCode,
      'market-brand-logos',
    );

    fs.mkdirSync(uploadDir, {
      recursive: true,
    });

    const checksum = createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    const fileName = `brand-logo-${Date.now()}-${randomBytes(4).toString('hex')}.webp`;
    const fullPath = join(uploadDir, fileName);
    const filePath = `${channelCode}/market-brand-logos/${fileName}`;

    const transformedImage = await sharp(file.buffer)
      .rotate()
      .resize({
        width: 200,
        height: 200,
        fit: 'inside',
        withoutEnlargement: false,
      })
      .webp({
        quality: 88,
      })
      .toBuffer({
        resolveWithObject: true,
      });

    fs.writeFileSync(fullPath, transformedImage.data);

    try {
      const result = db.prepare(
        `
        INSERT INTO image_assets(
          channelCode,
          usageType,
          fileName,
          filePath,
          mimeType,
          fileSize,
          width,
          height,
          checksum,
          isActive,
          lastUsedAt,
          createdAt
        )
        VALUES(?,?,?,?,?,?,?,?,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `,
      ).run(
        channelCode,
        'hero',
        fileName,
        filePath,
        'image/webp',
        transformedImage.data.length,
        transformedImage.info.width ?? null,
        transformedImage.info.height ?? null,
        checksum,
      );

      return {
        assetId: Number(result.lastInsertRowid),
        fileName,
        filePath,
        width: transformedImage.info.width ?? null,
        height: transformedImage.info.height ?? null,
      };
    } catch (error) {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      console.error('[MARKET BRAND LOGO IMAGE_ASSET INSERT FAIL]', error);

      throw new InternalServerErrorException('MARKET_BRAND_LOGO_SAVE_FAILED');
    }
  }

  private findActiveHeroBanner(channelCode: string): MarketHeroBannerRow | null {
    return this.findActiveHeroBanners(channelCode)[0] ?? null;
  }

  private findActiveHeroBanners(channelCode: string): MarketHeroBannerRow[] {
    const row = db.prepare(
      `
      SELECT
        mhb.id AS id,
        mhb.channelCode AS channelCode,
        mhb.bannerSlot AS bannerSlot,
        mhb.imageAssetId AS imageAssetId,
        mhb.sortOrder AS sortOrder,
        mhb.title AS title,
        mhb.description AS description,
        mhb.linkUrl AS linkUrl,
        mhb.displayStatus AS displayStatus,
        mhb.isActive AS isActive,
        ia.filePath AS imageFilePath,
        CASE
          WHEN ia.filePath LIKE '/%' THEN ia.filePath
          ELSE '/media/' || ia.filePath
        END AS imageUrl,
        mhb.createdAt AS createdAt,
        mhb.updatedAt AS updatedAt
      FROM market_hero_banners mhb
      INNER JOIN image_assets ia
        ON ia.id = mhb.imageAssetId
        AND ia.isActive = 1
      WHERE mhb.channelCode = ?
        AND mhb.bannerSlot = ?
        AND mhb.displayStatus = 'VISIBLE'
        AND mhb.isActive = 1
        AND mhb.deletedAt IS NULL
      ORDER BY mhb.sortOrder ASC, mhb.id DESC
      LIMIT ?
    `,
    ).all(
      channelCode,
      HERO_BANNER_SLOT,
      HERO_BANNER_LIMIT,
    ) as MarketHeroBannerRow[];

    return row;
  }

  private findManageHeroBanners(channelCode: string): MarketHeroBannerRow[] {
    const rows = db.prepare(
      `
      SELECT
        mhb.id AS id,
        mhb.channelCode AS channelCode,
        mhb.bannerSlot AS bannerSlot,
        mhb.imageAssetId AS imageAssetId,
        mhb.sortOrder AS sortOrder,
        mhb.title AS title,
        mhb.description AS description,
        mhb.linkUrl AS linkUrl,
        mhb.displayStatus AS displayStatus,
        mhb.isActive AS isActive,
        ia.filePath AS imageFilePath,
        CASE
          WHEN ia.filePath LIKE '/%' THEN ia.filePath
          ELSE '/media/' || ia.filePath
        END AS imageUrl,
        mhb.createdAt AS createdAt,
        mhb.updatedAt AS updatedAt
      FROM market_hero_banners mhb
      INNER JOIN image_assets ia
        ON ia.id = mhb.imageAssetId
        AND ia.isActive = 1
      WHERE mhb.channelCode = ?
        AND mhb.bannerSlot = ?
        AND mhb.isActive = 1
        AND mhb.deletedAt IS NULL
      ORDER BY mhb.sortOrder ASC, mhb.id DESC
      LIMIT ?
    `,
    ).all(
      channelCode,
      HERO_BANNER_SLOT,
      HERO_BANNER_LIMIT,
    ) as MarketHeroBannerRow[];

    return rows;
  }

  private assertHeroBannerOwner(
    channelCode: string,
    bannerId: number,
  ) {
    const row = db.prepare(
      `
      SELECT id
      FROM market_hero_banners
      WHERE id = ?
        AND channelCode = ?
        AND bannerSlot = ?
        AND isActive = 1
        AND deletedAt IS NULL
      LIMIT 1
    `,
    ).get(
      bannerId,
      channelCode,
      HERO_BANNER_SLOT,
    ) as { id?: number } | undefined;

    if (!row?.id) {
      throw new BadRequestException('HERO_BANNER_NOT_FOUND');
    }
  }

  private findBrandAdConfig(channelCode: string): MarketBrandAdConfigRow | null {
    const row = db.prepare(
      `
      SELECT
        id,
        channelCode,
        title,
        description,
        displayStatus,
        isActive,
        createdAt,
        updatedAt
      FROM market_brand_ad_configs
      WHERE channelCode = ?
        AND isActive = 1
      LIMIT 1
    `,
    ).get(channelCode) as MarketBrandAdConfigRow | undefined;

    return row ?? null;
  }

  private ensureBrandAdLogoStorageReady() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS market_brand_ad_logos(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channelCode TEXT NOT NULL,
        imageAssetId INTEGER NOT NULL,
        sortOrder INTEGER NOT NULL DEFAULT 1,
        displayStatus TEXT NOT NULL DEFAULT 'VISIBLE'
        CHECK(displayStatus IN ('VISIBLE','HIDDEN')),
        isActive INTEGER NOT NULL DEFAULT 1
        CHECK(isActive IN (0,1)),
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT,
        deletedAt TEXT,
        FOREIGN KEY(imageAssetId) REFERENCES image_assets(id)
      );

      CREATE INDEX IF NOT EXISTS idx_market_brand_ad_logos_channel
      ON market_brand_ad_logos(channelCode);

      CREATE INDEX IF NOT EXISTS idx_market_brand_ad_logos_order
      ON market_brand_ad_logos(channelCode, sortOrder, isActive);
    `);
  }

  private findActiveBrandAdLogos(channelCode: string): MarketBrandAdLogoRow[] {
    const rows = db.prepare(
      `
      SELECT
        mbl.id AS id,
        mbl.channelCode AS channelCode,
        mbl.imageAssetId AS imageAssetId,
        mbl.sortOrder AS sortOrder,
        mbl.displayStatus AS displayStatus,
        mbl.isActive AS isActive,
        ia.filePath AS imageFilePath,
        CASE
          WHEN ia.filePath LIKE '/%' THEN ia.filePath
          ELSE '/media/' || ia.filePath
        END AS imageUrl,
        mbl.createdAt AS createdAt,
        mbl.updatedAt AS updatedAt
      FROM market_brand_ad_logos mbl
      INNER JOIN image_assets ia
        ON ia.id = mbl.imageAssetId
        AND ia.isActive = 1
      WHERE mbl.channelCode = ?
        AND mbl.displayStatus = 'VISIBLE'
        AND mbl.isActive = 1
        AND mbl.deletedAt IS NULL
      ORDER BY mbl.sortOrder ASC, mbl.id DESC
      LIMIT ?
    `,
    ).all(
      channelCode,
      BRAND_AD_LOGO_LIMIT,
    ) as MarketBrandAdLogoRow[];

    return rows;
  }

  private findManageBrandAdLogos(channelCode: string): MarketBrandAdLogoRow[] {
    const rows = db.prepare(
      `
      SELECT
        mbl.id AS id,
        mbl.channelCode AS channelCode,
        mbl.imageAssetId AS imageAssetId,
        mbl.sortOrder AS sortOrder,
        mbl.displayStatus AS displayStatus,
        mbl.isActive AS isActive,
        ia.filePath AS imageFilePath,
        CASE
          WHEN ia.filePath LIKE '/%' THEN ia.filePath
          ELSE '/media/' || ia.filePath
        END AS imageUrl,
        mbl.createdAt AS createdAt,
        mbl.updatedAt AS updatedAt
      FROM market_brand_ad_logos mbl
      INNER JOIN image_assets ia
        ON ia.id = mbl.imageAssetId
        AND ia.isActive = 1
      WHERE mbl.channelCode = ?
        AND mbl.isActive = 1
        AND mbl.deletedAt IS NULL
      ORDER BY mbl.sortOrder ASC, mbl.id DESC
      LIMIT ?
    `,
    ).all(
      channelCode,
      BRAND_AD_LOGO_LIMIT,
    ) as MarketBrandAdLogoRow[];

    return rows;
  }

  private assertBrandLogoOwner(
    channelCode: string,
    logoId: number,
  ) {
    const row = db.prepare(
      `
      SELECT id
      FROM market_brand_ad_logos
      WHERE id = ?
        AND channelCode = ?
        AND isActive = 1
        AND deletedAt IS NULL
      LIMIT 1
    `,
    ).get(
      logoId,
      channelCode,
    ) as { id?: number } | undefined;

    if (!row?.id) {
      throw new BadRequestException('BRAND_AD_LOGO_NOT_FOUND');
    }
  }

  private requireImageFile(file?: Express.Multer.File): Express.Multer.File {
    if (!file?.buffer) {
      throw new BadRequestException('IMAGE_FILE_REQUIRED');
    }

    if (!ALLOWED_IMAGE_MIME.includes(file.mimetype as (typeof ALLOWED_IMAGE_MIME)[number])) {
      throw new BadRequestException('INVALID_IMAGE_MIME');
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException('IMAGE_FILE_TOO_LARGE');
    }

    return file;
  }

  private normalizeChannelCode(value?: string): string {
    const channelCode = String(value ?? DEFAULT_MARKET_CHANNEL_CODE).trim();

    if (!/^B[A-Z0-9]{12}$/.test(channelCode)) {
      throw new BadRequestException('CHANNEL_CODE_INVALID');
    }

    return channelCode;
  }

  private normalizeNullableText(value: unknown): string | null {
    const text = String(value ?? '').trim();
    return text.length > 0 ? text : null;
  }

  private normalizeHeroLinkUrl(value: unknown): string | null {
    const normalized =
      String(value ?? '')
        .trim();

    if (!normalized) {
      return null;
    }

    if (normalized.startsWith('/')) {
      return normalized;
    }

    const lower =
      normalized.toLowerCase();

    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      return normalized;
    }

    throw new BadRequestException('HERO_LINK_URL_INVALID');
  }

  private normalizeBannerId(value: unknown): number {
    const bannerId = Number(value);

    if (!Number.isInteger(bannerId) || bannerId <= 0) {
      throw new BadRequestException('HERO_BANNER_ID_INVALID');
    }

    return bannerId;
  }

  private normalizeBrandLogoId(value: unknown): number {
    const logoId = Number(value);

    if (!Number.isInteger(logoId) || logoId <= 0) {
      throw new BadRequestException('BRAND_AD_LOGO_ID_INVALID');
    }

    return logoId;
  }

  private normalizeHeroSortOrder(value: unknown): number {
    const sortOrder = Number(value ?? 1);

    if (!Number.isInteger(sortOrder) || sortOrder < 1 || sortOrder > HERO_BANNER_LIMIT) {
      throw new BadRequestException('HERO_SORT_ORDER_INVALID');
    }

    return sortOrder;
  }

  private normalizeBrandLogoSortOrder(value: unknown): number {
    const sortOrder = Number(value ?? 1);

    if (!Number.isInteger(sortOrder) || sortOrder < 1 || sortOrder > BRAND_AD_LOGO_LIMIT) {
      throw new BadRequestException('BRAND_AD_LOGO_SORT_ORDER_INVALID');
    }

    return sortOrder;
  }
}
