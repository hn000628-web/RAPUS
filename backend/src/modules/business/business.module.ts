// FILE : backend/src/modules/business/business.module.ts
// ROOT : backend/src/modules/business/business.module.ts
// STATUS : MODIFY MODE
// ROLE : BUSINESS MODULE (FULL DOMAIN)
// CHANGE SUMMARY :
// - ProfilePlaceThumbnailModule import 異붽?
// - BUSINESS ?쇰뱶/?뚮젅?댁뒪 ?몃꽕???꾩슜 紐⑤뱢 ?깅줉
// - /api/business/place-thumbnail ?쇱슦???곌껐
// - 湲곗〈 BUSINESS ?꾨찓??紐⑤뱢 援ъ“ ?좎?

// ==================================================
// SECTION 01 : IMPORT
// ==================================================

import { Module } from '@nestjs/common'

// MENU
import { MenuController, MenuConfigController } from './menu/menu.controller'
import { MenuService } from './menu/menu.service'

// BUSINESS PROFILE
import { BusinessProfileController } from './business-profile.controller'
import { BusinessProfileService } from './business-profile.service'

// BUSINESS HOURS
import { BusinessHoursController } from './hours/business-hours.controller'
import { BusinessHoursService } from './hours/business-hours.service'

// BUSINESS MEDIA
import { BusinessMediaModule } from './media/business-media.module'

// BUSINESS POSTS
import { BusinessPostsModule } from './posts/business-posts.module'

// BUSINESS PROFILE SETTINGS
import { ProfileSettingsModule } from './profile-settings/profile-settings.module'

// BUSINESS SECURITY
import { BusinessSecurityModule } from './security/business-security.module'

// BUSINESS PROFILE AVATAR
import { ProfileAvatarModule } from './avatar/profile-avatar.module'

// BUSINESS PROFILE HERO
import { ProfileHeroModule } from './hero/profile-hero.module'

// BUSINESS PLACE THUMBNAIL
import { ProfilePlaceThumbnailModule } from './place-thumbnail/place-thumbnail.module'

// BUSINESS INFO
import { BusinessInfoModule } from './info/business-info.module'

// BUSINESS GALLERY
import { BusinessGalleryModule } from './gallery/business-gallery.module'

// BUSINESS INDUSTRY
import { BusinessIndustryModule } from './industry/business-industry.module'

// BUSINESS CONTACT
import { BusinessContactModule } from './contact/business-contact.module'

// BUSINESS CATEGORY (硫붾돱諛??꾩슜 API)
import { BusinessCategoryModule } from './category/business-category.module'

// BUSINESS SUMMARY
import { BusinessSummaryModule } from './summary/profile-summary.module'

// BUSINESS POS
import { PosModule } from './pos/pos.module'

// COMMON UTIL
import { ChannelProfileUtilModule } from '../../utils/channel-profile-util.module'

// ==================================================
// SECTION 02 : MODULE DEFINITION
// ==================================================

@Module({
  imports: [
    ChannelProfileUtilModule,

    // MEDIA
    BusinessMediaModule,

    // POSTS
    BusinessPostsModule,

    // SETTINGS
    ProfileSettingsModule,
    BusinessSecurityModule,
    ProfileAvatarModule,
    ProfileHeroModule,
    ProfilePlaceThumbnailModule,

    // INFO DOMAIN
    BusinessInfoModule,
    BusinessGalleryModule,
    BusinessIndustryModule,
    BusinessContactModule,

    // CATEGORY
    BusinessCategoryModule,

    // SUMMARY
    BusinessSummaryModule,

    // POS
    PosModule
  ],

  controllers: [
    BusinessProfileController,
    MenuController,
    MenuConfigController,
    BusinessHoursController
  ],

  providers: [
    BusinessProfileService,
    MenuService,
    BusinessHoursService
  ],

  exports: [
    MenuService,
    BusinessProfileService,
    BusinessHoursService,

    // MODULE EXPORTS
    BusinessMediaModule,
    BusinessPostsModule,
    ProfileSettingsModule,
    BusinessSecurityModule,
    ProfileAvatarModule,
    ProfileHeroModule,
    ProfilePlaceThumbnailModule,
    BusinessInfoModule,
    BusinessGalleryModule,
    BusinessIndustryModule,
    BusinessContactModule,
    BusinessCategoryModule,

    // SUMMARY EXPORT
    BusinessSummaryModule,

    // POS EXPORT
    PosModule
  ]
})
export class BusinessModule {}

// ==================================================
// SECTION 03 : VALIDATION
// ==================================================

/*
VALIDATION:
- ?⑥씪 ?뚯씪 ?듭퐫??異쒕젰
- ProfilePlaceThumbnailModule import 異붽?
- BusinessModule imports 諛곗뿴??ProfilePlaceThumbnailModule ?깅줉
- BusinessModule exports 諛곗뿴??ProfilePlaceThumbnailModule ?깅줉
- Controller / Service 吏곸젒 ?깅줉 ?놁쓬
- 湲곗〈 BusinessProfileController ?좎?
- 湲곗〈 MenuController ?좎?
- 湲곗〈 BusinessHoursController ?좎?
- 湲곗〈 providers ?좎?
- 湲곗〈 BUSINESS ?꾨찓??紐⑤뱢 援ъ“ ?좎?
- DB 吏곸젒 ?묎렐 ?놁쓬
- 諛깆뿏??schema 蹂寃??놁쓬
*/
