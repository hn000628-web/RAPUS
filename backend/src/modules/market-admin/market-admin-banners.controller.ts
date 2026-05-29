import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { MarketAdminBannersService } from './market-admin-banners.service';

@Controller('market-admin/banners')
export class MarketAdminBannersController {
  constructor(
    private readonly marketAdminBannersService: MarketAdminBannersService,
  ) {}

  @Get('hero')
  getHeroBanner(
    @Query('channelCode') channelCode?: string,
  ) {
    return this.marketAdminBannersService.getHeroBanner(channelCode);
  }

  @Get('hero/manage')
  getHeroBannerManageList(
    @Query('channelCode') channelCode?: string,
  ) {
    return this.marketAdminBannersService.getHeroBannerManageList(channelCode);
  }

  @Get('brand-text')
  getBrandAdText(
    @Query('channelCode') channelCode?: string,
  ) {
    return this.marketAdminBannersService.getBrandAdText(channelCode);
  }

  @Post('hero')
  @UseInterceptors(FileInterceptor('file'))
  uploadHeroBanner(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('channelCode') channelCode?: string,
    @Body('title') title?: string,
    @Body('description') description?: string,
    @Body('linkUrl') linkUrl?: string,
    @Body('sortOrder') sortOrder?: string,
  ) {
    return this.marketAdminBannersService.uploadHeroBanner({
      file,
      channelCode,
      title,
      description,
      linkUrl,
      sortOrder,
    });
  }

  @Post('hero/select')
  updateHeroBannerSelection(
    @Body() body: {
      channelCode?: string;
      bannerId?: number | string;
      sortOrder?: number | string;
      isVisible?: boolean;
    },
  ) {
    return this.marketAdminBannersService.updateHeroBannerSelection(body);
  }

  @Post('hero/reorder')
  reorderHeroBanners(
    @Body() body: {
      channelCode?: string;
      items?: Array<{
        bannerId?: number | string;
        sortOrder?: number | string;
      }>;
    },
  ) {
    return this.marketAdminBannersService.reorderHeroBanners(body);
  }

  @Post('hero/text')
  updateHeroBannerText(
    @Body() body: {
      channelCode?: string;
      bannerId?: number | string;
      title?: string;
      description?: string;
    },
  ) {
    return this.marketAdminBannersService.updateHeroBannerText(body);
  }

  @Post('hero/link-url')
  updateHeroBannerLinkUrl(
    @Body() body: {
      channelCode?: string;
      bannerId?: number | string;
      linkUrl?: string | null;
    },
  ) {
    return this.marketAdminBannersService.updateHeroBannerLinkUrl(body);
  }

  @Post('hero/hide')
  hideHeroBanner(
    @Body() body: {
      channelCode?: string;
      bannerId?: number | string;
    },
  ) {
    return this.marketAdminBannersService.setHeroBannerVisibility({
      ...body,
      isVisible: false,
    });
  }

  @Post('hero/delete')
  deleteHeroBanner(
    @Body() body: {
      channelCode?: string;
      bannerId?: number | string;
    },
  ) {
    return this.marketAdminBannersService.deleteHeroBanner(body);
  }

  @Post('brand-text')
  updateBrandAdText(
    @Body() body: {
      channelCode?: string;
      brandAdTitle?: string;
      brandAdDescription?: string;
    },
  ) {
    return this.marketAdminBannersService.updateBrandAdText(body);
  }

  @Get('brand-logos')
  getBrandAdLogos(
    @Query('channelCode') channelCode?: string,
  ) {
    return this.marketAdminBannersService.getBrandAdLogos(channelCode);
  }

  @Get('brand-logos/manage')
  getBrandAdLogosManage(
    @Query('channelCode') channelCode?: string,
  ) {
    return this.marketAdminBannersService.getBrandAdLogosManage(channelCode);
  }

  @Post('brand-logos')
  @UseInterceptors(FileInterceptor('file'))
  uploadBrandAdLogo(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('channelCode') channelCode?: string,
    @Body('sortOrder') sortOrder?: string,
  ) {
    return this.marketAdminBannersService.uploadBrandAdLogo({
      file,
      channelCode,
      sortOrder,
    });
  }

  @Post('brand-logos/select')
  updateBrandAdLogoSelection(
    @Body() body: {
      channelCode?: string;
      logoId?: number | string;
      sortOrder?: number | string;
      isVisible?: boolean;
    },
  ) {
    return this.marketAdminBannersService.updateBrandAdLogoSelection(body);
  }

  @Post('brand-logos/reorder')
  reorderBrandAdLogos(
    @Body() body: {
      channelCode?: string;
      items?: Array<{
        logoId?: number | string;
        sortOrder?: number | string;
      }>;
    },
  ) {
    return this.marketAdminBannersService.reorderBrandAdLogos(body);
  }

  @Post('brand-logos/hide')
  hideBrandAdLogo(
    @Body() body: {
      channelCode?: string;
      logoId?: number | string;
    },
  ) {
    return this.marketAdminBannersService.hideBrandAdLogo(body);
  }

  @Post('brand-logos/delete')
  deleteBrandAdLogo(
    @Body() body: {
      channelCode?: string;
      logoId?: number | string;
    },
  ) {
    return this.marketAdminBannersService.deleteBrandAdLogo(body);
  }
}
