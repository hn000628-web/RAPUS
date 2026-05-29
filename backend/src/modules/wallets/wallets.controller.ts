import { Controller, Get, Post, UseGuards } from '@nestjs/common'

import { JwtAuthGuard } from '../auth/jwt.guard'
import { WalletsService } from './wallets.service'

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('system-test-asset/status')
  getSystemTestAssetStatus() {
    return this.walletsService.getSystemTestAssetStatus()
  }

  @Post('system-test-asset/grant')
  grantSystemTestAsset() {
    return this.walletsService.ensureSystemTestAssetGrantsForDefaultAccounts()
  }
}
