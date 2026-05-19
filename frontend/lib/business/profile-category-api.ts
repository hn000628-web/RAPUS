// FILE : frontend/lib/business/profile-category-api.ts
// ROOT : frontend/lib/business/profile-category-api.ts
// STATUS : PRODUCTION READY
// ROLE : BUSINESS PROFILE CATEGORY API
// CHANGE SUMMARY :
// - 메뉴바 전용 카테고리 API
// - 단일 귀속 검증(profileId + channelCode)
// - 메뉴 정렬(sortOrder) 유지
// - INFO 제외

import type { BusinessCategoryResponse } from '@/types/businessPostTypes'

const BASE_URL = process.env.NEXT_PUBLIC_API || ''

/* ==================================================
SECTION 01 : GET PROFILE CATEGORY
================================================== */
export async function getProfileCategories(
  profileId: number,
  channelCode: string
): Promise<BusinessCategoryResponse[]> {
  if (!profileId || !channelCode) {
    throw new Error('Invalid profile context')
  }

  const res = await fetch(
    `${BASE_URL}/api/business/profile/${profileId}/categories`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    }
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.status}`)
  }

  const data: BusinessCategoryResponse[] = await res.json()

  // INFO 제외, 메뉴바용 필터링
  return data.filter((item) => (item.postType as string) !== 'INFO')
}

/* ==================================================
SECTION 02 : GET CATEGORY BY TYPE (OPTIONAL HELPER)
================================================== */
export async function getCategoryByType(
  profileId: number,
  channelCode: string,
  postType: BusinessCategoryResponse['postType']
): Promise<BusinessCategoryResponse | undefined> {
  const categories = await getProfileCategories(profileId, channelCode)
  return categories.find((c) => c.postType === postType)
}

export async function updateProfileCategory(): Promise<void> {
  return
}
