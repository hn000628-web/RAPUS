export type BizType =
  | 'GENERAL'
  | 'REAL_ESTATE'
  | 'AUTO';

/*
  FUTURE BIZ TYPES (확장 예정)

  | 'RESTAURANT'
  | 'CAFE'
  | 'BEAUTY'
  | 'HOSPITAL'
  | 'EDUCATION'
*/

export type ProfileBlock = {
  id: number;

  type: 'TEXT' | 'LINK';

  /*
    FUTURE BLOCK TYPES (확장 예정)

    | 'MENU'      // 매장 메뉴
    | 'MAP'       // 지도 위치
    | 'HOURS'     // 영업시간
    | 'GALLERY'   // 사진 갤러리
    | 'CONTACT'   // 연락처
  */

  title: string;

  content?: string;
  url?: string;
  description?: string;

  sortOrder?: number;
};