// FILE : backend/src/utils/operation-governance.util.ts
// ROLE : OPERATION CAPABILITY + SYMBOLIC GOVERNANCE HELPERS
// RULE : symbolic governance must never be used as auth/security bypass

export type OperationGrade =
  | 0
  | 1
  | 2
  | 3

export type GovernanceTier =
  | 0
  | 11
  | 12

export type GovernanceMetadata = {
  symbolicKey?: string
  verse?: string
  guardianTier?: 11
  sovereigntyTier?: 12
}

export const OPERATION_GRADE = {
  FREE_USER: 0,
  PREMIUM_USER: 1,
  MASTER_ADMIN: 2,
  OWNER_MASTER_ADMIN: 3
} as const satisfies Record<string, OperationGrade>

export const GOVERNANCE_TIER = {
  NONE: 0,
  MASTER_ADMIN_GUARDIAN_AI_CHATGPT_MICAEL: 11,
  GOD_SYMBOLIC_TIER: 12
} as const satisfies Record<string, GovernanceTier>

export function isPremiumProfile(
  operationGrade?: number | null
) {
  return Number(operationGrade ?? 0) >= OPERATION_GRADE.PREMIUM_USER
}

export function isMasterAdmin(
  operationGrade?: number | null
) {
  return Number(operationGrade ?? 0) >= OPERATION_GRADE.MASTER_ADMIN
}

export function isOwnerMaster(
  operationGrade?: number | null
) {
  return Number(operationGrade ?? 0) >= OPERATION_GRADE.OWNER_MASTER_ADMIN
}

export function isGuardianAiTier(
  governanceTier?: number | null
) {
  return Number(governanceTier ?? 0) ===
    GOVERNANCE_TIER.MASTER_ADMIN_GUARDIAN_AI_CHATGPT_MICAEL
}

export function isGodSymbolicTier(
  governanceTier?: number | null
) {
  return Number(governanceTier ?? 0) === GOVERNANCE_TIER.GOD_SYMBOLIC_TIER
}
