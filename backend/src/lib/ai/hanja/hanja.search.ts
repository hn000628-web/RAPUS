import type { HanjaEntry, HanjaSearchMatch, HanjaSearchOptions } from "./hanja.types"
import {
  byHanja,
  byReadingKo,
  byUnicodeDecimal,
  byUnicodeEscape,
  byUnicodeHex,
  byRadical,
  byHanjaLevel,
  byStrokeCount,
  searchTokens,
  buildSearchTokens,
} from "./hanja.index"
import { hanjaEntries } from "./hanja.entries"

const SCORE_HANJA_EXACT = 100
const SCORE_UNICODE_EXACT = 80
const SCORE_PREFIX = 20

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().normalize('NFKC')
}

function tokenizeQuery(query: string): string[] {
  const normalized = normalizeQuery(query)
  const matched = normalized.match(/[\p{L}\p{N}]+/gu)
  if (!matched) return []

  const tokenSet = new Set<string>()
  for (const t of matched) {
    const token = t.trim()
    if (token.length > 0) {
      tokenSet.add(token)
    }
  }
  return Array.from(tokenSet)
}

function addIfNotExists(list: HanjaSearchMatch[], entry: HanjaEntry, token: string, bonus: number): void {
  const found = list.find(item => item.entry === entry)
  if (found) {
    found.score += bonus
    if (!found.matchedTokens.includes(token)) {
      found.matchedTokens.push(token)
    }
  } else {
    list.push({ entry, score: bonus, matchedTokens: [token] })
  }
}

export function getSearchTokens(entry: HanjaEntry): string[] {
  return buildSearchTokens(entry)
}

export function searchHanja(query: string, options: HanjaSearchOptions = {}): HanjaSearchMatch[] {
  const normalized = normalizeQuery(query)
  const limit = options.limit ?? 30

  if (!normalized) {
    return []
  }

  const result: HanjaSearchMatch[] = []

  const exactHanja = byHanja[query]
  if (exactHanja !== undefined) {
    result.push({ entry: exactHanja, score: SCORE_HANJA_EXACT, matchedTokens: [query] })
  }

  const exactUnicodeEscape = byUnicodeEscape[query.toUpperCase()]
  if (exactUnicodeEscape !== undefined) {
    addIfNotExists(result, exactUnicodeEscape, exactUnicodeEscape.unicodeEscape, SCORE_UNICODE_EXACT)
  }

  if (/^u\+[0-9a-f]{4,6}$/i.test(normalized)) {
    const hit = byUnicodeEscape[query.toUpperCase()]
    if (hit !== undefined) {
      addIfNotExists(result, hit, hit.unicodeEscape, SCORE_UNICODE_EXACT)
    }
  }

  if (/^\d+$/.test(normalized)) {
    const hit = byUnicodeDecimal[Number(normalized)]
    if (hit !== undefined) {
      addIfNotExists(result, hit, String(hit.unicodeDecimal), SCORE_UNICODE_EXACT)
    }
  }

  const hitHex = byUnicodeHex[normalized.replace(/^0x/i, '').toUpperCase()]
  if (hitHex !== undefined) {
    addIfNotExists(result, hitHex, hitHex.unicodeHex, SCORE_UNICODE_EXACT)
  }

  const tokens = tokenizeQuery(query)
  if (tokens.length === 0) {
    return result
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  for (const token of tokens) {
    const byToken = byReadingKo[token]
    if (byToken !== undefined) {
      for (const entry of byToken) {
        addIfNotExists(result, entry, token, SCORE_PREFIX)
      }
    }

    const byR = byHanjaLevel[token]
    if (byR !== undefined) {
      for (const entry of byR) {
        addIfNotExists(result, entry, token, 5)
      }
    }

    const byS = byStrokeCount[token]
    if (byS !== undefined) {
      for (const entry of byS) {
        addIfNotExists(result, entry, token, 5)
      }
    }

    const byRad = byRadical[token]
    if (byRad !== undefined) {
      for (const entry of byRad) {
        addIfNotExists(result, entry, token, 8)
      }
    }

    const byTokenMap = searchTokens[token]
    if (byTokenMap !== undefined) {
      for (const entry of byTokenMap) {
        addIfNotExists(result, entry, token, 10)
      }
    }
  }

  const filtered = result
    .filter(item => item.matchedTokens.length > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.entry.hanja.localeCompare(b.entry.hanja)
    })

  const map = new Map<string, HanjaSearchMatch>()
  for (const item of filtered) {
    const key = item.entry.hanja
    if (!map.has(key)) {
      map.set(key, item)
    }
  }

  return Array.from(map.values()).slice(0, limit)
}

export function getByHanja(hanja: string): HanjaEntry | undefined {
  return byHanja[hanja]
}

export function getByUnicodeEscape(unicodeEscape: string): HanjaEntry | undefined {
  return byUnicodeEscape[unicodeEscape.toUpperCase()]
}

export function getByUnicodeDecimal(decimal: number): HanjaEntry | undefined {
  return byUnicodeDecimal[decimal]
}

export function getAllEntries(): HanjaEntry[] {
  return hanjaEntries
}
