/* ==================================================
SECTION CODE OUTPUT : ADMIN ROOT CONTROLLER
FILE : backend/src/admin/admin.controller.ts
================================================== */

import{
Controller,
Get,
Post
}from'@nestjs/common'

import{AdminService}
from'./admin.service'


/* ==================================================
SECTION 01 : ADMIN ROOT
ROLE : ADMIN ROOT API ONLY
================================================== */

@Controller('admin')

export class AdminController{

constructor(

private readonly adminService:AdminService

){}


/* ==================================================
SECTION 02 : HEALTH CHECK
GET /api/admin/health
================================================== */

@Get('health')

health(){

return{

ok:true,
module:'admin'

}

}


/* ==================================================
SECTION 03 : DUPLICATE PROFILE BLOCKS 조회
GET /api/admin/profile-blocks/duplicates
================================================== */

@Get('profile-blocks/duplicates')

getDuplicateProfileBlocks(){

return this.adminService
.findDuplicateProfileBlocks()

}


/* ==================================================
SECTION 04 : DUPLICATE PROFILE BLOCKS 정리
POST /api/admin/profile-blocks/clean
================================================== */

@Post('profile-blocks/clean')

cleanDuplicateProfileBlocks(){

return this.adminService
.cleanDuplicateProfileBlocks()

}


/* ==================================================
SECTION 05 : POS DELETED TABLE LOCATIONS 조회
GET /api/admin/db-cleaner/pos-locations/deleted
================================================== */

@Get('db-cleaner/pos-locations/deleted')

getDeletedPosTableLocations(){

return this.adminService
.findDeletedPosTableLocations()

}


/* ==================================================
SECTION 06 : POS DELETED TABLE LOCATIONS 정리
POST /api/admin/db-cleaner/pos-locations/deleted/clean
================================================== */

@Post('db-cleaner/pos-locations/deleted/clean')

cleanDeletedPosTableLocations(){

return this.adminService
.cleanDeletedPosTableLocations()

}

/* ==================================================
SECTION 07 : ORPHAN IMAGE ASSETS SCAN
GET /api/admin/db-cleaner/image-assets/orphans
================================================== */

@Get('db-cleaner/image-assets/orphans')

getOrphanImageAssets(){

return this.adminService
.findOrphanImageAssets()

}

/* ==================================================
SECTION 08 : INACTIVE ROWS SCAN
GET /api/admin/db-cleaner/inactive-rows
================================================== */

@Get('db-cleaner/inactive-rows')

getInactiveRows(){

return this.adminService
.findInactiveRows()

}

/* ==================================================
SECTION 09 : INACTIVE ROWS CLEAN
POST /api/admin/db-cleaner/inactive-rows/clean
================================================== */

@Post('db-cleaner/inactive-rows/clean')

cleanInactiveRows(){

return this.adminService
.cleanInactiveRows()

}

/* ==================================================
SECTION 10 : CLEANUP ISSUES DASHBOARD 조회
GET /api/admin/db-cleaner/issues
================================================== */

@Get('db-cleaner/issues')

getCleanupIssues(){

return this.adminService
.findCleanupIssues()

}

/* ==================================================
SECTION 11 : CLEANUP ISSUES DASHBOARD 정리
POST /api/admin/db-cleaner/issues/clean
================================================== */

@Post('db-cleaner/issues/clean')

cleanCleanupIssues(){

return this.adminService
.cleanDeletableIssues()

}

@Post('db-cleaner/orphan-images/clean')

cleanupOrphanImages(){

return this.adminService
.cleanupOrphanImages()

}

@Post('db-cleaner/orphan-relations/clean')

cleanupOrphanRelations(){

return this.adminService
.cleanupOrphanRelations()

}

@Post('db-cleaner/invalid-product-images/clean')

cleanupInvalidProductImages(){

return this.adminService
.cleanupInvalidProductImages()

}

/* ==================================================
SECTION 12 : DEV POS INACTIVE ORDERS CLEAR
POST /api/admin/db-cleaner/pos/inactive-orders/clear
================================================== */

@Post('db-cleaner/pos/inactive-orders/clear')

clearDevPosInactiveOrders(){

return this.adminService
.clearDevPosInactiveOrders()

}


/* ==================================================
SECTION 13 : FULL CLEANUP (전체 정리)
POST /api/admin/cleanup/full
================================================== */

@Post('cleanup/full')

fullCleanup(){

return this.adminService
.fullCleanup()

}


/* ==================================================
SECTION END
================================================== */

}
