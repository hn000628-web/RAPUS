/* ==================================================
FILE : backend/src/modules/admin/users/users.controller.ts
SECTION CODE OUTPUT : USERS CONTROLLER FULL
ROOT : backend/src/modules/admin/users/users.controller.ts
STATUS : PROFILE BASE CONTROLLER SAFE
================================================== */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  UsersService,
  AdminUserRow,
  UploadResult
} from './users.service'

/* ==================================================
SECTION 01 : CONTROLLER
================================================== */
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /* ==================================================
  SECTION 02 : GET ALL PROFILES
  =================================================== */
  @Get()
  async getAllUsers(): Promise<AdminUserRow[]> {
    return this.usersService.getAllUsers()
  }

  /* ==================================================
  SECTION 03 : ADD USER
  =================================================== */
  @Post()
  async addUser(
    @Body() body: {
      email: string
      displayName: string
      accountType?: string
      type?: string
    }
  ): Promise<AdminUserRow> {
    if (!body.email) throw new BadRequestException('email required')
    if (!body.displayName) throw new BadRequestException('displayName required')
    return this.usersService.addUser(body)
  }

  /* ==================================================
  SECTION 04 : TOGGLE STATUS
  =================================================== */
  @Patch(':userId')
  async toggleStatus(
    @Param('userId') userIdParam: string,
    @Body() body: { status: 'ACTIVE' | 'INACTIVE' }
  ): Promise<void> {
    const userId = Number(userIdParam)
    if (isNaN(userId)) throw new BadRequestException('invalid id')
    return this.usersService.toggleStatus(userId, body.status)
  }

  /* ==================================================
  SECTION 05 : DELETE USER
  =================================================== */
  @Delete(':userId')
  async deleteUser(@Param('userId') userIdParam: string): Promise<void> {
    const userId = Number(userIdParam)
    if (isNaN(userId)) throw new BadRequestException('invalid id')
    return this.usersService.deleteUser(userId)
  }

  /* ==================================================
  SECTION 06 : CSV UPLOAD
  =================================================== */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCSV(
    @UploadedFile() file: Express.Multer.File
  ): Promise<UploadResult> {
    if (!file) throw new BadRequestException('file required')
    return this.usersService.uploadCSV(file)
  }

  /* ==================================================
  SECTION 07 : CREATE TEST ACCOUNT
  =================================================== */
  @Post('create-test')
  async createTestAccount(): Promise<{ success: boolean }> {
    await this.usersService.createTestAccount()
    return { success: true }
  }
}
/* ==================================================
SECTION END
================================================== */
