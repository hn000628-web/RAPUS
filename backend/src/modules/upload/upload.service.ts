// FILE : backend/src/modules/feed/feed.service.ts
// ROOT : backend/src/modules/feed/feed.service.ts
// STATUS : STRICT MODE SAFE FIX
// ROLE : POST CREATE SERVICE

// ==================================================
// SECTION 01 : IMPORT
// ==================================================

import {
Injectable,
NotFoundException,
BadRequestException
}
from '@nestjs/common'

import db
from '../../config/database'

// ==================================================
// SECTION 02 : SERVICE
// ==================================================

@Injectable()

export class FeedService{

// ==================================================
// SECTION 03 : CREATE POST
// ==================================================

async createPost(

profileId:number,

postData:any

){

if(

!postData.content||

postData.content
.trim()
.length===0

){

throw new BadRequestException(
'Post content cannot be empty'
)

}

// ==================================================
// CATEGORY VALIDATION
// ==================================================

const category=

db.prepare(`

SELECT id

FROM categories

WHERE code=?

`).get(

postData.categoryCode
||'GENERAL'

) as
{ id:number }
| undefined

if(!category){

throw new BadRequestException(
'Invalid category'
)

}

// ==================================================
// TIME SETUP
// ==================================================

const now=
new Date()
.toISOString()

const type=

postData.type||

(

postData.profileType==='BUSINESS'

? 'AD'

: 'GENERAL'

)

let expiresAt:
string|null=null

if(type==='AD'){

const expire=
new Date()

expire.setDate(
expire.getDate()+30
)

expiresAt=
expire.toISOString()

}

// ==================================================
// INSERT POST
// ==================================================

let result:any

try{

result=db.prepare(`

INSERT INTO posts(

profileId,

type,

postType,

categoryId,

title,

content,

price,

isNegotiable,

regionId,

latitude,

longitude,

status,

expiresAt,

createdAt,

updatedAt

)

VALUES(

?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?

)

`).run(

profileId,

type,

postData.postType
||'GENERAL',

category.id,

postData.title
||'',

postData.content,

postData.price
?? null,

postData.isNegotiable
?? 0,

postData.regionId
?? null,

postData.latitude
?? null,

postData.longitude
?? null,

postData.status
||'DRAFT',

expiresAt,

now,

now

)

}

// ==================================================
// ERROR SAFE FIX (STRICT MODE)
// ==================================================

catch(error){

const errMessage=

error instanceof Error

? error.message

: 'unknown error'

throw new BadRequestException(

'Error creating post: '
+ errMessage

)

}

// ==================================================
// POST ID
// ==================================================

const postId=

Number(
result.lastInsertRowid
)

// ==================================================
// SECTION 04 : IMAGE LINK
// ==================================================

if(

postData.imageAssetIds&&

Array.isArray(
postData.imageAssetIds
)

){

const stmt=

db.prepare(`

INSERT INTO post_images(

postId,

imageAssetId,

sortOrder

)

VALUES(

?, ?, ?

)

`)

postData.imageAssetIds
.forEach(

(assetId:number,
index:number)=>{

stmt.run(

postId,

assetId,

index

)

}

)

}

// ==================================================
// SECTION 05 : RETURN
// ==================================================

return{

ok:true,

postId

}

}

// ==================================================
// SECTION END
// ==================================================

}