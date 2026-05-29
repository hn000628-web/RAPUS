import path from 'path'
import Database from 'better-sqlite3'
import { addDryRunIssue, createDryRunResult, printDryRunResult } from './dry-run-utils'
import { AiImporterDryRunResult, AiImporterOptions } from './types'

export async function importBibleLibrary(
  options:AiImporterOptions = { dryRun:true },
):Promise<AiImporterDryRunResult>{
  const dryRun = options.dryRun !== false
  const dbPath = path.resolve(__dirname, '../../../data/ai-library.sqlite')
  const db = new Database(dbPath, { readonly:true, fileMustExist:true })

  try{
    // TODO: source 등록/조회 로직 추가 (BIBLE_KO, BIBLE_KH, BIBLE_KJV)
    // TODO: bible_KO.json, bible_KO_with_source_id_FIXED.csv 파서 연결
    // TODO: bible_KH_ref_hanja_ratio_up.csv, kjv_with_source_id.csv 파서 연결
    // TODO: ai_bible_verses upsert 로직 추가 (UNIQUE: sourceId + verseKey)

    const countRow =
      db
        .prepare(`
          SELECT COUNT(*) AS count
          FROM ai_bible_verses
        `)
        .get() as { count:number }

    const result = createDryRunResult('BIBLE', dryRun, countRow.count)

    addDryRunIssue(
      result,
      'INFO',
      'TODO_PARSER_BIBLE',
      'bible_KO/KH/KJV parser 연결 필요',
    )

    addDryRunIssue(
      result,
      'INFO',
      'TODO_VALIDATE_BIBLE',
      'verseKey 중복/형식 검증 로직 연결 필요',
    )

    if(!dryRun){
      addDryRunIssue(
        result,
        'WARNING',
        'WRITE_DISABLED',
        '현재 버전은 dry-run skeleton 전용이며 DB write를 수행하지 않음',
      )
      result.status = 'SKIPPED'
    }

    printDryRunResult(result)
    return result
  } finally{
    db.close()
  }
}
