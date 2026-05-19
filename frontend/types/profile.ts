// FILE: frontend/types/profile.ts

/* ==================================================
SECTION 01 : PROFILE BLOCK TYPES (DB SYNC)
================================================== */

export type BlockType='TEXT'|'LINK'
export type ProfileBlock={
id:number
type:BlockType
title:string
content?:string|null
url?:string|null
description?:string|null
sortOrder:number
}

export type ProfileBlockInput={
type:BlockType
title:string
content?:string|null
url?:string|null
description?:string|null
sortOrder:number
}