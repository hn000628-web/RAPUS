// SECTION 01 : IMPORT

import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { AdminBarcodesService } from './barcodes.service';
import { CreateMasterBarcodeDto } from './dto/create-master-barcode.dto';

// SECTION 02 : CONTROLLER

@Controller('admin/barcodes')
export class AdminBarcodesController {
  constructor(private readonly adminBarcodesService: AdminBarcodesService) {}

  // SECTION 03 : CREATE MASTER BARCODE

  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  createMasterBarcode(
    @Body() body: CreateMasterBarcodeDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    return this.adminBarcodesService.createMasterBarcode(body, thumbnail);
  }

  // SECTION 04 : UPDATE MASTER BARCODE

  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail'))
  updateMasterBarcode(
    @Param('id') id: string,
    @Body() body: CreateMasterBarcodeDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    return this.adminBarcodesService.updateMasterBarcode(id, body, thumbnail);
  }
}
