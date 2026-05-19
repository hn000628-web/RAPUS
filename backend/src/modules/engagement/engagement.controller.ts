import {
Controller,
Post,
Get,
Param,
Body,
Req,
UseGuards,
BadRequestException
} from '@nestjs/common'

import { EngagementService }
from './engagement.service'

import { JwtAuthGuard }
from '../auth/jwt.guard'

@Controller('engagement')

export class EngagementController {

constructor(

private readonly engagementService:
EngagementService

){}

/* ==================================================
SECTION 01 : LIKE TOGGLE
================================================== */

@Post('like')

@UseGuards(JwtAuthGuard)

toggleLike(

@Body() body:any,

@Req() req:any

){

const profileId=
req.user?.profileId

if(!profileId){

throw new BadRequestException(
'profileId missing'
)

}

const postId=
Number(body.postId)

if(Number.isNaN(postId)){

throw new BadRequestException(
'postId required'
)

}

return this.engagementService
.toggleLike(

postId,

profileId

)

}

/* ==================================================
SECTION 02 : BOOKMARK TOGGLE
================================================== */

@Post('bookmark')

@UseGuards(JwtAuthGuard)

toggleBookmark(

@Body() body:any,

@Req() req:any

){

const profileId=
req.user?.profileId

if(!profileId){

throw new BadRequestException(
'profileId missing'
)

}

const postId=
Number(body.postId)

if(Number.isNaN(postId)){

throw new BadRequestException(
'postId required'
)

}

return this.engagementService
.toggleBookmark(

postId,

profileId

)

}

/* ==================================================
SECTION 03 : VIEW COUNT
================================================== */

@Post('view')

addView(

@Body() body:any

){

const postId=
Number(body.postId)

if(Number.isNaN(postId)){

throw new BadRequestException(
'postId required'
)

}

return this.engagementService
.addView(postId)

}

/* ==================================================
SECTION 04 : GET STATS
================================================== */

@Get('stats/:postId')

getStats(

@Param('postId')
postIdRaw:string

){

const postId=
Number(postIdRaw)

if(Number.isNaN(postId)){

throw new BadRequestException(
'invalid postId'
)

}

return this.engagementService
.getStats(postId)

}

}