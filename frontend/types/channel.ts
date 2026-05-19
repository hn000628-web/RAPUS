// FILE : frontend/types/channel.ts
// ROLE : CHANNEL STATE TYPE (BUSINESS / GENERAL 공용)

export type ChannelState = {

  channelCode: string | null
  channelId: string | null

  // URL (slug)
  channelURL?: string

  // 표시용
  channelName?: string
  displayName?: string

}