export type AiImporterSourceType =
  | 'BIBLE'
  | 'HANJA'
  | 'THEOLOGY'

export type AiImporterDryRunStatus =
  | 'READY'
  | 'SKIPPED'
  | 'INVALID'
  | 'FAILED'

export type AiImporterDryRunIssueLevel =
  | 'INFO'
  | 'WARNING'
  | 'ERROR'

export interface AiImporterDryRunIssue{
  level:AiImporterDryRunIssueLevel
  code:string
  message:string
}

export interface AiImporterDryRunResult{
  importer:AiImporterSourceType
  dryRun:boolean
  status:AiImporterDryRunStatus
  scannedRows:number
  validRows:number
  invalidRows:number
  currentCount:number
  issues:AiImporterDryRunIssue[]
  note:string
}

export interface AiImporterOptions{
  dryRun?:boolean
}
