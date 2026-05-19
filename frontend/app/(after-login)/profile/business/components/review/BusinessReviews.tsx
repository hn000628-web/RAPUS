'use client'

export default function BusinessReviews(){

  return (
    <div style={{padding:16}}>

      <h3>리뷰</h3>

      <div style={{
        display:'flex',
        flexDirection:'column',
        gap:12
      }}>

        {[1,2,3].map(i=>(
          <div
            key={i}
            style={{
              borderBottom:'1px solid #eee',
              paddingBottom:8
            }}
          >
            <div>⭐️⭐️⭐️⭐️☆</div>
            <div>리뷰 내용 {i}</div>
          </div>
        ))}

      </div>

    </div>
  )

}