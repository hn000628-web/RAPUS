// SECTION 01 : IMPORT

import { Module } from '@nestjs/common';

import { AdminBarcodesController } from './barcodes.controller';
import { AdminBarcodesService } from './barcodes.service';

// SECTION 02 : MODULE

@Module({
  controllers: [AdminBarcodesController],
  providers: [AdminBarcodesService],
  exports: [AdminBarcodesService],
})
export class AdminBarcodesModule {}
