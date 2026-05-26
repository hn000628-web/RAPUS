import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MasterBarcodesService } from './master-barcodes.service';

@Controller('admin/master-barcodes')
export class MasterBarcodesController {
  constructor(private readonly masterBarcodesService: MasterBarcodesService) {}

  @Get('summary')
  getSummary() {
    return this.masterBarcodesService.getSummary();
  }

  @Get('search')
  search(@Query('query') query: string, @Query('limit') limit?: string) {
    return this.masterBarcodesService.search(query, limit);
  }

  @Get(':gtin')
  getByGtin(@Param('gtin') gtin: string) {
    return this.masterBarcodesService.findByGtin(gtin);
  }

  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  uploadCsv(@UploadedFile() file: Express.Multer.File) {
    return this.masterBarcodesService.uploadCsv(file);
  }

  @Post()
  createOrUpdate(
    @Body()
    body: {
      gtin: string;
      barcodeType?: string;
      rawProductName?: string;
      normalizedProductName?: string;
      brandName?: string;
      manufacturerName?: string;
      categoryName?: string;
      categoryCode?: string;
      originInfo?: string;
      specInfo?: string;
      unitLabel?: string;
      packageInfo?: string;
      sourceThumbnailUrl?: string;
      sourceType?: 'CSV' | 'API' | 'MANUAL';
      rawPayload?: string;
      isActive?: boolean;
    },
  ) {
    return this.masterBarcodesService.upsert(body);
  }
}
