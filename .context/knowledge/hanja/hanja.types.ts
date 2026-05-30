export interface HanjaEntry {
  mainSound: string
  level: string
  hanja: string
  meaning: string
  radical: string
  strokes: number
  totalStrokes: number
  unicodeDecimal: number
  unicodeHex: string
  unicodeEscape: string
}

export interface HanjaSearchMatch {
  entry: HanjaEntry
  score: number
  matchedTokens: string[]
}

export interface HanjaSearchOptions {
  limit?: number
}
