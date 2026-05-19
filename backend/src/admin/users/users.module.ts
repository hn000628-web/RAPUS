// FILE: backend/src/modules/admin/users/users.module.ts
/* ==================================================
SECTION 00 : IMPORT
================================================== */

import{Module}from'@nestjs/common'

import{UsersController}
from'./users.controller'

import{UsersService}
from'./users.service'

/* ==================================================
SECTION 01 : USERS MODULE
DOMAIN : ADMIN USERS
ROLE : USER ADMIN DOMAIN MODULE
================================================== */

@Module({

controllers:[

UsersController

],

providers:[

UsersService

],

exports:[

UsersService

]

})

export class UsersModule{}

/* ==================================================
SECTION END : USERS MODULE
================================================== */