// FILE : backend/src/modules/business/pos/cooking/cooking.module.ts
// ROOT : backend/src/modules/business/pos/cooking/cooking.module.ts
// STATUS : CREATE MODE
// ROLE : BUSINESS POS COOKING RUNTIME MODULE

import {
  Module
} from '@nestjs/common'

import {
  CookingController
} from './cooking.controller'
import {
  CookingService
} from './cooking.service'

@Module({
  controllers: [
    CookingController
  ],
  providers: [
    CookingService
  ],
  exports: [
    CookingService
  ]
})
export class CookingModule {}
