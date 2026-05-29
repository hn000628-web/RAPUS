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

const TABLES:TableName[] = [
  'ai_library_sources',
  'ai_bible_verses',
  'ai_hanja_dictionary',
  'ai_korean_interpretation_terms',
  'ai_theology_snapshots',
  'ai_interpretation_links',
  'ai_library_embeddings',
]

function pass(message:string){
  console.log(`[PASS] ${message}`)
}

function fail(message:string){
  console.error(`[FAIL] ${message}`)
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

  const db = new Database(dbPath, { readonly:true, fileMustExist:true })

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
          .get(tableName) as { ok?:number } | undefined

      if(!exists){
        hasError = true
        fail(`Table missing: ${tableName}`)
        continue
      }

      pass(`Table exists: ${tableName}`)

      const row =
        db
          .prepare(`SELECT COUNT(*) AS count FROM ${tableName}`)
          .get() as { count:number }

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
        .get() as { duplicateCount:number }

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
        .get() as { duplicateCount:number }

    if(duplicateVerseKeyRow.duplicateCount > 0){
      hasError = true
      fail(`Duplicate (sourceId, verseKey) groups detected: ${duplicateVerseKeyRow.duplicateCount}`)
    } else{
      pass('Duplicate (sourceId, verseKey) check')
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
