import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { MasterProductsService } from './master-products.service';

@Controller('admin/master-products')
export class MasterProductsController {
  constructor(private readonly masterProductsService: MasterProductsService) {}

  @Get('summary')
  getSummary() {
    return this.masterProductsService.getSummary();
  }

  @Get('list')
  getProductList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.masterProductsService.getProductList({
      page,
      pageSize,
      keyword,
      category,
      status,
    });
  }

  @Get('missing-thumbnails')
  getMissingThumbnailProducts(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.masterProductsService.getMissingThumbnailProducts(
      page,
      pageSize,
    );
  }

  @Get(':productId')
  getProductDetail(@Param('productId') productId: string) {
    return this.masterProductsService.getProductDetail(productId);
  }

  @Post('connect-from-barcodes')
  connectFromBarcodes() {
    return this.masterProductsService.connectFromBarcodes();
  }

  @Patch(':productId/thumbnail')
  @UseInterceptors(FileInterceptor('file'))
  updateThumbnail(
    @Param('productId') productId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.masterProductsService.updateThumbnail(productId, file);
  }

  @Post('thumbnail-batch-upload')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'zipFile', maxCount: 1 },
      { name: 'imageFiles', maxCount: 100 },
    ]),
  )
  uploadThumbnailBatch(
    @UploadedFiles()
    files?: {
      zipFile?: Express.Multer.File[];
      imageFiles?: Express.Multer.File[];
    },
  ) {
    return this.masterProductsService.uploadThumbnailBatch(
      files?.zipFile?.[0],
      files?.imageFiles ?? [],
    );
  }

  @Post('from-barcode')
  createFromBarcode(
    @Body()
    body: {
      gtin: string;
      productName?: string;
      categoryCode?: string;
      categoryName?: string;
      approvalStatus?: 'DRAFT' | 'APPROVED' | 'REJECTED';
      isActive?: boolean;
    },
  ) {
    return this.masterProductsService.createFromBarcode(body);
  }
}
