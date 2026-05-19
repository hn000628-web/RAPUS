/* ==================================================
FILE : backend/src/tasks/orphan-image-cleaner.ts
ROOT : C:\Users\kjm\social-platform\backend\src\tasks\orphan-image-cleaner.ts
STATUS : FINAL MEDIA LIFECYCLE SAFE (Manual Only)
FIX :
- 서버 자동 실행 제거
- isUsed flag 검사
- multi reference 검사
- false delete zero
- production safe
================================================== */

import db from '../config/database'
import * as fs from 'fs'
import * as path from 'path'

/* ==================================================
UPLOAD ROOT
================================================== */
const uploadRoot = path.join(process.cwd(), 'uploads')

/* ==================================================
RUN GUARD
================================================== */
let running = false

/* ==================================================
FILE COLLECTOR
================================================== */
function collectFiles(dir: string, list: string[] = []) {
  let entries: string[]
  try {
    entries = fs.readdirSync(dir)
  } catch {
    return list
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry)
    let stat
    try {
      stat = fs.statSync(fullPath)
    } catch {
      continue
    }

    if (stat.isDirectory()) {
      collectFiles(fullPath, list)
    } else if (stat.isFile()) {
      list.push(fullPath)
    }
  }

  return list
}

/* ==================================================
SAFE DB REFERENCES
================================================== */
function loadDbImages() {
  const rows = db
    .prepare(`
      SELECT filePath FROM image_assets WHERE isUsed=1
      UNION
      SELECT filePath FROM profile_avatars
      UNION
      SELECT filePath FROM media_variants
    `)
    .all() as { filePath: string }[]

  const set = new Set<string>()

  for (const r of rows) {
    if (!r.filePath) continue

    const abs = path.join(process.cwd(), 'uploads', r.filePath)
    set.add(abs)
  }

  return set
}

/* ==================================================
ORPHAN CLEAN
================================================== */
export function cleanOrphanImages() {
  if (running) return
  running = true

  try {
    if (!fs.existsSync(uploadRoot)) return

    const files = collectFiles(uploadRoot)
    const dbImages = loadDbImages()
    let deleted = 0

    for (const f of files) {
      if (!dbImages.has(f)) {
        try {
          fs.unlinkSync(f)
          deleted++
        } catch {}
      }
    }

    if (deleted > 0) {
      console.log(`🧹 orphan images cleaned: ${deleted}`)
    }
  } catch (err) {
    console.error('orphan cleaner error', err)
  } finally {
    running = false
  }
}

/* ==================================================
MANUAL START ONLY
================================================== */
// 서버 자동 실행 제거
// 이제 관리자 페이지 API 호출 시 cleanOrphanImages() 실행