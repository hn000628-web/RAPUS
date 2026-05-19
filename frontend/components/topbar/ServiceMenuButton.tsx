'use client'

import Image from 'next/image'

type Props = {
  onClick: () => void
}

export default function ServiceMenuButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      <Image
        src="/icons/service-menu.png"
        alt="service menu"
        width={28}
        height={28}
        priority
      />
    </button>
  )
}