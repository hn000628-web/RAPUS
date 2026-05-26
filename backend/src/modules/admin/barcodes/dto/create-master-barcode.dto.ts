// SECTION 01 : DTO

export class CreateMasterBarcodeDto {
  gtin?: string;
  productCategoryName?: string;
  productNameKo?: string;
  brandName?: string;
  companyInfo?: string;
  originInfo?: string;
  packageInfo?: string;
  specInfo?: string;
  netWeight?: string;
  productShape?: string;
  productNumber?: string;
}
