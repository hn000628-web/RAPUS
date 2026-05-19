//FILE: src/feed/services/feed.service.ts

'use strict';

import {
Injectable,
NotFoundException,
BadRequestException,
ForbiddenException
} from '@nestjs/common';

import db from '../../config/database';

@Injectable()
export class FeedService {

/* ==================================================
SECTION 01 : CONSTANTS
================================================== */

private readonly ALLOWED_STATUS=[
'DRAFT',
'ACTIVE',
'EXPIRED'
];

/* ==================================================
SECTION 02 : SQL HELPERS
================================================== */

private thumbnailSQL(
alias:string='p'
){
return `(
SELECT ia.filePath
FROM post_images pi
JOIN image_assets ia
ON ia.id = pi.imageAssetId
WHERE pi.postId = ${alias}.id
ORDER BY pi.sortOrder ASC
LIMIT 1
)`;
}

/* ==================================================
SECTION 03 : EXPIRE AD POSTS
================================================== */

private expireAdPosts(){

// 안전 체크: feed_rank_cache 테이블과 expiresAt 컬럼 존재 확인
const tableExists=db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='feed_rank_cache'`).get();
if(!tableExists) return;

const columnExists=db.prepare(`PRAGMA table_info(feed_rank_cache);`).all().some(c=>c.name==='expiresAt');
if(!columnExists){
  db.prepare(`ALTER TABLE feed_rank_cache ADD COLUMN expiresAt TEXT`).run();
}

const now=new Date().toISOString();

db.prepare(`
UPDATE feed_rank_cache
SET score=score
WHERE expiresAt IS NOT NULL AND expiresAt < ?
`).run(now);

}

/* ==================================================
SECTION 04 : PUBLIC FEED
================================================== */

async getPublicFeed(
regionId?:number|null,
cursor?:string|null,
limit:number=20
){

this.expireAdPosts();

const safeLimit=
Number.isFinite(limit) &&
limit>0 &&
limit<=50
? Math.floor(limit)
:20;

const params:any[]=[];

let cursorCondition='';

if(cursor){
cursorCondition=`AND p.createdAt < ?`;
params.push(cursor);
}

if(regionId){
if(!Number.isInteger(regionId)){
throw new BadRequestException('Invalid regionId');
}
params.push(regionId);
}

params.push(safeLimit);

const posts=
db.prepare(`
SELECT
p.*,
c.code as category,
r.fullName as regionName,
pr.displayName,
${this.thumbnailSQL()} as imageUrl,
COALESCE(pe.likeCount,0) as likeCount,
COALESCE(pe.saveCount,0) as saveCount,
COALESCE(pe.viewCount,0) as viewCount,
COALESCE(pe.commentCount,0) as commentCount
FROM posts p
JOIN profiles pr
ON p.profileId = pr.id
JOIN categories c
ON p.categoryId = c.id
LEFT JOIN regions r
ON p.regionId = r.id
LEFT JOIN post_engagements pe
ON pe.postId = p.id
WHERE p.status='ACTIVE'
${cursorCondition}
${regionId ? 'AND p.regionId=?' : ''}
ORDER BY p.createdAt DESC
LIMIT ?
`).all(...params);

const nextCursor=
posts.length>0
? posts[posts.length-1].createdAt
:null;

return{
ok:true,
posts,
nextCursor
};

}

/* ==================================================
SECTION 05 : MY POSTS
================================================== */

async getMyPosts(
profileId:number
){
const posts=
db.prepare(`
SELECT
p.*,
c.code as category,
r.fullName as regionName,
${this.thumbnailSQL()} as imageUrl,
COALESCE(pe.likeCount,0) as likeCount,
COALESCE(pe.saveCount,0) as saveCount,
COALESCE(pe.viewCount,0) as viewCount,
COALESCE(pe.commentCount,0) as commentCount
FROM posts p
JOIN categories c
ON p.categoryId = c.id
LEFT JOIN regions r
ON p.regionId = r.id
LEFT JOIN post_engagements pe
ON pe.postId = p.id
WHERE p.profileId=?
ORDER BY p.createdAt DESC
`).all(profileId);

return{
ok:true,
posts
};

}

/* ==================================================
SECTION 06 : POST DETAILS
================================================== */

async getPostDetails(
postId:number,
requesterProfileId?:number
){

const post=
db.prepare(`
SELECT
p.*,
c.code as category,
r.fullName as regionName,
pr.displayName,
COALESCE(pe.likeCount,0) as likeCount,
COALESCE(pe.saveCount,0) as saveCount,
COALESCE(pe.viewCount,0) as viewCount,
COALESCE(pe.commentCount,0) as commentCount
FROM posts p
JOIN profiles pr
ON p.profileId = pr.id
JOIN categories c
ON p.categoryId = c.id
LEFT JOIN regions r
ON p.regionId = r.id
LEFT JOIN post_engagements pe
ON pe.postId = p.id
WHERE p.id=?
`).get(postId);

if(!post){
throw new NotFoundException('Post not found');
}

if(post.status==='DRAFT' && requesterProfileId!==post.profileId){
throw new ForbiddenException('Post not accessible');
}

const images=db.prepare(`
SELECT
pi.id,
ia.filePath as imageUrl,
pi.sortOrder
FROM post_images pi
JOIN image_assets ia
ON ia.id = pi.imageAssetId
WHERE pi.postId=?
ORDER BY pi.sortOrder ASC
`).all(postId);

return{
ok:true,
post:{
...post,
images
}
};

}

/* ==================================================
SECTION 07 : CREATE POST
================================================== */

async createPost(
profileId:number,
body:any
){

if(!body.categoryId) throw new BadRequestException('categoryId required');
if(!body.content) throw new BadRequestException('content required');
if(typeof body.content !== 'string') throw new BadRequestException('content invalid');
if(body.content.length > 5000) throw new BadRequestException('content too long');

const allowedTypes=['GENERAL','NOTICE','EVENT','MENU','JOB','RESERVE','AD'];
if(body.type && !allowedTypes.includes(body.type)) throw new BadRequestException('Invalid post type');
if(body.status && !this.ALLOWED_STATUS.includes(body.status)) throw new BadRequestException('Invalid status');

const category=db.prepare(`SELECT id FROM categories WHERE id=?`).get(body.categoryId);
if(!category) throw new BadRequestException('Invalid category');

let regionId=null;
if(body.regionId){
const region=db.prepare(`SELECT id FROM regions WHERE id=?`).get(body.regionId);
if(!region) throw new BadRequestException('Invalid region');
regionId=body.regionId;
}

const result=db.prepare(`
INSERT INTO posts
(profileId,categoryId,regionId,content,status,type)
VALUES (?,?,?,?,?,?)
`).run(profileId,body.categoryId,regionId,body.content,body.status ?? 'DRAFT',body.type ?? 'GENERAL');

const postId=Number(result.lastInsertRowid);

db.prepare(`INSERT INTO post_engagements (postId) VALUES (?)`).run(postId);

return{ok:true,postId};

}

/* ==================================================
SECTION 08 : DELETE POST
================================================== */

async deletePost(
profileId:number,
postId:number
){

const post=db.prepare(`SELECT id,profileId FROM posts WHERE id=?`).get(postId);
if(!post) throw new NotFoundException('Post not found');
if(post.profileId!==profileId) throw new ForbiddenException('No permission');

db.prepare(`UPDATE posts SET status='EXPIRED' WHERE id=?`).run(postId);

return{ok:true};

}

}