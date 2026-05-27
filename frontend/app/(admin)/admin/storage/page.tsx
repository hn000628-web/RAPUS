// FILE : frontend/app/admin/storage/page.tsx
// ROOT : frontend/app/admin/storage/page.tsx

'use client'

// SECTION 01 : IMPORT
import { useState } from 'react'
import { adminFetch } from '@/lib/adminApi'

// SECTION 02 : TYPE
type CleanResult = {
  success:boolean
  message?:string
}

// SECTION 03 : COMPONENT

export default function AdminStoragePage(){

  // SECTION 04 : STATE
  const [loading,setLoading] = useState(false)
  const [result,setResult] = useState<string>('')

  // SECTION 05 : CLEAN ALL

  async function runFullCleanup(){

    const ok = confirm('전체 DB 정리 실행할까요?\n(중복 + orphan + invalid)')
    if(!ok) return

    setLoading(true)
    setResult('Running...')

    try{

      const res = await adminFetch('/api/admin/cleanup/full',{
        method:'POST'
      })

      const data:CleanResult = await res.json()

      if(data.success){
        setResult('✅ Cleanup Complete')
      }else{
        setResult('❌ Failed')
      }

    }catch(err){
      console.error(err)
      setResult('❌ Error')
    }

    setLoading(false)
  }

  // SECTION 06 : UI

  return(

    <div style={{
      padding:40,
      maxWidth:900
    }}>

      {/* SECTION 07 : TITLE */}
      <h1>Storage Status</h1>

      {/* SECTION 08 : CLEAN PANEL */}
      <div style={{
        border:'1px solid #ccc',
        padding:20,
        marginTop:20
      }}>

        <h2>DB Maintenance</h2>

        <ul>
          <li>Duplicate Profile Blocks</li>
          <li>Orphan Images</li>
          <li>Broken Relations</li>
        </ul>

        <button
          onClick={runFullCleanup}
          disabled={loading}
          style={{
            marginTop:20,
            padding:'10px 20px',
            background:'#ff4d4f',
            color:'#fff',
            border:'none',
            cursor:'pointer'
          }}
        >
          {loading ? 'Cleaning...' : 'Run Full Cleanup'}
        </button>

        <p style={{marginTop:10}}>
          {result}
        </p>

      </div>

    </div>

  )

}