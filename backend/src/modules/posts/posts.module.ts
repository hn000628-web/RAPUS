// FILE : backend/src/modules/posts/posts.module.ts
// ROOT : backend/src/modules/posts/posts.module.ts
// STATUS : CREATE MODE / DB SCHEMA SAFE
// ROLE : POSTS MODULE

// SECTION 01 : IMPORT

import { Module } from '@nestjs/common'

import { PostsController } from './posts.controller'
import { PostsService } from './posts.service'

// SECTION 02 : MODULE

@Module({
  controllers: [
    PostsController
  ],
  providers: [
    PostsService
  ],
  exports: [
    PostsService
  ]
})
export class PostsModule {}