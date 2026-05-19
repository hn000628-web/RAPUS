/* ==================================================
SECTION 00 : IMPORT
================================================== */

import{Module}from'@nestjs/common'

import{IndustrySubtypesController}
from'././industry-subtypes.controller'

import{IndustrySubtypesService}
from'././industry-subtypes.service'

/* ==================================================
SECTION 01 : INDUSTRY SUBTYPES MODULE
DOMAIN : ADMIN INDUSTRY SUBTYPES
ROLE : INDUSTRY SUBTYPE ADMIN DOMAIN MODULE
================================================== */

@Module({

controllers:[

IndustrySubtypesController

],

providers:[

IndustrySubtypesService

],

exports:[

IndustrySubtypesService

]

})

export class IndustrySubtypesModule{}

/* ==================================================
SECTION END : INDUSTRY SUBTYPES MODULE
================================================== */