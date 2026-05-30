// SECTION 01 : IMPORT
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// SECTION 02 : DATABASE
import { DatabaseModule } from './config/database.module';

// SECTION 03 : CORE MODULES
import { AuthModule } from './modules/auth/auth.module';
import { AccountModule } from './modules/account/account.module';
import { MediaModule } from './modules/media/media.module';
import { UploadModule } from './modules/upload/upload.module';

// SECTION 04 : FEATURE MODULES
import { FeedModule } from './modules/feed/feed.module';
import { AdminModule } from './admin/admin.module';
import { PostsModule } from './modules/posts/posts.module';
import { EngagementModule } from './modules/engagement/engagement.module';
import { CommentModule } from './modules/comment/comment.module';

// SECTION 05 : PROFILE DOMAIN
import { ProfilesModule } from './modules/profiles/profiles.module';
import { RegionsModule } from './modules/regions/regions.module';

// SECTION 06 : CHANNEL DOMAIN
import { ChannelModule } from './modules/channel/channel.module';

// SECTION 07 : BUSINESS DOMAIN
import { BusinessModule } from './modules/business/business.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { CartModule } from './modules/cart/cart.module';
import { MarketAdminModule } from './modules/market-admin/market-admin.module';
import { MarketEventsModule } from './modules/market-events/market-events.module';
import { MasterProductCategoriesModule } from './modules/master-product-categories/master-product-categories.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { GoodsReceiptsModule } from './modules/goods-receipts/goods-receipts.module';
import { AiHanjaSearchApi } from './modules/ai/hanja/ai-hanja-search.api'
import { AiHanjaSearchService } from './modules/ai/hanja/ai-hanja-search.service'

// SECTION 08 : AUTH GUARD
import { JwtAuthGuard } from './modules/auth/jwt.guard';

// SECTION 09 : SYSTEM TASKS
import { SystemCleanerTask } from './tasks/system-cleaner.task';
import { ImageStorageMonitorTask } from './tasks/image-storage-monitor.task';
import { FeedCacheWarmerTask } from './tasks/feed-cache-warmer.task';

// SECTION 10 : COMMON UTIL MODULES
import { ChannelProfileUtilModule } from './utils/channel-profile-util.module';
import { ProfileSummaryModule } from './modules/shared/profile-summary.module';

// SECTION 11 : APP MODULE
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    DatabaseModule,

    AuthModule,
    AccountModule,
    MediaModule,
    UploadModule,

    FeedModule,
    PostsModule,
    EngagementModule,
    CommentModule,

    ProfilesModule,
    RegionsModule,

    ChannelModule,

    BusinessModule,
    FavoritesModule,
    CartModule,
    MarketAdminModule,
    MarketEventsModule,
    MasterProductCategoriesModule,
    WalletsModule,
    GoodsReceiptsModule,

    AdminModule,

    ChannelProfileUtilModule,
    ProfileSummaryModule
  ],

  controllers: [
    AppController,
    AiHanjaSearchApi,
  ],

  providers: [
    AppService,
    JwtAuthGuard,
    AiHanjaSearchService,

    SystemCleanerTask,
    ImageStorageMonitorTask,
    FeedCacheWarmerTask
  ],

  exports: [
    ChannelProfileUtilModule,
    ProfileSummaryModule
  ]
})
export class AppModule {}
