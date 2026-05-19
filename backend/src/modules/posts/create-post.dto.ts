// FILE : backend/src/modules/posts/dto/create-post.dto.ts
// ROOT : backend/src/modules/posts/dto/create-post.dto.ts
// STATUS : CREATE MODE / DTO MINIMUM SAFE
// ROLE : CREATE POST DTO

// SECTION 01 : TYPE

export type PostVisibility =
  | 'PUBLIC'
  | 'FOLLOWERS'
  | 'PRIVATE'

// SECTION 02 : DTO

export class CreatePostDto {
  content!: string

  visibility?: PostVisibility

  categoryCode?: string

  imageAssetIds?: number[]

  latitude?: number | null

  longitude?: number | null
}