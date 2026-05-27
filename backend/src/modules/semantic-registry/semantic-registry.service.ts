import { Injectable } from '@nestjs/common';
import db from '../../config/database';

export type SemanticItemRow = {
  id: number;
  itemCode: string;
  itemName: string;
  categoryType: string;
  aliases: string | null;
  isWeightProduct: number;
  isSeasonal: number;
};

export type SemanticPrefixRow = {
  id: number;
  prefixCode: string;
  prefixName: string;
  prefixCategory: string | null;
  description: string | null;
};

@Injectable()
export class SemanticRegistryService {
  findItemByCode(itemCode: string): SemanticItemRow | null {
    const normalizedItemCode = String(itemCode ?? '').trim();
    if (!normalizedItemCode) {
      return null;
    }

    const row = db
      .prepare(
        `
        SELECT
          id,
          itemCode,
          itemName,
          categoryType,
          aliases,
          isWeightProduct,
          isSeasonal
        FROM semantic_item_registry
        WHERE itemCode = ?
          AND COALESCE(isActive, 1) = 1
        LIMIT 1
      `,
      )
      .get(normalizedItemCode) as SemanticItemRow | undefined;

    return row ?? null;
  }

  findItemFromScanCode(scanCodeValue: string): SemanticItemRow | null {
    const normalizedScanCode = String(scanCodeValue ?? '').trim();
    if (!normalizedScanCode) {
      return null;
    }

    const rows = db
      .prepare(
        `
        SELECT
          id,
          itemCode,
          itemName,
          categoryType,
          aliases,
          isWeightProduct,
          isSeasonal
        FROM semantic_item_registry
        WHERE COALESCE(isActive, 1) = 1
        ORDER BY length(itemCode) DESC, itemCode ASC
      `,
      )
      .all() as SemanticItemRow[];

    return (
      rows.find((row) => normalizedScanCode.includes(row.itemCode)) ?? null
    );
  }

  findPrefix(prefixCode: string): SemanticPrefixRow | null {
    const normalizedPrefixCode = String(prefixCode ?? '').trim().toUpperCase();
    if (!normalizedPrefixCode) {
      return null;
    }

    const row = db
      .prepare(
        `
        SELECT
          id,
          prefixCode,
          prefixName,
          prefixCategory,
          description
        FROM semantic_prefix_registry
        WHERE prefixCode = ?
        LIMIT 1
      `,
      )
      .get(normalizedPrefixCode) as SemanticPrefixRow | undefined;

    return row ?? null;
  }
}
