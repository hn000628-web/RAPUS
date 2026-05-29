import { Module } from '@nestjs/common'
import { AuthModule } from '../../auth/auth.module'
import { BusinessSecurityController } from './business-security.controller'
import { BusinessSecurityService } from './business-security.service'

@Module({
  imports: [AuthModule],
  controllers: [BusinessSecurityController],
  providers: [BusinessSecurityService]
})
export class BusinessSecurityModule {}
