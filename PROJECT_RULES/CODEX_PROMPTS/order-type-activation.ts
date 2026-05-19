// FILE: codex-prompts/order-type-activation.ts
// ROOT: PROJECT_RULES/CODEX_PROMPTS/order-type-activation.ts
// STATUS: CREATE MODE
// ROLE: CODEX WORK ORDER PROMPT
// CHANGE SUMMARY: 주문 유형 페이지 활성화 / UI + API + DB 영향 분해

/* ==================================================
SECTION 00 : 작업 개요
================================================== */

const TASK_OVERVIEW = `
주문 유형 설정 페이지를 활성화하고, 
사용자가 설정한 주문 유형이 POS 메인에 반영되도록 구현
UI / Backend / API / DB 영향 범위 모두 고려
`;

/* ==================================================
SECTION 01 : UI 요구사항
================================================== */

const UI_REQUIREMENTS = `
- /pos/settings 화면의 '주문 유형 설정' 카드 클릭 시 관리 페이지 진입
- 주문 유형 토글 UI 제공
- 활성/비활성 상태 즉시 표시
- 저장 버튼 클릭 시 서버 반영
- POS 메인 메뉴에 활성 상태 기반 반영
`;

/* ==================================================
SECTION 02 : 데이터/DB 요구사항
================================================== */

const DB_REQUIREMENTS = `
- orders 테이블, payments 테이블 등 다자 관계 구조 확인
- 단일 귀속 검증: channelCode + profileId
- DB 구조 변경 금지 (ADD only 필요 시 명시)
- FK, INDEX, UNIQUE 규칙 준수
`;

/* ==================================================
SECTION 03 : API / Service 요구사항
================================================== */

const API_SERVICE_REQUIREMENTS = `
- GET /api/business/settings/order-types : 주문 유형 조회
- PATCH /api/business/settings/order-types : 주문 유형 상태 저장
- Service 레이어에서 channelCode + profileId 기반 검증 수행
- Controller는 Service 호출만 수행, DB 직접 접근 금지
`;

/* ==================================================
SECTION 04 : Codex 작업 지시
================================================== */

const CODEX_TASK_INSTRUCTIONS = `
1. 기존 파일 구조 확인
2. UI 요구사항과 API / DB 영향 분리
3. PATCH/GET API 호출 흐름 반영
4. 단일 귀속 구조 검증 (channelCode + profileId)
5. 최소 SECTION 단위 코드 출력
6. JSX multi-line, indent 유지
7. Codex 완료보고서용 출력 포함
`;

/* ==================================================
SECTION 05 : 금지 사항
================================================== */

const PROHIBITIONS = `
- DB 직접 DROP / RESET 금지
- Frontend에서 Service bypass 금지
- ownerChannelCode 사용 금지 (단일 귀속 테이블)
- 임의 생성 / 추정 / 하드코딩 금지
- Codex OUTPUT은 반드시 코드 블록 형태
`;

/* ==================================================
SECTION 06 : 검증 기준
================================================== */

const VALIDATION_CRITERIA = `
- order-types 페이지 진입 / 토글 UI 확인
- 저장 후 POS 메인 메뉴 반영
- channelCode + profileId 검증 통과
- JSX / TSX multi-line 유지
- SECTION 단위 출력 준수
`;

/* ==================================================
SECTION 07 : 최종 Codex 프롬프트
================================================== */

export const ORDER_TYPE_ACTIVATION_PROMPT = {
  TASK_OVERVIEW,
  UI_REQUIREMENTS,
  DB_REQUIREMENTS,
  API_SERVICE_REQUIREMENTS,
  CODEX_TASK_INSTRUCTIONS,
  PROHIBITIONS,
  VALIDATION_CRITERIA
};
