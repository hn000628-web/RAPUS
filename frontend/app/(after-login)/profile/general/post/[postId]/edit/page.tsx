'use client'

/* ==================================================
SECTION 01 : IMPORT
================================================== */

import {
  useEffect,
  useMemo,
  useState,
  useCallback
} from 'react'

import {
  useParams,
  useRouter
} from 'next/navigation'

import type { Category } from '../../../../business/create/posts/components/businessPostTypes'

import StatusToggle from '../../../../create/components/statusToggle'
import ImageUploader from '../../../../create/components/ImageUploader'
import PostFields from '../../../../create/components/personal/PersonalPostFields'

/* ==================================================
SECTION 02 : CONST
================================================== */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:4000'

/* ==================================================
SECTION 03 : TYPE
================================================== */

type EditImage =
  | { kind:'EXISTING'; id:number; src:string }
  | { kind:'NEW'; file:File; src:string }

type PostResponse = {
  ok:boolean
  post:any
}

/* ==================================================
SECTION 04 : COMPONENT
================================================== */

export default function EditPage(){

  const params = useParams()
  const router = useRouter()

  const id =
    typeof params.postId === 'string'
      ? Number(params.postId)
      : NaN

  const [category,setCategory] =
    useState<Category|''>('')

  const [status,setStatus] =
    useState<'ACTIVE'|'DRAFT'>('DRAFT')

  const [title,setTitle] = useState('')
  const [content,setContent] = useState('')

  const [price,setPrice] = useState('')
  const [keywords,setKeywords] = useState('')

  const [tradeRegionId,setTradeRegionId] =
    useState<number|null>(null)

  const [profileRegionId,setProfileRegionId] =
    useState<number|null>(null)

  const [profileRegionName,setProfileRegionName] =
    useState<string|null>(null)

  const [images,setImages] =
    useState<EditImage[]>([])

  const [loading,setLoading] = useState(true)
  const [submitting,setSubmitting] =
    useState(false)

  const disabled = loading || submitting

  /* ==================================================
  SECTION 05 : LOAD POST
  ================================================== */

  useEffect(()=>{

    if(!id || Number.isNaN(id)){
      alert('잘못된 게시물입니다.')
      router.push('/profile')
      return
    }

    const fetchPost = async()=>{

      try{

        const token =
          localStorage.getItem('accessToken')

        const res = await fetch(
          `${API_BASE_URL}/api/posts/${id}`,
          {
            headers:{
              Authorization:`Bearer ${token}`
            }
          }
        )

        const data =
          await res.json() as PostResponse

        if(!res.ok || !data.ok){
          throw new Error()
        }

        const post = data.post

        setContent(post.content ?? '')
        setCategory(post.categoryCode ?? '')
        setStatus(post.status ?? 'DRAFT')
        setTradeRegionId(post.regionId ?? null)

        if(post.images?.length){

          setImages(
            post.images.map((img:any)=>({
              kind:'EXISTING',
              id:img.imageAssetId,
              src:
                img.imageUrl?.startsWith('http')
                  ? img.imageUrl
                  : `${API_BASE_URL}${img.imageUrl}`
            }))
          )

        }

      }catch{

        alert('게시물을 불러오지 못했습니다.')
        router.push('/profile')

      }finally{

        setLoading(false)

      }

    }

    fetchPost()

  },[id,router])

  /* ==================================================
  SECTION 06 : IMAGE HANDLER
  ================================================== */

  const handleAddImages = useCallback((files:File[])=>{

    setImages(prev=>{

      if(prev.length + files.length > 5){
        alert('이미지는 최대 5개까지 가능합니다.')
        return prev
      }

      const newItems = files.map(file=>({
        kind:'NEW' as const,
        file,
        src:URL.createObjectURL(file)
      }))

      return [...prev,...newItems]

    })

  },[])

  const handleRemoveImage = useCallback((index:number)=>{

    setImages(prev =>
      prev.filter((_,i)=>i!==index)
    )

  },[])

  /* ==================================================
  SECTION 07 : PREVIEW
  ================================================== */

  const previewImages = useMemo(()=>(

    images.map(img=>({
      id: img.kind === 'EXISTING' ? img.id : undefined,
      src: img.src
    }))

  ),[images])

/* ==================================================
SECTION 08 : SUBMIT (🔥 DEDUPE + SAFE FIX)
================================================== */

const handleSubmit = async()=>{

  if(disabled) return

  if(!content.trim()){
    return alert('내용을 입력하세요.')
  }

  if(!category){
    return alert('카테고리를 선택하세요.')
  }

  setSubmitting(true)

  try{

    const token =
      localStorage.getItem('accessToken')

    /* =========================
    🔥 NEW 이미지 업로드
    ========================= */

    const newImages =
      images.filter(img => img.kind === 'NEW')

    let newImageIds:number[] = []

    if(newImages.length){

      const formData = new FormData()

      newImages.forEach(img=>{
        formData.append('files', img.file)
      })

      const uploadRes = await fetch(
        `${API_BASE_URL}/api/media/upload`,
        {
          method:'POST',
          headers:{
            Authorization:`Bearer ${token}`
          },
          body: formData
        }
      )

      const uploadData = await uploadRes.json()

      if(!uploadRes.ok || !uploadData.ok){
        throw new Error('UPLOAD_FAILED')
      }

      newImageIds =
        uploadData.files.map((f:any)=>Number(f.assetId)) // 🔥 assetId 사용
    }

    /* =========================
    🔥 기존 이미지
    ========================= */

    const existingIds = images
      .filter(img => img.kind === 'EXISTING')
      .map(img => Number(img.id))

    /* =========================
    🔥 병합 + 중복 제거 + 정제 (핵심)
    ========================= */

    const imageAssetIds = Array.from(
      new Set(
        [
          ...existingIds,
          ...newImageIds
        ]
        .map(v => Number(v))
        .filter(v => Number.isInteger(v) && v > 0)
      )
    )

    /* =========================
    REGION
    ========================= */

    const resolvedRegionId =
      tradeRegionId === null
        ? null
        : tradeRegionId

    /* =========================
    PATCH
    ========================= */

    const res = await fetch(
      `${API_BASE_URL}/api/posts/${id}`,
      {
        method:'PATCH',
        headers:{
          Authorization:`Bearer ${token}`,
          'Content-Type':'application/json'
        },
        body: JSON.stringify({
          content: content.trim(),
          categoryCode: category,
          regionId: resolvedRegionId,
          visibility: 'PUBLIC',
          imageAssetIds
        })
      }
    )

    const data = await res.json()

    if(!res.ok || !data.ok){
      throw new Error()
    }

    alert('게시물이 수정되었습니다.')

    router.push(`/profile/general/post/${id}`)

  }catch(err){

    console.error(err)
    alert('수정 실패')

  }finally{

    setSubmitting(false)

  }

}

  /* ==================================================
  SECTION 09 : RENDER
  ================================================== */

  if(loading){
    return (
      <div style={{padding:40}}>
        로딩중...
      </div>
    )
  }

  return(

    <div style={{
      background:'#f0f2f5',
      minHeight:'100vh',
      padding:'20px 0 40px'
    }}>

      <div style={{
        maxWidth:600,
        margin:'0 auto',
        padding:'0 16px'
      }}>

        <div style={{
          background:'#fff',
          borderRadius:16,
          padding:24,
          boxShadow:'0 4px 20px rgba(0,0,0,0.06)'
        }}>

          <h2 style={{
            fontSize:22,
            fontWeight:700,
            marginBottom:20
          }}>
            게시물 수정
          </h2>

          <StatusToggle
            status={status}
            setStatus={setStatus}
            loading={disabled}
          />

          <ImageUploader
            previewImages={previewImages}
            onAdd={handleAddImages}
            onRemove={handleRemoveImage}
            loading={disabled}
          />

          <PostFields
            category={category}
            setCategory={setCategory}
            tradeRegionId={tradeRegionId}
            setTradeRegionId={setTradeRegionId}
            profileRegionId={profileRegionId}
            profileRegionName={profileRegionName}
            title={title}
            setTitle={setTitle}
            keywords={keywords}
            setKeywords={setKeywords}
            content={content}
            setContent={setContent}
            price={price}
            setPrice={setPrice}
            loading={disabled}
          />

          <div style={{
            marginTop:24
          }}>
            <button
              onClick={handleSubmit}
              disabled={disabled}
              style={{
                width:'100%',
                padding:14,
                borderRadius:12,
                border:'none',
                background:'#1877f2',
                color:'#fff',
                fontSize:15,
                fontWeight:600,
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}
            >
              {disabled ? '처리중...' : '수정하기'}
            </button>
          </div>

        </div>

      </div>

    </div>

  )

}