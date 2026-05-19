'use client'

import type { ReactNode } from 'react'

import TopMenuZone from '@/components/topbar/TopMenuZone'

type Props = {
  children: ReactNode
}

export default function ChannelOrderLayout({
  children
}: Props) {
  return (
    <>
      <TopMenuZone showDevViewportSize />
      {children}
    </>
  )
}
