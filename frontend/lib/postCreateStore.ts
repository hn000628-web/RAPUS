/* =========================================
   Post Create Store
   frontend/lib/postCreateStore.ts
========================================= */

type PostImage = {
  id?: number
  imageUrl: string
  sortOrder?: number
}

type PostDraft = {
  title: string
  content: string
  categoryId?: number
  regionId?: number
  price?: number
  images: PostImage[]
}

type PostCreateState = {
  draft: PostDraft
  uploading: boolean
  submitting: boolean
}

/* =========================================
   내부 상태
========================================= */

let state: PostCreateState = {
  draft: {
    title: '',
    content: '',
    images: []
  },
  uploading: false,
  submitting: false
}

/* =========================================
   Draft 반환
========================================= */

export function getDraft(): PostDraft {
  return state.draft
}

/* =========================================
   제목 설정
========================================= */

export function setTitle(title: string) {
  state.draft.title = title
}

/* =========================================
   내용 설정
========================================= */

export function setContent(content: string) {
  state.draft.content = content
}

/* =========================================
   카테고리 설정
========================================= */

export function setCategory(categoryId: number) {
  state.draft.categoryId = categoryId
}

/* =========================================
   지역 설정
========================================= */

export function setRegion(regionId: number) {
  state.draft.regionId = regionId
}

/* =========================================
   가격 설정
========================================= */

export function setPrice(price: number) {
  state.draft.price = price
}

/* =========================================
   이미지 추가
========================================= */

export function addImage(imageUrl: string) {

  const image: PostImage = {
    imageUrl,
    sortOrder: state.draft.images.length
  }

  state.draft.images = [
    ...state.draft.images,
    image
  ]
}

/* =========================================
   이미지 삭제
========================================= */

export function removeImage(index: number) {

  state.draft.images =
    state.draft.images.filter(
      (_, i) => i !== index
    )

}

/* =========================================
   업로드 상태
========================================= */

export function setUploading(value: boolean) {
  state.uploading = value
}

export function isUploading(): boolean {
  return state.uploading
}

/* =========================================
   제출 상태
========================================= */

export function setSubmitting(value: boolean) {
  state.submitting = value
}

export function isSubmitting(): boolean {
  return state.submitting
}

/* =========================================
   Draft 초기화
========================================= */

export function resetDraft() {

  state.draft = {
    title: '',
    content: '',
    images: []
  }

  state.uploading = false
  state.submitting = false

}

/* =========================================
   게시물 생성
========================================= */

export async function submitPost(fetcher: Function) {

  if (state.submitting)
    return

  state.submitting = true

  try {

    const data =
      await fetcher(state.draft)

    resetDraft()

    return data

  } catch (e) {

    console.error('post create error', e)

    throw e

  } finally {

    state.submitting = false

  }

}