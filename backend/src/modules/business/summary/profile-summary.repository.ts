// FILE : backend/src/modules/business/summary/business-summary.repository.ts
// ROOT : backend/src/modules/business/summary/business-summary.repository.ts

export class BusinessSummaryRepository {

static getSummary(db:any, profileId:number){

return db.prepare(`

SELECT bio
FROM profiles
WHERE id=?

LIMIT 1

`).get(profileId)

}

static updateSummary(
db:any,
profileId:number,
summary:string|null
){

db.prepare(`

UPDATE profiles

SET
bio=?,
updatedAt=datetime('now')

WHERE id=?

`).run(
summary,
profileId
)

}

}