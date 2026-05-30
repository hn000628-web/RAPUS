import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

type TableName =
  | 'ai_library_sources'
  | 'ai_bible_verses'
  | 'ai_hanja_dictionary'
  | 'ai_korean_interpretation_terms'
  | 'ai_theology_snapshots'
  | 'ai_interpretation_links'
  | 'ai_library_embeddings'

type CountResult = { count:number }

type TableExistsRow = { ok?:number }

type DuplicateCountRow = { duplicateCount:number }

type CanonicalRatioRow = {
  total:number | null
  nullOrEmpty:number | null
}

type CanonicalRemainRow = { remainNullOrEmpty:number | null }

type InvalidCanonicalRow = {
  id:number
  sourceId:number
  verseKey:string
  canonicalKey:string | null
  bookCode:string | null
  chapter:number | null
  verse:number | null
}

const TABLES:TableName[] = [
  'ai_library_sources',
  'ai_bible_verses',
  'ai_hanja_dictionary',
  'ai_korean_interpretation_terms',
  'ai_theology_snapshots',
  'ai_interpretation_links',
  'ai_library_embeddings',
]

const CANONICAL_KEY_REGEX = /^[A-Z0-9]{3}\.\d+\.\d+$/

function pass(message:string){
  console.log(`[PASS] ${message}`)
}

function warn(message:string){
  console.warn(`[WARN] ${message}`)
}

function fail(message:string){
  console.error(`[FAIL] ${message}`)
}

// Checks if table has a column without changing table schema.
function hasColumn(db: Database.Database, table:string, column:string){
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name:string }[]
  return columns.some((row) => row.name === column)
}

// Checks if index exists in current sqlite schema.
function hasIndex(db: Database.Database, indexName:string){
  const row = db
    .prepare(`
      SELECT 1 AS ok
      FROM sqlite_master
      WHERE type='index'
        AND name=?
    `)
    .get(indexName) as TableExistsRow | undefined

  return Boolean(row)
}

function toNumber(value: unknown): number {
  if(value == null){
    return 0
  }

  return typeof value === 'number'
    ? value
    : Number(value) || 0
}

function normalizeCanonicalKey(value: string | null | undefined): string {
  if(value == null){
    return ''
  }

  return value.trim()
}

function isCanonicalKeyValid(value: string | null | undefined): boolean {
  const canonicalKey = normalizeCanonicalKey(value)
  return canonicalKey.length > 0 && CANONICAL_KEY_REGEX.test(canonicalKey)
}

function getCanonicalFillCandidate(row: InvalidCanonicalRow): string {
  const bookCode = (row.bookCode ?? '').trim()
  if(!bookCode || row.chapter == null || row.verse == null){
    return ''
  }

  return `${bookCode}.${row.chapter}.${row.verse}`
}

export async function checkAiLibraryDatabase(){

  console.log('===== AI LIBRARY SQLITE CHECK START =====')

  const dbPath = path.resolve(__dirname, '../../data/ai-library.sqlite')
  let hasError = false

  if(!fs.existsSync(dbPath)){
    fail(`DB file not found: ${dbPath}`)
    process.exit(1)
  }

  pass(`DB file exists: ${dbPath}`)

  // Writable open to support canonicalKey backfill.
  const db = new Database(dbPath, { fileMustExist:true })

  try{
    for(const tableName of TABLES){
      const exists =
        db
          .prepare(`
            SELECT 1 AS ok
            FROM sqlite_master
            WHERE type='table'
              AND name=?
          `)
          .get(tableName) as TableExistsRow | undefined

      if(!exists){
        hasError = true
        fail(`Table missing: ${tableName}`)
        continue
      }

      pass(`Table exists: ${tableName}`)

      const row =
        db
          .prepare(`SELECT COUNT(*) AS count FROM ${tableName}`)
          .get() as CountResult

      console.log(`  - rowCount(${tableName}) = ${row.count}`)
    }

    const duplicateSourceCodeRow =
      db
        .prepare(`
          SELECT COUNT(*) AS duplicateCount
          FROM (
            SELECT sourceCode
            FROM ai_library_sources
            GROUP BY sourceCode
            HAVING COUNT(*) > 1
          ) t
        `)
        .get() as DuplicateCountRow

    if(duplicateSourceCodeRow.duplicateCount > 0){
      hasError = true
      fail(`Duplicate sourceCode groups detected: ${duplicateSourceCodeRow.duplicateCount}`)
    } else{
      pass('Duplicate sourceCode check')
    }

    const duplicateVerseKeyRow =
      db
        .prepare(`
          SELECT COUNT(*) AS duplicateCount
          FROM (
            SELECT sourceId, verseKey
            FROM ai_bible_verses
            GROUP BY sourceId, verseKey
            HAVING COUNT(*) > 1
          ) t
        `)
        .get() as DuplicateCountRow

    if(duplicateVerseKeyRow.duplicateCount > 0){
      hasError = true
      fail(`Duplicate (sourceId, verseKey) groups detected: ${duplicateVerseKeyRow.duplicateCount}`)
    } else{
      pass('Duplicate (sourceId, verseKey) check')
    }

    const hasCanonicalKeyColumn = hasColumn(db, 'ai_bible_verses', 'canonicalKey')

    if(!hasCanonicalKeyColumn){
      hasError = true
      fail('Column missing: ai_bible_verses.canonicalKey')
    } else{
      pass('Column exists: ai_bible_verses.canonicalKey')
    }

    const hasCanonicalIndex = hasIndex(db, 'idx_ai_bible_verses_source_canonical_key')

    if(!hasCanonicalIndex){
      hasError = true
      fail('Index missing: idx_ai_bible_verses_source_canonical_key')
    } else{
      pass('Index exists: idx_ai_bible_verses_source_canonical_key')
    }

    const canonicalNullRow =
      db
        .prepare(`
          SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN canonicalKey IS NULL OR TRIM(canonicalKey)='' THEN 1 ELSE 0 END) AS nullOrEmpty
          FROM ai_bible_verses
        `)
        .get() as CanonicalRatioRow

    const totalCount = toNumber(canonicalNullRow.total)
    const nullCount = toNumber(canonicalNullRow.nullOrEmpty)
    const ratioText = totalCount > 0
      ? ` (${Math.round((nullCount / totalCount) * 100)}%)`
      : ' (0%)'

    console.log(`canonicalKey null/empty ratio = ${nullCount}/${totalCount}${ratioText}`)

    if(totalCount === 0){
      console.log('canonicalKey null/empty check skipped: no rows in ai_bible_verses')
    }

    if(nullCount > 0){
      if(!hasCanonicalKeyColumn){
        hasError = true
        fail('Skip canonicalKey backfill due to missing canonicalKey column')
      } else{
        warn(`canonicalKey null/blank rows detected: ${nullCount}`)

        const backfillCandidateRows = db
          .prepare(`
            SELECT COUNT(*) AS count
            FROM ai_bible_verses
            WHERE canonicalKey IS NULL OR TRIM(canonicalKey)=''
          `)
          .get() as { count:number }

        pass(`canonicalKey backfill candidate rows = ${backfillCandidateRows.count}`)

        const backfillResult =
          db
            .prepare(`
              UPDATE ai_bible_verses
              SET canonicalKey = CASE
                WHEN bookCode IS NOT NULL
                  AND TRIM(bookCode) <> ''
                  AND chapter IS NOT NULL
                  AND verse IS NOT NULL
                THEN printf('%s.%d.%d', bookCode, chapter, verse)
                ELSE canonicalKey
              END
              WHERE canonicalKey IS NULL OR TRIM(canonicalKey)=''
            `)
            .run()

        const remainingNullRow =
          db
            .prepare(`
              SELECT
                SUM(CASE WHEN canonicalKey IS NULL OR TRIM(canonicalKey)='' THEN 1 ELSE 0 END) AS remainNullOrEmpty
              FROM ai_bible_verses
            `)
            .get() as CanonicalRemainRow

        const remainingNullCount = toNumber(remainingNullRow.remainNullOrEmpty)
        pass(`canonicalKey backfill completed, updated rows = ${backfillResult.changes}`)

        if(remainingNullCount > 0){
          hasError = true
          fail(`canonicalKey still null/empty after backfill: ${remainingNullCount}`)
        } else{
          pass('canonicalKey null/empty check')
        }
      }
    } else{
      pass('canonicalKey null/empty check')
    }

    const canonicalRows = db
      .prepare(`
        SELECT id, sourceId, verseKey, canonicalKey, bookCode, chapter, verse
        FROM ai_bible_verses
      `)
      .all() as InvalidCanonicalRow[]

    const invalidFormatRows = canonicalRows.filter((row) => {
      if(!isCanonicalKeyValid(row.canonicalKey)){
        return true
      }
      return false
    })

    if(invalidFormatRows.length > 0){
      hasError = true
      fail(`canonicalKey format violation count: ${invalidFormatRows.length}`)
      console.log('Invalid canonicalKey examples:')
      invalidFormatRows.slice(0, 20).forEach((row) => {
        const canonicalKey = normalizeCanonicalKey(row.canonicalKey) || '<NULL/EMPTY>'
        const candidate = getCanonicalFillCandidate(row)
        console.log(`  id=${row.id}, sourceId=${row.sourceId}, verseKey=${row.verseKey}, canonicalKey=${canonicalKey}, fillCandidate=${candidate || '<EMPTY>'}`)
      })
      warn('canonicalKey format check failed')
    } else{
      pass('canonicalKey format check (^[A-Z0-9]{3}.\\d+.\\d+$)')
    }

    const duplicateCanonicalRow =
      db
        .prepare(`
          SELECT COUNT(*) AS duplicateCount
          FROM (
            SELECT sourceId, canonicalKey
            FROM ai_bible_verses
            WHERE canonicalKey IS NOT NULL AND TRIM(canonicalKey) <> ''
            GROUP BY sourceId, canonicalKey
            HAVING COUNT(*) > 1
          ) t
        `)
        .get() as DuplicateCountRow

    if(hasCanonicalKeyColumn && duplicateCanonicalRow.duplicateCount > 0){
      hasError = true
      fail(`Duplicate (sourceId, canonicalKey) groups detected: ${duplicateCanonicalRow.duplicateCount}`)
    } else{
      pass('Duplicate (sourceId, canonicalKey) check')
    }

    const invalidPrimaryRow =
      db
        .prepare(`
          SELECT COUNT(*) AS invalidCount
          FROM ai_library_sources
          WHERE isPrimary NOT IN (0,1)
             OR isPrimary IS NULL
        `)
        .get() as { invalidCount:number }

    if(invalidPrimaryRow.invalidCount > 0){
      hasError = true
      fail(`Invalid isPrimary value count: ${invalidPrimaryRow.invalidCount}`)
    } else{
      pass('isPrimary value domain check')
    }

    const invalidActiveRow =
      db
        .prepare(`
          SELECT COUNT(*) AS invalidCount
          FROM ai_library_sources
          WHERE isActive NOT IN (0,1)
             OR isActive IS NULL
        `)
        .get() as { invalidCount:number }

    if(invalidActiveRow.invalidCount > 0){
      hasError = true
      fail(`Invalid isActive value count: ${invalidActiveRow.invalidCount}`)
    } else{
      pass('isActive value domain check')
    }

  } finally{
    db.close()
  }

  if(hasError){
    console.error('===== AI LIBRARY SQLITE CHECK FAILED =====')
    process.exit(1)
  }

  console.log('===== AI LIBRARY SQLITE CHECK SUCCESS =====')
  process.exit(0)
}

checkAiLibraryDatabase().catch((error)=>{
  console.error('[FAIL] Unexpected check error')
  console.error(error)
  process.exit(1)
})
