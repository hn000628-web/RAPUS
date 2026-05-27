import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { MarketAdminCsvImportService } from './market-admin-csv-import.service';
import { MarketAdminProductsService } from './market-admin-products.service';

type MarketAdminProductQuery = {
  channelCode?: string;
  page?: string;
  pageSize?: string;
  keyword?: string;
  category?: string;
};

type ImportMarketProductBody = {
  channelCode?: string;
  productCode?: string;
  purchasePrice?: number | string;
  salePrice?: number | string;
  eventPrice?: number | string | null;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  stockQuantity?: number | string;
  safetyStockQuantity?: number | string;
  isOnSale?: boolean | number | string;
  isDisplayed?: boolean | number | string;
  changedByProfileId?: number | string | null;
  changeMemo?: string | null;
};

type UpdatePricingBody = {
  channelCode?: string;
  purchasePrice?: number | string;
  salePrice?: number | string;
  eventPrice?: number | string | null;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  isEventActive?: boolean | number | string;
  changedByProfileId?: number | string | null;
  changeMemo?: string | null;
};

type UpdateStockBody = {
  channelCode?: string;
  stockQuantity?: number | string;
  safetyStockQuantity?: number | string;
  isSoldOut?: boolean | number | string;
  changedByProfileId?: number | string | null;
  changeMemo?: string | null;
};

type UpdateStatusBody = {
  channelCode?: string;
  isOnSale?: boolean | number | string;
  isDisplayed?: boolean | number | string;
  isSoldOut?: boolean | number | string;
  changedByProfileId?: number | string | null;
  changeMemo?: string | null;
};

type ApplyImportPreviewBody = {
  channelCode?: string;
  batchId?: number | string;
  uploadMode?: string;
  previewRows?: unknown[];
};

@Controller('market-admin')
export class MarketAdminDashboardController {
  constructor(
    private readonly marketAdminProductsService: MarketAdminProductsService,
  ) {}

  @Get('dashboard-summary')
  getDashboardSummary(@Query() query: MarketAdminProductQuery) {
    return this.marketAdminProductsService.getDashboardSummary(query);
  }
}

@Controller('market-admin/products')
export class MarketAdminProductsController {
  constructor(
    private readonly marketAdminCsvImportService: MarketAdminCsvImportService,
    private readonly marketAdminProductsService: MarketAdminProductsService,
  ) {}

  @Get('public')
  getPublicProducts(@Query() query: MarketAdminProductQuery) {
    return this.marketAdminProductsService.getPublicProducts(query);
  }

  @Get()
  getMarketProducts(@Query() query: MarketAdminProductQuery) {
    return this.marketAdminProductsService.getMarketProducts(query);
  }

  @Post('import')
  importProduct(@Body() body: ImportMarketProductBody) {
    return this.marketAdminProductsService.importProduct(body);
  }

  @Post('import-file')
  @UseInterceptors(FileInterceptor('file'))
  importProductFile(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('channelCode') channelCode: string | undefined,
  ) {
    return this.marketAdminCsvImportService.previewImportFile({
      channelCode,
      file,
    });
  }

  @Post('import-file/:batchId/confirm')
  confirmImportProductFile(
    @Param('batchId') batchId: string,
    @Body('channelCode') channelCode: string | undefined,
    @Body('confirmMode') confirmMode: string | undefined,
    @Body('mode') mode: string | undefined,
  ) {
    return this.marketAdminCsvImportService.confirmImportBatch({
      batchId,
      channelCode,
      mode: confirmMode ?? mode,
    });
  }

  @Post('import-apply')
  applyImportPreview(@Body() body: ApplyImportPreviewBody) {
    return this.marketAdminCsvImportService.applyImportPreviewToMarketProducts(body);
  }

  @Patch(':id/pricing')
  updatePricing(
    @Param('id') id: string,
    @Body() body: UpdatePricingBody,
  ) {
    return this.marketAdminProductsService.updatePricing(id, body);
  }

  @Patch(':id/stock')
  updateStock(
    @Param('id') id: string,
    @Body() body: UpdateStockBody,
  ) {
    return this.marketAdminProductsService.updateStock(id, body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateStatusBody,
  ) {
    return this.marketAdminProductsService.updateStatus(id, body);
  }

  @Get(':id/history')
  getHistory(
    @Param('id') id: string,
    @Query() query: MarketAdminProductQuery,
  ) {
    return this.marketAdminProductsService.getHistory(id, query);
  }
}
