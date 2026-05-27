import { apiFetch } from '@/lib/api'
import { buildMediaUrl } from '@/lib/config'

export type MarketProductStockStatus =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'SOLD_OUT'

export type MarketAdminPublicProduct = {
  id: number
  productCode: string
  productName: string
  brandName: string | null
  categoryName: string | null
  scanCodeValue: string | null
  thumbnailUrl: string | null
  isRegistered: boolean
}

export type MarketAdminProduct = {
  id: number
  profileId: number
  channelCode: string
  sourceProductId: number
  productCode: string
  barcode: string | null
  productNameSnapshot: string
  brandNameSnapshot: string | null
  categoryNameSnapshot: string | null
  purchasePrice: number
  salePrice: number
  eventPrice: number | null
  eventStartAt: string | null
  eventEndAt: string | null
  stockQuantity: number
  safetyStockQuantity: number
  stockStatus: MarketProductStockStatus
  isOnSale: number
  isDisplayed: number
  isEventActive: number
  isSoldOut: number
  lastSyncedAt: string | null
  priceUpdatedAt: string | null
  stockUpdatedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type MarketAdminProductSummary = {
  totalProducts: number
  soldOutProducts: number
  lowStockProducts: number
  eventProducts: number
  onSaleProducts: number
}

export type MarketAdminDashboardSummary = {
  totalProducts: number
  soldOutProducts: number
  lowStockProducts: number
  eventProducts: number
  activeProducts: number
}

export type MarketAdminPublicProductsResponse = {
  items: MarketAdminPublicProduct[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type MarketAdminProductsResponse = {
  items: MarketAdminProduct[]
  summary: MarketAdminProductSummary
}

export type ImportMarketProductInput = {
  channelCode: string
  productCode: string
  purchasePrice: number
  salePrice: number
  eventPrice?: number | null
  eventStartAt?: string | null
  eventEndAt?: string | null
  stockQuantity: number
  safetyStockQuantity: number
  isOnSale: boolean
  isDisplayed: boolean
  changeMemo?: string | null
}

export type UpdateMarketProductPricingInput = {
  channelCode: string
  purchasePrice: number
  salePrice: number
  eventPrice?: number | null
  eventStartAt?: string | null
  eventEndAt?: string | null
  isEventActive?: boolean
  changeMemo?: string | null
}

export type UpdateMarketProductStockInput = {
  channelCode: string
  stockQuantity: number
  safetyStockQuantity: number
  isSoldOut?: boolean
  changeMemo?: string | null
}

export type UpdateMarketProductStatusInput = {
  channelCode: string
  isOnSale: boolean
  isDisplayed: boolean
  isSoldOut: boolean
  changeMemo?: string | null
}

export type MarketProductHistoryItem = {
  id: number
  marketProductId: number
  channelCode: string
  productCode: string
  changeType: 'PRICE' | 'STOCK' | 'STATUS' | 'DISPLAY' | 'EVENT' | 'SYNC'
  beforeValue: string | null
  afterValue: string | null
  changedByProfileId: number | null
  changeMemo: string | null
  createdAt: string | null
}

export type MarketProductHistoryResponse = {
  items: MarketProductHistoryItem[]
}

export type MarketAdminImportPreviewRow = {
  id: number
  rowNo: number
  productName: string | null
  scanCodeValue: string | null
  salePrice: number
  eventCode: string | null
  eventTitle: string | null
  eventStartAt: string | null
  eventEndAt: string | null
  eventStatus: 'NONE' | 'SCHEDULED' | 'ACTIVE' | 'ENDED'
  normalizedStockQuantity: number | null
  stockNormalizeMemo:
    | 'NEGATIVE_STOCK_NORMALIZED_TO_ZERO'
    | 'INVALID_STOCK_VALUE'
    | 'STOCK_UPDATE_SKIPPED'
    | null
  mappedProductCode: string | null
  rowStatus: string
  displayStatus:
    | 'MATCHED'
    | 'NEW_PRODUCT_REQUIRED'
    | 'MISSING_BARCODE'
    | 'STOCK_WARNING'
    | 'DUPLICATE_SCAN_CODE'
  errorMessage: string | null
}

export type MarketAdminImportPreviewResponse = {
  batchId: number
  summary: {
    totalRows: number
    matchedRows: number
    newProductRows: number
    errorRows: number
    duplicateRows: number
  }
  rows: MarketAdminImportPreviewRow[]
}

export type MarketAdminImportConfirmMode =
  | 'AUTO_MATCH'
  | 'CREATE_ONLY'
  | 'UPDATE_EXISTING'
  | 'STOCK_ONLY'
  | 'PRICE_ONLY'

export type MarketAdminImportUploadMode =
  | 'FULL_SYNC'
  | 'PARTIAL_UPDATE'

export type MarketAdminImportConfirmResponse = {
  batchId: number
  mode: MarketAdminImportConfirmMode
  createdProducts: number
  updatedProducts: number
  skippedRows: number
  failedRows: number
}

export type MarketAdminImportApplyResponse = {
  success: true
  uploadMode: MarketAdminImportUploadMode
  totalCount: number
  createdCount: number
  updatedCount: number
  skippedCount: number
  soldOutCount: number
  restoredCount: number
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

function normalizePublicProduct(
  item: MarketAdminPublicProduct
): MarketAdminPublicProduct {
  return {
    ...item,
    thumbnailUrl: resolveThumbnailUrl(item.thumbnailUrl)
  }
}

export function fetchMarketAdminProducts(
  channelCode: string
): Promise<MarketAdminProductsResponse> {
  const searchParams = new URLSearchParams({
    channelCode
  })

  return apiFetch<MarketAdminProductsResponse>(
    `/market-admin/products?${searchParams.toString()}`
  )
}

export function fetchMarketAdminDashboardSummary(
  channelCode: string
): Promise<MarketAdminDashboardSummary> {
  const searchParams = new URLSearchParams({
    channelCode
  })

  return apiFetch<MarketAdminDashboardSummary>(
    `/market-admin/dashboard-summary?${searchParams.toString()}`
  )
}

export function fetchMarketAdminPublicProducts(params: {
  channelCode: string
  page: number
  pageSize: number
  keyword?: string
  category?: string
}): Promise<MarketAdminPublicProductsResponse> {
  const searchParams = new URLSearchParams({
    channelCode: params.channelCode,
    page: String(params.page),
    pageSize: String(params.pageSize)
  })

  if (params.keyword) {
    searchParams.set('keyword', params.keyword)
  }

  if (params.category) {
    searchParams.set('category', params.category)
  }

  return apiFetch<MarketAdminPublicProductsResponse>(
    `/market-admin/products/public?${searchParams.toString()}`
  ).then((response) => ({
    ...response,
    items: response.items.map(normalizePublicProduct)
  }))
}

export function importMarketAdminProduct(
  input: ImportMarketProductInput
): Promise<MarketAdminProduct> {
  return apiFetch<MarketAdminProduct>(
    '/market-admin/products/import',
    {
      method: 'POST',
      body: input
    }
  )
}

export function updateMarketAdminProductPricing(
  productId: number,
  input: UpdateMarketProductPricingInput
): Promise<MarketAdminProduct> {
  return apiFetch<MarketAdminProduct>(
    `/market-admin/products/${productId}/pricing`,
    {
      method: 'PATCH',
      body: input
    }
  )
}

export function updateMarketAdminProductStock(
  productId: number,
  input: UpdateMarketProductStockInput
): Promise<MarketAdminProduct> {
  return apiFetch<MarketAdminProduct>(
    `/market-admin/products/${productId}/stock`,
    {
      method: 'PATCH',
      body: input
    }
  )
}

export function updateMarketAdminProductStatus(
  productId: number,
  input: UpdateMarketProductStatusInput
): Promise<MarketAdminProduct> {
  return apiFetch<MarketAdminProduct>(
    `/market-admin/products/${productId}/status`,
    {
      method: 'PATCH',
      body: input
    }
  )
}

export function fetchMarketAdminProductHistory(params: {
  productId: number
  channelCode: string
}): Promise<MarketProductHistoryResponse> {
  const searchParams = new URLSearchParams({
    channelCode: params.channelCode
  })

  return apiFetch<MarketProductHistoryResponse>(
    `/market-admin/products/${params.productId}/history?${searchParams.toString()}`
  )
}

export function uploadMarketAdminProductImportFile(params: {
  channelCode: string
  file: File
}): Promise<MarketAdminImportPreviewResponse> {
  const formData = new FormData()
  formData.append('channelCode', params.channelCode)
  formData.append('file', params.file)

  return apiFetch<MarketAdminImportPreviewResponse>(
    '/market-admin/products/import-file',
    {
      method: 'POST',
      body: formData,
      isForm: true
    }
  )
}

export function confirmMarketAdminProductImport(params: {
  channelCode: string
  batchId: number
  mode: MarketAdminImportConfirmMode
}): Promise<MarketAdminImportConfirmResponse> {
  return apiFetch<MarketAdminImportConfirmResponse>(
    `/market-admin/products/import-file/${params.batchId}/confirm`,
    {
      method: 'POST',
      body: {
        channelCode: params.channelCode,
        confirmMode: params.mode
      }
    }
  )
}

export function applyMarketAdminProductImport(params: {
  channelCode: string
  batchId: number
  uploadMode: MarketAdminImportUploadMode
  previewRows: MarketAdminImportPreviewRow[]
}): Promise<MarketAdminImportApplyResponse> {
  return apiFetch<MarketAdminImportApplyResponse>(
    '/market-admin/products/import-apply',
    {
      method: 'POST',
      body: {
        channelCode: params.channelCode,
        batchId: params.batchId,
        uploadMode: params.uploadMode,
        previewRows: params.previewRows
      }
    }
  )
}
