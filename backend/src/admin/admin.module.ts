/* ==================================================
SECTION CODE OUTPUT : ADMIN MODULE
FILE : backend/src/admin/admin.module.ts
STATUS : DOMAIN SAFE / MEDIA ADMIN ENABLED
ROLE : ADMIN DOMAIN ROOT
FIX :
AdminMediaService DI FIX
================================================== */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

/* CONTROLLER */

import { AdminController } from './admin.controller';

import { DevLoginController } from './dev-login/dev-login.controller';

import { AdminMediaController } from './media/admin-media.controller';

/* SERVICE */

import { AdminService } from './admin.service';

import { DevLoginService } from './dev-login/dev-login.service';

import { AdminMediaService } from './media/admin-media.service'; // ★ 추가

/* DOMAIN MODULES */

import { UsersModule } from './users/users.module';

import { RegionsModule } from './regions/regions.module';

import { CategoriesModule } from './categories/categories.module';

import { IndustriesModule } from './industries/industries.module';

import { IndustrySubtypesModule } from './industry-subtypes/industry-subtypes.module';

import { MediaModule } from '../modules/media/media.module';

import { MasterBarcodesModule } from './master-barcodes/master-barcodes.module';

import { MasterProductsModule } from './master-products/master-products.module';

import { AdminBarcodesModule } from '../modules/admin/barcodes/barcodes.module';

/* ==================================================
SECTION 01 : ADMIN MODULE
ROLE : ADMIN DOMAIN ROOT
================================================== */

@Module({
  imports: [
    JwtModule.register({
      secret: 'dev-secret',

      signOptions: {
        expiresIn: '7d',
      },
    }),

    UsersModule,

    RegionsModule,

    CategoriesModule,

    IndustriesModule,

    IndustrySubtypesModule,

    MediaModule, // MediaService DI source

    MasterBarcodesModule,

    MasterProductsModule,

    AdminBarcodesModule,
  ],

  controllers: [AdminController, DevLoginController, AdminMediaController],

  providers: [
    AdminService,

    DevLoginService,

    AdminMediaService, // ★ 필수 (DI 해결)
  ],

  exports: [
    UsersModule,

    RegionsModule,

    CategoriesModule,

    IndustriesModule,

    IndustrySubtypesModule,

    MediaModule,

    MasterBarcodesModule,

    MasterProductsModule,

    AdminBarcodesModule,
  ],
})
export class AdminModule {}

/* ==================================================
SECTION END
================================================== */
