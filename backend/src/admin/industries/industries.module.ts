/* ==================================================
SECTION 00 : IMPORT
================================================== */

import{Module}from'@nestjs/common'

import{IndustriesController}from'././industries.controller'
import{IndustriesService}from'././industries.service'

/* ==================================================
SECTION 01 : INDUSTRIES MODULE
DOMAIN : ADMIN INDUSTRIES
ROLE : INDUSTRY ADMIN DOMAIN MODULE
================================================== */

@Module({

controllers:[

IndustriesController

],

providers:[

IndustriesService

],

exports:[

IndustriesService

]

})

export class IndustriesModule{}

/* ==================================================
SECTION END : INDUSTRIES MODULE
================================================== */