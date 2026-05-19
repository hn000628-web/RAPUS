// FILE: backend/src/utils/channel-profile-util.ts
// ROOT: backend/src/utils/channel-profile-util.ts
// STATUS: PRODUCTION READY
// ROLE: CHANNEL PROFILE UTIL (AUTOMATIC CHANNELCODE)
// CHANGE SUMMARY:
// - saveSingleRow ON CONFLICT 시 channelCode immutable 규칙 반영
// - profileId + channelCode 기준 CRUD 전용
// - public getChannelCode(profileId) 추가

import Database from 'better-sqlite3'
import { BadRequestException } from '@nestjs/common'

export class ChannelProfileUtil {
  private readonly db: Database.Database

  constructor(dbPath = 'data/prod.sqlite') {
    this.db = new Database(dbPath)
  }

  /* ==================================================
  SECTION 00 : PROFILE KEY RESOLVER (PRIVATE)
  ================================================== */
  private resolveProfileKeys(profileId?: number, channelCode?: string) {
    if (!profileId) return undefined
    if (!channelCode) {
      const profile = this.db.prepare(
        `SELECT id, channelCode FROM profiles WHERE id = ? LIMIT 1`
      ).get(profileId)
      if (!profile?.channelCode) {
        throw new BadRequestException('channelCode required when profileId exists')
      }
      return profile.channelCode
    }
    return channelCode
  }

  /* ==================================================
  SECTION 00-1 : PUBLIC CHANNELCODE ACCESS
  - 외부에서 profileId로 channelCode 조회 가능
  ================================================== */
  public getChannelCode(profileId: number) {
    return this.resolveProfileKeys(profileId)
  }

  /* ==================================================
  SECTION 01 : SINGLE ROW 조회
  ================================================== */
  getSingleRow(table: string, profileId?: number, channelCode?: string) {
    channelCode = this.resolveProfileKeys(profileId, channelCode)
    const queryParts: string[] = []
    const params: any[] = []

    if (profileId) { queryParts.push('profileId = ?'); params.push(profileId) }
    if (channelCode) { queryParts.push('channelCode = ?'); params.push(channelCode) }

    const sql = `SELECT * FROM ${table}${queryParts.length ? ' WHERE ' + queryParts.join(' AND ') : ''} LIMIT 1`
    return this.db.prepare(sql).get(...params)
  }

  /* ==================================================
  SECTION 02 : MULTIPLE ROWS 조회
  ================================================== */
  getMultipleRows(table: string, profileId?: number, channelCode?: string) {
    channelCode = this.resolveProfileKeys(profileId, channelCode)
    const queryParts: string[] = []
    const params: any[] = []

    if (profileId) { queryParts.push('profileId = ?'); params.push(profileId) }
    if (channelCode) { queryParts.push('channelCode = ?'); params.push(channelCode) }

    const sql = `SELECT * FROM ${table}${queryParts.length ? ' WHERE ' + queryParts.join(' AND ') : ''} ORDER BY id ASC`
    return this.db.prepare(sql).all(...params)
  }

  /* ==================================================
  SECTION 03 : SAVE SINGLE ROW
  - profileId만 있어도 자동으로 channelCode 채워서 저장
  - channelCode immutable 규칙 반영
  ================================================== */
  saveSingleRow(table: string, data: Record<string, any>) {
    const profileId = data.profileId
    data.channelCode = this.resolveProfileKeys(profileId, data.channelCode)

    const columns = Object.keys(data)
    const placeholders = columns.map(() => '?').join(',')
    const values = Object.values(data)

    const sql = `
      INSERT INTO ${table} (${columns.join(',')})
      VALUES (${placeholders})
      ON CONFLICT(profileId, channelCode)
      DO UPDATE SET ${columns.filter(col => col !== 'channelCode').map(col => `${col}=excluded.${col}`).join(',')}
    `
    this.db.prepare(sql).run(...values)
  }

  /* ==================================================
  SECTION 04 : DELETE SINGLE ROW
  ================================================== */
  deleteSingleRow(table: string, profileId?: number, channelCode?: string) {
    channelCode = this.resolveProfileKeys(profileId, channelCode)
    const queryParts: string[] = []
    const params: any[] = []

    if (profileId) { queryParts.push('profileId = ?'); params.push(profileId) }
    if (channelCode) { queryParts.push('channelCode = ?'); params.push(channelCode) }

    const sql = `DELETE FROM ${table} WHERE ${queryParts.join(' AND ')}`
    this.db.prepare(sql).run(...params)
  }
}