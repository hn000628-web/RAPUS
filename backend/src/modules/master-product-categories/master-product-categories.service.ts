import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import db from '../../config/database';

type FeedExposeType = 'NONE' | 'MARKET_FEED' | 'EVENT_FEED' | 'PROMOTION_FEED';

type MasterProductCategoryRow = {
  id: number;
  categoryCode: string;
  categoryName: string;
  parentCategoryId: number | null;
  parentCategoryCode: string | null;
  parentCategoryName: string | null;
  depth: number;
  sortOrder: number;
  isActive: number;
  feedExposeType: FeedExposeType;
  linkedProductCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type MasterProductCategorySummary = {
  totalCount: number;
  activeCount: number;
  depth1Count: number;
  depth2Count: number;
};

type MasterProductCategoriesResponse = {
  summary: MasterProductCategorySummary;
  categories: MasterProductCategoryRow[];
};

type MasterProductCategoryInput = {
  categoryCode?: string;
  categoryName?: string;
  parentCategoryId?: number | string | null;
  sortOrder?: number | string | null;
  isActive?: number | string | boolean | null;
  feedExposeType?: string | null;
};

@Injectable()
export class MasterProductCategoriesService {
  getAll(): MasterProductCategoriesResponse {
    const categories = this.findCategories();

    return {
      summary: {
        totalCount: categories.length,
        activeCount: categories.filter((category) => category.isActive === 1).length,
        depth1Count: categories.filter((category) => category.depth === 1).length,
        depth2Count: categories.filter((category) => category.depth === 2).length,
      },
      categories,
    };
  }

  create(input: MasterProductCategoryInput): MasterProductCategoryRow {
    const categoryCode = this.normalizeCategoryCode(input.categoryCode);
    const categoryName = this.normalizeCategoryName(input.categoryName);
    const parentCategory = this.resolveParentCategory(input.parentCategoryId ?? null);
    const sortOrder = this.normalizeSortOrder(input.sortOrder);
    const depth = parentCategory ? 2 : 1;
    const feedExposeType = this.normalizeFeedExposeType(input.feedExposeType);

    try {
      db.prepare(
        `
        INSERT INTO master_product_categories(
          categoryCode,
          categoryName,
          parentCategoryId,
          depth,
          sortOrder,
          feedExposeType,
          isActive,
          createdAt,
          updatedAt
        )
        VALUES(?,?,?,?,?,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `,
      ).run(
        categoryCode,
        categoryName,
        parentCategory?.id ?? null,
        depth,
        sortOrder,
        feedExposeType,
      );
    } catch (error) {
      if (String(error).includes('UNIQUE')) {
        throw new BadRequestException('CATEGORY_CODE_EXISTS');
      }

      throw error;
    }

    return this.getByCode(categoryCode);
  }

  update(
    categoryCodeRaw: string,
    input: MasterProductCategoryInput,
  ): MasterProductCategoryRow {
    const categoryCode = this.normalizeCategoryCode(categoryCodeRaw);
    const existing = this.getByCode(categoryCode);
    const nextCategoryName =
      input.categoryName === undefined
        ? existing.categoryName
        : this.normalizeCategoryName(input.categoryName);
    const nextParentId =
      input.parentCategoryId === undefined
        ? existing.parentCategoryId
        : this.resolveParentCategory(input.parentCategoryId)?.id ?? null;
    const nextDepth = nextParentId ? 2 : 1;
    const nextSortOrder =
      input.sortOrder === undefined
        ? existing.sortOrder
        : this.normalizeSortOrder(input.sortOrder);
    const nextIsActive =
      input.isActive === undefined
        ? existing.isActive
        : this.normalizeActive(input.isActive);
    const nextFeedExposeType =
      input.feedExposeType === undefined
        ? existing.feedExposeType
        : this.normalizeFeedExposeType(input.feedExposeType);

    if (nextParentId === existing.id) {
      throw new BadRequestException('CATEGORY_PARENT_SELF_NOT_ALLOWED');
    }

    db.prepare(
      `
      UPDATE master_product_categories
      SET
        categoryName = ?,
        parentCategoryId = ?,
        depth = ?,
        sortOrder = ?,
        feedExposeType = ?,
        isActive = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE categoryCode = ?
    `,
    ).run(
      nextCategoryName,
      nextParentId,
      nextDepth,
      nextSortOrder,
      nextFeedExposeType,
      nextIsActive,
      categoryCode,
    );

    return this.getByCode(categoryCode);
  }

  private findCategories(): MasterProductCategoryRow[] {
    return db
      .prepare(
        `
        SELECT
          c.id,
          c.categoryCode,
          c.categoryName,
          c.parentCategoryId,
          p.categoryCode AS parentCategoryCode,
          p.categoryName AS parentCategoryName,
          c.depth,
          c.sortOrder,
          c.isActive,
          c.feedExposeType,
          c.createdAt,
          c.updatedAt,
          (
            SELECT COUNT(*)
            FROM master_products mp
            WHERE mp.categoryId = c.id
              OR mp.categoryCode = c.categoryCode
          ) AS linkedProductCount
        FROM master_product_categories c
        LEFT JOIN master_product_categories p
          ON p.id = c.parentCategoryId
        ORDER BY c.depth ASC, c.sortOrder ASC, c.id ASC
      `,
      )
      .all() as MasterProductCategoryRow[];
  }

  private getByCode(categoryCode: string): MasterProductCategoryRow {
    const row = db
      .prepare(
        `
        SELECT
          c.id,
          c.categoryCode,
          c.categoryName,
          c.parentCategoryId,
          p.categoryCode AS parentCategoryCode,
          p.categoryName AS parentCategoryName,
          c.depth,
          c.sortOrder,
          c.isActive,
          c.feedExposeType,
          c.createdAt,
          c.updatedAt,
          (
            SELECT COUNT(*)
            FROM master_products mp
            WHERE mp.categoryId = c.id
              OR mp.categoryCode = c.categoryCode
          ) AS linkedProductCount
        FROM master_product_categories c
        LEFT JOIN master_product_categories p
          ON p.id = c.parentCategoryId
        WHERE c.categoryCode = ?
        LIMIT 1
      `,
      )
      .get(categoryCode) as MasterProductCategoryRow | undefined;

    if (!row) {
      throw new NotFoundException('CATEGORY_NOT_FOUND');
    }

    return row;
  }

  private resolveParentCategory(
    parentCategoryIdRaw: number | string | null | undefined,
  ): { id: number } | null {
    if (
      parentCategoryIdRaw === null ||
      parentCategoryIdRaw === undefined ||
      String(parentCategoryIdRaw).trim() === ''
    ) {
      return null;
    }

    const parentCategoryId = Number(parentCategoryIdRaw);

    if (!Number.isInteger(parentCategoryId) || parentCategoryId <= 0) {
      throw new BadRequestException('INVALID_PARENT_CATEGORY');
    }

    const parent = db
      .prepare(
        `
        SELECT id
        FROM master_product_categories
        WHERE id = ?
          AND depth = 1
        LIMIT 1
      `,
      )
      .get(parentCategoryId) as { id: number } | undefined;

    if (!parent) {
      throw new BadRequestException('PARENT_CATEGORY_NOT_FOUND');
    }

    return parent;
  }

  private normalizeCategoryCode(value?: string): string {
    const categoryCode = String(value ?? '').trim().toUpperCase();

    if (!/^[A-Z0-9_]{2,32}$/.test(categoryCode)) {
      throw new BadRequestException('INVALID_CATEGORY_CODE');
    }

    return categoryCode;
  }

  private normalizeCategoryName(value?: string): string {
    const categoryName = String(value ?? '').trim();

    if (categoryName.length < 1 || categoryName.length > 60) {
      throw new BadRequestException('INVALID_CATEGORY_NAME');
    }

    return categoryName;
  }

  private normalizeSortOrder(value?: number | string | null): number {
    if (value === null || value === undefined || String(value).trim() === '') {
      return 0;
    }

    const sortOrder = Number(value);

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new BadRequestException('INVALID_SORT_ORDER');
    }

    return sortOrder;
  }

  private normalizeActive(value: number | string | boolean | null): number {
    if (value === true || value === 1 || value === '1') {
      return 1;
    }

    if (value === false || value === 0 || value === '0') {
      return 0;
    }

    throw new BadRequestException('INVALID_ACTIVE_VALUE');
  }

  private normalizeFeedExposeType(value?: string | null): FeedExposeType {
    const feedExposeType = String(value ?? 'NONE').trim().toUpperCase();

    if (
      feedExposeType === 'NONE' ||
      feedExposeType === 'MARKET_FEED' ||
      feedExposeType === 'EVENT_FEED' ||
      feedExposeType === 'PROMOTION_FEED'
    ) {
      return feedExposeType;
    }

    throw new BadRequestException('INVALID_FEED_EXPOSE_TYPE');
  }
}
