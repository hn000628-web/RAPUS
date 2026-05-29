import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import type Database from 'better-sqlite3'

export const SYSTEM_TEST_ASSET_TYPE = 'SYSTEM_TEST_ASSET'
export const SYSTEM_TEST_ASSET_LEDGER_TYPE = 'SYSTEM_TEST_ASSET_GRANT'
export const SYSTEM_TEST_ASSET_AMOUNT = 100400000000
export const SYSTEM_TEST_ASSET_MEMO = '시스템 테스트용 상징 자산'
export const SYSTEM_TEST_ASSET_TARGET_EMAILS = [
  'hn0628@naver.com',
  'test11@naver.com',
  'test12@naver.com',
] as const

type SystemTestAssetTargetRow = {
  email: string
  userId: number
  profileId: number
  profileType: 'GENERAL' | 'BUSINESS'
  channelCode: string
}

type WalletRow = {
  walletId: string
  balance: number
}

type CountRow = {
  count: number
}

type WalletStatusRow = {
  email: string
  profileType: string
  channelCode: string
  walletId: string | null
  balance: number | null
  ledgerCount: number
  grantedAt: string | null
}

@Injectable()
export class WalletsService {
  private database: Database.Database

  constructor() {
    this.database =
    require('../../config/database').default
  }

  static forDatabase(database: Database.Database) {
    const service =
    Object.create(WalletsService.prototype) as WalletsService

    service.database = database

    return service
  }

  ensureSystemTestAssetGrantsForDefaultAccounts() {
    return this.ensureSystemTestAssetGrantsForEmails([
      ...SYSTEM_TEST_ASSET_TARGET_EMAILS,
    ])
  }

  ensureSystemTestAssetGrantsForEmails(emails: string[]) {
    const targetEmails = this.normalizeEmails(emails)

    if (targetEmails.length === 0) {
      return {
        success: true,
        assetType: SYSTEM_TEST_ASSET_TYPE,
        amount: SYSTEM_TEST_ASSET_AMOUNT,
        targetEmails,
        targetChannelCount: 0,
        createdWalletCount: 0,
        grantedCount: 0,
        skippedCount: 0,
        auditLogAvailable: this.hasTable('audit_logs'),
      }
    }

    const targets = this.findTargetProfiles(targetEmails)
    const auditLogAvailable = this.hasTable('audit_logs')

    let createdWalletCount = 0
    let grantedCount = 0
    let skippedCount = 0

    const grantTransaction = this.database.transaction(() => {
      for (const target of targets) {
        const walletResult = this.ensureWallet(target.channelCode)
        if (walletResult.created) {
          createdWalletCount += 1
        }

        if (this.hasSystemTestAssetGrant(target.channelCode)) {
          skippedCount += 1
          continue
        }

        const balanceAfter =
        Number(walletResult.wallet.balance) + SYSTEM_TEST_ASSET_AMOUNT

        this.database.prepare(`
          INSERT INTO wallet_ledger(
            ledgerId,
            walletId,
            channelCode,
            ledgerType,
            amount,
            balanceAfter,
            assetType,
            isSandbox,
            memo,
            createdAt
          )
          VALUES(?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
        `).run(
          randomUUID(),
          walletResult.wallet.walletId,
          target.channelCode,
          SYSTEM_TEST_ASSET_LEDGER_TYPE,
          SYSTEM_TEST_ASSET_AMOUNT,
          balanceAfter,
          SYSTEM_TEST_ASSET_TYPE,
          1,
          SYSTEM_TEST_ASSET_MEMO
        )

        this.database.prepare(`
          UPDATE wallets
          SET
            balance = ?,
            updatedAt = CURRENT_TIMESTAMP
          WHERE walletId = ?
            AND assetType = ?
        `).run(
          balanceAfter,
          walletResult.wallet.walletId,
          SYSTEM_TEST_ASSET_TYPE
        )

        walletResult.wallet.balance = balanceAfter
        grantedCount += 1
      }
    })

    grantTransaction()

    return {
      success: true,
      assetType: SYSTEM_TEST_ASSET_TYPE,
      ledgerType: SYSTEM_TEST_ASSET_LEDGER_TYPE,
      amount: SYSTEM_TEST_ASSET_AMOUNT,
      memo: SYSTEM_TEST_ASSET_MEMO,
      isSandbox: 1,
      targetEmails,
      targetChannelCount: targets.length,
      createdWalletCount,
      grantedCount,
      skippedCount,
      auditLogAvailable,
    }
  }

  getSystemTestAssetStatus() {
    const rows = this.database.prepare(`
      SELECT
        u.email AS email,
        p.profileType AS profileType,
        p.channelCode AS channelCode,
        w.walletId AS walletId,
        w.balance AS balance,
        COUNT(wl.id) AS ledgerCount,
        MAX(wl.createdAt) AS grantedAt
      FROM users u
      INNER JOIN profiles p
        ON p.userId = u.id
      LEFT JOIN wallets w
        ON w.channelCode = p.channelCode
        AND w.assetType = ?
      LEFT JOIN wallet_ledger wl
        ON wl.walletId = w.walletId
        AND wl.assetType = ?
        AND wl.ledgerType = ?
        AND wl.memo = ?
      WHERE u.email IN (
        'hn0628@naver.com',
        'test11@naver.com',
        'test12@naver.com'
      )
      GROUP BY
        u.email,
        p.profileType,
        p.channelCode,
        w.walletId,
        w.balance
      ORDER BY
        u.email,
        p.profileType
    `).all(
      SYSTEM_TEST_ASSET_TYPE,
      SYSTEM_TEST_ASSET_TYPE,
      SYSTEM_TEST_ASSET_LEDGER_TYPE,
      SYSTEM_TEST_ASSET_MEMO
    ) as WalletStatusRow[]

    return {
      assetType: SYSTEM_TEST_ASSET_TYPE,
      ledgerType: SYSTEM_TEST_ASSET_LEDGER_TYPE,
      amount: SYSTEM_TEST_ASSET_AMOUNT,
      memo: SYSTEM_TEST_ASSET_MEMO,
      rows,
    }
  }

  private normalizeEmails(emails: string[]) {
    return Array.from(
      new Set(
        emails
          .map((email) => String(email || '').trim().toLowerCase())
          .filter(Boolean)
      )
    )
  }

  private findTargetProfiles(emails: string[]) {
    const placeholders = emails.map(() => '?').join(',')

    return this.database.prepare(`
      SELECT
        u.email AS email,
        u.id AS userId,
        p.id AS profileId,
        p.profileType AS profileType,
        p.channelCode AS channelCode
      FROM users u
      INNER JOIN profiles p
        ON p.userId = u.id
      WHERE u.email IN (${placeholders})
        AND p.channelCode IS NOT NULL
      ORDER BY
        u.email,
        p.profileType
    `).all(...emails) as SystemTestAssetTargetRow[]
  }

  private ensureWallet(channelCode: string) {
    const existingWallet = this.database.prepare(`
      SELECT
        walletId,
        balance
      FROM wallets
      WHERE channelCode = ?
        AND assetType = ?
      LIMIT 1
    `).get(
      channelCode,
      SYSTEM_TEST_ASSET_TYPE
    ) as WalletRow | undefined

    if (existingWallet) {
      return {
        wallet: existingWallet,
        created: false,
      }
    }

    const walletId = randomUUID()

    this.database.prepare(`
      INSERT INTO wallets(
        walletId,
        channelCode,
        balance,
        assetType,
        status,
        createdAt,
        updatedAt
      )
      VALUES(?,?,?,?, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      walletId,
      channelCode,
      0,
      SYSTEM_TEST_ASSET_TYPE
    )

    return {
      wallet: {
        walletId,
        balance: 0,
      },
      created: true,
    }
  }

  private hasSystemTestAssetGrant(channelCode: string) {
    const row = this.database.prepare(`
      SELECT COUNT(*) AS count
      FROM wallet_ledger
      WHERE channelCode = ?
        AND assetType = ?
        AND ledgerType = ?
        AND memo = ?
    `).get(
      channelCode,
      SYSTEM_TEST_ASSET_TYPE,
      SYSTEM_TEST_ASSET_LEDGER_TYPE,
      SYSTEM_TEST_ASSET_MEMO
    ) as CountRow

    return row.count > 0
  }

  private hasTable(tableName: string) {
    const row = this.database.prepare(`
      SELECT COUNT(*) AS count
      FROM sqlite_master
      WHERE type = 'table'
        AND name = ?
    `).get(tableName) as CountRow

    return row.count > 0
  }
}
