import { adminFetch, adminFileFetch } from '@/lib/adminApi'
import { buildMediaUrl } from '@/lib/config'

export type ConnectMasterProductsFromBarcodesResponse = {
  createdCount: number
  linkedCount: number
  skippedCount: number
  failedCount: number
}

export type MasterProductsSummaryResponse = {
  totalProducts: number
  connectedBarcodeCount: number
  thumbnailRegisteredCount: number
  approvedCount: number
  pendingReviewCount: number
  unlinkedBarcodeCount: number
}

export type MasterProductListItem = {
  id: number
  productCode: string
  productName: string
  normalizedProductName: string | null
  brandName: string | null
  manufacturerName: string | null
  categoryCode: string | null
  categoryName: string | null
  unitLabel: string | null
  specInfo: string | null
  thumbnailImageAssetId: number | null
  thumbnailUrl: string | null
  approvalStatus: string
  isActive: number
  gtin: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type MasterProductDetail = MasterProductListItem

export type MasterProductsListResponse = {
  items: MasterProductListItem[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type MissingThumbnailMasterProduct = {
  id: number
  productCode: string
  gtin: string | null
  productName: string
  normalizedProductName: string | null
  brandName: string | null
  manufacturerName: string | null
  categoryName: string | null
  specInfo: string | null
  approvalStatus: string
  thumbnailImageAssetId: number | null
  createdAt: string | null
  updatedAt: string | null
}

export type MissingThumbnailMasterProductsResponse = {
  items: MissingThumbnailMasterProduct[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type UpdateMasterProductThumbnailResponse = {
  success: true
  thumbnailImageAssetId: number
  filePath: string
}

function resolveThumbnailUrl(thumbnailUrl: string | null): string | null {
  if (!thumbnailUrl) {
    return null
  }

  if (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://')) {
    return thumbnailUrl
  }

  return buildMediaUrl(thumbnailUrl)
}

function normalizeMasterProductItem(item: MasterProductListItem): MasterProductListItem {
  return {
    ...item,
    thumbnailUrl: resolveThumbnailUrl(item.thumbnailUrl)
  }
}

export function fetchMasterProductsSummary(): Promise<MasterProductsSummaryResponse> {
  return adminFetch<MasterProductsSummaryResponse>('/master-products/summary')
}

export function fetchMasterProductsList(params: {
  page: number
  pageSize: number
  keyword?: string
  category?: string
  status?: string
}): Promise<MasterProductsListResponse> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize)
  })

  if (params.keyword) {
    searchParams.set('keyword', params.keyword)
  }

  if (params.category) {
    searchParams.set('category', params.category)
  }

  if (params.status) {
    searchParams.set('status', params.status)
  }

  return adminFetch<MasterProductsListResponse>(
    `/master-products/list?${searchParams.toString()}`
  ).then((response) => ({
    ...response,
    items: response.items.map(normalizeMasterProductItem)
  }))
}

export function fetchMasterProductDetail(productId: number): Promise<MasterProductDetail> {
  return adminFetch<MasterProductDetail>(`/master-products/${productId}`).then(
    normalizeMasterProductItem
  )
}

export function fetchMissingThumbnailMasterProducts(params: {
  page: number
  pageSize: number
}): Promise<MissingThumbnailMasterProductsResponse> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize)
  })
  return adminFetch<MissingThumbnailMasterProductsResponse>(
    `/master-products/missing-thumbnails?${searchParams.toString()}`
  )
}

export function updateMasterProductThumbnail(params: {
  productId: number
  file: File
}): Promise<UpdateMasterProductThumbnailResponse> {
  const formData = new FormData()
  formData.append('file', params.file)

  return adminFileFetch<UpdateMasterProductThumbnailResponse>(
    `/master-products/${params.productId}/thumbnail`,
    formData,
    'PATCH'
  )
}

export function connectMasterProductsFromBarcodes(): Promise<ConnectMasterProductsFromBarcodesResponse> {
  return adminFetch<ConnectMasterProductsFromBarcodesResponse>('/master-products/connect-from-barcodes', {
    method: 'POST'
  })
}
