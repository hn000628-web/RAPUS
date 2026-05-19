// FILE: backend/src/modules/admin/regions/regions.module.ts
/* ==================================================
SECTION 00 : IMPORT
================================================== */

import{Module}from'@nestjs/common'

import{RegionsController}
from'./regions.controller'

import{RegionsService}
from'./regions.service'

/* ==================================================
SECTION 01 : MODULE
DOMAIN : ADMIN REGIONS
ROLE : REGION ADMIN DOMAIN MODULE
================================================== */

@Module({

controllers:[
RegionsController
],

providers:[
RegionsService
],

exports:[
RegionsService
]

})

export class RegionsModule{}

/* ==================================================
SECTION END
================================================== */