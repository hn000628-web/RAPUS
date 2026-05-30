import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { addDryRunIssue, createDryRunResult, printDryRunResult } from './dry-run-utils'
import { AiImporterDryRunIssue, AiImporterDryRunResult, AiImporterOptions } from './types'

// ==================================================
// SECTION 00: TYPE / REGEX / CONSTANTS
// ==================================================

type BibleImportSourceCode = 'BIBLE_KO' | 'BIBLE_KJV' | 'BIBLE_KH'
type BibleImporterOptions = AiImporterOptions & { sampleLimit?: number }

type BibleImportRow = {
  bookCode: string
  bookName: string
  chapter: number
  verse: number
  verseText: string
  sourceCode: BibleImportSourceCode
  sourceIdText?: string
  sourceName?: string
  languageCode?: string
  versionCode?: string
  normalizedText?: string
  canonicalKey?: string
}

const CANONICAL_REGEX = /^[A-Z0-9]{3}\.\d+\.\d+$/
const PROJECT_ROOT = path.resolve(__dirname, '../../../..')
const BIBLE_DATA_BASE_DIR = path.resolve(__dirname, '../../../data')
const BIBLE_CONTEXT_DIR = path.join(PROJECT_ROOT, '.context', 'knowledge', 'bible')
const BIBLE_SOURCE_PATHS: Record<BibleImportSourceCode, string[]> = {
  BIBLE_KO: [
    'bible_KO.json',
    'bible/bible_ko.json',
    'knowledge/bible/ko.json',
    'knowledge/bible_ko.json',
    path.join(BIBLE_CONTEXT_DIR, 'bible_KO.json'),
    path.join(BIBLE_CONTEXT_DIR, 'bible_KO_with_source_id_FIXED.csv'),
  ],
  BIBLE_KJV: [
    'kjv_with_source_id.csv',
    'bible/kjv_with_source_id.csv',
    'knowledge/bible/kjv.json',
    path.join(BIBLE_CONTEXT_DIR, 'kjv_with_source_id.csv'),
  ],
  BIBLE_KH: [
    'bible_KH_ref_hanja_ratio_up.csv',
    'bible/bible_kh_ref_hanja_ratio_up.csv',
    'knowledge/bible_kh_ref_hanja_ratio_up.csv',
    path.join(BIBLE_CONTEXT_DIR, 'bible_KH_ref_hanja_ratio_up.csv'),
  ],
}

type RawBibleRecord = Record<string, unknown>

type ParsedCsvLine = string[]

type VerseCoordinate = {
  bookCode: string
  chapter: number
  verse: number
}

type KnowledgeTokenType =
  | 'bible_ref'
  | 'korean'
  | 'english'
  | 'hanja'
  | 'topic'
  | 'strong'
  | 'greek'
  | 'hebrew'

type KnowledgeTokenRow = {
  targetType: 'BIBLE_VERSE'
  targetId: number
  sourceType: BibleImportSourceCode
  sourceId: number
  canonicalKey: string
  tokenType: KnowledgeTokenType
  token: string
  normalizedToken: string
  position: number
  weight: number
}

const SOURCE_METADATA: Record<BibleImportSourceCode, { sourceType: BibleImportSourceCode; sourceName: string; languageCode: string }> = {
  BIBLE_KO: {
    sourceType: 'BIBLE_KO',
    sourceName: 'Bible KO',
    languageCode: 'ko',
  },
  BIBLE_KH: {
    sourceType: 'BIBLE_KH',
    sourceName: 'Bible KH',
    languageCode: 'ko',
  },
  BIBLE_KJV: {
    sourceType: 'BIBLE_KJV',
    sourceName: 'Bible KJV',
    languageCode: 'en',
  },
}

const BOOK_CODE_MAP: Record<string, string> = {
  // Korean abbreviations
  창: 'GEN',
  출: 'EXO',
  레: 'LEV',
  민: 'NUM',
  신: 'DEU',
  수: 'JOS',
  삿: 'JDG',
  룻: 'RUT',
  삼상: '1SA',
  삼하: '2SA',
  왕상: '1KI',
  왕하: '2KI',
  대상: '1CH',
  대하: '2CH',
  스: 'EZR',
  느: 'NEH',
  에: 'EST',
  욥: 'JOB',
  시: 'PSA',
  잠: 'PRO',
  전: 'ECC',
  아: 'SNG',
  사: 'ISA',
  렘: 'JER',
  애: 'LAM',
  겔: 'EZK',
  단: 'DAN',
  호: 'HOS',
  욜: 'JOL',
  암: 'AMO',
  옵: 'OBA',
  욘: 'JON',
  미: 'MIC',
  나: 'NAM',
  합: 'HAB',
  습: 'ZEP',
  학: 'HAG',
  슥: 'ZEC',
  말: 'MAL',
  마: 'MAT',
  막: 'MRK',
  눅: 'LUK',
  요: 'JHN',
  행: 'ACT',
  롬: 'ROM',
  고전: '1CO',
  고후: '2CO',
  갈: 'GAL',
  엡: 'EPH',
  빌: 'PHP',
  골: 'COL',
  살전: '1TH',
  살후: '2TH',
  딤전: '1TI',
  딤후: '2TI',
  딛: 'TIT',
  몬: 'PHM',
  히: 'HEB',
  약: 'JAS',
  벧전: '1PE',
  벧후: '2PE',
  요일: '1JN',
  요이: '2JN',
  요삼: '3JN',
  유: 'JUD',
  계: 'REV',
  // English names
  genesis: 'GEN',
  exodus: 'EXO',
  leviticus: 'LEV',
  numbers: 'NUM',
  deuteronomy: 'DEU',
  joshua: 'JOS',
  judges: 'JDG',
  ruth: 'RUT',
  '1samuel': '1SA',
  '2samuel': '2SA',
  '1kings': '1KI',
  '2kings': '2KI',
  '1chronicles': '1CH',
  '2chronicles': '2CH',
  ezra: 'EZR',
  nehemiah: 'NEH',
  esther: 'EST',
  job: 'JOB',
  psalms: 'PSA',
  proverbs: 'PRO',
  ecclesiastes: 'ECC',
  songofsolomon: 'SNG',
  isaiah: 'ISA',
  jeremiah: 'JER',
  lamentations: 'LAM',
  ezekiel: 'EZK',
  daniel: 'DAN',
  hosea: 'HOS',
  joel: 'JOL',
  amos: 'AMO',
  obadiah: 'OBA',
  jonah: 'JON',
  micah: 'MIC',
  nahum: 'NAM',
  habakkuk: 'HAB',
  zephaniah: 'ZEP',
  haggai: 'HAG',
  zechariah: 'ZEC',
  malachi: 'MAL',
  matthew: 'MAT',
  mark: 'MRK',
  luke: 'LUK',
  john: 'JHN',
  acts: 'ACT',
  romans: 'ROM',
  '1corinthians': '1CO',
  '2corinthians': '2CO',
  galatians: 'GAL',
  ephesians: 'EPH',
  philippians: 'PHP',
  colossians: 'COL',
  '1thessalonians': '1TH',
  '2thessalonians': '2TH',
  '1timothy': '1TI',
  '2timothy': '2TI',
  titus: 'TIT',
  philemon: 'PHM',
  hebrews: 'HEB',
  james: 'JAS',
  '1peter': '1PE',
  '2peter': '2PE',
  '1john': '1JN',
  '2john': '2JN',
  '3john': '3JN',
  jude: 'JUD',
  revelation: 'REV',
}

// ==================================================
// SECTION 01: HELPERS
// ==================================================

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
}

function normalizeToken(value: string): string {
  return normalizeText(value).toLowerCase()
}

function normalizeSourceCode(value: string): BibleImportSourceCode | null {
  const code = normalizeText(value).toUpperCase() as BibleImportSourceCode
  return code === 'BIBLE_KO' || code === 'BIBLE_KJV' || code === 'BIBLE_KH'
    ? code
    : null
}

function isCanonicalKeyValid(value: string | null | undefined): boolean {
  const target = normalizeText(value)
  return target.length > 0 && CANONICAL_REGEX.test(target)
}

function normalizeCanonicalKeyValue(value: string | null | undefined): string {
  const raw = normalizeText(value)
  if (!raw) return ''

  const parsed = parseVerseCoordinate(raw) ?? parseKoreanRefCoordinate(raw)
  if (parsed) {
    return `${parsed.bookCode}.${parsed.chapter}.${parsed.verse}`
  }

  // GEN_01_01 / GEN:1:1 / gen 1 1 -> GEN.1.1
  const normalized = raw
    .replace(/[:_]/g, '.')
    .replace(/\s+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\./, '')
    .replace(/\.$/, '')

  const match = normalized.match(/^([A-Za-z0-9]{3})\.(\d+)\.(\d+)$/)
  if (!match) return raw

  return `${normalizeBookCode(match[1])}.${Number(match[2])}.${Number(match[3])}`
}

function buildCanonicalKey(row: BibleImportRow): string {
  const rawBookCode = normalizeText(row.bookCode).toUpperCase()
  const chapter = Number(row.chapter)
  const verse = Number(row.verse)
  return `${rawBookCode}.${chapter}.${verse}`
}

function normalizeBookCode(value: string): string {
  const raw = normalizeText(value)
  if (!raw) return ''
  if (/^[A-Z0-9]{3}$/.test(raw.toUpperCase())) return raw.toUpperCase()
  const compact = raw.toLowerCase().replace(/[\s._-]/g, '')
  return BOOK_CODE_MAP[compact] ?? raw.toUpperCase()
}

function addImporterIssue(
  result: AiImporterDryRunResult,
  issue: AiImporterDryRunIssue,
): void {
  addDryRunIssue(result, issue.level, issue.code, issue.message)
}

// ==================================================
// SECTION 02: SOURCE LOADERS
// ==================================================

function resolveBibleSourceCandidates(sourceCode: BibleImportSourceCode): string[] {
  return BIBLE_SOURCE_PATHS[sourceCode]
    .map(fileName => path.resolve(BIBLE_DATA_BASE_DIR, fileName))
    .filter(Boolean)
}

function splitCsvLine(line: string, delimiter: string = ','): ParsedCsvLine {
  const columns: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    const next = line[index + 1]
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === delimiter && !inQuotes) {
      columns.push(current)
      current = ''
      continue
    }
    current += char
  }
  columns.push(current)
  return columns.map(value => value.trim())
}

function parseJsonRowsFromFile(filePath: string): RawBibleRecord[] {
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
  const parsed = JSON.parse(content)

  if (Array.isArray(parsed)) {
    return parsed as RawBibleRecord[]
  }

  if (parsed && typeof parsed === 'object') {
    const source = parsed as { verses?: RawBibleRecord[]; data?: RawBibleRecord[]; rows?: RawBibleRecord[] }
    if (Array.isArray(source.verses)) return source.verses
    if (Array.isArray(source.data)) return source.data
    if (Array.isArray(source.rows)) return source.rows

    // Supports top-level object map format:
    // { "창1:1": "본문", "창1:2": "본문" }
    const asRecord = parsed as Record<string, unknown>
    return Object.entries(asRecord)
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => ({
        refKey: key,
        text: String(value),
      }))
  }

  throw new Error(`Unsupported JSON structure: ${filePath}`)
}

function parseCsvRowsFromFile(filePath: string): RawBibleRecord[] {
  const content = fs.readFileSync(filePath, 'utf8').trim()
  if (!content) return []

  const lines = content.split(/\r?\n/)
  if (lines.length === 0) return []

  const delimiter = lines[0].includes('\t') ? '\t' : ','
  const header = splitCsvLine(lines[0], delimiter).map(value => normalizeText(value))
  const records: RawBibleRecord[] = []

  const keyByIndex = (keyIndex: number) => header[keyIndex] || `column_${keyIndex}`

  for (let index = 1; index < lines.length; index++) {
    const line = lines[index]
    if (!line.trim()) continue

    const values = splitCsvLine(line, delimiter)
    const record: RawBibleRecord = {}
    header.forEach((headerKey, columnIndex) => {
      record[headerKey] = values[columnIndex] ?? ''
      record[keyByIndex(columnIndex)] = values[columnIndex] ?? ''
    })
    records.push(record)
  }
  return records
}

function normalizeRecordKey(value: RawBibleRecord, fallbackKeys: string[]): string {
  if (typeof value === 'string') {
    return normalizeText(value)
  }
  const valueByFallback = fallbackKeys
    .map(key => {
      const keyNormalized = key.toLowerCase()
      const raw =
        value[key] ??
        value[keyNormalized] ??
        value[key.toUpperCase()] ??
        value[`${keyNormalized}_`] ??
        value[key.replace(/_/g, '').toUpperCase()] ??
        value[key.replace(/_/g, '')] ??
        value[keyNormalized.replace(/_/g, '')]
      return typeof raw === 'string' ? normalizeText(raw) : ''
    })
    .find(item => item.length > 0)
  return valueByFallback ?? ''
}

function normalizeNumberField(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const normalized = normalizeText(typeof value === 'string' ? value : String(value ?? ''))
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : NaN
}

function mapRecordToBibleRow(
  sourceCode: BibleImportSourceCode,
  record: RawBibleRecord,
): BibleImportRow | null {
  const recordForMapping = record as Record<string, unknown> & { sourceCode?: string; sourceName?: string }
  const verseKey = normalizeRecordKey(recordForMapping, ['VERSE_KEY', 'verseKey', 'verse_key', 'refKey', 'ref', 'key'])
  const sourceIdText = normalizeRecordKey(recordForMapping, ['SOURCE_ID', 'sourceId', 'source_id'])
  let bookCodeRaw = normalizeRecordKey(recordForMapping, ['bookCode', 'book_code', 'book', 'bookcode'])
  let bookName = normalizeRecordKey(recordForMapping, ['bookName', 'book_name', 'bookname', 'name', 'book'])
  let chapterValue = normalizeRecordKey(recordForMapping, ['chapter', 'chap', 'chapterNum'])
  let verseValue = normalizeRecordKey(recordForMapping, ['verse', 'verseNum', 'verse_number'])
  const verseText = normalizeRecordKey(recordForMapping, [
    'verseText',
    'verse_text',
    'text',
    'content',
    'contentText',
    'sentence',
  ])

  const parsedFromKey = parseVerseCoordinate(verseKey)
  if (parsedFromKey) {
    if (!bookCodeRaw) bookCodeRaw = parsedFromKey.bookCode
    if (!chapterValue) chapterValue = String(parsedFromKey.chapter)
    if (!verseValue) verseValue = String(parsedFromKey.verse)
  }

  const parsedFromKoreanRef = parseKoreanRefCoordinate(verseKey)
  if (parsedFromKoreanRef) {
    if (!bookCodeRaw) bookCodeRaw = parsedFromKoreanRef.bookCode
    if (!bookName) bookName = parsedFromKoreanRef.bookName
    if (!chapterValue) chapterValue = String(parsedFromKoreanRef.chapter)
    if (!verseValue) verseValue = String(parsedFromKoreanRef.verse)
  }

  const bookCode = normalizeBookCode(bookCodeRaw)
  const chapter = normalizeNumberField(chapterValue)
  const verse = normalizeNumberField(verseValue)

  if (!bookName) bookName = bookCode

  if (!bookCode || !bookName || !Number.isFinite(chapter) || !Number.isFinite(verse) || !verseText) {
    return null
  }

  const canonicalKey = normalizeRecordKey(recordForMapping, ['canonicalKey', 'canonical_key', 'key']) || `${bookCode}.${chapter}.${verse}`

  return {
    bookCode,
    bookName,
    chapter,
    verse,
    verseText,
    sourceCode,
    sourceIdText: sourceIdText || undefined,
    sourceName: normalizeRecordKey(recordForMapping, ['sourceName', 'source_name']),
    languageCode: normalizeRecordKey(recordForMapping, ['languageCode', 'language_code', 'lang']).toLowerCase() || undefined,
    versionCode: normalizeRecordKey(recordForMapping, ['versionCode', 'version_code', 'version']),
    normalizedText: normalizeRecordKey(recordForMapping, ['normalizedText', 'normalized_text']),
    canonicalKey,
  }
}

function parseVerseCoordinate(value: string): VerseCoordinate | null {
  const normalized = normalizeText(value)
  if (!normalized) return null

  const underscoreMatch = normalized.match(/^([A-Za-z0-9]{3})[_\-.](\d{1,3})[_\-.](\d{1,3})$/)
  if (underscoreMatch) {
    return {
      bookCode: normalizeBookCode(underscoreMatch[1]),
      chapter: Number(underscoreMatch[2]),
      verse: Number(underscoreMatch[3]),
    }
  }
  return null
}

function parseKoreanRefCoordinate(value: string): (VerseCoordinate & { bookName: string }) | null {
  const normalized = normalizeText(value)
  if (!normalized) return null
  const match = normalized.match(/^([가-힣]{1,3})(\d+):([0-9가-힣]+)(?:-([0-9가-힣]+))?$/)
  if (!match) return null

  const bookName = match[1]
  const chapter = Number(match[2])
  const verseStart = parseKoreanNumericToken(match[3])
  if (!Number.isFinite(chapter) || chapter < 1 || !Number.isFinite(verseStart) || verseStart < 1) {
    return null
  }

  return {
    bookName,
    bookCode: normalizeBookCode(bookName),
    chapter,
    // range syntax like 신6:18-19 uses the start verse as canonical coordinate.
    verse: verseStart,
  }
}

function parseKoreanNumericToken(value: string): number {
  const token = normalizeText(value)
  if (!token) return NaN
  if (/^\d+$/.test(token)) return Number(token)

  const unitMap: Record<string, number> = {
    일: 1,
    이: 2,
    삼: 3,
    사: 4,
    오: 5,
    육: 6,
    칠: 7,
    팔: 8,
    구: 9,
  }

  if (token === '십') return 10
  if (unitMap[token] != null) return unitMap[token]

  const tenPrefix = token.match(/^([일이삼사오육칠팔구])십$/)
  if (tenPrefix) {
    return unitMap[tenPrefix[1]] * 10
  }

  const tenCompound = token.match(/^([일이삼사오육칠팔구])십([일이삼사오육칠팔구])$/)
  if (tenCompound) {
    return unitMap[tenCompound[1]] * 10 + unitMap[tenCompound[2]]
  }

  return NaN
}

function resolveCanonicalKey(
  row: BibleImportRow,
  result: AiImporterDryRunResult,
): string {
  const rowCanonical = normalizeCanonicalKeyValue(row.canonicalKey ?? '')
  const builtCanonical = buildCanonicalKey(row)

  if (!rowCanonical) {
    addImporterIssue(result, {
      level: 'WARNING',
      code: 'EMPTY_CANONICAL_KEY',
      message: `canonicalKey is empty. Fallback to generated key: ${builtCanonical}`,
    })
    return builtCanonical
  }

  if (!isCanonicalKeyValid(rowCanonical)) {
    addImporterIssue(result, {
      level: 'WARNING',
      code: 'INVALID_CANONICAL_KEY',
      message: `Invalid canonicalKey format: ${rowCanonical} (source=${row.sourceCode}), fallback to generated key: ${builtCanonical}`,
    })
    return builtCanonical
  }

  return rowCanonical
}

function parseSourceFile(
  sourceCode: BibleImportSourceCode,
  filePath: string,
  result: AiImporterDryRunResult,
): BibleImportRow[] {
  const ext = path.extname(filePath).toLowerCase()
  const fileSize = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
  const rows: BibleImportRow[] = []
  let rawRows: RawBibleRecord[] = []

  if (fileSize === 0) {
    addImporterIssue(result, {
      level: 'WARNING',
      code: 'EMPTY_SOURCE_FILE',
      message: `source file is empty: ${filePath}`,
    })
    return rows
  }

  try {
    if (ext === '.json') {
      rawRows = parseJsonRowsFromFile(filePath)
    } else if (ext === '.csv') {
      rawRows = parseCsvRowsFromFile(filePath)
    } else {
      addImporterIssue(result, {
        level: 'WARNING',
        code: 'UNSUPPORTED_SOURCE_FILE_FORMAT',
        message: `Unsupported source file format: ${filePath}`,
      })
      return rows
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    addImporterIssue(result, {
      level: 'WARNING',
      code: 'SOURCE_PARSE_ERROR',
      message: `Failed to parse source file: ${filePath} / ${message}`,
    })
    return rows
  }

  if (rawRows.length === 0) {
    addImporterIssue(result, {
      level: 'WARNING',
      code: 'NO_SOURCE_ROWS',
      message: `Source file has no rows: ${filePath}`,
    })
    return rows
  }

  let invalidCount = 0
  for (const [index, record] of rawRows.entries()) {
    const row = mapRecordToBibleRow(sourceCode, { ...record, sourceCode })
    if (!row) {
      invalidCount += 1
      addImporterIssue(result, {
        level: 'WARNING',
        code: 'INVALID_SOURCE_RECORD',
        message: `Invalid source record in ${sourceCode}: row=${index + 1}, file=${filePath}`,
      })
      continue
    }
    rows.push(row)
  }

  addImporterIssue(result, {
    level: 'INFO',
    code: 'SOURCE_ROWS_LOADED',
    message: `${sourceCode} loaded: candidates=${rows.length} (from ${rawRows.length}), file=${filePath}`,
  })

  if (invalidCount > 0) {
    addImporterIssue(result, {
      level: 'WARNING',
      code: 'SOURCE_RECORD_PARTIAL_DROP',
      message: `Dropped invalid records: source=${sourceCode}, file=${filePath}, dropped=${invalidCount}`,
    })
  }

  return rows
}

function collectBibleRowsForSource(
  sourceCode: BibleImportSourceCode,
  result: AiImporterDryRunResult,
): BibleImportRow[] {
  const candidatePaths = resolveBibleSourceCandidates(sourceCode)
  const existingPaths = candidatePaths.filter(filePath => fs.existsSync(filePath))

  if (existingPaths.length === 0) {
    addImporterIssue(result, {
      level: 'WARNING',
      code: 'SOURCE_FILE_NOT_FOUND',
      message: `No source file found for ${sourceCode}. checked=${candidatePaths.join(', ')}`,
    })
    return []
  }

  const rows: BibleImportRow[] = []
  for (const sourcePath of existingPaths) {
    rows.push(...parseSourceFile(sourceCode, sourcePath, result))
  }
  return rows
}

function loadBibleRowsFromSource(result: AiImporterDryRunResult): BibleImportRow[] {
  const rows: BibleImportRow[] = []
  const sourceCodes: BibleImportSourceCode[] = ['BIBLE_KO', 'BIBLE_KH', 'BIBLE_KJV']

  for (const sourceCode of sourceCodes) {
    rows.push(...collectBibleRowsForSource(sourceCode, result))
  }

  return rows
}

// ==================================================
// SECTION 03: SOURCE LOOKUP / UPSERT
// ==================================================

function ensureSourceId(db: Database.Database, sourceCode: BibleImportSourceCode): number {
  const row = db.prepare(`SELECT id FROM ai_library_sources WHERE sourceCode = ? LIMIT 1`).get(sourceCode) as { id?: number } | undefined

  if (row?.id != null) {
    return row.id
  }

  const meta = SOURCE_METADATA[sourceCode]

  const inserted = db
    .prepare(`
      INSERT INTO ai_library_sources(
        sourceCode,
        sourceType,
        sourceName,
        languageCode,
        isPrimary,
        isActive
      )
      VALUES(?, ?, ?, ?, 0, 1)
    `)
    .run(sourceCode, meta.sourceType, meta.sourceName, meta.languageCode)

  return Number(inserted.lastInsertRowid)
}

function upsertVerseRow(
  db: Database.Database,
  sourceId: number,
  row: BibleImportRow,
  canonicalKey: string,
): void {
  const verseKey = buildCanonicalKey(row)
  const bookCode = normalizeBookCode(row.bookCode)

  db.prepare(`
    INSERT INTO ai_bible_verses(
      sourceId,
      verseKey,
      canonicalKey,
      sourceIdText,
      languageCode,
      versionCode,
      bookCode,
      bookName,
      chapter,
      verse,
    verseText,
      normalizedText
    )
    VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(sourceId, verseKey) DO UPDATE
    SET canonicalKey = excluded.canonicalKey,
        sourceIdText = excluded.sourceIdText,
        languageCode = excluded.languageCode,
        versionCode = excluded.versionCode,
        bookCode = excluded.bookCode,
        bookName = excluded.bookName,
        chapter = excluded.chapter,
        verse = excluded.verse,
        verseText = excluded.verseText,
        normalizedText = excluded.normalizedText,
        updatedAt = CURRENT_TIMESTAMP
  `).run(
    sourceId,
    verseKey,
    canonicalKey,
    normalizeText(row.languageCode ?? SOURCE_METADATA[row.sourceCode].languageCode),
    normalizeText(row.versionCode ?? ''),
    bookCode,
    normalizeText(row.bookName),
    Number(row.chapter),
    Number(row.verse),
    normalizeText(row.verseText),
    normalizeText(row.normalizedText ?? ''),
  )
}

function findVerseIdBySourceAndVerseKey(
  db: Database.Database,
  sourceId: number,
  verseKey: string,
): number | null {
  const row = db
    .prepare(`
      SELECT id
      FROM ai_bible_verses
      WHERE sourceId = ?
        AND verseKey = ?
      LIMIT 1
    `)
    .get(sourceId, verseKey) as { id?: number } | undefined

  return typeof row?.id === 'number' ? row.id : null
}

function tokenizeVerseText(verseText: string): string[] {
  return normalizeText(verseText)
    .split(/[^\p{L}\p{N}]+/u)
    .map(token => normalizeText(token))
    .filter(Boolean)
}

function isHanjaToken(token: string): boolean {
  return /[\u3400-\u9FFF\uF900-\uFAFF]/u.test(token)
}

function buildKnowledgeTokensForVerse(
  row: BibleImportRow,
  targetId: number,
  sourceId: number,
  canonicalKey: string,
): KnowledgeTokenRow[] {
  const tokens: KnowledgeTokenRow[] = []
  const normalizedCanonical = normalizeToken(canonicalKey)
  const sourceType = row.sourceCode

  tokens.push({
    targetType: 'BIBLE_VERSE',
    targetId,
    sourceType,
    sourceId,
    canonicalKey,
    tokenType: 'bible_ref',
    token: canonicalKey,
    normalizedToken: normalizedCanonical,
    position: 0,
    weight: 2,
  })

  const wordTokens = tokenizeVerseText(row.verseText)
  let position = 1
  const seen = new Set<string>()

  for (const token of wordTokens) {
    const normalized = normalizeToken(token)
    if (!normalized) continue

    const tokenType: KnowledgeTokenType = row.sourceCode === 'BIBLE_KJV' ? 'english' : 'korean'
    const key = `${tokenType}|${normalized}|${position}`
    if (seen.has(key)) {
      position += 1
      continue
    }
    seen.add(key)

    tokens.push({
      targetType: 'BIBLE_VERSE',
      targetId,
      sourceType,
      sourceId,
      canonicalKey,
      tokenType,
      token,
      normalizedToken: normalized,
      position,
      weight: 1,
    })

    if (isHanjaToken(token)) {
      tokens.push({
        targetType: 'BIBLE_VERSE',
        targetId,
        sourceType,
        sourceId,
        canonicalKey,
        tokenType: 'hanja',
        token,
        normalizedToken: normalized,
        position,
        weight: 1,
      })
    }

    position += 1
  }

  return tokens
}

function insertKnowledgeTokens(
  db: Database.Database,
  tokens: KnowledgeTokenRow[],
): number {
  if (tokens.length === 0) return 0

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO ai_knowledge_tokens(
      targetType,
      targetId,
      sourceType,
      sourceId,
      canonicalKey,
      tokenType,
      token,
      normalizedToken,
      position,
      weight
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  let inserted = 0
  for (const token of tokens) {
    const result = stmt.run(
      token.targetType,
      token.targetId,
      token.sourceType,
      token.sourceId,
      token.canonicalKey,
      token.tokenType,
      token.token,
      token.normalizedToken,
      token.position,
      token.weight,
    )
    inserted += Number(result.changes ?? 0)
  }
  return inserted
}

// ==================================================
// SECTION 04: VALIDATION
// ==================================================

function validateVerseRow(row: BibleImportRow, result: AiImporterDryRunResult): string | null {
  const bookCode = normalizeBookCode(row.bookCode)
  const chapter = Number(row.chapter)
  const verse = Number(row.verse)
  const verseText = normalizeText(row.verseText)
  const sourceCode = normalizeSourceCode(row.sourceCode)

  if (!sourceCode) {
    addImporterIssue(result, {
      level: 'ERROR',
      code: 'INVALID_SOURCE_CODE',
      message: `Invalid sourceCode: ${normalizeText(row.sourceCode as unknown as string)}`,
    })
    return null
  }

  const verseKey = buildCanonicalKey({ ...row, bookCode, chapter, verse, sourceCode })
  const canonicalKey = resolveCanonicalKey({ ...row, bookCode }, result)

  if (!CANONICAL_REGEX.test(verseKey) || !CANONICAL_REGEX.test(canonicalKey)) {
    addImporterIssue(result, {
      level: 'ERROR',
      code: 'INVALID_VERSE_COORDINATE',
      message: `Invalid verse coordinate or canonical key format: ${normalizeText(row.bookCode)} ${chapter}:${verse}, canonical=${canonicalKey}`,
    })
    return null
  }

  if (chapter < 1 || verse < 1) {
    addImporterIssue(result, {
      level: 'ERROR',
      code: 'INVALID_VERSE_COORDINATE',
      message: `Invalid book/chapter/verse: ${normalizeText(row.bookCode)} ${chapter}:${verse}`,
    })
    return null
  }

  if (!bookCode || bookCode.length !== 3) {
    addImporterIssue(result, {
      level: 'ERROR',
      code: 'INVALID_BOOK_CODE',
      message: `Invalid bookCode: ${normalizeText(row.bookCode)}`,
    })
    return null
  }

  if (!verseText) {
    addImporterIssue(result, {
      level: 'ERROR',
      code: 'INVALID_VERSE_TEXT',
      message: `Empty verseText: ${buildCanonicalKey({ ...row, sourceCode, bookCode })}`,
    })
    return null
  }

  return canonicalKey
}

// ==================================================
// SECTION 05: IMPORT ENTRY
// ==================================================

export async function importBibleLibrary(
  options: BibleImporterOptions = { dryRun: true },
): Promise<AiImporterDryRunResult> {
  const dryRun = options.dryRun !== false
  const sampleLimit = typeof options.sampleLimit === 'number' && Number.isFinite(options.sampleLimit)
    ? Math.max(0, Math.floor(options.sampleLimit))
    : undefined
  const dbPath = path.resolve(__dirname, '../../../data/ai-library.sqlite')

  if (!fs.existsSync(dbPath)) {
    const result = createDryRunResult('BIBLE', dryRun, 0)
    addImporterIssue(result, {
      level: 'ERROR',
      code: 'DB_FILE_NOT_FOUND',
      message: `AI Library DB file not found: ${dbPath}`,
    })
    printDryRunResult(result)
    return result
  }

  const db = new Database(dbPath, { readonly: dryRun, fileMustExist: true })

  try {
    const countRow = db
      .prepare(`
        SELECT COUNT(*) AS count
        FROM ai_bible_verses
      `)
      .get() as { count: number }

    const result = createDryRunResult('BIBLE', dryRun, countRow.count)
    const rows = loadBibleRowsFromSource(result)
    const targetRows = sampleLimit != null ? rows.slice(0, sampleLimit) : rows

    if (sampleLimit != null) {
      addImporterIssue(result, {
        level: 'INFO',
        code: 'SAMPLE_LIMIT_APPLIED',
        message: `sampleLimit applied: ${sampleLimit} (loaded=${rows.length}, processing=${targetRows.length})`,
      })
    }

    if (targetRows.length === 0) {
      if (!dryRun) {
        addImporterIssue(result, {
          level: 'WARNING',
          code: 'SOURCE_NOT_READY',
          message: 'No verse rows loaded from Bible source files. Import was skipped safely.',
        })
      } else {
        addImporterIssue(result, {
          level: 'INFO',
          code: 'SOURCE_NOT_READY',
          message: 'No verse rows loaded from Bible source files (dry-run only).',
        })
      }
      result.status = dryRun ? 'READY' : 'SKIPPED'
      result.scannedRows = 0
      result.validRows = 0
      result.invalidRows = 0
      printDryRunResult(result)
      return result
    }

    let estimatedTokenCount = 0
    let insertedTokenCount = 0

    for (const row of targetRows) {
      result.scannedRows += 1

      const normalizedSourceCode = normalizeSourceCode(row.sourceCode)
      if (!normalizedSourceCode) {
        addImporterIssue(result, {
          level: 'ERROR',
          code: 'INVALID_SOURCE_CODE',
          message: `Invalid sourceCode: ${normalizeText(row.sourceCode)}`,
        })
        result.invalidRows += 1
        continue
      }

      const canonicalKey = validateVerseRow({ ...row, sourceCode: normalizedSourceCode }, result)

      if (!canonicalKey) {
        result.invalidRows += 1
        continue
      }

      const sourceId = ensureSourceId(db, normalizedSourceCode)
      const verseKey = buildCanonicalKey({ ...row, sourceCode: normalizedSourceCode })

      if (!dryRun) {
        upsertVerseRow(db, sourceId, { ...row, sourceCode: normalizedSourceCode }, canonicalKey)
      }

      const targetId = dryRun
        ? result.currentCount + result.validRows + 1
        : findVerseIdBySourceAndVerseKey(db, sourceId, verseKey)

      if (targetId != null) {
        const tokens = buildKnowledgeTokensForVerse(
          { ...row, sourceCode: normalizedSourceCode },
          targetId,
          sourceId,
          canonicalKey,
        )
        estimatedTokenCount += tokens.length
        if (!dryRun) {
          insertedTokenCount += insertKnowledgeTokens(db, tokens)
        }
      } else {
        addImporterIssue(result, {
          level: 'WARNING',
          code: 'VERSE_ID_LOOKUP_FAILED',
          message: `Failed to resolve verse id: source=${normalizedSourceCode}, verseKey=${verseKey}`,
        })
      }

      result.validRows += 1
    }

    if (result.invalidRows > 0) {
      result.status = 'INVALID'
    }

    if (!dryRun) {
      addImporterIssue(result, {
        level: 'INFO',
        code: 'UPSERT_COMPLETE',
        message: `Bible verse upsert completed. rows=${result.validRows}`,
      })
      addImporterIssue(result, {
        level: 'INFO',
        code: 'TOKENS_UPSERT_COMPLETE',
        message: `Knowledge token upsert completed. estimated=${estimatedTokenCount}, inserted=${insertedTokenCount}`,
      })
    } else {
      addImporterIssue(result, {
        level: 'INFO',
        code: 'TOKENS_DRY_RUN_ESTIMATE',
        message: `Knowledge token dry-run estimate: expectedTokens=${estimatedTokenCount}`,
      })
    }

    printDryRunResult(result)
    return result
  } finally {
    db.close()
  }
}

// ==================================================
// SECTION 06: OPTIONAL EXECUTION
// ==================================================

// importBibleLibrary({ dryRun: false })
