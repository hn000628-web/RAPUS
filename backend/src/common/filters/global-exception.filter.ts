// FILE : backend/src/common/filters/global-exception.filter.ts
// ROOT : backend/src/common/filters/global-exception.filter.ts
// ROLE : GLOBAL ERROR LOGGER
// STATUS : PRODUCTION SAFE

import {
ExceptionFilter,
Catch,
ArgumentsHost,
HttpException,
HttpStatus
} from '@nestjs/common'

import { Request,Response } from 'express'

// SECTION 01 : FILTER

@Catch()

export class GlobalExceptionFilter
implements ExceptionFilter{

catch(
exception:any,
host:ArgumentsHost
){

const ctx=
host.switchToHttp()

const request=
ctx.getRequest<Request>()

const response=
ctx.getResponse<Response>()

const status=
exception instanceof HttpException
?exception.getStatus()
:HttpStatus.INTERNAL_SERVER_ERROR

const message=
exception?.message||
'Internal error'

// SECTION 02 : TERMINAL LOG

console.error('\n================ ERROR ================')

console.error('TIME →',new Date())

console.error('PATH →',request.url)

console.error('METHOD →',request.method)

console.error('STATUS →',status)

console.error('MESSAGE →',message)

if(exception?.stack){

console.error('STACK →')

console.error(exception.stack)

}

if(exception?.response){

console.error('DETAIL →')

console.error(exception.response)

}

console.error('======================================\n')

// SECTION 03 : RESPONSE

response
.status(status)
.json({

ok:false,

status,

message

})

}

}