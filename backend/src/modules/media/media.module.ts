/* ==================================================
SECTION CODE OUTPUT : MEDIA MODULE FINAL
ROLE : MEDIA DOMAIN ROOT
STATUS :
CONTROLLER CONNECTED
DI SAFE
EXPORT SAFE
PRODUCTION STRUCTURE
================================================== */


/* ==================================================
SECTION 01 IMPORT
================================================== */

import { Module }
from '@nestjs/common'

import { MediaService }
from './media.service'

import { MediaController }
from './media.controller'


/* ==================================================
SECTION 02 MODULE
================================================== */

@Module({

imports:[

/* future expansion safe */

],

controllers:[

MediaController   // 반드시 필요

],

providers:[

MediaService

],

exports:[

MediaService   // ProfilesService DI 사용

]

})

export class MediaModule{}


/* ==================================================
SECTION END
================================================== */