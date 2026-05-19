/* ==================================================
FILE : backend/src/modules/profiles/profiles.module.ts
ROLE : PROFILE DOMAIN ROOT
STATUS : PRODUCTION MONOLITH STRUCTURE
FIX :
- media module 연결 추가
- profile account module 연결 추가
- DI 구조 완성
================================================== */

// SECTION 01 : IMPORT

import { Module } from '@nestjs/common'

import { ProfilesService }
from './profiles.service'

import { ProfilesController }
from './profiles.controller'

import { AuthModule }
from '../auth/auth.module'

import { MediaModule }
from '../media/media.module'

import { ProfileAccountModule }
from './account/profile-account.module'

// SECTION 02 : MODULE

@Module({

imports:[

AuthModule,
MediaModule,
ProfileAccountModule

],

controllers:[

ProfilesController

],

providers:[

ProfilesService

],

exports:[

ProfilesService

]

})

export class ProfilesModule{}
