/* ==================================================
FILE : backend/src/utils/orphan-image-cleaner.ts
ROOT : C:\Users\kjm\social-platform\backend\src\utils\orphan-image-cleaner.ts

STATUS : DISABLED AUTO CLEANER

POLICY :

AUTO RUN 금지
FILE DELETE 금지
ADMIN ONLY

================================================== */

import db from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

const uploadsPath=

path.join(
process.cwd(),
'uploads'
);

/* ==========================================
MANUAL ONLY
========================================== */

export function findOrphanImages(){

console.log(
'Auto orphan cleaner disabled'
);

return [];

}