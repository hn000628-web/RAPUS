'use client'

/* ================================================== */
// SECTION 01 : IMPORT
/* ================================================== */

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

import { apiFetch } from '@/lib/api'
import ImageViewer from '@/components/viewer/ImageViewer'

/* ================================================== */
// SECTION 02 : TYPE
/* ================================================== */

type Photo = {
  id:number
  imageUrl:string
}

/* ================================================== */
// SECTION 03 : UTIL
/* ================================================== */

function resolveImageUrl(url:string){

  if(!url) return ''

  if(
    url.startsWith('http://') ||
    url.startsWith('https://')
  ){
    return url
  }

  return `/media/${url}`
}

/* ================================================== */
// SECTION 04 : COMPONENT
/* ================================================== */

export default function PhotoViewerPage(){

  const router = useRouter()
  const params = useParams()

  const photoId =
    Number(params?.photoId)

  const [photos,setPhotos] = useState<Photo[]>([])
  const [currentIndex,setCurrentIndex] = useState(0)
  const [loading,setLoading] = useState(true)

/* ================================================== */
// SECTION 05 : LOAD
/* ================================================== */

  useEffect(()=>{

    const load = async()=>{

      try{

        const data:any =
          await apiFetch('profiles/gallery')

        const list:Photo[] =
          (data?.gallery ?? []).map((p:any)=>({
            id:p.id,
            imageUrl:resolveImageUrl(p.imageUrl)
          }))

        if(list.length === 0){
          router.back()
          return
        }

        const index =
          list.findIndex(p=>p.id === photoId)

        setPhotos(list)

        setCurrentIndex(
          index >= 0 ? index : 0
        )

      }catch(e){

        console.error('[PHOTO LOAD FAIL]',e)
        router.back()

      }finally{

        setLoading(false)

      }

    }

    load()

  },[photoId,router])

/* ================================================== */
// SECTION 06 : NAV
/* ================================================== */

  const onPrev = ()=>{
    setCurrentIndex(i=>Math.max(0,i-1))
  }

  const onNext = ()=>{
    setCurrentIndex(i=>Math.min(photos.length-1,i+1))
  }

/* ================================================== */
// SECTION 07 : GUARD
/* ================================================== */

  if(loading || photos.length === 0){
    return null
  }

/* ================================================== */
// SECTION 08 : VIEWER
/* ================================================== */

  return(

    <ImageViewer
      open={true}                    // 🔥 항상 열림
      images={photos}
      index={currentIndex}
      onClose={()=>router.back()}   // 🔥 페이지 종료
      onPrev={onPrev}
      onNext={onNext}
    />

  )

}