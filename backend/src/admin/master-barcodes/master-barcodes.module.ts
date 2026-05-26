import { Module } from '@nestjs/common';
import { MasterBarcodesController } from './master-barcodes.controller';
import { MasterBarcodesService } from './master-barcodes.service';

@Module({
  controllers: [MasterBarcodesController],
  providers: [MasterBarcodesService],
  exports: [MasterBarcodesService],
})
export class MasterBarcodesModule {}
