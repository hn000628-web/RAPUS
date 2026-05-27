import { Module } from '@nestjs/common';
import { SemanticRegistryModule } from '../semantic-registry/semantic-registry.module';
import { BarcodeParserService } from './barcode-parser.service';

@Module({
  imports: [SemanticRegistryModule],
  providers: [BarcodeParserService],
  exports: [BarcodeParserService],
})
export class BarcodeParserModule {}
