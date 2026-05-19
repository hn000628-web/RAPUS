'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react'

import type { Region } from '@/types/region'

/* ======================================
   Context 타입
====================================== */

type FeedRegionContextType = {

  feedRegion: Region | null

  setRegion: (
    region: Region | null
  ) => void

}

/* ======================================
   Context 생성
====================================== */

const FeedRegionContext =
  createContext<
    FeedRegionContextType | null
  >(null)

/* ======================================
   Provider
====================================== */

export function FeedRegionProvider({

  children

}:{

  children: ReactNode

}){

  const [

    feedRegion,

    setFeedRegion

  ] =
    useState<Region | null>(null)

  /* ======================================
     초기 로딩
     LocalStorage → Context
  ====================================== */

  useEffect(()=>{

    try{

      const stored =
        localStorage.getItem(
          'feedRegion'
        )

      if(!stored)
        return

      const parsed:Region =
        JSON.parse(stored)

      if(parsed?.id){

        setFeedRegion(parsed)

      }

    }catch{

      localStorage.removeItem(
        'feedRegion'
      )

    }

  },[])

  /* ======================================
     지역 설정
  ====================================== */

  const setRegion = (

    region:Region | null

  )=>{

    setFeedRegion(region)

    try{

      if(region){

        localStorage.setItem(

          'feedRegion',

          JSON.stringify(region)

        )

      }else{

        localStorage.removeItem(

          'feedRegion'

        )

      }

    }catch{}

  }

  /* ======================================
     Provider
  ====================================== */

  return(

    <FeedRegionContext.Provider

      value={{

        feedRegion,

        setRegion

      }}

    >

      {children}

    </FeedRegionContext.Provider>

  )

}

/* ======================================
   Hook
====================================== */

export function useFeedRegion(){

  const context =
    useContext(
      FeedRegionContext
    )

  if(!context){

    throw new Error(

      'useFeedRegion must be used within FeedRegionProvider'

    )

  }

  return context

}