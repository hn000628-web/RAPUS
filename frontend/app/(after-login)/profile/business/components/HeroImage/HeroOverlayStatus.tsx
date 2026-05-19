// FILE: frontend/app/(after-login)/profile/business/components/HeroOverlayStatus.tsx
// ROOT: frontend/app/(after-login)/profile/business/components/HeroOverlayStatus.tsx
// STATUS: PRODUCTION READY
// ROLE: BUSINESS HERO IMAGE OVERLAY STATUS
// CHANGE SUMMARY:
// - 영업중/영업종료 상태를 히어로 이미지 오버레이로 표시
// - 관리자용 상태 표시 전용, 공개 뷰와 분리
// - 색상 구분: 영업중=초록, 영업종료=빨강
// - 재사용 가능한 HeroOverlayStatus 컴포넌트

'use client'

import React from 'react'

export type HeroOverlayStatusProps = {
  /** 영업 상태: true=영업중, false=영업종료 */
  isOpen: boolean
  /** 표시 텍스트: 기본값 "영업중"/"영업종료" */
  label?: string
}

export default function HeroOverlayStatus({
  isOpen,
  label
}: HeroOverlayStatusProps) {
  // 기본 라벨 처리
  const displayLabel = label ?? (isOpen ? '영업중' : '영업종료')

  // 배경 색상
  const backgroundColor = isOpen
    ? 'rgba(34, 197, 94, 0.8)' // 초록
    : 'rgba(239, 68, 68, 0.8)' // 빨강

  return (
    <div
      aria-label={`관리자용 영업 상태: ${displayLabel}`}
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        padding: '4px 10px',
        borderRadius: 12,
        fontWeight: 800,
        color: '#ffffff',
        background: backgroundColor,
        zIndex: 5,
        fontSize: 13,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        pointerEvents: 'none' // 오버레이 클릭 방지
      }}
    >
      {displayLabel}
    </div>
  )
}