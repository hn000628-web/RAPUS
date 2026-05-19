import { Module } from '@nestjs/common';

import { CommentController }
from './comment.controller';

import { CommentService }
from './comment.service';

/* ==================================================
SECTION 01 : COMMENT MODULE
DOMAIN : COMMENT CORE
ROLE : 댓글 도메인 구성
================================================== */

@Module({

controllers:[
CommentController
],

providers:[
CommentService
],

exports:[
CommentService
]

})

export class CommentModule {}