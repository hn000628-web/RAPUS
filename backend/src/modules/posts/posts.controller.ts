// FILE : backend/src/modules/posts/posts.controller.ts
// ROOT : backend/src/modules/posts/posts.controller.ts
// STATUS : MODIFY FINAL (CHANNEL CONTEXT FIX + TS ERROR FIX)
// ROLE : POSTS CONTROLLER

// SECTION 01 : IMPORT

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Req,
  UseGuards,
  UnauthorizedException
} from '@nestjs/common'

import { Request } from 'express'

import { JwtAuthGuard } from '../auth/jwt.guard'
import { PostsService } from './posts.service'
import { CreatePostDto } from './create-post.dto'

// SECTION 02 : TYPE

type AuthenticatedRequestUser = {
  sub?: number
  pid?: number
  ptype?: 'GENERAL' | 'BUSINESS'
  profileId?: number
  profileType?: 'GENERAL' | 'BUSINESS'

  /* 🔥 TS 에러 해결 핵심 */
  channelCode?: string
}

type AuthenticatedRequest = Request & {
  user?: AuthenticatedRequestUser
}

// SECTION 03 : CONTROLLER

@Controller('posts')
export class PostsController {

  constructor(
    private readonly postsService: PostsService
  ) {}

  // SECTION 04 : CREATE

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePostDto
  ) {

    if(!req.user){
      throw new UnauthorizedException()
    }

    return this.postsService.createPost(
      req.user,
      dto
    )
  }

  // SECTION 05 : GET MY POSTS

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyPosts(
    @Req() req: AuthenticatedRequest
  ) {

    if(!req.user){
      throw new UnauthorizedException()
    }

    return this.postsService.getMyPosts(
      req.user
    )
  }

  // SECTION 06 : GET POST DETAIL

  @Get(':id')
  async getPostDetail(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {

    return this.postsService.getPostDetail(
      Number(id),
      req.user
    )
  }

  // SECTION 07 : UPDATE POST (CHANNEL CONTEXT FIX)

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updatePost(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: any
  ) {

    /* =========================
    AUTH VALIDATION
    ========================= */

    if(!req.user){
      throw new UnauthorizedException()
    }

    /* =========================
    CHANNEL CONTEXT (핵심)
    ========================= */

    const { channelCode } = req.user

    if(!channelCode){
      throw new UnauthorizedException('CHANNEL_REQUIRED')
    }

    /* =========================
    SERVICE CALL
    ========================= */

    return this.postsService.updatePost(
      Number(id),
      channelCode,
      body
    )
  }

// SECTION 08 : DELETE POST

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {

    if(!req.user){
      throw new UnauthorizedException()
    }

    const { channelCode } = req.user

    if(!channelCode){
      throw new UnauthorizedException('CHANNEL_REQUIRED')
    }

    return this.postsService.deletePost(
      Number(id),
      channelCode
    )
  }

//=======================================
}