// FILE : backend/src/modules/business/category/business-category.service.ts
// ROOT : backend/src/modules/business/category/business-category.service.ts
// STATUS : PRODUCTION READY
// ROLE : BUSINESS CATEGORY SERVICE
// CHANGE SUMMARY :
// - profile_categories 조회 API용 Service
// - 단일 귀속 검증(profileId + channelCode)
// - 메뉴 정렬(sortOrder ASC)

import { Injectable } from '@nestjs/common';
import db from '../../../config/database';
import type { BusinessPostType } from '../../../types/businessPostTypes';

export interface BusinessCategoryResponse {
  profileId: number;
  channelCode: string;
  postType: BusinessPostType;
  name: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  isSystem?: boolean;
}

@Injectable()
export class BusinessCategoryService {
  async getCategories(
    profileId: number,
    channelCode: string,
  ): Promise<BusinessCategoryResponse[]> {
    // 단일 귀속 검증
    const profileExists = db
      .prepare(
        `SELECT 1 FROM profiles WHERE id = ? AND channelCode = ?`
      )
      .get(profileId, channelCode);

    if (!profileExists) {
      throw new Error('Invalid profile context');
    }

    // profile_categories 조회
    const rows: BusinessCategoryResponse[] = db
      .prepare(
        `
        SELECT profileId, channelCode, postType, name, title, sortOrder, isActive, isSystem
        FROM profile_categories
        WHERE profileId = ?
        ORDER BY sortOrder ASC
      `
      )
      .all(profileId);

    return rows;
  }
}
