export type BusinessPostType =
  | 'EVENT'
  | 'PRODUCT'
  | 'GENERAL'
  | 'GALLERY'
  | 'REVIEW'

export type BizType =
  | 'FREELANCER'
  | 'STORE'
  | 'REAL_ESTATE'
  | 'AUTO'

export type BusinessCategoryResponse = {
  profileId: number
  channelCode: string
  postType: BusinessPostType
  name: string
  title: string
  sortOrder: number
  isActive: boolean
  isSystem?: boolean
}
