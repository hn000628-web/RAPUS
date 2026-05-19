// FILE : frontend/lib/adminApi.ts
// ROOT : frontend/lib/adminApi.ts

import { apiFetch } from '@/lib/api'


/* ==================================================
SECTION 01 : URL HELPER (FIXED)
================================================== */

function buildAdminUrl(url: string){

  if(!url.startsWith('/')){
    throw new Error('adminFetch url must start with /')
  }

  /* 🔥 1. /api/admin 들어오면 강제 차단 */
  if(url.startsWith('/api/admin')){
    throw new Error(
      'Do NOT include /api/admin prefix in adminFetch'
    )
  }

  /* 🔥 2. /admin 이미 있으면 그대로 */
  if(url.startsWith('/admin')){
    return url
  }

  /* 🔥 3. 기본 prefix */
  return `/admin${url}`

}


/* ==================================================
SECTION 02 : ADMIN FETCH
================================================== */

export async function adminFetch<T=any>(
  url:string,
  options?:{
    method?:'GET'|'POST'|'PATCH'|'PUT'|'DELETE'
    body?:any
    headers?:Record<string,string>
  }
):Promise<T>{

  const finalUrl = buildAdminUrl(url)

  return apiFetch<T>(
    finalUrl,
    {
      method: options?.method || 'GET',
      body: options?.body,
      headers: options?.headers
    }
  )

}


/* ==================================================
SECTION 03 : ADMIN FILE FETCH
================================================== */

export async function adminFileFetch<T=any>(
  url:string,
  formData:FormData,
  method:'POST'|'PUT'|'PATCH'='POST'
):Promise<T>{

  const finalUrl = buildAdminUrl(url)

  return apiFetch<T>(
    finalUrl,
    {
      method,
      body: formData,
      isForm: true
    }
  )

}