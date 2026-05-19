'use client';

type Props={

bio:string;

setBio:(v:string)=>void;

};

export default function ProfileIntroSection({

bio,
setBio

}:Props){

return(

<div style={{

marginBottom:30

}}>

<label style={{

fontSize:14,
fontWeight:600

}}>
소개
</label>

<textarea

value={bio}

onChange={(e)=>
setBio(e.target.value)
}

placeholder="프로필 소개 작성"

style={{

width:'100%',
minHeight:120,

marginTop:8,

padding:16,

borderRadius:12,

border:'1px solid #e5e7eb',

resize:'vertical',

boxSizing:'border-box'

}}

/>

</div>

);

}