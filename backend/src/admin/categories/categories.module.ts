// FILE: backend/src/modules/admin/categories/categories.module.ts
/* ==================================================
SECTION 00 : IMPORT
================================================== */

import{Module}from'@nestjs/common'

import{CategoriesController}from'././categories.controller'
import{CategoriesService}from'././categories.service'

/* ==================================================
SECTION 01 : CATEGORIES MODULE
DOMAIN : ADMIN CATEGORIES
ROLE : CATEGORY ADMIN DOMAIN MODULE
================================================== */

@Module({

controllers:[

CategoriesController

],

providers:[

CategoriesService

],

exports:[

CategoriesService

]

})

export class CategoriesModule{}

/* ==================================================
SECTION END : CATEGORIES MODULE
================================================== */