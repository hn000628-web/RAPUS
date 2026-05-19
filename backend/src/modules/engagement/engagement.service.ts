import {
Injectable,
NotFoundException
} from '@nestjs/common';

import db from '../../config/database';

@Injectable()
export class EngagementService {

/* ==================================================
SECTION 01 : VALIDATION
================================================== */

private validatePost(
postId:number
){

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

/* ==================================================
SECTION 02 : ENSURE ROW
================================================== */

private ensureRow(
postId:number
){

db.prepare(`
INSERT OR IGNORE INTO post_engagements
(postId)
VALUES (?)
`).run(postId);

}

/* ==================================================
SECTION 03 : VIEW
================================================== */

async addView(
postId:number
){

this.validatePost(postId);

this.ensureRow(postId);

db.prepare(`
UPDATE post_engagements
SET viewCount =
viewCount +1
WHERE postId=?
`).run(postId);

return {ok:true};

}

/* ==================================================
SECTION 04 : LIKE
================================================== */

async toggleLike(
postId:number,
profileId:number
){

this.validatePost(postId);

this.ensureRow(postId);

db.prepare(`
UPDATE post_engagements
SET likeCount =
likeCount +1
WHERE postId=?
`).run(postId);

return {ok:true};

}

/* ==================================================
SECTION 05 : BOOKMARK
================================================== */

async toggleBookmark(
postId:number,
profileId:number
){

this.validatePost(postId);

this.ensureRow(postId);

db.prepare(`
UPDATE post_engagements
SET saveCount =
saveCount +1
WHERE postId=?
`).run(postId);

return {ok:true};

}

/* ==================================================
SECTION 06 : STATS
================================================== */

async getStats(
postId:number
){

this.validatePost(postId);

this.ensureRow(postId);

const stats =
db.prepare(`

SELECT
viewCount,
likeCount,
saveCount,
commentCount

FROM post_engagements

WHERE postId=?

`).get(postId);

return {

ok:true,
stats

};

}

}