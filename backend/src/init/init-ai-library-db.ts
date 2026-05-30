import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

export async function initAiLibraryDatabase(){

console.log('===== AI LIBRARY SQLITE INIT START =====')

const dbDir = path.resolve(__dirname, '../../data')

if(!fs.existsSync(dbDir))
fs.mkdirSync(dbDir, { recursive: true })

const dbPath = path.join(dbDir, 'ai-library.sqlite')

console.log('AI LIBRARY DB PATH ->', dbPath)

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function safeAddColumn(
table: string,
column: string,
definition: string,
) {
const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]

const exists = cols.some((c) => c.name === column)

if (!exists) {
db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}
}

db.exec(`
CREATE TABLE IF NOT EXISTS ai_library_sources(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sourceCode TEXT NOT NULL UNIQUE,
  sourceType TEXT NOT NULL CHECK(sourceType IN(
    'BIBLE_KO',
    'BIBLE_KH',
    'BIBLE_KJV',
    'HANJA_DICT',
    'KOREAN_THEOLOGY',
    'KOREAN_ONTOLOGY',
    'KOREAN_DICTIONARY'
  )),
  sourceName TEXT NOT NULL,
  fileName TEXT,
  languageCode TEXT DEFAULT 'ko',
  versionLabel TEXT,
  priorityRank INTEGER DEFAULT 0,
  isPrimary INTEGER DEFAULT 0 CHECK(isPrimary IN(0,1)),
  isActive INTEGER DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS ai_bible_verses(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sourceId INTEGER NOT NULL,
  verseKey TEXT NOT NULL,
  canonicalKey TEXT,
  -- 예: KOR/KJV 공통 매핑 키는 GEN.1.1 형태
  sourceIdText TEXT,
  languageCode TEXT DEFAULT 'ko',
  versionCode TEXT,
  bookCode TEXT NOT NULL,
  bookName TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  verseText TEXT NOT NULL,
  normalizedText TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sourceId, verseKey),
  FOREIGN KEY(sourceId) REFERENCES ai_library_sources(id)
)
`)

safeAddColumn(
'ai_bible_verses',
'canonicalKey',
'TEXT'
)

db.exec(`
CREATE TABLE IF NOT EXISTS ai_hanja_dictionary(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sourceId INTEGER NOT NULL,
  entryCode TEXT,
  hanjaWord TEXT NOT NULL,
  hanjaChars TEXT,
  koReading TEXT,
  definitionKo TEXT,
  radical TEXT,
  strokeCount INTEGER,
  totalStrokeCount INTEGER,
  meaningPath TEXT,
  confidence REAL,
  status TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(sourceId) REFERENCES ai_library_sources(id)
)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS ai_korean_interpretation_terms(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sourceId INTEGER NOT NULL,
  term TEXT NOT NULL,
  normalizedTerm TEXT NOT NULL,
  termType TEXT NOT NULL CHECK(termType IN(
    'BIBLE_TERM',
    'HANJA_TERM',
    'THEOLOGY_TERM',
    'ONTOLOGY_TERM',
    'DICTIONARY_TERM',
    'KEYWORD'
  )),
  hanjaForm TEXT,
  koReading TEXT,
  meaningKo TEXT,
  sourceRef TEXT,
  priorityRank INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(sourceId) REFERENCES ai_library_sources(id)
)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS ai_theology_snapshots(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sourceId INTEGER NOT NULL,
  snapshotCode TEXT,
  title TEXT NOT NULL,
  doctrineType TEXT NOT NULL CHECK(doctrineType IN(
    'GOSPEL',
    'WORSHIP',
    'FAITH',
    'ONTOLOGY',
    'THEISM',
    'PROSPERITY_THEOLOGY',
    'FUNCTIONAL_ATHEISM'
  )),
  summaryText TEXT,
  bodyText TEXT,
  stanceType TEXT NOT NULL CHECK(stanceType IN(
    'PRIMARY_STANDARD',
    'WARNING',
    'REFERENCE',
    'USER_DEFINED'
  )),
  isActive INTEGER DEFAULT 1 CHECK(isActive IN(0,1)),
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(sourceId) REFERENCES ai_library_sources(id)
)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS ai_interpretation_links(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fromEntryType TEXT NOT NULL,
  fromEntryId INTEGER NOT NULL,
  toEntryType TEXT NOT NULL,
  toEntryId INTEGER NOT NULL,
  relationType TEXT NOT NULL CHECK(relationType IN(
    'SAME_VERSE',
    'TRANSLATION_PAIR',
    'HANJA_EXPLANATION',
    'TERM_DEFINITION',
    'THEOLOGY_REFERENCE',
    'CONTRAST',
    'WARNING'
  )),
  weight REAL DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS ai_library_embeddings(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  targetType TEXT NOT NULL,
  targetId INTEGER NOT NULL,
  embeddingProvider TEXT NOT NULL,
  embeddingModel TEXT NOT NULL,
  embeddingKey TEXT NOT NULL,
  vectorDimension INTEGER,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS ai_knowledge_tokens(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  targetType TEXT NOT NULL,
  targetId INTEGER NOT NULL,
  sourceType TEXT,
  sourceId INTEGER,
  canonicalKey TEXT,
  tokenType TEXT NOT NULL CHECK(tokenType IN(
    'bible_ref',
    'korean',
    'english',
    'hanja',
    'topic',
    'strong',
    'greek',
    'hebrew'
  )),
  token TEXT NOT NULL,
  normalizedToken TEXT NOT NULL,
  position INTEGER,
  weight REAL NOT NULL DEFAULT 1,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(sourceId) REFERENCES ai_library_sources(id)
)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_ai_library_sources_source_type
ON ai_library_sources(sourceType)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_ai_library_sources_source_code
ON ai_library_sources(sourceCode)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_ai_bible_verses_verse_key
ON ai_bible_verses(verseKey)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_ai_bible_verses_book_chapter_verse
ON ai_bible_verses(bookCode, chapter, verse)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_ai_bible_verses_source_id
ON ai_bible_verses(sourceId)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_bible_verses_source_canonical_key
ON ai_bible_verses(sourceId, canonicalKey)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_ai_hanja_dictionary_hanja_word
ON ai_hanja_dictionary(hanjaWord)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_ai_hanja_dictionary_ko_reading
ON ai_hanja_dictionary(koReading)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_ai_korean_interpretation_terms_normalized_term
ON ai_korean_interpretation_terms(normalizedTerm)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_ai_theology_snapshots_doctrine_type
ON ai_theology_snapshots(doctrineType)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_ai_interpretation_links_from_entry
ON ai_interpretation_links(fromEntryType, fromEntryId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_ai_library_embeddings_target
ON ai_library_embeddings(targetType, targetId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_tokens_token
ON ai_knowledge_tokens(token)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_tokens_target
ON ai_knowledge_tokens(targetType, targetId)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_tokens_canonical
ON ai_knowledge_tokens(canonicalKey)
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_tokens_type_norm
ON ai_knowledge_tokens(tokenType, normalizedToken)
`)

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_knowledge_tokens_unique_entry
ON ai_knowledge_tokens(targetType, targetId, tokenType, normalizedToken, position)
`)

db.close()

console.log('===== AI LIBRARY SQLITE INIT COMPLETE =====')

}

initAiLibraryDatabase()
  .then(()=>{
    console.log('AI LIBRARY SQLITE INIT DONE')
  })
  .catch((error)=>{
    console.error('AI LIBRARY SQLITE INIT FAILED')
    console.error(error)
    process.exitCode = 1
  })
