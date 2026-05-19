// FILE : frontend/app/(after-login)/profile/business/create/posts/components/CategorySelectGeneral.tsx
// ROOT : frontend/app/(after-login)/profile/business/create/posts/components/CategorySelectGeneral.tsx
// STATUS : MODIFY MODE
// ROLE : BUSINESS POST TYPE SELECT COMPONENT
// CHANGE SUMMARY :
// - GALLERY 옵션 제거
// - REVIEW 옵션 제거
// - 비즈니스 포스트 작성 가능 타입을 EVENT / PRODUCT / GENERAL 3개로 제한
// - 기존 select UI / props 구조 유지

'use client'

// SECTION 01 : IMPORT

import type {
  BusinessPostType
} from './businessPostTypes'

// SECTION 02 : TYPE

type Props = {
  category: BusinessPostType | ''
  setCategory: (value: BusinessPostType) => void
  loading: boolean
}

type BusinessPostTypeOption = {
  value: BusinessPostType
  label: string
}

// SECTION 03 : CONSTANT

const options: BusinessPostTypeOption[] = [
  {
    value: 'EVENT',
    label: '이벤트'
  },
  {
    value: 'PRODUCT',
    label: '상품'
  },
  {
    value: 'GENERAL',
    label: '일반'
  }
]

// SECTION 04 : COMPONENT

export default function CategorySelectGeneral({
  category,
  setCategory,
  loading
}: Props) {
  // SECTION 05 : RETURN

  return (
    <select
      value={category || ''}
      disabled={loading}
      onChange={(event) => {
        const value = event.target.value as BusinessPostType

        if (value) {
          setCategory(value)
        }
      }}
      style={{
        width: '100%',
        height: 48,
        borderRadius: 12,
        border: '1px solid #e0e0e0',
        padding: '0 12px',
        fontSize: 14,
        opacity: loading ? 0.6 : 1
      }}
    >
      <option
        value=""
        disabled
      >
        게시물 타입 선택
      </option>

      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  )
}