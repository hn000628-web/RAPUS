// FILE : frontend/app/(after-login)/profile/business/settings/avatar/page.tsx
// ROOT : frontend/app/(after-login)/profile/business/settings/avatar/page.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS AVATAR SETTINGS PAGE
// CHANGE SUMMARY :
// - MEDIA_BASE_URL 하드코딩 제거
// - buildMediaUrl() 동적 환경 기반 URL 처리 적용
// - 로그인 정보 API getMe() 사용
// - 단일 귀속 컨텍스트(profileId + channelCode) 적용
// - profile-avatar-api 전용 read/write/delete 구조 유지
// - 기존 UI/스타일/JSX 구조 유지

'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BaseModal from '@/components/ui/modal/BaseModal'

import { uploadBusinessAvatar } from '@/lib/business/mediaApi'
import { getBusinessProfileDetail } from '@/lib/business/profile-settings-api'
import { getBusinessProfileAvatar, connectBusinessProfileAvatar, deleteBusinessProfileAvatar } from '@/lib/business/profile-avatar-api'
import { getMe, MeResponse } from '@/lib/authApi'
import type { ChangeEvent, CSSProperties } from 'react'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/png','image/jpeg','image/webp']

type BusinessContextState = {
  profileId: number | null
  channelCode: string | null
}

type BusinessAvatarResponse = {
  filePath?: string | null
  imageUrl?: string | null
} | null

function AvatarUploadPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const [context, setContext] = useState<BusinessContextState>({ profileId:null, channelCode:null })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [current, setCurrent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleteMode, setDelete] = useState(false)
  const [modal, setModal] = useState({open:false,type:'success' as 'success' | 'error',title:'',description:''})

  const canSubmit = !loading && (file!==null || deleteMode || preview!==null)

  // =========================
  // buildMediaUrl : 환경변수 기반 동적 처리
  // =========================
  const buildMediaUrl = (filePath: string | null) => {
    if (!filePath) return null
    if (filePath.startsWith('http') || filePath.startsWith('blob:')) return filePath
    const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`
    const base = process.env.NEXT_PUBLIC_MEDIA_BASE || '/media'
    return `${base}${normalizedPath}?v=${Date.now()}`
  }

  // =========================
  // 나머지 기존 코드 그대로 유지
  // =========================
  useEffect(() => {
    async function loadContext() {
      try {
        const meResp: MeResponse = await getMe()
        if (!meResp.user?.channelCode) throw new Error('로그인 컨텍스트 없음')
        const channelCode = searchParams.get('channelCode') ?? meResp.user.channelCode
        const detail = await getBusinessProfileDetail(channelCode)
        const nextProfileId = detail?.profile?.id ?? null
        const nextChannelCode = detail?.profile?.channelCode ?? channelCode
        setContext({ profileId: nextProfileId, channelCode: nextChannelCode })
        if (nextProfileId && nextChannelCode) await loadAvatarByContext(nextProfileId,nextChannelCode)
        else { setCurrent(null); setPreview(null); setDelete(false); setFile(null) }
      } catch {
        setContext({ profileId:null, channelCode:null })
        setCurrent(null); setPreview(null); setDelete(false); setFile(null)
      }
    }
    void loadContext()
    return () => { if(objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current) }
  },[searchParams])

  const loadAvatarByContext = async (profileId:number, channelCode:string) => {
    const avatar = await getBusinessProfileAvatar(profileId,channelCode) as BusinessAvatarResponse
    const avatarUrl = buildMediaUrl(avatar?.imageUrl ?? avatar?.filePath ?? null)
    setCurrent(avatarUrl)
    setPreview(avatarUrl)
  }

  const pick = () => { if(inputRef.current){ inputRef.current.value=''; inputRef.current.click() } }
  const onFile = (e:ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]; if(!selectedFile) return
    if(!ALLOWED_TYPES.includes(selectedFile.type)){ setModal({open:true,type:'error',title:'파일 오류',description:'png jpg webp만 가능'}); return }
    if(selectedFile.size>MAX_SIZE){ setModal({open:true,type:'error',title:'파일 오류',description:'5MB 이하'}); return }
    if(objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const objectUrl = URL.createObjectURL(selectedFile)
    objectUrlRef.current = objectUrl
    setFile(selectedFile)
    setPreview(objectUrl)
    setDelete(false)
  }
  const clear = () => { if(!preview&&!current) return; setFile(null); setPreview(null); setDelete(true) }

  const submit = async () => {
    if(loading || (file===null&&!deleteMode&&preview===null)) return
    const resolvedChannelCode = context.channelCode ?? null
    if(!resolvedChannelCode){ setModal({open:true,type:'error',title:'실패',description:'channelCode missing'}); return }

    let resolvedProfileId = context.profileId
    let resolvedContextChannelCode = resolvedChannelCode

    if(!resolvedProfileId){
      try{
        const detail = await getBusinessProfileDetail(resolvedContextChannelCode)
        resolvedProfileId = detail?.profile?.id ?? null
        resolvedContextChannelCode = detail?.profile?.channelCode ?? resolvedContextChannelCode
        setContext({profileId:resolvedProfileId,channelCode:resolvedContextChannelCode})
      }catch{ resolvedProfileId=null }
    }

    if(!resolvedProfileId){ setModal({open:true,type:'error',title:'실패',description:'profileId missing'}); return }

    setLoading(true)
    try{
      if(deleteMode){
        await deleteBusinessProfileAvatar(resolvedProfileId,{channelCode:resolvedContextChannelCode})
        await loadAvatarByContext(resolvedProfileId,resolvedContextChannelCode)
        setModal({open:true,type:'success',title:'완료',description:'삭제 완료'}); return
      }
      if(file){
        const uploaded = await uploadBusinessAvatar(file,{channelCode:resolvedContextChannelCode})
        await connectBusinessProfileAvatar(resolvedProfileId,{channelCode:resolvedContextChannelCode,imageAssetId:uploaded.assetId})
        await loadAvatarByContext(resolvedProfileId,resolvedContextChannelCode)
        setModal({open:true,type:'success',title:'완료',description:'저장 완료'}); return
      }
      if(preview){
        setModal({open:true,type:'success',title:'완료',description:'현재 이미지 유지 상태'}); return
      }
    }catch(error){
      console.error(error)
      setPreview(current); setDelete(false); setFile(null)
      setModal({open:true,type:'error',title:'실패',description:'처리 실패'})
    }finally{ setLoading(false) }
  }

  const closeModal = () => {
    setModal({...modal,open:false})
    router.replace(context.channelCode?`/profile/business/settings/avatar?channelCode=${context.channelCode}`:'/profile/business/settings/avatar')
  }

  return (
    <div style={{width:'100%',minHeight:'100vh',background:'#f5f6f7'}}>
      <div style={{width:'100%',maxWidth:720,margin:'0 auto',padding:'0px 20px'}}>
        <div style={{background:'#fff',borderRadius:16,overflow:'hidden'}}>
          <div style={{padding:'16px 20px'}}>
            <h1 style={{fontSize:20,fontWeight:700,marginBottom:20}}>프로필 이미지</h1>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} style={{display:'none'}} />
            <div style={{borderRadius:14,border:'2px dashed #cfd6dd',background:'#fff',padding:16}}>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <button onClick={pick} style={{padding:'10px 12px',borderRadius:10,border:'1px solid #e6e6e6',background:'#fff',fontSize:13,cursor:'pointer'}}>이미지 선택</button>
                <div style={{flex:1}}/>
                {preview && <button onClick={clear} style={{padding:'10px 12px',borderRadius:10,border:'1px solid #e6e6e6',background:'#fff',fontSize:13,cursor:'pointer'}}>삭제</button>}
              </div>
              <div style={{fontSize:12,color:'#666',marginTop:8,marginBottom:16}}>
                {file?'새 이미지':deleteMode?'삭제 예정':preview?'현재 이미지':'이미지 선택'}
              </div>
              {!preview?<button onClick={pick} style={{width:180,height:180,borderRadius:'50%',border:'1px dashed #e6e6e6',background:'#fafafa',margin:'0 auto',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>이미지 선택</button>
                :<div style={{display:'flex',justifyContent:'center'}}>
                  <div onClick={pick} style={{width:180,height:180,borderRadius:'50%',backgroundSize:'cover',backgroundPosition:'center',border:'1px solid #e6e6e6',cursor:'pointer',backgroundImage:`url('${preview}')`}}/>
                </div>
              }
            </div>
            <div style={{marginTop:24}}>
              <button disabled={!canSubmit} onClick={submit} style={{width:'100%',height:56,borderRadius:14,background:'#2563eb',color:'#fff',border:'none',fontWeight:600,fontSize:15,opacity:canSubmit?1:0.4,cursor:canSubmit?'pointer':'not-allowed'}}>{loading?'저장중':'저장'}</button>
            </div>
          </div>
        </div>
      </div>
      <BaseModal open={modal.open} type={modal.type} title={modal.title} description={modal.description} onClose={closeModal}/>
    </div>
  )
}

export default function AvatarUploadPage() {
  return (
    <Suspense fallback={<div>비즈니스 프로필 이미지를 불러오는 중입니다.</div>}>
      <AvatarUploadPageContent />
    </Suspense>
  )
}
