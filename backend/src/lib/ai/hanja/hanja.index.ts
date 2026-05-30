import { hanjaEntries } from "./hanja.entries"
import type { HanjaEntry } from "./hanja.types"

const RESERVED_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

type HanjaStringRecord = Record<string, HanjaEntry>
type HanjaNumberRecord = Record<number, HanjaEntry>
type HanjaListRecord = Record<string, HanjaEntry[]>

export const byHanja: HanjaStringRecord = Object.create(null)
export const byUnicodeEscape: HanjaStringRecord = Object.create(null)
export const byUnicodeHex: HanjaStringRecord = Object.create(null)
export const byUnicodeDecimal: HanjaNumberRecord = Object.create(null)

export const byRadical: HanjaListRecord = Object.create(null)
export const byStrokeCount: HanjaListRecord = Object.create(null)
export const byReadingKo: HanjaListRecord = Object.create(null)
export const byHanjaLevel: HanjaListRecord = Object.create(null)
export const searchTokens: HanjaListRecord = Object.create(null)

function ensureSafeRecordKey(key: string): void {
  if (RESERVED_KEYS.has(key)) {
    throw new Error(`Reserved index key is not allowed: ${key}`)
  }
}

function addOne<T>(map: Record<string, T>, key: string, value: T): void {
  ensureSafeRecordKey(key)
  const existing = (map as Record<string, T | undefined>)[key]
  if (existing !== undefined) {
    throw new Error(`Duplicate key detected: ${key}`)
  }
  ;(map as Record<string, T>)[key] = value
}

function addList(map: Record<string, HanjaEntry[]>, key: string, entry: HanjaEntry): void {
  ensureSafeRecordKey(key)
  const list = map[key]
  if (list === undefined) {
    map[key] = [entry]
  } else {
    list.push(entry)
  }
}

function tokenizeText(raw: string): string[] {
  const normalized = raw
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\[|\]|\(|\)|\{|\}|\"|\'|,|\s+/g, ' ')

  const matched = normalized.match(/[\p{L}\p{N}]+/gu)
  if (!matched) return []

  const tokenSet = new Set<string>()
  for (const item of matched) {
    const token = item.trim()
    if (token.length > 0) {
      tokenSet.add(token)
    }
  }
  return Array.from(tokenSet)
}

function uniqueSorted(list: string[]): string[] {
  return Array.from(new Set(list)).sort()
}

export function buildSearchTokens(entry: HanjaEntry): string[] {
  const tokens = [
    entry.hanja,
    entry.mainSound,
    entry.level,
    entry.radical,
    String(entry.strokes),
    String(entry.totalStrokes),
    entry.unicodeHex,
    entry.unicodeEscape,
    String(entry.unicodeDecimal),
    ...tokenizeText(entry.meaning),
  ]
    .flatMap(token => tokenizeText(token))

  return uniqueSorted(tokens)
}

export function createIndexes(entries: HanjaEntry[]): void {
  for (const entry of entries) {
    addOne(byHanja, entry.hanja, entry)
    addOne(byUnicodeEscape, entry.unicodeEscape, entry)
    addOne(byUnicodeHex, entry.unicodeHex, entry)

    const decKey = entry.unicodeDecimal
    const existDec = (byUnicodeDecimal as Record<number, HanjaEntry | undefined>)[decKey]
    if (existDec !== undefined) {
      throw new Error(`Duplicate unicodeDecimal key: ${decKey}`)
    }
    ;(byUnicodeDecimal as Record<number, HanjaEntry>)[decKey] = entry

    addList(byRadical, entry.radical, entry)
    addList(byStrokeCount, String(entry.strokes), entry)
    addList(byReadingKo, entry.mainSound, entry)
    addList(byHanjaLevel, entry.level, entry)

    for (const token of buildSearchTokens(entry)) {
      addList(searchTokens, token, entry)
    }
  }
}

createIndexes(hanjaEntries)

export const HANJA_INDEX_SIZE = Object.keys(byHanja).length
