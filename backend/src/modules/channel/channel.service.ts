/* ==================================================
SECTION CODE OUTPUT : CHANNEL SERVICE
ROOT : backend/src/modules/channel/channel.service.ts
STATUS : DB UNIQUE CHECK + CHANNEL CODE MANAGEMENT
================================================== */
import { Injectable, BadRequestException } from '@nestjs/common';
import db from '../../config/database';

@Injectable()
export class ChannelService {

  generateRandomCode(length = 13): string {
    const prefixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefixChars.charAt(Math.floor(Math.random() * prefixChars.length));
    for (let i = 1; i < length; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  }

  async createChannel(profileId: number, channelName?: string) {
    if (!profileId) throw new BadRequestException('ProfileId required');

    let channelCode = '';
    let exists = true;
    while (exists) {
      channelCode = this.generateRandomCode();
      const row = db.prepare('SELECT id FROM profiles WHERE channelCode=?').get(channelCode);
      if (!row) exists = false;
    }

    const stmt = db.prepare(`
      UPDATE profiles
      SET channelName = ?,
          channelCode = ?,
          channelURL = 'https://xxx.com/@' || ?
      WHERE id = ?
      RETURNING id, channelName, channelCode, channelURL
    `);
    const updated = stmt.get(channelName || channelCode, channelCode, channelCode, profileId);
    if (!updated) throw new BadRequestException('Profile not found or update failed');

    return { ok: true, channelCode: updated.channelCode, channelURL: updated.channelURL };
  }

}
