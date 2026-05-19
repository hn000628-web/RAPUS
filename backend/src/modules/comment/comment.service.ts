import {
Injectable,
NotFoundException,
BadRequestException,
ForbiddenException
} from '@nestjs/common';

import db from '../../config/database';

@Injectable()
export class CommentService {

/* ==================================================
SECTION 01 : VALIDATION
DOMAIN : COMMENT CORE
ROLE : 공통 검증
================================================== */

private validatePost(postId:number){

const post =
db.prepare(`
SELECT id
FROM posts
WHERE id=?
`).get(postId);

if(!post){

throw new NotFoundException(
'Post not found'
);

}

}

private validateProfile(
profileId:number
){

const profile =
db.prepare(`
SELECT id
FROM profiles
WHERE id=?
`).get(profileId);

if(!profile){

throw new NotFoundException(
'Profile not found'
);

}

}

private validateComment(
commentId:number
){

const comment =
db.prepare(`
SELECT *
FROM post_comments
WHERE id=?
`).get(commentId);

if(!comment){

throw new NotFoundException(
'Comment not found'
);

}

return comment;

}

/* ==================================================
SECTION 02 : CREATE COMMENT
DOMAIN : COMMENT CORE
ROLE : 댓글 생성
================================================== */

async createComment(

postId:number,

profileId:number,

content:string,

parentId?:number|null

){

if(!content?.trim()){

throw new BadRequestException(
'Empty comment'
);

}

this.validatePost(postId);

this.validateProfile(profileId);

if(parentId){

const parent =
this.validateComment(parentId);

if(parent.postId!==postId){

throw new BadRequestException(
'Invalid parent'
);

}

}

const tx =
db.transaction(()=>{

const result =
db.prepare(`
INSERT INTO post_comments
(
postId,
profileId,
parentId,
content
)
VALUES (?,?,?,?)
`).run(

postId,

profileId,

parentId ?? null,

content.trim()

);

/* ==========================
engagement commentCount
========================== */

db.prepare(`
INSERT OR IGNORE INTO post_engagements
(postId)
VALUES (?)
`).run(postId);

db.prepare(`
UPDATE post_engagements
SET commentCount =
commentCount +1
WHERE postId=?
`).run(postId);

/* ==========================
reply count
========================== */

if(parentId){

db.prepare(`
UPDATE post_comments
SET replyCount =
replyCount +1
WHERE id=?
`).run(parentId);

}

return Number(
result.lastInsertRowid
);

});

const commentId = tx();

return {

ok:true,

commentId

};

}

/* ==================================================
SECTION 03 : GET COMMENTS
DOMAIN : COMMENT CORE
ROLE : 댓글 조회
================================================== */

async getComments(

postId:number

){

this.validatePost(postId);

const comments =
db.prepare(`

SELECT

c.*,

p.displayName

FROM post_comments c

JOIN profiles p
ON c.profileId = p.id

WHERE
c.postId=?
AND c.status='ACTIVE'

ORDER BY c.createdAt ASC

`).all(postId);

return {

ok:true,

comments

};

}

/* ==================================================
SECTION 04 : DELETE COMMENT
DOMAIN : COMMENT CORE
ROLE : 댓글 삭제 (soft delete)
================================================== */

async deleteComment(

commentId:number,

profileId:number

){

const comment =
this.validateComment(commentId);

if(comment.profileId !== profileId){

throw new ForbiddenException(
'No permission'
);

}

const tx =
db.transaction(()=>{

db.prepare(`
UPDATE post_comments
SET
status='DELETED',
content='[deleted]'
WHERE id=?
`).run(commentId);

/* engagement */

db.prepare(`
UPDATE post_engagements
SET commentCount =
CASE
WHEN commentCount>0
THEN commentCount-1
ELSE 0
END
WHERE postId=?
`).run(comment.postId);

/* parent reply */

if(comment.parentId){

db.prepare(`
UPDATE post_comments
SET replyCount =
CASE
WHEN replyCount>0
THEN replyCount-1
ELSE 0
END
WHERE id=?
`).run(comment.parentId);

}

});

tx();

return {

ok:true

};

}

/* ==================================================
SECTION 05 : GET POST COMMENT TREE
DOMAIN : COMMENT CORE
ROLE : 댓글 + 대댓글 구조
================================================== */

async getCommentTree(
postId:number
){

this.validatePost(postId);

const rows =
db.prepare(`

SELECT

c.*,

p.displayName

FROM post_comments c

JOIN profiles p
ON p.id=c.profileId

WHERE
c.postId=?
AND c.status='ACTIVE'

ORDER BY
c.parentId ASC,
c.createdAt ASC

`).all(postId);

/* tree build */

const map:any={};

rows.forEach(r=>{

r.replies=[];

map[r.id]=r;

});

const roots:any[]=[];

rows.forEach(r=>{

if(r.parentId){

if(map[r.parentId]){

map[r.parentId]
.replies
.push(r);

}

}else{

roots.push(r);

}

});

return {

ok:true,

comments:roots

};

}

}