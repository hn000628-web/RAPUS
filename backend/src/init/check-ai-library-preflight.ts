import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { execSync } from 'child_process'
import { importBibleLibrary } from './ai-library-importers/import-bible'

type SourceRow = {
  sourceCode: string | null
  rowCount: number
}

function runCommand(command: string, cwd: string): { ok: boolean; output: string } {
  try {
    const output = execSync(command, {
      cwd,
      stdio: 'pipe',
      encoding: 'utf8',
    })
    return { ok: true, output }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, output: message }
  }
}

function tableExists(db: Database.Database, tableName: string): boolean {
  const row = db
    .prepare(`
      SELECT 1 AS ok
      FROM sqlite_master
      WHERE type='table'
        AND name=?
    `)
    .get(tableName) as { ok?: number } | undefined
  return Boolean(row?.ok)
}

async function main() {
  const root = path.resolve(__dirname, '../../..')
  const backendRoot = path.resolve(__dirname, '../..')
  const dbPath = path.resolve(__dirname, '../../data/ai-library.sqlite')

  const snapshotContextPath = path.resolve(root, '.context/AI_BIBLE_ETL_PRODUCTION_CHECKPOINT_SNAPSHOT_20260531.txt')
  const snapshotDocsPath = path.resolve(root, 'docs/AI_BIBLE_ETL_PRODUCTION_CHECKPOINT_SNAPSHOT_20260531.txt')
  const backupBeforePath = path.resolve(__dirname, '../../data/backups/ai-library.before-bible-full-import.20260531_034912.sqlite')
  const backupAfterPath = path.resolve(__dirname, '../../data/backups/ai-library.after-bible-full-import.20260531_040905.sqlite')

  const buildResult = runCommand('npm run build', backendRoot)
  const checkResult = runCommand('npm run db:check:ai', backendRoot)
  const dryRunResult = await importBibleLibrary({ dryRun: true, sampleLimit: 100 })

  const db = new Database(dbPath, { readonly: true })
  const totalBibleRows = Number(
    (db.prepare('SELECT COUNT(1) AS c FROM ai_bible_verses').get() as { c: number }).c,
  )
  const sourceDistribution = db
    .prepare(`
      SELECT s.sourceCode AS sourceCode, COUNT(1) AS rowCount
      FROM ai_bible_verses v
      LEFT JOIN ai_library_sources s ON s.id = v.sourceId
      GROUP BY s.sourceCode
      ORDER BY s.sourceCode
    `)
    .all() as SourceRow[]

  const canonicalNullOrEmpty = Number(
    (
      db
        .prepare(`
          SELECT COUNT(1) AS c
          FROM ai_bible_verses
          WHERE canonicalKey IS NULL OR LENGTH(canonicalKey)=0
        `)
        .get() as { c: number }
    ).c,
  )

  const duplicateSourceVerseKey = Number(
    (
      db
        .prepare(`
          SELECT COUNT(1) AS c
          FROM (
            SELECT sourceId, verseKey, COUNT(1) AS cc
            FROM ai_bible_verses
            GROUP BY sourceId, verseKey
            HAVING cc > 1
          ) t
        `)
        .get() as { c: number }
    ).c,
  )

  const duplicateSourceCanonicalKey = Number(
    (
      db
        .prepare(`
          SELECT COUNT(1) AS c
          FROM (
            SELECT sourceId, canonicalKey, COUNT(1) AS cc
            FROM ai_bible_verses
            GROUP BY sourceId, canonicalKey
            HAVING cc > 1
          ) t
        `)
        .get() as { c: number }
    ).c,
  )

  const canonicalSearchRows = db
    .prepare(`
      SELECT s.sourceCode AS sourceCode, v.canonicalKey AS canonicalKey, v.bookName AS bookName
      FROM ai_bible_verses v
      LEFT JOIN ai_library_sources s ON s.id = v.sourceId
      WHERE v.canonicalKey = 'GEN.1.1'
      ORDER BY s.sourceCode
    `)
    .all() as Array<{ sourceCode: string | null; canonicalKey: string; bookName: string | null }>

  const inferenceTables = ['ai_knowledge_tokens', 'ai_interpretation_links', 'ai_library_embeddings'] as const
  const inferenceReadiness = inferenceTables.map((tableName) => {
    const exists = tableExists(db, tableName)
    const rowCount = exists
      ? Number((db.prepare(`SELECT COUNT(1) AS c FROM ${tableName}`).get() as { c: number }).c)
      : null
    return { tableName, exists, rowCount }
  })

  const knowledgeTokensExists = tableExists(db, 'ai_knowledge_tokens')
  const knowledgeTokensDiagnostics = knowledgeTokensExists
    ? {
        rowCount: Number((db.prepare('SELECT COUNT(1) AS c FROM ai_knowledge_tokens').get() as { c: number }).c),
        duplicateUniqueEntryCount: Number(
          (
            db
              .prepare(`
                SELECT COUNT(1) AS c
                FROM (
                  SELECT targetType, targetId, tokenType, normalizedToken, position, COUNT(1) AS cc
                  FROM ai_knowledge_tokens
                  GROUP BY targetType, targetId, tokenType, normalizedToken, position
                  HAVING cc > 1
                ) t
              `)
              .get() as { c: number }
          ).c,
        ),
      }
    : {
        rowCount: 0,
        duplicateUniqueEntryCount: null as number | null,
      }

  db.close()

  const sourceFileNotFound = dryRunResult.issues.filter((issue) => issue.code === 'SOURCE_FILE_NOT_FOUND').length

  const report = {
    checkpoint: {
      snapshotContextExists: fs.existsSync(snapshotContextPath),
      snapshotDocsExists: fs.existsSync(snapshotDocsPath),
      backupBeforeExists: fs.existsSync(backupBeforePath),
      backupAfterExists: fs.existsSync(backupAfterPath),
    },
    verify: {
      buildOk: buildResult.ok,
      dbCheckOk: checkResult.ok,
    },
    dryRunSample100: {
      status: dryRunResult.status,
      scannedRows: dryRunResult.scannedRows,
      validRows: dryRunResult.validRows,
      invalidRows: dryRunResult.invalidRows,
      sourceFileNotFound,
    },
    bibleDistribution: {
      totalBibleRows,
      sourceDistribution,
      canonicalNullOrEmpty,
      duplicateSourceVerseKey,
      duplicateSourceCanonicalKey,
    },
    codexInferenceReady: {
      canonicalSearchRows,
      inferenceReadiness,
      knowledgeTokensDiagnostics,
      strongGreekHebrewMapping: 'PENDING',
    },
  }

  console.log('===== AI LIBRARY PREFLIGHT REPORT =====')
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error('[FAIL] preflight error:', message)
  process.exit(1)
})
