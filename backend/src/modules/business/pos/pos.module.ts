// FILE : backend/src/modules/business/pos/pos.module.ts
// ROOT : backend/src/modules/business/pos/pos.module.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS POS MODULE
// CHANGE SUMMARY :
// - 기존 POS categories API Controller / Service 등록 유지
// - 기존 POS menu API Controller / Service 등록 유지
// - 기존 POS table-settings API Controller / Service 등록 유지
// - 기존 POS orders API Module 등록 유지
// - POS order-types API Module 등록 추가
// - BusinessPosTableSettingsService export 유지
// - 기존 PosCategoriesController / PosCategoriesService 유지
// - 기존 PosMenuController / PosMenuService 유지

// SECTION 01 : IMPORT

import { Module } from '@nestjs/common'

import { PosCategoriesController } from './categories/pos-categories.controller'
import { PosCategoriesService } from './categories/pos-categories.service'
import { CookingModule } from './cooking/cooking.module'
import { PosMenuController } from './menu/pos-menu.controller'
import { PosMenuService } from './menu/pos-menu.service'
import { PosOrderDashboardController } from './order-dashboard/pos-order-dashboard.controller'
import { PosOrderDashboardService } from './order-dashboard/pos-order-dashboard.service'
import { PosOrderTypesModule } from './order-types/order-types.module'
import { PosOrdersModule } from './orders/pos-orders.module'
import { PosRoomsController } from './pos-rooms.controller'
import { PosRoomsService } from './pos-rooms.service'
import { BusinessPosTableSettingsController } from './table-settings/pos-table-settings.controller'
import { BusinessPosTableSettingsService } from './table-settings/pos-table-settings.service'

// SECTION 02 : MODULE

@Module({
  imports: [
    PosOrdersModule,
    PosOrderTypesModule,
    CookingModule
  ],
  controllers: [
    PosCategoriesController,
    PosMenuController,
    PosOrderDashboardController,
    PosRoomsController,
    BusinessPosTableSettingsController
  ],
  providers: [
    PosCategoriesService,
    PosMenuService,
    PosOrderDashboardService,
    PosRoomsService,
    BusinessPosTableSettingsService
  ],
  exports: [
    PosCategoriesService,
    PosMenuService,
    PosOrderDashboardService,
    PosRoomsService,
    BusinessPosTableSettingsService,
    PosOrdersModule,
    PosOrderTypesModule,
    CookingModule
  ]
})
export class PosModule {}
