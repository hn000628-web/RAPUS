// FILE : backend/src/database/database.provider.ts
// ROLE : DATABASE PROVIDER (SINGLETON)
// STATUS : PRODUCTION READY

import Database from 'better-sqlite3'
import path from 'path'

export const DatabaseProvider = {
  provide: 'DB',
  useFactory: () => {

    const dbPath = path.resolve(
      __dirname,
      '../../data/prod.sqlite'
    )

    console.log('DB PROVIDER INIT →', dbPath)

    const db = new Database(dbPath)

    return db
  }
}