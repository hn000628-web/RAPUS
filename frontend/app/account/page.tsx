'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AccountPage(){

const router = useRouter()
const { profile } = useAuth()

const isLogin = !!profile

function go(path:string){
  router.push(path)
}

return(

<div style={wrapper}>

  <div style={title}>
    RAPUS
  </div>

  {!isLogin && (

    <>
      <div style={desc}>
        동네 기반 라이프 & 비즈니스 플랫폼
      </div>

      <div style={ctaWrap}>
        <button style={primary} onClick={()=>go('/login')}>
          시작하기
        </button>
      </div>
    </>

  )}

  {isLogin && (

    <div style={grid}>

      <Item label="프로필" onClick={()=>go('/profile')} />
      <Item label="라이프" onClick={()=>go('/feed/life')} />
      <Item label="플레이스" onClick={()=>go('/feed/place')} />
      <Item label="비즈니스" onClick={()=>go('/profile/business')} />

    </div>

  )}

</div>

)

}

function Item({
label,
onClick
}:{label:string,onClick:()=>void}){

return(

<div style={item} onClick={onClick}>
  <div style={circle}/>
  <div style={text}>{label}</div>
</div>

)

}

const wrapper:React.CSSProperties={

minHeight:'100vh',
display:'flex',
flexDirection:'column',
alignItems:'center',
justifyContent:'center',
gap:20,
background:'#ffffff'

}

const title:React.CSSProperties={

fontSize:32,
fontWeight:800

}

const desc:React.CSSProperties={

fontSize:14,
color:'#6b7280'

}

const ctaWrap:React.CSSProperties={

marginTop:20

}

const primary:React.CSSProperties={

padding:'10px 20px',
borderRadius:10,
background:'#111827',
color:'#fff',
border:'none',
cursor:'pointer'

}

const grid:React.CSSProperties={

display:'grid',
gridTemplateColumns:'repeat(2,120px)',
gap:20,
marginTop:20

}

const item:React.CSSProperties={

display:'flex',
flexDirection:'column',
alignItems:'center',
cursor:'pointer',
gap:8

}

const circle:React.CSSProperties={

width:64,
height:64,
borderRadius:'50%',
background:'#f1f5f9'

}

const text:React.CSSProperties={

fontSize:13

}
