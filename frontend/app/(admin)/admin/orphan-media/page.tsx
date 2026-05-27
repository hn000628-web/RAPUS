// FILE : frontend/app/admin/orphan-media/page.tsx
// ROOT : frontend/app/admin/orphan-media/page.tsx
// STATUS : ADMIN ORPHAN MEDIA STORAGE HEALTH UI
// ROLE : STORAGE MAINTENANCE PANEL

// SECTION 01 : IMPORT

'use client'

import { useEffect,useState } from 'react'

import { adminFetch } from '@/lib/adminApi'


// SECTION 02 : TYPE

type OrphanAsset={

  id:number

  channelCode:string

  usageType:string

  filePath:string

  fileName:string

  fileSize:number

  createdAt:string

}


// SECTION 03 : CONSTANT

const PAGE_TITLE='Orphan Media'

function formatSize(bytes:number){

  if(bytes===0) return '0 MB'

  const mb=
  bytes/1024/1024

  return mb.toFixed(2)+' MB'

}


// SECTION 04 : STATE

export default function OrphanMediaPage(){

const[assets,setAssets]=
useState<OrphanAsset[]>([])

const[loading,setLoading]=
useState<boolean>(false)

const[showDetails,setShowDetails]=
useState<boolean>(false)

const[lastScan,setLastScan]=
useState<string>('')

const[lastClean,setLastClean]=
useState<string>('')


// SECTION 05 : DERIVED DATA

const totalFiles=
assets.length

const totalSize=
assets.reduce(
(acc,a)=>acc+a.fileSize,
0
)


// SECTION 06 : DATA FUNCTION

async function loadOrphans(){

try{

setLoading(true)

const res=
await adminFetch(
'/admin/media/orphan'
)

setAssets(res)

setLastScan(
new Date().toLocaleString()
)

}catch(error){

console.error(
'[ADMIN ORPHAN LOAD ERROR]',
error
)

}finally{

setLoading(false)

}

}


async function cleanAll(){

if(assets.length===0)
return

if(!confirm(
'Clean all orphan media?'
))
return

try{

await adminFetch(

'/admin/media/orphan/clear',

{
method:'DELETE'
}

)

setLastClean(
new Date().toLocaleString()
)

loadOrphans()

}catch(error){

console.error(
'[ADMIN ORPHAN CLEAN ERROR]',
error
)

}

}


// SECTION 07 : EFFECT

useEffect(()=>{

loadOrphans()

},[])


// SECTION 08 : UI BLOCK

const SummaryUI=(

<div
className="bg-white border rounded p-6 mb-6"
>

<h2
className="text-xl font-semibold mb-4"
>

Storage Status

</h2>

<div
className="space-y-2"
>

<div>

Orphan files :

<strong className="ml-2">
{totalFiles}
</strong>

</div>

<div>

Reclaimable storage :

<strong className="ml-2">
{formatSize(totalSize)}
</strong>

</div>

</div>

</div>

)


const ActionUI=(

<div
className="bg-white border rounded p-6 mb-6"
>

<h2
className="text-xl font-semibold mb-4"
>

Actions

</h2>

<div
className="flex gap-3"
>

<button

className="px-4 py-2 bg-gray-200 rounded"

onClick={loadOrphans}

>

Refresh Scan

</button>

<button

className="px-4 py-2 bg-red-500 text-white rounded"

onClick={cleanAll}

>

Clean Now

</button>

<button

className="px-4 py-2 bg-gray-100 rounded"

onClick={()=>
setShowDetails(
!showDetails
)
}

>

{

showDetails
?
'Hide Details'
:
'Show Details'

}

</button>

</div>

</div>

)


const HistoryUI=(

<div
className="bg-white border rounded p-6 mb-6"
>

<h2
className="text-xl font-semibold mb-4"
>

History

</h2>

<div
className="space-y-2 text-sm"
>

<div>

Last scan :

{lastScan||'-'}

</div>

<div>

Last clean :

{lastClean||'-'}

</div>

</div>

</div>

)


const TableUI=(

<div
className="bg-white border rounded p-6"
>

<table
className="w-full border"
>

<thead>

<tr
className="bg-gray-100"
>

<th>ID</th>

<th>channelCode</th>

<th>usageType</th>

<th>filePath</th>

<th>size</th>

<th>created</th>

</tr>

</thead>

<tbody>

{

assets.map(asset=>(

<tr
key={asset.id}
className="border-t"
>

<td>
{asset.id}
</td>

<td>
{asset.channelCode}
</td>

<td>
{asset.usageType}
</td>

<td
className="text-sm"
>
{asset.filePath}
</td>

<td>
{formatSize(asset.fileSize)}
</td>

<td
className="text-sm"
>
{asset.createdAt}
</td>

</tr>

))

}

</tbody>

</table>

</div>

)


const LoadingUI=(

<div
className="p-10 text-center"
>

Scanning storage...

</div>

)


// SECTION 09 : RETURN

return(

<div
className="p-8"
>

<h1
className="text-2xl font-bold mb-6"
>

{PAGE_TITLE}

</h1>

{

loading
?
LoadingUI
:
<>

{SummaryUI}

{ActionUI}

{HistoryUI}

{

showDetails
&&
TableUI

}

</>

}

</div>

)

}