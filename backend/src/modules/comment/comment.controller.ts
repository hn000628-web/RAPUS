import {
Controller,
Post,
Get,
Delete,
Body,
Param,
Query,
Req,
UseGuards,
BadRequestException
} from '@nestjs/common';

import { JwtAuthGuard }
from '../auth/jwt.guard';

import { CommentService }
from './comment.service';

@Controller('comments')
export class CommentController {

constructor(

private readonly commentService:CommentService

){}

/* ==================================================
SECTION 01 : CREATE COMMENT
DOMAIN : COMMENT API
ROLE : 댓글 생성
================================================== */

@Post()
@UseGuards(JwtAuthGuard)
async createComment(

@Body() body:any,

@Req() req:any

){

const profileId =
req.user?.profileId;

if(!profileId){

throw new BadRequestException(
'profileId missing'
);

}

if(!body.postId){

throw new BadRequestException(
'postId required'
);

}

if(!body.content){

throw new BadRequestException(
'content required'
);

}

return this.commentService.createComment(

Number(body.postId),

profileId,

body.content,

body.parentId
? Number(body.parentId)
: null

);

}

/* ==================================================
SECTION 02 : GET COMMENTS
DOMAIN : COMMENT API
ROLE : 댓글 리스트 조회
================================================== */

@Get()
async getComments(

@Query('postId')
postIdRaw:string

){

if(!postIdRaw){

throw new BadRequestException(
'postId required'
);

}

const postId =
Number(postIdRaw);

if(Number.isNaN(postId)){

throw new BadRequestException(
'invalid postId'
);

}

return this.commentService.getComments(
postId
);

}

/* ==================================================
SECTION 03 : GET COMMENT TREE
DOMAIN : COMMENT API
ROLE : 댓글 트리 조회
================================================== */

@Get('tree')
async getCommentTree(

@Query('postId')
postIdRaw:string

){

if(!postIdRaw){

throw new BadRequestException(
'postId required'
);

}

const postId =
Number(postIdRaw);

if(Number.isNaN(postId)){

throw new BadRequestException(
'invalid postId'
);

}

return this.commentService.getCommentTree(
postId
);

}

/* ==================================================
SECTION 04 : DELETE COMMENT
DOMAIN : COMMENT API
ROLE : 댓글 삭제
================================================== */

@Delete(':id')
@UseGuards(JwtAuthGuard)
async deleteComment(

@Param('id')
idRaw:string,

@Req()
req:any

){

const profileId =
req.user?.profileId;

if(!profileId){

throw new BadRequestException(
'profileId missing'
);

}

const commentId =
Number(idRaw);

if(Number.isNaN(commentId)){

throw new BadRequestException(
'invalid id'
);

}

return this.commentService.deleteComment(

commentId,

profileId

);

}

}