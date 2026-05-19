/* ==================================================
FILE : backend/src/modules/regions/regions.repository.ts
SECTION CODE OUTPUT : REGIONS REPOSITORY FINAL STABLE
STATUS :
DB COLUMN MATCH
REGION TREE SAFE
SEARCH SAFE
GPS SAFE
PRODUCTION FINAL
================================================== */

export class RegionsRepository{

/* ==================================================
SECTION 01 PROFILE REGION LOAD
DB MATCH FINAL
================================================== */

static getProfileRegion(
db:any,
profileId:number
){

return db.prepare(`

SELECT

p.id,

p.activityRegionId,
p.feedRegionId,

p.detailAddress,   -- ★ 추가

ar.depth as activityRegionLevel,
ar.fullName as activityRegionFullName,
ar.countryCode as activityCountryCode,

fr.depth as feedRegionLevel,
fr.fullName as feedRegionFullName,
fr.countryCode as feedCountryCode

FROM profiles p

LEFT JOIN regions ar
ON ar.id=p.activityRegionId

LEFT JOIN regions fr
ON fr.id=p.feedRegionId

WHERE p.id=?

LIMIT 1

`).get(profileId)

}

/* ==================================================
SECTION 02 PROFILE REGION UPDATE
DB MATCH FINAL
================================================== */

static updateProfileRegion(
db:any,
data:any
){

db.prepare(`

UPDATE profiles

SET

activityRegionId=?,

feedRegionId=?,

detailAddress=?,   -- ★ 추가

updatedAt=datetime('now')

WHERE id=?

`).run(

data.activityRegionId??null,

data.feedRegionId??null,

data.detailAddress??null,   // ★ 추가

data.profileId

)

}

/* ==================================================
SECTION 03 FEED REGION UPDATE
================================================== */

static updateFeedRegion(

db:any,
profileId:number,
regionId:number

){

db.prepare(`

UPDATE profiles

SET

feedRegionId=?,
updatedAt=datetime('now')

WHERE id=?

`).run(

regionId,
profileId

)

}

/* ==================================================
SECTION 04 REGION TREE
================================================== */

static getRegionTree(
db:any,
regionId:number
){

return db.prepare(`

SELECT

d.id,

COALESCE(d.name,'') dong,

COALESCE(g.name,'') gu,

COALESCE(c.name,'') city,

COALESCE(d.fullName,d.name) fullName,

d.depth,
d.regionType,

d.countryCode

FROM regions d

LEFT JOIN regions g
ON d.parentId=g.id

LEFT JOIN regions c
ON g.parentId=c.id

WHERE

d.id=?
AND d.isActive=1

LIMIT 1

`).get(regionId)

}

/* ==================================================
SECTION 05 REGION SEARCH
================================================== */

static search(
db:any,
keyword:string|null|undefined
){

const clean=(keyword||'').trim()

if(!clean){

return db.prepare(`

SELECT

d.id,

COALESCE(d.name,'') dong,

COALESCE(g.name,'') gu,

COALESCE(c.name,'') city,

COALESCE(d.fullName,d.name) fullName,

d.depth,
d.regionType,
d.countryCode

FROM regions d

LEFT JOIN regions g
ON d.parentId=g.id

LEFT JOIN regions c
ON g.parentId=c.id

WHERE

d.isActive=1
AND d.depth>=3

ORDER BY

COALESCE(c.name,''),
COALESCE(g.name,''),
COALESCE(d.name,'')

LIMIT 50

`).all()

}

const k='%'+clean+'%'

return db.prepare(`

SELECT

d.id,

COALESCE(d.name,'') dong,

COALESCE(g.name,'') gu,

COALESCE(c.name,'') city,

COALESCE(d.fullName,d.name) fullName,

d.depth,
d.regionType,
d.countryCode

FROM regions d

LEFT JOIN regions g
ON d.parentId=g.id

LEFT JOIN regions c
ON g.parentId=c.id

WHERE

d.isActive=1

AND(

COALESCE(d.name,'') LIKE ?

OR COALESCE(d.fullName,'') LIKE ?

OR COALESCE(g.name,'') LIKE ?

OR COALESCE(c.name,'') LIKE ?

)

ORDER BY

COALESCE(c.name,''),
COALESCE(g.name,''),
COALESCE(d.name,'')

LIMIT 20

`).all(

k,
k,
k,
k

)

}

/* ==================================================
SECTION 06 GPS REGION
================================================== */

static findByGps(
db:any,
lat:number,
lng:number
){

return db.prepare(`

SELECT

d.id,

COALESCE(d.name,'') dong,

COALESCE(g.name,'') gu,

COALESCE(c.name,'') city,

d.latitude,
d.longitude,

COALESCE(d.fullName,d.name) fullName,

d.depth,
d.regionType,
d.countryCode

FROM regions d

LEFT JOIN regions g
ON d.parentId=g.id

LEFT JOIN regions c
ON g.parentId=c.id

WHERE

d.isActive=1

AND d.latitude IS NOT NULL
AND d.longitude IS NOT NULL

ORDER BY

(

(d.latitude-?)*(d.latitude-?)

+

(d.longitude-?)*(d.longitude-?)

)

LIMIT 1

`).get(

lat,
lat,
lng,
lng

)

}

}