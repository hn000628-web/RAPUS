import { Module } from '@nestjs/common';
import { SemanticRegistryService } from './semantic-registry.service';

@Module({
  providers: [SemanticRegistryService],
  exports: [SemanticRegistryService],
})
export class SemanticRegistryModule {}
