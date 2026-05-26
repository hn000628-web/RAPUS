import { adminFetch, adminFileFetch } from '@/lib/adminApi';

export type MasterBarcodeSummaryResponse = {
  totalCount: number;
  validCount: number;
  duplicateSuspectCount: number;
  errorCount: number;
  unlinkedCount: number;
};

export type MasterBarcodeLookupBarcode = {
  id: number;
  gtin: string;
  barcodeType: string | null;
  productCategoryCode: string | null;
  productCategoryName: string | null;
  rawProductName: string | null;
  productNameKo: string | null;
  brandName: string | null;
  companyInfo: string | null;
  originInfo: string | null;
  specInfo: string | null;
  netWeight: string | null;
  productShape: string | null;
  sourceThumbnailUrl: string | null;
  rawPayload: string | null;
};

export type MasterBarcodeLookupFoodDetails = {
  reportNumber: string | null;
};

export type MasterBarcodeLookupProduct = {
  id: number;
  productCode: string;
  productName: string;
};

export type MasterBarcodeLookupResponse = {
  found: boolean;
  barcode: MasterBarcodeLookupBarcode | null;
  masterProduct: MasterBarcodeLookupProduct | null;
  foodDetails: MasterBarcodeLookupFoodDetails | null;
};

export type MasterBarcodeCsvUploadResponse = {
  totalCount: number;
  successCount: number;
  failedCount: number;
  duplicateCount: number;
  policy?: 'SKIP_DUPLICATE';
};

export type MasterBarcodeSearchItem = {
  id: number;
  gtin: string;
  rawProductName: string | null;
  productNameKo: string | null;
  brandName: string | null;
  brandOwnerName: string | null;
  manufacturerName: string | null;
  companyInfo: string | null;
  originInfo: string | null;
  packageInfo: string | null;
  specInfo: string | null;
  netWeight: string | null;
  productShape: string | null;
  productNumber: string | null;
  productCategoryName: string | null;
  sourceThumbnailUrl: string | null;
  createdAt: string | null;
};

export type MasterBarcodeSearchResponse = {
  items: MasterBarcodeSearchItem[];
  totalCount: number;
};

export type CreateMasterBarcodeInput = {
  gtin: string;
  productCategoryName: string;
  productNameKo: string;
  brandName: string;
  companyInfo: string;
  originInfo: string;
  packageInfo: string;
  specInfo: string;
  netWeight: string;
  productShape: string;
  productNumber: string;
  thumbnail?: File | null;
};

export type CreateMasterBarcodeResponse = {
  success: boolean;
  masterBarcodeId: number;
  gtin: string;
  thumbnailUrl: string | null;
};

export async function fetchMasterBarcodeSummary(): Promise<MasterBarcodeSummaryResponse> {
  return adminFetch<MasterBarcodeSummaryResponse>('/master-barcodes/summary', {
    method: 'GET',
  });
}

export async function fetchMasterBarcodeByGtin(
  gtin: string,
): Promise<MasterBarcodeLookupResponse> {
  return adminFetch<MasterBarcodeLookupResponse>(
    `/master-barcodes/${encodeURIComponent(gtin.trim())}`,
    { method: 'GET' },
  );
}

export async function fetchMasterBarcodesSearch(
  query: string,
  limit = 20,
): Promise<MasterBarcodeSearchResponse> {
  const searchParams = new URLSearchParams({
    query: query.trim(),
    limit: String(limit),
  });

  return adminFetch<MasterBarcodeSearchResponse>(
    `/master-barcodes/search?${searchParams.toString()}`,
    { method: 'GET' },
  );
}

export async function uploadMasterBarcodeCsv(
  file: File,
): Promise<MasterBarcodeCsvUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return adminFileFetch<MasterBarcodeCsvUploadResponse>(
    '/master-barcodes/upload-csv',
    formData,
    'POST',
  );
}

export async function createMasterBarcode(
  input: CreateMasterBarcodeInput,
): Promise<CreateMasterBarcodeResponse> {
  const formData = new FormData();

  formData.append('gtin', input.gtin);
  formData.append('productCategoryName', input.productCategoryName);
  formData.append('productNameKo', input.productNameKo);
  formData.append('brandName', input.brandName);
  formData.append('companyInfo', input.companyInfo);
  formData.append('originInfo', input.originInfo);
  formData.append('packageInfo', input.packageInfo);
  formData.append('specInfo', input.specInfo);
  formData.append('netWeight', input.netWeight);
  formData.append('productShape', input.productShape);
  formData.append('productNumber', input.productNumber);

  if (input.thumbnail) {
    formData.append('thumbnail', input.thumbnail);
  }

  return adminFileFetch<CreateMasterBarcodeResponse>(
    '/barcodes',
    formData,
    'POST',
  );
}

export async function updateMasterBarcode(
  id: number,
  input: CreateMasterBarcodeInput,
): Promise<CreateMasterBarcodeResponse> {
  const formData = new FormData();

  formData.append('gtin', input.gtin);
  formData.append('productCategoryName', input.productCategoryName);
  formData.append('productNameKo', input.productNameKo);
  formData.append('brandName', input.brandName);
  formData.append('companyInfo', input.companyInfo);
  formData.append('originInfo', input.originInfo);
  formData.append('packageInfo', input.packageInfo);
  formData.append('specInfo', input.specInfo);
  formData.append('netWeight', input.netWeight);
  formData.append('productShape', input.productShape);
  formData.append('productNumber', input.productNumber);

  if (input.thumbnail) {
    formData.append('thumbnail', input.thumbnail);
  }

  return adminFileFetch<CreateMasterBarcodeResponse>(
    `/barcodes/${id}`,
    formData,
    'PATCH',
  );
}

export type CreateBarcodeProductInput = {
  barcodeValue: string;
  productCategoryName: string;
  productNameKr: string;
  brandName: string;
  companyName: string;
  countryName: string;
  compositionInfo: string;
  specificationInfo: string;
  netWeight: string;
  productShape: string;
  reportNumber: string;
  thumbnail?: File | null;
};

export type CreateBarcodeProductResponse = {
  success: boolean;
  productCode: string;
  barcodeProductId: number;
  thumbnailUrl: string | null;
  masterBarcodeId: number;
  gtin: string;
};

export async function createBarcodeProduct(
  input: CreateBarcodeProductInput,
): Promise<CreateBarcodeProductResponse> {
  const response = await createMasterBarcode({
    gtin: input.barcodeValue,
    productCategoryName: input.productCategoryName,
    productNameKo: input.productNameKr,
    brandName: input.brandName,
    companyInfo: input.companyName,
    originInfo: input.countryName,
    packageInfo: input.compositionInfo,
    specInfo: input.specificationInfo,
    netWeight: input.netWeight,
    productShape: input.productShape,
    productNumber: input.reportNumber,
    thumbnail: input.thumbnail,
  });

  return {
    success: response.success,
    productCode: response.gtin,
    barcodeProductId: response.masterBarcodeId,
    thumbnailUrl: response.thumbnailUrl,
    masterBarcodeId: response.masterBarcodeId,
    gtin: response.gtin,
  };
}
