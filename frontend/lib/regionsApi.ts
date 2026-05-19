// FILE : frontend/lib/regionsApi.ts
// ROOT : frontend/lib/regionsApi.ts
// STATUS : AUTH SAFE FINAL

import { apiFetch }
from '@/lib/api'

import type { Region }
from '@/types/region'


/* ==================================================
SECTION 01 : TYPES
================================================== */

export type RegionSearchResponse={
ok:boolean
regions:Region[]
}

export type RegionUpdateResponse={
ok:boolean
}

export type CurrentRegionResponse={
ok:boolean
region:Region|null
}


/* ==================================================
SECTION 02 : TOKEN GUARD (🔥 핵심)
================================================== */

function hasToken(){

if(typeof window==='undefined')
return false

const token=
localStorage.getItem('accessToken')

return !!token

}


/* ==================================================
SECTION 03 : GET REGIONS
================================================== */

export async function getRegions(): Promise<Region[]> {

  const res = await apiFetch<{
    ok: boolean
    regions: Region[]
  }>('regions')

  return Array.isArray(res?.regions)
    ? res.regions
    : []
}


/* ==================================================
SECTION 04 : SEARCH REGIONS (SERVER SEARCH FIX)
================================================== */

export async function searchRegions(
  keyword: string
): Promise<RegionSearchResponse> {

  try {

    const q = keyword?.trim()

    if (!q || q.length < 2) {
      return {
        ok: true,
        regions: []
      }
    }

    return await apiFetch<RegionSearchResponse>(
      `regions/search?q=${encodeURIComponent(q)}`
    )

  } catch (error) {

    console.error('region search fail', error)

    return {
      ok: false,
      regions: []
    }
  }
}

/* ==================================================
SECTION 05 : CURRENT REGION (🔥 FIX)
================================================== */

export async function getCurrentRegion():
Promise<CurrentRegionResponse>{

/* 🔥 핵심 가드 */
if(!hasToken()){

return{
ok:true,
region:null
}

}

return apiFetch<CurrentRegionResponse>(
'regions/current'
)

}


/* ==================================================
SECTION 06 : GPS REGION
================================================== */

export async function getGpsRegion(
lat:number,
lng:number
):Promise<CurrentRegionResponse>{

if(!hasToken()){

return{
ok:true,
region:null
}

}

return apiFetch<CurrentRegionResponse>(
`regions/gps?lat=${lat}&lng=${lng}`
)

}


/* ==================================================
SECTION 07 : UPDATE PROFILE REGION
================================================== */

export async function updateMyRegion(
regionId:number|null,
detailAddress?:string|null
):Promise<RegionUpdateResponse>{

if(!hasToken()){
throw new Error('AUTH REQUIRED')
}

return apiFetch<RegionUpdateResponse>(
'regions/profile',
{
method:'PATCH',
body:{
regionId,
detailAddress:detailAddress||null
}
}
)

}


/* ==================================================
SECTION 08 : CLEAR REGION
================================================== */

export async function clearMyRegion():
Promise<RegionUpdateResponse>{

if(!hasToken()){
throw new Error('AUTH REQUIRED')
}

return apiFetch<RegionUpdateResponse>(
'regions/profile',
{
method:'PATCH',
body:{
regionId:null,
detailAddress:null
}
}
)

}


/* ==================================================
SECTION 09 : UPDATE FEED REGION
================================================== */

export async function updateFeedRegion(
regionId:number
):Promise<RegionUpdateResponse>{

if(!hasToken()){
throw new Error('AUTH REQUIRED')
}

return apiFetch<RegionUpdateResponse>(
'regions/feed',
{
method:'PATCH',
body:{regionId}
}
)

}


/* ==================================================
SECTION 10 : GET FEED REGION
================================================== */

export async function getFeedRegion():
Promise<CurrentRegionResponse>{

if(!hasToken()){

return{
ok:true,
region:null
}

}

return apiFetch<CurrentRegionResponse>(
'regions/feed'
)

}