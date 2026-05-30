import { Injectable } from '@nestjs/common'
import type Database from 'better-sqlite3'
import db from '../../../config/database'

export type HanjaTokenType =
  | 'hanja'
  | 'mainSound'
  | 'level'
  | 'radical'
  | 'strokes'
  | 'totalStrokes'
  | 'unicodeHex'
  | 'unicodeEscape'
  | 'unicodeDecimal'
  | 'meaning'

export interface AiHanjaEntry {
  id: number
  hanja: string
  mainSound: string
  level: string
  meaning: string
  radical: string
  strokes: number
  totalStrokes: number
  unicodeDecimal: number
  unicodeHex: string
  unicodeEscape: string
  createdAt: string | null
  updatedAt: string | null
}

export interface AiHanjaSearchResult {
  entry: AiHanjaEntry
  score: number
  matchedTokens: string[]
  matchedBy: string[]
}

export interface AiHanjaSearchParams {
  query: string
  level?: string
  radical?: string
  strokes?: number
  limit?: number
}

type AiHanjaEntryRow = {
  id: number
  hanja: string
  mainSound: string
  level: string
  meaning: string
  radical: string
  strokes: number
  totalStrokes: number
  unicodeDecimal: number
  unicodeHex: string
  unicodeEscape: string
  createdAt: string | null
  updatedAt: string | null
}

type AiHanjaSearchTokenRow = AiHanjaEntryRow & {
  tokenType: HanjaTokenType
  token: string
}

@Injectable()
export class AiHanjaSearchService {
  private readonly database: Database.Database

  constructor() {
    this.database = db
  }

  findByHanja(hanja: string): AiHanjaEntry | null {
    const normalizedHanja = this.normalizeTextInput(hanja)
    if (!normalizedHanja) {
      return null
    }

    const row = this.database
      .prepare(`
        SELECT
          id,
          hanja,
          mainSound,
          level,
          meaning,
          radical,
          strokes,
          totalStrokes,
          unicodeDecimal,
          unicodeHex,
          unicodeEscape,
          createdAt,
          updatedAt
        FROM ai_hanja_entries
        WHERE hanja = ?
        LIMIT 1
      `)
      .get(normalizedHanja) as AiHanjaEntryRow | undefined

    if (!row) {
      return null
    }

    return this.toEntry(row)
  }

  findByUnicodeEscape(unicodeEscape: string): AiHanjaEntry | null {
    const normalizedUnicodeEscape = this.normalizeUnicodeEscape(unicodeEscape)
    if (!normalizedUnicodeEscape) {
      return null
    }

    const row = this.database
      .prepare(`
        SELECT
          id,
          hanja,
          mainSound,
          level,
          meaning,
          radical,
          strokes,
          totalStrokes,
          unicodeDecimal,
          unicodeHex,
          unicodeEscape,
          createdAt,
          updatedAt
        FROM ai_hanja_entries
        WHERE unicodeEscape = ?
        LIMIT 1
      `)
      .get(normalizedUnicodeEscape) as AiHanjaEntryRow | undefined

    if (!row) {
      return null
    }

    return this.toEntry(row)
  }

  findByUnicodeDecimal(decimal: number): AiHanjaEntry | null {
    const normalizedDecimal = this.normalizeNumeric(decimal)
    if (normalizedDecimal === null) {
      return null
    }

    const row = this.database
      .prepare(`
        SELECT
          id,
          hanja,
          mainSound,
          level,
          meaning,
          radical,
          strokes,
          totalStrokes,
          unicodeDecimal,
          unicodeHex,
          unicodeEscape,
          createdAt,
          updatedAt
        FROM ai_hanja_entries
        WHERE unicodeDecimal = ?
        LIMIT 1
      `)
      .get(normalizedDecimal) as AiHanjaEntryRow | undefined

    if (!row) {
      return null
    }

    return this.toEntry(row)
  }

  searchByToken(token: string, limit = 30): AiHanjaSearchResult[] {
    const normalizedToken = this.normalizeTokenLookup(token)
    const resolvedLimit = this.normalizeLimit(limit)

    if (!normalizedToken) {
      return []
    }

    const rows = this.database
      .prepare(`
        SELECT
          e.id,
          e.hanja,
          e.mainSound,
          e.level,
          e.meaning,
          e.radical,
          e.strokes,
          e.totalStrokes,
          e.unicodeDecimal,
          e.unicodeHex,
          e.unicodeEscape,
          e.createdAt,
          e.updatedAt,
          t.tokenType,
          t.token
        FROM ai_hanja_entries e
        INNER JOIN ai_hanja_search_tokens t
          ON t.entryId = e.id
        WHERE t.token = ?
        ORDER BY
          CASE t.tokenType
            WHEN 'unicodeEscape' THEN 1
            WHEN 'unicodeDecimal' THEN 2
            WHEN 'unicodeHex' THEN 3
            WHEN 'hanja' THEN 4
            WHEN 'mainSound' THEN 5
            WHEN 'meaning' THEN 6
            WHEN 'level' THEN 7
            WHEN 'radical' THEN 8
            WHEN 'strokes' THEN 9
            WHEN 'totalStrokes' THEN 10
            ELSE 11
          END,
          e.unicodeDecimal ASC,
          e.hanja ASC
        LIMIT ?
      `)
      .all(normalizedToken, resolvedLimit) as AiHanjaSearchTokenRow[]

    return this.aggregateSearchRows(rows, {
      query: normalizedToken,
      limit: resolvedLimit,
    })
  }

  searchByTokenType(
    tokenType: HanjaTokenType,
    token: string,
    limit = 30
  ): AiHanjaSearchResult[] {
    if (!tokenType) {
      return []
    }

    const normalizedToken = this.normalizeTokenLookup(token)
    const resolvedLimit = this.normalizeLimit(limit)

    if (!normalizedToken) {
      return []
    }

    const rows = this.database
      .prepare(`
        SELECT
          e.id,
          e.hanja,
          e.mainSound,
          e.level,
          e.meaning,
          e.radical,
          e.strokes,
          e.totalStrokes,
          e.unicodeDecimal,
          e.unicodeHex,
          e.unicodeEscape,
          e.createdAt,
          e.updatedAt,
          t.tokenType,
          t.token
        FROM ai_hanja_entries e
        INNER JOIN ai_hanja_search_tokens t
          ON t.entryId = e.id
        WHERE t.tokenType = ?
          AND t.token = ?
        ORDER BY
          e.unicodeDecimal ASC,
          e.hanja ASC
        LIMIT ?
      `)
      .all(tokenType, normalizedToken, resolvedLimit) as AiHanjaSearchTokenRow[]

    return this.aggregateSearchRows(rows, {
      query: normalizedToken,
      tokenTypeFilter: tokenType,
      limit: resolvedLimit,
    })
  }

  search(params: AiHanjaSearchParams): AiHanjaSearchResult[] {
    const normalizedQuery = this.normalizeTokenLookup(params?.query)
    const resolvedLimit = this.normalizeLimit(params?.limit)

    if (!normalizedQuery) {
      return []
    }

    const levelFilter = this.normalizeTextInput(params?.level)
    const radicalFilter = this.normalizeTextInput(params?.radical)
    const strokesFilter = this.normalizeOptionalNumber(params?.strokes)

    const whereClauses: string[] = ['t.token = ?']
    const values: Array<string | number> = [normalizedQuery]

    if (this.isNumericLike(normalizedQuery)) {
      whereClauses.push('t.tokenType IN (?, ?, ?)')
      values.push('unicodeDecimal', 'strokes', 'totalStrokes')

      whereClauses.push(
        '(e.unicodeDecimal = ? OR e.strokes = ? OR e.totalStrokes = ?)'
      )
      const fallbackNumeric = this.normalizeNumeric(normalizedQuery)
      if (fallbackNumeric !== null) {
        values.push(fallbackNumeric, fallbackNumeric, fallbackNumeric)
      }
    }

    if (levelFilter) {
      whereClauses.push('e.level = ?')
      values.push(levelFilter)
    }

    if (radicalFilter) {
      whereClauses.push('e.radical = ?')
      values.push(radicalFilter)
    }

    if (strokesFilter !== null) {
      whereClauses.push('e.strokes = ?')
      values.push(strokesFilter)
    }

    const querySql = `
      SELECT
        e.id,
        e.hanja,
        e.mainSound,
        e.level,
        e.meaning,
        e.radical,
        e.strokes,
        e.totalStrokes,
        e.unicodeDecimal,
        e.unicodeHex,
        e.unicodeEscape,
        e.createdAt,
        e.updatedAt,
        t.tokenType,
        t.token
      FROM ai_hanja_entries e
      INNER JOIN ai_hanja_search_tokens t
        ON t.entryId = e.id
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY e.id
      ORDER BY
        CASE
          WHEN e.hanja = ? THEN 0
          WHEN t.tokenType = 'unicodeDecimal' THEN 1
          WHEN t.tokenType = 'unicodeHex' THEN 2
          WHEN t.tokenType = 'unicodeEscape' THEN 3
          ELSE 4
        END,
        e.unicodeDecimal ASC,
        e.hanja ASC
      LIMIT ?
    `

    const allValues = [...values, normalizedQuery, resolvedLimit]
    const rows = this.database.prepare(querySql).all(...allValues) as AiHanjaSearchTokenRow[]

    const baseResults = this.aggregateSearchRows(rows, {
      query: normalizedQuery,
      limit: resolvedLimit,
      level: levelFilter || undefined,
      radical: radicalFilter || undefined,
      strokes: strokesFilter,
    })

    const fallbackEntries: AiHanjaSearchResult[] = []
    if (this.isNumericLike(normalizedQuery)) {
      const numeric = this.normalizeNumeric(normalizedQuery)
      if (numeric !== null) {
        const exactEntry = this.findByUnicodeDecimal(numeric)
        if (exactEntry) {
          fallbackEntries.push({
            entry: exactEntry,
            score: 500,
            matchedTokens: [String(numeric)],
            matchedBy: ['unicodeDecimal'],
          })

          if (strokesFilter !== null && exactEntry.strokes === strokesFilter) {
            fallbackEntries[fallbackEntries.length - 1].score += 80
          }

          if (levelFilter && exactEntry.level === levelFilter) {
            fallbackEntries[fallbackEntries.length - 1].score += 40
          }

          if (radicalFilter && exactEntry.radical === radicalFilter) {
            fallbackEntries[fallbackEntries.length - 1].score += 40
          }
        }
      }
    }

    const merged = new Map<number, AiHanjaSearchResult>()
    for (const item of [...baseResults, ...fallbackEntries]) {
      const key = item.entry.id
      const exist = merged.get(key)
      if (!exist) {
        merged.set(key, item)
        continue
      }

      exist.score = Math.max(exist.score, item.score)
      for (const token of item.matchedTokens) {
        if (!exist.matchedTokens.includes(token)) {
          exist.matchedTokens.push(token)
        }
      }
      for (const matchedBy of item.matchedBy) {
        if (!exist.matchedBy.includes(matchedBy)) {
          exist.matchedBy.push(matchedBy)
        }
      }
    }

    return Array.from(merged.values())
      .map((item) => ({
        ...item,
        matchedTokens: this.normalizeUniqueStrings(item.matchedTokens),
        matchedBy: this.normalizeUniqueStrings(item.matchedBy),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, resolvedLimit)
  }

  private aggregateSearchRows(
    rows: AiHanjaSearchTokenRow[],
    context: {
      query: string
      tokenTypeFilter?: HanjaTokenType
      limit: number
      level?: string
      radical?: string
      strokes?: number | null
    }
  ): AiHanjaSearchResult[] {
    const grouped = new Map<number, AiHanjaSearchResult>()

    for (const row of rows) {
      const entryId = Number(row.id)
      if (!Number.isFinite(entryId)) {
        continue
      }

      const existing = grouped.get(entryId)
      const rowScore = this.scoreMatch(row, context)

      if (!existing) {
        grouped.set(entryId, {
          entry: this.toEntry(row),
          score: rowScore,
          matchedTokens: [row.token],
          matchedBy: [row.tokenType],
        })
        continue
      }

      existing.score += rowScore

      if (!existing.matchedTokens.includes(row.token)) {
        existing.matchedTokens.push(row.token)
      }

      if (!existing.matchedBy.includes(row.tokenType)) {
        existing.matchedBy.push(row.tokenType)
      }
    }

    return Array.from(grouped.values())
  }

  private scoreMatch(
    row: AiHanjaSearchTokenRow,
    context: {
      query: string
      tokenTypeFilter?: HanjaTokenType
      level?: string
      radical?: string
      strokes?: number | null
    }
  ): number {
    const query = context.query
    let score = 0

    if (query) {
      if (row.hanja === query) {
        score += 180
      }
      if (row.mainSound === query) {
        score += 120
      }
      if (row.unicodeEscape && row.unicodeEscape.toLowerCase() === query) {
        score += 120
      }
      if (String(row.unicodeDecimal) === query) {
        score += 110
      }
      if (String(row.strokes) === query) {
        score += 80
      }
      if (String(row.totalStrokes) === query) {
        score += 60
      }
      if (row.level === query) {
        score += 60
      }
      if (row.radical === query) {
        score += 60
      }
      if (row.meaning && row.meaning.includes(query)) {
        score += 20
      }
    }

    if (context.tokenTypeFilter && row.tokenType === context.tokenTypeFilter) {
      score += 40
    }

    if (context.level && row.level === context.level) {
      score += 40
    }

    if (context.radical && row.radical === context.radical) {
      score += 40
    }

    if (context.strokes !== undefined && context.strokes !== null && row.strokes === context.strokes) {
      score += 30
    }

    const tokenTypeWeight: Record<HanjaTokenType, number> = {
      unicodeEscape: 90,
      unicodeDecimal: 80,
      unicodeHex: 70,
      hanja: 65,
      mainSound: 55,
      level: 30,
      radical: 30,
      strokes: 20,
      totalStrokes: 20,
      meaning: 15,
    }

    score += tokenTypeWeight[row.tokenType] ?? 1

    if (row.token.includes(query) || query.includes(row.token)) {
      score += 10
    }

    return score
  }

  private toEntry(row: AiHanjaEntryRow): AiHanjaEntry {
    return {
      id: Number(row.id),
      hanja: row.hanja,
      mainSound: row.mainSound,
      level: row.level,
      meaning: row.meaning,
      radical: row.radical,
      strokes: Number(row.strokes),
      totalStrokes: Number(row.totalStrokes),
      unicodeDecimal: Number(row.unicodeDecimal),
      unicodeHex: row.unicodeHex,
      unicodeEscape: row.unicodeEscape,
      createdAt: row.createdAt ?? null,
      updatedAt: row.updatedAt ?? null,
    }
  }

  private normalizeTokenLookup(value: string): string {
    return String(value ?? '')
      .normalize('NFKC')
      .trim()
      .toLowerCase()
  }

  private normalizeTextInput(value?: string): string {
    return String(value ?? '')
      .normalize('NFKC')
      .trim()
  }

  private normalizeUnicodeEscape(value: string): string {
    const normalized = this.normalizeTextInput(value).toUpperCase()
    if (!/^U\+[0-9A-F]{4,6}$/i.test(normalized)) {
      return ''
    }

    return normalized.toUpperCase()
  }

  private normalizeLimit(limit: number | undefined): number {
    const parsed = Number(limit)
    if (!Number.isFinite(parsed)) {
      return 30
    }

    const fixed = Math.floor(parsed)
    if (fixed <= 0) {
      return 30
    }

    if (fixed > 200) {
      return 200
    }

    return fixed
  }

  private normalizeNumeric(value: string | number): number | null {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) {
      return null
    }

    const integer = Math.trunc(parsed)
    if (integer <= 0) {
      return null
    }

    return integer
  }

  private normalizeOptionalNumber(value?: number): number | null {
    if (value === undefined || value === null) {
      return null
    }

    return this.normalizeNumeric(value)
  }

  private isNumericLike(value: string): boolean {
    return /^\d+$/.test(value)
  }

  private normalizeUniqueStrings(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
  }
}


