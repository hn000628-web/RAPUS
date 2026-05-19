// FILE : backend/src/database/database.module.ts
// ROLE : DATABASE MODULE
// STATUS : GLOBAL PROVIDER

import { Module, Global } from '@nestjs/common'
import { DatabaseProvider } from './database.provider'

@Global() // 🔥 핵심 (모든 모듈에서 사용 가능)
@Module({
  providers: [DatabaseProvider],
  exports: [DatabaseProvider]
})
export class DatabaseModule {}