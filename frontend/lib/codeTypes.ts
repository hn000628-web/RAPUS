export type ChannelCode13 = string
export type BusinessObjectCode12 = string

export function normalizeCodeInput(value: string): string {
  return value.trim().toUpperCase()
}
