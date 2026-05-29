import path from 'path'
import Database from 'better-sqlite3'
import { addDryRunIssue, createDryRunResult, printDryRunResult } from './dry-run-utils'
import { AiImporterDryRunResult, AiImporterOptions } from './types'

export async function importHanjaDictionary(
  options:AiImporterOptions = { dryRun:true },
):Promise<AiImporterDryRunResult>{
  const dryRun = options.dryRun !== false
  const dbPath = path.resolve(__dirname, '../../../data/ai-library.sqlite')
  const db = new Database(dbPath, { readonly:true, fileMustExist:true })

  try{
    // TODO: source 등록/조회 로직 추가 (HANJA_DICT)
    // TODO: HANJA_DICT_1_4_FINAL_ANCHORED.csv 파서 연결
    // TODO: 원본_hanja_1S_5978.csv 파서 연결
    // TODO: ai_hanja_dictionary upsert 로직 추가
    // TODO: ai_korean_interpretation_terms(HANJA_TERM) 생성 로직 추가

    const countRow =
      db
        .prepare(`
          SELECT COUNT(*) AS count
          FROM ai_hanja_dictionary
        `)
        .get() as { count:number }

    const result = createDryRunResult('HANJA', dryRun, countRow.count)

    addDryRunIssue(
      result,
      'INFO',
      'TODO_PARSER_HANJA',
      'HANJA_DICT/원본 한자 CSV parser 연결 필요',
    )

    addDryRunIssue(
      result,
      'INFO',
      'TODO_VALIDATE_HANJA',
      '한자어/훈음/획수 필드 검증 로직 연결 필요',
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
