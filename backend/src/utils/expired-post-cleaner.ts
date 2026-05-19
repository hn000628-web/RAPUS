/* ==================================================
FILE : backend/src/tasks/expired-post-cleaner.task.ts
ROOT : C:\Users\kjm\social-platform\backend\src\tasks\expired-post-cleaner.task.ts

STATUS : MANUAL ADMIN ONLY

POLICY :

AUTO RUN 금지
SERVER START 금지
SCHEDULE 금지

ADMIN EXECUTION ONLY

================================================== */

import db from '../config/database'

/* ==========================================
만료 광고 조회
========================================== */

function findExpiredPosts(){

const now=
new Date().toISOString()

const posts=

db.prepare(`

SELECT id,expiresAt
FROM posts

WHERE

type='AD'
AND status='ACTIVE'
AND expiresAt IS NOT NULL
AND expiresAt < ?

`).all(now) as{

id:number
expiresAt:string

}[]

return posts

}

/* ==========================================
EXPIRED UPDATE
========================================== */

function expirePosts(

postIds:number[]

){

if(postIds.length===0){

console.log(
'만료 대상 없음'
)

return

}

const stmt=

db.prepare(`

UPDATE posts

SET status='EXPIRED'

WHERE id=?

`)

postIds.forEach(id=>{

stmt.run(id)

})

console.log(

`EXPIRED 처리 완료:
${postIds.length}`

)

}

/* ==========================================
ADMIN CLEANER
========================================== */

export function runExpiredPostCleaner(){

console.log(
'Admin expired post cleaner 실행'
)

const posts=
findExpiredPosts()

if(posts.length===0){

console.log(
'만료 광고 없음'
)

return

}

const ids=

posts.map(
p=>p.id
)

expirePosts(ids)

console.log(
'Admin expired cleaner 종료'
)

}