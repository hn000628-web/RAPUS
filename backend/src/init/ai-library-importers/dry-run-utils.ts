import {
  AiImporterDryRunIssue,
  AiImporterDryRunIssueLevel,
  AiImporterDryRunResult,
  AiImporterSourceType,
} from './types'

export function createDryRunResult(
  importer:AiImporterSourceType,
  dryRun:boolean,
  currentCount:number,
):AiImporterDryRunResult{
  return {
    importer,
    dryRun,
    status:'READY',
    scannedRows:0,
    validRows:0,
    invalidRows:0,
    currentCount,
    issues:[],
    note:'TODO: parser/validator 미구현 (dry-run skeleton)',
  }
}

export function addDryRunIssue(
  result:AiImporterDryRunResult,
  level:AiImporterDryRunIssueLevel,
  code:string,
  message:string,
):AiImporterDryRunResult{
  const issue:AiImporterDryRunIssue = { level, code, message }
  result.issues.push(issue)
  if(level === 'ERROR'){
    result.status = 'INVALID'
  }
  return result
}

export function printDryRunResult(result:AiImporterDryRunResult){
  console.log(`[DRY-RUN] importer=${result.importer} status=${result.status} dryRun=${result.dryRun}`)
  console.log(`[DRY-RUN] scanned=${result.scannedRows} valid=${result.validRows} invalid=${result.invalidRows} currentCount=${result.currentCount}`)
  if(result.issues.length === 0){
    console.log('[DRY-RUN] issues=none')
    return
  }
  for(const issue of result.issues){
    console.log(`[DRY-RUN][${issue.level}] ${issue.code} ${issue.message}`)
  }
}
