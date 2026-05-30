import { HanjaEntry } from './hanja.types'
import { byHanja, byUnicodeEscape } from './hanja.index'
import { searchHanja } from './hanja.search'

const hanjaChar = '漢'
const entry: HanjaEntry | undefined = byHanja[hanjaChar]
console.log('Entry byHanja:', entry)

const unicodeKey = 'U+6F22'
const entry2: HanjaEntry | undefined = byUnicodeEscape[unicodeKey]
console.log('Entry byUnicodeEscape:', entry2)

const results = searchHanja('집')
console.log('Search results:', results)
