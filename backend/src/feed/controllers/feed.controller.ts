'use strict'

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common'

import { FilesInterceptor } from '@nestjs/platform-express'
import { FeedService } from '../services/feed.service'
import { AuthGuard } from '@nestjs/passport'
import { JwtOptionalAuthGuard } from '../../modules/auth/jwt-optional.guard'

import * as fs from 'fs'
import * as path from 'path'
import { extname } from 'path'
import { randomUUID, createHash } from 'crypto'

import db from '../../config/database'

/* =========================================
UPLOAD ROOT
========================================= */

const uploadRoot = path.join(process.cwd(),'uploads')
const tmpUploadPath = path.join(uploadRoot,'tmp')

if(!fs.existsSync(uploadRoot))
  fs.mkdirSync(uploadRoot,{recursive:true})

if(!fs.existsSync(tmpUploadPath))
  fs.mkdirSync(tmpUploadPath,{recursive:true})

/* =========================================
UPLOAD RATE LIMIT
========================================= */

const UPLOAD_LIMIT = 10
const WINDOW = 60*1000

const uploadRequests =
  new Map<string,number[]>()

function checkUploadRateLimit(ip:string){

  const now = Date.now()

  const timestamps =
    uploadRequests.get(ip) || []

  const filtered =
    timestamps.filter(
      t=>now-t<WINDOW
    )

  if(filtered.length>=UPLOAD_LIMIT)
    throw new BadRequestException(
      'Upload rate limit exceeded'
    )

  filtered.push(now)

  uploadRequests.set(ip,filtered)

}

/* =========================================
MULTER STORAGE
========================================= */

const multerConfig = {

  storage:{

    _handleFile(req,file,cb){

      const filename =
        randomUUID()+
        extname(file.originalname)

      const filepath =
        path.join(tmpUploadPath,filename)

      file.stream
        .pipe(fs.createWriteStream(filepath))
        .on('finish',()=>{

          cb(null,{
            path:filepath,
            filename
          })

        })

    },

    _removeFile(req,file,cb){

      fs.unlink(file.path,cb)

    }

  },

  limits:{
    fileSize:5*1024*1024
  }

}

/* =========================================
HASH
========================================= */

function createFileHash(filePath:string){

  const buffer =
    fs.readFileSync(filePath)

  return createHash('sha256')
    .update(buffer)
    .digest('hex')

}

/* =========================================
ASSET PATH (DB 정책 정합)
========================================= */

function buildPostImagePath(
  postId:number,
  filename:string
){

  const dir =
    path.join(uploadRoot,'posts',String(postId))

  if(!fs.existsSync(dir))
    fs.mkdirSync(dir,{recursive:true})

  const absPath =
    path.join(dir,filename)

  const publicPath =
    `/uploads/posts/${postId}/${filename}`

  return {
    absPath,
    publicPath
  }

}

/* =========================================
IMAGE ASSET UPSERT
========================================= */

function getOrCreateImageAsset(
  hash:string,
  tmpPath:string,
  postId:number
){

  const existing =
    db.prepare(`
      SELECT id,filePath
      FROM image_assets
      WHERE hash=?
    `).get(hash) as any

  const ext =
    extname(tmpPath)

  const filename =
    `${hash}${ext}`

  const {absPath,publicPath} =
    buildPostImagePath(
      postId,
      filename
    )

  if(existing){

    fs.unlinkSync(tmpPath)

    return existing.id

  }

  fs.renameSync(tmpPath,absPath)

  const size =
    fs.statSync(absPath).size

  const result =
    db.prepare(`
      INSERT INTO image_assets
      (hash,filePath,size)
      VALUES (?,?,?)
    `).run(
      hash,
      publicPath,
      size
    )

  return Number(result.lastInsertRowid)

}

/* =========================================
CONTROLLER
========================================= */

@Controller('feed')
export class FeedController{

  constructor(
    private readonly feedService:FeedService
  ){}

  /* =========================================
  PUBLIC FEED
  ========================================= */

  @UseGuards(JwtOptionalAuthGuard)
  @Get()
  async getFeed(

    @Query('regionId') regionId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string

  ){

    const parsedRegionId =
      regionId ? Number(regionId) : null

    if(regionId && Number.isNaN(parsedRegionId))
      throw new BadRequestException(
        'Invalid regionId'
      )

    const parsedLimit =
      limit ? Number(limit) : 20

    return this.feedService.getPublicFeed(
      parsedRegionId,
      cursor || null,
      parsedLimit
    )

  }

  /* =========================================
  CREATE POST
  ========================================= */

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UseInterceptors(
    FilesInterceptor(
      'images',
      5,
      multerConfig
    )
  )
  async createPost(

    @UploadedFiles()
    files:Express.Multer.File[],

    @Body()
    body:any,

    @Request()
    req

  ){

    if(!req.user?.profileId)
      throw new UnauthorizedException(
        'Login required'
      )

    let ip =
      req.ip || 'unknown'

    const forwarded =
      req.headers['x-forwarded-for']

    if(typeof forwarded==='string')
      ip = forwarded

    checkUploadRateLimit(ip)

    const result =
      await this.feedService.createPost(
        req.user.profileId,
        body
      )

    const postId =
      result.postId

    if(!postId)
      return result

    if(files?.length){

      files.forEach(
        (file,idx)=>{

          const hash =
            createFileHash(file.path)

          const imageAssetId =
            getOrCreateImageAsset(
              hash,
              file.path,
              postId
            )

          db.prepare(`
            INSERT INTO post_images
            (postId,imageAssetId,sortOrder)
            VALUES (?,?,?)
          `).run(
            postId,
            imageAssetId,
            idx
          )

        }
      )

    }

    return result

  }

  /* =========================================
  DELETE POST
  ========================================= */

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async deletePost(

    @Param('id')
    id:string,

    @Request()
    req

  ){

    if(!req.user?.profileId)
      throw new UnauthorizedException(
        'Login required'
      )

    const postId =
      Number(id)

    if(Number.isNaN(postId))
      throw new BadRequestException(
        'Invalid post id'
      )

    return this.feedService.deletePost(
      req.user.profileId,
      postId
    )

  }

}