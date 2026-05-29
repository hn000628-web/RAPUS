// FILE: C:\Users\kjm\social-platform\backend\src\init\init-db.ts
// ROOT : C:\Users\kjm\social-platform\backend\src\init\init-db.ts
// STATUS : PRODUCTION DB INIT FINAL (TEST SECTION FIRST ORDER)

import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import * as bcrypt from 'bcrypt'
import { initSecurityQrAuthSchema } from './security-qr-auth.schema'
import { initWalletLedgerSchema } from './wallet-ledger.schema'

export async function initDatabase(){

console.log('===== PRODUCTION DB INIT START =====')

const dbDir = path.resolve(__dirname,'../../data')

if(!fs.existsSync(dbDir))
fs.mkdirSync(dbDir,{recursive:true})

const dbPath = path.join(dbDir,'prod.sqlite')

console.log('DB PATH FIXED ->', dbPath)

const db = new Database(dbPath)

/* =========================================
SAFE COLUMN ADD (LEGACY DB COMPAT)
========================================= */

function safeAddColumn(
table:string,
column:string,
type:string
){

const cols=db.prepare(
`PRAGMA table_info(${table})`
).all()

const exists=
cols.some(
(c:any)=>c.name===column
)

if(!exists){

db.exec(`
ALTER TABLE ${table}
ADD COLUMN ${column} ${type}
`)

}

}


//==================================================
// SECTION 01 : USERS TABLE

db.exec(`

CREATE TABLE IF NOT EXISTS users(

id INTEGER PRIMARY KEY AUTOINCREMENT,

email TEXT NOT NULL UNIQUE,

passwordHash TEXT NOT NULL,

baseCode TEXT CHECK(baseCode IS NULL OR length(baseCode)=12),

phone TEXT DEFAULT '010-1234-1234',

displayName TEXT,

accountType TEXT DEFAULT 'USER',

status TEXT CHECK(status IN('ACTIVE','INACTIVE')) DEFAULT 'ACTIVE',

type TEXT DEFAULT 'normal',

-- DEPRECATED: legacy account grade marker.
-- Use corporationGrade for company grade authority.
userGrade INTEGER NOT NULL DEFAULT 0
CHECK(userGrade BETWEEN 0 AND 12),

corporationGrade INTEGER NOT NULL DEFAULT 0
CHECK(corporationGrade BETWEEN 0 AND 24),

providerGrade INTEGER NOT NULL DEFAULT 0
CHECK(providerGrade BETWEEN 0 AND 24),

genesisGrade INTEGER NOT NULL DEFAULT 0
CHECK(genesisGrade BETWEEN 0 AND 24),

meteoAiGrade INTEGER NOT NULL DEFAULT 0
CHECK(meteoAiGrade BETWEEN 0 AND 24),

birthDate TEXT,

adultVerificationStatus TEXT DEFAULT 'UNVERIFIED'
CHECK(adultVerificationStatus IN(
  'UNVERIFIED',
  'VERIFIED',
  'EXPIRED',
  'REQUIRED',
  'FAILED'
)),

adultVerifiedAt TEXT,

adultVerificationProvider TEXT,

adultVerificationExpiresAt TEXT,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP

)

`)

safeAddColumn(
  'users',
  'baseCode',
  'TEXT CHECK(baseCode IS NULL OR length(baseCode)=12)'
)

safeAddColumn(
  'users',
  'userGrade',
  'INTEGER NOT NULL DEFAULT 0 CHECK(userGrade BETWEEN 0 AND 12)'
)

safeAddColumn(
  'users',
  'corporationGrade',
  'INTEGER NOT NULL DEFAULT 0 CHECK(corporationGrade BETWEEN 0 AND 24)'
)

safeAddColumn(
  'users',
  'providerGrade',
  'INTEGER NOT NULL DEFAULT 0 CHECK(providerGrade BETWEEN 0 AND 24)'
)

safeAddColumn(
  'users',
  'genesisGrade',
  'INTEGER NOT NULL DEFAULT 0 CHECK(genesisGrade BETWEEN 0 AND 24)'
)

safeAddColumn(
  'users',
  'meteoAiGrade',
  'INTEGER NOT NULL DEFAULT 0 CHECK(meteoAiGrade BETWEEN 0 AND 24)'
)

const usersGradeMax12TableSqlRow = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type = 'table'
    AND name = 'users'
  LIMIT 1
`).get() as { sql?: string } | undefined

const usersGradeMax12TableSql =
usersGradeMax12TableSqlRow?.sql ?? ''

const usersNeedsGradeMax24Migration =
  usersGradeMax12TableSql.includes('CHECK(userGrade IN(0,1,2,3,4))') ||
  usersGradeMax12TableSql.includes('CHECK(corporationGrade IN(0,1,2,3,4,5,7))') ||
  usersGradeMax12TableSql.includes('CHECK(corporationGrade BETWEEN 0 AND 12)') ||
  usersGradeMax12TableSql.includes('CHECK(providerGrade BETWEEN 0 AND 12)') ||
  usersGradeMax12TableSql.includes('CHECK(genesisGrade BETWEEN 0 AND 12)')

if (usersNeedsGradeMax24Migration) {
  const nextUsersSql =
    usersGradeMax12TableSql
      .replace(
        /CREATE TABLE "?users"?/i,
        'CREATE TABLE users_new'
      )
      .replace(
        /CHECK\s*\(\s*userGrade\s+IN\s*\(0,1,2,3,4\)\s*\)/g,
        'CHECK(userGrade BETWEEN 0 AND 12)'
      )
      .replace(
        /CHECK\s*\(\s*corporationGrade\s+IN\s*\(0,1,2,3,4,5,7\)\s*\)/g,
        'CHECK(corporationGrade BETWEEN 0 AND 24)'
      )
      .replace(
        /CHECK\s*\(\s*corporationGrade\s+BETWEEN\s+0\s+AND\s+12\s*\)/g,
        'CHECK(corporationGrade BETWEEN 0 AND 24)'
      )
      .replace(
        /CHECK\s*\(\s*providerGrade\s+BETWEEN\s+0\s+AND\s+12\s*\)/g,
        'CHECK(providerGrade BETWEEN 0 AND 24)'
      )
      .replace(
        /CHECK\s*\(\s*genesisGrade\s+BETWEEN\s+0\s+AND\s+12\s*\)/g,
        'CHECK(genesisGrade BETWEEN 0 AND 24)'
      )

  if (
    !nextUsersSql.includes('CHECK(userGrade BETWEEN 0 AND 12)') ||
    !nextUsersSql.includes('CHECK(corporationGrade BETWEEN 0 AND 24)') ||
    !nextUsersSql.includes('CHECK(providerGrade BETWEEN 0 AND 24)') ||
    !nextUsersSql.includes('CHECK(genesisGrade BETWEEN 0 AND 24)')
  ) {
    throw new Error('users grade max 24 migration failed')
  }

  const userColumns =
    db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>
  const userColumnNames =
    userColumns.map((column) => column.name)
  const userColumnList =
    userColumnNames.join(', ')

  db.exec(`PRAGMA foreign_keys = OFF`)

  try {
    db.exec(`DROP TABLE IF EXISTS users_new`)
    db.exec(nextUsersSql)
    db.exec(`
      INSERT INTO users_new(${userColumnList})
      SELECT ${userColumnList}
      FROM users
    `)
    db.exec(`DROP TABLE users`)
    db.exec(`ALTER TABLE users_new RENAME TO users`)

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_adult_verification_status
      ON users(adultVerificationStatus);

      CREATE INDEX IF NOT EXISTS idx_users_birth_date
      ON users(birthDate);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_baseCode
      ON users(baseCode);

      CREATE INDEX IF NOT EXISTS idx_users_meteo_ai_grade
      ON users(meteoAiGrade);
    `)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}

db.exec(`
UPDATE users
SET corporationGrade = 0
WHERE corporationGrade IS NULL
   OR (
    email != 'hn0628@naver.com'
    AND corporationGrade != 0
  )
`)

db.exec(`
UPDATE users
SET providerGrade = 0
WHERE providerGrade IS NULL
`)

//===================================================
// SECTION 01-0 : USERS PRIVACY / ADULT VERIFICATION SAFE ADD
// ROLE : ACCOUNT LEVEL PRIVACY DATA
//===================================================

safeAddColumn(
  'users',
  'birthDate',
  'TEXT'
)

safeAddColumn(
  'users',
  'adultVerificationStatus',
  `TEXT DEFAULT 'UNVERIFIED'
   CHECK(adultVerificationStatus IN(
     'UNVERIFIED',
     'VERIFIED',
     'EXPIRED',
     'REQUIRED',
     'FAILED'
   ))`
)

safeAddColumn(
  'users',
  'adultVerifiedAt',
  'TEXT'
)

safeAddColumn(
  'users',
  'adultVerificationProvider',
  'TEXT'
)

safeAddColumn(
  'users',
  'adultVerificationExpiresAt',
  'TEXT'
)

db.exec(`

CREATE INDEX IF NOT EXISTS idx_users_adult_verification_status
ON users(adultVerificationStatus)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS idx_users_birth_date
ON users(birthDate)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS idx_users_meteo_ai_grade
ON users(meteoAiGrade)

`)


//======================================================
// SECTION 02 : TEST USERS (기본 테스트 계정)

const testPassword = bcrypt.hashSync('1234',10)

const insertUser = db.prepare(`

INSERT OR IGNORE INTO users(
email,
passwordHash,
baseCode,
displayName,
phone,
accountType,
status,
type
)

VALUES(?,?,?,?,?,?,?,?)

`)



const findUserIdByEmail = db.prepare(`

SELECT id
FROM users
WHERE email=?

`)

const updateUserBaseCodeIfNullByEmail = db.prepare(`

UPDATE users
SET baseCode = ?
WHERE email = ?
  AND baseCode IS NULL

`)

const updateUserBaseCodeByEmail = db.prepare(`

UPDATE users
SET baseCode = ?
WHERE email = ?

`)

const updateUserDisplayNameByEmail = db.prepare(`

UPDATE users
SET displayName = ?
WHERE email = ?

`)

function ensureTestUserId(
email: string,
displayName: string,
baseCode: string
): number {
insertUser.run(
email,
testPassword,
baseCode,
displayName,
'010-1234-1234',
'USER',
'ACTIVE',
'normal'
)

updateUserBaseCodeIfNullByEmail.run(
baseCode,
email
)

updateUserDisplayNameByEmail.run(
displayName,
email
)

const row = findUserIdByEmail.get(email) as { id?: number } | undefined
if (!row?.id) {
throw new Error(`failed to ensure test user: ${email}`)
}
return row.id
}

const test11ConflictRow = db.prepare(`
SELECT COUNT(*) AS count
FROM users
WHERE email IN ('test1@prod.com', 'test11@naver.com', 'test11@prod.com')
`).get() as { count?: number } | undefined

if ((test11ConflictRow?.count ?? 0) > 1) {
throw new Error('email conflict: test11@prod.com already exists')
}

const test12ConflictRow = db.prepare(`
SELECT COUNT(*) AS count
FROM users
WHERE email IN ('test2@prod.com', 'test12@naver.com', 'test12@prod.com')
`).get() as { count?: number } | undefined

if ((test12ConflictRow?.count ?? 0) > 1) {
throw new Error('email conflict: test12@prod.com already exists')
}

db.exec(`
UPDATE users
SET
  email = 'test11@prod.com',
  displayName = '테스트 사용자 1'
WHERE email IN ('test1@prod.com', 'test11@naver.com')
  AND NOT EXISTS (
    SELECT 1
    FROM users existing
    WHERE existing.email = 'test11@prod.com'
  );

UPDATE users
SET
  email = 'test12@prod.com',
  displayName = '테스트 사용자 2'
WHERE email IN ('test2@prod.com', 'test12@naver.com')
  AND NOT EXISTS (
    SELECT 1
    FROM users existing
    WHERE existing.email = 'test12@prod.com'
  );
`)

const userId1 =
ensureTestUserId(
'test11@prod.com',
'테스트 사용자 1',
'144000012734'
)

const userId2 =
ensureTestUserId(
'test12@prod.com',
'테스트 사용자 2',
'012734144000'
)

const hnSeedAccounts =
Array.from({ length: 10 }, (_, index) => {
const sequence = index + 1
const padded = String(sequence).padStart(4, '0')
const baseCode =
sequence === 1 ? '762491830572' : String(sequence).padStart(12, '0')
return {
email: sequence === 1 ? 'test01@prod.com' : `hn${padded}@naver.com`,
displayName: sequence === 1 ? '그린 생활마트' : `hn${padded}`,
baseCode,
phone: '010-1234-1234'
}
})

const legacyDemoAccountEmail =
'hn000' + '1@naver.com'

const demoAccountConflictRow = db.prepare(`
SELECT COUNT(*) AS count
FROM users
WHERE email IN (?, ?)
`).get(legacyDemoAccountEmail, 'test01@prod.com') as { count?: number } | undefined

if ((demoAccountConflictRow?.count ?? 0) > 1) {
throw new Error('email conflict: test01@prod.com already exists')
}

db.prepare(`
UPDATE users
SET email = 'test01@prod.com'
WHERE email = ?
  AND NOT EXISTS (
    SELECT 1
    FROM users existing
    WHERE existing.email = 'test01@prod.com'
  )
`).run(legacyDemoAccountEmail)

const hnSeedUsers =
hnSeedAccounts.map((account) => {
const userId = ensureTestUserId(
  account.email,
  account.displayName,
  account.baseCode
)

updateUserBaseCodeByEmail.run(
  account.baseCode,
  account.email
)

db.prepare(`
UPDATE users
SET
  phone = ?,
  status = 'ACTIVE'
WHERE email = ?
`).run(account.phone, account.email)

return {
  ...account,
  userId
}
})

db.prepare(`
UPDATE users
SET
  userGrade = 2,
  providerGrade = 1
WHERE email = 'test01@prod.com'
`).run()

//======================================================
// SECTION 02-1 : OWNER ACCOUNT SEED
// ROLE : ACCOUNT LEVEL OWNER MARKER / NOT AUTH BYPASS
//======================================================

const ownerAccountEmail =
'hn0628@naver.com'

const ownerAccountInitialPasswordHash =
bcrypt.hashSync('1234',10)

db.prepare(`
INSERT OR IGNORE INTO users(
email,
passwordHash,
baseCode,
displayName,
phone,
accountType,
status,
type,
userGrade,
corporationGrade,
providerGrade,
genesisGrade,
meteoAiGrade
)
VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
`).run(
ownerAccountEmail,
ownerAccountInitialPasswordHash,
'012712392766',
'OWNER_ACCOUNT',
'010-1234-1234',
'USER',
'ACTIVE',
'normal',
12,
24,
24,
24,
24
)

db.prepare(`
UPDATE users
SET
  baseCode = '012712392766',
  phone = '010-1234-1234',
  userGrade = 12,
  providerGrade = 24,
  corporationGrade = 24,
  genesisGrade = 24,
  meteoAiGrade = 24
WHERE email = ?
`).run(ownerAccountEmail)

db.exec(`
UPDATE users
SET phone = '010-1234-1234'
WHERE phone IS NULL
   OR TRIM(phone) != '010-1234-1234'
`)

db.prepare(`
UPDATE users
SET corporationGrade = 0
WHERE email IN (
  'test11@prod.com',
  'test12@prod.com',
  'test1@prod.com',
  'test2@prod.com',
  'test11@naver.com',
  'test12@naver.com'
)
`).run()

db.prepare(`
UPDATE users
SET
  userGrade = 1,
  providerGrade = 0,
  corporationGrade = 0,
  genesisGrade = 1
WHERE email = 'test12@prod.com'
`).run()

const ownerAccountUserIdRow =
findUserIdByEmail.get(ownerAccountEmail) as { id?: number } | undefined

if (!ownerAccountUserIdRow?.id) {
throw new Error(`failed to ensure owner account: ${ownerAccountEmail}`)
}

const ownerAccountUserId =
ownerAccountUserIdRow.id

//===============================================
// SECTION 03 : INDUSTRIES (BUSINESS 업종 15종 [FIXED])

db.exec(`

CREATE TABLE IF NOT EXISTS industries(

id INTEGER PRIMARY KEY AUTOINCREMENT,

code TEXT UNIQUE,

name TEXT NOT NULL,

description TEXT,

isActive INTEGER DEFAULT 1,

/* 업종 정렬 순서 */
sortOrder INTEGER DEFAULT 0,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP

)

`)

/* =========================================
SAFE COLUMN ADD (기존 DB 호환 컬럼 보강)
========================================= */

safeAddColumn(
  'industries',
  'sortOrder',
  'INTEGER DEFAULT 0'
)

/* =========================================
INDEX
========================================= */

db.exec(`

CREATE UNIQUE INDEX IF NOT EXISTS idx_industry_code
ON industries(code)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS idx_industries_sort
ON industries(sortOrder)

`)

/* =========================================
DATA INSERT
========================================= */

const insertIndustry=db.prepare(`

INSERT OR IGNORE INTO industries(
code,
name,
description,
sortOrder
)

VALUES(?,?,?,?)

`)

/* sortOrder 기준 */

insertIndustry.run('FOOD','Food','Restaurant cafe delivery',1)
insertIndustry.run('BEAUTY','Beauty','Salon nail makeup',2)
insertIndustry.run('FITNESS','Fitness','PT yoga pilates',3)
insertIndustry.run('MEDICAL','Medical','Hospital clinic pharmacy',4)
insertIndustry.run('EDU','Education','Academy tutoring class',5)
insertIndustry.run('AUTO','Auto','Repair wash inspection',6)
insertIndustry.run('REAL','Real Estate','Brokering rental sales',7)
insertIndustry.run('SHOP','Shop','Retail store',8)
insertIndustry.run('IT','IT','Development devices software',9)
insertIndustry.run('MEDIA','Media','Photo video creator',10)
insertIndustry.run('TRAVEL','Travel','Lodging tour agency',11)
insertIndustry.run('PET','Pet','Pet hospital supplies',12)
insertIndustry.run('EVENT','Event','Wedding events party',13)
insertIndustry.run('SERVICE','Service','Cleaning moving repair',14)
insertIndustry.run('ETC','Etc','Other industry',15)

//================================================
// SECTION 03-1 : BUSINESS TYPES
// ROLE : BUSINESS OPERATION TYPE MASTER
// VALUES : NORMAL / STORE / SHOPPING_MALL / FREELANCER / MOBILE_BIZ
// NOTE : profiles.businessTypeCode source table
//================================================

db.exec(`

CREATE TABLE IF NOT EXISTS business_types(

id INTEGER PRIMARY KEY AUTOINCREMENT,

code TEXT NOT NULL UNIQUE
CHECK(code IN(
'NORMAL',
'STORE',
'SHOPPING_MALL',
'FREELANCER',
'MOBILE_BIZ'
)),

name TEXT NOT NULL,

description TEXT,

isActive INTEGER DEFAULT 1,

sortOrder INTEGER DEFAULT 0,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,

updatedAt TEXT

)

`)

const businessTypesTableSqlRow = db.prepare(`
SELECT sql
FROM sqlite_master
WHERE type='table'
  AND name='business_types'
LIMIT 1
`).get() as { sql?: string } | undefined

const businessTypesSupportsNormal =
businessTypesTableSqlRow?.sql?.includes(`'NORMAL'`) ?? false

if (!businessTypesSupportsNormal) {
db.exec(`PRAGMA foreign_keys = OFF`)

try {
db.exec(`DROP TABLE IF EXISTS business_types_new`)

db.exec(`
CREATE TABLE business_types_new(

id INTEGER PRIMARY KEY AUTOINCREMENT,

code TEXT NOT NULL UNIQUE
CHECK(code IN(
'NORMAL',
'STORE',
'SHOPPING_MALL',
'FREELANCER',
'MOBILE_BIZ'
)),

name TEXT NOT NULL,

description TEXT,

isActive INTEGER DEFAULT 1,

sortOrder INTEGER DEFAULT 0,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,

updatedAt TEXT

)
`)

db.exec(`
INSERT INTO business_types_new(
id,
code,
name,
description,
isActive,
sortOrder,
createdAt,
updatedAt
)
SELECT
id,
code,
name,
description,
isActive,
sortOrder,
createdAt,
updatedAt
FROM business_types
`)

db.exec(`DROP TABLE business_types`)
db.exec(`ALTER TABLE business_types_new RENAME TO business_types`)
} finally {
db.exec(`PRAGMA foreign_keys = ON`)
}
}

const businessTypesTableSqlForShoppingMallRow = db.prepare(`
SELECT sql
FROM sqlite_master
WHERE type='table'
  AND name='business_types'
LIMIT 1
`).get() as { sql?: string } | undefined

const businessTypesSupportsShoppingMall =
businessTypesTableSqlForShoppingMallRow?.sql?.includes(`'SHOPPING_MALL'`) ?? false

if (!businessTypesSupportsShoppingMall) {
db.exec(`PRAGMA foreign_keys = OFF`)

try {
db.exec(`DROP TABLE IF EXISTS business_types_new`)

db.exec(`
CREATE TABLE business_types_new(

id INTEGER PRIMARY KEY AUTOINCREMENT,

code TEXT NOT NULL UNIQUE
CHECK(code IN(
'NORMAL',
'STORE',
'SHOPPING_MALL',
'FREELANCER',
'MOBILE_BIZ'
)),

name TEXT NOT NULL,

description TEXT,

isActive INTEGER DEFAULT 1,

sortOrder INTEGER DEFAULT 0,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,

updatedAt TEXT

)
`)

db.exec(`
INSERT INTO business_types_new(
id,
code,
name,
description,
isActive,
sortOrder,
createdAt,
updatedAt
)
SELECT
id,
code,
name,
description,
isActive,
sortOrder,
createdAt,
updatedAt
FROM business_types
`)

db.exec(`DROP TABLE business_types`)
db.exec(`ALTER TABLE business_types_new RENAME TO business_types`)
} finally {
db.exec(`PRAGMA foreign_keys = ON`)
}
}

db.exec(`

CREATE UNIQUE INDEX IF NOT EXISTS
idx_business_types_code

ON business_types(code)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_business_types_sort

ON business_types(sortOrder)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_business_types_active

ON business_types(isActive)

`)

const insertBusinessType = db.prepare(`

INSERT OR IGNORE INTO business_types(
code,
name,
description,
sortOrder
)

VALUES(?,?,?,?)

`)

insertBusinessType.run(
'NORMAL',
'일반형',
'기본 비즈니스 / 회사 / 브랜드 / 소개형 페이지',
1
)

insertBusinessType.run(
'STORE',
'오프라인스토어',
'고정 매장 기반 상품 판매 / 마트 / 상점 / 음식점',
2
)

insertBusinessType.run(
'SHOPPING_MALL',
'온라인스토어',
'온라인 상품 판매 / 자체몰 / 택배 중심 운영',
3
)

insertBusinessType.run(
'FREELANCER',
'프리랜서',
'1인 서비스 / 방문 서비스 / 클래스 / 컨설팅',
4
)

insertBusinessType.run(
'MOBILE_BIZ',
'이동형',
'푸드트럭 / 이동 판매 / 출장 운영 / 현장 영업',
5
)

db.exec(`

UPDATE business_types
SET
  name = CASE code
    WHEN 'NORMAL' THEN '일반형'
    WHEN 'STORE' THEN '오프라인스토어'
    WHEN 'SHOPPING_MALL' THEN '온라인스토어'
    WHEN 'FREELANCER' THEN '프리랜서'
    WHEN 'MOBILE_BIZ' THEN '이동형'
    ELSE name
  END,
  description = CASE code
    WHEN 'NORMAL' THEN '기본 비즈니스 / 회사 / 브랜드 / 소개형 페이지'
    WHEN 'STORE' THEN '고정 매장 기반 상품 판매 / 마트 / 상점 / 음식점'
    WHEN 'SHOPPING_MALL' THEN '온라인 상품 판매 / 자체몰 / 택배 중심 운영'
    WHEN 'FREELANCER' THEN '1인 서비스 / 방문 서비스 / 클래스 / 컨설팅'
    WHEN 'MOBILE_BIZ' THEN '푸드트럭 / 이동 판매 / 출장 운영 / 현장 영업'
    ELSE description
  END,
  sortOrder = CASE code
    WHEN 'NORMAL' THEN 1
    WHEN 'STORE' THEN 2
    WHEN 'SHOPPING_MALL' THEN 3
    WHEN 'FREELANCER' THEN 4
    WHEN 'MOBILE_BIZ' THEN 5
    ELSE sortOrder
  END,
  updatedAt = CURRENT_TIMESTAMP
WHERE code IN ('NORMAL', 'STORE', 'SHOPPING_MALL', 'FREELANCER', 'MOBILE_BIZ')

`)

const findBusinessTypeIdByCode = db.prepare(`

SELECT id
FROM business_types
WHERE code=?

`)

function getBusinessTypeId(
code: 'NORMAL' | 'STORE' | 'SHOPPING_MALL' | 'FREELANCER' | 'MOBILE_BIZ'
): number {

const row =
findBusinessTypeIdByCode.get(code) as { id?: number } | undefined

if(!row?.id){

throw new Error(`business type not found: ${code}`)

}

return row.id

}

const normalBusinessTypeId =
getBusinessTypeId('NORMAL')

const storeBusinessTypeId =
getBusinessTypeId('STORE')

const shoppingMallBusinessTypeId =
getBusinessTypeId('SHOPPING_MALL')

const freelancerBusinessTypeId =
getBusinessTypeId('FREELANCER')

const mobileBizBusinessTypeId =
getBusinessTypeId('MOBILE_BIZ')

//========================================================
// SECTION 04 : INDUSTRY SUB TYPES (GLOBAL + SEARCH FINAL)

db.exec(`

CREATE TABLE IF NOT EXISTS industry_subtypes(

id INTEGER PRIMARY KEY AUTOINCREMENT,

industryId INTEGER NOT NULL,

code TEXT,

name TEXT,

name_en TEXT,

name_ko TEXT,

searchKeywords TEXT,

normalizedName TEXT,

searchVector TEXT,

isActive INTEGER DEFAULT 1,

sortOrder INTEGER DEFAULT 0,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,

updatedAt TEXT,

FOREIGN KEY(industryId)
REFERENCES industries(id)

)

`)

/* =========================================
SAFE COLUMN ADD (기존 DB 호환 컬럼 보강)
========================================= */

//===================================================
// SECTION 01-1 : USERS BASECODE SAFE ADD + UNIQUE INDEX
//===================================================

safeAddColumn(
  'users',
  'baseCode',
  'TEXT CHECK(baseCode IS NULL OR length(baseCode)=12)'
)

db.exec(`

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_baseCode
ON users(baseCode)
WHERE baseCode IS NOT NULL

`)

/* GLOBAL */

safeAddColumn(
'industry_subtypes',
'code',
'TEXT'
)

safeAddColumn(
'industry_subtypes',
'name_en',
'TEXT'
)

safeAddColumn(
'industry_subtypes',
'name_ko',
'TEXT'
)

/* SEARCH */

safeAddColumn(
'industry_subtypes',
'searchKeywords',
'TEXT'
)

safeAddColumn(
'industry_subtypes',
'normalizedName',
'TEXT'
)

safeAddColumn(
'industry_subtypes',
'searchVector',
'TEXT'
)

/* CONTROL */

safeAddColumn(
'industry_subtypes',
'isActive',
'INTEGER DEFAULT 1'
)

safeAddColumn(
'industry_subtypes',
'sortOrder',
'INTEGER DEFAULT 0'
)

safeAddColumn(
'industry_subtypes',
'updatedAt',
'TEXT'
)

/* =========================================
INDEX (GLOBAL UNIQUE)
========================================= */

db.exec(`

CREATE UNIQUE INDEX IF NOT EXISTS
idx_industry_subtypes_code

ON industry_subtypes(code)

`)

/* =========================================
SEARCH INDEX
========================================= */

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_industry_subtypes_name

ON industry_subtypes(name)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_industry_subtypes_name_en

ON industry_subtypes(name_en)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_industry_subtypes_keywords

ON industry_subtypes(searchKeywords)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_industry_subtypes_industry

ON industry_subtypes(industryId)

`)

//================================================
// SECTION 05 : REGIONS (GLOBAL REGION TREE FINAL)

db.exec(`

CREATE TABLE IF NOT EXISTS regions(

id INTEGER PRIMARY KEY AUTOINCREMENT,

code TEXT UNIQUE,

countryCode TEXT,

name TEXT,

fullName TEXT,

regionType TEXT CHECK(regionType IN(

'COUNTRY',

'METRO',
'PROVINCE',

'CITY',
'DISTRICT',

'DONG',
'EUP',
'MYEON',

'RI',

'NEIGHBORHOOD'

)),

parentId INTEGER,

depth INTEGER CHECK(depth BETWEEN 0 AND 5),

-- GLOBAL SUPPORT
isoCode TEXT,
adminLevel INTEGER,

-- TREE SEARCH
path TEXT,
pathName TEXT,

-- GEO
latitude REAL,
longitude REAL,
geoHash TEXT,

-- CONTROL
isActive INTEGER DEFAULT 1,
sortOrder INTEGER DEFAULT 0,

addressMainCode TEXT,

mainAddressCode TEXT UNIQUE
CHECK(length(mainAddressCode)=12),

roadAddress TEXT,

addressLevel INTEGER
CHECK(addressLevel BETWEEN 1 AND 5),

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,

FOREIGN KEY(parentId)
REFERENCES regions(id)

)

`)

/* SAFE COLUMN ADD */

safeAddColumn(
'regions',
'isoCode',
'TEXT'
)

safeAddColumn(
'regions',
'adminLevel',
'INTEGER'
)

safeAddColumn(
'regions',
'path',
'TEXT'
)

safeAddColumn(
'regions',
'pathName',
'TEXT'
)

safeAddColumn(
'regions',
'geoHash',
'TEXT'
)

safeAddColumn(
'regions',
'isActive',
'INTEGER DEFAULT 1'
)

safeAddColumn(
'regions',
'sortOrder',
'INTEGER DEFAULT 0'
)

safeAddColumn(
'regions',
'addressMainCode',
'TEXT'
)

safeAddColumn(
'regions',
'mainAddressCode',
'TEXT UNIQUE CHECK(length(mainAddressCode)=12)'
)

safeAddColumn(
'regions',
'roadAddress',
'TEXT'
)

safeAddColumn(
'regions',
'addressLevel',
'INTEGER CHECK(addressLevel BETWEEN 1 AND 5)'
)

safeAddColumn(
'regions',
'updatedAt',
'TEXT'
)

/* INDEX */

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_regions_parent
ON regions(parentId)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_regions_country
ON regions(countryCode)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_regions_depth
ON regions(depth)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_regions_path
ON regions(path)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_regions_geohash
ON regions(geoHash)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_regions_address_main_code
ON regions(addressMainCode)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_regions_main_address_code
ON regions(mainAddressCode)

`)

db.exec(`

UPDATE regions
SET addressMainCode = code
WHERE (addressMainCode IS NULL OR TRIM(addressMainCode) = '')
  AND code IS NOT NULL
  AND TRIM(code) != ''

`)

//===================================================
// SECTION 05-0 : ADDRESS PLACES (ADDRESS CODE 24)
//===================================================

db.exec(`

CREATE TABLE IF NOT EXISTS address_places(

id INTEGER PRIMARY KEY AUTOINCREMENT,

mainAddressCode TEXT NOT NULL,

subAddressCode TEXT NOT NULL UNIQUE,

addressCode24 TEXT NOT NULL UNIQUE,

roadAddress TEXT NOT NULL,

buildingName TEXT,

detailAddress TEXT,

latitude REAL,

longitude REAL,

isActive INTEGER DEFAULT 1,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP

)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_address_places_main
ON address_places(mainAddressCode)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_address_places_sub
ON address_places(subAddressCode)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_address_places_address24
ON address_places(addressCode24)

`)

//========================================================
// SECTION 05-1 : IMAGE ASSETS (OWNER CHANNEL FK + ACTIVE CONTROL FINAL)

db.exec(`
CREATE TABLE IF NOT EXISTS image_assets(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channelCode TEXT NOT NULL,
  usageType TEXT NOT NULL
  CHECK(usageType IN ('avatar','post','hero','gallery','place-thumbnail','pos-product-thumbnail','BARCODE_PRODUCT_THUMBNAIL','BUSINESS_REGISTRATION')),
  fileName TEXT NOT NULL,
  filePath TEXT NOT NULL UNIQUE,
  mimeType TEXT,
  fileSize INTEGER,
  width INTEGER,
  height INTEGER,
  storageProvider TEXT,
  checksum TEXT,
  isActive INTEGER DEFAULT 1,
  lastUsedAt TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_image_assets_channel
ON image_assets(channelCode);

CREATE INDEX IF NOT EXISTS idx_image_assets_usage
ON image_assets(usageType);

CREATE INDEX IF NOT EXISTS idx_image_assets_active
ON image_assets(isActive);

CREATE INDEX IF NOT EXISTS idx_image_assets_created
ON image_assets(createdAt);
`);

//=====================================================
// SECTION 05-1-0 : MARKET HERO BANNERS
// ROLE : MARKET MAIN HERO BANNER RELATION
// RULE : image_assets owns filePath / this table only selects active hero banner
//=====================================================

db.exec(`
CREATE TABLE IF NOT EXISTS market_hero_banners(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channelCode TEXT NOT NULL,
  bannerSlot TEXT NOT NULL DEFAULT 'MAIN_HERO',
  imageAssetId INTEGER NOT NULL,
  sortOrder INTEGER NOT NULL DEFAULT 1
  CHECK(sortOrder BETWEEN 1 AND 5),
  title TEXT,
  description TEXT,
  displayStatus TEXT NOT NULL DEFAULT 'VISIBLE'
  CHECK(displayStatus IN ('VISIBLE','HIDDEN')),
  isActive INTEGER NOT NULL DEFAULT 1
  CHECK(isActive IN (0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  deletedAt TEXT,
  FOREIGN KEY(imageAssetId) REFERENCES image_assets(id)
);

CREATE INDEX IF NOT EXISTS idx_market_hero_banners_channel
ON market_hero_banners(channelCode);

CREATE INDEX IF NOT EXISTS idx_market_hero_banners_slot
ON market_hero_banners(bannerSlot);

CREATE INDEX IF NOT EXISTS idx_market_hero_banners_active
ON market_hero_banners(isActive, displayStatus);
`);

safeAddColumn('market_hero_banners', 'sortOrder', 'INTEGER NOT NULL DEFAULT 1')
safeAddColumn('market_hero_banners', 'linkUrl', 'TEXT')

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_hero_banners_order
ON market_hero_banners(channelCode, bannerSlot, sortOrder, isActive);
`);

//=====================================================
// SECTION 05-1-2 : MARKET BRAND AD TEXT CONFIG
// ROLE : CHANNEL BASED BRAND AD TITLE/DESCRIPTION CONFIG
//=====================================================

db.exec(`
CREATE TABLE IF NOT EXISTS market_brand_ad_configs(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channelCode TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  displayStatus TEXT NOT NULL DEFAULT 'VISIBLE'
  CHECK(displayStatus IN ('VISIBLE','HIDDEN')),
  isActive INTEGER NOT NULL DEFAULT 1
  CHECK(isActive IN (0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_market_brand_ad_configs_channel
ON market_brand_ad_configs(channelCode);

CREATE INDEX IF NOT EXISTS idx_market_brand_ad_configs_active
ON market_brand_ad_configs(isActive, displayStatus);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS market_brand_ad_logos(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channelCode TEXT NOT NULL,
  imageAssetId INTEGER NOT NULL,
  sortOrder INTEGER NOT NULL DEFAULT 1,
  displayStatus TEXT NOT NULL DEFAULT 'VISIBLE'
  CHECK(displayStatus IN ('VISIBLE','HIDDEN')),
  isActive INTEGER NOT NULL DEFAULT 1
  CHECK(isActive IN (0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  deletedAt TEXT,
  FOREIGN KEY(imageAssetId) REFERENCES image_assets(id)
);

CREATE INDEX IF NOT EXISTS idx_market_brand_ad_logos_channel
ON market_brand_ad_logos(channelCode);

CREATE INDEX IF NOT EXISTS idx_market_brand_ad_logos_order
ON market_brand_ad_logos(channelCode, sortOrder, isActive);
`);

//=====================================================
// SECTION 05-1-1 : IMAGE ASSETS USAGE TYPE MIGRATION
// ROLE : POS PRODUCT THUMBNAIL USAGE TYPE SUPPORT
// RULE : image_assets keeps filePath as the only physical file path source
//=====================================================

const imageAssetsTableSqlRow = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type='table'
    AND name='image_assets'
  LIMIT 1
`).get() as { sql?: string } | undefined

const imageAssetsSupportsPosProductThumbnail =
  imageAssetsTableSqlRow?.sql?.includes(`'pos-product-thumbnail'`) ?? false

if (!imageAssetsSupportsPosProductThumbnail) {
  db.exec(`PRAGMA foreign_keys = OFF`)

  try {
    db.exec(`DROP TABLE IF EXISTS image_assets_new`)

    db.exec(`
      CREATE TABLE image_assets_new(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channelCode TEXT NOT NULL,
        usageType TEXT NOT NULL
        CHECK(usageType IN ('avatar','post','hero','gallery','place-thumbnail','pos-product-thumbnail')),
        fileName TEXT NOT NULL,
        filePath TEXT NOT NULL UNIQUE,
        mimeType TEXT,
        fileSize INTEGER,
        width INTEGER,
        height INTEGER,
        storageProvider TEXT,
        checksum TEXT,
        isActive INTEGER DEFAULT 1,
        lastUsedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    db.exec(`
      INSERT INTO image_assets_new(
        id,
        channelCode,
        usageType,
        fileName,
        filePath,
        mimeType,
        fileSize,
        width,
        height,
        storageProvider,
        checksum,
        isActive,
        lastUsedAt,
        createdAt
      )
      SELECT
        id,
        channelCode,
        usageType,
        fileName,
        filePath,
        mimeType,
        fileSize,
        width,
        height,
        storageProvider,
        checksum,
        COALESCE(isActive, 1),
        lastUsedAt,
        COALESCE(createdAt, CURRENT_TIMESTAMP)
      FROM image_assets
    `)

    db.exec(`DROP TABLE image_assets`)
    db.exec(`ALTER TABLE image_assets_new RENAME TO image_assets`)

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_image_assets_channel
      ON image_assets(channelCode);

      CREATE INDEX IF NOT EXISTS idx_image_assets_usage
      ON image_assets(usageType);

      CREATE INDEX IF NOT EXISTS idx_image_assets_active
      ON image_assets(isActive);

      CREATE INDEX IF NOT EXISTS idx_image_assets_created
      ON image_assets(createdAt);
    `)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}

//=====================================================
// SECTION 05-1-2 : IMAGE ASSETS BARCODE PRODUCT USAGE TYPE
// ROLE : BARCODE PRODUCT THUMBNAIL USAGE TYPE SUPPORT
// RULE : image_assets keeps filePath as the only physical file path source
//=====================================================

const imageAssetsTableSqlForBarcodeRow = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type='table'
    AND name='image_assets'
  LIMIT 1
`).get() as { sql?: string } | undefined

const imageAssetsTableSqlForBarcode = imageAssetsTableSqlForBarcodeRow && imageAssetsTableSqlForBarcodeRow.sql
  ? imageAssetsTableSqlForBarcodeRow.sql
  : ''

const imageAssetsSupportsBarcodeProductThumbnail =
  imageAssetsTableSqlForBarcode.includes(`'BARCODE_PRODUCT_THUMBNAIL'`)

const imageAssetsHasProfileForeignKey =
  imageAssetsTableSqlForBarcode.includes('REFERENCES profiles')

if (!imageAssetsSupportsBarcodeProductThumbnail || imageAssetsHasProfileForeignKey) {
  db.exec(`PRAGMA foreign_keys = OFF`)

  try {
    db.exec(`DROP TABLE IF EXISTS image_assets_new`)

    db.exec(`
      CREATE TABLE image_assets_new(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channelCode TEXT NOT NULL,
        usageType TEXT NOT NULL
        CHECK(usageType IN ('avatar','post','hero','gallery','place-thumbnail','pos-product-thumbnail','BARCODE_PRODUCT_THUMBNAIL')),
        fileName TEXT NOT NULL,
        filePath TEXT NOT NULL UNIQUE,
        mimeType TEXT,
        fileSize INTEGER,
        width INTEGER,
        height INTEGER,
        storageProvider TEXT,
        checksum TEXT,
        isActive INTEGER DEFAULT 1,
        lastUsedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    db.exec(`
      INSERT INTO image_assets_new(
        id,
        channelCode,
        usageType,
        fileName,
        filePath,
        mimeType,
        fileSize,
        width,
        height,
        storageProvider,
        checksum,
        isActive,
        lastUsedAt,
        createdAt
      )
      SELECT
        id,
        channelCode,
        usageType,
        fileName,
        filePath,
        mimeType,
        fileSize,
        width,
        height,
        storageProvider,
        checksum,
        COALESCE(isActive, 1),
        lastUsedAt,
        COALESCE(createdAt, CURRENT_TIMESTAMP)
      FROM image_assets
    `)

    db.exec(`DROP TABLE image_assets`)
    db.exec(`ALTER TABLE image_assets_new RENAME TO image_assets`)

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_image_assets_channel
      ON image_assets(channelCode);

      CREATE INDEX IF NOT EXISTS idx_image_assets_usage
      ON image_assets(usageType);

      CREATE INDEX IF NOT EXISTS idx_image_assets_active
      ON image_assets(isActive);

      CREATE INDEX IF NOT EXISTS idx_image_assets_created
      ON image_assets(createdAt);
    `)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}

//=====================================================
// SECTION 05-1-3 : IMAGE ASSETS BUSINESS REGISTRATION USAGE TYPE
// ROLE : BUSINESS REGISTRATION IMAGE RELATION SUPPORT
// RULE : image_assets keeps filePath as the only physical file path source
//=====================================================

const imageAssetsTableSqlForBusinessRegistrationRow = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type='table'
    AND name='image_assets'
  LIMIT 1
`).get() as { sql?: string } | undefined

const imageAssetsTableSqlForBusinessRegistration =
  imageAssetsTableSqlForBusinessRegistrationRow && imageAssetsTableSqlForBusinessRegistrationRow.sql
    ? imageAssetsTableSqlForBusinessRegistrationRow.sql
    : ''

const imageAssetsSupportsBusinessRegistration =
  imageAssetsTableSqlForBusinessRegistration.includes(`'BUSINESS_REGISTRATION'`)

if (!imageAssetsSupportsBusinessRegistration) {
  db.exec(`PRAGMA foreign_keys = OFF`)

  try {
    db.exec(`DROP TABLE IF EXISTS image_assets_new`)

    db.exec(`
      CREATE TABLE image_assets_new(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channelCode TEXT NOT NULL,
        usageType TEXT NOT NULL
        CHECK(usageType IN ('avatar','post','hero','gallery','place-thumbnail','pos-product-thumbnail','BARCODE_PRODUCT_THUMBNAIL','BUSINESS_REGISTRATION')),
        fileName TEXT NOT NULL,
        filePath TEXT NOT NULL UNIQUE,
        mimeType TEXT,
        fileSize INTEGER,
        width INTEGER,
        height INTEGER,
        storageProvider TEXT,
        checksum TEXT,
        isActive INTEGER DEFAULT 1,
        lastUsedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    db.exec(`
      INSERT INTO image_assets_new(
        id,
        channelCode,
        usageType,
        fileName,
        filePath,
        mimeType,
        fileSize,
        width,
        height,
        storageProvider,
        checksum,
        isActive,
        lastUsedAt,
        createdAt
      )
      SELECT
        id,
        channelCode,
        usageType,
        fileName,
        filePath,
        mimeType,
        fileSize,
        width,
        height,
        storageProvider,
        checksum,
        COALESCE(isActive, 1),
        lastUsedAt,
        COALESCE(createdAt, CURRENT_TIMESTAMP)
      FROM image_assets
    `)

    db.exec(`DROP TABLE image_assets`)
    db.exec(`ALTER TABLE image_assets_new RENAME TO image_assets`)

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_image_assets_channel
      ON image_assets(channelCode);

      CREATE INDEX IF NOT EXISTS idx_image_assets_usage
      ON image_assets(usageType);

      CREATE INDEX IF NOT EXISTS idx_image_assets_active
      ON image_assets(isActive);

      CREATE INDEX IF NOT EXISTS idx_image_assets_created
      ON image_assets(createdAt);
    `)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}


// ==================================================
// SECTION 06 : PROFILES (CHANNEL IDENTITY FINAL + INDUSTRY + BUSINESS TYPE)
// RULE : 1 ACCOUNT = 1 BASECODE / profiles.channelCode = owner root identity
// BUSINESS TYPE : BUSINESS profile only / GENERAL profile must use NULL
// ==================================================

db.exec(`

CREATE TABLE IF NOT EXISTS profiles(

id INTEGER PRIMARY KEY AUTOINCREMENT,

userId INTEGER NOT NULL,

profileType TEXT NOT NULL
CHECK(profileType IN('GENERAL','BUSINESS')),

baseCode TEXT NOT NULL
CHECK(length(baseCode)=12),

displayName TEXT,

bio TEXT,

channelCode TEXT NOT NULL UNIQUE
CHECK(length(channelCode)=13),

channelURL TEXT NOT NULL UNIQUE,

channelName TEXT,

contactPhone TEXT DEFAULT null,

secondaryPhone TEXT,

faxNumber TEXT,

managerEmail TEXT,

activityRegionId INTEGER,

feedRegionId INTEGER,

detailAddress TEXT,

mainAddressCode TEXT
CHECK(
  mainAddressCode IS NULL
  OR length(mainAddressCode)=12
),

subAddressCode TEXT
CHECK(
  subAddressCode IS NULL
  OR length(subAddressCode)=12
),

addressCode24 TEXT
CHECK(
  addressCode24 IS NULL
  OR length(addressCode24)=24
),

roadAddress TEXT,

businessRegistrationNumber TEXT,

loginPasswordHash TEXT,

loginPasswordSetAt TEXT,

loginPasswordUpdatedAt TEXT,

loginPasswordFailCount INTEGER NOT NULL DEFAULT 0
CHECK(loginPasswordFailCount >= 0),

loginPasswordLockedUntil TEXT,

paymentPasswordHash TEXT,

paymentPasswordSetAt TEXT,

paymentPasswordUpdatedAt TEXT,

paymentPasswordFailCount INTEGER NOT NULL DEFAULT 0
CHECK(paymentPasswordFailCount >= 0),

paymentPasswordLockedUntil TEXT,

businessTypeId INTEGER,

businessTypeCode TEXT
CHECK(
  businessTypeCode IS NULL
  OR businessTypeCode IN(
    'NORMAL',
    'STORE',
    'SHOPPING_MALL',
    'FREELANCER',
    'MOBILE_BIZ'
  )
),

partnerTypeCode TEXT
CHECK(
  partnerTypeCode IS NULL
  OR partnerTypeCode IN(
    'MAKER',
    'PROVIDER',
    'CUSTOMER',
    'OPEN_MARKET'
  )
),

placeFeedTypeCode TEXT
CHECK(
  placeFeedTypeCode IS NULL
  OR placeFeedTypeCode IN(
    'NORMAL',
    'CLASSIC',
    'MARKET',
    'FOOD',
    'BEAUTY',
    'CULTURE',
    'STAY',
    'RENTCAR',
    'ONLINE_SHOP'
  )
),

operationGrade INTEGER NOT NULL DEFAULT 0
CHECK(operationGrade IN(0,1,2,3)),

governanceTier INTEGER NOT NULL DEFAULT 0
CHECK(governanceTier IN(0,11,12)),

governanceSymbol TEXT,

governanceMetadata TEXT,

primaryIndustryId INTEGER,
primaryIndustrySubtypeId INTEGER,
primaryIndustryCode TEXT,
primaryIndustrySubtypeCode TEXT,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,

UNIQUE(baseCode, profileType),
UNIQUE(userId, profileType),

CHECK(substr(channelCode,2)=baseCode),

CHECK(
  (profileType='GENERAL' AND substr(channelCode,1,1)='A')
  OR
  (profileType='BUSINESS' AND substr(channelCode,1,1)='B')
),

CHECK(
  (profileType='GENERAL' AND businessTypeCode IS NULL)
  OR
  (profileType='BUSINESS' AND businessTypeCode IN(
    'NORMAL',
    'STORE',
    'SHOPPING_MALL',
    'FREELANCER',
    'MOBILE_BIZ'
  ))
),

CHECK(
  (profileType='GENERAL' AND partnerTypeCode IS NULL)
  OR
  (profileType='BUSINESS' AND partnerTypeCode IN(
    'MAKER',
    'PROVIDER',
    'CUSTOMER',
    'OPEN_MARKET'
  ))
),

CHECK(
  (profileType='GENERAL' AND placeFeedTypeCode IS NULL)
  OR
  (profileType='BUSINESS' AND placeFeedTypeCode IN(
    'NORMAL',
    'CLASSIC',
    'MARKET',
    'FOOD',
    'BEAUTY',
    'CULTURE',
    'STAY',
    'RENTCAR',
    'ONLINE_SHOP'
  ))
),

FOREIGN KEY(userId) REFERENCES users(id),
FOREIGN KEY(businessTypeId) REFERENCES business_types(id),
FOREIGN KEY(primaryIndustryId) REFERENCES industries(id),
FOREIGN KEY(primaryIndustrySubtypeId) REFERENCES industry_subtypes(id),
FOREIGN KEY(activityRegionId) REFERENCES regions(id),
FOREIGN KEY(feedRegionId) REFERENCES regions(id)

)

`)

//===================================================
// SECTION 06-A : PROFILES CHECK MIGRATION (NORMAL SUPPORT)
//===================================================

const profilesTableSqlRow = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type='table'
    AND name='profiles'
  LIMIT 1
`).get() as { sql?: string } | undefined

const profilesSupportsNormalBusinessType =
  profilesTableSqlRow?.sql?.includes(`'NORMAL'`) ?? false

if (!profilesSupportsNormalBusinessType) {
  db.exec(`PRAGMA foreign_keys = OFF`)

  try {
    db.exec(`DROP TABLE IF EXISTS profiles_new`)

    db.exec(`
    CREATE TABLE profiles_new(

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      userId INTEGER NOT NULL,

      profileType TEXT NOT NULL
      CHECK(profileType IN('GENERAL','BUSINESS')),

      baseCode TEXT NOT NULL
      CHECK(length(baseCode)=12),

      displayName TEXT,

      bio TEXT,

      channelCode TEXT NOT NULL UNIQUE
      CHECK(length(channelCode)=13),

      channelURL TEXT NOT NULL UNIQUE,

      channelName TEXT,

      contactPhone TEXT DEFAULT null,

      secondaryPhone TEXT,

      faxNumber TEXT,

      managerEmail TEXT,

      activityRegionId INTEGER,

      feedRegionId INTEGER,

      detailAddress TEXT,

      businessTypeId INTEGER,

      businessTypeCode TEXT
      CHECK(
        businessTypeCode IS NULL
        OR businessTypeCode IN(
          'NORMAL',
          'STORE',
          'SHOPPING_MALL',
          'FREELANCER',
          'MOBILE_BIZ'
        )
      ),

      placeFeedTypeCode TEXT
      CHECK(
        placeFeedTypeCode IS NULL
        OR placeFeedTypeCode IN(
          'NORMAL',
          'CLASSIC',
          'MARKET',
          'FOOD',
          'BEAUTY',
          'CULTURE',
          'STAY',
          'RENTCAR',
          'ONLINE_SHOP'
        )
      ),

      primaryIndustryId INTEGER,
      primaryIndustrySubtypeId INTEGER,
      primaryIndustryCode TEXT,
      primaryIndustrySubtypeCode TEXT,

      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(baseCode, profileType),
      UNIQUE(userId, profileType),

      CHECK(substr(channelCode,2)=baseCode),

      CHECK(
        (profileType='GENERAL' AND substr(channelCode,1,1)='A')
        OR
        (profileType='BUSINESS' AND substr(channelCode,1,1)='B')
      ),

      CHECK(
        (profileType='GENERAL' AND businessTypeCode IS NULL)
        OR
        (profileType='BUSINESS' AND businessTypeCode IN(
          'NORMAL',
          'STORE',
          'SHOPPING_MALL',
          'FREELANCER',
          'MOBILE_BIZ'
        ))
      ),

      CHECK(
        (profileType='GENERAL' AND placeFeedTypeCode IS NULL)
        OR
        (profileType='BUSINESS' AND placeFeedTypeCode IN(
          'NORMAL',
          'CLASSIC',
          'MARKET',
          'FOOD',
          'BEAUTY',
          'CULTURE',
          'STAY',
          'RENTCAR',
          'ONLINE_SHOP'
        ))
      ),

      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(businessTypeId) REFERENCES business_types(id),
      FOREIGN KEY(primaryIndustryId) REFERENCES industries(id),
      FOREIGN KEY(primaryIndustrySubtypeId) REFERENCES industry_subtypes(id),
      FOREIGN KEY(activityRegionId) REFERENCES regions(id),
      FOREIGN KEY(feedRegionId) REFERENCES regions(id)
    )
    `)

    db.exec(`
    INSERT INTO profiles_new(
      id,
      userId,
      profileType,
      baseCode,
      displayName,
      bio,
      channelCode,
      channelURL,
      channelName,
      contactPhone,
      activityRegionId,
      feedRegionId,
      detailAddress,
      businessTypeId,
      businessTypeCode,
      placeFeedTypeCode,
      primaryIndustryId,
      primaryIndustrySubtypeId,
      primaryIndustryCode,
      primaryIndustrySubtypeCode,
      createdAt,
      updatedAt
    )
    SELECT
      id,
      userId,
      profileType,
      baseCode,
      displayName,
      bio,
      channelCode,
      channelURL,
      channelName,
      contactPhone,
      activityRegionId,
      feedRegionId,
      detailAddress,
      businessTypeId,
      businessTypeCode,
      CASE
        WHEN profileType = 'BUSINESS' THEN 'NORMAL'
        ELSE NULL
      END,
      primaryIndustryId,
      primaryIndustrySubtypeId,
      primaryIndustryCode,
      primaryIndustrySubtypeCode,
      createdAt,
      updatedAt
    FROM profiles
    `)

    db.exec(`DROP TABLE profiles`)
    db.exec(`ALTER TABLE profiles_new RENAME TO profiles`)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}

//===================================================
// SECTION 06-0 : PROFILES BUSINESS TYPE SAFE ADD
// ROLE : EXISTING DB COLUMN MIGRATION
// TARGET : profiles.businessTypeId / profiles.businessTypeCode
// RULE : GENERAL = NULL / BUSINESS = NORMAL | STORE | FREELANCER | MOBILE_BIZ
//===================================================

safeAddColumn(
  'profiles',
  'businessTypeId',
  'INTEGER'
)

safeAddColumn(
  'profiles',
  'businessTypeCode',
  `TEXT CHECK(
    businessTypeCode IS NULL
    OR businessTypeCode IN(
      'NORMAL',
      'STORE',
      'SHOPPING_MALL',
      'FREELANCER',
      'MOBILE_BIZ'
    )
  )`
)

safeAddColumn(
  'profiles',
  'partnerTypeCode',
  `TEXT CHECK(
    partnerTypeCode IS NULL
    OR partnerTypeCode IN(
      'MAKER',
      'PROVIDER',
      'CUSTOMER',
      'OPEN_MARKET'
    )
  )`
)

safeAddColumn(
  'profiles',
  'placeFeedTypeCode',
  `TEXT CHECK(
    placeFeedTypeCode IS NULL
    OR placeFeedTypeCode IN(
      'NORMAL',
      'CLASSIC',
      'MARKET',
      'FOOD',
      'BEAUTY',
      'CULTURE',
      'STAY',
      'RENTCAR',
      'ONLINE_SHOP'
    )
  )`
)

safeAddColumn(
  'profiles',
  'businessRegistrationNumber',
  'TEXT'
)

safeAddColumn(
  'profiles',
  'secondaryPhone',
  'TEXT'
)

safeAddColumn(
  'profiles',
  'faxNumber',
  'TEXT'
)

safeAddColumn(
  'profiles',
  'managerEmail',
  'TEXT'
)

safeAddColumn(
  'profiles',
  'mainAddressCode',
  `TEXT CHECK(
    mainAddressCode IS NULL
    OR length(mainAddressCode)=12
  )`
)

safeAddColumn(
  'profiles',
  'subAddressCode',
  `TEXT CHECK(
    subAddressCode IS NULL
    OR length(subAddressCode)=12
  )`
)

safeAddColumn(
  'profiles',
  'addressCode24',
  `TEXT CHECK(
    addressCode24 IS NULL
    OR length(addressCode24)=24
  )`
)

safeAddColumn(
  'profiles',
  'roadAddress',
  'TEXT'
)

db.exec(`

UPDATE profiles
SET
  businessTypeId = NULL,
  businessTypeCode = NULL,
  placeFeedTypeCode = NULL
WHERE profileType = 'GENERAL'

`)

db.exec(`

UPDATE profiles
SET
  businessTypeId = COALESCE(
    businessTypeId,
    ${normalBusinessTypeId}
  ),
  businessTypeCode = COALESCE(
    businessTypeCode,
    'NORMAL'
  ),
  placeFeedTypeCode = COALESCE(
    placeFeedTypeCode,
    'NORMAL'
  )
WHERE profileType = 'BUSINESS'

`)

//===================================================
// SECTION 06-0-2 : PROFILE LOGIN PASSWORD SAFE ADD
// ROLE : PROFILE LEVEL LOGIN PASSWORD SECURITY
// RULE : GENERAL / BUSINESS can have separate login password
//===================================================

safeAddColumn(
  'profiles',
  'loginPasswordHash',
  'TEXT'
)

safeAddColumn(
  'profiles',
  'loginPasswordSetAt',
  'TEXT'
)

safeAddColumn(
  'profiles',
  'loginPasswordUpdatedAt',
  'TEXT'
)

safeAddColumn(
  'profiles',
  'loginPasswordFailCount',
  'INTEGER NOT NULL DEFAULT 0 CHECK(loginPasswordFailCount >= 0)'
)

safeAddColumn(
  'profiles',
  'loginPasswordLockedUntil',
  'TEXT'
)

db.exec(`

UPDATE profiles
SET loginPasswordFailCount = 0
WHERE loginPasswordFailCount IS NULL

`)

db.exec(`

UPDATE profiles
SET
  loginPasswordHash = (
    SELECT users.passwordHash
    FROM users
    WHERE users.id = profiles.userId
    LIMIT 1
  ),
  loginPasswordSetAt = COALESCE(loginPasswordSetAt, CURRENT_TIMESTAMP),
  loginPasswordUpdatedAt = COALESCE(loginPasswordUpdatedAt, CURRENT_TIMESTAMP)
WHERE loginPasswordHash IS NULL
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = profiles.userId
      AND users.passwordHash IS NOT NULL
  )

`)

db.exec(`

CREATE INDEX IF NOT EXISTS idx_profiles_login_password_set
ON profiles(loginPasswordSetAt)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS idx_profiles_login_password_locked
ON profiles(loginPasswordLockedUntil)

`)

//===================================================
// SECTION 06-0-1 : PROFILE PAYMENT PASSWORD SAFE ADD
// ROLE : PROFILE LEVEL PAYMENT PASSWORD SECURITY
// RULE : 2nd password = card / QR pay approval password
//===================================================

safeAddColumn(
  'profiles',
  'paymentPasswordHash',
  'TEXT'
)

safeAddColumn(
  'profiles',
  'paymentPasswordSetAt',
  'TEXT'
)

safeAddColumn(
  'profiles',
  'paymentPasswordUpdatedAt',
  'TEXT'
)

safeAddColumn(
  'profiles',
  'paymentPasswordFailCount',
  'INTEGER NOT NULL DEFAULT 0 CHECK(paymentPasswordFailCount >= 0)'
)

safeAddColumn(
  'profiles',
  'paymentPasswordLockedUntil',
  'TEXT'
)

db.exec(`

UPDATE profiles
SET paymentPasswordFailCount = 0
WHERE paymentPasswordFailCount IS NULL

`)

db.exec(`

CREATE INDEX IF NOT EXISTS idx_profiles_payment_password_set
ON profiles(paymentPasswordSetAt)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS idx_profiles_payment_password_locked
ON profiles(paymentPasswordLockedUntil)

`)

//===================================================
// SECTION 06-0-3 : PROFILES PLACE FEED TYPE CLASSIC MIGRATION
// ROLE : SQLITE CHECK REBUILD FOR CLASSIC PLACE FEED TYPE
// RULE : GENERAL = NULL / BUSINESS = NORMAL | CLASSIC | PLACE TYPES
//===================================================

const profilesClassicTableSqlRow = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type='table'
    AND name='profiles'
  LIMIT 1
`).get() as { sql?: string } | undefined

const profilesSupportsClassicPlaceFeedType =
  profilesClassicTableSqlRow?.sql?.includes(`'CLASSIC'`) ?? false

if (!profilesSupportsClassicPlaceFeedType) {
  db.exec(`PRAGMA foreign_keys = OFF`)

  try {
    db.exec(`DROP TABLE IF EXISTS profiles_new`)

    db.exec(`
    CREATE TABLE profiles_new(

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      userId INTEGER NOT NULL,

      profileType TEXT NOT NULL
      CHECK(profileType IN('GENERAL','BUSINESS')),

      baseCode TEXT NOT NULL
      CHECK(length(baseCode)=12),

      displayName TEXT,

      bio TEXT,

      channelCode TEXT NOT NULL UNIQUE
      CHECK(length(channelCode)=13),

      channelURL TEXT NOT NULL UNIQUE,

      channelName TEXT,

      contactPhone TEXT DEFAULT null,

      secondaryPhone TEXT,

      faxNumber TEXT,

      managerEmail TEXT,

      activityRegionId INTEGER,

      feedRegionId INTEGER,

      detailAddress TEXT,

      businessRegistrationNumber TEXT,

      loginPasswordHash TEXT,

      loginPasswordSetAt TEXT,

      loginPasswordUpdatedAt TEXT,

      loginPasswordFailCount INTEGER NOT NULL DEFAULT 0
      CHECK(loginPasswordFailCount >= 0),

      loginPasswordLockedUntil TEXT,

      paymentPasswordHash TEXT,

      paymentPasswordSetAt TEXT,

      paymentPasswordUpdatedAt TEXT,

      paymentPasswordFailCount INTEGER NOT NULL DEFAULT 0
      CHECK(paymentPasswordFailCount >= 0),

      paymentPasswordLockedUntil TEXT,

      businessTypeId INTEGER,

      businessTypeCode TEXT
      CHECK(
        businessTypeCode IS NULL
        OR businessTypeCode IN(
          'NORMAL',
          'STORE',
          'SHOPPING_MALL',
          'FREELANCER',
          'MOBILE_BIZ'
        )
      ),

      placeFeedTypeCode TEXT
      CHECK(
        placeFeedTypeCode IS NULL
        OR placeFeedTypeCode IN(
          'NORMAL',
          'CLASSIC',
          'MARKET',
          'FOOD',
          'BEAUTY',
          'CULTURE',
          'STAY',
          'RENTCAR',
          'ONLINE_SHOP'
        )
      ),

      primaryIndustryId INTEGER,
      primaryIndustrySubtypeId INTEGER,
      primaryIndustryCode TEXT,
      primaryIndustrySubtypeCode TEXT,

      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(baseCode, profileType),
      UNIQUE(userId, profileType),

      CHECK(substr(channelCode,2)=baseCode),

      CHECK(
        (profileType='GENERAL' AND substr(channelCode,1,1)='A')
        OR
        (profileType='BUSINESS' AND substr(channelCode,1,1)='B')
      ),

      CHECK(
        (profileType='GENERAL' AND businessTypeCode IS NULL)
        OR
        (profileType='BUSINESS' AND businessTypeCode IN(
          'NORMAL',
          'STORE',
          'SHOPPING_MALL',
          'FREELANCER',
          'MOBILE_BIZ'
        ))
      ),

      CHECK(
        (profileType='GENERAL' AND placeFeedTypeCode IS NULL)
        OR
        (profileType='BUSINESS' AND placeFeedTypeCode IN(
          'NORMAL',
          'CLASSIC',
          'MARKET',
          'FOOD',
          'BEAUTY',
          'CULTURE',
          'STAY',
          'RENTCAR',
          'ONLINE_SHOP'
        ))
      ),

      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(businessTypeId) REFERENCES business_types(id),
      FOREIGN KEY(primaryIndustryId) REFERENCES industries(id),
      FOREIGN KEY(primaryIndustrySubtypeId) REFERENCES industry_subtypes(id),
      FOREIGN KEY(activityRegionId) REFERENCES regions(id),
      FOREIGN KEY(feedRegionId) REFERENCES regions(id)
    )
    `)

    db.exec(`
    INSERT INTO profiles_new(
      id,
      userId,
      profileType,
      baseCode,
      displayName,
      bio,
      channelCode,
      channelURL,
      channelName,
      contactPhone,
      secondaryPhone,
      faxNumber,
      managerEmail,
      activityRegionId,
      feedRegionId,
      detailAddress,
      businessRegistrationNumber,
      loginPasswordHash,
      loginPasswordSetAt,
      loginPasswordUpdatedAt,
      loginPasswordFailCount,
      loginPasswordLockedUntil,
      paymentPasswordHash,
      paymentPasswordSetAt,
      paymentPasswordUpdatedAt,
      paymentPasswordFailCount,
      paymentPasswordLockedUntil,
      businessTypeId,
      businessTypeCode,
      placeFeedTypeCode,
      primaryIndustryId,
      primaryIndustrySubtypeId,
      primaryIndustryCode,
      primaryIndustrySubtypeCode,
      createdAt,
      updatedAt
    )
    SELECT
      id,
      userId,
      profileType,
      baseCode,
      displayName,
      bio,
      channelCode,
      channelURL,
      channelName,
      contactPhone,
      secondaryPhone,
      faxNumber,
      managerEmail,
      activityRegionId,
      feedRegionId,
      detailAddress,
      businessRegistrationNumber,
      loginPasswordHash,
      loginPasswordSetAt,
      loginPasswordUpdatedAt,
      COALESCE(loginPasswordFailCount, 0),
      loginPasswordLockedUntil,
      paymentPasswordHash,
      paymentPasswordSetAt,
      paymentPasswordUpdatedAt,
      COALESCE(paymentPasswordFailCount, 0),
      paymentPasswordLockedUntil,
      businessTypeId,
      businessTypeCode,
      placeFeedTypeCode,
      primaryIndustryId,
      primaryIndustrySubtypeId,
      primaryIndustryCode,
      primaryIndustrySubtypeCode,
      createdAt,
      updatedAt
    FROM profiles
    `)

    db.exec(`DROP TABLE profiles`)
    db.exec(`ALTER TABLE profiles_new RENAME TO profiles`)

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_profiles_login_password_set
      ON profiles(loginPasswordSetAt);

      CREATE INDEX IF NOT EXISTS idx_profiles_login_password_locked
      ON profiles(loginPasswordLockedUntil);

      CREATE INDEX IF NOT EXISTS idx_profiles_payment_password_set
      ON profiles(paymentPasswordSetAt);

      CREATE INDEX IF NOT EXISTS idx_profiles_payment_password_locked
      ON profiles(paymentPasswordLockedUntil);
    `)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}

//===================================================
// SECTION 06-0-4 : PROFILES BUSINESS TYPE SHOPPING MALL MIGRATION
// ROLE : SQLITE CHECK REBUILD FOR SHOPPING_MALL BUSINESS TYPE
// RULE : GENERAL = NULL / BUSINESS = NORMAL | STORE | SHOPPING_MALL | FREELANCER | MOBILE_BIZ
//===================================================

const profilesShoppingMallTableSqlRow = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type='table'
    AND name='profiles'
  LIMIT 1
`).get() as { sql?: string } | undefined

const profilesSupportsShoppingMallBusinessType =
  profilesShoppingMallTableSqlRow?.sql?.includes(`'SHOPPING_MALL'`) ?? false

if (!profilesSupportsShoppingMallBusinessType) {
  const currentProfilesSql =
    profilesShoppingMallTableSqlRow?.sql ?? ''
  const nextProfilesSql =
    currentProfilesSql
      .replace(
        /CREATE TABLE "?profiles"?/i,
        'CREATE TABLE profiles_new'
      )
      .replaceAll(
        "'STORE',\n          'FREELANCER'",
        "'STORE',\n          'SHOPPING_MALL',\n          'FREELANCER'"
      )
      .replaceAll(
        "'STORE',\n        'FREELANCER'",
        "'STORE',\n        'SHOPPING_MALL',\n        'FREELANCER'"
      )
      .replaceAll(
        "'STORE',\r\n          'FREELANCER'",
        "'STORE',\r\n          'SHOPPING_MALL',\r\n          'FREELANCER'"
      )
      .replaceAll(
        "'STORE',\r\n        'FREELANCER'",
        "'STORE',\r\n        'SHOPPING_MALL',\r\n        'FREELANCER'"
      )

  if (!nextProfilesSql.includes(`'SHOPPING_MALL'`)) {
    throw new Error('profiles businessTypeCode SHOPPING_MALL migration failed')
  }

  const profileColumns =
    db.prepare(`PRAGMA table_info(profiles)`).all() as Array<{ name: string }>
  const profileColumnNames =
    profileColumns.map((column) => column.name)
  const profileColumnList =
    profileColumnNames.join(', ')

  db.exec(`PRAGMA foreign_keys = OFF`)

  try {
    db.exec(`DROP TABLE IF EXISTS profiles_new`)
    db.exec(nextProfilesSql)
    db.exec(`
      INSERT INTO profiles_new(${profileColumnList})
      SELECT ${profileColumnList}
      FROM profiles
    `)
    db.exec(`DROP TABLE profiles`)
    db.exec(`ALTER TABLE profiles_new RENAME TO profiles`)

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_profiles_businessTypeCode
      ON profiles(businessTypeCode);

      CREATE INDEX IF NOT EXISTS idx_profiles_place_feed_type
      ON profiles(placeFeedTypeCode);

      CREATE INDEX IF NOT EXISTS idx_profiles_login_password_set
      ON profiles(loginPasswordSetAt);

      CREATE INDEX IF NOT EXISTS idx_profiles_login_password_locked
      ON profiles(loginPasswordLockedUntil);

      CREATE INDEX IF NOT EXISTS idx_profiles_payment_password_set
      ON profiles(paymentPasswordSetAt);

      CREATE INDEX IF NOT EXISTS idx_profiles_payment_password_locked
      ON profiles(paymentPasswordLockedUntil);
    `)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}

//===================================================
// SECTION 06-0-5 : PROFILES PLACE FEED TYPE ONLINE SHOP MIGRATION
// ROLE : SQLITE CHECK REBUILD FOR ONLINE COMMERCE PLACE FEED TYPE
// RULE : ONLINE_SHOP uses MARKET projection route without changing existing types
//===================================================

const profilesOnlineShopTableSqlRow = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type='table'
    AND name='profiles'
  LIMIT 1
`).get() as { sql?: string } | undefined

const profilesSupportsOnlineShopPlaceFeedType =
  profilesOnlineShopTableSqlRow?.sql?.includes(`'ONLINE_SHOP'`) ?? false

if (!profilesSupportsOnlineShopPlaceFeedType) {
  const currentProfilesSql =
    profilesOnlineShopTableSqlRow?.sql ?? ''
  const nextProfilesSql =
    currentProfilesSql
      .replace(
        /CREATE TABLE "?profiles"?/i,
        'CREATE TABLE profiles_new'
      )
      .replace(
        /'RENTCAR'(\s*\)\))/g,
        "'RENTCAR',\n    'ONLINE_SHOP'$1"
      )
      .replace(
        /'RENTCAR'(\s*\))/g,
        "'RENTCAR',\n    'ONLINE_SHOP'$1"
      )

  if (!nextProfilesSql.includes(`'ONLINE_SHOP'`)) {
    throw new Error('profiles placeFeedTypeCode ONLINE_SHOP migration failed')
  }

  const profileColumns =
    db.prepare(`PRAGMA table_info(profiles)`).all() as Array<{ name: string }>
  const profileColumnNames =
    profileColumns.map((column) => column.name)
  const profileColumnList =
    profileColumnNames.join(', ')

  db.exec(`PRAGMA foreign_keys = OFF`)

  try {
    db.exec(`DROP TABLE IF EXISTS profiles_new`)
    db.exec(nextProfilesSql)
    db.exec(`
      INSERT INTO profiles_new(${profileColumnList})
      SELECT ${profileColumnList}
      FROM profiles
    `)
    db.exec(`DROP TABLE profiles`)
    db.exec(`ALTER TABLE profiles_new RENAME TO profiles`)

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_profiles_businessTypeCode
      ON profiles(businessTypeCode);

      CREATE INDEX IF NOT EXISTS idx_profiles_place_feed_type
      ON profiles(placeFeedTypeCode);

      CREATE INDEX IF NOT EXISTS idx_profiles_login_password_set
      ON profiles(loginPasswordSetAt);

      CREATE INDEX IF NOT EXISTS idx_profiles_login_password_locked
      ON profiles(loginPasswordLockedUntil);

      CREATE INDEX IF NOT EXISTS idx_profiles_payment_password_set
      ON profiles(paymentPasswordSetAt);

      CREATE INDEX IF NOT EXISTS idx_profiles_payment_password_locked
      ON profiles(paymentPasswordLockedUntil);
    `)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}

//===================================================
// SECTION 06-0-6 : SECURITY QR AUTH SCHEMA
// ROLE : 3RD QR POSSESSION AUTHENTICATION TABLES
// RULE : QR token hash only / 180 seconds / one-time token
//===================================================

initSecurityQrAuthSchema(db)

//===================================================
// SECTION 06-0-7 : WALLET LEDGER SCHEMA
// ROLE : CHANNEL ASSET SNAPSHOT + ABSOLUTE LEDGER
// RULE : wallets.balance is cache / wallet_ledger is source of truth
//===================================================

initWalletLedgerSchema(db)

const walletsTableSqlRow = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type='table'
    AND name='wallets'
  LIMIT 1
`).get() as { sql?: string } | undefined

const walletLedgerTableSqlRow = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type='table'
    AND name='wallet_ledger'
  LIMIT 1
`).get() as { sql?: string } | undefined

const finalWalletAssetTypes = [
  'KRW_CASH',
  'USD_CASH',
  'JPY_CASH',
  'CNY_CASH',
  'EUR_CASH',
  'GBP_CASH',
  'AED_CASH',
  'POINT'
] as const

const walletsSupportsFinalAssetTypes =
  finalWalletAssetTypes.every(
    (assetType) =>
      walletsTableSqlRow?.sql?.includes(`'${assetType}'`) ?? false
  )

const walletLedgerSupportsFinalAssetTypes =
  finalWalletAssetTypes.every(
    (assetType) =>
      walletLedgerTableSqlRow?.sql?.includes(`'${assetType}'`) ?? false
  ) &&
  (walletLedgerTableSqlRow?.sql?.includes(`'POINT_INIT_GRANT'`) ?? false)

if (!walletsSupportsFinalAssetTypes || !walletLedgerSupportsFinalAssetTypes) {
  const nextWalletsSql = `
CREATE TABLE wallets_new(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  walletId TEXT NOT NULL UNIQUE,
  channelCode TEXT NOT NULL,
  balance BIGINT NOT NULL DEFAULT 0
  CHECK(balance >= 0),
  assetType TEXT NOT NULL
  CHECK(assetType IN(
    'KRW_CASH',
    'USD_CASH',
    'JPY_CASH',
    'CNY_CASH',
    'EUR_CASH',
    'GBP_CASH',
    'AED_CASH',
    'POINT'
  )),
  status TEXT NOT NULL DEFAULT 'ACTIVE'
  CHECK(status IN(
    'ACTIVE',
    'LOCKED',
    'DISABLED'
  )),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)
)
`

  const nextWalletLedgerSql = `
CREATE TABLE wallet_ledger_new(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ledgerId TEXT NOT NULL UNIQUE,
  walletId TEXT NOT NULL,
  channelCode TEXT NOT NULL,
  ledgerType TEXT NOT NULL
  CHECK(ledgerType IN(
    'POINT_INIT_GRANT',
    'CASH_INIT_SET',
    'POINT_ADJUST'
  )),
  amount BIGINT NOT NULL
  CHECK(amount > 0),
  balanceAfter BIGINT NOT NULL
  CHECK(balanceAfter >= 0),
  assetType TEXT NOT NULL
  CHECK(assetType IN(
    'KRW_CASH',
    'USD_CASH',
    'JPY_CASH',
    'CNY_CASH',
    'EUR_CASH',
    'GBP_CASH',
    'AED_CASH',
    'POINT'
  )),
  isSandbox INTEGER NOT NULL DEFAULT 1
  CHECK(isSandbox IN(0,1)),
  reason TEXT,
  memo TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(walletId) REFERENCES wallets(walletId),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)
)
`

  db.exec(`PRAGMA foreign_keys = OFF`)
  try {
    db.exec(`DROP TABLE IF EXISTS wallets_new`)
    db.exec(`DROP TABLE IF EXISTS wallet_ledger_new`)

    db.exec(nextWalletsSql)
    db.exec(nextWalletLedgerSql)

    db.exec(`
      INSERT INTO wallets_new(
        id,
        walletId,
        channelCode,
        balance,
        assetType,
        status,
        createdAt,
        updatedAt
      )
      SELECT
        id,
        walletId,
        channelCode,
        CASE
          WHEN assetType = 'CASH' THEN 0
          WHEN assetType = 'POINT' THEN 1000000
          ELSE balance
        END AS balance,
        CASE
          WHEN assetType = 'CASH' THEN 'KRW_CASH'
          WHEN assetType = 'POINT' THEN 'POINT'
          ELSE assetType
        END AS assetType,
        status,
        createdAt,
        updatedAt
      FROM wallets
      WHERE assetType IN ('CASH', 'POINT')
    `)

    db.exec(`
      INSERT INTO wallet_ledger_new(
        id,
        ledgerId,
        walletId,
        channelCode,
        ledgerType,
        amount,
        balanceAfter,
        assetType,
        isSandbox,
        reason,
        memo,
        createdAt
      )
      SELECT
        id,
        ledgerId,
        walletId,
        channelCode,
        ledgerType,
        amount,
        balanceAfter,
        CASE
          WHEN assetType = 'CASH' THEN 'KRW_CASH'
          WHEN assetType = 'POINT' THEN 'POINT'
          ELSE assetType
        END AS assetType,
        isSandbox,
        memo AS reason,
        memo,
        createdAt
      FROM wallet_ledger
      WHERE assetType IN ('CASH', 'POINT')
    `)

    db.exec(`DROP TABLE wallet_ledger`)
    db.exec(`DROP TABLE wallets`)
    db.exec(`ALTER TABLE wallets_new RENAME TO wallets`)
    db.exec(`ALTER TABLE wallet_ledger_new RENAME TO wallet_ledger`)

    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_channel_asset
      ON wallets(channelCode, assetType);

      CREATE INDEX IF NOT EXISTS idx_wallets_channel
      ON wallets(channelCode);

      CREATE INDEX IF NOT EXISTS idx_wallets_asset_type
      ON wallets(assetType);

      CREATE INDEX IF NOT EXISTS idx_wallets_status
      ON wallets(status);

      CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet
      ON wallet_ledger(walletId);

      CREATE INDEX IF NOT EXISTS idx_wallet_ledger_channel
      ON wallet_ledger(channelCode);

      CREATE INDEX IF NOT EXISTS idx_wallet_ledger_asset_type
      ON wallet_ledger(assetType);

      CREATE INDEX IF NOT EXISTS idx_wallet_ledger_type
      ON wallet_ledger(ledgerType);

      CREATE INDEX IF NOT EXISTS idx_wallet_ledger_sandbox
      ON wallet_ledger(isSandbox);

      CREATE INDEX IF NOT EXISTS idx_wallet_ledger_created
      ON wallet_ledger(createdAt);

      CREATE INDEX IF NOT EXISTS idx_wallet_ledger_reason
      ON wallet_ledger(reason);
    `)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}

safeAddColumn(
  'wallet_ledger',
  'reason',
  'TEXT'
)

//===================================================
// SECTION 06-1A : PROFILES OPERATION GOVERNANCE SAFE ADD
// ROLE : REAL CAPABILITY LAYER + SYMBOLIC GOVERNANCE METADATA
// RULE : operationGrade controls capability / governance* is symbolic only
//===================================================

safeAddColumn(
  'profiles',
  'operationGrade',
  'INTEGER NOT NULL DEFAULT 0 CHECK(operationGrade IN(0,1,2,3))'
)

safeAddColumn(
  'profiles',
  'governanceTier',
  'INTEGER NOT NULL DEFAULT 0 CHECK(governanceTier IN(0,11,12))'
)

safeAddColumn(
  'profiles',
  'governanceSymbol',
  'TEXT'
)

safeAddColumn(
  'profiles',
  'governanceMetadata',
  'TEXT'
)

const profilesGovernanceTierTableSqlRow = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type='table'
    AND name='profiles'
  LIMIT 1
`).get() as { sql?: string } | undefined

const profilesSupportsGuardianAiGovernanceTier =
  profilesGovernanceTierTableSqlRow?.sql?.includes('governanceTier IN(0,11,12)') ?? false

if (!profilesSupportsGuardianAiGovernanceTier) {
  const currentProfilesSql =
    profilesGovernanceTierTableSqlRow?.sql ?? ''
  const nextProfilesSql =
    currentProfilesSql
      .replace(
        /CREATE TABLE "?profiles"?/i,
        'CREATE TABLE profiles_new'
      )
      .replace(
        'governanceTier IN(0,12)',
        'governanceTier IN(0,11,12)'
      )

  if (!nextProfilesSql.includes('governanceTier IN(0,11,12)')) {
    throw new Error('profiles governanceTier Guardian AI migration failed')
  }

  const profileColumns =
    db.prepare(`PRAGMA table_info(profiles)`).all() as Array<{ name: string }>
  const profileColumnNames =
    profileColumns.map((column) => column.name)
  const profileColumnList =
    profileColumnNames.join(', ')

  db.exec(`PRAGMA foreign_keys = OFF`)

  try {
    db.exec(`DROP TABLE IF EXISTS profiles_new`)
    db.exec(nextProfilesSql)
    db.exec(`
      INSERT INTO profiles_new(${profileColumnList})
      SELECT ${profileColumnList}
      FROM profiles
    `)
    db.exec(`DROP TABLE profiles`)
    db.exec(`ALTER TABLE profiles_new RENAME TO profiles`)

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_profiles_operation_grade
      ON profiles(operationGrade);

      CREATE INDEX IF NOT EXISTS idx_profiles_governance_tier
      ON profiles(governanceTier);
    `)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}

db.exec(`

CREATE INDEX IF NOT EXISTS idx_profiles_operation_grade
ON profiles(operationGrade)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS idx_profiles_governance_tier
ON profiles(governanceTier)

`)

//===================================================
// SECTION 06-1 : INDEX

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_profiles_business_registration_number

ON profiles(businessRegistrationNumber)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_profiles_businessType

ON profiles(businessTypeId)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_profiles_businessTypeCode

ON profiles(businessTypeCode)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_profiles_partner_type_code

ON profiles(partnerTypeCode)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_profiles_place_feed_type

ON profiles(placeFeedTypeCode)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_profiles_primaryIndustry

ON profiles(primaryIndustryId)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_profiles_primaryIndustrySubtype

ON profiles(primaryIndustrySubtypeId)

`)

db.exec(`

CREATE UNIQUE INDEX IF NOT EXISTS
idx_profiles_channel_url

ON profiles(channelURL)

`)

db.exec(`

CREATE UNIQUE INDEX IF NOT EXISTS
idx_profiles_user_profile_type

ON profiles(userId, profileType)

`)

db.exec(`

CREATE UNIQUE INDEX IF NOT EXISTS
idx_profiles_basecode_profile_type

ON profiles(baseCode, profileType)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_profiles_main_address_code

ON profiles(mainAddressCode)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_profiles_sub_address_code

ON profiles(subAddressCode)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_profiles_address_code24

ON profiles(addressCode24)

`)

//===================================================
// SECTION 06-2 : TEST PROFILES (1 ACCOUNT = 1 BASECODE)
// RULE : GENERAL businessType = NULL
// RULE : BUSINESS businessType = NORMAL | STORE | FREELANCER | MOBILE_BIZ
// DEFAULT TEST BUSINESS TYPE : NORMAL
//===================================================

const insertProfile = db.prepare(`

INSERT OR IGNORE INTO profiles(
userId,
profileType,
baseCode,
displayName,
channelCode,
channelURL,
contactPhone,
businessTypeId,
businessTypeCode,
placeFeedTypeCode
)

VALUES(?,?,?,?,?,?,?,?,?,?)

`)

/* ================================
TEST DATA
1 ACCOUNT = 1 BASECODE
GENERAL  = A + baseCode
BUSINESS = B + baseCode
GENERAL  = businessType NULL
BUSINESS = default NORMAL
================================ */

/* user1 baseCode = 144000012734 */

insertProfile.run(
  userId1,
  'GENERAL',
  '144000012734',
  'test1_general',
  'A144000012734',
  'xxx.com/@A144000012734',
  null,
  null,
  null,
  null
)

insertProfile.run(
  userId1,
  'BUSINESS',
  '144000012734',
  'test1_business',
  'B144000012734',
  'xxx.com/@B144000012734',
  null,
  normalBusinessTypeId,
  'NORMAL',
  'NORMAL'
)

db.prepare(`
UPDATE users
SET baseCode = '144000012734'
WHERE email = 'test11@prod.com'
`).run()

/* user2 baseCode = 012734144000 */

insertProfile.run(
  userId2,
  'GENERAL',
  '012734144000',
  'test2_general',
  'A012734144000',
  'xxx.com/@A012734144000',
  null,
  null,
  null,
  null
)

insertProfile.run(
  userId2,
  'BUSINESS',
  '012734144000',
  'test2_business',
  'B012734144000',
  'xxx.com/@B012734144000',
  null,
  normalBusinessTypeId,
  'NORMAL',
  'NORMAL'
)

db.prepare(`
UPDATE users
SET baseCode = '012734144000'
WHERE email = 'test12@prod.com'
`).run()

function updateExistingChannelReferences(
  previousChannelCode: string,
  nextChannelCode: string
) {
  const tableRows =
    db.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
    `).all() as Array<{ name: string }>

  for (const tableRow of tableRows) {
    const tableName = tableRow.name

    if (
      tableName === 'profiles' ||
      !/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName)
    ) {
      continue
    }

    const columns =
      db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
        name: string
      }>

    for (const column of columns) {
      if (
        !/^[A-Za-z_][A-Za-z0-9_]*$/.test(column.name) ||
        !column.name.toLowerCase().includes('channelcode')
      ) {
        continue
      }

      db.prepare(`
        UPDATE ${tableName}
        SET ${column.name} = ?
        WHERE ${column.name} = ?
      `).run(nextChannelCode, previousChannelCode)
    }
  }
}

db.exec(`PRAGMA foreign_keys = OFF`)

try {
for (const hnUser of hnSeedUsers) {
const previousBaseCode =
  hnUser.email === 'test01@prod.com' ? '000000000001' : hnUser.baseCode
const generalProfileDisplayName =
  hnUser.email === 'test01@prod.com'
    ? '그린 생활마트_general'
    : `${hnUser.displayName}_general`
const businessProfileDisplayName =
  hnUser.email === 'test01@prod.com'
    ? '그린 생활마트'
    : `${hnUser.displayName}_business`

if (previousBaseCode !== hnUser.baseCode) {
  updateExistingChannelReferences(
    `A${previousBaseCode}`,
    `A${hnUser.baseCode}`
  )
  updateExistingChannelReferences(
    `B${previousBaseCode}`,
    `B${hnUser.baseCode}`
  )
}

insertProfile.run(
    hnUser.userId,
    'GENERAL',
    hnUser.baseCode,
    generalProfileDisplayName,
    `A${hnUser.baseCode}`,
    `xxx.com/@A${hnUser.baseCode}`,
    null,
    null,
    null,
    null
  )

insertProfile.run(
    hnUser.userId,
    'BUSINESS',
    hnUser.baseCode,
    businessProfileDisplayName,
    `B${hnUser.baseCode}`,
    `xxx.com/@B${hnUser.baseCode}`,
    null,
    normalBusinessTypeId,
    'NORMAL',
    'NORMAL'
  )

db.prepare(`
  UPDATE profiles
  SET
    baseCode = ?,
    displayName = ?,
    channelCode = ?,
    channelURL = ?,
    contactPhone = ?,
    paymentPasswordHash = NULL,
    paymentPasswordSetAt = NULL,
    paymentPasswordUpdatedAt = NULL,
    paymentPasswordFailCount = 0,
    paymentPasswordLockedUntil = NULL,
    businessTypeId = NULL,
    businessTypeCode = NULL,
    placeFeedTypeCode = NULL,
    updatedAt = CURRENT_TIMESTAMP
  WHERE userId = ?
    AND profileType = 'GENERAL'
`).run(
    hnUser.baseCode,
    generalProfileDisplayName,
    `A${hnUser.baseCode}`,
    `xxx.com/@A${hnUser.baseCode}`,
    hnUser.phone,
    hnUser.userId
  )

db.prepare(`
  UPDATE profiles
  SET
    baseCode = ?,
    displayName = ?,
    channelCode = ?,
    channelURL = ?,
    contactPhone = ?,
    paymentPasswordHash = NULL,
    paymentPasswordSetAt = NULL,
    paymentPasswordUpdatedAt = NULL,
    paymentPasswordFailCount = 0,
    paymentPasswordLockedUntil = NULL,
    businessTypeId = COALESCE(businessTypeId, ${normalBusinessTypeId}),
    businessTypeCode = COALESCE(businessTypeCode, 'NORMAL'),
    placeFeedTypeCode = COALESCE(placeFeedTypeCode, 'NORMAL'),
    updatedAt = CURRENT_TIMESTAMP
  WHERE userId = ?
    AND profileType = 'BUSINESS'
`).run(
    hnUser.baseCode,
    businessProfileDisplayName,
    `B${hnUser.baseCode}`,
    `xxx.com/@B${hnUser.baseCode}`,
    hnUser.phone,
    hnUser.userId
)
}
} finally {
db.exec(`PRAGMA foreign_keys = ON`)
}

/* owner account baseCode = 012712392766 */

insertProfile.run(
  ownerAccountUserId,
  'GENERAL',
  '012712392766',
  'OWNER_ACCOUNT_GENERAL',
  'A012712392766',
  'xxx.com/@A012712392766',
  '010-1234-1234',
  null,
  null,
  null
)

insertProfile.run(
  ownerAccountUserId,
  'BUSINESS',
  '012712392766',
  'OWNER_ACCOUNT_BUSINESS',
  'B012712392766',
  'xxx.com/@B012712392766',
  '010-1234-1234',
  normalBusinessTypeId,
  'NORMAL',
  'NORMAL'
)

db.prepare(`
UPDATE profiles
SET
  baseCode = '012712392766',
  displayName = 'OWNER_ACCOUNT_GENERAL',
  channelCode = 'A012712392766',
  channelURL = 'xxx.com/@A012712392766',
  contactPhone = '010-1234-1234',
  businessTypeId = NULL,
  businessTypeCode = NULL,
  placeFeedTypeCode = NULL,
  operationGrade = 0,
  governanceTier = 0,
  governanceSymbol = NULL,
  governanceMetadata = NULL,
  updatedAt = CURRENT_TIMESTAMP
WHERE userId = ?
  AND profileType = 'GENERAL'
`).run(ownerAccountUserId)

db.prepare(`
UPDATE profiles
SET
  baseCode = '012712392766',
  displayName = 'OWNER_ACCOUNT_BUSINESS',
  channelCode = 'B012712392766',
  channelURL = 'xxx.com/@B012712392766',
  contactPhone = '010-1234-1234',
  businessTypeId = COALESCE(businessTypeId, ${normalBusinessTypeId}),
  businessTypeCode = COALESCE(businessTypeCode, 'NORMAL'),
  placeFeedTypeCode = COALESCE(placeFeedTypeCode, 'NORMAL'),
  updatedAt = CURRENT_TIMESTAMP
WHERE userId = ?
  AND profileType = 'BUSINESS'
`).run(ownerAccountUserId)

db.exec(`

UPDATE profiles
SET
  businessTypeId = COALESCE(businessTypeId, ${normalBusinessTypeId}),
  businessTypeCode = COALESCE(businessTypeCode, 'NORMAL'),
  placeFeedTypeCode = COALESCE(placeFeedTypeCode, 'NORMAL')
WHERE profileType = 'BUSINESS'
  AND displayName IN ('test1_business', 'test2_business')

`)

//===================================================
// SECTION 06-2-0 : TEST BUSINESS GOVERNANCE SEED
// ROLE : TEST BUSINESS PROFILE OPERATION/GOVERNANCE GRADE ONLY
// RULE : GENERAL profiles and users.userGrade are not touched here
//===================================================

db.prepare(`
UPDATE profiles
SET
  operationGrade = 2,
  governanceTier = 11,
  governanceSymbol = 'MASTER_ADMIN_GUARDIAN_AI_CHATGPT_MICAEL',
  updatedAt = CURRENT_TIMESTAMP
WHERE userId = ?
  AND profileType = 'BUSINESS'
`).run(userId1)

db.prepare(`
UPDATE profiles
SET
  operationGrade = 3,
  governanceTier = 12,
  governanceSymbol = 'GOD_SYMBOLIC_TIER',
  updatedAt = CURRENT_TIMESTAMP
WHERE userId = ?
  AND profileType = 'BUSINESS'
`).run(userId2)

//===================================================
// SECTION 06-2-1 : OWNER MASTER ADMIN GOVERNANCE SEED
// ROLE : BUSINESS PROFILE OPERATION GRADE + SYMBOLIC GOVERNANCE METADATA
// RULE : users are never created here / symbolic governance is not auth
//===================================================

const ownerMasterAdminEmail =
'hn0628@naver.com'

const ownerMasterAdminMetadata =
JSON.stringify({
  creatorEmail: 'hn0628@naver.com',
  creatorHandle: '7123927',
  publicMasterSymbol: '712392766',
  verse: '창세기 1:1',
  symbolicMeaning: 'creator origin public marker',
  role: 'OWNER_MASTER_ADMIN',
  assignedBy: 'SYSTEM_INIT',
  authUsable: false,
  capabilityUsable: false,
  securityRole: 'NONE'
})

const ownerMasterAdminUserRow = db.prepare(`
SELECT id
FROM users
WHERE email = ?
LIMIT 1
`).get(ownerMasterAdminEmail) as { id?: number } | undefined

if (!ownerMasterAdminUserRow?.id) {
  console.warn(`[WARN] OWNER_MASTER_ADMIN seed skipped. user not found: ${ownerMasterAdminEmail}`)
} else {
  const ownerMasterAdminBusinessProfileRow = db.prepare(`
  SELECT id
  FROM profiles
  WHERE userId = ?
    AND profileType = 'BUSINESS'
  LIMIT 1
  `).get(ownerMasterAdminUserRow.id) as { id?: number } | undefined

  if (!ownerMasterAdminBusinessProfileRow?.id) {
    console.warn(`[WARN] OWNER_MASTER_ADMIN seed skipped. BUSINESS profile not found: ${ownerMasterAdminEmail}`)
  } else {
    db.prepare(`
    UPDATE profiles
    SET
      operationGrade = 3,
      governanceTier = 12,
      governanceSymbol = 'OWNER_MASTER_ADMIN',
      governanceMetadata = ?,
      updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
      AND profileType = 'BUSINESS'
    `).run(
      ownerMasterAdminMetadata,
      ownerMasterAdminBusinessProfileRow.id
    )
  }
}

//===================================================
// SECTION 06-2-2 : SECURITY CREDENTIAL SEED
// ROLE : 1ST / 2ND / 3RD AUTH CREDENTIALS FOR OWNER + TEST BUSINESS CHANNELS
// RULE : password and emergency code are hash only / QR seed uses profile baseCode
//===================================================

const emergencyAccessCodeHash =
bcrypt.hashSync('217400',10)

const securityCredentialSeedRows =
db.prepare(`
SELECT
  u.email,
  u.passwordHash AS loginPasswordHash,
  p.channelCode,
  p.baseCode
FROM users u
INNER JOIN profiles p
  ON p.userId = u.id
WHERE (
    u.email IN (
      'test11@prod.com',
      'test12@prod.com',
      'test1@prod.com',
      'test2@prod.com',
      'test11@naver.com',
      'test12@naver.com',
      'hn0628@naver.com'
    )
    OR u.email = 'test01@prod.com'
    OR u.email BETWEEN 'hn0002@naver.com' AND 'hn0010@naver.com'
  )
  AND p.profileType = 'BUSINESS'
ORDER BY u.email
`).all() as Array<{
  email: string
  loginPasswordHash: string
  channelCode: string
  baseCode: string
}>

const upsertSecurityCredential =
db.prepare(`
INSERT INTO user_security_credentials(
  channelCode,
  loginPasswordHash,
  emergencyAccessCodeHash,
  qrBaseCode,
  qrStatus,
  createdAt,
  updatedAt
)
VALUES(?,?,?,?, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(channelCode) DO UPDATE SET
  loginPasswordHash = excluded.loginPasswordHash,
  emergencyAccessCodeHash = excluded.emergencyAccessCodeHash,
  qrBaseCode = excluded.qrBaseCode,
  qrStatus = 'ACTIVE',
  updatedAt = CURRENT_TIMESTAMP
`)

for (const credential of securityCredentialSeedRows) {
  upsertSecurityCredential.run(
    credential.channelCode,
    credential.loginPasswordHash,
    emergencyAccessCodeHash,
    credential.baseCode
  )
}

//===================================================
// SECTION 06-2-3 : WALLET CASH/POINT SPLIT SEED
// ROLE : CASH(정산) / POINT(테스트) 분리 고정
// RULE : CASH = 0 / POINT = 1000000 / wallet_ledger assetType 명시
//===================================================

const walletTargetChannelRows = db.prepare(`
SELECT DISTINCT p.channelCode
FROM profiles p
INNER JOIN users u
  ON u.id = p.userId
WHERE u.email IN (
    'hn0628@naver.com',
    'test11@prod.com',
    'test12@prod.com',
    'test1@prod.com',
    'test2@prod.com',
    'test11@naver.com',
    'test12@naver.com'
  )
  AND p.channelCode IS NOT NULL
`).all() as Array<{ channelCode?: string }>

const walletTargetChannelCodes =
  walletTargetChannelRows
    .map((row) => row.channelCode)
    .filter((channelCode): channelCode is string => Boolean(channelCode))

const upsertWalletForAsset = db.prepare(`
INSERT INTO wallets(
  walletId,
  channelCode,
  balance,
  assetType,
  status,
  createdAt,
  updatedAt
)
VALUES(?,?,?,?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT(channelCode, assetType) DO UPDATE SET
  balance = excluded.balance,
  status = 'ACTIVE',
  updatedAt = CURRENT_TIMESTAMP
`)

const insertPointInitLedger = db.prepare(`
INSERT OR IGNORE INTO wallet_ledger(
  ledgerId,
  walletId,
  channelCode,
  ledgerType,
  amount,
  balanceAfter,
  assetType,
  isSandbox,
  reason,
  memo,
  createdAt
)
VALUES(?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
`)

const pointInitLedgerMemo =
  'POINT 초기 지급 1000000'

const cashAssetTypes = [
  'KRW_CASH',
  'USD_CASH',
  'JPY_CASH',
  'CNY_CASH',
  'EUR_CASH',
  'GBP_CASH',
  'AED_CASH'
] as const

let cashWalletCount = 0
let pointWalletCount = 0
let pointLedgerInsertCount = 0

for (const channelCode of walletTargetChannelCodes) {
  for (const cashAssetType of cashAssetTypes) {
    upsertWalletForAsset.run(
      `wallet_${cashAssetType.toLowerCase()}_${channelCode}`,
      channelCode,
      0,
      cashAssetType
    )
    cashWalletCount += 1
  }

  upsertWalletForAsset.run(
    `wallet_point_${channelCode}`,
    channelCode,
    1_000_000,
    'POINT'
  )
  pointWalletCount += 1

  const pointWalletRow = db.prepare(`
    SELECT walletId
    FROM wallets
    WHERE channelCode = ?
      AND assetType = 'POINT'
    LIMIT 1
  `).get(channelCode) as { walletId?: string } | undefined

  if (!pointWalletRow?.walletId) {
    continue
  }

  const hasPointInitLedgerRow = db.prepare(`
    SELECT 1
    FROM wallet_ledger
    WHERE channelCode = ?
      AND assetType = 'POINT'
      AND ledgerType = 'POINT_INIT_GRANT'
      AND memo = ?
    LIMIT 1
  `).get(channelCode, pointInitLedgerMemo) as { 1?: number } | undefined

  if (!hasPointInitLedgerRow) {
    insertPointInitLedger.run(
      `ledger_point_init_${channelCode}`,
      pointWalletRow.walletId,
      channelCode,
      'POINT_INIT_GRANT',
      1_000_000,
      1_000_000,
      'POINT',
      1,
      pointInitLedgerMemo,
      pointInitLedgerMemo
    )
    pointLedgerInsertCount += 1
  }
}

db.exec(`
DELETE FROM wallet_ledger
WHERE assetType NOT IN (
  'KRW_CASH',
  'USD_CASH',
  'JPY_CASH',
  'CNY_CASH',
  'EUR_CASH',
  'GBP_CASH',
  'AED_CASH',
  'POINT'
)
`)

db.exec(`
DELETE FROM wallets
WHERE assetType NOT IN (
  'KRW_CASH',
  'USD_CASH',
  'JPY_CASH',
  'CNY_CASH',
  'EUR_CASH',
  'GBP_CASH',
  'AED_CASH',
  'POINT'
)
`)

db.exec(`
UPDATE wallets
SET balance = 1000000,
    status = 'ACTIVE',
    updatedAt = CURRENT_TIMESTAMP
WHERE assetType = 'POINT'
`)

db.exec(`
UPDATE wallets
SET balance = 0,
    status = 'ACTIVE',
    updatedAt = CURRENT_TIMESTAMP
WHERE assetType IN (
  'KRW_CASH',
  'USD_CASH',
  'JPY_CASH',
  'CNY_CASH',
  'EUR_CASH',
  'GBP_CASH',
  'AED_CASH'
)
`)

console.log(
  'WALLET CASH/POINT SEED RESULT ->',
  JSON.stringify({
    success: true,
    targetChannelCount: walletTargetChannelCodes.length,
    cashWalletCount,
    pointWalletCount,
    pointLedgerInsertCount,
    cashBalance: 0,
    pointBalance: 1_000_000
  })
)

//===================================================
// SECTION 06-3 : USERS BASECODE BACKFILL + CONSISTENCY WARN
//===================================================

db.exec(`

UPDATE users
SET baseCode = (
  SELECT p.baseCode
  FROM profiles p
  WHERE p.userId = users.id
  ORDER BY p.id ASC
  LIMIT 1
)
WHERE baseCode IS NULL
  AND EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.userId = users.id
      AND p.baseCode IS NOT NULL
  )

`)

const profileBaseCodeMismatchRows = db.prepare(`

SELECT userId, COUNT(DISTINCT baseCode) AS baseCodeCount
FROM profiles
GROUP BY userId
HAVING COUNT(DISTINCT baseCode) > 1

`).all() as Array<{ userId: number, baseCodeCount: number }>

if (profileBaseCodeMismatchRows.length > 0) {
  console.warn('[WARN] profiles baseCode mismatch detected. channelCode immutable policy applies.')

  for (const row of profileBaseCodeMismatchRows) {
    console.warn(`[WARN] userId=${row.userId} has ${row.baseCodeCount} distinct baseCodes in profiles`)
  }
}


//===================================================
// SECTION 06-4 : PROFILE AVATARS (OWNER CHANNEL CONSISTENCY FINAL)

db.exec(`
CREATE TABLE IF NOT EXISTS profile_avatars(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profileId INTEGER NOT NULL,
  channelCode TEXT NOT NULL,
  imageAssetId INTEGER NOT NULL,
  filePath TEXT NOT NULL,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(profileId) REFERENCES profiles(id),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(imageAssetId) REFERENCES image_assets(id)
);

CREATE INDEX IF NOT EXISTS idx_profile_avatar_profile
ON profile_avatars(profileId);

CREATE INDEX IF NOT EXISTS idx_profile_avatar_channel
ON profile_avatars(channelCode);

CREATE INDEX IF NOT EXISTS idx_profile_avatars_asset
ON profile_avatars(imageAssetId);
`);

//===================================================
// SECTION 06-4-1 : BUSINESS REGISTRATION IMAGES
// RULE : image_assets owns filePath / relation table only connects asset

db.exec(`
CREATE TABLE IF NOT EXISTS business_registration_images(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profileId INTEGER NOT NULL,
  channelCode TEXT NOT NULL,
  imageAssetId INTEGER NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0, 1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(profileId, imageAssetId),
  FOREIGN KEY(profileId) REFERENCES profiles(id),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(imageAssetId) REFERENCES image_assets(id)
);

CREATE INDEX IF NOT EXISTS idx_business_registration_images_profile
ON business_registration_images(profileId);

CREATE INDEX IF NOT EXISTS idx_business_registration_images_channel
ON business_registration_images(channelCode);

CREATE INDEX IF NOT EXISTS idx_business_registration_images_asset
ON business_registration_images(imageAssetId);
`);

//==================================================
// SECTION 06-4-2 : PROFILE CUSTOM DOMAINS
// RULE : custom domain maps external host to channelCode / channelCode remains identity

db.exec(`
CREATE TABLE IF NOT EXISTS profile_custom_domains(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  channel_code TEXT NOT NULL,
  custom_domain TEXT NOT NULL,
  domain_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(domain_status IN ('PENDING', 'ACTIVE', 'FAILED', 'DISABLED')),
  is_primary INTEGER NOT NULL DEFAULT 1 CHECK(is_primary IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY(profile_id) REFERENCES profiles(id),
  FOREIGN KEY(channel_code) REFERENCES profiles(channelCode)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_custom_domains_domain_active
ON profile_custom_domains(custom_domain)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_custom_domains_primary_active
ON profile_custom_domains(channel_code)
WHERE is_primary = 1
  AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profile_custom_domains_channel
ON profile_custom_domains(channel_code);

CREATE INDEX IF NOT EXISTS idx_profile_custom_domains_domain
ON profile_custom_domains(custom_domain);
`);

//==================================================
// SECTION 06-4-3 : MARKET FULFILLMENT SETTINGS
// RULE : channelCode owns available delivery / pickup fulfillment types

db.exec(`
CREATE TABLE IF NOT EXISTS market_fulfillment_settings(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  channel_code TEXT NOT NULL,
  fulfillment_type TEXT NOT NULL
    CHECK(fulfillment_type IN (
      'NONE',
      'LOCAL_DELIVERY',
      'QUICK_SERVICE',
      'SHIPPING',
      'PICKUP'
    )),
  is_enabled INTEGER NOT NULL DEFAULT 1 CHECK(is_enabled IN (0, 1)),
  is_default INTEGER NOT NULL DEFAULT 0 CHECK(is_default IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY(profile_id) REFERENCES profiles(id),
  FOREIGN KEY(channel_code) REFERENCES profiles(channelCode)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_market_fulfillment_settings_channel_type_active
ON market_fulfillment_settings(channel_code, fulfillment_type)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_market_fulfillment_settings_channel_default_active
ON market_fulfillment_settings(channel_code)
WHERE is_default = 1
  AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_market_fulfillment_settings_channel
ON market_fulfillment_settings(channel_code);

CREATE INDEX IF NOT EXISTS idx_market_fulfillment_settings_type
ON market_fulfillment_settings(fulfillment_type);
`);

const marketFulfillmentSettingsTableSqlRow = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type='table'
    AND name='market_fulfillment_settings'
  LIMIT 1
`).get() as { sql?: string } | undefined

const marketFulfillmentSettingsSupportsQuickService =
  marketFulfillmentSettingsTableSqlRow?.sql?.includes(`'QUICK_SERVICE'`) ?? false

if (!marketFulfillmentSettingsSupportsQuickService) {
  db.exec(`PRAGMA foreign_keys = OFF`)

  try {
    db.exec(`DROP TABLE IF EXISTS market_fulfillment_settings_new`)

    db.exec(`
      CREATE TABLE market_fulfillment_settings_new(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER NOT NULL,
        channel_code TEXT NOT NULL,
        fulfillment_type TEXT NOT NULL
          CHECK(fulfillment_type IN (
            'NONE',
            'LOCAL_DELIVERY',
            'QUICK_SERVICE',
            'SHIPPING',
            'PICKUP'
          )),
        is_enabled INTEGER NOT NULL DEFAULT 1 CHECK(is_enabled IN (0, 1)),
        is_default INTEGER NOT NULL DEFAULT 0 CHECK(is_default IN (0, 1)),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT,
        FOREIGN KEY(profile_id) REFERENCES profiles(id),
        FOREIGN KEY(channel_code) REFERENCES profiles(channelCode)
      )
    `)

    db.exec(`
      INSERT INTO market_fulfillment_settings_new(
        id,
        profile_id,
        channel_code,
        fulfillment_type,
        is_enabled,
        is_default,
        created_at,
        updated_at,
        deleted_at
      )
      SELECT
        id,
        profile_id,
        channel_code,
        fulfillment_type,
        is_enabled,
        is_default,
        created_at,
        updated_at,
        deleted_at
      FROM market_fulfillment_settings
    `)

    db.exec(`DROP TABLE market_fulfillment_settings`)
    db.exec(`ALTER TABLE market_fulfillment_settings_new RENAME TO market_fulfillment_settings`)

    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_market_fulfillment_settings_channel_type_active
      ON market_fulfillment_settings(channel_code, fulfillment_type)
      WHERE deleted_at IS NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS uq_market_fulfillment_settings_channel_default_active
      ON market_fulfillment_settings(channel_code)
      WHERE is_default = 1
        AND deleted_at IS NULL;

      CREATE INDEX IF NOT EXISTS idx_market_fulfillment_settings_channel
      ON market_fulfillment_settings(channel_code);

      CREATE INDEX IF NOT EXISTS idx_market_fulfillment_settings_type
      ON market_fulfillment_settings(fulfillment_type);
    `)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}

//==================================================
// SECTION 06-4-4 : BUSINESS LOCAL DELIVERY REGIONS
// RULE : channelCode owns business-wide local delivery region settings

db.exec(`
CREATE TABLE IF NOT EXISTS business_local_delivery_regions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  channel_code TEXT NOT NULL,
  region_name TEXT NOT NULL,
  region_code TEXT,
  delivery_fee INTEGER NOT NULL DEFAULT 0
    CHECK(delivery_fee >= 0),
  minimum_order_amount INTEGER NOT NULL DEFAULT 0
    CHECK(minimum_order_amount >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_enabled INTEGER NOT NULL DEFAULT 1 CHECK(is_enabled IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY(profile_id) REFERENCES profiles(id),
  FOREIGN KEY(channel_code) REFERENCES profiles(channelCode)
);

CREATE INDEX IF NOT EXISTS idx_business_local_delivery_regions_channel
ON business_local_delivery_regions(channel_code);

CREATE INDEX IF NOT EXISTS idx_business_local_delivery_regions_region_name
ON business_local_delivery_regions(region_name);

CREATE INDEX IF NOT EXISTS idx_business_local_delivery_regions_enabled
ON business_local_delivery_regions(is_enabled);

CREATE UNIQUE INDEX IF NOT EXISTS uq_business_local_delivery_regions_channel_region_active
ON business_local_delivery_regions(channel_code, region_name)
WHERE deleted_at IS NULL;
`);

//==================================================
// SECTION 06-5 : PROFILE OWNERSHIPS

db.exec(`

CREATE TABLE IF NOT EXISTS profile_ownerships(

id INTEGER PRIMARY KEY AUTOINCREMENT,

userId INTEGER,

channelCode TEXT,

role TEXT DEFAULT 'OWNER',

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(userId) REFERENCES users(id)

)

`)


//===================================================
// SECTION 06-6 : PROFILE SESSIONS

db.exec(`

CREATE TABLE IF NOT EXISTS profile_sessions(

id INTEGER PRIMARY KEY AUTOINCREMENT,

userId INTEGER NOT NULL,

profileId INTEGER NOT NULL,

profileType TEXT NOT NULL CHECK(profileType IN('GENERAL','BUSINESS')),

channelCode TEXT NOT NULL,

deviceId TEXT,

status TEXT DEFAULT 'ACTIVE',

loginAt TEXT DEFAULT CURRENT_TIMESTAMP,

lastSeenAt TEXT DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(userId) REFERENCES users(id),

FOREIGN KEY(profileId) REFERENCES profiles(id),

FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)

)

`)


//=====================================================
// SECTION 06-7 : PROFILE HERO IMAGES (MEDIA FINAL)

db.exec(`
CREATE TABLE IF NOT EXISTS profile_hero_images(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profileId INTEGER NOT NULL,
  channelCode TEXT,
  imageAssetId INTEGER,
  externalUrl TEXT,
  title TEXT,
  description TEXT,
  linkUrl TEXT,
  sortOrder INTEGER DEFAULT 1,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(profileId) REFERENCES profiles(id),
  FOREIGN KEY(imageAssetId) REFERENCES image_assets(id),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)
);

CREATE INDEX IF NOT EXISTS idx_profile_hero_profile
ON profile_hero_images(profileId);

CREATE INDEX IF NOT EXISTS idx_profile_hero_sort
ON profile_hero_images(sortOrder);

CREATE INDEX IF NOT EXISTS idx_profile_hero_asset
ON profile_hero_images(imageAssetId);
`);


//=====================================================
// SECTION 06-8 : PROFILE BLOCKS (SLOT BASED FINAL)

db.exec(`

CREATE TABLE IF NOT EXISTS profile_blocks(

id INTEGER PRIMARY KEY AUTOINCREMENT,

profileId INTEGER NOT NULL,

type TEXT,

title TEXT,

content TEXT,

url TEXT,

description TEXT,

sortOrder INTEGER NOT NULL DEFAULT 0,

isActive INTEGER DEFAULT 1,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,

updatedAt TEXT,

FOREIGN KEY(profileId)
REFERENCES profiles(id)

)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_profile_blocks_profile

ON profile_blocks(profileId)

`)

db.exec(`

CREATE UNIQUE INDEX IF NOT EXISTS
idx_profile_blocks_slot_unique

ON profile_blocks(profileId, sortOrder)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_profile_blocks_sort

ON profile_blocks(profileId, sortOrder)

`)


//=====================================================
// SECTION 06-9 : PROFILE GALLERY IMAGES (MEDIA FINAL + SAFE EXTENDED)

db.exec(`
CREATE TABLE IF NOT EXISTS profile_gallery_images(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profileId INTEGER NOT NULL,
  channelCode TEXT,
  imageAssetId INTEGER NOT NULL,
  filePath TEXT,
  caption TEXT,
  sortOrder INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(profileId) REFERENCES profiles(id),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(imageAssetId) REFERENCES image_assets(id)
);

CREATE INDEX IF NOT EXISTS idx_profile_gallery_profile
ON profile_gallery_images(profileId);

CREATE INDEX IF NOT EXISTS idx_profile_gallery_sort
ON profile_gallery_images(sortOrder);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_gallery_sort_unique
ON profile_gallery_images(profileId, sortOrder);

CREATE INDEX IF NOT EXISTS idx_profile_gallery_asset
ON profile_gallery_images(imageAssetId);
`);

//=====================================================
// SECTION 06-9-2 : PLACE FEED AD SETTINGS
// ROLE : PLACE FEED PAID AD SLOT HISTORY
// RULE : 광고 이력은 삭제하지 않고, 서비스에서 현재 유효 슬롯을 계산한다
//=====================================================

db.exec(`
CREATE TABLE IF NOT EXISTS place_feed_ad_settings(
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  profileId INTEGER NOT NULL,
  channelCode TEXT NOT NULL,

  adSlotNo INTEGER NOT NULL DEFAULT 0
  CHECK(adSlotNo BETWEEN 0 AND 16),

  adStatus TEXT NOT NULL DEFAULT 'NONE'
  CHECK(adStatus IN ('NONE', 'ACTIVE', 'EXPIRED')),

  isPlaceFeedEnabled INTEGER NOT NULL DEFAULT 1
  CHECK(isPlaceFeedEnabled IN (0, 1)),

  adStartAt TEXT,
  adEndAt TEXT,

  isActive INTEGER NOT NULL DEFAULT 1
  CHECK(isActive IN (0, 1)),

  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,

  FOREIGN KEY(profileId) REFERENCES profiles(id),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)
);

CREATE INDEX IF NOT EXISTS idx_place_feed_ad_settings_profile
ON place_feed_ad_settings(profileId);

CREATE INDEX IF NOT EXISTS idx_place_feed_ad_settings_channel
ON place_feed_ad_settings(channelCode);

CREATE INDEX IF NOT EXISTS idx_place_feed_ad_settings_slot
ON place_feed_ad_settings(adSlotNo);

CREATE INDEX IF NOT EXISTS idx_place_feed_ad_settings_active
ON place_feed_ad_settings(isActive);

CREATE INDEX IF NOT EXISTS idx_place_feed_ad_settings_end_at
ON place_feed_ad_settings(adEndAt);
`);

const placeFeedAdSettingsTableSqlRow = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type='table'
    AND name='place_feed_ad_settings'
  LIMIT 1
`).get() as { sql?: string } | undefined

const placeFeedAdSettingsNeedsMigration = (() => {
  const sql = placeFeedAdSettingsTableSqlRow?.sql ?? ''

  if (!sql) {
    return false
  }

  return (
    sql.includes('CHECK(adSlotNo BETWEEN 1 AND 16)')
    || !sql.includes('adStatus')
    || !sql.includes('isPlaceFeedEnabled')
    || sql.includes('adStartAt TEXT NOT NULL')
    || sql.includes('adEndAt TEXT NOT NULL')
    || sql.includes("'PAID'")
  )
})()

if (placeFeedAdSettingsNeedsMigration) {
  db.exec(`PRAGMA foreign_keys = OFF`)

  try {
    db.exec(`DROP TABLE IF EXISTS place_feed_ad_settings_new`)

    db.exec(`
      CREATE TABLE place_feed_ad_settings_new(
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        profileId INTEGER NOT NULL,
        channelCode TEXT NOT NULL,

        adSlotNo INTEGER NOT NULL DEFAULT 0
        CHECK(adSlotNo BETWEEN 0 AND 16),

        adStatus TEXT NOT NULL DEFAULT 'NONE'
        CHECK(adStatus IN ('NONE', 'ACTIVE', 'EXPIRED')),

        isPlaceFeedEnabled INTEGER NOT NULL DEFAULT 1
        CHECK(isPlaceFeedEnabled IN (0, 1)),

        adStartAt TEXT,
        adEndAt TEXT,

        isActive INTEGER NOT NULL DEFAULT 1
        CHECK(isActive IN (0, 1)),

        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT,

        FOREIGN KEY(profileId) REFERENCES profiles(id),
        FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)
      )
    `)

    db.exec(`
      INSERT INTO place_feed_ad_settings_new(
        id,
        profileId,
        channelCode,
        adSlotNo,
        adStatus,
        isPlaceFeedEnabled,
        adStartAt,
        adEndAt,
        isActive,
        createdAt,
        updatedAt
      )
      SELECT
        id,
        profileId,
        channelCode,
        CASE
          WHEN adSlotNo BETWEEN 1 AND 16 THEN adSlotNo
          ELSE 0
        END AS adSlotNo,
        CASE
          WHEN adSlotNo BETWEEN 1 AND 16 THEN 'ACTIVE'
          ELSE 'NONE'
        END AS adStatus,
        1 AS isPlaceFeedEnabled,
        adStartAt,
        adEndAt,
        COALESCE(isActive, 1) AS isActive,
        createdAt,
        updatedAt
      FROM place_feed_ad_settings
    `)

    db.exec(`DROP TABLE place_feed_ad_settings`)
    db.exec(`ALTER TABLE place_feed_ad_settings_new RENAME TO place_feed_ad_settings`)

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_place_feed_ad_settings_profile
      ON place_feed_ad_settings(profileId);

      CREATE INDEX IF NOT EXISTS idx_place_feed_ad_settings_channel
      ON place_feed_ad_settings(channelCode);

      CREATE INDEX IF NOT EXISTS idx_place_feed_ad_settings_slot
      ON place_feed_ad_settings(adSlotNo);

      CREATE INDEX IF NOT EXISTS idx_place_feed_ad_settings_active
      ON place_feed_ad_settings(isActive);

      CREATE INDEX IF NOT EXISTS idx_place_feed_ad_settings_end_at
      ON place_feed_ad_settings(adEndAt);

      CREATE INDEX IF NOT EXISTS idx_place_feed_ad_settings_status
      ON place_feed_ad_settings(adStatus);

      CREATE INDEX IF NOT EXISTS idx_place_feed_ad_settings_feed_enabled
      ON place_feed_ad_settings(isPlaceFeedEnabled);
    `)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}

safeAddColumn(
  'place_feed_ad_settings',
  'adStatus',
  `TEXT NOT NULL DEFAULT 'NONE' CHECK(adStatus IN ('NONE', 'ACTIVE', 'EXPIRED'))`
)

safeAddColumn(
  'place_feed_ad_settings',
  'isPlaceFeedEnabled',
  `INTEGER NOT NULL DEFAULT 1 CHECK(isPlaceFeedEnabled IN (0, 1))`
)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_place_feed_ad_settings_status
ON place_feed_ad_settings(adStatus);

CREATE INDEX IF NOT EXISTS idx_place_feed_ad_settings_feed_enabled
ON place_feed_ad_settings(isPlaceFeedEnabled);
`)

//=====================================================
// SECTION 06-10 : PROFILE CATEGORIES (INFO 계열 프로필 카테고리)

db.exec(`

CREATE TABLE IF NOT EXISTS profile_categories(

id INTEGER PRIMARY KEY AUTOINCREMENT,

profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,

postType TEXT NOT NULL
CHECK(postType IN(
'INFO',
'SUMMARY',
'GENERAL',
'GALLERY',
'PRODUCT',
'EVENT',
'REVIEW'
)),

name TEXT NOT NULL,
title TEXT NOT NULL,

sortOrder INTEGER DEFAULT 0,
isActive INTEGER DEFAULT 1,
isSystem INTEGER DEFAULT 0,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,

FOREIGN KEY(profileId)
REFERENCES profiles(id),

FOREIGN KEY(channelCode)
REFERENCES profiles(channelCode)

)

`)

/* ==================================================
MIGRATION (기존 DB 호환)
================================================== */

const profileCategoryCols =
  db.prepare(`PRAGMA table_info(profile_categories)`).all() as Array<{ name: string }>

const hasOldInfoConstraint = true // SQLite CHECK 제약은 직접 수정할 수 없어 안전 재생성 흐름을 사용한다.

if (hasOldInfoConstraint) {

  db.exec(`

  CREATE TABLE IF NOT EXISTS profile_categories_new(

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    profileId INTEGER NOT NULL,
    channelCode TEXT NOT NULL,

    postType TEXT NOT NULL
    CHECK(postType IN(
      'INFO',
      'SUMMARY',
      'GENERAL',
      'GALLERY',
      'PRODUCT',
      'EVENT',
      'REVIEW'
    )),

    name TEXT NOT NULL,
    title TEXT NOT NULL,

    sortOrder INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    isSystem INTEGER DEFAULT 0,

    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT,

    FOREIGN KEY(profileId)
    REFERENCES profiles(id),

    FOREIGN KEY(channelCode)
    REFERENCES profiles(channelCode)

  )

  `)

  db.exec(`

  INSERT INTO profile_categories_new(
    id,
    profileId,
    channelCode,
    postType,
    name,
    title,
    sortOrder,
    isActive,
    isSystem,
    createdAt,
    updatedAt
  )
  SELECT
    id,
    profileId,
    channelCode,
    postType,
    name,
    title,
    sortOrder,
    isActive,
    isSystem,
    createdAt,
    updatedAt
  FROM profile_categories

  `)

  db.exec(`DROP TABLE profile_categories`)
  db.exec(`ALTER TABLE profile_categories_new RENAME TO profile_categories`)
}

// SQLite ?명솚 而щ읆 蹂닿컯: BUSINESS 硫붾돱 ?뺤콉 而щ읆
const profileCategoryColumnRows =
  db.prepare(`PRAGMA table_info(profile_categories)`).all() as Array<{ name: string }>

const profileCategoryColumnNames = new Set(
  profileCategoryColumnRows.map((row) => row.name)
)

if (!profileCategoryColumnNames.has('isDefault')) {
  db.exec(`
    ALTER TABLE profile_categories
    ADD COLUMN isDefault INTEGER DEFAULT 0
  `)
}

if (!profileCategoryColumnNames.has('isRequired')) {
  db.exec(`
    ALTER TABLE profile_categories
    ADD COLUMN isRequired INTEGER DEFAULT 0
  `)
}

if (!profileCategoryColumnNames.has('deletable')) {
  db.exec(`
    ALTER TABLE profile_categories
    ADD COLUMN deletable INTEGER DEFAULT 1
  `)
}

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_categories_profile_post_type
ON profile_categories(profileId, postType);

CREATE INDEX IF NOT EXISTS idx_profile_categories_channel_code
ON profile_categories(channelCode);

CREATE INDEX IF NOT EXISTS idx_profile_categories_profile_id
ON profile_categories(profileId);
`)

// ==================================================
// SECTION 06-15 : BUSINESS HOURS (1 PROFILE = 1 ROW)
// ROLE : 영업시간 + 영업중/영업종료 상태 관리
// STATUS : PRODUCTION DB INIT SAFE MODIFY
// ==================================================

db.exec(`
CREATE TABLE IF NOT EXISTS business_hours(
  profileId INTEGER PRIMARY KEY,
  channelCode TEXT,

  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0,1)),

  mon_isActive INTEGER NOT NULL DEFAULT 1 CHECK(mon_isActive IN (0,1)),
  mon_isClosed INTEGER NOT NULL DEFAULT 1 CHECK(mon_isClosed IN (0,1)),
  mon_startTime TEXT DEFAULT '',
  mon_endTime TEXT DEFAULT '',

  tue_isActive INTEGER NOT NULL DEFAULT 1 CHECK(tue_isActive IN (0,1)),
  tue_isClosed INTEGER NOT NULL DEFAULT 1 CHECK(tue_isClosed IN (0,1)),
  tue_startTime TEXT DEFAULT '',
  tue_endTime TEXT DEFAULT '',

  wed_isActive INTEGER NOT NULL DEFAULT 1 CHECK(wed_isActive IN (0,1)),
  wed_isClosed INTEGER NOT NULL DEFAULT 1 CHECK(wed_isClosed IN (0,1)),
  wed_startTime TEXT DEFAULT '',
  wed_endTime TEXT DEFAULT '',

  thu_isActive INTEGER NOT NULL DEFAULT 1 CHECK(thu_isActive IN (0,1)),
  thu_isClosed INTEGER NOT NULL DEFAULT 1 CHECK(thu_isClosed IN (0,1)),
  thu_startTime TEXT DEFAULT '',
  thu_endTime TEXT DEFAULT '',

  fri_isActive INTEGER NOT NULL DEFAULT 1 CHECK(fri_isActive IN (0,1)),
  fri_isClosed INTEGER NOT NULL DEFAULT 1 CHECK(fri_isClosed IN (0,1)),
  fri_startTime TEXT DEFAULT '',
  fri_endTime TEXT DEFAULT '',

  sat_isActive INTEGER NOT NULL DEFAULT 1 CHECK(sat_isActive IN (0,1)),
  sat_isClosed INTEGER NOT NULL DEFAULT 1 CHECK(sat_isClosed IN (0,1)),
  sat_startTime TEXT DEFAULT '',
  sat_endTime TEXT DEFAULT '',

  sun_isActive INTEGER NOT NULL DEFAULT 1 CHECK(sun_isActive IN (0,1)),
  sun_isClosed INTEGER NOT NULL DEFAULT 1 CHECK(sun_isClosed IN (0,1)),
  sun_startTime TEXT DEFAULT '',
  sun_endTime TEXT DEFAULT '',

  temporaryClosed INTEGER NOT NULL DEFAULT 0 CHECK(temporaryClosed IN (0,1)),
  alwaysOpen INTEGER NOT NULL DEFAULT 0 CHECK(alwaysOpen IN (0,1)),

  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY(profileId) REFERENCES profiles(id)
)
`)

// ==================================================
// SAFE COLUMN ADD (기존 구조 유지)
// ==================================================
safeAddColumn('business_hours','channelCode','TEXT')
safeAddColumn('business_hours','isActive','INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0,1))')
safeAddColumn('business_hours','mon_isActive','INTEGER NOT NULL DEFAULT 1 CHECK(mon_isActive IN (0,1))')
safeAddColumn('business_hours','tue_isActive','INTEGER NOT NULL DEFAULT 1 CHECK(tue_isActive IN (0,1))')
safeAddColumn('business_hours','wed_isActive','INTEGER NOT NULL DEFAULT 1 CHECK(wed_isActive IN (0,1))')
safeAddColumn('business_hours','thu_isActive','INTEGER NOT NULL DEFAULT 1 CHECK(thu_isActive IN (0,1))')
safeAddColumn('business_hours','fri_isActive','INTEGER NOT NULL DEFAULT 1 CHECK(fri_isActive IN (0,1))')
safeAddColumn('business_hours','sat_isActive','INTEGER NOT NULL DEFAULT 1 CHECK(sat_isActive IN (0,1))')
safeAddColumn('business_hours','sun_isActive','INTEGER NOT NULL DEFAULT 1 CHECK(sun_isActive IN (0,1))')
safeAddColumn('business_hours','alwaysOpen','INTEGER NOT NULL DEFAULT 0 CHECK(alwaysOpen IN (0,1))')

// ==================================================
// INITIAL ROW INSERT (테스트 profile 기준)
// ==================================================
const upsertBusinessHours = db.prepare(`
INSERT INTO business_hours(
  profileId,
  channelCode,
  isActive,
  temporaryClosed,
  alwaysOpen
) VALUES (?,?,1,0,0)
ON CONFLICT(profileId) DO UPDATE SET
channelCode=excluded.channelCode
`)

const findBusinessProfileByChannelCode = db.prepare(`
SELECT id, channelCode
FROM profiles
WHERE profileType='BUSINESS'
  AND channelCode=?
LIMIT 1
`)

const findBusinessProfileByEmail = db.prepare(`
SELECT p.id, p.channelCode
FROM profiles p
INNER JOIN users u
  ON u.id = p.userId
WHERE p.profileType='BUSINESS'
  AND u.email=?
LIMIT 1
`)

function getBusinessProfileByChannelCode(channelCode: string): { id: number; channelCode: string } {
const row = findBusinessProfileByChannelCode.get(channelCode) as { id?: number; channelCode?: string } | undefined

if (!row?.id || !row?.channelCode) {
throw new Error(`business profile not found for channelCode: ${channelCode}`)
}

return {
id: row.id,
channelCode: row.channelCode
}
}

function getBusinessProfileByEmailCandidates(emails: string[]): { id: number; channelCode: string } {
for (const email of emails) {
const row = findBusinessProfileByEmail.get(email) as { id?: number; channelCode?: string } | undefined
if (row?.id && row?.channelCode) {
return {
id: row.id,
channelCode: row.channelCode
}
}
}

throw new Error(`business profile not found for emails: ${emails.join(', ')}`)
}

const businessProfile1 =
getBusinessProfileByEmailCandidates([
  'test11@prod.com',
  'test1@prod.com',
  'test11@naver.com'
])

const businessProfile2 =
getBusinessProfileByEmailCandidates([
  'test12@prod.com',
  'test2@prod.com',
  'test12@naver.com'
])

const deleteBusinessHoursByChannelCodeExceptProfile = db.prepare(`
DELETE FROM business_hours
WHERE channelCode=?
  AND profileId<>?
`)

const deleteBusinessHoursByProfileWithDifferentChannel = db.prepare(`
DELETE FROM business_hours
WHERE profileId=?
  AND channelCode<>?
`)

deleteBusinessHoursByChannelCodeExceptProfile.run(
businessProfile1.channelCode,
businessProfile1.id
)

deleteBusinessHoursByProfileWithDifferentChannel.run(
businessProfile1.id,
businessProfile1.channelCode
)

upsertBusinessHours.run(
businessProfile1.id,
businessProfile1.channelCode
)

deleteBusinessHoursByChannelCodeExceptProfile.run(
businessProfile2.channelCode,
businessProfile2.id
)

deleteBusinessHoursByProfileWithDifferentChannel.run(
businessProfile2.id,
businessProfile2.channelCode
)

upsertBusinessHours.run(
businessProfile2.id,
businessProfile2.channelCode
)

// ==================================================
// INDEX
// ==================================================
db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_hours_profile
ON business_hours(profileId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_business_hours_channel
ON business_hours(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_business_hours_active
ON business_hours(isActive)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_business_hours_always_open
ON business_hours(alwaysOpen)
`)

//=====================================================
// SECTION 06-16 : PROFILE DELIVERY SETTINGS (1 PROFILE = 1 ROW)
//=====================================================

db.exec(`
CREATE TABLE IF NOT EXISTS profile_delivery_settings(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profileId INTEGER NOT NULL,
  channelCode TEXT NOT NULL,
  deliveryAddress TEXT,
  deliveryDetailAddress TEXT,
  entrancePassword TEXT,
  deliveryMemo TEXT,
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(profileId),
  FOREIGN KEY(profileId) REFERENCES profiles(id),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)
)
`)

safeAddColumn('profile_delivery_settings', 'channelCode', 'TEXT')
safeAddColumn('profile_delivery_settings', 'deliveryAddress', 'TEXT')
safeAddColumn('profile_delivery_settings', 'deliveryDetailAddress', 'TEXT')
safeAddColumn('profile_delivery_settings', 'entrancePassword', 'TEXT')
safeAddColumn('profile_delivery_settings', 'deliveryMemo', 'TEXT')
safeAddColumn('profile_delivery_settings', 'isActive', 'INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0,1))')
safeAddColumn('profile_delivery_settings', 'createdAt', 'TEXT DEFAULT CURRENT_TIMESTAMP')
safeAddColumn('profile_delivery_settings', 'updatedAt', 'TEXT DEFAULT CURRENT_TIMESTAMP')

db.exec(`
CREATE INDEX IF NOT EXISTS idx_profile_delivery_settings_profile
ON profile_delivery_settings(profileId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_profile_delivery_settings_channel
ON profile_delivery_settings(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_profile_delivery_settings_active
ON profile_delivery_settings(isActive)
`)

//=====================================================
// SECTION 06-17 : PROFILE DELIVERY ADDRESSES (1 PROFILE = N ROWS)
//=====================================================

db.exec(`
CREATE TABLE IF NOT EXISTS profile_delivery_addresses(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profileId INTEGER NOT NULL,
  channelCode TEXT NOT NULL,
  label TEXT NOT NULL,
  recipientName TEXT,
  recipientPhone TEXT,
  deliveryAddress TEXT NOT NULL,
  deliveryDetailAddress TEXT,
  entrancePassword TEXT,
  deliveryMemo TEXT,
  isDefault INTEGER NOT NULL DEFAULT 0 CHECK(isDefault IN (0,1)),
  sortOrder INTEGER NOT NULL DEFAULT 0,
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(profileId) REFERENCES profiles(id),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  CHECK(length(trim(label)) > 0),
  CHECK(length(trim(deliveryAddress)) > 0)
)
`)

safeAddColumn('profile_delivery_addresses', 'channelCode', 'TEXT')
safeAddColumn('profile_delivery_addresses', 'label', 'TEXT')
safeAddColumn('profile_delivery_addresses', 'recipientName', 'TEXT')
safeAddColumn('profile_delivery_addresses', 'recipientPhone', 'TEXT')
safeAddColumn('profile_delivery_addresses', 'deliveryAddress', 'TEXT')
safeAddColumn('profile_delivery_addresses', 'deliveryDetailAddress', 'TEXT')
safeAddColumn('profile_delivery_addresses', 'entrancePassword', 'TEXT')
safeAddColumn('profile_delivery_addresses', 'deliveryMemo', 'TEXT')
safeAddColumn('profile_delivery_addresses', 'isDefault', 'INTEGER NOT NULL DEFAULT 0 CHECK(isDefault IN (0,1))')
safeAddColumn('profile_delivery_addresses', 'sortOrder', 'INTEGER NOT NULL DEFAULT 0')
safeAddColumn('profile_delivery_addresses', 'isActive', 'INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0,1))')
safeAddColumn('profile_delivery_addresses', 'createdAt', 'TEXT DEFAULT CURRENT_TIMESTAMP')
safeAddColumn('profile_delivery_addresses', 'updatedAt', 'TEXT DEFAULT CURRENT_TIMESTAMP')

db.exec(`
CREATE INDEX IF NOT EXISTS idx_profile_delivery_addresses_profile
ON profile_delivery_addresses(profileId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_profile_delivery_addresses_channel
ON profile_delivery_addresses(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_profile_delivery_addresses_active
ON profile_delivery_addresses(isActive)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_profile_delivery_addresses_sort
ON profile_delivery_addresses(profileId, sortOrder)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_delivery_addresses_default
ON profile_delivery_addresses(profileId)
WHERE isDefault = 1
  AND isActive = 1
`)

db.exec(`
UPDATE profile_delivery_addresses
SET
  channelCode = COALESCE(
    channelCode,
    (
      SELECT p.channelCode
      FROM profiles p
      WHERE p.id = profile_delivery_addresses.profileId
      LIMIT 1
    )
  ),
  label = COALESCE(NULLIF(trim(label), ''), '기본 배송지'),
  isDefault = COALESCE(isDefault, 0),
  sortOrder = COALESCE(sortOrder, 0),
  isActive = COALESCE(isActive, 1),
  updatedAt = COALESCE(updatedAt, CURRENT_TIMESTAMP)
`)

db.exec(`
INSERT INTO profile_delivery_addresses(
  profileId,
  channelCode,
  label,
  deliveryAddress,
  deliveryDetailAddress,
  entrancePassword,
  deliveryMemo,
  isDefault,
  sortOrder,
  isActive,
  createdAt,
  updatedAt
)
SELECT
  pds.profileId,
  pds.channelCode,
  '기본 배송지',
  pds.deliveryAddress,
  pds.deliveryDetailAddress,
  pds.entrancePassword,
  pds.deliveryMemo,
  1,
  0,
  1,
  COALESCE(pds.createdAt, CURRENT_TIMESTAMP),
  CURRENT_TIMESTAMP
FROM profile_delivery_settings pds
WHERE COALESCE(pds.isActive, 1) = 1
  AND pds.deliveryAddress IS NOT NULL
  AND trim(pds.deliveryAddress) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM profile_delivery_addresses pda
    WHERE pda.profileId = pds.profileId
  )
`)

//=====================================================
// SECTION 07 : CHANNELS

db.exec(`

CREATE TABLE IF NOT EXISTS channels(

id INTEGER PRIMARY KEY AUTOINCREMENT,

channelCode TEXT UNIQUE,

channelType TEXT DEFAULT 'PERSONAL',

status TEXT DEFAULT 'ACTIVE',

createdAt TEXT DEFAULT CURRENT_TIMESTAMP

)

`)

//========================================================
// SECTION 08 : CHANNEL REGION SETTINGS

db.exec(`

CREATE TABLE IF NOT EXISTS channel_region_settings(

id INTEGER PRIMARY KEY AUTOINCREMENT,

channelCode TEXT,

regionId INTEGER,

isPrimary INTEGER DEFAULT 0,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(regionId) REFERENCES regions(id)

)

`)

//===================================================
// SECTION 09 : POSTS (BUSINESS/GENERAL POST ROOT + POST TYPE + INDUSTRY SNAPSHOT FINAL)

db.exec(`

CREATE TABLE IF NOT EXISTS posts(

id INTEGER PRIMARY KEY AUTOINCREMENT,

profileId INTEGER NOT NULL,

channelCode TEXT NOT NULL,

regionId INTEGER,

contentType TEXT NOT NULL
CHECK(contentType IN(
'LIFE',
'PLACE'
)),

postType TEXT NOT NULL
CHECK(postType IN(
'GENERAL',
'GALLERY',
'PRODUCT',
'EVENT',
'REVIEW'
)),

/*
=========================================
INDUSTRY SNAPSHOT
원본: profiles.primaryIndustry*
목적: feed query JOIN 감소
주의: snapshot 캐시이므로 FK를 걸지 않는다
=========================================
*/
industryId INTEGER,

industrySubtypeId INTEGER,

industryCode TEXT,

industrySubtypeCode TEXT,

title TEXT,

content TEXT,

priceAmount INTEGER
CHECK(priceAmount IS NULL OR priceAmount >= 0),

eventStartAt TEXT,

eventEndAt TEXT,

visibility TEXT DEFAULT 'PUBLIC'
CHECK(visibility IN(
'PUBLIC',
'FOLLOWERS',
'PRIVATE'
)),

mediaCount INTEGER DEFAULT 0,

latitude REAL,

longitude REAL,

status TEXT DEFAULT 'ACTIVE'
CHECK(status IN(
'ACTIVE',
'DRAFT',
'HIDDEN',
'DELETED'
)),

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,

updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(profileId)
REFERENCES profiles(id),

FOREIGN KEY(channelCode)
REFERENCES profiles(channelCode),

FOREIGN KEY(regionId)
REFERENCES regions(id)

)

`)

/* =========================================
POSTS COLUMN SNAPSHOT BEFORE SAFE ADD
========================================= */

const postTableColumnsBeforeSafeAdd =
  db.prepare(`PRAGMA table_info(posts)`).all() as Array<{ name: string }>

const hasLegacyAuthorChannelCodeBefore =
  postTableColumnsBeforeSafeAdd.some(
    (column) => column.name === 'authorChannelCode'
  )

const hasChannelCodeBefore =
  postTableColumnsBeforeSafeAdd.some(
    (column) => column.name === 'channelCode'
  )

const hasTitleBefore =
  postTableColumnsBeforeSafeAdd.some(
    (column) => column.name === 'title'
  )

const hasPriceAmountBefore =
  postTableColumnsBeforeSafeAdd.some(
    (column) => column.name === 'priceAmount'
  )

const hasEventStartAtBefore =
  postTableColumnsBeforeSafeAdd.some(
    (column) => column.name === 'eventStartAt'
  )

const hasEventEndAtBefore =
  postTableColumnsBeforeSafeAdd.some(
    (column) => column.name === 'eventEndAt'
  )

const hasIndustryIdBefore =
  postTableColumnsBeforeSafeAdd.some(
    (column) => column.name === 'industryId'
  )

const hasIndustrySubtypeIdBefore =
  postTableColumnsBeforeSafeAdd.some(
    (column) => column.name === 'industrySubtypeId'
  )

const hasIndustryCodeBefore =
  postTableColumnsBeforeSafeAdd.some(
    (column) => column.name === 'industryCode'
  )

const hasIndustrySubtypeCodeBefore =
  postTableColumnsBeforeSafeAdd.some(
    (column) => column.name === 'industrySubtypeCode'
  )

/* =========================================
POSTS SAFE COLUMN ADD
기존 DB / 신규 DB 모두 호환
========================================= */

safeAddColumn(
  'posts',
  'postType',
  `TEXT NOT NULL DEFAULT 'GENERAL'
   CHECK(postType IN('GENERAL','GALLERY','PRODUCT','EVENT','REVIEW'))`
)

safeAddColumn(
  'posts',
  'industryId',
  'INTEGER'
)

safeAddColumn(
  'posts',
  'industrySubtypeId',
  'INTEGER'
)

safeAddColumn(
  'posts',
  'industryCode',
  'TEXT'
)

safeAddColumn(
  'posts',
  'industrySubtypeCode',
  'TEXT'
)

safeAddColumn(
  'posts',
  'title',
  'TEXT'
)

safeAddColumn(
  'posts',
  'priceAmount',
  'INTEGER CHECK(priceAmount IS NULL OR priceAmount >= 0)'
)

safeAddColumn(
  'posts',
  'eventStartAt',
  'TEXT'
)

safeAddColumn(
  'posts',
  'eventEndAt',
  'TEXT'
)

safeAddColumn(
  'posts',
  'postCode',
  'TEXT CHECK(postCode IS NULL OR length(postCode)=12)'
)

/* =========================================
POSTS TABLE SQL CHECK
========================================= */

const postsTableSqlRow =
  db.prepare(`
    SELECT sql
    FROM sqlite_master
    WHERE type = 'table'
      AND name = 'posts'
    LIMIT 1
  `).get() as { sql?: string } | undefined

const postsStatusAllowsDraft =
  postsTableSqlRow?.sql?.includes(`'DRAFT'`) ?? false

if (
  !hasChannelCodeBefore &&
  !hasLegacyAuthorChannelCodeBefore
) {
  throw new Error(
    'posts migration failed: channelCode or authorChannelCode column required'
  )
}

/* =========================================
POSTS MIGRATION SELECT EXPRESSIONS
========================================= */

const selectChannelCodeExpression =
  hasChannelCodeBefore && hasLegacyAuthorChannelCodeBefore
    ? 'COALESCE(posts.channelCode, posts.authorChannelCode)'
    : hasChannelCodeBefore
      ? 'posts.channelCode'
      : 'posts.authorChannelCode'

const selectTitleExpression =
  hasTitleBefore
    ? 'posts.title'
    : 'NULL'

const selectPriceAmountExpression =
  hasPriceAmountBefore
    ? 'posts.priceAmount'
    : 'NULL'

const selectEventStartAtExpression =
  hasEventStartAtBefore
    ? 'posts.eventStartAt'
    : 'NULL'

const selectEventEndAtExpression =
  hasEventEndAtBefore
    ? 'posts.eventEndAt'
    : 'NULL'

const profileIndustryIdExpression = `
  (
    SELECT pr.primaryIndustryId
    FROM profiles pr
    WHERE pr.id = posts.profileId
      AND pr.channelCode = ${selectChannelCodeExpression}
    LIMIT 1
  )
`

const profileIndustrySubtypeIdExpression = `
  (
    SELECT pr.primaryIndustrySubtypeId
    FROM profiles pr
    WHERE pr.id = posts.profileId
      AND pr.channelCode = ${selectChannelCodeExpression}
    LIMIT 1
  )
`

const profileIndustryCodeExpression = `
  (
    SELECT pr.primaryIndustryCode
    FROM profiles pr
    WHERE pr.id = posts.profileId
      AND pr.channelCode = ${selectChannelCodeExpression}
    LIMIT 1
  )
`

const profileIndustrySubtypeCodeExpression = `
  (
    SELECT pr.primaryIndustrySubtypeCode
    FROM profiles pr
    WHERE pr.id = posts.profileId
      AND pr.channelCode = ${selectChannelCodeExpression}
    LIMIT 1
  )
`

const selectIndustryIdExpression =
  hasIndustryIdBefore
    ? `COALESCE(posts.industryId, ${profileIndustryIdExpression})`
    : profileIndustryIdExpression

const selectIndustrySubtypeIdExpression =
  hasIndustrySubtypeIdBefore
    ? `COALESCE(posts.industrySubtypeId, ${profileIndustrySubtypeIdExpression})`
    : profileIndustrySubtypeIdExpression

const selectIndustryCodeExpression =
  hasIndustryCodeBefore
    ? `COALESCE(posts.industryCode, ${profileIndustryCodeExpression})`
    : profileIndustryCodeExpression

const selectIndustrySubtypeCodeExpression =
  hasIndustrySubtypeCodeBefore
    ? `COALESCE(posts.industrySubtypeCode, ${profileIndustrySubtypeCodeExpression})`
    : profileIndustrySubtypeCodeExpression

/* =========================================
POSTS TABLE MIGRATION
주의:
- industry* 컬럼 추가만으로는 rebuild 하지 않는다.
- industry* 컬럼은 safeAddColumn + backfill로 처리한다.
- rebuild는 legacy authorChannelCode / channelCode 보정 / status DRAFT CHECK 보정이 필요할 때만 수행한다.
========================================= */

const shouldMigratePostsTable =
  hasLegacyAuthorChannelCodeBefore ||
  !hasChannelCodeBefore ||
  !postsStatusAllowsDraft

if (shouldMigratePostsTable) {
  db.exec(`PRAGMA foreign_keys = OFF`)

  try {
    db.exec(`DROP TABLE IF EXISTS posts_new`)

    db.exec(`

    CREATE TABLE posts_new(

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      profileId INTEGER NOT NULL,

      channelCode TEXT NOT NULL,

      regionId INTEGER,

      contentType TEXT NOT NULL
      CHECK(contentType IN(
        'LIFE',
        'PLACE'
      )),

      postType TEXT NOT NULL
      CHECK(postType IN(
        'GENERAL',
        'GALLERY',
        'PRODUCT',
        'EVENT',
        'REVIEW'
      )),

      /*
      =========================================
      INDUSTRY SNAPSHOT
      원본: profiles.primaryIndustry*
      목적: feed query JOIN 감소
      FK 없음
      =========================================
      */
      industryId INTEGER,

      industrySubtypeId INTEGER,

      industryCode TEXT,

      industrySubtypeCode TEXT,

      title TEXT,

      content TEXT,

      priceAmount INTEGER
      CHECK(priceAmount IS NULL OR priceAmount >= 0),

      eventStartAt TEXT,

      eventEndAt TEXT,

      visibility TEXT DEFAULT 'PUBLIC'
      CHECK(visibility IN(
        'PUBLIC',
        'FOLLOWERS',
        'PRIVATE'
      )),

      mediaCount INTEGER DEFAULT 0,

      latitude REAL,

      longitude REAL,

      status TEXT DEFAULT 'ACTIVE'
      CHECK(status IN(
        'ACTIVE',
        'DRAFT',
        'HIDDEN',
        'DELETED'
      )),

      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,

      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY(profileId)
      REFERENCES profiles(id),

      FOREIGN KEY(channelCode)
      REFERENCES profiles(channelCode),

      FOREIGN KEY(regionId)
      REFERENCES regions(id)

    )

    `)

    db.exec(`

    INSERT INTO posts_new(
      id,
      profileId,
      channelCode,
      regionId,
      contentType,
      postType,
      industryId,
      industrySubtypeId,
      industryCode,
      industrySubtypeCode,
      title,
      content,
      priceAmount,
      eventStartAt,
      eventEndAt,
      visibility,
      mediaCount,
      latitude,
      longitude,
      status,
      createdAt,
      updatedAt
    )
    SELECT
      posts.id,
      posts.profileId,
      ${selectChannelCodeExpression} AS channelCode,
      posts.regionId,
      posts.contentType,
      COALESCE(posts.postType, 'GENERAL') AS postType,
      ${selectIndustryIdExpression} AS industryId,
      ${selectIndustrySubtypeIdExpression} AS industrySubtypeId,
      ${selectIndustryCodeExpression} AS industryCode,
      ${selectIndustrySubtypeCodeExpression} AS industrySubtypeCode,
      ${selectTitleExpression} AS title,
      posts.content,
      ${selectPriceAmountExpression} AS priceAmount,
      ${selectEventStartAtExpression} AS eventStartAt,
      ${selectEventEndAtExpression} AS eventEndAt,
      COALESCE(posts.visibility, 'PUBLIC') AS visibility,
      COALESCE(posts.mediaCount, 0) AS mediaCount,
      posts.latitude,
      posts.longitude,
      COALESCE(posts.status, 'ACTIVE') AS status,
      COALESCE(posts.createdAt, CURRENT_TIMESTAMP) AS createdAt,
      COALESCE(posts.updatedAt, CURRENT_TIMESTAMP) AS updatedAt
    FROM posts

    `)

    db.exec(`DROP TABLE posts`)
    db.exec(`ALTER TABLE posts_new RENAME TO posts`)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}

/* =========================================
POSTS INDUSTRY SNAPSHOT BACKFILL
- 원본: profiles.primaryIndustry*
- snapshot: posts.industry*
- 목적: feed query JOIN 감소
========================================= */

db.exec(`

UPDATE posts
SET
  industryId = COALESCE(
    industryId,
    (
      SELECT pr.primaryIndustryId
      FROM profiles pr
      WHERE pr.id = posts.profileId
        AND pr.channelCode = posts.channelCode
      LIMIT 1
    )
  ),
  industrySubtypeId = COALESCE(
    industrySubtypeId,
    (
      SELECT pr.primaryIndustrySubtypeId
      FROM profiles pr
      WHERE pr.id = posts.profileId
        AND pr.channelCode = posts.channelCode
      LIMIT 1
    )
  ),
  industryCode = COALESCE(
    industryCode,
    (
      SELECT pr.primaryIndustryCode
      FROM profiles pr
      WHERE pr.id = posts.profileId
        AND pr.channelCode = posts.channelCode
      LIMIT 1
    )
  ),
  industrySubtypeCode = COALESCE(
    industrySubtypeCode,
    (
      SELECT pr.primaryIndustrySubtypeCode
      FROM profiles pr
      WHERE pr.id = posts.profileId
        AND pr.channelCode = posts.channelCode
      LIMIT 1
    )
  )
WHERE EXISTS(
  SELECT 1
  FROM profiles pr
  WHERE pr.id = posts.profileId
    AND pr.channelCode = posts.channelCode
)

`)

db.exec(`
UPDATE posts
SET postCode = 'PT' || substr('0000000000' || id, -10, 10)
WHERE postCode IS NULL
`)

/* =========================================
INDEX
========================================= */

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_profile
ON posts(profileId)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_channel
ON posts(channelCode)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_post_type
ON posts(postType)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_content_type
ON posts(contentType)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_region
ON posts(regionId)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_status
ON posts(status)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_created
ON posts(createdAt)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_price_amount
ON posts(priceAmount)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_event_period
ON posts(eventStartAt, eventEndAt)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_industry
ON posts(industryId)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_industry_subtype
ON posts(industrySubtypeId)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_industry_code
ON posts(industryCode)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_industry_subtype_code
ON posts(industrySubtypeCode)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_status_region_industry_created
ON posts(status, regionId, industryId, createdAt)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_status_region_industry_type_created
ON posts(status, regionId, industryId, postType, createdAt)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_posts_channel_industry_created
ON posts(channelCode, industryId, createdAt)

`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_channel_post_code_unique
ON posts(channelCode, postCode)
WHERE postCode IS NOT NULL
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_posts_post_code
ON posts(postCode)
`)

//=======================================================
// SECTION 10 : POST IMAGES

db.exec(`

CREATE TABLE IF NOT EXISTS post_images(

id INTEGER PRIMARY KEY AUTOINCREMENT,

postId INTEGER,

imageAssetId INTEGER,

sortOrder INTEGER DEFAULT 1,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(postId) REFERENCES posts(id),

FOREIGN KEY(imageAssetId) REFERENCES image_assets(id)

)

`)

// ================= INDEX

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_post_images_post

ON post_images(postId)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_post_images_asset

ON post_images(imageAssetId)

`)

//===================================================
// SECTION 11 : CATEGORIES (커뮤니티 기본 카테고리)

db.exec(`

CREATE TABLE IF NOT EXISTS categories(

id INTEGER PRIMARY KEY AUTOINCREMENT,

code TEXT UNIQUE,

name TEXT,

type TEXT,

isActive INTEGER DEFAULT 1,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP

)

`)



const insertCategory=db.prepare(`

INSERT OR IGNORE INTO categories(
code,
name,
type
)

VALUES(?,?,?)

`)



insertCategory.run('LIFE','Life','COMMUNITY')
insertCategory.run('LOCAL','Local','COMMUNITY')
insertCategory.run('MARKET','Market','COMMUNITY')
insertCategory.run('JOB','Job','COMMUNITY')
insertCategory.run('INFO','Info','COMMUNITY')
insertCategory.run('FOOD','Food','COMMUNITY')
insertCategory.run('HOBBY','Hobby','COMMUNITY')
insertCategory.run('SPORT','Sport','COMMUNITY')
insertCategory.run('TRAVEL','Travel','COMMUNITY')
insertCategory.run('PET','Pet','COMMUNITY')
insertCategory.run('PARENT','Parent','COMMUNITY')
insertCategory.run('CAR','Car','COMMUNITY')
insertCategory.run('TECH','Tech','COMMUNITY')
insertCategory.run('FREE','Free','COMMUNITY')
insertCategory.run('MEET','Meet','COMMUNITY')



//==========================================================
// SECTION 12 : PROFILE CATEGORY MAP (FIXED)
// ROLE : PROFILE CATEGORY (GENERAL CATEGORY RELATION)
// STATUS : FINAL (NAME COLLISION RESOLVED)
//==========================================================

db.exec(`

CREATE TABLE IF NOT EXISTS profile_category_map(

id INTEGER PRIMARY KEY AUTOINCREMENT,

/* ================================
ROOT
================================ */

profileId INTEGER NOT NULL,
categoryId INTEGER NOT NULL,

/* ================================
TIME
================================ */

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,

/* ================================
FK
================================ */

FOREIGN KEY(profileId)
REFERENCES profiles(id),

FOREIGN KEY(categoryId)
REFERENCES categories(id)

)

`)

/* ==================================================
INDEX : profile/category 조회 최적화
================================================== */

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_profile_category_map_profile
ON profile_category_map(profileId)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_profile_category_map_category
ON profile_category_map(categoryId)

`)

/* ==================================================
UNIQUE : profile + category 중복 방지
================================================== */

db.exec(`

CREATE UNIQUE INDEX IF NOT EXISTS
idx_profile_category_map_unique
ON profile_category_map(profileId, categoryId)

`)

//===================================================
// SECTION 13 : POST CATEGORY MAP

db.exec(`

CREATE TABLE IF NOT EXISTS post_categories(

id INTEGER PRIMARY KEY AUTOINCREMENT,

postId INTEGER,

categoryId INTEGER,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(postId)
REFERENCES posts(id),

FOREIGN KEY(categoryId)
REFERENCES categories(id)

)

`)

//===================================================
// SECTION 14 : POST ENGAGEMENTS (SNS CORE CACHE)

db.exec(`

CREATE TABLE IF NOT EXISTS post_engagements(

postId INTEGER PRIMARY KEY,

likeCount INTEGER DEFAULT 0,

commentCount INTEGER DEFAULT 0,

viewCount INTEGER DEFAULT 0,

shareCount INTEGER DEFAULT 0,

saveCount INTEGER DEFAULT 0,

score REAL DEFAULT 0,

lastEngagedAt TEXT,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,

updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(postId)
REFERENCES posts(id)
ON DELETE CASCADE

)

`)

/* INDEX */

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_post_engagements_score

ON post_engagements(score)

`)

db.exec(`

CREATE INDEX IF NOT EXISTS
idx_post_engagements_updated

ON post_engagements(updatedAt)

`)

//===================================================
// SECTION 15 : POS PRODUCT & ORDER TABLES (SNAPSHOT)

const hasPosLocationsTable =
  db.prepare(`
    SELECT 1
    FROM sqlite_master
    WHERE type = 'table'
      AND name = 'pos_locations'
    LIMIT 1
  `).get() as { 1?: number } | undefined

if (hasPosLocationsTable) {
  db.exec(`
    UPDATE pos_locations
    SET tableCode = NULL
    WHERE tableCode IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM pos_locations dup
        WHERE dup.channelCode = pos_locations.channelCode
          AND dup.tableCode = pos_locations.tableCode
          AND dup.id < pos_locations.id
      )
  `)
}

db.exec(`

CREATE TABLE IF NOT EXISTS pos_menu_configs(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
menuType TEXT NOT NULL CHECK(menuType IN('PRODUCT','RESERVATION','PICKUP','DELIVERY','ORDER_HISTORY','SALES_HISTORY')),
menuName TEXT NOT NULL,
isEnabled INTEGER DEFAULT 1 CHECK(isEnabled IN(0,1)),
isFixed INTEGER DEFAULT 0 CHECK(isFixed IN(0,1)),
sortOrder INTEGER DEFAULT 0,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
deletedAt TEXT,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
UNIQUE(profileId, channelCode, menuType)
);

CREATE INDEX IF NOT EXISTS idx_pos_menu_configs_channel
ON pos_menu_configs(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_menu_configs_profile
ON pos_menu_configs(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_menu_configs_sort
ON pos_menu_configs(sortOrder);

CREATE TABLE IF NOT EXISTS pos_order_type_configs(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
orderTypeCode TEXT NOT NULL
CHECK(orderTypeCode IN(
'TABLE',
'RESERVATION',
'DELIVERY',
'PICKUP',
'QR_ORDER',
'KIOSK'
)),
defaultTitle TEXT NOT NULL,
customTitle TEXT,
description TEXT,
isEnabled INTEGER NOT NULL DEFAULT 1
CHECK(isEnabled IN(0,1)),
isFixed INTEGER NOT NULL DEFAULT 1
CHECK(isFixed IN(0,1)),
sortOrder INTEGER NOT NULL DEFAULT 0,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
deletedAt TEXT,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
UNIQUE(profileId, channelCode, orderTypeCode)
);

CREATE INDEX IF NOT EXISTS idx_pos_order_type_configs_channel
ON pos_order_type_configs(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_order_type_configs_profile
ON pos_order_type_configs(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_order_type_configs_code
ON pos_order_type_configs(orderTypeCode);

CREATE INDEX IF NOT EXISTS idx_pos_order_type_configs_enabled
ON pos_order_type_configs(isEnabled);

CREATE INDEX IF NOT EXISTS idx_pos_order_type_configs_sort
ON pos_order_type_configs(profileId, channelCode, sortOrder);

CREATE TABLE IF NOT EXISTS pos_product_categories(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
categoryCode TEXT NOT NULL DEFAULT 'CUSTOM',
categoryName TEXT NOT NULL,
sortOrder INTEGER DEFAULT 0,
isActive INTEGER DEFAULT 1 CHECK(isActive IN(0,1)),
isDefault INTEGER DEFAULT 0 CHECK(isDefault IN(0,1)),
isDeletable INTEGER DEFAULT 1 CHECK(isDeletable IN(0,1)),
ageRestrictionType TEXT DEFAULT 'NONE',
requiresAdultVerification INTEGER DEFAULT 0 CHECK(requiresAdultVerification IN(0,1)),
restrictedOrderChannel TEXT DEFAULT 'NONE',
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
deletedAt TEXT,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
UNIQUE(channelCode, categoryCode)
);

CREATE INDEX IF NOT EXISTS idx_pos_product_categories_channel
ON pos_product_categories(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_product_categories_profile
ON pos_product_categories(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_product_categories_sort
ON pos_product_categories(sortOrder);

CREATE INDEX IF NOT EXISTS idx_pos_product_categories_active
ON pos_product_categories(isActive);

CREATE TABLE IF NOT EXISTS pos_products(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
productId TEXT,
masterProductId INTEGER,
productCode TEXT CHECK(
  productCode IS NULL
  OR productCode LIKE 'RPB%'
  OR productCode LIKE 'RPN%'
),
sourceType TEXT NOT NULL DEFAULT 'POS_PRODUCT' CHECK(sourceType IN('POS_PRODUCT','MARKET_PRODUCT')),
productType TEXT NOT NULL DEFAULT 'PRODUCT' CHECK(productType IN('PRODUCT')),
productKind TEXT NOT NULL CHECK(productKind IN('MAIN_PRODUCT','SUB_PRODUCT')),
categoryId INTEGER,
productName TEXT NOT NULL,
productDescription TEXT,
basePrice INTEGER NOT NULL DEFAULT 0 CHECK(basePrice >= 0),
currency TEXT DEFAULT 'KRW',
isActive INTEGER DEFAULT 1 CHECK(isActive IN(0,1)),
isSoldOut INTEGER DEFAULT 0 CHECK(isSoldOut IN(0,1)),
isFeatured INTEGER DEFAULT 0 CHECK(isFeatured IN(0,1)),
isRepresentative INTEGER DEFAULT 0 CHECK(isRepresentative IN(0,1)),
showOnTableOrder INTEGER DEFAULT 1 CHECK(showOnTableOrder IN(0,1)),
allowNormalOrder INTEGER DEFAULT 1 CHECK(allowNormalOrder IN(0,1)),
allowReservationOrder INTEGER DEFAULT 0 CHECK(allowReservationOrder IN(0,1)),
allowDineIn INTEGER DEFAULT 1 CHECK(allowDineIn IN(0,1)),
allowTakeout INTEGER DEFAULT 1 CHECK(allowTakeout IN(0,1)),
allowDelivery INTEGER DEFAULT 1 CHECK(allowDelivery IN(0,1)),
menuStatus TEXT DEFAULT 'ON_SALE' CHECK(menuStatus IN('ON_SALE','STOPPED')),
sortOrder INTEGER DEFAULT 0,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
deletedAt TEXT,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(categoryId) REFERENCES pos_product_categories(id),
UNIQUE(profileId, channelCode, productName)
);

CREATE INDEX IF NOT EXISTS idx_pos_products_channel
ON pos_products(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_products_profile
ON pos_products(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_products_category
ON pos_products(categoryId);

CREATE INDEX IF NOT EXISTS idx_pos_products_type
ON pos_products(productType);

CREATE INDEX IF NOT EXISTS idx_pos_products_kind
ON pos_products(productKind);

CREATE INDEX IF NOT EXISTS idx_pos_products_active
ON pos_products(isActive);

CREATE INDEX IF NOT EXISTS idx_pos_products_sort
ON pos_products(sortOrder);

CREATE TABLE IF NOT EXISTS pos_product_scan_codes(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
productDbId INTEGER NOT NULL,
productId TEXT,
productCode TEXT NOT NULL CHECK(productCode LIKE 'RPB%' OR productCode LIKE 'RPN%'),
sourceType TEXT NOT NULL DEFAULT 'POS_PRODUCT'
CHECK(sourceType IN('POS_PRODUCT','MARKET_PRODUCT')),
scanCodeType TEXT NOT NULL DEFAULT 'RAPUS_QR'
CHECK(scanCodeType IN(
  'RAPUS_QR',
  'RAPUS_BARCODE',
  'EXTERNAL_BARCODE',
  'INTERNAL',
  'CUSTOM'
)),
scanCodeValue TEXT NOT NULL,
scanCodeSource TEXT DEFAULT 'RAPUS'
CHECK(scanCodeSource IN(
  'RAPUS',
  'MANUFACTURER',
  'DISTRIBUTOR',
  'MERCHANT',
  'CUSTOM'
)),
externalBarcodeFormat TEXT
CHECK(
  externalBarcodeFormat IS NULL
  OR externalBarcodeFormat IN(
    'EAN13',
    'EAN8',
    'UPC_A',
    'UPC_E',
    'CODE128',
    'GTIN14',
    'CUSTOM'
  )
),
isPrimary INTEGER NOT NULL DEFAULT 0
CHECK(isPrimary IN(0,1)),
isActive INTEGER NOT NULL DEFAULT 1
CHECK(isActive IN(0,1)),
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
deletedAt TEXT,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(productDbId) REFERENCES pos_products(id)
);

CREATE INDEX IF NOT EXISTS idx_pos_product_scan_codes_channel
ON pos_product_scan_codes(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_product_scan_codes_product_code
ON pos_product_scan_codes(productCode);

CREATE INDEX IF NOT EXISTS idx_pos_product_scan_codes_product_db
ON pos_product_scan_codes(productDbId);

CREATE INDEX IF NOT EXISTS idx_pos_product_scan_codes_type
ON pos_product_scan_codes(scanCodeType);

CREATE INDEX IF NOT EXISTS idx_pos_product_scan_codes_value
ON pos_product_scan_codes(scanCodeValue);

CREATE INDEX IF NOT EXISTS idx_pos_product_scan_codes_source
ON pos_product_scan_codes(scanCodeSource);

CREATE INDEX IF NOT EXISTS idx_pos_product_scan_codes_external_format
ON pos_product_scan_codes(externalBarcodeFormat);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_product_scan_codes_channel_value_unique
ON pos_product_scan_codes(channelCode, scanCodeValue)
WHERE deletedAt IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_product_scan_codes_primary_unique
ON pos_product_scan_codes(channelCode, productCode)
WHERE isPrimary = 1
  AND deletedAt IS NULL;

CREATE TABLE IF NOT EXISTS pos_product_options(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
productId INTEGER NOT NULL,
productCode TEXT CHECK(
  productCode IS NULL
  OR productCode LIKE 'RPB%'
  OR productCode LIKE 'RPN%'
),
optionName TEXT NOT NULL,
optionType TEXT NOT NULL CHECK(optionType IN('SIZE','TEMPERATURE','ADDON','CHOICE','CUSTOM')),
isRequired INTEGER DEFAULT 0 CHECK(isRequired IN(0,1)),
isMultiple INTEGER DEFAULT 0 CHECK(isMultiple IN(0,1)),
minSelectCount INTEGER DEFAULT 0 CHECK(minSelectCount >= 0),
maxSelectCount INTEGER DEFAULT 1 CHECK(maxSelectCount >= 0),
isActive INTEGER DEFAULT 1 CHECK(isActive IN(0,1)),
sortOrder INTEGER DEFAULT 0,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
deletedAt TEXT,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(productId) REFERENCES pos_products(id),
UNIQUE(profileId, channelCode, productId, optionName)
);

CREATE INDEX IF NOT EXISTS idx_pos_product_options_channel
ON pos_product_options(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_product_options_profile
ON pos_product_options(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_product_options_product
ON pos_product_options(productId);

CREATE INDEX IF NOT EXISTS idx_pos_product_options_type
ON pos_product_options(optionType);

CREATE INDEX IF NOT EXISTS idx_pos_product_options_active
ON pos_product_options(isActive);

CREATE INDEX IF NOT EXISTS idx_pos_product_options_sort
ON pos_product_options(sortOrder);

CREATE TABLE IF NOT EXISTS pos_product_option_values(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
optionId INTEGER NOT NULL,
productCode TEXT CHECK(
  productCode IS NULL
  OR productCode LIKE 'RPB%'
  OR productCode LIKE 'RPN%'
),
optionValueName TEXT NOT NULL,
priceDelta INTEGER DEFAULT 0,
isDefault INTEGER DEFAULT 0 CHECK(isDefault IN(0,1)),
isActive INTEGER DEFAULT 1 CHECK(isActive IN(0,1)),
optionValueType TEXT DEFAULT 'CUSTOM' CHECK(optionValueType IN('BASE','CUSTOM')),
isVisible INTEGER DEFAULT 1 CHECK(isVisible IN(0,1)),
isQuantityEnabled INTEGER NOT NULL DEFAULT 0 CHECK(isQuantityEnabled IN(0,1)),
isQuantityLimitEnabled INTEGER NOT NULL DEFAULT 0 CHECK(isQuantityLimitEnabled IN(0,1)),
minOptionQuantity INTEGER NOT NULL DEFAULT 1 CHECK(minOptionQuantity >= 1),
maxOptionQuantity INTEGER CHECK(maxOptionQuantity IS NULL OR maxOptionQuantity >= 1),
defaultOptionQuantity INTEGER NOT NULL DEFAULT 1 CHECK(defaultOptionQuantity >= 1),
sortOrder INTEGER DEFAULT 0,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
deletedAt TEXT,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(optionId) REFERENCES pos_product_options(id),
UNIQUE(profileId, channelCode, optionId, optionValueName)
);

CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_channel
ON pos_product_option_values(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_profile
ON pos_product_option_values(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_option
ON pos_product_option_values(optionId);

CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_active
ON pos_product_option_values(isActive);

CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_sort
ON pos_product_option_values(sortOrder);

CREATE TABLE IF NOT EXISTS pos_product_relations(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
mainProductId INTEGER NOT NULL,
subProductId INTEGER NOT NULL,
relationType TEXT NOT NULL CHECK(relationType IN('ADDON_PRODUCT','SET_PRODUCT','RECOMMENDED_PRODUCT','BUNDLE_PRODUCT')),
isRequired INTEGER DEFAULT 0 CHECK(isRequired IN(0,1)),
isActive INTEGER DEFAULT 1 CHECK(isActive IN(0,1)),
sortOrder INTEGER DEFAULT 0,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
deletedAt TEXT,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(mainProductId) REFERENCES pos_products(id),
FOREIGN KEY(subProductId) REFERENCES pos_products(id),
UNIQUE(profileId, channelCode, mainProductId, subProductId, relationType)
);

CREATE INDEX IF NOT EXISTS idx_pos_product_relations_channel
ON pos_product_relations(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_product_relations_profile
ON pos_product_relations(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_product_relations_main
ON pos_product_relations(mainProductId);

CREATE INDEX IF NOT EXISTS idx_pos_product_relations_sub
ON pos_product_relations(subProductId);

CREATE INDEX IF NOT EXISTS idx_pos_product_relations_type
ON pos_product_relations(relationType);

CREATE INDEX IF NOT EXISTS idx_pos_product_relations_active
ON pos_product_relations(isActive);

CREATE TABLE IF NOT EXISTS pos_table_type_codes(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
tableTypeCode TEXT NOT NULL,
displayName TEXT NOT NULL,
description TEXT,
colorCode TEXT,
isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
isDefault INTEGER NOT NULL DEFAULT 0 CHECK(isDefault IN(0,1)),
sortOrder INTEGER DEFAULT 0,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
deletedAt TEXT,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
UNIQUE(profileId, channelCode, tableTypeCode)
);

CREATE INDEX IF NOT EXISTS idx_pos_table_type_codes_channel
ON pos_table_type_codes(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_table_type_codes_profile
ON pos_table_type_codes(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_table_type_codes_code
ON pos_table_type_codes(tableTypeCode);

CREATE INDEX IF NOT EXISTS idx_pos_table_type_codes_active
ON pos_table_type_codes(isActive);

CREATE INDEX IF NOT EXISTS idx_pos_table_type_codes_sort
ON pos_table_type_codes(sortOrder);

CREATE TABLE IF NOT EXISTS pos_locations(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
locationType TEXT NOT NULL CHECK(locationType IN('TABLE','SEAT','ROOM','BED','BOOTH','COUNTER','CLASSROOM','TREATMENT_ROOM','CUSTOM')),
tableTypeCode TEXT,
locationName TEXT NOT NULL,
locationGroupName TEXT,
capacity INTEGER,
tableOptionName TEXT,
floor TEXT DEFAULT '1층',
zone TEXT DEFAULT '홀',
floorSortOrder INTEGER DEFAULT 1,
zoneSortOrder INTEGER DEFAULT 1,
layoutX INTEGER DEFAULT 0,
layoutY INTEGER DEFAULT 0,
layoutWidth INTEGER DEFAULT 180,
layoutHeight INTEGER DEFAULT 140,
layoutRotate INTEGER DEFAULT 0,
layoutShape TEXT DEFAULT 'RECT',
tableCode TEXT
CHECK(
  tableCode IS NULL
  OR length(tableCode) = 12
),
qrStatus TEXT DEFAULT 'DISCONNECTED' CHECK(qrStatus IN('CONNECTED','DISCONNECTED')),
qrBaseUrl TEXT,
qrRoutePath TEXT,
tableOrderUrl TEXT,
qrCodeValue TEXT,
qrGeneratedAt TEXT,
qrConnectedAt TEXT,
qrDisconnectedAt TEXT,
resourceStatus TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(resourceStatus IN('AVAILABLE','RESERVED','IN_USE','WAITING','CHECKIN_READY','CHECKOUT_PENDING','CLEANING','CLEAN_DONE','MAINTENANCE','DISABLED')),
lastStatusChangedAt TEXT,
isActive INTEGER DEFAULT 1 CHECK(isActive IN(0,1)),
sortOrder INTEGER DEFAULT 0,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
deletedAt TEXT,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)
);

CREATE INDEX IF NOT EXISTS idx_pos_locations_channel
ON pos_locations(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_locations_profile
ON pos_locations(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_locations_type
ON pos_locations(locationType);

CREATE INDEX IF NOT EXISTS idx_pos_locations_table_type_code
ON pos_locations(tableTypeCode);

CREATE INDEX IF NOT EXISTS idx_pos_locations_channel_table_type
ON pos_locations(channelCode, tableTypeCode);

CREATE INDEX IF NOT EXISTS idx_pos_locations_active
ON pos_locations(isActive);

CREATE INDEX IF NOT EXISTS idx_pos_locations_sort
ON pos_locations(sortOrder);

CREATE INDEX IF NOT EXISTS idx_pos_locations_qr_status
ON pos_locations(qrStatus);

CREATE INDEX IF NOT EXISTS idx_pos_locations_group
ON pos_locations(locationGroupName);

CREATE INDEX IF NOT EXISTS idx_pos_locations_table_option
ON pos_locations(tableOptionName);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_locations_table_code_unique
ON pos_locations(channelCode, tableCode)
WHERE tableCode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pos_locations_table_code
ON pos_locations(channelCode, tableCode);

CREATE INDEX IF NOT EXISTS idx_pos_locations_table_order_url
ON pos_locations(tableOrderUrl);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_locations_table_order_url_unique
ON pos_locations(tableOrderUrl)
WHERE tableOrderUrl IS NOT NULL;

CREATE TABLE IF NOT EXISTS pos_orders(
id INTEGER PRIMARY KEY AUTOINCREMENT,
orderCode TEXT NOT NULL CHECK(length(orderCode) = 12),
revisionCode TEXT NOT NULL UNIQUE CHECK(length(revisionCode) = 12),
revisionNo INTEGER NOT NULL DEFAULT 1 CHECK(revisionNo >= 1),
orderDate TEXT NOT NULL,
orderYear INTEGER NOT NULL,
orderMonth INTEGER NOT NULL CHECK(orderMonth BETWEEN 1 AND 12),
orderDay INTEGER NOT NULL CHECK(orderDay BETWEEN 1 AND 31),
orderSequence INTEGER NOT NULL DEFAULT 1 CHECK(orderSequence >= 1),
providerProfileId INTEGER NOT NULL,
providerChannelCode TEXT NOT NULL,
customerProfileId INTEGER,
customerChannelCode TEXT,
orderSource TEXT NOT NULL CHECK(orderSource IN('POS','KIOSK','TABLE_ORDER','QR_ORDER','ROOM_ORDER','ONLINE','PHONE','ADMIN')),
orderFlowType TEXT NOT NULL CHECK(orderFlowType IN('IN_STORE','PICKUP','DELIVERY','RESERVATION','SERVICE','ROOM_SERVICE')),
locationId INTEGER,
locationNameSnapshot TEXT,
        orderStatus TEXT NOT NULL DEFAULT 'CREATED' CHECK(orderStatus IN('CREATED','CONFIRMED','PREPARING','READY','COMPLETED','REPLACED','CANCELLED','ADMIN_DISABLED')),
paymentStatus TEXT NOT NULL DEFAULT 'UNPAID' CHECK(paymentStatus IN('UNPAID','PAID','PARTIAL','REFUNDED','CANCELED','CANCELLED')),
subtotalAmount INTEGER NOT NULL DEFAULT 0 CHECK(subtotalAmount >= 0),
discountAmount INTEGER NOT NULL DEFAULT 0 CHECK(discountAmount >= 0),
  taxAmount INTEGER NOT NULL DEFAULT 0 CHECK(taxAmount >= 0),
  totalAmount INTEGER NOT NULL DEFAULT 0 CHECK(totalAmount >= 0),
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0, 1)),
  memo TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
completedAt TEXT,
canceledAt TEXT,
FOREIGN KEY(providerProfileId) REFERENCES profiles(id),
FOREIGN KEY(providerChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(customerProfileId) REFERENCES profiles(id),
FOREIGN KEY(customerChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(locationId) REFERENCES pos_locations(id),
UNIQUE(providerChannelCode, revisionCode),
UNIQUE(providerChannelCode, orderCode, revisionNo)
);

CREATE INDEX IF NOT EXISTS idx_pos_orders_provider_channel
ON pos_orders(providerChannelCode);

CREATE INDEX IF NOT EXISTS idx_pos_orders_provider_profile
ON pos_orders(providerProfileId);

CREATE INDEX IF NOT EXISTS idx_pos_orders_customer_channel
ON pos_orders(customerChannelCode);

CREATE INDEX IF NOT EXISTS idx_pos_orders_location
ON pos_orders(locationId);

CREATE INDEX IF NOT EXISTS idx_pos_orders_order_status
ON pos_orders(orderStatus);

CREATE INDEX IF NOT EXISTS idx_pos_orders_payment_status
ON pos_orders(paymentStatus);

CREATE INDEX IF NOT EXISTS idx_pos_orders_created
ON pos_orders(createdAt);

CREATE INDEX IF NOT EXISTS idx_pos_orders_provider_date_sequence
ON pos_orders(providerChannelCode, orderDate, orderSequence);

CREATE INDEX IF NOT EXISTS idx_pos_orders_order_code
ON pos_orders(orderCode);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_orders_provider_revision_code_unique
ON pos_orders(providerChannelCode, revisionCode)
WHERE revisionCode IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_orders_provider_order_revision_no_unique
ON pos_orders(providerChannelCode, orderCode, revisionNo);

CREATE INDEX IF NOT EXISTS idx_pos_orders_provider_order_code
ON pos_orders(providerChannelCode, orderCode);

CREATE INDEX IF NOT EXISTS idx_pos_orders_provider_order_revision_no
ON pos_orders(providerChannelCode, orderCode, revisionNo);

CREATE INDEX IF NOT EXISTS idx_pos_orders_provider_location_active_payment
ON pos_orders(providerChannelCode, locationId, isActive, paymentStatus);

CREATE INDEX IF NOT EXISTS idx_pos_orders_order_date
ON pos_orders(orderDate);

CREATE INDEX IF NOT EXISTS idx_pos_orders_order_year_month_day
ON pos_orders(orderYear, orderMonth, orderDay);

CREATE TABLE IF NOT EXISTS pos_order_items(
id INTEGER PRIMARY KEY AUTOINCREMENT,
orderId INTEGER NOT NULL,
orderCode TEXT NOT NULL CHECK(length(orderCode) = 12),
revisionCode TEXT NOT NULL CHECK(length(revisionCode) = 12),
revisionNo INTEGER NOT NULL DEFAULT 1 CHECK(revisionNo >= 1),
providerChannelCode TEXT NOT NULL,
posProductId INTEGER,
productCode TEXT CHECK(productCode IS NULL OR productCode LIKE 'RPB%' OR productCode LIKE 'RPN%'),
productId TEXT,
sourceType TEXT,
cartCode TEXT CHECK(cartCode IS NULL OR length(cartCode)=12),
cartItemCode TEXT CHECK(cartItemCode IS NULL OR length(cartItemCode)=12),
optionSignature TEXT,
fulfillmentType TEXT,
fulfillmentSignature TEXT,
productTypeSnapshot TEXT NOT NULL CHECK(productTypeSnapshot IN('PRODUCT')),
productKindSnapshot TEXT NOT NULL CHECK(productKindSnapshot IN('MAIN_PRODUCT','SUB_PRODUCT')),
categoryNameSnapshot TEXT,
productNameSnapshot TEXT NOT NULL,
unitPriceSnapshot INTEGER NOT NULL DEFAULT 0 CHECK(unitPriceSnapshot >= 0),
quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
lineTotalAmount INTEGER NOT NULL DEFAULT 0 CHECK(lineTotalAmount >= 0),
sortOrder INTEGER DEFAULT 0,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(orderId) REFERENCES pos_orders(id),
FOREIGN KEY(providerChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(posProductId) REFERENCES pos_products(id)
);

CREATE INDEX IF NOT EXISTS idx_pos_order_items_order
ON pos_order_items(orderId);

CREATE INDEX IF NOT EXISTS idx_pos_order_items_provider
ON pos_order_items(providerChannelCode);

CREATE INDEX IF NOT EXISTS idx_pos_order_items_product
ON pos_order_items(posProductId);

CREATE INDEX IF NOT EXISTS idx_pos_order_items_kind
ON pos_order_items(productKindSnapshot);

CREATE INDEX IF NOT EXISTS idx_pos_order_items_created
ON pos_order_items(createdAt);

CREATE INDEX IF NOT EXISTS idx_pos_order_items_order_code
ON pos_order_items(orderCode);

CREATE INDEX IF NOT EXISTS idx_pos_order_items_revision_code
ON pos_order_items(revisionCode);

CREATE INDEX IF NOT EXISTS idx_pos_order_items_provider_order_code
ON pos_order_items(providerChannelCode, orderCode);

CREATE INDEX IF NOT EXISTS idx_pos_order_items_provider_order_revision_no
ON pos_order_items(providerChannelCode, orderCode, revisionNo);

CREATE INDEX IF NOT EXISTS idx_pos_order_items_order_id_order_code
ON pos_order_items(orderId, orderCode);

CREATE INDEX IF NOT EXISTS idx_pos_order_items_order_id_order_code_revision
ON pos_order_items(orderId, orderCode, revisionCode);

CREATE TABLE IF NOT EXISTS pos_order_item_options(
id INTEGER PRIMARY KEY AUTOINCREMENT,
orderItemId INTEGER NOT NULL,
providerChannelCode TEXT NOT NULL,
productOptionId INTEGER,
productOptionValueId INTEGER,
optionNameSnapshot TEXT NOT NULL,
optionTypeSnapshot TEXT NOT NULL CHECK(optionTypeSnapshot IN('SIZE','TEMPERATURE','ADDON','CHOICE','CUSTOM')),
optionValueNameSnapshot TEXT NOT NULL,
priceDeltaSnapshot INTEGER NOT NULL DEFAULT 0,
quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
lineOptionAmount INTEGER NOT NULL DEFAULT 0,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(orderItemId) REFERENCES pos_order_items(id),
FOREIGN KEY(providerChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(productOptionId) REFERENCES pos_product_options(id),
FOREIGN KEY(productOptionValueId) REFERENCES pos_product_option_values(id)
);

CREATE INDEX IF NOT EXISTS idx_pos_order_item_options_order_item
ON pos_order_item_options(orderItemId);

CREATE INDEX IF NOT EXISTS idx_pos_order_item_options_provider
ON pos_order_item_options(providerChannelCode);

CREATE INDEX IF NOT EXISTS idx_pos_order_item_options_option
ON pos_order_item_options(productOptionId);

CREATE INDEX IF NOT EXISTS idx_pos_order_item_options_value
ON pos_order_item_options(productOptionValueId);

CREATE INDEX IF NOT EXISTS idx_pos_order_item_options_created
ON pos_order_item_options(createdAt);

CREATE TABLE IF NOT EXISTS pos_order_cooking_tickets(
id INTEGER PRIMARY KEY AUTOINCREMENT,
providerProfileId INTEGER NOT NULL,
providerChannelCode TEXT NOT NULL,
orderId INTEGER NOT NULL,
orderCode TEXT NOT NULL CHECK(length(orderCode)=12),
orderItemId INTEGER NOT NULL,
locationId INTEGER,
locationNameSnapshot TEXT,
productNameSnapshot TEXT NOT NULL,
quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
optionSummarySnapshot TEXT,
requestMemoSnapshot TEXT,
cookingStatus TEXT NOT NULL DEFAULT 'WAITING'
CHECK(cookingStatus IN('WAITING','COOKING','DONE','CANCELED')),
priorityLevel TEXT NOT NULL DEFAULT 'NORMAL'
CHECK(priorityLevel IN('LOW','NORMAL','HIGH','URGENT')),
cookStaffCode TEXT,
cookStaffNameSnapshot TEXT,
orderedAt TEXT,
cookingStartedAt TEXT,
cookingCompletedAt TEXT,
elapsedMinutes INTEGER CHECK(elapsedMinutes IS NULL OR elapsedMinutes >= 0),
isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
deletedAt TEXT,
FOREIGN KEY(providerProfileId) REFERENCES profiles(id),
FOREIGN KEY(providerChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(orderId) REFERENCES pos_orders(id),
FOREIGN KEY(orderItemId) REFERENCES pos_order_items(id),
FOREIGN KEY(locationId) REFERENCES pos_locations(id)
);

CREATE INDEX IF NOT EXISTS idx_pos_order_cooking_tickets_channel
ON pos_order_cooking_tickets(providerChannelCode);

CREATE INDEX IF NOT EXISTS idx_pos_order_cooking_tickets_profile
ON pos_order_cooking_tickets(providerProfileId);

CREATE INDEX IF NOT EXISTS idx_pos_order_cooking_tickets_order
ON pos_order_cooking_tickets(orderId);

CREATE INDEX IF NOT EXISTS idx_pos_order_cooking_tickets_order_item
ON pos_order_cooking_tickets(orderItemId);

CREATE INDEX IF NOT EXISTS idx_pos_order_cooking_tickets_status
ON pos_order_cooking_tickets(cookingStatus);

CREATE INDEX IF NOT EXISTS idx_pos_order_cooking_tickets_priority
ON pos_order_cooking_tickets(priorityLevel);

CREATE INDEX IF NOT EXISTS idx_pos_order_cooking_tickets_active
ON pos_order_cooking_tickets(isActive);

CREATE INDEX IF NOT EXISTS idx_pos_order_cooking_tickets_created
ON pos_order_cooking_tickets(createdAt);

CREATE INDEX IF NOT EXISTS idx_pos_order_cooking_tickets_location
ON pos_order_cooking_tickets(locationId);

/*==================================================
SECTION 05-2 : POS ORDER FULFILLMENT DETAILS
RULE : 주문 유형별 수령/전달/출처 상세 저장
==================================================*/

CREATE TABLE IF NOT EXISTS pos_order_fulfillment_details(
id INTEGER PRIMARY KEY AUTOINCREMENT,

orderId INTEGER NOT NULL,
orderCode TEXT NOT NULL,
revisionCode TEXT,

providerProfileId INTEGER NOT NULL,
providerChannelCode TEXT NOT NULL,

fulfillmentType TEXT NOT NULL
CHECK(fulfillmentType IN(
  'TABLE',
  'RESERVATION',
  'DELIVERY',
  'PICKUP',
  'QR_ORDER',
  'KIOSK',
  'ROOM_SERVICE'
)),

locationId INTEGER,
sourceLabelSnapshot TEXT,

deliveryAddress TEXT,
deliveryDetailAddress TEXT,
deliveryPhone TEXT,
deliveryMemo TEXT,

pickupExpectedAt TEXT,
reservationExpectedAt TEXT,

kioskDeviceCode TEXT,
qrCodeValue TEXT,

customerRequestMemo TEXT,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
deletedAt TEXT,

FOREIGN KEY(orderId) REFERENCES pos_orders(id),
FOREIGN KEY(providerProfileId) REFERENCES profiles(id),
FOREIGN KEY(providerChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(locationId) REFERENCES pos_locations(id),

UNIQUE(providerChannelCode, orderId)
);

CREATE INDEX IF NOT EXISTS idx_pos_order_fulfillment_order
ON pos_order_fulfillment_details(orderId);

CREATE INDEX IF NOT EXISTS idx_pos_order_fulfillment_order_code
ON pos_order_fulfillment_details(orderCode);

CREATE INDEX IF NOT EXISTS idx_pos_order_fulfillment_revision_code
ON pos_order_fulfillment_details(revisionCode);

CREATE INDEX IF NOT EXISTS idx_pos_order_fulfillment_channel
ON pos_order_fulfillment_details(providerChannelCode);

CREATE INDEX IF NOT EXISTS idx_pos_order_fulfillment_profile
ON pos_order_fulfillment_details(providerProfileId);

CREATE INDEX IF NOT EXISTS idx_pos_order_fulfillment_type
ON pos_order_fulfillment_details(fulfillmentType);

CREATE INDEX IF NOT EXISTS idx_pos_order_fulfillment_location
ON pos_order_fulfillment_details(locationId);

CREATE INDEX IF NOT EXISTS idx_pos_order_fulfillment_pickup_at
ON pos_order_fulfillment_details(pickupExpectedAt);

CREATE INDEX IF NOT EXISTS idx_pos_order_fulfillment_reservation_at
ON pos_order_fulfillment_details(reservationExpectedAt);

CREATE INDEX IF NOT EXISTS idx_pos_order_fulfillment_deleted
ON pos_order_fulfillment_details(deletedAt);

/*==================================================
SECTION 05-3 : POS ORDER STATUS EVENTS
RULE : 주문 상태 변경 이력 추적
==================================================*/

CREATE TABLE IF NOT EXISTS pos_order_status_events(
id INTEGER PRIMARY KEY AUTOINCREMENT,

orderId INTEGER NOT NULL,
orderCode TEXT NOT NULL,
revisionCode TEXT,

providerProfileId INTEGER NOT NULL,
providerChannelCode TEXT NOT NULL,

fromStatus TEXT
CHECK(
  fromStatus IS NULL
  OR fromStatus IN(
    'CREATED',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'COMPLETED',
    'REPLACED',
    'CANCELLED',
    'ADMIN_DISABLED'
  )
),

toStatus TEXT NOT NULL
CHECK(toStatus IN(
  'CREATED',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'REPLACED',
  'CANCELLED',
  'ADMIN_DISABLED'
)),

changedByType TEXT NOT NULL DEFAULT 'SYSTEM'
CHECK(changedByType IN(
  'SYSTEM',
  'OWNER',
  'STAFF',
  'CUSTOMER'
)),

changedByProfileId INTEGER,
changedByStaffCode TEXT,
reason TEXT,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY(orderId) REFERENCES pos_orders(id),
FOREIGN KEY(providerProfileId) REFERENCES profiles(id),
FOREIGN KEY(providerChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(changedByProfileId) REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_pos_order_status_events_order
ON pos_order_status_events(orderId);

CREATE INDEX IF NOT EXISTS idx_pos_order_status_events_order_code
ON pos_order_status_events(orderCode);

CREATE INDEX IF NOT EXISTS idx_pos_order_status_events_revision_code
ON pos_order_status_events(revisionCode);

CREATE INDEX IF NOT EXISTS idx_pos_order_status_events_channel
ON pos_order_status_events(providerChannelCode);

CREATE INDEX IF NOT EXISTS idx_pos_order_status_events_profile
ON pos_order_status_events(providerProfileId);

CREATE INDEX IF NOT EXISTS idx_pos_order_status_events_from_status
ON pos_order_status_events(fromStatus);

CREATE INDEX IF NOT EXISTS idx_pos_order_status_events_to_status
ON pos_order_status_events(toStatus);

CREATE INDEX IF NOT EXISTS idx_pos_order_status_events_changed_by_type
ON pos_order_status_events(changedByType);

CREATE INDEX IF NOT EXISTS idx_pos_order_status_events_created
ON pos_order_status_events(createdAt);

CREATE TABLE IF NOT EXISTS pos_payments(
id INTEGER PRIMARY KEY AUTOINCREMENT,
providerProfileId INTEGER NOT NULL,
providerChannelCode TEXT NOT NULL,
orderId INTEGER NOT NULL,
orderCode TEXT NOT NULL CHECK(length(orderCode)=12),
revisionCode TEXT NOT NULL CHECK(length(revisionCode)=12),
paymentCode TEXT NOT NULL UNIQUE CHECK(length(paymentCode)=12),
paymentMethod TEXT NOT NULL CHECK(paymentMethod IN('CASH','CARD','QR','NFC','MIXED')),
paymentStatus TEXT NOT NULL DEFAULT 'READY' CHECK(paymentStatus IN('READY','PAID','FAILED','CANCELLED','REFUNDED')),
paymentAmount INTEGER NOT NULL DEFAULT 0 CHECK(paymentAmount >= 0),
receivedCashAmount INTEGER CHECK(receivedCashAmount IS NULL OR receivedCashAmount >= 0),
changeAmount INTEGER CHECK(changeAmount IS NULL OR changeAmount >= 0),
customerProfileId INTEGER,
customerChannelCode TEXT,
paidStaffCode TEXT,
paidStaffNameSnapshot TEXT,
approvedAt TEXT,
canceledAt TEXT,
memo TEXT,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
FOREIGN KEY(providerProfileId) REFERENCES profiles(id),
FOREIGN KEY(providerChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(orderId) REFERENCES pos_orders(id),
FOREIGN KEY(customerProfileId) REFERENCES profiles(id),
FOREIGN KEY(customerChannelCode) REFERENCES profiles(channelCode)
);

CREATE INDEX IF NOT EXISTS idx_pos_payments_order
ON pos_payments(orderId);

CREATE INDEX IF NOT EXISTS idx_pos_payments_provider
ON pos_payments(providerChannelCode);

CREATE INDEX IF NOT EXISTS idx_pos_payments_customer
ON pos_payments(customerChannelCode);

CREATE INDEX IF NOT EXISTS idx_pos_payments_method
ON pos_payments(paymentMethod);

CREATE INDEX IF NOT EXISTS idx_pos_payments_status
ON pos_payments(paymentStatus);

CREATE INDEX IF NOT EXISTS idx_pos_payments_created
ON pos_payments(createdAt);

CREATE INDEX IF NOT EXISTS idx_pos_payments_order_code
ON pos_payments(orderCode);

CREATE INDEX IF NOT EXISTS idx_pos_payments_revision_code
ON pos_payments(revisionCode);

CREATE INDEX IF NOT EXISTS idx_pos_payments_staff_code
ON pos_payments(paidStaffCode);

CREATE TABLE IF NOT EXISTS pos_product_post_links(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
posProductId INTEGER NOT NULL,
postId INTEGER NOT NULL,
postType TEXT NOT NULL DEFAULT 'PRODUCT' CHECK(postType IN('PRODUCT')),
syncStatus TEXT DEFAULT 'LINKED' CHECK(syncStatus IN('LINKED','UNLINKED','SYNC_PENDING')),
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
deletedAt TEXT,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(posProductId) REFERENCES pos_products(id),
FOREIGN KEY(postId) REFERENCES posts(id),
UNIQUE(profileId, channelCode, posProductId, postId)
);

CREATE INDEX IF NOT EXISTS idx_pos_product_post_links_channel
ON pos_product_post_links(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_product_post_links_profile
ON pos_product_post_links(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_product_post_links_product
ON pos_product_post_links(posProductId);

CREATE INDEX IF NOT EXISTS idx_pos_product_post_links_post
ON pos_product_post_links(postId);

CREATE INDEX IF NOT EXISTS idx_pos_product_post_links_status
ON pos_product_post_links(syncStatus);

CREATE TABLE IF NOT EXISTS pos_product_thumbnails(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
productId INTEGER NOT NULL,
productCode TEXT CHECK(
  productCode IS NULL
  OR productCode LIKE 'RPB%'
  OR productCode LIKE 'RPN%'
),
imageAssetId INTEGER NOT NULL,
sortOrder INTEGER DEFAULT 1,
isActive INTEGER DEFAULT 1 CHECK(isActive IN(0,1)),
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(productId) REFERENCES pos_products(id),
FOREIGN KEY(imageAssetId) REFERENCES image_assets(id)
);

CREATE INDEX IF NOT EXISTS idx_pos_product_thumbnails_profile
ON pos_product_thumbnails(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_product_thumbnails_channel
ON pos_product_thumbnails(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_product_thumbnails_product
ON pos_product_thumbnails(productId);

CREATE INDEX IF NOT EXISTS idx_pos_product_thumbnails_asset
ON pos_product_thumbnails(imageAssetId);

CREATE INDEX IF NOT EXISTS idx_pos_product_thumbnails_active
ON pos_product_thumbnails(isActive);

CREATE INDEX IF NOT EXISTS idx_pos_product_thumbnails_sort
ON pos_product_thumbnails(productId, sortOrder);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_product_thumbnails_active_unique
ON pos_product_thumbnails(productId)
WHERE isActive = 1;

`)

const posOrdersTableSqlRow = db.prepare(`
  SELECT sql
  FROM sqlite_master
  WHERE type='table'
    AND name='pos_orders'
  LIMIT 1
`).get() as { sql?: string } | undefined

const posOrdersColumns = db.prepare(`
  PRAGMA table_info(pos_orders)
`).all() as Array<{ name?: string }>

const hasPosOrdersRevisionCodeColumn =
  posOrdersColumns.some((column) => column.name === 'revisionCode')

const hasPosOrdersRevisionNoColumn =
  posOrdersColumns.some((column) => column.name === 'revisionNo')

const hasPosOrdersOrderYearColumn =
  posOrdersColumns.some((column) => column.name === 'orderYear')

const hasPosOrdersOrderDateColumn =
  posOrdersColumns.some((column) => column.name === 'orderDate')

const hasPosOrdersOrderMonthColumn =
  posOrdersColumns.some((column) => column.name === 'orderMonth')

const hasPosOrdersOrderDayColumn =
  posOrdersColumns.some((column) => column.name === 'orderDay')

const hasPosOrdersOrderSequenceColumn =
  posOrdersColumns.some((column) => column.name === 'orderSequence')

const hasPosOrdersIsActiveColumn =
  posOrdersColumns.some((column) => column.name === 'isActive')

const posOrdersSupportsRoomOrderSource =
  posOrdersTableSqlRow?.sql?.includes(`'ROOM_ORDER'`) ?? false

const posOrdersSupportsRoomServiceFlowType =
  posOrdersTableSqlRow?.sql?.includes(`'ROOM_SERVICE'`) ?? false

const posOrdersSupportsPreparingStatus =
  posOrdersTableSqlRow?.sql?.includes(`'PREPARING'`) ?? false

const posOrdersSupportsReadyStatus =
  posOrdersTableSqlRow?.sql?.includes(`'READY'`) ?? false

const posOrdersSupportsCompletedStatus =
  posOrdersTableSqlRow?.sql?.includes(`'COMPLETED'`) ?? false

const posOrdersNeedsRevisionMigration =
  !posOrdersTableSqlRow?.sql?.includes('revisionCode')
  || !posOrdersTableSqlRow?.sql?.includes('revisionNo')
  || posOrdersTableSqlRow?.sql?.includes('orderCode TEXT NOT NULL UNIQUE')
  || !posOrdersTableSqlRow?.sql?.includes("'REPLACED'")
  || !posOrdersSupportsPreparingStatus
  || !posOrdersSupportsReadyStatus
  || !posOrdersSupportsCompletedStatus
  || !posOrdersTableSqlRow?.sql?.includes("'ADMIN_DISABLED'")
  || !posOrdersSupportsRoomOrderSource
  || !posOrdersSupportsRoomServiceFlowType
  || posOrdersTableSqlRow?.sql?.includes('UNIQUE(providerChannelCode, orderDate, orderSequence)')

if (posOrdersNeedsRevisionMigration) {
  db.exec(`PRAGMA foreign_keys = OFF`)

  try {
    db.exec(`DROP TABLE IF EXISTS pos_orders_new`)

    db.exec(`
      CREATE TABLE pos_orders_new(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderCode TEXT NOT NULL CHECK(length(orderCode) = 12),
        revisionCode TEXT NOT NULL UNIQUE CHECK(length(revisionCode) = 12),
        revisionNo INTEGER NOT NULL DEFAULT 1 CHECK(revisionNo >= 1),
        orderDate TEXT NOT NULL,
        orderYear INTEGER NOT NULL,
        orderMonth INTEGER NOT NULL CHECK(orderMonth BETWEEN 1 AND 12),
        orderDay INTEGER NOT NULL CHECK(orderDay BETWEEN 1 AND 31),
        orderSequence INTEGER NOT NULL DEFAULT 1 CHECK(orderSequence >= 1),
        providerProfileId INTEGER NOT NULL,
        providerChannelCode TEXT NOT NULL,
        customerProfileId INTEGER,
        customerChannelCode TEXT,
        orderSource TEXT NOT NULL CHECK(orderSource IN('POS','KIOSK','TABLE_ORDER','QR_ORDER','ROOM_ORDER','ONLINE','PHONE','ADMIN')),
        orderFlowType TEXT NOT NULL CHECK(orderFlowType IN('IN_STORE','PICKUP','DELIVERY','RESERVATION','SERVICE','ROOM_SERVICE')),
        locationId INTEGER,
        locationNameSnapshot TEXT,
        orderStatus TEXT NOT NULL DEFAULT 'CREATED'
        CHECK(orderStatus IN('CREATED','CONFIRMED','PREPARING','READY','COMPLETED','REPLACED','CANCELLED','ADMIN_DISABLED')),
        paymentStatus TEXT NOT NULL DEFAULT 'UNPAID'
        CHECK(paymentStatus IN('UNPAID','PAID','PARTIAL','REFUNDED','CANCELED','CANCELLED')),
        subtotalAmount INTEGER NOT NULL DEFAULT 0 CHECK(subtotalAmount >= 0),
        discountAmount INTEGER NOT NULL DEFAULT 0 CHECK(discountAmount >= 0),
        taxAmount INTEGER NOT NULL DEFAULT 0 CHECK(taxAmount >= 0),
        totalAmount INTEGER NOT NULL DEFAULT 0 CHECK(totalAmount >= 0),
        isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0, 1)),
        memo TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT,
        completedAt TEXT,
        canceledAt TEXT,
        FOREIGN KEY(providerProfileId) REFERENCES profiles(id),
        FOREIGN KEY(providerChannelCode) REFERENCES profiles(channelCode),
        FOREIGN KEY(customerProfileId) REFERENCES profiles(id),
        FOREIGN KEY(customerChannelCode) REFERENCES profiles(channelCode),
        FOREIGN KEY(locationId) REFERENCES pos_locations(id),
        UNIQUE(providerChannelCode, revisionCode),
        UNIQUE(providerChannelCode, orderCode, revisionNo)
      )
    `)

    db.exec(`
      INSERT INTO pos_orders_new(
        id,
        orderCode,
        revisionCode,
        revisionNo,
        orderDate,
        orderYear,
        orderMonth,
        orderDay,
        orderSequence,
        providerProfileId,
        providerChannelCode,
        customerProfileId,
        customerChannelCode,
        orderSource,
        orderFlowType,
        locationId,
        locationNameSnapshot,
        orderStatus,
        paymentStatus,
        subtotalAmount,
        discountAmount,
        taxAmount,
        totalAmount,
        isActive,
        memo,
        createdAt,
        updatedAt,
        completedAt,
        canceledAt
      )
      SELECT
        id,
        orderCode,
        COALESCE(${hasPosOrdersRevisionCodeColumn ? 'revisionCode' : 'NULL'}, 'LG' || printf('%010d', id)) AS revisionCode,
        COALESCE(${hasPosOrdersRevisionNoColumn ? 'revisionNo' : 'NULL'}, 1) AS revisionNo,
        COALESCE(${hasPosOrdersOrderDateColumn ? 'orderDate' : 'NULL'}, substr(createdAt, 1, 10), date('now')) AS orderDate,
        COALESCE(${hasPosOrdersOrderYearColumn ? 'orderYear' : 'NULL'}, CAST(strftime('%Y', COALESCE(${hasPosOrdersOrderDateColumn ? 'orderDate' : 'NULL'}, substr(createdAt, 1, 10), date('now'))) AS INTEGER)) AS orderYear,
        COALESCE(${hasPosOrdersOrderMonthColumn ? 'orderMonth' : 'NULL'}, CAST(strftime('%m', COALESCE(${hasPosOrdersOrderDateColumn ? 'orderDate' : 'NULL'}, substr(createdAt, 1, 10), date('now'))) AS INTEGER)) AS orderMonth,
        COALESCE(${hasPosOrdersOrderDayColumn ? 'orderDay' : 'NULL'}, CAST(strftime('%d', COALESCE(${hasPosOrdersOrderDateColumn ? 'orderDate' : 'NULL'}, substr(createdAt, 1, 10), date('now'))) AS INTEGER)) AS orderDay,
        COALESCE(${hasPosOrdersOrderSequenceColumn ? 'orderSequence' : 'NULL'}, 1),
        providerProfileId,
        providerChannelCode,
        customerProfileId,
        customerChannelCode,
        orderSource,
        orderFlowType,
        locationId,
        locationNameSnapshot,
        CASE
          WHEN orderStatus = 'CANCELED' THEN 'CANCELLED'
          WHEN orderStatus = 'ACCEPTED' THEN 'CONFIRMED'
          WHEN orderStatus = 'PREPARING' THEN 'PREPARING'
          WHEN orderStatus = 'READY' THEN 'READY'
          WHEN orderStatus = 'COMPLETED' THEN 'COMPLETED'
          WHEN orderStatus = 'REFUNDED' THEN 'CANCELLED'
          WHEN orderStatus IN ('CREATED','CONFIRMED','REPLACED','CANCELLED','ADMIN_DISABLED') THEN orderStatus
          ELSE 'CREATED'
        END AS orderStatus,
        CASE
          WHEN paymentStatus = 'CANCELED' THEN 'CANCELLED'
          ELSE paymentStatus
        END AS paymentStatus,
        subtotalAmount,
        discountAmount,
        taxAmount,
        totalAmount,
        COALESCE(${hasPosOrdersIsActiveColumn ? 'isActive' : 'NULL'}, 1),
        memo,
        createdAt,
        updatedAt,
        completedAt,
        canceledAt
      FROM pos_orders
    `)

    db.exec(`DROP TABLE pos_orders`)
    db.exec(`ALTER TABLE pos_orders_new RENAME TO pos_orders`)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}

//==================================================
// SECTION 05-4 : POS ORDER BACKFILL HISTORY
// RULE : 기존 주문 기준 fulfillment + status event 동기화
//==================================================

db.exec(`
INSERT INTO pos_order_fulfillment_details(
  orderId,
  orderCode,
  revisionCode,
  providerProfileId,
  providerChannelCode,
  fulfillmentType,
  locationId,
  sourceLabelSnapshot,
  createdAt,
  updatedAt
)
SELECT
  o.id,
  o.orderCode,
  o.revisionCode,
  o.providerProfileId,
  o.providerChannelCode,
  CASE
    WHEN o.orderSource = 'KIOSK' THEN 'KIOSK'
    WHEN o.orderSource = 'QR_ORDER' THEN 'QR_ORDER'
    WHEN o.orderFlowType = 'DELIVERY' THEN 'DELIVERY'
    WHEN o.orderFlowType = 'PICKUP' THEN 'PICKUP'
    WHEN o.orderFlowType = 'RESERVATION' THEN 'RESERVATION'
    WHEN o.orderFlowType = 'ROOM_SERVICE' THEN 'ROOM_SERVICE'
    ELSE 'TABLE'
  END,
  o.locationId,
  COALESCE(o.locationNameSnapshot, o.orderSource, o.orderFlowType),
  COALESCE(o.createdAt, CURRENT_TIMESTAMP),
  CURRENT_TIMESTAMP
FROM pos_orders o
WHERE NOT EXISTS (
  SELECT 1
  FROM pos_order_fulfillment_details f
  WHERE f.providerChannelCode = o.providerChannelCode
    AND f.orderId = o.id
);

INSERT INTO pos_order_status_events(
  orderId,
  orderCode,
  revisionCode,
  providerProfileId,
  providerChannelCode,
  fromStatus,
  toStatus,
  changedByType,
  reason,
  createdAt
)
SELECT
  o.id,
  o.orderCode,
  o.revisionCode,
  o.providerProfileId,
  o.providerChannelCode,
  NULL,
  o.orderStatus,
  'SYSTEM',
  'INITIAL_STATUS_BACKFILL',
  COALESCE(o.createdAt, CURRENT_TIMESTAMP)
FROM pos_orders o
WHERE NOT EXISTS (
  SELECT 1
  FROM pos_order_status_events e
  WHERE e.providerChannelCode = o.providerChannelCode
    AND e.orderId = o.id
);
`)

safeAddColumn(
  'pos_product_categories',
  'categoryCode',
  "TEXT NOT NULL DEFAULT 'CUSTOM'"
)

safeAddColumn(
  'pos_product_categories',
  'isDefault',
  'INTEGER DEFAULT 0 CHECK(isDefault IN(0,1))'
)

safeAddColumn(
  'pos_product_categories',
  'isDeletable',
  'INTEGER DEFAULT 1 CHECK(isDeletable IN(0,1))'
)

safeAddColumn(
  'pos_product_categories',
  'ageRestrictionType',
  "TEXT DEFAULT 'NONE'"
)

safeAddColumn(
  'pos_product_categories',
  'requiresAdultVerification',
  'INTEGER DEFAULT 0 CHECK(requiresAdultVerification IN(0,1))'
)

safeAddColumn(
  'pos_product_categories',
  'restrictedOrderChannel',
  "TEXT DEFAULT 'NONE'"
)

safeAddColumn(
  'pos_products',
  'productCode',
  "TEXT CHECK(productCode IS NULL OR productCode LIKE 'RPB%' OR productCode LIKE 'RPN%')"
)

safeAddColumn(
  'pos_products',
  'masterProductId',
  'INTEGER'
)

safeAddColumn(
  'pos_products',
  'productId',
  'TEXT'
)

safeAddColumn(
  'pos_products',
  'sourceType',
  "TEXT NOT NULL DEFAULT 'POS_PRODUCT' CHECK(sourceType IN('POS_PRODUCT','MARKET_PRODUCT'))"
)

safeAddColumn(
  'pos_order_items',
  'productCode',
  "TEXT CHECK(productCode IS NULL OR productCode LIKE 'RPB%' OR productCode LIKE 'RPN%')"
)

safeAddColumn(
  'pos_order_items',
  'productId',
  'TEXT'
)

safeAddColumn(
  'pos_order_items',
  'sourceType',
  'TEXT'
)

safeAddColumn(
  'pos_order_items',
  'cartCode',
  'TEXT CHECK(cartCode IS NULL OR length(cartCode)=12)'
)

safeAddColumn(
  'pos_order_items',
  'cartItemCode',
  'TEXT CHECK(cartItemCode IS NULL OR length(cartItemCode)=12)'
)

safeAddColumn(
  'pos_order_items',
  'optionSignature',
  'TEXT'
)

safeAddColumn(
  'pos_order_items',
  'fulfillmentType',
  'TEXT'
)

safeAddColumn(
  'pos_order_items',
  'fulfillmentSignature',
  'TEXT'
)

safeAddColumn(
  'pos_products',
  'dailySalesLimit',
  'INTEGER CHECK(dailySalesLimit IS NULL OR dailySalesLimit >= 0)'
)

safeAddColumn(
  'pos_products',
  'isFeatured',
  'INTEGER DEFAULT 0 CHECK(isFeatured IN(0,1))'
)

safeAddColumn(
  'pos_products',
  'isRepresentative',
  'INTEGER DEFAULT 0 CHECK(isRepresentative IN(0,1))'
)

safeAddColumn(
  'pos_products',
  'showOnTableOrder',
  'INTEGER DEFAULT 1 CHECK(showOnTableOrder IN(0,1))'
)

safeAddColumn(
  'pos_products',
  'allowNormalOrder',
  'INTEGER DEFAULT 1 CHECK(allowNormalOrder IN(0,1))'
)

safeAddColumn(
  'pos_products',
  'allowReservationOrder',
  'INTEGER DEFAULT 0 CHECK(allowReservationOrder IN(0,1))'
)

safeAddColumn(
  'pos_products',
  'allowDineIn',
  'INTEGER DEFAULT 1 CHECK(allowDineIn IN(0,1))'
)

safeAddColumn(
  'pos_products',
  'allowTakeout',
  'INTEGER DEFAULT 1 CHECK(allowTakeout IN(0,1))'
)

safeAddColumn(
  'pos_products',
  'allowDelivery',
  'INTEGER DEFAULT 1 CHECK(allowDelivery IN(0,1))'
)

safeAddColumn(
  'pos_products',
  'menuStatus',
  "TEXT DEFAULT 'ON_SALE' CHECK(menuStatus IN('ON_SALE','STOPPED'))"
)

safeAddColumn(
  'pos_products',
  'favoriteProfileCount',
  'INTEGER NOT NULL DEFAULT 0 CHECK(favoriteProfileCount >= 0)'
)

safeAddColumn(
  'pos_products',
  'favoriteUpdatedAt',
  'TEXT'
)

safeAddColumn(
  'pos_product_thumbnails',
  'productCode',
  "TEXT CHECK(productCode IS NULL OR productCode LIKE 'RPB%' OR productCode LIKE 'RPN%')"
)

safeAddColumn(
  'pos_product_options',
  'productCode',
  "TEXT CHECK(productCode IS NULL OR productCode LIKE 'RPB%' OR productCode LIKE 'RPN%')"
)

safeAddColumn(
  'pos_product_option_values',
  'productCode',
  "TEXT CHECK(productCode IS NULL OR productCode LIKE 'RPB%' OR productCode LIKE 'RPN%')"
)

safeAddColumn(
  'pos_product_option_values',
  'optionValueType',
  "TEXT DEFAULT 'CUSTOM' CHECK(optionValueType IN('BASE','CUSTOM'))"
)

safeAddColumn(
  'pos_product_option_values',
  'isVisible',
  'INTEGER DEFAULT 1 CHECK(isVisible IN(0,1))'
)

safeAddColumn(
  'pos_product_option_values',
  'isQuantityEnabled',
  'INTEGER NOT NULL DEFAULT 0 CHECK(isQuantityEnabled IN(0,1))'
)

safeAddColumn(
  'pos_product_option_values',
  'isQuantityLimitEnabled',
  'INTEGER NOT NULL DEFAULT 0 CHECK(isQuantityLimitEnabled IN(0,1))'
)

safeAddColumn(
  'pos_product_option_values',
  'minOptionQuantity',
  'INTEGER NOT NULL DEFAULT 1 CHECK(minOptionQuantity >= 1)'
)

safeAddColumn(
  'pos_product_option_values',
  'maxOptionQuantity',
  'INTEGER CHECK(maxOptionQuantity IS NULL OR maxOptionQuantity >= 1)'
)

safeAddColumn(
  'pos_product_option_values',
  'defaultOptionQuantity',
  'INTEGER NOT NULL DEFAULT 1 CHECK(defaultOptionQuantity >= 1)'
)

function rebuildLegacyProductCodeTable(
  tableName: string,
  productCodeExpression: string
) {
  const tableSqlRow = db.prepare(`
    SELECT sql
    FROM sqlite_master
    WHERE type = 'table'
      AND name = ?
    LIMIT 1
  `).get(tableName) as { sql?: string } | undefined

  const legacyCheck =
    "productCode GLOB '[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]'"

  if (!tableSqlRow?.sql?.includes(legacyCheck)) {
    return
  }

  const tempTableName =
    `${tableName}_code_rule_rebuild`

  const columns =
    db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>

  const columnNames =
    columns.map((column) => column.name)

  const selectColumns =
    columnNames.map((columnName) =>
      columnName === 'productCode'
        ? `${productCodeExpression} AS productCode`
        : columnName
    )

  const createTempSql =
    tableSqlRow.sql
      .replace(new RegExp(`CREATE TABLE ${tableName}`, 'i'), `CREATE TABLE ${tempTableName}`)
      .split(legacyCheck)
      .join("productCode LIKE 'RPB%' OR productCode LIKE 'RPN%'")

  db.exec(`PRAGMA foreign_keys = OFF`)
  db.exec(`DROP TABLE IF EXISTS ${tempTableName}`)
  db.exec(createTempSql)
  db.exec(`
    INSERT INTO ${tempTableName} (${columnNames.join(', ')})
    SELECT ${selectColumns.join(', ')}
    FROM ${tableName}
  `)
  db.exec(`DROP TABLE ${tableName}`)
  db.exec(`ALTER TABLE ${tempTableName} RENAME TO ${tableName}`)
  db.exec(`PRAGMA foreign_keys = ON`)
}

rebuildLegacyProductCodeTable(
  'pos_products',
  "CASE WHEN productCode IS NOT NULL AND (productCode LIKE 'RPB%' OR productCode LIKE 'RPN%') THEN productCode ELSE 'RPNUN000' || substr('000000' || id, -6, 6) END"
)

rebuildLegacyProductCodeTable(
  'pos_product_thumbnails',
  "COALESCE((SELECT p.productCode FROM pos_products p WHERE p.id = pos_product_thumbnails.productId), CASE WHEN productCode IS NOT NULL AND (productCode LIKE 'RPB%' OR productCode LIKE 'RPN%') THEN productCode ELSE NULL END)"
)

rebuildLegacyProductCodeTable(
  'pos_product_options',
  "COALESCE((SELECT p.productCode FROM pos_products p WHERE p.id = pos_product_options.productId), CASE WHEN productCode IS NOT NULL AND (productCode LIKE 'RPB%' OR productCode LIKE 'RPN%') THEN productCode ELSE NULL END)"
)

rebuildLegacyProductCodeTable(
  'pos_product_option_values',
  "COALESCE((SELECT o.productCode FROM pos_product_options o WHERE o.id = pos_product_option_values.optionId), CASE WHEN productCode IS NOT NULL AND (productCode LIKE 'RPB%' OR productCode LIKE 'RPN%') THEN productCode ELSE NULL END)"
)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_channel
ON pos_products(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_profile
ON pos_products(profileId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_category
ON pos_products(categoryId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_type
ON pos_products(productType)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_kind
ON pos_products(productKind)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_active
ON pos_products(isActive)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_sort
ON pos_products(sortOrder)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_options_channel
ON pos_product_options(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_options_profile
ON pos_product_options(profileId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_options_product
ON pos_product_options(productId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_options_type
ON pos_product_options(optionType)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_options_active
ON pos_product_options(isActive)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_options_sort
ON pos_product_options(sortOrder)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_channel
ON pos_product_option_values(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_profile
ON pos_product_option_values(profileId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_option
ON pos_product_option_values(optionId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_active
ON pos_product_option_values(isActive)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_sort
ON pos_product_option_values(sortOrder)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_thumbnails_profile
ON pos_product_thumbnails(profileId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_thumbnails_channel
ON pos_product_thumbnails(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_thumbnails_product
ON pos_product_thumbnails(productId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_thumbnails_asset
ON pos_product_thumbnails(imageAssetId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_thumbnails_active
ON pos_product_thumbnails(isActive)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_thumbnails_sort
ON pos_product_thumbnails(productId, sortOrder)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_product_thumbnails_active_unique
ON pos_product_thumbnails(productId)
WHERE isActive = 1
`)

safeAddColumn(
  'pos_locations',
  'tableTypeCode',
  'TEXT'
)

safeAddColumn(
  'pos_locations',
  'tableOptionName',
  'TEXT'
)

safeAddColumn(
  'pos_locations',
  'floor',
  "TEXT DEFAULT '1층'"
)

safeAddColumn(
  'pos_locations',
  'zone',
  "TEXT DEFAULT '홀'"
)

safeAddColumn(
  'pos_locations',
  'floorSortOrder',
  'INTEGER DEFAULT 1'
)

safeAddColumn(
  'pos_locations',
  'zoneSortOrder',
  'INTEGER DEFAULT 1'
)

safeAddColumn(
  'pos_locations',
  'layoutX',
  'INTEGER DEFAULT 0'
)

safeAddColumn(
  'pos_locations',
  'layoutY',
  'INTEGER DEFAULT 0'
)

safeAddColumn(
  'pos_locations',
  'layoutWidth',
  'INTEGER DEFAULT 180'
)

safeAddColumn(
  'pos_locations',
  'layoutHeight',
  'INTEGER DEFAULT 140'
)

safeAddColumn(
  'pos_locations',
  'layoutRotate',
  'INTEGER DEFAULT 0'
)

safeAddColumn(
  'pos_locations',
  'layoutShape',
  "TEXT DEFAULT 'RECT'"
)

safeAddColumn(
  'pos_locations',
  'tableCode',
  'TEXT CHECK(tableCode IS NULL OR length(tableCode)=12)'
)

safeAddColumn(
  'pos_locations',
  'qrStatus',
  "TEXT DEFAULT 'DISCONNECTED' CHECK(qrStatus IN('CONNECTED','DISCONNECTED'))"
)

safeAddColumn(
  'pos_locations',
  'qrBaseUrl',
  'TEXT'
)

safeAddColumn(
  'pos_locations',
  'qrRoutePath',
  'TEXT'
)

safeAddColumn(
  'pos_locations',
  'tableOrderUrl',
  'TEXT'
)

safeAddColumn(
  'pos_locations',
  'qrCodeValue',
  'TEXT'
)

safeAddColumn(
  'pos_locations',
  'qrGeneratedAt',
  'TEXT'
)

safeAddColumn(
  'pos_locations',
  'qrConnectedAt',
  'TEXT'
)

safeAddColumn(
  'pos_locations',
  'qrDisconnectedAt',
  'TEXT'
)

safeAddColumn(
  'pos_locations',
  'defaultPrice',
  'INTEGER NOT NULL DEFAULT 0 CHECK(defaultPrice >= 0)'
)

safeAddColumn(
  'pos_locations',
  'resourceStatus',
  "TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(resourceStatus IN('AVAILABLE','RESERVED','IN_USE','WAITING','CHECKIN_READY','CHECKOUT_PENDING','CLEANING','CLEAN_DONE','MAINTENANCE','DISABLED'))"
)

safeAddColumn(
  'pos_locations',
  'lastStatusChangedAt',
  'TEXT'
)

safeAddColumn(
  'pos_locations',
  'currentUseType',
  "TEXT CHECK(currentUseType IN('STAY','SHORT_STAY'))"
)

safeAddColumn(
  'pos_locations',
  'currentCheckInId',
  'INTEGER'
)

safeAddColumn(
  'pos_locations',
  'currentCheckInAt',
  'TEXT'
)

safeAddColumn(
  'pos_locations',
  'expectedCheckOutAt',
  'TEXT'
)

safeAddColumn(
  'pos_locations',
  'baseUsageMinutes',
  'INTEGER CHECK(baseUsageMinutes IS NULL OR baseUsageMinutes >= 0)'
)

// pos_locations.resourceStatus CHECK ?뺤옣 留덉씠洹몃젅?댁뀡 (WAITING ?ы븿)
const posLocationsTableSqlRow =
  db.prepare(`
    SELECT sql
    FROM sqlite_master
    WHERE type = 'table'
      AND name = 'pos_locations'
  `).get() as { sql?: string } | undefined

const posLocationsSupportsWaitingStatus =
  posLocationsTableSqlRow?.sql?.includes(`'WAITING'`) ?? false
const posLocationsHasLegacyLocationNameUnique =
  posLocationsTableSqlRow?.sql?.includes(`UNIQUE(profileId, channelCode, locationName)`) ?? false
const posLocationsSupportsStrictTableCodePattern =
  posLocationsTableSqlRow?.sql?.includes(`length(tableCode) = 12`) ?? false

if (!posLocationsSupportsWaitingStatus || posLocationsHasLegacyLocationNameUnique || !posLocationsSupportsStrictTableCodePattern) {
  db.exec(`PRAGMA foreign_keys = OFF`)

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS pos_locations_new(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId INTEGER NOT NULL,
      channelCode TEXT NOT NULL,
      locationType TEXT NOT NULL CHECK(locationType IN('TABLE','SEAT','ROOM','BED','BOOTH','COUNTER','CLASSROOM','TREATMENT_ROOM','CUSTOM')),
      tableTypeCode TEXT,
      locationName TEXT NOT NULL,
      locationGroupName TEXT,
      capacity INTEGER,
      tableOptionName TEXT,
      floor TEXT DEFAULT '1층',
      zone TEXT DEFAULT '홀',
      floorSortOrder INTEGER DEFAULT 1,
      zoneSortOrder INTEGER DEFAULT 1,
      layoutX INTEGER DEFAULT 0,
      layoutY INTEGER DEFAULT 0,
      layoutWidth INTEGER DEFAULT 180,
      layoutHeight INTEGER DEFAULT 140,
      layoutRotate INTEGER DEFAULT 0,
      layoutShape TEXT DEFAULT 'RECT',
      tableCode TEXT CHECK(
        tableCode IS NULL
        OR length(tableCode) = 12
      ),
      qrStatus TEXT DEFAULT 'DISCONNECTED' CHECK(qrStatus IN('CONNECTED','DISCONNECTED')),
      qrBaseUrl TEXT,
      qrRoutePath TEXT,
      tableOrderUrl TEXT,
      qrCodeValue TEXT,
      qrGeneratedAt TEXT,
      qrConnectedAt TEXT,
      qrDisconnectedAt TEXT,
      defaultPrice INTEGER NOT NULL DEFAULT 0 CHECK(defaultPrice >= 0),
      resourceStatus TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK(resourceStatus IN('AVAILABLE','RESERVED','IN_USE','WAITING','CHECKIN_READY','CHECKOUT_PENDING','CLEANING','CLEAN_DONE','MAINTENANCE','DISABLED')),
      lastStatusChangedAt TEXT,
      currentUseType TEXT CHECK(currentUseType IN('STAY','SHORT_STAY')),
      currentCheckInId INTEGER,
      currentCheckInAt TEXT,
      expectedCheckOutAt TEXT,
      baseUsageMinutes INTEGER CHECK(baseUsageMinutes IS NULL OR baseUsageMinutes >= 0),
      isActive INTEGER DEFAULT 1 CHECK(isActive IN(0,1)),
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT,
      deletedAt TEXT,
      FOREIGN KEY(profileId) REFERENCES profiles(id),
      FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)
      )
    `)

    db.exec(`
      INSERT INTO pos_locations_new(
        id,
        profileId,
        channelCode,
        locationType,
        tableTypeCode,
        locationName,
        locationGroupName,
        capacity,
        tableOptionName,
        floor,
        zone,
        floorSortOrder,
        zoneSortOrder,
        layoutX,
        layoutY,
        layoutWidth,
        layoutHeight,
        layoutRotate,
        layoutShape,
        tableCode,
        qrStatus,
        qrBaseUrl,
        qrRoutePath,
        tableOrderUrl,
        qrCodeValue,
        qrGeneratedAt,
        qrConnectedAt,
        qrDisconnectedAt,
        defaultPrice,
        resourceStatus,
        lastStatusChangedAt,
        currentUseType,
        currentCheckInId,
        currentCheckInAt,
        expectedCheckOutAt,
        baseUsageMinutes,
        isActive,
        sortOrder,
        createdAt,
        updatedAt,
        deletedAt
      )
      SELECT
        id,
        profileId,
        channelCode,
        locationType,
        tableTypeCode,
        locationName,
        locationGroupName,
        capacity,
        tableOptionName,
        COALESCE(floor, '1층'),
        COALESCE(zone, '홀'),
        COALESCE(floorSortOrder, 1),
        COALESCE(zoneSortOrder, 1),
        COALESCE(layoutX, 0),
        COALESCE(layoutY, 0),
        COALESCE(layoutWidth, 180),
        COALESCE(layoutHeight, 140),
        COALESCE(layoutRotate, 0),
        COALESCE(layoutShape, 'RECT'),
        CASE
          WHEN tableCode IS NULL THEN NULL
          WHEN EXISTS (
            SELECT 1
            FROM pos_locations prev
            WHERE prev.channelCode = pos_locations.channelCode
              AND prev.tableCode = pos_locations.tableCode
              AND prev.id < pos_locations.id
          ) THEN NULL
          ELSE tableCode
        END,
        qrStatus,
        qrBaseUrl,
        qrRoutePath,
        tableOrderUrl,
        qrCodeValue,
        qrGeneratedAt,
        qrConnectedAt,
        qrDisconnectedAt,
        COALESCE(defaultPrice, 0),
        COALESCE(resourceStatus, 'AVAILABLE'),
        lastStatusChangedAt,
        currentUseType,
        currentCheckInId,
        currentCheckInAt,
        expectedCheckOutAt,
        baseUsageMinutes,
        isActive,
        sortOrder,
        createdAt,
        updatedAt,
        deletedAt
      FROM pos_locations
    `)

    db.exec(`DROP TABLE pos_locations`)
    db.exec(`ALTER TABLE pos_locations_new RENAME TO pos_locations`)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}

db.exec(`
CREATE TABLE IF NOT EXISTS pos_room_checkins(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
locationId INTEGER NOT NULL,
roomNameSnapshot TEXT,
roomTypeSnapshot TEXT,
useType TEXT NOT NULL CHECK(useType IN('STAY','SHORT_STAY')),
inputType TEXT NOT NULL CHECK(inputType IN('QR','PHOTO','MANUAL','NONE')),
guestName TEXT,
guestPhone TEXT,
vehicleNumber TEXT,
guestCount INTEGER CHECK(guestCount IS NULL OR guestCount >= 0),
memo TEXT,
qrReferenceCode TEXT,
checkInStatus TEXT NOT NULL DEFAULT 'CHECKED_IN' CHECK(checkInStatus IN('CHECKED_IN','CHECKED_OUT','CANCELLED')),
checkedInAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
expectedCheckOutAt TEXT,
checkedOutAt TEXT,
basePriceSnapshot INTEGER NOT NULL DEFAULT 0 CHECK(basePriceSnapshot >= 0),
extensionAmountSnapshot INTEGER NOT NULL DEFAULT 0 CHECK(extensionAmountSnapshot >= 0),
discountAmountSnapshot INTEGER NOT NULL DEFAULT 0 CHECK(discountAmountSnapshot >= 0),
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(locationId) REFERENCES pos_locations(id)
);

CREATE INDEX IF NOT EXISTS idx_pos_room_checkins_channel
ON pos_room_checkins(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_room_checkins_profile
ON pos_room_checkins(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_room_checkins_location
ON pos_room_checkins(locationId);

CREATE INDEX IF NOT EXISTS idx_pos_room_checkins_status
ON pos_room_checkins(checkInStatus);

CREATE INDEX IF NOT EXISTS idx_pos_room_checkins_checked_in_at
ON pos_room_checkins(checkedInAt);

CREATE INDEX IF NOT EXISTS idx_pos_room_checkins_active_room
ON pos_room_checkins(channelCode, locationId, checkInStatus);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_room_checkins_one_active_per_room
ON pos_room_checkins(channelCode, locationId)
WHERE checkInStatus = 'CHECKED_IN';

CREATE TABLE IF NOT EXISTS pos_room_checkin_evidence_images(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
checkInId INTEGER NOT NULL,
imageAssetId INTEGER NOT NULL,
evidenceType TEXT NOT NULL DEFAULT 'ETC'
CHECK(evidenceType IN('ID_CARD','RESERVATION_SCREENSHOT','VEHICLE_PLATE','ETC')),
memo TEXT,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(checkInId) REFERENCES pos_room_checkins(id),
FOREIGN KEY(imageAssetId) REFERENCES image_assets(id)
);

CREATE INDEX IF NOT EXISTS idx_pos_room_checkin_evidence_channel
ON pos_room_checkin_evidence_images(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_room_checkin_evidence_profile
ON pos_room_checkin_evidence_images(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_room_checkin_evidence_checkin
ON pos_room_checkin_evidence_images(checkInId);

CREATE INDEX IF NOT EXISTS idx_pos_room_checkin_evidence_asset
ON pos_room_checkin_evidence_images(imageAssetId);

CREATE TABLE IF NOT EXISTS pos_room_order_sessions(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
locationId INTEGER NOT NULL,
checkInId INTEGER,
roomOrderToken TEXT NOT NULL UNIQUE,
roomOrderUrl TEXT,
status TEXT NOT NULL DEFAULT 'ACTIVE'
CHECK(status IN('ACTIVE','EXPIRED','DISABLED','CLOSED')),
issuedAt TEXT DEFAULT CURRENT_TIMESTAMP,
expiresAt TEXT,
closedAt TEXT,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(locationId) REFERENCES pos_locations(id),
FOREIGN KEY(checkInId) REFERENCES pos_room_checkins(id)
);

CREATE INDEX IF NOT EXISTS idx_pos_room_order_sessions_channel
ON pos_room_order_sessions(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_room_order_sessions_profile
ON pos_room_order_sessions(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_room_order_sessions_location
ON pos_room_order_sessions(locationId);

CREATE INDEX IF NOT EXISTS idx_pos_room_order_sessions_checkin
ON pos_room_order_sessions(checkInId);

CREATE INDEX IF NOT EXISTS idx_pos_room_order_sessions_status
ON pos_room_order_sessions(status);

CREATE INDEX IF NOT EXISTS idx_pos_room_order_sessions_token
ON pos_room_order_sessions(roomOrderToken);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_room_order_sessions_one_active_per_room
ON pos_room_order_sessions(channelCode, locationId)
WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS pos_room_order_links(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
checkInId INTEGER,
roomOrderSessionId INTEGER,
orderId INTEGER NOT NULL,
orderCode TEXT,
revisionCode TEXT,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(checkInId) REFERENCES pos_room_checkins(id),
FOREIGN KEY(roomOrderSessionId) REFERENCES pos_room_order_sessions(id),
FOREIGN KEY(orderId) REFERENCES pos_orders(id),
UNIQUE(channelCode, orderId)
);

CREATE INDEX IF NOT EXISTS idx_pos_room_order_links_channel
ON pos_room_order_links(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_room_order_links_profile
ON pos_room_order_links(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_room_order_links_checkin
ON pos_room_order_links(checkInId);

CREATE INDEX IF NOT EXISTS idx_pos_room_order_links_session
ON pos_room_order_links(roomOrderSessionId);

CREATE INDEX IF NOT EXISTS idx_pos_room_order_links_order
ON pos_room_order_links(orderId);

CREATE TABLE IF NOT EXISTS pos_product_sales_channels(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
posProductId INTEGER NOT NULL,
salesChannel TEXT NOT NULL CHECK(salesChannel IN('POS','TABLE_ORDER','ROOM_ORDER','DELIVERY','PICKUP')),
isEnabled INTEGER NOT NULL DEFAULT 1 CHECK(isEnabled IN(0,1)),
channelPrice INTEGER CHECK(channelPrice IS NULL OR channelPrice >= 0),
salesStatus TEXT NOT NULL DEFAULT 'ON_SALE' CHECK(salesStatus IN('ON_SALE','STOPPED','SOLD_OUT','HIDDEN')),
displayNameOverride TEXT,
descriptionOverride TEXT,
sortOrder INTEGER DEFAULT 0,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT,
deletedAt TEXT,
FOREIGN KEY(profileId) REFERENCES profiles(id),
FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(posProductId) REFERENCES pos_products(id),
UNIQUE(profileId, channelCode, posProductId, salesChannel)
);

CREATE INDEX IF NOT EXISTS idx_pos_product_sales_channels_channel
ON pos_product_sales_channels(channelCode);

CREATE INDEX IF NOT EXISTS idx_pos_product_sales_channels_profile
ON pos_product_sales_channels(profileId);

CREATE INDEX IF NOT EXISTS idx_pos_product_sales_channels_product
ON pos_product_sales_channels(posProductId);

CREATE INDEX IF NOT EXISTS idx_pos_product_sales_channels_sales_channel
ON pos_product_sales_channels(salesChannel);

CREATE INDEX IF NOT EXISTS idx_pos_product_sales_channels_enabled
ON pos_product_sales_channels(isEnabled);

CREATE INDEX IF NOT EXISTS idx_pos_product_sales_channels_status
ON pos_product_sales_channels(salesStatus);

CREATE INDEX IF NOT EXISTS idx_pos_product_sales_channels_sort
ON pos_product_sales_channels(sortOrder);
`)

safeAddColumn(
  'pos_order_type_configs',
  'customTitle',
  'TEXT'
)

safeAddColumn(
  'pos_order_type_configs',
  'description',
  'TEXT'
)

safeAddColumn(
  'pos_order_type_configs',
  'isEnabled',
  'INTEGER NOT NULL DEFAULT 1 CHECK(isEnabled IN(0,1))'
)

safeAddColumn(
  'pos_order_type_configs',
  'isFixed',
  'INTEGER NOT NULL DEFAULT 1 CHECK(isFixed IN(0,1))'
)

safeAddColumn(
  'pos_order_type_configs',
  'sortOrder',
  'INTEGER NOT NULL DEFAULT 0'
)

safeAddColumn(
  'pos_order_type_configs',
  'updatedAt',
  'TEXT'
)

safeAddColumn(
  'pos_order_type_configs',
  'deletedAt',
  'TEXT'
)

safeAddColumn(
  'pos_orders',
  'revisionCode',
  'TEXT'
)

safeAddColumn(
  'pos_orders',
  'revisionNo',
  'INTEGER DEFAULT 1'
)

safeAddColumn(
  'pos_orders',
  'isActive',
  'INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0, 1))'
)

safeAddColumn(
  'pos_orders',
  'orderDate',
  'TEXT'
)

safeAddColumn(
  'pos_orders',
  'orderYear',
  'INTEGER'
)

safeAddColumn(
  'pos_orders',
  'orderMonth',
  'INTEGER'
)

safeAddColumn(
  'pos_orders',
  'orderDay',
  'INTEGER'
)

safeAddColumn(
  'pos_orders',
  'orderSequence',
  'INTEGER DEFAULT 1'
)

safeAddColumn(
  'pos_orders',
  'customerChannelCode',
  'TEXT'
)

safeAddColumn(
  'pos_order_items',
  'orderCode',
  'TEXT'
)

safeAddColumn(
  'pos_order_items',
  'revisionCode',
  'TEXT'
)

safeAddColumn(
  'pos_order_items',
  'revisionNo',
  'INTEGER DEFAULT 1'
)

safeAddColumn(
  'pos_payments',
  'providerProfileId',
  'INTEGER'
)

safeAddColumn(
  'pos_payments',
  'providerChannelCode',
  'TEXT'
)

safeAddColumn(
  'pos_payments',
  'orderId',
  'INTEGER'
)

safeAddColumn(
  'pos_payments',
  'orderCode',
  'TEXT'
)

safeAddColumn(
  'pos_payments',
  'revisionCode',
  'TEXT'
)

safeAddColumn(
  'pos_payments',
  'paymentCode',
  'TEXT CHECK(paymentCode IS NULL OR length(paymentCode)=12)'
)

safeAddColumn(
  'pos_payments',
  'paymentMethod',
  'TEXT'
)

safeAddColumn(
  'pos_payments',
  'paymentStatus',
  "TEXT DEFAULT 'READY'"
)

safeAddColumn(
  'pos_payments',
  'paymentAmount',
  'INTEGER DEFAULT 0'
)

safeAddColumn(
  'pos_payments',
  'receivedCashAmount',
  'INTEGER'
)

safeAddColumn(
  'pos_payments',
  'changeAmount',
  'INTEGER'
)

safeAddColumn(
  'pos_payments',
  'customerProfileId',
  'INTEGER'
)

safeAddColumn(
  'pos_payments',
  'customerChannelCode',
  'TEXT'
)

safeAddColumn(
  'pos_payments',
  'paidStaffCode',
  'TEXT'
)

safeAddColumn(
  'pos_payments',
  'paidStaffNameSnapshot',
  'TEXT'
)

safeAddColumn(
  'pos_payments',
  'approvedAt',
  'TEXT'
)

safeAddColumn(
  'pos_payments',
  'canceledAt',
  'TEXT'
)

safeAddColumn(
  'pos_payments',
  'memo',
  'TEXT'
)

safeAddColumn(
  'pos_payments',
  'updatedAt',
  'TEXT'
)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_orders_provider_date_sequence
ON pos_orders(providerChannelCode, orderDate, orderSequence)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_orders_order_code
ON pos_orders(orderCode)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_orders_provider_revision_code_unique
ON pos_orders(providerChannelCode, revisionCode)
WHERE revisionCode IS NOT NULL
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_orders_provider_order_revision_no_unique
ON pos_orders(providerChannelCode, orderCode, revisionNo)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_orders_provider_order_code
ON pos_orders(providerChannelCode, orderCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_orders_provider_order_revision_no
ON pos_orders(providerChannelCode, orderCode, revisionNo)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_orders_provider_location_active_payment
ON pos_orders(providerChannelCode, locationId, isActive, paymentStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_orders_order_date
ON pos_orders(orderDate)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_orders_order_year_month_day
ON pos_orders(orderYear, orderMonth, orderDay)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_orders_customer_channel
ON pos_orders(customerChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_order_items_order_code
ON pos_order_items(orderCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_order_items_revision_code
ON pos_order_items(revisionCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_order_items_provider_order_code
ON pos_order_items(providerChannelCode, orderCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_order_items_provider_order_revision_no
ON pos_order_items(providerChannelCode, orderCode, revisionNo)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_order_items_order_id_order_code
ON pos_order_items(orderId, orderCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_order_items_order_id_order_code_revision
ON pos_order_items(orderId, orderCode, revisionCode)
`)

const insertPosOrderTypeConfig = db.prepare(`
INSERT OR IGNORE INTO pos_order_type_configs(
profileId,
channelCode,
orderTypeCode,
defaultTitle,
customTitle,
description,
isEnabled,
isFixed,
sortOrder
)
VALUES(?,?,?,?,?,?,?,?,?)
`)

function ensurePosOrderTypeConfigs(
profileId: number,
channelCode: string
) {
const defaults = [
  {
    orderTypeCode: 'TABLE',
    defaultTitle: '테이블 주문',
    description: '매장 내 테이블 주문을 사용합니다.',
    isEnabled: 1,
    sortOrder: 1
  },
  {
    orderTypeCode: 'RESERVATION',
    defaultTitle: '예약 주문',
    description: '예약 기반 주문 접수를 사용합니다.',
    isEnabled: 0,
    sortOrder: 2
  },
  {
    orderTypeCode: 'DELIVERY',
    defaultTitle: '배달 주문',
    description: '배달 주문 접수를 사용합니다.',
    isEnabled: 0,
    sortOrder: 3
  },
  {
    orderTypeCode: 'PICKUP',
    defaultTitle: '픽업 주문',
    description: '픽업 주문 접수를 사용합니다.',
    isEnabled: 0,
    sortOrder: 4
  },
  {
    orderTypeCode: 'QR_ORDER',
    defaultTitle: 'QR 주문',
    description: '테이블 QR 주문 접수를 사용합니다.',
    isEnabled: 1,
    sortOrder: 5
  },
  {
    orderTypeCode: 'KIOSK',
    defaultTitle: '키오스크 주문',
    description: '키오스크 주문 접수를 사용합니다.',
    isEnabled: 0,
    sortOrder: 6
  }
] as const

for (const item of defaults) {
  insertPosOrderTypeConfig.run(
    profileId,
    channelCode,
    item.orderTypeCode,
    item.defaultTitle,
    null,
    item.description,
    item.isEnabled,
    1,
    item.sortOrder
  )
}
}

const insertPosTableTypeCode = db.prepare(`
INSERT OR IGNORE INTO pos_table_type_codes(
profileId,
channelCode,
tableTypeCode,
displayName,
description,
colorCode,
isActive,
isDefault,
sortOrder
)
VALUES(?,?,?,?,?,?,?,?,?)
`)

function ensurePosTableTypeCodes(
profileId:number,
channelCode:string
){

const defaults = [
{
tableTypeCode:'STANDARD',
displayName:'스탠다드',
description:'기본 운영 타입',
colorCode:'#64748B',
isDefault:1,
sortOrder:1
},
{
tableTypeCode:'DELUXE',
displayName:'디럭스',
description:'디럭스 운영 타입',
colorCode:'#2563EB',
isDefault:1,
sortOrder:2
},
{
tableTypeCode:'PREMIUM',
displayName:'프리미엄',
description:'프리미엄 운영 타입',
colorCode:'#D97706',
isDefault:1,
sortOrder:3
},
{
tableTypeCode:'VIP',
displayName:'VIP',
description:'VIP 운영 타입',
colorCode:'#7C3AED',
isDefault:1,
sortOrder:4
}
] as const

for(const item of defaults){
insertPosTableTypeCode.run(
profileId,
channelCode,
item.tableTypeCode,
item.displayName,
item.description,
item.colorCode,
1,
item.isDefault,
item.sortOrder
)
}

}


ensurePosOrderTypeConfigs(
  businessProfile1.id,
  businessProfile1.channelCode
)

ensurePosOrderTypeConfigs(
  businessProfile2.id,
  businessProfile2.channelCode
)

ensurePosTableTypeCodes(
  businessProfile1.id,
  businessProfile1.channelCode
)

ensurePosTableTypeCodes(
  businessProfile2.id,
  businessProfile2.channelCode
)

db.exec(`
UPDATE pos_order_type_configs
SET orderTypeCode = 'QR_ORDER'
WHERE orderTypeCode = 'QR'
`)

db.exec(`
UPDATE pos_orders
SET revisionCode = 'LG' || printf('%010d', id)
WHERE revisionCode IS NULL
`)

db.exec(`
UPDATE pos_orders
SET revisionNo = 1
WHERE revisionNo IS NULL
`)

db.exec(`
UPDATE pos_orders
SET orderDate = COALESCE(orderDate, substr(createdAt, 1, 10), date('now'))
WHERE orderDate IS NULL
`)

db.exec(`
UPDATE pos_orders
SET orderYear = CAST(strftime('%Y', orderDate) AS INTEGER)
WHERE orderYear IS NULL
  AND orderDate IS NOT NULL
`)

db.exec(`
UPDATE pos_orders
SET orderMonth = CAST(strftime('%m', orderDate) AS INTEGER)
WHERE orderMonth IS NULL
  AND orderDate IS NOT NULL
`)

db.exec(`
UPDATE pos_orders
SET orderDay = CAST(strftime('%d', orderDate) AS INTEGER)
WHERE orderDay IS NULL
  AND orderDate IS NOT NULL
`)

db.exec(`
UPDATE pos_orders
SET orderSequence = COALESCE(orderSequence, id)
WHERE orderSequence IS NULL
`)

db.exec(`
UPDATE pos_orders
SET isActive = 1
WHERE isActive IS NULL
`)

db.exec(`
UPDATE pos_orders
SET orderStatus = CASE
  WHEN orderStatus = 'CANCELED' THEN 'CANCELLED'
  WHEN orderStatus = 'ACCEPTED' THEN 'CONFIRMED'
  WHEN orderStatus = 'PREPARING' THEN 'PREPARING'
  WHEN orderStatus = 'READY' THEN 'READY'
  WHEN orderStatus = 'COMPLETED' THEN 'COMPLETED'
  WHEN orderStatus = 'REFUNDED' THEN 'CANCELLED'
  WHEN orderStatus IN ('CREATED','CONFIRMED','REPLACED','CANCELLED','ADMIN_DISABLED') THEN orderStatus
  ELSE 'CREATED'
END
`)

db.exec(`
UPDATE pos_orders
SET paymentStatus = CASE
  WHEN paymentStatus = 'CANCELED' THEN 'CANCELLED'
  ELSE paymentStatus
END
`)

db.exec(`
UPDATE pos_order_items
SET
  revisionCode = COALESCE(
    revisionCode,
    (
      SELECT o.revisionCode
      FROM pos_orders o
      WHERE o.id = pos_order_items.orderId
      LIMIT 1
    )
  ),
  revisionNo = COALESCE(
    revisionNo,
    (
      SELECT o.revisionNo
      FROM pos_orders o
      WHERE o.id = pos_order_items.orderId
      LIMIT 1
    ),
    1
  ),
  orderCode = COALESCE(
    orderCode,
    (
      SELECT o.orderCode
      FROM pos_orders o
      WHERE o.id = pos_order_items.orderId
      LIMIT 1
    )
  )
WHERE EXISTS (
  SELECT 1
  FROM pos_orders o
  WHERE o.id = pos_order_items.orderId
)
`)

db.exec(`
INSERT INTO pos_product_categories(
  profileId,
  channelCode,
  categoryCode,
  categoryName,
  sortOrder,
  isActive,
  isDefault,
  isDeletable,
  ageRestrictionType,
  requiresAdultVerification,
  restrictedOrderChannel,
  createdAt,
  updatedAt
)
SELECT
  p.id,
  p.channelCode,
  'ALCOHOL',
  '주류',
  5,
  1,
  1,
  1,
  'ADULT_19',
  1,
  'QR_ORDER',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM profiles p
WHERE p.profileType = 'BUSINESS'
  AND NOT EXISTS (
    SELECT 1
    FROM pos_product_categories c
    WHERE c.profileId = p.id
      AND c.channelCode = p.channelCode
      AND c.categoryCode = 'ALCOHOL'
  )
`)

db.exec(`
UPDATE pos_product_categories
SET categoryCode = CASE
  WHEN categoryCode IS NOT NULL AND trim(categoryCode) <> '' THEN categoryCode
  WHEN categoryName = '硫붿씤 硫붾돱' OR sortOrder = 1 THEN 'MAIN'
  WHEN categoryName = '?쒕툕 硫붾돱' OR sortOrder = 2 THEN 'SUB'
  WHEN categoryName = '?뚮즺' OR sortOrder = 3 THEN 'DRINK'
  WHEN categoryName = '사이드' OR sortOrder = 4 THEN 'SIDE'
  WHEN sortOrder = 5 THEN 'ALCOHOL'
  ELSE 'CUSTOM'
END
`)

db.exec(`
UPDATE pos_product_categories
SET isDefault = CASE
  WHEN categoryCode IN ('MAIN', 'SUB', 'DRINK', 'SIDE', 'ALCOHOL') THEN 1
  ELSE COALESCE(isDefault, 0)
END
`)

db.exec(`
UPDATE pos_product_categories
SET isDeletable = CASE
  WHEN categoryCode = 'MAIN' THEN 0
  WHEN categoryCode IN ('SUB', 'DRINK', 'SIDE', 'ALCOHOL') THEN 1
  ELSE COALESCE(isDeletable, 1)
END
`)

db.exec(`
UPDATE pos_product_categories
SET
  categoryName = '주류',
  sortOrder = 5,
  isActive = 1,
  isDefault = 1,
  isDeletable = 1,
  ageRestrictionType = 'ADULT_19',
  requiresAdultVerification = 1,
  restrictedOrderChannel = 'QR_ORDER'
WHERE categoryCode = 'ALCOHOL'
`)

db.exec(`
UPDATE pos_product_categories
SET
  ageRestrictionType = 'NONE',
  requiresAdultVerification = 0,
  restrictedOrderChannel = 'NONE'
WHERE categoryCode IN ('MAIN', 'SUB', 'DRINK', 'SIDE')
`)

db.exec(`
UPDATE pos_product_categories
SET
  ageRestrictionType = 'NONE',
  restrictedOrderChannel = 'NONE'
WHERE COALESCE(requiresAdultVerification, 0) = 0
`)

db.exec(`
UPDATE pos_product_categories
SET
  requiresAdultVerification = 0
WHERE requiresAdultVerification IS NULL
`)

db.exec(`
INSERT OR IGNORE INTO pos_products(
  profileId,
  channelCode,
  productId,
  productCode,
  sourceType,
  productType,
  productKind,
  categoryId,
  productName,
  productDescription,
  basePrice,
  currency,
  isActive,
  isSoldOut,
  isRepresentative,
  showOnTableOrder,
  allowNormalOrder,
  allowReservationOrder,
  allowDineIn,
  allowTakeout,
  allowDelivery,
  menuStatus,
  sortOrder,
  createdAt,
  updatedAt
)
SELECT
  p.id,
  p.channelCode,
  'PLC-' || strftime('%Y-%m-%d', 'now') || '-901',
  'TSB8X7C6V5A1',
  'POS_PRODUCT',
  'PRODUCT',
  'MAIN_PRODUCT',
  NULL,
  '테스트 버거',
  'RAPUS_QR 검증용 테스트 상품',
  9000,
  'KRW',
  1,
  0,
  0,
  1,
  1,
  0,
  1,
  1,
  1,
  'ON_SALE',
  901,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM profiles p
WHERE p.profileType='BUSINESS'
  AND p.channelCode='B8X7C6V5B4N3M'
`)

db.exec(`
INSERT OR IGNORE INTO pos_products(
  profileId,
  channelCode,
  productId,
  productCode,
  sourceType,
  productType,
  productKind,
  categoryId,
  productName,
  productDescription,
  basePrice,
  currency,
  isActive,
  isSoldOut,
  isRepresentative,
  showOnTableOrder,
  allowNormalOrder,
  allowReservationOrder,
  allowDineIn,
  allowTakeout,
  allowDelivery,
  menuStatus,
  sortOrder,
  createdAt,
  updatedAt
)
SELECT
  p.id,
  p.channelCode,
  'PLC-' || strftime('%Y-%m-%d', 'now') || '-902',
  'TSC0L4A2B7Z9',
  'POS_PRODUCT',
  'PRODUCT',
  'MAIN_PRODUCT',
  NULL,
  '테스트 콜라',
  'RAPUS_QR 검증용 테스트 상품',
  2000,
  'KRW',
  1,
  0,
  0,
  1,
  1,
  0,
  1,
  1,
  1,
  'ON_SALE',
  902,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM profiles p
WHERE p.profileType='BUSINESS'
  AND p.channelCode='B8X7C6V5B4N3M'
`)

db.exec(`
INSERT OR IGNORE INTO pos_products(
  profileId,
  channelCode,
  productId,
  productCode,
  sourceType,
  productType,
  productKind,
  categoryId,
  productName,
  productDescription,
  basePrice,
  currency,
  isActive,
  isSoldOut,
  isRepresentative,
  showOnTableOrder,
  allowNormalOrder,
  allowReservationOrder,
  allowDineIn,
  allowTakeout,
  allowDelivery,
  menuStatus,
  sortOrder,
  createdAt,
  updatedAt
)
SELECT
  p.id,
  p.channelCode,
  'PLC-' || strftime('%Y-%m-%d', 'now') || '-903',
  'TSB1C3D5E7F9',
  'POS_PRODUCT',
  'PRODUCT',
  'MAIN_PRODUCT',
  NULL,
  '테스트 라면',
  'RAPUS_QR 검증용 테스트 상품',
  4500,
  'KRW',
  1,
  0,
  0,
  1,
  1,
  0,
  1,
  1,
  1,
  'ON_SALE',
  903,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM profiles p
WHERE p.profileType='BUSINESS'
  AND p.channelCode='${businessProfile1.channelCode}'
`)

db.exec(`
INSERT OR IGNORE INTO pos_products(
  profileId,
  channelCode,
  productId,
  productCode,
  sourceType,
  productType,
  productKind,
  categoryId,
  productName,
  productDescription,
  basePrice,
  currency,
  isActive,
  isSoldOut,
  isRepresentative,
  showOnTableOrder,
  allowNormalOrder,
  allowReservationOrder,
  allowDineIn,
  allowTakeout,
  allowDelivery,
  menuStatus,
  sortOrder,
  createdAt,
  updatedAt
)
SELECT
  p.id,
  p.channelCode,
  'PLC-' || strftime('%Y-%m-%d', 'now') || '-904',
  'TSJU1C3E5K7M',
  'POS_PRODUCT',
  'PRODUCT',
  'MAIN_PRODUCT',
  NULL,
  '테스트 주스',
  'RAPUS_QR 검증용 테스트 상품',
  3000,
  'KRW',
  1,
  0,
  0,
  1,
  1,
  0,
  1,
  1,
  1,
  'ON_SALE',
  904,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM profiles p
WHERE p.profileType='BUSINESS'
  AND p.channelCode='${businessProfile1.channelCode}'
`)

db.exec(`
UPDATE pos_products
SET productCode = 'RPNUN000' || substr('000000' || id, -6, 6)
WHERE productCode IS NULL
`)

db.exec(`
UPDATE pos_products
SET sourceType = 'POS_PRODUCT'
WHERE sourceType IS NULL
   OR TRIM(sourceType) = ''
`)

db.exec(`
UPDATE pos_products
SET productId =
  CASE
    WHEN COALESCE(sourceType, 'POS_PRODUCT') = 'MARKET_PRODUCT'
      THEN 'MKT-' || strftime('%Y-%m-%d', 'now') || '-' || substr('000' || id, -3, 3)
    ELSE
      'PLC-' || strftime('%Y-%m-%d', 'now') || '-' || substr('000' || id, -3, 3)
  END
WHERE productId IS NULL
   OR TRIM(productId) = ''
`)

db.exec(`
INSERT INTO pos_product_scan_codes(
  profileId,
  channelCode,
  productDbId,
  productId,
  productCode,
  sourceType,
  scanCodeType,
  scanCodeValue,
  scanCodeSource,
  externalBarcodeFormat,
  isPrimary,
  isActive,
  createdAt,
  updatedAt
)
SELECT
  p.profileId,
  p.channelCode,
  p.id,
  p.productId,
  p.productCode,
  COALESCE(p.sourceType, 'POS_PRODUCT'),
  'RAPUS_QR',
  'RAPUS:PRODUCT:' || p.channelCode || ':' || p.productCode,
  'RAPUS',
  NULL,
  1,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM pos_products p
WHERE p.productCode IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM pos_product_scan_codes s
    WHERE s.channelCode = p.channelCode
      AND s.productCode = p.productCode
      AND s.isPrimary = 1
      AND s.deletedAt IS NULL
  )
`)

const hasPosProductBarcodesTable =
  db.prepare(`
    SELECT 1
    FROM sqlite_master
    WHERE type = 'table'
      AND name = 'pos_product_barcodes'
    LIMIT 1
  `).get() as { 1?: number } | undefined

//====================================================
// SECTION 26-1 : MASTER BARCODE / MASTER PRODUCT CORE
// ROLE : GLOBAL MASTER CATALOG (NO channelCode)
//====================================================

db.exec(`
CREATE TABLE IF NOT EXISTS master_barcodes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gtin TEXT NOT NULL UNIQUE CHECK(length(gtin)=13),
  barcodeType TEXT DEFAULT 'EAN13',
  productCategoryCode TEXT,
  productCategoryName TEXT,
  rawProductName TEXT,
  productNameKo TEXT,
  productNameEn TEXT,
  otherProductName TEXT,
  itemName TEXT,
  modelName TEXT,
  productNumber TEXT,
  companyInfo TEXT,
  importType TEXT,
  normalizedProductName TEXT,
  brandName TEXT,
  brandOwnerName TEXT,
  manufacturerName TEXT,
  categoryName TEXT,
  categoryCode TEXT,
  originInfo TEXT,
  specInfo TEXT,
  unitLabel TEXT,
  packageInfo TEXT,
  packageQuantity INTEGER,
  netWeight TEXT,
  grossWeight TEXT,
  widthCm TEXT,
  depthCm TEXT,
  heightCm TEXT,
  taxType TEXT,
  productShape TEXT,
  packageMaterial TEXT,
  recycleLabel TEXT,
  isAdultProduct INTEGER NOT NULL DEFAULT 0,
  isChildProduct INTEGER NOT NULL DEFAULT 0,
  storageNotice TEXT,
  marketingText TEXT,
  ingredientText TEXT,
  sourceThumbnailUrl TEXT,
  sourceType TEXT NOT NULL DEFAULT 'MANUAL'
  CHECK(sourceType IN('CSV','API','MANUAL')),
  rawPayload TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT
)
`)

safeAddColumn('master_barcodes', 'barcodeType', "TEXT DEFAULT 'EAN13'")
safeAddColumn('master_barcodes', 'productCategoryCode', 'TEXT')
safeAddColumn('master_barcodes', 'productCategoryName', 'TEXT')
safeAddColumn('master_barcodes', 'rawProductName', 'TEXT')
safeAddColumn('master_barcodes', 'productNameKo', 'TEXT')
safeAddColumn('master_barcodes', 'productNameEn', 'TEXT')
safeAddColumn('master_barcodes', 'otherProductName', 'TEXT')
safeAddColumn('master_barcodes', 'itemName', 'TEXT')
safeAddColumn('master_barcodes', 'modelName', 'TEXT')
safeAddColumn('master_barcodes', 'productNumber', 'TEXT')
safeAddColumn('master_barcodes', 'companyInfo', 'TEXT')
safeAddColumn('master_barcodes', 'importType', 'TEXT')
safeAddColumn('master_barcodes', 'normalizedProductName', 'TEXT')
safeAddColumn('master_barcodes', 'brandName', 'TEXT')
safeAddColumn('master_barcodes', 'brandOwnerName', 'TEXT')
safeAddColumn('master_barcodes', 'manufacturerName', 'TEXT')
safeAddColumn('master_barcodes', 'categoryName', 'TEXT')
safeAddColumn('master_barcodes', 'categoryCode', 'TEXT')
safeAddColumn('master_barcodes', 'originInfo', 'TEXT')
safeAddColumn('master_barcodes', 'specInfo', 'TEXT')
safeAddColumn('master_barcodes', 'unitLabel', 'TEXT')
safeAddColumn('master_barcodes', 'packageInfo', 'TEXT')
safeAddColumn('master_barcodes', 'packageQuantity', 'INTEGER')
safeAddColumn('master_barcodes', 'netWeight', 'TEXT')
safeAddColumn('master_barcodes', 'grossWeight', 'TEXT')
safeAddColumn('master_barcodes', 'widthCm', 'TEXT')
safeAddColumn('master_barcodes', 'depthCm', 'TEXT')
safeAddColumn('master_barcodes', 'heightCm', 'TEXT')
safeAddColumn('master_barcodes', 'taxType', 'TEXT')
safeAddColumn('master_barcodes', 'productShape', 'TEXT')
safeAddColumn('master_barcodes', 'packageMaterial', 'TEXT')
safeAddColumn('master_barcodes', 'recycleLabel', 'TEXT')
safeAddColumn('master_barcodes', 'isAdultProduct', 'INTEGER NOT NULL DEFAULT 0')
safeAddColumn('master_barcodes', 'isChildProduct', 'INTEGER NOT NULL DEFAULT 0')
safeAddColumn('master_barcodes', 'storageNotice', 'TEXT')
safeAddColumn('master_barcodes', 'marketingText', 'TEXT')
safeAddColumn('master_barcodes', 'ingredientText', 'TEXT')
safeAddColumn('master_barcodes', 'sourceThumbnailUrl', 'TEXT')
safeAddColumn(
  'master_barcodes',
  'sourceType',
  "TEXT NOT NULL DEFAULT 'MANUAL' CHECK(sourceType IN('CSV','API','MANUAL'))"
)
safeAddColumn('master_barcodes', 'rawPayload', 'TEXT')
safeAddColumn('master_barcodes', 'isActive', 'INTEGER NOT NULL DEFAULT 1')
safeAddColumn('master_barcodes', 'updatedAt', 'TEXT')

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_barcodes_category_code
ON master_barcodes(categoryCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_barcodes_product_category_code
ON master_barcodes(productCategoryCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_barcodes_brand_name
ON master_barcodes(brandName)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_barcodes_raw_product_name
ON master_barcodes(rawProductName)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_barcodes_source_type
ON master_barcodes(sourceType)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_barcodes_is_active
ON master_barcodes(isActive)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS master_product_categories(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  categoryCode TEXT NOT NULL UNIQUE,
  categoryName TEXT NOT NULL,
  parentCategoryId INTEGER,
  depth INTEGER NOT NULL DEFAULT 1 CHECK(depth IN(1,2)),
  sortOrder INTEGER NOT NULL DEFAULT 0,
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  feedExposeType TEXT NOT NULL DEFAULT 'NONE'
  CHECK(feedExposeType IN('NONE','MARKET_FEED','EVENT_FEED','PROMOTION_FEED')),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(parentCategoryId) REFERENCES master_product_categories(id)
)
`)

safeAddColumn('master_product_categories', 'categoryCode', 'TEXT')
safeAddColumn('master_product_categories', 'categoryName', 'TEXT')
safeAddColumn('master_product_categories', 'parentCategoryId', 'INTEGER')
safeAddColumn('master_product_categories', 'depth', 'INTEGER NOT NULL DEFAULT 1 CHECK(depth IN(1,2))')
safeAddColumn('master_product_categories', 'sortOrder', 'INTEGER NOT NULL DEFAULT 0')
safeAddColumn('master_product_categories', 'isActive', 'INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1))')
safeAddColumn(
  'master_product_categories',
  'feedExposeType',
  "TEXT NOT NULL DEFAULT 'NONE' CHECK(feedExposeType IN('NONE','MARKET_FEED','EVENT_FEED','PROMOTION_FEED'))"
)
safeAddColumn('master_product_categories', 'updatedAt', 'TEXT')

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS uq_master_product_categories_code
ON master_product_categories(categoryCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_product_categories_parent
ON master_product_categories(parentCategoryId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_product_categories_depth
ON master_product_categories(depth)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_product_categories_active
ON master_product_categories(isActive)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_product_categories_feed_expose
ON master_product_categories(feedExposeType)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS semantic_item_registry(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itemCode TEXT NOT NULL UNIQUE,
  itemName TEXT NOT NULL,
  categoryType TEXT NOT NULL,
  aliases TEXT,
  isWeightProduct INTEGER NOT NULL DEFAULT 0 CHECK(isWeightProduct IN(0,1)),
  isSeasonal INTEGER NOT NULL DEFAULT 0 CHECK(isSeasonal IN(0,1)),
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT
)
`)

safeAddColumn('semantic_item_registry', 'itemCode', 'TEXT')
safeAddColumn('semantic_item_registry', 'itemName', 'TEXT')
safeAddColumn('semantic_item_registry', 'categoryType', 'TEXT')
safeAddColumn('semantic_item_registry', 'aliases', 'TEXT')
safeAddColumn('semantic_item_registry', 'isWeightProduct', 'INTEGER NOT NULL DEFAULT 0 CHECK(isWeightProduct IN(0,1))')
safeAddColumn('semantic_item_registry', 'isSeasonal', 'INTEGER NOT NULL DEFAULT 0 CHECK(isSeasonal IN(0,1))')
safeAddColumn('semantic_item_registry', 'isActive', 'INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1))')
safeAddColumn('semantic_item_registry', 'updatedAt', 'TEXT')

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS uq_semantic_item_registry_item_code
ON semantic_item_registry(itemCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_semantic_item_registry_category
ON semantic_item_registry(categoryType)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS semantic_prefix_registry(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prefixCode TEXT NOT NULL UNIQUE,
  prefixName TEXT NOT NULL,
  prefixCategory TEXT,
  description TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT
)
`)

safeAddColumn('semantic_prefix_registry', 'prefixCode', 'TEXT')
safeAddColumn('semantic_prefix_registry', 'prefixName', 'TEXT')
safeAddColumn('semantic_prefix_registry', 'prefixCategory', 'TEXT')
safeAddColumn('semantic_prefix_registry', 'description', 'TEXT')
safeAddColumn('semantic_prefix_registry', 'updatedAt', 'TEXT')

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS uq_semantic_prefix_registry_prefix_code
ON semantic_prefix_registry(prefixCode)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS barcode_parse_cache(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scanCodeValue TEXT NOT NULL,
  semanticProductCode TEXT,
  parsedMetadata TEXT,
  parserType TEXT NOT NULL,
  parserVersion TEXT NOT NULL,
  parsedAt TEXT DEFAULT CURRENT_TIMESTAMP
)
`)

safeAddColumn('barcode_parse_cache', 'scanCodeValue', 'TEXT')
safeAddColumn('barcode_parse_cache', 'semanticProductCode', 'TEXT')
safeAddColumn('barcode_parse_cache', 'parsedMetadata', 'TEXT')
safeAddColumn('barcode_parse_cache', 'parserType', 'TEXT')
safeAddColumn('barcode_parse_cache', 'parserVersion', 'TEXT')
safeAddColumn('barcode_parse_cache', 'parsedAt', 'TEXT')

db.exec(`
CREATE INDEX IF NOT EXISTS idx_barcode_parse_cache_scan_code
ON barcode_parse_cache(scanCodeValue)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_barcode_parse_cache_semantic_code
ON barcode_parse_cache(semanticProductCode)
`)

const semanticItemRegistrySeeds = [
  { itemCode: '379', itemName: '참외', categoryType: 'FRUIT', aliases: '참외,oriental melon', isWeightProduct: 1, isSeasonal: 1 },
  { itemCode: '380', itemName: '수박', categoryType: 'FRUIT', aliases: '수박,watermelon', isWeightProduct: 1, isSeasonal: 1 },
  { itemCode: '381', itemName: '바나나', categoryType: 'FRUIT', aliases: '바나나,banana', isWeightProduct: 1, isSeasonal: 0 },
  { itemCode: '382', itemName: '사과', categoryType: 'FRUIT', aliases: '사과,apple', isWeightProduct: 1, isSeasonal: 1 },
  { itemCode: '210', itemName: '상추', categoryType: 'VEGETABLE', aliases: '상추,lettuce', isWeightProduct: 1, isSeasonal: 0 },
  { itemCode: '211', itemName: '깻잎', categoryType: 'VEGETABLE', aliases: '깻잎,perilla leaf', isWeightProduct: 1, isSeasonal: 0 },
  { itemCode: '212', itemName: '양파', categoryType: 'VEGETABLE', aliases: '양파,onion', isWeightProduct: 1, isSeasonal: 0 },
  { itemCode: '510', itemName: '돼지고기', categoryType: 'MEAT', aliases: '돼지고기,pork', isWeightProduct: 1, isSeasonal: 0 },
  { itemCode: '511', itemName: '삼겹살', categoryType: 'MEAT', aliases: '삼겹살,pork belly', isWeightProduct: 1, isSeasonal: 0 },
  { itemCode: '620', itemName: '생선', categoryType: 'SEAFOOD', aliases: '생선,fish', isWeightProduct: 1, isSeasonal: 0 },
  { itemCode: '621', itemName: '고등어', categoryType: 'SEAFOOD', aliases: '고등어,mackerel', isWeightProduct: 1, isSeasonal: 1 }
] as const

for (const item of semanticItemRegistrySeeds) {
  db.prepare(`
    INSERT OR IGNORE INTO semantic_item_registry(
      itemCode,
      itemName,
      categoryType,
      aliases,
      isWeightProduct,
      isSeasonal,
      isActive,
      createdAt
    )
    VALUES(?,?,?,?,?,?,1,CURRENT_TIMESTAMP)
  `).run(
    item.itemCode,
    item.itemName,
    item.categoryType,
    item.aliases,
    item.isWeightProduct,
    item.isSeasonal
  )
}

const semanticPrefixRegistrySeeds = [
  { prefixCode: 'NO', prefixName: 'Normal', prefixCategory: 'DEFAULT', description: '일반 semantic 상품' },
  { prefixCode: 'OR', prefixName: 'Organic', prefixCategory: 'QUALITY', description: '유기농 semantic 상품' },
  { prefixCode: 'PR', prefixName: 'Premium', prefixCategory: 'QUALITY', description: '프리미엄 semantic 상품' },
  { prefixCode: 'FR', prefixName: 'Frozen', prefixCategory: 'STORAGE', description: '냉동 semantic 상품' },
  { prefixCode: 'RF', prefixName: 'Refrigerated', prefixCategory: 'STORAGE', description: '냉장 semantic 상품' },
  { prefixCode: 'WT', prefixName: 'Weight Product', prefixCategory: 'WEIGHT', description: '저울/중량 semantic 상품' },
  { prefixCode: 'IM', prefixName: 'Imported', prefixCategory: 'ORIGIN', description: '수입 semantic 상품' },
  { prefixCode: 'LC', prefixName: 'Local', prefixCategory: 'ORIGIN', description: '지역/국산 semantic 상품' },
  { prefixCode: 'UN', prefixName: 'Unknown', prefixCategory: 'FALLBACK', description: '미분류 fallback semantic 상품' },
  { prefixCode: 'CS', prefixName: 'Custom', prefixCategory: 'CUSTOM', description: '사용자 정의 semantic 상품' }
] as const

for (const prefix of semanticPrefixRegistrySeeds) {
  db.prepare(`
    INSERT OR IGNORE INTO semantic_prefix_registry(
      prefixCode,
      prefixName,
      prefixCategory,
      description,
      createdAt
    )
    VALUES(?,?,?,?,CURRENT_TIMESTAMP)
  `).run(
    prefix.prefixCode,
    prefix.prefixName,
    prefix.prefixCategory,
    prefix.description
  )
}

const masterProductCategorySeeds = [
  { code: 'GROCERY', name: '공산품', depth: 1, parentCode: null, sortOrder: 10, feedExposeType: 'MARKET_FEED' },
  { code: 'FRUIT', name: '청과', depth: 1, parentCode: null, sortOrder: 20, feedExposeType: 'MARKET_FEED' },
  { code: 'VEGETABLE', name: '야채', depth: 1, parentCode: null, sortOrder: 30, feedExposeType: 'MARKET_FEED' },
  { code: 'MEAT', name: '정육', depth: 1, parentCode: null, sortOrder: 40, feedExposeType: 'MARKET_FEED' },
  { code: 'SEAFOOD', name: '수산', depth: 1, parentCode: null, sortOrder: 50, feedExposeType: 'MARKET_FEED' },
  { code: 'REFRIGERATED', name: '냉장', depth: 1, parentCode: null, sortOrder: 60, feedExposeType: 'MARKET_FEED' },
  { code: 'FROZEN', name: '냉동', depth: 1, parentCode: null, sortOrder: 70, feedExposeType: 'MARKET_FEED' },
  { code: 'DAIRY', name: '유제품', depth: 1, parentCode: null, sortOrder: 80, feedExposeType: 'MARKET_FEED' },
  { code: 'BAKERY', name: '베이커리', depth: 1, parentCode: null, sortOrder: 90, feedExposeType: 'MARKET_FEED' },
  { code: 'READY_MEAL', name: '간편식', depth: 1, parentCode: null, sortOrder: 100, feedExposeType: 'MARKET_FEED' },
  { code: 'BEVERAGE', name: '음료', depth: 1, parentCode: null, sortOrder: 110, feedExposeType: 'MARKET_FEED' },
  { code: 'ALCOHOL', name: '주류', depth: 1, parentCode: null, sortOrder: 120, feedExposeType: 'MARKET_FEED' },
  { code: 'SNACK', name: '과자', depth: 1, parentCode: null, sortOrder: 130, feedExposeType: 'EVENT_FEED' },
  { code: 'LIFESTYLE', name: '생활용품', depth: 1, parentCode: null, sortOrder: 140, feedExposeType: 'MARKET_FEED' },
  { code: 'PET', name: '반려동물', depth: 1, parentCode: null, sortOrder: 150, feedExposeType: 'MARKET_FEED' },
  { code: 'ETC', name: '기타', depth: 1, parentCode: null, sortOrder: 990, feedExposeType: 'NONE' },
  { code: 'NOODLE', name: '라면', depth: 2, parentCode: 'GROCERY', sortOrder: 1010, feedExposeType: 'EVENT_FEED' },
  { code: 'INSTANT_FOOD', name: '즉석식품', depth: 2, parentCode: 'GROCERY', sortOrder: 1020, feedExposeType: 'MARKET_FEED' },
  { code: 'HAM', name: '햄', depth: 2, parentCode: 'GROCERY', sortOrder: 1030, feedExposeType: 'MARKET_FEED' },
  { code: 'SAUSAGE', name: '소시지', depth: 2, parentCode: 'GROCERY', sortOrder: 1040, feedExposeType: 'MARKET_FEED' },
  { code: 'CANNED', name: '통조림', depth: 2, parentCode: 'GROCERY', sortOrder: 1050, feedExposeType: 'MARKET_FEED' },
  { code: 'SEASONING', name: '조미료', depth: 2, parentCode: 'GROCERY', sortOrder: 1060, feedExposeType: 'MARKET_FEED' },
  { code: 'CUP_NOODLE', name: '컵라면', depth: 2, parentCode: 'GROCERY', sortOrder: 1070, feedExposeType: 'EVENT_FEED' },
  { code: 'APPLE', name: '사과', depth: 2, parentCode: 'FRUIT', sortOrder: 2010, feedExposeType: 'MARKET_FEED' },
  { code: 'PEAR', name: '배', depth: 2, parentCode: 'FRUIT', sortOrder: 2020, feedExposeType: 'MARKET_FEED' },
  { code: 'CITRUS', name: '감귤', depth: 2, parentCode: 'FRUIT', sortOrder: 2030, feedExposeType: 'MARKET_FEED' },
  { code: 'ORANGE', name: '오렌지', depth: 2, parentCode: 'FRUIT', sortOrder: 2040, feedExposeType: 'MARKET_FEED' },
  { code: 'BANANA', name: '바나나', depth: 2, parentCode: 'FRUIT', sortOrder: 2050, feedExposeType: 'MARKET_FEED' },
  { code: 'GRAPE', name: '포도', depth: 2, parentCode: 'FRUIT', sortOrder: 2060, feedExposeType: 'MARKET_FEED' },
  { code: 'LETTUCE', name: '상추', depth: 2, parentCode: 'VEGETABLE', sortOrder: 3010, feedExposeType: 'MARKET_FEED' },
  { code: 'PERILLA_LEAF', name: '깻잎', depth: 2, parentCode: 'VEGETABLE', sortOrder: 3020, feedExposeType: 'MARKET_FEED' },
  { code: 'ONION', name: '양파', depth: 2, parentCode: 'VEGETABLE', sortOrder: 3030, feedExposeType: 'MARKET_FEED' },
  { code: 'POTATO', name: '감자', depth: 2, parentCode: 'VEGETABLE', sortOrder: 3040, feedExposeType: 'MARKET_FEED' },
  { code: 'CARROT', name: '당근', depth: 2, parentCode: 'VEGETABLE', sortOrder: 3050, feedExposeType: 'MARKET_FEED' },
  { code: 'PAPRIKA', name: '파프리카', depth: 2, parentCode: 'VEGETABLE', sortOrder: 3060, feedExposeType: 'MARKET_FEED' },
  { code: 'BEEF', name: '소고기', depth: 2, parentCode: 'MEAT', sortOrder: 4010, feedExposeType: 'MARKET_FEED' },
  { code: 'PORK', name: '돼지고기', depth: 2, parentCode: 'MEAT', sortOrder: 4020, feedExposeType: 'MARKET_FEED' },
  { code: 'PORK_BELLY', name: '삼겹살', depth: 2, parentCode: 'MEAT', sortOrder: 4030, feedExposeType: 'MARKET_FEED' },
  { code: 'PORK_NECK', name: '목살', depth: 2, parentCode: 'MEAT', sortOrder: 4040, feedExposeType: 'MARKET_FEED' },
  { code: 'CHICKEN', name: '닭고기', depth: 2, parentCode: 'MEAT', sortOrder: 4050, feedExposeType: 'MARKET_FEED' },
  { code: 'FISH', name: '생선', depth: 2, parentCode: 'SEAFOOD', sortOrder: 5010, feedExposeType: 'MARKET_FEED' },
  { code: 'SHRIMP', name: '새우', depth: 2, parentCode: 'SEAFOOD', sortOrder: 5020, feedExposeType: 'MARKET_FEED' },
  { code: 'SHELLFISH', name: '조개', depth: 2, parentCode: 'SEAFOOD', sortOrder: 5030, feedExposeType: 'MARKET_FEED' },
  { code: 'SQUID', name: '오징어', depth: 2, parentCode: 'SEAFOOD', sortOrder: 5040, feedExposeType: 'MARKET_FEED' },
  { code: 'SEAWEED', name: '김', depth: 2, parentCode: 'SEAFOOD', sortOrder: 5050, feedExposeType: 'MARKET_FEED' },
  { code: 'ANCHOVY', name: '멸치', depth: 2, parentCode: 'SEAFOOD', sortOrder: 5060, feedExposeType: 'MARKET_FEED' },
  { code: 'FROZEN_DUMPLING', name: '냉동만두', depth: 2, parentCode: 'FROZEN', sortOrder: 7010, feedExposeType: 'MARKET_FEED' },
  { code: 'FROZEN_CHICKEN', name: '냉동치킨', depth: 2, parentCode: 'FROZEN', sortOrder: 7020, feedExposeType: 'MARKET_FEED' },
  { code: 'ICE_CREAM', name: '아이스크림', depth: 2, parentCode: 'FROZEN', sortOrder: 7030, feedExposeType: 'PROMOTION_FEED' },
  { code: 'WATER', name: '생수', depth: 2, parentCode: 'BEVERAGE', sortOrder: 11010, feedExposeType: 'MARKET_FEED' },
  { code: 'SODA', name: '탄산음료', depth: 2, parentCode: 'BEVERAGE', sortOrder: 11020, feedExposeType: 'MARKET_FEED' },
  { code: 'COFFEE', name: '커피', depth: 2, parentCode: 'BEVERAGE', sortOrder: 11030, feedExposeType: 'MARKET_FEED' },
  { code: 'JUICE', name: '주스', depth: 2, parentCode: 'BEVERAGE', sortOrder: 11040, feedExposeType: 'MARKET_FEED' },
  { code: 'TISSUE', name: '휴지', depth: 2, parentCode: 'LIFESTYLE', sortOrder: 14010, feedExposeType: 'MARKET_FEED' },
  { code: 'DETERGENT', name: '세제', depth: 2, parentCode: 'LIFESTYLE', sortOrder: 14020, feedExposeType: 'MARKET_FEED' },
  { code: 'WET_TISSUE', name: '물티슈', depth: 2, parentCode: 'LIFESTYLE', sortOrder: 14030, feedExposeType: 'MARKET_FEED' },
  { code: 'TOOTHBRUSH', name: '칫솔', depth: 2, parentCode: 'LIFESTYLE', sortOrder: 14040, feedExposeType: 'MARKET_FEED' },
  { code: 'SHAMPOO', name: '샴푸', depth: 2, parentCode: 'LIFESTYLE', sortOrder: 14050, feedExposeType: 'MARKET_FEED' }
] as const

for (const category of masterProductCategorySeeds) {
  const parent = category.parentCode
    ? db.prepare(`
      SELECT id
      FROM master_product_categories
      WHERE categoryCode = ?
      LIMIT 1
    `).get(category.parentCode) as { id?: number } | undefined
    : null

  db.prepare(`
    INSERT OR IGNORE INTO master_product_categories(
      categoryCode,
      categoryName,
      parentCategoryId,
      depth,
      sortOrder,
      feedExposeType,
      isActive,
      createdAt
    )
    VALUES(?,?,?,?,?,?,1,CURRENT_TIMESTAMP)
  `).run(
    category.code,
    category.name,
    parent?.id ?? null,
    category.depth,
    category.sortOrder,
    category.feedExposeType
  )

  db.prepare(`
    UPDATE master_product_categories
    SET
      categoryName = ?,
      parentCategoryId = ?,
      depth = ?,
      sortOrder = ?,
      feedExposeType = ?,
      isActive = 1,
      updatedAt = CURRENT_TIMESTAMP
    WHERE categoryCode = ?
  `).run(
    category.name,
    parent?.id ?? null,
    category.depth,
    category.sortOrder,
    category.feedExposeType,
    category.code
  )
}

//==================================================
// SECTION 14-5 : MANUFACTURERS / BRANDS
// RULE : 제조사와 브랜드는 분리 개념
//==================================================

db.exec(`
CREATE TABLE IF NOT EXISTS manufacturers(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manufacturerCode TEXT NOT NULL UNIQUE,
  manufacturerName TEXT NOT NULL,
  description TEXT,
  websiteUrl TEXT,
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_manufacturers_code
ON manufacturers(manufacturerCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_manufacturers_name
ON manufacturers(manufacturerName)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_manufacturers_active
ON manufacturers(isActive)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS brands(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brandCode TEXT NOT NULL UNIQUE,
  manufacturerId INTEGER,
  brandName TEXT NOT NULL,
  description TEXT,
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(manufacturerId) REFERENCES manufacturers(id)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_brands_code
ON brands(brandCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_brands_name
ON brands(brandName)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_brands_manufacturer
ON brands(manufacturerId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_brands_active
ON brands(isActive)
`)

const insertManufacturer = db.prepare(`
INSERT OR IGNORE INTO manufacturers(
  manufacturerCode,
  manufacturerName,
  description,
  websiteUrl,
  isActive
)
VALUES(?,?,?,?,?)
`)

insertManufacturer.run('MFR_NONGSHIM', '농심', '식품 제조사', null, 1)
insertManufacturer.run('MFR_CJ', 'CJ제일제당', '식품 제조사', null, 1)
insertManufacturer.run('MFR_KELLOGG', '켈로그코리아', '식품 제조사', null, 1)

const findManufacturerIdByName = db.prepare(`
SELECT id
FROM manufacturers
WHERE manufacturerName = ?
LIMIT 1
`)

const insertBrand = db.prepare(`
INSERT OR IGNORE INTO brands(
  brandCode,
  manufacturerId,
  brandName,
  description,
  isActive
)
VALUES(?,?,?,?,?)
`)

const manufacturerNongshimId =
  (findManufacturerIdByName.get('농심') as { id?: number } | undefined)?.id ?? null

const manufacturerCjId =
  (findManufacturerIdByName.get('CJ제일제당') as { id?: number } | undefined)?.id ?? null

const manufacturerKelloggId =
  (findManufacturerIdByName.get('켈로그코리아') as { id?: number } | undefined)?.id ?? null

insertBrand.run('BRD_SHINRAMYUN', manufacturerNongshimId, '신라면', '농심 대표 브랜드', 1)
insertBrand.run('BRD_CHAPAGETTI', manufacturerNongshimId, '짜파게티', '농심 대표 브랜드', 1)
insertBrand.run('BRD_YUKGAEJANG', manufacturerNongshimId, '육개장', '농심 대표 브랜드', 1)
insertBrand.run('BRD_HETBAHN', manufacturerCjId, '햇반', 'CJ제일제당 대표 브랜드', 1)
insertBrand.run('BRD_BIBIGO', manufacturerCjId, '비비고', 'CJ제일제당 대표 브랜드', 1)
insertBrand.run('BRD_CORNFROST', manufacturerKelloggId, '콘푸로스트', '켈로그코리아 대표 브랜드', 1)
insertBrand.run('BRD_CHEX', manufacturerKelloggId, '첵스', '켈로그코리아 대표 브랜드', 1)

db.exec(`
CREATE TABLE IF NOT EXISTS master_products(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  productCode TEXT NOT NULL UNIQUE CHECK(productCode LIKE 'RPB%' OR productCode LIKE 'RPN%'),
  semanticProductCode TEXT,
  primaryScanCodeValue TEXT,
  productName TEXT NOT NULL,
  normalizedProductName TEXT,
  manufacturerId INTEGER,
  brandId INTEGER,
  brandName TEXT,
  manufacturerName TEXT,
  categoryCode TEXT,
  categoryName TEXT,
  semanticTypePrefix TEXT,
  semanticItemCode TEXT,
  barcodeParserType TEXT,
  barcodeParserVersion TEXT,
  unitLabel TEXT,
  specInfo TEXT,
  thumbnailImageAssetId INTEGER,
  productStatus TEXT NOT NULL DEFAULT 'ACTIVE'
  CHECK(productStatus IN('ACTIVE','INACTIVE','DELETED')),
  isAdultProduct INTEGER NOT NULL DEFAULT 0,
  isActive INTEGER NOT NULL DEFAULT 1,
  approvalStatus TEXT NOT NULL DEFAULT 'DRAFT'
  CHECK(approvalStatus IN('DRAFT','AUTO_IMPORTED','APPROVED','REJECTED')),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(manufacturerId) REFERENCES manufacturers(id),
  FOREIGN KEY(brandId) REFERENCES brands(id),
  FOREIGN KEY(thumbnailImageAssetId) REFERENCES image_assets(id)
)
`)

safeAddColumn('master_products', 'semanticProductCode', 'TEXT')
safeAddColumn('master_products', 'primaryScanCodeValue', 'TEXT')
safeAddColumn('master_products', 'normalizedProductName', 'TEXT')
safeAddColumn('master_products', 'manufacturerId', 'INTEGER')
safeAddColumn('master_products', 'brandId', 'INTEGER')
safeAddColumn('master_products', 'brandName', 'TEXT')
safeAddColumn('master_products', 'manufacturerName', 'TEXT')
safeAddColumn('master_products', 'supplierName', 'TEXT')
safeAddColumn('master_products', 'categoryId', 'INTEGER')
safeAddColumn('master_products', 'categoryCode', 'TEXT')
safeAddColumn('master_products', 'categoryName', 'TEXT')
safeAddColumn('master_products', 'categoryLarge', 'TEXT')
safeAddColumn('master_products', 'categoryMedium', 'TEXT')
safeAddColumn('master_products', 'categorySmall', 'TEXT')
safeAddColumn('master_products', 'semanticTypePrefix', 'TEXT')
safeAddColumn('master_products', 'semanticItemCode', 'TEXT')
safeAddColumn('master_products', 'barcodeParserType', 'TEXT')
safeAddColumn('master_products', 'barcodeParserVersion', 'TEXT')
safeAddColumn('master_products', 'unitLabel', 'TEXT')
safeAddColumn('master_products', 'specInfo', 'TEXT')
safeAddColumn('master_products', 'specText', 'TEXT')
safeAddColumn('master_products', 'volumeText', 'TEXT')
safeAddColumn('master_products', 'description', 'TEXT')
safeAddColumn('master_products', 'origin', 'TEXT')
safeAddColumn('master_products', 'sourceSystem', 'TEXT')
safeAddColumn('master_products', 'thumbnailImageAssetId', 'INTEGER')
safeAddColumn(
  'master_products',
  'productStatus',
  "TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(productStatus IN('ACTIVE','INACTIVE','DELETED'))"
)
safeAddColumn('master_products', 'isAdultProduct', 'INTEGER NOT NULL DEFAULT 0')
safeAddColumn('master_products', 'isActive', 'INTEGER NOT NULL DEFAULT 1')
safeAddColumn(
  'master_products',
  'approvalStatus',
  "TEXT NOT NULL DEFAULT 'DRAFT' CHECK(approvalStatus IN('DRAFT','AUTO_IMPORTED','APPROVED','REJECTED'))"
)
safeAddColumn('master_products', 'updatedAt', 'TEXT')
safeAddColumn('master_products', 'deletedAt', 'TEXT')

db.exec(`
UPDATE master_products
SET productStatus = CASE
  WHEN deletedAt IS NOT NULL THEN 'DELETED'
  WHEN COALESCE(isActive, 1) = 1 THEN 'ACTIVE'
  ELSE 'INACTIVE'
END
WHERE productStatus IS NULL
   OR productStatus NOT IN('ACTIVE','INACTIVE','DELETED')
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_products_category_id
ON master_products(categoryId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_products_manufacturer_id
ON master_products(manufacturerId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_products_brand_id
ON master_products(brandId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_products_category_code
ON master_products(categoryCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_products_is_active
ON master_products(isActive)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_products_approval_status
ON master_products(approvalStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_products_product_code
ON master_products(productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_products_normalized_name
ON master_products(normalizedProductName)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_products_brand_name
ON master_products(brandName)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_products_product_status
ON master_products(productStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_products_semantic_product_code
ON master_products(semanticProductCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_products_primary_scan_code
ON master_products(primaryScanCodeValue)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_products_semantic_item
ON master_products(semanticTypePrefix, semanticItemCode)
`)

db.exec(`
UPDATE pos_products
SET masterProductId = (
  SELECT mp.id
  FROM master_products mp
  WHERE mp.productCode = pos_products.productCode
  LIMIT 1
)
WHERE masterProductId IS NULL
  AND productCode IS NOT NULL
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_products_supplier_name
ON master_products(supplierName)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_products_source_system
ON master_products(sourceSystem)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS channel_products(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channelCode TEXT NOT NULL,
  productCode TEXT NOT NULL,
  productSourceType TEXT NOT NULL
    CHECK(productSourceType IN('MASTER_PRODUCT','CHANNEL_MENU')),
  masterProductId INTEGER,
  displayName TEXT NOT NULL,
  description TEXT,
  salePrice INTEGER NOT NULL DEFAULT 0 CHECK(salePrice >= 0),
  normalPrice INTEGER NOT NULL DEFAULT 0 CHECK(normalPrice >= 0),
  stockStatus TEXT NOT NULL DEFAULT 'UNKNOWN'
    CHECK(stockStatus IN('UNKNOWN','IN_STOCK','LOW_STOCK','OUT_OF_STOCK','SOLD_OUT')),
  isEventActive INTEGER NOT NULL DEFAULT 0 CHECK(isEventActive IN(0,1)),
  eventPrice INTEGER CHECK(eventPrice IS NULL OR eventPrice >= 0),
  thumbnailImageAssetId INTEGER,
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(masterProductId) REFERENCES master_products(id),
  FOREIGN KEY(thumbnailImageAssetId) REFERENCES image_assets(id),
  UNIQUE(channelCode, productCode),
  CHECK(
    (productSourceType = 'MASTER_PRODUCT' AND masterProductId IS NOT NULL)
    OR
    (productSourceType = 'CHANNEL_MENU' AND masterProductId IS NULL)
  )
)
`)

safeAddColumn('channel_products', 'channelCode', 'TEXT')
safeAddColumn('channel_products', 'productCode', 'TEXT')
safeAddColumn(
  'channel_products',
  'productSourceType',
  "TEXT NOT NULL DEFAULT 'MASTER_PRODUCT' CHECK(productSourceType IN('MASTER_PRODUCT','CHANNEL_MENU'))"
)
safeAddColumn('channel_products', 'masterProductId', 'INTEGER')
safeAddColumn('channel_products', 'displayName', 'TEXT')
safeAddColumn('channel_products', 'description', 'TEXT')
safeAddColumn('channel_products', 'salePrice', 'INTEGER NOT NULL DEFAULT 0 CHECK(salePrice >= 0)')
safeAddColumn('channel_products', 'normalPrice', 'INTEGER NOT NULL DEFAULT 0 CHECK(normalPrice >= 0)')
safeAddColumn(
  'channel_products',
  'stockStatus',
  "TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK(stockStatus IN('UNKNOWN','IN_STOCK','LOW_STOCK','OUT_OF_STOCK','SOLD_OUT'))"
)
safeAddColumn('channel_products', 'isEventActive', 'INTEGER NOT NULL DEFAULT 0 CHECK(isEventActive IN(0,1))')
safeAddColumn('channel_products', 'eventPrice', 'INTEGER CHECK(eventPrice IS NULL OR eventPrice >= 0)')
safeAddColumn('channel_products', 'thumbnailImageAssetId', 'INTEGER')
safeAddColumn('channel_products', 'isActive', 'INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1))')
safeAddColumn('channel_products', 'createdAt', 'TEXT DEFAULT CURRENT_TIMESTAMP')
safeAddColumn('channel_products', 'updatedAt', 'TEXT')

db.exec(`
CREATE INDEX IF NOT EXISTS idx_channel_products_channel
ON channel_products(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_channel_products_product_code
ON channel_products(productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_channel_products_master_product
ON channel_products(masterProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_channel_products_source_type
ON channel_products(productSourceType)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_channel_products_active
ON channel_products(isActive)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_channel_products_stock_status
ON channel_products(stockStatus)
`)

//==================================================
// SECTION 14-6 : MART PRICE SYSTEM
// RULE : 가격은 channel_product_prices 전용 관리
//==================================================

db.exec(`
CREATE TABLE IF NOT EXISTS channel_product_prices(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channelCode TEXT NOT NULL,
  productCode TEXT NOT NULL,
  channelProductId INTEGER NOT NULL,
  purchasePrice INTEGER NOT NULL DEFAULT 0 CHECK(purchasePrice >= 0),
  regularPrice INTEGER NOT NULL DEFAULT 0 CHECK(regularPrice >= 0),
  eventPrice INTEGER CHECK(eventPrice IS NULL OR eventPrice >= 0),
  specialPrice INTEGER CHECK(specialPrice IS NULL OR specialPrice >= 0),
  appliedPrice INTEGER NOT NULL DEFAULT 0 CHECK(appliedPrice >= 0),
  appliedPriceType TEXT NOT NULL DEFAULT 'REGULAR'
    CHECK(appliedPriceType IN('REGULAR','EVENT','SPECIAL')),
  activeSalePriceType TEXT NOT NULL DEFAULT 'REGULAR'
    CHECK(activeSalePriceType IN('REGULAR','EVENT','SPECIAL')),
  currency TEXT NOT NULL DEFAULT 'KRW'
    CHECK(currency IN('KRW')),
  specialPriceStartAt TEXT,
  specialPriceEndAt TEXT,
  priceUpdatedAt TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(channelProductId) REFERENCES channel_products(id),
  UNIQUE(channelCode, productCode)
)
`)

safeAddColumn(
  'channel_product_prices',
  'appliedPrice',
  'INTEGER NOT NULL DEFAULT 0 CHECK(appliedPrice >= 0)'
)

safeAddColumn(
  'channel_product_prices',
  'appliedPriceType',
  "TEXT NOT NULL DEFAULT 'REGULAR' CHECK(appliedPriceType IN('REGULAR','EVENT','SPECIAL'))"
)

db.exec(`
UPDATE channel_product_prices
SET appliedPriceType = COALESCE(appliedPriceType, activeSalePriceType, 'REGULAR')
WHERE appliedPriceType IS NULL
`)

db.exec(`
UPDATE channel_product_prices
SET activeSalePriceType = COALESCE(activeSalePriceType, appliedPriceType, 'REGULAR')
WHERE activeSalePriceType IS NULL
`)

db.exec(`
UPDATE channel_product_prices
SET appliedPrice = CASE
  WHEN COALESCE(appliedPriceType, activeSalePriceType, 'REGULAR') = 'SPECIAL'
    THEN COALESCE(specialPrice, eventPrice, regularPrice, 0)
  WHEN COALESCE(appliedPriceType, activeSalePriceType, 'REGULAR') = 'EVENT'
    THEN COALESCE(eventPrice, regularPrice, 0)
  ELSE COALESCE(regularPrice, 0)
END
WHERE appliedPrice IS NULL
   OR appliedPrice < 0
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_channel_product_prices_channel_product
ON channel_product_prices(channelCode, productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_channel_product_prices_channel
ON channel_product_prices(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_channel_product_prices_product_code
ON channel_product_prices(productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_channel_product_prices_channel_product_id
ON channel_product_prices(channelProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_channel_product_prices_applied_type
ON channel_product_prices(appliedPriceType)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_channel_product_prices_updated
ON channel_product_prices(priceUpdatedAt)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS master_product_thumbnails(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  masterProductId INTEGER NOT NULL,
  imageAssetId INTEGER NOT NULL,
  sortOrder INTEGER NOT NULL DEFAULT 1,
  isPrimary INTEGER NOT NULL DEFAULT 1 CHECK(isPrimary IN(0,1)),
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(masterProductId) REFERENCES master_products(id),
  FOREIGN KEY(imageAssetId) REFERENCES image_assets(id)
)
`)

safeAddColumn('master_product_thumbnails', 'masterProductId', 'INTEGER')
safeAddColumn('master_product_thumbnails', 'imageAssetId', 'INTEGER')
safeAddColumn('master_product_thumbnails', 'sortOrder', 'INTEGER NOT NULL DEFAULT 1')
safeAddColumn(
  'master_product_thumbnails',
  'isPrimary',
  'INTEGER NOT NULL DEFAULT 1 CHECK(isPrimary IN(0,1))'
)
safeAddColumn(
  'master_product_thumbnails',
  'isActive',
  'INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1))'
)
safeAddColumn('master_product_thumbnails', 'updatedAt', 'TEXT')

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_product_thumbnails_product
ON master_product_thumbnails(masterProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_product_thumbnails_asset
ON master_product_thumbnails(imageAssetId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_product_thumbnails_active
ON master_product_thumbnails(isActive)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS uq_master_product_thumbnails_primary
ON master_product_thumbnails(masterProductId)
WHERE isPrimary = 1
`)

db.exec(`
CREATE TABLE IF NOT EXISTS master_product_barcodes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  masterProductId INTEGER NOT NULL,
  masterBarcodeId INTEGER NOT NULL,
  gtin TEXT NOT NULL CHECK(length(gtin)=13),
  productCode TEXT NOT NULL CHECK(productCode LIKE 'RPB%' OR productCode LIKE 'RPN%'),
  isPrimary INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(masterProductId) REFERENCES master_products(id),
  FOREIGN KEY(masterBarcodeId) REFERENCES master_barcodes(id)
)
`)

safeAddColumn('master_product_barcodes', 'gtin', 'TEXT CHECK(length(gtin)=13)')
safeAddColumn('master_product_barcodes', 'productCode', "TEXT CHECK(productCode LIKE 'RPB%' OR productCode LIKE 'RPN%')")
safeAddColumn('master_product_barcodes', 'isPrimary', 'INTEGER NOT NULL DEFAULT 1')

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_master_product_barcodes_gtin_unique
ON master_product_barcodes(gtin)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_master_product_barcodes_pair_unique
ON master_product_barcodes(masterProductId, masterBarcodeId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_product_barcodes_product_id
ON master_product_barcodes(masterProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_product_barcodes_barcode_id
ON master_product_barcodes(masterBarcodeId)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS master_product_scan_codes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  masterProductId INTEGER NOT NULL,
  productCode TEXT NOT NULL CHECK(productCode LIKE 'RPB%' OR productCode LIKE 'RPN%'),
  scanCodeType TEXT NOT NULL DEFAULT 'EXTERNAL_BARCODE'
    CHECK(scanCodeType IN('RAPUS_QR','RAPUS_BARCODE','EXTERNAL_BARCODE','INTERNAL','CUSTOM')),
  scanCodeValue TEXT NOT NULL,
  scanCodeSource TEXT NOT NULL DEFAULT 'MANUFACTURER'
    CHECK(scanCodeSource IN('RAPUS','MANUFACTURER','DISTRIBUTOR','MERCHANT','CUSTOM')),
  externalBarcodeFormat TEXT,
  isPrimary INTEGER NOT NULL DEFAULT 1 CHECK(isPrimary IN(0,1)),
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  deletedAt TEXT,
  FOREIGN KEY(masterProductId) REFERENCES master_products(id)
)
`)

safeAddColumn('master_product_scan_codes', 'masterProductId', 'INTEGER')
safeAddColumn('master_product_scan_codes', 'productCode', "TEXT CHECK(productCode LIKE 'RPB%' OR productCode LIKE 'RPN%')")
safeAddColumn(
  'master_product_scan_codes',
  'scanCodeType',
  "TEXT NOT NULL DEFAULT 'EXTERNAL_BARCODE' CHECK(scanCodeType IN('RAPUS_QR','RAPUS_BARCODE','EXTERNAL_BARCODE','INTERNAL','CUSTOM'))"
)
safeAddColumn('master_product_scan_codes', 'scanCodeValue', 'TEXT')
safeAddColumn(
  'master_product_scan_codes',
  'scanCodeSource',
  "TEXT NOT NULL DEFAULT 'MANUFACTURER' CHECK(scanCodeSource IN('RAPUS','MANUFACTURER','DISTRIBUTOR','MERCHANT','CUSTOM'))"
)
safeAddColumn('master_product_scan_codes', 'externalBarcodeFormat', 'TEXT')
safeAddColumn('master_product_scan_codes', 'isPrimary', 'INTEGER NOT NULL DEFAULT 1 CHECK(isPrimary IN(0,1))')
safeAddColumn('master_product_scan_codes', 'isActive', 'INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1))')
safeAddColumn('master_product_scan_codes', 'updatedAt', 'TEXT')
safeAddColumn('master_product_scan_codes', 'deletedAt', 'TEXT')

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS uq_master_product_scan_codes_value_active
ON master_product_scan_codes(scanCodeValue)
WHERE deletedAt IS NULL
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_product_scan_codes_master_product
ON master_product_scan_codes(masterProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_product_scan_codes_product_code
ON master_product_scan_codes(productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_product_scan_codes_type
ON master_product_scan_codes(scanCodeType)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_product_scan_codes_value
ON master_product_scan_codes(scanCodeValue)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_product_scan_codes_source
ON master_product_scan_codes(scanCodeSource)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_product_scan_codes_external_format
ON master_product_scan_codes(externalBarcodeFormat)
`)

db.exec(`
INSERT OR IGNORE INTO master_product_scan_codes(
  masterProductId,
  productCode,
  scanCodeType,
  scanCodeValue,
  scanCodeSource,
  externalBarcodeFormat,
  isPrimary,
  isActive,
  createdAt,
  updatedAt
)
SELECT
  mp.id,
  mp.productCode,
  CASE
    WHEN mp.barcodeParserType = 'EAN13_BARCODE' THEN 'EXTERNAL_BARCODE'
    ELSE 'CUSTOM'
  END,
  mp.primaryScanCodeValue,
  CASE
    WHEN mp.barcodeParserType = 'EAN13_BARCODE' THEN 'MERCHANT'
    ELSE 'CUSTOM'
  END,
  CASE
    WHEN length(mp.primaryScanCodeValue) = 13 THEN 'EAN13'
    WHEN length(mp.primaryScanCodeValue) = 8 THEN 'EAN8'
    ELSE NULL
  END,
  1,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM master_products mp
WHERE mp.primaryScanCodeValue IS NOT NULL
  AND trim(mp.primaryScanCodeValue) != ''
  AND mp.deletedAt IS NULL
`)

db.exec(`
INSERT OR IGNORE INTO master_product_scan_codes(
  masterProductId,
  productCode,
  scanCodeType,
  scanCodeValue,
  scanCodeSource,
  externalBarcodeFormat,
  isPrimary,
  isActive
)
SELECT
  masterProductId,
  productCode,
  'EXTERNAL_BARCODE',
  gtin,
  'MANUFACTURER',
  'GTIN',
  isPrimary,
  1
FROM master_product_barcodes
WHERE gtin IS NOT NULL
`)

db.exec(`
CREATE TABLE IF NOT EXISTS market_channel_products(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profileId INTEGER NOT NULL,
  channelCode TEXT NOT NULL,
  sourceProductId INTEGER NOT NULL,
  productCode TEXT NOT NULL CHECK(productCode LIKE 'RPB%' OR productCode LIKE 'RPN%'),
  productNameSnapshot TEXT NOT NULL,
  brandNameSnapshot TEXT,
  categoryNameSnapshot TEXT,
  purchasePrice INTEGER NOT NULL DEFAULT 0 CHECK(purchasePrice >= 0),
  salePrice INTEGER NOT NULL DEFAULT 0 CHECK(salePrice >= 0),
  eventPrice INTEGER CHECK(eventPrice IS NULL OR eventPrice >= 0),
  eventPurchasePrice INTEGER CHECK(eventPurchasePrice IS NULL OR eventPurchasePrice >= 0),
  eventGroupName TEXT,
  eventStartAt TEXT,
  eventEndAt TEXT,
  stockQuantity INTEGER NOT NULL DEFAULT 0 CHECK(stockQuantity >= 0),
  stockAmount INTEGER NOT NULL DEFAULT 0 CHECK(stockAmount >= 0),
  safetyStockQuantity INTEGER NOT NULL DEFAULT 0 CHECK(safetyStockQuantity >= 0),
  dailySalesQuantity INTEGER NOT NULL DEFAULT 0 CHECK(dailySalesQuantity >= 0),
  boxQuantity INTEGER NOT NULL DEFAULT 0 CHECK(boxQuantity >= 0),
  abcGrade TEXT,
  shelfNo TEXT,
  stockStatus TEXT NOT NULL DEFAULT 'IN_STOCK'
    CHECK(stockStatus IN('IN_STOCK','LOW_STOCK','SOLD_OUT')),
  isOnSale INTEGER NOT NULL DEFAULT 1 CHECK(isOnSale IN(0,1)),
  isDisplayed INTEGER NOT NULL DEFAULT 1 CHECK(isDisplayed IN(0,1)),
  isEventActive INTEGER NOT NULL DEFAULT 0 CHECK(isEventActive IN(0,1)),
  isSoldOut INTEGER NOT NULL DEFAULT 0 CHECK(isSoldOut IN(0,1)),
  lastImportedBatchId INTEGER,
  lastImportedRowId INTEGER,
  lastSyncedAt TEXT,
  priceUpdatedAt TEXT,
  stockUpdatedAt TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  deletedAt TEXT,
  FOREIGN KEY(profileId) REFERENCES profiles(id),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(sourceProductId) REFERENCES master_products(id)
)
`)

safeAddColumn('market_channel_products', 'profileId', 'INTEGER')
safeAddColumn('market_channel_products', 'channelCode', 'TEXT')
safeAddColumn('market_channel_products', 'sourceProductId', 'INTEGER')
safeAddColumn('market_channel_products', 'productCode', "TEXT CHECK(productCode LIKE 'RPB%' OR productCode LIKE 'RPN%')")
safeAddColumn('market_channel_products', 'productNameSnapshot', 'TEXT')
safeAddColumn('market_channel_products', 'brandNameSnapshot', 'TEXT')
safeAddColumn('market_channel_products', 'categoryNameSnapshot', 'TEXT')
safeAddColumn('market_channel_products', 'purchasePrice', 'INTEGER NOT NULL DEFAULT 0 CHECK(purchasePrice >= 0)')
safeAddColumn('market_channel_products', 'salePrice', 'INTEGER NOT NULL DEFAULT 0 CHECK(salePrice >= 0)')
safeAddColumn('market_channel_products', 'eventPrice', 'INTEGER CHECK(eventPrice IS NULL OR eventPrice >= 0)')
safeAddColumn('market_channel_products', 'eventPurchasePrice', 'INTEGER CHECK(eventPurchasePrice IS NULL OR eventPurchasePrice >= 0)')
safeAddColumn('market_channel_products', 'eventGroupName', 'TEXT')
safeAddColumn('market_channel_products', 'eventStartAt', 'TEXT')
safeAddColumn('market_channel_products', 'eventEndAt', 'TEXT')
safeAddColumn('market_channel_products', 'stockQuantity', 'INTEGER NOT NULL DEFAULT 0 CHECK(stockQuantity >= 0)')
safeAddColumn('market_channel_products', 'stockAmount', 'INTEGER NOT NULL DEFAULT 0 CHECK(stockAmount >= 0)')
safeAddColumn('market_channel_products', 'safetyStockQuantity', 'INTEGER NOT NULL DEFAULT 0 CHECK(safetyStockQuantity >= 0)')
safeAddColumn('market_channel_products', 'dailySalesQuantity', 'INTEGER NOT NULL DEFAULT 0 CHECK(dailySalesQuantity >= 0)')
safeAddColumn('market_channel_products', 'boxQuantity', 'INTEGER NOT NULL DEFAULT 0 CHECK(boxQuantity >= 0)')
safeAddColumn('market_channel_products', 'abcGrade', 'TEXT')
safeAddColumn('market_channel_products', 'shelfNo', 'TEXT')
safeAddColumn(
  'market_channel_products',
  'stockStatus',
  "TEXT NOT NULL DEFAULT 'IN_STOCK' CHECK(stockStatus IN('IN_STOCK','LOW_STOCK','SOLD_OUT'))"
)
safeAddColumn('market_channel_products', 'isOnSale', 'INTEGER NOT NULL DEFAULT 1 CHECK(isOnSale IN(0,1))')
safeAddColumn('market_channel_products', 'isDisplayed', 'INTEGER NOT NULL DEFAULT 1 CHECK(isDisplayed IN(0,1))')
safeAddColumn('market_channel_products', 'isEventActive', 'INTEGER NOT NULL DEFAULT 0 CHECK(isEventActive IN(0,1))')
safeAddColumn('market_channel_products', 'isSoldOut', 'INTEGER NOT NULL DEFAULT 0 CHECK(isSoldOut IN(0,1))')
safeAddColumn('market_channel_products', 'lastImportedBatchId', 'INTEGER')
safeAddColumn('market_channel_products', 'lastImportedRowId', 'INTEGER')
safeAddColumn('market_channel_products', 'lastSyncedAt', 'TEXT')
safeAddColumn('market_channel_products', 'priceUpdatedAt', 'TEXT')
safeAddColumn('market_channel_products', 'stockUpdatedAt', 'TEXT')
safeAddColumn('market_channel_products', 'updatedAt', 'TEXT')
safeAddColumn('market_channel_products', 'deletedAt', 'TEXT')

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS uq_market_channel_products_channel_product_active
ON market_channel_products(channelCode, productCode)
WHERE deletedAt IS NULL
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_channel_products_channel
ON market_channel_products(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_channel_products_product_code
ON market_channel_products(productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_channel_products_source_product
ON market_channel_products(sourceProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_channel_products_is_on_sale
ON market_channel_products(isOnSale)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_channel_products_is_displayed
ON market_channel_products(isDisplayed)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_channel_products_is_sold_out
ON market_channel_products(isSoldOut)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_channel_products_stock_status
ON market_channel_products(stockStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_channel_products_updated_at
ON market_channel_products(updatedAt)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_channel_products_last_imported_batch
ON market_channel_products(lastImportedBatchId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_channel_products_last_imported_row
ON market_channel_products(lastImportedRowId)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS market_channel_product_history(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  marketProductId INTEGER NOT NULL,
  channelCode TEXT NOT NULL,
  productCode TEXT NOT NULL CHECK(productCode LIKE 'RPB%' OR productCode LIKE 'RPN%'),
  changeType TEXT NOT NULL
    CHECK(changeType IN('PRICE','STOCK','STATUS','DISPLAY','EVENT','SYNC')),
  beforeValue TEXT,
  afterValue TEXT,
  changedByProfileId INTEGER,
  changeMemo TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(marketProductId) REFERENCES market_channel_products(id),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(changedByProfileId) REFERENCES profiles(id)
)
`)

safeAddColumn('market_channel_product_history', 'marketProductId', 'INTEGER')
safeAddColumn('market_channel_product_history', 'channelCode', 'TEXT')
safeAddColumn('market_channel_product_history', 'productCode', "TEXT CHECK(productCode LIKE 'RPB%' OR productCode LIKE 'RPN%')")
safeAddColumn(
  'market_channel_product_history',
  'changeType',
  "TEXT CHECK(changeType IN('PRICE','STOCK','STATUS','DISPLAY','EVENT','SYNC'))"
)
safeAddColumn('market_channel_product_history', 'beforeValue', 'TEXT')
safeAddColumn('market_channel_product_history', 'afterValue', 'TEXT')
safeAddColumn('market_channel_product_history', 'changedByProfileId', 'INTEGER')
safeAddColumn('market_channel_product_history', 'changeMemo', 'TEXT')

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_channel_product_history_market_product
ON market_channel_product_history(marketProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_channel_product_history_channel
ON market_channel_product_history(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_channel_product_history_product_code
ON market_channel_product_history(productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_channel_product_history_change_type
ON market_channel_product_history(changeType)
`)

//==================================================
// SECTION 15-1 : MARKET OPERATION PRODUCT LAYER
// ROLE : BUSINESS OWNER SALES PRODUCT / MVP STOCK STATE
// RULE : master_products = platform ledger, market_products = owner sales product
//==================================================

db.exec(`
CREATE TABLE IF NOT EXISTS market_products(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profileId INTEGER NOT NULL,
  channelCode TEXT NOT NULL,
  masterProductId INTEGER,
  masterBarcodeId INTEGER,
  productCode TEXT NOT NULL CHECK(productCode LIKE 'RPB%' OR productCode LIKE 'RPN%'),
  barcode TEXT,
  productName TEXT NOT NULL,
  supplierName TEXT,
  salePrice INTEGER NOT NULL DEFAULT 0 CHECK(salePrice >= 0),
  consumerPrice INTEGER CHECK(consumerPrice IS NULL OR consumerPrice >= 0),
  costPrice INTEGER CHECK(costPrice IS NULL OR costPrice >= 0),
  currentStock INTEGER NOT NULL DEFAULT 0 CHECK(currentStock >= 0),
  safeStock INTEGER DEFAULT 0 CHECK(safeStock IS NULL OR safeStock >= 0),
  taxType TEXT DEFAULT 'TAX',
  isTaxIncluded INTEGER NOT NULL DEFAULT 1 CHECK(isTaxIncluded IN(0,1)),
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  isHidden INTEGER NOT NULL DEFAULT 0 CHECK(isHidden IN(0,1)),
  isSoldOut INTEGER NOT NULL DEFAULT 0 CHECK(isSoldOut IN(0,1)),
  displayStatus TEXT NOT NULL DEFAULT 'VISIBLE'
    CHECK(displayStatus IN('VISIBLE','HIDDEN','EVENT_ONLY')),
  eventCode TEXT CHECK(eventCode IS NULL OR length(eventCode)=12),
  eventTitle TEXT,
  eventStartAt TEXT,
  eventEndAt TEXT,
  eventStatus TEXT NOT NULL DEFAULT 'NONE'
    CHECK(eventStatus IN('NONE','SCHEDULED','ACTIVE','ENDED')),
  approvalStatus TEXT NOT NULL DEFAULT 'AUTO_IMPORTED'
    CHECK(approvalStatus IN('AUTO_IMPORTED','MATCHED','MANUAL','BLOCKED')),
  isDeleted INTEGER NOT NULL DEFAULT 0 CHECK(isDeleted IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  deletedAt TEXT,
  FOREIGN KEY(profileId) REFERENCES profiles(id),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(masterProductId) REFERENCES master_products(id),
  FOREIGN KEY(masterBarcodeId) REFERENCES master_barcodes(id)
)
`)

safeAddColumn('market_products', 'profileId', 'INTEGER')
safeAddColumn('market_products', 'channelCode', 'TEXT')
safeAddColumn('market_products', 'masterProductId', 'INTEGER')
safeAddColumn('market_products', 'masterBarcodeId', 'INTEGER')
safeAddColumn('market_products', 'productCode', "TEXT CHECK(productCode LIKE 'RPB%' OR productCode LIKE 'RPN%')")
safeAddColumn('market_products', 'barcode', 'TEXT')
safeAddColumn('market_products', 'productName', 'TEXT')
safeAddColumn('market_products', 'supplierName', 'TEXT')
safeAddColumn('market_products', 'salePrice', 'INTEGER NOT NULL DEFAULT 0 CHECK(salePrice >= 0)')
safeAddColumn('market_products', 'consumerPrice', 'INTEGER CHECK(consumerPrice IS NULL OR consumerPrice >= 0)')
safeAddColumn('market_products', 'costPrice', 'INTEGER CHECK(costPrice IS NULL OR costPrice >= 0)')
safeAddColumn('market_products', 'currentStock', 'INTEGER NOT NULL DEFAULT 0 CHECK(currentStock >= 0)')
safeAddColumn('market_products', 'safeStock', 'INTEGER DEFAULT 0 CHECK(safeStock IS NULL OR safeStock >= 0)')
safeAddColumn('market_products', 'taxType', "TEXT DEFAULT 'TAX'")
safeAddColumn('market_products', 'isTaxIncluded', 'INTEGER NOT NULL DEFAULT 1 CHECK(isTaxIncluded IN(0,1))')
safeAddColumn('market_products', 'isActive', 'INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1))')
safeAddColumn('market_products', 'isHidden', 'INTEGER NOT NULL DEFAULT 0 CHECK(isHidden IN(0,1))')
safeAddColumn('market_products', 'isSoldOut', 'INTEGER NOT NULL DEFAULT 0 CHECK(isSoldOut IN(0,1))')
safeAddColumn(
  'market_products',
  'displayStatus',
  "TEXT NOT NULL DEFAULT 'VISIBLE' CHECK(displayStatus IN('VISIBLE','HIDDEN','EVENT_ONLY'))"
)
safeAddColumn('market_products', 'eventCode', 'TEXT CHECK(eventCode IS NULL OR length(eventCode)=12)')
safeAddColumn('market_products', 'eventTitle', 'TEXT')
safeAddColumn('market_products', 'eventStartAt', 'TEXT')
safeAddColumn('market_products', 'eventEndAt', 'TEXT')
safeAddColumn(
  'market_products',
  'eventStatus',
  "TEXT NOT NULL DEFAULT 'NONE' CHECK(eventStatus IN('NONE','SCHEDULED','ACTIVE','ENDED'))"
)
safeAddColumn(
  'market_products',
  'approvalStatus',
  "TEXT NOT NULL DEFAULT 'AUTO_IMPORTED' CHECK(approvalStatus IN('AUTO_IMPORTED','MATCHED','MANUAL','BLOCKED'))"
)
safeAddColumn('market_products', 'isDeleted', 'INTEGER NOT NULL DEFAULT 0 CHECK(isDeleted IN(0,1))')
safeAddColumn('market_products', 'updatedAt', 'TEXT')
safeAddColumn('market_products', 'deletedAt', 'TEXT')

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_channel
ON market_products(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_profile
ON market_products(profileId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_master_product
ON market_products(masterProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_master_barcode
ON market_products(masterBarcodeId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_product_code
ON market_products(productCode)
`)

db.exec(`
UPDATE market_products
SET masterProductId = (
  SELECT mp.id
  FROM master_products mp
  WHERE mp.productCode = market_products.productCode
  LIMIT 1
)
WHERE masterProductId IS NULL
  AND productCode IS NOT NULL
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_barcode
ON market_products(barcode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_active
ON market_products(isActive)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_stock
ON market_products(currentStock)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_sold_out
ON market_products(isSoldOut)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_display_status
ON market_products(displayStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_event_code
ON market_products(eventCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_event_status
ON market_products(eventStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_event_period
ON market_products(eventStartAt, eventEndAt)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_approval_status
ON market_products(approvalStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_hidden
ON market_products(isHidden)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_products_deleted
ON market_products(isDeleted)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS uq_market_products_channel_product_active
ON market_products(channelCode, productCode)
WHERE isDeleted = 0
`)

//==================================================
// SECTION 15-1A : SUPPLY CHAIN PARTNER TYPES
// RULE : businessTypeCode(운영 형태) + partnerTypeCode(공급망 역할) 병행 운영
//==================================================

db.exec(`
CREATE TABLE IF NOT EXISTS partner_types(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  name TEXT,
  partnerTypeCode TEXT NOT NULL UNIQUE
  CHECK(partnerTypeCode IN(
    'MAKER',
    'PROVIDER',
    'CUSTOMER',
    'OPEN_MARKET'
  )),
  partnerTypeName TEXT NOT NULL,
  description TEXT,
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  sortOrder INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)
`)

const partnerTypesTableSqlRow = db.prepare(`
SELECT sql
FROM sqlite_master
WHERE type='table'
  AND name='partner_types'
LIMIT 1
`).get() as { sql?: string } | undefined

const partnerTypesNeedsMigration =
  !(partnerTypesTableSqlRow?.sql?.includes('code TEXT UNIQUE') ?? false) ||
  !(partnerTypesTableSqlRow?.sql?.includes('partnerTypeCode') ?? false) ||
  !(partnerTypesTableSqlRow?.sql?.includes(`'PROVIDER'`) ?? false) ||
  !(partnerTypesTableSqlRow?.sql?.includes(`'CUSTOMER'`) ?? false)

if (partnerTypesNeedsMigration) {
  db.exec(`PRAGMA foreign_keys = OFF`)

  try {
    db.exec(`DROP TABLE IF EXISTS partner_types_new`)
    db.exec(`
      CREATE TABLE partner_types_new(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        name TEXT,
        partnerTypeCode TEXT NOT NULL UNIQUE
        CHECK(partnerTypeCode IN(
          'MAKER',
          'PROVIDER',
          'CUSTOMER',
          'OPEN_MARKET'
        )),
        partnerTypeName TEXT NOT NULL,
        description TEXT,
        isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
        sortOrder INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    db.exec(`DROP TABLE IF EXISTS partner_types`)
    db.exec(`ALTER TABLE partner_types_new RENAME TO partner_types`)
  } finally {
    db.exec(`PRAGMA foreign_keys = ON`)
  }
}

safeAddColumn('partner_types', 'code', 'TEXT')
safeAddColumn('partner_types', 'name', 'TEXT')
safeAddColumn('partner_types', 'partnerTypeCode', 'TEXT')
safeAddColumn('partner_types', 'partnerTypeName', 'TEXT')

db.exec(`
UPDATE partner_types
SET code = partnerTypeCode
WHERE (code IS NULL OR TRIM(code) = '')
  AND partnerTypeCode IS NOT NULL
`)

db.exec(`
UPDATE partner_types
SET name = partnerTypeName
WHERE (name IS NULL OR TRIM(name) = '')
  AND partnerTypeName IS NOT NULL
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_types_code
ON partner_types(partnerTypeCode)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_types_legacy_code
ON partner_types(code)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_partner_types_sort
ON partner_types(sortOrder)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_partner_types_active
ON partner_types(isActive)
`)

const insertPartnerType = db.prepare(`
INSERT OR IGNORE INTO partner_types(
  partnerTypeCode,
  partnerTypeName,
  description,
  sortOrder,
  isActive
)
VALUES(?,?,?,?,?)
`)

insertPartnerType.run('MAKER', '제조사', '제품 제조 및 원천 공급 파트너', 1, 1)
insertPartnerType.run('PROVIDER', '공급자', '대리점/총판/도매 유통 파트너', 2, 1)
insertPartnerType.run('CUSTOMER', '고객', '마트/기업고객/일반고객 수요 파트너', 3, 1)
insertPartnerType.run('OPEN_MARKET', '오픈마켓', '오픈마켓 판매자 파트너', 4, 1)

db.exec(`
UPDATE partner_types
SET code = partnerTypeCode,
    name = partnerTypeName
WHERE code IS NULL
   OR name IS NULL
`)

db.exec(`
DELETE FROM partner_types
WHERE partnerTypeCode NOT IN(
  'MAKER',
  'PROVIDER',
  'CUSTOMER',
  'OPEN_MARKET'
)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS partner_relationships(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  providerChannelCode TEXT NOT NULL,
  customerChannelCode TEXT NOT NULL,
  partnerTypeCode TEXT NOT NULL
    CHECK(partnerTypeCode IN(
      'MAKER',
      'PROVIDER',
      'CUSTOMER',
      'OPEN_MARKET'
    )),
  relationshipStatus TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK(relationshipStatus IN('ACTIVE','INACTIVE','SUSPENDED')),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(providerChannelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(customerChannelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(partnerTypeCode) REFERENCES partner_types(partnerTypeCode),
  UNIQUE(providerChannelCode, customerChannelCode, partnerTypeCode)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_partner_relationships_provider
ON partner_relationships(providerChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_partner_relationships_customer
ON partner_relationships(customerChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_partner_relationships_type
ON partner_relationships(partnerTypeCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_partner_relationships_status
ON partner_relationships(relationshipStatus)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS purchase_orders(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchaseOrderCode TEXT NOT NULL UNIQUE CHECK(length(purchaseOrderCode)=12),
  buyerChannelCode TEXT NOT NULL,
  supplierChannelCode TEXT NOT NULL,
  partnerTypeCode TEXT NOT NULL
    CHECK(partnerTypeCode IN(
      'MAKER',
      'PROVIDER',
      'CUSTOMER',
      'OPEN_MARKET'
    )),
  orderStatus TEXT NOT NULL DEFAULT 'CREATED'
    CHECK(orderStatus IN('CREATED','CONFIRMED','SHIPPED','RECEIVED','CANCELLED')),
  totalAmount INTEGER NOT NULL DEFAULT 0 CHECK(totalAmount >= 0),
  memo TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(buyerChannelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(supplierChannelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(partnerTypeCode) REFERENCES partner_types(partnerTypeCode)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_purchase_orders_code
ON purchase_orders(purchaseOrderCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_purchase_orders_buyer
ON purchase_orders(buyerChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier
ON purchase_orders(supplierChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_purchase_orders_type
ON purchase_orders(partnerTypeCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status
ON purchase_orders(orderStatus)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS purchase_order_items(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchaseOrderId INTEGER NOT NULL,
  masterProductId INTEGER,
  manufacturerId INTEGER,
  brandId INTEGER,
  barcode TEXT,
  productCode TEXT
    CHECK(productCode IS NULL OR productCode LIKE 'RPB%' OR productCode LIKE 'RPN%'),
  productNameSnapshot TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
  unitPrice INTEGER NOT NULL DEFAULT 0 CHECK(unitPrice >= 0),
  totalAmount INTEGER NOT NULL DEFAULT 0 CHECK(totalAmount >= 0),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(purchaseOrderId) REFERENCES purchase_orders(id),
  FOREIGN KEY(masterProductId) REFERENCES master_products(id),
  FOREIGN KEY(manufacturerId) REFERENCES manufacturers(id),
  FOREIGN KEY(brandId) REFERENCES brands(id)
)
`)

safeAddColumn('purchase_order_items', 'manufacturerId', 'INTEGER')
safeAddColumn('purchase_order_items', 'brandId', 'INTEGER')
safeAddColumn('purchase_order_items', 'barcode', 'TEXT')

db.exec(`
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order
ON purchase_order_items(purchaseOrderId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_code
ON purchase_order_items(productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_master_product
ON purchase_order_items(masterProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_manufacturer
ON purchase_order_items(manufacturerId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_brand
ON purchase_order_items(brandId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_barcode
ON purchase_order_items(barcode)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS delivery_companies(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  companyCode TEXT NOT NULL UNIQUE,
  companyName TEXT NOT NULL,
  trackingUrl TEXT,
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_companies_code
ON delivery_companies(companyCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_delivery_companies_active
ON delivery_companies(isActive)
`)

const insertDeliveryCompany = db.prepare(`
INSERT OR IGNORE INTO delivery_companies(
  companyCode,
  companyName,
  trackingUrl,
  isActive
)
VALUES(?,?,?,?)
`)

insertDeliveryCompany.run('CJ', 'CJ대한통운', 'https://www.cjlogistics.com/ko/tool/parcel/tracking', 1)
insertDeliveryCompany.run('LOTTE', '롯데택배', 'https://www.lotteglogis.com/home/reservation/tracking/linkView', 1)
insertDeliveryCompany.run('HANJIN', '한진택배', 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do', 1)
insertDeliveryCompany.run('LOGEN', '로젠택배', 'https://www.ilogen.com/web/personal/trace', 1)
insertDeliveryCompany.run('POST', '우체국택배', 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm', 1)

db.exec(`
CREATE TABLE IF NOT EXISTS shipments(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipmentCode TEXT NOT NULL UNIQUE CHECK(length(shipmentCode)=12),
  purchaseOrderId INTEGER NOT NULL,
  senderChannelCode TEXT NOT NULL,
  receiverChannelCode TEXT NOT NULL,
  deliveryCompanyId INTEGER NOT NULL,
  invoiceNumber TEXT NOT NULL,
  shipmentStatus TEXT NOT NULL DEFAULT 'CREATED'
    CHECK(shipmentStatus IN('CREATED','READY','SHIPPED','IN_TRANSIT','DELIVERED','CANCELLED')),
  trackingUrlSnapshot TEXT,
  shippedAt TEXT,
  deliveredAt TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(purchaseOrderId) REFERENCES purchase_orders(id),
  FOREIGN KEY(senderChannelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(receiverChannelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(deliveryCompanyId) REFERENCES delivery_companies(id)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipments_code
ON shipments(shipmentCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipments_purchase_order
ON shipments(purchaseOrderId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipments_sender
ON shipments(senderChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipments_receiver
ON shipments(receiverChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipments_delivery_company
ON shipments(deliveryCompanyId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipments_invoice
ON shipments(invoiceNumber)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipments_status
ON shipments(shipmentStatus)
`)

safeAddColumn(
  'shipments',
  'mainAddressCode',
  'TEXT'
)

safeAddColumn(
  'shipments',
  'subAddressCode',
  'TEXT'
)

safeAddColumn(
  'shipments',
  'detailAddressCode',
  'TEXT'
)

safeAddColumn(
  'shipments',
  'deliveryCompletedQrCode',
  'TEXT'
)

safeAddColumn(
  'shipments',
  'deliveryCompletedAt',
  'TEXT'
)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipments_main_address_code
ON shipments(mainAddressCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipments_sub_address_code
ON shipments(subAddressCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipments_detail_address_code
ON shipments(detailAddressCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipments_delivery_completed_qr
ON shipments(deliveryCompletedQrCode)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS shipment_events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipmentId INTEGER NOT NULL,
  eventType TEXT NOT NULL
    CHECK(eventType IN('CREATED','READY','SHIPPED','IN_TRANSIT','DELIVERED','CANCELLED')),
  eventMessage TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(shipmentId) REFERENCES shipments(id)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment
ON shipment_events(shipmentId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipment_events_type
ON shipment_events(eventType)
`)

//==================================================
// SECTION 15-1C : PACKAGE UNIT / RECEIPT / INVENTORY MOVEMENT
// RULE : 박스/낱개/케이스/팔렛트 단위 입고 환산 지원
//==================================================

db.exec(`
CREATE TABLE IF NOT EXISTS product_package_units(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  masterProductId INTEGER NOT NULL,
  manufacturerId INTEGER,
  brandId INTEGER,
  barcode TEXT NOT NULL UNIQUE,
  packageType TEXT NOT NULL
    CHECK(packageType IN('ITEM','BOX','CASE','PALLET')),
  packageName TEXT,
  quantityPerUnit INTEGER NOT NULL DEFAULT 1 CHECK(quantityPerUnit >= 1),
  isDefault INTEGER NOT NULL DEFAULT 0 CHECK(isDefault IN(0,1)),
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(masterProductId) REFERENCES master_products(id),
  FOREIGN KEY(manufacturerId) REFERENCES manufacturers(id),
  FOREIGN KEY(brandId) REFERENCES brands(id)
)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_package_units_barcode
ON product_package_units(barcode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_product_package_units_master_product
ON product_package_units(masterProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_product_package_units_package_type
ON product_package_units(packageType)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS goods_receipts(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receiptCode TEXT NOT NULL UNIQUE CHECK(length(receiptCode)=12),
  shipmentId INTEGER,
  purchaseOrderId INTEGER,
  receiverChannelCode TEXT NOT NULL,
  supplierChannelCode TEXT NOT NULL,
  receiptStatus TEXT NOT NULL DEFAULT 'CREATED'
    CHECK(receiptStatus IN('CREATED','RECEIVING','RECEIVED','CANCELLED')),
  receivedAt TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(shipmentId) REFERENCES shipments(id),
  FOREIGN KEY(purchaseOrderId) REFERENCES purchase_orders(id),
  FOREIGN KEY(receiverChannelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(supplierChannelCode) REFERENCES profiles(channelCode)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_goods_receipts_code
ON goods_receipts(receiptCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_goods_receipts_receiver
ON goods_receipts(receiverChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_goods_receipts_supplier
ON goods_receipts(supplierChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_goods_receipts_status
ON goods_receipts(receiptStatus)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS goods_receipt_items(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goodsReceiptId INTEGER NOT NULL,
  masterProductId INTEGER NOT NULL,
  manufacturerId INTEGER,
  brandId INTEGER,
  barcode TEXT,
  packageType TEXT
    CHECK(packageType IS NULL OR packageType IN('ITEM','BOX','CASE','PALLET')),
  receivedQuantity INTEGER NOT NULL DEFAULT 0 CHECK(receivedQuantity >= 0),
  convertedItemQuantity INTEGER NOT NULL DEFAULT 0 CHECK(convertedItemQuantity >= 0),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(goodsReceiptId) REFERENCES goods_receipts(id),
  FOREIGN KEY(masterProductId) REFERENCES master_products(id),
  FOREIGN KEY(manufacturerId) REFERENCES manufacturers(id),
  FOREIGN KEY(brandId) REFERENCES brands(id)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_goods_receipt_items_receipt
ON goods_receipt_items(goodsReceiptId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_goods_receipt_items_barcode
ON goods_receipt_items(barcode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_goods_receipt_items_master_product
ON goods_receipt_items(masterProductId)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS inventory_movements(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channelCode TEXT NOT NULL,
  masterProductId INTEGER NOT NULL,
  movementType TEXT NOT NULL
    CHECK(movementType IN('INBOUND','OUTBOUND','ADJUST','RETURN')),
  quantity INTEGER NOT NULL,
  beforeQuantity INTEGER NOT NULL DEFAULT 0,
  afterQuantity INTEGER NOT NULL DEFAULT 0,
  referenceType TEXT NOT NULL
    CHECK(referenceType IN('GOODS_RECEIPT','ORDER','MANUAL','RETURN')),
  referenceId INTEGER,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(masterProductId) REFERENCES master_products(id)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_inventory_movements_channel
ON inventory_movements(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_inventory_movements_master_product
ON inventory_movements(masterProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type
ON inventory_movements(movementType)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at
ON inventory_movements(createdAt)
`)

//==================================================
// SECTION 15-1D : REGION SERVICE GOVERNANCE
// RULE : mainAddressCode = 플랫폼 권역 운영 기준 코드
//==================================================

db.exec(`
CREATE TABLE IF NOT EXISTS service_regions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mainAddressCode TEXT NOT NULL UNIQUE,
  regionName TEXT,
  regionLevel INTEGER,
  regionStatus TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK(regionStatus IN('ACTIVE','INACTIVE','BLOCKED')),
  deliveryEnabled INTEGER NOT NULL DEFAULT 1 CHECK(deliveryEnabled IN(0,1)),
  marketEnabled INTEGER NOT NULL DEFAULT 1 CHECK(marketEnabled IN(0,1)),
  adEnabled INTEGER NOT NULL DEFAULT 1 CHECK(adEnabled IN(0,1)),
  couponEnabled INTEGER NOT NULL DEFAULT 1 CHECK(couponEnabled IN(0,1)),
  groupPurchaseEnabled INTEGER NOT NULL DEFAULT 1 CHECK(groupPurchaseEnabled IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(mainAddressCode) REFERENCES regions(mainAddressCode)
)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_regions_main_address_code
ON service_regions(mainAddressCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_service_regions_status
ON service_regions(regionStatus)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS channel_service_regions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channelCode TEXT NOT NULL,
  mainAddressCode TEXT NOT NULL,
  serviceType TEXT NOT NULL
    CHECK(serviceType IN('DELIVERY','MARKET','EVENT','ADVERTISEMENT','GROUP_PURCHASE')),
  isPrimary INTEGER NOT NULL DEFAULT 0 CHECK(isPrimary IN(0,1)),
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(mainAddressCode) REFERENCES regions(mainAddressCode),
  UNIQUE(channelCode, mainAddressCode, serviceType)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_channel_service_regions_channel
ON channel_service_regions(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_channel_service_regions_main_address_code
ON channel_service_regions(mainAddressCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_channel_service_regions_service_type
ON channel_service_regions(serviceType)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS market_region_policies(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channelCode TEXT NOT NULL,
  mainAddressCode TEXT NOT NULL,
  policyType TEXT NOT NULL
    CHECK(policyType IN(
      'DELIVERY_ALLOWED',
      'DELIVERY_BLOCKED',
      'STORE_VISIBLE',
      'STORE_HIDDEN',
      'ORDER_ALLOWED',
      'ORDER_BLOCKED'
    )),
  policyValue TEXT,
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(mainAddressCode) REFERENCES regions(mainAddressCode)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_region_policies_channel
ON market_region_policies(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_region_policies_main_address_code
ON market_region_policies(mainAddressCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_region_policies_policy_type
ON market_region_policies(policyType)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS region_delivery_zones(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  providerChannelCode TEXT NOT NULL,
  mainAddressCode TEXT NOT NULL,
  deliveryFee INTEGER NOT NULL DEFAULT 0 CHECK(deliveryFee >= 0),
  minimumOrderAmount INTEGER NOT NULL DEFAULT 0 CHECK(minimumOrderAmount >= 0),
  estimatedMinutes INTEGER NOT NULL DEFAULT 0 CHECK(estimatedMinutes >= 0),
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(providerChannelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(mainAddressCode) REFERENCES regions(mainAddressCode),
  UNIQUE(providerChannelCode, mainAddressCode)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_region_delivery_zones_provider
ON region_delivery_zones(providerChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_region_delivery_zones_main_address_code
ON region_delivery_zones(mainAddressCode)
`)

//==================================================
// SECTION 15-1B : ADDRESS QR TRACKING / 공동배송 확장
// RULE : 건물/층/호실 QR 스캔 기반 배송 증적 및 완료 처리
//==================================================

db.exec(`
CREATE TABLE IF NOT EXISTS address_buildings(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mainAddressCode TEXT,
  subAddressCode TEXT NOT NULL UNIQUE,
  buildingName TEXT NOT NULL,
  buildingType TEXT NOT NULL
    CHECK(buildingType IN(
      'APARTMENT',
      'OFFICETEL',
      'COMMERCIAL',
      'HOTEL',
      'HOSPITAL',
      'DORMITORY',
      'ETC'
    )),
  latitude REAL,
  longitude REAL,
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT
)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_address_buildings_sub_address_code
ON address_buildings(subAddressCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_address_buildings_main_address_code
ON address_buildings(mainAddressCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_address_buildings_type
ON address_buildings(buildingType)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS address_building_details(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mainAddressCode TEXT,
  subAddressCode TEXT NOT NULL,
  detailAddressCode TEXT NOT NULL UNIQUE,
  buildingDong TEXT,
  buildingFloor INTEGER,
  roomNumber TEXT,
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(subAddressCode) REFERENCES address_buildings(subAddressCode)
)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_address_building_details_detail_address_code
ON address_building_details(detailAddressCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_address_building_details_sub_address_code
ON address_building_details(subAddressCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_address_building_details_dong_floor_room
ON address_building_details(buildingDong, buildingFloor, roomNumber)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS address_qr_codes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  qrCode TEXT NOT NULL UNIQUE,
  mainAddressCode TEXT,
  subAddressCode TEXT,
  detailAddressCode TEXT,
  qrLevel TEXT NOT NULL
    CHECK(qrLevel IN('BUILDING','FLOOR','ROOM')),
  qrName TEXT,
  qrDescription TEXT,
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(subAddressCode) REFERENCES address_buildings(subAddressCode),
  FOREIGN KEY(detailAddressCode) REFERENCES address_building_details(detailAddressCode)
)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_address_qr_codes_qr_code
ON address_qr_codes(qrCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_address_qr_codes_qr_level
ON address_qr_codes(qrLevel)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_address_qr_codes_sub_address_code
ON address_qr_codes(subAddressCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_address_qr_codes_detail_address_code
ON address_qr_codes(detailAddressCode)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS shipment_qr_logs(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipmentId INTEGER NOT NULL,
  qrCode TEXT NOT NULL,
  mainAddressCode TEXT,
  subAddressCode TEXT,
  detailAddressCode TEXT,
  scanType TEXT NOT NULL
    CHECK(scanType IN(
      'BUILDING_SCAN',
      'FLOOR_SCAN',
      'ROOM_SCAN',
      'DELIVERY_COMPLETE'
    )),
  scannedByChannelCode TEXT,
  scannedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(shipmentId) REFERENCES shipments(id),
  FOREIGN KEY(qrCode) REFERENCES address_qr_codes(qrCode),
  FOREIGN KEY(scannedByChannelCode) REFERENCES profiles(channelCode)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipment_qr_logs_shipment
ON shipment_qr_logs(shipmentId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipment_qr_logs_qr_code
ON shipment_qr_logs(qrCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_shipment_qr_logs_scanned_at
ON shipment_qr_logs(scannedAt)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS market_event_masters(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  eventCode TEXT NOT NULL UNIQUE CHECK(length(eventCode)=12),
  channelCode TEXT NOT NULL,
  eventTitle TEXT NOT NULL,
  eventDescription TEXT,
  eventType TEXT NOT NULL DEFAULT 'NORMAL'
    CHECK(eventType IN('NORMAL','PROMOTION','SEASON','CLEARANCE','COUPON')),
  eventStatus TEXT NOT NULL DEFAULT 'SCHEDULED'
    CHECK(eventStatus IN('SCHEDULED','ACTIVE','ENDED','HIDDEN')),
  eventStartAt TEXT,
  eventEndAt TEXT,
  bannerImageAssetId INTEGER,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(bannerImageAssetId) REFERENCES image_assets(id)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_event_masters_channel
ON market_event_masters(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_event_masters_status
ON market_event_masters(eventStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_event_masters_period
ON market_event_masters(eventStartAt, eventEndAt)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS market_inventory(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profileId INTEGER NOT NULL,
  channelCode TEXT NOT NULL,
  marketProductId INTEGER NOT NULL,
  currentStock INTEGER NOT NULL DEFAULT 0,
  safeStock INTEGER NOT NULL DEFAULT 0 CHECK(safeStock >= 0),
  soldOutPolicy TEXT NOT NULL DEFAULT 'ALLOW_NEGATIVE'
    CHECK(soldOutPolicy IN('ALLOW_NEGATIVE','BLOCK_ORDER','HIDE_PRODUCT')),
  lastInboundAt TEXT,
  lastOutboundAt TEXT,
  updatedAt TEXT,
  FOREIGN KEY(profileId) REFERENCES profiles(id),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(marketProductId) REFERENCES market_products(id)
)
`)

safeAddColumn('market_inventory', 'profileId', 'INTEGER')
safeAddColumn('market_inventory', 'channelCode', 'TEXT')
safeAddColumn('market_inventory', 'marketProductId', 'INTEGER')
safeAddColumn('market_inventory', 'currentStock', 'INTEGER NOT NULL DEFAULT 0')
safeAddColumn('market_inventory', 'safeStock', 'INTEGER NOT NULL DEFAULT 0 CHECK(safeStock >= 0)')
safeAddColumn(
  'market_inventory',
  'soldOutPolicy',
  "TEXT NOT NULL DEFAULT 'ALLOW_NEGATIVE' CHECK(soldOutPolicy IN('ALLOW_NEGATIVE','BLOCK_ORDER','HIDE_PRODUCT'))"
)
safeAddColumn('market_inventory', 'lastInboundAt', 'TEXT')
safeAddColumn('market_inventory', 'lastOutboundAt', 'TEXT')
safeAddColumn('market_inventory', 'updatedAt', 'TEXT')

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS uq_market_inventory_market_product
ON market_inventory(marketProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_inventory_channel
ON market_inventory(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_inventory_profile
ON market_inventory(profileId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_inventory_sold_out_policy
ON market_inventory(soldOutPolicy)
`)

//==================================================
// SECTION 15-2 : CART ALLOCATION ENGINE CORE TABLES
// RULE : 상품원장 * 권역(mainAddressCode) * 재고 * 가격 기반 자동 배정
//==================================================

safeAddColumn('market_inventory', 'mainAddressCode', 'TEXT')
safeAddColumn('market_inventory', 'masterProductId', 'INTEGER')
safeAddColumn('market_inventory', 'manufacturerId', 'INTEGER')
safeAddColumn('market_inventory', 'brandId', 'INTEGER')
safeAddColumn('market_inventory', 'barcode', 'TEXT')
safeAddColumn('market_inventory', 'stockQuantity', 'INTEGER NOT NULL DEFAULT 0 CHECK(stockQuantity >= 0)')
safeAddColumn('market_inventory', 'reservedQuantity', 'INTEGER NOT NULL DEFAULT 0 CHECK(reservedQuantity >= 0)')
safeAddColumn('market_inventory', 'availableQuantity', 'INTEGER NOT NULL DEFAULT 0 CHECK(availableQuantity >= 0)')
safeAddColumn('market_inventory', 'createdAt', 'TEXT DEFAULT CURRENT_TIMESTAMP')

db.exec(`
UPDATE market_inventory
SET
  stockQuantity = COALESCE(stockQuantity, currentStock, 0),
  reservedQuantity = COALESCE(reservedQuantity, 0),
  availableQuantity = CASE
    WHEN COALESCE(stockQuantity, currentStock, 0) - COALESCE(reservedQuantity, 0) < 0 THEN 0
    ELSE COALESCE(stockQuantity, currentStock, 0) - COALESCE(reservedQuantity, 0)
  END
WHERE stockQuantity IS NULL
   OR reservedQuantity IS NULL
   OR availableQuantity IS NULL
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_inventory_main_address_code
ON market_inventory(mainAddressCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_inventory_master_product
ON market_inventory(masterProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_inventory_barcode
ON market_inventory(barcode)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS market_prices(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channelCode TEXT NOT NULL,
  mainAddressCode TEXT,
  masterProductId INTEGER NOT NULL,
  barcode TEXT,
  salePrice INTEGER NOT NULL DEFAULT 0 CHECK(salePrice >= 0),
  normalPrice INTEGER NOT NULL DEFAULT 0 CHECK(normalPrice >= 0),
  discountAmount INTEGER NOT NULL DEFAULT 0 CHECK(discountAmount >= 0),
  isEventPrice INTEGER NOT NULL DEFAULT 0 CHECK(isEventPrice IN(0,1)),
  eventStartAt TEXT,
  eventEndAt TEXT,
  updatedAt TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(mainAddressCode) REFERENCES regions(mainAddressCode),
  FOREIGN KEY(masterProductId) REFERENCES master_products(id)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_prices_channel
ON market_prices(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_prices_main_address_code
ON market_prices(mainAddressCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_prices_master_product
ON market_prices(masterProductId)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS customer_carts(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cartCode TEXT NOT NULL UNIQUE CHECK(length(cartCode)=12),
  customerChannelCode TEXT NOT NULL,
  mainAddressCode TEXT,
  cartStatus TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK(cartStatus IN('ACTIVE','CHECKOUT','ORDERED','EXPIRED')),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(customerChannelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(mainAddressCode) REFERENCES regions(mainAddressCode)
)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_carts_code
ON customer_carts(cartCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_customer_carts_customer
ON customer_carts(customerChannelCode)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS customer_cart_items(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cartId INTEGER NOT NULL,
  masterProductId INTEGER NOT NULL,
  manufacturerId INTEGER,
  brandId INTEGER,
  barcode TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(cartId) REFERENCES customer_carts(id),
  FOREIGN KEY(masterProductId) REFERENCES master_products(id),
  FOREIGN KEY(manufacturerId) REFERENCES manufacturers(id),
  FOREIGN KEY(brandId) REFERENCES brands(id)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_customer_cart_items_cart
ON customer_cart_items(cartId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_customer_cart_items_master_product
ON customer_cart_items(masterProductId)
`)

const cartAllocationsSqlRow = db.prepare(`
SELECT sql
FROM sqlite_master
WHERE type='table'
  AND name='cart_allocations'
LIMIT 1
`).get() as { sql?: string } | undefined

const cartAllocationsNeedsMigration =
  (cartAllocationsSqlRow?.sql?.includes('assignedMarketChannelCode') ?? false) === false ||
  (cartAllocationsSqlRow?.sql?.includes('allocationMode') ?? false) === false

if (cartAllocationsNeedsMigration && cartAllocationsSqlRow?.sql) {
  const legacyName = `cart_allocations_legacy_${Date.now()}`
  db.exec(`ALTER TABLE cart_allocations RENAME TO ${legacyName}`)
}

db.exec(`
CREATE TABLE IF NOT EXISTS cart_allocations(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  allocationCode TEXT NOT NULL UNIQUE CHECK(length(allocationCode)=12),
  cartCode TEXT NOT NULL,
  buyerChannelCode TEXT NOT NULL,
  assignedMarketChannelCode TEXT,
  allocationStatus TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK(allocationStatus IN('DRAFT','ALLOCATED','CONFIRMED','CANCELLED','FAILED')),
  allocationMode TEXT NOT NULL DEFAULT 'BALANCED'
    CHECK(allocationMode IN('NEAREST','LOWEST_PRICE','BALANCED')),
  totalEstimatedPrice INTEGER NOT NULL DEFAULT 0 CHECK(totalEstimatedPrice >= 0),
  totalDistanceMeter REAL,
  estimatedReadyMinutes INTEGER,
  scoreTotal REAL,
  stockScore REAL,
  regionScore REAL,
  distanceScore REAL,
  priceScore REAL,
  eventScore REAL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(cartCode) REFERENCES customer_carts(cartCode),
  FOREIGN KEY(buyerChannelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(assignedMarketChannelCode) REFERENCES profiles(channelCode)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_allocations_cart_code
ON cart_allocations(cartCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_allocations_assigned_market_channel
ON cart_allocations(assignedMarketChannelCode)
`)

const cartAllocationItemsSqlRow = db.prepare(`
SELECT sql
FROM sqlite_master
WHERE type='table'
  AND name='cart_allocation_items'
LIMIT 1
`).get() as { sql?: string } | undefined

const cartAllocationItemsNeedsMigration =
  (cartAllocationItemsSqlRow?.sql?.includes('channelProductId') ?? false) === false

if (cartAllocationItemsNeedsMigration && cartAllocationItemsSqlRow?.sql) {
  const legacyName = `cart_allocation_items_legacy_${Date.now()}`
  db.exec(`ALTER TABLE cart_allocation_items RENAME TO ${legacyName}`)
}

db.exec(`
CREATE TABLE IF NOT EXISTS cart_allocation_items(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  allocationId INTEGER NOT NULL,
  channelProductId INTEGER,
  productCode TEXT,
  requestedQuantity INTEGER NOT NULL DEFAULT 0 CHECK(requestedQuantity >= 0),
  allocatedQuantity INTEGER NOT NULL DEFAULT 0 CHECK(allocatedQuantity >= 0),
  unitPrice INTEGER NOT NULL DEFAULT 0 CHECK(unitPrice >= 0),
  eventPrice INTEGER CHECK(eventPrice IS NULL OR eventPrice >= 0),
  stockStatus TEXT
    CHECK(stockStatus IS NULL OR stockStatus IN('UNKNOWN','IN_STOCK','LOW_STOCK','OUT_OF_STOCK','SOLD_OUT')),
  itemScore REAL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(allocationId) REFERENCES cart_allocations(id),
  FOREIGN KEY(channelProductId) REFERENCES channel_products(id)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_allocation_items_allocation
ON cart_allocation_items(allocationId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_allocation_items_channel_product
ON cart_allocation_items(channelProductId)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS market_product_thumbnails(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profileId INTEGER NOT NULL,
  channelCode TEXT NOT NULL,
  marketProductId INTEGER NOT NULL,
  imageAssetId INTEGER NOT NULL,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(profileId) REFERENCES profiles(id),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(marketProductId) REFERENCES market_products(id),
  FOREIGN KEY(imageAssetId) REFERENCES image_assets(id)
)
`)

safeAddColumn('market_product_thumbnails', 'profileId', 'INTEGER')
safeAddColumn('market_product_thumbnails', 'channelCode', 'TEXT')
safeAddColumn('market_product_thumbnails', 'marketProductId', 'INTEGER')
safeAddColumn('market_product_thumbnails', 'imageAssetId', 'INTEGER')
safeAddColumn('market_product_thumbnails', 'sortOrder', 'INTEGER NOT NULL DEFAULT 0')
safeAddColumn('market_product_thumbnails', 'isActive', 'INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1))')

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_product_thumbnails_channel
ON market_product_thumbnails(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_product_thumbnails_market_product
ON market_product_thumbnails(marketProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_product_thumbnails_asset
ON market_product_thumbnails(imageAssetId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_product_thumbnails_active
ON market_product_thumbnails(isActive)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS market_product_import_batches(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profileId INTEGER NOT NULL,
  channelCode TEXT NOT NULL,
  importBatchCode TEXT,
  sourceSystem TEXT NOT NULL DEFAULT 'TOGETHER_POS'
    CHECK(sourceSystem IN('TOGETHER_POS','MANUAL_CSV','RAPUS_ADMIN')),
  originalFileName TEXT,
  storedFilePath TEXT,
  mimeType TEXT,
  fileEncoding TEXT,
  totalRowCount INTEGER NOT NULL DEFAULT 0 CHECK(totalRowCount >= 0),
  successRowCount INTEGER NOT NULL DEFAULT 0 CHECK(successRowCount >= 0),
  failedRowCount INTEGER NOT NULL DEFAULT 0 CHECK(failedRowCount >= 0),
  importStatus TEXT NOT NULL DEFAULT 'READY'
    CHECK(importStatus IN('READY','PROCESSING','COMPLETED','FAILED','PARTIAL_FAILED')),
  importMemo TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  importedAt TEXT,
  completedAt TEXT,
  FOREIGN KEY(profileId) REFERENCES profiles(id),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)
)
`)

safeAddColumn('market_product_import_batches', 'profileId', 'INTEGER')
safeAddColumn('market_product_import_batches', 'channelCode', 'TEXT')
safeAddColumn('market_product_import_batches', 'importBatchCode', 'TEXT')
safeAddColumn(
  'market_product_import_batches',
  'sourceSystem',
  "TEXT NOT NULL DEFAULT 'TOGETHER_POS' CHECK(sourceSystem IN('TOGETHER_POS','MANUAL_CSV','RAPUS_ADMIN'))"
)
safeAddColumn('market_product_import_batches', 'originalFileName', 'TEXT')
safeAddColumn('market_product_import_batches', 'storedFilePath', 'TEXT')
safeAddColumn('market_product_import_batches', 'mimeType', 'TEXT')
safeAddColumn('market_product_import_batches', 'fileEncoding', 'TEXT')
safeAddColumn('market_product_import_batches', 'totalRowCount', 'INTEGER NOT NULL DEFAULT 0 CHECK(totalRowCount >= 0)')
safeAddColumn('market_product_import_batches', 'successRowCount', 'INTEGER NOT NULL DEFAULT 0 CHECK(successRowCount >= 0)')
safeAddColumn('market_product_import_batches', 'failedRowCount', 'INTEGER NOT NULL DEFAULT 0 CHECK(failedRowCount >= 0)')
safeAddColumn(
  'market_product_import_batches',
  'importStatus',
  "TEXT NOT NULL DEFAULT 'READY' CHECK(importStatus IN('READY','PROCESSING','COMPLETED','FAILED','PARTIAL_FAILED'))"
)
safeAddColumn('market_product_import_batches', 'importMemo', 'TEXT')
safeAddColumn('market_product_import_batches', 'importedAt', 'TEXT')
safeAddColumn('market_product_import_batches', 'completedAt', 'TEXT')

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_product_import_batches_channel
ON market_product_import_batches(channelCode)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_market_product_import_batches_code_unique
ON market_product_import_batches(importBatchCode)
WHERE importBatchCode IS NOT NULL
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_product_import_batches_status
ON market_product_import_batches(importStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_product_import_batches_created_at
ON market_product_import_batches(createdAt)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS market_product_import_rows(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batchId INTEGER NOT NULL,
  importBatchId INTEGER,
  profileId INTEGER NOT NULL,
  channelCode TEXT NOT NULL,
  rowNo INTEGER NOT NULL CHECK(rowNo > 0),
  rawProductName TEXT,
  rawPrice TEXT,
  rawStock TEXT,
  rawSpec TEXT,
  rawBarcode TEXT,
  rawSupplierName TEXT,
  rawPurchasePrice TEXT,
  rawSalePrice TEXT,
  rawEventGroupName TEXT,
  rawEventPurchasePrice TEXT,
  rawEventSalePrice TEXT,
  rawProfitRate TEXT,
  rawRewardRate TEXT,
  rawCommissionType TEXT,
  rawStockQuantity TEXT,
  rawStockAmount TEXT,
  rawSafetyStockQuantity TEXT,
  rawDailySalesQuantity TEXT,
  rawBoxQuantity TEXT,
  rawAbcGrade TEXT,
  rawCategoryLarge TEXT,
  rawCategoryMedium TEXT,
  rawCategorySmall TEXT,
  rawVolume TEXT,
  rawUnitPrice TEXT,
  rawPurchasePriceChangedAt TEXT,
  rawSalePriceChangedAt TEXT,
  rawLastPurchasedAt TEXT,
  rawLastStockCheckedAt TEXT,
  rawRegisteredAt TEXT,
  rawModifiedAt TEXT,
  rawDescription TEXT,
  rawOrigin TEXT,
  rawShelfNo TEXT,
  rawEventCode TEXT,
  rawEventTitle TEXT,
  rawEventStartAt TEXT,
  rawEventEndAt TEXT,
  mappedProductCode TEXT CHECK(mappedProductCode IS NULL OR length(mappedProductCode)=12),
  mappedScanCodeValue TEXT,
  mappedMasterProductId INTEGER,
  matchedMasterProductId INTEGER,
  mappedMarketProductId INTEGER,
  normalizedStockQuantity INTEGER CHECK(normalizedStockQuantity IS NULL OR normalizedStockQuantity >= 0),
  stockNormalizeMemo TEXT,
  matchedStatus TEXT DEFAULT 'PENDING'
    CHECK(matchedStatus IN('MATCHED','UNMATCHED','PENDING','IGNORED')),
  rowStatus TEXT NOT NULL DEFAULT 'READY'
    CHECK(rowStatus IN('READY','MAPPED','CREATED','UPDATED','FAILED','SKIPPED')),
  errorMessage TEXT,
  rawPayload TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  processedAt TEXT,
  FOREIGN KEY(batchId) REFERENCES market_product_import_batches(id),
  FOREIGN KEY(importBatchId) REFERENCES market_product_import_batches(id),
  FOREIGN KEY(profileId) REFERENCES profiles(id),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(mappedMasterProductId) REFERENCES master_products(id),
  FOREIGN KEY(matchedMasterProductId) REFERENCES master_products(id),
  FOREIGN KEY(mappedMarketProductId) REFERENCES market_channel_products(id)
)
`)

safeAddColumn('market_product_import_rows', 'batchId', 'INTEGER')
safeAddColumn('market_product_import_rows', 'importBatchId', 'INTEGER')
safeAddColumn('market_product_import_rows', 'profileId', 'INTEGER')
safeAddColumn('market_product_import_rows', 'channelCode', 'TEXT')
safeAddColumn('market_product_import_rows', 'rowNo', 'INTEGER')
safeAddColumn('market_product_import_rows', 'rawProductName', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawPrice', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawStock', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawSpec', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawBarcode', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawSupplierName', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawPurchasePrice', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawSalePrice', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawEventGroupName', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawEventPurchasePrice', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawEventSalePrice', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawProfitRate', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawRewardRate', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawCommissionType', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawStockQuantity', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawStockAmount', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawSafetyStockQuantity', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawDailySalesQuantity', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawBoxQuantity', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawAbcGrade', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawCategoryLarge', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawCategoryMedium', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawCategorySmall', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawVolume', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawUnitPrice', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawPurchasePriceChangedAt', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawSalePriceChangedAt', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawLastPurchasedAt', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawLastStockCheckedAt', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawRegisteredAt', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawModifiedAt', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawDescription', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawOrigin', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawShelfNo', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawEventCode', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawEventTitle', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawEventStartAt', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawEventEndAt', 'TEXT')
safeAddColumn('market_product_import_rows', 'mappedProductCode', 'TEXT CHECK(mappedProductCode IS NULL OR length(mappedProductCode)=12)')
safeAddColumn('market_product_import_rows', 'mappedScanCodeValue', 'TEXT')
safeAddColumn('market_product_import_rows', 'mappedMasterProductId', 'INTEGER')
safeAddColumn('market_product_import_rows', 'matchedMasterProductId', 'INTEGER')
safeAddColumn('market_product_import_rows', 'mappedMarketProductId', 'INTEGER')
safeAddColumn(
  'market_product_import_rows',
  'normalizedStockQuantity',
  'INTEGER CHECK(normalizedStockQuantity IS NULL OR normalizedStockQuantity >= 0)'
)
safeAddColumn('market_product_import_rows', 'stockNormalizeMemo', 'TEXT')
safeAddColumn(
  'market_product_import_rows',
  'matchedStatus',
  "TEXT DEFAULT 'PENDING' CHECK(matchedStatus IN('MATCHED','UNMATCHED','PENDING','IGNORED'))"
)
safeAddColumn(
  'market_product_import_rows',
  'rowStatus',
  "TEXT NOT NULL DEFAULT 'READY' CHECK(rowStatus IN('READY','MAPPED','CREATED','UPDATED','FAILED','SKIPPED'))"
)
safeAddColumn('market_product_import_rows', 'errorMessage', 'TEXT')
safeAddColumn('market_product_import_rows', 'rawPayload', 'TEXT')
safeAddColumn('market_product_import_rows', 'processedAt', 'TEXT')

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_product_import_rows_batch
ON market_product_import_rows(batchId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_product_import_rows_import_batch
ON market_product_import_rows(importBatchId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_product_import_rows_channel
ON market_product_import_rows(channelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_product_import_rows_raw_barcode
ON market_product_import_rows(rawBarcode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_product_import_rows_mapped_scan_code
ON market_product_import_rows(mappedScanCodeValue)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_product_import_rows_status
ON market_product_import_rows(rowStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_product_import_rows_matched_status
ON market_product_import_rows(matchedStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_market_product_import_rows_matched_master
ON market_product_import_rows(matchedMasterProductId)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS master_barcode_food_details(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  masterBarcodeId INTEGER NOT NULL UNIQUE,
  gtin TEXT NOT NULL CHECK(length(gtin)=13),
  nutritionText TEXT,
  foodIngredientText TEXT,
  cookingTimeText TEXT,
  foodType TEXT,
  gmoNotice TEXT,
  babyDietAdReview TEXT,
  reportNumber TEXT,
  allergyText TEXT,
  facilityAllergyText TEXT,
  certificationText TEXT,
  cookingMethodText TEXT,
  additionalFoodTypeText TEXT,
  storageMethod TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  FOREIGN KEY(masterBarcodeId) REFERENCES master_barcodes(id)
)
`)

safeAddColumn('master_barcode_food_details', 'gtin', 'TEXT CHECK(length(gtin)=13)')
safeAddColumn('master_barcode_food_details', 'nutritionText', 'TEXT')
safeAddColumn('master_barcode_food_details', 'foodIngredientText', 'TEXT')
safeAddColumn('master_barcode_food_details', 'cookingTimeText', 'TEXT')
safeAddColumn('master_barcode_food_details', 'foodType', 'TEXT')
safeAddColumn('master_barcode_food_details', 'gmoNotice', 'TEXT')
safeAddColumn('master_barcode_food_details', 'babyDietAdReview', 'TEXT')
safeAddColumn('master_barcode_food_details', 'reportNumber', 'TEXT')
safeAddColumn('master_barcode_food_details', 'allergyText', 'TEXT')
safeAddColumn('master_barcode_food_details', 'facilityAllergyText', 'TEXT')
safeAddColumn('master_barcode_food_details', 'certificationText', 'TEXT')
safeAddColumn('master_barcode_food_details', 'cookingMethodText', 'TEXT')
safeAddColumn('master_barcode_food_details', 'additionalFoodTypeText', 'TEXT')
safeAddColumn('master_barcode_food_details', 'storageMethod', 'TEXT')
safeAddColumn('master_barcode_food_details', 'updatedAt', 'TEXT')

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_barcode_food_details_gtin
ON master_barcode_food_details(gtin)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_master_barcode_food_details_master_barcode_id
ON master_barcode_food_details(masterBarcodeId)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS pos_product_barcodes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profileId INTEGER NOT NULL,
  channelCode TEXT NOT NULL,
  productId INTEGER NOT NULL,
  productCode TEXT,
  gtin TEXT CHECK(gtin IS NULL OR length(gtin)=13),
  masterProductId INTEGER,
  masterBarcodeId INTEGER,
  barcodeType TEXT DEFAULT 'EAN13',
  barcodeValue TEXT,
  isPrimary INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT,
  deletedAt TEXT,
  FOREIGN KEY(profileId) REFERENCES profiles(id),
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode),
  FOREIGN KEY(productId) REFERENCES pos_products(id),
  FOREIGN KEY(masterProductId) REFERENCES master_products(id),
  FOREIGN KEY(masterBarcodeId) REFERENCES master_barcodes(id)
)
`)

safeAddColumn('pos_product_barcodes', 'productCode', 'TEXT')
safeAddColumn('pos_product_barcodes', 'productDbId', 'INTEGER')
safeAddColumn('pos_product_barcodes', 'gtin', 'TEXT CHECK(gtin IS NULL OR length(gtin)=13)')
safeAddColumn('pos_product_barcodes', 'masterProductId', 'INTEGER')
safeAddColumn('pos_product_barcodes', 'masterBarcodeId', 'INTEGER')

db.exec(`
UPDATE pos_product_barcodes
SET productDbId = productId
WHERE productDbId IS NULL
  AND productId IS NOT NULL
`)

db.exec(`
UPDATE pos_product_barcodes
SET gtin = barcodeValue
WHERE (gtin IS NULL OR TRIM(gtin) = '')
  AND barcodeValue GLOB '[0-9]*'
  AND length(barcodeValue) = 13
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_product_barcodes_channel_gtin_unique
ON pos_product_barcodes(channelCode, gtin)
WHERE gtin IS NOT NULL
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_barcodes_master_product_id
ON pos_product_barcodes(masterProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_barcodes_master_barcode_id
ON pos_product_barcodes(masterBarcodeId)
`)

if (hasPosProductBarcodesTable) {
  db.exec(`
    INSERT INTO pos_product_scan_codes(
      profileId,
      channelCode,
      productDbId,
      productId,
      productCode,
      sourceType,
      scanCodeType,
      scanCodeValue,
      scanCodeSource,
      externalBarcodeFormat,
      isPrimary,
      isActive,
      createdAt,
      updatedAt,
      deletedAt
    )
    SELECT
      b.profileId,
      b.channelCode,
      b.productDbId,
      b.productId,
      b.productCode,
      COALESCE(p.sourceType, 'POS_PRODUCT'),
      CASE
        WHEN b.barcodeType = 'INTERNAL' THEN 'INTERNAL'
        WHEN b.barcodeType IN ('EAN13','EAN8','UPC_A','UPC_E','CODE128','GTIN14') THEN 'EXTERNAL_BARCODE'
        WHEN b.barcodeType = 'QR' THEN 'CUSTOM'
        ELSE 'CUSTOM'
      END,
      b.barcodeValue,
      CASE
        WHEN b.barcodeType = 'INTERNAL' THEN 'MERCHANT'
        WHEN b.barcodeType IN ('EAN13','EAN8','UPC_A','UPC_E','CODE128','GTIN14') THEN 'MANUFACTURER'
        ELSE 'CUSTOM'
      END,
      CASE
        WHEN b.barcodeType IN ('EAN13','EAN8','UPC_A','UPC_E','CODE128','GTIN14') THEN b.barcodeType
        ELSE NULL
      END,
      COALESCE(b.isPrimary, 0),
      COALESCE(b.isActive, 1),
      COALESCE(b.createdAt, CURRENT_TIMESTAMP),
      b.updatedAt,
      b.deletedAt
    FROM pos_product_barcodes b
    LEFT JOIN pos_products p
      ON p.id = b.productDbId
    WHERE b.barcodeValue IS NOT NULL
      AND TRIM(b.barcodeValue) <> ''
      AND b.productCode IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM pos_product_scan_codes s
        WHERE s.channelCode = b.channelCode
          AND s.scanCodeValue = b.barcodeValue
          AND COALESCE(s.deletedAt, '') = COALESCE(b.deletedAt, '')
      )
  `)
}

db.exec(`
UPDATE pos_product_thumbnails
SET productCode = (
  SELECT p.productCode
  FROM pos_products p
  WHERE p.id = pos_product_thumbnails.productId
  LIMIT 1
)
WHERE productCode IS NULL
`)

db.exec(`
UPDATE pos_product_options
SET productCode = (
  SELECT p.productCode
  FROM pos_products p
  WHERE p.id = pos_product_options.productId
  LIMIT 1
)
WHERE productCode IS NULL
`)

db.exec(`
UPDATE pos_product_option_values
SET productCode = (
  SELECT o.productCode
  FROM pos_product_options o
  WHERE o.id = pos_product_option_values.optionId
  LIMIT 1
)
WHERE productCode IS NULL
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_product_code
ON pos_products(productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_master_product
ON pos_products(masterProductId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_channel_product_code
ON pos_products(channelCode, productCode)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_products_channel_product_code_unique
ON pos_products(channelCode, productCode)
WHERE productCode IS NOT NULL
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_products_channel_product_id_unique
ON pos_products(channelCode, productId)
WHERE productId IS NOT NULL
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_products_channel_product_id
ON pos_products(channelCode, productId)
WHERE productId IS NOT NULL
`)

//========================================================
// SECTION : PROFILE / PRODUCT / POST RELATION TABLES

db.exec(`
CREATE TABLE IF NOT EXISTS profile_favorites(
id INTEGER PRIMARY KEY AUTOINCREMENT,
actorProfileId INTEGER NOT NULL,
actorChannelCode TEXT NOT NULL,
providerProfileId INTEGER NOT NULL,
providerChannelCode TEXT NOT NULL,
providerProfileType TEXT NOT NULL CHECK(providerProfileType IN('GENERAL','BUSINESS')),
status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN('ACTIVE','DELETED')),
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(actorProfileId) REFERENCES profiles(id),
FOREIGN KEY(actorChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(providerProfileId) REFERENCES profiles(id),
FOREIGN KEY(providerChannelCode) REFERENCES profiles(channelCode),
UNIQUE(actorChannelCode, providerChannelCode)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_profile_favorites_actor_channel
ON profile_favorites(actorChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_profile_favorites_provider_channel
ON profile_favorites(providerChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_profile_favorites_status
ON profile_favorites(status)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_profile_favorites_actor_status_created
ON profile_favorites(actorChannelCode, status, createdAt)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_profile_favorites_provider_status
ON profile_favorites(providerChannelCode, status)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS product_favorites(
id INTEGER PRIMARY KEY AUTOINCREMENT,
actorProfileId INTEGER NOT NULL,
actorChannelCode TEXT NOT NULL,
providerProfileId INTEGER NOT NULL,
providerChannelCode TEXT NOT NULL,
productId INTEGER,
productCode TEXT NOT NULL CHECK(productCode LIKE 'RPB%' OR productCode LIKE 'RPN%'),
status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN('ACTIVE','DELETED')),
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(actorProfileId) REFERENCES profiles(id),
FOREIGN KEY(actorChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(providerProfileId) REFERENCES profiles(id),
FOREIGN KEY(providerChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(productId) REFERENCES pos_products(id),
UNIQUE(actorChannelCode, providerChannelCode, productCode)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_product_favorites_actor_channel
ON product_favorites(actorChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_product_favorites_provider_channel
ON product_favorites(providerChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_product_favorites_product_code
ON product_favorites(productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_product_favorites_status
ON product_favorites(status)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_product_favorites_actor_status_created
ON product_favorites(actorChannelCode, status, createdAt)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_product_favorites_provider_product_status
ON product_favorites(providerChannelCode, productCode, status)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_favorite_profile_count
ON pos_products(favoriteProfileCount)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_favorite_updated_at
ON pos_products(favoriteUpdatedAt)
`)

db.exec(`
UPDATE pos_products
SET
  favoriteProfileCount = (
    SELECT COUNT(DISTINCT pf.actorChannelCode)
    FROM product_favorites pf
    WHERE pf.providerChannelCode = pos_products.channelCode
      AND pf.productCode = pos_products.productCode
      AND pf.status = 'ACTIVE'
  ),
  favoriteUpdatedAt = CURRENT_TIMESTAMP
WHERE productCode IS NOT NULL
`)

db.exec(`
UPDATE pos_products
SET favoriteProfileCount = 0
WHERE favoriteProfileCount IS NULL
   OR favoriteProfileCount < 0
`)

db.exec(`
UPDATE pos_products
SET productId =
  CASE
    WHEN COALESCE(sourceType, 'POS_PRODUCT') = 'MARKET_PRODUCT'
      THEN 'MKT-' || strftime('%Y-%m-%d', COALESCE(createdAt, CURRENT_TIMESTAMP)) || '-' || substr('000' || id, -3, 3)
    ELSE
      'PLC-' || strftime('%Y-%m-%d', COALESCE(createdAt, CURRENT_TIMESTAMP)) || '-' || substr('000' || id, -3, 3)
  END
WHERE productId IS NULL
   OR TRIM(productId) = ''
`)

db.exec(`
CREATE TABLE IF NOT EXISTS post_recommendations(
id INTEGER PRIMARY KEY AUTOINCREMENT,
actorProfileId INTEGER NOT NULL,
actorChannelCode TEXT NOT NULL,
providerProfileId INTEGER NOT NULL,
providerChannelCode TEXT NOT NULL,
postId INTEGER,
postCode TEXT NOT NULL CHECK(length(postCode)=12),
postType TEXT NOT NULL CHECK(postType IN('GENERAL','GALLERY','PRODUCT','EVENT','REVIEW')),
status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN('ACTIVE','DELETED')),
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(actorProfileId) REFERENCES profiles(id),
FOREIGN KEY(actorChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(providerProfileId) REFERENCES profiles(id),
FOREIGN KEY(providerChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(postId) REFERENCES posts(id),
UNIQUE(actorChannelCode, providerChannelCode, postCode)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_post_recommendations_actor_channel
ON post_recommendations(actorChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_post_recommendations_provider_channel
ON post_recommendations(providerChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_post_recommendations_post_code
ON post_recommendations(postCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_post_recommendations_post_type
ON post_recommendations(postType)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_post_recommendations_status
ON post_recommendations(status)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_post_recommendations_actor_status_created
ON post_recommendations(actorChannelCode, status, createdAt)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_post_recommendations_provider_post_status
ON post_recommendations(providerChannelCode, postCode, status)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_post_recommendations_provider_type_status
ON post_recommendations(providerChannelCode, postType, status)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS cart_items(
id INTEGER PRIMARY KEY AUTOINCREMENT,
actorProfileId INTEGER NOT NULL,
actorChannelCode TEXT NOT NULL,
customerChannelCode TEXT NOT NULL,
providerProfileId INTEGER NOT NULL,
providerChannelCode TEXT NOT NULL,
productId INTEGER,
sourceType TEXT NOT NULL DEFAULT 'POS_PRODUCT' CHECK(sourceType IN('POS_PRODUCT','MARKET_PRODUCT')),
cartCode TEXT CHECK(cartCode IS NULL OR length(cartCode)=12),
cartSessionCode TEXT CHECK(cartSessionCode IS NULL OR length(cartSessionCode)=12),
cartItemCode TEXT NOT NULL CHECK(length(cartItemCode)=12),
productCode TEXT NOT NULL CHECK(productCode LIKE 'RPB%' OR productCode LIKE 'RPN%'),
optionSignature TEXT NOT NULL DEFAULT 'NO_OPTIONS',
fulfillmentType TEXT,
fulfillmentSignature TEXT NOT NULL DEFAULT 'DEFAULT_FULFILLMENT',
orderCode TEXT CHECK(orderCode IS NULL OR length(orderCode)=12),
productNameSnapshot TEXT NOT NULL,
productTypeSnapshot TEXT NOT NULL DEFAULT 'PRODUCT' CHECK(productTypeSnapshot IN('PRODUCT')),
productKindSnapshot TEXT CHECK(
  productKindSnapshot IS NULL
  OR productKindSnapshot IN('MAIN_PRODUCT','SUB_PRODUCT')
),
categoryNameSnapshot TEXT,
unitPriceSnapshot INTEGER NOT NULL DEFAULT 0 CHECK(unitPriceSnapshot >= 0),
currency TEXT DEFAULT 'KRW',
quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
optionTotalAmount INTEGER NOT NULL DEFAULT 0 CHECK(optionTotalAmount >= 0),
lineTotalAmount INTEGER NOT NULL DEFAULT 0 CHECK(lineTotalAmount >= 0),
orderFlowType TEXT NOT NULL CHECK(orderFlowType IN(
  'IN_STORE',
  'PICKUP',
  'DELIVERY',
  'RESERVATION',
  'SERVICE',
  'ROOM_SERVICE',
  'PARCEL'
)),
cartStatus TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(cartStatus IN(
  'ACTIVE',
  'ORDERED',
  'DELETED',
  'EXPIRED'
)),
requestMemo TEXT,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
deletedAt TEXT,
FOREIGN KEY(actorProfileId) REFERENCES profiles(id),
FOREIGN KEY(actorChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(customerChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(providerProfileId) REFERENCES profiles(id),
FOREIGN KEY(providerChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(productId) REFERENCES pos_products(id)
)
`)

safeAddColumn(
  'cart_items',
  'customerChannelCode',
  'TEXT'
)

safeAddColumn(
  'cart_items',
  'cartSessionCode',
  'TEXT CHECK(cartSessionCode IS NULL OR length(cartSessionCode)=12)'
)

safeAddColumn(
  'cart_items',
  'cartItemCode',
  'TEXT CHECK(cartItemCode IS NULL OR length(cartItemCode)=12)'
)

safeAddColumn(
  'cart_items',
  'sourceType',
  "TEXT NOT NULL DEFAULT 'POS_PRODUCT' CHECK(sourceType IN('POS_PRODUCT','MARKET_PRODUCT'))"
)

safeAddColumn(
  'cart_items',
  'optionSignature',
  "TEXT NOT NULL DEFAULT 'NO_OPTIONS'"
)

safeAddColumn(
  'cart_items',
  'cartCode',
  'TEXT CHECK(cartCode IS NULL OR length(cartCode)=12)'
)

safeAddColumn(
  'cart_items',
  'fulfillmentType',
  'TEXT'
)

safeAddColumn(
  'cart_items',
  'fulfillmentSignature',
  "TEXT NOT NULL DEFAULT 'DEFAULT_FULFILLMENT'"
)

safeAddColumn(
  'cart_items',
  'orderCode',
  'TEXT CHECK(orderCode IS NULL OR length(orderCode)=12)'
)

db.exec(`
UPDATE cart_items
SET customerChannelCode = actorChannelCode
WHERE customerChannelCode IS NULL
   OR TRIM(customerChannelCode) = ''
`)

db.exec(`
UPDATE cart_items
SET cartSessionCode = 'CS' || substr('0000000000' || id, -10, 10)
WHERE cartSessionCode IS NULL
`)

db.exec(`
UPDATE cart_items
SET cartCode = cartSessionCode
WHERE (cartCode IS NULL OR TRIM(cartCode) = '')
  AND cartSessionCode IS NOT NULL
`)

db.exec(`
UPDATE cart_items
SET cartCode = 'CT' || substr('0000000000' || id, -10, 10)
WHERE cartCode IS NULL
   OR TRIM(cartCode) = ''
`)

db.exec(`
UPDATE cart_items
SET cartItemCode = 'CI' || substr('0000000000' || id, -10, 10)
WHERE cartItemCode IS NULL
`)

db.exec(`
UPDATE cart_items
SET sourceType = 'POS_PRODUCT'
WHERE sourceType IS NULL
   OR TRIM(sourceType) = ''
`)

db.exec(`
UPDATE cart_items
SET fulfillmentType = orderFlowType
WHERE fulfillmentType IS NULL
   OR TRIM(fulfillmentType) = ''
`)

db.exec(`
UPDATE cart_items
SET optionSignature = 'NO_OPTIONS'
WHERE optionSignature IS NULL
   OR TRIM(optionSignature) = ''
`)

db.exec(`
UPDATE cart_items
SET fulfillmentSignature = 'DEFAULT_FULFILLMENT'
WHERE fulfillmentSignature IS NULL
   OR TRIM(fulfillmentSignature) = ''
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_items_actor_channel
ON cart_items(actorChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_items_customer_channel
ON cart_items(customerChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_items_provider_channel
ON cart_items(providerChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_items_product_code
ON cart_items(productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_session_code
ON cart_items(cartSessionCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_code
ON cart_items(cartCode)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_cart_item_code_unique
ON cart_items(cartItemCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_items_status
ON cart_items(cartStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at
ON cart_items(createdAt)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_items_actor_status_created
ON cart_items(actorChannelCode, cartStatus, createdAt)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_items_customer_status_created
ON cart_items(customerChannelCode, cartStatus, createdAt)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_items_provider_product_status
ON cart_items(providerChannelCode, productCode, cartStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_items_actor_provider_status
ON cart_items(actorChannelCode, providerChannelCode, cartStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_items_customer_provider_status
ON cart_items(customerChannelCode, providerChannelCode, cartStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_items_duplicate_guard
ON cart_items(
  customerChannelCode,
  providerChannelCode,
  sourceType,
  productCode,
  optionSignature,
  cartStatus
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_items_duplicate_guard_v2
ON cart_items(
  customerChannelCode,
  providerChannelCode,
  sourceType,
  productCode,
  optionSignature,
  fulfillmentSignature,
  cartStatus
)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS cart_item_options(
id INTEGER PRIMARY KEY AUTOINCREMENT,
cartItemId INTEGER NOT NULL,
cartItemCode TEXT CHECK(cartItemCode IS NULL OR length(cartItemCode)=12),
cartCode TEXT CHECK(cartCode IS NULL OR length(cartCode)=12),
providerChannelCode TEXT NOT NULL,
productCode TEXT NOT NULL CHECK(productCode LIKE 'RPB%' OR productCode LIKE 'RPN%'),
productOptionId INTEGER,
productOptionValueId INTEGER,
optionNameSnapshot TEXT NOT NULL,
optionTypeSnapshot TEXT NOT NULL CHECK(optionTypeSnapshot IN(
  'SIZE',
  'TEMPERATURE',
  'ADDON',
  'CHOICE',
  'CUSTOM'
)),
optionValueNameSnapshot TEXT NOT NULL,
priceDeltaSnapshot INTEGER NOT NULL DEFAULT 0,
quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
lineOptionAmount INTEGER NOT NULL DEFAULT 0,
sortOrder INTEGER DEFAULT 0,
createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(cartItemId) REFERENCES cart_items(id),
FOREIGN KEY(providerChannelCode) REFERENCES profiles(channelCode),
FOREIGN KEY(productOptionId) REFERENCES pos_product_options(id),
FOREIGN KEY(productOptionValueId) REFERENCES pos_product_option_values(id)
)
`)

safeAddColumn(
  'cart_item_options',
  'cartItemCode',
  'TEXT CHECK(cartItemCode IS NULL OR length(cartItemCode)=12)'
)

safeAddColumn(
  'cart_item_options',
  'cartCode',
  'TEXT CHECK(cartCode IS NULL OR length(cartCode)=12)'
)

db.exec(`
UPDATE cart_item_options
SET cartItemCode = (
  SELECT ci.cartItemCode
  FROM cart_items ci
  WHERE ci.id = cart_item_options.cartItemId
)
WHERE cartItemCode IS NULL
`)

db.exec(`
UPDATE cart_item_options
SET cartCode = (
  SELECT ci.cartCode
  FROM cart_items ci
  WHERE ci.id = cart_item_options.cartItemId
)
WHERE cartCode IS NULL
   OR TRIM(cartCode) = ''
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_item_options_cart_item
ON cart_item_options(cartItemId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_item_options_cart_item_code
ON cart_item_options(cartItemCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_item_options_provider_channel
ON cart_item_options(providerChannelCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_item_options_product_code
ON cart_item_options(productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_item_options_product_option_id
ON cart_item_options(productOptionId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_item_options_product_option_value_id
ON cart_item_options(productOptionValueId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_cart_item_options_created_at
ON cart_item_options(createdAt)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_thumbnails_product_code
ON pos_product_thumbnails(productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_thumbnails_channel_product_code
ON pos_product_thumbnails(channelCode, productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_thumbnails_product_code_active
ON pos_product_thumbnails(channelCode, productCode, isActive)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_options_product_code
ON pos_product_options(productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_options_channel_product_code
ON pos_product_options(channelCode, productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_options_product_code_active
ON pos_product_options(channelCode, productCode, isActive)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_options_product_code_sort
ON pos_product_options(channelCode, productCode, sortOrder)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_product_options_channel_product_code_name_unique
ON pos_product_options(channelCode, productCode, optionName)
WHERE productCode IS NOT NULL
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_product_code
ON pos_product_option_values(productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_channel_product_code
ON pos_product_option_values(channelCode, productCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_product_code_active
ON pos_product_option_values(channelCode, productCode, isActive)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_product_code_sort
ON pos_product_option_values(channelCode, productCode, sortOrder)
`)

db.exec(`
UPDATE pos_products
SET
  isFeatured = COALESCE(isFeatured, 0),
  isRepresentative = COALESCE(isRepresentative, 0),
  showOnTableOrder = COALESCE(showOnTableOrder, 1),
  allowNormalOrder = COALESCE(allowNormalOrder, 1),
  allowReservationOrder = COALESCE(allowReservationOrder, 0),
  allowDineIn = COALESCE(allowDineIn, 1),
  allowTakeout = COALESCE(allowTakeout, 1),
  allowDelivery = COALESCE(allowDelivery, 1),
  menuStatus = CASE
    WHEN menuStatus IN ('ON_SALE','STOPPED') THEN menuStatus
    WHEN COALESCE(isActive, 1) = 1 AND COALESCE(isSoldOut, 0) = 0 THEN 'ON_SALE'
    ELSE 'STOPPED'
  END
`)

db.exec(`
UPDATE pos_product_option_values
SET
  optionValueType = CASE
    WHEN COALESCE(isDefault, 0) = 1 THEN 'BASE'
    WHEN optionValueType IN ('BASE','CUSTOM') THEN optionValueType
    ELSE 'CUSTOM'
  END,
  isVisible = COALESCE(isVisible, 1)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_product_categories_channel_code
ON pos_product_categories(channelCode, categoryCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_representative
ON pos_products(isRepresentative)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_featured
ON pos_products(isFeatured)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_table_order_visible
ON pos_products(showOnTableOrder)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_menu_status
ON pos_products(menuStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_products_daily_sales_limit
ON pos_products(dailySalesLimit)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_type
ON pos_product_option_values(optionValueType)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_visible
ON pos_product_option_values(isVisible)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_quantity_enabled
ON pos_product_option_values(isQuantityEnabled)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_product_option_values_quantity_limit_enabled
ON pos_product_option_values(isQuantityLimitEnabled)
`)

db.exec(`
UPDATE pos_product_option_values
SET
  isQuantityEnabled = COALESCE(isQuantityEnabled, 0),
  isQuantityLimitEnabled = COALESCE(isQuantityLimitEnabled, 0),
  minOptionQuantity = COALESCE(minOptionQuantity, 1),
  defaultOptionQuantity = COALESCE(defaultOptionQuantity, 1),
  maxOptionQuantity = CASE
    WHEN COALESCE(isQuantityLimitEnabled, 0) = 1 THEN maxOptionQuantity
    ELSE NULL
  END
WHERE isQuantityEnabled IS NULL
   OR isQuantityLimitEnabled IS NULL
   OR minOptionQuantity IS NULL
   OR defaultOptionQuantity IS NULL
   OR COALESCE(isQuantityLimitEnabled, 0) = 0
`)

db.exec(`
UPDATE pos_locations
SET tableCode = UPPER(tableCode)
WHERE tableCode IS NOT NULL
  AND tableCode <> UPPER(tableCode)
  AND NOT EXISTS (
    SELECT 1
    FROM pos_locations p2
    WHERE p2.channelCode = pos_locations.channelCode
      AND p2.id <> pos_locations.id
      AND p2.tableCode = UPPER(pos_locations.tableCode)
  )
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_locations_table_code_unique
ON pos_locations(channelCode, tableCode)
WHERE tableCode IS NOT NULL
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_locations_table_code
ON pos_locations(channelCode, tableCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_locations_table_type_code
ON pos_locations(tableTypeCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_locations_channel_table_type
ON pos_locations(channelCode, tableTypeCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_locations_channel_floor
ON pos_locations(channelCode, floor)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_locations_channel_floor_zone
ON pos_locations(channelCode, floor, zone)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_locations_floor_zone_sort
ON pos_locations(channelCode, floorSortOrder, zoneSortOrder)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_locations_resource_status
ON pos_locations(resourceStatus)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_locations_current_use_type
ON pos_locations(currentUseType)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_pos_locations_current_checkin
ON pos_locations(currentCheckInId)
`)

db.exec(`
UPDATE pos_locations
SET
  resourceStatus = COALESCE(resourceStatus, 'AVAILABLE'),
  qrStatus = 'CONNECTED',
  qrConnectedAt = COALESCE(qrConnectedAt, CURRENT_TIMESTAMP),
  qrDisconnectedAt = NULL,
  updatedAt = CURRENT_TIMESTAMP
WHERE locationType = 'TABLE'
  AND isActive = 1
  AND deletedAt IS NULL
  AND tableCode IS NOT NULL
  AND tableOrderUrl IS NOT NULL
  AND qrCodeValue IS NOT NULL
  AND (
    qrStatus IS NULL
    OR qrStatus = 'DISCONNECTED'
  )
`)

db.exec(`
UPDATE pos_locations
SET resourceStatus = 'AVAILABLE'
WHERE resourceStatus IS NULL
`)

db.exec(`
UPDATE pos_locations
SET tableTypeCode = 'STANDARD'
WHERE tableTypeCode IS NULL
`)

//============== END====================================//
console.log('===== PRODUCTION DB INIT COMPLETE =====')

}



if(require.main===module){

initDatabase()

.then(()=>{

console.log('PRODUCTION DB INIT DONE')

process.exit(0)

})

.catch(err=>{

console.error('PRODUCTION DB INIT FAILED',err)

process.exit(1)

})

}

