import { apiFetch } from '@/lib/api'

export type BusinessProductSearchItem = {
  productId: number
  productCode: string
  barcode: string
  productName: string
  brandName: string
  thumbnailUrl: string | null
  categoryName: string
}

export async function searchProducts(keyword: string): Promise<BusinessProductSearchItem[]> {
  const trimmedKeyword = String(keyword ?? '').trim()
  if (!trimmedKeyword) return []

  const params = new URLSearchParams({ keyword: trimmedKeyword })
  return apiFetch<BusinessProductSearchItem[]>(`business/products/search?${params.toString()}`)
}

