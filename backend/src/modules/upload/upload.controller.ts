import { Controller, Post, UseInterceptors, UploadedFile, Body, BadRequestException, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import db from '../../config/database';

@Controller('upload')
export class UploadController {
  @Post('post-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const tempPath = join(process.cwd(), 'uploads', 'tmp');
          fs.mkdirSync(tempPath, { recursive: true });
          callback(null, tempPath);
        },
        filename: (req, file, callback) => {
          const unique = Date.now();
          callback(null, `${unique}.tmp`);
        },
      }),
    }),
  )
  async uploadPostImage(@UploadedFile() file: Express.Multer.File, @Body('postId') postIdRaw: string) {
    if (!file) {
      throw new BadRequestException('파일 없음');
    }

    const postId = Number(postIdRaw);
    if (!postId || Number.isNaN(postId)) {
      throw new BadRequestException('postId 필요');
    }

    const row = db.prepare(`SELECT profileId FROM posts WHERE id = ?`).get(postId) as { profileId?: number } | undefined;

    if (!row?.profileId) {
      throw new NotFoundException('게시물이 존재하지 않습니다.');
    }

    const profileId = row.profileId;
    const finalDir = join(process.cwd(), 'uploads', 'accounts', String(profileId), 'posts', `post-${postId}`);

    // 해당 디렉토리가 없으면 생성
    fs.mkdirSync(finalDir, { recursive: true });

    // 이미지 순서 계산
    const next = db.prepare(`SELECT COALESCE(MAX(sortOrder), -1) + 1 AS nextSort FROM post_images WHERE postId = ?`).get(postId) as { nextSort: number };
    const sortOrder = next?.nextSort ?? 0;

    // 최종 파일 이름 설정
    const finalName = `${sortOrder}.webp`;
    const finalPath = join(finalDir, finalName);

    // 이미지 변환 및 저장
    await sharp(file.path)
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(finalPath);

    // 임시 파일 삭제
    fs.unlinkSync(file.path);

    // 이미지 URL 설정
    const imageUrl = `/uploads/accounts/${profileId}/posts/post-${postId}/${finalName}`;

    // DB에 이미지 정보 저장
    db.prepare(`
      INSERT INTO post_images (postId, imageUrl, sortOrder)
      VALUES (?, ?, ?)
    `).run(postId, imageUrl, sortOrder);

    return { ok: true, imageUrl, sortOrder };
  }
}