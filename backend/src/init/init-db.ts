// FILE: C:\Users\kjm\social-platform\backend\src\init\init-db.ts
// ROOT : C:\Users\kjm\social-platform\backend\src\init\init-db.ts
// STATUS : PRODUCTION DB INIT FINAL (TEST SECTION FIRST ORDER)

import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import * as bcrypt from 'bcrypt'

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


//======================================================
// SECTION 02 : TEST USERS (???亦????쒓낯???ヂ???)

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

const row = findUserIdByEmail.get(email) as { id?: number } | undefined
if (!row?.id) {
throw new Error(`failed to ensure test user: ${email}`)
}
return row.id
}

const userId1 =
ensureTestUserId(
'test1@prod.com',
'???獒?嶺뚮ㅎ????1',
'1B2C3D4E5F6G'
)

const userId2 =
ensureTestUserId(
'test2@prod.com',
'???獒?嶺뚮ㅎ????2',
'8X7C6V5B4N3M'
)

//===============================================
// SECTION 03 : INDUSTRIES (BUSINESS ???怨몄쾮 15?? [FIXED]

db.exec(`

CREATE TABLE IF NOT EXISTS industries(

id INTEGER PRIMARY KEY AUTOINCREMENT,

code TEXT UNIQUE,

name TEXT NOT NULL,

description TEXT,

isActive INTEGER DEFAULT 1,

/* ??????????⑤베堉? */
sortOrder INTEGER DEFAULT 0,

createdAt TEXT DEFAULT CURRENT_TIMESTAMP

)

`)

/* =========================================
SAFE COLUMN ADD (??れ삀???DB ???용봿????源낇꼧??筌믨퀡裕?
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

/* ???sortOrder ????*/

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
// VALUES : NORMAL / STORE / FREELANCER / MOBILE_BIZ
// NOTE : profiles.businessTypeCode source table
//================================================

db.exec(`

CREATE TABLE IF NOT EXISTS business_types(

id INTEGER PRIMARY KEY AUTOINCREMENT,

code TEXT NOT NULL UNIQUE
CHECK(code IN(
'NORMAL',
'STORE',
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
'기본 비즈니스 / 매장형 / 일반 사업자 / 프리랜서의 기본값',
1
)

insertBusinessType.run(
'STORE',
'스토어형',
'고정 매장 / 음식점 / 병원 / 학원 / 카페 / 한식당',
2
)

insertBusinessType.run(
'FREELANCER',
'프리랜서',
'개인 서비스 / 전문가 / 크리에이터 / 강사 / 디자이너',
3
)

insertBusinessType.run(
'MOBILE_BIZ',
'이동형',
'푸드트럭 / 방문 판매 / 출장 서비스 / 방문 수리 / 코스형 영업',
4
)

db.exec(`

UPDATE business_types
SET
  name = CASE code
    WHEN 'NORMAL' THEN '일반형'
    WHEN 'STORE' THEN '스토어형'
    WHEN 'FREELANCER' THEN '프리랜서'
    WHEN 'MOBILE_BIZ' THEN '이동형'
    ELSE name
  END,
  description = CASE code
    WHEN 'NORMAL' THEN '기본 비즈니스 / 매장형 / 일반 사업자 / 프리랜서의 기본값'
    WHEN 'STORE' THEN '고정 매장 / 음식점 / 병원 / 학원 / 카페 / 한식당'
    WHEN 'FREELANCER' THEN '개인 서비스 / 전문가 / 크리에이터 / 강사 / 디자이너'
    WHEN 'MOBILE_BIZ' THEN '푸드트럭 / 방문 판매 / 출장 서비스 / 방문 수리 / 코스형 영업'
    ELSE description
  END,
  sortOrder = CASE code
    WHEN 'NORMAL' THEN 1
    WHEN 'STORE' THEN 2
    WHEN 'FREELANCER' THEN 3
    WHEN 'MOBILE_BIZ' THEN 4
    ELSE sortOrder
  END,
  updatedAt = CURRENT_TIMESTAMP
WHERE code IN ('NORMAL', 'STORE', 'FREELANCER', 'MOBILE_BIZ')

`)

const findBusinessTypeIdByCode = db.prepare(`

SELECT id
FROM business_types
WHERE code=?

`)

function getBusinessTypeId(
code: 'NORMAL' | 'STORE' | 'FREELANCER' | 'MOBILE_BIZ'
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
SAFE COLUMN ADD (??れ삀???DB ???용봿????源낇꼧??筌믨퀡裕?
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

//========================================================
// SECTION 05-1 : IMAGE ASSETS (OWNER CHANNEL FK + ACTIVE CONTROL FINAL)

db.exec(`
CREATE TABLE IF NOT EXISTS image_assets(
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
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)
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
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(channelCode) REFERENCES profiles(channelCode)
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
    'FREELANCER',
    'MOBILE_BIZ'
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
    'FREELANCER',
    'MOBILE_BIZ'
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
          'FREELANCER',
          'MOBILE_BIZ'
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
          'FREELANCER',
          'MOBILE_BIZ'
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
      'FREELANCER',
      'MOBILE_BIZ'
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

db.exec(`

UPDATE profiles
SET
  businessTypeId = NULL,
  businessTypeCode = NULL
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
businessTypeCode
)

VALUES(?,?,?,?,?,?,?,?,?)

`)

/* ================================
TEST DATA
1 ACCOUNT = 1 BASECODE
GENERAL  = A + baseCode
BUSINESS = B + baseCode
GENERAL  = businessType NULL
BUSINESS = default NORMAL
================================ */

/* user1 baseCode = 1B2C3D4E5F6G */

insertProfile.run(
  userId1,
  'GENERAL',
  '1B2C3D4E5F6G',
  'test1_general',
  'A1B2C3D4E5F6G',
  'xxx.com/@A1B2C3D4E5F6G',
  null,
  null,
  null
)

insertProfile.run(
  userId1,
  'BUSINESS',
  '1B2C3D4E5F6G',
  'test1_business',
  'B1B2C3D4E5F6G',
  'xxx.com/@B1B2C3D4E5F6G',
  null,
  normalBusinessTypeId,
  'NORMAL'
)

/* user2 baseCode = 8X7C6V5B4N3M */

insertProfile.run(
  userId2,
  'GENERAL',
  '8X7C6V5B4N3M',
  'test2_general',
  'A8X7C6V5B4N3M',
  'xxx.com/@A8X7C6V5B4N3M',
  null,
  null,
  null
)

insertProfile.run(
  userId2,
  'BUSINESS',
  '8X7C6V5B4N3M',
  'test2_business',
  'B8X7C6V5B4N3M',
  'xxx.com/@B8X7C6V5B4N3M',
  null,
  normalBusinessTypeId,
  'NORMAL'
)

db.exec(`

UPDATE profiles
SET
  businessTypeId = ${normalBusinessTypeId},
  businessTypeCode = 'NORMAL'
WHERE profileType = 'BUSINESS'
  AND businessTypeCode = 'STORE'
  AND displayName IN ('test1_business', 'test2_business')

`)

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
// SECTION 06-10 : PROFILE CATEGORIES (INFO ??癰귙끋源??嶺뚮쮳? ????깼??

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
MIGRATION (??れ삀???DB ????
================================================== */

const profileCategoryCols =
  db.prepare(`PRAGMA table_info(profile_categories)`).all() as Array<{ name: string }>

const hasOldInfoConstraint = true // SQLite??CHECK ?釉뚰?????됰씭?? ????좊즴甕??癲ル슢???鈺곗슜?η춯琉얩뜑????⑤젰??

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
// ROLE : ?곸뾽?쒓컙 + ?곸뾽以??곸뾽醫낅즺 ?곹깭 愿由?
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
// SAFE COLUMN ADD (湲곗〈 援ъ“ ?좎?)
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
// INITIAL ROW INSERT (?뚯뒪??profile 湲곗?)
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

const businessProfile1 =
getBusinessProfileByChannelCode('B1B2C3D4E5F6G')

const businessProfile2 =
getBusinessProfileByChannelCode('B8X7C6V5B4N3M')

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
?먮낯: profiles.primaryIndustry*
紐⑹쟻: feed query JOIN 媛먯냼
二쇱쓽: snapshot 罹먯떆?대?濡?FK瑜?嫄몄? ?딅뒗??
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
湲곗〈 DB / ?좉퇋 DB 紐⑤몢 ?명솚
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
二쇱쓽:
- industry* 而щ읆 ?꾨씫留뚯쑝濡쒕뒗 rebuild ?섏? ?딅뒗??
- industry* 而щ읆? safeAddColumn + backfill濡?泥섎━?쒕떎.
- rebuild??legacy authorChannelCode / channelCode 遺??/ status DRAFT CHECK 蹂댁젙???꾩슂???뚮쭔 ?섑뻾?쒕떎.
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
      ?먮낯: profiles.primaryIndustry*
      紐⑹쟻: feed query JOIN 媛먯냼
      FK ?놁쓬
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
- ?먮낯: profiles.primaryIndustry*
- snapshot: posts.industry*
- 紐⑹쟻: feed query JOIN 媛먯냼
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
// SECTION 11 : CATEGORIES (??繹먮끏???~ 癲ル슢?꾤땟??

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
// ROLE : PROFILE ??CATEGORY (GENERAL CATEGORY RELATION)
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
INDEX : ?釉뚰????濚밸Ŧ援앲짆?
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
UNIQUE : 濚욌꼬?댄꺇??癲ル슢???⑸눀??袁⑸젻泳?
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
productCode TEXT CHECK(
  productCode IS NULL
  OR productCode GLOB '[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]'
),
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

CREATE TABLE IF NOT EXISTS pos_product_options(
id INTEGER PRIMARY KEY AUTOINCREMENT,
profileId INTEGER NOT NULL,
channelCode TEXT NOT NULL,
productId INTEGER NOT NULL,
productCode TEXT CHECK(
  productCode IS NULL
  OR productCode GLOB '[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]'
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
  OR productCode GLOB '[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]'
),
optionValueName TEXT NOT NULL,
priceDelta INTEGER DEFAULT 0,
isDefault INTEGER DEFAULT 0 CHECK(isDefault IN(0,1)),
isActive INTEGER DEFAULT 1 CHECK(isActive IN(0,1)),
optionValueType TEXT DEFAULT 'CUSTOM' CHECK(optionValueType IN('BASE','CUSTOM')),
isVisible INTEGER DEFAULT 1 CHECK(isVisible IN(0,1)),
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
  OR tableCode GLOB '[A-Z0-9][A-Z0-9][A-Z0-9]'
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
paymentCode TEXT NOT NULL UNIQUE CHECK(length(paymentCode)=14),
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
  OR productCode GLOB '[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]'
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
  'pos_product_thumbnails',
  'productCode',
  'TEXT'
)

safeAddColumn(
  'pos_product_options',
  'productCode',
  'TEXT'
)

safeAddColumn(
  'pos_product_option_values',
  'productCode',
  'TEXT'
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
  "TEXT CHECK(tableCode IS NULL OR tableCode GLOB '[A-Z0-9][A-Z0-9][A-Z0-9]')"
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
  posLocationsTableSqlRow?.sql?.includes(`tableCode GLOB '[A-Z0-9][A-Z0-9][A-Z0-9]'`) ?? false

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
        OR tableCode GLOB '[A-Z0-9][A-Z0-9][A-Z0-9]'
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
  'TEXT'
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
UPDATE pos_products
SET productCode = 'P' || substr('000000' || id, -6, 6)
WHERE productCode IS NULL
`)

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
CREATE INDEX IF NOT EXISTS idx_pos_products_channel_product_code
ON pos_products(channelCode, productCode)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_products_channel_product_code_unique
ON pos_products(channelCode, productCode)
WHERE productCode IS NOT NULL
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

