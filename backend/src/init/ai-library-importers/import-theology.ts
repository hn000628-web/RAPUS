import path from 'path'
import Database from 'better-sqlite3'
import { addDryRunIssue, createDryRunResult, printDryRunResult } from './dry-run-utils'
import { AiImporterDryRunResult, AiImporterOptions } from './types'

export async function importTheologySnapshots(
  options:AiImporterOptions = { dryRun:true },
):Promise<AiImporterDryRunResult>{
  const dryRun = options.dryRun !== false
  const dbPath = path.resolve(__dirname, '../../../data/ai-library.sqlite')
  const db = new Database(dbPath, { readonly:true, fileMustExist:true })

  try{
    // TODO: source 등록/조회 로직 추가 (KOREAN_THEOLOGY, KOREAN_ONTOLOGY)
    // TODO: theology/ontology txt 스냅샷 파서 연결
    // TODO: doctrineType / stanceType 매핑 로직 추가
    // TODO: ai_theology_snapshots upsert 로직 추가
    // TODO: ai_interpretation_links(THEOLOGY_REFERENCE, WARNING, CONTRAST) 생성 로직 추가

    const countRow =
      db
        .prepare(`
          SELECT COUNT(*) AS count
          FROM ai_theology_snapshots
        `)
        .get() as { count:number }

    const result = createDryRunResult('THEOLOGY', dryRun, countRow.count)

    addDryRunIssue(
      result,
      'INFO',
      'TODO_PARSER_THEOLOGY',
      '신학/존재론 텍스트 스냅샷 parser 연결 필요',
    )

    addDryRunIssue(
      result,
      'INFO',
      'TODO_VALIDATE_THEOLOGY',
      'doctrineType/stanceType 분류 검증 로직 연결 필요',
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
