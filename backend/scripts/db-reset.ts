// FILE: C:\Users\kjm\social-platform\backend\scripts\db-reset.ts
// ROOT : C:\Users\kjm\social-platform\backend\scripts\db-reset.ts
// STATUS : DB RESET SCRIPT → PRODUCTION DB INIT

import { initDatabase } from '../src/init/init-db'

async function resetDB() {
  try {
    console.log('===== RESETTING PRODUCTION DB =====')
    await initDatabase()
    console.log('PRODUCTION DB RESET COMPLETE')
  } catch (err) {
    console.error('PRODUCTION DB RESET FAILED', err)
    process.exit(1)
  }
}

resetDB()