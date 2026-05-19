/* ==================================================
SECTION 01 CATEGORY DOMAIN
================================================== */

export type Category =
  | 'GENERAL'
  | 'PLACE'
  | 'EVENT'
  | 'USED'
  | 'REAL_ESTATE'
  | 'AUTO'
  | 'JOB'
  | 'GROUP';

/* ==================================================
SECTION 02 PROFILE DOMAIN
================================================== */

export type ProfileType =
  | 'GENERAL'
  | 'BUSINESS';

export type BizType =
  | 'FREELANCER'
  | 'STORE'
  | 'REAL_ESTATE'
  | 'AUTO';

/* ==================================================
SECTION 03 PROFILE BLOCK DOMAIN
ROLE : PROFILE CONTENT ENTITY
================================================== */

export type ProfileBlockType =
  | 'TEXT'
  | 'LINK'
  | 'IMAGE'
  | 'SECTION';

/* ==================================================
BLOCK ENTITY

id → DB PK (number)
tempId → UI key (string)

UI에서는 tempId 사용
DB 저장후 id 사용

================================================== */

export type ProfileBlock = {

id?:number;

tempId:string;

type:ProfileBlockType;

title?:string;

value?:string;

url?:string;

imageUrl?:string;

sortOrder?:number;

};

/* ==================================================
SECTION 04 LINK BLOCK
================================================== */

export type ProfileLink={

tempId:string;

title:string;

url:string;

};

/* ==================================================
SECTION 05 IMAGE BLOCK
================================================== */

export type ProfileImageBlock={

tempId:string;

imageUrl:string;

};

/* ==================================================
SECTION 06 TEXT BLOCK
================================================== */

export type ProfileTextBlock={

tempId:string;

title?:string;

value:string;

};