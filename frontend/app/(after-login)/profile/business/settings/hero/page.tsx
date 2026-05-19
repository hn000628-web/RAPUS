// FILE : frontend/app/(after-login)/profile/business/settings/hero/page.tsx
// ROOT : frontend/app/(after-login)/profile/business/settings/hero/page.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS HERO SETTINGS PAGE
// CHANGE SUMMARY :
// - TypeScript profile 속성 오류 안전 처리
// - profileId + channelCode 안전 추출
// - authApi / profile-summary-api 임포트 추가
// - 기존 Hero API 호출 및 UI/스타일 유지

'use client'

// SECTION 01 : IMPORT
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMe, MeResponse } from '@/lib/authApi'
import { getProfileByChannelCode } from '@/lib/profile-summary-api'
import { uploadHeroImages } from '@/lib/profileApi'
import { connectBusinessHeroImage, deleteBusinessHeroImage, getBusinessHeroImages, reorderBusinessHeroImages, type BusinessHeroImage } from '@/lib/business/profile-hero-api'
import BaseModal from '@/components/ui/modal/BaseModal'
import type { CSSProperties, ChangeEvent } from 'react'

// SECTION 02 : CONSTANT / TYPE
const MAX_FILES = 5

type HeroUI = {
  id: number
  imageAssetId: number | null
  sortOrder: number
  imageUrl: string
}

type BusinessHeroContext = {
  profileId: number
  channelCode: string
}

type ProfileDetailSafe = {
  id?: number
  profileId?: number
  channelCode?: string
}

// =========================
// HELPER
// =========================
function normalizeHeroList(list: BusinessHeroImage[]): HeroUI[] {
  return list.filter(hero => hero?.id != null).map(hero => ({
    id: hero.id,
    imageAssetId: hero.imageAssetId ?? null,
    sortOrder: hero.sortOrder || 0,
    imageUrl: hero.imageUrl || ''
  })).sort((a,b)=>a.sortOrder - b.sortOrder)
}

function extractBusinessHeroContextSafe(profile: ProfileDetailSafe | null | undefined): BusinessHeroContext | null {
  if (!profile) return null
  const profileId = typeof profile.id === 'number' ? profile.id : typeof profile.profileId === 'number' ? profile.profileId : null
  const channelCode = typeof profile.channelCode === 'string' ? profile.channelCode.trim() : ''
  if (profileId === null || !channelCode) return null
  return { profileId, channelCode }
}

// =========================
// COMPONENT
// =========================
export default function CoverUploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [context, setContext] = useState<BusinessHeroContext | null>(null)
  const [existingHeroes, setExistingHeroes] = useState<HeroUI[]>([])
  const [originalHeroes, setOriginalHeroes] = useState<HeroUI[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({open:false,type:'success' as 'success'|'error',title:'',description:''})

  const totalCount = existingHeroes.length + files.length
  const remain = MAX_FILES - totalCount

  function getRemovedHeroIds(): number[] {
    const keptIds = new Set(existingHeroes.map(hero => hero.id))
    return originalHeroes.filter(hero => !keptIds.has(hero.id)).map(hero => hero.id)
  }

  function showErrorModal(description: string): void {
    setModal({open:true,type:'error',title:'실패',description})
  }

  // =========================
  // LOAD HERO DATA
  // =========================
  useEffect(()=>{
    const load = async()=>{
      try{
        const meResp: MeResponse = await getMe()
        if(!meResp.user?.channelCode) throw new Error('로그인 컨텍스트 없음')
        const channelCode = meResp.user.channelCode

        const profileDetail: ProfileDetailSafe = await getProfileByChannelCode(channelCode)
        const resolvedContext = extractBusinessHeroContextSafe(profileDetail)
        if(!resolvedContext) throw new Error('business hero context missing')
        setContext(resolvedContext)

        const heroList = await getBusinessHeroImages(resolvedContext.profileId,resolvedContext.channelCode)
        const normalized = normalizeHeroList(heroList)
        setExistingHeroes(normalized)
        setOriginalHeroes(normalized)
      }catch(error){
        console.error(error)
        showErrorModal('히어로 이미지 정보를 불러오지 못했습니다.')
      }
    }
    load()
  },[])

  // =========================
  // PREVIEW EFFECT
  // =========================
  useEffect(()=>{
    previewUrls.forEach(URL.revokeObjectURL)
    const next = files.map(file => URL.createObjectURL(file))
    setPreviewUrls(next)
    return ()=>{next.forEach(URL.revokeObjectURL)}
  }, [files])

  // =========================
  // EVENT HANDLERS
  // =========================
  const openPicker = () => { fileInputRef.current?.click() }
  const handleFiles = (event: ChangeEvent<HTMLInputElement>)=>{
    const pickedFiles = event.target.files ? Array.from(event.target.files) : []
    const nextRemain = MAX_FILES - existingHeroes.length
    setFiles(prev => [...prev,...pickedFiles].slice(0,nextRemain))
    event.target.value = ''
  }
  const removeExisting=(index:number)=>{setExistingHeroes(prev=>prev.filter((_,i)=>i!==index))}
  const removeAt=(index:number)=>{setFiles(prev=>prev.filter((_,i)=>i!==index))}
  const clearAll=()=>{setExistingHeroes([]);setFiles([])}

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async () => {
    if(loading||!context) return
    const { profileId, channelCode } = context

    try{
      setLoading(true)
      const removedHeroIds = getRemovedHeroIds()
      for(const heroId of removedHeroIds){
        await deleteBusinessHeroImage(profileId,heroId,channelCode)
      }
      let uploadedAssetIds: number[] = []
      if(files.length>0) uploadedAssetIds = await uploadHeroImages(files)

      const createdHeroes: HeroUI[] = []
      for(const assetId of uploadedAssetIds){
        if(typeof assetId!=='number'||Number.isNaN(assetId)||assetId<=0) continue
        const connectedHero = await connectBusinessHeroImage(profileId,{channelCode,imageAssetId:assetId,sortOrder:existingHeroes.length+createdHeroes.length+1})
        createdHeroes.push({id:connectedHero.id,imageAssetId:connectedHero.imageAssetId??null,sortOrder:connectedHero.sortOrder||0,imageUrl:connectedHero.imageUrl||''})
      }

      const finalOrderedHeroes = [...existingHeroes,...createdHeroes].map((hero,index)=>({heroId:hero.id,sortOrder:index+1}))
      if(finalOrderedHeroes.length>0) await reorderBusinessHeroImages(profileId,{channelCode,items:finalOrderedHeroes})

      const refreshedHeroes = await getBusinessHeroImages(profileId,channelCode)
      const normalized = normalizeHeroList(refreshedHeroes)
      setExistingHeroes(normalized)
      setOriginalHeroes(normalized)
      setFiles([])
      setModal({open:true,type:'success',title:'완료',description:'대표 이미지 저장 완료'})
    }catch(error){
      console.error(error)
      setModal({open:true,type:'error',title:'실패',description:'업로드 실패'})
    }finally{setLoading(false)}
  }

  // =========================
  // UI
  // =========================
  const heroItems = [...existingHeroes.map(hero=>({src:hero.imageUrl,isExisting:true})),...previewUrls.map(url=>({src:url,isExisting:false}))]

  return (
    <div style={pageWrap}>
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={innerStyle}>
            <h1 style={titleStyle}>대표 이미지 관리</h1>
            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFiles} style={{display:'none'}}/>
            <div style={panelStyle}>
              <div style={rowStyle}>
                <button onClick={openPicker} style={btnStyle} disabled={remain<=0}>+ 추가</button>
                <div style={{flex:1}}/>
                {totalCount>0 && <button onClick={clearAll} style={btnStyle}>전체삭제</button>}
              </div>
              <div style={gridStyle}>
                {heroItems.map((item,index)=>(
                  <div key={index} style={thumbWrap}>
                    <div style={{...thumb,backgroundImage:`url('${item.src}')`}}/>
                    {index===0 && <div style={mainBadge}>대표</div>}
                    <button onClick={()=>item.isExisting?removeExisting(index):removeAt(index-existingHeroes.length)} style={removeBtn}>×</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={saveWrap}>
              <button onClick={handleSubmit} disabled={loading||!context} style={{...saveBtn,opacity:loading?0.6:1,cursor:loading?'not-allowed':'pointer'}}>{loading?'저장중':'대표 이미지 저장'}</button>
            </div>
          </div>
        </div>
      </div>
      <BaseModal open={modal.open} type={modal.type} title={modal.title} description={modal.description} onClose={()=>setModal({...modal,open:false})}/>
    </div>
  )
}

// SECTION 11 : STYLE
const pageWrap: CSSProperties = {background:'#f5f6f7',minHeight:'100vh'}
const containerStyle: CSSProperties = {maxWidth:720,margin:'0 auto',padding:'0 20px'}
const cardStyle: CSSProperties = {background:'#fff',borderRadius:16,overflow:'hidden'}
const innerStyle: CSSProperties = {padding:'16px 20px'}
const titleStyle: CSSProperties = {fontSize:20,fontWeight:700,marginBottom:20}
const panelStyle: CSSProperties = {border:'2px dashed #cfd6dd',borderRadius:14,padding:16}
const rowStyle: CSSProperties = {display:'flex',gap:10,alignItems:'center'}
const btnStyle: CSSProperties = {padding:'10px 12px',borderRadius:10,border:'1px solid #e6e6e6',background:'#fff',fontSize:13,cursor:'pointer'}
const gridStyle: CSSProperties = {display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:16}
const thumbWrap: CSSProperties = {position:'relative',aspectRatio:'1/1'}
const thumb: CSSProperties = {width:'100%',height:'100%',borderRadius:14,backgroundSize:'cover',backgroundPosition:'center'}
const removeBtn: CSSProperties = {position:'absolute',top:8,right:8,width:24,height:24,borderRadius:999,background:'#000',color:'#fff',border:'none',cursor:'pointer'}
const mainBadge: CSSProperties = {position:'absolute',inset:0,background:'rgba(0,0,0,0.4)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}
const saveWrap: CSSProperties = {marginTop:24}
const saveBtn: CSSProperties = {width:'100%',height:56,borderRadius:14,background:'#2563eb',color:'#fff',border:'none',fontWeight:600}