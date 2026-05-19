/* ==================================================
FILE : backend/src/utils/ImageUploadUtil.ts
ROOT : C:\Users\kjm\social-platform\backend\src\utils\ImageUploadUtil.ts

STATUS : MEDIA SAFE VERSION

POLICY :

파일 즉시 삭제 금지
DB lifecycle 기반 관리
관리자 cleanup만 실제 삭제

================================================== */

import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export type UploadedImage={
filename:string;
filePath:string;
url:string;
};

export class ImageUploadUtil{

private static uploadDir=

path.join(
process.cwd(),
'uploads'
);

/* ======================================
UPLOAD DIR
====================================== */

static ensureUploadDir(){

if(!fs.existsSync(this.uploadDir)){

fs.mkdirSync(

this.uploadDir,

{recursive:true}

);

}

}

/* ======================================
FILENAME
====================================== */

static generateFilename(
originalName:string
):string{

const ext=

path.extname(originalName);

const uuid=
randomUUID();

return `${uuid}${ext}`;

}

/* ======================================
SAVE IMAGE
====================================== */

static saveImage(

buffer:Buffer,
originalName:string

):UploadedImage{

this.ensureUploadDir();

const filename=

this.generateFilename(
originalName
);

const filePath=

path.join(
this.uploadDir,
filename
);

fs.writeFileSync(
filePath,
buffer
);

const url=

`/uploads/${filename}`;

return{

filename,
filePath,
url

};

}

/* ======================================
DELETE 금지 (관리자만 실제 삭제)
====================================== */

static deleteImage(

imageUrl:string

){

/* 실제 삭제 금지 */

console.log(

'Image delete blocked (manual cleanup only):',
imageUrl

);

}

/* ======================================
MULTI DELETE BLOCK
====================================== */

static deleteImages(

imageUrls:string[]

){

console.log(
'Bulk delete blocked (manual cleanup only)'
);

}

/* ======================================
PUBLIC URL
====================================== */

static buildPublicUrl(

filename:string

):string{

return `/uploads/${filename}`;

}

}